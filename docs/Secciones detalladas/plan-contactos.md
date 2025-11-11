# Plan Específico: Contactos (Contact) — Cartera v1

## 1. Resumen y Alcance

### 1.1. Qué SÍ entra

- Lista de Contactos (`/portfolio/contacts`) con:
  - Paginación server-side (10/25/50/100 filas por página)
  - Búsqueda por nombre, email, teléfono, empresa (fuzzy)
  - Filtros avanzados: por empresa, con/sin WhatsApp, con/sin email, opt-out, canal preferido, rol, idioma, zona horaria, contactabilidad
  - Ordenación por columnas (nombre, empresa, última interacción)
  - Bulk actions: cambiar opt-out, exportar CSV
- CRUD completo:
  - Crear nuevo contacto (formulario modal con validaciones)
  - Editar contacto (inline seguro + formulario completo)
  - Eliminar contacto (con confirmación)
  - Asociación obligatoria a Empresa existente
- Campos extendidos:
  - **Rol del contacto**: Billing/AP, Operaciones, Decisor, Otro (custom)
  - **Preferencias de canal**: email, WhatsApp, SMS, teléfono (prioridad)
  - **Estado de canales**: email (entregable/bounce/desconocido), WhatsApp (validado/no_validado/desconocido/bloqueado)
  - **Opt-out por canal**: email y WhatsApp independientes con timestamps
  - **Idioma preferido**: ISO 639-1 (es, en, pt, etc.)
  - **Zona horaria**: IANA timezone (America/Santiago, America/Mexico_City, etc.)
  - **Ventanas horarias**: JSON con franjas (ej: 09:00-18:00, días 1-5)
  - **Contacto primario por empresa**: solo uno permitido (isPrimary)
  - **Contacto de facturación**: solo uno permitido (isBillingContact)
- Ficha/Drawer 360° del Contacto:
  - **Datos principales**: nombre, rol, empresa (link), posición
  - **Canales de comunicación**: email (con validación), teléfono, WhatsApp (con estado)
  - **Preferencias**: idioma, zona horaria, ventanas horarias, canal preferido
  - **Gestión de opt-out**: toggles por canal con timestamps
  - **Empresa asociada**: link a ficha de empresa, vista de facturas relacionadas (preview)
  - **Actividad reciente**: preview de comunicaciones (si existen)
- Validaciones robustas:
  - Email formato RFC 5322
  - Teléfono/WhatsApp en formato E.164 (+56912345678)
  - Al menos un canal de contacto requerido (email o teléfono/WhatsApp)
  - Unicidad: política por organización+empresa+email O organización+empresa+whatsapp
  - Ventanas horarias: JSON schema validation
  - Zona horaria: validación contra lista IANA
- Estados vacíos y de error:
  - Empty state con CTA para importar o crear
  - Error states con opción de reintentar
  - Loading states (skeleton loaders)
- Integración con Import Wizard:
  - Mapping de columnas CSV → Contact
  - Validaciones pre-import (formato, duplicados, empresa existente)
  - Manejo de duplicados por política de unicidad
  - Reporte de errores descargable
  - Preview de primeras 10 filas
- Telemetría mínima (Sentry):
  - Eventos de creación, edición, eliminación, bulk actions, opt-out, import
- RBAC básico:
  - Admin/Operador: crear, editar, eliminar
  - Auditor: solo lectura

### 1.2. Qué NO entra

- CRUD completo de Empresas/Facturas (solo referencias)
- Builder de flujos de comunicación (sprint Agente)
- Integraciones ERP/CRM externas
- Validación real de WhatsApp Business API (stub por ahora)
- Envío de mensajes de prueba (sprint Agente/Canales)
- Timeline completo de actividad (solo preview básico)
- Tags/categorías custom
- Campos dinámicos/metadata extensible

### 1.3. Estado actual verificado

- ✅ Modelo `Contact` existe en Prisma schema (líneas 169-199)
- ✅ Página básica existe: `/portfolio/contacts/page.tsx`
- ✅ Componente básico existe: `src/components/contacts/contact-table.tsx`
- ✅ Servicios base existen: `customersService` con `listContacts`, `getContact`, `createContact`, `updateContact`, `deleteContact`
- ❌ Faltan campos en modelo: `role`, `preferredChannel`, `emailStatus`, `whatsappStatus`, `isBillingContact`, opt-out por canal
- ❌ Faltan validaciones de formato (E.164, RFC 5322)
- ❌ Faltan filtros funcionales y búsqueda
- ❌ Falta ficha/drawer 360°
- ❌ Falta integración con Import Wizard

**Conclusión**: Hay base funcional pero muy limitada. Necesita expansión significativa en modelo, validaciones, UI y lógica de negocio.

---

## 2. UI/UX de Contactos (Post-login)

### 2.1. Ubicación y navegación

**Ruta principal**: `/portfolio/contacts`

**Acceso desde sidebar** (ya configurado):

- Sección "Cartera" → submenu "Contactos"

**Breadcrumbs**:

- Home / Cartera / Contactos
- Home / Cartera / Contactos / [Nombre contacto]

### 2.2. Vista de lista (`/portfolio/contacts`)

#### Header

```
┌─────────────────────────────────────────────────────────────────┐
│ Contactos                                        [Importar] [+]  │
│ Gestiona los contactos de tus clientes                           │
└─────────────────────────────────────────────────────────────────┘
```

#### Toolbar

```
┌─────────────────────────────────────────────────────────────────┐
│ [🔍 Buscar por nombre, email, teléfono...]  [Filtros ▼]         │
│ [Empresa: Todas ▼] [Canal: Todos ▼] [Opt-out: Todos ▼]         │
└─────────────────────────────────────────────────────────────────┘
```

#### Chips de filtro rápido

```
[Con WhatsApp] [Con Email] [Opt-out activo] [Contactos primarios] [Billing]
```

#### Tabla

**Columnas**:

1. **Checkbox** (para bulk selection)
2. **Nombre** (firstName + lastName, link a ficha)
3. **Empresa** (link a empresa)
4. **Rol** (Badge: Billing/AP, Operaciones, Decisor, Otro)
5. **Email** (icon + estado: ✓entregable, ⚠bounce, ?desconocido)
6. **Teléfono** (formato internacional)
7. **WhatsApp** (icon + estado: ✓validado, ?desconocido, ⊗bloqueado)
8. **Canal preferido** (Badge: email/whatsapp/teléfono)
9. **Idioma** (ISO code: ES, EN, PT)
10. **Opt-out** (Badge si activo en algún canal)
11. **Última interacción** (fecha relativa: "hace 2 días")
12. **Acciones** (dropdown: Ver, Editar, Eliminar)

**Comportamiento**:

- Click en nombre → abrir ficha/drawer 360°
- Click en empresa → navegar a vista 360° de empresa
- Click en checkbox → seleccionar para bulk actions
- Hover en fila → highlight sutil
- Ordenación por columna (nombre, empresa, última interacción)

#### Bulk Actions Toolbar (aparece al seleccionar)

```
┌─────────────────────────────────────────────────────────────────┐
│ ✓ 5 seleccionados    [Cambiar opt-out] [Exportar CSV] [Cancelar]│
└─────────────────────────────────────────────────────────────────┘
```

#### Paginación (footer)

```
┌─────────────────────────────────────────────────────────────────┐
│ Mostrando 1-25 de 347 contactos     [10▼] [← 1 2 3 ... 14 →]   │
└─────────────────────────────────────────────────────────────────┘
```

#### Estados especiales

**Empty state** (sin contactos):

```
┌─────────────────────────────────────────────────────────────────┐
│                     [Ilustración: agenda vacía]                  │
│                                                                   │
│                     No hay contactos                             │
│           Importa tu primera hoja o crea un contacto             │
│                                                                   │
│                 [Importar CSV]  [Crear contacto]                 │
└─────────────────────────────────────────────────────────────────┘
```

**Loading state**: Skeleton loaders para filas

**Error state**: Mensaje claro con botón "Reintentar"

### 2.3. Crear/Editar contacto

**Trigger crear**: Modal con formulario (preferido para rapidez)

**Trigger editar**: Drawer/Sheet desde fila o ficha 360°

**Formulario de creación/edición**:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Nuevo Contacto / Editar                       │
├─────────────────────────────────────────────────────────────────┤
│ Empresa * [Seleccionar empresa... ▼]                            │
│                                                                   │
│ Información básica                                               │
│ Nombre *         [___________________________]                   │
│ Apellido         [___________________________]                   │
│ Posición         [___________________________]                   │
│ Rol *            [Seleccionar rol... ▼]                          │
│   Opciones: Billing/AP, Operaciones, Decisor, Otro              │
│                                                                   │
│ Canales de comunicación (al menos uno requerido)                │
│ Email            [___________________________]                   │
│                  Estado: [✓ Entregable] (auto-detectado)        │
│ Teléfono         [___________________________]                   │
│                  Ej: +56912345678 (formato E.164)                │
│ WhatsApp         [___________________________]                   │
│                  Estado: [? Desconocido]                         │
│                                                                   │
│ Preferencias                                                     │
│ Canal preferido  [Seleccionar... ▼] Email/WhatsApp/Teléfono     │
│ Idioma           [Seleccionar... ▼] ES, EN, PT, etc.            │
│ Zona horaria     [Seleccionar... ▼] America/Santiago, etc.      │
│                                                                   │
│ Ventanas horarias                                                │
│ [Toggle: Configurar ventanas horarias]                           │
│   Horario inicio [09:00] Fin [18:00]                            │
│   Días: [L] [M] [X] [J] [V] [S] [D]                             │
│                                                                   │
│ Configuración especial                                           │
│ [✓] Contacto primario (solo uno por empresa)                    │
│ [✓] Contacto de facturación (solo uno por empresa)              │
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
- Nombre: requerido, min 2 caracteres
- Rol: requerido (select)
- Email: formato RFC 5322 si presente
- Teléfono/WhatsApp: formato E.164 si presente
- Al menos un canal requerido: email O teléfono O WhatsApp
- Zona horaria: validar contra lista IANA
- Ventanas horarias: validar JSON schema si activo
- Contacto primario: solo uno por empresa (validar en backend)
- Contacto de facturación: solo uno por empresa (validar en backend)

### 2.4. Ficha/Drawer 360° del Contacto

**Trigger**: Click en nombre en tabla o botón "Ver detalle"

**Layout** (Sheet/Drawer deslizable desde derecha):

```
┌─────────────────────────────────────────────────────────────────┐
│ ✕ Cerrar                                                    [Edit]│
│                                                                   │
│ Juan Pérez Gómez                                                 │
│ [Badge: Billing/AP] [Badge: Contacto primario]                  │
│ Operaciones Manager en [Acme Corporation →]                     │
│                                                                   │
│ [Datos] [Actividad] [Preferencias]                              │
├─────────────────────────────────────────────────────────────────┤
│ [TAB: Datos]                                                     │
│                                                                   │
│ Información de contacto                                          │
│ Email:     juan.perez@acme.com  [✓ Entregable]                  │
│ Teléfono:  +56 9 1234 5678                                       │
│ WhatsApp:  +56 9 1234 5678      [✓ Validado]                    │
│                                                                   │
│ Canal preferido:  [Badge: WhatsApp]                             │
│                                                                   │
│ Empresa                                                          │
│ [Acme Corporation →]                                             │
│ 12 facturas • $45,000 USD pendiente                              │
│                                                                   │
│ Opt-out y consentimientos                                        │
│ Email:     [Toggle OFF] Activo desde: -                          │
│ WhatsApp:  [Toggle OFF] Activo desde: -                          │
│                                                                   │
│ Notas internas                                                   │
│ [Textarea editable con botón "Guardar"]                          │
│                                                                   │
│ [TAB: Actividad]                                                 │
│                                                                   │
│ Comunicaciones recientes                                         │
│ ┌───────────────────────────────────────────────────────────────┐│
│ │ [WhatsApp] Recordatorio enviado • hace 2 días                 ││
│ │ [Email] Solicitud de fecha • hace 5 días                      ││
│ │ [WhatsApp] Confirmación de promesa • hace 10 días             ││
│ └───────────────────────────────────────────────────────────────┘│
│                                                                   │
│ [Ver timeline completo →]                                        │
│                                                                   │
│ [TAB: Preferencias]                                              │
│                                                                   │
│ Idioma preferido:  Español (ES)                                  │
│ Zona horaria:      America/Santiago (GMT-3)                      │
│                                                                   │
│ Ventanas horarias                                                │
│ Lunes a Viernes: 09:00 - 18:00                                  │
│                                                                   │
│ Horario local actual: 14:30 (zona horaria del contacto)         │
│                                                                   │
│ [Editar preferencias]                                            │
│                                                                   │
│ Metadata                                                         │
│ Creado:          15 de enero de 2025                             │
│ Última actualización: 20 de enero de 2025                        │
│                                                                   │
│ [Eliminar contacto]                                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Reglas y Validaciones

### 3.1. Validaciones de formulario

**Empresa** (required):

- Select obligatorio de empresas activas de la organización
- Mensaje: "Debe seleccionar una empresa"

**Nombre** (required):

- Min: 2 caracteres
- Max: 100 caracteres
- Mensaje: "El nombre debe tener al menos 2 caracteres"

**Rol** (required):

- Enum: BILLING_AP, OPERATIONS, DECISION_MAKER, OTHER
- Select obligatorio
- Mensaje: "Debe seleccionar un rol"

**Email** (optional pero con validación):

- Formato RFC 5322 (regex complejo o librería)
- Mensaje: "Email inválido (ej: usuario@dominio.com)"
- Auto-detección de estado: DELIVERABLE (default), BOUNCE (si falla envío), UNKNOWN

**Teléfono/WhatsApp** (optional pero con validación):

- Formato E.164: `+[código país][número]` (ej: +56912345678)
- Regex: `^\+[1-9]\d{1,14}$`
- Mensaje: "Teléfono inválido. Usar formato internacional: +56912345678"
- WhatsApp auto-detección de estado: NOT_VALIDATED (default), VALIDATED (tras primer envío exitoso), BLOCKED (si bloqueó), UNKNOWN

**Al menos un canal requerido**:

- Validación custom: email OR phoneNumber OR whatsappNumber debe estar presente
- Mensaje: "Debe proporcionar al menos un canal de contacto (email, teléfono o WhatsApp)"

**Canal preferido** (optional):

- Enum: EMAIL, WHATSAPP, SMS, PHONE
- Solo permitir seleccionar si el canal correspondiente existe
- Default: primer canal disponible

**Idioma** (optional):

- ISO 639-1 (es, en, pt, fr, it, de, etc.)
- Select con lista común (top 20 idiomas)
- Default: idioma de la organización o "es"

**Zona horaria** (optional):

- IANA timezone (America/Santiago, Europe/Madrid, etc.)
- Select con autocompletado
- Validación contra lista oficial IANA
- Mensaje: "Zona horaria inválida"

**Ventanas horarias** (optional):

- JSON schema: `{ start: "HH:mm", end: "HH:mm", days: number[] }`
- days: array de 1-7 (lunes=1, domingo=7)
- Validación: start < end, days válidos (1-7)
- Mensaje: "Ventana horaria inválida"

**Contacto primario** (optional boolean):

- Solo uno por empresa permitido
- Si se marca en nuevo contacto, desmarcar el anterior (backend automático)
- Mensaje si ya existe: "Ya existe un contacto primario. Se cambiará automáticamente al guardar."

**Contacto de facturación** (optional boolean):

- Solo uno por empresa permitido
- Lógica similar a primario
- Mensaje: "Ya existe un contacto de facturación. Se cambiará al guardar."

**Notas** (optional):

- Max: 2000 caracteres
- Textarea con contador

### 3.2. Reglas de negocio

**Multi-tenant**:

- TODAS las queries filtran por `organizationId`
- Contactos solo visibles de la organización activa del usuario

**Unicidad**:

- Política por organización: `organizationId + customerCompanyId + email` (si email presente)
- O `organizationId + customerCompanyId + whatsappNumber` (si WhatsApp presente)
- Índice único parcial en BD (solo si campo no nulo)
- Permitir duplicados en empresas diferentes de la misma org
- Mensaje: "Ya existe un contacto con este email/WhatsApp en esta empresa"

**Contacto primario**:

- Solo uno por empresa (isPrimary=true)
- Al marcar nuevo primario, desmarcar anterior automáticamente
- Query: `UPDATE contacts SET isPrimary=false WHERE customerCompanyId=X AND isPrimary=true AND id != Y`

**Contacto de facturación**:

- Solo uno por empresa (isBillingContact=true)
- Lógica similar a primario

**Opt-out por canal**:

- `optedOutEmail` y `optedOutWhatsapp` son independientes
- Timestamps: `optedOutEmailAt`, `optedOutWhatsappAt`
- Deprecar campo genérico `hasOptedOut` (migración: si true, marcar ambos canales)
- Regla: no enviar comunicaciones por canal con opt-out activo
- Mensaje UI: "Este contacto ha solicitado no recibir comunicaciones por [canal]"

**Estados de canal**:

- **emailStatus**: DELIVERABLE (default), BOUNCE (tras rebote), UNKNOWN
- **whatsappStatus**: NOT_VALIDATED (default), VALIDATED (tras envío exitoso), BLOCKED (si bloqueó), UNKNOWN
- Auto-actualización tras intentos de comunicación (futuro sprint Agente)

**Normalización**:

- Email: lowercase, trim
- Teléfono/WhatsApp: almacenar en formato E.164, mostrar con formato visual
- Nombre: capitalizar primera letra de cada palabra (opcional, para UI)

### 3.3. Validaciones de import

**Columnas requeridas**:

- `empresa_id` o `empresa_nombre` (lookup)
- `nombre` o `first_name`
- Al menos un canal: `email` OR `telefono` OR `whatsapp`

**Columnas opcionales**:

- `apellido`, `last_name`
- `posicion`, `position`
- `rol`, `role`
- `email`
- `telefono`, `phone`, `phone_number`
- `whatsapp`, `whatsapp_number`
- `canal_preferido`, `preferred_channel`
- `idioma`, `language`
- `zona_horaria`, `timezone`
- `opt_out_email`, `opt_out_whatsapp` (boolean)

**Validaciones de fila**:

1. Empresa existe (lookup por ID o nombre)
2. Nombre no vacío
3. Email formato válido si presente
4. Teléfono/WhatsApp formato E.164 si presente
5. Al menos un canal presente
6. Rol en lista permitida si presente
7. Idioma ISO 639-1 válido si presente
8. Zona horaria IANA válida si presente
9. Unicidad: email o WhatsApp no duplicado en misma empresa

**Manejo de duplicados**:

- Clave de upsert: `organizationId + customerCompanyId + (email OR whatsappNumber)`
- Opción "Actualizar" o "Saltar"
- Si email y WhatsApp ambos presentes y uno duplica, advertir y permitir elegir

**Reporte de errores**:

- CSV con filas fallidas y columna "Motivo error"
- Ejemplos:
  - "Fila 5: Nombre vacío"
  - "Fila 12: Empresa 'Acme' no encontrada"
  - "Fila 18: Email inválido"
  - "Fila 23: Contacto duplicado (existe ID abc123)"
  - "Fila 30: Formato de teléfono inválido (usar +56...)"

---

## 4. Datos y Migraciones

### 4.1. Modelo actual (líneas 169-199 del schema)

**Campos actuales**:

```prisma
id, organizationId, customerCompanyId,
firstName, lastName, email, phoneNumber, whatsappNumber,
position, notes, isPrimary,
language, timezone, workingHoursWindow,
hasOptedOut (genérico), consentDate,
createdAt, updatedAt
```

**Índices actuales**:

- `@@index([organizationId])`
- `@@index([customerCompanyId])`
- `@@index([email])`
- `@@index([hasOptedOut])`

### 4.2. Migraciones necesarias

**Migración 1: Agregar campos de canal y preferencias**

```prisma
model Contact {
  // ... campos existentes ...
  
  // Nuevos campos
  role                 ContactRole?            // BILLING_AP, OPERATIONS, DECISION_MAKER, OTHER
  preferredChannel     CommunicationChannel?   // EMAIL, WHATSAPP, SMS, PHONE
  emailStatus          EmailStatus             @default(UNKNOWN) // DELIVERABLE, BOUNCE, UNKNOWN
  whatsappStatus       WhatsAppStatus          @default(NOT_VALIDATED) // NOT_VALIDATED, VALIDATED, BLOCKED, UNKNOWN
  isBillingContact     Boolean                 @default(false)
  
  // Opt-out por canal (deprecar hasOptedOut)
  optedOutEmail        Boolean                 @default(false)
  optedOutEmailAt      DateTime?
  optedOutWhatsapp     Boolean                 @default(false)
  optedOutWhatsappAt   DateTime?
  
  // Índices adicionales
  @@index([organizationId, customerCompanyId, email]) // unicidad
  @@index([organizationId, customerCompanyId, whatsappNumber]) // unicidad
  @@index([role])
  @@index([preferredChannel])
  @@index([optedOutEmail])
  @@index([optedOutWhatsapp])
  @@index([isBillingContact])
}

enum ContactRole {
  BILLING_AP
  OPERATIONS
  DECISION_MAKER
  OTHER
}

enum EmailStatus {
  DELIVERABLE
  BOUNCE
  UNKNOWN
}

enum WhatsAppStatus {
  NOT_VALIDATED
  VALIDATED
  BLOCKED
  UNKNOWN
}
```

**Script de migración SQL**:

```sql
-- Up
ALTER TABLE contacts 
  ADD COLUMN role VARCHAR(50),
  ADD COLUMN preferred_channel VARCHAR(20),
  ADD COLUMN email_status VARCHAR(20) DEFAULT 'UNKNOWN',
  ADD COLUMN whatsapp_status VARCHAR(20) DEFAULT 'NOT_VALIDATED',
  ADD COLUMN is_billing_contact BOOLEAN DEFAULT false,
  ADD COLUMN opted_out_email BOOLEAN DEFAULT false,
  ADD COLUMN opted_out_email_at TIMESTAMPTZ,
  ADD COLUMN opted_out_whatsapp BOOLEAN DEFAULT false,
  ADD COLUMN opted_out_whatsapp_at TIMESTAMPTZ;

-- Crear índices
CREATE INDEX CONCURRENTLY contacts_role_idx ON contacts(role);
CREATE INDEX CONCURRENTLY contacts_preferred_channel_idx ON contacts(preferred_channel);
CREATE INDEX CONCURRENTLY contacts_opted_out_email_idx ON contacts(opted_out_email);
CREATE INDEX CONCURRENTLY contacts_opted_out_whatsapp_idx ON contacts(opted_out_whatsapp);
CREATE INDEX CONCURRENTLY contacts_is_billing_contact_idx ON contacts(is_billing_contact);
CREATE INDEX CONCURRENTLY contacts_org_company_email_idx ON contacts(organization_id, customer_company_id, email) WHERE email IS NOT NULL;
CREATE INDEX CONCURRENTLY contacts_org_company_whatsapp_idx ON contacts(organization_id, customer_company_id, whatsapp_number) WHERE whatsapp_number IS NOT NULL;

-- Down
DROP INDEX contacts_org_company_whatsapp_idx;
DROP INDEX contacts_org_company_email_idx;
DROP INDEX contacts_is_billing_contact_idx;
DROP INDEX contacts_opted_out_whatsapp_idx;
DROP INDEX contacts_opted_out_email_idx;
DROP INDEX contacts_preferred_channel_idx;
DROP INDEX contacts_role_idx;

ALTER TABLE contacts
  DROP COLUMN opted_out_whatsapp_at,
  DROP COLUMN opted_out_whatsapp,
  DROP COLUMN opted_out_email_at,
  DROP COLUMN opted_out_email,
  DROP COLUMN is_billing_contact,
  DROP COLUMN whatsapp_status,
  DROP COLUMN email_status,
  DROP COLUMN preferred_channel,
  DROP COLUMN role;
```

**Migración 2: Backfill de opt-out genérico a específico**

```sql
-- Migrar hasOptedOut=true a ambos canales
UPDATE contacts
SET 
  opted_out_email = true,
  opted_out_email_at = consent_date,
  opted_out_whatsapp = true,
  opted_out_whatsapp_at = consent_date
WHERE has_opted_out = true;
```

**Migración 3: Unique constraints parciales**

```sql
-- Unique constraint para email (solo si no nulo)
CREATE UNIQUE INDEX CONCURRENTLY contacts_org_company_email_unique 
ON contacts (organization_id, customer_company_id, email) 
WHERE email IS NOT NULL;

-- Unique constraint para WhatsApp (solo si no nulo)
CREATE UNIQUE INDEX CONCURRENTLY contacts_org_company_whatsapp_unique 
ON contacts (organization_id, customer_company_id, whatsapp_number) 
WHERE whatsapp_number IS NOT NULL;

-- Down
DROP INDEX contacts_org_company_whatsapp_unique;
DROP INDEX contacts_org_company_email_unique;
```

### 4.3. Seeds de prueba

**Script**: `prisma/seeds/seed-contacts.ts`

**Dataset**:

- 150 contactos distribuidos en 50 empresas (2-3 por empresa)
- 100 con email, 120 con WhatsApp, 80 con teléfono
- 50 contactos primarios (1 por empresa)
- 30 contactos de facturación
- Variedad de roles: 40% Billing/AP, 30% Operaciones, 20% Decisor, 10% Otro
- 20 con opt-out email, 10 con opt-out WhatsApp
- Variedad de idiomas (ES, EN, PT) y zonas horarias (America/Santiago, America/Mexico_City, America/Bogota, America/Buenos_Aires)
- 60 con ventanas horarias configuradas

---

## 5. Importación con Import Wizard

### 5.1. Flujo de import

**Steps del wizard**:

1. **Upload**: Drag & drop CSV/Excel
2. **Tipo**: Seleccionar "Contactos"
3. **Map**: Auto-mapear columnas
4. **Validate**: Ejecutar validaciones
5. **Preview**: Primeras 10 filas
6. **Import**: Progress bar, reporte final

### 5.2. Auto-mapping de columnas

```typescript
const columnMappings = {
  customerCompanyId: ['empresa_id', 'company_id', 'customer_id'],
  customerCompanyName: ['empresa', 'empresa_nombre', 'company', 'customer_name'],
  firstName: ['nombre', 'first_name', 'firstname', 'name'],
  lastName: ['apellido', 'last_name', 'lastname', 'surname'],
  email: ['email', 'correo', 'mail', 'e-mail'],
  phoneNumber: ['telefono', 'phone', 'phone_number', 'tel'],
  whatsappNumber: ['whatsapp', 'whatsapp_number', 'wa', 'whatsapp_num'],
  position: ['posicion', 'position', 'cargo', 'puesto'],
  role: ['rol', 'role', 'tipo'],
  preferredChannel: ['canal_preferido', 'preferred_channel', 'canal'],
  language: ['idioma', 'language', 'lang'],
  timezone: ['zona_horaria', 'timezone', 'tz'],
  optedOutEmail: ['opt_out_email', 'opted_out_email', 'no_email'],
  optedOutWhatsapp: ['opt_out_whatsapp', 'opted_out_whatsapp', 'no_whatsapp'],
};
```

### 5.3. Validaciones pre-import

1. **Empresa existe**: lookup por ID o nombre (fuzzy match 90%+)
2. **Nombre no vacío**
3. **Al menos un canal**: email OR phoneNumber OR whatsappNumber
4. **Email formato**: RFC 5322
5. **Teléfono/WhatsApp formato**: E.164
6. **Rol**: en lista permitida si presente
7. **Idioma**: ISO 639-1 válido si presente
8. **Zona horaria**: IANA válida si presente
9. **Duplicados**: check contra BD por email o WhatsApp en misma empresa

**Resultado**:

```typescript
{
  valid: 140,
  invalid: 10,
  errors: [
    { row: 5, field: 'firstName', error: 'Nombre vacío' },
    { row: 12, field: 'customerCompanyName', error: 'Empresa "XYZ" no encontrada' },
    { row: 18, field: 'email', error: 'Email inválido' },
    { row: 23, field: 'whatsappNumber', error: 'Formato E.164 inválido (usar +56...)' },
    { row: 30, field: 'email', error: 'Email duplicado en empresa (existe ID abc123)' },
  ]
}
```

### 5.4. Ejecución de import

**Idempotencia**:

- Clave de upsert: `organizationId + customerCompanyId + (email OR whatsappNumber)`
- Opción "Saltar duplicados" o "Actualizar existentes"

**Código pseudo**:

```typescript
const importContacts = async (rows, options) => {
  const results = { inserted: 0, updated: 0, errors: [] };
  
  for (const row of rows) {
    try {
      const company = await findCompanyByIdOrName(row.company);
      if (!company) {
        results.errors.push({ row, error: 'Empresa no encontrada' });
        continue;
      }
      
      const existing = await prisma.contact.findFirst({
        where: {
          organizationId,
          customerCompanyId: company.id,
          OR: [
            { email: row.email },
            { whatsappNumber: row.whatsappNumber },
          ],
        },
      });
      
      if (existing) {
        if (options.mode === 'update') {
          await prisma.contact.update({ where: { id: existing.id }, data: row });
          results.updated++;
        }
      } else {
        await prisma.contact.create({ data: { ...row, customerCompanyId: company.id } });
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

## 6. Telemetría (Sentry)

### 6.1. Eventos a instrumentar

1. `ui.portfolio.contacts.list.loaded`

   - Context: `{ organizationId, count, filters }`

2. `ui.portfolio.contacts.created`

   - Context: `{ organizationId, userId, contactId, customerCompanyId, role, channels: [email?, whatsapp?] }`

3. `ui.portfolio.contacts.updated`

   - Context: `{ organizationId, userId, contactId, fieldsChanged }`

4. `ui.portfolio.contacts.deleted`

   - Context: `{ organizationId, userId, contactId, customerCompanyId }`

5. `ui.portfolio.contacts.optout.changed`

   - Context: `{ organizationId, userId, contactId, channel: 'email' | 'whatsapp', optedOut: boolean }`

6. `ui.portfolio.contacts.channel.validated`

   - Context: `{ organizationId, contactId, channel, status }`

7. `ui.portfolio.contacts.bulk_optout_changed`

   - Context: `{ organizationId, userId, count, contactIds, channel, optedOut }`

8. `ui.portfolio.contacts.exported`

   - Context: `{ organizationId, userId, format: 'csv', count }`

9. `ui.portfolio.contacts.import.started`

   - Context: `{ organizationId, userId, rowCount }`

10. `ui.portfolio.contacts.import.completed`

    - Context: `{ organizationId, userId, inserted, updated, errors }`

11. `ui.portfolio.contacts.opened`

    - Context: `{ organizationId, userId, contactId }`

12. `ui.portfolio.contacts.search`

    - Context: `{ organizationId, query, resultsCount }`

### 6.2. Logging

```typescript
const { logger } = Sentry;

// Info
logger.info('Contact created', { contactId, role, channels });

// Warning
logger.warn('Duplicate contact detected during import', { email, existingId });

// Error
logger.error('Failed to validate WhatsApp number', { contactId, whatsappNumber, error });
```

---

## 7. RBAC (Control de acceso)

**Permisos por entidad**:

```typescript
const permissions = {
  'contacts:read': ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'],
  'contacts:create': ['OWNER', 'ADMIN', 'MEMBER'],
  'contacts:update': ['OWNER', 'ADMIN', 'MEMBER'],
  'contacts:delete': ['OWNER', 'ADMIN', 'MEMBER'],
  'contacts:import': ['OWNER', 'ADMIN', 'MEMBER'],
  'contacts:export': ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'],
  'contacts:manage_optout': ['OWNER', 'ADMIN', 'MEMBER'],
};
```

**Implementación** (igual que Empresas):

- Server-side: checks en servicios
- Client-side: ocultar botones según rol
- API routes: validar permisos, retornar 403 si no autorizado

---

## 8. Criterios de Aceptación

### 8.1. Lista de contactos

- ✅ Lista carga en ≤2s con dataset de 10k contactos
- ✅ Paginación server-side funciona (10/25/50/100 filas)
- ✅ Búsqueda por nombre/email/teléfono/empresa encuentra resultados en ≤1s
- ✅ Filtros por empresa, canal, opt-out, rol funcionan
- ✅ Ordenación por columna funciona
- ✅ Bulk selection y bulk optout funcionan

### 8.2. CRUD de contactos

- ✅ Crear contacto valida nombre, empresa, al menos un canal
- ✅ Crear contacto valida formato email (RFC 5322)
- ✅ Crear contacto valida formato teléfono/WhatsApp (E.164)
- ✅ Crear contacto valida unicidad por empresa+email O empresa+whatsapp
- ✅ Editar contacto permite cambiar campos editables
- ✅ Eliminar contacto requiere confirmación
- ✅ Contacto primario: solo uno por empresa (automático)
- ✅ Contacto de facturación: solo uno por empresa (automático)

### 8.3. Ficha/Drawer 360°

- ✅ Ficha carga en ≤1s
- ✅ Tabs funcionan (Datos, Actividad, Preferencias)
- ✅ Link a empresa navega correctamente
- ✅ Opt-out toggles funcionan y registran timestamps
- ✅ Estados de canal se muestran correctamente
- ✅ Preview de comunicaciones visible (si existen)

### 8.4. Import Wizard

- ✅ Upload acepta CSV y Excel
- ✅ Auto-mapping sugiere columnas con ≥80% similitud
- ✅ Validaciones detectan errores (empresa no existe, email inválido, duplicado, etc.)
- ✅ Preview muestra primeras 10 filas
- ✅ Import respeta opción (saltar/actualizar)
- ✅ Reporte final correcto
- ✅ CSV de errores descargable

### 8.5. Multi-tenant y seguridad

- ✅ Todas las queries filtran por organizationId
- ✅ Usuario no puede ver/editar contactos de otra organización
- ✅ Email/WhatsApp únicos por empresa en organización

### 8.6. RBAC

- ✅ Admin/Operador pueden crear, editar, eliminar
- ✅ Auditor solo puede ver y exportar
- ✅ API routes validan permisos

### 8.7. Telemetría

- ✅ Eventos de creación, edición, eliminación registrados
- ✅ Evento de opt-out con canal y estado
- ✅ Evento de import con summary

---

## 9. QA / Definition of Done

### 9.1. Checklist funcional

- [ ] Lista de contactos carga sin errores
- [ ] Búsqueda funciona con caracteres especiales
- [ ] Filtros se aplican correctamente
- [ ] Crear contacto con datos válidos funciona
- [ ] Crear contacto con email inválido muestra error
- [ ] Crear contacto sin canales muestra error "al menos uno requerido"
- [ ] Crear contacto con email/WhatsApp duplicado en misma empresa muestra error
- [ ] Contacto primario: marcar nuevo desmarca anterior
- [ ] Contacto de facturación: marcar nuevo desmarca anterior
- [ ] Opt-out por canal funciona independientemente
- [ ] Ficha 360° muestra datos correctos en todos tabs
- [ ] Import CSV con 50 filas funciona
- [ ] Import CSV con errores muestra reporte
- [ ] Multi-tenant: user de org A no ve contactos de org B

### 9.2. Checklist de rendimiento

- [ ] Lista de 10k contactos carga en ≤2s
- [ ] Búsqueda con 10k contactos responde en ≤1s
- [ ] Crear contacto responde en ≤500ms
- [ ] Ficha 360° carga en ≤1s
- [ ] Import de 100 contactos completa en ≤10s

### 9.3. Checklist de accesibilidad

- [ ] Navegación por teclado funciona
- [ ] Botones tienen aria-label
- [ ] Focus indicators visibles
- [ ] Mensajes de error se anuncian
- [ ] Color contrast WCAG AA

### 9.4. Casos de prueba

**Test 1: Crear contacto básico**

1. Click "Nuevo contacto"
2. Seleccionar empresa: "Acme"
3. Nombre: "Juan", Rol: "Billing/AP", Email: "juan@acme.com"
4. Guardar
5. Verificar: aparece en lista

**Test 2: Validación de formato email**

1. Crear contacto con email "invalid"
2. Verificar: error "Email inválido"

**Test 3: Validación E.164 teléfono**

1. Crear contacto con teléfono "912345678" (sin +56)
2. Verificar: error "Formato inválido (usar +56...)"

**Test 4: Al menos un canal requerido**

1. Crear contacto sin email, teléfono ni WhatsApp
2. Verificar: error "Al menos un canal requerido"

**Test 5: Duplicado en misma empresa**

1. Crear contacto A en empresa "Acme" con email "juan@acme.com"
2. Intentar crear contacto B en empresa "Acme" con mismo email
3. Verificar: error "Contacto duplicado"

**Test 6: Contacto primario único**

1. Empresa "Acme" tiene contacto A como primario
2. Crear contacto B y marcar como primario
3. Verificar: A ya no es primario, B es primario

**Test 7: Opt-out por canal**

1. Abrir ficha de contacto
2. Activar opt-out email
3. Verificar: timestamp registrado, badge visible en lista

**Test 8: Import CSV válido**

1. Preparar CSV con 10 contactos
2. Upload en Import Wizard
3. Mapear columnas
4. Verificar validaciones pasan
5. Importar
6. Verificar: 10 contactos nuevos en lista

**Test 9: Import CSV con errores**

1. Preparar CSV con 2 errores (nombre vacío, empresa no existe)
2. Upload
3. Verificar: validaciones detectan 2 errores
4. Descargar CSV de errores
5. Verificar: CSV tiene 2 filas con motivos

**Test 10: RBAC Auditor**

1. Login como Auditor
2. Abrir lista de contactos
3. Verificar: no hay botón "Nuevo contacto"
4. Abrir contacto
5. Verificar: no hay botón "Editar"

---

## 10. Riesgos y Mitigaciones

### 10.1. Riesgo: Duplicados por múltiples canales

**Escenario**: Contacto con email y WhatsApp duplica en uno solo de los canales

**Mitigación**:

- Política de unicidad clara: email OR WhatsApp (no AND)
- Validación en backend: check ambos campos independientemente
- Mensaje claro al usuario: "Email ya existe en esta empresa" (no genérico)
- Import Wizard: permitir elegir en conflicto (actualizar o saltar)

### 10.2. Riesgo: Formatos de teléfono no estándar

**Escenario**: Usuarios ingresan teléfonos sin formato internacional (ej: "912345678")

**Mitigación**:

- Validación estricta E.164 en frontend y backend
- Ayuda contextual: "Usar formato internacional: +56912345678"
- Auto-corrección si se detecta país de org (ej: Chile → agregar +56)
- Normalización en import: intentar parsear con libphonenumber
- Loguear formatos inválidos para analizar patrones

### 10.3. Riesgo: Contacto primario sin Empresa

**Escenario**: Migración/import crea contacto primario en empresa sin contactos

**Mitigación**:

- Validación en backend: empresa debe existir
- Import: crear empresa inline si no existe (opcional)
- Bloquear creación de contacto si empresa no válida
- Mensaje claro: "Primero cree la empresa"

### 10.4. Riesgo: Opt-out no respetado por agente

**Escenario**: Agente envía mensajes a contacto con opt-out activo

**Mitigación**:

- Validación en capa de servicios de comunicaciones (futuro sprint)
- Badge prominente en UI de contacto si opt-out=true
- Filtro por defecto en lista: excluir opted-out (con toggle para mostrar)
- Auditoría: loguear si se intenta contactar a opted-out
- Tests de integración: validar que agente respeta opt-out

### 10.5. Riesgo: Zona horaria ignorada

**Escenario**: Agente envía mensajes fuera de ventana horaria del contacto

**Mitigación**:

- Validación de timezone IANA en formulario (dropdown con lista estándar)
- workingHoursWindow validado contra JSON schema
- Documentar uso en `architecture.md` para integración con Agente
- UI muestra horario local calculado del contacto
- Tests: validar que ventanas horarias se respetan

### 10.6. Riesgo: Performance con 10k+ contactos

**Escenario**: Búsqueda/filtros lentos en organizaciones grandes

**Mitigación**:

- Paginación server-side obligatoria
- Índices en columnas de filtro y ordenación
- Debouncing en búsqueda (300ms)
- Limitar resultados de búsqueda a 100
- Monitoring con Sentry performance tracing

---

## 11. Archivos a crear/modificar

### Nuevos archivos

**Páginas**:

- `src/app/(app)/portfolio/contacts/new/page.tsx` (formulario crear)
- `src/app/(app)/portfolio/contacts/[id]/page.tsx` (ficha completa - opcional, si no es drawer)

**Componentes**:

- `src/components/portfolio/contacts/contact-form.tsx` (formulario crear/editar)
- `src/components/portfolio/contacts/contact-filters.tsx` (filtros avanzados)
- `src/components/portfolio/contacts/contact-drawer.tsx` (ficha 360° drawer)
- `src/components/portfolio/contacts/contact-optout-toggle.tsx` (toggle opt-out con timestamp)
- `src/components/portfolio/contacts/contact-channel-status.tsx` (badges de estado de canal)
- `src/components/portfolio/contacts/bulk-optout-dialog.tsx` (confirmación bulk opt-out)

**Servicios**:

- Expandir `src/lib/services/contacts.ts` (crear archivo si no existe, extraer de customers.ts):
  - `searchContacts`
  - `validateContactUniqueness`
  - `setContactOptOut`
  - `setPrimaryContact`
  - `setBillingContact`
  - `validateChannelFormat`
  - `exportContactsCSV`

**Repositorios**:

- `src/lib/repositories/contact-repository.ts` (expandir métodos):
  - `findByEmail`
  - `findByWhatsApp`
  - `findPrimaryByCompany`
  - `findBillingByCompany`
  - `searchByName`
  - `countByFilters`

**Utils**:

- `src/lib/utils/validation/channel-validators.ts` (validación E.164, RFC 5322)
- `src/lib/utils/import/contact-importer.ts` (lógica de import)
- `src/lib/utils/export/contact-exporter.ts` (export CSV)

**API Routes**:

- `src/app/api/portfolio/contacts/route.ts` (GET list, POST create)
- `src/app/api/portfolio/contacts/[id]/route.ts` (GET detail, PATCH update, DELETE)
- `src/app/api/portfolio/contacts/[id]/optout/route.ts` (POST change opt-out)
- `src/app/api/portfolio/contacts/bulk/optout/route.ts` (POST bulk opt-out)
- `src/app/api/portfolio/contacts/export/route.ts` (GET export CSV)
- `src/app/api/import/contacts/validate/route.ts` (POST validate)
- `src/app/api/import/contacts/execute/route.ts` (POST execute)

**Migraciones**:

- `prisma/migrations/YYYYMMDDHHMMSS_add_contact_channels_and_preferences/migration.sql`
- `prisma/migrations/YYYYMMDDHHMMSS_add_contact_unique_constraints/migration.sql`
- `prisma/migrations/YYYYMMDDHHMMSS_backfill_contact_optout/migration.sql`

**Seeds**:

- `prisma/seeds/seed-contacts.ts`

### Archivos a modificar

**Páginas existentes**:

- `src/app/(app)/portfolio/contacts/page.tsx` (expandir funcionalidad, conectar filtros)

**Componentes existentes**:

- `src/components/contacts/contact-table.tsx` (agregar columnas, bulk selection, ordenación)

**Schema**:

- `prisma/schema.prisma` (agregar campos a Contact, enums, índices)

**Documentación**:

- `docs/architecture.md` (actualizar sección Contact con nuevos campos)
- `docs/overview.md` (mencionar opt-out por canal si relevante)

---

## 12. Estimación y Orden de Trabajo

### Estimación por tarea

| # | Tarea | Días | Complejidad |

|---|-------|------|-------------|

| 1 | Revisar código existente y plan general | 0.5 | Baja |

| 2 | Actualizar schema Prisma (campos, enums, índices) | 1 | Media |

| 3 | Crear migraciones (SQL + backfill) | 1 | Media |

| 4 | Crear utils de validación (E.164, RFC 5322) | 0.5 | Media |

| 5 | Expandir repositorio (queries unicidad, búsqueda) | 1 | Media |

| 6 | Crear/expandir servicios de contactos | 1.5 | Media |

| 7 | Crear API routes (CRUD + bulk + optout + export) | 1.5 | Media |

| 8 | Implementar lista con filtros funcionales | 1.5 | Media |

| 9 | Implementar búsqueda y paginación server | 1 | Media |

| 10 | Implementar formulario crear/editar (validaciones) | 2 | Alta |

| 11 | Implementar ficha/drawer 360° (tabs) | 2 | Alta |

| 12 | Implementar gestión de opt-out por canal | 1 | Media |

| 13 | Implementar gestión de contacto primario/billing | 1 | Media |

| 14 | Integrar Import Wizard (mapping, validaciones) | 2 | Alta |

| 15 | Implementar exportación CSV | 0.5 | Baja |

| 16 | Instrumentar telemetría (Sentry) | 1 | Baja |

| 17 | Implementar RBAC (checks UI + backend) | 1 | Media |

| 18 | Estados vacíos y de error | 0.5 | Baja |

| 19 | QA manual (todos los casos de prueba) | 2 | Media |

| 20 | Testing de performance (10k contactos) | 1 | Media |

| 21 | Accesibilidad (keyboard nav, ARIA) | 1 | Media |

| 22 | Actualizar documentación | 0.5 | Baja |

| 23 | Seeds de prueba | 0.5 | Baja |

**TOTAL**: **23.5 días** (~4-5 semanas)

### Orden de ejecución

**Semana 1: Fundamentos y Backend**

1-5: Schema, migraciones, validaciones, repositorio, servicios

**Semana 2: UI Lista y CRUD**

6-10: API routes, lista, búsqueda, formulario

**Semana 3: Features Avanzadas**

11-15: Ficha 360°, opt-out, primario/billing, Import Wizard, export

**Semana 4: Pulido y QA**

16-23: Telemetría, RBAC, estados, QA, performance, accesibilidad, docs

---

## 13. Próximos Pasos

1. ✅ Aprobar este plan
2. → Crear rama: `feature/cartera-contactos`
3. → Ejecutar tareas en orden sugerido
4. → Testing continuo durante desarrollo
5. → PR final con checklist de DoD
6. → Demo de funcionalidad completa
7. → Merge a `main`
8. → Inicio de Fase 3: Facturas

---

## 14. Notas Finales

### Dependencias críticas

- ✅ Prisma schema Contact ya existe (base)
- ✅ Auth y org switcher funcionan
- ✅ Servicios base de customers existen
- ✅ Plan de Empresas completado (para referencias)
- ❓ Import Wizard general existe? (verificar en BUILD MODE)

### Decisiones de diseño

- **Ficha 360°**: Drawer/Sheet (no página dedicada) para rapidez
- **Formulario crear**: Modal para rapidez
- **Unicidad**: Por empresa+email O empresa+whatsapp (no AND)
- **Opt-out**: Por canal (deprecar genérico)
- **Búsqueda**: ILIKE inicialmente, índice GIN solo si lento
- **Import**: Límite 1000 filas en v1

### Alineación con plan general

Este plan implementa **Fase 2: Contactos** del plan general (`plan-general-cartera.md`).

Cumple con:

- ✅ Tabla paginada con filtros avanzados
- ✅ CRUD completo
- ✅ Preferencias de canal y opt-out
- ✅ Ficha 360° con drawer
- ✅ Bulk actions
- ✅ Import Wizard integrado
- ✅ Telemetría
- ✅ RBAC

Siguiente fase: **Fase 3: Facturas** (plan separado)