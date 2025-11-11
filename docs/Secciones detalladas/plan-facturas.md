# Plan Específico: Facturas (Invoice) — Cartera v1

## 1. Resumen y Alcance

### 1.1. Qué SÍ entra

- Lista de Facturas (`/portfolio/invoices`) con:
  - Paginación server-side (10/25/50/100 filas por página)
  - Búsqueda por número de factura, empresa, rango de fechas, monto
  - Filtros avanzados persistentes: estado, fecha esperada, empresa, moneda, origen de fecha
  - Chips de filtro rápido: Sin fecha, Con fecha, Vencen hoy, Vencidas, Con promesa hoy, Promesa incumplida, Disputa, Pagadas
  - Ordenación por columnas (vencimiento DEFAULT, monto, fecha esperada, estado, empresa)
  - Bulk actions: editar fecha esperada masivamente, registrar promesa, marcar como pagada, marcar como disputa, posponer próxima acción
- CRUD completo:
  - Crear nueva factura (formulario modal con validaciones)
  - Editar inline seguro: fecha esperada, origen de fecha, promesa, estado, notas (según RBAC)
  - Editar completo: formulario para todos los campos (monto/moneda solo Admin)
  - Archivar/cancelar factura (con confirmación)
  - NO eliminar físicamente (solo cancelar)
- Campos esenciales (ya existen en schema):
  - Core: organizationId, customerCompanyId, number, description, issueDate, dueDate, amount, currency, status
  - Seguimiento: expectedPaymentDate, dateOrigin, paymentPromiseDate, nextActionAt, lastChannel, lastResult, notes
  - Auditoría: createdAt, updatedAt
- Cálculos derivados (UI + lógica):
  - Días a vencimiento: `dueDate - TODAY` (positivo: faltan N días; negativo: N días de mora)
  - Días de mora: `TODAY - dueDate` (si vencida)
  - Estado de seguimiento: próxima acción programada para `nextActionAt` (formato relativo: "en 2 días", "hace 3 días")
  - Estatus visual: sin_fecha, con_fecha, vence_hoy, vencida, con_promesa_hoy, promesa_incumplida, disputa, pagada
- Ficha 360° de Factura (Drawer desde derecha):
  - **Datos principales**: número, empresa (link), monto, moneda, fechas (emisión, vencimiento, esperada, promesa), estado, origen de fecha
  - **Cálculos**: días de mora, días a vencimiento, último canal, último resultado
  - **Timeline/Hilo básico**: log de cambios de fecha, cambios de estado, comunicaciones (preview si existen en CommunicationAttempt)
  - **Notas internas**: editable con save
  - **Enlaces**: empresa (navegar a ficha 360° de empresa), contacto primario (si existe), historial de fechas (InvoiceDateHistory)
  - **Acciones**: editar completo, marcar pagada, marcar disputa, cancelar, registrar promesa, posponer próxima acción
- Validaciones robustas:
  - Unicidad: organizationId + number (ya existe unique constraint)
  - Monto: positivo, precisión 2 decimales
  - Moneda: ISO 4217 (USD, CLP, MXN, ARS, COP, etc.)
  - Fechas: issueDate <= dueDate; expectedPaymentDate >= issueDate; paymentPromiseDate >= TODAY
  - Estado: transiciones válidas (ver §6)
  - Empresa: debe existir y estar activa
- Estados vacíos y de error:
  - Empty state con CTA para importar o crear
  - Error states con opción de reintentar
  - Loading states (skeleton loaders)
- Integración con Import Wizard:
  - Mapping de columnas CSV → Invoice
  - Validaciones pre-import (empresa existe, número único, monto válido, fechas válidas, moneda ISO)
  - Manejo de duplicados por política de unicidad (organizationId + number): skip o update
  - Preview de primeras 10 filas
  - Reporte de errores descargable
- Telemetría mínima (Sentry):
  - Eventos de creación, edición, cambio de estado, cambio de fechas, bulk actions, import
- RBAC básico:
  - Admin: todos los permisos (incluye editar monto/moneda)
  - Operador: crear, editar fechas/estado/notas (NO editar monto/moneda)
  - Auditor: solo lectura

### 1.2. Qué NO entra

- CRUD completo de líneas de factura (InvoiceItem) - futuro
- Conciliación bancaria automática - futuro
- Builder de flujos de cobranza - sprint Agente
- Integraciones ERP externas (Xero, QuickBooks) - futuro
- Timeline completo de comunicaciones (solo preview básico)
- Adjuntos de comprobantes (attachments) - futuro
- Multi-moneda avanzada con conversión automática - futuro
- Cuotas (Installments) - referencia básica, no CRUD completo en este sprint

### 1.3. Estado actual verificado

- ✅ Modelo `Invoice` existe en Prisma schema (líneas 217-254)
- ✅ Campos extendidos ya implementados: expectedPaymentDate, dateOrigin, paymentPromiseDate, nextActionAt, lastChannel, lastResult
- ✅ Tabla `InvoiceDateHistory` existe para auditoría
- ✅ Enums existen: InvoiceStatus, DateOrigin
- ✅ Índices básicos existen: organizationId, customerCompanyId, status, expectedPaymentDate, nextActionAt, dateOrigin
- ✅ Unique constraint: [organizationId, number]
- ✅ Página básica existe: `/portfolio/invoices/page.tsx`
- ✅ Componente básico existe: `src/components/invoices/invoice-table.tsx`
- ✅ Servicios base existen: `invoicesService` con métodos básicos
- ❌ Faltan columnas extendidas en tabla UI (expectedPaymentDate, dateOrigin, nextActionAt, cálculos)
- ❌ Faltan filtros funcionales (chips son mock)
- ❌ Faltan acciones inline (edición de fechas)
- ❌ Faltan bulk actions reales
- ❌ Falta ficha 360° con drawer
- ❌ Falta integración con Import Wizard
- ❌ Faltan cálculos derivados (días de mora, estado de seguimiento)

**Conclusión**: Hay base funcional pero muy limitada. Necesita expansión significativa en UI, validaciones, lógica de negocio y bulk actions.

---

## 2. UI/UX de Facturas (Post-login)

### 2.1. Ubicación y navegación

**Ruta principal**: `/portfolio/invoices`

**Acceso desde sidebar** (ya configurado):

- Sección "Cartera" → submenu "Facturas"

**Breadcrumbs**:

- Home / Cartera / Facturas
- Home / Cartera / Facturas / [Número factura]

### 2.2. Vista de lista (`/portfolio/invoices`)

#### Header

```
┌─────────────────────────────────────────────────────────────────┐
│ Facturas                                         [Importar] [+]  │
│ Gestiona facturas y seguimiento de cobranzas                     │
└─────────────────────────────────────────────────────────────────┘
```

#### Chips de filtro rápido

```
[Sin fecha: 12] [Con fecha: 45] [Vencen hoy: 5] [Vencidas: 23] [Con promesa hoy: 3] [Promesa incumplida: 8] [Disputa: 2] [Pagadas: 67]
```

#### Toolbar

```
┌─────────────────────────────────────────────────────────────────┐
│ [🔍 Buscar por número, empresa...]  [Filtros avanzados ▼]       │
│ [Empresa: Todas ▼] [Moneda: Todas ▼] [Estado: Todos ▼]         │
└─────────────────────────────────────────────────────────────────┘
```

#### Tabla

**Columnas**:

1. **Checkbox** (para bulk selection)
2. **Empresa** (link a empresa, bold)
3. **Número** (link a ficha 360°)
4. **Monto** (con moneda, ej: "$5,000 USD")
5. **Emisión** (formato: "15 ene 2025")
6. **Vencimiento** (formato: "25 ene 2025")
7. **Fecha esperada** (con origen badge: C=Cargada, S=Solicitada, ✓=Confirmada)
8. **Promesa** (fecha si existe, "-" si no)
9. **Estado** (Badge: PENDING=amarillo, OVERDUE=rojo, PAID=verde, CANCELLED=gris)
10. **Días** (cálculo: "-5" si vencida, "+3" si faltan 3 días, "Hoy" si vence hoy)
11. **Próxima acción** (formato relativo: "en 2 días", "hace 1 día", "-" si no programada)
12. **Último canal** (Icon: email/WhatsApp/teléfono, "-" si ninguno)
13. **Acciones** (dropdown: Ver, Editar fecha, Marcar pagada, Disputar)

**Comportamiento**:

- Click en empresa → navegar a vista 360° de empresa
- Click en número → abrir ficha/drawer 360° de factura
- Click en checkbox → seleccionar para bulk actions
- Hover en fila → highlight sutil
- Ordenación por columna (default: vencimiento ASC)
- Inline edit en columna "Fecha esperada": click abre datepicker + selector de origen

#### Bulk Actions Toolbar (aparece al seleccionar)

```
┌─────────────────────────────────────────────────────────────────┐
│ ✓ 5 seleccionadas  [Editar fecha esperada] [Registrar promesa]  │
│                    [Marcar pagada] [Disputar] [Posponer] [✕]    │
└─────────────────────────────────────────────────────────────────┘
```

#### Paginación (footer)

```
┌─────────────────────────────────────────────────────────────────┐
│ Mostrando 1-25 de 523 facturas      [10▼] [← 1 2 3 ... 21 →]   │
└─────────────────────────────────────────────────────────────────┘
```

#### Estados especiales

**Empty state** (sin facturas):

```
┌─────────────────────────────────────────────────────────────────┐
│                     [Ilustración: documento vacío]               │
│                                                                   │
│                     No hay facturas                              │
│           Importa tu primera hoja o crea una factura             │
│                                                                   │
│                 [Importar CSV]  [Crear factura]                  │
└─────────────────────────────────────────────────────────────────┘
```

**Loading state**: Skeleton loaders para filas

**Error state**: Mensaje claro con botón "Reintentar"

### 2.3. Crear/Editar factura

**Trigger crear**: Modal con formulario

**Trigger editar**: Drawer/Modal desde fila o ficha 360°

**Formulario de creación/edición**:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Nueva Factura / Editar                        │
├─────────────────────────────────────────────────────────────────┤
│ Empresa * [Seleccionar empresa... ▼]                            │
│                                                                   │
│ Información básica                                               │
│ Número de factura * [___________________________]                │
│                     (único por organización)                     │
│ Descripción         [___________________________]                │
│                                                                   │
│ Montos                                                           │
│ Monto *             [___________________________]                │
│ Moneda *            [USD ▼] (ISO 4217)                           │
│                                                                   │
│ Fechas                                                           │
│ Fecha emisión *     [📅 15/01/2025]                              │
│ Fecha vencimiento * [📅 25/01/2025]                              │
│ Fecha esperada pago [📅 20/01/2025] (opcional)                   │
│ Origen fecha        [Cargada ▼] C/Solicitada/Confirmada         │
│                                                                   │
│ Estado                                                           │
│ Estado inicial      [PENDING ▼] PENDING/DRAFT                   │
│                                                                   │
│ Notas internas                                                   │
│ [_________________________________________]                      │
│ [                                         ]                      │
│                                                                   │
│                          [Cancelar] [Guardar]                    │
└─────────────────────────────────────────────────────────────────┘
```

**Validaciones**:

- Empresa: requerida (select de empresas activas)
- Número: requerido, único por organización, alfanumérico
- Monto: requerido, positivo, max 2 decimales
- Moneda: requerida, ISO 4217 (select con lista común: USD, CLP, MXN, ARS, COP, EUR, etc.)
- Fecha emisión: requerida, <= vencimiento
- Fecha vencimiento: requerida, >= emisión
- Fecha esperada: opcional, >= emisión si presente
- Origen fecha: requerido si fecha esperada presente

### 2.4. Edición inline de fecha esperada

**Trigger**: Click en celda "Fecha esperada" en tabla

**UI**: Popover con datepicker + selector de origen

```
┌─────────────────────────────────────┐
│ Fecha esperada de pago              │
│ [📅 Datepicker]                      │
│                                     │
│ Origen:                             │
│ ( ) Cargada                         │
│ ( ) Solicitada por agente           │
│ (●) Confirmada por cliente          │
│                                     │
│ Razón (opcional):                   │
│ [Cliente confirmó por WhatsApp]     │
│                                     │
│          [Cancelar] [Guardar]       │
└─────────────────────────────────────┘
```

**Comportamiento**:

- Al guardar: actualiza Invoice.expectedPaymentDate, dateOrigin
- Registra en InvoiceDateHistory: previousDate, newDate, reason, changedBy, createdAt
- Recalcula nextActionAt según reglas de negocio
- Muestra toast: "Fecha actualizada correctamente"

### 2.5. Ficha/Drawer 360° de Factura

**Trigger**: Click en número de factura en tabla

**Layout** (Sheet/Drawer deslizable desde derecha):

```
┌─────────────────────────────────────────────────────────────────┐
│ ✕ Cerrar                                                    [Edit]│
│                                                                   │
│ Factura #F-2025-001                                              │
│ [Badge: OVERDUE]  [Badge: 5 días de mora]                       │
│ [Acme Corporation →]  •  $5,000 USD                              │
│                                                                   │
│ [Datos] [Timeline] [Historial de fechas]                        │
├─────────────────────────────────────────────────────────────────┤
│ [TAB: Datos]                                                     │
│                                                                   │
│ Información básica                                               │
│ Empresa:         [Acme Corporation →]                            │
│ Número:          #F-2025-001                                     │
│ Descripción:     Servicios de consultoría enero 2025            │
│ Monto:           $5,000 USD                                      │
│                                                                   │
│ Fechas                                                           │
│ Emisión:         15 enero 2025                                   │
│ Vencimiento:     25 enero 2025  (hace 5 días - VENCIDA)         │
│ Fecha esperada:  20 enero 2025  [Badge: ✓ Confirmada]           │
│ Promesa de pago: 30 enero 2025  [Badge: Pendiente]              │
│                                                                   │
│ Seguimiento                                                      │
│ Próxima acción:  En 2 días (01 feb 2025)                        │
│ Último canal:    WhatsApp                                        │
│ Último resultado: Cliente confirmó pago para el 30/01           │
│                                                                   │
│ Contacto principal                                               │
│ [Juan Pérez →]  •  Billing/AP  •  juan@acme.com                │
│                                                                   │
│ Notas internas                                                   │
│ [Textarea editable con botón "Guardar"]                          │
│                                                                   │
│ [TAB: Timeline]                                                  │
│                                                                   │
│ Actividad reciente                                               │
│ ┌───────────────────────────────────────────────────────────────┐│
│ │ [WhatsApp] Recordatorio enviado • hace 2 días                 ││
│ │ Cliente respondió: "Pago el 30/01"                           ││
│ ├───────────────────────────────────────────────────────────────┤│
│ │ [Email] Solicitud de fecha enviada • hace 5 días             ││
│ ├───────────────────────────────────────────────────────────────┤│
│ │ [Sistema] Fecha esperada actualizada • hace 6 días           ││
│ │ Anterior: 18/01 → Nueva: 20/01 (Solicitada por agente)      ││
│ └───────────────────────────────────────────────────────────────┘│
│                                                                   │
│ [TAB: Historial de fechas]                                       │
│                                                                   │
│ Cambios de fecha esperada                                        │
│ ┌────────┬─────────────┬─────────────┬──────────┬──────────────┐│
│ │ Fecha  │ Anterior    │ Nueva       │ Origen   │ Razón        ││
│ ├────────┼─────────────┼─────────────┼──────────┼──────────────┤│
│ │ 20 ene │ 18/01/2025  │ 20/01/2025  │ Solicit. │ Agente req.  ││
│ │ 15 ene │ -           │ 18/01/2025  │ Cargada  │ Import CSV   ││
│ └────────┴─────────────┴─────────────┴──────────┴──────────────┘│
│                                                                   │
│ Metadata                                                         │
│ Creada:          15 de enero de 2025                             │
│ Última actualización: 30 de enero de 2025                        │
│                                                                   │
│ Acciones                                                         │
│ [Editar completo] [Registrar promesa] [Marcar pagada]           │
│ [Disputar] [Cancelar factura]                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Reglas y Validaciones

### 3.1. Validaciones de formulario

**Empresa** (required):

- Select obligatorio de empresas activas de la organización
- Mensaje: "Debe seleccionar una empresa"

**Número de factura** (required):

- Min: 1 carácter
- Max: 50 caracteres
- Alfanumérico, guiones y guiones bajos permitidos
- Único por organización (unique constraint)
- Mensaje: "El número de factura es requerido"
- Mensaje duplicado: "Ya existe una factura con este número en tu organización"

**Monto** (required):

- Positivo (> 0)
- Max 2 decimales
- Rango: 0.01 - 999,999,999.99
- Mensaje: "El monto debe ser mayor a cero"
- Mensaje formato: "El monto debe tener máximo 2 decimales"

**Moneda** (required):

- ISO 4217 (USD, CLP, MXN, ARS, COP, EUR, GBP, BRL, PEN, etc.)
- Select con lista común (top 20 monedas de LATAM + principales internacionales)
- Default: moneda de la organización (defaultCurrency) o "USD"
- Mensaje: "Debe seleccionar una moneda"

**Fecha de emisión** (required):

- Formato: YYYY-MM-DD
- Validación: <= fecha vencimiento
- Mensaje: "La fecha de emisión es requerida"
- Mensaje consistencia: "La fecha de emisión debe ser anterior o igual a la fecha de vencimiento"

**Fecha de vencimiento** (required):

- Formato: YYYY-MM-DD
- Validación: >= fecha emisión
- Mensaje: "La fecha de vencimiento es requerida"
- Mensaje consistencia: "La fecha de vencimiento debe ser posterior o igual a la fecha de emisión"

**Fecha esperada de pago** (optional):

- Formato: YYYY-MM-DD
- Validación: >= fecha emisión si presente
- Si presente, origen de fecha requerido
- Mensaje: "La fecha esperada debe ser posterior o igual a la fecha de emisión"

**Origen de fecha** (required si expectedPaymentDate presente):

- Enum: LOADED, REQUESTED_BY_AGENT, CONFIRMED_BY_CLIENT
- Mensaje: "Debe seleccionar el origen de la fecha esperada"

**Promesa de pago** (optional):

- Formato: YYYY-MM-DD
- Validación: >= TODAY
- Mensaje: "La promesa de pago debe ser una fecha futura"

**Estado** (optional, default: PENDING):

- Enum: DRAFT, PENDING, PARTIALLY_PAID, PAID, OVERDUE, CANCELLED
- Validación de transiciones (ver §6)
- Mensaje transición inválida: "No se puede cambiar de [estado actual] a [estado nuevo]"

**Descripción** (optional):

- Max: 500 caracteres
- Textarea con contador

**Notas** (optional):

- Max: 2000 caracteres
- Textarea con contador

### 3.2. Reglas de negocio

**Multi-tenant**:

- TODAS las queries filtran por `organizationId`
- Facturas solo visibles de la organización activa del usuario

**Unicidad**:

- Constraint único: `[organizationId, number]` (ya existe en schema)
- Permitir números duplicados en diferentes organizaciones
- Mensaje: "Ya existe una factura con este número en tu organización"

**Precisión financiera**:

- Monto: tipo DECIMAL (precisión 18, escala 2) en BD
- Cálculos: usar librerías de precisión (Decimal.js o similar) para evitar errores de redondeo
- Mostrar: siempre 2 decimales en UI

**Cálculos derivados**:

**Días a vencimiento**:

```typescript
daysToDue = Math.floor((dueDate - TODAY) / (1000 * 60 * 60 * 24))
// Positivo: faltan N días
// Negativo: N días de mora
// Zero: vence hoy
```

**Días de mora**:

```typescript
daysOverdue = daysToDue < 0 ? Math.abs(daysToDue) : 0
```

**Estado de seguimiento** (para chip/badge):

```typescript
if (!expectedPaymentDate) return 'sin_fecha';
if (paymentPromiseDate && paymentPromiseDate === TODAY) return 'con_promesa_hoy';
if (paymentPromiseDate && paymentPromiseDate < TODAY) return 'promesa_incumplida';
if (dueDate === TODAY) return 'vence_hoy';
if (daysToDue < 0) return 'vencida';
if (status === 'PAID') return 'pagada';
if (status === 'CANCELLED') return 'cancelada';
if (expectedPaymentDate) return 'con_fecha';
return 'pendiente';
```

**Próxima acción** (nextActionAt):

- Calculado automáticamente al cambiar estado o fechas
- Reglas:
  - Si sin_fecha: nextActionAt = TODAY + 1 día (agente debe solicitar)
  - Si con_fecha y expectedPaymentDate > TODAY: nextActionAt = expectedPaymentDate - 1 día (recordatorio pre-pago)
  - Si vencida y sin promesa: nextActionAt = TODAY (acción inmediata)
  - Si promesa_activa: nextActionAt = paymentPromiseDate + 1 día (verificar cumplimiento)
  - Si pagada/cancelada: nextActionAt = null

**Estados y transiciones** (ver §6 para detalle):

- Validar transiciones permitidas
- Registrar cambio en timeline
- Recalcular nextActionAt

**Registro en InvoiceDateHistory**:

- Al cambiar expectedPaymentDate: crear registro con previousDate, newDate, reason, changedBy
- changedBy: userId del actor o "system" si automático

**Opt-out y contacto**:

- No enviar comunicaciones a contactos con opt-out activo (validación en sprint Agente)
- Respetar ventanas horarias de contacto

### 3.3. Validaciones de import

**Columnas requeridas**:

- `empresa_id` o `empresa_nombre` (lookup)
- `numero` (invoice number)
- `monto` (amount)
- `moneda` (currency)
- `fecha_emision` (issueDate)
- `fecha_vencimiento` (dueDate)

**Columnas opcionales**:

- `descripcion`, `description`
- `fecha_esperada_pago`, `expected_payment_date`
- `origen_fecha`, `date_origin` (LOADED, REQUESTED_BY_AGENT, CONFIRMED_BY_CLIENT)
- `promesa_pago`, `payment_promise_date`
- `estado`, `status` (PENDING, PAID, etc.)
- `notas`, `notes`

**Validaciones de fila**:

1. Empresa existe (lookup por ID o nombre)
2. Número no vacío y único por org
3. Monto positivo y numérico
4. Moneda en ISO 4217
5. Fechas válidas (formato ISO 8601: YYYY-MM-DD)
6. issueDate <= dueDate
7. expectedPaymentDate >= issueDate si presente
8. Estado en lista permitida si presente

**Manejo de duplicados**:

- Clave de upsert: `organizationId + number`
- Opción "Saltar" o "Actualizar"
- Si actualizar: solo campos no-críticos (descripción, notas, fecha esperada)
- NO actualizar: monto, moneda, fechas core (emisión, vencimiento)

**Reporte de errores**:

- CSV con filas fallidas y columna "Motivo error"
- Ejemplos:
  - "Fila 5: Número vacío"
  - "Fila 12: Empresa 'Acme' no encontrada"
  - "Fila 18: Monto inválido (debe ser numérico positivo)"
  - "Fila 23: Moneda 'XYZ' no es ISO 4217 válida"
  - "Fila 30: Número duplicado (existe factura ID abc123)"
  - "Fila 35: Fecha emisión posterior a vencimiento"

---

## 4. Datos y Migraciones

### 4.1. Modelo actual (ya existe, líneas 217-254 del schema)

**Campos actuales**:

```prisma
id, organizationId, customerCompanyId,
number, description,
issueDate, dueDate,
amount, currency, status,
notes, metadata,
expectedPaymentDate, dateOrigin,
paymentPromiseDate, nextActionAt,
lastChannel, lastResult,
createdAt, updatedAt
```

**Índices actuales**:

- `@@index([organizationId])`
- `@@index([customerCompanyId])`
- `@@index([status])`
- `@@index([expectedPaymentDate])`
- `@@index([nextActionAt])`
- `@@index([dateOrigin])`
- `@@unique([organizationId, number])`

**Relaciones actuales**:

- `organization Organization`
- `customerCompany CustomerCompany`
- `installments Installment[]`
- `payments Payment[]`
- `collectionCase CollectionCase?`
- `dateHistory InvoiceDateHistory[]`

### 4.2. Migraciones necesarias

**Evaluación**: Modelo actual está completo. NO se requieren cambios estructurales.

**Opcional: Índices compuestos para performance** (evaluar en QA con dataset 10k):

```prisma
@@index([organizationId, status, dueDate]) // para filtros "vencidas"
@@index([organizationId, status, expectedPaymentDate]) // para filtros "sin fecha"
@@index([organizationId, status, paymentPromiseDate]) // para filtros "promesas"
```

**Script de migración (opcional, solo si performance lo requiere)**:

```sql
-- Up
CREATE INDEX CONCURRENTLY invoices_org_status_due_idx 
ON invoices(organization_id, status, due_date);

CREATE INDEX CONCURRENTLY invoices_org_status_expected_idx 
ON invoices(organization_id, status, expected_payment_date);

CREATE INDEX CONCURRENTLY invoices_org_status_promise_idx 
ON invoices(organization_id, status, payment_promise_date);

-- Down
DROP INDEX invoices_org_status_promise_idx;
DROP INDEX invoices_org_status_expected_idx;
DROP INDEX invoices_org_status_due_idx;
```

**Decisión**: NO crear índices prematuramente. Medir queries lentas en QA con Sentry performance tracing.

### 4.3. Seeds de prueba

**Script**: `prisma/seeds/seed-invoices.ts`

**Dataset**:

- 500 facturas distribuidas en 50 empresas (5-15 por empresa)
- 100 sin fecha esperada (sin_fecha)
- 200 con fecha esperada (con_fecha)
- 50 vencen hoy (vence_hoy)
- 100 vencidas (vencida)
- 30 con promesa hoy (con_promesa_hoy)
- 20 con promesa incumplida (promesa_incumplida)
- 5 en disputa
- 200 pagadas
- Variedad de monedas: 70% USD, 15% CLP, 10% MXN, 5% ARS/COP/EUR
- Variedad de montos: $100 - $50,000
- Variedad de fechas: últimos 6 meses

---

## 5. Importación con Import Wizard

### 5.1. Flujo de import

**Steps del wizard**:

1. **Upload**: Drag & drop CSV/Excel
2. **Tipo**: Seleccionar "Facturas"
3. **Map**: Auto-mapear columnas
4. **Validate**: Ejecutar validaciones
5. **Preview**: Primeras 10 filas
6. **Import**: Progress bar, reporte final

### 5.2. Auto-mapping de columnas

```typescript
const columnMappings = {
  customerCompanyId: ['empresa_id', 'company_id', 'customer_id', 'client_id'],
  customerCompanyName: ['empresa', 'empresa_nombre', 'company', 'customer_name', 'client_name'],
  number: ['numero', 'number', 'factura', 'invoice', 'invoice_number', 'nro_factura'],
  description: ['descripcion', 'description', 'concepto', 'detalle'],
  amount: ['monto', 'amount', 'total', 'valor', 'importe'],
  currency: ['moneda', 'currency', 'divisa'],
  issueDate: ['fecha_emision', 'issue_date', 'fecha', 'date', 'emision'],
  dueDate: ['fecha_vencimiento', 'due_date', 'vencimiento', 'expiration'],
  expectedPaymentDate: ['fecha_esperada', 'expected_payment_date', 'expected_date', 'fecha_esperada_pago'],
  dateOrigin: ['origen_fecha', 'date_origin', 'origen'],
  paymentPromiseDate: ['promesa', 'promise', 'payment_promise_date', 'promesa_pago'],
  status: ['estado', 'status'],
  notes: ['notas', 'notes', 'observaciones', 'comentarios'],
};
```

### 5.3. Validaciones pre-import

1. **Empresa existe**: lookup por ID o nombre (fuzzy match 90%+)
2. **Número no vacío**
3. **Número único**: check contra BD por organizationId + number
4. **Monto positivo y numérico**
5. **Moneda ISO 4217**: validar contra lista oficial
6. **Fechas formato ISO**: YYYY-MM-DD o DD/MM/YYYY (parsear)
7. **Fechas consistentes**: issueDate <= dueDate; expectedPaymentDate >= issueDate
8. **Estado válido**: en enum si presente
9. **Origen fecha**: si expectedPaymentDate presente, origen requerido

**Resultado**:

```typescript
{
  valid: 480,
  invalid: 20,
  errors: [
    { row: 5, field: 'number', error: 'Número vacío' },
    { row: 12, field: 'customerCompanyName', error: 'Empresa "XYZ" no encontrada' },
    { row: 18, field: 'amount', error: 'Monto inválido (debe ser numérico positivo)' },
    { row: 23, field: 'currency', error: 'Moneda "ABC" no es ISO 4217 válida' },
    { row: 30, field: 'number', error: 'Número duplicado (existe ID abc123)' },
    { row: 35, field: 'issueDate', error: 'Fecha emisión posterior a vencimiento' },
  ]
}
```

### 5.4. Ejecución de import

**Idempotencia**:

- Clave de upsert: `organizationId + number`
- Opción "Saltar duplicados" o "Actualizar existentes"
- Si actualizar: solo campos no-críticos (descripción, notas, fecha esperada, origen)

**Código pseudo**:

```typescript
const importInvoices = async (rows, options) => {
  const results = { inserted: 0, updated: 0, errors: [] };
  
  for (const row of rows) {
    try {
      const company = await findCompanyByIdOrName(row.company);
      if (!company) {
        results.errors.push({ row, error: 'Empresa no encontrada' });
        continue;
      }
      
      const existing = await prisma.invoice.findUnique({
        where: {
          invoice_number_per_org: {
            organizationId,
            number: row.number,
          },
        },
      });
      
      if (existing) {
        if (options.mode === 'update') {
          await prisma.invoice.update({
            where: { id: existing.id },
            data: {
              description: row.description,
              notes: row.notes,
              expectedPaymentDate: row.expectedPaymentDate,
              dateOrigin: row.dateOrigin,
            },
          });
          results.updated++;
        }
      } else {
        await prisma.invoice.create({
          data: {
            ...row,
            organizationId,
            customerCompanyId: company.id,
            status: row.status || 'PENDING',
          },
        });
        results.inserted++;
      }
    } catch (error) {
      results.errors.push({ row, error: error.message });
    }
  }
  
  return results;
};
```

---

## 6. Estados y Transiciones

### 6.1. Estados de Invoice (enum InvoiceStatus)

- **DRAFT**: Borrador (no visible para agente)
- **PENDING**: Pendiente de pago (default)
- **PARTIALLY_PAID**: Parcialmente pagada (si hay pagos < monto)
- **PAID**: Pagada completamente
- **OVERDUE**: Vencida (calculado: dueDate < TODAY y status != PAID)
- **CANCELLED**: Cancelada (no se cobrará)

### 6.2. Estados derivados (UI, no en BD)

- **sin_fecha**: expectedPaymentDate IS NULL
- **con_fecha**: expectedPaymentDate IS NOT NULL
- **vence_hoy**: dueDate = TODAY
- **vencida**: dueDate < TODAY AND status != PAID
- **con_promesa_hoy**: paymentPromiseDate = TODAY
- **promesa_incumplida**: paymentPromiseDate < TODAY AND status != PAID
- **disputa**: (futuro: campo separado o en CollectionCase)

### 6.3. Transiciones permitidas

**Matriz de transiciones**:

```
        ┌───────┬─────────┬──────────────┬──────┬─────────┬───────────┐
        │ From  │ DRAFT   │ PENDING      │ PAID │ OVERDUE │ CANCELLED │
        ├───────┼─────────┼──────────────┼──────┼─────────┼───────────┤
        │ To    │         │              │      │         │           │
        ├───────┼─────────┼──────────────┼──────┼─────────┼───────────┤
DRAFT   │       │    -    │      ✓       │  ✓   │    ✗    │     ✓     │
PENDING │       │    ✓    │      -       │  ✓   │    ✓    │     ✓     │
PAID    │       │    ✓    │      ✓       │  -   │    ✓    │     ✗     │
OVERDUE │       │    ✗    │      ✓       │  ✓   │    -    │     ✓     │
CANCELLED│      │    ✓    │      ✓       │  ✗   │    ✓    │     -     │
        └───────┴─────────┴──────────────┴──────┴─────────┴───────────┘
```

**Reglas**:

- DRAFT → PENDING: publicar factura
- DRAFT → PAID: pago inmediato
- DRAFT → CANCELLED: descartar
- PENDING → PAID: pago completado
- PENDING → PARTIALLY_PAID: pago parcial
- PENDING → OVERDUE: fecha vencida (automático)
- PENDING → CANCELLED: cancelar
- PARTIALLY_PAID → PAID: completar pago
- PARTIALLY_PAID → OVERDUE: fecha vencida (automático)
- OVERDUE → PAID: pago tardío
- OVERDUE → CANCELLED: cancelar mora
- PAID → PENDING: reversión de pago (Admin only, con auditoría)
- CANCELLED: estado terminal (no reversible sin auditoría)

**Validación en backend**:

```typescript
const isValidTransition = (from: InvoiceStatus, to: InvoiceStatus): boolean => {
  const transitions = {
    DRAFT: ['PENDING', 'PAID', 'CANCELLED'],
    PENDING: ['PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED'],
    PARTIALLY_PAID: ['PAID', 'OVERDUE', 'CANCELLED'],
    OVERDUE: ['PAID', 'CANCELLED'],
    PAID: ['PENDING'], // solo Admin con auditoría
    CANCELLED: [], // terminal
  };
  return transitions[from]?.includes(to) ?? false;
};
```

### 6.4. Acciones al cambiar estado

**Al cambiar a PAID**:

- Registrar fecha de pago (Payment.paidAt = NOW)
- Opcional: solicitar referencia de pago (Payment.reference)
- nextActionAt = null
- Registrar en timeline: "Factura marcada como pagada por [usuario]"

**Al cambiar a CANCELLED**:

- Confirmar acción (modal)
- Solicitar motivo (notes)
- nextActionAt = null
- Bloquear comunicaciones automáticas
- Registrar en timeline: "Factura cancelada: [motivo]"

**Al cambiar expectedPaymentDate**:

- Crear registro en InvoiceDateHistory
- Recalcular nextActionAt
- Registrar en timeline: "Fecha esperada actualizada: [anterior] → [nueva] ([origen])"

**Al registrar promesa de pago**:

- Actualizar paymentPromiseDate
- Recalcular nextActionAt = paymentPromiseDate + 1 día
- Registrar en timeline: "Promesa de pago registrada para [fecha]"

---

## 7. Telemetría (Sentry)

### 7.1. Eventos a instrumentar

1. `ui.portfolio.invoices.list.loaded`

   - Context: `{ organizationId, count, filters, chips }`

2. `ui.portfolio.invoices.created`

   - Context: `{ organizationId, userId, invoiceId, customerCompanyId, amount, currency, status }`

3. `ui.portfolio.invoices.updated`

   - Context: `{ organizationId, userId, invoiceId, fieldsChanged }`

4. `ui.portfolio.invoices.status_changed`

   - Context: `{ organizationId, userId, invoiceId, previousStatus, newStatus }`

5. `ui.portfolio.invoices.expected_date.set`

   - Context: `{ organizationId, userId, invoiceId, previousDate, newDate, dateOrigin }`

6. `ui.portfolio.invoices.promise.set`

   - Context: `{ organizationId, userId, invoiceId, promiseDate }`

7. `ui.portfolio.invoices.marked_paid`

   - Context: `{ organizationId, userId, invoiceId, amount, currency, paymentReference? }`

8. `ui.portfolio.invoices.marked_disputed`

   - Context: `{ organizationId, userId, invoiceId, reason }`

9. `ui.portfolio.invoices.cancelled`

   - Context: `{ organizationId, userId, invoiceId, reason }`

10. `ui.portfolio.invoices.bulk_expected_dates.updated`

    - Context: `{ organizationId, userId, count, invoiceIds, newDate, dateOrigin }`

11. `ui.portfolio.invoices.bulk_promises.set`

    - Context: `{ organizationId, userId, count, invoiceIds, promiseDate }`

12. `ui.portfolio.invoices.bulk_marked_paid`

    - Context: `{ organizationId, userId, count, invoiceIds }`

13. `ui.portfolio.invoices.exported`

    - Context: `{ organizationId, userId, format: 'csv', count }`

14. `ui.portfolio.invoices.import.started`

    - Context: `{ organizationId, userId, rowCount }`

15. `ui.portfolio.invoices.import.completed`

    - Context: `{ organizationId, userId, inserted, updated, errors }`

16. `ui.portfolio.invoices.opened`

    - Context: `{ organizationId, userId, invoiceId }`

17. `ui.portfolio.invoices.search`

    - Context: `{ organizationId, query, resultsCount }`

### 7.2. Logging

```typescript
const { logger } = Sentry;

// Info
logger.info('Invoice created', { invoiceId, number, amount, currency });

// Warning
logger.warn('Duplicate invoice detected during import', { number, existingId });

// Error
logger.error('Failed to mark invoice as paid', { invoiceId, error });
```

---

## 8. RBAC (Control de acceso)

**Permisos por entidad**:

```typescript
const permissions = {
  'invoices:read': ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'],
  'invoices:create': ['OWNER', 'ADMIN', 'MEMBER'],
  'invoices:update': ['OWNER', 'ADMIN', 'MEMBER'],
  'invoices:update_amount': ['OWNER', 'ADMIN'], // solo Admin edita monto/moneda
  'invoices:update_status': ['OWNER', 'ADMIN', 'MEMBER'],
  'invoices:update_dates': ['OWNER', 'ADMIN', 'MEMBER'],
  'invoices:mark_paid': ['OWNER', 'ADMIN', 'MEMBER'],
  'invoices:cancel': ['OWNER', 'ADMIN'],
  'invoices:delete': ['OWNER'], // no usado en v1
  'invoices:import': ['OWNER', 'ADMIN', 'MEMBER'],
  'invoices:export': ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'],
};
```

**Implementación** (igual que Empresas/Contactos):

- Server-side: checks en servicios
- Client-side: ocultar botones según rol
- API routes: validar permisos, retornar 403 si no autorizado

**Ejemplo**:

```typescript
// Server-side
export async function updateInvoiceAmount(context, invoiceId, newAmount) {
  if (!hasPermission(context.membership.role, 'invoices:update_amount')) {
    throw new UnauthorizedError('No tienes permiso para editar montos');
  }
  // ...
}

// Client-side
const { membership } = useSession();
const canEditAmount = hasPermission(membership.role, 'invoices:update_amount');

return (
  <>
    {canEditAmount && (
      <Button onClick={handleEditAmount}>Editar monto</Button>
    )}
  </>
);
```

---

## 9. Criterios de Aceptación

### 9.1. Lista de facturas

- ✅ Lista carga en ≤2s con dataset de 10k facturas
- ✅ Paginación server-side funciona (10/25/50/100 filas)
- ✅ Búsqueda por número/empresa/rango de fechas encuentra resultados en ≤1s
- ✅ Filtros por estado, fecha esperada, empresa, moneda funcionan
- ✅ Chips de filtro rápido actualizan contadores dinámicamente
- ✅ Ordenación por columna funciona (default: vencimiento ASC)
- ✅ Bulk selection y bulk actions funcionan

### 9.2. CRUD de facturas

- ✅ Crear factura valida empresa, número, monto, moneda, fechas
- ✅ Crear factura valida unicidad por org+número
- ✅ Editar inline fecha esperada funciona con popover
- ✅ Editar completo permite cambiar campos editables según RBAC
- ✅ Cancelar factura requiere confirmación y motivo
- ✅ NO es posible eliminar factura (solo cancelar)

### 9.3. Cálculos derivados

- ✅ Días a vencimiento/días de mora se calculan correctamente
- ✅ Estado de seguimiento (chips) refleja estado real
- ✅ Próxima acción (nextActionAt) se calcula según reglas

### 9.4. Ficha/Drawer 360°

- ✅ Ficha carga en ≤1s
- ✅ Tabs funcionan (Datos, Timeline, Historial de fechas)
- ✅ Link a empresa navega correctamente
- ✅ Link a contacto primario funciona (si existe)
- ✅ Timeline muestra cambios de estado y fechas
- ✅ Historial de fechas muestra tabla completa de InvoiceDateHistory
- ✅ Notas internas editables con save

### 9.5. Bulk actions

- ✅ Editar fecha esperada masivamente funciona
- ✅ Registrar promesa masivamente funciona
- ✅ Marcar pagada masivamente funciona
- ✅ Marcar disputa masivamente funciona
- ✅ Confirmación modal antes de acción masiva

### 9.6. Import Wizard

- ✅ Upload acepta CSV y Excel
- ✅ Auto-mapping sugiere columnas con ≥80% similitud
- ✅ Validaciones detectan errores (empresa no existe, monto inválido, número duplicado, etc.)
- ✅ Preview muestra primeras 10 filas
- ✅ Import respeta opción (saltar/actualizar)
- ✅ Reporte final correcto
- ✅ CSV de errores descargable

### 9.7. Estados y transiciones

- ✅ Transiciones de estado validadas según matriz
- ✅ Cambio a PAID registra fecha de pago
- ✅ Cambio a CANCELLED requiere confirmación
- ✅ Reversión de PAID a PENDING solo para Admin
- ✅ nextActionAt se recalcula automáticamente

### 9.8. Multi-tenant y seguridad

- ✅ Todas las queries filtran por organizationId
- ✅ Usuario no puede ver/editar facturas de otra organización
- ✅ Número único por organización

### 9.9. RBAC

- ✅ Admin puede editar monto/moneda
- ✅ Operador NO puede editar monto/moneda
- ✅ Operador puede editar fechas/estado
- ✅ Auditor solo puede ver y exportar
- ✅ API routes validan permisos

### 9.10. Telemetría

- ✅ Eventos de creación, edición, cambio de estado registrados
- ✅ Evento de cambio de fecha con origen y razón
- ✅ Evento de bulk actions con count y IDs
- ✅ Evento de import con summary

---

## 10. QA / Definition of Done

### 10.1. Checklist funcional

- [ ] Lista de facturas carga sin errores
- [ ] Chips de filtro rápido funcionan y muestran contadores correctos
- [ ] Búsqueda funciona con número, empresa, rango de fechas
- [ ] Filtros se aplican correctamente
- [ ] Crear factura con datos válidos funciona
- [ ] Crear factura con número duplicado muestra error
- [ ] Crear factura con monto negativo muestra error
- [ ] Crear factura con moneda inválida muestra error
- [ ] Crear factura con issueDate > dueDate muestra error
- [ ] Editar inline fecha esperada funciona
- [ ] Bulk edit fecha esperada de 5 facturas funciona
- [ ] Registrar promesa de pago funciona
- [ ] Marcar como pagada requiere confirmación
- [ ] Cancelar factura requiere confirmación y motivo
- [ ] Ficha 360° muestra datos correctos en todos tabs
- [ ] Timeline muestra cambios de estado y fechas
- [ ] Historial de fechas muestra tabla completa
- [ ] Import CSV con 50 filas funciona
- [ ] Import CSV con errores muestra reporte
- [ ] Multi-tenant: user de org A no ve facturas de org B

### 10.2. Checklist de rendimiento

- [ ] Lista de 10k facturas carga en ≤2s
- [ ] Búsqueda con 10k facturas responde en ≤1s
- [ ] Crear factura responde en ≤500ms
- [ ] Editar inline fecha esperada responde en ≤300ms
- [ ] Ficha 360° carga en ≤1s
- [ ] Import de 100 facturas completa en ≤10s

### 10.3. Checklist de accesibilidad

- [ ] Navegación por teclado funciona
- [ ] Botones tienen aria-label
- [ ] Focus indicators visibles
- [ ] Mensajes de error se anuncian
- [ ] Color contrast WCAG AA

### 10.4. Casos de prueba

**Test 1: Crear factura básica**

1. Click "Nueva factura"
2. Seleccionar empresa: "Acme"
3. Número: "F-2025-001", Monto: "5000", Moneda: "USD", Emisión: "15/01/2025", Vencimiento: "25/01/2025"
4. Guardar
5. Verificar: aparece en lista

**Test 2: Validación de unicidad**

1. Crear factura A con número "F-001"
2. Intentar crear factura B con número "F-001" en misma org
3. Verificar: error "Número duplicado"

**Test 3: Validación de fechas**

1. Crear factura con emisión "30/01/2025" y vencimiento "20/01/2025"
2. Verificar: error "Fecha emisión posterior a vencimiento"

**Test 4: Edición inline fecha esperada**

1. Abrir lista de facturas
2. Click en celda "Fecha esperada" de factura sin fecha
3. Seleccionar fecha "20/01/2025" y origen "Confirmada por cliente"
4. Guardar
5. Verificar: fecha visible con badge "✓ Confirmada"

**Test 5: Bulk edit fecha esperada**

1. Seleccionar 3 facturas sin fecha
2. Click "Editar fecha esperada"
3. Seleccionar fecha "25/01/2025" y origen "Solicitada por agente"
4. Confirmar
5. Verificar: 3 facturas con fecha esperada actualizada

**Test 6: Registrar promesa de pago**

1. Abrir ficha 360° de factura
2. Click "Registrar promesa"
3. Seleccionar fecha "30/01/2025"
4. Guardar
5. Verificar: promesa visible en ficha y timeline actualizado

**Test 7: Marcar como pagada**

1. Abrir ficha 360° de factura
2. Click "Marcar pagada"
3. Opcional: ingresar referencia de pago
4. Confirmar
5. Verificar: estado cambia a PAID, badge verde, nextActionAt = null

**Test 8: Import CSV válido**

1. Preparar CSV con 10 facturas
2. Upload en Import Wizard
3. Mapear columnas
4. Verificar validaciones pasan
5. Importar
6. Verificar: 10 facturas nuevas en lista

**Test 9: Import CSV con errores**

1. Preparar CSV con 2 errores (número duplicado, monto inválido)
2. Upload
3. Verificar: validaciones detectan 2 errores
4. Descargar CSV de errores
5. Verificar: CSV tiene 2 filas con motivos

**Test 10: RBAC Operador no puede editar monto**

1. Login como Operador
2. Abrir factura
3. Intentar editar monto
4. Verificar: campo deshabilitado o error 403

---

## 11. Riesgos y Mitigaciones

### 11.1. Riesgo: Duplicados por número no normalizado

**Escenario**: Usuario crea "F-001", "f-001", "F 001" como distintas

**Mitigación**:

- Normalización en backend: trim, uppercase, remover espacios
- Comparación case-insensitive en unique constraint
- Advertir en UI: "Número normalizado: F-001"
- Loguear duplicados potenciales

### 11.2. Riesgo: Precisión financiera en cálculos

**Escenario**: Errores de redondeo en suma de pagos parciales

**Mitigación**:

- Usar DECIMAL en BD (no FLOAT)
- Usar librería Decimal.js en cálculos
- Mostrar siempre 2 decimales
- Tests unitarios de cálculos financieros

### 11.3. Riesgo: Fechas inconsistentes tras edición

**Escenario**: Usuario cambia vencimiento a fecha anterior a emisión

**Mitigación**:

- Validación client-side: bloquear fechas inválidas en datepicker
- Validación server-side: rechazar request con error 400
- Mensaje claro: "Fecha vencimiento debe ser >= fecha emisión"

### 11.4. Riesgo: Performance con 10k+ facturas

**Escenario**: Queries lentas en organizaciones grandes

**Mitigación**:

- Paginación server-side obligatoria
- Índices en columnas de filtro
- Debouncing en búsqueda (300ms)
- Limitar resultados de búsqueda a 100
- Monitoring con Sentry performance tracing
- Evaluar índices compuestos en QA

### 11.5. Riesgo: Bulk actions accidentales

**Escenario**: Usuario marca 100 facturas como pagadas por error

**Mitigación**:

- Confirmación modal: "Vas a marcar 100 facturas como pagadas"
- Mostrar primeras 10 facturas afectadas
- Registrar en AuditLog con detalles
- No permitir reversión masiva (solo individual por Admin)

### 11.6. Riesgo: Import masivo rompe performance

**Escenario**: Usuario importa 5k facturas de una vez

**Mitigación**:

- Límite de 1000 filas por import en v1
- Mensaje: "Para imports >1000, contacta soporte"
- Batch inserts de 100 filas
- Progress bar con cancelación (futuro)
- Job asíncrono para imports >500 (futuro)

### 11.7. Riesgo: Transiciones de estado inválidas

**Escenario**: Usuario intenta cambiar PAID a CANCELLED

**Mitigación**:

- Validación en backend: matriz de transiciones
- Bloqueo en UI: botones deshabilitados según estado
- Mensaje claro: "No se puede cancelar una factura pagada"
- Excepción: Admin con auditoría (futuro)

### 11.8. Riesgo: Multi-tenant leak

**Escenario**: Query sin filtro de organizationId expone facturas de otras orgs

**Mitigación**:

- TODOS los repositorios reciben context con organizationId
- Wrapper de Prisma que auto-agrega filtro (considerar)
- Tests de integración verifican aislamiento
- Code review exhaustivo de queries
- Sentry alert si query retorna datos sin org filter

---

## 12. Archivos a crear/modificar

### Nuevos archivos

**Páginas**:

- `src/app/(app)/portfolio/invoices/new/page.tsx` (formulario crear - si no es modal)
- `src/app/(app)/portfolio/invoices/[id]/page.tsx` (ficha completa - ya existe, expandir)

**Componentes**:

- `src/components/portfolio/invoices/invoice-form.tsx` (formulario crear/editar completo)
- `src/components/portfolio/invoices/invoice-filters.tsx` (filtros avanzados)
- `src/components/portfolio/invoices/invoice-drawer.tsx` (ficha 360° drawer)
- `src/components/portfolio/invoices/invoice-inline-date-edit.tsx` (popover edición inline)
- `src/components/portfolio/invoices/invoice-status-badge.tsx` (badge con lógica de estado derivado)
- `src/components/portfolio/invoices/invoice-bulk-actions.tsx` (toolbar bulk)
- `src/components/portfolio/invoices/invoice-mark-paid-dialog.tsx` (confirmación marcar pagada)
- `src/components/portfolio/invoices/invoice-cancel-dialog.tsx` (confirmación cancelar)
- `src/components/portfolio/invoices/invoice-promise-dialog.tsx` (registrar promesa)
- `src/components/portfolio/invoices/invoice-timeline.tsx` (timeline tab en drawer)
- `src/components/portfolio/invoices/invoice-date-history-table.tsx` (historial de fechas)

**Servicios**:

- Expandir `src/lib/services/invoices.ts`:
  - `searchInvoices`
  - `updateExpectedPaymentDate`
  - `recordPaymentPromise`
  - `markInvoiceAsPaid`
  - `markInvoiceAsDisputed`
  - `cancelInvoice`
  - `bulkUpdateExpectedDates`
  - `bulkMarkAsPaid`
  - `calculateNextActionAt`
  - `getInvoicesByChip` (sin_fecha, vencen_hoy, etc.)
  - `exportInvoicesCSV`

**Repositorios**:

- Expandir `src/lib/repositories/invoice-repository.ts`:
  - `findByNumber`
  - `findWithoutExpectedDate`
  - `findDueDateToday`
  - `findOverdue`
  - `findWithPromiseToday`
  - `findWithPromiseMissed`
  - `searchByNumberOrCompany`
  - `countByFilters`
  - `findWithRelations` (incluir empresa, contactos, dateHistory)

**Utils**:

- `src/lib/utils/invoice-calculations.ts` (cálculos derivados: días de mora, nextActionAt, estado derivado)
- `src/lib/utils/validation/invoice-validators.ts` (validación de monto, moneda, fechas, transiciones)
- `src/lib/utils/import/invoice-importer.ts` (lógica de import)
- `src/lib/utils/export/invoice-exporter.ts` (export CSV)

**API Routes**:

- `src/app/api/portfolio/invoices/route.ts` (GET list, POST create)
- `src/app/api/portfolio/invoices/[id]/route.ts` (GET detail, PATCH update, DELETE)
- `src/app/api/portfolio/invoices/[id]/expected-date/route.ts` (PATCH inline edit fecha esperada)
- `src/app/api/portfolio/invoices/[id]/promise/route.ts` (POST registrar promesa)
- `src/app/api/portfolio/invoices/[id]/mark-paid/route.ts` (POST marcar pagada)
- `src/app/api/portfolio/invoices/[id]/cancel/route.ts` (POST cancelar)
- `src/app/api/portfolio/invoices/bulk/expected-dates/route.ts` (PATCH bulk edit)
- `src/app/api/portfolio/invoices/bulk/mark-paid/route.ts` (POST bulk mark paid)
- `src/app/api/portfolio/invoices/export/route.ts` (GET export CSV)
- `src/app/api/portfolio/invoices/chips/route.ts` (GET contadores para chips)
- `src/app/api/import/invoices/validate/route.ts` (POST validate)
- `src/app/api/import/invoices/execute/route.ts` (POST execute)

**Seeds**:

- `prisma/seeds/seed-invoices.ts`

**Tests** (opcional en v1, pero documentar):

- `tests/integration/invoices.test.ts`
- `tests/e2e/invoices-flow.spec.ts` (Playwright)
- `tests/unit/invoice-calculations.test.ts` (cálculos derivados)

### Archivos a modificar

**Páginas existentes**:

- `src/app/(app)/portfolio/invoices/page.tsx` (expandir funcionalidad, conectar filtros reales)
- `src/app/(app)/invoices/[id]/page.tsx` (mejorar detalle o migrar a drawer)

**Componentes existentes**:

- `src/components/invoices/invoice-table.tsx` (agregar columnas extendidas, bulk selection, ordenación, inline edit)
- `src/components/invoices/invoice-detail.tsx` (mejorar o reemplazar con drawer)

**Schema**:

- `prisma/schema.prisma` (NO cambiar, ya completo - solo agregar índices opcionales si QA lo requiere)

**Documentación**:

- `docs/architecture.md` (actualizar sección Invoice con estados derivados y transiciones)
- `docs/overview.md` (mencionar gestión avanzada de fechas esperadas si relevante)

---

## 13. Estimación y Orden de Trabajo

### Estimación por tarea

| # | Tarea | Días | Complejidad |

|---|-------|------|-------------|

| 1 | Revisar código existente y plan general | 0.5 | Baja |

| 2 | Crear utils de cálculos derivados (días de mora, nextActionAt) | 1 | Media |

| 3 | Expandir repositorio (queries por chips, búsqueda) | 1 | Media |

| 4 | Expandir servicios de facturas (CRUD completo, bulk actions) | 2 | Alta |

| 5 | Crear API routes (CRUD + bulk + inline edit + export) | 2 | Alta |

| 6 | Implementar lista con columnas extendidas y filtros | 2 | Alta |

| 7 | Implementar chips de filtro rápido con contadores dinámicos | 1 | Media |

| 8 | Implementar búsqueda y paginación server | 1 | Media |

| 9 | Implementar formulario crear/editar completo | 1.5 | Media |

| 10 | Implementar edición inline de fecha esperada (popover) | 1 | Media |

| 11 | Implementar bulk actions (toolbar + dialogs) | 2 | Alta |

| 12 | Implementar ficha/drawer 360° (tabs: Datos, Timeline, Historial) | 2.5 | Alta |

| 13 | Implementar gestión de estados y transiciones | 1.5 | Media |

| 14 | Implementar marcar como pagada (dialog + validaciones) | 1 | Media |

| 15 | Implementar cancelar factura (dialog + confirmación) | 0.5 | Baja |

| 16 | Integrar Import Wizard (mapping, validaciones, preview) | 2 | Alta |

| 17 | Implementar exportación CSV | 0.5 | Baja |

| 18 | Instrumentar telemetría (Sentry) | 1 | Baja |

| 19 | Implementar RBAC (checks UI + backend) | 1 | Media |

| 20 | Estados vacíos y de error | 0.5 | Baja |

| 21 | QA manual (todos los casos de prueba) | 2 | Media |

| 22 | Testing de performance (10k facturas) | 1 | Media |

| 23 | Accesibilidad (keyboard nav, ARIA) | 1 | Media |

| 24 | Actualizar documentación | 0.5 | Baja |

| 25 | Seeds de prueba | 0.5 | Baja |

**TOTAL**: **29 días** (~5-6 semanas)

### Orden de ejecución

**Semana 1: Fundamentos y Backend**

1-5: Revisar, utils cálculos, repositorio, servicios, API routes

**Semana 2: UI Lista y Filtros**

6-8: Lista extendida, chips, búsqueda/paginación

**Semana 3: CRUD y Edición**

9-11: Formulario completo, inline edit, bulk actions

**Semana 4: Ficha 360° y Estados**

12-15: Drawer completo, estados/transiciones, marcar pagada, cancelar

**Semana 5: Features Avanzadas**

16-17: Import Wizard, export CSV

**Semana 6: Pulido y QA**

18-25: Telemetría, RBAC, estados, QA, performance, accesibilidad, docs, seeds

---

## 14. Próximos Pasos

1. ✅ Aprobar este plan
2. → Crear rama: `feature/cartera-facturas`
3. → Ejecutar tareas en orden sugerido
4. → Testing continuo durante desarrollo
5. → PR final con checklist de DoD
6. → Demo de funcionalidad completa
7. → Merge a `main`
8. → Inicio de Fase 4: Segmentos

---

## 15. Notas Finales

### Dependencias críticas

- ✅ Prisma schema Invoice ya existe y está completo
- ✅ Auth y org switcher funcionan
- ✅ Servicios base de invoices existen
- ✅ Plan de Empresas completado (para referencias)
- ✅ Plan de Contactos completado (para referencias)
- ❓ Import Wizard general existe? (verificar en BUILD MODE)

### Decisiones de diseño

- **Ficha 360°**: Drawer/Sheet (no página dedicada) para rapidez y consistencia con Contactos
- **Formulario crear**: Modal para rapidez
- **Edición inline**: Solo fecha esperada (popover); resto en formulario completo
- **Búsqueda**: ILIKE inicialmente, índice GIN solo si lento
- **Import**: Límite 1000 filas en v1
- **Eliminación**: NO permitida, solo cancelar (reversible con auditoría)
- **Índices compuestos**: NO crear prematuramente, evaluar en QA con dataset 10k

### Alineación con plan general

Este plan implementa **Fase 3: Facturas** del plan general (`plan-general-cartera.md`).

Cumple con:

- ✅ Tabla paginada con filtros avanzados y chips
- ✅ CRUD completo
- ✅ Gestión de fecha esperada con origen e historial
- ✅ Gestión de promesas de pago
- ✅ Bulk edit de fechas
- ✅ Ficha 360° con drawer y timeline
- ✅ Bulk actions completas
- ✅ Import Wizard integrado
- ✅ Cálculos derivados (días de mora, nextActionAt)
- ✅ Telemetría
- ✅ RBAC

Siguiente fase: **Fase 4: Segmentos** (plan separado)