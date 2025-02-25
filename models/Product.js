const mongoose = require("mongoose");
const { Schema } = mongoose;

const productSchema = new Schema({
  url: { type: String, unique: true, required: true },
  product_title: { type: String, required: true },
  category: {
    type: String,
    enum: ["iPhone", "MacBook", "iPad"],
    required: true,
  },
  specifications: {
    conditions: [
      {
        condition: { type: String, required: true },
        detail: { type: Number },
        is_available: { type: Boolean, default: true },
      },
    ],
    processors: [
      {
        name: { type: String, required: true },
        detail: { type: Number },
        is_available: { type: Boolean, default: true },
      },
    ],
    memories: [
      {
        size: { type: String, required: true },
        detail: { type: Number },
        is_available: { type: Boolean, default: true },
      },
    ],
    storage_options: [
      {
        capacity: { type: String, required: true },
        detail: { type: Number },
        is_available: { type: Boolean, default: true },
      },
    ],
    color_options: [
      {
        name: { type: String, required: true },
        hex_code: { type: String },
        detail: { type: Number },
        is_available: { type: Boolean, default: true },
      },
    ],
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Product", productSchema);
