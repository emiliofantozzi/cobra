# MCPs del proyecto (`mcps.md`)

> Este documento describe los **Model Context Protocol (MCPs)** que se usarán con Cursor para este proyecto:
> qué hacen, qué permisos requieren y cómo deben utilizarse.

Los MCPs permiten que Cursor actúe como un “agente extendido” con acceso a:

- Repositorios (GitHub),
- Infraestructura (Supabase, Vercel),
- Testing (Playwright),
- Observabilidad (Sentry),
- Contexto documental (Context7),
- Otros servicios (Resend, etc.).

**Regla general**:  
Todos los MCPs deben usar variables de entorno documentadas en `docs/env-vars.md` para sus credenciales. Nunca se deben hardcodear tokens en los archivos de configuración MCP.

---

## 1. Lista de MCPs previstos

MCPs principales que se contemplan para COBRA:

1. **GitHub MCP**
2. **Supabase MCP**
3. **Vercel MCP**
4. **Resend / Email MCP** (si se usa alguno)
5. **Sentry MCP** (si se usa alguno para issues/logs)
6. **Context7 MCP**
7. **Playwright MCP** (para E2E testing asistido)
8. Otros MCPs de utilidad (p.ej. para shadcn/ui o tooling específico).

Este documento es conceptual: la configuración exacta (endpoints, JSON, etc.) irá en los archivos de configuración de Cursor (por ejemplo dentro de `.cursor/` o donde corresponda).

---

## 2. GitHub MCP

### 2.1. Propósito

Permite a Cursor:

- Leer y navegar el código del repositorio remoto (GitHub).
- Crear y comentar issues.
- Crear descripciones de PRs.
- Ayudar a mantener un changelog o notas de release.

### 2.2. Credenciales

Usa:

- `GITHUB_PERSONAL_ACCESS_TOKEN`

Reglas:

- Debe ser un **Fine-grained Personal Access Token** limitado al repo de COBRA.
- Scopes mínimos:
  - Lectura: `contents:read` (obligatorio).
  - Escritura (`contents:write`, `issues:write`) solo si se desea que el agente cree issues o PRs automáticamente.

### 2.3. Buen uso

Ejemplos de peticiones razonables a Cursor usando este MCP:

- “Revisa los últimos commits en `main` y dime qué cambios hicieron.”
- “Crea un issue en GitHub describiendo este bug y proponiendo pasos de reproducción.”
- “Genera el changelog de la versión X basado en los PRs merged desde el último tag.”

---

## 3. Supabase MCP

### 3.1. Propósito

Permite a Cursor interactuar con la base de datos gestionada en Supabase:

- Inspeccionar el esquema (tablas, tipos, índices).
- Analizar consultas o explicar problemas de rendimiento.
- Opcionalmente ejecutar consultas controladas (solo lectura, salvo indicación explícita).

### 3.2. Credenciales

Usa:

- `SUPABASE_URL`
- `SUPABASE_TOKEN` (service role key o token con permisos ampliados)

Reglas:

- Este token tiene permisos potentes sobre la BD – usarlo con cuidado.
- Por defecto, las operaciones deben ser de **solo lectura** (describir tablas, sugerir cambios).
- Solo ejecutar ALTER/DELETE/UPDATE si el usuario lo pide y revisa el SQL.

### 3.3. Buen uso

- “Muestra el esquema actual de las tablas relacionadas con facturas y cobranzas y sugiere mejoras.”
- “¿Qué índice recomiendas para acelerar esta consulta que filtra por `organizationId` y `status`?”
- “Valida que todos los modelos de Prisma tengan sus columnas correspondientes en la BD.”

---

## 4. Vercel MCP

### 4.1. Propósito

Permite a Cursor:

- Inspeccionar deployments de Vercel.
- Ver logs de errores de funciones serverless.
- Ver o sugerir cambios en configuración de proyecto (sin aplicarlos automáticamente salvo instrucción).

### 4.2. Credenciales

Usa:

- `VERCEL_API_TOKEN`

Reglas:

- El token debe estar limitado al scope del proyecto y equipo correspondiente.
- No cambiar variables de entorno de producción sin confirmación explícita del usuario.

### 4.3. Buen uso

- “Revisa el último deployment fallido en Vercel y explícame por qué falló.”
- “Mira los logs de la API de login y dime qué error está ocurriendo.”

---

## 5. Resend / Email MCP

### 5.1. Propósito

Si se utiliza un MCP o integración específica para Resend, su propósito es:

- Revisar logs de envíos de emails.
- Probar plantillas de correo (sin tocar código).
- Ayudar a depurar problemas de entrega.

### 5.2. Credenciales

Normalmente reutiliza:

- `RESEND_API_KEY`

Reglas:

- Nunca exponer la key en logs o respuestas.
- Limitar el uso del MCP a operaciones que no modifiquen configuraciones sensibles sin confirmación.

### 5.3. Buen uso

- “Recupera los últimos 20 emails enviados desde `cobranzas@tudominio.com` y dime cuántos han fallado.”
- “Valida que la plantilla de recordatorio de factura se vea correctamente con estos datos de ejemplo.”

---

## 6. Sentry MCP

### 6.1. Propósito

Permite:

- Consultar issues activos en Sentry.
- Ver tendencias de errores por release o por entorno.
- Ayudar a priorizar bugs críticos.

### 6.2. Credenciales

Podría usar:

- `SENTRY_DSN` (para contexto)
- `SENTRY_AUTH_TOKEN` (para API / sentry-cli)

Reglas:

- No modificar proyectos, organizaciones o configuración de Sentry de forma automática.
- Foco en **lectura**, análisis y recomendaciones.

### 6.3. Buen uso

- “Dame un resumen de los errores más frecuentes en producción en las últimas 24 horas.”
- “Encuentra los errores relacionados con WhatsApp y dime qué endpoints fallan.”

---

## 7. Context7 MCP

### 7.1. Propósito

Context7 sirve como capa de **búsqueda contextual** sobre documentos, código, discusiones, etc. (dependiendo de cómo se configure).

Se puede usar para:

- Recordar decisiones previas de arquitectura.
- Buscar fragmentos de documentación relevante a una tarea.
- Indexar documentos internos (futuros) sobre cobranzas, flujos del agente, etc.

### 7.2. Credenciales

Usa:

- `CONTEXT7_API_KEY`

Reglas:

- No indexar contenido sensible (datos de clientes reales) sin haber anonimizado.
- Mantener la documentación técnica actualizada para que las búsquedas sean útiles.

### 7.3. Buen uso

- “Busca en la documentación interna la última decisión tomada sobre el modelo `CollectionCase`.”
- “Tráeme cualquier documento donde se haya mencionado ‘WhatsApp webhook’ para ver cómo se definió.”

---

## 8. Playwright MCP

### 8.1. Propósito

Si se expone Playwright como MCP o herramienta, su objetivo es:

- Ayudar a definir y generar tests E2E.
- Ejecutar suites de pruebas (en entornos preparados).
- Analizar fallos de tests automatizados.

### 8.2. Buen uso

- “Genera un test de Playwright que cubra: login con Google, alta de cliente, creación de factura y verificación en el dashboard.”
- “Analiza el reporte de Playwright y dime por qué está fallando el flujo de creación de factura.”

---

## 9. Reglas generales de uso de MCPs en COBRA

1. **Respeto por la arquitectura**  
   - Cualquier cambio que un MCP sugiera sobre BD, código o infraestructura debe respetar lo descrito en:
     - `docs/architecture.md`
     - `.cursorrules`
     - `docs/env-vars.md`

2. **Principio de mínimo privilegio**  
   - Tokens con scopes mínimos.
   - Operaciones destructivas (DELETE/ALTER/UPDATE, cambio de env vars, etc.) solo con instrucción explícita del usuario.

3. **Claridad en prompts**  
   - Siempre que se use un MCP, explicar en el prompt:
     - contexto,
     - qué se quiere lograr,
     - límites (por ejemplo “solo lectura”).

4. **No exponer secretos**  
   - Nunca imprimir tokens, URLs de DB completas ni mensajes con contenido sensible como parte de la respuesta.
   - Si hace falta mostrar un ejemplo, usar valores anonimizados o ficticios.

5. **Logging y auditoría mental**  
   - Antes de aceptar cambios sugeridos por un MCP (sobre todo en infra y BD), revisarlos como si fuese un PR:  
     - ¿Rompe la arquitectura?  
     - ¿Filtra datos de otra organización?  
     - ¿Toca producción sin razón?

---

Este `mcps.md` sirve como guía tanto para humanos como para el propio agente de Cursor sobre **qué puede hacer cada MCP y con qué límites**.  
Cualquier MCP nuevo que se añada al proyecto debe documentarse aquí con al menos: propósito, credenciales y reglas de uso.