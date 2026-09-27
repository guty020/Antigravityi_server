# AUTENTICACIÓN Y GESTIÓN DE SESIONES

## Mecanismos Criptográficos
- **Contraseñas:** Hashing mediante `crypto.scryptSync` utilizando sales criptográficas individuales de 16 bytes generadas con `randomBytes`.
- **Tokens de Sesión:** Generación aleatoria de 32 bytes (64 caracteres hexadecimales) almacenados con fecha de caducidad e IP de origen.
- **Revocación:** Capacidad de invalidar sesiones individuales o cerrar todas las sesiones de un usuario de forma instantánea.

## Flujo de Login
1. El cliente envía `email` y `password` a `/api/auth/login`.
2. El servidor busca el usuario por email normalizado.
3. Se recalcula el hash con `scrypt` y la sal guardada.
4. Se realiza comparación en tiempo constante (`timingSafeEqual`) para prevenir ataques de temporización.
5. Se expide el token de sesión y se registra en `audit_events`.
