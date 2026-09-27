# ONBOARDING WIZARD

El onboarding guía al usuario a través de un pipeline estructurado de 16 estados garantizando que ninguna etapa quede sin validar antes de conceder el estado `READY`.

## Pipeline de Estados
1. `REGISTER`: Creación inicial de la cuenta de usuario.
2. `EMAIL_VERIFIED`: Verificación de identidad y correo electrónico.
3. `ANTIGRAVITY_AUTH_REQUIRED`: Detección de necesidad de vincular el entorno Antigravity.
4. `ANTIGRAVITY_AUTHENTICATING`: Proceso de autenticación e inspección de instalación.
5. `ANTIGRAVITY_AUTHENTICATED`: Entorno local de Antigravity verificado.
6. `PC_REQUIRED`: Identificación de necesidad de emparejar al menos un equipo.
7. `CONNECTOR_INSTALLING`: Generación del script de instalación del Agent Connector.
8. `PC_PAIRING`: Generación y canje del código de emparejamiento temporal de 6 dígitos.
9. `PC_CONNECTED`: Primer heartbeat recibido con telemetría de hardware y herramientas.
10. `ENVIRONMENT_DISCOVERY`: Detección de runtimes y ejecutables (Node, Python, Git, Docker).
11. `PROJECT_DISCOVERY`: Escaneo de carpetas autorizadas sin filtración de secretos.
12. `INTEGRATION_DISCOVERY`: Identificación de cuentas externas (GitHub, Firebase, Supabase).
13. `PERMISSION_DISCOVERY`: Detección de permisos y asignación de roles.
14. `PERMISSION_AUTHORIZATION`: Concesión explícita de ámbitos por parte del usuario.
15. `VALIDATION`: Ejecución de pruebas preliminares de conectividad y backups.
16. `READY`: Sistema 100% operativo y disponible para orquestar tareas.

## Recuperación
Si cualquier paso del asistente falla, el usuario no debe reiniciar el proceso desde cero. El estado persiste en la base de datos y la interfaz permite reintentar el paso específico.
