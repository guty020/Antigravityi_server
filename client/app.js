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
  devices: { isMobile: window.innerWidth <= 768, isTablet: window.innerWidth > 768 && window.innerWidth <= 1024 }
};

// Initialize app on load
window.addEventListener('DOMContentLoaded', () => {
  detectDeviceLayout();
  window.addEventListener('resize', detectDeviceLayout);
  
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
  document.getElementById('authSubmitBtn').textContent = mode === 'login' ? 'Entrar' : 'Crear Cuenta';
  document.getElementById('authModalTitle').textContent = mode === 'login' ? 'Iniciar Sesión' : 'Registro de Usuario';
}

async function handleAuthSubmit() {
  const email = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPassword').value;
  const fullName = document.getElementById('authFullName').value.trim();

  const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
  const body = authMode === 'login' ? { email, password } : { email, password, fullName };

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Fallo de autenticación');

    setAuthenticatedUser(data.user, data.token);
    loadDashboardData();
  } catch (err) {
    alert(err.message);
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
    case 'backups': loadBackups(); break;
    case 'integrations': loadIntegrations(); break;
    case 'security': loadSecurityAudit(); break;
    case 'monitoring': loadMonitoringAlerts(); break;
    case 'premium': loadPremiumSettings(); break;
  }
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
      descEl.textContent = 'Conecta tu entorno local de Antigravity para inspeccionar CLI, skills y MCP servers oficiales.';
      actionEl.innerHTML = `<button class="btn btn-primary" onclick="connectAntigravity()">Conectar Antigravity Ahora</button>`;
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

async function connectAntigravity() {
  try {
    const res = await apiRequest('/api/antigravity/connect', 'POST');
    alert(res.message);
    checkOnboardingStatus();
    loadDashboardData();
  } catch (e) {
    alert(e.message);
  }
}

/* ==========================================================================
   3. MACHINES & PAIRING CONTROLLER
   ========================================================================== */

async function loadMachines() {
  try {
    const data = await apiRequest('/api/machines');
    const grid = document.getElementById('machinesGrid');
    if (!grid) return;

    if (!data.machines || data.machines.length === 0) {
      grid.innerHTML = '<div class="empty-state">No tienes ningún PC emparejado. Pulsa en "Emparejar Nuevo PC" para empezar.</div>';
      return;
    }

    grid.innerHTML = data.machines.map(m => `
      <div class="item-card">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
          <div>
            <h3 style="color: #fff; font-size: 16px;">${escapeHtml(m.name)}</h3>
            <div style="font-size: 12px; color: var(--text-dim); margin-top: 2px;">${escapeHtml(m.os || 'Desconocido')} • ${escapeHtml(m.hostname || 'localhost')}</div>
          </div>
          <span class="badge ${m.status === 'ONLINE' ? 'badge-success' : 'badge-danger'}">${m.status}</span>
        </div>
        <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 14px;">
          <div>Último heartbeat: ${m.last_heartbeat_at ? new Date(m.last_heartbeat_at).toLocaleTimeString() : 'Nunca'}</div>
          <div>Carpetas autorizadas: ${JSON.parse(m.allowed_paths_json || '[]').length} rutas</div>
        </div>
        <button class="btn btn-sm btn-secondary w-100" onclick="scanMachine('${m.id}')">Escanear Proyectos</button>
      </div>
    `).join('');
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
    document.getElementById('pairingResultBox').classList.remove('hidden');
  } catch (err) {
    alert(err.message);
  }
}

/* ==========================================================================
   4. PROJECTS & PASSPORT CONTROLLER
   ========================================================================== */

async function loadProjects() {
  try {
    const data = await apiRequest('/api/projects');
    const grid = document.getElementById('projectsGrid');
    if (!grid) return;

    if (!data.projects || data.projects.length === 0) {
      grid.innerHTML = '<div class="empty-state">No se han descubierto proyectos aún. Pulsa en "Escanear Directorio Autorizado".</div>';
      return;
    }

    grid.innerHTML = data.projects.map(p => {
      const passport = JSON.parse(p.passport_json || '{}');
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
            <div style="display: flex; gap: 6px; margin-top: 8px;">
              ${p.has_docker ? '<span class="badge badge-success">Docker</span>' : ''}
              ${p.has_firebase ? '<span class="badge badge-info">Firebase</span>' : ''}
              ${p.has_supabase ? '<span class="badge badge-info">Supabase</span>' : ''}
              ${p.has_vercel ? '<span class="badge badge-info">Vercel</span>' : ''}
            </div>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-sm btn-primary" onclick="triggerProjectTask('${p.id}', '${escapeHtml(p.name)}')">Lanzar Tarea</button>
            <button class="btn btn-sm btn-secondary" onclick="createProjectBackup('${p.id}')">Backup 3-Niveles</button>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('Error loading projects:', err);
  }
}

async function triggerScanModal() {
  const machinesRes = await apiRequest('/api/machines');
  if (!machinesRes.machines || machinesRes.machines.length === 0) {
    alert('Primero debes emparejar un PC para escanear sus proyectos.');
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
    alert(`Escaneo completado con éxito. Se detectaron ${res.count} proyectos.`);
    loadProjects();
    loadDashboardData();
  } catch (err) {
    alert(`Fallo en el escaneo: ${err.message}`);
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
  // Populate project select
  apiRequest('/api/projects').then(data => {
    const select = document.getElementById('taskProjectSelect');
    if (select && data.projects) {
      select.innerHTML = '<option value="">-- Sin proyecto específico --</option>' +
        data.projects.map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('');
    }
  });
  document.getElementById('newTaskModal').classList.remove('hidden');
}

async function submitNewTask() {
  const title = document.getElementById('taskTitleInput').value.trim();
  const intent = document.getElementById('taskIntentInput').value.trim();
  const mode = document.getElementById('taskModeSelect').value;
  const projectId = document.getElementById('taskProjectSelect').value;

  if (!title) return alert('El título de la tarea es obligatorio');

  try {
    const data = await apiRequest('/api/tasks', 'POST', {
      title,
      intent: intent || title,
      mode,
      projectId: projectId || null
    });

    closeModal('newTaskModal');
    alert(`Tarea creada con éxito. Estado inicial: ${data.task.status} (Riesgo: ${data.task.risk_level})`);
    switchView('orchestrator');
  } catch (err) {
    alert(`Error: ${err.message}`);
  }
}

async function approveTask(taskId) {
  try {
    const res = await apiRequest(`/api/tasks/${taskId}/approve`, 'POST');
    alert(`Tarea aprobada. Se ha reanudado la ejecución.`);
    loadTasks();
    loadDashboardData();
  } catch (err) {
    alert(err.message);
  }
}

async function rejectTask(taskId) {
  const reason = prompt('Indica el motivo del rechazo:') || 'Rechazado por el usuario';
  try {
    await apiRequest(`/api/tasks/${taskId}/reject`, 'POST', { reason });
    loadTasks();
    loadDashboardData();
  } catch (err) {
    alert(err.message);
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
    alert(`Backup de 3 niveles completado y verificado (Checksum: ${data.backup.snapshot.checksum.substring(0, 12)}...)`);
    loadBackups();
  } catch (err) {
    alert(`Fallo en el backup: ${err.message}`);
  }
}

function openCreateBackupModal() {
  apiRequest('/api/projects').then(data => {
    if (!data.projects || data.projects.length === 0) {
      return alert('Primero necesitas tener al menos un proyecto descubierto.');
    }
    createProjectBackup(data.projects[0].id);
  });
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
  const token = prompt(`Introduce tu token/API Key de prueba para ${providerId}:`) || 'demo_token';
  try {
    const res = await apiRequest(`/api/integrations/${providerId}/test`, 'POST', { token });
    alert(res.message || 'Prueba de conexión exitosa');
  } catch (err) {
    alert(`Resultado de la prueba: ${err.message}`);
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
    if (confirm('¿ATENCIÓN: Deseas activar el MODO DE EMERGENCIA?\nEsto bloqueará inmediatamente todas las tareas, comandos y despliegues.')) {
      try {
        const res = await apiRequest('/api/security/emergency-lock', 'POST');
        setEmergencyBanner(true);
        alert(res.message);
      } catch (err) {
        alert(err.message);
      }
    }
  }
}

function openEmergencyUnlockModal() {
  document.getElementById('emergencyUnlockModal').classList.remove('hidden');
}

async function submitEmergencyUnlock() {
  const password = document.getElementById('emergencyUnlockPassword').value;
  if (!password) return alert('Debes introducir tu contraseña');

  try {
    const res = await apiRequest('/api/security/emergency-unlock', 'POST', { password });
    closeModal('emergencyUnlockModal');
    setEmergencyBanner(false);
    alert(res.message);
  } catch (err) {
    alert(err.message);
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
    alert(`Diagnóstico completado. Estado: ${data.cycle.status} (${data.cycle.newAlertsCount} nuevas alertas)`);
    loadMonitoringAlerts();
  } catch (err) {
    alert(err.message);
  }
}

async function resolveAlert(alertId) {
  try {
    await apiRequest(`/api/monitoring/alerts/${alertId}/resolve`, 'POST');
    loadMonitoringAlerts();
  } catch (err) {
    alert(err.message);
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
    alert(`Interruptor maestro de Premium actualizado a: ${isChecked ? 'ACTIVADO' : 'DESACTIVADO (DORMIDO)'}`);
    loadPremiumSettings();
  } catch (err) {
    alert(err.message);
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
