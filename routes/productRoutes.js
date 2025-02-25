const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");

// Generic products endpoint with filters
router.get("/", productController.getProducts);

// Existing routes
router.get("/:id", productController.getProductById);
router.post("/", productController.createProduct);
router.put("/:id", productController.updateProduct);
router.delete("/:id", productController.deleteProduct);

module.exports = router;
