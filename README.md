# Plataforma de cobranzas asistida por IA

> Plataforma SaaS para automatizar cobranzas (emails, WhatsApp, etc.) usando un agente de IA sobre la información de clientes, contactos y facturas.

---

## Tabla de contenido

1. [Visión y propósito](#visión-y-propósito)
2. [Características principales](#características-principales)
3. [Stack tecnológico](#stack-tecnológico)
4. [Arquitectura de alto nivel](#arquitectura-de-alto-nivel)
5. [Estructura del proyecto](#estructura-del-proyecto)
6. [Variables de entorno](#variables-de-entorno)
7. [Primeros pasos (local)](#primeros-pasos-local)
8. [Despliegue en Vercel](#despliegue-en-vercel)
9. [MCPs y desarrollo asistido por IA](#mcps-y-desarrollo-asistido-por-ia)
10. [Testing y calidad](#testing-y-calidad)
11. [Observabilidad (Sentry)](#observabilidad-sentry)
12. [Roadmap](#roadmap)

---

## Visión y propósito

COBRA es una **plataforma de cobranzas asistida por IA**.  
Permite que una empresa:

- Cargue sus **empresas clientes**, **contactos** y **facturas/cuotas**.
- Configure reglas de cobranza (frecuencia, tono, canales).
- Deje en manos de un **agente de IA** el trabajo operativo de:
  - revisar facturas pendientes,
  - enviar recordatorios,
  - interpretar respuestas por email/WhatsApp,
  - actualizar estados de cobranzas,
  - escalar casos complejos a humanos cuando haga falta.

El objetivo es que el equipo de cobranzas se enfoque en decisiones y excepciones, no en perseguir manualmente a cada cliente.

Más detalle funcional en: `docs/overview.md`  
Más detalle técnico en: `docs/architecture.md`.

---

## Características principales

### Para la empresa usuaria

- **Multi-empresa (multi-tenant)**:
  - Cada organización tiene su propio espacio de clientes, contactos y facturas.
- Gestión de:
  - **Empresas cliente**
  - **Contactos** (personas dentro de cada empresa: emails, móviles, WhatsApp)
  - **Facturas y cuotas** (monto, vencimiento, estado)
- Panel de **estado de cobranzas**:
  - Facturas próximas a vencer, vencidas o en mora.
  - Historial de comunicaciones por cliente/factura.
  - Promesas de pago, disputas, casos abiertos.

### Para el agente de cobranzas (IA)

- Lectura de estado de facturas y reglas de la empresa.
- Generación de mensajes personalizados de cobranza (email, WhatsApp).
- Interpretación de respuestas:
  - promesa de pago,
  - disputa,
  - solicitud de comprobante,
  - silencio.
- Registro estructurado de todas las interacciones:
  - quién contactó a quién,
  - cuándo,
  - a través de qué canal,
  - con qué resultado.

---

## Stack tecnológico

### Frontend / Backend

- **Next.js** (App Router, 2025)
- **TypeScript**
- **React Compiler** activado
- **Tailwind CSS** para estilos
- **shadcn/ui** para componentes de interfaz

### Autenticación

- **Auth.js (NextAuth)** con OAuth:
  - Google como primer proveedor (`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`)
  - Extensible a otros proveedores en el futuro.

### Datos y persistencia

- **PostgreSQL** gestionado con **Supabase**
- **Prisma ORM**
- Diseño **multi-tenant** (la mayoría de entidades atadas a `organizationId`)

### Integraciones

- **Resend** para envío de emails transaccionales y de cobranza.
- **WhatsApp Cloud API (Meta)** para mensajería saliente y recepción de respuestas (via webhooks).
- **OpenAI** como LLM principal:
  - `LLM_PROVIDER=openai`
  - `OPENAI_MODEL=gpt-4.1-mini` (por defecto)

### Observabilidad y calidad

- **Sentry** para errores, logs y tracing.
- **Playwright** para pruebas E2E.
- Logging estructurado (alineado con Sentry).

---

## Arquitectura de alto nivel

Resumen (ver `docs/architecture.md` para versión completa):

- **Capa de presentación (UI)**  
  - `src/app` (App Router, layouts, server/client components)
  - `src/components` (UI reutilizable, shadcn/ui, formularios, tablas, etc.)

- **Capa de aplicación (servicios / casos de uso)**  
  - `src/lib/services`
  - Orquesta:
    - validación de inputs,
    - lógica de dominio,
    - acceso a datos (repositorios),
    - integraciones externas (emails, WhatsApp, LLM).

- **Capa de dominio**  
  - `src/lib/domain`
  - Modelos y lógica de negocio (estados de factura, flujos de cobranza, criterios de escalamiento).
  - Sin dependencias de framework ni SDKs externos.

- **Capa de infraestructura**  
  - `src/lib/db.ts` (Prisma Client)
  - `src/lib/repositories` (repositorios por agregado)
  - `src/lib/integrations` (Resend, WhatsApp, LLM, Sentry, etc.)

- **Agente de cobranzas (IA)**  
  - Lógica central en servicios de dominio/aplicación.
  - Usa el provider LLM (OpenAI) para generar mensajes y entender respuestas.
  - Expone operaciones que pueden ser invocadas:
    - manualmente (usuario dispara un flujo)
    - o programadas (cron/background jobs en el futuro).

---

## Estructura del proyecto

Estructura objetivo (puede evolucionar, pero es la referencia):

```txt
.
├─ src/
│  ├─ app/
│  │  ├─ (marketing)/...
│  │  ├─ (app)/...
│  │  ├─ api/
│  │  │  └─ ... (rutas API, webhooks, etc.)
│  │  └─ layout.tsx, page.tsx, etc.
│  ├─ components/
│  │  └─ ui/, forms/, tables/, etc.
│  ├─ lib/
│  │  ├─ domain/
│  │  ├─ services/
│  │  ├─ repositories/
│  │  ├─ integrations/
│  │  └─ db.ts
│  └─ emails/
│     └─ plantillas de correo (React)
├─ prisma/
│  ├─ schema.prisma
│  └─ migrations/
├─ docs/
│  ├─ overview.md
│  ├─ architecture.md
│  ├─ env-vars.md
│  ├─ mcps.md
│  └─ roadmap.md
├─ .cursorrules
├─ package.json
├─ tsconfig.json
├─ next.config.mjs
└─ README.md
```

Las reglas de trabajo para Cursor (Arquitectura, estilos, MCPs, Sentry, etc.) están en **`.cursorrules`** y se consideran parte de la especificación del proyecto.

---

## Variables de entorno

Las variables de entorno están **documentadas en detalle** en:

- `docs/env-vars.md`

y reflejadas en la plantilla:

- `.env.example`

Resumen de grupos de variables:

- App / entorno:
  - `NEXT_PUBLIC_APP_URL`
  - `AUTH_URL`
- Auth (Auth.js + Google):
  - `AUTH_SECRET`
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
- Base de datos (Supabase + Prisma):
  - `DATABASE_URL`
  - `DIRECT_URL`
- Email (Resend):
  - `RESEND_API_KEY`
  - `RESEND_DEFAULT_FROM`
- WhatsApp Cloud API:
  - `WHATSAPP_API_BASE_URL`
  - `WHATSAPP_ACCESS_TOKEN`
  - `WHATSAPP_PHONE_NUMBER_ID`
  - `WHATSAPP_BUSINESS_ACCOUNT_ID`
  - `WHATSAPP_VERIFY_TOKEN`
- LLM (OpenAI):
  - `LLM_PROVIDER`
  - `OPENAI_API_KEY`
  - `OPENAI_MODEL`
- Sentry:
  - `SENTRY_DSN`
  - `SENTRY_ENVIRONMENT`
  - `SENTRY_AUTH_TOKEN`
- MCPs:
  - `GITHUB_PERSONAL_ACCESS_TOKEN`
  - `SUPABASE_URL`
  - `SUPABASE_TOKEN`
  - `VERCEL_API_TOKEN`
  - `CONTEXT7_API_KEY`
- Futuras integraciones (ej. Stripe):
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`

> **Regla:** nunca commitear `.env.local` ni ningún archivo con valores reales de estas variables.

---

## Primeros pasos (local)

### 1. Prerrequisitos

- **Node.js** 18+ (idealmente la LTS actual).
- **PNPM** o **npm** (se puede usar cualquiera; adaptar comandos).
- Cuenta creada en:
  - Supabase (DB)
  - Resend (email)
  - Meta Developers (WhatsApp Cloud API)
  - OpenAI Platform (LLM)
  - Sentry
- `.env.local` configurado con todos los valores necesarios (ver `docs/env-vars.md`).

### 2. Instalación de dependencias

```bash
# PNPM (recomendado)
pnpm install

# o con npm
npm install
```

### 3. Migraciones de base de datos

Una vez configurada la DB (Supabase) y las variables `DATABASE_URL` / `DIRECT_URL`:

```bash
# Generar cliente de Prisma (por si no está generado)
pnpm prisma generate

# Aplicar migraciones a la base de datos
pnpm prisma migrate dev
```

> El archivo `prisma/schema.prisma` define el modelo de datos.  
> Cualquier cambio estructural debe pasar por migraciones de Prisma.

### 4. Ejecutar el entorno de desarrollo

```bash
pnpm dev
# o
npm run dev
```

La app se levantará normalmente en:

- `http://localhost:3000`

---

## Despliegue en Vercel

El proyecto está preparado para despliegue en **Vercel**.

### 1. Conectar el repo

- Conectar el repositorio GitHub a Vercel (si no se hizo ya).
- Vercel detecta automáticamente Next.js y crea un proyecto.

### 2. Variables de entorno en Vercel

En la UI de Vercel, para el proyecto:

- `Settings` → `Environment Variables`
- Definir las variables indicadas en `docs/env-vars.md` para:
  - **Production**
  - (Opcional) **Preview**

Valores típicos:

- `NEXT_PUBLIC_APP_URL` / `AUTH_URL` → URL de Vercel o dominio custom.
- `SENTRY_ENVIRONMENT`:
  - `preview` en entorno Preview
  - `production` en Production
- El resto de keys (`OPENAI_API_KEY`, `RESEND_API_KEY`, etc.) deben coincidir con las usadas en `.env.local` (según entorno).

### 3. Deploy

- Cada push a la rama principal dispara un **deploy a Production** (según config).
- Cada PR o rama dispara un **Preview Deployment**.

---

## MCPs y desarrollo asistido por IA

COBRA está pensado para trabajar fuertemente con **Cursor + MCPs**.

Documentación conceptual:

- `docs/mcps.md`
- `.cursorrules`

MCPs considerados:

- **GitHub MCP** – acceso al repo, issues, PRs.
- **Supabase MCP** – inspección del esquema y consultas controladas.
- **Vercel MCP** – inspección de deploys y logs.
- **Resend MCP** – inspección de envíos de email.
- **Sentry MCP** – inspección de errores y métricas.
- **Context7 MCP** – búsqueda contextual sobre documentación/código.
- **Playwright MCP** – apoyo para tests E2E.

Reglas clave (ver `.cursorrules` para detalle):

- Nunca exponer tokens ni secrets en respuestas ni código.
- Operaciones destructivas (migraciones peligrosas, cambios de env vars, etc.) sólo bajo instrucción explícita.
- Seguir la arquitectura descrita en `docs/architecture.md` y las guías de `.cursorrules`.

---

## Testing y calidad

### Unit / Integration tests

- Lógica de negocio (estados de cobranzas, flujos) debe tener tests unitarios.
- Repositorios Prisma pueden tener tests de integración contra una DB de test.

### E2E con Playwright

- Playwright se puede usar para cubrir flujos end-to-end, por ejemplo:
  - Login con Google.
  - Alta de empresa cliente y contactos.
  - Creación de una factura.
  - Verificación de que la factura aparece en el dashboard / estado de cobranzas.

Comandos típicos (orientativos; ajustar a los scripts de `package.json`):

```bash
# Ejecutar tests de Playwright
pnpm test:e2e

# Abrir UI de Playwright
pnpm test:e2e:ui
```

---

## Observabilidad (Sentry)

Sentry se usa para:

- Capturar excepciones (`Sentry.captureException(error)`).
- Instrumentar trazas de acciones importantes (`Sentry.startSpan`).
- Capturar logs estructurados (mediante el logger de Sentry y `consoleLoggingIntegration`).

Reglas específicas (copiadas del contenido oficial de Sentry) se encuentran en:

- `.cursorrules` → sección **"Reglas específicas de Sentry"**

Resumen de configuración:

- Inicialización principal de Sentry en:
  - `instrumentation-client.ts` (client)
  - `sentry.server.config.ts` (server)
  - `sentry.edge.config.ts` (edge)
- No repetir inicialización en otros archivos.
- Usar `@sentry/nextjs` y `import * as Sentry from "@sentry/nextjs"`.

Variables clave:

- `SENTRY_DSN`
- `SENTRY_ENVIRONMENT`
- `SENTRY_AUTH_TOKEN` (para CI / sentry-cli)

---

## Roadmap

El roadmap detallado vive en:

- `docs/roadmap.md`

---

Si modificas la arquitectura, las integraciones o el modelo de datos, actualiza siempre:

- `docs/architecture.md`
- `docs/env-vars.md`
- `docs/mcps.md`
- `.cursorrules`

para mantener coherencia entre código, infraestructura y documentación.
