-- Create unique index for taxId per organization (partial index for NULL values)
-- Note: CONCURRENTLY cannot be used in a transaction, so we use regular CREATE INDEX
CREATE UNIQUE INDEX IF NOT EXISTS customer_company_tax_id_per_org 
ON "customer_companies" ("organizationId", "taxId") 
WHERE "taxId" IS NOT NULL;