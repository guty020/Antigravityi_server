# CHANGELOG — ANTIGRAVITY CONNECTOR

Todas las modificaciones notables del proyecto están documentadas en este archivo según las directrices de `16_CHANGELOG_AND_STATE.md`.

## [1.0.0] - 2026-09-27

### Añadido
- **Base de Datos Nativa Node 24 (`node:sqlite`):**
  - Esquema relacional con claves foráneas activas (`PRAGMA foreign_keys = ON`).
  - Tablas: `users`, `sessions`, `machines`, `workspaces`, `projects`, `integrations`, `tasks`, `backups`, `audit_events`, `system_settings`, `subscription_plans`, `user_subscriptions`, `feature_entitlements`, `monitoring_alerts`.
- **Capa Criptográfica y Seguridad:**
  - Hashing de contraseñas con `crypto.scryptSync` y salt único por usuario.
  - Cifrado autenticado AES-256-GCM para almacenamiento seguro de credenciales externas.
  - Validador de rutas seguras `isPathSafe` para mitigar ataques de path traversal.
  - Escáner seguro de `.env` que detecta variables y clasifica secretos sin exponer los valores al frontend.
- **Antigravity Adapter Oficial:**
  - Inspección real de instalación en `~/.gemini/antigravity` e IDE en `~/.gemini/antigravity-ide`.
  - Matriz de capacidades desacoplada sin inventar APIs privadas; retorno explícito de `NOT_SUPPORTED` para endpoints en la nube no disponibles.
- **Agent Connector Local:**
  - Demonio multiplataforma (Windows, macOS, Linux) en `agent-connector/agent.js`.
  - Emparejamiento seguro por código de 6 dígitos válido por 10 minutos.
  - Heartbeat periódico cada 10s con informe de hardware, latencia y herramientas (Git, Node, Python, Docker).
- **Descubrimiento Controlado y Project Passport:**
  - Motor en `server/discovery.js` con límite de profundidad e ignorado de directorios pesados (`node_modules`, `.git`, `.venv`).
  - Generación del pasaporte de proyecto con framework, runtime, estado Git y conectores en la nube.
- **Backups de 3 Niveles:**
  - Nivel 1: Git checkpoint automático.
  - Nivel 2: Snapshot local en GZIP con checksum SHA-256.
  - Nivel 3: Vault remoto / verificación de adaptador.
  - Ejecución obligatoria antes de cualquier tarea de riesgo HIGH o CRITICAL.
- **Orquestador Central de Tareas:**
  - Clasificación automática de riesgos (LOW, MEDIUM, HIGH, CRITICAL).
  - Mutex de bloqueo por ruta de workspace para prevenir operaciones concurrentes incompatibles.
  - Pasarela de aprobación obligatoria para tareas críticas y de alto riesgo en modo SUPERVISED.
- **Monitorización 24/7 y Auto-Reparación:**
  - Ciclo de monitorización continua con detección de desconexión de máquinas tras 35s de inactividad.
  - Motor de propuestas de auto-reparación no destructiva.
- **Modo de Emergencia (Kill-Switch Maestro):**
  - Botón *EMERGENCY LOCK* con bloqueo global de ejecuciones y mutaciones.
  - Desbloqueo autenticado con verificación estricta de contraseña.
- **UI Adaptativa PWA:**
  - Estética visual de alta fidelidad: tema oscuro profundo, acentos ciber-púrpura y cian, efectos de glassmorphism con `backdrop-filter: blur(16px)` y tipografía Inter y JetBrains Mono.
  - Layouts adaptativos para Móvil (barra inferior, tarjetas grandes), Tablet (dos columnas) y PC (dashboard multivariable, terminal en tiempo real con WebSockets).
- **Módulo Premium Dormido:**
  - Parámetros: 1,50 €/mes, divisa EUR, facturación mensual.
  - Estado inicial `PREMIUM_DISABLED = true`, garantizando 100% de acceso gratuito e ilimitado para todos los usuarios.
  - Panel de control de administración con interruptor maestro y auditoría estricta de cambios.
- **Suite de Pruebas de Validación:**
  - Tests unitarios y de integración para aislamiento multiusuario, criptografía, adaptador, backups y banderas de suscripción (`npm test`).
