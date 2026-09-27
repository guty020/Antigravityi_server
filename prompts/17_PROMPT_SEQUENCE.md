# SECUENCIA RECOMENDADA DE PROMPTS

Antigravity debe trabajar en este orden:

1. `00_MASTER_ORCHESTRATOR.md`
2. `01_ARCHITECTURE.md`
3. `02_IDENTITY_AUTH_MULTIUSER.md`
4. `03_ONBOARDING.md`
5. `04_AGENT_CONNECTOR.md`
6. `05_ANTIGRAVITY_ADAPTER.md`
7. `06_PROJECT_DISCOVERY.md`
8. `07_INTEGRATIONS.md`
9. `08_ORCHESTRATOR_TASKS.md`
10. `09_GIT_BACKUP_DEPLOY.md`
11. `10_SECURITY_AUDIT.md`
12. `11_ADAPTIVE_UI.md`
13. `12_MONITORING_AUTO_REPAIR.md`
14. `13_TESTING_VALIDATION.md`
15. `14_DOCUMENTATION.md`
16. `15_DEVELOPMENT_WORKFLOW.md`
17. `16_CHANGELOG_AND_STATE.md`
18. `18_PREMIUM_INFRASTRUCTURE.md`

## Regla de uso
El MASTER define las reglas globales.

Los demás archivos son prompts especializados y pueden pasarse como contexto cuando Antigravity trabaje en ese subsistema.

No duplicar innecesariamente requisitos. Si existe conflicto, gana:
MASTER → seguridad → arquitectura → módulo específico.

## Objetivo
Ahorrar tokens manteniendo el contexto organizado, reutilizable y modular.
