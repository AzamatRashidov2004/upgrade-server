// normalizeData.js

/**
 * Check if the detail indicates unavailability.
 * @param {String} detail
 * @returns {Boolean} - false if the detail includes "sold out", true otherwise.
 */
function isAvailable(detail) {
  if (typeof detail === "string" && detail.toLowerCase().includes("sold out")) {
    return false;
  }
  return true;
}

/**
 * Normalize a single product record.
 * If the required field product_title is missing or empty,
 * the function returns null (to be skipped).
 * @param {Object} product - Raw product data.
 * @returns {Object|null} Normalized product or null to skip.
 */
function normalizeProduct(product) {
  // Skip product if product_title is missing or empty.
  if (!product.product_title || product.product_title.trim() === "") {
    console.warn("Skipping product due to missing product_title:", product);
    return null;
  }

  // Infer category based on product_title (case-insensitive)
  const titleLower = product.product_title.toLowerCase();
  let category = "";
  if (titleLower.includes("macbook")) {
    category = "MacBook";
  } else if (titleLower.includes("iphone")) {
    category = "iPhone";
  } else if (titleLower.includes("ipad")) {
    category = "iPad";
  }

  if (!category) {
    console.warn(
      "Skipping product due to unrecognized category:",
      product.product_title
    );
    return null;
  }

  function extractPrice(detail) {
    if (typeof detail !== "string") return null;
    const match = detail.match(/\$?(\d+\.?\d*)/);
    return match ? parseFloat(match[1]) : null;
  }

  // Normalize conditions (handles both macbooks/iphones and ipads structures)
  const normalizedConditions = (product.conditions || []).map((cond) => {
    const condition = cond.condition || cond.name || "";
    const detail = extractPrice(cond.detail || cond.price || 0);
    return {
      condition,
      detail,
      is_available: isAvailable(detail),
    };
  });

  // Normalize processors
  const normalizedProcessors = (product.processors || []).map((proc) => {
    const name = proc.processor || proc.name || "";
    const detail = extractPrice(proc.detail || 0);
    return {
      name,
      detail,
      is_available: isAvailable(detail),
    };
  });

  // Normalize memories
  const normalizedMemories = (product.memories || []).map((mem) => {
    const size = mem.memory || mem.size || "";
    const detail = extractPrice(mem.detail || 0);
    return {
      size,
      detail,
      is_available: isAvailable(detail),
    };
  });

  // Normalize storage options
  const normalizedStorageOptions = (product.storage_options || []).map(
    (sto) => {
      const capacity = sto.storage || sto.name || "";
      const detail = extractPrice(sto.detail || sto.additional_info || 0);
      return {
        capacity,
        detail,
        is_available: isAvailable(detail),
      };
    }
  );

  // Normalize color options
  const normalizedColorOptions = (product.color_options || []).map((col) => {
    const name = col.color || col.name || "";
    const hex_code = col.color_code || col.hex_color || "";
    const detail = extractPrice(col.detail || 0);
    return {
      name,
      hex_code,
      detail,
      is_available: isAvailable(detail),
    };
  });

  return {
    url: product.url,
    product_title: product.product_title,
    category,
    specifications: {
      conditions: normalizedConditions,
      processors: normalizedProcessors,
      memories: normalizedMemories,
      storage_options: normalizedStorageOptions,
      color_options: normalizedColorOptions,
    },
    created_at: new Date(),
    updated_at: new Date(),
  };
}

/**
 * Normalize an array of raw product data.
 * @param {Array} products - Array of raw product objects.
 * @returns {Array} Array of normalized product objects.
 */
function normalizeData(products) {
  // Map each product through normalizeProduct and filter out any null values.
  return products.map(normalizeProduct).filter((prod) => prod !== null);
}

module.exports = { normalizeProduct, normalizeData };
