# Fase 2 – Modelo de datos y dominio de cobranzas

## Resumen de entendimiento

- La plataforma COBRA continúa consolidándose como solución SaaS multi-tenant: mantiene aislamiento por `organizationId` y orquesta cobranzas sobre canales email/WhatsApp con apoyo de un agente IA.
- Fase 1 dejó operativos el esqueleto Next.js, Auth.js con Google OAuth, bootstrap multi-tenant, Prisma Client y configuración básica de Sentry (`docs/fase01.md`).
- La Fase 2 se enfoca en definir un modelo de cobranzas completo (Prisma + dominio puro), repositorios desacoplados y servicios de aplicación iniciales, sin ejecutar migraciones reales todavía.

## Objetivo de la fase

Consolidar el modelo de datos y la capa de dominio de cobranzas, agregando interfaces de repositorio y servicios de aplicación que permitan persistir y consultar entidades clave de forma multi-tenant, dejando lista la estructura para migraciones y lógica superior en fases posteriores.

## Alcance (In scope)

- Definición de entidades Prisma para cobranzas (`prisma/schema.prisma`): CustomerCompany, Contact, Invoice, Installment, Payment, CollectionCase, CommunicationAttempt, AgentConfig, AgentRun, AgentActionLog.
- Enumeraciones compartidas (InvoiceStatus, PaymentStatus, CollectionStage, etc.) alineadas con el dominio.
- Módulos de dominio en `src/lib/domain/**` con invariantes básicas y helpers (constructores, transiciones de estado, cálculos).
- Interfaces de repositorio en `src/lib/repositories/**` que expongan operaciones CRUD multi-tenant (con place-holders para la implementación Prisma).
- Servicios de aplicación en `src/lib/services/**` que consumen dominio + repositorios (clientes/contactos, facturas/pagos, casos de cobranza, configuración del agente, runs del agente).
- Documentación de la fase en `docs/fase02.md` y registro de actualizaciones pendientes en `docs/architecture.md` y `docs/roadmap.md`.

## Fuera de alcance (Out of scope)

- Ejecutar migraciones sobre entornos reales o Supabase.
- Implementaciones definitivas de repositorios Prisma (se dejarán como dependencias a inyectar).
- UI o server actions adicionales en `src/app`.
- Integraciones con Resend, WhatsApp o LLM/openAI.
- Automatizaciones del agente IA, schedulers o pipelines cron.
- Suites de testing exhaustivas (solo se contemplan helpers para tests unitarios futuros).

## Diseño técnico

### Modelo Prisma (`prisma/schema.prisma`)

- Todas las tablas incorporan `organizationId` y claves foráneas con `onDelete` seguro.
- Relaciones principales:
  - `CustomerCompany` 1–N `Contact`, 1–N `Invoice`, 1–N `CollectionCase`.
  - `Invoice` 1–N `Installment`, 1–N `Payment`, 1–1 `CollectionCase`.
  - `CollectionCase` 1–N `CommunicationAttempt`, 1–N `AgentRun`, 1–N `AgentActionLog`.
  - `AgentConfig` 1–1 `Organization`.
- Enumeraciones Prisma reflejan el workflow de cobranzas y del agente (`InvoiceStatus`, `CollectionStage`, `CommunicationStatus`, `AgentRunStatus`, `AgentActionType`, etc.).

### Dominio (`src/lib/domain/**`)

- Paquetes modulares: `customers`, `invoices`, `collections`, `communications`, `agent`.
- Cada módulo ofrece:
  - Tipos ricos (interfaces + string unions).
  - Constructores con sanitización (`createInvoice`, `createInstallment`, `createCommunicationAttempt`, etc.).
  - Funciones de negocio (e.g. `determineInvoiceStatus`, `transitionCollectionStage`, `transitionAgentRunStatus`).
  - Tipos derivados (`InvoiceCreateData`, `CommunicationAttemptCreateData`) para coordinar con repositorios.
- Utilidades comunes: `DomainError`, `assertDomain`, tipos base (`OrganizationId`, `CurrencyCode`, etc.).

### Repositorios (`src/lib/repositories/**`)

- Interfaces declarativas por agregado (CustomerCompanyRepository, InvoiceRepository, CollectionCaseRepository, AgentRunRepository…).
- Contratos orientados a multi-tenant (`RepositoryContext` con `organizationId` y `actorId` opcional).
- Helpers genéricos: paginación (`PaginationParams`, `PaginatedResult`), error estándar `RepositoryNotImplementedError`.
- `index.ts` centraliza las exportaciones para facilitar la inyección en servicios.

### Servicios de aplicación (`src/lib/services/**`)

- `createCustomersService`, `createInvoicesService`, `createCollectionCasesService`, `createAgentConfigService`, `createAgentService`.
- Orquestan validaciones del dominio y delegan persistencia a los repositorios.
- Preparan lógica básica para:
  - Creación/actualización de clientes y contactos.
  - Creación de facturas (con cuotas opcionales), registro de pagos, recalculo de estado.
  - Apertura y seguimiento de casos de cobranza.
  - Registro de comunicaciones salientes/entrantes.
  - Gestión del config del agente y logs de ejecuciones.
- Servicios devuelven objetos con métodos, facilitando inyección de dependencias en server actions o API routes futuras.

### Dependencias y extensibilidad

- Repositorios aún deben implementarse sobre Prisma una vez que se apliquen migraciones.
- Servicios están diseñados para recibir dependencias (ideal para tests unitarios con mocks).
- Se documentan enumeraciones y tipos reutilizables para mapping desde/ hacia Prisma y UI.

## Tareas detalladas

1. Diseñar esquema Prisma (entidades + enums multi-tenant). **✅** Completado.
2. Crear módulos de dominio con invariantes y tipos derivados. **✅** Completado.
3. Definir interfaces de repositorio y helpers genéricos. **✅** Completado.
4. Implementar repositorios Prisma reales para todas las entidades. **✅** Completado.
5. Implementar servicios de aplicación base (clientes, facturas, cobranzas, agente). **✅** Completado.
6. Ejecutar migraciones a la base de datos. **✅** Completado - migración aplicada exitosamente.
7. Documentar la fase y actualizar `docs/architecture.md` y `docs/roadmap.md`. **✅** Completado.

## Estado de implementación

- `prisma/schema.prisma`: ✅ actualizado con todas las entidades de cobranzas y enumeraciones.
- `src/lib/domain/**`: ✅ módulos creados con validaciones e invariantes.
- `src/lib/repositories/**`: ✅ implementaciones Prisma completas para todas las entidades.
- `src/lib/services/**`: ✅ servicios creados e integrados con repositorios Prisma.
- Migraciones a BD real: ✅ **completada** - migración `20251108195037_fase_2_modelado` aplicada exitosamente a Supabase PostgreSQL.

## Entregables de la fase

- ✅ Modelo Prisma actualizado y migraciones aplicadas a Supabase PostgreSQL.
- ✅ Capa de dominio con tipos, constructores y reglas básicas.
- ✅ Repositorios Prisma implementados para todas las entidades con filtrado multi-tenant.
- ✅ Servicios de aplicación para cobranzas integrados con repositorios.
- ✅ Documento `docs/fase02.md` con plan y estado completo.
- ✅ Actualización de `docs/architecture.md` con estado actual y modelo de datos detallado.
- ✅ Actualización de `docs/roadmap.md` marcando Fase 1 y Fase 2 como completadas.

## Actualizaciones recomendadas a la documentación

- `docs/architecture.md`
  - Añadir sección “Estado actual” resumiendo los logros de Fase 1.
  - Extender el apartado de “Modelo de datos” con las nuevas entidades y relaciones (incluyendo `AgentConfig`, `AgentRun`, `AgentActionLog`).
  - Documentar las enumeraciones clave y su propósito dentro del workflow de cobranzas.
- `docs/roadmap.md`
  - Marcar Fase 1 como completada y mover sus pendientes menores (validación de login local + evento Sentry) a una subsección de deudas.
  - Actualizar el bloque de Fase 2 para reflejar el diseño ya realizado y aclarar que las migraciones/repo implementations quedan para el siguiente paso.

Estas actualizaciones no se aplicaron todavía, esperando confirmación para editar los documentos oficiales.

## Guía para próximas acciones

- Implementar repositorios Prisma reales e iniciar `prisma migrate dev` una vez aprobada la estructura.
- Añadir tests unitarios para reglas de dominio críticas (estados de facturas, transiciones de casos).
- Integrar servicios con server actions/API routes durante Fase 3.
- Ejecutar validaciones manuales del flujo multi-tenant cuando la base esté disponible.

## Uso previsto de MCPs en la Fase 2

- **Supabase MCP:** inspección de esquema actual antes de correr migraciones en el futuro (solo lectura).
- **Context7 MCP:** consulta de patrones Prisma/DDD o referencias de modelado cuando sea necesario.
- **GitHub MCP:** revisión de historial de migraciones y PRs relacionados con cobranzas.
- **Sentry / Vercel MCP:** observación posterior para asegurar que nuevos módulos no introduzcan errores en runtime.
- **shadcn / Playwright MCP:** se reservarán para fases de UI y testing integral (Fases 3 y 7).

