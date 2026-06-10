const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  addFood,
  getAllFoods,
  getFood,
  updateFood,
  deleteFood,
  getExpiringFood,
  getExpiredFood,
  getDashboardStats,
  suggestExpiry,
  consumeFood,
} = require("../controllers/foodController");

// All food routes are private
router.use(auth);

// CRUD operations
router.post("/", addFood);
router.get("/", getAllFoods);
router.get("/dashboard/stats", getDashboardStats);
router.get("/expiring/soon", getExpiringFood);
router.get("/expired/list", getExpiredFood);
router.get("/suggest-expiry", suggestExpiry);
router.patch("/:id/consume", consumeFood);
router.get("/:id", getFood);
router.put("/:id", updateFood);
router.delete("/:id", deleteFood);

module.exports = router;
