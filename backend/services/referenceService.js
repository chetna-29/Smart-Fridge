const FoodReference = require('../models/FoodReference');

/**
 * Calculate Levenshtein distance-based similarity score between two strings (0.0 to 1.0)
 */
function getSimilarity(s1, s2) {
  const str1 = (s1 || '').toLowerCase().trim();
  const str2 = (s2 || '').toLowerCase().trim();
  
  if (str1 === str2) return 1.0;
  if (str1.length === 0 || str2.length === 0) return 0.0;

  // Exact substring check (e.g., "whole milk" containing "milk")
  if (str1.includes(str2) || str2.includes(str1)) {
    // Return a high partial match score based on length ratio
    return Math.min(str1.length, str2.length) / Math.max(str1.length, str2.length) * 0.9;
  }

  const len1 = str1.length;
  const len2 = str2.length;
  const matrix = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  const distance = matrix[len1][len2];
  const maxLength = Math.max(len1, len2);
  return 1.0 - (distance / maxLength);
}

/**
 * Get item by MongoDB ObjectId
 */
const getById = async (id) => {
  return await FoodReference.findById(id);
};

/**
 * Get items by category
 */
const getByCategory = async (category) => {
  return await FoodReference.find({ 
    category: { $regex: new RegExp(`^${category}$`, 'i') } 
  }).sort({ foodName: 1 });
};

/**
 * Search items by name with optional category filtering and fuzzy fallback
 */
const searchReference = async (query, category = null) => {
  if (!query) {
    const filter = category ? { category: { $regex: new RegExp(`^${category}$`, 'i') } } : {};
    return await FoodReference.find(filter).limit(50).sort({ foodName: 1 });
  }

  const cleanQuery = query.trim().toLowerCase();
  const filter = {};
  if (category) {
    filter.category = { $regex: new RegExp(`^${category}$`, 'i') };
  }

  // 1. Try exact or prefix regex match first (highest priority)
  const regexResults = await FoodReference.find({
    ...filter,
    $or: [
      { foodName: { $regex: new RegExp(cleanQuery, 'i') } },
      { keywords: cleanQuery }
    ]
  }).limit(50);

  if (regexResults.length > 0) {
    // Sort regex results by best matches
    return regexResults.sort((a, b) => {
      const simA = getSimilarity(a.foodName, query);
      const simB = getSimilarity(b.foodName, query);
      return simB - simA;
    });
  }

  // 2. Try text index search
  const textResults = await FoodReference.find({
    ...filter,
    $text: { $search: cleanQuery }
  }).limit(30);

  if (textResults.length > 0) {
    return textResults.sort((a, b) => {
      const simA = getSimilarity(a.foodName, query);
      const simB = getSimilarity(b.foodName, query);
      return simB - simA;
    });
  }

  // 3. Fallback: Fuzzy scan of all items (or within category)
  const allRefItems = await FoodReference.find(category ? { category: filter.category } : {});
  const fuzzyThreshold = 0.35; // Conservative match threshold
  
  const fuzzyMatches = allRefItems
    .map(item => {
      // Check similarity against name
      let score = getSimilarity(item.foodName, query);
      
      // Also check similarity against individual keywords
      if (item.keywords && item.keywords.length > 0) {
        const keywordScores = item.keywords.map(kw => getSimilarity(kw, query));
        const maxKwScore = Math.max(...keywordScores);
        if (maxKwScore > score) {
          score = maxKwScore;
        }
      }

      return { item, score };
    })
    .filter(match => match.score >= fuzzyThreshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)
    .map(match => match.item);

  return fuzzyMatches;
};

/**
 * Find the single closest matching FoodKeeper record
 */
const findClosestMatch = async (itemName, category = null) => {
  if (!itemName) return null;

  const matches = await searchReference(itemName, category);
  if (matches.length === 0) return null;

  // Return the top match and calculate its score
  const bestMatch = matches[0];
  const score = getSimilarity(bestMatch.foodName, itemName);

  return {
    item: bestMatch,
    score
  };
};

module.exports = {
  getById,
  getByCategory,
  searchReference,
  findClosestMatch,
  getSimilarity
};
