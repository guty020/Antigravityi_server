# INTEGRATION HUB Y WEBHOOK GATEWAY

## Contrato Universal de Adaptadores
Cada conector externo en `server/integrations.js` implementa los métodos estándar:
- `authenticate(credentials)`
- `testConnection(credentials)`
- `listProjects(credentials)`
- `listDeployments(credentials)`
- `getCapabilities()`

## Proveedores Disponibles
- **GitHub:** Conexión vía Personal Access Token o API OAuth para repositorios, commits y ramas.
- **Firebase:** Compatible con Firebase Hosting y Firestore.
- **Supabase:** Compatible con base de datos Postgres y funciones Edge.
- **Vercel / Netlify / Cloudflare:** Integración para monitorizar despliegues.
- **Stripe:** Adaptador de pagos preparado para cuando se active la capa de suscripción comercial.

## Pasarela Universal de Webhooks
El endpoint `/api/webhooks/:provider` recibe eventos en tiempo real, verifica firmas criptográficas y registra auditorías sin bloquear la respuesta HTTP.
