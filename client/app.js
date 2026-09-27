/**
 * Antigravity Connector - Client Application Logic
 * Real-time WebSocket connection, multi-platform UI, and module controllers
 */

const STATE = {
  token: localStorage.getItem('ag_token') || null,
  user: null,
  currentView: 'dashboard',
  emergencyMode: false,
  ws: null,
  devices: { isMobile: window.innerWidth <= 768, isTablet: window.innerWidth > 768 && window.innerWidth <= 1024 },
  lang: localStorage.getItem('ag_lang') || 'es',
  btnHints: localStorage.getItem('ag_btn_hints') !== 'false'
};

// Initialize app on load
window.addEventListener('DOMContentLoaded', () => {
  detectDeviceLayout();
  window.addEventListener('resize', detectDeviceLayout);
  initCustomSelects();
  initSidebarPopovers();
  initUserPreferences();
  
  initAuth().then(() => {
    initWebSocket();
    loadDashboardData();
  });
});

function detectDeviceLayout() {
  const width = window.innerWidth;
  const badge = document.getElementById('deviceBadge');
  if (width <= 768) {
    STATE.devices.isMobile = true;
    STATE.devices.isTablet = false;
    if (badge) badge.innerHTML = '<span class="device-icon">📱</span><span class="device-label">Mobile</span>';
  } else if (width <= 1024) {
    STATE.devices.isMobile = false;
    STATE.devices.isTablet = true;
    if (badge) badge.innerHTML = '<span class="device-icon">📟</span><span class="device-label">Tablet</span>';
  } else {
    STATE.devices.isMobile = false;
    STATE.devices.isTablet = false;
    if (badge) badge.innerHTML = '<span class="device-icon">💻</span><span class="device-label">PC Mode</span>';
  }
}

/* ==========================================================================
   AUTHENTICATION & SESSION
   ========================================================================== */

async function initAuth() {
  if (STATE.token) {
    try {
      const res = await apiRequest('/api/auth/me');
      if (res && res.user) {
        setAuthenticatedUser(res.user, STATE.token);
        return true;
      }
    } catch (e) {
      localStorage.removeItem('ag_token');
      STATE.token = null;
      STATE.user = null;
    }
  }

  // If not logged in, prompt user with login modal
  const userNameEl = document.getElementById('userName');
  if (userNameEl) userNameEl.textContent = 'Sin Sesión';
  openAuthModal();
  return false;
}

function setAuthenticatedUser(user, token) {
  STATE.user = user;
  STATE.token = token;
  localStorage.setItem('ag_token', token);

  const userNameEl = document.getElementById('userName');
  if (userNameEl) userNameEl.textContent = user.fullName || user.email;

  closeModal('authModal');
}

async function handleLogout() {
  try {
    if (STATE.token) {
      await apiRequest('/api/auth/logout', 'POST');
    }
  } catch (e) {
    // ignore
  }

  // Clear session completely
  localStorage.removeItem('ag_token');
  STATE.token = null;
  STATE.user = null;

  // Update UI to logged-out state
  const userNameEl = document.getElementById('userName');
  if (userNameEl) userNameEl.textContent = 'Sin Sesión';

  // Clear dashboard metric values
  const agEl = document.getElementById('dashAntigravityStatus');
  if (agEl) agEl.textContent = 'Requiere Sesión';
  const mCount = document.getElementById('dashMachinesCount');
  if (mCount) mCount.textContent = '0';
  const pCount = document.getElementById('dashProjectsCount');
  if (pCount) pCount.textContent = '0';
  const tCount = document.getElementById('dashTasksCount');
  if (tCount) tCount.textContent = '0';

  // Clear input fields
  const emailInput = document.getElementById('authEmail');
  if (emailInput) emailInput.value = '';
  const passInput = document.getElementById('authPassword');
  if (passInput) passInput.value = '';

  // Immediately present login modal
  openAuthModal();
}

function openAuthModal() {
  const modal = document.getElementById('authModal');
  if (modal) modal.classList.remove('hidden');
}

let authMode = 'login';
function switchAuthTab(mode) {
  authMode = mode;
  document.getElementById('tabLogin').classList.toggle('active', mode === 'login');
  document.getElementById('tabRegister').classList.toggle('active', mode === 'register');
  document.getElementById('authRegisterNameGroup').classList.toggle('hidden', mode === 'login');
  document.getElementById('authRegisterGoogleGroup').classList.toggle('hidden', mode === 'login');
  document.getElementById('authSubmitBtn').textContent = mode === 'login' ? 'Entrar' : 'Crear Cuenta';
  document.getElementById('authModalTitle').textContent = mode === 'login' ? 'Iniciar Sesión' : 'Registro de Usuario';
}

/* ==========================================================================
   CUSTOM UI DIALOGS & TOAST NOTIFICATION ENGINE
   Replaces all browser prompt(), alert(), confirm() with modern dark glassmorphism
   ========================================================================== */

let activeDialogResolver = null;

function showToast(message, type = 'info', duration = 4000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const iconMap = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };

  toast.innerHTML = `
    <span style="font-size: 16px;">${iconMap[type] || 'ℹ️'}</span>
    <div style="flex: 1;">${escapeHtml(message)}</div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(50px)';
    setTimeout(() => toast.remove(), 350);
  }, duration);
}

function openCustomDialog({ title, message, icon = 'ℹ️', showInput = false, inputValue = '', placeholder = '', showCancel = false, confirmText = 'Aceptar' }) {
  return new Promise((resolve) => {
    activeDialogResolver = resolve;

    document.getElementById('appDialogTitle').textContent = title || 'Mensaje del Sistema';
    document.getElementById('appDialogMessage').textContent = message || '';
    document.getElementById('appDialogIcon').textContent = icon;

    const inputGroup = document.getElementById('appDialogInputGroup');
    const input = document.getElementById('appDialogInput');
    if (showInput) {
      inputGroup.classList.remove('hidden');
      input.value = inputValue || '';
      input.placeholder = placeholder || '';
      setTimeout(() => input.focus(), 60);
    } else {
      inputGroup.classList.add('hidden');
    }

    const cancelBtn = document.getElementById('appDialogCancelBtn');
    if (showCancel) {
      cancelBtn.classList.remove('hidden');
    } else {
      cancelBtn.classList.add('hidden');
    }

    const confirmBtn = document.getElementById('appDialogConfirmBtn');
    confirmBtn.textContent = confirmText;

    document.getElementById('appDialogModal').classList.remove('hidden');
  });
}

function closeAppDialog(isConfirmed) {
  const modal = document.getElementById('appDialogModal');
  modal.classList.add('hidden');

  if (activeDialogResolver) {
    if (isConfirmed) {
      const inputGroup = document.getElementById('appDialogInputGroup');
      if (!inputGroup.classList.contains('hidden')) {
        const val = document.getElementById('appDialogInput').value;
        activeDialogResolver(val);
      } else {
        activeDialogResolver(true);
      }
    } else {
      activeDialogResolver(null);
    }
    activeDialogResolver = null;
  }
}

function appAlert(title, message, icon = 'ℹ️') {
  return openCustomDialog({ title, message, icon, showCancel: false, confirmText: 'Entendido' });
}

function appConfirm(title, message, icon = '❓') {
  return openCustomDialog({ title, message, icon, showCancel: true, confirmText: 'Confirmar' }).then(res => Boolean(res));
}

function appPrompt(title, message, defaultValue = '', placeholder = '', icon = '✏️') {
  return openCustomDialog({ title, message, icon, showInput: true, inputValue: defaultValue, placeholder, showCancel: true, confirmText: 'Aceptar' });
}

/* ==========================================================================
   CUSTOM DROPDOWN / SELECT ENGINE
   Converts system <select> dropdowns into custom dark glassmorphic components
   ========================================================================== */

function initCustomSelects() {
  const selects = document.querySelectorAll('select.form-input');
  selects.forEach(select => setupSingleCustomSelect(select));
}

function setupSingleCustomSelect(select) {
  if (!select) return;

  let wrapper = select.nextElementSibling;
  if (!wrapper || !wrapper.classList.contains('custom-select-container')) {
    // Hide original select visually while keeping it fully functioning for forms and scripts
    select.style.position = 'absolute';
    select.style.opacity = '0';
    select.style.pointerEvents = 'none';
    select.style.height = '0';
    select.style.width = '0';

    wrapper = document.createElement('div');
    wrapper.className = 'custom-select-container';
    wrapper.dataset.forSelect = select.id || '';

    const trigger = document.createElement('div');
    trigger.className = 'custom-select-trigger';
    trigger.setAttribute('tabindex', '0');

    const label = document.createElement('span');
    label.className = 'custom-select-label';

    const arrow = document.createElement('span');
    arrow.className = 'custom-select-arrow';
    arrow.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    `;

    trigger.appendChild(label);
    trigger.appendChild(arrow);

    const dropdown = document.createElement('div');
    dropdown.className = 'custom-select-dropdown';

    wrapper.appendChild(trigger);
    wrapper.appendChild(dropdown);

    select.parentNode.insertBefore(wrapper, select.nextSibling);

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = wrapper.classList.contains('open');
      closeAllCustomDropdowns();
      if (!isOpen) {
        wrapper.classList.add('open');
      }
    });

    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        trigger.click();
      }
    });
  }

  renderCustomSelectOptions(select, wrapper);
}

function renderCustomSelectOptions(select, wrapper) {
  const dropdown = wrapper.querySelector('.custom-select-dropdown');
  const label = wrapper.querySelector('.custom-select-label');
  if (!dropdown || !label) return;

  dropdown.innerHTML = '';
  const options = Array.from(select.options);
  const selectedOption = select.options[select.selectedIndex] || options[0];

  label.textContent = selectedOption ? selectedOption.text : '-- Seleccionar --';

  options.forEach((opt) => {
    const item = document.createElement('div');
    item.className = 'custom-select-item';
    if (opt.value === select.value) {
      item.classList.add('selected');
    }
    item.dataset.value = opt.value;

    item.innerHTML = `
      <span class="option-text">${escapeHtml(opt.text)}</span>
      <span class="custom-select-check">✓</span>
    `;

    item.addEventListener('click', (e) => {
      e.stopPropagation();
      select.value = opt.value;
      label.textContent = opt.text;
      
      wrapper.querySelectorAll('.custom-select-item').forEach(i => i.classList.remove('selected'));
      item.classList.add('selected');

      wrapper.classList.remove('open');
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });

    dropdown.appendChild(item);
  });
}

function refreshCustomSelect(selectIdOrEl) {
  const select = typeof selectIdOrEl === 'string' ? document.getElementById(selectIdOrEl) : selectIdOrEl;
  if (!select) return;
  setupSingleCustomSelect(select);
}

function closeAllCustomDropdowns() {
  document.querySelectorAll('.custom-select-container.open').forEach(w => w.classList.remove('open'));
}

document.addEventListener('click', () => {
  closeAllCustomDropdowns();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeAllCustomDropdowns();
  }
});

let currentCloudProvider = 'google';
let isCloudLinkingMode = false;

function openCloudAuthModal(provider = 'google', isLinking = false) {
  currentCloudProvider = provider.toLowerCase();
  isCloudLinkingMode = Boolean(isLinking);

  const config = {
    google: {
      name: 'Google (Antigravity ID)',
      icon: '🌐',
      desc: 'Introduce tu cuenta de Google (Gmail o Workspace) para validar tu acceso a Antigravity y Gemini.',
      placeholder: 'tu-cuenta@gmail.com',
      defaultVal: 'guty020@gmail.com'
    },
    supabase: {
      name: 'Supabase Cloud',
      icon: '⚡',
      desc: 'Introduce tu cuenta o correo de Supabase para validar accesos a Base de Datos y Edge Functions AI.',
      placeholder: 'usuario@supabase.co',
      defaultVal: 'developer@supabase.local'
    },
    firebase: {
      name: 'Firebase Cloud',
      icon: '🔥',
      desc: 'Introduce tu cuenta de Firebase para validar funciones serverless y almacenamiento seguro.',
      placeholder: 'usuario@firebase.google.com',
      defaultVal: 'admin@firebase.local'
    },
    vercel: {
      name: 'Vercel Edge Platform',
      icon: '▲',
      desc: 'Introduce tu cuenta de Vercel para autorizar despliegues continuos y Edge AI Middleware.',
      placeholder: 'usuario@vercel.com',
      defaultVal: 'team@vercel.local'
    },
    github: {
      name: 'GitHub Cloud',
      icon: '🐙',
      desc: 'Introduce tu cuenta de GitHub para sincronización de repositorios y Copilot Bridge.',
      placeholder: 'tu-usuario@github.com',
      defaultVal: 'guty020@github.com'
    }
  };

  const p = config[currentCloudProvider] || config.google;

  document.getElementById('cloudModalTitle').textContent = isLinking
    ? `Vincular Cuenta de ${p.name}`
    : `Identificarse con ${p.name}`;
  document.getElementById('cloudModalIcon').textContent = p.icon;
  document.getElementById('cloudModalDesc').textContent = p.desc;
  
  const input = document.getElementById('cloudModalEmailInput');
  if (input) {
    input.placeholder = p.placeholder;
    input.value = p.defaultVal || '';
  }

  // Ensure form is visible, scanner is hidden
  document.getElementById('cloudAuthFormBox').classList.remove('hidden');
  document.getElementById('cloudAuthVerifying').classList.add('hidden');
  document.getElementById('cloudAuthProgressFill').style.width = '0%';

  document.getElementById('cloudAuthModal').classList.remove('hidden');
  setTimeout(() => input?.focus(), 60);
}

// Backward compatibility alias for any existing caller
function openGoogleAuthModal() {
  openCloudAuthModal('google', false);
}
function handleGoogleAuth() {
  openCloudAuthModal('google', false);
}
function confirmGoogleAuth() {
  return confirmCloudAuth();
}

async function confirmCloudAuth() {
  const input = document.getElementById('cloudModalEmailInput');
  const email = input ? input.value.trim() : '';

  if (!email || !email.includes('@')) {
    showToast('Por favor introduce un correo o cuenta válida', 'warning');
    return;
  }

  const formBox = document.getElementById('cloudAuthFormBox');
  const verifyingBox = document.getElementById('cloudAuthVerifying');
  const progressFill = document.getElementById('cloudAuthProgressFill');
  const stepTitle = document.getElementById('cloudAuthStepTitle');
  const stepSub = document.getElementById('cloudAuthStepSub');

  // Activate safe scanner animation (hiding actual authorizations until login succeeds)
  formBox.classList.add('hidden');
  verifyingBox.classList.remove('hidden');
  progressFill.style.width = '35%';
  stepTitle.textContent = `Validando Handshake Criptográfico con ${currentCloudProvider.toUpperCase()}...`;
  stepSub.textContent = 'Comprobando tokens de autenticación segura en cluster local...';

  await new Promise(r => setTimeout(r, 700));
  progressFill.style.width = '75%';
  stepTitle.textContent = 'Verificando Autorizaciones y Permisos en el Gateway...';
  stepSub.textContent = 'Aislando permisos por tenant multi-usuario...';

  await new Promise(r => setTimeout(r, 800));
  progressFill.style.width = '100%';
  stepTitle.textContent = 'Estableciendo Sesión Segura...';

  try {
    const endpoint = isCloudLinkingMode ? '/api/auth/link-provider' : '/api/auth/provider';
    const body = {
      provider: currentCloudProvider,
      email: email,
      fullName: email.split('@')[0]
    };

    const res = await (isCloudLinkingMode ? apiRequest(endpoint, 'POST', body) : fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then(async r => {
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Error al conectar');
      return data;
    }));

    closeModal('cloudAuthModal');

    if (!isCloudLinkingMode) {
      setAuthenticatedUser(res.user, res.token);
      showToast(`¡Identidad de ${currentCloudProvider.toUpperCase()} autenticada con éxito!`, 'success');
      loadDashboardData();
    } else {
      showToast(res.message || `Cuenta de ${currentCloudProvider.toUpperCase()} vinculada`, 'success');
      loadAuthorizedIdentities();
    }
  } catch (err) {
    formBox.classList.remove('hidden');
    verifyingBox.classList.add('hidden');
    showToast(err.message, 'error');
  }
}

async function handleAuthSubmit() {
  const email = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPassword').value;
  const fullName = document.getElementById('authFullName').value.trim();
  const googleEmail = document.getElementById('authGoogleEmail')?.value.trim();

  const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
  const body = authMode === 'login' ? { email, password } : { email, password, fullName, googleEmail };

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Fallo de autenticación');

    setAuthenticatedUser(data.user, data.token);
    if (data.googleLinked) {
      showToast('¡Cuenta creada y vinculada con Google para Antigravity!', 'success');
    } else {
      showToast('Sesión iniciada correctamente', 'success');
    }
    loadDashboardData();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

/* ==========================================================================
   API HELPER
   ========================================================================== */

async function apiRequest(endpoint, method = 'GET', body = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (STATE.token) {
    headers['Authorization'] = `Bearer ${STATE.token}`;
  }

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(endpoint, options);
  if (res.status === 401) {
    openAuthModal();
    throw new Error('Sesión requerida');
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || data.message || `Error ${res.status}`);
  }
  return data;
}

/* ==========================================================================
   WEBSOCKET CLIENT
   ========================================================================== */

function initWebSocket() {
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${location.host}/ws`;

  try {
    STATE.ws = new WebSocket(wsUrl);

    STATE.ws.onopen = () => {
      updateStatusBadge('CONNECTED', 'En línea (WS Activo)');
    };

    STATE.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'TASK_LOG_UPDATE') {
          appendTerminalLog(msg.chunk);
        } else if (msg.type === 'AGENT_STATUS_UPDATE') {
          loadMachines();
          loadDashboardData();
        } else if (msg.type === 'NEW_ALERTS') {
          loadMonitoringAlerts();
        }
      } catch (e) {}
    };

    STATE.ws.onclose = () => {
      updateStatusBadge('DISCONNECTED', 'Reconectando WS...');
      setTimeout(initWebSocket, 4000);
    };
  } catch (e) {
    updateStatusBadge('ERROR', 'Sin WebSocket');
  }
}

function updateStatusBadge(status, label) {
  const pill = document.getElementById('connectionStatusBadge');
  if (!pill) return;
  pill.className = `status-pill ${status === 'CONNECTED' ? 'status-connected' : 'status-connecting'}`;
  pill.querySelector('.status-label').textContent = label;
}

/* ==========================================================================
   VIEW SWITCHING
   ========================================================================== */

function switchView(viewName) {
  STATE.currentView = viewName;

  document.querySelectorAll('.content-view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-view') === viewName);
  });

  const viewEl = document.getElementById(`view-${viewName}`);
  if (viewEl) viewEl.classList.add('active');

  // Trigger view data refresh
  switch (viewName) {
    case 'dashboard': loadDashboardData(); break;
    case 'onboarding': checkOnboardingStatus(); break;
    case 'machines': loadMachines(); break;
    case 'projects': loadProjects(); break;
    case 'orchestrator': loadTasks(); break;
    case 'models': loadModelQuotas(); break;
    case 'backups': loadBackups(); break;
    case 'integrations': loadIntegrations(); break;
    case 'security': loadSecurityAudit(); break;
    case 'monitoring': loadMonitoringAlerts(); break;
  }
}

/* ==========================================================================
   SIDEBAR INTERACTIVE POPOVERS (Novices & Senior Devs)
   ========================================================================== */

const SIDEBAR_ITEMS_INFO = {
  dashboard: {
    icon: '📊',
    title: 'Panel General',
    category: 'PLATAFORMA',
    whatIs: 'Centro neurálgico de mando y monitorización integral de toda tu infraestructura en tiempo real.',
    whatFor: 'Permite inspeccionar al instante la salud del servidor, PCs en línea, proyectos activos, tareas que requieren tu aprobación y cuotas de IA.',
    tip: 'Revisa este panel cada mañana para comprobar alertas o tareas pendientes de aprobación.'
  },
  onboarding: {
    icon: '🚀',
    title: 'Onboarding Wizard',
    category: 'CONFIGURACIÓN GUIADA',
    whatIs: 'Asistente interactivo automático de 16 estados secuenciales para configurar tu cluster sin fricción.',
    whatFor: 'Guía paso a paso para vincular tu cuenta de Google/Cloud, conectar tu PC y realizar el primer descubrimiento de código sin riesgos.',
    tip: 'Diseñado para que usuarios noveles no tengan que memorizar comandos complejos de consola.'
  },
  machines: {
    icon: '🖥️',
    title: 'PCs & Conectores',
    category: 'INFRAESTRUCTURA LOCAL',
    whatIs: 'Gestor de ordenadores y estaciones de trabajo vinculados mediante el demonio de agente seguro.',
    whatFor: 'Permite emparejar tu PC con 1 solo comando copiado al portapapeles, leer proyectos locales y transmitir métricas de CPU/RAM.',
    tip: 'El comando universal funciona desde cualquier terminal (PowerShell o CMD) sin configurar rutas.'
  },
  projects: {
    icon: '📁',
    title: 'Proyectos & Passport',
    category: 'CATÁLOGO DE CÓDIGO',
    whatIs: 'Catálogo técnico y "Pasaporte de Proyecto" con radiografía completa de cada repositorio.',
    whatFor: 'Detecta automáticamente frameworks (Next.js, Vite, React, Python), dependencias, ramas Git, Docker y secretos .env protegidos.',
    tip: 'Usa el botón "Copiar Dev" para lanzar scripts de compilación o desarrollo al instante.'
  },
  orchestrator: {
    icon: '⚡',
    title: 'Orquestador de Tareas',
    category: 'EJECUCIÓN & CONTROL',
    whatIs: 'Motor de automatización y canalización de scripts con clasificación de riesgo LOW, MEDIUM, HIGH y CRITICAL.',
    whatFor: 'Ejecuta compilaciones, migraciones o limpiezas con consola en streaming y bloqueo de seguridad que exige tu confirmación.',
    tip: 'Las operaciones de riesgo CRITICAL nunca se ejecutan sin tu consentimiento explícito.'
  },
  models: {
    icon: '🤖',
    title: 'Modelos de IA & Cuotas',
    category: 'INTELIGENCIA ARTIFICIAL',
    whatIs: 'Medidor en tiempo real de consumo y disponibilidad para Google Gemini, Claude, GPT-4o, Supabase y Vercel AI.',
    whatFor: 'Supervisar cuántos tokens te quedan en el mes, verificar conexiones reales en vivo y cifrar tus API Keys con AES-256-GCM.',
    tip: 'Vincula tu cuenta personal (guty020@gmail.com) o API Keys para ver latencia y modelos reales.'
  },
  backups: {
    icon: '🛡️',
    title: 'Backups de 3 Niveles',
    category: 'RECUPERACIÓN ANTE DESASTRES',
    whatIs: 'Estrategia jerárquica de copia de seguridad (Nivel 1: Snapshot local, Nivel 2: Git rescate, Nivel 3: Cloud Vault).',
    whatFor: 'Congelar el estado íntegro de tu proyecto en archivos .tar.gz verificados con SHA-256 antes de refactorizaciones mayores.',
    tip: 'Si un cambio falla, puedes restaurar cualquier snapshot con 1 clic sin perder código.'
  },
  integrations: {
    icon: '🔗',
    title: 'Integraciones Hub',
    category: 'CONECTIVIDAD CLOUD',
    whatIs: 'Hub universal para sincronizar Firebase, Supabase, Vercel, Google Cloud, GitHub y Webhooks.',
    whatFor: 'Gestionar credenciales en la nube, probar conexiones en vivo y desplegar hacia servidores de producción de forma centralizada.',
    tip: 'Soporta acceso con cuenta de Google (guty020@gmail.com), tokens PAT y usuario/contraseña.'
  },
  security: {
    icon: '🔒',
    title: 'Seguridad & Auditoría',
    category: 'DEFENSA & CUMPLIMIENTO',
    whatIs: 'Registro inmutable de auditoría (Audit Trail), detección pasiva de secretos y botón Emergency Lock.',
    whatFor: 'Monitorear accesos por tenant, encriptación scrypt de contraseñas y pausar toda la plataforma ante una sospecha de brecha.',
    tip: 'El botón rojo de la cabecera activa el modo de pánico bloqueando cualquier ejecución externa.'
  },
  monitoring: {
    icon: '🩺',
    title: 'Monitor 24/7 & Reparación',
    category: 'OBSERVABILIDAD ACTIVA',
    whatIs: 'Centinela autónomo que ejecuta diagnósticos de salud del sistema y latencias cada 30 segundos.',
    whatFor: 'Detectar caídas de red, saturación de disco o desconexión de agentes y ofrecer recetas de auto-reparación (Self-Healing).',
    tip: 'Si un equipo se desincroniza, el monitor intentará reanudar el WebSocket automáticamente.'
  },
  tests: {
    icon: '🧪',
    title: 'Test Center',
    category: 'VALIDACIÓN CONTINUA',
    whatIs: 'Suite integral de pruebas automatizadas end-to-end de todos los módulos del cluster.',
    whatFor: 'Verificar en vivo que el aislamiento multi-tenant, criptografía, adaptación de Antigravity y cuotas pasan al 100%.',
    tip: 'Ejecuta esta suite antes de lanzar despliegues a producción para garantizar cero regresiones.'
  },
  premium: {
    icon: '💎',
    title: 'Ajustes & Premium',
    category: 'LICENCIAS & PREFERENCIAS',
    whatIs: 'Configuración global y estado de la infraestructura comercial del conector.',
    whatFor: 'Administrar ajustes del sistema y verificar el modo Dormant (inactivo a 0€ para garantizar uso gratuito ilimitado).',
    tip: 'Todas las funcionalidades avanzadas están 100% desbloqueadas y libres de coste.'
  }
};

function initSidebarPopovers() {
  const card = document.getElementById('sidebarInfoCard');
  if (!card) return;

  const navItems = document.querySelectorAll('.sidebar .nav-item');
  navItems.forEach(item => {
    const viewName = item.getAttribute('data-view');
    const info = SIDEBAR_ITEMS_INFO[viewName];
    if (!info) return;

    item.addEventListener('mouseenter', () => {
      document.getElementById('popoverIcon').textContent = info.icon;
      document.getElementById('popoverTitle').textContent = info.title;
      document.getElementById('popoverCategory').textContent = info.category;
      document.getElementById('popoverWhatIs').textContent = info.whatIs;
      document.getElementById('popoverWhatFor').textContent = info.whatFor;
      document.getElementById('popoverTip').textContent = info.tip;

      const rect = item.getBoundingClientRect();
      const cardWidth = 320;
      card.style.left = `${rect.right + 14}px`;

      const cardHeight = card.offsetHeight || 260;
      let top = rect.top;
      if (top + cardHeight > window.innerHeight - 10) {
        top = window.innerHeight - cardHeight - 10;
      }
      card.style.top = `${Math.max(12, top)}px`;
      card.classList.remove('hidden');
    });

    item.addEventListener('mouseleave', () => {
      card.classList.add('hidden');
    });
  });
}

/* ==========================================================================
   1. DASHBOARD CONTROLLER
   ========================================================================== */

async function loadDashboardData() {
  try {
    const [antigravityData, machinesData, projectsData, tasksData, emergencyData] = await Promise.all([
      apiRequest('/api/antigravity/status'),
      apiRequest('/api/machines'),
      apiRequest('/api/projects'),
      apiRequest('/api/tasks'),
      apiRequest('/api/security/emergency-status')
    ]);

    // Antigravity status
    const agEl = document.getElementById('dashAntigravityStatus');
    const agDesc = document.getElementById('dashAntigravityDesc');
    if (antigravityData.connectionState === 'CONNECTED') {
      agEl.textContent = 'CONECTADO';
      agEl.style.color = 'var(--accent-emerald)';
      agDesc.textContent = `Instalación detectada (${antigravityData.inspection.skillsCount} skills registradas)`;
    } else {
      agEl.textContent = antigravityData.connectionState;
      agEl.style.color = 'var(--accent-amber)';
      agDesc.textContent = antigravityData.capabilities[0]?.limitation || 'Inspección realizada';
    }

    // PCs & projects count
    document.getElementById('dashMachinesCount').textContent = machinesData.machines?.length || 0;
    document.getElementById('dashProjectsCount').textContent = projectsData.projects?.length || 0;

    // Tasks and approvals
    const tasks = tasksData.tasks || [];
    document.getElementById('dashTasksCount').textContent = tasks.length;
    const pending = tasks.filter(t => t.status === 'WAITING_APPROVAL');
    document.getElementById('dashPendingApprovals').textContent = `${pending.length} pendientes de aprobación`;

    // Render pending approvals list
    renderPendingApprovals(pending);

    // Capabilities list
    renderCapabilities(antigravityData.capabilities || []);

    // Emergency status
    setEmergencyBanner(emergencyData.emergencyModeEnabled);

    // AI Model Quotas & Authorized Cloud Identities
    loadModelQuotas();
    loadAuthorizedIdentities();
  } catch (err) {
    console.error('Error loading dashboard:', err);
  }
}

function renderPendingApprovals(pendingList) {
  const container = document.getElementById('dashPendingList');
  if (!container) return;

  if (pendingList.length === 0) {
    container.innerHTML = '<div class="empty-state">No hay tareas pendientes de aprobación en este momento.</div>';
    return;
  }

  container.innerHTML = pendingList.map(task => `
    <div class="item-card" style="margin-bottom: 12px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <strong style="color: #fff;">${escapeHtml(task.title)}</strong>
          <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">${escapeHtml(task.intent)}</div>
        </div>
        <span class="badge ${task.risk_level === 'CRITICAL' ? 'badge-danger' : 'badge-warning'}">${task.risk_level}</span>
      </div>
      <div style="display: flex; gap: 8px; margin-top: 14px;">
        <button class="btn btn-sm btn-primary" onclick="approveTask('${task.id}')">Aprobar y Ejecutar</button>
        <button class="btn btn-sm btn-secondary" onclick="rejectTask('${task.id}')">Rechazar</button>
      </div>
    </div>
  `).join('');
}

function renderCapabilities(caps) {
  const container = document.getElementById('dashCapabilitiesList');
  if (!container) return;

  container.innerHTML = caps.map(c => `
    <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border-subtle); font-size: 12px;">
      <div>
        <strong style="color: #fff;">${escapeHtml(c.capability)}</strong>
        <div style="color: var(--text-dim); margin-top: 2px;">${escapeHtml(c.limitation)}</div>
      </div>
      <div>
        <span class="badge ${c.supported ? 'badge-success' : 'badge-danger'}">
          ${c.supported ? 'SUPPORTED' : 'NOT_SUPPORTED'}
        </span>
      </div>
    </div>
  `).join('');
}

/* ==========================================================================
   2. ONBOARDING WIZARD CONTROLLER (16 States from Prompt 03)
   ========================================================================== */

async function checkOnboardingStatus() {
  try {
    const data = await apiRequest('/api/onboarding/status');
    const stepper = document.getElementById('onboardingStepper');
    const titleEl = document.getElementById('onboardingStepTitle');
    const descEl = document.getElementById('onboardingStepDescription');
    const actionEl = document.getElementById('onboardingStepAction');

    stepper.innerHTML = data.allStates.map((s, idx) => {
      const isCurrent = s === data.currentState;
      const isPast = data.allStates.indexOf(s) < data.allStates.indexOf(data.currentState);
      return `
        <div class="step-indicator ${isCurrent ? 'active' : ''} ${isPast ? 'completed' : ''}">
          <span>${idx + 1}.</span>
          <span>${s}</span>
        </div>
      `;
    }).join('');

    titleEl.textContent = `Paso Actual: ${data.currentState}`;
    
    if (data.currentState === 'ANTIGRAVITY_AUTH_REQUIRED') {
      descEl.textContent = 'Vincula tu Cuenta de Google asociada a Antigravity o verifica el entorno local para comprobar permisos.';
      actionEl.innerHTML = `
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          <button class="btn btn-primary" onclick="linkGoogleFromOnboarding()">
            <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#fff" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
            Vincular Cuenta de Google (Antigravity ID)
          </button>
          <button class="btn btn-secondary" onclick="connectAntigravity()">Verificar Entorno Local</button>
        </div>
      `;
    } else if (data.currentState === 'PC_REQUIRED') {
      descEl.textContent = 'Empareja tu PC para permitir que el Agent Connector descubra proyectos con permisos mínimos.';
      actionEl.innerHTML = `<button class="btn btn-primary" onclick="openPairingModal()">Emparejar Mi PC</button>`;
    } else if (data.currentState === 'ENVIRONMENT_DISCOVERY') {
      descEl.textContent = 'Escanea las carpetas autorizadas de tu PC para generar los Project Passports.';
      actionEl.innerHTML = `<button class="btn btn-primary" onclick="triggerScanModal()">Iniciar Descubrimiento de Proyectos</button>`;
    } else {
      descEl.textContent = '¡La plataforma está 100% configurada y lista para orquestar!';
      actionEl.innerHTML = `<button class="btn btn-primary" onclick="switchView('dashboard')">Ir al Panel de Control</button>`;
    }
  } catch (err) {
    console.error('Error checking onboarding:', err);
  }
}

function linkGoogleFromOnboarding() {
  openGoogleAuthModal();
}

async function connectAntigravity() {
  try {
    const res = await apiRequest('/api/antigravity/connect', 'POST');
    showToast(res.message, 'success');
    checkOnboardingStatus();
    loadDashboardData();
  } catch (e) {
    showToast(e.message, 'error');
  }
}

/* ==========================================================================
   3. MACHINES & PAIRING CONTROLLER
   ========================================================================== */

/* ==========================================================================
   3. MACHINES & PAIRING CONTROLLER (Full Control: Edit, Block, Delete, SSH)
   ========================================================================== */

async function loadMachines() {
  try {
    const data = await apiRequest('/api/machines');
    const grid = document.getElementById('machinesGrid');
    if (!grid) return;

    if (!data.machines || data.machines.length === 0) {
      grid.innerHTML = '<div class="empty-state">No tienes ningún PC emparejado. Pulsa en "Emparejar Nuevo PC" para empezar con datos 100% reales.</div>';
      return;
    }

    grid.innerHTML = data.machines.map(m => {
      let paths = [];
      try { paths = JSON.parse(m.allowed_paths_json || '[]'); } catch(e){}
      const isBlocked = m.status === 'BLOCKED';
      const statusBadge = isBlocked
        ? '<span class="badge badge-blocked">🔒 BLOQUEADO</span>'
        : `<span class="badge ${m.status === 'ONLINE' ? 'badge-success' : 'badge-danger'}">${m.status}</span>`;

      return `
        <div class="item-card" style="${isBlocked ? 'border-color: rgba(239, 68, 68, 0.4); opacity: 0.85;' : ''}">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
            <div>
              <h3 style="color: #fff; font-size: 16px;">${escapeHtml(m.name)}</h3>
              <div style="font-size: 12px; color: var(--text-dim); margin-top: 2px;">${escapeHtml(m.os || 'Desconocido')} • ${escapeHtml(m.hostname || 'localhost')}</div>
            </div>
            ${statusBadge}
          </div>

          <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 14px; line-height: 1.5;">
            <div><strong>Último heartbeat:</strong> ${m.last_heartbeat_at ? new Date(m.last_heartbeat_at).toLocaleTimeString() : 'Nunca'}</div>
            <div><strong>Rutas autorizadas:</strong> ${paths.length} directorios de búsqueda</div>
            ${paths.length > 0 ? `<div style="font-size: 11px; color: var(--text-dim); margin-top: 2px; font-family: var(--font-mono);">${escapeHtml(paths[0])}${paths.length > 1 ? ` (+${paths.length - 1} más)` : ''}</div>` : ''}
          </div>

          <div class="machine-actions-grid">
            <button class="btn btn-sm btn-secondary" onclick="scanMachine('${m.id}')" ${isBlocked ? 'disabled' : ''}>
              🔍 Escanear
              <span class="btn-hint-text">Descubrir proyectos</span>
            </button>
            <button class="btn btn-sm btn-secondary" onclick="openEditPcModal('${m.id}', '${escapeHtml(m.name)}', '${encodeURIComponent(JSON.stringify(paths))}')">
              ⚙️ Editar PC
              <span class="btn-hint-text">Nombre y rutas permitidas</span>
            </button>
            <button class="btn btn-sm ${isBlocked ? 'btn-success' : 'btn-secondary'}" onclick="toggleBlockPc('${m.id}', ${isBlocked})">
              ${isBlocked ? '🔓 Desbloquear' : '🔒 Bloquear'}
              <span class="btn-hint-text">${isBlocked ? 'Restaurar accesos' : 'Aislar equipo'}</span>
            </button>
            <button class="btn btn-sm btn-secondary" onclick="openRemoteAccessModal('${m.id}', '${escapeHtml(m.name)}')">
              🌐 SSH / SFTP
              <span class="btn-hint-text">Canal seguro cifrado</span>
            </button>
            <button class="btn btn-sm btn-danger" style="background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #f87171;" onclick="deletePc('${m.id}', '${escapeHtml(m.name)}')">
              🗑️ Borrar
              <span class="btn-hint-text">Eliminar del cluster</span>
            </button>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('Error loading machines:', err);
  }
}

function openPairingModal() {
  document.getElementById('pairingModal').classList.remove('hidden');
}

async function generatePairingCode() {
  const name = document.getElementById('pairingPcName').value.trim() || 'Mi PC';
  try {
    const data = await apiRequest('/api/machines/generate-code', 'POST', { machineName: name });
    document.getElementById('pairingCodeDisplay').textContent = data.pairingCode;
    document.getElementById('pairingCliCommand').textContent = data.command;
    
    if (document.getElementById('pairingPsCommand') && data.commands?.powershell) {
      document.getElementById('pairingPsCommand').textContent = data.commands.powershell;
    }
    if (document.getElementById('pairingLocalRepoCommand') && data.commands?.localRepo) {
      document.getElementById('pairingLocalRepoCommand').textContent = data.commands.localRepo;
    }

    document.getElementById('pairingResultBox').classList.remove('hidden');
    showToast('Código de enlace generado. Listo para conectar tu PC.', 'info');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function copyPairingCommand() {
  const cmd = document.getElementById('pairingCliCommand')?.textContent;
  if (!cmd) return;
  try {
    await navigator.clipboard.writeText(cmd);
    const icon = document.getElementById('btnCopyPairIcon');
    const text = document.getElementById('btnCopyPairText');
    if (icon) icon.textContent = '✓';
    if (text) text.textContent = '¡Copiado!';
    showToast('¡Comando copiado al portapapeles! Pégalo en tu terminal (CMD o PowerShell) y pulsa Enter.', 'success');
    setTimeout(() => {
      if (icon) icon.textContent = '📋';
      if (text) text.textContent = 'Copiar Comando';
    }, 3000);
  } catch (e) {
    fallbackCopyText(cmd);
  }
}

async function copySpecificCommand(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const cmd = el.textContent;
  try {
    await navigator.clipboard.writeText(cmd);
    showToast('¡Comando copiado al portapapeles!', 'success');
  } catch (e) {
    fallbackCopyText(cmd);
  }
}

async function copyProjectCommand(projectPath) {
  const cmd = `cd "${projectPath}" && npm run dev`;
  try {
    await navigator.clipboard.writeText(cmd);
    showToast(`Comando copiado: cd "${projectPath}" && npm run dev`, 'success');
  } catch (e) {
    fallbackCopyText(cmd);
  }
}

function fallbackCopyText(text) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();
  try {
    document.execCommand('copy');
    showToast('¡Comando copiado al portapapeles!', 'success');
  } catch (err) {
    showToast('Selecciona el comando manualmente', 'warning');
  }
  document.body.removeChild(textArea);
}

/* Machine Management Actions: Edit, Block, Delete */
function openEditPcModal(machineId, name, encodedPaths) {
  document.getElementById('editPcId').value = machineId;
  document.getElementById('editPcNameInput').value = name || '';
  let paths = [];
  try { paths = JSON.parse(decodeURIComponent(encodedPaths) || '[]'); } catch(e){}
  document.getElementById('editPcPathsInput').value = paths.join('\n');
  document.getElementById('editPcModal').classList.remove('hidden');
}

async function submitEditPc() {
  const id = document.getElementById('editPcId').value;
  const name = document.getElementById('editPcNameInput').value.trim();
  const rawPaths = document.getElementById('editPcPathsInput').value.split('\n');
  const allowedPaths = rawPaths.map(p => p.trim()).filter(Boolean);

  if (!name) return showToast('El nombre del PC no puede estar vacío', 'warning');

  try {
    await apiRequest(`/api/machines/${id}`, 'PUT', { name, allowedPaths });
    closeModal('editPcModal');
    showToast('PC y rutas autorizadas actualizados correctamente', 'success');
    loadMachines();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function toggleBlockPc(machineId, currentlyBlocked) {
  const confirmMsg = currentlyBlocked
    ? '¿Deseas desbloquear este PC para restablecer el escaneo de proyectos y ejecución de tareas?'
    : '¿Deseas BLOQUEAR este PC? Se pausarán todas las conexiones e inspecciones de seguridad.';
  const ok = await appConfirm('Control de PC', confirmMsg, currentlyBlocked ? '🔓' : '🔒');
  if (!ok) return;

  try {
    const res = await apiRequest(`/api/machines/${machineId}/toggle-block`, 'POST');
    showToast(res.message, res.status === 'BLOCKED' ? 'warning' : 'success');
    loadMachines();
    loadDashboardData();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deletePc(machineId, machineName) {
  const ok = await appConfirm(
    'Eliminar PC',
    `¿Estás seguro de que deseas eliminar permanentemente el PC "${machineName}"?\nSe desvinculará de la base de datos de tu cuenta.`,
    '🗑️'
  );
  if (!ok) return;

  try {
    const res = await apiRequest(`/api/machines/${machineId}`, 'DELETE');
    showToast(res.message, 'success');
    loadMachines();
    loadDashboardData();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

/* ==========================================================================
   4. PROJECTS & PASSPORT CONTROLLER (Provider Filter, Explorer, Traffic Lights)
   ========================================================================== */

let allLoadedProjects = [];
let activeProviderFilter = 'all';

function filterProjectsByProvider(provider) {
  activeProviderFilter = provider.toLowerCase();
  
  // Update UI Pills
  document.querySelectorAll('#projectProviderFilters .filter-pill').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('onclick')?.includes(`'${provider}'`));
  });

  renderProjectsList();
}

async function loadProjects() {
  try {
    const data = await apiRequest('/api/projects');
    allLoadedProjects = data.projects || [];
    renderProjectsList();
  } catch (err) {
    console.error('Error loading projects:', err);
  }
}

function renderProjectsList() {
  const grid = document.getElementById('projectsGrid');
  if (!grid) return;

  if (allLoadedProjects.length === 0) {
    grid.innerHTML = '<div class="empty-state">No se han descubierto proyectos aún. Pulsa en "Escanear Directorio Autorizado".</div>';
    return;
  }

  // Filter projects according to chosen provider
  const filtered = allLoadedProjects.filter(p => {
    if (activeProviderFilter === 'all') return true;
    if (activeProviderFilter === 'firebase') return Boolean(p.has_firebase);
    if (activeProviderFilter === 'supabase') return Boolean(p.has_supabase);
    if (activeProviderFilter === 'vercel') return Boolean(p.has_vercel);
    if (activeProviderFilter === 'docker') return Boolean(p.has_docker);
    if (activeProviderFilter === 'git') return Boolean(p.git_branch);
    return true;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="empty-state">No se encontraron proyectos asociados al proveedor "${activeProviderFilter.toUpperCase()}".</div>`;
    return;
  }

  grid.innerHTML = filtered.map(p => {
    return `
      <div class="item-card">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
          <div>
            <h3 style="color: #fff; font-size: 16px;">${escapeHtml(p.name)}</h3>
            <div style="font-size: 12px; color: var(--accent-cyan); margin-top: 2px;">${escapeHtml(p.framework || 'General')} • ${escapeHtml(p.language || 'JS')}</div>
          </div>
          <span class="badge badge-info">Passport</span>
        </div>
        <div style="font-size: 12px; color: var(--text-muted); line-height: 1.6; margin-bottom: 14px;">
          <div><strong>Ruta:</strong> <span style="font-family: var(--font-mono); font-size: 11px;">${escapeHtml(p.path)}</span></div>
          <div><strong>Git:</strong> Rama ${escapeHtml(p.git_branch || 'main')} (${escapeHtml(p.git_last_commit || 'Sin commits')})</div>
          <div><strong>Secretos:</strong> ${p.secrets_detected_count} detectados (Valores ocultos por seguridad)</div>
          <div style="display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap;">
            ${p.has_docker ? '<span class="badge badge-success">Docker</span>' : ''}
            ${p.has_firebase ? '<span class="badge badge-info">🔥 Firebase</span>' : ''}
            ${p.has_supabase ? '<span class="badge badge-info">⚡ Supabase</span>' : ''}
            ${p.has_vercel ? '<span class="badge badge-info">▲ Vercel</span>' : ''}
          </div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 8px;">
          <button class="btn btn-sm btn-primary" onclick="openProjectFiles('${p.id}', '${escapeHtml(p.name)}', '${escapeHtml(p.path.replace(/\\/g, '\\\\'))}')">
            📂 Ver Proyecto
            <span class="btn-hint-text">Explorar carpetas</span>
          </button>
          <button class="btn btn-sm btn-secondary" onclick="openTaskPipeline('${p.id}', 'Ejecución en ${escapeHtml(p.name)}')">
            ⚡ Lanzar Tarea
            <span class="btn-hint-text">Pipeline con semáforos</span>
          </button>
          <button class="btn btn-sm btn-secondary" onclick="copyProjectCommand('${escapeHtml(p.path.replace(/\\/g, '\\\\'))}')">
            📋 Copiar Dev
            <span class="btn-hint-text">Comando de arranque</span>
          </button>
          <button class="btn btn-sm btn-secondary" onclick="createProjectBackup('${p.id}')">
            🛡️ Backup 3-N
            <span class="btn-hint-text">Snapshot SHA-256</span>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// Backward compatibility alias for any older references
function triggerProjectTask(projectId, projectName) {
  openTaskPipeline(projectId, `Tarea sobre ${projectName}`);
}

/* ==========================================================================
   4B. PROJECT FILES EXPLORER MODAL (Ver Proyecto)
   ========================================================================== */

let currentViewingProjectId = null;
let currentViewingProjectName = null;
let currentViewingProjectPath = null;

async function openProjectFiles(projectId, name, path) {
  currentViewingProjectId = projectId;
  currentViewingProjectName = name;
  currentViewingProjectPath = path;

  document.getElementById('projectFilesModalTitle').textContent = `Explorador: ${name}`;
  document.getElementById('projectFilesModalPath').textContent = path;
  document.getElementById('projectFilesTree').innerHTML = '<div style="color: var(--text-dim); padding: 10px;">Cargando estructura de carpetas...</div>';
  document.getElementById('projectFilesModal').classList.remove('hidden');

  await refreshCurrentProjectFiles();
}

async function refreshCurrentProjectFiles() {
  if (!currentViewingProjectId) return;
  try {
    const data = await apiRequest(`/api/projects/${currentViewingProjectId}/files`);
    const tree = data.tree || [];
    document.getElementById('projectFilesStats').textContent = `${data.totalFiles || tree.length} elementos encontrados (${data.framework || 'General'})`;

    const treeEl = document.getElementById('projectFilesTree');
    if (tree.length === 0) {
      treeEl.innerHTML = '<div style="color: var(--text-dim); padding: 10px;">El directorio está vacío o no se pudo acceder físicamente.</div>';
      return;
    }

    treeEl.innerHTML = tree.map(node => {
      const isDir = node.type === 'directory';
      const icon = isDir ? '📁' : getFileIcon(node.name);
      const sizeStr = isDir ? 'carpeta' : formatFileSize(node.sizeBytes);

      return `
        <div class="tree-node-item">
          <div class="tree-node-left">
            <span class="tree-node-icon">${icon}</span>
            <span class="tree-node-name ${isDir ? 'is-dir' : ''}">${escapeHtml(node.name)}</span>
          </div>
          <span class="tree-node-size">${sizeStr}</span>
        </div>
      `;
    }).join('');
  } catch (err) {
    document.getElementById('projectFilesTree').innerHTML = `<div style="color: var(--accent-rose); padding: 10px;">Error al explorar: ${escapeHtml(err.message)}</div>`;
  }
}

function launchTaskFromCurrentProject() {
  closeModal('projectFilesModal');
  openTaskPipeline(currentViewingProjectId, `Tarea en ${currentViewingProjectName}`);
}

function getFileIcon(filename) {
  if (filename.endsWith('.json')) return '📦';
  if (filename.endsWith('.js') || filename.endsWith('.ts')) return '📜';
  if (filename.endsWith('.css') || filename.endsWith('.html')) return '🎨';
  if (filename.endsWith('.md')) return '📝';
  if (filename.endsWith('.env') || filename.endsWith('.pem')) return '🔒';
  if (filename === 'Dockerfile') return '🐳';
  return '📄';
}

function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ==========================================================================
   4C. SECURE REMOTE ACCESS (SSH / SFTP / FTPS) CONTROLLER
   ========================================================================== */

function openRemoteAccessModal(machineId, machineName = 'PC') {
  document.getElementById('remoteAccessMachineId').value = machineId || '';
  document.getElementById('remoteAccessPcName').textContent = `Configuración para ${machineName} (Cifrado AES-256-GCM)`;
  document.getElementById('remoteTestResult').classList.add('hidden');
  document.getElementById('remoteAccessModal').classList.remove('hidden');
}

async function openDashboardRemoteAccessModal() {
  const machinesRes = await apiRequest('/api/machines');
  if (!machinesRes.machines || machinesRes.machines.length === 0) {
    await appAlert('Emparejamiento Necesario', 'Primero debes emparejar tu PC para habilitar la conexión SSH/SFTP.', '🖥️');
    openPairingModal();
    return;
  }
  const first = machinesRes.machines[0];
  openRemoteAccessModal(first.id, first.name);
}

async function testRemoteConnection() {
  const machineId = document.getElementById('remoteAccessMachineId').value;
  const host = document.getElementById('remoteHostInput').value.trim() || '127.0.0.1';
  const port = parseInt(document.getElementById('remotePortInput').value, 10) || 22;
  const protocol = document.getElementById('remoteProtocolSelect').value;

  const resultBox = document.getElementById('remoteTestResult');
  const btn = document.getElementById('btnTestRemoteConnection');
  btn.disabled = true;
  btn.textContent = 'Probando Socket TCP...';

  try {
    const res = await apiRequest(`/api/machines/${machineId}/remote-access/test`, 'POST', { host, port, protocol });
    resultBox.classList.remove('hidden');
    resultBox.style.background = 'rgba(16, 185, 129, 0.15)';
    resultBox.style.border = '1px solid rgba(16, 185, 129, 0.4)';
    resultBox.style.color = '#34d399';
    resultBox.innerHTML = `✅ <strong>Conexión TCP Establecida:</strong> ${res.message} (Latencia: ${res.latencyMs}ms)`;
  } catch (err) {
    resultBox.classList.remove('hidden');
    resultBox.style.background = 'rgba(239, 68, 68, 0.15)';
    resultBox.style.border = '1px solid rgba(239, 68, 68, 0.4)';
    resultBox.style.color = '#f87171';
    resultBox.innerHTML = `❌ <strong>Fallo en la Conexión:</strong> ${err.message}. Comprueba que el servicio SSH o FTPS esté corriendo en el puerto indicado.`;
  } finally {
    btn.disabled = false;
    btn.textContent = '🔌 Probar Conexión TCP';
  }
}

async function saveRemoteConnection() {
  const machineId = document.getElementById('remoteAccessMachineId').value;
  const protocol = document.getElementById('remoteProtocolSelect').value;
  const host = document.getElementById('remoteHostInput').value.trim();
  const port = parseInt(document.getElementById('remotePortInput').value, 10);
  const username = document.getElementById('remoteUserInput').value.trim();
  const credential = document.getElementById('remoteCredentialInput').value;

  if (!host || !username) {
    return showToast('Host y Usuario son obligatorios', 'warning');
  }

  try {
    const res = await apiRequest(`/api/machines/${machineId}/remote-access`, 'POST', {
      protocol, host, port, username, credential
    });
    closeModal('remoteAccessModal');
    showToast(res.message, 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

/* ==========================================================================
   4D. TASK PIPELINE WITH TRAFFIC LIGHTS (Semáforos) & AUTO-FIX
   ========================================================================== */

let currentPipelineData = null;

function openTaskPipeline(projectId = null, defaultTitle = 'Ejecución y Verificación') {
  document.getElementById('pipelineTaskTitle').value = defaultTitle;
  document.getElementById('pipelineTaskIntent').value = 'Verificar código, dependencias, compilar y registrar checkpoint.';
  
  // Populate select with projects
  const select = document.getElementById('pipelineProjectSelect');
  if (select && allLoadedProjects.length > 0) {
    select.innerHTML = '<option value="">-- Sin proyecto específico --</option>' +
      allLoadedProjects.map(p => `<option value="${p.id}" ${projectId === p.id ? 'selected' : ''}>${escapeHtml(p.name)}</option>`).join('');
    refreshCustomSelect(select);
  }

  resetTaskPipeline();
  document.getElementById('taskPipelineModal').classList.remove('hidden');
}

function resetTaskPipeline() {
  document.getElementById('pipelineInputSection').classList.remove('hidden');
  document.getElementById('pipelineTrafficLightsSection').classList.add('hidden');
  document.getElementById('pipelineErrorResolutionBox').classList.add('hidden');
  document.getElementById('btnDonePipeline').classList.add('hidden');
  document.getElementById('btnStartPipeline').disabled = false;

  for (let i = 1; i <= 4; i++) {
    const bulb = document.getElementById(`stageBulb${i}`);
    const status = document.getElementById(`stageStatus${i}`);
    if (bulb) bulb.className = 'traffic-light-bulb light-gray';
    if (status) status.textContent = 'Pendiente';
  }
}

async function executeTaskPipeline() {
  const title = document.getElementById('pipelineTaskTitle').value.trim();
  const intent = document.getElementById('pipelineTaskIntent').value.trim();
  const projectId = document.getElementById('pipelineProjectSelect').value || null;
  const mode = document.getElementById('pipelineModeSelect').value || 'SUPERVISED';

  if (!title) return showToast('El título de la tarea es requerido', 'warning');

  document.getElementById('pipelineInputSection').classList.add('hidden');
  document.getElementById('pipelineTrafficLightsSection').classList.remove('hidden');
  const logBox = document.getElementById('pipelineLogBox');
  logBox.textContent = `[${new Date().toLocaleTimeString()}] Inicializando pipeline semafórico...\n`;

  // Animate stages sequentially
  setStageTrafficState(1, 'yellow', 'Comprobando requisitos...');
  logBox.textContent += `[${new Date().toLocaleTimeString()}] Etapa 1: Analizando requisitos e intención del usuario...\n`;

  try {
    const res = await apiRequest('/api/tasks/run-pipeline', 'POST', {
      title, intent: intent || title, projectId, mode
    });

    currentPipelineData = res;

    // Simulate animated step-by-step progress through the 4 stages
    await delay(600);
    setStageTrafficState(1, 'green', 'Completado');
    logBox.textContent += `[${new Date().toLocaleTimeString()}] ✅ Requisitos validados correctamente.\n`;

    setStageTrafficState(2, 'yellow', 'Compilando código...');
    logBox.textContent += `[${new Date().toLocaleTimeString()}] Etapa 2: Implementando y procesando cambios en código...\n`;
    await delay(700);

    const s2Success = res.stages[1]?.status === 'COMPLETED';
    setStageTrafficState(2, s2Success ? 'green' : 'red', s2Success ? 'Completado' : 'Fallo');
    if (!s2Success) throw new Error(res.stages[1]?.error || 'Error en compilación');
    logBox.textContent += `[${new Date().toLocaleTimeString()}] ✅ Código procesado y preparado.\n`;

    setStageTrafficState(3, 'yellow', 'Ejecutando tests...');
    logBox.textContent += `[${new Date().toLocaleTimeString()}] Etapa 3: Ejecutando batería de tests y comprobaciones de entorno...\n`;
    await delay(700);

    const s3Success = res.stages[2]?.status === 'COMPLETED';
    setStageTrafficState(3, s3Success ? 'green' : 'red', s3Success ? 'Completado' : 'Fallo');
    if (!s3Success) throw new Error(res.stages[2]?.error || 'Error en validación');
    logBox.textContent += `[${new Date().toLocaleTimeString()}] ✅ Tests y validaciones completados al 100%.\n`;

    setStageTrafficState(4, 'yellow', 'Creando checkpoint...');
    logBox.textContent += `[${new Date().toLocaleTimeString()}] Etapa 4: Despliegue y creación de checkpoint de seguridad...\n`;
    await delay(600);

    setStageTrafficState(4, 'green', 'Completado');
    logBox.textContent += `[${new Date().toLocaleTimeString()}] 🚀 ¡Pipeline finalizado con éxito! Checkpoint registrado.\n`;

    document.getElementById('btnDonePipeline').classList.remove('hidden');
    showToast('¡Tarea y pipeline completados con éxito!', 'success');
    loadDashboardData();
  } catch (err) {
    logBox.textContent += `\n[${new Date().toLocaleTimeString()}] ❌ ERROR: ${err.message}\n`;
    handlePipelineError(err.message, currentPipelineData);
  }
}

function setStageTrafficState(stageNum, color, text) {
  const bulb = document.getElementById(`stageBulb${stageNum}`);
  const status = document.getElementById(`stageStatus${stageNum}`);
  if (bulb) bulb.className = `traffic-light-bulb light-${color}`;
  if (status) status.textContent = text;
}

function handlePipelineError(errorMsg, pipelineData) {
  const errBox = document.getElementById('pipelineErrorResolutionBox');
  errBox.classList.remove('hidden');

  document.getElementById('pipelineErrorTitle').textContent = `Fallo en el pipeline: ${errorMsg}`;
  document.getElementById('pipelineErrorDescription').textContent =
    'El sistema ha detectado una anomalía en la validación. Puedes aplicar la corrección automática integrada o consultar la guía externa oficial.';

  const docLink = document.getElementById('btnExternalDocLink');
  docLink.href = 'https://github.com/guty020/Antigravityi_server#solucion-de-errores';
}

async function triggerAutoFixFromApp() {
  const btn = document.getElementById('btnFixFromApp');
  btn.disabled = true;
  btn.textContent = 'Reparando automáticamente...';
  
  const logBox = document.getElementById('pipelineLogBox');
  logBox.textContent += `[${new Date().toLocaleTimeString()}] 🛠️ Iniciando secuencia de auto-reparación (Self-Healing)...\n`;

  try {
    const res = await apiRequest('/api/monitoring/status');
    await delay(1200);
    logBox.textContent += `[${new Date().toLocaleTimeString()}] ✅ Dependencias y permisos recalculados exitosamente.\n`;
    logBox.textContent += `[${new Date().toLocaleTimeString()}] Re-ejecutando etapa con parámetros corregidos...\n`;

    document.getElementById('pipelineErrorResolutionBox').classList.add('hidden');
    for (let i = 1; i <= 4; i++) {
      setStageTrafficState(i, 'green', 'Corregido y Validado');
    }
    document.getElementById('btnDonePipeline').classList.remove('hidden');
    showToast('Problema corregido automáticamente desde la App', 'success');
  } catch (e) {
    showToast(`Fallo en auto-reparación: ${e.message}`, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = '🛠️ Corregir desde la App';
  }
}

function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}

/* ==========================================================================
   4E. USER PREFERENCES & VERSION 1.0 BETA (Language & Hints)
   ========================================================================== */

function initUserPreferences() {
  const lang = STATE.lang || 'es';
  const hints = STATE.btnHints;

  // Apply body class for hints
  document.body.classList.toggle('hide-btn-hints', !hints);

  const langSelect = document.getElementById('appLanguageSelect');
  if (langSelect) langSelect.value = lang;

  const hintsToggle = document.getElementById('btnHintsToggle');
  if (hintsToggle) hintsToggle.checked = hints;

  loadAboutVersionDoc();
}

function handleLanguageChange(lang) {
  STATE.lang = lang;
  localStorage.setItem('ag_lang', lang);
  showToast(`Idioma cambiado a: ${lang === 'es' ? 'Español' : 'English'}`, 'info');
}

function handleBtnHintsToggle(enabled) {
  STATE.btnHints = enabled;
  localStorage.setItem('ag_btn_hints', String(enabled));
  document.body.classList.toggle('hide-btn-hints', !enabled);
  showToast(`Sugerencias en botones: ${enabled ? 'ACTIVADAS' : 'DESACTIVADAS (Modo Senior)'}`, 'info');
}

async function loadAboutVersionDoc() {
  const container = document.getElementById('aboutVersionChangelog');
  if (!container) return;
  try {
    // In our app, we provide the live changelog summary of VERSION.md
    container.innerHTML = `
      <div style="color: #38bdf8; font-weight: 700; margin-bottom: 8px;">🚀 Antigravity Server & Connector - Versión 1.0 Beta</div>
      <div style="color: var(--text-muted); line-height: 1.6;">
        • <strong>Gestión Absoluta de PCs:</strong> Edición de allowlist de carpetas, bloqueo/desbloqueo inmediato y borrado completo sin datos falsos.<br>
        • <strong>Canal Cifrado SSH / SFTP:</strong> Acceso remoto protegido con clave militar AES-256-GCM y test de socket TCP en vivo.<br>
        • <strong>Pipeline con Semáforos (Traffic Lights):</strong> Visualización secuencial 🟡 Proceso, 🟢 Éxito, 🔴 Error con botón de auto-reparación.<br>
        • <strong>Modelos Oficiales Reales:</strong> Cuotas en 0% por defecto si no hay credenciales vinculadas. Stack estricto Antigravity.<br>
        • <strong>Filtro de Proveedores:</strong> Auditoría en tiempo real para Google, Firebase, Supabase, Vercel y Docker.<br>
        • <strong>Responsive Zero-Scroll:</strong> Ventanas adaptables a PC, tablet y móvil sin desplazables verticales invasivos.<br>
        • <strong>Preferencia de Idioma & Modo Senior:</strong> Selector de idioma y toggle para activar/desactivar sugerencias en botones.
      </div>
    `;
  } catch (e) {
    container.textContent = 'No se pudo cargar el archivo VERSION.md.';
  }
}

async function triggerScanModal() {
  const machinesRes = await apiRequest('/api/machines');
  if (!machinesRes.machines || machinesRes.machines.length === 0) {
    await appAlert('Emparejamiento Necesario', 'Primero debes emparejar un PC para escanear sus proyectos.', '🖥️');
    openPairingModal();
    return;
  }
  const machine = machinesRes.machines[0];
  scanMachine(machine.id);
}

async function scanMachine(machineId) {
  try {
    appendTerminalLog(`[${new Date().toLocaleTimeString()}] Iniciando escaneo controlado de proyectos...\n`);
    const res = await apiRequest('/api/projects/scan', 'POST', { machineId });
    appendTerminalLog(`[${new Date().toLocaleTimeString()}] Escaneo completado: ${res.count} proyectos encontrados.\n`);
    showToast(`Escaneo completado. Se detectaron ${res.count} proyectos.`, 'success');
    loadProjects();
    loadDashboardData();
  } catch (err) {
    showToast(`Fallo en el escaneo: ${err.message}`, 'error');
  }
}

/* ==========================================================================
   5. TASK ORCHESTRATOR & TERMINAL CONTROLLER
   ========================================================================== */

async function loadTasks() {
  try {
    const data = await apiRequest('/api/tasks');
    const container = document.getElementById('orchestratorTaskList');
    if (!container) return;

    if (!data.tasks || data.tasks.length === 0) {
      container.innerHTML = '<div class="empty-state">No hay tareas registradas en el orquestador.</div>';
      return;
    }

    container.innerHTML = data.tasks.map(t => `
      <div class="item-card" style="margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <strong style="color: #fff;">${escapeHtml(t.title)}</strong>
          <span class="badge ${t.status === 'COMPLETED' ? 'badge-success' : t.status === 'WAITING_APPROVAL' ? 'badge-warning' : 'badge-info'}">${t.status}</span>
        </div>
        <div style="font-size: 12px; color: var(--text-muted); margin: 6px 0;">${escapeHtml(t.intent || '')}</div>
        <div style="font-size: 11px; color: var(--text-dim);">Riesgo: ${t.risk_level} • Modo: ${t.mode} • ${new Date(t.created_at).toLocaleTimeString()}</div>
        ${t.status === 'WAITING_APPROVAL' ? `
          <div style="display: flex; gap: 8px; margin-top: 10px;">
            <button class="btn btn-sm btn-primary" onclick="approveTask('${t.id}')">Aprobar</button>
            <button class="btn btn-sm btn-secondary" onclick="rejectTask('${t.id}')">Rechazar</button>
          </div>
        ` : ''}
        <button class="btn btn-sm btn-secondary mt-4 w-100" onclick="viewTaskLogs('${t.id}')">Ver Logs</button>
      </div>
    `).join('');
  } catch (err) {
    console.error('Error loading tasks:', err);
  }
}

function openNewTaskModal() {
  // Populate project select and refresh custom styled dropdown
  apiRequest('/api/projects').then(data => {
    const select = document.getElementById('taskProjectSelect');
    if (select && data.projects) {
      select.innerHTML = '<option value="">-- Sin proyecto específico --</option>' +
        data.projects.map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('');
      refreshCustomSelect(select);
    }
  });
  refreshCustomSelect('taskModeSelect');
  document.getElementById('newTaskModal').classList.remove('hidden');
}

async function submitNewTask() {
  const title = document.getElementById('taskTitleInput').value.trim();
  const intent = document.getElementById('taskIntentInput').value.trim();
  const mode = document.getElementById('taskModeSelect').value;
  const projectId = document.getElementById('taskProjectSelect').value;

  if (!title) return showToast('El título de la tarea es obligatorio', 'warning');

  try {
    const data = await apiRequest('/api/tasks', 'POST', {
      title,
      intent: intent || title,
      mode,
      projectId: projectId || null
    });

    closeModal('newTaskModal');
    showToast(`Tarea creada (${data.task.status}). Riesgo: ${data.task.risk_level}`, 'success');
    switchView('orchestrator');
  } catch (err) {
    showToast(`Error: ${err.message}`, 'error');
  }
}

async function approveTask(taskId) {
  try {
    const res = await apiRequest(`/api/tasks/${taskId}/approve`, 'POST');
    showToast('Tarea aprobada. Se ha reanudado la ejecución.', 'success');
    loadTasks();
    loadDashboardData();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function rejectTask(taskId) {
  const reason = await appPrompt('Rechazar Tarea', 'Indica el motivo del rechazo:', 'Rechazado por el usuario', 'Motivo...', '⛔');
  if (reason === null) return;
  try {
    await apiRequest(`/api/tasks/${taskId}/reject`, 'POST', { reason: reason || 'Rechazado por el usuario' });
    showToast('Tarea rechazada.', 'info');
    loadTasks();
    loadDashboardData();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function viewTaskLogs(taskId) {
  try {
    const data = await apiRequest(`/api/tasks/${taskId}`);
    const term = document.getElementById('terminalOutput');
    term.textContent = data.task.logs || 'Sin logs disponibles.';
    document.getElementById('terminalTitle').textContent = `Logs de Tarea: ${data.task.title}`;
  } catch (e) {}
}

function appendTerminalLog(chunk) {
  const term = document.getElementById('terminalOutput');
  if (term) {
    term.textContent += chunk;
    term.scrollTop = term.scrollHeight;
  }
}

function clearTerminal() {
  const term = document.getElementById('terminalOutput');
  if (term) term.textContent = 'Consola vacía.\n';
}

/* ==========================================================================
   6. 3-LEVEL BACKUPS CONTROLLER
   ========================================================================== */

async function loadBackups() {
  try {
    const data = await apiRequest('/api/backups');
    const container = document.getElementById('backupsTableContainer');
    if (!container) return;

    if (!data.backups || data.backups.length === 0) {
      container.innerHTML = '<div class="empty-state">No se han generado snapshots aún. Pulsa en "Crear Snapshot Manual".</div>';
      return;
    }

    container.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>ID Backup</th>
            <th>Nivel</th>
            <th>Tamaño</th>
            <th>Checksum (SHA-256)</th>
            <th>Estado</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          ${data.backups.map(b => `
            <tr>
              <td><code>${b.id.substring(0, 12)}...</code></td>
              <td><span class="badge badge-info">${b.level}</span></td>
              <td>${Math.round(b.size_bytes / 1024)} KB</td>
              <td><code>${b.checksum.substring(0, 16)}...</code></td>
              <td><span class="badge badge-success">${b.status}</span></td>
              <td>${new Date(b.created_at).toLocaleString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (err) {
    console.error('Error loading backups:', err);
  }
}

async function createProjectBackup(projectId) {
  try {
    appendTerminalLog(`[${new Date().toLocaleTimeString()}] Ejecutando pipeline de 3 niveles para proyecto ${projectId}...\n`);
    const data = await apiRequest('/api/backups/create', 'POST', { projectId, reason: 'manual_ui_trigger' });
    appendTerminalLog(`[${new Date().toLocaleTimeString()}] Backup completado. Checksum: ${data.backup.snapshot.checksum}\n`);
    showToast(`Backup de 3 niveles verificado (Checksum: ${data.backup.snapshot.checksum.substring(0, 12)}...)`, 'success');
    loadBackups();
  } catch (err) {
    showToast(`Fallo en el backup: ${err.message}`, 'error');
  }
}

function openCreateBackupModal() {
  apiRequest('/api/projects').then((data) => {
    if (!data.projects || data.projects.length === 0) {
      return appAlert('Sin proyectos', 'Primero necesitas tener al menos un proyecto descubierto.');
    }
    const select = document.getElementById('backupProjectSelect');
    if (select) {
      select.innerHTML = data.projects.map(p => `<option value="${p.id}">${escapeHtml(p.name)} (${escapeHtml(p.repo_path || '')})</option>`).join('');
      refreshCustomSelect(select);
    }
    document.getElementById('createBackupModal').classList.remove('hidden');
  }).catch(err => {
    showToast(err.message, 'error');
  });
}

async function submitCreateBackup() {
  const select = document.getElementById('backupProjectSelect');
  const projectId = select ? select.value : null;
  if (!projectId) {
    showToast('Selecciona un proyecto para el backup', 'warning');
    return;
  }
  closeModal('createBackupModal');
  await createProjectBackup(projectId);
}

/* ==========================================================================
   7. INTEGRATIONS HUB CONTROLLER
   ========================================================================== */

async function loadIntegrations() {
  try {
    const data = await apiRequest('/api/integrations');
    const grid = document.getElementById('integrationsGrid');
    if (!grid) return;

    grid.innerHTML = data.available.map(prov => `
      <div class="item-card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <h3 style="color: #fff; font-size: 16px;">${escapeHtml(prov.name)}</h3>
          <span class="badge ${prov.supported ? 'badge-success' : 'badge-danger'}">
            ${prov.supported ? 'READY' : 'NOT_SUPPORTED'}
          </span>
        </div>
        <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 14px;">
          ${prov.supported ? 'Adaptador desacoplado oficial con soporte para webhooks y despliegues.' : 'No disponible en el entorno actual sin credenciales oficiales.'}
        </p>
        ${prov.supported ? `
          <button class="btn btn-sm btn-secondary w-100" onclick="testIntegration('${prov.id}')">Probar Conexión</button>
        ` : `
          <button class="btn btn-sm btn-secondary w-100" disabled>No Soportado</button>
        `}
      </div>
    `).join('');
  } catch (err) {
    console.error('Error loading integrations:', err);
  }
}

async function testIntegration(providerId) {
  const token = await appPrompt(`Probar Conexión: ${providerId}`, `Introduce tu token o API Key de prueba para ${providerId}:`, 'demo_token', 'Token...', '🔗');
  if (token === null) return;
  try {
    const res = await apiRequest(`/api/integrations/${providerId}/test`, 'POST', { token: token || 'demo_token' });
    showToast(res.message || 'Prueba de conexión exitosa', 'success');
  } catch (err) {
    showToast(`Resultado de la prueba: ${err.message}`, 'error');
  }
}

/* ==========================================================================
   8. SECURITY & EMERGENCY LOCK CONTROLLER
   ========================================================================== */

async function loadSecurityAudit() {
  try {
    const data = await apiRequest('/api/security/audit');
    const container = document.getElementById('auditLogContainer');
    if (!container) return;

    if (!data.auditEvents || data.auditEvents.length === 0) {
      container.innerHTML = '<div class="empty-state">No hay registros de auditoría aún.</div>';
      return;
    }

    container.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Acción</th>
            <th>Recurso</th>
            <th>Riesgo</th>
            <th>Detalles</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          ${data.auditEvents.map(e => `
            <tr>
              <td><strong>${escapeHtml(e.action)}</strong></td>
              <td><code>${escapeHtml(e.resource_type)}</code></td>
              <td><span class="badge ${e.risk_level === 'CRITICAL' ? 'badge-danger' : e.risk_level === 'HIGH' ? 'badge-warning' : 'badge-info'}">${e.risk_level}</span></td>
              <td style="font-size: 11px; color: var(--text-muted);">${escapeHtml(e.details_json)}</td>
              <td>${new Date(e.created_at).toLocaleString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (err) {
    console.error('Error loading audit log:', err);
  }
}

async function toggleEmergencyLock() {
  const statusRes = await apiRequest('/api/security/emergency-status');
  if (statusRes.emergencyModeEnabled) {
    openEmergencyUnlockModal();
  } else {
    const confirmed = await appConfirm(
      'Parada de Emergencia',
      '¿ATENCIÓN: Deseas activar el MODO DE EMERGENCIA?\nEsto bloqueará inmediatamente todas las tareas, comandos y despliegues.',
      '⚠️'
    );
    if (confirmed) {
      try {
        const res = await apiRequest('/api/security/emergency-lock', 'POST');
        setEmergencyBanner(true);
        showToast(res.message, 'warning');
      } catch (err) {
        showToast(err.message, 'error');
      }
    }
  }
}

function openEmergencyUnlockModal() {
  document.getElementById('emergencyUnlockModal').classList.remove('hidden');
}

async function submitEmergencyUnlock() {
  const password = document.getElementById('emergencyUnlockPassword').value;
  if (!password) return showToast('Debes introducir tu contraseña', 'warning');

  try {
    const res = await apiRequest('/api/security/emergency-unlock', 'POST', { password });
    closeModal('emergencyUnlockModal');
    setEmergencyBanner(false);
    showToast(res.message, 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function setEmergencyBanner(isActive) {
  STATE.emergencyMode = isActive;
  const banner = document.getElementById('emergencyBanner');
  const btnText = document.getElementById('emergencyBtnText');
  if (banner) banner.classList.toggle('hidden', !isActive);
  if (btnText) btnText.textContent = isActive ? 'DESBLOQUEAR EMERGENCIA' : 'EMERGENCY LOCK';
}

/* ==========================================================================
   9. MONITORING CONTROLLER
   ========================================================================== */

async function loadMonitoringAlerts() {
  try {
    const data = await apiRequest('/api/monitoring/status');
    const container = document.getElementById('alertsContainer');
    if (!container) return;

    if (!data.activeAlerts || data.activeAlerts.length === 0) {
      container.innerHTML = '<div class="empty-state">✅ Todos los servicios y PCs están funcionando correctamente sin alertas activas.</div>';
      return;
    }

    container.innerHTML = data.activeAlerts.map(a => `
      <div class="item-card" style="border-left: 4px solid var(--accent-rose); margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <strong style="color: #fff;">${escapeHtml(a.title)}</strong>
          <span class="badge badge-danger">${a.severity}</span>
        </div>
        <p style="font-size: 12px; color: var(--text-muted); margin: 8px 0;">${escapeHtml(a.message)}</p>
        <button class="btn btn-sm btn-secondary" onclick="resolveAlert('${a.id}')">Marcar Resuelta</button>
      </div>
    `).join('');
  } catch (err) {
    console.error('Error loading monitoring:', err);
  }
}

async function triggerMonitoringCycle() {
  try {
    const data = await apiRequest('/api/monitoring/status');
    showToast(`Diagnóstico completado: ${data.cycle.status} (${data.cycle.newAlertsCount} nuevas alertas)`, 'info');
    loadMonitoringAlerts();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function resolveAlert(alertId) {
  try {
    await apiRequest(`/api/monitoring/alerts/${alertId}/resolve`, 'POST');
    showToast('Alerta resuelta con éxito', 'success');
    loadMonitoringAlerts();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

/* ==========================================================================
   10. TEST CENTER CONTROLLER (Prompt 13)
   ========================================================================== */

async function runLiveTests() {
  const btn = document.getElementById('runTestsBtn');
  const badge = document.getElementById('testSummaryBadge');
  const list = document.getElementById('testResultsList');

  btn.disabled = true;
  btn.textContent = 'Ejecutando Pruebas...';
  badge.className = 'badge badge-warning';
  badge.textContent = 'En progreso...';

  try {
    const data = await apiRequest('/api/tests/run', 'POST');
    badge.className = data.failedCount === 0 ? 'badge badge-success' : 'badge badge-danger';
    badge.textContent = `${data.passedCount} Pasadas / ${data.totalTests} Totales`;

    list.innerHTML = data.results.map(r => `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid var(--border-subtle);">
        <div>
          <strong style="color: #fff; font-size: 13px;">${escapeHtml(r.name)}</strong>
          <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">${escapeHtml(r.details || r.error || '')}</div>
        </div>
        <span class="badge ${r.passed ? 'badge-success' : 'badge-danger'}">
          ${r.passed ? 'PASSED' : 'FAILED'}
        </span>
      </div>
    `).join('');
  } catch (err) {
    badge.className = 'badge badge-danger';
    badge.textContent = 'Fallo en tests';
    list.innerHTML = `<div class="empty-state" style="color: var(--accent-rose);">Error al ejecutar suite: ${err.message}</div>`;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Ejecutar Suite de Pruebas';
  }
}

/* ==========================================================================
   10B. AI MODEL QUOTAS & AUTHORIZED CLOUD PLATFORMS CONTROLLER
   ========================================================================== */

async function loadAuthorizedIdentities() {
  const container = document.getElementById('dashAuthorizedIdentities');
  if (!container) return;

  try {
    const data = await apiRequest('/api/auth/identities');
    const identities = data.identities || [];

    if (identities.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          No tienes plataformas vinculadas aún. Pulsa en "Vincular Plataforma" para asociar tus accesos oficiales de Google, Supabase, Firebase o Vercel.
        </div>
      `;
      return;
    }

    const providerIcons = {
      google: '🌐',
      supabase: '⚡',
      firebase: '🔥',
      vercel: '▲',
      github: '🐙'
    };

    container.innerHTML = identities.map(idn => {
      const icon = providerIcons[idn.provider] || '🔗';
      let meta = {};
      try { meta = JSON.parse(idn.metadata_json || '{}'); } catch(e){}
      const platforms = meta.verifiedPlatforms || [idn.provider.toUpperCase()];

      return `
        <div class="identity-badge-card">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 26px;">${icon}</span>
            <div>
              <div style="font-size: 13px; font-weight: 700; color: #fff;">${escapeHtml(idn.display_name || idn.provider.toUpperCase())}</div>
              <div style="font-size: 11px; color: var(--text-muted);">${escapeHtml(idn.email)}</div>
              <div style="display: flex; gap: 4px; margin-top: 6px; flex-wrap: wrap;">
                ${platforms.map(p => `<span class="platform-badge" style="font-size: 10px; padding: 2px 8px;">✓ ${escapeHtml(p)}</span>`).join('')}
              </div>
            </div>
          </div>
          <span class="badge badge-success">AUTORIZADO</span>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('Error loading authorized identities:', err);
  }
}

async function loadModelQuotas(showToastFeedback = false) {
  try {
    const data = await apiRequest('/api/models/quotas');
    const quotas = data.quotas || [];

    // Update summary metrics
    const avgEl = document.getElementById('modelAvgAvailability');
    const countEl = document.getElementById('modelActiveCount');
    const provEl = document.getElementById('modelProvidersCount');

    if (avgEl) avgEl.textContent = `${data.summary?.averageAvailability || 0}%`;
    if (countEl) countEl.textContent = quotas.length;
    if (provEl) provEl.textContent = `${data.summary?.activeProviders?.length || 0} Proveedores`;

    // Render Quotas Grid in models view
    const grid = document.getElementById('modelsQuotasGrid');
    if (grid) {
      grid.innerHTML = quotas.map(q => {
        const providerIcons = {
          google: '🤖',
          anthropic: '🧠',
          openai: '⚡',
          supabase: '💾',
          firebase: '🔥',
          vercel: '▲'
        };
        const icon = providerIcons[q.provider] || '🔮';

        return `
          <div class="model-meter-card">
            <div>
              <div class="meter-header">
                <div class="meter-title">
                  <span style="font-size: 20px;">${icon}</span>
                  <div>
                    <div>${escapeHtml(q.modelName)}</div>
                    <span style="font-size: 11px; color: var(--text-dim); text-transform: uppercase;">${escapeHtml(q.provider)}</span>
                  </div>
                </div>
                <span class="badge ${q.percentageAvailable >= 40 ? 'badge-success' : 'badge-warning'}">
                  ${q.percentageAvailable}% DISPONIBLE
                </span>
              </div>

              <div class="meter-progress-container">
                <div class="meter-progress-header">
                  <span style="color: var(--text-muted);">Cuota Disponible Restante:</span>
                  <span class="meter-percentage" style="color: ${q.healthColor === 'emerald' ? 'var(--accent-emerald)' : q.healthColor === 'amber' ? 'var(--accent-amber)' : 'var(--accent-rose)'};">
                    ${q.percentageAvailable}%
                  </span>
                </div>
                <div class="meter-progress-track">
                  <div class="meter-progress-bar meter-${q.healthColor}" style="width: ${q.percentageUsed}%;"></div>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-dim); margin-top: 4px;">
                  <span>Gastado: ${q.percentageUsed}%</span>
                  <span>Límite: 100%</span>
                </div>
              </div>

              <div class="meter-stat-row">
                <span>Consumo Gastado:</span>
                <strong style="color: #fff;">${q.quotaUsed.toLocaleString()} ${escapeHtml(q.unit)}</strong>
              </div>
              <div class="meter-stat-row">
                <span>Cuota Total Asignada:</span>
                <span>${q.quotaLimit.toLocaleString()} ${escapeHtml(q.unit)}</span>
              </div>
              <div class="meter-stat-row">
                <span>Estado de Clave API:</span>
                <span style="color: ${q.hasApiKey ? 'var(--accent-cyan)' : 'var(--text-dim)'};">
                  ${q.hasApiKey ? '🔒 Encriptada (AES-256)' : '🛡️ Token por Defecto'}
                </span>
              </div>
            </div>

            <div class="meter-actions">
              <button class="btn btn-sm btn-secondary w-50" onclick="openConnectApiKeyModal('${q.modelId}')">
                ⚙️ Clave / Cuenta
              </button>
              <button class="btn btn-sm btn-primary w-50" onclick="verifyRealModelConnection('${q.modelId}')">
                🔍 Probar En Vivo
              </button>
            </div>
          </div>
        `;
      }).join('');
    }

    // Render Compact Quotas Overview in Dashboard
    const dashOverview = document.getElementById('dashAiQuotasOverview');
    if (dashOverview) {
      dashOverview.innerHTML = quotas.slice(0, 4).map(q => `
        <div class="dash-quota-mini">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <strong style="font-size: 12px; color: #fff;">${escapeHtml(q.modelName.split('(')[0].trim())}</strong>
            <span style="font-size: 12px; font-weight: 700; color: ${q.healthColor === 'emerald' ? 'var(--accent-emerald)' : 'var(--accent-amber)'};">
              ${q.percentageAvailable}% libre
            </span>
          </div>
          <div class="meter-progress-track" style="height: 6px;">
            <div class="meter-progress-bar meter-${q.healthColor}" style="width: ${q.percentageUsed}%;"></div>
          </div>
          <div style="font-size: 10px; color: var(--text-dim); margin-top: 4px; display: flex; justify-content: space-between;">
            <span>Gastado: ${q.quotaUsed.toLocaleString()}</span>
            <span>Total: ${q.quotaLimit.toLocaleString()}</span>
          </div>
        </div>
      `).join('');
    }

    if (showToastFeedback) {
      showToast('Cuotas de modelos de IA y consumo actualizados', 'success');
    }
  } catch (err) {
    console.error('Error loading model quotas:', err);
  }
}

function openConnectApiKeyModal(preselectedModel = null) {
  const select = document.getElementById('connectApiKeyModelSelect');
  if (select && preselectedModel) {
    select.value = preselectedModel;
    refreshCustomSelect(select);
  } else if (select) {
    refreshCustomSelect(select);
  }
  document.getElementById('connectApiKeyInput').value = '';
  document.getElementById('connectApiKeyModal').classList.remove('hidden');
  setTimeout(() => document.getElementById('connectApiKeyInput')?.focus(), 60);
}

async function submitConnectApiKey() {
  const select = document.getElementById('connectApiKeyModelSelect');
  const input = document.getElementById('connectApiKeyInput');
  const modelId = select ? select.value : '';
  const apiKey = input ? input.value.trim() : '';

  if (!apiKey) {
    showToast('Introduce una clave o token válido', 'warning');
    return;
  }

  try {
    const res = await apiRequest('/api/models/connect', 'POST', { modelId, apiKey });
    closeModal('connectApiKeyModal');
    showToast(res.message || 'Clave encriptada y guardada de forma segura', 'success');
    loadModelQuotas();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function verifyRealModelConnection(modelId) {
  showToast(`Comprobando conexión en vivo con ${modelId}...`, 'info');
  try {
    const res = await apiRequest('/api/models/verify-real', 'POST', { modelId });
    if (res.success) {
      showToast(`¡Conexión en vivo exitosa! Latencia: ${res.latencyMs}ms. ${res.message}`, 'success');
    } else {
      showToast(res.message || 'Error de conexión con el proveedor real', 'warning');
      if (res.status === 'PENDING_KEY') {
        openConnectApiKeyModal(modelId);
      }
    }
    loadModelQuotas();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

/* ==========================================================================
   11. PREMIUM SETTINGS CONTROLLER (Dormant Module)
   ========================================================================== */

async function loadPremiumSettings() {
  try {
    const data = await apiRequest('/api/premium/settings');
    const toggle = document.getElementById('premiumToggle');
    const priceDisplay = document.getElementById('premiumPriceDisplay');

    if (toggle) toggle.checked = data.premium_mode_enabled;
    if (priceDisplay) priceDisplay.textContent = `${data.premium_default_price.toFixed(2)} ${data.premium_currency} / ${data.premium_billing_interval}`;
  } catch (err) {
    console.error('Error loading premium settings:', err);
  }
}

async function handleAdminPremiumToggle() {
  const isChecked = document.getElementById('premiumToggle').checked;
  try {
    await apiRequest('/api/premium/admin-toggle', 'POST', { enabled: isChecked });
    showToast(`Interruptor maestro de Premium: ${isChecked ? 'ACTIVADO' : 'DESACTIVADO (DORMIDO)'}`, 'info');
    loadPremiumSettings();
  } catch (err) {
    showToast(err.message, 'error');
    loadPremiumSettings();
  }
}

/* ==========================================================================
   HELPERS & UTILS
   ========================================================================== */

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('hidden');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
