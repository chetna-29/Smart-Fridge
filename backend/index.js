require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// Import routes
const authRoutes = require("./routes/auth");
const foodRoutes = require("./routes/food");
const historyRoutes = require("./routes/history");
const referenceRoutes = require("./routes/reference");
const aiRoutes = require("./routes/ai");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✓ MongoDB Connected"))
  .catch((err) => {
    console.error("✗ MongoDB connection error:", err.message);
    process.exit(1);
  });

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/food", foodRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/reference", referenceRoutes);
app.use("/api/ai", aiRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Smart Fridge API Running",
    version: "1.0.0",
    endpoints: {
      auth: [
        "POST /api/auth/register",
        "POST /api/auth/login",
        "POST /api/auth/logout",
        "GET /api/auth/me",
      ],
      food: [
        "POST /api/food",
        "GET /api/food",
        "GET /api/food/:id",
        "PATCH /api/food/:id/consume",
        "PUT /api/food/:id",
        "DELETE /api/food/:id",
        "GET /api/food/expiring/soon",
        "GET /api/food/expired/list",
        "GET /api/food/dashboard/stats",
        "GET /api/food/suggest-expiry",
      ],
      history: [
        "GET /api/history",
        "GET /api/history/stats",
        "GET /api/history/export",
        "GET /api/history/recent",
      ],
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || "development"}`);
});