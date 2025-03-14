const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");

// Get configuration options for a specific model
router.get("/config-options", productController.getConfigOptions);

// Get one product from each model (cheapest option per model)
router.get("/unique-models", productController.getOneFromEachModel);

// Get a specific product by ID
router.get("/:id", productController.getProductById);

// Get all products with filters & pagination
router.get("/", productController.getProducts);

// Bulk insert products
router.post("/bulk", productController.addBulkProducts);

module.exports = router;
