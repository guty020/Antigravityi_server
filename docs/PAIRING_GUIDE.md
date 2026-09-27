# Guía de Emparejamiento de PCs y Conectores Locales (Antigravity Connector)

Esta guía explica en detalle cómo emparejar tu PC local o estaciones remotas de trabajo con el servidor central de Antigravity. Está diseñada para ser accesible tanto para **desarrolladores noveles (principiantes)** como para **desarrolladores senior**.

---

## 1. ¿Qué es el Emparejamiento de PCs?

El **Agente de Emparejamiento (`agent.js`)** es un proceso demonio ligero en Node.js que se ejecuta en tu ordenador físico. Permite que la plataforma Antigravity:
1. Descubra tus proyectos de desarrollo locales (en `Desktop`, `Desktop/Web`, `Projects`, etc.).
2. Lea las dependencias (`package.json`, `requirements.txt`), ramas Git y configuración de nubes (Docker, Firebase, Supabase, Vercel).
3. Audite de forma segura variables `.env` (contando secretos pero **sin enviar nunca valores privados**).
4. Ejecute tareas de compilación, tests y backups de 3 niveles con supervisión humana.

---

## 2. Resolución del Error: `Cannot find module 'C:\Users\...\agent.js'`

### ¿Por qué ocurría este error?
Al abrir una terminal de Windows (CMD o PowerShell), la consola inicia en tu carpeta de usuario (por ejemplo, `C:\Users\guty0>`). Al ejecutar:
```cmd
node agent.js --server http://localhost:4000 --pair 496-854
```
Node.js buscaba el archivo `agent.js` en `C:\Users\guty0\agent.js`, donde el archivo no existía, arrojando el error `MODULE_NOT_FOUND`.

### La Solución Implementada:
El servidor ahora sirve el archivo `agent.js` directamente a través de HTTP (`http://localhost:4000/agent.js`). De este modo, cualquier terminal puede descargarlo a la carpeta temporal del sistema y ejecutarlo en **un solo comando automático**.

---

## 3. Guía Paso a Paso para Principiantes (1 Clic)

1. **Generar el Código:**
   En la aplicación web, dirígete a **`🖥️ PCs & Conectores`** y pulsa en **"Emparejar Nuevo PC"**. Escribe un nombre para tu equipo y haz clic en **"Generar Código de Emparejamiento"**.
   
2. **Copiar el Comando:**
   Verás en pantalla tu código temporal de 6 dígitos y un botón verde destacado:
   👉 **`📋 Copiar Comando`**. Haz clic en él.

3. **Abrir la Terminal:**
   Abre **Símbolo del sistema (CMD)** o **PowerShell** en tu ordenador Windows. *No te preocupes por la carpeta donde estés*.

4. **Pegar y Ejecutar:**
   Presiona `Ctrl + V` (o haz clic derecho) para pegar el comando y presiona `Enter`.
   
   El comando descargará el conector a la carpeta temporal y conectará tu PC en 2 segundos:
   ```cmd
   curl.exe -s http://localhost:4000/agent.js -o "%TEMP%\agent.js" && node "%TEMP%\agent.js" --server http://localhost:4000 --pair TU-CODIGO
   ```

5. **¡Listo!:**
   Verás en tu consola:
   ```text
   ===============================================
     ANTIGRAVITY LOCAL AGENT CONNECTOR
     Plataforma: win32 (x64)
   ===============================================
   [Agent] Iniciando emparejamiento con el servidor: http://localhost:4000
   [Agent] ¡Emparejado con exito! ID de maquina: mach_...
   [Agent] Escaneando carpetas de desarrollo locales para descubrir proyectos...
   [Agent] 4 proyectos descubiertos. Sincronizando con el servidor...
   [Agent] Bucle de heartbeat iniciado (cada 10s)
   ```
   Tu PC aparecerá automáticamente en color verde (`ONLINE`) en la interfaz web y sus proyectos estarán disponibles en la pestaña **`📁 Proyectos & Passport`**.

---

## 4. Opciones Avanzadas para Desarrolladores Senior

### A. PowerShell Nativo (sin curl.exe)
```powershell
Invoke-WebRequest -Uri "http://localhost:4000/agent.js" -OutFile "$env:TEMP\agent.js"; node "$env:TEMP\agent.js" --server "http://localhost:4000" --pair TU-CODIGO
```

### B. Desde la carpeta del repositorio (`MD/`)
Si ya te encuentras en el directorio del proyecto en la terminal:
```bash
node agent-connector/agent.js --server http://localhost:4000 --pair TU-CODIGO
```

### C. macOS / Linux
```bash
curl -s http://localhost:4000/agent.js -o /tmp/agent.js && node /tmp/agent.js --server http://localhost:4000 --pair TU-CODIGO
```

---

## 5. Carpetas de Búsqueda de Proyectos Permitidas
Por seguridad y protección contra Path Traversal, el agente inspecciona únicamente las carpetas de desarrollo autorizadas del usuario:
- Directorio de ejecución actual (`process.cwd()`)
- `Desktop/Web`
- `Desktop`
- `Projects`
- `workspace`
- `source/repos`

Para cualquier otra carpeta específica, puedes lanzar un escaneo puntual desde la sección **`📁 Proyectos & Passport`**.
