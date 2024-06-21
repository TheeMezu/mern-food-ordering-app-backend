import mongoose, { InferSchemaType } from "mongoose";

// we explicity need to do this for menuItems because it is not exposed as a model 
// as it is embedded inside the restaurant but if we need to use it outside 
// we have to ensure that we have a type explicit for it to be exposed as a model
// we added an id to make sure we have a reference whenever we use a type 
// we added a default id to have the same behavoir of mongoose adding the id
// otherwise it would expect an id whenever we create a menuItem 
const menuItemSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        default: () => new mongoose.Types.ObjectId(),
    },
    name: { type: String, required: true },
    price: { type: Number, required: true },
});

export type MenuItemType = InferSchemaType<typeof menuItemSchema>;

const restaurantSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    restaurantName: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    country: {
        type: String,
        required: true
    },
    deliveryPrice: {
        type: Number,
        required: true
    },
    estimateDeliveryTime: {
        type: Number,
        required: true
    },
    cuisines: [{
        type: String,
        required: true
    }],
    menuItems: [menuItemSchema],
    imageUrl: {
        type: String,
        required: true
    },
    lastUpdated: {
        type: Date,
        required: true
    }
})

const Restaurant = mongoose.model("Restaurant", restaurantSchema)
export default Restaurant