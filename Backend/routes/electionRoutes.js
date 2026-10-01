const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const { validate } = require("../middleware/validateMiddleware");
const { protect, adminOnly, optionalAuth } = require("../middleware/authMiddleware");
const {
  createElection,
  getAllElections,
  getElectionById,
  updateElection,
  deleteElection,
  startElection,
  endElection,
  publishElection,
} = require("../controllers/electionController");

// GET  /api/elections         — public list (published only for non-admins)
router.get("/", optionalAuth, getAllElections);

// GET  /api/elections/:id     — public single election
router.get("/:id", optionalAuth, getElectionById);

// All routes below require admin
// POST /api/elections
router.post(
  "/",
  protect,
  adminOnly,
  [
    body("title").trim().notEmpty().withMessage("Election title is required"),
    body("startDate").isISO8601().withMessage("Valid start date is required"),
    body("endDate").isISO8601().withMessage("Valid end date is required"),
  ],
  validate,
  createElection
);

// PUT  /api/elections/:id
router.put("/:id", protect, adminOnly, updateElection);

// DELETE /api/elections/:id
router.delete("/:id", protect, adminOnly, deleteElection);

// PUT  /api/elections/:id/start
router.put("/:id/start", protect, adminOnly, startElection);

// PUT  /api/elections/:id/end
router.put("/:id/end", protect, adminOnly, endElection);

// PUT  /api/elections/:id/publish
router.put("/:id/publish", protect, adminOnly, publishElection);

module.exports = router;
