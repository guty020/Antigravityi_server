# ANTIGRAVITY CONNECTOR — IDENTITY, AUTH Y MULTIUSUARIO

Implementa identidad y aislamiento real por usuario.

## Entidades
- User
- Session
- Identity
- ProviderAccount
- AntigravityAccount
- Machine
- Workspace
- Project
- Integration
- Task
- AuditEvent

Toda entidad privada debe tener relación verificable con el usuario propietario.

## Reglas
`identity != authentication != authorization != permission != resource access`

Nunca confiar en `userId`, `projectId`, `machineId` o `accountId` enviados por el cliente. Validar propiedad en backend.

## Antigravity
Cuando un usuario conecte su cuenta:
1. iniciar el mecanismo oficial disponible;
2. completar OAuth/OIDC/Device Flow si existe;
3. respetar consentimiento, MFA y restricciones;
4. validar identidad;
5. detectar capacidades;
6. guardar solo credenciales de forma segura;
7. asociar la cuenta al usuario;
8. continuar automáticamente al onboarding.

Nunca pedir contraseñas de proveedores dentro de la aplicación.

## Múltiples cuentas
Permitir varias cuentas si el proveedor lo permite. Cada proyecto debe poder indicar qué conexión utiliza.

## Revocación
Implementar:
- disconnect
- revoke
- reauthorize
- token expiry
- session logout
- device revocation

Crear pruebas de aislamiento entre USER-A y USER-B.
