# DESCUBRIMIENTO CONTROLADO Y PROJECT PASSPORT

## Escaneo Seguro de Proyectos
El motor `server/discovery.js` examina las carpetas autorizadas hasta una profundidad máxima configurable (por defecto 2 niveles), ignorando intencionalmente directorios voluminosos o de dependencias (`node_modules`, `.git`, `.venv`, `dist`, `build`).

## Indicadores Detectados
- **Lenguajes y Runtimes:** Node.js (`package.json`), Python (`requirements.txt`, `pyproject.toml`), Go (`go.mod`), Rust (`Cargo.toml`).
- **Frameworks:** Next.js, Vite, React, Vue, Angular, Express, FastAPI, Django, Flask.
- **Control de Versiones:** Repositorio Git, rama activa, último commit y remoto configurado.
- **Cloud & Despliegues:** Dockerfile, `firebase.json`, `supabase/`, `vercel.json`, `netlify.toml`, `wrangler.toml`.

## Protección de Secretos
El escáner analiza archivos `.env` pero **NUNCA** transmite los valores en texto plano al frontend. Únicamente reporta:
`".env detectado — N variables — M posibles secretos"`.

## Project Passport
Ficha técnica consolidada por proyecto con metadatos técnicos, estado de backups, cobertura de tests y conectores activos.
