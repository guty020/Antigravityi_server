# BACKUPS DE 3 NIVELES

Antigravity Connector exige una estrategia de copias de seguridad de triple capa antes de ejecutar operaciones clasificadas como HIGH o CRITICAL.

## Los 3 Niveles
1. **Nivel 1 — Git Checkpoint:** Creación de una rama de respaldo automática (`checkpoint_<tag>_<timestamp>`) que guarda el estado exacto del repositorio.
2. **Nivel 2 — Snapshot Local:** Empaquetado comprimido con GZIP de todo el código fuente del proyecto (excluyendo artefactos como `node_modules` y `.git`), junto con el cálculo de su firma criptográfica SHA-256 almacenada en base de datos.
3. **Nivel 3 — Vault Remoto:** Verificación de almacenamiento desacoplado hacia proveedores en la nube S3/GCS.

## Regla de Oro
Si el backup falla antes de una operación de riesgo, la operación se detiene inmediatamente en estado `BLOCKED` y nunca se ejecuta.
