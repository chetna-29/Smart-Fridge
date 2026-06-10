const shelfLifeData = require("../data/shelfLife.json");
const referenceService = require("../services/referenceService");

/**
 * Get shelf life days for a food item from FoodKeeper database or fallback
 * @param {string} category - Food category
 * @param {string} itemName - Food item name
 * @param {string} storageType - Storage type (Fridge, Freezer, Pantry, Counter)
 * @returns {Promise<number>} Days until expiry
 */
const getShelfLifeDays = async (category, itemName, storageType = "Fridge") => {
  if (!itemName) return 7;

  try {
    const match = await referenceService.findClosestMatch(itemName, category);
    if (match && match.item) {
      const item = match.item;
      const st = String(storageType).toLowerCase();
      let days = null;

      if (st.includes("freezer") || st.includes("freeze")) {
        if (item.isFreezerRecommended !== false) {
          days = item.freezerStorageTime;
        }
      } else if (st.includes("pantry") || st.includes("counter")) {
        if (item.isPantryRecommended !== false) {
          days = item.pantryStorageTime;
        }
      } else {
        // Default to fridge
        if (item.isFridgeRecommended !== false) {
          days = item.fridgeStorageTime;
        }
      }

      // If we have a valid shelf life greater than 0, return it.
      // If it is 0 (e.g. Package use-by date), fall back to shelfLife.json config.
      if (days !== null && days !== undefined && days > 0) {
        return days;
      }
    }
  } catch (err) {
    console.error("Error matching FoodKeeper in getShelfLifeDays:", err);
  }

  // Fallback to static shelfLife.json config
  return getShelfLifeDaysFallback(category, itemName);
};

/**
 * Fallback to local shelfLife.json file if USDA database match fails
 */
const getShelfLifeDaysFallback = (category, itemName) => {
  if (!itemName || !category) return 7;
  const normalizedItem = itemName.toLowerCase().trim();
  const normalizedCategory = category.toLowerCase();

  // Find category key case-insensitively
  const actualCategoryKey = Object.keys(shelfLifeData).find(
    (key) => key.toLowerCase() === normalizedCategory
  ) || Object.keys(shelfLifeData).find(
    (key) => normalizedCategory.includes(key.toLowerCase()) || key.toLowerCase().includes(normalizedCategory)
  );

  if (actualCategoryKey) {
    const categoryData = shelfLifeData[actualCategoryKey];
    
    // 1. Direct match for item
    if (categoryData[normalizedItem] !== undefined) {
      return categoryData[normalizedItem];
    }

    // 2. Partial match for item (e.g., "whole milk" containing "milk")
    for (const [key, value] of Object.entries(categoryData)) {
      if (key !== "other" && key !== "generic_item" && normalizedItem.includes(key)) {
        return value;
      }
    }

    // 3. Fallback to category default or standard fallback
    return categoryData["other"] || categoryData["generic_item"] || 7;
  }

  return 7; // Default fallback
};

/**
 * Calculate expiry date based on purchase date and shelf life
 * @param {Date} purchaseDate - Purchase date
 * @param {number} days - Shelf life in days
 * @returns {Date} Expiry date
 */
const calculateExpiryDate = (purchaseDate, days) => {
  const expiryDate = new Date(purchaseDate);
  expiryDate.setDate(expiryDate.getDate() + days);
  return expiryDate;
};

/**
 * Calculate days remaining until expiry
 * @param {Date} expiryDate - Expiry date
 * @returns {number} Days left
 */
const calculateDaysLeft = (expiryDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);

  const diffTime = expiry - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Get food status based on days left
 * @param {number} daysLeft - Days remaining
 * @returns {string} Status: fresh, expiring_soon, or expired
 */
const getFoodStatus = (daysLeft) => {
  if (daysLeft < 0) return "expired";
  if (daysLeft >= 1 && daysLeft <= 3) return "expiring_soon";
  if (daysLeft > 3) return "fresh";
  return "expired";
};

/**
 * Check if food is expiring soon (1-3 days)
 * @param {Date} expiryDate - Expiry date
 * @returns {boolean} True if expiring soon
 */
const isExpiringsSoon = (expiryDate) => {
  const daysLeft = calculateDaysLeft(expiryDate);
  return daysLeft >= 1 && daysLeft <= 3;
};

/**
 * Check if food is expired
 * @param {Date} expiryDate - Expiry date
 * @returns {boolean} True if expired
 */
const isExpired = (expiryDate) => {
  const daysLeft = calculateDaysLeft(expiryDate);
  return daysLeft < 0;
};

module.exports = {
  getShelfLifeDays,
  calculateExpiryDate,
  calculateDaysLeft,
  getFoodStatus,
  isExpiringsSoon,
  isExpired,
};
