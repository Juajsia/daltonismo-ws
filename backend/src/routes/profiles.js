const express = require("express");
const router = express.Router();
const UserProfileController = require("../controllers/UserProfileController");

// GET /api/profiles/:userId
router.get("/:userId", UserProfileController.getProfile);

// POST /api/profiles
router.post("/", UserProfileController.createProfile);

// PUT /api/profiles/:userId
router.put("/:userId", UserProfileController.updateProfile);

// POST /api/profiles/:userId/adaptation-feedback
router.post(
  "/:userId/adaptation-feedback",
  UserProfileController.recordAdaptationFeedback
);

// GET /api/profiles/:userId/stats
router.get("/:userId/stats", UserProfileController.getProfileStats);

module.exports = router;
