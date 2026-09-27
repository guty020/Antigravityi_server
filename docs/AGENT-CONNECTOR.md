# AGENT CONNECTOR (DEMONIO LOCAL)

`agent-connector/agent.js` es un cliente en Node.js multiplataforma para Windows, macOS y Linux.

## Funciones Principales
- **Emparejamiento Seguro:** Mediante un código PIN temporal de 6 dígitos que expira a los 10 minutos.
- **Heartbeat Periódico:** Envío cada 10 segundos de telemetría de CPU, memoria, tiempo de actividad y disponibilidad de herramientas (Git, Node, Python, Docker).
- **Lista Blanca de Directorios (Allowlist):** El agente solo tiene autorización para inspeccionar y ejecutar tareas dentro de las carpetas que el usuario ha aprobado expresamente.
- **Prevención de Path Traversal:** Comprobación estricta de rutas mediante `isPathSafe` para evitar accesos indebidos fuera del árbol del proyecto.
