# Contexto del proyecto: Plataforma de cobranzas asistida por IA

## Visión

Construir una plataforma SaaS donde las empresas puedan delegar a un **agente de inteligencia artificial** todo el proceso operativo de **cobranzas y seguimiento de facturas**, de forma sistemática, trazable y personalizada por cliente.

En lugar de que una persona esté revisando facturas, enviando correos/WhatsApps y persiguiendo respuestas, la plataforma coordina automáticamente este flujo de contacto con los clientes finales, usando reglas y datos definidos por la empresa.

---

## Objetivo principal del aplicativo

El objetivo del producto es:

> **Automatizar el proceso de cobranzas de una empresa usando un agente de IA que se encarga de contactar a los clientes (por correo, WhatsApp y otros canales) para gestionar facturas y pagos pendientes, siguiendo un flujo configurable, hasta conseguir una respuesta o resolución.**

---

## Descripción general de la plataforma

La plataforma es una aplicación web multi-empresa donde:

1. Una empresa usuaria puede:
   - Crear y gestionar **empresas clientes** (sus propios clientes).
   - Definir **contactos** dentro de cada empresa cliente (personas, cargos, emails, teléfonos, WhatsApp).
   - Cargar y mantener **información comercial y de cobranzas**, por ejemplo:
     - Facturas emitidas
     - Cuotas o planes de pago
     - Saldos pendientes
   - Configurar **reglas / preferencias de cobranza**, como frecuencia, tono, idiomas, canales preferidos, horarios, etc. (aunque esto puede evolucionar más adelante).

2. El sistema mantiene un **estado de cobranzas** por cliente:
   - Qué facturas están pendientes
   - Qué comunicaciones se han enviado
   - Respuestas o interacciones recibidas
   - Próximos pasos programados

3. Un **agente de IA de cobranzas**:
   - Se activa de forma periódica (por ejemplo, mediante triggers temporales o eventos).
   - Lee la información de facturas y contactos.
   - Genera y envía mensajes de cobranza (correo electrónico, WhatsApp, etc.).
   - Ajusta sus acciones según la respuesta del cliente (contesta, pide más información, promete pagar, etc.).
   - Registra todo lo que hace dentro de la plataforma (logs, timeline de interacciones, estado de cada factura/cliente).

---

## Tipos de usuarios y contexto de uso

- **Usuario empresa (admin / cobranzas)**  
  - Configura su cuenta/organización.
  - Carga clientes, contactos y facturas.
  - Define reglas de cobranza y revisa paneles de estado.
  - Supervisa al agente, revisa excepciones, interviene manualmente cuando hace falta.

- **Cliente final (deudor)**  
  - No usa directamente la plataforma, pero:
    - Recibe correos / mensajes del agente.
    - Responde por correo/WhatsApp.
    - Puede ser dirigido a páginas específicas (por ejemplo, para pagar o actualizar datos).

---

## Flujo principal del agente de cobranzas (visión de alto nivel)

1. **Ingesta de datos**  
   - La empresa registra o sincroniza clientes, contactos y facturas (manual o vía integraciones a futuro).

2. **Monitoreo de estado**  
   - El agente detecta facturas próximas a vencer, vencidas o en atraso.
   - Aplica reglas definidas por la empresa (ej. número de recordatorios, tono, prioridad).

3. **Automatización de cobranza**  
   - El agente envía mensajes por correo, WhatsApp.
   - Puede seguir una secuencia (recordatorio suave → recordatorio firme → escalamiento, etc.).

4. **Gestión de respuestas**  
   - Cuando el cliente responde, el agente interpreta el mensaje (ej. promesa de pago, disputa, solicitud de factura) y:
     - Actualiza el estado internamente.
     - Puede enviar una respuesta automática adecuada.
     - O marcar el caso para intervención manual.

5. **Registro y trazabilidad**  
   - Todas las interacciones se guardan:
     - Por cliente
     - Por factura
     - Por hilo de comunicación
   - Esto permite a la empresa ver “qué hizo el agente” y en qué punto está cada cobranza.

---


