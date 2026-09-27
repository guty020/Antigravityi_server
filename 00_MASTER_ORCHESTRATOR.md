# ANTIGRAVITY CONNECTOR — MASTER ORCHESTRATOR

## Objetivo
Construye ANTIGRAVITY CONNECTOR como una plataforma real, multiusuario, segura y adaptable a móvil, tablet y PC para conectar cuentas de Antigravity, PCs, Agent Connector, proyectos e integraciones.

## Reglas absolutas
- No demo, mock, fake API ni botones sin implementación.
- No inventar APIs de Antigravity.
- Usar únicamente mecanismos oficiales/documentados disponibles en el entorno.
- Si una capacidad no está disponible: `NOT_SUPPORTED` y explicación.
- No declarar una función FUNCIONAL hasta haberla ejecutado y validado.
- Separar `IMPLEMENTADO PERO NO VALIDADO` de `FUNCIONAL Y VALIDADO`.
- Nunca exponer secretos al frontend.
- Toda operación debe estar aislada por usuario, cuenta, PC, proyecto y workspace.
- Operaciones HIGH/CRITICAL requieren aprobación.
- Crear backup antes de operaciones de riesgo.
- Mantener auditoría completa.
- No romper funcionalidades existentes al añadir nuevas.

## Orden de ejecución
1. Inspeccionar workspace y stack real.
2. Crear inventario de archivos y capacidades.
3. Diseñar arquitectura.
4. Implementar identidad y multiusuario.
5. Implementar conexiones de proveedores.
6. Implementar Agent Connector.
7. Implementar Antigravity Adapter.
8. Implementar pairing de PCs.
9. Implementar descubrimiento de entorno y proyectos.
10. Implementar integraciones.
11. Implementar tareas/orquestación.
12. Implementar backups, seguridad y auditoría.
13. Implementar UI adaptativa.
14. Implementar monitorización.
15. Ejecutar pruebas unitarias, integración y E2E.
16. Documentar.
17. Implementar infraestructura Premium (dormida / desactivada).
18. Entregar informe de validación.

## Condición de terminado
No terminar porque el código compile. Terminar cuando las rutas críticas hayan sido ejecutadas y verificadas en el entorno disponible.
