# Plan Fase 3 – UI COBRA

## Objetivo

- Garantizar que, tras iniciar sesión vía Google OAuth desde la landing pública, el usuario sea redirigido al dashboard protegido.
- Entregar una experiencia navegable donde un usuario autenticado pueda revisar el estado global de cobranzas, explorar clientes/contactos/facturas y ver un timeline básico por caso.
- Alinear toda la UI con el theme definido en `docs/design.md`, reutilizando servicios y tipos creados en la Fase 2.

## Resumen previo

- Fase 1: autenticación Google + bootstrap multi-tenant, Prisma client y Sentry mínimos operativos (`src/lib/auth`, `src/lib/db.ts`, layouts base en `src/app/(app)`).
- Fase 2: modelo Prisma completo, módulos de dominio y servicios (`src/lib/domain`, `src/lib/services`, `src/lib/repositories`) listos para consumo.

## Alcance (In scope)

- Flujo de acceso: landing inicial (`src/app/page.tsx`) con botón de Google que dirige al login y, tras autenticación, redirige a `src/app/(app)/dashboard`.
- Dashboard de cobranzas con métricas, tarjetas y tabla de casos (`src/app/(app)/dashboard`).
- CRUD UI para empresas cliente (`src/app/(app)/customers` + componentes en `src/components/customers`).
- CRUD UI para contactos (`src/app/(app)/contacts`).
- Gestión de facturas y cuotas (`src/app/(app)/invoices`, `src/components/invoices`).
- Vista inicial de timeline de cobranzas por factura/cliente (`src/app/(app)/collections/[caseId]`).
- Componentes compartidos: tablas, formularios, filtros, cards, timeline feed.
- Integración con servicios de Fase 2 o mocks tipados (según disponibilidad de datos) encapsulados en data-fetchers dentro de `src/app/(app)/...`.

## Fuera de alcance

- Automatización del agente IA y envíos reales por Resend/WhatsApp.
- Configuraciones avanzadas de reportes, gráficos complejos o paneles personalizables.
- Implementaciones definitivas de webhooks o cron jobs.
- Pruebas E2E completas (solo se deja preparado el terreno para Fase 7).

## Pasos de ejecución

1. Verificar y pulir el flujo de login Google → dashboard

- Revisar `src/app/page.tsx`, `src/lib/auth/index.ts`, server actions de sign-in y redirecciones.
- **Nota importante**: NextAuth está configurado para usar `AUTH_URL` como dominio base fijo (`url: env.AUTH_URL`), asegurando que los callbacks OAuth siempre usen `hqhelios.com` en producción. La variable `AUTH_URL` debe estar configurada correctamente en Vercel para producción (`https://hqhelios.com`).
- Asegurar middleware/protectores (`src/middleware.ts` si existe) llevan al dashboard tras login.
- Preparar estado de carga y mensajes si la sesión está pendiente.

2. Auditar y ajustar layout base (shell, sidebar, header)

- Rutas: `src/app/(app)/layout.tsx`, `src/components/layout/*`.
- shadcn: `navigation-menu`, `sidebar`, `button`, `avatar`.
- Asegurar tokens de `docs/design.md` en contenedores (`bg-sidebar`, `text-sidebar-foreground`).

3. Definir mapa de rutas y loaders de datos

- Crear páginas servidoras en `src/app/(app)/{dashboard,customers,customers/[id],contacts,invoices,collections/[caseId]}` con server components.
- Implementar adaptadores de datos consumiendo servicios (`createCustomersService`, `createInvoicesService`), con fallback a mocks tipados si la capa de datos no está lista.

4. Importar componentes base shadcn via MCP

- Solicitar por MCP: `card`, `table`, `badge`, `tooltip`, `dialog`, `form`, `input`, `select`, `textarea`, `tabs`, `separator`, `breadcrumb`.
- Centralizar ajustes en `src/components/ui/` respetando theme.

5. Construir Dashboard de cobranzas

- Página: `src/app/(app)/dashboard/page.tsx`.
- Components: `DashboardSummaryCards`, `CaseStatusTable`, `CollectionsChart` (usando `--chart-*`).
- Estados vacíos/carga en `src/components/dashboard/*`.

6. Implementar módulo de empresas cliente

- Páginas: listado (`customers/page.tsx`), detalle (`customers/[id]/page.tsx`).
- Components: `CustomerTable`, `CustomerForm`, `CustomerOverview`.
- shadcn: `datagrid/table`, `sheet` o `dialog` para formularios.

7. Implementar módulo de contactos

- Páginas: `contacts/page.tsx`, `contacts/[id]/page.tsx` o diálogo in-place.
- Components: `ContactTable`, `ContactForm`, `ContactTimelineSnippet`.
- Reutilizar validaciones de dominio para emails/phones.

8. Implementar módulo de facturas y cuotas

- Páginas: `invoices/page.tsx`, `invoices/[id]/page.tsx`.
- Components: `InvoiceTable`, `InvoiceDetail`, `InstallmentsTable`, `PaymentStatusBadge`.
- Manejar estados `InvoiceStatus`, mostrar acciones básicas (registrar pago manual placeholder).

9. Crear vista inicial de timeline de cobranzas

- Ruta: `collections/[caseId]/page.tsx`.
- Components: `CollectionTimeline`, `CommunicationAttemptCard`, `NextActionCallout`.
- shadcn: `timeline` (via `vertical-stepper` pattern con `Separator`, `Badge`).

10. Añadir estados de carga/error/empty unificados

 - Utility components en `src/components/shared/` (`EmptyState`, `LoadingState`, `ErrorState`).
 - Reforzar accesibilidad y mensajes consistentes.

11. Documentar y preparar hooks para integración futura

 - Escribir notas breves en `docs/roadmap.md` sección Fase 3.
 - Exponer adapters de datos (`src/lib/ui-data/`) que luego conectarán con API real.

## Uso de shadcn MCP

- Generar componentes necesarios mediante el MCP para garantizar paridad con el design system.
- Registrar cada componente en `components.json` y aplicar tokens (`bg-card`, `text-muted-foreground`).
- Evitar HTML ad-hoc reutilizando componentes generados o extendiéndolos en `src/components/ui`.

## Relación con dominio/servicios

- Consumir servicios creados en Fase 2: `createCustomersService`, `createContactsService`, `createInvoicesService`, `createCollectionCasesService`.
- Encapsular acceso en helpers (`getCustomersForOrg`, `getDashboardSummary`) que reciban `organizationId` desde la sesión.
- Mientras la BD real esté pendiente, ofrecer `mockDataProvider` con tipos alineados para no romper contratos futuros.

## Criterios de finalización

- El flujo landing → Google sign-in → dashboard funciona y mantiene sesión para todas las rutas protegidas.
- Todas las rutas mencionadas existen y se renderizan sin errores en modo SSR.
- Cada vista muestra datos realistas (de servicios o mocks) y permite acciones básicas de CRUD (formularios listos, aunque persistencia pueda ser mockeada).
- Timeline por caso visualiza al menos comunicaciones y próximo paso.
- UI cumple theme de `docs/design.md` (colores semánticos, radios, sombras) y se apoya en shadcn/ui sin estilos arbitrarios.