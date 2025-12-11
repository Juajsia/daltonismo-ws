/**
 * Agente Semántico Local (Cliente)
 * Responsable de:
 * - Detectar contenido visual
 * - Comunicar con el servidor semántico
 * - Aplicar transformaciones de color
 * - Mejorar accesibilidad
 */

class LocalSemanticAgent {
  constructor(serverUrl = "http://localhost:3000") {
    this.serverUrl = serverUrl;
    this.cache = new Map();
    this.currentDaltonismType = "normal";
    this.userProfile = null;
  }

  /**
   * Inicializar el agente y cargar perfil del usuario
   */
  async initialize(userId) {
    try {
      const response = await fetch(`${this.serverUrl}/api/profiles/${userId}`);
      if (response.ok) {
        this.userProfile = await response.json();
        this.currentDaltonismType =
          this.userProfile.daltonismType || this.currentDaltonismType;
        console.log("✅ Agente Local: Perfil cargado", this.userProfile);
      } else if (response.status === 404) {
        // Profile not found on server: create one so future calls persist state
        console.log(
          "ℹ️ Agente Local: Perfil no encontrado en servidor — creando uno nuevo"
        );
        const createRes = await fetch(`${this.serverUrl}/api/profiles`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            daltonismType: this.currentDaltonismType,
          }),
        });
        if (createRes.ok) {
          this.userProfile = await createRes.json();
          this.currentDaltonismType =
            this.userProfile.daltonismType || this.currentDaltonismType;
          console.log("✅ Agente Local: Perfil creado", this.userProfile);
        } else {
          console.warn(
            "⚠️ Agente Local: No se pudo crear perfil en servidor, usando perfil temporal"
          );
          this.userProfile = {
            userId: userId || `user-${Date.now()}`,
            daltonismType: this.currentDaltonismType,
            preferences: {},
          };
        }
      }
    } catch (error) {
      console.warn(
        "⚠️ Agente Local: No se pudo cargar el perfil - fallback local",
        error
      );
      // Crear perfil temporal si no existe
      this.userProfile = {
        userId: userId || `user-${Date.now()}`,
        daltonismType: this.currentDaltonismType || "normal",
        preferences: {},
      };
    }
  }

  /**
   * Adaptar contenido visual usando el servidor semántico
   */
  async adaptVisualContent(elements, daltonismType = null) {
    const type = daltonismType || this.currentDaltonismType;

    const payload = {
      userProfile: {
        userId: this.userProfile.userId,
        daltonismType: type,
        preferences: this.userProfile.preferences,
      },
      elements: elements,
      context: {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      },
    };

    try {
      const response = await fetch(`${this.serverUrl}/api/adapt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      // Keep agent state aligned with the type used for this adaptation
      this.currentDaltonismType = type;
      // If server returned a profile snapshot, sync it locally
      if (result && result.meta && result.meta.profile) {
        this.userProfile = result.meta.profile;
        this.currentDaltonismType =
          this.userProfile.daltonismType || this.currentDaltonismType;
      } else if (this.userProfile) {
        this.userProfile.daltonismType = type;
      }
      this.cache.set(`${type}-${elements.length}`, result);
      return result;
    } catch (error) {
      console.error("❌ Agente Local: Error en adaptación", error);
      // Fallback: usar transformaciones locales
      return this._localFallbackAdaptation(elements, type);
    }
  }

  /**
   * Obtener la ontología de daltonismo
   */
  async getOntology() {
    try {
      const response = await fetch(
        `${this.serverUrl}/api/adapt/ontology/daltonism`
      );
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error("❌ No se pudo obtener la ontología:", error);
    }
    return null;
  }

  /**
   * Obtener transformaciones de color para un tipo de daltonismo
   */
  async getColorTransformations(daltonismType) {
    try {
      const response = await fetch(
        `${this.serverUrl}/api/adapt/color-transformations/${daltonismType}`
      );
      if (response.ok) {
        const data = await response.json();
        return data.transformations;
      }
    } catch (error) {
      console.error("❌ No se pudieron obtener transformaciones:", error);
    }
    return {};
  }

  /**
   * Registrar feedback del usuario
   */
  async recordFeedback(
    elementId,
    elementType,
    originalColor,
    adaptedColor,
    feedback
  ) {
    try {
      await fetch(
        `${this.serverUrl}/api/profiles/${this.userProfile.userId}/adaptation-feedback`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            elementId,
            elementType,
            originalColor,
            adaptedColor,
            userFeedback: feedback,
          }),
        }
      );
    } catch (error) {
      console.error("❌ Error registrando feedback:", error);
    }
  }

  /**
   * Embeber JSON-LD en un elemento
   */
  embedJSONLD(element, metadata) {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(metadata);
    element.appendChild(script);
  }

  /**
   * Mejorar labels ARIA para accesibilidad
   */
  improveAria(element, metadata) {
    if (metadata["accessibility"]) {
      const textAlt = metadata["accessibility"]["textAlternative"];
      if (textAlt) {
        element.setAttribute("aria-label", textAlt);
        element.setAttribute("role", "img");
      }
    }
  }

  /**
   * Fallback local si el servidor no responde
   */
  _localFallbackAdaptation(elements, daltonismType) {
    const transformations = {
      protanopia: {
        "#FF0000": "#F35E62",
        "#FFA500": "#F35E62",
        "#FFFF00": "#FFFF00",
        "#00FF00": "#FFFF00",
        "#0000FF": "#0000FF",
        "#800080": "#800080",
      },
      deuteranopia: {
        "#FF0000": "#FF0000",
        "#FFA500": "#FF6600",
        "#FFFF00": "#FFAA00",
        "#00FF00": "#FFFF00",
        "#0000FF": "#0000FF",
        "#800080": "#800080",
      },
      tritanopia: {
        "#FF0000": "#E81B1B",
        "#FFA500": "#F06C6C",
        "#FFFF00": "#F7A7A7",
        "#00FF00": "#0E6B6B",
        "#0000FF": "#00CFCF",
        "#800080": "#7A4A42",
      },
    };

    const trans = transformations[daltonismType] || {};
    return {
      adaptedElements: elements.map((el) => ({
        ...el,
        adaptedColor: trans[el.originalColor] || el.originalColor,
      })),
    };
  }
}

// Exportar para uso en el navegador

// Exportar para uso en el navegador
window.LocalSemanticAgent = LocalSemanticAgent;

/* ------------------------
   Small test harness for the frontend 'Agent Tester' UI
   - binds to buttons added in index.html
   - provides quick actions: initialize, adapt, ontology, transformations, feedback
   - prints pretty JSON to #agentOutput
   ------------------------ */

function _prettyPrint(target, obj) {
  const el =
    typeof target === "string" ? document.getElementById(target) : target;
  if (!el) return;
  try {
    el.textContent = JSON.stringify(obj, null, 2);
  } catch (e) {
    el.textContent = String(obj);
  }
}

function _collectTestElements() {
  // combine color-card elements and bar elements for a realistic payload
  const cards = Array.from(document.querySelectorAll(".color-card")).map(
    (c) => ({
      "@type": "VisualElement",
      id: (c.getAttribute("data-label") || "").toLowerCase(),
      label: c.getAttribute("data-label") || "",
      originalColor:
        c.getAttribute("data-original-color") || c.style.backgroundColor || "",
    })
  );

  const bars = Array.from(document.querySelectorAll(".bar")).map((b) => ({
    "@type": "VisualElement",
    id: (b.dataset.label || "").toLowerCase(),
    label: b.dataset.label || "",
    originalColor: b.dataset.color || b.style.backgroundColor || "",
  }));

  // merge and dedupe by id
  const merged = [...cards, ...bars];
  const seen = new Set();
  return merged.filter((x) => {
    if (!x.id) return true; // keep unnamed elements
    if (seen.has(x.id)) return false;
    seen.add(x.id);
    return true;
  });
}

// Wait for DOM to be ready and wire the tester controls if present
document.addEventListener("DOMContentLoaded", () => {
  const initBtn = document.getElementById("agentInitBtn");
  const adaptBtn = document.getElementById("agentAdaptBtn");
  const ontBtn = document.getElementById("agentOntBtn");
  const transBtn = document.getElementById("agentTransBtn");
  const fbBtn = document.getElementById("agentFeedbackBtn");
  const out = document.getElementById("agentOutput");
  const userIdInput = document.getElementById("agentUserId");

  if (!out || !initBtn) return; // not in this page

  // create a shared agent instance
  const agent = new LocalSemanticAgent();

  initBtn.addEventListener("click", async () => {
    const userId = (userIdInput && userIdInput.value) || `user-${Date.now()}`;
    _prettyPrint(out, { status: "initializing", userId });
    await agent.initialize(userId);
    _prettyPrint(out, {
      status: "initialized",
      profile: agent.userProfile || null,
    });
  });

  adaptBtn.addEventListener("click", async () => {
    // ensure agent has a profile before adapting (auto-init with input userId)
    if (!agent.userProfile) {
      const uid = (userIdInput && userIdInput.value) || `demo`;
      _prettyPrint(out, { status: "auto-initializing", userId: uid });
      await agent.initialize(uid);
    }
    const elts = _collectTestElements();
    _prettyPrint(out, {
      status: "sending-adapt-request",
      elementsCount: elts.length,
    });
    const result = await agent.adaptVisualContent(elts);
    _prettyPrint(out, { status: "adaptation-result", result });
  });

  ontBtn.addEventListener("click", async () => {
    _prettyPrint(out, { status: "fetching-ontology" });
    const ont = await agent.getOntology();
    _prettyPrint(out, { status: "ontology", ontology: ont });
  });

  transBtn.addEventListener("click", async () => {
    const type = agent.currentDaltonismType || "tritanopia";
    _prettyPrint(out, { status: "fetching-transformations", type });
    const t = await agent.getColorTransformations(type);
    _prettyPrint(out, { status: "transformations", type, transformations: t });
  });

  fbBtn.addEventListener("click", async () => {
    const elts = _collectTestElements();
    const sample = elts[0] || {
      id: "demo",
      label: "demo",
      originalColor: "#FF0000",
    };
    _prettyPrint(out, { status: "sending-feedback", sample });
    try {
      await agent.recordFeedback(
        sample.id || "demo",
        "VisualElement",
        sample.originalColor,
        "#00FF00",
        "looks better"
      );
      _prettyPrint(out, { status: "feedback-sent" });
    } catch (e) {
      _prettyPrint(out, { status: "feedback-error", error: String(e) });
    }
  });
});
