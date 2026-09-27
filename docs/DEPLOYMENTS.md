# DESPLIEGUES Y CI/CD

## Flujo de Despliegue Seguro
```text
BACKUP 3 NIVELES ➔ VALIDACIÓN GIT ➔ ESCANEO DE SECRETOS ➔ TESTS ➔ BUILD ➔ APROBACIÓN ➔ DEPLOY ➔ HEALTH CHECK
```

## Reglas de Despliegue
- Ningún despliegue se ejecuta sin confirmación explícita del usuario cuando el modo SUPERVISED está activo.
- Todo despliegue fallido permite revertir automáticamente al último backup verificado con el comando de restauración.
- Nunca se elimina la última versión funcional de un proyecto de la base de datos de snapshots.
