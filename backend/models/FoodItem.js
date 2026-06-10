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
      required: [true, "Please provide a category"],
      trim: true,
    },
    quantity: {
      type: String,
      required: [true, "Please provide quantity"],
      trim: true,
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
      required: [true, "Please provide storage type"],
      trim: true,
      default: "Fridge",
    },
    status: {
      type: String,
      required: true,
      trim: true,
      enum: ["Unopened", "Opened"],
      default: "Unopened",
    },
    daysLeft: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      trim: true,
    },
    finishByDate: {
      type: Date,
    },
    consumptionGoalDays: {
      type: Number,
    },
    consumptionStatus: {
      type: String,
      enum: ["On Track", "Approaching Goal", "Goal Missed", "Finished"],
      default: "On Track",
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

  return daysLeft;
};

// Calculate consumption goal status
foodItemSchema.methods.calculateConsumptionStatus = function () {
  if (!this.finishByDate) {
    this.consumptionStatus = "On Track";
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(this.finishByDate);
  target.setHours(0, 0, 0, 0);

  const diffTime = target - today;
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) {
    this.consumptionStatus = "Goal Missed";
  } else if (daysLeft <= 1) {
    this.consumptionStatus = "Approaching Goal";
  } else {
    this.consumptionStatus = "On Track";
  }
};

// Pre-save hook to calculate status
foodItemSchema.pre("save", function () {
  this.calculateDaysLeft();
  this.calculateConsumptionStatus();
});

module.exports = mongoose.model("FoodItem", foodItemSchema);
