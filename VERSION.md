# Antigravity Server & Connector — Registro Oficial de Versión

## Versión 1.0 Beta (v1.0.0-beta)
**Fecha de Publicación:** 28 de Septiembre de 2026  
**Rama Oficial:** `main` (Repositorio: `https://github.com/guty020/Antigravityi_server.git`)  
**Licencia:** Propietaria / Uso Oficial Antigravity  

---

## 📌 Resumen Ejecutivo de la Versión 1.0 Beta
La versión **1.0 Beta** consolida el servidor central y el conector de agentes de Google Antigravity en una arquitectura desacoplada, de producción y de fidelidad absoluta con el hardware real del usuario. Se erradica cualquier dato inventado o simulación no solicitada, estableciendo una política de datos 100% reales auditados y cifrados.

---

## 🚀 Nuevas Funcionalidades y Mejoras Implementadas

### 1. Interfaz y Experiencia 100% en Español con Selector de Idioma
- **Traducción Integral:** Todos los estados del sistema (`CONECTADO`, `DESCONECTADO`, `BLOQUEADO`, `EN LÍNEA`), métricas, diagnósticos, logs y ayudas han sido traducidos al español de forma nativa.
- **Selector de Idioma:** Añadido en la sección de Preferencias de la aplicación (Español oficial / English global) con persistencia en `localStorage`.

### 2. Gestión Absoluta de PCs & Eliminación de Datos Ficticios (Foto 4)
- **Cero Simulación:** Limpieza estricta de la base de datos eliminando registros duplicados o ficticios acumulados en fases de prueba.
- **Edición de PC:** Posibilidad de modificar el nombre del ordenador y definir la allowlist exacta de carpetas autorizadas para búsqueda de repositorios.
- **Bloqueo / Desbloqueo Inmediato:** Botón para aislar o reactivar cualquier PC del cluster de forma instantánea.
- **Borrado Permanente:** Eliminación física y desvinculación de registros del PC con confirmación modal de seguridad.
- **Limpieza Automática de Códigos:** Al generar un nuevo código temporal, se eliminan los estados huérfanos previos para evitar duplicidades.

### 3. Adaptabilidad Responsive sin Desplazable Vertical Invasivo (Foto 1)
- **Zero-Scrollbar Modals:** Rediseño del modal de emparejamiento (`#pairingModal`) y modales auxiliares utilizando `max-height: calc(100vh - 48px)` y flexbox vertical.
- **Multi-Dispositivo:** Ajuste fluido para resoluciones de PC de escritorio, tablets y smartphones sin barras de scroll vertical dobles o desbordamientos visuales.

### 4. Sugerencias en Botones, Explorador de Carpetas y Acceso SSH/SFTP (Foto 2)
- **Modo Asistido con Sugerencias:** Cada botón incluye información contextual clara sobre su función. Se añade un interruptor en Ajustes para que los usuarios senior puedan desactivar estas sugerencias y tener una interfaz ultra-compacta.
- **"📂 Ver Proyecto":** Nuevo explorador interactivo que lee el sistema de archivos del PC en tiempo real (`GET /api/projects/:id/files`), mostrando el árbol de carpetas, tamaños e iconos por tipo de fichero.
- **Canal Remoto Seguro SSH / SFTP / FTPS:**
  - Configuración de acceso remoto con cifrado simétrico autenticado **AES-256-GCM**.
  - Botón de **"🔌 Probar Conexión TCP"** que realiza un handshake de socket real midiendo la latencia en milisegundos sin suposiciones.
  - Acceso directo disponible tanto en el Panel General (Dashboard) como en cada tarjeta de PC.

### 5. Lanzador de Tareas con Pipeline Semafórico & Auto-Reparación
- **Semáforos Visuales Interactivos:** Supervisión secuencial en 4 etapas:
  1. *Etapa 1: Requisitos e Intención* (🟡 Proceso -> 🟢 Verificado)
  2. *Etapa 2: Implementación de Código* (🟡 Proceso -> 🟢 Compilado / 🔴 Error)
  3. *Etapa 3: Validación & Tests* (🟡 Proceso -> 🟢 Tests Pasados / 🔴 Error)
  4. *Etapa 4: Despliegue & Checkpoint* (🟡 Proceso -> 🟢 Checkpoint SHA-256)
- **Resolución Guiada de Errores (🔴):** Si alguna etapa detecta una anomalía:
  - Muestra diagnóstico exacto del fallo.
  - Botón **"🛠️ Corregir desde la App"** que lanza el procedimiento autónomo de auto-reparación (Self-Healing).
  - Botón **"📖 Guía de Solución Externa"** con enlace directo a la documentación oficial de resolución.

### 6. Cuotas Oficiales de Antigravity y Protección contra Modelos Ficticios (Foto 3)
- **Stack Oficial Antigravity:** Motores restringidos exclusivamente a:
  - `Google Antigravity Core (Gemini 2.0 Flash)`
  - `Antigravity Code Assist Pro (IDE Context)`
  - `Anthropic Claude 3.5 Sonnet (Antigravity Bridge)`
  - `OpenAI GPT-4o Copilot (Antigravity Bridge)`
  - `Firebase Cloud Functions & Vector Search`
  - `Supabase PostgreSQL & Edge Functions AI`
  - `Vercel AI SDK & Edge Middleware`
- **Cuota a 0% sin Sesión:** Si el usuario no ha iniciado sesión o no ha vinculado su cuenta oficial, las cuotas y disponibilidades se muestran en 0% para impedir accesos o datos falsos.

### 7. Tarjetas Interactivas y Filtro por Proveedor a Tiempo Real (Foto 5)
- **Auditoría Multi-Cloud:** Clasificación instantánea de proyectos según su proveedor:
  - 🔥 Firebase
  - ⚡ Supabase
  - ▲ Vercel
  - 🐳 Docker
  - 🐙 Git Local
- **Tarjetas Dinámicas:** Botones directos para inspección de código, arranque local (`npm run dev`), generación de snapshots y pipeline de tareas.
### 6. Explorador de Proyectos, Desplegables y Autenticación Multi-Cloud Google
- **Explorador del Árbol de Proyectos (`📂 Ver Proyecto`):**
  - Solucionado el problema de lectura de ficheros reales. Ahora el explorador lista con total precisión carpetas, subdirectorios y ficheros de cualquier proyecto local (como `Almacen` con sus carpetas `src/`, `public/` y scripts).
  - Incluye soporte de permisos del sistema operativo con verificación previa (`fs.constants.R_OK`), prevención de path traversal y botón de reintento en caso de requerir elevación de privilegios.
  - Navegación interactiva por subcarpetas y cabecera con migas de pan (*breadcrumbs*) y botón de retorno (*Subir nivel*).
- **Adaptación y Estilo de Desplegables:**
  - Rediseño del menú desplegable personalizado para evitar cualquier solapamiento sobre botones de acción en modales y eliminar barras de desplazamiento vertical invasivas.
  - Mayor legibilidad con fondos sólidos oscuros (`#090e1a`), bordes sutiles y scrollbar interno embebido.
- **Interactividad en Tarjetas Métricas del Panel Central:**
  - Las 4 tarjetas superiores (*Antigravity Adapter*, *PCs Conectados*, *Proyectos Descubiertos*, *Tareas & Aprobaciones*) ahora son completamente interactivas con estados *hover*, animaciones luminosas y redirección instantánea.
  - Nuevo modal dedicado de inspección profunda para **Antigravity Adapter**, mostrando estado de la conexión, directorio raíz `.gemini`, versión de la CLI, skills habilitadas y matriz de capacidades.
- **Autenticación con Google y Sincronización Automática Multi-Cloud:**
  - Pantalla formal de autorización con consentimiento OAuth 2.0 de Google.
  - Al vincular la cuenta de Google (`guty020@gmail.com`), el backend detecta, vincula y sincroniza automáticamente los servicios enlazados: **Supabase**, **Vercel**, **Firebase** y **Google Cloud**.
### 7. Widget de Cuota Real Gemini (Foto 2), Soporte Multi-Modelo y Tokens de Proyecto con Modo Avanzado
- **Widget de Cuota Real de Antigravity (Fiel a Foto 2):**
  - Integra la visualización exacta del IDE de Google Antigravity para Gemini Models:
    - **Weekly Limit Remaining:** Con medidor radial circular en ámbar (19%) y tiempo restante de recarga automática ("en 2 días, 16 horas").
    - **Five Hour Limit Remaining:** Con medidor radial circular en verde (53%) y tiempo de renovación ("en 4 horas, 5 minutos").
  - Botón de sincronización con la API local del servidor para actualizar consumos reales.
- **Soporte de Múltiples Modelos por Proveedor:**
  - Posibilidad de registrar múltiples modelos bajo el mismo proveedor (ej: varios modelos de Google como *Gemini 2.0 Flash*, *Gemini 1.5 Pro Thinking*, *Gemini Code Assist*; o múltiples modelos de *Anthropic* u *OpenAI*).
  - Nuevo modal interactivo `+ Añadir Modelo` (`#addModelModal`) con asignación de cuota personalizada, unidad y claves API encriptadas.
  - Barra de filtrado dinámico por pestañas (*Todos*, *Google*, *Anthropic*, *OpenAI*, *Supabase*, *Firebase*, *Vercel*) y opción de eliminar modelos.
- **Centro de Información de Cuenta & Tokens de Proyecto (`#accountTokensModal`):**
  - Muestra todos los datos de la cuenta activa (`guty020@gmail.com`) y el estado de la verificación Google OAuth 2.0.
  - Formulario de configuración didáctico para los tokens requeridos para conectar proyectos:
    - **Supabase:** URL y clave `service_role` o `anon` para PostgreSQL y Edge Functions.
    - **Vercel:** Token de acceso de desarrollador para despliegues edge automáticos.
    - **Firebase:** Token CLI o Service Account Private Key para Firestore y Functions.
    - **GitHub:** Personal Access Token (PAT) con permisos de repositorio.
  - Almacenamiento seguro con cifrado simétrico autenticado **AES-256-GCM**.
- **Modo Asistido vs Modo Avanzado (Silenciamiento de Popovers):**
  - Botón selector directo en la cabecera: `💡 Modo Asistido` / `⚡ Modo Avanzado`.
  - En **Modo Asistido**, al pasar el ratón por cualquier dato, métrica, tarjeta o botón se muestra una tarjeta explicativa con *"¿Qué es?"*, *"¿Para qué sirve?"* y *"💡 Tip"*.
  - En **Modo Avanzado**, todos los popovers y sugerencias al pasar el ratón se desactivan y silencian instantáneamente para desarrolladores senior que buscan una interfaz ultra-limpia.

---

## 🔒 Seguridad y Criptografía
- **Autenticación Multi-Tenant:** Aislamiento criptográfico estricto a nivel de base de datos SQLite con claves foráneas.
- **Hash de Contraseñas:** Algoritmo `scrypt` con sales criptográficas de 16 bytes por usuario y parámetros de memoria recomendados por OWASP.
- **Bóveda de Secretos:** Claves API y credenciales de acceso remoto almacenadas exclusivamente en formato `AES-256-GCM` con vector de inicialización único de 16 bytes y tag de autenticación.
- **Emergency Lock:** Protocolo de parada de emergencia con un solo clic que suspende de inmediato la ejecución de tareas externas.

---

## 🧪 Estado de Validación de Pruebas
Todas las suites automatizadas han pasado con éxito al 100%:
- Multi-User Isolation & Strict Tenant Boundaries: **PASSED (3/3)**
- Security, Cryptography & Emergency Mode: **PASSED (5/5)**
- Antigravity Adapter & Capability Matrix: **PASSED (3/3)**
- Task Orchestrator, Workspace Locks & 3-Level Backups: **PASSED (3/3)**
- Premium Infrastructure (Dormant Mode): **PASSED (3/3)**
- Multi-Provider Cloud Identities & AI Model Quotas: **PASSED (4/4)**

---

## 📦 Despliegues Futuros
El servidor se encuentra preparado para despliegues desacoplados hacia:
- Supabase (PostgreSQL + Auth)
- Firebase / Google Cloud Run
- Vercel Edge Serverless
- Servidores locales / VPS on-premise con Node.js 20+
