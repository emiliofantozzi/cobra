import type { InvoiceStatus, DateOrigin } from "@/lib/domain/invoices/invoice";

/**
 * Valida que una transición de estado sea permitida según la matriz de transiciones.
 * @param from Estado actual
 * @param to Estado destino
 * @returns true si la transición es válida
 */
export function isValidStatusTransition(
  from: InvoiceStatus,
  to: InvoiceStatus
): boolean {
  const transitions: Record<InvoiceStatus, InvoiceStatus[]> = {
    DRAFT: ["PENDING", "PAID", "CANCELLED"],
    PENDING: ["PARTIALLY_PAID", "PAID", "OVERDUE", "CANCELLED"],
    PARTIALLY_PAID: ["PAID", "OVERDUE", "CANCELLED"],
    OVERDUE: ["PAID", "CANCELLED"],
    PAID: ["PENDING"], // Solo Admin con auditoría
    CANCELLED: [], // Terminal
  };

  return transitions[from]?.includes(to) ?? false;
}

/**
 * Valida que un monto sea válido (positivo, máximo 2 decimales).
 * @param amount Monto a validar
 * @returns true si es válido
 */
export function isValidAmount(amount: number): boolean {
  if (amount <= 0) return false;
  if (amount > 999_999_999.99) return false;
  
  // Verificar que tenga máximo 2 decimales
  const decimalPlaces = (amount.toString().split(".")[1] || "").length;
  return decimalPlaces <= 2;
}

/**
 * Valida que una moneda sea ISO 4217 válida.
 * Lista común de monedas LATAM + principales internacionales.
 * @param currency Código de moneda
 * @returns true si es válida
 */
export function isValidCurrency(currency: string): boolean {
  const validCurrencies = [
    "USD", "EUR", "GBP", "JPY", "CHF", "CAD", "AUD", "NZD",
    "CLP", "MXN", "ARS", "COP", "BRL", "PEN", "UYU", "PYG",
    "BOB", "VES", "GTQ", "HNL", "NIO", "CRC", "PAB", "DOP",
    "HTG", "JMD", "BBD", "BZD", "XCD", "AWG", "ANG", "SRD",
  ];
  return validCurrencies.includes(currency.toUpperCase());
}

/**
 * Valida que las fechas sean consistentes.
 * @param issueDate Fecha de emisión
 * @param dueDate Fecha de vencimiento
 * @param expectedPaymentDate Fecha esperada de pago (opcional)
 * @returns Objeto con isValid y errorMessage si aplica
 */
export function validateInvoiceDates(
  issueDate: Date,
  dueDate: Date,
  expectedPaymentDate?: Date
): { isValid: boolean; errorMessage?: string } {
  if (issueDate > dueDate) {
    return {
      isValid: false,
      errorMessage: "La fecha de emisión debe ser anterior o igual a la fecha de vencimiento",
    };
  }

  if (expectedPaymentDate) {
    if (expectedPaymentDate < issueDate) {
      return {
        isValid: false,
        errorMessage: "La fecha esperada debe ser posterior o igual a la fecha de emisión",
      };
    }
  }

  return { isValid: true };
}

/**
 * Valida que una promesa de pago sea válida (fecha futura).
 * @param promiseDate Fecha de promesa
 * @param today Fecha de referencia (default: hoy)
 * @returns true si es válida
 */
export function isValidPromiseDate(
  promiseDate: Date,
  today: Date = new Date()
): boolean {
  const promise = new Date(promiseDate);
  promise.setHours(0, 0, 0, 0);
  const ref = new Date(today);
  ref.setHours(0, 0, 0, 0);
  return promise >= ref;
}

/**
 * Valida que el origen de fecha sea requerido si hay fecha esperada.
 * @param expectedPaymentDate Fecha esperada (opcional)
 * @param dateOrigin Origen de fecha (opcional)
 * @returns true si es válido
 */
export function validateDateOrigin(
  expectedPaymentDate?: Date,
  dateOrigin?: DateOrigin
): { isValid: boolean; errorMessage?: string } {
  if (expectedPaymentDate && !dateOrigin) {
    return {
      isValid: false,
      errorMessage: "Debe seleccionar el origen de la fecha esperada",
    };
  }
  return { isValid: true };
}

/**
 * Normaliza un número de factura (trim, uppercase, remover espacios).
 * @param number Número de factura
 * @returns Número normalizado
 */
export function normalizeInvoiceNumber(number: string): string {
  return number.trim().toUpperCase().replace(/\s+/g, "");
}

/**
 * Valida formato de número de factura (alfanumérico, guiones, guiones bajos).
 * @param number Número de factura
 * @returns true si es válido
 */
export function isValidInvoiceNumber(number: string): boolean {
  if (number.length === 0 || number.length > 50) return false;
  // Alfanumérico, guiones, guiones bajos
  return /^[A-Z0-9_-]+$/i.test(number);
}

