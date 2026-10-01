const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const { validate } = require("../middleware/validateMiddleware");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const {
  getDashboardStats,
  getAllVotes,
  createAdmin,
  deleteVote,
} = require("../controllers/adminController");

// All admin routes require authentication + admin role
router.use(protect, adminOnly);

// GET    /api/admin/dashboard           — system-wide statistics
router.get("/dashboard", getDashboardStats);

// GET    /api/admin/votes               — all votes (filter by ?electionId=)
router.get("/votes", getAllVotes);

// DELETE /api/admin/votes/:id           — remove a specific vote (audit/correction)
router.delete("/votes/:id", deleteVote);

// POST   /api/admin/create-admin        — create another admin account
router.post(
  "/create-admin",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  validate,
  createAdmin
);

module.exports = router;
