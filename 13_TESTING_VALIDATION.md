# ANTIGRAVITY CONNECTOR — TESTING Y VALIDACIÓN

Crear Test Center.

## Tests
- unit
- integration
- E2E
- security
- build
- performance
- accessibility
- responsive
- provider connectivity
- backup/restore
- auth/revocation
- multiuser isolation

## E2E principal
```text
Android/PWA
→ Control Center
→ Backend
→ Agent Connector
→ Antigravity
→ Local Project
→ Git
→ GitHub
→ Backup
→ Build
→ Deploy
→ Health Check
→ Control Center
```

## Multiusuario
USER-A nunca puede acceder a recursos de USER-B y viceversa.

Probar acceso por:
- frontend
- API
- WebSocket
- tasks
- logs
- backups
- Git
- integrations

## Estados de validación
NOT_CONFIGURED
CONFIGURED
CONNECTED
READY
DEGRADED
ERROR
BLOCKED
NOT_SUPPORTED
DISCONNECTED

No usar `READY` sin prueba real.
