# ANTIGRAVITY CONNECTOR — ONBOARDING COMPLETO

Construye un wizard que lleve a un usuario nuevo hasta `READY`.

## Estados
```text
REGISTER
EMAIL_VERIFIED
ANTIGRAVITY_AUTH_REQUIRED
ANTIGRAVITY_AUTHENTICATING
ANTIGRAVITY_AUTHENTICATED
PC_REQUIRED
CONNECTOR_INSTALLING
PC_PAIRING
PC_CONNECTED
ENVIRONMENT_DISCOVERY
PROJECT_DISCOVERY
INTEGRATION_DISCOVERY
PERMISSION_DISCOVERY
PERMISSION_AUTHORIZATION
VALIDATION
READY
```

## Flujo
1. Crear/iniciar sesión.
2. Conectar Antigravity.
3. Mostrar permisos y finalidad.
4. Instalar Agent Connector.
5. Emparejar PC mediante código temporal o mecanismo oficial.
6. Detectar sistema operativo.
7. Detectar Antigravity y CLI.
8. Seleccionar carpetas autorizadas.
9. Descubrir proyectos.
10. Detectar Git y proveedores.
11. Detectar Firebase, Supabase, Vercel, Netlify, Cloudflare, AWS, Azure, Docker, Sentry y otros conectores reales.
12. Solicitar únicamente permisos faltantes.
13. Validar todas las conexiones.
14. Configurar backups y notificaciones.
15. Mostrar informe final.

## UX
Móvil: un paso por pantalla, botones grandes, QR/deep links.
Tablet: pasos + diagnóstico en dos columnas.
PC: pasos laterales + diagnóstico/logs.

Nunca obligar a empezar desde cero si falla un paso.
