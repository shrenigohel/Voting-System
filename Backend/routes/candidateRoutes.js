const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const { validate } = require("../middleware/validateMiddleware");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const {
  addCandidate,
  getAllCandidates,
  getCandidateById,
  updateCandidate,
  deleteCandidate,
} = require("../controllers/candidateController");

// GET  /api/candidates              — list all (optionally filter by ?electionId=)
router.get("/", getAllCandidates);

// GET  /api/candidates/:id          — single candidate
router.get("/:id", getCandidateById);

// POST /api/candidates              — add candidate (Admin)
router.post(
  "/",
  protect,
  adminOnly,
  [
    body("name").trim().notEmpty().withMessage("Candidate name is required"),
    body("party").trim().notEmpty().withMessage("Party name is required"),
    body("electionId").notEmpty().withMessage("Election ID is required"),
  ],
  validate,
  addCandidate
);

// PUT  /api/candidates/:id          — update candidate (Admin)
router.put("/:id", protect, adminOnly, updateCandidate);

// DELETE /api/candidates/:id        — delete candidate (Admin)
router.delete("/:id", protect, adminOnly, deleteCandidate);

module.exports = router;
