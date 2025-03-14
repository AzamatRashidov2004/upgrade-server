const mongoose = require("mongoose");
const { Schema } = mongoose;

const productSchema = new Schema({
  device_type: {
    type: String,
    enum: ["iPhone", "MacBook", "iPad"],
    required: true,
  },
  model: { 
    type: String, 
    required: true 
  },
  price: { 
    type: Number, 
    required: true 
  },
  image: { 
    type: String 
  },
  condition: { 
    type: String, 
    required: true 
  },
  battery: { 
    type: String, 
    required: true 
  },
  color: { 
    type: String, 
    required: true 
  },
  // For iPhones and MacBooks, storage is numeric, for iPads it can be a string (e.g., "64GB")
  storage: { 
    type: Schema.Types.Mixed, 
    required: true 
  },
  // Only applicable for MacBooks
  ram: { 
    type: Number 
  },
  cpu: { 
    type: String 
  },
  // Only applicable for iPads
  connectivity: { 
    type: String 
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model("Product", productSchema);
