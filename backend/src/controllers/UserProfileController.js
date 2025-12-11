const UserProfile = require("../models/UserProfile");
const { v4: uuidv4 } = require("uuid");

class UserProfileController {
  // GET /api/profiles/:userId
  static async getProfile(req, res) {
    try {
      const { userId } = req.params;
      const profile = await UserProfile.findOne({ userId });

      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }

      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // POST /api/profiles
  static async createProfile(req, res) {
    try {
      const { userId, email, daltonismType, preferences } = req.body;

      const existingProfile = await UserProfile.findOne({ userId });
      if (existingProfile) {
        return res.status(400).json({ error: "Profile already exists" });
      }

      const profile = new UserProfile({
        userId: userId || uuidv4(),
        email,
        daltonismType: daltonismType || "normal",
        preferences: preferences || {},
      });

      await profile.save();
      res.status(201).json(profile);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // PUT /api/profiles/:userId
  static async updateProfile(req, res) {
    try {
      const { userId } = req.params;
      const updateData = req.body;

      updateData.updatedAt = new Date();

      const profile = await UserProfile.findOneAndUpdate(
        { userId },
        updateData,
        { new: true, runValidators: true }
      );

      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }

      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // POST /api/profiles/:userId/adaptation-feedback
  static async recordAdaptationFeedback(req, res) {
    try {
      const { userId } = req.params;
      const {
        elementId,
        elementType,
        originalColor,
        adaptedColor,
        userFeedback,
      } = req.body;

      const profile = await UserProfile.findOne({ userId });
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }

      profile.adaptationHistory.push({
        elementId,
        elementType,
        originalColor,
        adaptedColor,
        daltonismTypeUsed: profile.daltonismType,
        userFeedback: userFeedback || "neutral",
      });

      await profile.save();
      res.json({ message: "Feedback recorded", profile });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // GET /api/profiles/:userId/stats
  static async getProfileStats(req, res) {
    try {
      const { userId } = req.params;
      const profile = await UserProfile.findOne({ userId });

      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }

      const stats = {
        totalAdaptations: profile.adaptationHistory.length,
        helpfulAdaptations: profile.adaptationHistory.filter(
          (a) => a.userFeedback === "helpful"
        ).length,
        mostAdaptedElementType: this._getMostCommon(
          profile.adaptationHistory.map((a) => a.elementType)
        ),
        daltonismType: profile.daltonismType,
        preferences: profile.preferences,
      };

      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static _getMostCommon(array) {
    if (!array.length) return null;
    const freq = {};
    array.forEach((item) => {
      freq[item] = (freq[item] || 0) + 1;
    });
    return Object.keys(freq).reduce((a, b) => (freq[a] > freq[b] ? a : b));
  }
}

module.exports = UserProfileController;
