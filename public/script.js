// ============================================================================
// CONTROL DE LED - JAVASCRIPT
// Habla directamente con el ESP32 (vía Wokwi IoT Gateway) en localhost:9080
// ============================================================================

// Si el gateway privado de Wokwi usa otro puerto, cambialo acá:
const ESP32_BASE = 'http://localhost:9080';

let ledOn = false;
let brightness = 0;
let isConnected = false;

document.addEventListener('DOMContentLoaded', () => {
  console.log('🎬 Inicializando aplicación...');
  setupEventListeners();
  updateStatus();
  setInterval(updateStatus, 2000);
});

// ============================================================================
// ACTUALIZAR ESTADO DESDE EL ESP32
// ============================================================================
async function updateStatus() {
  try {
    const response = await fetch(`${ESP32_BASE}/api/status`);
    const data = await response.json();

    if (data.success) {
      ledOn = data.on;
      brightness = data.brightness;
      renderState();
      setConnectionStatus(true);
    }
  } catch (error) {
    console.error('❌ Error al obtener estado del ESP32:', error);
    setConnectionStatus(false);
  }
}

function renderState() {
  const button = document.getElementById('ledButton');
  const slider = document.getElementById('brightnessSlider');
  const brightnessValue = document.getElementById('brightnessValue');
  const statusState = document.getElementById('statusStateValue');
  const statusBrightness = document.getElementById('statusBrightnessValue');

  button.classList.toggle('active', ledOn);
  slider.value = brightness;

  const pct = Math.round((brightness / 255) * 100);
  brightnessValue.textContent = `${pct}%`;
  statusBrightness.textContent = `${pct}%`;
  statusState.textContent = ledOn ? '🟢 ON' : '🔴 OFF';
}

// ============================================================================
// ACCIONES
// ============================================================================
async function toggleLed() {
  await sendCommand('/api/toggle');
  showToast(`LED ${ledOn ? 'Apagado' : 'Encendido'}`, 'success');
}

async function turnOn() {
  await sendCommand('/api/on');
  showToast('LED Encendido', 'success');
}

async function turnOff() {
  await sendCommand('/api/off');
  showToast('LED Apagado', 'success');
}

async function setBrightness(value) {
  await sendCommand('/api/brightness', { value: parseInt(value) });
}

async function sendCommand(path, body) {
  try {
    showLoading(true);
    const response = await fetch(`${ESP32_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    });
    const data = await response.json();
    if (data.success) {
      ledOn = data.on;
      brightness = data.brightness;
      renderState();
      setConnectionStatus(true);
    }
  } catch (error) {
    console.error('❌ Error al enviar comando:', error);
    showToast('Error al comunicarse con el ESP32', 'error');
    setConnectionStatus(false);
  } finally {
    showLoading(false);
  }
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================
function setupEventListeners() {
  document.getElementById('ledButton').addEventListener('click', toggleLed);
  document.getElementById('btnOn').addEventListener('click', turnOn);
  document.getElementById('btnOff').addEventListener('click', turnOff);
  document.getElementById('brightnessSlider').addEventListener('input', (e) => {
    setBrightness(e.target.value);
  });

  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && e.target === document.body) {
      e.preventDefault();
      toggleLed();
    }
  });

  window.addEventListener('offline', () => setConnectionStatus(false));
  window.addEventListener('online', updateStatus);

  console.log('✅ Event listeners configurados');
}

// ============================================================================
// UI - CONEXIÓN, TOASTS, LOADING
// ============================================================================
function setConnectionStatus(connected) {
  isConnected = connected;
  const indicator = document.getElementById('statusIndicator');
  const dot = indicator?.querySelector('.status-dot');
  const text = indicator?.querySelector('.status-text');

  if (connected) {
    indicator?.classList.add('active');
    dot?.classList.remove('offline');
    if (text) text.textContent = 'Conectado';
  } else {
    indicator?.classList.remove('active');
    dot?.classList.add('offline');
    if (text) text.textContent = 'Desconectado';
  }
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = { success: '✓', error: '✗', info: 'ℹ', warning: '⚠' };
  toast.innerHTML = `<span>${icons[type]}</span> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideInRight 0.4s ease-out reverse';
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

function showLoading(show) {
  const overlay = document.getElementById('loadingOverlay');
  if (show) overlay.classList.add('show');
  else overlay.classList.remove('show');
}

console.log('✅ Aplicación lista');
