import express, {Request, Response} from "express"
import cors from "cors"
import "dotenv/config"
import mongoose from "mongoose"
import myUserRoute from "./routes/MyUserRoute"
mongoose.connect(process.env.MONGODB_CONNECTION_STRING as string )
    .then(()=> console.log("connected to database"));

const app = express()

app.use(express.json()) // this automatically transforms every request into JSON

app.use(cors())


// this adds a basic endpoint to make sure that the server is working 
// even for docker and kubernetes
app.get("/health", async(req:Request, res:Response) => {
    res.send({message: "health OK!"})
})

app.use("/api/my/user", myUserRoute)

app.listen(7000, ()=> {
    console.log("server started on port 7000");
    
})
