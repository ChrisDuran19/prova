// ============================================================================
// SERVIDOR NODE.JS - CONTROL DE 1 LED (para Render)
// El estado del LED vive acá. La web lo modifica, el ESP32 lo consulta.
// ============================================================================

const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0';

// Estado del LED (fuente de verdad, compartida entre la web y el ESP32)
let ledState = { on: false, brightness: 0 };

// ============================================================================
// MIDDLEWARE
// ============================================================================

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ============================================================================
// RUTAS API
// ============================================================================

// Consultado tanto por el frontend como por el ESP32 (polling)
app.get('/api/status', (req, res) => {
  res.json({ success: true, ...ledState });
});

app.post('/api/toggle', (req, res) => {
  ledState.on = !ledState.on;
  ledState.brightness = ledState.on ? 255 : 0;
  console.log(`🔘 Toggle: ${ledState.on ? 'ON' : 'OFF'}`);
  res.json({ success: true, ...ledState });
});

app.post('/api/on', (req, res) => {
  ledState.on = true;
  ledState.brightness = 255;
  console.log('🟢 LED: ON');
  res.json({ success: true, ...ledState });
});

app.post('/api/off', (req, res) => {
  ledState.on = false;
  ledState.brightness = 0;
  console.log('🔴 LED: OFF');
  res.json({ success: true, ...ledState });
});

app.post('/api/brightness', (req, res) => {
  const { value } = req.body;
  if (value === undefined || value < 0 || value > 255) {
    return res.status(400).json({ success: false, error: 'Valor inválido' });
  }
  ledState.brightness = value;
  ledState.on = value > 0;
  console.log(`💡 Brillo: ${value}`);
  res.json({ success: true, ...ledState });
});

// El ESP32 llama a esta ruta cuando el botón físico cambia el estado,
// para que la web se entere también (sincronización en ambos sentidos)
app.post('/api/report', (req, res) => {
  const { on, brightness } = req.body;
  if (typeof on === 'boolean') ledState.on = on;
  if (typeof brightness === 'number') ledState.brightness = brightness;
  console.log(`📡 Reporte del ESP32: on=${ledState.on} brightness=${ledState.brightness}`);
  res.json({ success: true, ...ledState });
});

// ============================================================================
// RUTA PRINCIPAL
// ============================================================================

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Ruta no encontrada', path: req.path });
});

// ============================================================================
// INICIAR SERVIDOR
// ============================================================================

server.listen(PORT, HOST, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║           🎉 SERVIDOR DE CONTROL DE LED INICIADO               ║
╚═══════════════════════════════════════════════════════════════╝

🌐 Servidor corriendo en el puerto ${PORT}
📊 API: /api/status, /api/toggle, /api/on, /api/off, /api/brightness, /api/report

🛑 Para detener: Presiona Ctrl+C
  `);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Error no capturado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesa rechazada:', reason);
});
