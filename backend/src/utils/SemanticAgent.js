// Ontología de Daltonismo y Contenido Visual en RDF/JSON-LD
const daltonismOntology = {
  "@context": {
    cs: "http://colorsense.schema.org/",
    rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
    rdfs: "http://www.w3.org/2000/01/rdf-schema#",
    schema: "http://schema.org/",
  },
  "@graph": [
    {
      "@id": "cs:Daltonism",
      "@type": "rdfs:Class",
      "rdfs:label": "Color Vision Deficiency (Daltonism)",
      "rdfs:comment":
        "A color vision deficiency affecting the perception of colors",
    },
    {
      "@id": "cs:Protanopia",
      "@type": ["rdf:type", "cs:Daltonism"],
      "rdfs:label": "Protanopia",
      "rdfs:comment":
        "Absence of red color perception. Reds appear as salmón/brown",
      "cs:missingComponent": "LongWavelength",
      "cs:perceivedColors": ["Yellow", "Green", "Blue"],
      "cs:colorTransformations": {
        red: "#F35E62",
        orange: "#F35E62",
        yellow: "#FFFF00",
      },
    },
    {
      "@id": "cs:Deuteranopia",
      "@type": ["rdf:type", "cs:Daltonism"],
      "rdfs:label": "Deuteranopia",
      "rdfs:comment": "Absence of green color perception. Greens appear yellow",
      "cs:missingComponent": "MediumWavelength",
      "cs:perceivedColors": ["Red", "Yellow", "Blue"],
      "cs:colorTransformations": {
        green: "#FFFF00",
        red: "#FF0000",
        blue: "#0000FF",
      },
    },
    {
      "@id": "cs:Tritanopia",
      "@type": ["rdf:type", "cs:Daltonism"],
      "rdfs:label": "Tritanopia",
      "rdfs:comment":
        "Absence of blue color perception. Blues appear cyan/green",
      "cs:missingComponent": "ShortWavelength",
      "cs:perceivedColors": ["Red", "Green"],
      "cs:colorTransformations": {
        blue: "#00CFCF",
        red: "#E81B1B",
        purple: "#7A4A42",
      },
    },
    {
      "@id": "cs:VisualContent",
      "@type": "rdfs:Class",
      "rdfs:label": "Visual Content",
      "rdfs:comment": "Any visual element that uses color for information",
    },
    {
      "@id": "cs:ColorAdaptation",
      "@type": "rdfs:Class",
      "rdfs:label": "Color Adaptation",
      "rdfs:comment": "Transformation of a color for accessibility",
    },
    {
      "@id": "cs:semanticDescription",
      "@type": "rdf:Property",
      "rdfs:label": "Semantic Description",
      "rdfs:domain": "cs:VisualContent",
      "rdfs:range": "rdfs:Literal",
    },
    {
      "@id": "cs:originalColor",
      "@type": "rdf:Property",
      "rdfs:label": "Original Color",
      "rdfs:domain": "cs:ColorAdaptation",
      "rdfs:range": "rdfs:Literal",
    },
    {
      "@id": "cs:adaptedColor",
      "@type": "rdf:Property",
      "rdfs:label": "Adapted Color",
      "rdfs:domain": "cs:ColorAdaptation",
      "rdfs:range": "rdfs:Literal",
    },
  ],
};

// Mapeos de transformación de color más precisos
const colorTransformations = {
  protanopia: {
    "#FF0000": "#F35E62", // Red → Salmon
    "#FFA500": "#F35E62", // Orange → Salmon
    "#FFFF00": "#FFFF00", // Yellow → Yellow
    "#00FF00": "#FFFF00", // Green → Yellow
    "#0000FF": "#0000FF", // Blue → Blue
    "#800080": "#800080", // Purple → Purple
  },
  deuteranopia: {
    "#FF0000": "#FF0000", // Red → Red
    "#FFA500": "#FF6600", // Orange → Dark Orange
    "#FFFF00": "#FFAA00", // Yellow → Orange-Yellow
    "#00FF00": "#FFFF00", // Green → Yellow
    "#0000FF": "#0000FF", // Blue → Blue
    "#800080": "#800080", // Purple → Purple
  },
  tritanopia: {
    "#FF0000": "#E81B1B", // Red → Deep Red
    "#FFA500": "#F06C6C", // Orange → Light Red
    "#FFFF00": "#F7A7A7", // Yellow → Pink
    "#00FF00": "#0E6B6B", // Green → Dark Cyan
    "#0000FF": "#00CFCF", // Blue → Cyan
    "#800080": "#7A4A42", // Purple → Brown
  },
};

class SemanticAgent {
  static getDaltonismOntology() {
    return daltonismOntology;
  }

  static getColorTransformations(daltonismType) {
    return (
      colorTransformations[daltonismType] || colorTransformations.tritanopia
    );
  }

  static generateJSONLD(visualElement, daltonismType) {
    const originalColor = visualElement.originalColor || visualElement.color;
    const transformations = this.getColorTransformations(daltonismType);
    const adaptedColor = transformations[originalColor] || originalColor;

    return {
      "@context": {
        "@vocab": "http://schema.org/",
        cs: "http://colorsense.schema.org/",
      },
      "@type": "VisualElement",
      "@id": visualElement.id || `cs:element-${Date.now()}`,
      name: visualElement.label || "Visual Element",
      description: visualElement.description || "",
      color: originalColor,
      "cs:adaptation": {
        "@type": "cs:ColorAdaptation",
        "cs:daltonismType": daltonismType,
        "cs:originalColor": originalColor,
        "cs:adaptedColor": adaptedColor,
        "cs:semanticDescription": this._generateSemanticDescription(
          visualElement,
          daltonismType,
          adaptedColor
        ),
      },
      accessibility: {
        textAlternative:
          visualElement.textAlternative ||
          `Color element: ${visualElement.label}`,
        semanticMeaning: this._inferSemanticMeaning(visualElement),
      },
    };
  }

  static _generateSemanticDescription(element, daltonismType, adaptedColor) {
    const descriptions = {
      protanopia: `For protanopia (red-blindness), this element appears in a salmon/brown tone (${adaptedColor})`,
      deuteranopia: `For deuteranopia (green-blindness), this element appears in a ${adaptedColor} tone`,
      tritanopia: `For tritanopia (blue-blindness), this element appears in a ${adaptedColor} tone`,
    };
    return descriptions[daltonismType] || descriptions.tritanopia;
  }

  static _inferSemanticMeaning(element) {
    // Inferencia simple basada en el label o contenido
    const meanings = {
      success: "Positive/Success state",
      error: "Error/Warning state",
      warning: "Warning/Caution state",
      info: "Information state",
      neutral: "Neutral state",
    };

    for (const [key, value] of Object.entries(meanings)) {
      if (element.label && element.label.toLowerCase().includes(key)) {
        return value;
      }
    }
    return "Visual information element";
  }

  static querySPARQL(query) {
    // Simulación simple de consultas SPARQL
    // En producción, usar un motor como Fuseki o GraphDB

    // Ejemplo: "SELECT ?daltonism WHERE { ?daltonism rdf:type cs:Daltonism }"
    if (query.includes("cs:Daltonism")) {
      return Object.values(daltonismOntology["@graph"]).filter(
        (node) =>
          node["@type"] &&
          (Array.isArray(node["@type"])
            ? node["@type"].includes("cs:Daltonism")
            : node["@type"] === "cs:Daltonism")
      );
    }
    return [];
  }
}

module.exports = SemanticAgent;
