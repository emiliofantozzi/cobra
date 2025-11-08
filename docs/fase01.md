# Roadmap Macro COBRA

## Resumen de entendimiento

- Modelo de negocio: plataforma SaaS multi-tenant donde empresas gestionan clientes, contactos, facturas y delegan cobranzas a un agente de IA que automatiza comunicaciones y actualiza estados.
- Arquitectura en capas: presentación en `src/app` y `src/components`; servicios/casos de uso en `src/lib/services`; dominio puro en `src/lib/domain`; infraestructura (Prisma, providers externos) en `src/lib/repositories`, `src/lib/integrations`, `src/lib/db.ts`.
- Integraciones disponibles: Resend para email, WhatsApp Cloud API para mensajería, OpenAI como LLM, Sentry para observabilidad, Supabase/Postgres vía Prisma para persistencia.
- MCPs de apoyo: GitHub, Supabase, Vercel, Resend, Sentry, Context7, shadcn.
- Confirmación: entiendo y respetaré las reglas de `.cursorrules`, especialmente no hardcodear secretos, usar providers y mantener capas separadas, así como el uso obligatorio de variables de entorno según `docs/env-vars.md`.


## Fase 1 – Esqueleto técnico, Auth y wiring básico

- **Objetivo:** Tener una app Next.js operativa con autenticación Google vía Auth.js, estructura de carpetas alineada, Prisma Client inicializado, lectura de variables de entorno clave y Sentry configurado mínimamente.
- **Tareas generales:**

2. Configurar estructura base en `src/app`, `src/components`, `src/lib/*`, `src/emails` si faltan.
3. Implementar `src/app/api/auth/[...nextauth]/route.ts` (o equivalente) con Google OAuth y multi-tenant bootstrap (crear organización demo si no existe).
4. Incorporar `src/lib/db.ts` inicializando Prisma Client y asegurando manejo de singleton en Next.js.
5. Verificar lectura de variables críticas (`AUTH_SECRET`, `DATABASE_URL`, `GOOGLE_CLIENT_ID/SECRET`, `SENTRY_DSN`) usando `process.env` con errores descriptivos.
6. Configurar `sentry.server.config.ts`, `sentry.edge.config.ts`, `instrumentation-client.ts` para inicialización básica usando variables de entorno.

- **Archivos a crear/modificar:** `plan-roadmap.md`, `prisma/schema.prisma` (si requiere ajuste mínimo para usuarios/orgs), `src/app/api/auth/[...nextauth]/route.ts`, `src/lib/db.ts`, `src/lib/services/session` (si aplica), `sentry.server.config.ts`, `sentry.edge.config.ts`, `instrumentation.client.ts`, `.env.example`/`docs/env-vars.md` (solo si surge variable nueva, evitando tocar valores reales).
- **Dependencias:** Punto de partida; no depende de fases previas.
- **Entregable:** Login operativo en local con Google, usuario autenticado vinculado a una organización inicial, app corre sin errores, Sentry captura errores básicos.
- **MCPs de apoyo:** Context7 para consultas de Auth.js/Prisma; Supabase MCP para validar tablas de usuarios/organizaciones; Vercel MCP para revisar variables tras despliegue (solo lectura).

### Estado de implementación

- ✅ Directorios base creados (`src/lib/{config,domain,services,repositories,integrations}` y `src/emails/`).
- ✅ Utilidad centralizada de variables de entorno `src/lib/config/env.ts` con validaciones usando Zod.
- ✅ Prisma Client singleton (`src/lib/db.ts`) y esquema ampliado con modelos Auth.js (Organization, User, Membership, Account, Session, VerificationToken).
- ✅ NextAuth v5 + Google OAuth configurados (`src/lib/auth/index.ts`) con bootstrap multi-tenant (`ensurePrimaryMembership`).
- ✅ Servicios auxiliares (`src/lib/services/session.ts`, `src/lib/services/organizations.ts`) disponibles.
- ✅ Estructura UI inicial: marketing (`src/app/page.tsx`) y aplicación protegida (`src/app/(app)/layout.tsx`, `src/app/(app)/dashboard/page.tsx`).
- ✅ Configuración básica de Sentry (`sentry.server.config.ts`, `sentry.edge.config.ts`, `instrumentation.client.ts`).
- ✅ Proyecto vinculado a Vercel (`.vercel/project.json`) y primer deploy exitoso (`npx vercel deploy --prod`).
- ✅ Variables `NEXT_PUBLIC_APP_URL` y `AUTH_URL` configuradas en Vercel (`https://cobra.vercel.app`).
- ⏳ Validar flujo completo de login local y envío de evento de prueba a Sentry.

## Fase 2 – Modelo de datos y dominio de cobranzas

- **Objetivo:** Definir esquema Prisma y modelos de dominio que reflejen entidades clave multi-tenant y preparar migraciones aplicadas.
- **Tareas concretas:**

1. Diseñar tablas en `prisma/schema.prisma` para Organization, User, Membership, CustomerCompany, Contact, Invoice, Installment, Payment, CollectionCase, CommunicationAttempt, AgentRun, AgentActionLog.
2. Ejecutar migraciones (`pnpm prisma migrate dev`) asegurando vínculos por `organizationId`.
3. Crear tipos/lógica en `src/lib/domain/*` representando estados de cobranza y entidades con invariantes básicas.
4. Implementar repositorios iniciales en `src/lib/repositories/*` (CRUD básico) garantizando filtros por `organizationId`.
5. Actualizar documentación (`docs/architecture.md`, `docs/env-vars.md` si hubiese nuevas env vars) coherente con el modelo.

- **Archivos a crear/modificar:** `prisma/schema.prisma`, `prisma/migrations/*`, `src/lib/domain/*.ts`, `src/lib/repositories/*.ts`, `docs/architecture.md` (sección modelo), `plan-roadmap.md` (estado de fase).
- **Dependencias:** Requiere Fase 1 (Auth y Prisma configurados).
- **Entregable:** Migraciones aplicadas sin errores, dominios tipados disponibles, repositorios retornan datos filtrados por organización.
- **MCPs de apoyo:** Supabase MCP para validar esquema en la BD; Context7 para referencias Prisma; GitHub MCP para corroborar convenciones; Playwright MCP aún no necesario.

## Fase 3 – CRUDs principales (UI + API)

- **Objetivo:** Exponer gestión completa de organizaciones/empresa actual, empresas cliente, contactos y facturas/cuotas mediante UI basada en shadcn y endpoints/acciones server alineadas con arquitectura.
- **Tareas concretas:**

1. Implementar server actions o API routes para CRUD de CustomerCompany, Contact, Invoice, Installment.
2. Construir páginas en `src/app/(app)/...` con listas, formularios y detalle usando componentes personalizados y shadcn (respetando paleta azul).
3. Integrar servicios en `src/lib/services/*` que orquesten validación (Zod), dominio y repositorios para cada CRUD.
4. Añadir componentes reutilizables en `src/components/ui/*` y formularios con validaciones y estados de carga.
5. Configurar manejo de sesión multi-tenant (selección de organización o asignación automática) en layout principal.

- **Archivos a crear/modificar:** `src/app/(app)/dashboard/page.tsx`, `src/app/(app)/customers/*`, `src/app/api/*` o server actions correspondientes, `src/lib/services/*`, `src/components/ui/*`, `plan-roadmap.md`.
- **Dependencias:** Requiere Fase 2 (modelo y repositorios), Fase 1 (auth base).
- **Entregable:** CRUDs funcionales con UI consistente, datos almacenados correctamente según organización, validaciones mínimas y sin errores runtime.
- **MCPs de apoyo:** shadcn MCP para componentes; Context7 para patrones Next.js; Sentry MCP para monitorear errores en uso temprano.

## Fase 4 – Estado de cobranzas y timeline

- **Objetivo:** Implementar lógica y UI que muestren y actualicen el estado de cobranzas por factura, incluyendo timelines de comunicaciones.
- **Tareas concretas:**

1. Expandir dominio (`src/lib/domain/collection`) con funciones para calcular estado (`PENDING`, `OVERDUE`, etc.) y próximas acciones.
2. Crear servicios en `src/lib/services/collectionCases` para abrir/actualizar `CollectionCase`, registrar `CommunicationAttempt` y generar dashboards resumen.
3. Implementar vistas (ej. `src/app/(app)/collections/[id]/page.tsx`) con timelines y métricas.
4. Añadir agregados y queries en repositorios que soporten timeline ordenado por fecha.
5. Integrar notificaciones básicas (toast, banners) en UI para estados críticos.

- **Archivos a crear/modificar:** `src/lib/domain/collection/*.ts`, `src/lib/services/collectionCases.ts`, `src/lib/repositories/collectionCaseRepository.ts`, `src/app/(app)/collections/*`, componentes UI timeline.
- **Dependencias:** Requiere Fase 3 (CRUD base) y Fase 2 (dominio entidades).
- **Entregable:** Dashboard/timeline mostrando estado consolidado de cobranzas, cálculos consistentes con reglas dominio.
- **MCPs de apoyo:** Context7 para ejemplos de timelines; Supabase MCP para revisar consultas; Sentry MCP para verificar ausencia de errores críticos.

## Fase 5 – Integraciones externas básicas

- **Objetivo:** Incorporar providers de Resend y WhatsApp para enviar recordatorios y aceptar webhooks, habilitando flujos manuales simples.
- **Tareas concretas:**

1. Implementar `src/lib/integrations/emailProvider.ts` usando Resend con plantillas en `src/emails/*`.
2. Implementar `src/lib/integrations/whatsappProvider.ts` para envíos salientes y verificación de webhooks (`src/app/api/webhooks/whatsapp/route.ts`).
3. Crear servicios en `src/lib/services/notifications.ts` o similar que consuman estos providers.
4. Configurar endpoints para webhooks de entrada, validando firma/token y generando `CommunicationAttempt`.
5. Actualizar documentación (`docs/architecture.md`, `docs/env-vars.md`) si se agregan parámetros operativos.

- **Archivos a crear/modificar:** `src/lib/integrations/emailProvider.ts`, `src/lib/integrations/whatsappProvider.ts`, `src/emails/*`, `src/app/api/webhooks/whatsapp/route.ts`, `src/lib/services/notifications.ts`, `plan-roadmap.md`.
- **Dependencias:** Requiere Fase 4 (estado y timeline) para registrar acciones y Fase 2 (modelo) para entidades.
- **Entregable:** Envío manual/semi-automático de recordatorios por email y WhatsApp funcionando en entorno de desarrollo, webhooks registran respuestas.
- **MCPs de apoyo:** Resend MCP para verificar envíos; Supabase MCP para revisar registros; Vercel MCP para validar configuración de webhooks.

## Fase 6 – Agente de cobranzas (IA)

- **Objetivo:** Diseñar e implementar el agente que automatiza decisiones, genera mensajes con OpenAI y actualiza casos según respuestas.
- **Tareas concretas:**

1. Crear interfaz `LLMProvider` en `src/lib/integrations/llmProvider.ts` con implementación OpenAI (usando `LLM_PROVIDER`, `OPENAI_MODEL`).
2. Desarrollar servicios en `src/lib/services/agent` que orquesten selección de casos (`CollectionCase`), invocación LLM, envío vía providers y logging (`AgentRun`, `AgentActionLog`).
3. Implementar scheduler (cron/route) en `src/app/api/agent/run/route.ts` o server action que dispare el agente, guardando `nextActionAt`.
4. Añadir lógica de clasificación de respuestas (LLM) para determinar tipo de respuesta y actualizar estado de caso.
5. Asegurar trazabilidad en Sentry (`Sentry.startSpan`) y logging estructurado siguiendo reglas.

- **Archivos a crear/modificar:** `src/lib/integrations/llmProvider.ts`, `src/lib/services/agent/*.ts`, `src/lib/domain/agent/*.ts`, `src/app/api/agent/*`, `plan-roadmap.md`.
- **Dependencias:** Requiere Fase 5 (providers canal), Fase 4 (estado cobranzas) y Fase 2 (dominio completo).
- **Entregable:** Agente capaz de ejecutar ciclo básico (seleccionar casos pendientes, generar mensaje, enviar, registrar acción y ajustar estado según respuesta clasificada).
- **MCPs de apoyo:** Context7 para ejemplos OpenAI; Vercel MCP para configurar cron; Sentry MCP para monitorear rendimiento.

## Fase 7 – Observabilidad, tests y endurecimiento

- **Objetivo:** Fortalecer observabilidad, pruebas y robustez antes de producción.
- **Tareas concretas:**

1. Profundizar instrumentación Sentry (tracing personalizado, logger con `consoleLoggingIntegration`).
2. Configurar suites de tests unitarios (dominio) y servicios con mocks de providers; añadir scripts en `package.json`.
3. Preparar y ejecutar tests E2E con Playwright para flujos críticos (login, alta cliente, factura, agente manual).
4. Revisar seguridad multi-tenant (políticas de acceso, filtros) y aplicar hardening en consultas/services.
5. Documentar procedimientos operativos en `docs/roadmap.md` y actualizar `plan-roadmap.md` con estado final.

- **Archivos a crear/modificar:** `sentry.*.config.ts`, tests en `tests/unit/*`, `tests/e2e/*`, `package.json`, `docs/roadmap.md`, `plan-roadmap.md`.
- **Dependencias:** Requiere Fases 1-6 completas.
- **Entregable:** Suite de tests pasando, observabilidad afinada, checklist de seguridad completada.
- **MCPs de apoyo:** Sentry MCP para validar métricas, Playwright MCP para generar/ejecutar tests, GitHub MCP para revisar PRs finales.