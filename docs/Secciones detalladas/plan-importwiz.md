Prompt · Import Wizard (Empresas, Contactos, Facturas, Segmentos) — PLAN → BUILD

Contexto base
Usa como referencia:

@plan-cartera-general.md

@overview.md

@architecture.md (o @architecture.fmd)

@layout-navui.md

Subplanes previos: @plan-empresas.md, @plan-contactos.md, @plan-facturas.md, @plan-segmentos.md (si existe)

Restricción
Auth / sign-in / sign-out / rutas protegidas ya funcionan. No tocar eso. Enfocarse en lo post-login y en las migraciones/cambios necesarios para que el Import Wizard opere de punta a punta.

Alcance y libertad técnica
Objetivo: CREAR el Import Wizard integral para Empresas, Contactos, Facturas y Segmentos (lite). Tienes libertad para modificar tablas, BD, migraciones, MCPs, colas/procesos y almacenamiento si es necesario. Registra los cambios y actualiza @overview.md, @architecture.md, @layout-navui.md solo si es necesario para mantener consistencia.

1) Objetivo de tu tarea

Entregar un Import Wizard robusto que permita:

Subir archivos (CSV y, si procede, XLSX) por entidad.

Mapear columnas → campos internos con sugerencias inteligentes.

Validar en dry-run (tipos, formatos, unicidad, referenciales, políticas por entidad).

Previsualizar resultados (muestra, conteos, advertencias).

Aplicar (upsert/insert/best-effort o all-or-nothing, según política).

Reportar errores/avisos descargables.

Registrar telemetría, auditoría y trazabilidad por job.

Primero redacta un plan específico (PLAN MODE) y, con mi aprobación, ejecuta (BUILD MODE).

2) Entregables
2.1 PLAN MODE — plan-import-wizard.md

Estructura requerida del plan:

Resumen y alcance

Entidades cubiertas: Empresas, Contactos, Facturas, Segmentos (lite).

Formatos soportados: CSV UTF-8 (obligatorio), XLSX (opcional si acelera uso).

Límite de tamaño por archivo y filas (define valores realistas y estrategia para chunking/streaming).

IA/UX del Wizard (multi-paso)

Paso 0 (selección de entidad): Empresas / Contactos / Facturas / Segmentos.

Paso 1 (upload): arrastrar/soltar, muestra metadata (nombre, filas estimadas, encoding).

Paso 2 (detectar estructura): separador (,, ;, \t), comillas, header row, encoding/BOM, hoja XLSX.

Paso 3 (mapping):

Tabla con columnas origen y campo interno; sugerencias por similitud, sinónimos y ejemplo de datos.

Indicadores de obligatorio/opcional, tipo esperado, ejemplos válidos.

Plantillas de mapeo guardables por organización (crear/usar/actualizar).

Paso 4 (dry-run/validación):

Conteo de filas OK, advertencias, errores por tipo.

Muestra de n filas con validaciones.

Política de aplicación seleccionable (all-or-nothing vs best-effort) si procede.

Paso 5 (aplicar):

Progreso con % y conteos (insertados, actualizados, omitidos, con error).

Link a informe de errores descargable (CSV).

Resumen final y botón “Ver datos” (deep-link a la vista de la entidad).

Historial de importaciones: lista de jobs con estado, usuario, fecha, entidad, conteos, enlaces a reportes.

Reglas por entidad (validación + upsert + referenciales)

Empresas

Requeridos: nombre (y, si aplica, identificador fiscal o clave externa).

Unicidad: (org_id, identificador_fiscal) o, si no hay, (org_id, nombre normalizado) — define política clara.

Duplicados: merge/skip según política; log detallado.

Contactos

Requeridos: empresa (vinculación), nombre o al menos canal válido.

Canales: email válido (RFC), teléfono/WhatsApp en E.164 (+51…).

Unicidad sugerida: (org_id, empresa_id, email|whatsapp).

Opt-out por canal; idioma; zona/ventana horaria; preferencia de canal.

Si empresa no existe: política (crear empresa si hay datos mínimos o rechazar fila).

Facturas

Requeridos: empresa, número, monto, moneda (ISO 4217), fecha_emisión, fecha_vencimiento.

Campos de flujo: fecha_esperada_pago, origen_fecha, promesa_pago_fecha, estado.

Unicidad: (org_id, empresa_id, numero).

Validaciones de fechas y precisión monetaria.

Auto-estado: si no hay fecha_esperada_pago → sin_fecha.

Segmentos (lite)

Definición mediante reglas_json o set de reglas UI → serialización válida.

ambito: empresa o factura, obligatorio.

Al activar: materialización de membresías (si está habilitado).

Políticas de aplicación

All-or-nothing (rollback si hay errores críticos).

Best-effort (aplicar filas válidas, log de las rechazadas).

Idempotencia: upsert keys por entidad (ver §3), idempotency_key por job.

Manejo de referenciales: resolución de empresa por id/clave externa/nombre; fallback según política.

Normalización y transformación

Fechas (formatos comunes: YYYY-MM-DD, DD/MM/YYYY, etc.; TZ/locale).

Teléfono/WhatsApp E.164; email RFC.

Moneda ISO 4217; montos con precisión financiera.

Trim/uppercase/lowercase según campo; limpieza de caracteres invisibles; control de miles/decimales.

Arquitectura técnica (alto nivel)

Job runner con estado: pending → analyzing → mapping → validating → applying → completed/failed/cancelled.

Procesamiento por lotes (chunk size configurable p.ej., 1k filas) y streaming para CSV grandes.

Almacenamiento temporal del archivo (p.ej., Supabase Storage) con caducidad.

Cola/worker para aplicar (si volumen): reintentos con backoff.

Atomicidad por lote según política.

Observabilidad: logs por job, errores con stack y Sentry (si está integrado).

Seguridad/PII: cifrado en reposo, purga de archivos temporales, scoping por org_id.

Datos y migraciones (Supabase + Prisma)

import_job: id, org_id, entidad (empresa|contacto|factura|segmento), archivo_url, archivo_hash, estado, politica_aplicacion, idempotency_key, totales_json (contadores), errores_url, created_at, started_at, completed_at, created_by.

import_mapping_template (por organización + entidad): id, org_id, entidad, nombre, mapeo_json (origen→destino+transform), version, created_at, updated_at, created_by.

import_result: id, job_id, fila, resultado (insertado|actualizado|omitido|error), motivo, payload_json, created_at.

Índices adecuados (por org_id, entidad, estado, fechas).

Ajustes en tablas de empresas/contactos/facturas/segmentos si faltan campos clave (ver subplanes).

Migraciones idempotentes y reversibles; backfill si es necesario.

Telemetría (nombres sugeridos)

ui.data.import.opened
ui.data.import.file.uploaded
ui.data.import.mapping.autosuggested
ui.data.import.mapping.saved_template
ui.data.import.dryrun.started
ui.data.import.dryrun.completed
ui.data.import.apply.started
ui.data.import.apply.completed
ui.data.import.download.errors
ui.data.import.history.opened


Metadatos: org, user, entidad, job_id, totales (ok/error/omitidos/actualizados), duración, timestamp.

RBAC

Admin/Operador: crear jobs, aplicar; ver historial; descargar errores.

Auditor: solo lectura/historial.

Limitar acceso a jobs por org_id.

Criterios de aceptación (globales)

CSV de 10k–50k filas se valida (dry-run) con feedback progresivo y se aplica en tiempos razonables con chunking.

Mapeo con sugerencias y plantillas reutilizables por entidad/organización.

Dry-run muestra conteos, muestra de filas y razones de error claras.

All-or-nothing y best-effort operativos (seleccionables).

Unicidad y referenciales respetados por entidad; política consistente.

Reporte de errores descargable (CSV) con fila, columna y motivo.

Historial de importaciones con estados y enlaces.

Telemetría y auditoría registran eventos clave.

Auth intacto; todo scopiado por organización.

QA / DoD

Casos: encoding (UTF-8 con/ sin BOM), separadores (,/;/TAB), headers duplicados/faltantes, filas vacías, números con miles/decimales, fechas variadas, monedas inválidas, teléfonos sin +, empresas inexistentes, duplicados.

Accesibilidad básica (teclado/ARIA).

Rendimiento validado en datasets grandes; sin OOM.

RBAC verificado; no-regresión de auth.

Documentación actualizada solo si es necesario.

Riesgos y mitigaciones

Archivos grandes → streaming + chunking + worker/cola + límites.

Datos sucios → normalización + mensajes claros + best-effort opcional.

Claves de upsert mal definidas → políticas por entidad y validación previa.

Referenciales (empresa no encontrada) → decisión “crear o rechazar” configurable por job.

Timeouts → procesamiento asíncrono y reintentos con backoff; checkpoint por lote.

Formato de respuesta (PLAN MODE):

Entrega el índice + contenido del plan siguiendo lo anterior.

Propón la ruta para guardar plan-import-wizard.md.

Espera mi confirmación para guardarlo y pasar a BUILD MODE.

2.2 BUILD MODE — Implementación

Tras mi OK del plan:

Implementa el Wizard multi-paso (upload → detectar → mapping → dry-run → aplicar → historial).

Implementa sugerencias de mapeo (sinónimos + sample values + persistencia de plantillas).

Implementa validadores por entidad (tipos, formatos, unicidad, referenciales).

Implementa aplicación con política seleccionada (all-or-nothing/best-effort), chunking/streaming, colas y reintentos.

Implementa job state y historial; genera reporte de errores descargable.

Crea/aplica migraciones (Supabase + Prisma) y actualiza docs madre solo si es necesario.

Instrumenta telemetría y Sentry (si está en el stack).

Ejecuta QA/DoD.

Formato de respuesta (BUILD MODE):

Detalla cambios (UI/server/jobs/migraciones/telemetría/almacenamiento).

Lista archivos tocados (ruta relativa) y diffs de alto nivel.

Confirma performance, accesibilidad, RBAC y no-regresión de auth.

Señala riesgos/remanentes.

3) Orden sugerido de trabajo

Revisar @plan-cartera-general.md, @overview.md, @architecture.md, @layout-navui.md, @plan-empresas.md, @plan-contactos.md, @plan-facturas.md.

Diseñar IA/UX del Wizard y su state machine de job.

Definir políticas por entidad (upsert keys, referenciales, normalización).

Diseñar migraciones (import_job, import_mapping_template, import_result + ajustes en entidades).

Implementar upload + sniffing (delimitador/encoding/header).

Implementar mapping con sugerencias + plantillas.

Implementar dry-run (validación por entidad) con muestra y conteos.

Implementar apply (chunking/cola/reintentos) + reportes de error.

Implementar historial de jobs y descargas.

Instrumentar telemetría + Sentry (si procede).

Ejecutar QA/DoD y actualizar documentación si es necesario.

Instrucción final
Comienza en PLAN MODE. Entrega el borrador de plan-import-wizard.md siguiendo la estructura indicada y sugiere la ruta para guardarlo. Luego espera mi confirmación para guardarlo y pasar a BUILD MODE.