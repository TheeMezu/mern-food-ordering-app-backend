import { Request, Response } from "express";
import Restaurant from "../models/restaurant";
import cloudinary from "cloudinary";
import mongoose from "mongoose";

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
  updateMyRestaurant
};


// when we create we simply say const restaurant = new Restaurant(req.body);
// but when we update it is better than we specify what to update to ensure 
// fields like user.Id doesnt change by mistake 