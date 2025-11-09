# Configuración de Dominios en Vercel

Este documento describe cómo configurar los dominios `www.hqhelios.com` y `app.hqhelios.com` en Vercel para el proyecto COBRA.

## Dominios Requeridos

- **Marketing**: `www.hqhelios.com` y `hqhelios.com` (ya configurados)
- **App**: `app.hqhelios.com` (pendiente de configurar)

## Pasos para Agregar `app.hqhelios.com`

1. **Accede al Dashboard de Vercel**:
   - Ve a https://vercel.com/dashboard
   - Selecciona el proyecto `cobra`

2. **Agrega el Dominio**:
   - Ve a la sección **Settings** → **Domains**
   - Haz clic en **Add Domain**
   - Ingresa `app.hqhelios.com`
   - Haz clic en **Add**

3. **Configuración DNS**:
   - Vercel te mostrará los registros DNS necesarios
   - Agrega un registro CNAME en tu proveedor DNS:
     ```
     Tipo: CNAME
     Nombre: app
     Valor: cname.vercel-dns.com
     ```

4. **Verificación**:
   - Vercel verificará automáticamente el dominio
   - Una vez verificado, el dominio estará activo

## Configuración de Variables de Entorno

Después de configurar el dominio, asegúrate de actualizar las variables de entorno en Vercel:

- `AUTH_URL`: `https://app.hqhelios.com`
- `NEXT_PUBLIC_APP_URL`: `https://app.hqhelios.com`

## Comportamiento del Middleware

El middleware (`middleware.ts`) enruta automáticamente según el hostname:

- **`www.hqhelios.com` / `hqhelios.com`**: Muestra la landing page de marketing
- **`app.hqhelios.com`**: Muestra la aplicación (auth, dashboard, etc.)

Si un usuario accede a rutas de app desde el dominio de marketing, será redirigido automáticamente a `app.hqhelios.com`.

## Desarrollo Local

En desarrollo local (`localhost:3000`), el middleware usa el pathname para determinar el routing:

- Rutas que empiezan con `/auth`, `/dashboard`, `/onboarding` → Se comportan como app
- Otras rutas → Se comportan como marketing

