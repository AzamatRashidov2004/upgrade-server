// db/importData.js
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") }); // Fix path
const Product = require("../models/Product");
const { normalizeData } = require("./normalizeData");
const connectDB = require("./connect");

// Debug: Verify environment variables
console.log("Current MONGO_URI:", process.env.MONGO_URI);
console.log("Current NODE_ENV:", process.env.NODE_ENV);

function removeDuplicates(products) {
  const seen = new Set();
  return products.filter((prod) => {
    if (seen.has(prod.url)) return false;
    seen.add(prod.url);
    return true;
  });
}

// First verify connection
async function runImport() {
  try {
    console.log("Attempting to connect to MongoDB...");
    await connectDB();
    console.log("Successfully connected to MongoDB!");

    await importData();
    console.log("Data import completed");
    process.exit(0);
  } catch (error) {
    console.error("Import failed:", error);
    process.exit(1);
  }
}

const importData = async () => {
  try {
    console.log("Dropping collection...");
    await Product.collection.drop();
    console.log("Products collection dropped!");

    const filePath = path.join(__dirname, "results.json");
    console.log("Reading file from:", filePath);

    const rawData = fs.readFileSync(filePath, "utf8");
    const rawProducts = JSON.parse(rawData);
    console.log("Found", rawProducts.length, "raw products");

    const normalizedProducts = normalizeData(rawProducts);
    const uniqueProducts = removeDuplicates(normalizedProducts);
    console.log("Normalized to", uniqueProducts.length, "unique products");

    console.log("Inserting data...");
    await Product.insertMany(uniqueProducts, { ordered: false });
    console.log("Data successfully imported!");
  } catch (error) {
    console.error("Error in importData:", error);
    throw error; // Propagate error to catch block
  }
};

// Start the process
runImport();
