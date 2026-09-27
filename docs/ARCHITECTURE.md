# ARQUITECTURA DE ANTIGRAVITY CONNECTOR

La plataforma implementa un diseño modular y desacoplado, concebido para operar de forma transparente en entornos móviles, tablets y estaciones de trabajo PC.

```text
  Dispositivos (Mobile / Tablet / PC)
                 │
                 ▼
       Responsive PWA Frontend
                 │
                 ▼  REST API / WebSockets (/ws)
       Backend & Security Engine (Node.js)
                 │
      ┌──────────┴──────────┐
      ▼                     ▼
SQLite Multi-Tenant    Orquestador Central
DatabaseSync           (Risk Gate & Locks)
      │                     │
      ├─────────────────────┼─────────────────────┐
      ▼                     ▼                     ▼
Antigravity Adapter   Agent Connector     Integration Hub
(Official Checks)     (Local PCs Daemon)  (GitHub, Firebase...)
                            │
                      Project Discovery
                      & 3-Level Backups
```

## Capas del Sistema
1. **Frontend PWA:** Interfaz reactiva adaptativa con soporte completo táctil para móvil y paneles multi-columna para PC.
2. **Backend API:** Servidor HTTP Express y WebSocket para comunicación bidireccional de baja latencia con agentes y clientes.
3. **Capa de Datos:** `node:sqlite` nativo de Node 24 con claves foráneas estrictas y sin dependencias C++.
4. **Seguridad & RBAC:** Control de acceso basado en roles (`admin`, `developer`, `viewer`) y botón de Parada de Emergencia.
5. **Orquestador:** Motor de estados con mutex por proyecto, evitando modificaciones simultáneas incompatibles.
