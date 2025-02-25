const Product = require("../models/Product");

exports.getProducts = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Filtering
    const filter = {};
    const {
      category,
      condition,
      processor,
      memory,
      storage,
      color,
      minPrice,
      maxPrice,
    } = req.query;

    // Category Filter
    if (category) filter.category = category;

    // Price Range Filter (works with or without condition)
    const priceFilter = {};
    if (minPrice) priceFilter.$gte = Number(minPrice);
    if (maxPrice) priceFilter.$lte = Number(maxPrice);

    // Condition Filter (optional) with Price Range
    if (condition || minPrice || maxPrice) {
      filter["specifications.conditions"] = {
        $elemMatch: {
          ...(condition && { condition }), // Optional condition filter
          ...(Object.keys(priceFilter).length > 0 && { detail: priceFilter }),
        },
      };
    }

    // Processor Filter
    if (processor) {
      filter["specifications.processors"] = {
        $elemMatch: { name: new RegExp(processor, "i") },
      };
    }

    // Memory Filter
    if (memory) {
      filter["specifications.memories"] = {
        $elemMatch: { size: new RegExp(`^${memory}`, "i") },
      };
    }

    // Storage Filter
    if (storage) {
      filter["specifications.storage_options"] = {
        $elemMatch: { capacity: new RegExp(`^${storage}`, "i") },
      };
    }

    // Color Filter
    if (color) {
      filter["specifications.color_options"] = {
        $elemMatch: {
          $or: [
            { name: new RegExp(color, "i") },
            { hex_code: new RegExp(color, "i") },
          ],
        },
      };
    }

    // Execute Query
    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .select("-__v"),

      Product.countDocuments(filter),
    ]);

    res.json({
      success: true,
      count: products.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
      data: products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get single product
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).select("-__v");

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create product
exports.createProduct = async (req, res) => {
  try {
    const productData = {
      ...req.body,
      specifications: validateSpecifications(req.body.specifications),
    };

    const product = new Product(productData);
    await product.save();

    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    const updates = Object.keys(req.body);
    const allowedUpdates = ["product_title", "category", "specifications"];
    const isValidOperation = updates.every((update) =>
      allowedUpdates.includes(update)
    );

    if (!isValidOperation) {
      return res.status(400).json({ error: "Invalid updates" });
    }

    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Helper function
function validateSpecifications(specs) {
  // Add custom validation logic here
  return specs;
}
