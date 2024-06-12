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


// this allows us to check for the token with every route without me needing to 
// do all logic, as we send the authorization header with the token
// as it connects to auth0 server behind the scenes 