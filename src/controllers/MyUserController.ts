import {Request, Response} from "express"
import User from "../models/user";


// we can access req.userId because it is in the auth middleware in the routes 
const getCurrentUser = async(req: Request, res:Response) => {
    try{
        const currentUser = await User.findOne({ _id: req.userId })

        if(!currentUser){
            return res.status(404).json({message: "User not found"})
        }

        res.json(currentUser)
    }
    catch(error){
        console.log(error);
        res.status(500).json({messgae: "Error creating user"})
    }
}

const createCurrentUser = async(req: Request, res:Response) => {
    try{
        const {auth0Id} = req.body;
        const exisitngUser = await User.findOne({auth0Id})

        if(exisitngUser){ // if user exists return everything is okay
            return res.status(200).send()
        }

        const newUser = new User(req.body)
        await newUser.save()

        res.status(201).json(newUser.toObject())
    }
    catch(error){
        console.log(error);
        res.status(500).json({messgae: "Error creating user"})
    }
}

// instead of using mongoDb userId which is _id we can use auth0Id to search 
// for the user as we already had it in our user schema, we can get it from 
// access token 
const updateCurrentUser = async(req: Request, res:Response) => {
    try{
        const {name, addressLine1, country, city} = req.body
        const user = await User.findById(req.userId) 
        // we need to create a type when we need to add it to a req

        if(!user){
            return res.status(404).json({message: "User not found"})
        }

        user.name = name;
        user.addressLine1 = addressLine1
        user.city = city 
        user.country = country 
        await user.save()

        res.send(user)
    }
    catch(error){
        console.log(error);
        res.status(500).json({message: "Error updating user"})
    }
}


export default {
    getCurrentUser,
    createCurrentUser,
    updateCurrentUser,
}