# OAUTH, TOKENS Y AUTORIZACIÓN PROGRESIVA

## Principio de Mínimo Privilegio
La plataforma solicita inicialmente el menor ámbito de permisos posible (ej. solo lectura). Cuando una tarea requiere escribir o desplegar recursos, el sistema solicita al usuario la elevación de permisos mediante una autorización progresiva puntual.

## Almacenamiento Seguro
- Todos los tokens de acceso OAuth y claves privadas se cifran en reposo con AES-256-GCM antes de ser almacenados en la base de datos.
- Las claves nunca se exponen al navegador ni se escriben en los archivos de registro (logs).
