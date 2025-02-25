const Order = require("../models/Order");
const User = require("../models/User");
const Product = require("../models/Product");

// Get single order
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email")
      .populate("items.product", "product_title");

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get orders by user
exports.getOrdersByUser = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.params.userId })
      .sort("-created_at")
      .populate("items.product", "product_title");

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete order
exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Remove from user's current order if exists
    await User.updateMany(
      { "current_order.order_id": req.params.id },
      { $unset: { current_order: "" } }
    );

    res.json({ message: "Order deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create Order
exports.createOrder = async (req, res) => {
  try {
    const { userId, items, shippingAddress } = req.body;

    // Validate user
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Validate items
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product)
        return res
          .status(404)
          .json({ error: `Product ${item.productId} not found` });

      // Check configuration availability
      const config = product.specifications;
      const validCondition = config.conditions.some(
        (c) => c.condition === item.configuration.condition && c.is_available
      );
      if (!validCondition)
        return res.status(400).json({ error: "Invalid configuration" });
    }

    // Create order
    const order = new Order({
      user: userId,
      items: items.map((item) => ({
        product: item.productId,
        configuration: item.configuration,
        quantity: item.quantity,
        price_at_purchase: item.price,
      })),
      shipping_address: shippingAddress,
      status: "pending",
    });

    await order.save();

    // Update user's current order
    user.current_order = { order_id: order._id, status: "pending" };
    await user.save();

    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update Order Status
exports.updateOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    // If order is completed, move to purchase history
    if (req.body.status === "delivered") {
      const user = await User.findById(order.user);
      user.purchase_history.push(order._id);
      user.current_order = null;
      await user.save();
    }

    res.json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
