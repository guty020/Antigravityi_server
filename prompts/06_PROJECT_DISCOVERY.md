# ANTIGRAVITY CONNECTOR — PROJECT DISCOVERY

Implementa descubrimiento controlado de proyectos locales.

## Directorios
El usuario debe autorizar las carpetas.
No escanear arbitrariamente todo el disco.

## Detectar
```text
.git
package.json
pnpm-lock.yaml
yarn.lock
bun.lock
requirements.txt
pyproject.toml
Dockerfile
firebase.json
.firebaserc
supabase/
vercel.json
netlify.toml
wrangler.toml
next.config.*
vite.config.*
angular.json
pom.xml
build.gradle
go.mod
Cargo.toml
```

## Información
- nombre
- ruta
- framework
- lenguaje
- runtime
- package manager
- Git
- remote
- branch
- último commit
- Docker
- Firebase
- Supabase
- Vercel
- Netlify
- Cloudflare
- AWS
- Azure
- tests
- build
- deployment

## Secretos
Nunca enviar valores `.env` al frontend.
Mostrar únicamente:
`.env detectado — N variables — M posibles secretos`.

## Project Passport
Generar un passport por proyecto con:
PC, ruta, repo, branch, framework, DB, auth, hosting, dominio, integraciones, backups, tests y último estado.
