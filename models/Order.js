const mongoose = require("mongoose");
const { Schema } = mongoose;

const orderSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  items: [
    {
      product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
      configuration: {
        condition: { type: String, required: true },
        processor: { type: String, required: true },
        memory: { type: String, required: true },
        storage: { type: String, required: true },
        color: { type: String, required: true },
      },
      quantity: { type: Number, default: 1 },
      price_at_purchase: { type: Number, required: true },
    },
  ],
  status: {
    type: String,
    enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
    default: "pending",
  },
  total_amount: { type: Number, required: true },
  shipping_address: {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    zip: { type: String },
    country: { type: String },
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Order", orderSchema);
