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
} = require("../controllers/foodController");

// All food routes are private
router.use(auth);

// CRUD operations
router.post("/add", addFood);
router.get("/", getAllFoods);
router.get("/dashboard/stats", getDashboardStats);
router.get("/expiring/soon", getExpiringFood);
router.get("/expired/list", getExpiredFood);
router.get("/:id", getFood);
router.put("/:id", updateFood);
router.delete("/:id", deleteFood);

module.exports = router;
