-- Step 1: Add normalizedName as nullable
ALTER TABLE "Organization" ADD COLUMN "normalizedName" TEXT;

-- Step 2: Populate normalizedName for existing organizations
-- Simple normalization: lowercase and trim, collapse multiple spaces
UPDATE "Organization"
SET "normalizedName" = LOWER(TRIM(REGEXP_REPLACE("name", '\s+', ' ', 'g')));

-- Step 3: Make normalizedName required
ALTER TABLE "Organization" ALTER COLUMN "normalizedName" SET NOT NULL;

-- CreateTable
CREATE TABLE "organization_creation_idempotency" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_creation_idempotency_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organization_creation_idempotency_idempotencyKey_key" ON "organization_creation_idempotency"("idempotencyKey");

-- CreateIndex
CREATE INDEX "organization_creation_idempotency_userId_idx" ON "organization_creation_idempotency"("userId");

-- CreateIndex
CREATE INDEX "organization_creation_idempotency_idempotencyKey_idx" ON "organization_creation_idempotency"("idempotencyKey");

-- CreateIndex
CREATE INDEX "organization_creation_idempotency_organizationId_idx" ON "organization_creation_idempotency"("organizationId");

-- CreateIndex
CREATE INDEX "Organization_normalizedName_idx" ON "Organization"("normalizedName");

-- AddForeignKey
ALTER TABLE "organization_creation_idempotency" ADD CONSTRAINT "organization_creation_idempotency_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_creation_idempotency" ADD CONSTRAINT "organization_creation_idempotency_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
