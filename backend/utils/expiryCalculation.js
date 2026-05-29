const shelfLifeData = require("../data/shelfLife.json");

const calculateExpiryDate = (purchaseDate, shelfLifeDays) => {
  const expiry = new Date(purchaseDate);
  expiry.setDate(expiry.getDate() + shelfLifeDays);
  return expiry;
};

const getShelfLifeDays = (category, itemName) => {
  const categoryData = shelfLifeData[category];

  if (!categoryData) {
    return 14; // Default shelf life if category not found
  }

  const normalizedItemName = itemName.toLowerCase().replace(/\s+/g, "_");
  return categoryData[normalizedItemName] || 14; // Default if item not found
};

const calculateFoodStatus = (expiryDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);

  const daysUntilExpiry = Math.floor(
    (expiry - today) / (1000 * 60 * 60 * 24)
  );

  if (daysUntilExpiry > 3) {
    return "Fresh";
  } else if (daysUntilExpiry >= 1) {
    return "Expiring Soon";
  } else {
    return "Expired";
  }
};

const getDaysUntilExpiry = (expiryDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);

  return Math.floor((expiry - today) / (1000 * 60 * 60 * 24));
};

const updateFoodStatus = async (food) => {
  const newStatus = calculateFoodStatus(food.expiryDate);
  if (food.status !== newStatus) {
    food.status = newStatus;
    await food.save();
  }
  return food;
};

module.exports = {
  calculateExpiryDate,
  getShelfLifeDays,
  calculateFoodStatus,
  getDaysUntilExpiry,
  updateFoodStatus,
};
