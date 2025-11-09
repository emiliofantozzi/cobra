# Layout v1.1 - Navigation & UI Showcase Implementation

## Phase 1: Navigation Structure & Core UI (Priority)

### 1.1 Update Navigation Architecture

**Update sidebar navigation** (`src/components/layout/app-sidebar.tsx`):

- Replace current items with new 6-section structure:
  - **Hoy** (Home icon)
  - **Cartera** with submenu: Empresas, Contactos, Facturas, Segmentos
  - **Seguimiento** (Inbox/List icon)
  - **Agente** with submenu: Regla base, Plantillas, Playbooks, Reglas, Canales
  - **Reportes** with submenu: Resumen, Efectividad
  - **Configuración** with submenu: Mi organización, Equipo, Mi cuenta, Billing, Datos, API Keys, Auditoría
- Add collapsible sections for items with submenus
- Update active state detection for nested routes

**Create topbar enhancements** (`src/components/layout/app-header.tsx`):

- Add global search component (Cmd/Ctrl+K trigger, placeholder for now)
- Add "Crear" dropdown button with options: Factura, Empresa, Contacto
- Keep existing organization switcher and user menu
- Add notifications icon (placeholder badge)

### 1.2 Create Route Structure

**Create new route folders** under `src/app/(app)/`:

- `home/page.tsx` (Hoy section)
- `portfolio/` with:
  - `companies/page.tsx` (redirect from existing `/customers`)
  - `contacts/page.tsx` (use existing)
  - `invoices/page.tsx` (use existing)
  - `segments/page.tsx` (new)
- `followup/page.tsx` (Seguimiento - bandeja única)
- `agent/` with:
  - `page.tsx` (overview/regla base)
  - `templates/page.tsx`
  - `playbooks/page.tsx`
  - `rules/page.tsx`
  - `channels/page.tsx`
- `reports/` with:
  - `summary/page.tsx`
  - `effectiveness/page.tsx`
- `settings/` with:
  - `organization/page.tsx`
  - `team/page.tsx`
  - `account/page.tsx`
  - `billing/page.tsx`
  - `data/page.tsx`
  - `api-keys/page.tsx`
  - `audit/page.tsx`

**Set up redirects**:

- `/dashboard` → `/home`
- `/customers` → `/portfolio/companies`
- Keep `/invoices` and `/contacts` working, add redirects to `/portfolio/*` if needed

### 1.3 Build Core Pages (UI Only, Mock Data)

**Page: Hoy (`/home`)**

- Onboarding checklist card (5 steps: conectar Email/WhatsApp, importar facturas, regla base, plantillas, activar agente)
- KPI cards row: Sin fecha, Vencen hoy, Vencidas, Promesas hoy (use mock numbers)
- Quick actions section: "Importar CSV", "Crear factura", "Crear empresa"
- Channel health cards: Email status, WhatsApp status (mock: "Pendiente configurar")
- Use shadcn Card, Button, Badge components
- Empty state if onboarding incomplete

**Page: Cartera/Empresas (`/portfolio/companies`)**

- Adapt existing customer table
- Add bulk selection and actions toolbar
- Add filters/search in header
- Empty state: "Importa tu primera hoja" CTA

**Page: Cartera/Contactos (`/portfolio/contacts`)**

- Use existing contact table
- Add inline edit capabilities (design only, no save yet)
- Add filters: por empresa, con/sin WhatsApp, opt-out status

**Page: Cartera/Facturas (`/portfolio/invoices`)**

- Adapt existing invoice table
- Add columns (mock data): Estado, Próxima acción, Último canal
- Add bulk edit toolbar (select multiple, "Editar fecha esperada" button)
- Add chips for quick filters: Sin fecha, Vencen hoy, Vencidas, etc.

**Page: Cartera/Segmentos (`/portfolio/segments`)**

- Simple table: Nombre, Condiciones (text), Facturas (count), Acciones
- "Crear segmento" button
- Empty state with examples: ">30 días mora y saldo>$1000"

**Page: Seguimiento (`/followup`)**

- **Chips row**: Sin fecha · Vencen hoy · Vencidas · Promesas hoy · Disputa
- **Table columns**: Empresa, Factura #, Monto, Estado, Próxima acción, Canal sugerido, Último resultado
- **Actions per row**: "Enviar ahora" (preview button), "Posponer", "Editar fecha", "Ver hilo"
- **Toolbar**: Bulk select, "Guardar vista", filters dropdown
- **Side panel** (Sheet component): "Ver hilo" opens conversation timeline (mock messages)
- Use existing components where possible, create new Followup components

**Page: Agente/Regla base (`/agent`)**

- Form with sections:
  - Ventanas horarias (time range inputs)
  - Límite diario de mensajes (number input)
  - Tono/idioma (select dropdowns)
  - Umbral de escalamiento (number input + unit)
- "Guardar cambios" button (no action yet)
- "Vista previa" toggle (staging/producción badge)

**Page: Agente/Plantillas (`/agent/templates`)**

- List of 5 essential templates as cards:

  1. Solicitar fecha esperada
  2. Recordatorio pre-vencimiento
  3. Confirmación de promesa
  4. Recordatorio post-vencimiento
  5. Escalamiento

- Each card shows: nombre, preview text, variables, "Editar" button
- "A/B Test" badge (feature flag indicator)
- Template editor modal (placeholder)

**Page: Agente/Playbooks (`/agent/playbooks`)**

- Grid of 4 preset cards: "Suave", "Estándar", "Firme", "Enterprise"
- Each shows: descripción, secuencia de mensajes, tiempo estimado
- "Activar playbook" button
- "Vista previa" expands card with detailed flow

**Page: Agente/Reglas (`/agent/rules`)**

- Table: Trigger, Condición, Acción, Estado (Activa/Inactiva)
- Examples (mock):
  - "Vencimiento en 3 días" → "Enviar recordatorio pre-vencimiento"
  - "Promesa vence hoy" → "Enviar confirmación"
- "Crear regla" button (simple form)

**Page: Agente/Canales (`/agent/channels`)**

- Email section: domain, DKIM/SPF status (mock badges), "Verificar" button, "Enviar prueba"
- WhatsApp section: número, BSP, estado (mock), "Conectar" button
- Test section: "Enviar mensaje de prueba" with recipient input

**Page: Reportes/Resumen (`/reports/summary`)**

- KPIs row: Recuperado del periodo, % con fecha asignada, % promesas cumplidas
- Aging table/chart (mock data)
- Date range picker
- Export CSV button

**Page: Reportes/Efectividad (`/reports/effectiveness`)**

- Charts (use recharts or similar):
  - Aperturas por canal (bar chart)
  - Respuestas por canal (bar chart)
  - Desempeño por plantilla (table)
- Mock data for visualization

**Page: Configuración sections** (`/settings/*`):

- **Mi organización**: form with nombre, logo upload, timezone, moneda, formato fecha
- **Equipo**: table of members with roles (Admin/Operador/Auditor), "Invitar" button
- **Mi cuenta**: user profile form, notifications preferences, 2FA toggle
- **Billing**: plan card, payment method, invoice history table (mock)
- **Datos**: Import wizard button (placeholder), export CSV button
- **API Keys**: table with key name, scopes, created date, "Revocar" button, "Crear key" button
- **Auditoría**: filterable log table (entidad, acción, usuario, timestamp) with mock entries

### 1.4 Shared Components

**Create reusable components**:

- `FilterChips` component for status filters (used in Seguimiento, Facturas)
- `BulkActionToolbar` component for table bulk operations
- `StatCard` component for KPI displays
- `EmptyState` component variations per PRD Anexo A
- `ThreadPanel` component (Sheet) for conversation view
- `QuickActionButton` component for Crear dropdown
- `StatusBadge` component with variants for all estados

### 1.5 Update Existing Pages

**Maintain compatibility**:

- Keep `/dashboard` route working (redirect to `/home`)
- Update customer detail page (`/portfolio/companies/[id]`) with 360º view:
  - Tabs: Datos, Contactos, Facturas, Timeline (mock)
  - Preferencias section
- Update invoice detail page with new fields (mock): fecha esperada, origen, promesa
- Update collection case page to align with Seguimiento view

---

## Phase 2: Database Schema Enhancements (After UI approval)

### 2.1 Add Invoice Fields

**Extend Invoice model** in `prisma/schema.prisma`:

- Add `expectedPaymentDate` (DateTime, nullable)
- Add `dateOrigin` (enum: LOADED, REQUESTED_BY_AGENT, CONFIRMED_BY_CLIENT, nullable)
- Add `paymentPromiseDate` (DateTime, nullable)
- Add `nextActionAt` (DateTime, nullable) 
- Add `lastChannel` (CommunicationChannel, nullable)
- Add `lastResult` (String, nullable)

**Create new enum** `DateOrigin`:

```prisma
enum DateOrigin {
  LOADED
  REQUESTED_BY_AGENT
  CONFIRMED_BY_CLIENT
}
```

### 2.2 Create New Tables

**InvoiceDateHistory** table (optional/lite):

- id, invoiceId, previousDate, newDate, reason, actor, timestamp
- Track date changes for audit

**Segment** table (lite):

- id, organizationId, name, rulesJson, isActive, createdAt, updatedAt
- Store segment definitions

**FeatureFlag** table:

- id, organizationId, flagKey, enabled, createdAt, updatedAt
- Manage feature flags per org

**AuditLog** table (lite):

- id, organizationId, entityType, entityId, changes (Json), actor, timestamp
- Track critical changes

**MessageTemplate** table:

- id, organizationId, key, name, channel, subject, body, variables (Json), isActive
- Store email/WhatsApp templates

**Playbook** table:

- id, organizationId, name, description, config (Json), isActive
- Store playbook configurations

**SavedView** table:

- id, organizationId, userId, name, filters (Json), isShared, createdAt
- Store saved views for Seguimiento

### 2.3 Extend Contact Model

Add fields to Contact:

- `language` (String, nullable)
- `timezone` (String, nullable)
- `workingHoursWindow` (Json, nullable)
- `hasOptedOut` (Boolean, default false)
- `consentDate` (DateTime, nullable)

### 2.4 Create Migrations

- Run `npx prisma migrate dev --name add_layout_v1_fields`
- Create backfill script for existing invoices (set sensible defaults)
- Add indexes for new filterable/sortable fields
- Test rollback capability

---

## Phase 3: Backend Integration & Data Flow (Final)

### 3.1 Create Service Layer

**Extend invoice service** (`src/lib/services/invoices.ts`):

- `updateExpectedPaymentDate(invoiceId, date, origin, actor)`
- `recordPaymentPromise(invoiceId, promiseDate, actor)`
- `calculateNextAction(invoice)` - determine nextActionAt based on dates and rules
- `getInvoicesByStatus(orgId, status, filters)` - for Seguimiento chips

**Create followup service** (`src/lib/services/followup.ts`):

- `getFollowupItems(orgId, filters, pagination)`
- `proposeMessage(invoiceId)` - returns MensajePropuestoDTO
- `sendFollowupMessage(invoiceId, channel, templateKey)`
- `postponeFollowup(invoiceId, newDate, reason)`
- `bulkUpdateDates(invoiceIds, date)`

**Create segment service** (`src/lib/services/segments.ts`):

- `createSegment(orgId, name, rules)`
- `evaluateSegment(segmentId)` - return matching invoice IDs
- `getSegmentStats(segmentId)` - count and totals

**Create agent service extensions** (`src/lib/services/agent.ts`):

- `getAgentBaseRules(orgId)`
- `updateAgentBaseRules(orgId, rules)`
- `getTemplates(orgId)`
- `updateTemplate(templateId, content)`
- `activatePlaybook(orgId, playbookKey)`
- `testChannelConnection(orgId, channel)`

**Create reports service** (`src/lib/services/reports.ts`):

- `getSummaryMetrics(orgId, dateRange)`
- `getEffectivenessStats(orgId, dateRange)`
- `getAgingReport(orgId)`

**Create feature flag service** (`src/lib/services/feature-flags.ts`):

- `isFeatureEnabled(orgId, flagKey)`
- `setFeatureFlag(orgId, flagKey, enabled)`

**Create audit service** (`src/lib/services/audit.ts`):

- `logChange(orgId, entityType, entityId, changes, actor)`
- `getAuditLog(orgId, filters, pagination)`

### 3.2 Create Repository Layer

**Create repositories** in `src/lib/repositories/`:

- `segment-repository.ts`
- `feature-flag-repository.ts`
- `audit-log-repository.ts`
- `message-template-repository.ts`
- `playbook-repository.ts`
- `saved-view-repository.ts`

**Extend existing repositories**:

- `invoice-repository.ts`: add methods for new fields, filtering by dates
- `contact-repository.ts`: add opt-out filtering

### 3.3 Create API Routes

**Create API routes** in `src/app/api/`:

- `followup/items/route.ts` - GET list for Seguimiento table
- `followup/propose-message/route.ts` - POST to get message preview
- `followup/send/route.ts` - POST to send message
- `followup/bulk-update/route.ts` - PATCH for bulk date updates
- `segments/route.ts` - CRUD for segments
- `agent/base-rules/route.ts` - GET/PATCH agent config
- `agent/templates/route.ts` - GET/PATCH templates
- `agent/playbooks/[key]/activate/route.ts` - POST to activate playbook
- `agent/channels/test/route.ts` - POST to test channel
- `reports/summary/route.ts` - GET summary metrics
- `reports/effectiveness/route.ts` - GET effectiveness stats
- `settings/feature-flags/route.ts` - GET/PATCH flags
- `settings/audit/route.ts` - GET audit logs

### 3.4 Integrate Providers

**Create stub integrations** (if not exist) in `src/lib/integrations/`:

- `email-provider.ts` - wrap Resend
- `whatsapp-provider.ts` - wrap WhatsApp API
- `llm-provider.ts` - wrap OpenAI for message generation

### 3.5 Connect UI to Backend

**Replace mock data with real API calls**:

- Update all page components to use `fetch` or server components
- Implement server actions for form submissions
- Add loading states and error handling
- Add optimistic updates for quick actions
- Implement real-time refresh (polling or webhooks) for Seguimiento

### 3.6 Implement Import Wizard v2

**Create Import Wizard** (`src/components/data/import-wizard.tsx`):

- Step 1: Upload CSV
- Step 2: Map columns (auto-suggest by similarity)
- Step 3: Validate data (show errors)
- Step 4: Preview table
- Step 5: Confirm and import
- Progress indicator
- Error handling and downloadable error report

**Create import service** (`src/lib/services/import.ts`):

- `parseCSV(file)`
- `suggestColumnMappings(headers)`
- `validateImportData(data, mappings)`
- `importInvoices(orgId, data, mappings)`
- `importCustomers(orgId, data, mappings)`

### 3.7 Telemetry & Observability

**Instrument key events** using Sentry:

- `ui.followup.send_now.clicked`
- `ui.followup.bulk_edit_dates.saved`
- `ui.invoices.inline_date.saved`
- `ui.agent.playbook.activated`
- `ui.agent.template.ab.enabled`
- `ui.data.import.completed`
- `ui.settings.channel.email.verified`
- `ui.settings.channel.whatsapp.connected`

Add context: organizationId, userId, entityId, timestamp

### 3.8 RBAC Implementation

**Update auth middleware**:

- Read role from Membership
- Create permission checks: `canManageAgent(role)`, `canEditInvoices(role)`, etc.
- Add guards to API routes based on role matrix (Admin/Operador/Auditor)
- Hide UI elements based on permissions

---

## Phase 4: Testing & Documentation

### 4.1 Update Documentation

**Update files**:

- `docs/overview.md` - add Layout v1.1 features
- `docs/architecture.md` - update data model diagram, add new entities
- `docs/env-vars.md` - add any new environment variables

### 4.2 Manual QA

**Test all DoD criteria**:

- Navigation flows work end-to-end
- All chips and filters in Seguimiento work
- Bulk actions execute correctly
- Import wizard validates and imports data
- Reports show correct metrics
- Feature flags hide/show UI elements
- RBAC respects role permissions
- Performance: 5k invoice table loads in ≤2s

### 4.3 Accessibility Check

- Keyboard navigation works (Tab, Enter, Esc)
- ARIA labels present on interactive elements
- Focus indicators visible
- Screen reader compatible (basic)

---

## Implementation Notes

**Order of execution**:

1. Phase 1 first (UI showcase) - can demo to users
2. Phase 2 once UI is approved (database changes)
3. Phase 3 to connect everything (backend)
4. Phase 4 for polish and docs

**Preserve existing functionality**:

- Do NOT touch auth components, sign-in/sign-out flows
- Keep existing routes working with redirects
- Reuse existing components where possible
- Maintain multi-tenant filtering in all queries

**Design system**:

- Use shadcn/ui components consistently
- Maintain brand color scheme
- Follow Tailwind conventions
- Add CSS variables for new semantic colors if needed

**Mock data strategy** (Phase 1):

- Use TypeScript constants for mock arrays
- Keep data realistic (empresa names, amounts, dates)
- Comment clearly "// TODO: replace with API call in Phase 3"