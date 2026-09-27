# ANTIGRAVITY CONNECTOR — AGENT CONNECTOR

Implementa un agente local para Windows, macOS y Linux.

## Funciones
- instalación
- registro
- pairing
- autenticación
- heartbeat
- reconexión
- detección de Antigravity
- detección CLI
- detección Git
- detección de runtimes
- descubrimiento de proyectos
- ejecución controlada
- recepción de tareas
- resultados
- logs
- métricas básicas

## Seguridad
- permisos mínimos;
- no abrir puertos inseguros a Internet;
- conexión cifrada;
- pairing temporal;
- tokens rotables;
- revocación;
- workspace allowlist;
- path traversal protection;
- command allow/deny policy;
- auditoría.

## Heartbeat
Enviar estado, versión, capacidades, latencia y tareas activas.

Estados:
ONLINE, CONNECTING, OFFLINE, ERROR, MAINTENANCE.

## Ejecución
Clasificar cada comando:
LOW / MEDIUM / HIGH / CRITICAL.

No ejecutar operaciones destructivas automáticamente.
