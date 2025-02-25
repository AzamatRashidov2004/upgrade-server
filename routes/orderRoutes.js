const express = require("express");
const {
  createOrder,
  getOrder,
  updateOrder,
  deleteOrder,
  getOrdersByUser,
} = require("../controllers/orderController");

const router = express.Router();

router.post("/", createOrder);
router.get("/:id", getOrder);
router.put("/:id", updateOrder);
router.delete("/:id", deleteOrder);
router.get("/user/:userId", getOrdersByUser);

module.exports = router;
