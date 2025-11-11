-- CreateEnum
CREATE TYPE "ContactRole" AS ENUM ('BILLING_AP', 'OPERATIONS', 'DECISION_MAKER', 'OTHER');

-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('DELIVERABLE', 'BOUNCE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "WhatsAppStatus" AS ENUM ('NOT_VALIDATED', 'VALIDATED', 'BLOCKED', 'UNKNOWN');

-- AlterTable
ALTER TABLE "contacts" ADD COLUMN     "emailStatus" "EmailStatus" NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN     "isBillingContact" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "optedOutEmail" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "optedOutEmailAt" TIMESTAMP(3),
ADD COLUMN     "optedOutWhatsapp" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "optedOutWhatsappAt" TIMESTAMP(3),
ADD COLUMN     "preferredChannel" "CommunicationChannel",
ADD COLUMN     "role" "ContactRole",
ADD COLUMN     "whatsappStatus" "WhatsAppStatus" NOT NULL DEFAULT 'NOT_VALIDATED';

-- CreateIndex
CREATE INDEX "contacts_role_idx" ON "contacts"("role");

-- CreateIndex
CREATE INDEX "contacts_preferredChannel_idx" ON "contacts"("preferredChannel");

-- CreateIndex
CREATE INDEX "contacts_optedOutEmail_idx" ON "contacts"("optedOutEmail");

-- CreateIndex
CREATE INDEX "contacts_optedOutWhatsapp_idx" ON "contacts"("optedOutWhatsapp");

-- CreateIndex
CREATE INDEX "contacts_isBillingContact_idx" ON "contacts"("isBillingContact");

-- CreateIndex
CREATE INDEX "contacts_organizationId_customerCompanyId_email_idx" ON "contacts"("organizationId", "customerCompanyId", "email");

-- CreateIndex
CREATE INDEX "contacts_organizationId_customerCompanyId_whatsappNumber_idx" ON "contacts"("organizationId", "customerCompanyId", "whatsappNumber");

-- Backfill: Migrate hasOptedOut=true to both channels
UPDATE "contacts"
SET 
  "optedOutEmail" = true,
  "optedOutEmailAt" = COALESCE("consentDate", NOW()),
  "optedOutWhatsapp" = true,
  "optedOutWhatsappAt" = COALESCE("consentDate", NOW())
WHERE "hasOptedOut" = true;

-- Create unique constraints (partial indexes, only if field is not null)
CREATE UNIQUE INDEX "contacts_org_company_email_unique" 
ON "contacts" ("organizationId", "customerCompanyId", "email") 
WHERE "email" IS NOT NULL;

CREATE UNIQUE INDEX "contacts_org_company_whatsapp_unique" 
ON "contacts" ("organizationId", "customerCompanyId", "whatsappNumber") 
WHERE "whatsappNumber" IS NOT NULL;
