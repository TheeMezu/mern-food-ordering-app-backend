import Stripe from "stripe";
import { Request, Response } from "express";
import Restaurant, { MenuItemType } from "../models/restaurant";
import Order from "../models/order";

const STRIPE = new Stripe(process.env.STRIPE_API_KEY as string);
const FRONTEND_URL = process.env.FRONTEND_URL as string;
// to make sure that the event is done by stripe
const STRIPE_ENDPOINT_SECRET = process.env.STRIPE_WEBHOOK_SECRET as string;

const getMyOrders = async (req: Request, res: Response) => {
    try {
        const orders = await Order.find({ user: req.userId })
            .populate("restaurant")
            .populate("user");
    
        res.json(orders);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "something went wrong" });
    }
};

type CheckoutSessionRequest = {
    cartItems: 
    {
        menuItemId: string;
        name: string;
        quantity: string;
    }[]; // means array of objects

    deliveryDetails: 
    {
        email: string;
        name: string;
        addressLine1: string;
        city: string;
    };
    restaurantId: string;
};

// to simulate an event from stripe we can trigger a completion message 
// to send an event to our following api handlers which will allow us to 
// handle the event

// what happens here we need to construct an event that contains the 
// req.body, sig and our secret endpoint. this allows us to get details 
// about the event(payment) and get the data we need to update the 
// orderstatus to be paid and also save the total amount paid back to 
// our database which will then update our entire database after 
// successfuly. stripe will send us multiple events but we are only interested 
// in the payment completed event 
// we need to return early in the cath block to make sure that the rest of 
// the code doesnt run
const stripeWebhookHandler = async (req: Request, res: Response) => {
    let event;

    try {
        const sig = req.headers["stripe-signature"];
        event = STRIPE.webhooks.constructEvent(
            req.body,
            sig as string,
            STRIPE_ENDPOINT_SECRET
        );
    } catch (error: any) {
        console.log(error);
        return res.status(400).send(`Webhook error: ${error.message}`);
    }
    
    if (event.type === "checkout.session.completed") {
        const order = await Order.findById(event.data.object.metadata?.orderId);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        order.totalAmount = event.data.object.amount_total;
        order.status = "paid";
        await order.save();
    }
    res.status(200).send();
};

const createCheckoutSession = async (req: Request, res: Response) => {
    try {
        const checkoutSessionRequest: CheckoutSessionRequest = req.body;

        const restaurant = await Restaurant.findById(
            checkoutSessionRequest.restaurantId
        );

        if (!restaurant) {
        throw new Error("Restaurant not found");
        }

        // create the order and fill the required data 
        const newOrder = new Order({
            restaurant: restaurant,
            user: req.userId,
            status: "placed",
            deliveryDetails: checkoutSessionRequest.deliveryDetails,
            cartItems: checkoutSessionRequest.cartItems,
            createdAt: new Date(),
        });

        // creating the line data but now we need to send it to stripe
        const lineItems = createLineItems(
            checkoutSessionRequest,
            restaurant.menuItems
        );

        // we save the order id to stripe so we can retrieve it
        const session = await createSession(
            lineItems,
            newOrder._id.toString(),
            restaurant.deliveryPrice,
            restaurant._id.toString()
        );

        if(!session.url){
            return res.status(500).json({ message: "Error creating stripe session" });
        }

        // we save it here so we are sure that a session was made first 
        // and we a have a valid url and only then we save the order in our server
        await newOrder.save();
        res.json({ url: session.url})

    } catch (error: any) {
        console.log(error);
        res.status(500).json({ message: error.raw.message }); // this is from stripe
    }
};

const createLineItems = (
    checkoutSessionRequest: CheckoutSessionRequest,
    menuItems: MenuItemType[]
    ) => {
    const lineItems = checkoutSessionRequest.cartItems.map((cartItem) => {
        const menuItem = menuItems.find(
            (item) => item._id.toString() === cartItem.menuItemId.toString()
        );

        if (!menuItem) {
            throw new Error(`Menu item not found: ${cartItem.menuItemId}`);
        }

        const line_item: Stripe.Checkout.SessionCreateParams.LineItem = {
        price_data: {
            currency: "gbp",
            unit_amount: menuItem.price,
            product_data: {
            name: menuItem.name,
            },
        },
        quantity: parseInt(cartItem.quantity),
        };

        return line_item;
    });

    return lineItems;
};

// this is how to create a session using stripe 
const createSession = async (
    lineItems: Stripe.Checkout.SessionCreateParams.LineItem[],
    orderId: string,
    deliveryPrice: number,
    restaurantId: string
  ) => {
    const sessionData = await STRIPE.checkout.sessions.create({
        line_items: lineItems,
        shipping_options: [
            {
                shipping_rate_data: {
                    display_name: "Delivery",
                    type: "fixed_amount",
                    fixed_amount: {
                    amount: deliveryPrice,
                    currency: "gbp",
                    },
                },
            },
        ],
        mode: "payment",
        metadata: {
            orderId,
            restaurantId,
        },
        success_url: `${FRONTEND_URL}/order-status?success=true`,
        cancel_url: `${FRONTEND_URL}/detail/${restaurantId}?cancelled=true`,
    });

    return sessionData;
};

export default {
    getMyOrders,
    createCheckoutSession,
    stripeWebhookHandler,
};

// line items are the ones that show on the left side that contain menu items
// and their price and all

// the reason why we pass the menuItem from the frontend is to get the price as 
// checkoutSessionRequest doesnt contain any price, and the reason why we dont 
// simply send the price is that our api is open and anyone could use postman 
// for example to make a request and add their own prices to the api so that 
// guarantees safety 


// the flow is that we get CheckoutSessionRequest which has 3 informations 
// 1.the cartItem and 2.deliveryDetails 3.restaurantId. when we want to use 
// stripe we need certain informations, ie price, quantity, item name. as explained
// cartItem contains name and quantity, but menuItem contains name and price 
// so to get the price, we map over all cartItems, we check item id with 
// menuItem id and by that we can get the price. then we have access to all the 
// data needed to pass it to stripe line to create checkout whcih we do 


// NOTE:: to run stripe cli along with nodemon we installed concurrently
// and changed in the package.json