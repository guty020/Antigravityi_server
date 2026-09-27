# ANTIGRAVITY CONNECTOR — DOCUMENTACIÓN OFICIAL

Bienvenido a la documentación técnica de **Antigravity Connector**, la plataforma integral de orquestación, conexión multi-cuenta y emparejamiento de PCs para desarrollo de software autónomo y supervisado.

## Índice de Documentos
- [README](README.md): Guía de bienvenida y primeros pasos.
- [ONBOARDING](ONBOARDING.md): El flujo de 16 estados desde el registro hasta el estado READY.
- [ARCHITECTURE](ARCHITECTURE.md): Diagrama de capas, interfaces desacopladas y flujo de datos.
- [AUTH](AUTH.md): Autenticación, sesiones seguras y hashing scrypt con salt.
- [MULTIUSER](MULTIUSER.md): Aislamiento estricto multi-tenant y reglas de propiedad de recursos.
- [ANTIGRAVITY](ANTIGRAVITY.md): Adaptador de Antigravity, inspección local y matriz de capacidades oficial.
- [AGENT-CONNECTOR](AGENT-CONNECTOR.md): Demonio local para Windows, macOS y Linux con allowlist.
- [PROJECT-DISCOVERY](PROJECT-DISCOVERY.md): Detección de proyectos, escaneo seguro de secretos y Project Passport.
- [INTEGRATIONS](INTEGRATIONS.md): Integration Hub y Universal Webhook Gateway.
- [OAUTH](OAUTH.md): Flujos de consentimiento, autorización progresiva y tokens rotables.
- [PERMISSIONS](PERMISSIONS.md): Matriz RBAC y niveles de riesgo LOW/MED/HIGH/CRITICAL.
- [SECURITY](SECURITY.md): Centro de seguridad, cifrado AES-256-GCM y botón de Emergency Lock.
- [TASKS](TASKS.md): Orquestador central de tareas y locks de workspace.
- [BACKUPS](BACKUPS.md): Sistema de backups de 3 niveles (Git checkpoint, Snapshot local y Vault remoto).
- [DEPLOYMENTS](DEPLOYMENTS.md): Flujo de despliegues continuos con rollback asistido.
- [MONITORING](MONITORING.md): Monitor 24/7 y motor de auto-reparación no destructiva.
- [TESTING](TESTING.md): Suite de validación en tiempo real y pruebas unitarias/E2E.
- [TROUBLESHOOTING](TROUBLESHOOTING.md): Diagnóstico de problemas comunes y soluciones paso a paso.
- [RECOVERY](RECOVERY.md): Procedimientos de recuperación ante desastres y restauración de snapshots.
