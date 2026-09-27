# ANTIGRAVITY CONNECTOR — GIT, BACKUPS Y DEPLOY

## Git
Implementar:
status, diff, branches, commits, stage, unstage, pull, push, fetch, merge, PR.

## Backup de tres niveles
1. Git checkpoint.
2. Snapshot local.
3. Backup remoto S3-compatible/GCS/Backblaze u otro adapter.

Antes de HIGH/CRITICAL:
```text
GIT CHECKPOINT
SNAPSHOT
REMOTE BACKUP
VERIFY
EXECUTE
TEST
```

Si falla el backup crítico, bloquear la operación.

## Deploy
Flujo:
backup → git validation → secret scan → tests → build → approval → deploy → health check.

Proveedores mediante adapters.
Rollback seguro.
Nunca borrar el último backup válido.
