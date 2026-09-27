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

## Emparejamiento Rápido y Universal (1-Clic)
- **Descarga Directa HTTP:** El servidor expone `/agent.js` para permitir la descarga y ejecución sin requerir clonar el repositorio previamente.
- **Comando Universal Windows:**
  ```cmd
  curl.exe -s http://localhost:4000/agent.js -o "%TEMP%\agent.js" && node "%TEMP%\agent.js" --server http://localhost:4000 --pair <CODIGO>
  ```
- **PowerShell:**
  ```powershell
  Invoke-WebRequest -Uri "http://localhost:4000/agent.js" -OutFile "$env:TEMP\agent.js"; node "$env:TEMP\agent.js" --server "http://localhost:4000" --pair <CODIGO>
  ```
- **Sincronización Automática:** Al completar el emparejamiento, el agente escanea de inmediato las carpetas autorizadas de desarrollo y sincroniza los proyectos con `/api/agent/report-projects`.
- **Copia al Portapapeles:** La interfaz web provee botón `📋 Copiar Comando` con feedback visual inmediato para usuarios principiantes y avanzados.

