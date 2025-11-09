# Arquitectura del sistema – Plataforma de cobranzas asistida por IA

> Este documento describe la arquitectura objetivo de la plataforma de cobranzas asistida por IA.  
> Debe leerse junto con `overview.md` para entender el contexto de negocio.

---

## 1. Resumen de alto nivel

La plataforma es una aplicación SaaS multi-empresa que:

1. Permite a una organización (empresa usuaria) registrar:
   - Empresas clientes (sus propios clientes).
   - Contactos dentro de cada empresa (personas, emails, teléfonos, WhatsApp).
   - Información de facturación y cobranzas (facturas, cuotas, saldos, estados).

2. Mantiene un **estado central de cobranzas** por cliente y factura.

3. Incluye un **agente de inteligencia artificial de cobranzas** que:
   - Se activa periódicamente o por eventos.
   - Analiza la situación de cada cliente/factura.
   - Envía y gestiona comunicaciones por correo y WhatsApp.
   - Interpreta las respuestas (promesas de pago, disputas, dudas).
   - Actualiza el estado interno de cobranzas y registra todo lo que hace.

4. Ofrece a la empresa:
   - Un panel para ver el estado de cobranza por cliente/factura.
   - Historial de comunicaciones e interacciones.
   - Configuración de reglas, plantillas de mensajes y preferencias.

---

## 2. Estado actual del proyecto

### 2.1. Fase 1 completada ✅

- **Esqueleto técnico**: Next.js (App Router) con TypeScript configurado.
- **Autenticación**: Auth.js con Google OAuth implementado y funcionando.
- **Multi-tenant**: Bootstrap de organizaciones y membresías operativo.
- **Base de datos**: Prisma Client inicializado y conectado a Supabase PostgreSQL.
- **Observabilidad**: Sentry configurado para errores y tracing básico.

### 2.2. Fase 2 completada ✅

- **Modelo de datos**: Esquema Prisma completo con todas las entidades de cobranzas:
  - `CustomerCompany`, `Contact`
  - `Invoice`, `Installment`, `Payment`
  - `CollectionCase`, `CommunicationAttempt`
  - `AgentConfig`, `AgentRun`, `AgentActionLog`
- **Dominio**: Módulos de dominio con invariantes y reglas de negocio implementados.
- **Repositorios**: Implementaciones Prisma completas para todas las entidades con filtrado multi-tenant.
- **Servicios**: Servicios de aplicación creados para orquestar dominio y repositorios.
- **Migraciones**: Esquema aplicado a la base de datos Supabase.

### 2.3. Próximos pasos (Fase 3)

- Implementar CRUDs principales con UI (shadcn/ui).
- Integrar servicios con server actions/API routes.
- Construir dashboard y vistas de gestión.

---

## 3. Objetivos arquitectónicos

### 2.1. Objetivos funcionales

- Soportar **multi-empresa (multi-tenant)** con aislamiento de datos.
- Gestionar:
  - Organizaciones (empresas usuarias).
  - Empresas clientes y sus contactos.
  - Facturas, cuotas y estados de pago.
  - Reglas y plantillas de comunicación.
  - Flujos de cobranza automáticos.
- Integrar un **agente de IA** que opere sobre esos datos y canales de comunicación:
  - Email (Resend u otro proveedor SMTP/API).
  - WhatsApp (proveedor a definir: Twilio, WhatsApp Cloud API, etc.).
- Mantener un historial exhaustivo de:
  - Envíos de mensajes.
  - Respuestas de clientes.
  - Decisiones del agente.

### 2.2. Objetivos no funcionales

- **Escalabilidad**: la arquitectura debe soportar múltiples organizaciones y un volumen creciente de facturas y comunicaciones.
- **Observabilidad**: trazabilidad de cada acción del agente y del usuario (logs, métricas, errores).
- **Extensibilidad**:
  - Agregar nuevos canales (SMS, chat embebido, etc.).
  - Integrar CRMs/ERPs externos.
  - Evolucionar las reglas del agente y los modelos de IA.
- **Seguridad y privacidad**:
  - Aislamiento de datos entre organizaciones.
  - Protección de datos sensibles (correos, teléfonos, estados de deuda).
  - Control de acceso por roles.

---

## 4. Stack tecnológico

### 3.1. Frontend + Backend (fullstack web)

- **Next.js (App Router)** con **TypeScript**.
- **React Compiler** activado para optimización automática de re-renderizados.
- Estructura con `src/`:
  - `src/app` – rutas, layouts, API routes.
  - `src/components` – componentes de UI reutilizables.
  - `src/lib` – lógica compartida (servicios, utilidades, integraciones).
  - `src/emails` – plantillas de email en React.

### 3.2. UI

- **Tailwind CSS** como sistema de estilos.
- **shadcn/ui** para componentes accesibles, consistentes y reutilizables.
- Diseño orientado a un dashboard de cobranzas (tablas, filtros, timelines).

### 3.3. Datos y backend

- **PostgreSQL** como base de datos principal.
- **Prisma ORM** para acceso tipado a la base de datos y migraciones.
- **Auth.js** (NextAuth) para autenticación:
  - Proveedores OAuth (Google, etc.).
  - Sesiones y control de acceso.
  - Configuración de dominio base fijo mediante `AUTH_URL` para callbacks OAuth (siempre usa `app.hqhelios.com` en producción).
  - **Split de dominios**: La plataforma usa dos dominios principales:
    - `www.hqhelios.com` / `hqhelios.com`: Landing page de marketing
    - `app.hqhelios.com`: Aplicación de producto (auth, dashboard, etc.)
  - El middleware de Next.js (`middleware.ts`) enruta automáticamente según el hostname.

### 3.4. Integraciones externas

- **Resend** para envío de correos transaccionales y de cobranza.
- Proveedor de **WhatsApp API** (a definir, p.ej. Twilio/Meta):
  - Abstraído detrás de una interfaz `WhatsAppProvider`.
- **Proveedor LLM** (OpenAI / Anthropic / etc.):
  - Abstraído detrás de una interfaz `LLMProvider` para el agente de IA.
- **Vercel** como plataforma de despliegue:
  - Deploy de la app Next.js.
  - Cron jobs (cuando sea necesario) para tareas programadas.
- **Supabase / Neon / servicio Postgres gestionado** como hosting de la BD.
- **Sentry** para monitoreo de errores y performance.
- **Futuras integraciones** (no acopladas aún):
  - APIs de facturación / ERP (ej. Xero, QuickBooks, Facturadores locales).

---

## 5. Arquitectura lógica por capas

La aplicación se organiza en 4 capas principales:

1. **Capa de Presentación (UI)**
2. **Capa de Aplicación (Servicios / Casos de uso / Orquestadores)**
3. **Capa de Dominio (Modelos y reglas de negocio)**
4. **Capa de Infraestructura (BD, APIs externas, colas, almacenamiento)**

### 4.1. Capa de Presentación (UI)

Responsabilidad:

- Mostrar la información a los usuarios empresa.
- Recoger inputs (formularios, filtros, acciones).
- Navegación (dashboard, listas, detalles).

Implementación:

- Páginas y layouts en `src/app/(app)/...`.
- Componentes en `src/components/...`.
- Uso de Tailwind + shadcn/ui.
- Server Components cuando sea posible (para consultas directas a servicios) y Client Components cuando haya interacción rica.

La UI **no debería contener lógica de negocio compleja**: en vez de eso, llama a servicios/casos de uso definidos en la capa de aplicación.

### 4.2. Capa de Aplicación

Responsabilidad:

- Implementar los **casos de uso** del sistema:
  - Registrar organización y usuarios.
  - Crear/editar empresas clientes.
  - Crear/actualizar facturas y cuotas.
  - Lanzar un workflow de cobranza manual.
  - Generar un resumen de estado para el dashboard.
- Coordinar entre capa de dominio y capa de infraestructura:
  - Llamar a repositorios (Prisma) para persistencia.
  - Invocar a proveedores externos (Resend, WhatsApp, LLM).
  - Disparar tareas asíncronas (jobs, colas, cron).

Implementación:

- Ficheros en `src/lib/services/` (o `src/modules/<modulo>/application/` si se opta por modularizar).
- Funciones del estilo:
  - `createCustomerCompany(...)`
  - `createInvoice(...)`
  - `triggerAgentRunForOrganization(...)`
  - `generateDashboardSummary(...)`

La capa de aplicación debe **orquestar** pero no decidir reglas de negocio finas (eso va en el dominio).

### 4.3. Capa de Dominio

Responsabilidad:

- Definir las **entidades y reglas de negocio**:
  - Qué es una factura, cuándo está en mora, cuándo se considera cobro exitoso.
  - Cómo se agrupan las comunicaciones en un caso de cobranza.
  - Cuándo el agente debe escalar o pausar una secuencia.

Implementación:

- Modelos y lógica puros (sin dependencias a frameworks) en `src/lib/domain/` (o similar).
- Aquí se definen, por ejemplo:
  - `Invoice`, `CustomerCompany`, `Contact`, `CollectionCase`, `CommunicationAttempt`, `AgentDecision`, etc.
  - Servicios de dominio para cálculos:
    - Determinar estado de cobranza.
    - Determinar siguiente paso en un workflow de cobranza simple (recordatorio 1 → recordatorio 2 → escalar).

La capa de dominio debería poder probarse de forma aislada (tests unitarios).

### 4.4. Capa de Infraestructura

Responsabilidad:

- Esconder la complejidad de:
  - Base de datos (Prisma/Postgres).
  - Proveedores de email (Resend).
  - Proveedores de WhatsApp.
  - Proveedor de LLM para IA.
  - Jobs y cron (Vercel Cron, colas, etc.).

Implementación:

- `src/lib/db.ts` – inicialización de Prisma.
- `src/lib/repositories/` – repositorios por agregado:
  - `OrganizationRepository`
  - `CustomerCompanyRepository`
  - `InvoiceRepository`
  - `CollectionCaseRepository`
  - etc.
- `src/lib/integrations/`:
  - `resendEmailProvider.ts`
  - `whatsappProvider.ts`
  - `llmProvider.ts`
- Configuración de cron jobs (p.ej. en Vercel Scheduler o funciones dedicadas).

---

## 6. Modelo de datos

### 6.1. Entidades principales

El modelo de datos está completamente definido en `prisma/schema.prisma` y aplicado a la base de datos. Todas las entidades incluyen `organizationId` para garantizar aislamiento multi-tenant.

#### Organizaciones y usuarios
- **Organization**: Empresas usuarias de la plataforma.
  - Campos: nombre, `normalizedName` (nombre normalizado para unicidad), slug, `countryCode` (opcional), `defaultCurrency` (por defecto "USD").
  - **Invariante de unicidad**: Un usuario no puede tener dos organizaciones con el mismo `normalizedName` (normalización: trim, minúsculas, remover acentos, colapsar espacios).
  - Relación con `User` a través de `Membership`.
- **User**: Usuarios del sistema (autenticados vía Auth.js).
  - Campo `activeOrganizationId`: referencia a la organización activa del usuario.
  - Un usuario puede tener múltiples organizaciones pero solo una activa a la vez.
- **Membership**: Relación User ↔ Organization con roles (OWNER, ADMIN, MEMBER, VIEWER).
- **OrganizationCreationIdempotency**: Tabla para garantizar idempotencia en la creación de organizaciones.
  - Evita duplicados por reintentos/transmisiones duplicadas del mismo intento de creación.
  - Clave única: `idempotencyKey` derivada de sesión e intento de creación.

#### Clientes y contactos
- **CustomerCompany**: Empresas clientes de la organización usuaria.
  - Estados: `ACTIVE`, `INACTIVE`, `ARCHIVED`.
  - Campos: nombre, razón social, taxId, industria, website, notas.
- **Contact**: Personas de contacto dentro de cada empresa cliente.
  - Canales: email, phoneNumber, whatsappNumber.
  - Soporta contacto primario (`isPrimary`).
  - **Campos extendidos (Phase 2)**:
    - `language`: Idioma preferido para comunicaciones.
    - `timezone`: Zona horaria del contacto.
    - `workingHoursWindow`: Ventana horaria preferida (JSON: {start, end, days}).
    - `hasOptedOut`: Indicador de opt-out para no contactar (default: false).
    - `consentDate`: Fecha de consentimiento para comunicaciones.

#### Facturación y pagos
- **Invoice**: Facturas emitidas a empresas clientes.
  - Estados: `DRAFT`, `PENDING`, `PARTIALLY_PAID`, `PAID`, `OVERDUE`, `CANCELLED`.
  - Campos: número, descripción, fechas (emisión/vencimiento), monto, moneda, notas, metadata.
  - **Campos extendidos (Phase 2)**:
    - `expectedPaymentDate`: Fecha esperada de pago (nullable).
    - `dateOrigin`: Origen de la fecha esperada (`DateOrigin` enum: `LOADED`, `REQUESTED_BY_AGENT`, `CONFIRMED_BY_CLIENT`).
    - `paymentPromiseDate`: Fecha de promesa de pago del cliente.
    - `nextActionAt`: Próxima acción programada para esta factura.
    - `lastChannel`: Último canal de comunicación usado (`CommunicationChannel`).
    - `lastResult`: Resultado de la última comunicación (texto libre).
- **InvoiceDateHistory**: Historial de cambios de fechas esperadas de pago (auditoría).
  - Campos: invoiceId, previousDate, newDate, reason, changedBy, createdAt.
  - Permite rastrear todos los cambios de `expectedPaymentDate` con su origen y razón.
- **Installment**: Cuotas de pago asociadas a una factura.
  - Estados: `PENDING`, `PAID`, `OVERDUE`, `CANCELLED`.
  - Campos: secuencia, fecha de vencimiento, monto, monto pagado, fecha de pago.
- **Payment**: Registros de pagos recibidos.
  - Estados: `PENDING`, `COMPLETED`, `FAILED`, `CANCELLED`, `REFUNDED`.
  - Campos: monto, moneda, método, referencia, fecha de pago, notas.

#### Cobranzas
- **CollectionCase**: Caso de cobranza asociado a una factura (relación 1:1).
  - Etapas (`stage`): `INITIAL`, `REMINDER_1`, `REMINDER_2`, `ESCALATED`, `PROMISE_TO_PAY`, `RESOLVED`, `MANUAL_REVIEW`.
  - Estados (`status`): `ACTIVE`, `PAUSED`, `CLOSED`.
  - Niveles de riesgo (`riskLevel`): `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.
  - Campos: contacto primario, fechas de comunicación/acción/escalación/cierre, resumen, metadata.
- **CommunicationAttempt**: Registro de cada intento de comunicación (saliente o entrante).
  - Canales (`channel`): `EMAIL`, `WHATSAPP`, `SMS`, `PHONE`, `OTHER`.
  - Direcciones (`direction`): `OUTBOUND`, `INBOUND`.
  - Estados (`status`): `DRAFT`, `PENDING`, `SENT`, `DELIVERED`, `FAILED`, `ACKNOWLEDGED`.
  - Campos: asunto, cuerpo, payload, externalId, timestamps (enviado/entregado/leído), errores.

#### Agente de IA
- **AgentConfig**: Configuración del agente por organización (relación 1:1).
  - Campos: timezone por defecto, email/teléfono de escalación, canal de escalación, modelo LLM, horarios de trabajo.
- **AgentRun**: Ejecución del agente sobre un caso de cobranza.
  - Estados: `PENDING`, `RUNNING`, `COMPLETED`, `FAILED`, `CANCELLED`.
  - Campos: fechas de inicio/fin, error, metadata.
- **AgentActionLog**: Log de cada acción ejecutada por el agente durante un run.
  - Tipos (`type`): `SEND_MESSAGE`, `SCHEDULE_FOLLOW_UP`, `UPDATE_STATUS`, `ESCALATE`, `CLOSE_CASE`, `CLASSIFY_RESPONSE`, `LOG_NOTE`.
  - Estados (`status`): `PENDING`, `IN_PROGRESS`, `SUCCEEDED`, `FAILED`.
  - Campos: resumen, payload, error.

#### Configuración y gestión del agente (Phase 2)
- **MessageTemplate**: Plantillas de mensajes para el agente de cobranza.
  - Campos: organizationId, key (único por org), name, description, channel (`CommunicationChannel`), subject, body, variables (JSON), isActive.
  - Permite definir plantillas reutilizables para email y WhatsApp con variables dinámicas.
- **Playbook**: Secuencias de cobranza predefinidas (playbooks).
  - Campos: organizationId, key (único por org), name, description, config (JSON con stages, delays, templates), isActive.
  - Define flujos completos de cobranza con múltiples etapas y reglas de timing.
- **Segment**: Segmentación de facturas por reglas personalizadas.
  - Campos: organizationId, name, description, rulesJson (JSON con condiciones), isActive.
  - Permite crear segmentos dinámicos de facturas basados en criterios (ej: ">30 días mora y saldo>$1000").

#### Sistema y auditoría (Phase 2)
- **FeatureFlag**: Feature flags por organización.
  - Campos: organizationId, flagKey (único por org), enabled, metadata (JSON).
  - Permite habilitar/deshabilitar features por organización sin deploy.
- **AuditLog**: Log de auditoría de cambios críticos.
  - Campos: organizationId, entityType, entityId, action, changes (JSON), actor, actorId, ipAddress, userAgent, createdAt.
  - Índices en entityType, entityId, createdAt para búsquedas rápidas.
  - Rastrea cambios en entidades importantes con contexto completo.
- **SavedView**: Vistas guardadas para el módulo de Seguimiento.
  - Campos: organizationId, userId (opcional), name, description, viewType, filters (JSON), isShared.
  - Permite guardar filtros y vistas personalizadas para el seguimiento de cobranzas.

### 6.2. Relaciones principales

- `Organization` 1–N `CustomerCompany`
- `CustomerCompany` 1–N `Contact`
- `CustomerCompany` 1–N `Invoice`
- `Invoice` 1–N `Installment`
- `Invoice` 1–N `Payment`
- `Invoice` 1–1 `CollectionCase`
- `Invoice` 1–N `InvoiceDateHistory` (auditoría de fechas)
- `CollectionCase` 1–N `CommunicationAttempt`
- `CollectionCase` 1–N `AgentRun`
- `CollectionCase` 1–N `AgentActionLog`
- `Contact` 1–N `CollectionCase` (como contacto primario)
- `Organization` 1–1 `AgentConfig`
- `Organization` 1–N `Segment`
- `Organization` 1–N `FeatureFlag`
- `Organization` 1–N `AuditLog`
- `Organization` 1–N `MessageTemplate`
- `Organization` 1–N `Playbook`
- `Organization` 1–N `SavedView`

### 6.3. Enumeraciones clave

Las enumeraciones reflejan el workflow de cobranzas y del agente:

- **InvoiceStatus**: Estados de facturación (`DRAFT`, `PENDING`, `PARTIALLY_PAID`, `PAID`, `OVERDUE`, `CANCELLED`).
- **DateOrigin** (Phase 2): Origen de la fecha esperada de pago (`LOADED`, `REQUESTED_BY_AGENT`, `CONFIRMED_BY_CLIENT`).
- **CollectionStage**: Etapas del proceso de cobranza (`INITIAL`, `REMINDER_1`, `REMINDER_2`, `ESCALATED`, `PROMISE_TO_PAY`, `RESOLVED`, `MANUAL_REVIEW`).
- **CollectionCaseStatus**: Estado operativo del caso (`ACTIVE`, `PAUSED`, `CLOSED`).
- **CollectionRiskLevel**: Nivel de riesgo (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
- **CommunicationChannel**: Canales de comunicación (`EMAIL`, `WHATSAPP`, `SMS`, `PHONE`, `OTHER`).
- **CommunicationStatus**: Estados de comunicación (`DRAFT`, `PENDING`, `SENT`, `DELIVERED`, `FAILED`, `ACKNOWLEDGED`).
- **AgentRunStatus**: Estados de ejecución del agente (`PENDING`, `RUNNING`, `COMPLETED`, `FAILED`, `CANCELLED`).
- **AgentActionType**: Tipos de acciones del agente (`SEND_MESSAGE`, `SCHEDULE_FOLLOW_UP`, `UPDATE_STATUS`, `ESCALATE`, `CLOSE_CASE`, `CLASSIFY_RESPONSE`, `LOG_NOTE`).

---

## 7. Módulos funcionales principales

### 7.1. Autenticación y multi-tenant

Objetivo:

- Cada organización (empresa usuaria) tiene su propio espacio de datos.
- Un usuario puede pertenecer a una o varias organizaciones (según diseño).
- Control de acceso por roles (admin, cobranzas, lectura).
- El usuario tiene una **organización activa** que determina qué datos ve y gestiona.

Entidades clave:

- `Organization` (con campos `countryCode`, `defaultCurrency`)
- `User` (con campo `activeOrganizationId` para rastrear la organización activa)
- `Membership` (User ↔ Organization)
- `Role` o enumeración de roles.

Mecánica:

- Auth.js maneja la autenticación (ej. Google OAuth).
- **Configuración de dominio base**: NextAuth está configurado para usar `AUTH_URL` como dominio base fijo para todos los callbacks OAuth. Esto asegura que siempre use `hqhelios.com` en producción, independientemente del dominio desde el cual se acceda (por ejemplo, desde dominios de Vercel como `cobra-mu-khaki.vercel.app`). Esta configuración evita errores de `redirect_uri_mismatch` en Google Cloud Console.
- **Flujo post-login**:
  - Si el usuario no tiene organizaciones, se redirige a `/onboarding/organization` para crear su primera organización.
  - Si el usuario tiene organizaciones pero ninguna activa, también se redirige al onboarding.
  - La organización creada se establece automáticamente como activa (`activeOrganizationId` en `User`).
- **Creación de organización**:
  - **Idempotencia**: Cada intento de creación incluye una clave de idempotencia única. Reintentos con la misma clave retornan la organización existente sin crear duplicados.
  - **Unicidad de nombre**: Se valida que no exista otra organización del mismo usuario con el mismo `normalizedName`. Si existe, se retorna la organización existente y se establece como activa.
  - **Prevención de múltiples envíos**: El formulario de onboarding deshabilita el botón y previene clics múltiples durante el procesamiento.
  - **Navegación automática**: Tras creación exitosa (o detección de duplicado), se navega automáticamente al dashboard sin intervención del usuario.
- **Organización activa**:
  - El usuario puede cambiar su organización activa mediante un selector en el header.
  - La sesión de NextAuth incluye la información de la organización activa.
  - Todas las consultas a la BD se filtran por `organizationId` de la organización activa.
  - El layout de la app (`(app)/layout.tsx`) verifica que haya organización activa y redirige al onboarding si no existe.

### 7.2. Gestión de empresas clientes y contactos

Objetivo:

- Representar los clientes de la empresa usuaria y las personas de contacto clave.

Entidades:

- `CustomerCompany` (empresa cliente).
- `Contact` (persona, con múltiples canales):
  - `email`
  - `phone`
  - `whatsappNumber`
  - otros.

Relaciones:

- `Organization` 1–N `CustomerCompany`.
- `CustomerCompany` 1–N `Contact`.

UI:

- Listados de empresas clientes.
- Fichas de cliente con contactos y estado de cobranza.

### 7.3. Facturas, cuotas y estado de cobranza

Objetivo:

- Capturar la realidad contable de lo que se le debe a la empresa.

Entidades:

- `Invoice`
  - `id`
  - `organizationId`
  - `customerCompanyId`
  - `issueDate`
  - `dueDate`
  - `amount`
  - `currency`
  - `status` (ej. `PENDING`, `PAID`, `OVERDUE`, `CANCELLED`)
- `InvoiceItem` (opcional, para detalle).
- `PaymentPlan` (si hay múltiples cuotas).
- `Installment` (cuota específica).
- `Payment` (registro de pago real cuando ocurra).

Estado de cobranza:

- Se puede modelar como entidad aparte:
  - `CollectionCase`
    - `invoiceId`
    - `currentStage` (ej. `INITIAL`, `REMINDER_1`, `REMINDER_2`, `ESCALATED`, `RESOLVED`)
    - `lastContactedAt`
    - `nextActionAt`
    - `agentStatus` (ej. `ACTIVE`, `PAUSED`, `STOPPED`).

### 7.4. Motor de cobranzas y agente de IA

Este es el núcleo del producto.

Objetivo:

- Dado el estado de facturas y reglas de cobranza, decidir **qué hacer** (enviar recordatorio, esperar, escalar, cerrar caso) y **cómo comunicarlo** (texto del mensaje).

Componentes:

1. **Scheduler / disparador**
   - Tareas periódicas (CRON o jobs) que:
     - Buscan `CollectionCase` con `nextActionAt <= now`.
     - Agrupan casos por organización.
     - Llaman al **orquestador del agente**.

2. **Orquestador de agente**
   - Capa de aplicación que:
     - Lee el estado de un caso (factura, cliente, historial de comunicaciones).
     - Llama a la capa de dominio para decidir la acción base (ej. “mandar recordatorio suave”).
     - Llama al **LLM** para generar el contenido del mensaje (texto del mail / WhatsApp), usando plantillas y contexto.
     - Llama al proveedor de canal (Resend, WhatsApp…) para enviar.
     - Registra un `CommunicationAttempt` y un `AgentActionLog`.

3. **Interpretación de respuestas**
   - Webhooks de email/WhatsApp reciben mensajes entrantes.
   - Se genera un `InboundMessage` vinculado a un `CollectionCase` y `Contact`.
   - El agente (vía LLM) clasifica la respuesta:
     - Promesa de pago.
     - Disputa (no reconoce la deuda).
     - Solicitud de más información.
     - Fallo técnico (rebote, número errado, etc.).
   - La capa de dominio actualiza el estado del `CollectionCase` y decide:
     - Enviar una respuesta automática.
     - Marcar para revisión manual.
     - Cerrar el caso.

Entidades adicionales:

- `CommunicationChannel` (`EMAIL`, `WHATSAPP`, etc.).
- `MessageTemplate` (estructuras base de mensajes).
- `CommunicationAttempt`:
  - `channel`
  - `direction` (`OUTBOUND` / `INBOUND`)
  - `status` (`SENT`, `DELIVERED`, `FAILED`, etc.)
  - `payload` (texto, metadata).
- `AgentRun` o `AgentActionLog`:
  - Qué decidió el agente, cuándo y por qué (inputs/resumen).

---

## 8. Integraciones externas (detalle)

### 8.1. Email (Resend)

- La aplicación usa un proveedor tipo Resend para enviar correos:
  - Notificaciones de cobranza.
  - Confirmaciones de pago (a futuro).
- Plantillas de email:
  - Implementadas como componentes React en `src/emails/`.
  - Reutilizables por el agente (insertando texto generado por el LLM donde corresponda).

### 6.2. WhatsApp

- Integración con API de WhatsApp Business (proveedor a definir).
- Capa de infraestructura:
  - `WhatsAppProvider.sendMessage(contact, message)`
  - `WhatsAppProvider.parseWebhook(...)` para mensajes entrantes.

### 6.3. LLM Provider

- Capa de infraestructura:
  - `LLMProvider.generateMessage(contexto)` – genera textos de cobranza adaptados al cliente.
  - `LLMProvider.classifyResponse(texto)` – determina tipo de respuesta (promesa de pago, disputa, etc.).
- Debe soportar distintos proveedores detrás de una interfaz (OpenAI, Anthropic, etc.).

### 6.4. Observabilidad (Sentry)

- Integración a nivel de:
  - Frontend (errores en UI).
  - Backend (errores en API routes, jobs del agente).
- Relacionar errores con:
  - `organizationId`
  - `invoiceId` / `collectionCaseId` cuando sea posible.

---

## 9. Infraestructura y despliegue

### 7.1. Entornos

- **Local**:
  - Servidor Next (`npm run dev`).
  - BD local (por ejemplo Postgres en Docker) o instancia de desarrollo en Supabase.
  - Resend y WhatsApp en modo sandbox si es posible.

- **Preview**:
  - Deploy automático desde ramas/PRs en Vercel.
  - BD de staging (separada de producción).

- **Producción**:
  - Deploy desde rama `main`.
  - BD de producción gestionada.
  - Claves de Resend/WhatsApp/LLM/Sentry específicas de prod.

### 7.2. Vercel

- App Next.js desplegada en Vercel.
- Uso de:
  - Edge Functions / Serverless Functions para API routes del agente.
  - Cron Jobs (Vercel Scheduler) para ejecutar el **scheduler del agente** (ej. cada N minutos para revisar casos pendientes).

### 7.3. Base de datos

- Postgres gestionado (Supabase, Neon, etc.).
- Prisma se encarga de:
  - Definir el esquema (`schema.prisma`).
  - Crear migraciones.
  - Proveer clientes tipados.

Clave: **todas las tablas relevantes incluyen `organizationId`** para soportar multi-tenant.

---

## 8. Seguridad, privacidad y compliance (alto nivel)

- **Autenticación**:
  - Auth.js con OAuth (Google, etc.).
  - Sesiones seguras (cookies HTTPOnly).

- **Autorización**:
  - Roles por usuario dentro de una organización.
  - Checks de `organizationId` en todos los servicios y queries.

- **Protección de datos**:
  - No almacenar secretos ni tokens de terceros en texto plano dentro del código.
  - Uso de variables de entorno para claves de:
    - DB
    - Resend
    - WhatsApp
    - LLM
    - Sentry
  - Logs de IA y comunicaciones sin exponer datos sensibles innecesarios.

- **Auditoría**:
  - Registro de acciones clave:
    - Creación/edición de clientes y facturas.
    - Acciones del agente (enviar, escalar, cerrar).
    - Intervenciones manuales de usuarios.

---

## 9. Estrategia de pruebas

- **Tests unitarios**:
  - Capa de dominio (reglas de negocio de estados de cobranza).
  - Servicios de aplicación simples.

- **Tests de integración**:
  - Repositorios (Prisma + Postgres en entorno de test).
  - Flujos completos: crear factura → crear caso de cobranza → lanzar agente.

- **Tests end-to-end (E2E)**:
  - Con **Playwright**:
    - Login.
    - Alta de empresa cliente.
    - Alta de factura.
    - Visualización en dashboard.

- **Tests “simulados” del agente**:
  - Mock de LLM Provider.
  - Mock de proveedores de email/WhatsApp.
  - Validar que el orquestador del agente tome las decisiones esperadas.

---

## 10. Guía para desarrollo asistido por IA (Cursor)

Cada vez que se use Cursor sobre este proyecto, se deberían respetar estas pautas:

1. **Mantener la separación de capas**:
   - UI → en `src/app` + `src/components`.
   - Servicios / Casos de uso → `src/lib/services`.
   - Dominio (reglas, modelos puros) → `src/lib/domain`.
   - Infraestructura (Prisma, Resend, WhatsApp, LLM, etc.) → `src/lib/db`, `src/lib/integrations`, `src/lib/repositories`.

2. **Multi-tenant siempre**:
   - Toda query a BD debe filtrar por `organizationId` cuando aplique.
   - Cuando se agregue una nueva tabla, incluir `organizationId` si está ligada a datos de una organización.

3. **Integraciones externas via interfaces**:
   - Email → `EmailProvider` (implementación por Resend).
   - WhatsApp → `WhatsAppProvider`.
   - LLM → `LLMProvider`.
   - No llamar directamente al SDK de terceros desde componentes de dominio.

4. **Uso de TypeScript estricto**:
   - Evitar `any`.
   - Usar tipos derivados de Prisma cuando sea posible.
   - Validar inputs de API con Zod u otra lib.

5. **No hardcodear secretos**:
   - Siempre usar variables de entorno documentadas en `env-vars.md` y `.env.example`.

6. **Documentar decisiones importantes**:
   - Cuando se cambie el modelo de datos, actualizar este `architecture.md` y `env-vars.md` si aplica.
   - Cuando se agregue un canal nuevo (ej. SMS), documentar el flujo en este archivo.

---

Este `architecture.md` sirve como **contrato** de cómo debe evolucionar el sistema: si una nueva feature no encaja aquí, se debe actualizar primero este documento para reflejar la nueva realidad arquitectónica.
