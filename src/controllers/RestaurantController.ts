import { Request, Response } from "express";
import Restaurant from "../models/restaurant";

// when something is required we put it in the path but when it is optional
// we put it in as query parameter

// even when the cuisines are an array, when passed down in the search query
// they are sent in the search query one by one seperated by a comma

// for sorting we can pass down a sortOption but if there isnt any we
// can use lastUpdated as the default sorting option

// we can use an any type for a query and the reason for that is it can be
// very complicated to do a type for it as it may require multiple types
const searchRestaurant = async (req: Request, res: Response) => {
  try {
    const city = req.params.city; //london

    const searchQuery = (req.query.searchQuery as string) || ""; // restaurantName
    const selectedCuisines = (req.query.selectedCuisines as string) || "" // italian
    const sortOption = (req.query.sortOption as string) || "lastUpdated";
    const page = parseInt(req.query.page as string) || 1;

    let query: any = {};

    // create a case-insensitive it can accept london as London, i is ignore
    query["city"] = new RegExp(city, "i");

    // here we count how many restaurants have this city in it
    const cityCheck = await Restaurant.countDocuments(query);

    if (cityCheck === 0) {
      // we pass an array as the frontend expects an array
      return res.status(404).json({
        data: [],
        pagination: {
            total: 0,
            page: 1,
            pages: 1,
        }
      });
    }

    // url selectedCuisines=italian,burgers,chinse
    if (selectedCuisines) {
      const cuisinesArray = selectedCuisines
        .split(",") //[italian,burgers,chinese]
        .map((cuisine) => new RegExp(cuisine, "i")); // thus we can use map

        // saves all the data from cuisinesArray into cuisines which then used 
        // in mongoDb to check all the restaurants that has the exact cuisines
      query["cuisines"] = { $all: cuisinesArray };
    }

    // this basically turn the searchQuery into case insensitive, then it
    // queries for either having the same restaurant name or having the
    // same cuisine and we used $in cuz we are looking for any match and not all
    if (searchQuery) {
      const searchRegex = new RegExp(searchQuery, "i");
      query["$or"] = [
        { restaurantName: searchRegex },
        { cuisines: { $in: [searchRegex] } },
      ];
    }

    const pageSize = 10;
    const skip = (page - 1) * pageSize;

    const restaurants = await Restaurant.find(query)
      .sort({ [sortOption]: 1 })
      .skip(skip)
      .limit(pageSize)
      .lean(); // this strips away all mongoose data and only gives js object

    // gives total number of restaurants
    const total = await Restaurant.countDocuments(query); 

    const response = {
        data:restaurants,
        pagination: {
            total,
            page,
            pages: Math.ceil(total / pageSize)
        }
    }

    res.json(response) // to change object into json 

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};


export default {
    searchRestaurant
}


// data fetched from mongoDb are already in json so we simply res.send 
// objects and arrays we need to use res.json 