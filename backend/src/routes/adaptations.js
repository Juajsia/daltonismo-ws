const express = require("express");
const router = express.Router();
const AdaptationController = require("../controllers/AdaptationController");

// POST /api/adapt - Adaptación de contenido
router.post("/", AdaptationController.adaptContent);

// GET /api/ontology/daltonism - Obtener ontología
router.get("/ontology/daltonism", AdaptationController.getDaltonismOntology);

// POST /api/sparql - Consultas SPARQL
router.post("/sparql", AdaptationController.sparqlQuery);

// GET /api/color-transformations/:daltonismType
router.get(
  "/color-transformations/:daltonismType",
  AdaptationController.getColorTransformations
);

module.exports = router;
