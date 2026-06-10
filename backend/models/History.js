const mongoose = require('mongoose');

const HistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    foodItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FoodItem',
    },
    itemName: {
      type: String,
      required: [true, 'Please add a food item name'],
      trim: true,
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Please specify a category'],
      index: true,
    },
    quantity: {
      type: String,
      required: [true, 'Please add quantity'],
      trim: true,
    },
    purchaseDate: {
      type: Date,
      required: true,
      index: true,
    },
    expiryDate: {
      type: Date,
      required: true,
      index: true,
    },
    storageType: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      required: true,
      index: true,
    },
    actionType: {
      type: String,
      enum: ['added', 'consumed', 'expired', 'deleted'],
      required: true,
      default: 'added',
      index: true,
    },
    metadata: {
      predictedConsumptionDate: Date,
      wasteRiskScore: {
        type: Number,
        min: 0,
        max: 1,
      },
      recommendationSignals: {
        type: [String],
        default: [],
      },
      groceryPlanningTags: {
        type: [String],
        default: [],
      },
    },
    plannedFinishDate: { type: Date },
    actualCompletionDate: { type: Date },
    daysDifference: { type: Number },
    consumptionGoalStatus: {
      type: String,
      enum: ['Completed Early', 'Completed On Time', 'Completed Late', 'Missed', 'N/A'],
      default: 'N/A',
      index: true
    },
  },
  { timestamps: true }
);

HistorySchema.index({ userId: 1, createdAt: -1 });
HistorySchema.index({ userId: 1, itemName: 1, createdAt: -1 });
HistorySchema.index({ userId: 1, category: 1, purchaseDate: -1 });

HistorySchema.statics.fromFoodItem = function (foodItem, actionType = 'added', overrides = {}) {
  let plannedFinishDate = foodItem.finishByDate || null;
  let actualCompletionDate = null;
  let daysDifference = null;
  let consumptionGoalStatus = 'N/A';

  if (plannedFinishDate) {
    if (actionType === 'consumed') {
      actualCompletionDate = new Date();
      actualCompletionDate.setHours(0, 0, 0, 0);

      const planned = new Date(plannedFinishDate);
      planned.setHours(0, 0, 0, 0);

      const diffTime = actualCompletionDate - planned;
      daysDifference = Math.round(diffTime / (1000 * 60 * 60 * 24)); // >0 is late, <0 is early, 0 is on-time

      if (daysDifference < 0) {
        consumptionGoalStatus = 'Completed Early';
      } else if (daysDifference === 0) {
        consumptionGoalStatus = 'Completed On Time';
      } else {
        consumptionGoalStatus = 'Completed Late';
      }
    } else if (actionType === 'expired' || (actionType === 'deleted' && new Date(foodItem.expiryDate) < new Date())) {
      consumptionGoalStatus = 'Missed';
    }
  }

  return this.create({
    userId: foodItem.userId,
    foodItemId: foodItem._id,
    itemName: foodItem.itemName,
    category: foodItem.category,
    quantity: foodItem.quantity,
    purchaseDate: foodItem.purchaseDate,
    expiryDate: foodItem.expiryDate,
    storageType: foodItem.storageType,
    status: overrides.status || foodItem.status || actionType,
    actionType,
    plannedFinishDate,
    actualCompletionDate,
    daysDifference,
    consumptionGoalStatus,
    metadata: overrides.metadata || {},
  });
};

module.exports = mongoose.model('History', HistorySchema);
