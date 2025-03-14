const Product = require("../models/Product");

/**
 * Get all products with pagination and filtering
 * 
 * Input:
 * - Query parameters:
 *   - page: (optional) page number for pagination (default: 1)
 *   - limit: (optional) number of items per page (default: 10)
 *   - device_type: (optional) filter by device type ("iPhone", "MacBook", "iPad")
 *   - model: (optional) filter by model name (case insensitive, partial match)
 *   - condition: (optional) filter by condition ("New", "Used", "Refurbished")
 *   - battery: (optional) filter by battery health
 *   - color: (optional) filter by color (case insensitive, partial match)
 *   - storage: (optional) filter by storage capacity
 *   - ram: (optional) filter by RAM (MacBooks only)
 *   - cpu: (optional) filter by CPU (MacBooks only)
 *   - connectivity: (optional) filter by connectivity (iPads only)
 *   - minPrice: (optional) minimum price
 *   - maxPrice: (optional) maximum price
 * 
 * Output:
 * - success: boolean indicating success/failure
 * - count: number of products returned
 * - total: total number of products matching the filter
 * - page: current page number
 * - pages: total number of pages
 * - limit: items per page
 * - data: array of product objects
 */
exports.getProducts = async (req, res) => {
  try {
    // First, check if any products exist at all
    const totalCount = await Product.countDocuments({});
    console.log(`Total products in database: ${totalCount}`);
    
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Filtering
    const filter = {};
    const {
      device_type,
      model,
      condition,
      battery,
      color,
      storage,
      ram,
      cpu,
      connectivity,
      minPrice,
      maxPrice,
    } = req.query;

    // Basic filters
    if (device_type) filter.device_type = device_type;
    if (model) filter.model = new RegExp(model, "i");
    if (condition) filter.condition = condition;
    if (battery) filter.battery = battery;
    if (color) filter.color = new RegExp(color, "i");
    
    // Device-specific filters
    if (storage) {
      // Handle both numeric and string storage values
      if (isNaN(storage)) {
        filter.storage = storage;
      } else {
        filter.storage = Number(storage);
      }
    }
    
    if (ram) filter.ram = Number(ram);
    if (cpu) filter.cpu = new RegExp(cpu, "i");
    if (connectivity) filter.connectivity = connectivity;

    // Price range filter
    if (minPrice && maxPrice) {
      filter.price = { $gte: Number(minPrice), $lte: Number(maxPrice) };
    } else if (minPrice) {
      filter.price = { $gte: Number(minPrice) };
    } else if (maxPrice) {
      filter.price = { $lte: Number(maxPrice) };
    }

    console.log("Filter object:", filter);

    // Try without sorting first to see if that's the issue
    const products = await Product.find(filter)
      .select("-__v")
      .skip(skip)
      .limit(limit);
    
    console.log(`Found ${products.length} products with filter`);
    
    const total = await Product.countDocuments(filter);

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
    console.error("Error in getProducts:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get product by ID with all available configuration options
 * 
 * Input:
 * - URL parameter:
 *   - id: MongoDB ObjectId of the product
 * 
 * Output:
 * - success: boolean indicating success/failure
 * - data: object containing:
 *   - product: the product object
 *   - configOptions: all available configuration options for this model
 */
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).select("-__v");

    if (!product) {
      return res.status(404).json({ 
        success: false, 
        error: "Product not found" 
      });
    }

    // Get configuration options for this model
    const configOptions = await getConfigurationOptions(product.model, product.device_type);

    res.json({
      success: true,
      data: {
        product,
        configOptions
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

/**
 * Get all available configuration options for a specific model
 * 
 * Input:
 * - Query parameters:
 *   - model: product model name (exact match)
 *   - device_type: device type ("iPhone", "MacBook", "iPad")
 * 
 * Output:
 * - success: boolean indicating success/failure
 * - data: object containing configuration options:
 *   - storage: array of available storage options
 *   - color: array of available colors
 *   - condition: array of available conditions
 *   - price: object with min and max prices
 *   - ram: array of available RAM options (MacBooks only)
 *   - cpu: array of available CPU options (MacBooks only)
 *   - connectivity: array of available connectivity options (iPads only)
 */
exports.getConfigOptions = async (req, res) => {
  try {
    const { model, device_type } = req.query;
    
    if (!model || !device_type) {
      return res.status(400).json({
        success: false,
        error: "Model and device_type are required"
      });
    }

    const configOptions = await getConfigurationOptions(model, device_type);

    res.json({
      success: true,
      data: configOptions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get one product from each model (the lowest price option)
 * 
 * Input:
 * - No input parameters required
 * 
 * Output:
 * - success: boolean indicating success/failure
 * - count: total number of unique models
 * - data: object containing:
 *   - allProducts: flat array of all products (one per model)
 *   - byCategory: object with products categorized by device type:
 *     - iPhones: array of iPhone products
 *     - MacBooks: array of MacBook products
 *     - iPads: array of iPad products
 */
exports.getOneFromEachModel = async (req, res) => {
  try {
    // Use aggregation to find the lowest price product for each model
    const products = await Product.aggregate([
      // Sort by price (ascending) before grouping
      { $sort: { price: 1 } },
      
      // Group by model and take the first item (which will be the lowest price due to sorting)
      {
        $group: {
          _id: "$model",
          product: { $first: "$$ROOT" }
        }
      },
      
      // Replace the document with just the product object
      {
        $replaceRoot: { newRoot: "$product" }
      },
      
      // Sort results by device_type and then by price for a clean presentation
      {
        $sort: { 
          device_type: 1,
          price: 1 
        }
      }
    ]);

    // Structure response by device type
    const categorizedProducts = {
      iPhones: products.filter(p => p.device_type === "iPhone"),
      MacBooks: products.filter(p => p.device_type === "MacBook"),
      iPads: products.filter(p => p.device_type === "iPad")
    };

    res.json({
      success: true,
      count: products.length,
      data: {
        allProducts: products,
        byCategory: categorizedProducts
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Add multiple products in bulk
 * 
 * Input:
 * - Request body:
 *   - iPhones: (optional) array of iPhone products
 *   - MacBooks: (optional) array of MacBook products
 *   - iPads: (optional) array of iPad products
 * 
 * Each product object should contain:
 * - Common fields for all devices:
 *   - device_type: "iPhone", "MacBook", or "iPad"
 *   - model: model name
 *   - storage: storage capacity (number for iPhones/MacBooks, string for iPads)
 *   - color: color name
 *   - condition: condition state
 *   - price: price in numbers
 *   - image: image URL
 *   - battery: battery health percentage
 * 
 * - MacBook specific fields:
 *   - ram: RAM in GB (number)
 *   - cpu: CPU model/name
 * 
 * - iPad specific fields:
 *   - connectivity: connectivity option (e.g., "WiFi", "WiFi + Cellular")
 * 
 * Output:
 * - success: boolean indicating success/failure
 * - count: number of products added
 * - message: success message
 */
exports.addBulkProducts = async (req, res) => {
  try {
    const { iPhones, MacBooks, iPads } = req.body;
    
    // Validate input
    if (!iPhones && !MacBooks && !iPads) {
      return res.status(400).json({
        success: false,
        error: "No products provided"
      });
    }

    // Combine all products
    const allProducts = [
      ...(iPhones || []),
      ...(MacBooks || []),
      ...(iPads || [])
    ];

    // Validate device-specific fields
    allProducts.forEach(product => {
      validateDeviceFields(product);
    });

    // Insert products
    const result = await Product.insertMany(allProducts);

    res.status(201).json({
      success: true,
      count: result.length,
      message: `${result.length} products added successfully`
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Helper function to get all available configuration options for a specific model
 * 
 * Input:
 * - model: product model name (exact match)
 * - deviceType: device type ("iPhone", "MacBook", "iPad")
 * 
 * Output:
 * - Object containing available configuration options:
 *   - storage: array of available storage options
 *   - color: array of available colors
 *   - condition: array of available conditions
 *   - price: object with min and max prices
 *   - ram: array of available RAM options (MacBooks only)
 *   - cpu: array of available CPU options (MacBooks only)
 *   - connectivity: array of available connectivity options (iPads only)
 */
async function getConfigurationOptions(model, deviceType) {
  // Query for all products matching the model and device_type
  const products = await Product.find({ 
    model: model,
    device_type: deviceType
  }).select("-__v");
  
  // Initialize result object
  let configOptions = {
    storage: [],
    color: [],
    condition: [],
    price: { min: Infinity, max: 0 }
  };

  // Add device-specific config fields
  if (deviceType === "MacBook") {
    configOptions.ram = [];
    configOptions.cpu = [];
  } else if (deviceType === "iPad") {
    configOptions.connectivity = [];
  }

  // Populate configuration options
  products.forEach(product => {
    // Common fields for all devices
    if (!configOptions.storage.includes(product.storage)) {
      configOptions.storage.push(product.storage);
    }
    
    if (!configOptions.color.includes(product.color)) {
      configOptions.color.push(product.color);
    }
    
    if (!configOptions.condition.includes(product.condition)) {
      configOptions.condition.push(product.condition);
    }
    
    // Update price range
    if (product.price < configOptions.price.min) {
      configOptions.price.min = product.price;
    }
    if (product.price > configOptions.price.max) {
      configOptions.price.max = product.price;
    }
    
    // Device-specific fields
    if (deviceType === "MacBook") {
      if (!configOptions.ram.includes(product.ram)) {
        configOptions.ram.push(product.ram);
      }
      
      if (!configOptions.cpu.includes(product.cpu)) {
        configOptions.cpu.push(product.cpu);
      }
    } else if (deviceType === "iPad") {
      if (!configOptions.connectivity.includes(product.connectivity)) {
        configOptions.connectivity.push(product.connectivity);
      }
    }
  });

  // Sort numeric options
  configOptions.storage = sortOption(configOptions.storage);
  if (deviceType === "MacBook") {
    configOptions.ram = sortOption(configOptions.ram);
  }

  return configOptions;
}

/**
 * Helper function to sort configuration options (handles mixed types)
 * 
 * Input:
 * - options: array of values (can be numbers or strings)
 * 
 * Output:
 * - Sorted array with numbers first (ascending), then strings (alphabetically)
 */
function sortOption(options) {
  // Separate numeric and non-numeric values
  const numericValues = options.filter(v => !isNaN(v)).map(Number);
  const stringValues = options.filter(v => isNaN(v));

  // Sort each array
  numericValues.sort((a, b) => a - b);
  stringValues.sort();

  // Return combined result
  return [...numericValues, ...stringValues];
}

/**
 * Helper function to validate device-specific fields
 * 
 * Input:
 * - productData: product object to validate
 * 
 * Output:
 * - Returns the validated product data if valid
 * - Throws an error if validation fails
 */
function validateDeviceFields(productData) {
  const { device_type, ram, cpu, connectivity, storage, color, condition, battery, price } = productData;

  // Common validation for all device types
  if (!device_type) throw new Error("device_type is required");
  if (!color) throw new Error("color is required");
  if (!condition) throw new Error("condition is required");
  if (!battery) throw new Error("battery is required");
  if (price === undefined) throw new Error("price is required");
  if (storage === undefined) throw new Error("storage is required");

  // Validate MacBook-specific fields
  if (device_type === "MacBook") {
    if (ram === undefined) {
      throw new Error("RAM is required for MacBook");
    }
    if (!cpu) {
      throw new Error("CPU is required for MacBook");
    }
  }

  // Validate iPad-specific fields
  if (device_type === "iPad" && !connectivity) {
    throw new Error("Connectivity is required for iPad");
  }

  return productData;
}