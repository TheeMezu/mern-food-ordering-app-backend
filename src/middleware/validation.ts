import { body, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";

const handeValidationError = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

export const validateMyUserRequest = [
  body("name")
    .isString()
    .notEmpty()
    .trim()
    .withMessage("Name must be a string"),
  body("addressLine1")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("AddressLine1 must be a string"),
  body("city")
    .isString()
    .notEmpty()
    .trim()
    .withMessage("City must be a string"),
  body("country")
    .isString()
    .notEmpty()
    .trim()
    .withMessage("Country must be a string"),
  handeValidationError,
];

export const validateMyRestaurantRequest = [
  body("restaurantName")
    .trim()
    .notEmpty()
    .withMessage("Restaurant name is required"),
  body("city").notEmpty().trim().withMessage("City is required"),
  body("country").notEmpty().trim().withMessage("Country is required"),
  body("deliveryPrice")
    .trim()
    .isFloat({ min: 0 })
    .withMessage("Delivery price must be a positive number"),
  body("estimateDeliveryTime")
    .trim()
    .isInt({ min: 0 })
    .withMessage("Estimated delivery time must be a positive integar"),
  body("cuisines")
    .isArray()
    .withMessage("Cuisines must be an array")
    .not()
    .isEmpty()
    .withMessage("Cuisines array cannot be empty"),
  body("menuItems").isArray().withMessage("Menu items must be an array"),
  body("menuItems.*.name")
    .notEmpty()
    .trim()
    .withMessage("Menu item name is required"),
  body("menuItems.*.price")
    .trim()
    .isFloat({ min: 0 })
    .withMessage("Menu item price is required and must be a postive number"),
  handeValidationError,
];

// so basically whenever there is a validation error it is sent back to
// handeValidationError which uses validationResult from express-validator
// which collects all the errors in an array and display it
