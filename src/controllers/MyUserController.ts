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
        res.status(500).json({message: "Error creating user"})
    }
}


// when we create a new user we already did a relation to link both userId and 
// authId so now whenever we create a new user using auth0 we automatically 
// habe authId but then we need to look for the newly created user in our 
// database which is why we use auth0id since it is linked already and 
// then we can simply use userId to do the necessary updates 


// user logIn for the first time the systems checks if this user already exists in 
// our database by using his authId and run it in the database, if we couldnt find
// the user it means its a new user, by that time jwtparse wont be called as the
// user hasnt logged in yet, after that a new user is created when a new user
// is created we link authId and userId together so that we can have a way 
// to look for users in our database when logged in to make sure its his/her only
// account 
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
        res.status(500).json({message: "Error creating user"})
    }
}

// instead of using mongoDb userId which is _id we can use auth0Id to search 
// for the user as we already had it in our user schema, we can get it from 
// access token 

// and this works since in the jwtparse we linked both the authId and userId 
// from the statrt which means now we can use userId to find our Id since it 
// is automatically linked with one another and we dont need to still look for it

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

        res.send(user) // already json 
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