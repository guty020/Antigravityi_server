# AISLAMIENTO MULTIUSUARIO Y MULTI-TENANT

## Regla Fundamental
`identity != authentication != authorization != permission != resource access`

Nunca se confía en los identificadores enviados por el cliente (`userId`, `projectId`, `machineId`). La titularidad de los recursos se verifica en el backend mediante consultas parametrizadas en cada endpoint.

## Garantías de Aislamiento
- Cada tabla con información privada incluye una columna `user_id` con clave foránea referenciando a `users(id)`.
- El middleware de autenticación inyecta `req.user.id` tras verificar el token en base de datos.
- Las consultas SQL incluyen obligatoriamente la cláusula `WHERE user_id = ?`.
- Las pruebas automáticas en `tests/multiuser_isolation.test.js` certifican que un usuario beta no puede acceder ni alterar proyectos, máquinas o backups creados por un usuario alfa.
