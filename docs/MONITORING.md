# MONITORIZACIÓN 24/7 Y AUTO-REPARACIÓN

## Bucle de Supervisión
El motor `server/monitoring.js` inspecciona los recursos activos de forma continua:
- **Pérdida de Heartbeat:** Si un PC emparejado deja de emitir señales durante más de 35 segundos, su estado cambia automáticamente a `OFFLINE` y se genera una alerta HIGH en el sistema.
- **Detección de Fallos en Tareas:** Toda tarea en estado `FAILED` genera una alerta en el panel de control.

## Auto-Reparación Asistida
1. `DETECT`: Identificación del síntoma anómalo.
2. `ANALYZE`: Evaluación de causa raíz.
3. `BACKUP`: Creación de respaldo preventivo.
4. `PROPOSE`: Presentación de la acción correctiva en la interfaz.
5. `APPROVE`: Solicitud de visto bueno al usuario para cualquier acción no trivial.
6. `EXECUTE & TEST`: Aplicación de la solución y comprobación inmediata del estado de salud.
