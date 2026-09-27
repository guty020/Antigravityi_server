# Guía de Autenticación Cloud, Credenciales Reales y Medidores de IA

Documento de referencia para la vinculación de identidades, credenciales en la nube y monitorización de cuotas reales sin simulación en Antigravity Connector.

---

## 1. Identificación y Formas de Sesión por Plataforma

La plataforma soporta tres modalidades de acceso según el servicio utilizado, adaptadas para vincular tu cuenta personal (`guty020@gmail.com`):

### 1.1 Google Cloud, Antigravity & Firebase
- **Método 1 (Recomendado - 1 Clic):** Vinculación mediante **Cuenta de Google (`guty020@gmail.com`)**. Genera tokens de sesión que autorizan el acceso coordinado a Antigravity, Google Cloud APIs y Firebase.
- **Método 2 (Google Gemini API Key):** Clave de API directa generada en Google AI Studio (`AIzaSy...`). Permite consultar en vivo la lista real de modelos disponibles (`gemini-2.0-flash`, `gemini-1.5-pro`, etc.) y verificar la latencia con la API de Google en tiempo real.
- **Método 3 (Firebase Project Config / CLI):** Conexión mediante `firebaseConfig` (Project ID, App ID, API Key) o token de CI generado con `firebase login:ci`.

### 1.2 Vercel
- **Método 1 (Personal Access Token - PAT):** Token generado en `vercel.com/account/tokens`. Con este token, la aplicación consulta `https://api.vercel.com/v2/user` y `https://api.vercel.com/v9/projects`, trayendo el perfil real del usuario y sus proyectos sin simulación.
- **Método 2 (Acceso por Correo Electrónico):** Identificación mediante la cuenta de correo vinculada a tu cuenta de Vercel (`guty020@gmail.com`).

### 1.3 Supabase
- **Método 1 (Management PAT):** Token de gestión (`sbp_...`) generado en el panel de Supabase. Permite consultar `https://api.supabase.com/v1/projects` y listar tus bases de datos y organizaciones reales.
- **Método 2 (Project URL & Anon / Service Role Key):** Conexión directa a un proyecto específico (`https://[ref].supabase.co`) verificando el endpoint `/rest/v1/`.
- **Método 3 (Correo y Contraseña):** Autenticación de usuario mediante Supabase Auth para proyectos protegidos con credenciales tradicionales.

### 1.4 GitHub
- **Método 1 (Personal Access Token - PAT):** Token clásico o fine-grained (`ghp_...`) con permisos de repositorio. Consulta directamente la API de GitHub (`https://api.github.com/user` y `/user/repos`).
- **Método 2 (Identidad de GitHub):** Enlace con cuenta de desarrollador (`guty020`).

---

## 2. Protocolo de Seguridad: Cero Fuga de Información Previa al Login

Para cumplir con las normas de seguridad más estrictas y evitar ataques de reconocimiento o filtración de información:
1. **Ocultamiento de Badges Previos:** Antes de que el usuario inicie sesión, **nunca se muestran** las etiquetas ni las plataformas autorizadas en el modal de inicio de sesión.
2. **Handshake de Verificación Criptográfico (1.8s):** Al ingresar las credenciales, el sistema ejecuta un escaneo visual de validación:
   - *Fase 1 (0-700ms):* Inicialización de Handshake TLS seguro.
   - *Fase 2 (700-1500ms):* Verificación de scopes y permisos OAuth en cluster local.
   - *Fase 3 (1500-1800ms):* Establecimiento de sesión y emisión de JWT firmado.
3. **Visibilidad Post-Login:** Solo una vez autenticado, el Dashboard y el Hub de Integraciones muestran la tarjeta **"Identidades y Nubes Vinculadas"** con los servicios autorizados.
4. **Cero Credenciales de Prueba:** Se han suprimido todos los textos de usuarios por defecto en el login para mantener la privacidad de la cuenta de administración.

---

## 3. Eliminación de Simulación de Datos: Verificación Real en Vivo

Se ha eliminado cualquier cálculo de consumo simulado aleatorio (`Math.random`).
- **Cuotas Iniciales Reales:** Todos los medidores parten con `0` consumo gastado hasta que se produzcan invocaciones reales.
- **Botón `🔍 Probar En Vivo`:** Cada tarjeta de modelo ejecuta un ping HTTP real contra la API oficial del proveedor (`/api/models/verify-real`):
  - Google Gemini: valida clave contra `https://generativelanguage.googleapis.com/v1beta/models`.
  - Vercel: valida token contra `https://api.vercel.com/v2/user`.
  - Supabase: valida token contra `https://api.supabase.com/v1/projects`.
  - Retorna la **latencia real en milisegundos (ms)** y el estado certificado.
- **Cifrado AES-256-GCM:** Toda clave de API o contraseña introducida se cifra con AES-256-GCM antes de guardarse en la base de datos `node:sqlite`.
