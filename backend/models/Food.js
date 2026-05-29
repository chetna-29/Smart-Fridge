const mongoose = require("mongoose");

const foodSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    itemName: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Dairy",
        "Meat",
        "Vegetables",
        "Fruits",
        "Bakery",
        "Condiments",
        "Beverages",
        "Frozen",
        "Other",
      ],
    },
    quantity: {
      type: Number,
      required: true,
      min: 0.1,
    },
    unit: {
      type: String,
      default: "pcs",
      enum: ["pcs", "kg", "g", "L", "ml", "oz", "lb"],
    },
    purchaseDate: {
      type: Date,
      required: true,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    storageType: {
      type: String,
      enum: ["Fridge", "Freezer", "Pantry", "Counter"],
      default: "Fridge",
    },
    status: {
      type: String,
      enum: ["Fresh", "Expiring Soon", "Expired"],
      default: "Fresh",
    },
    shelfLifeDays: {
      type: Number,
      required: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for faster queries
foodSchema.index({ userId: 1, expiryDate: 1 });
foodSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model("Food", foodSchema);
