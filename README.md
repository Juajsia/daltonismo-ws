# Color Sense - Aplicación de Adaptación Visual para Daltonismo

## 🎨 Descripción

**Color Sense** es una aplicación web completa que adapta automáticamente los colores para personas con daltonismo (protanopia, deuteranopia, tritanopia). Utiliza:

- **Frontend**: HTML5, CSS, JavaScript con Agente Local Semántico
- **Backend**: Node.js + Express (MVC)
- **BD**: MongoDB con persistencia de perfiles
- **Semántica**: Ontología RDF/JSON-LD y Agente Semántico

## 🚀 Inicio Rápido con Docker

### Prerrequisitos

- Docker y Docker Compose instalados

### Pasos

1. **En la raíz del proyecto**

```bash
docker-compose up --build
```

Esto inicia:

- **MongoDB** en `localhost:27017` (usuario: `admin` / pass: `admin123`)
- **Backend** en `http://localhost:3000`
- **Frontend** accesible desde el navegador

2. **Verificar que funciona**

```bash
# Terminal
curl http://localhost:3000/health

# Respuesta esperada:
# { "status": "ok", "timestamp": "2025-11-27T..." }
```

3. **Abrir en navegador**

```
http://localhost:3000/
# O si sirves frontend por separado:
python -m http.server -d frontend 8000
# Luego: http://localhost:8000
```

## 📚 API Endpoints

### Adaptaciones (Semantic Agent)

**POST `/api/adapt`** - Adaptar contenido visual

```bash
curl -X POST http://localhost:3000/api/adapt \
  -H "Content-Type: application/json" \
  -d '{
    "userProfile": {
      "userId": "demo-user",
      "daltonismType": "tritanopia"
    },
    "elements": [
      {
        "id": "color1",
        "label": "Rojo",
        "originalColor": "#FF0000",
        "type": "color"
      }
    ]
  }'
```

**GET `/api/adapt/ontology/daltonism`** - Obtener ontología
**GET `/api/adapt/color-transformations/:type`** - Ver transformaciones
**POST `/api/sparql`** - Consultas SPARQL

### Perfiles

**GET `/api/profiles/:userId`** - Obtener perfil
**POST `/api/profiles`** - Crear perfil
**PUT `/api/profiles/:userId`** - Actualizar perfil
**GET `/api/profiles/:userId/stats`** - Estadísticas

Ver `backend/README.md` para documentación completa.

## 📁 Estructura del Proyecto

```
Color_Sense_Project/
├── backend/
│   ├── src/
│   │   ├── server.js                    # Servidor principal
│   │   ├── controllers/
│   │   │   ├── UserProfileController.js
│   │   │   └── AdaptationController.js
│   │   ├── models/
│   │   │   ├── UserProfile.js
│   │   │   └── VisualContent.js
│   │   ├── routes/
│   │   │   ├── profiles.js
│   │   │   └── adaptations.js
│   │   └── utils/
│   │       └── SemanticAgent.js         # Ontología + Transformaciones
│   ├── Dockerfile
│   ├── package.json
│   └── .env
├── frontend/
│   ├── index.html                       # HTML con JSON-LD embebido
│   ├── app.js                           # Lógica principal
│   ├── semantic-agent.js                # Agente Local (cliente)
│   └── style.css
├── docker-compose.yml
└── README.md
```

## 🌐 Características Implementadas

✅ **Fase 1 - BD de Perfiles**

- MongoDB con Mongoose
- CRUD de perfiles de usuario
- Historial de adaptaciones con feedback
- Estadísticas por usuario

✅ **Fase 2 - Agente Semántico**

- Ontología RDF/JSON-LD para daltonismo
- Transformaciones de color precisas por tipo
- Endpoint SPARQL (simulado)
- Descripciones semánticas automáticas

✅ **Fase 3 - JSON-LD en Frontend**

- Metadatos embebidos en HTML
- Mejora de labels ARIA
- Agente Local conectado al servidor

✅ **Backend MVC**

- Separación clara de responsabilidades
- Controllers, Models, Routes
- Error handling robusto
- Logging

## 🛠️ Desarrollo Local (sin Docker)

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (en otra terminal)
cd frontend
python -m http.server 8000
# O: npx serve

# MongoDB debe estar corriendo localmente en 27017
```

## 📊 Tipos de Daltonismo Soportados

| Tipo             | Ausencia | Percepción        | Ejemplos de Transformación |
| ---------------- | -------- | ----------------- | -------------------------- |
| **Protanopia**   | Rojo     | Solo Verde + Azul | Rojo → Salmón (#F35E62)    |
| **Deuteranopia** | Verde    | Solo Rojo + Azul  | Verde → Amarillo (#FFFF00) |
| **Tritanopia**   | Azul     | Solo Rojo + Verde | Azul → Cian (#00CFCF)      |

## 🔄 Flujo de Datos

1. **Usuario selecciona tipo de daltonismo** en interfaz
2. **Frontend → Backend**: Envía contenido visual + perfil
3. **SemanticAgent**: Aplica transformaciones usando ontología
4. **MongoDB**: Guarda historial de adaptaciones
5. **Frontend**: Recibe JSON-LD, renderiza colores adaptados
6. **ARIA**: Mejora descripciones para lectores de pantalla

## 🐳 Comandos Docker Útiles

```bash
# Ver logs
docker-compose logs -f backend
docker-compose logs -f mongodb

# Ejecutar comando en contenedor
docker-compose exec backend npm run dev
docker-compose exec mongodb mongosh

# Detener
docker-compose down

# Limpiar volúmenes
docker-compose down -v
```

## 🔐 Variables de Entorno

Ver `backend/.env`:

```env
NODE_ENV=production
MONGO_URI=mongodb://admin:admin123@mongodb:27017/color-sense?authSource=admin
PORT=3000
CORS_ORIGIN=http://localhost:8000,http://localhost:3000
```

## 📝 Próximas Fases (Futuro)

- [ ] Fase 4: Detección automática de colores en imágenes
- [ ] Fase 5: Análisis con Google Vision API
- [ ] Autenticación JWT
- [ ] Rate limiting
- [ ] Redis caché
- [ ] Tests unitarios e integración
- [ ] CI/CD con GitHub Actions

## 📄 Licencia

MIT

---

**Creado para:** Universidad Internacional de Valencia - Web Semántica
**Fecha:** Noviembre 2025
