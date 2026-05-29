const shelfLifeData = require("../data/shelfLife.json");

/**
 * Get shelf life days for a food item
 * @param {string} category - Food category
 * @param {string} itemName - Food item name
 * @returns {number} Days until expiry
 */
const getShelfLifeDays = (category, itemName) => {
  const normalizedItem = itemName.toLowerCase().trim();
  const normalizedCategory = category.toLowerCase();

  if (shelfLifeData[normalizedCategory]) {
    const days = shelfLifeData[normalizedCategory][normalizedItem];
    return days || shelfLifeData[normalizedCategory]["other"] || 7;
  }

  return 7; // Default to 7 days
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
