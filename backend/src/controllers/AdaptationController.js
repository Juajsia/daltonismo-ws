const UserProfile = require("../models/UserProfile");
const SemanticAgent = require("../utils/SemanticAgent");

class AdaptationController {
  // POST /api/adapt
  // Endpoint principal para adaptación de colores
  static async adaptContent(req, res) {
    try {
      const { userProfile, elements, context } = req.body;

      // Validar entrada
      if (!userProfile || !userProfile.daltonismType) {
        return res.status(400).json({ error: "Invalid user profile" });
      }

      if (!Array.isArray(elements)) {
        return res.status(400).json({ error: "Elements must be an array" });
      }

      // Obtener o crear perfil en BD
      let profile = await UserProfile.findOne({ userId: userProfile.userId });
      if (!profile) {
        profile = new UserProfile(userProfile);
        await profile.save();
      } else {
        // If an existing profile is found, ensure we persist the daltonismType and preferences
        // provided by the incoming userProfile so subsequent calls reflect the user's selection.
        let mustSave = false;
        if (
          userProfile.daltonismType &&
          profile.daltonismType !== userProfile.daltonismType
        ) {
          profile.daltonismType = userProfile.daltonismType;
          mustSave = true;
        }
        if (
          userProfile.preferences &&
          typeof userProfile.preferences === "object"
        ) {
          profile.preferences = {
            ...(profile.preferences || {}),
            ...userProfile.preferences,
          };
          mustSave = true;
        }
        if (mustSave) await profile.save();
      }

      // Aplicar adaptaciones usando el Agente Semántico
      const adaptedElements = elements.map((element) => {
        const jsonld = SemanticAgent.generateJSONLD(
          element,
          userProfile.daltonismType
        );
        return {
          ...jsonld,
          "@context": {
            "@vocab": "http://schema.org/",
            cs: "http://colorsense.schema.org/",
          },
        };
      });

      // Registrar adaptación en historial
      const adaptationEvent = {
        elementId: elements.map((e) => e.id).join(","),
        elementType: elements[0]?.type || "mixed",
        originalColor: elements.map((e) => e.originalColor).join(","),
        adaptedColor: adaptedElements
          .map((e) => e.cs?.adaptation?.cs?.adaptedColor)
          .join(","),
        daltonismTypeUsed: userProfile.daltonismType,
      };

      profile.adaptationHistory.push(adaptationEvent);
      await profile.save();

      // Respuesta con contexto JSON-LD
      const response = {
        "@context": "http://schema.org",
        "@type": "AdaptationResult",
        adaptedElements: adaptedElements,
        meta: {
          engine: "color-sense-semantic-v2",
          profileUsed: profile.userId,
          daltonismType: userProfile.daltonismType,
          // Return lightweight profile snapshot so clients can sync their local state
          profile: {
            userId: profile.userId,
            daltonismType: profile.daltonismType,
            preferences: profile.preferences,
          },
          timestamp: new Date().toISOString(),
          ontologyVersion: "2.0",
        },
        semanticMetadata: {
          ontology: SemanticAgent.getDaltonismOntology(),
          totalElements: adaptedElements.length,
        },
      };

      res.json(response);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // GET /api/ontology/daltonism
  static async getDaltonismOntology(req, res) {
    try {
      const ontology = SemanticAgent.getDaltonismOntology();
      res.json(ontology);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // POST /api/sparql
  // Endpoint para consultas SPARQL simples
  static async sparqlQuery(req, res) {
    try {
      const { query } = req.body;

      if (!query) {
        return res.status(400).json({ error: "Query parameter required" });
      }

      const results = SemanticAgent.querySPARQL(query);

      res.json({
        "@context": "http://www.w3.org/ns/sparql-results-json",
        results: {
          bindings: results,
        },
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // GET /api/color-transformations/:daltonismType
  static async getColorTransformations(req, res) {
    try {
      const { daltonismType } = req.params;

      if (
        !["protanopia", "deuteranopia", "tritanopia"].includes(daltonismType)
      ) {
        return res.status(400).json({ error: "Invalid daltonism type" });
      }

      const transformations =
        SemanticAgent.getColorTransformations(daltonismType);

      res.json({
        daltonismType: daltonismType,
        transformations: transformations,
        // description: this._getDaltonismDescription(daltonismType),
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static _getDaltonismDescription(type) {
    const descriptions = {
      protanopia: "Absence of red color perception (Red-blindness)",
      deuteranopia: "Absence of green color perception (Green-blindness)",
      tritanopia: "Absence of blue color perception (Blue-yellowness)",
    };
    return descriptions[type] || "Unknown daltonism type";
  }
}

module.exports = AdaptationController;
