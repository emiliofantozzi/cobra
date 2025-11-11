import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const roles = ["BILLING_AP", "OPERATIONS", "DECISION_MAKER", "OTHER"] as const;
const channels = ["EMAIL", "WHATSAPP", "SMS", "PHONE"] as const;
const languages = ["es", "en", "pt", "fr"] as const;
const timezones = [
  "America/Santiago",
  "America/Mexico_City",
  "America/Bogota",
  "America/Buenos_Aires",
  "America/Lima",
  "America/New_York",
  "Europe/Madrid",
] as const;

const firstNames = [
  "Juan", "María", "Carlos", "Ana", "Luis", "Laura", "Pedro", "Carmen",
  "Miguel", "Patricia", "José", "Sandra", "Francisco", "Lucía", "Antonio",
  "Elena", "Manuel", "Isabel", "Javier", "Marta", "Roberto", "Cristina",
  "Fernando", "Andrea", "Ricardo", "Natalia", "Alejandro", "Paula", "Daniel",
  "Monica", "Rafael", "Claudia", "Sergio", "Adriana", "Alberto", "Verónica",
];

const lastNames = [
  "García", "Rodríguez", "López", "Martínez", "González", "Pérez", "Sánchez",
  "Ramírez", "Torres", "Flores", "Rivera", "Gómez", "Díaz", "Cruz", "Morales",
  "Ortiz", "Gutiérrez", "Chávez", "Ramos", "Jiménez", "Ruiz", "Herrera",
  "Medina", "Aguilar", "Vargas", "Castro", "Méndez", "Fernández", "Moreno",
];

const positions = [
  "Gerente de Operaciones",
  "Director Financiero",
  "Jefe de Contabilidad",
  "Coordinador de Pagos",
  "Analista de Cuentas por Pagar",
  "Gerente General",
  "Director Comercial",
  "Asistente Administrativo",
];

function randomElement<T>(array: readonly T[]): T {
  return array[Math.floor(Math.random() * array.length)]!;
}

function randomBoolean(probability = 0.5): boolean {
  return Math.random() < probability;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function seedContacts() {
  console.log("🌱 Seeding contacts...");

  // Get all organizations and their companies
  const organizations = await prisma.organization.findMany({
    include: {
      customerCompanies: {
        where: { status: "ACTIVE" },
        take: 20, // Limit companies per org
      },
    },
  });

  if (organizations.length === 0) {
    console.log("⚠️  No organizations found. Please seed organizations first.");
    return;
  }

  let totalCreated = 0;

  for (const org of organizations) {
    if (org.customerCompanies.length === 0) {
      console.log(`⚠️  Organization ${org.name} has no companies. Skipping...`);
      continue;
    }

    console.log(`📝 Creating contacts for organization: ${org.name}`);

    for (const company of org.customerCompanies) {
      // Create 2-4 contacts per company
      const contactsPerCompany = randomInt(2, 4);
      let primarySet = false;
      let billingSet = false;

      for (let i = 0; i < contactsPerCompany; i++) {
        const firstName = randomElement(firstNames);
        const lastName = randomElement(lastNames);
        const hasEmail = randomBoolean(0.8);
        const hasPhone = randomBoolean(0.7);
        const hasWhatsapp = randomBoolean(0.6);

        // Ensure at least one channel
        const email = hasEmail ? `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${company.name.toLowerCase().replace(/\s+/g, "")}.com` : null;
        const phoneNumber = hasPhone ? `+56${randomInt(9, 9)}${randomInt(1000000, 9999999)}` : null;
        const whatsappNumber = hasWhatsapp ? (phoneNumber || `+56${randomInt(9, 9)}${randomInt(1000000, 9999999)}`) : null;

        // Determine preferred channel
        let preferredChannel: string | null = null;
        if (email) preferredChannel = "EMAIL";
        else if (whatsappNumber) preferredChannel = "WHATSAPP";
        else if (phoneNumber) preferredChannel = "PHONE";

        // Email status
        const emailStatus = email ? (randomBoolean(0.9) ? "DELIVERABLE" : randomBoolean(0.5) ? "BOUNCE" : "UNKNOWN") : "UNKNOWN";

        // WhatsApp status
        const whatsappStatus = whatsappNumber
          ? randomBoolean(0.7) ? "VALIDATED" : randomBoolean(0.8) ? "NOT_VALIDATED" : randomBoolean(0.9) ? "UNKNOWN" : "BLOCKED"
          : "NOT_VALIDATED";

        // Opt-out
        const optedOutEmail = randomBoolean(0.1);
        const optedOutWhatsapp = randomBoolean(0.05);
        const optedOutEmailAt = optedOutEmail ? new Date(Date.now() - randomInt(1, 90) * 24 * 60 * 60 * 1000) : null;
        const optedOutWhatsappAt = optedOutWhatsapp ? new Date(Date.now() - randomInt(1, 90) * 24 * 60 * 60 * 1000) : null;

        // Working hours window (60% have it)
        const hasWorkingHours = randomBoolean(0.6);
        const workingHoursWindow = hasWorkingHours
          ? {
              start: `${randomInt(8, 9)}:00`,
              end: `${randomInt(17, 18)}:00`,
              days: [1, 2, 3, 4, 5], // Monday to Friday
            }
          : null;

        const contact = await prisma.contact.create({
          data: {
            organizationId: org.id,
            customerCompanyId: company.id,
            firstName,
            lastName,
            email,
            phoneNumber,
            whatsappNumber,
            position: randomBoolean(0.7) ? randomElement(positions) : null,
            role: randomElement(roles),
            preferredChannel: preferredChannel as any,
            emailStatus: emailStatus as any,
            whatsappStatus: whatsappStatus as any,
            isPrimary: !primarySet && randomBoolean(0.3),
            isBillingContact: !billingSet && randomBoolean(0.2),
            optedOutEmail,
            optedOutEmailAt,
            optedOutWhatsapp,
            optedOutWhatsappAt,
            language: randomBoolean(0.8) ? randomElement(languages) : null,
            timezone: randomBoolean(0.7) ? randomElement(timezones) : null,
            workingHoursWindow: workingHoursWindow as any,
            hasOptedOut: optedOutEmail || optedOutWhatsapp,
            notes: randomBoolean(0.3) ? `Notas sobre ${firstName} ${lastName}` : null,
          },
        });

        if (contact.isPrimary) primarySet = true;
        if (contact.isBillingContact) billingSet = true;

        totalCreated++;
      }
    }
  }

  console.log(`✅ Created ${totalCreated} contacts`);
}

seedContacts()
  .catch((e) => {
    console.error("❌ Error seeding contacts:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

