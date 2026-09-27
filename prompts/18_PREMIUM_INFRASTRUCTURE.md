# ANTIGRAVITY CONNECTOR — INFRAESTRUCTURA PREMIUM (DORMIDA / DESACTIVADA)

## Objetivo
Implementar una capa de infraestructura Premium desacoplada, gobernada por Feature Flags y suscripciones satélite, manteniéndola en estado inactivo (`PREMIUM_DISABLED = true`).
Todos los usuarios deben poder registrarse y utilizar el 100% de la plataforma de forma ilimitada sin restricciones, bloqueos, modales ni pasarelas forzadas.

## Reglas del módulo
- Modo inicial: `PREMIUM_DISABLED = true`.
- Sin restricciones para usuarios gratuitos: acceso completo a todas las funcionalidades.
- Sin bloqueos ni fricción en registro o login.
- Sin límites artificiales de proyectos, sincronización, PCs conectados, almacenamiento, backups, automatizaciones, monitorización, historial o funciones de IA mientras Premium esté desactivado.
- No mostrar mensajes, modales ni banners de "Hazte Premium" o "Compra Premium" mientras esté desactivado.
- Registro y login totalmente independientes del estado de suscripción.
- Estado de suscripción completamente desacoplado del esquema de usuarios principal.
- No romper funcionalidades existentes al integrar este módulo.

## Parámetros iniciales
- Precio configurable inicial: 1,50 €/mes.
- Divisa: EUR.
- Intervalo: mensual.
- Premium creado como producto/precio, pero sin activación comercial.
- Preparación para Stripe u otro proveedor de pago, pero sin realizar cobros todavía.

## Entidades y modelo de datos
1. **Configuración global (`system_settings`):**
   - `premium_mode_enabled`: boolean (`false` por defecto).
   - `premium_default_price`: decimal (`1.50`).
   - `premium_currency`: string (`"EUR"`).
   - `premium_billing_interval`: string (`"month"`).
2. **Planes de suscripción (`subscription_plans`):**
   - `id`, `code` (`premium_monthly`), `name`, `amount`, `currency`, `interval`, `is_active` (`false`).
3. **Estado de suscripción (`user_subscriptions`):**
   - `id`, `user_id` (FK independiente), `plan_id`, `status` (`dormant`, `inactive`, `active`), `provider` (`stripe`, etc.), `customer_id`, timestamps.
4. **Matriz de capacidades (`feature_entitlements`):**
   - Catálogo preparado para futuras restricciones cuando Premium se active:
     - `max_projects`
     - `sync_interval_seconds`
     - `max_connected_pcs`
     - `backups_enabled`
     - `cloud_storage_mb`
     - `automation_pipelines`
     - `monitoring_retention`
     - `history_retention_days`
     - `ai_features_enabled`
   - Si `premium_mode_enabled == false`: el evaluador retorna `granted / allow = true` siempre.

## Panel de administración y auditoría
- Panel de control de administración con interruptor maestro (`toggle`) para activar/desactivar Premium.
- Configuración de precio e intervalo.
- Auditoría estricta de cambios: registrar en `audit_logs` qué admin cambió el estado, fecha y valores anterior/nuevo.

## Interfaz de usuario (Opciones / Ajustes)
- Apartado Premium / Suscripción dentro de Opciones/Ajustes.
- Mientras esté desactivado: mostrar mensaje limpio informativo de acceso total a todas las herramientas sin elementos bloqueantes ni pasarelas invasivas.

## Pasarela de pagos (Stripe / Provider)
- Módulo adaptador preparado (`StripeService` / `PaymentAdapter`).
- Endpoints de webhook preparados (`/api/webhooks/billing`) con validación de firmas.
- No invocar sesiones de checkout ni requerir tarjeta bancaria mientras el modo Premium esté inactivo.
