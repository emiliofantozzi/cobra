# COBRA – Sistema de diseño y guía de UI

Este documento define el **theme**, patrones visuales y reglas de diseño que deben seguir todas las pantallas y componentes de la aplicación COBRA.

El objetivo es que cualquier vista nueva:
- Use **shadcn/ui** como librería base de componentes.
- Use **Tailwind** con **tokens semánticos**, no colores “a mano”.
- Respete el theme definido aquí tanto en **modo claro** como **modo oscuro**.
- Sea consistente en tipografía, espaciado, radios y sombras.

Regla de oro: **no inventar colores ni estilos aleatorios**. Siempre usar las variables y patrones definidos aquí, o bien extenderlos explícitamente en este documento.

---

1. Theme base (CSS + OKLCH)

Este es el theme de referencia. Se usa como fuente de verdad para los tokens de Tailwind (`@theme inline`) y para ajustar componentes de shadcn/ui.

```css
:root {
  --background: oklch(0.9911 0 0);
  --foreground: oklch(0.2046 0 0);
  --card: oklch(0.9911 0 0);
  --card-foreground: oklch(0.2046 0 0);
  --popover: oklch(0.9911 0 0);
  --popover-foreground: oklch(0.4386 0 0);
  --primary: oklch(0.8348 0.1302 160.9080);
  --primary-foreground: oklch(0.2626 0.0147 166.4589);
  --secondary: oklch(0.9940 0 0);
  --secondary-foreground: oklch(0.2046 0 0);
  --muted: oklch(0.9461 0 0);
  --muted-foreground: oklch(0.2435 0 0);
  --accent: oklch(0.9461 0 0);
  --accent-foreground: oklch(0.2435 0 0);
  --destructive: oklch(0.5523 0.1927 32.7272);
  --destructive-foreground: oklch(0.9934 0.0032 17.2118);
  --border: oklch(0.9037 0 0);
  --input: oklch(0.9731 0 0);
  --ring: oklch(0.8348 0.1302 160.9080);
  --chart-1: oklch(0.8348 0.1302 160.9080);
  --chart-2: oklch(0.6231 0.1880 259.8145);
  --chart-3: oklch(0.6056 0.2189 292.7172);
  --chart-4: oklch(0.7686 0.1647 70.0804);
  --chart-5: oklch(0.6959 0.1491 162.4796);
  --sidebar: oklch(0.9911 0 0);
  --sidebar-foreground: oklch(0.5452 0 0);
  --sidebar-primary: oklch(0.8348 0.1302 160.9080);
  --sidebar-primary-foreground: oklch(0.2626 0.0147 166.4589);
  --sidebar-accent: oklch(0.9461 0 0);
  --sidebar-accent-foreground: oklch(0.2435 0 0);
  --sidebar-border: oklch(0.9037 0 0);
  --sidebar-ring: oklch(0.8348 0.1302 160.9080);
  --font-sans: Inter, ui-sans-serif, sans-serif, system-ui;
  --font-serif: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
  --font-mono: monospace;
  --radius: 0.5rem;
  --shadow-x: 0px;
  --shadow-y: 1px;
  --shadow-blur: 3px;
  --shadow-spread: 0px;
  --shadow-opacity: 0.17;
  --shadow-color: #000000;
  --shadow-2xs: 0px 1px 3px 0px hsl(0 0% 0% / 0.09);
  --shadow-xs: 0px 1px 3px 0px hsl(0 0% 0% / 0.09);
  --shadow-sm: 0px 1px 3px 0px hsl(0 0% 0% / 0.17), 0px 1px 2px -1px hsl(0 0% 0% / 0.17);
  --shadow: 0px 1px 3px 0px hsl(0 0% 0% / 0.17), 0px 1px 2px -1px hsl(0 0% 0% / 0.17);
  --shadow-md: 0px 1px 3px 0px hsl(0 0% 0% / 0.17), 0px 2px 4px -1px hsl(0 0% 0% / 0.17);
  --shadow-lg: 0px 1px 3px 0px hsl(0 0% 0% / 0.17), 0px 4px 6px -1px hsl(0 0% 0% / 0.17);
  --shadow-xl: 0px 1px 3px 0px hsl(0 0% 0% / 0.17), 0px 8px 10px -1px hsl(0 0% 0% / 0.17);
  --shadow-2xl: 0px 1px 3px 0px hsl(0 0% 0% / 0.43);
  --tracking-normal: 0.025em;
  --spacing: 0.25rem;
}

.dark {
  --background: oklch(0.1822 0 0);
  --foreground: oklch(0.9288 0.0126 255.5078);
  --card: oklch(0.2046 0 0);
  --card-foreground: oklch(0.9288 0.0126 255.5078);
  --popover: oklch(0.2603 0 0);
  --popover-foreground: oklch(0.7348 0 0);
  --primary: oklch(0.4365 0.1044 156.7556);
  --primary-foreground: oklch(0.9213 0.0135 167.1556);
  --secondary: oklch(0.2603 0 0);
  --secondary-foreground: oklch(0.9851 0 0);
  --muted: oklch(0.2393 0 0);
  --muted-foreground: oklch(0.7122 0 0);
  --accent: oklch(0.3132 0 0);
  --accent-foreground: oklch(0.9851 0 0);
  --destructive: oklch(0.3123 0.0852 29.7877);
  --destructive-foreground: oklch(0.9368 0.0045 34.3092);
  --border: oklch(0.2809 0 0);
  --input: oklch(0.2603 0 0);
  --ring: oklch(0.8003 0.1821 151.7110);
  --chart-1: oklch(0.8003 0.1821 151.7110);
  --chart-2: oklch(0.7137 0.1434 254.6240);
  --chart-3: oklch(0.7090 0.1592 293.5412);
  --chart-4: oklch(0.8369 0.1644 84.4286);
  --chart-5: oklch(0.7845 0.1325 181.9120);
  --sidebar: oklch(0.1822 0 0);
  --sidebar-foreground: oklch(0.6301 0 0);
  --sidebar-primary: oklch(0.4365 0.1044 156.7556);
  --sidebar-primary-foreground: oklch(0.9213 0.0135 167.1556);
  --sidebar-accent: oklch(0.3132 0 0);
  --sidebar-accent-foreground: oklch(0.9851 0 0);
  --sidebar-border: oklch(0.2809 0 0);
  --sidebar-ring: oklch(0.8003 0.1821 151.7110);
  --font-sans: Inter, ui-sans-serif, sans-serif, system-ui;
  --font-serif: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
  --font-mono: monospace;
  --radius: 0.5rem;
  --shadow-x: 0px;
  --shadow-y: 1px;
  --shadow-blur: 3px;
  --shadow-spread: 0px;
  --shadow-opacity: 0.17;
  --shadow-color: #000000;
  --shadow-2xs: 0px 1px 3px 0px hsl(0 0% 0% / 0.09);
  --shadow-xs: 0px 1px 3px 0px hsl(0 0% 0% / 0.09);
  --shadow-sm: 0px 1px 3px 0px hsl(0 0% 0% / 0.17), 0px 1px 2px -1px hsl(0 0% 0% / 0.17);
  --shadow: 0px 1px 3px 0px hsl(0 0% 0% / 0.17), 0px 1px 2px -1px hsl(0 0% 0% / 0.17);
  --shadow-md: 0px 1px 3px 0px hsl(0 0% 0% / 0.17), 0px 2px 4px -1px hsl(0 0% 0% / 0.17);
  --shadow-lg: 0px 1px 3px 0px hsl(0 0% 0% / 0.17), 0px 4px 6px -1px hsl(0 0% 0% / 0.17);
  --shadow-xl: 0px 1px 3px 0px hsl(0 0% 0% / 0.17), 0px 8px 10px -1px hsl(0 0% 0% / 0.17);
  --shadow-2xl: 0px 1px 3px 0px hsl(0 0% 0% / 0.43);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);

  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
  --font-serif: var(--font-serif);

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);

  --shadow-2xs: var(--shadow-2xs);
  --shadow-xs: var(--shadow-xs);
  --shadow-sm: var(--shadow-sm);
  --shadow: var(--shadow);
  --shadow-md: var(--shadow-md);
  --shadow-lg: var(--shadow-lg);
  --shadow-xl: var(--shadow-xl);
  --shadow-2xl: var(--shadow-2xl);

  --tracking-tighter: calc(var(--tracking-normal) - 0.05em);
  --tracking-tight: calc(var(--tracking-normal) - 0.025em);
  --tracking-normal: var(--tracking-normal);
  --tracking-wide: calc(var(--tracking-normal) + 0.025em);
  --tracking-wider: calc(var(--tracking-normal) + 0.05em);
  --tracking-widest: calc(var(--tracking-normal) + 0.1em);
}

body {
  letter-spacing: var(--tracking-normal);
}

---
###

2. Paleta y usos semánticos

Las variables definen tokens semánticos, no colores arbitrarios:

--background / --foreground

Fondo y texto principal de la app.

Usar clases Tailwind equivalentes: bg-background text-foreground.

--card / --card-foreground

Superficie de tarjetas y paneles (por ejemplo dashboards, tarjetas de resumen).

Usar bg-card text-card-foreground + border-border.

--popover / --popover-foreground

Para tooltips, popovers, menús flotantes.

Usar en componentes DropdownMenu, Popover, Tooltip de shadcn.

--primary / --primary-foreground

Color principal de la marca (acciones primarias: botones principales, call-to-action).

Usar en shadcn: variant="default" de Button debería mapear a este esquema.

--secondary / --secondary-foreground

Para botones secundarios, pills neutrales, secciones de apoyo.

--muted / --muted-foreground

Estados “apagados” o secundarios: backgrounds de listas, skeletons, secciones con menos énfasis.

--accent / --accent-foreground

Resaltados, badges, tags que no son la acción principal.

--destructive / --destructive-foreground

Acciones de borrado, cancelación peligrosa, alerts de error.

--border, --input, --ring

Bordes de inputs, tarjetas y focus rings accesibles.

Usar border-border y respetar el ring por defecto de shadcn (focus-visible:ring-ring).

--chart-1 … --chart-5

Paleta para gráficos y visualizaciones.

Usar en cualquier librería de charts (ej. Recharts) como primera opción de colores.

--sidebar*

Colores específicos del layout lateral (sidebar).

Usar en contenedores de navegación: bg-sidebar text-sidebar-foreground, etc.

3. Tipografía

--font-sans: fuente principal → Inter / ui-sans-serif.

--font-serif, --font-mono: para casos especiales (resaltados, código, etc.).

body usa letter-spacing: var(--tracking-normal) para una lectura ligeramente más abierta.

Guidelines:

Texto base: usar Tailwind text-sm / text-base con font-sans.

Títulos:

H1: text-2xl font-semibold tracking-tight

H2: text-xl font-semibold

H3: text-lg font-medium

No cambiar la familia tipográfica por componente.
Los cambios de estilo (peso, tamaño) se hacen con clases de Tailwind.

4. Radios, sombras y densidad
Radios

--radius: 0.5rem (8px).

Derivados:

--radius-sm: esquinas más rectas, para inputs / chips compactos.

--radius-md: uso general.

--radius-lg, --radius-xl: elementos prominentes (modals, tarjetas destacadas).

Regla:
No mezclar muchos valores de radio distintos; utilizar los mapeos que vengan por defecto en shadcn (ajustados a este token) y mantener consistencia.

Sombras

Sombra base: --shadow-sm / --shadow → para tarjetas y elementos interactivos.

--shadow-md / --shadow-lg: para overlays (modals, popovers grandes).

--shadow-2xs / --shadow-xs: apenas visibles; se pueden usar en listas densas.

Evitar:

Sobrecargar la UI con shadow-2xl en todos lados.

Sombras personalizadas con valores arbitrarios si ya existen tokens.

5. Espaciado y layout

--spacing: 0.25rem (4px) → unidad base.

Tailwind ya usa un scale en múltiplos de 4px (p-1, p-2, etc.), así que:

Margen/padding comunes:

p-4, p-6 para tarjetas/páginas.

gap-4, gap-6 en grids/flex.

Densidad preferida:

COBRA es una app de negocio (cobranzas) → media densidad:

Tablas legibles pero sin filas gigantes.

Formularios con buen espaciado vertical (space-y-4 o space-y-5).

6. Modo oscuro

La clase .dark redefine los mismos tokens para modo oscuro.

Regla para el agente / componentes:

Nunca usar hex/rgba “hard-coded” para fondos/textos si ya existe token.

Usar siempre clases semánticas de Tailwind (mapeadas por @theme inline):

bg-background, bg-card, text-foreground, etc.

Para soportar dark mode, bastará con que el layout principal envuelva el contenido en <html className={dark ? "dark" : ""}> o equivalente.

7. shadcn/ui + Tailwind: cómo usarlos con este theme

Los componentes deben venir de shadcn/ui (vía CLI o MCP), no reinventar botones/tablas desde cero.

Después de generar componentes shadcn:

Ajustar solamente clases de Tailwind que hagan referencia a tokens semánticos:

Ej.: bg-primary text-primary-foreground, border-border, bg-card, etc.

Evitar cambiar directamente por colores hexadecimales.

Ejemplos de combinaciones recomendadas:

Botón primario:

bg-primary text-primary-foreground hover:bg-primary/90

Botón secundario:

bg-secondary text-secondary-foreground border-border

Card:

bg-card text-card-foreground border border-border shadow-sm rounded-lg

Panel de sidebar:

bg-sidebar text-sidebar-foreground border-r border-sidebar-border

8. Patrones de UI recomendados para COBRA

Para Fase 3 (UI), los siguientes patrones visuales son recomendados:

Dashboard de cobranzas:

Layout de 2–3 columnas en desktop (grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6).

Cards con bg-card, métricas con text-foreground y etiquetas con text-muted-foreground.

Gráficos usando --chart-* como colores base.

Listados (empresas, contactos, facturas):

Tablas con encabezado claro y filas alternadas usando bg-background / bg-muted muy suave (si hace falta).

Acciones principales (ver, editar) alineadas a la derecha, usando iconos + texto.

Formularios:

Usar componentes de formulario de shadcn (Form, Input, Select, etc.).

Estructura vertical con space-y-4.

Botones primarios alineados a la derecha en footers de formulario.

Timeline de cobranzas:

Diseño tipo “activity feed”:

circle + línea vertical + contenido.

Usar muted / accent para diferenciar eventos importantes.

9. Do / Don’t rápidos

Hacer:

Usar siempre clases bg-*, text-*, border-* y ring-* derivadas de estos tokens.

Basar todos los componentes en shadcn/ui.

Reusar layout de páginas (header fijo, sidebar consistente).

No hacer:

No usar colores arbitrarios (#123456) en nuevos componentes.

No inventar otro set de radios/sombras fuera de lo definido.

No meter CSS inline a lo loco; solo cuando sea necesario y basado en estos tokens.