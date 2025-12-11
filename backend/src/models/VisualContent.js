const mongoose = require("mongoose");

const VisualContentSchema = new mongoose.Schema({
  contentId: {
    type: String,
    unique: true,
    required: true,
    index: true,
  },
  contentType: {
    type: String,
    enum: ["image", "element", "chart", "graph", "custom"],
    required: true,
  },
  originalDescription: String,
  colors: [
    {
      hex: String,
      rgb: String,
      hsl: String,
      label: String,
      prominence: {
        type: Number,
        min: 0,
        max: 100,
      },
    },
  ],
  semanticAnnotations: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  adaptations: {
    protanopia: [
      {
        originalColor: String,
        adaptedColor: String,
        description: String,
      },
    ],
    deuteranopia: [
      {
        originalColor: String,
        adaptedColor: String,
        description: String,
      },
    ],
    tritanopia: [
      {
        originalColor: String,
        adaptedColor: String,
        description: String,
      },
    ],
  },
  jsonld: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("VisualContent", VisualContentSchema);
