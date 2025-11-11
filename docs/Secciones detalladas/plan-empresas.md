# Plan Específico: Empresas (CustomerCompany) — Cartera v1

## 1. Resumen y Alcance

### 1.1. Qué SÍ entra

- Lista de Empresas (`/portfolio/companies`) con:
  - Paginación server-side (10/25/50/100 filas por página)
  - Búsqueda por nombre, razón social, tax ID
  - Filtros persistentes por estado (ACTIVE, INACTIVE, ARCHIVED)
  - Ordenación por columnas (nombre, fecha creación)
  - Bulk actions: archivar múltiples, exportar CSV
- CRUD completo:
  - Crear nueva empresa (formulario modal o página dedicada)
  - Editar empresa (inline en tabla o formulario modal)
  - Archivar/reactivar empresa (confirmación)
  - Eliminar no está permitido (solo archivar)
- Vista 360° (`/portfolio/companies/[id]`) con tabs:
  - **Datos**: información principal, campos editables
  - **Contactos**: lista/preview de contactos (usando componente existente)
  - **Facturas**: lista/preview de facturas (usando componente existente)
  - **Timeline**: placeholder para futuro (mensaje "próximamente")
- Estados vacíos y de error:
  - Empty state con CTA para importar o crear
  - Error states con opción de reintentar
  - Loading states (skeleton loaders)
- Integración con Import Wizard:
  - Mapping de columnas CSV → CustomerCompany
  - Validaciones pre-import
  - Manejo de duplicados por taxId o nombre
  - Reporte de errores descargable
- Telemetría mínima (Sentry):
  - Eventos de creación, edición, archivado, bulk actions, import
- RBAC básico:
  - Admin/Operador: crear, editar, archivar
  - Auditor: solo lectura

### 1.2. Qué NO entra

- CRUD completo de Contactos (se referencia, no se crea desde aquí)
- CRUD completo de Facturas (se referencia, no se crea desde aquí)
- CRUD de Segmentos (sprint separado)
- Builder de flujos de cobranza
- Integraciones ERP/CRM externas
- Timeline funcional (solo placeholder)
- Campos custom/metadata dinámica
- Tags/categorías custom (solo datos estándar del modelo)

### 1.3. Estado actual verificado

- ✅ Modelo `CustomerCompany` ya existe en Prisma schema (líneas 140-161)
- ✅ Rutas base ya creadas: `/portfolio/companies` y `/portfolio/companies/[id]`
- ✅ Componentes base existen: `CustomerTable`, `CustomerOverview`, `ContactsList`, `InvoicesList`
- ✅ Servicios base existen: `customersService` con métodos `listCustomerCompanies`, `getCustomerCompany`
- ✅ Redirect de `/customers` a `/portfolio/companies` ya implementado

**Conclusión**: Hay una base funcional pero limitada. Necesita expansión significativa.

---

## 2. UI/UX de Empresas (Post-login)

### 2.1. Ubicación y navegación

**Ruta principal**: `/portfolio/companies`

**Acceso desde sidebar** (ya configurado en layout):

- Sección "Cartera" → submenu "Empresas"

**Breadcrumbs**:

- Home / Cartera / Empresas
- Home / Cartera / Empresas / [Nombre empresa]

### 2.2. Vista de lista (`/portfolio/companies`)

#### Header

```
┌─────────────────────────────────────────────────────────────────┐
│ Empresas                                         [Importar] [+]  │
│ Gestiona las empresas clientes de tu organización                │
└─────────────────────────────────────────────────────────────────┘
```

#### Toolbar

```
┌─────────────────────────────────────────────────────────────────┐
│ [🔍 Buscar por nombre, razón social o RUT...]  [Filtros ▼]      │
│ [Estado: Todas ▼] [Ordenar: Nombre ▼]                           │
└─────────────────────────────────────────────────────────────────┘
```

#### Tabla

**Columnas**:

1. **Checkbox** (para bulk selection)
2. **Nombre** (link a vista 360°, bold)
3. **Razón Social** (secondary text)
4. **Tax ID / RUT** (monospace font)
5. **Estado** (Badge: ACTIVE=verde, INACTIVE=amarillo, ARCHIVED=gris)
6. **Contactos** (contador, ej: "3 contactos")
7. **Facturas** (contador, ej: "12 facturas")
8. **Creada** (fecha relativa: "hace 2 días")
9. **Acciones** (dropdown: Ver, Editar, Archivar/Reactivar)

**Comportamiento**:

- Click en nombre → navegar a vista 360°
- Click en checkbox → seleccionar para bulk actions
- Hover en fila → highlight sutil
- Ordenación por columna (nombre, creada)

#### Bulk Actions Toolbar (aparece al seleccionar)

```
┌─────────────────────────────────────────────────────────────────┐
│ ✓ 5 seleccionadas          [Archivar] [Exportar CSV] [Cancelar] │
└─────────────────────────────────────────────────────────────────┘
```

#### Paginación (footer)

```
┌─────────────────────────────────────────────────────────────────┐
│ Mostrando 1-25 de 147 empresas      [10▼] [← 1 2 3 ... 6 →]     │
└─────────────────────────────────────────────────────────────────┘
```

#### Estados especiales

**Empty state** (sin empresas):

```
┌─────────────────────────────────────────────────────────────────┐
│                     [Ilustración: carpeta vacía]                 │
│                                                                   │
│                     No hay empresas                              │
│              Importa tu primera hoja o crea una empresa          │
│                                                                   │
│                 [Importar CSV]  [Crear empresa]                  │
└─────────────────────────────────────────────────────────────────┘
```

**Loading state**:

- Skeleton loaders para filas de tabla
- Shimmer effect en columnas

**Error state**:

```
┌─────────────────────────────────────────────────────────────────┐
│                     [Icono: alerta]                              │
│                                                                   │
│                Error al cargar empresas                          │
│     Hubo un problema al cargar la lista. Intenta de nuevo.      │
│                                                                   │
│                      [Reintentar]                                │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3. Crear empresa

**Opción A**: Modal con formulario (preferida para rapidez)

**Opción B**: Página dedicada `/portfolio/companies/new` (para formularios extensos)

**Decisión**: Modal para v1, permitir expandir a página si se agregan muchos campos.

**Formulario de creación** (campos):

```
┌─────────────────────────────────────────────────────────────────┐
│                       Nueva Empresa                              │
├─────────────────────────────────────────────────────────────────┤
│ Nombre *                                                         │
│ [_______________________________________]                        │
│                                                                   │
│ Razón Social                                                     │
│ [_______________________________________]                        │
│                                                                   │
│ RUT / Tax ID                                                     │
│ [_______________________________________]                        │
│ Ej: 12.345.678-9 (Chile), 20-12345678-9 (Argentina)             │
│                                                                   │
│ Industria                                                        │
│ [Seleccionar... ▼]                                               │
│                                                                   │
│ Sitio web                                                        │
│ [_______________________________________]                        │
│                                                                   │
│ Notas                                                            │
│ [_______________________________________]                        │
│ [                                       ]                        │
│                                                                   │
│                          [Cancelar] [Crear]                      │
└─────────────────────────────────────────────────────────────────┘
```

**Validaciones**:

- Nombre: requerido, min 2 caracteres
- Tax ID: opcional, pero si existe debe ser único por organización
- Website: formato URL válido si presente
- Industria: select de opciones estándar (ej: Tecnología, Retail, Manufactura, Servicios, etc.)

### 2.4. Editar empresa

**Trigger**: Click en "Editar" en menú de acciones o botón en vista 360°

**Formato**: Modal con mismo formulario de creación, pre-poblado

**Campos editables**:

- Todos excepto `id`, `organizationId`, `createdAt`
- Estado se cambia con acción separada (Archivar/Reactivar)

### 2.5. Vista 360° (`/portfolio/companies/[id]`)

#### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ ← Volver                                                         │
│                                                                   │
│ [Acme Corporation]                                        [Editar]│
│ RUT: 76.123.456-7  •  Tecnología  •  [Badge: ACTIVA]            │
│                                                                   │
│ [Datos] [Contactos] [Facturas] [Timeline]                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│ [Contenido del tab activo]                                       │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

#### Tab: Datos

**Secciones**:

**Información general**:

```
Nombre:          Acme Corporation
Razón Social:    Acme Corporation SpA
RUT / Tax ID:    76.123.456-7
Estado:          [Badge: ACTIVA]
Industria:       Tecnología
Sitio web:       https://acme.com [↗]
```

**Notas internas**:

```
[Textarea editable con botón "Guardar"]
Notas sobre la empresa, contactos clave, preferencias, etc.
```

**Metadatos**:

```
Creada:          15 de enero de 2025
Última actualización: 20 de enero de 2025
Contactos:       3 contactos (link a tab Contactos)
Facturas:        12 facturas por $45,000 USD (link a tab Facturas)
```

**Acciones** (footer):

```
[Archivar empresa] [Exportar datos]
```

#### Tab: Contactos

**Contenido**: Reusar componente `ContactsList` existente

**Funcionalidad**:

- Lista de contactos de la empresa
- Botón "Agregar contacto" (navega a crear contacto con customerCompanyId pre-seleccionado)
- Badge en contacto primario
- Indicador de opt-out

**Preview** (si hay contactos):

```
┌─────────────────────────────────────────────────────────────────┐
│ Juan Pérez (Primario)                                            │
│ juan.perez@acme.com  •  +56 9 1234 5678  •  [WhatsApp ✓]        │
├─────────────────────────────────────────────────────────────────┤
│ María González                                                   │
│ maria.gonzalez@acme.com  •  [Sin WhatsApp]                       │
└─────────────────────────────────────────────────────────────────┘
```

**Empty state**:

```
No hay contactos registrados
[Agregar primer contacto]
```

#### Tab: Facturas

**Contenido**: Reusar componente `InvoicesList` existente

**Funcionalidad**:

- Lista de facturas de la empresa
- Filtro rápido por estado (Pendiente, Vencida, Pagada)
- Suma total de saldo pendiente
- Botón "Crear factura" (navega a crear factura con customerCompanyId pre-seleccionado)

**Preview** (si hay facturas):

```
┌─────────────────────────────────────────────────────────────────┐
│ Resumen: 12 facturas  •  Pendiente: $45,000 USD                 │
├─────────────────────────────────────────────────────────────────┤
│ #F-2025-001  •  $5,000  •  Vence: 25 ene  •  [PENDIENTE]        │
│ #F-2024-045  •  $3,200  •  Vence: 20 ene  •  [VENCIDA]          │
│ #F-2024-044  •  $2,800  •  Pagada         •  [PAGADA]           │
│ ...                                                              │
└─────────────────────────────────────────────────────────────────┘
```

**Empty state**:

```
No hay facturas registradas
[Crear primera factura]
```

#### Tab: Timeline

**Contenido v1**: Placeholder

```
┌─────────────────────────────────────────────────────────────────┐
│                     [Icono: reloj]                               │
│                                                                   │
│              Timeline de interacciones                           │
│                  (Próximamente)                                  │
│                                                                   │
│ El timeline mostrará todas las comunicaciones, cambios de        │
│ estado y acciones del agente relacionadas con esta empresa.     │
└─────────────────────────────────────────────────────────────────┘
```

**Futuro** (no en este sprint):

- Log de comunicaciones (emails, WhatsApp)
- Cambios de estado de facturas
- Acciones del agente
- Notas manuales del equipo

---

## 3. Reglas y Validaciones

### 3.1. Validaciones de formulario

**Nombre** (required):

- Min: 2 caracteres
- Max: 255 caracteres
- Mensaje: "El nombre debe tener al menos 2 caracteres"

**Razón social** (optional):

- Max: 255 caracteres

**Tax ID** (optional pero con validación de unicidad):

- Si se proporciona, debe ser único por organización
- Normalización: remover espacios, guiones, puntos para comparar
- Mensaje de duplicado: "Ya existe una empresa con este RUT/Tax ID en tu organización"
- Formato: regex básico según país (configurable por org)

**Industria** (optional):

- Select de lista predefinida:
  - Tecnología
  - Retail / Comercio
  - Manufactura / Industria
  - Servicios
  - Construcción
  - Salud
  - Educación
  - Finanzas
  - Transporte / Logística
  - Otro

**Website** (optional):

- Validación de URL válida (https?://)
- Auto-agregar `https://` si falta protocolo
- Mensaje: "Debe ser una URL válida (ej: https://ejemplo.com)"

**Notas** (optional):

- Max: 2000 caracteres
- Textarea con contador

### 3.2. Reglas de negocio

**Multi-tenant**:

- TODAS las queries filtran por `organizationId` de la sesión
- Usuarios solo ven empresas de su organización activa

**Estados**:

- `ACTIVE`: empresa operativa (default)
- `INACTIVE`: empresa temporalmente inactiva (no recibe comunicaciones automáticas)
- `ARCHIVED`: empresa archivada (solo lectura, no aparece en listados por defecto)

**Transiciones de estado**:

- ACTIVE ↔ INACTIVE: permitido libremente
- ACTIVE/INACTIVE → ARCHIVED: confirmación requerida
- ARCHIVED → ACTIVE: reactivar
- No se permite eliminar (delete), solo archivar

**Unicidad**:

- `taxId` debe ser único por organización (si presente)
- `name` puede repetirse (empresas con nombres similares en diferentes sectores)

**Normalización**:

- `name`: capitalizar primera letra de cada palabra (opcional, para UI)
- `taxId`: almacenar sin formato (solo números y guión verificador si aplica)
- `website`: normalizar a lowercase, asegurar protocolo

### 3.3. Validaciones de import

**Columnas requeridas**:

- `nombre` o `name` (required)

**Columnas opcionales**:

- `razon_social`, `legal_name`
- `rut`, `tax_id`, `taxId`
- `industria`, `industry`
- `website`, `sitio_web`
- `notas`, `notes`

**Validaciones de fila**:

1. Nombre no vacío
2. Tax ID único si presente (check contra DB)
3. Website formato válido si presente
4. Industria en lista permitida si presente

**Manejo de duplicados**:

- Si `taxId` ya existe en org: opción "Actualizar" o "Saltar"
- Si solo `name` coincide (fuzzy match 90%+): advertir pero permitir (pueden ser empresas distintas)

**Reporte de errores**:

- CSV con filas fallidas y columna "Motivo error"
- Ejemplos:
  - "Fila 5: Nombre vacío"
  - "Fila 12: RUT duplicado (ya existe empresa con ID abc123)"
  - "Fila 18: Website inválido"

---

## 4. Datos y Migraciones

### 4.1. Modelo actual (ya existe)

**Tabla**: `customer_companies` (líneas 140-161 del schema)

**Campos actuales**:

```prisma
id               String                 @id @default(cuid())
organizationId   String
name             String
legalName        String?
taxId            String?
status           CustomerCompanyStatus  @default(ACTIVE)
industry         String?
website          String?
notes            String?
createdAt        DateTime               @default(now())
updatedAt        DateTime               @updatedAt
archivedAt       DateTime?
```

**Índices actuales**:

- `@@index([organizationId])`
- `@@index([status])`

**Relaciones actuales**:

- `organization Organization @relation(...)`
- `contacts Contact[]`
- `invoices Invoice[]`

### 4.2. Migraciones necesarias

**Migración 1: Agregar índice de unicidad para taxId**

**Problema**: `taxId` debe ser único por organización pero no hay constraint

**Solución**: Agregar índice único compuesto

```prisma
@@unique([organizationId, taxId], map: "customer_company_tax_id_per_org")
```

**Consideraciones**:

- Solo aplicar si `taxId IS NOT NULL`
- Partial index en Postgres: `WHERE taxId IS NOT NULL`

**Script de migración**:

```sql
-- Up
CREATE UNIQUE INDEX CONCURRENTLY customer_company_tax_id_per_org 
ON customer_companies (organization_id, tax_id) 
WHERE tax_id IS NOT NULL;

-- Down
DROP INDEX customer_company_tax_id_per_org;
```

**Migración 2: Agregar índice para búsqueda por nombre**

**Problema**: Búsqueda full-text lenta en tablas grandes

**Solución**: Índice GIN para búsqueda (opcional, solo si performance lo requiere)

```sql
-- Up (opcional, evaluar en QA)
CREATE INDEX CONCURRENTLY customer_company_name_search 
ON customer_companies USING gin(to_tsvector('spanish', name));

-- Down
DROP INDEX customer_company_name_search;
```

**Decisión**: Implementar solo si búsqueda es lenta (>1s en 5k filas). Usar `ILIKE` inicialmente.

### 4.3. Índices adicionales (evaluar en QA)

**Si filtrado por estado + org es lento**:

```prisma
@@index([organizationId, status])
```

**Si ordenación por createdAt es lenta**:

```prisma
@@index([organizationId, createdAt])
```

**Estrategia**: No crear índices prematuramente. Medir queries en QA con dataset de 5k empresas.

### 4.4. Seeds de prueba

**Script**: `prisma/seeds/seed-companies.ts`

**Dataset**:

- 50 empresas con datos realistas
- 40 ACTIVE, 7 INACTIVE, 3 ARCHIVED
- Variedad de industrias
- 30 con taxId, 20 sin taxId
- 45 con website, 5 sin website
- Todas con `organizationId` de test org

**Uso**:

```bash
npx prisma db seed
```

### 4.5. Compatibilidad

**No romper**:

- ✅ Modelo ya existe, no cambiar nombres de campos
- ✅ Relaciones con Contact e Invoice intactas
- ✅ Índices actuales preservados

**Documentación**:

- Actualizar `docs/architecture.md` sección 6.1 con constraint de unicidad de taxId

---

## 5. Importación con Import Wizard

### 5.1. Flujo de import

**Ruta**: `/settings/data` (Import Wizard general) o modal desde `/portfolio/companies`

**Steps del wizard**:

1. **Upload**: Drag & drop CSV/Excel, validar formato
2. **Tipo**: Seleccionar "Empresas"
3. **Map**: Auto-mapear columnas (similitud de nombre)
4. **Validate**: Ejecutar validaciones, mostrar errores
5. **Preview**: Primeras 10 filas
6. **Import**: Progress bar, reporte final

### 5.2. Auto-mapping de columnas

**Lógica de similitud** (threshold 80%):

```typescript
const columnMappings = {
  nombre: ['name', 'nombre', 'empresa', 'customer', 'client'],
  legalName: ['razon_social', 'legal_name', 'razon social', 'razón social'],
  taxId: ['rut', 'tax_id', 'taxId', 'tax', 'nit', 'cuit', 'rfc'],
  industry: ['industria', 'industry', 'sector', 'rubro'],
  website: ['website', 'sitio_web', 'sitio web', 'web', 'url'],
  notes: ['notas', 'notes', 'observaciones', 'comentarios'],
};
```

**Proceso**:

1. Leer headers del CSV
2. Normalizar (lowercase, sin acentos, sin espacios)
3. Comparar con mappings
4. Sugerir match si similitud >= 80%
5. Permitir ajuste manual

### 5.3. Validaciones pre-import

**Validación 1: Campos requeridos**

- Verificar que `nombre` esté mapeado y no vacío

**Validación 2: Formato**

- Website: regex URL
- TaxId: regex básico (números y guión)

**Validación 3: Duplicados**

- Query a DB: `SELECT taxId FROM customer_companies WHERE organizationId = ? AND taxId IN (?)`
- Marcar filas con taxId duplicado

**Validación 4: Datos**

- Industria: verificar contra lista permitida
- Longitud de campos

**Resultado**:

```typescript
{
  valid: 92,
  invalid: 8,
  errors: [
    { row: 5, field: 'nombre', error: 'Nombre vacío' },
    { row: 12, field: 'taxId', error: 'RUT duplicado (existe ID abc123)' },
    { row: 18, field: 'website', error: 'URL inválida' },
  ]
}
```

### 5.4. Preview

**Mostrar primeras 10 filas** con columnas mapeadas:

```
┌──────┬─────────────────┬──────────────┬─────────────┬────────┐
│ #    │ Nombre          │ RUT          │ Industria   │ Estado │
├──────┼─────────────────┼──────────────┼─────────────┼────────┤
│ 1    │ Acme Corp       │ 76.123.456-7 │ Tecnología  │ ✓ OK   │
│ 2    │ TechStart SA    │ 77.234.567-8 │ Tecnología  │ ✓ OK   │
│ 5    │ [vacío]         │ -            │ -           │ ✗ Error│
└──────┴─────────────────┴──────────────┴─────────────┴────────┘
```

### 5.5. Ejecución de import

**Transacción**:

- Si <= 1000 filas: transacción única
- Si > 1000 filas: batch de 100 filas

**Idempotencia**:

- Opción 1: "Saltar duplicados" (por taxId)
- Opción 2: "Actualizar existentes" (update by taxId)

**Código de import** (pseudo):

```typescript
const importCompanies = async (rows, options) => {
  const results = { inserted: 0, updated: 0, errors: [] };
  
  for (const row of rows) {
    try {
      const existing = await prisma.customerCompany.findFirst({
        where: { organizationId, taxId: row.taxId },
      });
      
      if (existing) {
        if (options.mode === 'update') {
          await prisma.customerCompany.update({
            where: { id: existing.id },
            data: row,
          });
          results.updated++;
        } else {
          // skip
        }
      } else {
        await prisma.customerCompany.create({ data: row });
        results.inserted++;
      }
    } catch (error) {
      results.errors.push({ row, error: error.message });
    }
  }
  
  return results;
};
```

### 5.6. Reporte final

**Summary**:

```
✓ 92 empresas importadas
↻ 5 empresas actualizadas
✗ 8 errores (descargar CSV)
```

**CSV de errores**:

```csv
Fila,Nombre,RUT,Error
5,,"",Nombre vacío
12,Duplicate Inc,76.123.456-7,RUT duplicado
18,Bad URL SA,77.345.678-9,Website inválido
```

---

## 6. Telemetría (Sentry)

### 6.1. Eventos a instrumentar

**Patrón**: `Sentry.startSpan({ op: 'ui.action', name: 'event' })`

**Lista de eventos**:

1. `ui.portfolio.companies.list.loaded`

   - Context: `{ organizationId, count, filters, sort }`

2. `ui.portfolio.companies.created`

   - Context: `{ organizationId, userId, companyId, name, hasTaxId }`

3. `ui.portfolio.companies.updated`

   - Context: `{ organizationId, userId, companyId, fieldsChanged }`

4. `ui.portfolio.companies.archived`

   - Context: `{ organizationId, userId, companyId, name }`

5. `ui.portfolio.companies.reactivated`

   - Context: `{ organizationId, userId, companyId, name }`

6. `ui.portfolio.companies.bulk_archived`

   - Context: `{ organizationId, userId, count, companyIds }`

7. `ui.portfolio.companies.exported`

   - Context: `{ organizationId, userId, format: 'csv', count }`

8. `ui.portfolio.companies.import.started`

   - Context: `{ organizationId, userId, rowCount }`

9. `ui.portfolio.companies.import.completed`

   - Context: `{ organizationId, userId, inserted, updated, errors }`

10. `ui.portfolio.companies.import.failed`

    - Context: `{ organizationId, userId, error }`

11. `ui.portfolio.companies.detail.opened`

    - Context: `{ organizationId, userId, companyId }`

12. `ui.portfolio.companies.search`

    - Context: `{ organizationId, query, resultsCount }`

### 6.2. Logging

**Usar Sentry logger** (`import * as Sentry from "@sentry/nextjs"`):

```typescript
const { logger } = Sentry;

// Info
logger.info('Company created', { companyId, name });

// Warning
logger.warn('Duplicate taxId detected during import', { taxId, existingId });

// Error
logger.error('Failed to archive company', { companyId, error });
```

### 6.3. Error tracking

**Capturar excepciones**:

```typescript
try {
  await createCompany(data);
} catch (error) {
  Sentry.captureException(error, {
    tags: { feature: 'companies', action: 'create' },
    contexts: { organization: { id: orgId } },
  });
  throw error;
}
```

---

## 7. RBAC (Control de acceso)

### 7.1. Roles y permisos

**Roles** (de Membership.role):

- `OWNER`: todos los permisos
- `ADMIN`: todos los permisos
- `MEMBER` (Operador): crear, editar, archivar (no eliminar)
- `VIEWER` (Auditor): solo lectura

**Permisos por entidad**:

```typescript
const permissions = {
  'companies:read': ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'],
  'companies:create': ['OWNER', 'ADMIN', 'MEMBER'],
  'companies:update': ['OWNER', 'ADMIN', 'MEMBER'],
  'companies:archive': ['OWNER', 'ADMIN', 'MEMBER'],
  'companies:delete': ['OWNER'], // no usado en v1
  'companies:import': ['OWNER', 'ADMIN', 'MEMBER'],
  'companies:export': ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'],
};
```

### 7.2. Implementación

**Server-side** (en services):

```typescript
export async function createCustomerCompany(context, data) {
  // Check permission
  if (!hasPermission(context.membership.role, 'companies:create')) {
    throw new UnauthorizedError('No tienes permiso para crear empresas');
  }
  
  // Proceed
  return await customersRepository.create(context, data);
}
```

**Client-side** (en UI):

```tsx
const { membership } = useSession();
const canEdit = hasPermission(membership.role, 'companies:update');

return (
  <>
    {canEdit && (
      <Button onClick={handleEdit}>Editar</Button>
    )}
  </>
);
```

### 7.3. Guards en API routes

**Middleware**:

```typescript
export async function POST(req: Request) {
  const session = await requireSession();
  const context = getContext(session);
  
  // Permission check
  requirePermission(context, 'companies:create');
  
  // Proceed with action
  const data = await req.json();
  const company = await customersService.createCustomerCompany(context, data);
  
  return Response.json(company);
}
```

---

## 8. Criterios de Aceptación

### 8.1. Lista de empresas

- ✅ Lista carga en ≤2s con dataset de 5000 empresas
- ✅ Paginación server-side funciona (10/25/50/100 filas)
- ✅ Búsqueda por nombre encuentra resultados en ≤1s
- ✅ Búsqueda por taxId encuentra coincidencia exacta
- ✅ Filtros por estado persisten en URL search params
- ✅ Ordenación por columna funciona (nombre, createdAt)
- ✅ Bulk selection permite seleccionar todas las de la página
- ✅ Bulk archive funciona con confirmación
- ✅ Exportar CSV descarga archivo con todas las empresas filtradas

### 8.2. CRUD de empresas

- ✅ Crear empresa valida nombre requerido
- ✅ Crear empresa valida unicidad de taxId por org
- ✅ Crear empresa valida formato de website
- ✅ Editar empresa permite cambiar todos los campos editables
- ✅ Editar empresa preserva relaciones (contactos, facturas)
- ✅ Archivar empresa requiere confirmación
- ✅ Archivar empresa actualiza status y archivedAt
- ✅ Reactivar empresa desde ARCHIVED a ACTIVE funciona
- ✅ No es posible eliminar empresa (botón no existe)

### 8.3. Vista 360°

- ✅ Vista 360° carga en ≤1s
- ✅ Tab Datos muestra todos los campos correctamente
- ✅ Tab Contactos muestra lista de contactos (usando ContactsList)
- ✅ Tab Facturas muestra lista de facturas (usando InvoicesList)
- ✅ Tab Timeline muestra placeholder "próximamente"
- ✅ Contador de contactos es correcto
- ✅ Contador de facturas es correcto
- ✅ Suma de saldo pendiente es correcta
- ✅ Botón "Editar" abre modal pre-poblado

### 8.4. Import Wizard

- ✅ Upload acepta CSV y Excel
- ✅ Upload valida tamaño máximo 10MB
- ✅ Auto-mapping sugiere columnas con ≥80% similitud
- ✅ Validaciones detectan errores antes de import
- ✅ Preview muestra primeras 10 filas
- ✅ Import con duplicados respeta opción (saltar/actualizar)
- ✅ Progress bar muestra progreso durante import
- ✅ Reporte final muestra summary correcto
- ✅ CSV de errores descargable contiene filas fallidas
- ✅ Import registra evento en telemetría

### 8.5. Estados especiales

- ✅ Empty state se muestra cuando no hay empresas
- ✅ Empty state tiene CTAs funcionales (Importar, Crear)
- ✅ Loading state muestra skeleton loaders
- ✅ Error state muestra mensaje y botón "Reintentar"
- ✅ Error state registra error en Sentry

### 8.6. Multi-tenant y seguridad

- ✅ Todas las queries filtran por organizationId
- ✅ Usuario no puede ver empresas de otra organización
- ✅ Usuario no puede editar empresas de otra organización
- ✅ TaxId es único por organización (permite duplicados en orgs diferentes)

### 8.7. RBAC

- ✅ Admin puede crear, editar, archivar
- ✅ Operador puede crear, editar, archivar
- ✅ Auditor solo puede ver (sin botones de edición)
- ✅ Auditor puede exportar CSV
- ✅ API routes validan permisos (retornan 403 si no autorizado)

### 8.8. Telemetría

- ✅ Evento de creación se registra con contexto completo
- ✅ Evento de edición incluye fieldsChanged
- ✅ Evento de bulk action incluye count y IDs
- ✅ Evento de import incluye summary (inserted, updated, errors)
- ✅ Errores se capturan en Sentry con contexto

### 8.9. No-regresión

- ✅ Sign-in funciona igual que antes
- ✅ Sign-out funciona igual que antes
- ✅ Org switcher funciona igual que antes
- ✅ Sidebar navegación funciona igual que antes
- ✅ Otras secciones (Contactos, Facturas) no se rompen

---

## 9. QA / Definition of Done

### 9.1. Checklist funcional

- [ ] Lista de empresas carga sin errores de consola
- [ ] Búsqueda funciona con caracteres especiales (ñ, acentos)
- [ ] Filtros se aplican correctamente y persisten en URL
- [ ] Paginación cambia página sin perder filtros
- [ ] Crear empresa con datos válidos funciona
- [ ] Crear empresa con nombre vacío muestra error
- [ ] Crear empresa con taxId duplicado muestra error
- [ ] Editar empresa actualiza campos correctamente
- [ ] Archivar empresa muestra confirmación
- [ ] Archivar empresa actualiza status
- [ ] Reactivar empresa funciona
- [ ] Bulk archive de 5 empresas funciona
- [ ] Exportar CSV descarga archivo válido
- [ ] Vista 360° muestra datos correctos en todos los tabs
- [ ] Import CSV con 50 filas funciona sin errores
- [ ] Import CSV con errores muestra reporte descargable
- [ ] Multi-tenant: user de org A no ve empresas de org B

### 9.2. Checklist de rendimiento

- [ ] Lista de 5000 empresas carga en ≤2s
- [ ] Búsqueda con 5000 empresas responde en ≤1s
- [ ] Crear empresa responde en ≤500ms
- [ ] Vista 360° carga en ≤1s
- [ ] Import de 100 empresas completa en ≤10s
- [ ] Import de 1000 empresas completa en ≤60s

### 9.3. Checklist de accesibilidad

- [ ] Navegación por teclado funciona (Tab, Enter, Esc)
- [ ] Todos los botones tienen aria-label descriptivo
- [ ] Focus indicators visibles en todos los elementos interactivos
- [ ] Formulario de creación valida antes de enviar
- [ ] Mensajes de error se anuncian con aria-live
- [ ] Modal de confirmación se cierra con Esc
- [ ] Color contrast cumple WCAG AA (4.5:1)

### 9.4. Checklist de código

- [ ] No hay `any` en TypeScript (salvo casos excepcionales documentados)
- [ ] No hay warnings de React en dev mode
- [ ] Código sigue convenciones del repo (ver `.cursorrules`)
- [ ] Servicios en `src/lib/services/`
- [ ] Repositorios en `src/lib/repositories/`
- [ ] Componentes en `src/components/`
- [ ] No hay secretos hardcodeados
- [ ] Variables de entorno documentadas en `docs/env-vars.md`

### 9.5. Checklist de documentación

- [ ] `docs/architecture.md` actualizado con constraint de taxId
- [ ] `docs/overview.md` menciona Import Wizard si aplica
- [ ] Comentarios en código explican lógica compleja
- [ ] README actualizado si hay nuevos comandos

### 9.6. Casos de prueba (manual)

**Test 1: Crear empresa básica**

1. Click en "Nueva empresa"
2. Llenar solo nombre: "Test Corp"
3. Click "Crear"
4. Verificar: aparece en lista, status ACTIVE

**Test 2: Crear con taxId duplicado**

1. Crear empresa A con taxId "12345678-9"
2. Intentar crear empresa B con mismo taxId
3. Verificar: error "RUT duplicado"

**Test 3: Búsqueda por nombre**

1. Buscar "Acme"
2. Verificar: solo empresas con "Acme" en nombre
3. Limpiar búsqueda
4. Verificar: se muestran todas

**Test 4: Filtro por estado**

1. Filtrar por "ARCHIVED"
2. Verificar: solo empresas archivadas
3. Cambiar a "ACTIVE"
4. Verificar: solo empresas activas

**Test 5: Archivar empresa**

1. Click en "Archivar" en menú de acciones
2. Confirmar en modal
3. Verificar: status cambia a ARCHIVED, desaparece de lista ACTIVE

**Test 6: Vista 360° - Tab Contactos**

1. Abrir empresa con contactos
2. Click en tab "Contactos"
3. Verificar: lista de contactos visible
4. Verificar: contador correcto

**Test 7: Import CSV válido**

1. Preparar CSV con 10 empresas
2. Upload en Import Wizard
3. Mapear columnas
4. Verificar validaciones pasan
5. Importar
6. Verificar: 10 empresas nuevas en lista

**Test 8: Import CSV con errores**

1. Preparar CSV con 2 errores (nombre vacío, taxId duplicado)
2. Upload en Import Wizard
3. Verificar: validaciones detectan 2 errores
4. Descargar CSV de errores
5. Verificar: CSV tiene 2 filas con motivos

**Test 9: Bulk archive**

1. Seleccionar 3 empresas
2. Click "Archivar"
3. Confirmar
4. Verificar: 3 empresas archivadas

**Test 10: RBAC - Auditor no puede editar**

1. Login como Auditor
2. Abrir lista de empresas
3. Verificar: no hay botón "Nueva empresa"
4. Abrir empresa
5. Verificar: no hay botón "Editar"

---

## 10. Riesgos y Mitigaciones

### 10.1. Riesgo: Duplicados por falta de taxId

**Escenario**: Empresas sin taxId se duplican fácilmente

**Impacto**: Alto - datos sucios, confusión

**Mitigación**:

- No imponer taxId como requerido (empresas informales)
- Implementar fuzzy matching en import (similitud >90% de nombre)
- Advertir usuario: "Posible duplicado: 'Acme Corp' ya existe"
- Permitir continuar con confirmación
- Loguear duplicados potenciales para revisión

### 10.2. Riesgo: Formatos de taxId por país

**Escenario**: taxId tiene formato diferente por país (RUT Chile, CUIT Argentina, RFC México)

**Impacto**: Medio - validaciones incorrectas

**Mitigación**:

- Almacenar taxId sin formato (solo números y dígito verificador)
- Validación básica por longitud (8-15 caracteres)
- No validar formato específico en v1
- Mostrar con formato visual en UI (agregar guiones) según `countryCode` de org
- Documentar en ayuda contextual: "Ingrese solo números sin puntos ni guiones"

### 10.3. Riesgo: Performance en búsqueda con 10k+ empresas

**Escenario**: Búsqueda ILIKE lenta en tablas grandes

**Impacto**: Medio - UX degradada

**Mitigación**:

- Implementar debouncing en input (300ms)
- Usar índice GIN si se detecta lentitud en QA
- Limitar resultados de búsqueda a 100 primeros
- Agregar mensaje: "Mostrando primeros 100 resultados, refina tu búsqueda"
- Considerar Elasticsearch/Algolia en futuro si escala

### 10.4. Riesgo: Eliminación accidental en bulk actions

**Escenario**: Usuario archiva múltiples empresas por error

**Impacto**: Alto - pérdida de datos aparente

**Mitigación**:

- Confirmación modal clara: "Vas a archivar 15 empresas: [lista primeras 5]"
- Opción de deshacer (no implementada en v1, pero loguear en AuditLog)
- No permitir eliminar, solo archivar (reversible)
- Botón "Reactivar" visible en empresas archivadas
- Filtro por ARCHIVED para recuperar

### 10.5. Riesgo: Import masivo rompe performance

**Escenario**: Usuario importa 10k empresas de una vez

**Impacto**: Alto - timeout, BD bloqueada

**Mitigación**:

- Límite de 1000 filas por import en v1
- Mensaje: "Para imports >1000 filas, contacta soporte"
- Batch inserts de 100 filas
- Progress bar con cancelación (no en v1, futuro)
- Job asíncrono para imports >500 filas (considerar en futuro)

### 10.6. Riesgo: Desalineación con plan general

**Escenario**: Implementación diverge de plan general de Cartera

**Impacto**: Medio - re-work futuro

**Mitigación**:

- Referencias cruzadas constantes a `plan-general-cartera.md`
- Mantener estructura de datos consistente con secciones Contactos y Facturas
- Componentes reutilizables (`DetailSheet`, `BulkActionToolbar`)
- Revisión de checklist de plan general antes de marcar como completo

### 10.7. Riesgo: Multi-tenant leak

**Escenario**: Query sin filtro de organizationId expone datos de otras orgs

**Impacto**: Crítico - brecha de seguridad

**Mitigación**:

- TODOS los repositorios reciben `context` con `organizationId`
- Wrapper de Prisma que auto-agrega filtro de org (considerar)
- Tests de integración verifican aislamiento
- Code review exhaustivo de queries
- Sentry alert si query retorna datos sin org filter

---

## 11. Archivos a crear/modificar

### Nuevos archivos

**Páginas**:

- `src/app/(app)/portfolio/companies/new/page.tsx` (si se usa página dedicada en vez de modal)

**Componentes**:

- `src/components/portfolio/companies/company-form.tsx` (formulario crear/editar)
- `src/components/portfolio/companies/company-filters.tsx` (filtros avanzados)
- `src/components/portfolio/companies/bulk-actions-toolbar.tsx` (toolbar de acciones bulk)
- `src/components/portfolio/companies/archive-confirmation-dialog.tsx` (confirmación)

**Servicios**:

- Expandir `src/lib/services/customers.ts` con métodos adicionales:
  - `searchCustomerCompanies`
  - `archiveCustomerCompany`
  - `reactivateCustomerCompany`
  - `bulkArchiveCustomerCompanies`
  - `exportCustomerCompaniesCSV`

**Repositorios**:

- Expandir `src/lib/repositories/customer-repository.ts` con queries adicionales:
  - `findByTaxId`
  - `searchByName`
  - `countByStatus`
  - `findWithRelations` (incluir contactos/facturas)

**Utils**:

- `src/lib/utils/import/company-importer.ts` (lógica de import específica)
- `src/lib/utils/export/company-exporter.ts` (lógica de export CSV)
- `src/lib/utils/validation/tax-id-validator.ts` (validación de taxId)

**API Routes**:

- `src/app/api/portfolio/companies/route.ts` (GET list, POST create)
- `src/app/api/portfolio/companies/[id]/route.ts` (GET detail, PATCH update)
- `src/app/api/portfolio/companies/[id]/archive/route.ts` (POST archive)
- `src/app/api/portfolio/companies/bulk/archive/route.ts` (POST bulk archive)
- `src/app/api/portfolio/companies/export/route.ts` (GET export CSV)
- `src/app/api/import/companies/validate/route.ts` (POST validate)
- `src/app/api/import/companies/execute/route.ts` (POST execute)

**Migraciones**:

- `prisma/migrations/YYYYMMDDHHMMSS_add_tax_id_unique_constraint/migration.sql`
- `prisma/migrations/YYYYMMDDHHMMSS_add_company_search_indexes/migration.sql` (opcional)

**Seeds**:

- `prisma/seeds/seed-companies.ts`

**Tests** (opcional en v1, pero documentar):

- `tests/integration/companies.test.ts`
- `tests/e2e/companies-flow.spec.ts` (Playwright)

### Archivos a modificar

**Páginas existentes**:

- `src/app/(app)/portfolio/companies/page.tsx` (expandir funcionalidad)
- `src/app/(app)/portfolio/companies/[id]/page.tsx` (mejorar tabs)

**Componentes existentes**:

- `src/components/customers/customer-table.tsx` (agregar bulk selection, ordenación)
- `src/components/customers/customer-overview.tsx` (mejorar diseño)
- `src/components/shared/empty-state.tsx` (verificar variantes)

**Layouts**:

- `src/app/(app)/layout.tsx` (verificar que no se rompa)

**Documentación**:

- `docs/architecture.md` (agregar constraint de unicidad taxId)
- `docs/overview.md` (mencionar Import Wizard si aplica)
- `docs/env-vars.md` (agregar variables si se usan nuevas)

---

## 12. Estimación y Orden de Trabajo

### Estimación por tarea

| # | Tarea | Días | Complejidad |

|---|-------|------|-------------|

| 1 | Revisar código existente y documentación | 0.5 | Baja |

| 2 | Crear/actualizar migraciones (taxId unique) | 0.5 | Baja |

| 3 | Expandir repositorio con queries adicionales | 1 | Media |

| 4 | Expandir servicios con métodos de negocio | 1 | Media |

| 5 | Crear API routes (CRUD + bulk + export) | 1.5 | Media |

| 6 | Implementar lista con filtros y búsqueda | 1.5 | Media |

| 7 | Implementar paginación server-side | 1 | Media |

| 8 | Implementar bulk actions (UI + backend) | 1 | Media |

| 9 | Implementar formulario crear/editar | 1 | Baja |

| 10 | Mejorar vista 360° (tabs, contadores) | 1.5 | Media |

| 11 | Integrar Import Wizard (mapping, validaciones) | 2 | Alta |

| 12 | Implementar exportación CSV | 0.5 | Baja |

| 13 | Instrumentar telemetría (Sentry) | 1 | Baja |

| 14 | Implementar RBAC (checks en UI y backend) | 1 | Media |

| 15 | Estados vacíos y de error | 0.5 | Baja |

| 16 | QA manual (todos los casos de prueba) | 2 | Media |

| 17 | Testing de performance (5k empresas) | 1 | Media |

| 18 | Accesibilidad (keyboard nav, ARIA) | 1 | Media |

| 19 | Actualizar documentación | 0.5 | Baja |

| 20 | Seeds de prueba | 0.5 | Baja |

**TOTAL**: **20.5 días** (~4 semanas)

### Orden de ejecución

**Semana 1: Fundamentos y Backend**

1. Revisar código y docs (día 1)
2. Crear migraciones (día 1)
3. Expandir repositorio (día 2)
4. Expandir servicios (día 3)
5. Crear API routes (días 4-5)

**Semana 2: UI Principal**

6. Implementar lista con filtros (días 6-7)
7. Implementar paginación (día 8)
8. Implementar bulk actions (día 9)
9. Implementar formulario crear/editar (día 10)

**Semana 3: Features Avanzadas**

10. Mejorar vista 360° (días 11-12)
11. Integrar Import Wizard (días 13-14)
12. Implementar exportación CSV (día 14)
13. Instrumentar telemetría (día 15)

**Semana 4: Pulido y QA**

14. Implementar RBAC (día 16)
15. Estados vacíos y de error (día 16)
16. QA manual (días 17-18)
17. Testing de performance (día 19)
18. Accesibilidad (día 20)
19. Docs y seeds (día 20)

---

## 13. Próximos Pasos (tras aprobación)

1. ✅ Aprobar este plan
2. → Crear rama: `feature/cartera-empresas`
3. → Ejecutar tareas en orden sugerido
4. → Commit frecuente con mensajes descriptivos
5. → Testing continuo durante desarrollo
6. → PR final con checklist de DoD
7. → Demo de funcionalidad completa
8. → Merge a `main`
9. → Deploy a preview/producción
10. → Inicio de Fase 2: Contactos

---

## 14. Notas Finales

### Dependencias críticas

- ✅ Prisma schema CustomerCompany ya existe
- ✅ Auth y org switcher funcionan
- ✅ Servicios base existen
- ❓ Import Wizard general existe? (verificar en BUILD MODE)

### Decisiones de diseño

- **Vista 360°**: Página dedicada (no drawer) para mejor UX
- **Formulario crear**: Modal para rapidez, puede expandir a página si crece
- **Búsqueda**: ILIKE inicialmente, índice GIN solo si lento
- **Import**: Límite 1000 filas en v1
- **Eliminación**: No permitida, solo archivar (reversible)

### Alineación con plan general

Este plan implementa **Fase 1: Empresas** del plan general (`plan-general-cartera.md`).

Cumple con:

- ✅ Tabla paginada con filtros
- ✅ CRUD completo
- ✅ Vista 360° con tabs
- ✅ Bulk actions
- ✅ Import Wizard integrado
- ✅ Telemetría
- ✅ RBAC

Siguiente fase: **Fase 2: Contactos** (plan separado)