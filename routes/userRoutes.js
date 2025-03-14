const express = require("express");
const {
  createUser,
  getUser,
  updateUser,
  deleteUser,
  getUserOrders,
} = require("../controllers/userController");

const router = express.Router();

// Create user
router.post("/", createUser);

// Get user orders should come before the generic get user route
router.get("/:id/orders", getUserOrders);

// Get user profile
router.get("/:id", getUser);

// Update user
router.put("/:id", updateUser);

// Delete user
router.delete("/:id", deleteUser);

module.exports = router;
