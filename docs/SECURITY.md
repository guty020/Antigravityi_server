# CENTRO DE SEGURIDAD Y PARADA DE EMERGENCIA

## Medidas de Seguridad Activas
- **Cifrado de Credenciales:** AES-256-GCM con claves derivadas vía scrypt.
- **Protección contra Inyecciones:** Parámetros preparados en consultas SQL (`node:sqlite`).
- **Path Traversal Protection:** Comprobación recursiva de rutas relativas con resolución absoluta de directorios.
- **Auditoría Inmutable:** Registro secuencial de cada operación relevante en la tabla `audit_events`.

## Modo de Emergencia (Kill-Switch)
El botón **EMERGENCY LOCK** permite a cualquier administrador o desarrollador congelar inmediatamente todas las tareas automáticas y despliegues ante una sospecha de anomalía.
- **Estado Bloqueado:** Bloquea llamadas HTTP mutantes (POST, PUT, DELETE) con código `423 Locked`.
- **Servicios Activos:** Mantiene el streaming de monitorización, logs y diagnósticos.
- **Desbloqueo:** Requiere introducir de nuevo la contraseña de usuario para reanudar operaciones.
