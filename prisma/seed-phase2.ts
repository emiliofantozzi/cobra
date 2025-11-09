import { PrismaClient, CommunicationChannel } from '@prisma/client';

const prisma = new PrismaClient();

async function seedPhase2() {
  console.log('Starting Phase 2 seeds...');
  
  const orgs = await prisma.organization.findMany();
  
  if (orgs.length === 0) {
    console.log('No organizations found. Skipping seed.');
    return;
  }

  console.log(`Found ${orgs.length} organization(s). Seeding templates and playbooks...`);
  
  for (const org of orgs) {
    // Seed 5 plantillas esenciales
    const templates = [
      {
        organizationId: org.id,
        key: 'request-expected-date',
        name: 'Solicitar fecha esperada',
        description: 'Solicita al cliente que indique cuándo espera realizar el pago',
        channel: CommunicationChannel.EMAIL,
        subject: 'Solicitud de fecha de pago - Factura {invoiceNumber}',
        body: 'Hola {contactName},\n\nEsperamos que te encuentres bien. Nos gustaría conocer cuándo esperas realizar el pago de la factura {invoiceNumber} por un monto de {amount} {currency}.\n\nPor favor, confirma la fecha esperada de pago para poder coordinar mejor el seguimiento.\n\nQuedamos atentos a tu respuesta.\n\nSaludos cordiales,\n{organizationName}',
        variables: {
          contactName: 'string',
          invoiceNumber: 'string',
          amount: 'number',
          currency: 'string',
          organizationName: 'string'
        }
      },
      {
        organizationId: org.id,
        key: 'pre-due-reminder',
        name: 'Recordatorio pre-vencimiento',
        description: 'Recordatorio amigable antes de que venza la factura',
        channel: CommunicationChannel.EMAIL,
        subject: 'Recordatorio: Factura {invoiceNumber} vence pronto',
        body: 'Hola {contactName},\n\nTe recordamos que la factura {invoiceNumber} por un monto de {amount} {currency} vence el {dueDate}.\n\nSi ya realizaste el pago, por favor ignora este mensaje. Si tienes alguna consulta o necesitas coordinar el pago, no dudes en contactarnos.\n\nSaludos cordiales,\n{organizationName}',
        variables: {
          contactName: 'string',
          invoiceNumber: 'string',
          amount: 'number',
          currency: 'string',
          dueDate: 'date',
          organizationName: 'string'
        }
      },
      {
        organizationId: org.id,
        key: 'promise-confirmation',
        name: 'Confirmación de promesa',
        description: 'Confirma la promesa de pago del cliente',
        channel: CommunicationChannel.EMAIL,
        subject: 'Confirmación de promesa de pago - Factura {invoiceNumber}',
        body: 'Hola {contactName},\n\nGracias por confirmar que realizarás el pago de la factura {invoiceNumber} por un monto de {amount} {currency} el {promiseDate}.\n\nQuedamos atentos al pago en la fecha acordada. Si surge algún inconveniente, por favor avísanos con anticipación.\n\nSaludos cordiales,\n{organizationName}',
        variables: {
          contactName: 'string',
          invoiceNumber: 'string',
          amount: 'number',
          currency: 'string',
          promiseDate: 'date',
          organizationName: 'string'
        }
      },
      {
        organizationId: org.id,
        key: 'post-due-reminder',
        name: 'Recordatorio post-vencimiento',
        description: 'Recordatorio firme después de que venció la factura',
        channel: CommunicationChannel.EMAIL,
        subject: 'Factura {invoiceNumber} vencida - Acción requerida',
        body: 'Hola {contactName},\n\nLa factura {invoiceNumber} por un monto de {amount} {currency} venció el {dueDate} y aún no hemos recibido el pago.\n\nPor favor, coordina el pago a la brevedad posible. Si ya realizaste el pago, comparte el comprobante para actualizar nuestros registros.\n\nSi tienes alguna dificultad para realizar el pago, contáctanos para buscar una solución.\n\nSaludos cordiales,\n{organizationName}',
        variables: {
          contactName: 'string',
          invoiceNumber: 'string',
          amount: 'number',
          currency: 'string',
          dueDate: 'date',
          organizationName: 'string'
        }
      },
      {
        organizationId: org.id,
        key: 'escalation',
        name: 'Escalamiento',
        description: 'Mensaje de escalamiento para casos críticos',
        channel: CommunicationChannel.EMAIL,
        subject: 'URGENTE: Factura {invoiceNumber} - Escalamiento',
        body: 'Hola {contactName},\n\nLa factura {invoiceNumber} por un monto de {amount} {currency} lleva {daysOverdue} días de vencida sin recibir respuesta.\n\nEs urgente que coordines el pago o nos contactes para resolver esta situación. Si no recibimos respuesta en las próximas 48 horas, procederemos a escalar el caso.\n\nPor favor, contáctanos de inmediato.\n\nSaludos cordiales,\n{organizationName}',
        variables: {
          contactName: 'string',
          invoiceNumber: 'string',
          amount: 'number',
          currency: 'string',
          daysOverdue: 'number',
          organizationName: 'string'
        }
      }
    ];

    for (const template of templates) {
      await prisma.messageTemplate.upsert({
        where: {
          organizationId_key: {
            organizationId: org.id,
            key: template.key
          }
        },
        update: {},
        create: template
      });
    }

    console.log(`✓ Seeded ${templates.length} templates for organization ${org.name}`);

    // Seed 4 playbooks preset
    const playbooks = [
      {
        organizationId: org.id,
        key: 'soft',
        name: 'Suave',
        description: 'Enfoque amigable y flexible, ideal para clientes de confianza',
        config: {
          stages: [
            { stage: 'INITIAL', delayDays: 3, template: 'pre-due-reminder' },
            { stage: 'REMINDER_1', delayDays: 7, template: 'post-due-reminder' },
            { stage: 'REMINDER_2', delayDays: 14, template: 'request-expected-date' },
            { stage: 'ESCALATED', delayDays: 30, template: 'escalation' }
          ],
          maxAttempts: 4,
          tone: 'friendly',
          channels: ['EMAIL']
        }
      },
      {
        organizationId: org.id,
        key: 'standard',
        name: 'Estándar',
        description: 'Secuencia balanceada de recordatorios y seguimiento',
        config: {
          stages: [
            { stage: 'INITIAL', delayDays: 1, template: 'pre-due-reminder' },
            { stage: 'REMINDER_1', delayDays: 3, template: 'post-due-reminder' },
            { stage: 'REMINDER_2', delayDays: 7, template: 'request-expected-date' },
            { stage: 'ESCALATED', delayDays: 15, template: 'escalation' }
          ],
          maxAttempts: 4,
          tone: 'professional',
          channels: ['EMAIL', 'WHATSAPP']
        }
      },
      {
        organizationId: org.id,
        key: 'firm',
        name: 'Firme',
        description: 'Enfoque más directo y urgente para casos críticos',
        config: {
          stages: [
            { stage: 'INITIAL', delayDays: 0, template: 'post-due-reminder' },
            { stage: 'REMINDER_1', delayDays: 2, template: 'request-expected-date' },
            { stage: 'REMINDER_2', delayDays: 5, template: 'escalation' },
            { stage: 'ESCALATED', delayDays: 10, template: 'escalation' }
          ],
          maxAttempts: 4,
          tone: 'firm',
          channels: ['EMAIL', 'WHATSAPP', 'SMS']
        }
      },
      {
        organizationId: org.id,
        key: 'enterprise',
        name: 'Enterprise',
        description: 'Secuencia completa con múltiples canales y seguimiento detallado',
        config: {
          stages: [
            { stage: 'INITIAL', delayDays: 2, template: 'pre-due-reminder', channel: 'EMAIL' },
            { stage: 'REMINDER_1', delayDays: 5, template: 'post-due-reminder', channel: 'EMAIL' },
            { stage: 'REMINDER_2', delayDays: 10, template: 'request-expected-date', channel: 'WHATSAPP' },
            { stage: 'ESCALATED', delayDays: 20, template: 'escalation', channel: 'EMAIL' }
          ],
          maxAttempts: 5,
          tone: 'professional',
          channels: ['EMAIL', 'WHATSAPP', 'SMS'],
          requireConfirmation: true
        }
      }
    ];

    for (const playbook of playbooks) {
      await prisma.playbook.upsert({
        where: {
          organizationId_key: {
            organizationId: org.id,
            key: playbook.key
          }
        },
        update: {},
        create: playbook
      });
    }

    console.log(`✓ Seeded ${playbooks.length} playbooks for organization ${org.name}`);
  }

  console.log('Phase 2 seeds completed successfully');
}

seedPhase2()
  .catch(e => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

