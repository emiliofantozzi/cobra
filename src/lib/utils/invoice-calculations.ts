import type { Invoice, DateOrigin } from "@/lib/domain/invoices/invoice";

/**
 * Calcula los días hasta el vencimiento de una factura.
 * @param dueDate Fecha de vencimiento
 * @param today Fecha de referencia (default: hoy)
 * @returns Número positivo si faltan días, negativo si está vencida, 0 si vence hoy
 */
export function calculateDaysToDue(dueDate: Date, today: Date = new Date()): number {
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const ref = new Date(today);
  ref.setHours(0, 0, 0, 0);
  
  const diffTime = due.getTime() - ref.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calcula los días de mora de una factura.
 * @param dueDate Fecha de vencimiento
 * @param today Fecha de referencia (default: hoy)
 * @returns Número de días de mora (0 si no está vencida)
 */
export function calculateDaysOverdue(dueDate: Date, today: Date = new Date()): number {
  const daysToDue = calculateDaysToDue(dueDate, today);
  return daysToDue < 0 ? Math.abs(daysToDue) : 0;
}

/**
 * Determina el estado de seguimiento derivado de una factura (para chips/badges).
 * @param invoice Factura
 * @param today Fecha de referencia (default: hoy)
 * @returns Estado derivado: sin_fecha, con_fecha, vence_hoy, vencida, con_promesa_hoy, promesa_incumplida, pagada, cancelada, pendiente
 */
export function getDerivedTrackingStatus(
  invoice: Invoice,
  today: Date = new Date()
): "sin_fecha" | "con_fecha" | "vence_hoy" | "vencida" | "con_promesa_hoy" | "promesa_incumplida" | "pagada" | "cancelada" | "pendiente" {
  if (invoice.status === "PAID") return "pagada";
  if (invoice.status === "CANCELLED") return "cancelada";

  const daysToDue = calculateDaysToDue(invoice.dueDate, today);
  const todayStr = today.toISOString().split("T")[0];
  const dueDateStr = invoice.dueDate.toISOString().split("T")[0];

  // Sin fecha esperada
  if (!invoice.expectedPaymentDate) return "sin_fecha";

  // Con promesa hoy
  if (invoice.paymentPromiseDate) {
    const promiseDateStr = invoice.paymentPromiseDate.toISOString().split("T")[0];
    if (promiseDateStr === todayStr) return "con_promesa_hoy";
    if (promiseDateStr < todayStr) return "promesa_incumplida";
  }

  // Vence hoy
  if (dueDateStr === todayStr) return "vence_hoy";

  // Vencida
  if (daysToDue < 0) return "vencida";

  // Con fecha esperada
  if (invoice.expectedPaymentDate) return "con_fecha";

  return "pendiente";
}

/**
 * Calcula la próxima acción (nextActionAt) según las reglas de negocio.
 * @param invoice Factura
 * @param today Fecha de referencia (default: hoy)
 * @returns Fecha de próxima acción o null si no aplica
 */
export function calculateNextActionAt(
  invoice: Invoice,
  today: Date = new Date()
): Date | null {
  // Si está pagada o cancelada, no hay próxima acción
  if (invoice.status === "PAID" || invoice.status === "CANCELLED") {
    return null;
  }

  const todayStr = today.toISOString().split("T")[0];
  const dueDateStr = invoice.dueDate.toISOString().split("T")[0];
  const daysToDue = calculateDaysToDue(invoice.dueDate, today);

  // Si sin fecha esperada: próxima acción = hoy + 1 día (agente debe solicitar)
  if (!invoice.expectedPaymentDate) {
    const nextDay = new Date(today);
    nextDay.setDate(nextDay.getDate() + 1);
    return nextDay;
  }

  // Si con fecha esperada y fecha esperada > hoy: próxima acción = fecha esperada - 1 día (recordatorio pre-pago)
  if (invoice.expectedPaymentDate > today) {
    const reminderDate = new Date(invoice.expectedPaymentDate);
    reminderDate.setDate(reminderDate.getDate() - 1);
    return reminderDate;
  }

  // Si vencida y sin promesa: próxima acción = hoy (acción inmediata)
  if (daysToDue < 0 && !invoice.paymentPromiseDate) {
    return today;
  }

  // Si promesa activa: próxima acción = fecha promesa + 1 día (verificar cumplimiento)
  if (invoice.paymentPromiseDate) {
    const verifyDate = new Date(invoice.paymentPromiseDate);
    verifyDate.setDate(verifyDate.getDate() + 1);
    return verifyDate;
  }

  return null;
}

/**
 * Formatea la próxima acción en texto relativo.
 * @param nextActionAt Fecha de próxima acción
 * @param today Fecha de referencia (default: hoy)
 * @returns Texto formateado: "en N días", "hace N días", "hoy", o "-" si no programada
 */
export function formatNextActionRelative(
  nextActionAt: Date | null | undefined,
  today: Date = new Date()
): string {
  if (!nextActionAt) return "-";

  const action = new Date(nextActionAt);
  action.setHours(0, 0, 0, 0);
  const ref = new Date(today);
  ref.setHours(0, 0, 0, 0);

  const diffTime = action.getTime() - ref.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Hoy";
  if (diffDays === 1) return "Mañana";
  if (diffDays === -1) return "Ayer";
  if (diffDays > 0) return `En ${diffDays} días`;
  if (diffDays < 0) return `Hace ${Math.abs(diffDays)} días`;

  return "-";
}

/**
 * Formatea los días a vencimiento en texto.
 * @param daysToDue Días hasta vencimiento (positivo: faltan, negativo: vencida)
 * @returns Texto formateado: "+N", "-N", "Hoy"
 */
export function formatDaysToDue(daysToDue: number): string {
  if (daysToDue === 0) return "Hoy";
  if (daysToDue > 0) return `+${daysToDue}`;
  return `${daysToDue}`;
}

