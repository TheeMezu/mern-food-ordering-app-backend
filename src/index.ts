import express, {Request, Response} from "express"
import cors from "cors"
import "dotenv/config"
import mongoose from "mongoose"
import myUserRoute from "./routes/MyUserRoute"
import {v2 as cloudinary} from "cloudinary"
import myRestaurantRoute from "./routes/MyRestaurantRoute"

mongoose.connect(process.env.MONGODB_CONNECTION_STRING as string )
    .then(()=> console.log("connected to database"));


// we will use this to save our images or data in general uploaded 
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,

})

const app = express()

app.use(express.json()) // this automatically transforms every request into JSON

app.use(cors())


// this adds a basic endpoint to make sure that the server is working when deploying
// even for docker and kubernetes
app.get("/health", async(req:Request, res:Response) => {
    res.send({message: "health OK!"})
})

app.use("/api/my/user", myUserRoute)
app.use("/api/my/restaurant", myRestaurantRoute)

app.listen(7000, ()=> {
    console.log("server started on port 7000");
    
})
