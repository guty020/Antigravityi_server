# MATRIZ DE PERMISOS Y ROLES (RBAC)

## Roles de Usuario
1. **Admin:** Acceso total a la configuración del sistema, gestión de planes e interruptor maestro Premium.
2. **Developer:** Creación de proyectos, ejecución de tareas, emparejamiento de PCs y creación de backups.
3. **Viewer:** Visualización de dashboards, logs y estado de proyectos sin permisos de ejecución.

## Niveles de Riesgo de Operaciones
- **LOW:** Lecturas de estado, logs, consultas informativas (`git status`, inspecciones).
- **MEDIUM:** Compilaciones locales, ejecución de pruebas automáticas, diffs.
- **HIGH:** Modificación de archivos, commits en ramas principales, instalación de paquetes. Requiere backup previo.
- **CRITICAL:** Despliegues en producción, eliminaciones de bases de datos o archivos, cambios destructivos. Requiere aprobación explícita y backup previo de 3 niveles.
