import { auth } from "express-oauth2-jwt-bearer";
import {Request, Response, NextFunction} from "express"
import jwt from "jsonwebtoken"
import User from "../models/user";

declare global {
  namespace Express {
    interface Request {
      userId: string;
      auth0Id: string;
    }
  }
}

export const jwtCheck = auth({
    audience: process.env.AUTH0_AUDIENCE,
    issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
    tokenSigningAlg: 'RS256'
  });


// here basically it uses auth0Id to find the user logged in and then 
// it saves mongoDb _id to know the user 
export const jwtParse = async(req:Request, res:Response, next: NextFunction) => {
  const {authorization} = req.headers

  if(!authorization || !authorization.startsWith("Bearer ")){
    return res.sendStatus(401)
  }

  const token = authorization.split(" ")[1]
  try{
    const decoded = jwt.decode(token) as jwt.JwtPayload
    const auth0Id = decoded.sub // sub is auth0Id 
    const user = await User.findOne({ auth0Id})

    if(!user){
      return res.sendStatus(401)
    }

    req.auth0Id = auth0Id as string;
    req.userId = user._id.toString()
    next()
  }
  catch(error){
    return res.sendStatus(401)
  }
}


// what happens is when we log in using Auth0 in the front end we return back 
// after login where we then have a user that we can extract from Auth0, after 
// we successfuly log in we can save the user Auth0 id and email in our 
// backend by calling create user api and we can attach the token recieved from 
// Auth0 after logging in and we can attach it to the header in Authorization 
// parameter, after getting the header parameter we can save Auth0 Id that we
// recieved and use it to find the user that has the same Auth0 Id by that we 
// linked our database with our Auth0 and we can save it in the request.
// we save it in the request so we can attach it as a middleware to our routes,
// which then will give us access to them whenever we use the route which is 
// always and we can also use it as an authentication which will guarentee us 
// that the person on it is the correct user 