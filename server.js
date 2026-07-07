// ============================================================================
// SERVIDOR NODE.JS - CONTROL DE 5 LEDs
// Servidor HTTP con Express para interfaz web
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

// Estado de los LEDs
const ledStates = {
  led1: { on: false, brightness: 0, color: 'red' },
  led2: { on: false, brightness: 0, color: 'orange' },
  led3: { on: false, brightness: 0, color: 'yellow' },
  led4: { on: false, brightness: 0, color: 'green' },
  led5: { on: false, brightness: 0, color: 'blue' }
};

let autoMode = false;
let sequenceRunning = false;

// ============================================================================
// MIDDLEWARE
// ============================================================================

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ============================================================================
// RUTAS API
// ============================================================================

// Obtener estado de todos los LEDs
app.get('/api/status', (req, res) => {
  console.log('📊 GET /api/status');
  res.json({
    success: true,
    leds: ledStates,
    autoMode: autoMode,
    timestamp: new Date().toISOString()
  });
});

// Toggle LED individual
app.post('/api/toggle', (req, res) => {
  const { id } = req.body;
  
  if (!id || !ledStates[id]) {
    return res.status(400).json({ success: false, error: 'LED ID inválido' });
  }

  ledStates[id].on = !ledStates[id].on;
  ledStates[id].brightness = ledStates[id].on ? 255 : 0;

  console.log(`🔘 Toggle ${id}: ${ledStates[id].on ? 'ON' : 'OFF'}`);
  
  res.json({
    success: true,
    id: id,
    state: ledStates[id],
    allLeds: ledStates
  });
});

// Cambiar brillo
app.post('/api/brightness', (req, res) => {
  const { id, value } = req.body;

  if (!id || !ledStates[id] || value < 0 || value > 255) {
    return res.status(400).json({ success: false, error: 'Parámetros inválidos' });
  }

  ledStates[id].brightness = value;
  ledStates[id].on = value > 0;

  console.log(`💡 ${id} brightness: ${value}`);

  res.json({
    success: true,
    id: id,
    state: ledStates[id],
    allLeds: ledStates
  });
});

// Control de grupo (todos ON/OFF)
app.post('/api/all', (req, res) => {
  const { action } = req.body;

  if (action === 'on') {
    Object.keys(ledStates).forEach(id => {
      ledStates[id].on = true;
      ledStates[id].brightness = 255;
    });
    console.log('🟢 Todos los LEDs: ON');
  } else if (action === 'off') {
    Object.keys(ledStates).forEach(id => {
      ledStates[id].on = false;
      ledStates[id].brightness = 0;
    });
    console.log('🔴 Todos los LEDs: OFF');
  }

  res.json({
    success: true,
    action: action,
    allLeds: ledStates
  });
});

// Ejecutar secuencias
app.post('/api/sequence', (req, res) => {
  const { type } = req.body;

  if (sequenceRunning) {
    return res.json({ success: false, error: 'Secuencia en progreso' });
  }

  console.log(`🎬 Ejecutando secuencia: ${type}`);

  playSequence(type);

  res.json({
    success: true,
    sequence: type
  });
});

// Modo automático
app.post('/api/autoMode', (req, res) => {
  const { mode } = req.body;

  autoMode = mode;
  console.log(`⚙️  Modo automático: ${autoMode ? 'ON' : 'OFF'}`);

  if (autoMode) {
    startAutoMode();
  }

  res.json({
    success: true,
    autoMode: autoMode
  });
});

// ============================================================================
// SECUENCIAS DE ANIMACIÓN
// ============================================================================

function playSequence(type) {
  sequenceRunning = true;

  switch (type) {
    case 'pulse':
      sequencePulse();
      break;
    case 'wave':
      sequenceWave();
      break;
    case 'rainbow':
      sequenceRainbow();
      break;
    default:
      sequenceRunning = false;
  }
}

function sequencePulse() {
  let cycles = 0;
  const maxCycles = 3;

  const pulseInterval = setInterval(() => {
    if (cycles >= maxCycles) {
      clearInterval(pulseInterval);
      sequenceRunning = false;
      return;
    }

    Object.keys(ledStates).forEach(id => {
      ledStates[id].brightness = cycles % 2 === 0 ? 255 : 0;
      ledStates[id].on = cycles % 2 === 0;
    });

    cycles++;
  }, 500);
}

function sequenceWave() {
  let position = 0;
  const leds = Object.keys(ledStates);
  const totalSteps = leds.length * 2;
  let currentStep = 0;

  const waveInterval = setInterval(() => {
    if (currentStep >= totalSteps) {
      clearInterval(waveInterval);
      Object.keys(ledStates).forEach(id => {
        ledStates[id].brightness = 0;
        ledStates[id].on = false;
      });
      sequenceRunning = false;
      return;
    }

    Object.keys(ledStates).forEach((id, index) => {
      ledStates[id].brightness = index === (currentStep % leds.length) ? 255 : 0;
      ledStates[id].on = index === (currentStep % leds.length);
    });

    currentStep++;
  }, 150);
}

function sequenceRainbow() {
  let brightness = 0;
  let direction = 1;
  let cycles = 0;

  const rainbowInterval = setInterval(() => {
    if (cycles >= 2) {
      clearInterval(rainbowInterval);
      Object.keys(ledStates).forEach(id => {
        ledStates[id].brightness = 0;
        ledStates[id].on = false;
      });
      sequenceRunning = false;
      return;
    }

    Object.keys(ledStates).forEach(id => {
      ledStates[id].brightness = brightness;
      ledStates[id].on = brightness > 0;
    });

    brightness += (51 * direction);

    if (brightness >= 255 || brightness <= 0) {
      direction *= -1;
      if (brightness >= 255) {
        cycles++;
      }
    }
  }, 150);
}

// ============================================================================
// MODO AUTOMÁTICO
// ============================================================================

function startAutoMode() {
  if (!autoMode) return;

  setTimeout(() => {
    if (autoMode) {
      playSequence('wave');
      startAutoMode();
    }
  }, 3000);
}

// ============================================================================
// RUTAS ESTÁTICAS
// ============================================================================

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada',
    path: req.path
  });
});

// ============================================================================
// INICIAR SERVIDOR
// ============================================================================

server.listen(PORT, HOST, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║           🎉 SERVIDOR DE CONTROL DE LEDs INICIADO             ║
╚═══════════════════════════════════════════════════════════════╝

🌐 Servidor corriendo en:
   ➜ http://localhost:${PORT}
   ➜ http://0.0.0.0:${PORT}

📊 API Endpoints:
   ✅ GET  /api/status         - Obtener estado
   ✅ POST /api/toggle         - Toggle LED
   ✅ POST /api/brightness     - Cambiar brillo
   ✅ POST /api/all            - Control grupo
   ✅ POST /api/sequence       - Ejecutar secuencia
   ✅ POST /api/autoMode       - Modo automático

💡 LEDs Disponibles:
   🔴 led1 (Rojo)
   🟠 led2 (Naranja)
   🟡 led3 (Amarillo)
   🟢 led4 (Verde)
   🔵 led5 (Azul)

🛑 Para detener: Presiona Ctrl+C
  `);
});

// Manejo de errores
process.on('uncaughtException', (error) => {
  console.error('❌ Error no capturado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesa rechazada:', reason);
});
