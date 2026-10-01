const express = require("express");
const router = express.Router();
const { protect, adminOnly, optionalAuth } = require("../middleware/authMiddleware");
const {
  getElectionResults,
  getAllResults,
  getLiveResults,
} = require("../controllers/resultController");

// GET  /api/results                        — all ended elections summary (public)
router.get("/", getAllResults);

// GET  /api/results/:electionId            — full results for one election (public after end)
router.get("/:electionId", optionalAuth, getElectionResults);

// GET  /api/results/:electionId/live       — live vote counts (admin only)
router.get("/:electionId/live", protect, adminOnly, getLiveResults);

module.exports = router;
