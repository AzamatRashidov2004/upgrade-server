const express = require("express");
const {
  createUser,
  getUser,
  updateUser,
  deleteUser,
  getUserOrders,
} = require("../controllers/userController");

const router = express.Router();

router.post("/", createUser);
router.get("/:id", getUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);
router.get("/:id/orders", getUserOrders);

module.exports = router;
