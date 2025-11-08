# Variables de entorno (`env-vars.md`)

> Este documento define **todas las variables de entorno** usadas por la plataforma COBRA (cobranzas asistidas por IA):
> - variables necesarias para que la app Next.js corra (runtime),
> - y variables usadas por herramientas y MCPs.
>
> **Nunca** se deben commitear valores reales de estas variables al repositorio.

---

## 1. Estrategia general de configuración

### 1.1. Archivos `.env`

Usamos esta convención:

- `.env.local`  
  - Solo en tu máquina local.  
  - Contiene **valores reales** para desarrollo.  
  - No se commitea (debe estar en `.gitignore`).

- `.env.example`  
  - Se commitea.  
  - Contiene **solo los nombres** de variables (sin valores reales).  
  - Sirve como plantilla para otros entornos (local, staging, producción).

Plantilla base:

```env
# App
NEXT_PUBLIC_APP_URL=
AUTH_URL=

# Auth (Auth.js + Google OAuth)
AUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Base de datos (Supabase / Postgres + Prisma)
DATABASE_URL=
DIRECT_URL=

# Email (Resend)
RESEND_API_KEY=
RESEND_DEFAULT_FROM=

# WhatsApp Cloud API (Meta)
WHATSAPP_API_BASE_URL=https://graph.facebook.com/v21.0
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_BUSINESS_ACCOUNT_ID=
WHATSAPP_VERIFY_TOKEN=

# LLM / IA (OpenAI)
LLM_PROVIDER=openai
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini

# Observabilidad (Sentry)
SENTRY_DSN=
SENTRY_ENVIRONMENT=
SENTRY_AUTH_TOKEN=

# MCPs y tooling
GITHUB_PERSONAL_ACCESS_TOKEN=
SUPABASE_URL=
SUPABASE_TOKEN=
VERCEL_API_TOKEN=
VERCEL_ORG_ID=
VERCEL_PROJECT_ID=
VERCEL_PROJECT_NAME=
CONTEXT7_API_KEY=

# Integraciones futuras (ej. pagos)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
# 2. Vercel

| Variable             | Entorno         | Descripción / Valor actual                                    |
|----------------------|-----------------|---------------------------------------------------------------|
| `VERCEL_API_TOKEN`   | Local / CI      | Token personal con acceso mínimo al proyecto (no commitear). |
| `VERCEL_ORG_ID`      | Todos           | Identificador del equipo en Vercel. Para COBRA: `team_95DKBHWDy7tkYvpGVvclcgWb`. |
| `VERCEL_PROJECT_ID`  | Todos           | ID interno del proyecto. Para COBRA: `prj_7z8QB0pVkyPLAKKgzwx1UyistJp5`. |
| `VERCEL_PROJECT_NAME`| Todos           | Slug del proyecto en Vercel. Para COBRA: `cobra`.            |

> Estos valores se reflejan también en `.vercel/project.json`. Mantenerlos sincronizados evita errores al usar `vercel deploy` o integraciones automatizadas.

