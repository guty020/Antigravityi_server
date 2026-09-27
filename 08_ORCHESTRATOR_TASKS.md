# ANTIGRAVITY CONNECTOR — ORCHESTRATOR Y TAREAS

Crear un Orchestrator central.

Recibe:
- intención del usuario;
- proyecto;
- PC;
- cuenta;
- contexto;
- prioridad;
- modo.

Determina:
1. proyecto correcto;
2. PC disponible;
3. integraciones necesarias;
4. permisos;
5. riesgo;
6. backup;
7. agente;
8. pasos;
9. aprobación;
10. ejecución;
11. tests;
12. resultado.

## Estados
PENDING, QUEUED, PLANNING, RUNNING, WAITING_INPUT, WAITING_APPROVAL, TESTING, COMPLETED, FAILED, CANCELLED, PAUSED.

## Workspace locks
Nunca ejecutar dos tareas incompatibles sobre el mismo workspace.

## Modos
SUPERVISED por defecto.
AUTOMATIC para operaciones no destructivas.
CRITICAL siempre requiere aprobación.

## Project Passport
Adjuntar el passport relevante como contexto controlado para las tareas.
