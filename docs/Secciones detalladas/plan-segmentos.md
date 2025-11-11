Prompt · Subplan Cartera — Segmentos (lite) (PLAN → BUILD)

Contexto base
Usar como referencia: @plan-cartera-general.md, @overview.md, @architecture.md (o @architecture.fmd), @layout-navui.md, y los subplanes ya creados @plan-empresas.md, @plan-contactos.md, @plan-facturas.md.
Restricción: Auth / sign-in / sign-out / rutas protegidas ya funcionan. No tocar eso. Enfocarse en lo visible post-login y en migraciones necesarias para Segmentos.

Alcance y libertad técnica
Tu objetivo es CREAR la sección Segmentos (lite) de Cartera. Tienes libertad para modificar tablas, BD, migraciones, MCPs, etc., si es necesario para cumplir los objetivos. Registra cambios y actualiza @overview.md, @architecture.md, @layout-navui.md solo si es necesario para mantener consistencia.

1) Objetivo de tu tarea

Entregar la sección Segmentos (lite) lista para operar, alineada al plan general y a las entidades Empresas y Facturas (y referenciando Contactos cuando aplique). Primero redacta un plan específico (PLAN MODE) y, con mi aprobación, ejecuta (BUILD MODE).

2) Entregables

2.1 PLAN MODE — plan-cartera-segmentos.md
Estructura requerida del plan:

Resumen y alcance

Sí entra (v1 lite):

Listado de Segmentos y alta/edición/activación.

Builder (lite) de reglas con condiciones AND/OR sobre campos de Empresas y Facturas (p.ej., días de mora, fecha de vencimiento relativa, estado de factura, saldo/monto, tags de empresa, moneda).

Vista previa (conteo + muestra) antes de guardar.

Aplicación como filtro en Cartera (Empresas/Facturas) y en Seguimiento (chips/filtros).

Materialización opcional de membresías para performance (tabla de membresía).

Estados vacíos/errores y telemetría mínima.

No entra (v1):

Segmentación por Contactos como entidad primaria (se puede referenciar indirectamente vía Empresa/Factura).

Programación avanzada tipo campañas; scoring ML.

Integraciones ERP; builder visual complejo.

IA/UX de Segmentos (post-login)

Ubicación/ruta: tab Segmentos dentro de Cartera.

Lista: Nombre, Ámbito (Empresa/Factura), Estado (Borrador/Activo), Última actualización, Tamaño (conteo). Acciones: Crear, Editar, Activar/Desactivar, Duplicar, Eliminar.

Editor (lite) de reglas:

Ámbito del segmento: Empresa o Factura (selección obligatoria).

Constructor con filas: Campo · Operador · Valor; grupos AND/OR (máx. N reglas por v1, p.ej., 10).

Campos sugeridos (ajustar a esquema real):

Empresa: nombre/tags, zona horaria, país/moneda principal (si existe), totales agregados básicos (p.ej., conteo de facturas vencidas).

Factura: estado, fecha_vencimiento (con operadores relativos: “en X días”, “> X días vencida”), monto/moneda, fecha_esperada_pago establecida o no, promesa vigente, días de mora.

Operadores: =, ≠, contiene, no contiene, >, ≥, <, ≤, entre rangos, “está definido/no definido”, “es hoy/esta semana/últimos X días”.

Vista previa: conteo + tabla mini de muestra (10 ítems), con indicación de campos clave.

Guardado: como Borrador o Activo; al activar, recalcular membresía.

Notas: descripción corta del objetivo del segmento.

Uso del segmento:

Chips/filtros en Cartera → Empresas/Facturas.

Chips/filtros en Seguimiento (si aplica al ámbito Factura).

(Opcional) Referencia en Agente/Reglas lite para scope de acciones (si el diseño lo contempla en v1; si no, dejar preparado pero oculto por flag).

Reglas y validaciones

Nombre único por organización y ámbito.

Reglas válidas respecto al esquema real (bloquea campos inexistentes/operadores incompatibles).

Ámbito inmutable una vez creado (para v1) o migración explícita con confirmación.

Vista previa obligatoria antes de activar.

Segmento Activo requiere al menos 1 regla válida.

Eliminación: cascada sobre membresías materializadas.

Inmutabilidad opcional para auditoría: cambios mayores crean versión nueva o guardan histórico de reglas.

Datos y migraciones (Supabase + Prisma)

Tabla segmento (ajustar nombres a convención del repo). Campos sugeridos:

id, org_id, nombre, ambito (empresa|factura), reglas_json (estructura clara y versionada), estado (borrador|activo|inactivo), descripcion, created_at, updated_at, last_refreshed_at.

Tabla segmento_membresia (materializada):

id, segmento_id (FK), entidad_id, ambito (empresa|factura), created_at.

Índices por segmento_id, (segmento_id, entidad_id), y por ambito si aplica.

(Opcional) Tabla segmento_version si se quiere histórico de reglas.

Migraciones idempotentes y reversibles; backfill inicial al activar un segmento.

Documentar cambios en @overview.md / @architecture.md si se altera el modelo.

Motor de evaluación (lite)

Interpretar reglas_json en consultas optimizadas (server-side).

Soporte de operadores relativos de fecha (ej.: “vencen en ≤ X días”, “> X días vencidas”).

Estrategia de refresco:

On-demand (al guardar/activar).

Opcional: refresco periódico simple (flag/configurable).

Performance: evitar full scans sin índices; usa índices en estado, fecha_vencimiento, empresa_id, moneda, monto (ajustar a esquema real).

Integración en UI

Filtros/Chips: en Cartera (Empresas/Facturas) y en Seguimiento (si ámbito Factura).

Indicadores: mostrar nombre del segmento aplicado y conteo resultante.

Empty states: “Este segmento no tiene elementos hoy” + CTA para editar reglas.

Telemetría mínima (eventos sugeridos)

ui.portfolio.segments.created
ui.portfolio.segments.updated
ui.portfolio.segments.activated
ui.portfolio.segments.deactivated
ui.portfolio.segments.preview.ran
ui.portfolio.segments.apply.filter


Metadatos: org, user, segmento_id, ambito, tamaño_conjunto (en preview/activación), timestamp.

RBAC

Admin: crear/editar/activar/desactivar/eliminar; puede ver y gestionar todas las membresías.

Operador: puede usar segmentos como filtro; edición si la política del repo lo permite.

Auditor: solo lectura (lista, detalle, reglas_json legible).

Criterios de aceptación

Lista de Segmentos (paginación server) y búsqueda por nombre/ámbito.

Editor (lite) con AND/OR, validación de reglas y vista previa funcional.

Activación recalcula membresías y muestra conteo.

Segmentos disponibles como filtros/chips en Cartera y Seguimiento (si aplica).

Operaciones típicas (crear/editar/activar) ≤ 2 s en datasets medianos (p.ej., 10k facturas).

Telemetría de eventos clave registrada.

Auth sin cambios; rutas previas a login intactas.

QA / DoD

Casos: crear, editar (cambiar operadores/valores), vista previa, activar/desactivar, filtrar Cartera/Seguimiento por segmento, eliminar.

Accesibilidad básica (teclado/ARIA).

Rendimiento en preview/activación (evitar timeouts).

RBAC verificado.

Actualizar @overview.md/@architecture.md si hubo cambios de datos o flujos.

Riesgos y mitigaciones

Consultas pesadas → índices adecuados y materialización de membresías.

Reglas inválidas → validación UI + server; mensajes claros.

Drift de esquema (campos renombrados) → versionar reglas_json y bloquear reglas obsoletas.

Desalineación con Seguimiento/Agente → pruebas end-to-end con segmentos aplicados.

Formato de respuesta (PLAN MODE):

Entrega el índice + contenido del plan siguiendo lo anterior.

Propón la ruta para guardar plan-cartera-segmentos.md.

Espera mi confirmación para guardarlo y pasar a BUILD MODE.

2.2 BUILD MODE — Implementación
Tras mi OK del plan:

Implementa la lista y el editor (lite) de reglas con vista previa y validación.

Implementa la materialización de membresías y el refresco on-demand (y periódico si se habilita).

Expone los segmentos como filtros/chips en Cartera (Empresas/Facturas) y en Seguimiento (si aplica).

Crea/aplica migraciones (Supabase + Prisma) y actualiza docs solo si es necesario.

Instrumenta telemetría.

Ejecuta QA/DoD.

Formato de respuesta (BUILD MODE):

Detalla cambios (UI/server/migraciones/telemetría).

Lista archivos tocados (ruta relativa) y diffs de alto nivel.

Confirma performance, accesibilidad, RBAC y no-regresión de auth.

Señala riesgos/remanentes.

3) Orden sugerido de trabajo

Revisar @plan-cartera-general.md, @overview.md, @architecture.md, @layout-navui.md, @plan-empresas.md, @plan-contactos.md, @plan-facturas.md.

Proponer IA/UX exacta de Segmentos (lista + editor + preview).

Definir modelo y migraciones necesarias (segmento, segmento_membresia, índices).

Implementar editor y preview; luego guardar como Borrador / Activo.

Implementar materialización y refresco; exponer como filtros en Cartera/Seguimiento.

Instrumentar telemetría.

Ejecutar QA/DoD y actualizar documentación si es necesario.

Instrucción final
Comienza en PLAN MODE. Entrega el borrador de plan-cartera-segmentos.md siguiendo la estructura indicada y sugiere la ruta para guardarlo. Luego espera mi confirmación para guardarlo y pasar a BUILD MODE.