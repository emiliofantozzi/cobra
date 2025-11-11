# Plan General: Sprint Sección Cartera

## 1. Resumen y Alcance

### 1.1. Qué se construye

**Sección Cartera completa** con 4 subsecciones operativas más Import Wizard:

1. **Empresas** (`/portfolio/companies`) - Gestión de empresas cliente con vista 360°
2. **Contactos** (`/portfolio/contacts`) - Personas de contacto con preferencias y opt-out
3. **Facturas** (`/portfolio/invoices`) - Gestión avanzada con fecha esperada de pago, promesas, y estados
4. **Segmentos** (`/portfolio/segments`) - Segmentación dinámica de facturas (versión lite)
5. **Import Wizard v2** - Ingestión masiva de datos con validación y mapping inteligente

### 1.2. Qué NO entra en esta fase

- Módulo de Seguimiento (bandeja única) - sprint separado
- Configuración completa del Agente - sprint separado
- Reportes avanzados - sprint separado
- Auth/login/logout - ya funciona, no se toca
- Integración real con WhatsApp/Email - stubs por ahora

### 1.3. Dependencias con Layout v1

Este sprint asume:

- Sidebar y topbar ya configurados (referencia: `src/components/layout/app-sidebar.tsx`, `app-header.tsx`)
- Routing base de `/portfolio/*` ya creado
- Sistema de org activa funcionando (`activeOrganizationId` en User)
- shadcn/ui components disponibles
- Prisma schema completo (Phase 2 ya aplicada según `architecture.md`)

---

## 2. Arquitectura de Navegación - Cartera

### 2.1. Rutas y estructura

```
/portfolio
├── /companies (Empresas)
│   ├── /companies (lista) → src/app/(app)/portfolio/companies/page.tsx
│   └── /companies/[id] (detalle 360°) → src/app/(app)/portfolio/companies/[id]/page.tsx
├── /contacts (Contactos)
│   └── /contacts (lista) → src/app/(app)/portfolio/contacts/page.tsx
├── /invoices (Facturas)
│   ├── /invoices (lista) → src/app/(app)/portfolio/invoices/page.tsx
│   └── /invoices/[id] (detalle) → src/app/(app)/portfolio/invoices/[id]/page.tsx
└── /segments (Segmentos lite)
    └── /segments (lista) → src/app/(app)/portfolio/segments/page.tsx
```

### 2.2. Comportamientos de tabla

**Paginación**: Server-side con cursor/offset, límite configurable (10/25/50/100 rows)

**Filtros persistentes**:

- Estado activo se guarda en URL search params (`?status=ACTIVE&search=acme`)
- Filtros rápidos mediante chips (p.ej. "Activas", "Vencidas", "Sin fecha")
- Filtros avanzados en dropdown/drawer

**Ordenación**: Por columna con indicador visual, persistente en URL

**Bulk actions**: Selección múltiple con toolbar flotante, acciones contextuales según entidad

**Vistas guardadas** (SavedView):

- Guardar combinación de filtros con nombre
- Compartir vistas entre usuarios del equipo
- Aplicable en Facturas y Seguimiento

### 2.3. Panel lateral de detalle

**Sheet component** (shadcn/ui) para quick view sin navegar:

- Slide-in desde derecha
- Mostrar datos clave + acciones rápidas
- Botón "Ver completo" para ir a página de detalle

**Implementación**:

- Componente reutilizable `DetailSheet` en `src/components/shared/`
- Props: entityType, entityId, onClose, onEdit

---

## 3. Modelo de Datos Implicado

### 3.1. Empresas Cliente (CustomerCompany)

**Tabla**: `customer_companies`

**Campos clave**:

```prisma
id               String
organizationId   String
name             String
legalName        String?
taxId            String?
status           CustomerCompanyStatus (ACTIVE, INACTIVE, ARCHIVED)
industry         String?
website          String?
notes            String?
createdAt, updatedAt, archivedAt
```

**Relaciones**:

- 1-N con Contact
- 1-N con Invoice

**Índices existentes**: organizationId, status

**Nuevos campos requeridos**: NINGUNO (modelo completo)

### 3.2. Contactos (Contact)

**Tabla**: `contacts`

**Campos clave**:

```prisma
id                 String
organizationId     String
customerCompanyId  String
firstName, lastName String?
email, phoneNumber, whatsappNumber String?
position           String?
isPrimary          Boolean @default(false)
language           String? (ISO 639-1: 'es', 'en', etc.)
timezone           String? (IANA: 'America/Santiago')
workingHoursWindow Json? // {start: "09:00", end: "18:00", days: [1,2,3,4,5]}
hasOptedOut        Boolean @default(false)
consentDate        DateTime?
notes              String?
```

**Validaciones**:

- Email o WhatsApp debe existir (al menos uno)
- Email format válido si presente
- Timezone debe ser IANA válido
- workingHoursWindow debe validar JSON schema

**Índices existentes**: organizationId, customerCompanyId, email, hasOptedOut

### 3.3. Facturas (Invoice)

**Tabla**: `invoices`

**Campos clave**:

```prisma
id                  String
organizationId      String
customerCompanyId   String
number              String? @unique per org
description         String?
issueDate           DateTime
dueDate             DateTime
amount              Decimal
currency            String @default("USD")
status              InvoiceStatus (DRAFT, PENDING, PARTIALLY_PAID, PAID, OVERDUE, CANCELLED)
expectedPaymentDate DateTime?
dateOrigin          DateOrigin? (LOADED, REQUESTED_BY_AGENT, CONFIRMED_BY_CLIENT)
paymentPromiseDate  DateTime?
nextActionAt        DateTime?
lastChannel         CommunicationChannel?
lastResult          String?
notes, metadata     String?, Json?
```

**Estados calculados** (además de status):

- `sin_fecha`: expectedPaymentDate IS NULL
- `vencen_hoy`: dueDate = TODAY
- `vencidas`: dueDate < TODAY AND status != PAID
- `promesas_hoy`: paymentPromiseDate = TODAY

**Índices existentes**: organizationId, customerCompanyId, status, expectedPaymentDate, nextActionAt, dateOrigin

**Unique constraint**: `[organizationId, number]`

### 3.4. Historial de Fechas (InvoiceDateHistory)

**Tabla**: `invoice_date_history`

**Propósito**: Auditar cambios en `expectedPaymentDate`

**Campos**:

```prisma
id           String
invoiceId    String
previousDate DateTime?
newDate      DateTime?
reason       String? (ej: "Promesa de cliente", "Ajuste manual", "Solicitado por agente")
changedBy    String? (userId o "system")
createdAt    DateTime @default(now())
```

### 3.5. Segmentos (Segment)

**Tabla**: `segments`

**Campos**:

```prisma
id             String
organizationId String
name           String
description    String?
rulesJson      Json // Estructura de reglas (v1 simple)
isActive       Boolean @default(true)
createdAt, updatedAt DateTime
```

**Estructura de rulesJson (v1 - lite)**:

```typescript
{
  conditions: Array<{
    field: 'status' | 'dueDate' | 'amount' | 'expectedPaymentDate' | 'dateOrigin'
    operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'isNull' | 'isNotNull'
    value: any
  }>
  logic: 'AND' | 'OR' // default: 'AND'
}
```

**Ejemplos**:

- Segmento "Mora >30 días": `{conditions: [{field: 'dueDate', operator: 'lt', value: 'NOW-30d'}], logic: 'AND'}`
- Segmento "Sin fecha y >$1000": `{conditions: [{field: 'expectedPaymentDate', operator: 'isNull'}, {field: 'amount', operator: 'gte', value: 1000}], logic: 'AND'}`

---

## 4. Import Wizard v2 - Alcance

### 4.1. Objetivo

Permitir carga masiva inicial de datos desde CSV/Excel con:

- **Mapping flexible**: Auto-sugerencia de columnas por similitud
- **Validación pre-import**: Mostrar errores antes de guardar
- **Preview**: Vista previa de primeras 10 filas mapeadas
- **Reporte de errores**: CSV descargable con errores por fila
- **Idempotencia**: Prevenir duplicados en re-intentos

### 4.2. Flujos soportados

1. **Importar Empresas** (CustomerCompany)

   - Columnas: Nombre, Razón Social, RUT/Tax ID, Industria, Website, Notas
   - Validación: nombre requerido, taxId único por org (opcional)

2. **Importar Contactos** (Contact)

   - Columnas: Empresa (lookup), Nombre, Apellido, Email, Teléfono, WhatsApp, Cargo, Idioma, Zona horaria
   - Validación: empresa debe existir o crearse inline, email o WhatsApp requerido

3. **Importar Facturas** (Invoice)

   - Columnas: Empresa (lookup), Número, Descripción, Fecha emisión, Fecha vencimiento, Monto, Moneda, Fecha esperada pago, Origen fecha
   - Validación: empresa debe existir, número único por org, fechas válidas, monto > 0

### 4.3. Componentes UI

**Wizard de 5 pasos**:

1. **Upload**: Drag & drop CSV/Excel, validar formato
2. **Map Columns**: Tabla con columnas origen → destino, auto-suggest por similitud
3. **Validate**: Ejecutar validaciones, mostrar errores agrupados
4. **Preview**: Tabla con primeras 10 filas, indicar nuevas/updates
5. **Confirm & Import**: Progress bar, reporte final (insertadas, actualizadas, errores)

**Plantillas descargables**:

- Botón "Descargar plantilla CSV" por cada tipo (Empresas, Contactos, Facturas)
- Incluye headers y 2 filas de ejemplo

### 4.4. Lógica de importación

**Idempotencia**:

- Hash de fila (campos clave) para detectar duplicados
- Opción de "Actualizar si existe" vs "Ignorar duplicados"

**Manejo de relaciones**:

- Contactos: buscar empresa por nombre exacto o taxId, crear si no existe (opcional)
- Facturas: buscar empresa por nombre exacto o taxId, fallar si no existe

**Transaccionalidad**:

- Import en transacción Prisma si <= 1000 filas
- Batch inserts de 100 filas para volúmenes mayores
- Rollback automático en errores críticos

### 4.5. API routes

- `POST /api/import/parse` - Sube archivo, retorna headers y preview
- `POST /api/import/validate` - Valida datos mapeados, retorna errores
- `POST /api/import/execute` - Ejecuta import, retorna summary + error report

---

## 5. Orden de Trabajo - Fases

### Fase 1: Empresas (CustomerCompany)

**Alcance**:

- Completar vista de lista `/portfolio/companies` con filtros y bulk actions
- Implementar vista detalle 360° `/portfolio/companies/[id]` con tabs (Datos, Contactos, Facturas, Timeline)
- Formularios de creación/edición inline
- Empty states y loading states

**Criterios de salida**:

- ✅ Tabla con paginación server, filtros por status/búsqueda, ordenación
- ✅ CRUD completo (crear, editar, archivar, reactivar)
- ✅ Vista 360° con tabs funcionales (aunque Contactos/Facturas sean mocks por ahora)
- ✅ Bulk actions: archivar múltiples, exportar CSV

**Estimación**: 3-4 días

---

### Fase 2: Contactos (Contact)

**Alcance**:

- Completar vista de lista `/portfolio/contacts` con filtros avanzados
- Gestión de opt-out y preferencias (idioma, timezone, ventanas horarias)
- Validación de email/WhatsApp
- Integración con vista 360° de Empresas

**Criterios de salida**:

- ✅ Tabla con filtros: por empresa, canal (con/sin WhatsApp), opt-out status
- ✅ CRUD completo con validaciones de email/teléfono
- ✅ Edición inline de campos simples (isPrimary, hasOptedOut)
- ✅ Panel lateral de quick edit
- ✅ Gestión de contacto primario por empresa

**Estimación**: 3-4 días

---

### Fase 3: Facturas (Invoice)

**Alcance**:

- Completar vista de lista `/portfolio/invoices` con chips de estado y fecha esperada
- Gestión de fecha esperada de pago (inline edit, origen, historial)
- Gestión de promesas de pago
- Bulk edit de fechas
- Vista detalle con historial de fechas

**Criterios de salida**:

- ✅ Tabla con columnas: Empresa, #Factura, Monto, Estado, Fecha esperada, Origen, Próxima acción
- ✅ Chips de filtro rápido: Sin fecha, Vencen hoy, Vencidas, Promesas hoy
- ✅ Edición inline de expectedPaymentDate con selector de origen
- ✅ Bulk edit: seleccionar múltiples facturas y asignar fecha esperada masivamente
- ✅ Vista detalle con historial de cambios de fecha (InvoiceDateHistory)
- ✅ CRUD completo de facturas

**Estimación**: 5-6 días

---

### Fase 4: Segmentos (Segment - lite)

**Alcance**:

- Vista de lista `/portfolio/segments` con evaluación en tiempo real
- Creación de segmentos con UI simple (campo + operador + valor)
- Evaluación de segmentos (conteo de facturas matching)
- Integración con filtros de Facturas

**Criterios de salida**:

- ✅ Tabla: Nombre, Descripción, Condiciones (texto legible), # Facturas, Activo/Inactivo
- ✅ Formulario de creación con builder simple de reglas (máximo 3 condiciones en v1)
- ✅ Evaluación on-demand (botón "Evaluar" muestra conteo sin guardar)
- ✅ Aplicar segmento como filtro en `/portfolio/invoices` (URL param `?segment=SEGMENT_ID`)
- ✅ CRUD básico (crear, editar, activar/desactivar, eliminar)

**Estimación**: 3-4 días

---

### Fase 5: Import Wizard v2

**Alcance**:

- Wizard de 5 pasos (Upload, Map, Validate, Preview, Import)
- Flujos para Empresas, Contactos, Facturas
- Plantillas CSV descargables
- Reporte de errores descargable
- Idempotencia básica

**Criterios de salida**:

- ✅ Wizard completo con navegación step-by-step
- ✅ Auto-mapping por similitud de nombres de columna
- ✅ Validaciones pre-import con errores agrupados
- ✅ Preview de primeras 10 filas
- ✅ Progress bar durante import
- ✅ Reporte final: X insertadas, Y actualizadas, Z errores (descargable)
- ✅ Plantillas CSV con headers + ejemplos
- ✅ Manejo de duplicados (skip o update)

**Estimación**: 5-6 días

---

### Fase 6: Integración y QA End-to-End

**Alcance**:

- Integrar todos los módulos de Cartera
- Flujo completo: Importar empresas → Importar contactos → Importar facturas → Crear segmento → Filtrar
- Testing manual de todos los criterios de aceptación
- Performance testing (5k facturas)
- Telemetría básica

**Criterios de salida**:

- ✅ Flujo end-to-end funciona sin errores
- ✅ Navegación entre secciones fluida (breadcrumbs, back buttons)
- ✅ Performance: tabla de 5k facturas carga en ≤2s
- ✅ Telemetría activa: eventos de creación, edición, bulk actions, imports
- ✅ Estados vacíos y de error en todas las vistas
- ✅ Accesibilidad básica: keyboard navigation, ARIA labels

**Estimación**: 3-4 días

---

## 6. Criterios de Aceptación

### 6.1. Globales (aplican a todas las fases)

- ✅ Multi-tenant: todas las queries filtran por `organizationId`
- ✅ No se rompe auth ni rutas pre-login
- ✅ Responsive: funciona en desktop (1280px+) y tablet (768px+)
- ✅ Loading states: skeleton loaders durante fetch
- ✅ Error states: mensajes claros, opción de reintentar
- ✅ Empty states: ilustración + CTA según PRD Anexo A
- ✅ Telemetría: eventos clave enviados a Sentry (creación, edición, errores)
- ✅ Performance: tablas de hasta 5k filas cargan en ≤2s
- ✅ RBAC: permisos según rol (Admin/Operador/Auditor) - básico en v1

### 6.2. Por entidad

**Empresas**:

- ✅ Listado con paginación server (10/25/50/100 filas)
- ✅ Filtros: búsqueda por nombre, filtro por status (ACTIVE/INACTIVE/ARCHIVED)
- ✅ Ordenación: por nombre, fecha creación
- ✅ Crear empresa: formulario con validaciones (nombre requerido)
- ✅ Editar empresa: inline o modal, actualización sin reload
- ✅ Archivar/reactivar empresa: acción rápida con confirmación
- ✅ Vista 360°: tabs (Datos, Contactos, Facturas, Timeline)
- ✅ Bulk actions: archivar múltiples, exportar CSV

**Contactos**:

- ✅ Listado con filtros: por empresa, con/sin WhatsApp, opt-out status
- ✅ Validación de email (format) y WhatsApp (solo números)
- ✅ Al menos un canal requerido (email o WhatsApp)
- ✅ Edición inline: isPrimary toggle, hasOptedOut toggle
- ✅ Gestión de contacto primario: solo uno por empresa
- ✅ Campos de idioma y timezone con selectores estándar
- ✅ ventanas horarias: JSON con validación (start, end, days)
- ✅ Panel lateral de quick edit

**Facturas**:

- ✅ Listado con columnas: Empresa, #, Monto, Estado, Fecha esperada, Origen, Próxima acción, Canal, Resultado
- ✅ Chips de filtro: Sin fecha, Vencen hoy, Vencidas, Promesas hoy, Pagadas
- ✅ Edición inline de expectedPaymentDate: date picker + selector de dateOrigin
- ✅ Bulk edit: seleccionar múltiples y asignar fecha esperada con reason
- ✅ Registro en InvoiceDateHistory al cambiar fecha
- ✅ Vista detalle: historial de cambios de fecha (tabla con previousDate, newDate, reason, changedBy, createdAt)
- ✅ Promesas de pago: campo paymentPromiseDate editable, indicador visual si vence hoy
- ✅ Unique constraint: número de factura único por organización
- ✅ Ordenación por: vencimiento, monto, fecha esperada

**Segmentos (lite)**:

- ✅ Listado: Nombre, Condiciones (legible), # Facturas, Estado (activo/inactivo)
- ✅ Crear segmento: formulario con builder simple (máximo 3 condiciones)
- ✅ Condiciones soportadas: status, dueDate, amount, expectedPaymentDate, dateOrigin
- ✅ Operadores: eq, ne, gt, lt, gte, lte, in, isNull, isNotNull
- ✅ Evaluación on-demand: botón que ejecuta query y muestra conteo
- ✅ Aplicar como filtro en Facturas: URL param `?segment=ID`
- ✅ Activar/desactivar segmento sin eliminar

**Import Wizard**:

- ✅ Upload: drag & drop, soporte CSV y Excel (.xlsx)
- ✅ Validación de archivo: tamaño máximo 10MB, formato válido
- ✅ Auto-mapping: sugerencia de columnas por similitud (threshold 80%)
- ✅ Validaciones: ejecutar antes de import, mostrar errores agrupados (tipo, count)
- ✅ Preview: primeras 10 filas con datos mapeados
- ✅ Progress: barra de progreso durante import
- ✅ Reporte final: summary (insertadas, actualizadas, errores) + CSV de errores descargable
- ✅ Plantillas: botón de descarga por tipo (Empresas, Contactos, Facturas)
- ✅ Idempotencia: opción "Actualizar si existe" o "Ignorar duplicados"
- ✅ Manejo de relaciones: Contactos pueden crear empresa inline si no existe (opcional)

---

## 7. Migraciones y Cambios en DB

### 7.1. Estado actual

Según `prisma/schema.prisma` revisado:

- ✅ Todas las tablas requeridas ya existen
- ✅ Campos extendidos de Invoice (expectedPaymentDate, dateOrigin, paymentPromiseDate, nextActionAt, lastChannel, lastResult) ya están
- ✅ Tabla InvoiceDateHistory existe
- ✅ Tabla Segment existe con rulesJson
- ✅ Índices clave ya aplicados

### 7.2. Nuevos índices (si performance lo requiere)

Evaluar en Fase 6 si agregar:

- Índice compuesto en Invoice: `[organizationId, status, expectedPaymentDate]` (para queries de Seguimiento)
- Índice compuesto en Invoice: `[organizationId, dueDate, status]` (para chips "Vencen hoy", "Vencidas")
- Índice en Contact: `[organizationId, isPrimary]` (para lookup rápido de contacto primario)

**Estrategia**: No crear índices prematuramente. Medir queries lentas en Fase 6 con Sentry performance tracing.

### 7.3. Migraciones reversibles

Toda migración debe incluir:

- Script `up` con creación/modificación
- Script `down` con rollback
- Seeds de ejemplo para testing

### 7.4. Backfill

No requerido - modelo de datos no cambia sustancialmente.

### 7.5. Política de compatibilidad

- ✅ No romper layout existente (auth, org switcher, sidebar)
- ✅ No modificar tablas de auth (User, Account, Session, Membership)
- ✅ Nuevos campos nullable por defecto para compatibilidad con datos existentes

---

## 8. Telemetría y Auditoría (Lite)

### 8.1. Eventos a instrumentar con Sentry

**Patrón**: `Sentry.startSpan({ op: 'ui.action', name: 'event.name' })`

**Empresas**:

- `ui.portfolio.companies.created`
- `ui.portfolio.companies.edited`
- `ui.portfolio.companies.archived`
- `ui.portfolio.companies.bulk_archived`

**Contactos**:

- `ui.portfolio.contacts.created`
- `ui.portfolio.contacts.edited`
- `ui.portfolio.contacts.opted_out`
- `ui.portfolio.contacts.primary_set`

**Facturas**:

- `ui.portfolio.invoices.created`
- `ui.portfolio.invoices.edited`
- `ui.portfolio.invoices.expected_date_set` (incluir dateOrigin)
- `ui.portfolio.invoices.bulk_dates_updated`
- `ui.portfolio.invoices.promise_recorded`

**Segmentos**:

- `ui.portfolio.segments.created`
- `ui.portfolio.segments.evaluated`
- `ui.portfolio.segments.applied_as_filter`

**Import Wizard**:

- `ui.import.started` (entityType, fileSize)
- `ui.import.mapped` (entityType, rowCount)
- `ui.import.validated` (entityType, errorCount)
- `ui.import.completed` (entityType, inserted, updated, errors)
- `ui.import.failed` (entityType, error)

**Contexto obligatorio en todos los eventos**:

- `organizationId`
- `userId`
- `timestamp`
- `entityId` (cuando aplique)

### 8.2. Auditoría crítica (AuditLog)

Registrar en tabla `audit_logs`:

- Cambios en facturas (monto, fecha esperada, estado)
- Cambios en promesas de pago
- Bulk actions (qué facturas se afectaron)
- Imports (summary: cuántas filas, qué entidades)

**Implementación**: Service layer (`src/lib/services/audit.ts`) con método `logChange(orgId, entityType, entityId, changes, actor)`

---

## 9. Plan de QA y DoD (Definition of Done)

### 9.1. Checklist por fase

**Al finalizar cada fase (F1-F5)**:

- [ ] Todas las vistas cargan sin errores de consola
- [ ] Filtros y ordenación funcionan correctamente
- [ ] Formularios validan inputs y muestran errores claros
- [ ] Loading states visibles durante operaciones asíncronas
- [ ] Empty states presentes cuando no hay datos
- [ ] Error states con opción de reintentar
- [ ] Navegación funciona (breadcrumbs, back buttons, links internos)
- [ ] Multi-tenant: queries filtran por organizationId
- [ ] Telemetría: eventos clave se envían a Sentry
- [ ] No hay warnings de React en dev mode
- [ ] Código TypeScript sin `any` (salvo casos excepcionales documentados)

### 9.2. Checklist global (Fase 6)

- [ ] Flujo end-to-end: Importar empresas → contactos → facturas → crear segmento → filtrar
- [ ] Performance: tabla de 5k facturas carga en ≤2s (medir con Network tab)
- [ ] Accesibilidad: navegación por teclado (Tab, Enter, Esc) funciona
- [ ] Accesibilidad: ARIA labels en botones y controles interactivos
- [ ] Accesibilidad: focus indicators visibles
- [ ] Responsive: funciona en desktop (1280px+) y tablet (768px+)
- [ ] Auth: no se rompe login/logout ni org switcher
- [ ] Sidebar: navegación a Cartera funciona desde sidebar
- [ ] Breadcrumbs: reflejan ruta actual correctamente
- [ ] Errores: Sentry captura excepciones con contexto (orgId, userId, entityId)
- [ ] Logs: Sentry logs activados con niveles apropiados (error, warn, info)

### 9.3. Seeds y datos de prueba

**Crear script de seeding** (`prisma/seed-cartera.ts`):

- 50 empresas de ejemplo
- 150 contactos (2-3 por empresa)
- 500 facturas (10 por empresa, variedad de estados)
- 5 segmentos de ejemplo
- Relaciones correctas (contactos primarios, facturas con fechas esperadas)

**Dataset para Import Wizard**:

- CSV de empresas: 100 filas, 5 con errores (nombre vacío, taxId duplicado)
- CSV de contactos: 200 filas, 10 con errores (email inválido, empresa no existe)
- CSV de facturas: 500 filas, 20 con errores (empresa no existe, número duplicado, fecha inválida)

### 9.4. Checklist de accesibilidad

- [ ] Keyboard navigation: Tab para mover foco, Enter para activar, Esc para cerrar modals
- [ ] ARIA labels: todos los botones sin texto tienen `aria-label`
- [ ] ARIA roles: `role="button"` en elementos clickeables no-nativos
- [ ] Focus indicators: border o outline visible en elementos con foco
- [ ] Color contrast: WCAG AA mínimo (4.5:1 para texto normal)
- [ ] Screen reader: mensajes de éxito/error anunciados con `aria-live`

---

## 10. Riesgos y Mitigaciones

### 10.1. Riesgo: Duplicados en imports

**Escenario**: Usuario sube CSV con empresas/facturas duplicadas o re-intenta import fallido

**Mitigación**:

- Hash de fila (campos clave) para detectar duplicados exactos
- Unique constraints en BD (ej: `[organizationId, number]` en Invoice)
- Opción de "Actualizar si existe" o "Ignorar duplicados" en Wizard
- Validación pre-import: mostrar duplicados antes de guardar

### 10.2. Riesgo: Datos incompletos o inválidos

**Escenario**: CSV con emails mal formateados, fechas inválidas, empresas inexistentes

**Mitigación**:

- Validaciones exhaustivas en paso 3 del Wizard
- Reporte de errores por fila con motivo específico
- Permitir corrección sin re-subir archivo (edición inline en preview)
- Templates CSV con ejemplos de formato correcto

### 10.3. Riesgo: Performance con tablas grandes

**Escenario**: Organización con 10k+ facturas, tabla lenta o timeouts

**Mitigación**:

- Paginación server-side obligatoria (nunca cargar todo en cliente)
- Índices en columnas de filtro y ordenación
- Virtual scrolling si paginación no es suficiente (evaluación en Fase 6)
- Cache de queries frecuentes (ej: conteos de chips) con React Query
- Monitoring con Sentry performance tracing

### 10.4. Riesgo: UX confusa en bulk edit de fechas

**Escenario**: Usuario selecciona 100 facturas y asigna fecha incorrecta, necesita deshacer

**Mitigación**:

- Confirmación modal antes de bulk action con preview: "Vas a actualizar 100 facturas"
- Mostrar lista de facturas afectadas (primeras 10 + contador)
- Registro en AuditLog con detalles de bulk action
- Tooltip educativo: "Puedes filtrar por fecha esperada después para revertir"

### 10.5. Riesgo: Segmentos complejos con performance pobre

**Escenario**: Segmento con múltiples condiciones genera query lenta

**Mitigación**:

- Limitar a 3 condiciones en v1 (lite)
- Evaluación on-demand (no automática) para evitar queries innecesarias
- Timeout de 10s en evaluación, mostrar error si excede
- Considerar materialización de segmentos en v2 (tabla cache de resultados)

### 10.6. Riesgo: Opt-out no respetado

**Escenario**: Contacto con `hasOptedOut=true` recibe mensajes del agente

**Mitigación**:

- Validación en capa de servicios de comunicaciones (futuro sprint Agente)
- Badge visual prominente en UI de contacto si opt-out=true
- Filtro por defecto en listas: excluir opted-out (con opción de mostrar)
- Auditoría: loguear si se intenta contactar a opted-out

### 10.7. Riesgo: Timezone y workingHours ignorados

**Escenario**: Agente envía mensajes fuera de horario del contacto

**Mitigación**:

- Validación de timezone IANA en formulario (dropdown con lista estándar)
- workingHoursWindow validado contra JSON schema
- Documentar uso en `architecture.md` para integración con Agente
- UI muestra horario local calculado del contacto (ej: "10:00 AM hora local")

---

## 11. Actualizaciones Documentales Requeridas

### 11.1. Archivos a actualizar

**`docs/architecture.md`**:

- Sección 6.2: confirmar que campos extendidos ya están en producción
- Agregar subsección sobre Import Wizard (arquitectura de validación)
- Agregar diagramas de flujo de bulk edit y segmentos

**`docs/overview.md`**:

- Agregar mención de Import Wizard como forma principal de ingesta inicial
- Explicar concepto de "fecha esperada de pago" y origen en contexto de cobranzas

**Nuevos documentos**:

- `docs/Secciones detalladas/import-wizard-specs.md` - especificación completa del wizard
- `docs/Secciones detalladas/segments-rules-schema.md` - JSON schema de reglas de segmentos

### 11.2. Convención de subplanes

Al generar subplanes específicos (próximo paso), crear:

- `docs/planes/plan-cartera-empresas.md`
- `docs/planes/plan-cartera-contactos.md`
- `docs/planes/plan-cartera-facturas.md`
- `docs/planes/plan-cartera-segmentos.md`
- `docs/planes/plan-cartera-import-wizard.md`

Cada subplan debe seguir estructura:

1. Objetivo y alcance
2. Vistas y UX
3. Reglas y validaciones
4. Datos y migraciones
5. Acciones y flujos
6. Criterios de aceptación
7. Telemetría
8. QA/DoD
9. Riesgos/edge cases

---

## 12. Stack y Herramientas

### 12.1. Frontend

- **Next.js** (App Router) - rutas en `src/app/(app)/portfolio/*`
- **React Server Components** - para data fetching inicial
- **shadcn/ui** - componentes base (Table, Button, Sheet, Dialog, Select, etc.)
- **Tailwind CSS** - estilos
- **React Hook Form** + **Zod** - formularios con validación
- **TanStack Table** - tablas complejas con sorting/filtering
- **Recharts** (opcional) - gráficos en reportes

### 12.2. Backend

- **Prisma** - ORM para queries y migraciones
- **Supabase PostgreSQL** - base de datos
- **API Routes** - endpoints en `src/app/api/*`
- **Server Actions** - para mutations simples desde Server Components

### 12.3. Integraciones y MCPs

- **Supabase MCP** - gestión de BD, queries directas
- **Sentry MCP** - telemetría, logs, errores
- **Vercel MCP** - deploy, variables de entorno
- **Context7 MCP** - documentación de librerías (shadcn, Prisma, etc.)
- **shadcn MCP** - generación/búsqueda de componentes UI

### 12.4. Testing

- **Playwright** - E2E tests (ejecutar en Fase 6)
- **Vitest** - unit tests de servicios y dominio (opcional en v1)
- Seeds - `prisma/seed-cartera.ts`

---

## 13. Estimación Total

| Fase | Días | Complejidad |

|------|------|-------------|

| F1: Empresas | 3-4 | Media |

| F2: Contactos | 3-4 | Media |

| F3: Facturas | 5-6 | Alta |

| F4: Segmentos | 3-4 | Media |

| F5: Import Wizard | 5-6 | Alta |

| F6: Integración y QA | 3-4 | Media |

| **TOTAL** | **22-28 días** | Sprint de ~4-6 semanas |

**Notas**:

- Estimación asume un desarrollador full-time
- Incluye tiempo de testing y refinamiento
- No incluye revisiones de código extensivas (asumir CI/CD básico)

---

## 14. Próximos Pasos

1. **Revisar y aprobar este plan general** con stakeholders
2. **Generar subplanes específicos** usando plantilla de §4:

   - `plan-cartera-empresas.md`
   - `plan-cartera-contactos.md`
   - `plan-cartera-facturas.md`
   - `plan-cartera-segmentos.md`
   - `plan-cartera-import-wizard.md`

3. **Ejecutar Fase 1** (Empresas) según subplan
4. **Iterar fases 2-6** secuencialmente
5. **Demo de Cartera completo** al finalizar Fase 6

---

## 15. Notas Finales

- Este plan asume que **auth y org switcher ya funcionan** (no se tocan)
- El modelo de datos (Prisma schema) **ya está completo** según Fase 2 de layout-navui.md
- Las rutas base **ya existen** pero necesitan implementación completa
- Import Wizard es el componente más complejo - reservar tiempo extra si hay blockers
- Performance se valida en Fase 6 - no optimizar prematuramente
- Documentación se actualiza al finalizar cada fase