const express = require("express");
const {
  createOrder,
  getOrder,
  updateOrder,
  deleteOrder,
  getOrdersByUser,
  getOrdersGroupedByUser
} = require("../controllers/orderController");

const router = express.Router();

// Create order
router.post("/", createOrder);

// Get orders by user should come before the generic get order route
router.get("/user/:userId", getOrdersByUser);

// Get all orders by all users ( ADMIN )
router.get("/allorders", getOrdersGroupedByUser);

// Get single order
router.get("/:id", getOrder);

// Update order
router.put("/:id", updateOrder);

// Delete order
router.delete("/:id", deleteOrder);

module.exports = router;
