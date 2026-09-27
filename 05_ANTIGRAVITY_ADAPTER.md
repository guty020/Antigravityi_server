# ANTIGRAVITY CONNECTOR — ANTIGRAVITY ADAPTER

Crear una interfaz desacoplada:

```ts
connect()
disconnect()
status()
capabilities()
listSessions()
sendTask()
getTaskStatus()
getConversation()
getPendingApproval()
approve()
reject()
cancel()
getLogs()
```

## Regla principal
Antes de implementar:
1. inspeccionar instalación;
2. detectar CLI real;
3. comprobar documentación oficial disponible;
4. comprobar Remote Control oficial;
5. detectar versión;
6. detectar capacidades.

Utilizar únicamente mecanismos reales.

No inventar endpoints ni APIs privadas.

## Capability matrix
Registrar:
- capability
- provider/version
- supported
- validated
- limitation

Si no existe una capacidad:
`NOT_SUPPORTED`.

## Validación
Una integración solo puede marcarse como `READY` después de una prueba real.
