import { body, validationResult } from "express-validator";

export const validateEmail = [
  body("recipient").isEmail().withMessage("Invalid email address"),
  body("subject").notEmpty().withMessage("Subject is required"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];
