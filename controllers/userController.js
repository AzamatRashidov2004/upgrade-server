const User = require("../models/User");
const Order = require("../models/Order");

// Create user
exports.createUser = async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();

    const token = await user.generateAuthToken();
    res.status(201).json({ user, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get user profile
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-__v -purchase_history")
      .populate("current_order.order_id", "status");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const updates = Object.keys(req.body);
    const allowedUpdates = ["name", "email", "phone", "address"];
    const isValidOperation = updates.every((update) =>
      allowedUpdates.includes(update)
    );

    if (!isValidOperation) {
      return res.status(400).json({ error: "Invalid updates" });
    }

    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Cleanup related orders
    await Order.deleteMany({ user: req.params.id });

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get user orders
exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.params.id })
      .sort("-created_at")
      .populate("items.product", "product_title");

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
