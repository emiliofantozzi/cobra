/**
 * Normalizes organization names for uniqueness checks.
 * 
 * Rules:
 * - Trim whitespace
 * - Convert to lowercase
 * - Remove accents/diacritics
 * - Collapse multiple spaces into single space
 * 
 * This ensures that "Mi Empresa", "mi empresa", "Mi  Empresa", and "Mí Empresa"
 * are all treated as the same name for uniqueness purposes.
 */
export function normalizeOrganizationName(name: string): string {
  return name
    .trim()
    .normalize("NFD") // Decompose characters (é -> e + ´)
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .toLowerCase()
    .replace(/\s+/g, " ") // Collapse multiple spaces
    .trim();
}

