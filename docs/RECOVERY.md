# RECUPERACIÓN ANTE DESASTRES Y RESTAURACIÓN

## Restauración desde Snapshot Local
Si un despliegue o comando crítico causa una regresión o pérdida de datos:
1. Accede a la pestaña **Backups de 3 Niveles** en el panel lateral.
2. Identifica el snapshot previo a la operación mediante su fecha y checksum SHA-256.
3. Invoca la restauración a través del endpoint `/api/backups/:id/restore`.
4. El gestor de backups descomprime el archivo `.json.gz` y restaura cada archivo de forma atómica.

## Reversión vía Git Checkpoint
Si el proyecto cuenta con repositorio Git:
1. Inspecciona las ramas creadas automáticamente con el prefijo `checkpoint_*`.
2. Ejecuta un checkout hacia la rama de checkpoint:
   ```bash
   git checkout checkpoint_auto_<timestamp>
   ```
3. Verifica que la suite de pruebas vuelva a pasar con éxito antes de reanudar el desarrollo.
