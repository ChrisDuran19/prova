// ============================================================================
// SERVIDOR NODE.JS - SERVIDOR ESTÁTICO
// El control real del LED lo maneja el ESP32 (vía Wokwi IoT Gateway).
// Este servidor solo sirve los archivos de la interfaz web (public/).
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

// ============================================================================
// MIDDLEWARE
// ============================================================================

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// ============================================================================
// RUTA PRINCIPAL
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
║           🎉 SERVIDOR WEB INICIADO                             ║
╚═══════════════════════════════════════════════════════════════╝

🌐 Interfaz web disponible en:
   ➜ http://localhost:${PORT}

💡 El control del LED lo maneja el ESP32 directamente.
   Asegurate de tener el Wokwi IoT Gateway activo y la
   simulación corriendo en http://localhost:9080

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
