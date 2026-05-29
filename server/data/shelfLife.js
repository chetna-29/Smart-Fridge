// Shelf life dataset (in days) for common food items and general categories
const shelfLifeData = {
  // General Category Defaults
  categories: {
    Fruit: 7,
    Vegetable: 7,
    Dairy: 7,
    'Meat/Seafood': 3,
    'Packaged Food': 30,
    Beverage: 10,
    Bakery: 5,
    Other: 7,
  },

  // Specific Food Items (lowercase keys for case-insensitive lookup)
  items: {
    // Dairy
    milk: 7,
    cheese: 14,
    yogurt: 10,
    butter: 30,
    egg: 21,
    eggs: 21,
    cream: 7,

    // Fruits
    banana: 5,
    bananas: 5,
    apple: 21,
    apples: 21,
    orange: 14,
    oranges: 14,
    strawberry: 3,
    strawberries: 3,
    grape: 7,
    grapes: 7,
    lemon: 14,
    lemons: 14,
    avocado: 4,
    avocados: 4,
    tomato: 7,
    tomatoes: 7,

    // Vegetables
    spinach: 4,
    lettuce: 5,
    broccoli: 7,
    carrot: 21,
    carrots: 21,
    potato: 30,
    potatoes: 30,
    onion: 30,
    onions: 30,
    garlic: 60,
    cucumber: 7,
    cucumbers: 7,
    mushroom: 5,
    mushrooms: 5,

    // Meat/Seafood
    chicken: 3,
    beef: 3,
    pork: 3,
    fish: 2,
    salmon: 2,
    shrimp: 2,
    turkey: 3,

    // Bakery
    bread: 5,
    bagel: 5,
    bagels: 5,
    croissant: 3,
    cake: 4,
    cookie: 14,
    cookies: 14,

    // Packaged Food
    tofu: 7,
    canned: 365,
    pasta: 365,
    rice: 365,
    cereal: 90,
  },
};

/**
 * Predicts the shelf life (in days) of a food item.
 * Looks for exact or partial matches in the specific items dictionary.
 * If not found, falls back to the default shelf life of the category.
 *
 * @param {string} itemName - The name of the food item.
 * @param {string} category - The category of the food item.
 * @returns {number} - Predicted shelf life in days.
 */
const getPredictedShelfLife = (itemName, category) => {
  if (!itemName) {
    return shelfLifeData.categories[category] || 7;
  }

  const cleanName = itemName.trim().toLowerCase();

  // 1. Direct match
  if (shelfLifeData.items[cleanName] !== undefined) {
    return shelfLifeData.items[cleanName];
  }

  // 2. Partial search (e.g., "fresh chicken" matches "chicken")
  for (const [key, value] of Object.entries(shelfLifeData.items)) {
    if (cleanName.includes(key)) {
      return value;
    }
  }

  // 3. Fallback to category default
  return shelfLifeData.categories[category] || 7;
};

module.exports = {
  shelfLifeData,
  getPredictedShelfLife,
};
