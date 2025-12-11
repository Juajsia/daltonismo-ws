require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

// Rutas
const profileRoutes = require("./routes/profiles");
const adaptationRoutes = require("./routes/adaptations");

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/color-sense";

// Middleware
app.use(
  cors({
    origin: (process.env.CORS_ORIGIN || "http://localhost:3000").split(","),
    credentials: true,
  })
);
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Conexión a MongoDB
mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ MongoDB connected");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Rutas API
app.use("/api/profiles", profileRoutes);
app.use("/api/adapt", adaptationRoutes);
app.post("/api/adapt", adaptationRoutes.stack[0].handle);

// Ruta raíz
app.get("/", (req, res) => {
  res.json({
    name: "Color Sense Backend",
    version: "2.0.0",
    description: "MVC + MongoDB + Semantic Web",
    endpoints: {
      "POST /api/adapt": "Adapt visual content for color blindness",
      "GET /api/ontology/daltonism": "Get daltonism ontology",
      "POST /api/sparql": "Execute SPARQL queries",
      "GET /api/profiles/:userId": "Get user profile",
      "POST /api/profiles": "Create user profile",
      "PUT /api/profiles/:userId": "Update user profile",
      "GET /api/profiles/:userId/stats": "Get profile statistics",
    },
  });
});

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Manejo de errores general
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`\n🚀 Color Sense Backend running on http://localhost:${PORT}`);
  console.log(`📊 MongoDB: ${MONGO_URI}`);
  console.log(
    `🌐 CORS origins: ${process.env.CORS_ORIGIN || "http://localhost:3000"}\n`
  );
});

module.exports = app;
