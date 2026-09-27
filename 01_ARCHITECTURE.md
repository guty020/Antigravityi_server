# ANTIGRAVITY CONNECTOR — ARCHITECTURE PROMPT

Diseña e implementa una arquitectura modular y escalable:

```text
Mobile / Tablet / PC
        |
        v
Responsive PWA
        |
        v
Backend/API
        |
   Auth / RBAC
        |
 Orchestrator
   /    |     \
Identity Agent  Integrations
Hub     Connector
          |
   Antigravity Adapter
          |
   Projects / Git / Deploy
          |
 Backups / Monitoring / Audit
```

## Capas obligatorias
- Frontend
- Backend/API
- Database
- Authentication
- Authorization/RBAC
- Identity Hub
- Agent Connector
- Antigravity Adapter
- Project Discovery
- Integration Hub
- Task Orchestrator
- Backup Manager
- Deployment Manager
- Notification Manager
- Audit/Security
- Monitoring

## Requisitos
- Interfaces desacopladas.
- Providers mediante adapters.
- Feature/capability detection.
- Multi-tenant desde el diseño inicial.
- Idempotencia.
- Reintentos controlados.
- Timeouts.
- Rate limiting.
- Observabilidad.
- Migraciones versionadas.
- Configuración por entorno.
- No acoplar la aplicación a una única cuenta o PC.

## Entregables
Crear documentación de arquitectura, diagrama de componentes, modelo de datos, contratos API y estrategia de despliegue.
