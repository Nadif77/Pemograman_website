// routes/userRoutes.js
const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/authMiddleware");

// Get students list (teachers/admin only - but since this dashboard is admin only, it's effectively admin only now)
router.get(
  "/",
  authenticateToken,
  authorizeRoles("admin"), // Restrict to admin in this simplified version
  userController.getStudents
);

// Add a new student (Admin Only)
router.post(
  "/",
  authenticateToken,
  authorizeRoles("admin"),
  userController.addStudent
);

// Update an existing student (Admin Only)
router.put(
  "/:id",
  authenticateToken,
  authorizeRoles("admin"),
  userController.updateStudent
);

// Delete a student (Admin Only)
router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles("admin"),
  userController.deleteStudent
);

module.exports = router;
