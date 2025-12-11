// Color Sense - frontend demo
const adaptBtn = document.getElementById("adaptBtn");
const tritanOnlyBtn = document.getElementById("tritanOnlyBtn");
const output = document.getElementById("output");
const bars = Array.from(document.querySelectorAll(".bar"));
const daltonSelect = document.getElementById("daltonType");

function collectElements() {
  return bars.map((b) => ({
    "@type": "VisualElement",
    id: b.dataset.label.toLowerCase(),
    label: b.dataset.label,
    originalColor: b.dataset.color,
  }));
}

function applyAdaptations(adaptedElements) {
  adaptedElements.forEach((a) => {
    const el = bars.find(
      (b) => b.dataset.label.toLowerCase() === (a.id || "").toLowerCase()
    );
    if (!el) return;
    // apply adapted color (if different)
    if (a.adaptedColor && a.adaptedColor !== a.originalColor) {
      el.style.backgroundColor = a.adaptedColor;
      // add textual hint for accessibility
      el.setAttribute("aria-label", el.dataset.label + " - adaptado");
      el.title = a.description || "Adaptado";
    }
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
  const cards = document.querySelectorAll(".color-card");

  cards.forEach((card) => {
    const originalColor = card.getAttribute("data-original-color");
    if (originalColor) {
      let adaptedColor;
      // If tritanopia and an explicit tritan color is provided, use it
      if (
        filterType === "tritanopia" &&
        card.getAttribute("data-tritan-color")
      ) {
        adaptedColor = card.getAttribute("data-tritan-color");
      } else {
        adaptedColor = applyColorblindFilter(originalColor, filterType);
      }
      card.style.backgroundColor = adaptedColor;
    }
  });

  // Also update any simulated flag stripes
  const stripes = document.querySelectorAll(".flag .stripe");
  stripes.forEach((s) => {
    const original = s.getAttribute("data-original-color");
    if (!original) return;
    let adapted;
    if (filterType === "tritanopia" && s.getAttribute("data-tritan-color")) {
      adapted = s.getAttribute("data-tritan-color");
    } else {
      adapted = applyColorblindFilter(original, filterType);
    }
    s.style.backgroundColor = adapted;
  });
}

// Listener para cambiar los colores de las tarjetas inmediatamente
daltonSelect.addEventListener("change", () => {
  updateColorCards(daltonSelect.value);
});

// Prefer LocalSemanticAgent when available for testing; fallback to server POST
adaptBtn.addEventListener("click", async () => {
  const profile = {
    userId: "demo",
    daltonismType: daltonSelect.value,
    preferences: { contrastLevel: "high" },
  };
  const elements = collectElements();
  const payload = {
    "@context": "http://schema.org",
    url: window.location.href,
    userProfile: profile,
    elements: elements,
  };

  output.textContent = "Cargando...";

  // If LocalSemanticAgent exists on window, use it for adaptation (convenient for testing)
  try {
    if (window.LocalSemanticAgent) {
      const agent = new window.LocalSemanticAgent();
      // initialize (best-effort) so agent.userProfile is available
      await agent.initialize(profile.userId);
      const result = await agent.adaptVisualContent(
        elements,
        profile.daltonismType
      );
      output.textContent = JSON.stringify(result, null, 2);
      applyAdaptations(result.adaptedElements || []);
      return;
    }

    // fallback: call server endpoint
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
      "Error: " + err.message + "\n\n" + JSON.stringify(payload, null, 2);
  }
});
