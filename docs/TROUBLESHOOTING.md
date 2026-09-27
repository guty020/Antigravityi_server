# RESOLUCIÓN DE PROBLEMAS (TROUBLESHOOTING)

## 1. El Agent Connector no se conecta al servidor
- **Síntoma:** El comando `node agent.js` arroja error de conexión o timeout.
- **Solución:**
  1. Verifica que el servidor esté activo ejecutando `npm start`.
  2. Comprueba que la URL pasada al parámetro `--server` sea accesible (ej. `http://localhost:4000`).
  3. Asegúrate de que el código PIN no haya superado los 10 minutos de validez; si expiró, genera uno nuevo en la interfaz.

## 2. Bloqueo de Tarea por Emergency Lock
- **Síntoma:** Los endpoints devuelven el error `423 Locked: EMERGENCY_LOCK_ACTIVE`.
- **Solución:** Pulsa el botón superior "DESBLOQUEAR EMERGENCIA" en la interfaz web e introduce tu contraseña de usuario registrada.

## 3. Error de Workspace Bloqueado
- **Síntoma:** Aparece el error `WORKSPACE_LOCKED: El workspace esta bloqueado por la tarea activa`.
- **Solución:** Existe una tarea en curso sobre ese mismo proyecto. Espera a que finalice o cancela la tarea anterior desde el panel del Orquestador.
