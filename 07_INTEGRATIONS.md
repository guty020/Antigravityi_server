# ANTIGRAVITY CONNECTOR — INTEGRATION HUB

Implementa adapters reales y extensibles.

## Proveedores iniciales
- GitHub
- GitLab
- Bitbucket
- Firebase
- Google Cloud
- Supabase
- Vercel
- Netlify
- Cloudflare
- Render
- Railway
- AWS
- Azure
- Docker Hub
- npm
- Sentry
- Figma
- Postman
- Stripe
- OpenAI
- Anthropic
- Google/Gemini
- Google Drive
- Google Analytics
- Search Console

No marcar una integración como soportada si no existe implementación real.

## Adapter contract
```text
authenticate
refreshToken
disconnect
testConnection
getIdentity
listOrganizations
listProjects
getProject
listResources
listDeployments
getDeployment
getLogs
createWebhook
removeWebhook
getCapabilities
```

## Autorización progresiva
Pedir el mínimo scope.
Si una tarea necesita escritura, solicitar autorización adicional justo antes de utilizarla.

## Webhooks
Crear Universal Webhook Gateway para eventos reales de GitHub, Vercel, Supabase, Sentry, Cloudflare y demás proveedores compatibles.
