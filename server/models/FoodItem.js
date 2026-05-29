const mongoose = require('mongoose');

const FoodItemSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  itemName: {
    type: String,
    required: [true, 'Please add a food item name'],
    trim: true,
  },
  category: {
    type: String,
    required: [true, 'Please specify a category'],
    enum: [
      'Fruit',
      'Vegetable',
      'Dairy',
      'Meat/Seafood',
      'Packaged Food',
      'Beverage',
      'Bakery',
      'Other',
    ],
  },
  quantity: {
    type: String,
    required: [true, 'Please add quantity (e.g., 2 units, 1kg, 500ml)'],
    trim: true,
  },
  purchaseDate: {
    type: Date,
    default: Date.now,
  },
  expiryDate: {
    type: Date,
    required: [true, 'Please specify an expiry date'],
  },
  storageType: {
    type: String,
    required: [true, 'Please specify storage type'],
    enum: ['Room Temp', 'Fridge', 'Freezer'],
    default: 'Fridge',
  },
  status: {
    type: String,
    enum: ['Opened', 'Unopened'],
    default: 'Unopened',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('FoodItem', FoodItemSchema);
