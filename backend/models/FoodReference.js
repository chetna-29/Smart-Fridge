const mongoose = require('mongoose');

const foodReferenceSchema = new mongoose.Schema({
  foodkeeperId: { 
    type: Number, 
    unique: true, 
    required: true 
  },
  foodName: { 
    type: String, 
    required: true, 
    trim: true,
    index: true
  },
  category: { 
    type: String, 
    required: true, 
    index: true 
  },
  subCategory: { 
    type: String, 
    trim: true,
    index: true
  },
  keywords: [{ 
    type: String, 
    index: true 
  }],
  
  // Pantry Storage (Unopened)
  pantryStorageTime: { type: Number }, // in days
  isPantryRecommended: { type: Boolean, default: true },
  pantryTips: { type: String, trim: true },
  
  // Refrigerator Storage (Unopened)
  fridgeStorageTime: { type: Number }, // in days
  isFridgeRecommended: { type: Boolean, default: true },
  fridgeTips: { type: String, trim: true },
  
  // Freezer Storage (Unopened)
  freezerStorageTime: { type: Number }, // in days
  isFreezerRecommended: { type: Boolean, default: true },
  freezerTips: { type: String, trim: true },
  
  // After Opening Storage
  openedPantryStorageTime: { type: Number }, // in days
  openedFridgeStorageTime: { type: Number }, // in days
  
  source: { 
    type: String, 
    default: 'USDA FoodKeeper' 
  }
}, { timestamps: true });

// Text index for fast text searches across name and keywords
foodReferenceSchema.index({ foodName: 'text', keywords: 'text' });

module.exports = mongoose.model('FoodReference', foodReferenceSchema);
