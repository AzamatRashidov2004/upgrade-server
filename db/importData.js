// db/importData.js
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") }); // Fix path
const Product = require("../models/Product");
// const { normalizeData } = require("./normalizeData");
const connectDB = require("./connect");

// Debug: Verify environment variables
console.log("Current MONGO_URI:", process.env.MONGO_URI);
console.log("Current NODE_ENV:", process.env.NODE_ENV);

// Helper function to shuffle an array (Fisher–Yates)
const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

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
    try {
      await Product.collection.drop();
      console.log("Products collection dropped!");
    } catch (err) {
      // Collection might not exist yet, that's okay
      console.log("Collection may not exist yet:", err.message);
    }
    
    const filePath = path.join(__dirname, "result.json");
    console.log("Reading file from:", filePath);
    const rawData = fs.readFileSync(filePath, "utf8");
    console.log("Found raw data for products");
    const productsData = JSON.parse(rawData);
    
    // Extract products from the nested structure
    const allProducts = [
      ...(productsData.iPhones || []),
      ...(productsData.MacBooks || []),
      ...(productsData.iPads || [])
    ];
    
    console.log("Found", allProducts.length, "raw products");
    
    // Shuffle the products array
    const shuffledProducts = shuffleArray(allProducts);
    
    // Import in batches to avoid memory issues
    const batchSize = 1000;
    let insertedCount = 0;
    
    for (let i = 0; i < shuffledProducts.length; i += batchSize) {
      const batch = shuffledProducts.slice(i, i + batchSize);
      console.log(`Inserting batch ${i/batchSize + 1}/${Math.ceil(shuffledProducts.length/batchSize)} (${batch.length} products)...`);
      
      try {
        const result = await Product.insertMany(batch, { 
          ordered: false,
          rawResult: true // Add this to see validation errors
        });
        insertedCount += result.insertedCount;
        console.log(`Batch inserted: ${result.insertedCount} products`);
      } catch (err) {
        if (err.writeErrors) {
          console.log(`Batch partially inserted: ${err.insertedDocs.length} products`);
          insertedCount += err.insertedDocs.length;
          
          console.log(`${err.writeErrors.length} errors occurred. Sample errors:`);
          err.writeErrors.slice(0, 3).forEach(writeError => {
            console.log(`- ${writeError.errmsg} for document: ${JSON.stringify(writeError.op)}`);
          });
        } else {
          console.error(`Batch error:`, err);
        }
      }
    }
    
    console.log(`Data import completed. Inserted ${insertedCount} out of ${allProducts.length} products`);
  } catch (error) {
    console.error("Error in importData:", error);
    throw error;
  }
};

// Start the process
runImport();
