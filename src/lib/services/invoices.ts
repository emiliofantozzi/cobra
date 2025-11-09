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
    ): Promise<PaginatedResult<Invoice>> {
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
      const invoiceData = createInvoice(draft);
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
  };

  return service;
}

