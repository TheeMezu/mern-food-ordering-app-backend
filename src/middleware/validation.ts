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
  body("name").isString().notEmpty().withMessage("Name must be a string"),
  body("addressLine1")
    .isString()
    .notEmpty()
    .withMessage("AddressLine1 must be a string"),
  body("city").isString().notEmpty().withMessage("City must be a string"),
  body("country").isString().notEmpty().withMessage("Country must be a string"),
  handeValidationError,
];

// so basically whenever there is a validation error it is sent back to
// handeValidationError which uses validationResult from express-validator
// which collects all the errors in an array and display it
