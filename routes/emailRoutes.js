import express from "express";
import { sendContactEmail } from "../controllers/emailController.js";
import { validateEmail } from "../middlewares/validateEmail.js";

const router = express.Router();

router.post("/contact", validateEmail, sendContactEmail);
//router.post("/welcome", sendWelcomeEmail);

export default router;
