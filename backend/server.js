
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json({limit: '1mb'}));

const profilesPath = path.join(__dirname, 'profiles.json');
if (!fs.existsSync(profilesPath)) {
  fs.writeFileSync(profilesPath, JSON.stringify({ users: [] }, null, 2));
}

// Simple color mapping rules for demo (original -> adapted) for two daltonism types
const rules = {
  protanopia: [
    { original: '#FF0000', adapted: '#0000FF', reason: 'map red to blue (demo)' },
    { original: '#00FF00', adapted: '#00FF00', reason: 'green preserved' }
  ],
  deuteranopia: [
    { original: '#FF0000', adapted: '#0000FF', reason: 'map red to blue (demo)' },
    { original: '#00FF00', adapted: '#008000', reason: 'green darker' }
  ],
  tritanopia: [
    { original: '#0000FF', adapted: '#00FFFF', reason: 'map blue to cyan (demo)' }
  ]
};

// Helper: normalize hex to uppercase and ensure leading #
function normHex(h) {
  if (!h) return h;
  let s = String(h).trim();
  if (!s.startsWith('#')) s = '#' + s;
  return s.toUpperCase();
}

// POST /api/adapt
// Expects JSON-LD-like payload with userProfile and elements (with color hexes)
app.post('/api/adapt', (req, res) => {
  const body = req.body || {};
  const profile = body.userProfile || {};
  const elements = body.elements || [];
  const type = (profile.daltonismType || 'deuteranopia').toLowerCase();

  const mapping = rules[type] || [];
  const adapted = elements.map(el => {
    const original = normHex(el.originalColor || el.color || el.hex || el.colorHex);
    const found = mapping.find(m => m.original === original);
    const adaptedColor = found ? found.adapted : original;
    return {
      '@type': el['@type'] || 'VisualElement',
      id: el.id || el._id || null,
      originalColor: original,
      adaptedColor: adaptedColor,
      description: el.label ? `Elemento '${el.label}' adaptado` : 'Elemento adaptado',
      colorMappings: found ? [found] : []
    };
  });

  const resp = {
    '@context': 'http://schema.org',
    '@type': 'AdaptationResult',
    adaptedElements: adapted,
    meta: {
      engine: 'color-sense-mock-v1',
      profileUsed: profile.userId || 'anonymous',
      daltonismType: type
    }
  };
  res.json(resp);
});

// GET /api/profile/:id
app.get('/api/profile/:id', (req, res) => {
  const id = req.params.id;
  const data = JSON.parse(fs.readFileSync(profilesPath));
  const user = (data.users || []).find(u => u.userId === id);
  if (!user) return res.status(404).json({error: 'profile not found'});
  res.json(user);
});

// POST /api/profile/:id  (create/update)
app.post('/api/profile/:id', (req, res) => {
  const id = req.params.id;
  const body = req.body || {};
  const data = JSON.parse(fs.readFileSync(profilesPath));
  const idx = (data.users || []).findIndex(u => u.userId === id);
  const newProfile = Object.assign({ userId: id }, body);
  if (idx === -1) {
    data.users.push(newProfile);
  } else {
    data.users[idx] = newProfile;
  }
  fs.writeFileSync(profilesPath, JSON.stringify(data, null, 2));
  res.json(newProfile);
});

// Mock describe-image endpoint (would call Vision API in production)
app.post('/api/describe-image', (req, res) => {
  const body = req.body || {};
  // For demo return a simple JSON-LD description
  const desc = {
    '@context': 'http://schema.org',
    '@type': 'ImageObject',
    description: 'Imagen analizada: contiene un semáforo y un fondo verde (demo).',
    objectsDetected: [
      { name: 'semaforo', boundingBox: [10,10,50,100], label: 'Semáforo' }
    ]
  };
  res.json(desc);
});

// Serve static for quick testing (optional)
app.use('/static', express.static(path.join(__dirname, '..', 'frontend')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Color Sense backend running on port', PORT);
});
