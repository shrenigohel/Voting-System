require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

// Routes
const authRoutes      = require("./routes/authRoutes");
const userRoutes      = require("./routes/userRoutes");
const candidateRoutes = require("./routes/candidateRoutes");
const electionRoutes  = require("./routes/electionRoutes");
const voteRoutes      = require("./routes/voteRoutes");
const resultRoutes    = require("./routes/resultRoutes");
const adminRoutes     = require("./routes/adminRoutes");

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Voting System API is running", timestamp: new Date() });
});

// API Routes
app.use("/api/auth",       authRoutes);
app.use("/api/users",      userRoutes);
app.use("/api/candidates", candidateRoutes);
app.use("/api/elections",  electionRoutes);
app.use("/api/vote",       voteRoutes);
app.use("/api/results",    resultRoutes);
app.use("/api/admin",      adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🗳️  Voting System API running on port ${PORT}`);
  console.log(`📋 Environment: ${process.env.NODE_ENV}`);
});

