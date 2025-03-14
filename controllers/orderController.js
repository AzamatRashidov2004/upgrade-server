const Order = require("../models/Order");
const User = require("../models/User");
const Product = require("../models/Product");

// Get single order
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email")
      .populate("items.product", "model device_type price image condition battery color storage cpu ram connectivity");

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
      .populate("items.product", "model device_type price image condition battery color storage cpu ram connectivity");

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all orders of all users ( ADMIN )
exports.getOrdersGroupedByUser = async (req, res) => {
  try {
    // Fetch all orders and populate user and product details for each order item
    const orders = await Order.find({})
      .populate("user", "name email")
      .populate("items.product", "model device_type price image condition battery color storage cpu ram connectivity")
      .sort("-created_at");

    // Group orders by user id
    const ordersByUser = orders.reduce((acc, order) => {
      const userId = order.user._id.toString();
      if (!acc[userId]) {
        acc[userId] = {
          user: order.user,
          orders: []
        };
      }
      acc[userId].orders.push(order);
      return acc;
    }, {});

    // Convert the grouped object into an array
    const result = Object.values(ordersByUser);

    res.json(result);
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

    let totalAmount = 0;

    // Validate items and configuration
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product)
        return res.status(404).json({ error: `Product ${item.productId} not found` });

      // Validate common fields
      if (product.condition !== item.configuration.condition) {
        return res.status(400).json({ error: "Invalid configuration: condition mismatch" });
      }
      
      // Compare storage as strings to handle potential type differences (number vs string)
      if (String(product.storage) !== String(item.configuration.storage)) {
        return res.status(400).json({ error: "Invalid configuration: storage mismatch" });
      }
      
      if (product.color !== item.configuration.color) {
        return res.status(400).json({ error: "Invalid configuration: color mismatch" });
      }
      
      // For MacBooks, validate cpu and ram if provided
      if (product.device_type === "MacBook") {
        if (item.configuration.cpu && product.cpu !== item.configuration.cpu) {
          return res.status(400).json({ error: "Invalid configuration: CPU mismatch" });
        }
        if (item.configuration.ram && product.ram !== item.configuration.ram) {
          return res.status(400).json({ error: "Invalid configuration: RAM mismatch" });
        }
      }
      
      // For iPads, validate connectivity if provided
      if (product.device_type === "iPad") {
        if (item.configuration.connectivity && product.connectivity !== item.configuration.connectivity) {
          return res.status(400).json({ error: "Invalid configuration: connectivity mismatch" });
        }
      }
      totalAmount += item.price * item.quantity;
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
      total_amount: totalAmount,
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

    // If order is delivered, move to purchase history and clear current order
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
