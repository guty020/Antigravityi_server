# ORQUESTADOR CENTRAL DE TAREAS

El orquestador en `server/orchestrator.js` gestiona el ciclo de vida completo de cada tarea.

## Estados del Ciclo de Vida
`PENDING` ➔ `QUEUED` ➔ `PLANNING` ➔ `WAITING_APPROVAL` (si es HIGH o CRITICAL) ➔ `RUNNING` ➔ `TESTING` ➔ `COMPLETED` o `FAILED`.

## Bloqueos de Workspace (Mutex)
Para evitar que dos agentes o tareas concurrentes sobreescriban los mismos archivos, el orquestador mantiene una tabla de mutex en memoria por ruta de proyecto. Si una tarea está ejecutándose sobre un workspace, cualquier otra tarea sobre esa misma ruta queda en cola o es rechazada con `WORKSPACE_LOCKED`.
