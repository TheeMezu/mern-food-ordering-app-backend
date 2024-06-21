import { Request, Response } from "express";
import Restaurant from "../models/restaurant";
import cloudinary from "cloudinary";
import mongoose from "mongoose";
import Order from "../models/order";

// here the first thing we do we check if a restaurant exists to a user as
// we made that only one restaurant per user
// then we check if not we get the file data and we transform it to a base64
// using a buffer then we code it in a certain way so that cloudinary would
// accept it then based on it we create our restaurant using data from
// the req body but data about lastUpdated and userId is not passed on from
// the form table thus we need to manually assign its value

// then we check it with postman but to check it we need to use formdata in
// the body field as the data contains an image, using json wont work
const createMyRestaurant = async (req: Request, res: Response) => {
  try {
    const existingRestaurant = await Restaurant.findOne({ user: req.userId });
    if (existingRestaurant) {
      return res
        .status(409)
        .json({ message: "User restaurant already exists" });
    }

    const imageUrl = await uploadImage(req.file as Express.Multer.File) 

    const restaurant = new Restaurant(req.body);
    restaurant.imageUrl = imageUrl;
    restaurant.user = new mongoose.Types.ObjectId(req.userId);
    restaurant.lastUpdated = new Date();
    await restaurant.save();

    // we use send as we are recieving formData and not a json which then 
    // express will detect that and will place the appropiate header
    res.status(201).send(restaurant); 
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

const updateMyRestaurant = async(req:Request, res:Response) => {
  try{
    const restaurant = await Restaurant.findOne({
      user: req.userId
    })

    if(!restaurant){
      return res.status(404).json({message: "Restaurant not found"})
    }

    restaurant.restaurantName = req.body.restaurantName;
    restaurant.city = req.body.city;
    restaurant.country = req.body.country;
    restaurant.deliveryPrice = req.body.deliveryPrice;
    restaurant.estimateDeliveryTime = req.body.estimateDeliveryTime;
    restaurant.cuisines = req.body.cuisines;
    restaurant.menuItems = req.body.menuItems;
    restaurant.lastUpdated = new Date();

    if(req.file){
      const imageUrl = await uploadImage(req.file as Express.Multer.File) 
      restaurant.imageUrl = imageUrl
    }

    await restaurant.save()
    res.status(200).send(restaurant)

  }catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error updating restaurant" });
  }
}

// we use the logged in user who has a restaurant, then we can use the restaurant id 
// to check if there are orders for it and if yes we can populate to find all 
// the details about the person who ordered
const getMyRestaurantOrders = async (req: Request, res: Response) => {
  try {
    const restaurant = await Restaurant.findOne({ user: req.userId });
    if (!restaurant) {
      return res.status(404).json({ message: "restaurant not found" });
    }

    const orders = await Order.find({ restaurant: restaurant._id })
      .populate("restaurant")
      .populate("user");

    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "something went wrong" });
  }
};


const getMyRestaurant = async (req: Request, res: Response) => {
  try{
    const restaurant = await Restaurant.findOne({user: req.userId})

    if(!restaurant){
      return res.status(404).json({message: "restaurant not found"})
    }

    res.json(restaurant)
  }catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error fetching restaurant" });
  }
}


const updateOrderStatus = async (req: Request, res: Response) => {
    try {
      const { orderId } = req.params;
      const { status } = req.body;

      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ message: "order not found" });
      }

      // here we are getting a restaurant id due to refer in restaurant model 
      const restaurant = await Restaurant.findById(order.restaurant);

      // here we are checking ig the logged in user is the creator of the 
      // restaurant 
      if (restaurant?.user?._id.toString() !== req.userId) {
        return res.status(401).send();
      }

      order.status = status;
      await order.save();

      res.status(200).json(order);
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "unable to update order status" });
    }
};

const uploadImage = async(file: Express.Multer.File) => {
    const image = file
    const base64Image = Buffer.from(image.buffer).toString("base64");
    const dataURI = `data:${image.mimetype};base64,${base64Image}`;

    const uploadResponse = await cloudinary.v2.uploader.upload(dataURI);

    return uploadResponse.url
}

export default {
  createMyRestaurant,
  getMyRestaurant,
  updateMyRestaurant,
  getMyRestaurantOrders,
  updateOrderStatus
};


// when we create we simply say const restaurant = new Restaurant(req.body);
// but when we update it is better than we specify what to update to ensure 
// fields like user.Id doesnt change by mistake 