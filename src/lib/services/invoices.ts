import {
  createInvoice,
  createInstallment,
  createPayment,
  determineInvoiceStatus,
  determineInstallmentStatus,
  calculateOutstandingAmount,
  createCollectionCase,
  type ContactId,
  type InstallmentDraft,
  type PaymentDraft,
  type Invoice,
  type InvoiceDraft,
  type InvoiceId,
  type CollectionCase,
  type CollectionStage,
  type InvoiceStatus,
  type DateOrigin,
} from "../domain";
import {
  type InvoiceRepository,
  type InstallmentRepository,
  type PaymentRepository,
  type CollectionCaseRepository,
  type RepositoryContext,
  type ListInvoicesParams,
  type PaginatedResult,
} from "../repositories";
import { calculateNextActionAt } from "../utils/invoice-calculations";
import { isValidStatusTransition } from "../utils/validation/invoice-validators";
import type { InvoiceWithCompany } from "../types/invoice-extended";

export interface InvoicesServiceDependencies {
  invoiceRepository: InvoiceRepository;
  installmentRepository: InstallmentRepository;
  paymentRepository: PaymentRepository;
  collectionCaseRepository: CollectionCaseRepository;
}

export interface CreateInvoiceOptions {
  installments?: InstallmentDraft[];
  openCollectionCase?: boolean;
  primaryContactId?: ContactId;
  stageOverride?: CollectionStage;
}

export interface RecordPaymentOptions {
  propagateToInstallments?: boolean;
}

export function createInvoicesService(deps: InvoicesServiceDependencies) {
  const { invoiceRepository, installmentRepository, paymentRepository, collectionCaseRepository } = deps;

  const service = {
    async listInvoices(
      context: RepositoryContext,
      params?: ListInvoicesParams,
    ): Promise<PaginatedResult<InvoiceWithCompany>> {
      return invoiceRepository.list(context, params);
    },

    async getInvoice(context: RepositoryContext, invoiceId: InvoiceId): Promise<Invoice | null> {
      return invoiceRepository.findById(context, invoiceId);
    },

    async createInvoice(
      context: RepositoryContext,
      draft: InvoiceDraft,
      options: CreateInvoiceOptions = {},
    ): Promise<{
      invoice: Invoice;
      installments: ReturnType<typeof createInstallment>[];
      collectionCase?: CollectionCase;
    }> {
      // Validar unicidad de número si se proporciona
      if (draft.number) {
        const existing = await invoiceRepository.findByNumber(context, draft.number);
        if (existing) {
          throw new Error(`Ya existe una factura con el número ${draft.number} en tu organización`);
        }
      }

      const invoiceData = createInvoice(draft);
      
      // Calcular nextActionAt antes de crear
      const tempInvoice: Invoice = {
        ...invoiceData,
        id: "" as InvoiceId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const nextActionAt = calculateNextActionAt(tempInvoice);
      if (nextActionAt) {
        invoiceData.nextActionAt = nextActionAt;
      }

      const invoice = await invoiceRepository.create(context, invoiceData);

      const installments =
        options.installments?.map((installmentDraft, index) =>
          createInstallment({ ...installmentDraft, sequence: installmentDraft.sequence ?? index + 1 }),
        ) ?? [];

      if (installments.length > 0) {
        await installmentRepository.createMany(
          context,
          installments.map((installment) => ({
            ...installment,
            invoiceId: invoice.id,
            organizationId: invoice.organizationId,
          })),
        );
      }

      let collectionCase: CollectionCase | undefined;
      if (options.openCollectionCase) {
        const caseDraft = createCollectionCase({
          organizationId: invoice.organizationId,
          invoiceId: invoice.id,
          primaryContactId: options.primaryContactId,
          stage: options.stageOverride,
        });
        collectionCase = await collectionCaseRepository.create(context, caseDraft);
      }

      return { invoice, installments, collectionCase };
    },

    async recordPayment(
      context: RepositoryContext,
      draft: PaymentDraft,
      options: RecordPaymentOptions = {},
    ): Promise<{ invoice: Invoice; payment: ReturnType<typeof createPayment> }> {
      const paymentData = createPayment(draft);
      const payment = await paymentRepository.create(context, paymentData);

      if (options.propagateToInstallments && payment.installmentId) {
        const installment = await installmentRepository.findById(context, payment.installmentId);
        if (installment) {
          await installmentRepository.updatePaidAmount(context, payment.installmentId, {
            paidAmount: installment.paidAmount + payment.amount,
            paidAt: payment.paidAt,
          });
        } else {
          await installmentRepository.updatePaidAmount(context, payment.installmentId, {
            paidAmount: payment.amount,
          paidAt: payment.paidAt,
        });
        }
      }

      const invoice = await service.recalculateInvoiceStatus(context, payment.invoiceId);

      return { invoice, payment };
    },

    async recalculateInvoiceStatus(context: RepositoryContext, invoiceId: InvoiceId): Promise<Invoice> {
      const invoice = await invoiceRepository.findById(context, invoiceId);
      if (!invoice) {
        throw new Error(`Invoice ${invoiceId} not found`);
      }

      const [installments, payments] = await Promise.all([
        installmentRepository.listByInvoice(context, invoiceId),
        paymentRepository.list(context, { invoiceId, pagination: { limit: 500 } }),
      ]);

      const normalizedInstallments = installments.map((installment) => ({
        ...installment,
        status: determineInstallmentStatus(installment),
      }));

      const outstanding = calculateOutstandingAmount(
        invoice.amount,
        payments.data,
      );

      const nextStatus = determineInvoiceStatus({
        invoice,
        installments: normalizedInstallments,
        payments: payments.data,
      });

      if (nextStatus !== invoice.status) {
        return invoiceRepository.setStatus(context, invoiceId, nextStatus);
      }

      if (outstanding <= 0) {
        return invoice;
      }

      return invoice;
    },

    async searchInvoices(
      context: RepositoryContext,
      query: string,
      limit = 100
    ): Promise<Invoice[]> {
      return invoiceRepository.searchByNumberOrCompany(context, query, limit);
    },

    async updateExpectedPaymentDate(
      context: RepositoryContext,
      invoiceId: InvoiceId,
      expectedPaymentDate: Date | null,
      dateOrigin: DateOrigin | null,
      reason?: string,
      changedBy?: string
    ): Promise<Invoice> {
      const invoice = await invoiceRepository.updateExpectedPaymentDate(
        context,
        invoiceId,
        expectedPaymentDate,
        dateOrigin,
        changedBy || context.actorId
      );

      // Recalcular nextActionAt
      const nextActionAt = calculateNextActionAt(invoice);
      if (nextActionAt !== invoice.nextActionAt) {
        return invoiceRepository.update(context, invoiceId, { nextActionAt: nextActionAt ?? undefined });
      }

      return invoice;
    },

    async recordPaymentPromise(
      context: RepositoryContext,
      invoiceId: InvoiceId,
      promiseDate: Date,
      reason?: string
    ): Promise<Invoice> {
      const invoice = await invoiceRepository.findById(context, invoiceId);
      if (!invoice) {
        throw new Error(`Invoice ${invoiceId} not found`);
      }

      // Validar que la promesa sea fecha futura
      if (promiseDate < new Date()) {
        throw new Error("La promesa de pago debe ser una fecha futura");
      }

      const updated = await invoiceRepository.update(context, invoiceId, {
        paymentPromiseDate: promiseDate,
      });

      // Recalcular nextActionAt
      const nextActionAt = calculateNextActionAt(updated);
      if (nextActionAt !== updated.nextActionAt) {
        return invoiceRepository.update(context, invoiceId, { nextActionAt: nextActionAt ?? undefined });
      }

      return updated;
    },

    async markInvoiceAsPaid(
      context: RepositoryContext,
      invoiceId: InvoiceId,
      paymentReference?: string
    ): Promise<Invoice> {
      const invoice = await invoiceRepository.findById(context, invoiceId);
      if (!invoice) {
        throw new Error(`Invoice ${invoiceId} not found`);
      }

      // Validar transición
      if (!isValidStatusTransition(invoice.status, "PAID")) {
        throw new Error(`No se puede cambiar de ${invoice.status} a PAID`);
      }

      const updated = await invoiceRepository.setStatus(context, invoiceId, "PAID");

      // Recalcular nextActionAt (debe ser null para pagadas)
      if (updated.nextActionAt !== null) {
        return invoiceRepository.update(context, invoiceId, { nextActionAt: undefined });
      }

      return updated;
    },

    async markInvoiceAsDisputed(
      context: RepositoryContext,
      invoiceId: InvoiceId,
      reason: string
    ): Promise<Invoice> {
      const invoice = await invoiceRepository.findById(context, invoiceId);
      if (!invoice) {
        throw new Error(`Invoice ${invoiceId} not found`);
      }

      // Actualizar notas con motivo de disputa
      const disputeNote = `[DISPUTA] ${reason}\n${invoice.notes || ""}`;
      return invoiceRepository.update(context, invoiceId, {
        notes: disputeNote,
        lastResult: `Disputa: ${reason}`,
      });
    },

    async cancelInvoice(
      context: RepositoryContext,
      invoiceId: InvoiceId,
      reason: string
    ): Promise<Invoice> {
      const invoice = await invoiceRepository.findById(context, invoiceId);
      if (!invoice) {
        throw new Error(`Invoice ${invoiceId} not found`);
      }

      // Validar transición
      if (!isValidStatusTransition(invoice.status, "CANCELLED")) {
        throw new Error(`No se puede cancelar una factura con estado ${invoice.status}`);
      }

      const updated = await invoiceRepository.setStatus(context, invoiceId, "CANCELLED");

      // Actualizar notas con motivo y recalcular nextActionAt
      const cancelNote = `[CANCELADA] ${reason}\n${invoice.notes || ""}`;
      return invoiceRepository.update(context, invoiceId, {
        notes: cancelNote,
        nextActionAt: undefined,
      });
    },

    async bulkUpdateExpectedDates(
      context: RepositoryContext,
      invoiceIds: InvoiceId[],
      expectedPaymentDate: Date,
      dateOrigin: DateOrigin,
      reason?: string,
      changedBy?: string
    ): Promise<Invoice[]> {
      const results: Invoice[] = [];
      for (const invoiceId of invoiceIds) {
        try {
          const updated = await service.updateExpectedPaymentDate(
            context,
            invoiceId,
            expectedPaymentDate,
            dateOrigin,
            reason,
            changedBy
          );
          results.push(updated);
        } catch (error) {
          // Continuar con las demás aunque una falle
          console.error(`Error updating invoice ${invoiceId}:`, error);
        }
      }
      return results;
    },

    async bulkMarkAsPaid(
      context: RepositoryContext,
      invoiceIds: InvoiceId[],
      paymentReference?: string
    ): Promise<Invoice[]> {
      const results: Invoice[] = [];
      for (const invoiceId of invoiceIds) {
        try {
          const updated = await service.markInvoiceAsPaid(
            context,
            invoiceId,
            paymentReference
          );
          results.push(updated);
        } catch (error) {
          // Continuar con las demás aunque una falle
          console.error(`Error marking invoice ${invoiceId} as paid:`, error);
        }
      }
      return results;
    },

    async getInvoicesByChip(
      context: RepositoryContext,
      chip: "sin_fecha" | "con_fecha" | "vence_hoy" | "vencidas" | "con_promesa_hoy" | "promesa_incumplida" | "pagadas",
      today: Date = new Date()
    ): Promise<Invoice[]> {
      switch (chip) {
        case "sin_fecha":
          return invoiceRepository.findWithoutExpectedDate(context);
        case "vence_hoy":
          return invoiceRepository.findDueDateToday(context, today);
        case "vencidas":
          return invoiceRepository.findOverdue(context, today);
        case "con_promesa_hoy":
          return invoiceRepository.findWithPromiseToday(context, today);
        case "promesa_incumplida":
          return invoiceRepository.findWithPromiseMissed(context, today);
        case "pagadas":
          return invoiceRepository.list(context, {
            status: ["PAID"],
            pagination: { limit: 1000 },
          }).then((result) => result.data);
        case "con_fecha":
          return invoiceRepository.list(context, {
            expectedPaymentDateFrom: new Date(0),
            expectedPaymentDateTo: new Date("2100-01-01"),
            pagination: { limit: 1000 },
          }).then((result) => result.data);
        default:
          return [];
      }
    },

    async getChipCounts(
      context: RepositoryContext,
      today: Date = new Date()
    ): Promise<{
      sin_fecha: number;
      con_fecha: number;
      vence_hoy: number;
      vencidas: number;
      con_promesa_hoy: number;
      promesa_incumplida: number;
      disputa: number;
      pagadas: number;
    }> {
      const [
        sinFecha,
        venceHoy,
        vencidas,
        conPromesaHoy,
        promesaIncumplida,
        pagadas,
        conFecha,
      ] = await Promise.all([
        invoiceRepository.findWithoutExpectedDate(context).then((invoices) => invoices.length),
        invoiceRepository.findDueDateToday(context, today).then((invoices) => invoices.length),
        invoiceRepository.findOverdue(context, today).then((invoices) => invoices.length),
        invoiceRepository.findWithPromiseToday(context, today).then((invoices) => invoices.length),
        invoiceRepository.findWithPromiseMissed(context, today).then((invoices) => invoices.length),
        invoiceRepository.countByFilters(context, { status: ["PAID"] }),
        invoiceRepository.countByFilters(context, {
          expectedPaymentDateFrom: new Date(0),
          expectedPaymentDateTo: new Date("2100-01-01"),
        }),
      ]);

      // Disputa: por ahora retornamos 0 (futuro: campo separado o en CollectionCase)
      return {
        sin_fecha: sinFecha,
        con_fecha: conFecha,
        vence_hoy: venceHoy,
        vencidas: vencidas,
        con_promesa_hoy: conPromesaHoy,
        promesa_incumplida: promesaIncumplida,
        disputa: 0,
        pagadas: pagadas,
      };
    },
  };

  return service;
}

