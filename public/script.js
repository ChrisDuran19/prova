// ============================================================================
// CONTROL DE LEDs - JAVASCRIPT
// Lógica para interfaz web de control de 5 LEDs
// ============================================================================

// ============================================================================
// CONFIGURACIÓN Y ESTADO
// ============================================================================

const API_BASE = '/api';
const LED_IDS = ['led1', 'led2', 'led3', 'led4', 'led5'];
const LED_NAMES = ['LED 1', 'LED 2', 'LED 3', 'LED 4', 'LED 5'];
const LED_COLORS = ['🔴', '🟠', '🟡', '🟢', '🔵'];
const LED_EMOJIS = ['red', 'orange', 'yellow', 'green', 'blue'];

let ledStates = {};
let autoMode = false;
let isConnected = false;

// ============================================================================
// INICIALIZACIÓN
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  console.log('🎬 Inicializando aplicación...');
  initializeLEDs();
  setupEventListeners();
  updateStatus();
  setInterval(updateStatus, 2000);
});

// ============================================================================
// INICIALIZAR LEDs
// ============================================================================

function initializeLEDs() {
  const ledsGrid = document.getElementById('ledsGrid');
  ledsGrid.innerHTML = '';

  LED_IDS.forEach((id, index) => {
    const control = document.createElement('div');
    control.className = 'led-control';
    control.innerHTML = `
      <button class="led-button ${id}" id="${id}" title="Click para toggle">
        ${LED_COLORS[index]}
      </button>
      <label class="led-label">${LED_NAMES[index]}</label>
      <input 
        type="range" 
        class="brightness-slider" 
        id="brightness-${id}" 
        min="0" 
        max="255" 
        value="0"
        title="Arrastra para ajustar brillo"
      >
    `;
    ledsGrid.appendChild(control);

    // Event listeners
    document.getElementById(id).addEventListener('click', () => toggleLED(id));
    document.getElementById(`brightness-${id}`).addEventListener('input', (e) => {
      setBrightness(id, e.target.value);
    });
  });

  console.log('✅ LEDs inicializados');
}

// ============================================================================
// ACTUALIZAR ESTADO
// ============================================================================

async function updateStatus() {
  try {
    const response = await fetch(`${API_BASE}/status`);
    const data = await response.json();

    if (data.success) {
      ledStates = data.leds;
      autoMode = data.autoMode;

      // Actualizar UI
      Object.keys(ledStates).forEach(id => {
        const state = ledStates[id];
        const button = document.getElementById(id);
        const slider = document.getElementById(`brightness-${id}`);

        // Actualizar button
        if (state.on) {
          button.classList.add('active');
        } else {
          button.classList.remove('active');
        }

        // Actualizar slider
        slider.value = state.brightness;
      });

      // Actualizar toggle automático
      const toggle = document.getElementById('autoModeToggle');
      const label = document.getElementById('autoModeLabel');
      if (autoMode) {
        toggle.classList.add('active');
        label.textContent = 'Activado';
      } else {
        toggle.classList.remove('active');
        label.textContent = 'Desactivado';
      }

      // Actualizar estado de conexión
      setConnectionStatus(true);
      updateStatusCards();
    }
  } catch (error) {
    console.error('❌ Error al obtener estado:', error);
    setConnectionStatus(false);
  }
}

// ============================================================================
// CONTROL DE LEDs INDIVIDUALES
// ============================================================================

async function toggleLED(id) {
  try {
    showLoading(true);
    const response = await fetch(`${API_BASE}/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });

    const data = await response.json();
    if (data.success) {
      updateStatus();
      showToast(`${id.toUpperCase()} ${data.state.on ? 'Encendido' : 'Apagado'}`, 'success');
      console.log(`✅ ${id} toggled`);
    }
  } catch (error) {
    console.error('❌ Error al toggle LED:', error);
    showToast('Error al controlar LED', 'error');
  } finally {
    showLoading(false);
  }
}

async function setBrightness(id, value) {
  try {
    const response = await fetch(`${API_BASE}/brightness`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, value: parseInt(value) })
    });

    const data = await response.json();
    if (data.success) {
      updateStatus();
      console.log(`💡 ${id} brightness: ${value}`);
    }
  } catch (error) {
    console.error('❌ Error al cambiar brillo:', error);
  }
}

// ============================================================================
// CONTROL DE GRUPO
// ============================================================================

async function toggleAllLeds(action) {
  try {
    showLoading(true);
    const response = await fetch(`${API_BASE}/all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    });

    const data = await response.json();
    if (data.success) {
      updateStatus();
      showToast(`Todos los LEDs: ${action.toUpperCase()}`, 'success');
      console.log(`✅ Todos los LEDs: ${action}`);
    }
  } catch (error) {
    console.error('❌ Error al controlar todos:', error);
    showToast('Error al controlar LEDs', 'error');
  } finally {
    showLoading(false);
  }
}

// ============================================================================
// SECUENCIAS
// ============================================================================

async function playSequence(type) {
  try {
    showLoading(true);
    const response = await fetch(`${API_BASE}/sequence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type })
    });

    const data = await response.json();
    if (data.success) {
      showToast(`🎬 Secuencia: ${type}`, 'info');
      console.log(`✅ Secuencia ${type} ejecutada`);
      
      // Esperar a que termine la secuencia y actualizar
      setTimeout(() => {
        updateStatus();
        showLoading(false);
      }, 3000);
    }
  } catch (error) {
    console.error('❌ Error al ejecutar secuencia:', error);
    showToast('Error al ejecutar secuencia', 'error');
    showLoading(false);
  }
}

// ============================================================================
// MODO AUTOMÁTICO
// ============================================================================

async function toggleAutoMode() {
  try {
    const newMode = !autoMode;
    const response = await fetch(`${API_BASE}/autoMode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: newMode })
    });

    const data = await response.json();
    if (data.success) {
      autoMode = data.autoMode;
      updateStatus();
      showToast(
        `Modo automático: ${newMode ? '✓ Activado' : '✗ Desactivado'}`,
        'info'
      );
      console.log(`⚙️  Modo automático: ${newMode}`);
    }
  } catch (error) {
    console.error('❌ Error al cambiar modo automático:', error);
    showToast('Error al cambiar modo automático', 'error');
  }
}

// ============================================================================
// ACTUALIZAR TARJETAS DE ESTADO
// ============================================================================

function updateStatusCards() {
  const statusGrid = document.getElementById('statusGrid');
  statusGrid.innerHTML = '';

  LED_IDS.forEach((id, index) => {
    const state = ledStates[id];
    if (!state) return;

    const card = document.createElement('div');
    card.className = 'status-card';
    card.innerHTML = `
      <div class="status-led-name">
        <span class="status-led-emoji">${LED_COLORS[index]}</span>
        <span>${LED_NAMES[index]}</span>
      </div>
      <div class="status-values">
        <div>
          <span class="status-value-label">Estado:</span>
          <span class="status-value">${state.on ? '🟢 ON' : '🔴 OFF'}</span>
        </div>
        <div>
          <span class="status-value-label">Brillo:</span>
          <span class="status-value">${Math.round((state.brightness / 255) * 100)}%</span>
        </div>
      </div>
    `;
    statusGrid.appendChild(card);
  });
}

// ============================================================================
// UTILIDADES - CONEXIÓN
// ============================================================================

function setConnectionStatus(connected) {
  isConnected = connected;
  const indicator = document.getElementById('statusIndicator');
  const dot = indicator?.querySelector('.status-dot');

  if (connected) {
    indicator?.classList.add('active');
    dot?.classList.remove('offline');
  } else {
    indicator?.classList.remove('active');
    dot?.classList.add('offline');
  }
}

// ============================================================================
// UTILIDADES - NOTIFICACIONES
// ============================================================================

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icons = {
    success: '✓',
    error: '✗',
    info: 'ℹ',
    warning: '⚠'
  };

  toast.innerHTML = `<span>${icons[type]}</span> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideInRight 0.4s ease-out reverse';
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

function showLoading(show) {
  const overlay = document.getElementById('loadingOverlay');
  if (show) {
    overlay.classList.add('show');
  } else {
    overlay.classList.remove('show');
  }
}

// ============================================================================
// SETUP DE EVENT LISTENERS
// ============================================================================

function setupEventListeners() {
  // Detectar cambios en visibilidad
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      updateStatus();
    }
  });

  // Detectar errores de red
  window.addEventListener('offline', () => {
    showToast('❌ Conexión perdida', 'error');
    setConnectionStatus(false);
  });

  window.addEventListener('online', () => {
    showToast('✓ Conexión restaurada', 'success');
    updateStatus();
  });

  console.log('✅ Event listeners configurados');
}

// ============================================================================
// UTILIDADES - TECLAS DE ATAJO
// ============================================================================

document.addEventListener('keydown', (e) => {
  // Ctrl+1 a Ctrl+5 para toggle de LEDs
  if (e.ctrlKey) {
    const number = e.key;
    if (number >= '1' && number <= '5') {
      e.preventDefault();
      toggleLED(`led${number}`);
    }
  }

  // Espacio para toggle todos
  if (e.code === 'Space' && e.target === document.body) {
    e.preventDefault();
    toggleAllLeds(Object.values(ledStates).some(s => !s.on) ? 'on' : 'off');
  }
});

// ============================================================================
// MEJORAS DE RENDIMIENTO
// ============================================================================

// Lazy loading de imágenes (si aplica)
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Cargar elemento
        observer.unobserve(entry.target);
      }
    });
  });
}

// Service Worker (para PWA en futuro)
if ('serviceWorker' in navigator) {
  // Preparado para implementar
}

console.log('✅ Aplicación lista');
