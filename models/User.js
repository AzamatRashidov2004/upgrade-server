const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  phone: { type: String },
  address: {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    zip: { type: String },
    country: { type: String },
  },
  purchase_history: [{ type: Schema.Types.ObjectId, ref: "Order" }],
  current_order: {
    order_id: { type: Schema.Types.ObjectId, ref: "Order" },
    status: { type: String },
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);
