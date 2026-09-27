# ANTIGRAVITY CONNECTOR — SECURITY

Implementa Security Center.

## Obligatorio
- secrets management;
- OAuth/OIDC;
- token encryption;
- refresh/revocation;
- MFA compatible;
- RBAC;
- RLS cuando corresponda;
- rate limiting;
- CSRF;
- XSS;
- SSRF;
- path traversal;
- command injection;
- secret scanning;
- dependency scanning;
- audit log;
- session/device management.

## Secretos
Nunca:
- localStorage;
- logs;
- URLs;
- frontend;
- commits.

## Emergency Mode
Botón:
`BLOQUEAR TODA EJECUCIÓN`

Bloquea:
- comandos;
- deployments;
- tareas automáticas;
- operaciones críticas.

Mantiene:
- monitorización;
- logs;
- diagnóstico.

Requiere autenticación fuerte para desbloquear.
