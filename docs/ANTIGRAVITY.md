# ANTIGRAVITY ADAPTER Y CAPABILIDADES OFICIALES

El módulo `server/antigravity.js` actúa como interfaz desacoplada para interactuar con la instalación local de Google Antigravity.

## Principios Rectores
1. **Sin APIs inventadas:** Nunca crear endpoints simulados o respuestas ficticias para funciones de Antigravity.
2. **Inspección Real:** El adaptador examina las rutas locales `~/.gemini/antigravity` y `~/.gemini/antigravity-ide`.
3. **Matriz de Capacidades:**
   - `local_installation_discovery`: Soportado y validado si existe el directorio `~/.gemini`.
   - `ide_skills_inspection`: Soportado para inspeccionar las skills instaladas en el IDE.
   - `mcp_servers_integration`: Soportado para detectar los servidores MCP configurados en `antigravity-ide/mcp`.
   - `agy_cli_execution`: Soportado únicamente si el ejecutable `agy` se encuentra en el PATH del sistema; en caso contrario, devuelve `NOT_SUPPORTED`.
   - `remote_cloud_control`: Devuelve explícitamente `NOT_SUPPORTED` dado que requiere credenciales corporativas OAuth no disponibles.
