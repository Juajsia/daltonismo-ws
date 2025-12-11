const mongoose = require("mongoose");

const UserProfileSchema = new mongoose.Schema({
  userId: {
    type: String,
    unique: true,
    required: true,
    index: true,
  },
  email: String,
  daltonismType: {
    type: String,
    enum: ["normal", "protanopia", "deuteranopia", "tritanopia"],
    default: "normal",
  },
  preferences: {
    contrastLevel: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    fontSize: {
      type: Number,
      min: 12,
      max: 32,
      default: 16,
    },
    colorScheme: {
      type: String,
      enum: ["light", "dark", "auto"],
      default: "auto",
    },
    enableTextAlternatives: {
      type: Boolean,
      default: true,
    },
  },
  adaptationHistory: [
    {
      timestamp: {
        type: Date,
        default: Date.now,
      },
      elementId: String,
      elementType: String,
      originalColor: String,
      adaptedColor: String,
      daltonismTypeUsed: String,
      userFeedback: {
        type: String,
        enum: ["helpful", "not_helpful", "neutral"],
        default: "neutral",
      },
    },
  ],
  semanticMetadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Índices para búsquedas frecuentes
UserProfileSchema.index({ userId: 1, createdAt: -1 });
UserProfileSchema.index({ "adaptationHistory.timestamp": -1 });

module.exports = mongoose.model("UserProfile", UserProfileSchema);
