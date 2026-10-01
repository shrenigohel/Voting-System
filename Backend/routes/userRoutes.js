const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  toggleUserStatus,
  resetVoterStatus,
} = require("../controllers/userController");

// All user management routes require admin access
router.use(protect, adminOnly);

// GET    /api/users          — list all users (with pagination + search)
router.get("/", getAllUsers);

// GET    /api/users/:id      — get single user
router.get("/:id", getUserById);

// PUT    /api/users/:id      — update user fields
router.put("/:id", updateUser);

// DELETE /api/users/:id      — delete user
router.delete("/:id", deleteUser);

// PUT    /api/users/:id/toggle-status  — activate / deactivate user
router.put("/:id/toggle-status", toggleUserStatus);

// PUT    /api/users/:id/reset-vote     — clear a voter's hasVoted flag
router.put("/:id/reset-vote", resetVoterStatus);

module.exports = router;
