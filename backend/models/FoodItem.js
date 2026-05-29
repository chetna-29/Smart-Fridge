const mongoose = require("mongoose");

const foodItemSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    itemName: {
      type: String,
      required: [true, "Please provide food item name"],
      trim: true,
    },
    category: {
      type: String,
      enum: ["dairy", "fruits", "vegetables", "grains", "meat", "other"],
      required: [true, "Please provide a category"],
    },
    quantity: {
      type: Number,
      required: [true, "Please provide quantity"],
      min: 1,
    },
    purchaseDate: {
      type: Date,
      required: [true, "Please provide purchase date"],
      default: Date.now,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    storageType: {
      type: String,
      enum: ["fridge", "freezer", "pantry", "counter"],
      default: "fridge",
    },
    status: {
      type: String,
      enum: ["fresh", "expiring_soon", "expired"],
      default: "fresh",
    },
    daysLeft: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Calculate days left before expiry
foodItemSchema.methods.calculateDaysLeft = function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(this.expiryDate);
  expiry.setHours(0, 0, 0, 0);

  const diffTime = expiry - today;
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  this.daysLeft = daysLeft;

  // Update status based on days left
  if (daysLeft < 0) {
    this.status = "expired";
  } else if (daysLeft <= 3 && daysLeft >= 1) {
    this.status = "expiring_soon";
  } else if (daysLeft > 3) {
    this.status = "fresh";
  } else {
    this.status = "expired";
  }

  return daysLeft;
};

// Pre-save hook to calculate status
foodItemSchema.pre("save", function (next) {
  this.calculateDaysLeft();
  next();
});

module.exports = mongoose.model("FoodItem", foodItemSchema);
