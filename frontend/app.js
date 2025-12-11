// Color Sense - frontend demo
const adaptBtn = document.getElementById("adaptBtn");
const tritanOnlyBtn = document.getElementById("tritanOnlyBtn");
const output = document.getElementById("output");
const daltonSelect = document.getElementById("daltonType");

// Use the singleton agent if available
const semanticAgent =
  window.semanticAgent ||
  (window.LocalSemanticAgent ? new window.LocalSemanticAgent() : null);

function collectElements() {
  // Collect color cards
  const cards = Array.from(
    document.querySelectorAll(".color-card, .demo-box")
  ).map((c) => ({
    "@type": "VisualElement",
    id: (c.getAttribute("data-label") || "").toLowerCase(),
    label: c.getAttribute("data-label") || "",
    originalColor:
      c.getAttribute("data-original-color") ||
      c.getAttribute("data-color") ||
      "",
  }));

  // Collect stripes
  const stripes = Array.from(document.querySelectorAll(".flag .stripe")).map(
    (s) => ({
      "@type": "VisualElement",
      id: (
        s.getAttribute("data-label") ||
        s.getAttribute("data-original-color") ||
        ""
      ).toLowerCase(),
      label: s.getAttribute("data-label") || "",
      originalColor: s.getAttribute("data-original-color") || "",
    })
  );

  // Collect bars
  const bars = Array.from(document.querySelectorAll(".bar")).map((b) => ({
    "@type": "VisualElement",
    id: (b.dataset.label || "").toLowerCase(),
    label: b.dataset.label || "",
    originalColor: b.dataset.color || "",
  }));

  // Merge and dedupe by id
  const merged = [...cards, ...stripes, ...bars];
  const seen = new Set();
  return merged.filter((x) => {
    if (!x.id) return true;
    if (seen.has(x.id)) return false;
    seen.add(x.id);
    return true;
  });
}

// When the user changes the daltonism selection, update UI and persist via agent
if (daltonSelect) {
  daltonSelect.addEventListener("change", async () => {
    const val = daltonSelect.value;
    if (val === "normal") {
      restoreOriginalColors();
    } else {
      updateColorCards(val);
    }

    if (semanticAgent) {
      try {
        semanticAgent.currentDaltonismType = val;
        const elements = collectElements();
        const res = await semanticAgent.adaptVisualContent(elements, val);
        if (res && res.adaptedElements)
          applyAdaptations(res.adaptedElements || []);
        if (output) output.textContent = JSON.stringify(res, null, 2);
      } catch (e) {
        console.warn("Error applying adaptation on daltonType change", e);
      }
    }
  });
}

function _extractAdaptedColor(a) {
  if (!a) return null;
  if (a.adaptedColor) return a.adaptedColor;
  if (a["cs:adaptation"]) {
    const cs = a["cs:adaptation"];
    return cs["cs:adaptedColor"] || cs.adaptedColor || null;
  }
  if (a["cs:adaptedColor"]) return a["cs:adaptedColor"];
  return null;
}

function applyAdaptations(adaptedElements) {
  adaptedElements.forEach((a) => {
    const adaptedColor = _extractAdaptedColor(a);
    const id = (a.id || a["@id"] || a.name || a.label || "")
      .toString()
      .toLowerCase();

    if (!adaptedColor) return;

    // Try to find a color-card by data-label
    // match any element that has a data-label attribute
    const labeled = Array.from(document.querySelectorAll("[data-label]")).find(
      (c) => (c.getAttribute("data-label") || "").toLowerCase() === id
    );
    const card =
      labeled ||
      Array.from(document.querySelectorAll(".color-card")).find(
        (c) => (c.getAttribute("data-label") || "").toLowerCase() === id
      );
    if (card) {
      card.style.backgroundColor = adaptedColor;
      card.setAttribute(
        "aria-label",
        (card.getAttribute("data-label") || "") + " - adaptado"
      );
      card.title =
        a.description ||
        a["cs:adaptation"]?.["cs:semanticDescription"] ||
        "Adaptado";
      return;
    }

    // Try bars
    const bar = Array.from(document.querySelectorAll(".bar")).find(
      (b) => (b.dataset.label || "").toLowerCase() === id
    );
    if (bar) {
      bar.style.backgroundColor = adaptedColor;
      bar.setAttribute("aria-label", (bar.dataset.label || "") + " - adaptado");
      bar.title = a.description || "Adaptado";
      return;
    }

    // Try stripes (match by original color or indexless label)
    const stripes = Array.from(document.querySelectorAll(".flag .stripe"));
    const stripeByColor = stripes.find(
      (s) =>
        (s.getAttribute("data-original-color") || "").toLowerCase() ===
        (
          a.color ||
          a["cs:adaptation"]?.["cs:originalColor"] ||
          ""
        ).toLowerCase()
    );
    if (stripeByColor) {
      stripeByColor.style.backgroundColor = adaptedColor;
      stripeByColor.title = a.description || "Adaptado";
      return;
    }

    // If we couldn't match by id or label, ignore
  });
}
const colorblindFilters = {
  normal: (r, g, b) => ({ r, g, b }),

  protanopia: (r, g, b) => {
    // Daltonismo rojo (ausencia de rojo) - Simula visión con solo verde y azul
    // Los rojos se ven amarillentos/marrones, verdes se ven amarillos
    return {
      r: Math.round(0.567 * r + 0.433 * g),
      g: Math.round(0.558 * r + 0.442 * g),
      b: Math.round(0.242 * r + 0.742 * b),
    };
  },

  deuteranopia: (r, g, b) => {
    // Daltonismo verde (ausencia de verde) - Simula visión con solo rojo y azul
    // Los verdes se ven amarillos, los colores se desplazan hacia rojo-azul
    return {
      r: Math.round(0.625 * r + 0.375 * g),
      g: Math.round(0.7 * r + 0.3 * g),
      b: Math.round(0.3 * b + 0.7 * b),
    };
  },

  tritanopia: (r, g, b) => {
    // Daltonismo azul (ausencia de azul) - Solo perciben rojo y verde
    // Azul → Cian/Verde oscuro, Rojo → Rojo/Rosa, Amarillo → Amarillo claro
    // Verde → Cian, Morado → Rojo oscuro/Marrón
    return {
      r: Math.round(r * 0.95),
      g: Math.round(g * 0.5 + b * 0.9),
      b: Math.round(b * 0.3),
    };
  },
};

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function rgbToHex(r, g, b) {
  return (
    "#" +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
      .toUpperCase()
  );
}

function applyColorblindFilter(hexColor, filterType = "normal") {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return hexColor;

  const filtered = colorblindFilters[filterType](rgb.r, rgb.g, rgb.b);
  return rgbToHex(filtered.r, filtered.g, filtered.b);
}

let currentFilter = "normal";

function updateColorCards(filterType = "normal") {
  currentFilter = filterType;
  const cards = document.querySelectorAll(".color-card, .demo-box");

  cards.forEach((card) => {
    const originalColor =
      card.getAttribute("data-original-color") ||
      card.getAttribute("data-color");
    if (!originalColor) return;

    if (filterType === "normal") {
      // restore original declared color
      card.style.backgroundColor = originalColor;
      return;
    }

    let adaptedColor;
    // If tritanopia and an explicit tritan color is provided, use it
    if (filterType === "tritanopia" && card.getAttribute("data-tritan-color")) {
      adaptedColor = card.getAttribute("data-tritan-color");
    } else {
      adaptedColor = applyColorblindFilter(originalColor, filterType);
    }
    card.style.backgroundColor = adaptedColor;
  });

  // Also update any simulated flag stripes
  const stripes = document.querySelectorAll(".flag .stripe");
  stripes.forEach((s) => {
    const original = s.getAttribute("data-original-color");
    if (!original) return;
    if (filterType === "normal") {
      s.style.backgroundColor = original;
      return;
    }
    let adapted;
    if (filterType === "tritanopia" && s.getAttribute("data-tritan-color")) {
      adapted = s.getAttribute("data-tritan-color");
    } else {
      adapted = applyColorblindFilter(original, filterType);
    }
    s.style.backgroundColor = adapted;
  });
}

function restoreOriginalColors() {
  // restore color-cards / demo-boxes
  const cards = document.querySelectorAll(".color-card, .demo-box");
  cards.forEach((c) => {
    const orig =
      c.getAttribute("data-original-color") || c.getAttribute("data-color");
    if (orig) c.style.backgroundColor = orig;
  });

  // restore stripes
  const stripes = document.querySelectorAll(".flag .stripe");
  stripes.forEach((s) => {
    const orig = s.getAttribute("data-original-color");
    if (orig) s.style.backgroundColor = orig;
  });

  // restore bars
  const bars = document.querySelectorAll(".bar");
  bars.forEach((b) => {
    const orig = b.getAttribute("data-color") || b.dataset.color;
    if (orig) b.style.backgroundColor = orig;
  });
}

// Prefer LocalSemanticAgent when available for testing; fallback to server POST
adaptBtn.addEventListener("click", async () => {
  const profile = {
    userId: "demo",
    daltonismType: daltonSelect.value,
    preferences: { contrastLevel: "high" },
  };

  const elements = collectElements();

  output.textContent = "Cargando...";

  try {
    const agent =
      semanticAgent ||
      (window.LocalSemanticAgent ? new window.LocalSemanticAgent() : null);
    if (agent) {
      // initialize agent (will create server profile if missing)
      await agent.initialize(profile.userId);
      // ensure agent knows the requested type
      agent.currentDaltonismType = profile.daltonismType;

      const result = await agent.adaptVisualContent(
        elements,
        profile.daltonismType
      );
      output.textContent = JSON.stringify(result, null, 2);

      // start autonomous monitoring before applying styles so mutations are captured
      agent.startAutonomy("agentOutput");
      // apply returned adaptations to the DOM so user sees the changes
      applyAdaptations(result.adaptedElements || []);

      return;
    }

    // fallback: call server endpoint directly
    const payload = {
      "@context": "http://schema.org",
      url: window.location.href,
      userProfile: profile,
      elements: elements,
    };

    const res = await fetch("http://localhost:3000/api/adapt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    output.textContent = JSON.stringify(data, null, 2);
    applyAdaptations(data.adaptedElements || []);
  } catch (err) {
    output.textContent =
      "Error: " +
      err.message +
      "\n\n" +
      JSON.stringify({ userProfile: profile, elements }, null, 2);
  }
});

// Initialize agent and UI on page load
document.addEventListener("DOMContentLoaded", async () => {
  if (!semanticAgent) return;

  const userIdInput = document.getElementById("agentUserId");
  const uid = (userIdInput && userIdInput.value) || "demo";

  try {
    await semanticAgent.initialize(uid);
  } catch (e) {
    console.warn("Agent init error", e);
  }

  // Sync UI dalton selection with profile
  const type =
    semanticAgent.currentDaltonismType ||
    (semanticAgent.userProfile && semanticAgent.userProfile.daltonismType) ||
    "normal";
  if (daltonSelect) {
    daltonSelect.value = type;
    try {
      updateColorCards(type);
    } catch (e) {}
  }

  // Apply server-side adaptation immediately so page reflects stored profile
  try {
    const elements = collectElements();
    const res = await semanticAgent.adaptVisualContent(elements, type);
    if (res && res.adaptedElements) applyAdaptations(res.adaptedElements || []);
  } catch (e) {
    console.warn("Autoadapt error", e);
  }

  // Start agent autonomy so it logs snapshots and reacts to further changes
  try {
    semanticAgent.startAutonomy("agentOutput");
  } catch (e) {
    console.warn("Could not start autonomy", e);
  }
});
