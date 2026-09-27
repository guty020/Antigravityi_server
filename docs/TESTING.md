# TEST CENTER Y VALIDACIÓN CONTINUA

## Enfoque de Pruebas
De acuerdo con las reglas de Prompt 00 y 13:
- Ninguna capacidad se declara `FUNCIONAL` hasta haber sido ejecutada y comprobada en el entorno real.
- Las pruebas pueden ejecutarse desde la terminal mediante `npm test` o de manera interactiva a través del **Test Center** en la interfaz web (`/api/tests/run`).

## Categorías de Tests
1. **Aislamiento Multiusuario:** Verifica que las consultas SQL de USER-B jamás devuelvan registros creados por USER-A.
2. **Criptografía:** Valida el algoritmo scrypt y el cifrado AES-256-GCM.
3. **Adaptador Antigravity:** Asegura que los endpoints no implementados devuelvan explícitamente `NOT_SUPPORTED`.
4. **Orquestador y Backups:** Comprueba la clasificación de riesgos, la generación de snapshots con SHA-256 y los bloqueos de concurrencia.
5. **Infraestructura Premium Dormida:** Verifica que el flag `PREMIUM_DISABLED = true` conceda acceso 100% gratuito e ilimitado a todos los usuarios.
