const express = require("express");
const connectDB = require("./db/connect");
const productRoutes = require("./routes/productRoutes");
const userRoutes = require("./routes/userRoutes");
const orderRoutes = require("./routes/orderRoutes");
//const emailRoutes = require("./routes/emailRoutes");
const errorHandler = require("./middlewares/errorHandler");
const validateRequest = require("./middlewares/validateRequest");
const Joi = require("joi");
const sendMail = require("./utility/mailgun");

const app = express();
app.use(express.json());

// Database connection
connectDB();

// Request validation schemas
const productSchema = Joi.object({
  url: Joi.string().uri().required(),
  product_title: Joi.string().required(),
  category: Joi.string().valid("iPhone", "MacBook", "iPad").required(),
  specifications: Joi.object().required(),
});

// Routes
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);
app.use("/api/orders", orderRoutes);
// Client makes POST request to /api/email/contact
//app.use("/api/email", emailRoutes);

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
