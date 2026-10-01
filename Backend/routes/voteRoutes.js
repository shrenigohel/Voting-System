const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const { validate } = require("../middleware/validateMiddleware");
const { protect } = require("../middleware/authMiddleware");
const {
  castVote,
  getVoteStatus,
  getMyVotes,
  verifyVote,
} = require("../controllers/voteController");

// POST /api/vote                          — cast a vote (authenticated voter)
router.post(
  "/",
  protect,
  [
    body("electionId").notEmpty().withMessage("Election ID is required"),
    body("candidateId").notEmpty().withMessage("Candidate ID is required"),
  ],
  validate,
  castVote
);

// GET  /api/vote/my-votes                 — voter's own voting history
router.get("/my-votes", protect, getMyVotes);

// GET  /api/vote/status/:electionId       — did I vote in this election?
router.get("/status/:electionId", protect, getVoteStatus);

// GET  /api/vote/verify/:hash             — verify a vote by its hash (public)
router.get("/verify/:hash", verifyVote);

module.exports = router;
