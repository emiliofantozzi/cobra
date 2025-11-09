import "server-only";

import { createCustomersService } from "./customers";
import { createInvoicesService } from "./invoices";
import { createCollectionCasesService } from "./collection-cases";
import { createCustomerCompanyRepository } from "../repositories/customer-company-repository";
import { createContactRepository } from "../repositories/contact-repository";
import { createInvoiceRepository } from "../repositories/invoice-repository";
import { createInstallmentRepository } from "../repositories/installment-repository";
import { createPaymentRepository } from "../repositories/payment-repository";
import { createCollectionCaseRepository } from "../repositories/collection-case-repository";
import { createCommunicationAttemptRepository } from "../repositories/communication-attempt-repository";
import { createAgentRunRepository } from "../repositories/agent-run-repository";
import type { RepositoryContext } from "../repositories";

export function getServices(context: RepositoryContext) {
  const customerCompanyRepository = createCustomerCompanyRepository();
  const contactRepository = createContactRepository();
  const invoiceRepository = createInvoiceRepository();
  const installmentRepository = createInstallmentRepository();
  const paymentRepository = createPaymentRepository();
  const collectionCaseRepository = createCollectionCaseRepository();
  const communicationAttemptRepository = createCommunicationAttemptRepository();
  const agentRunRepository = createAgentRunRepository();

  const customersService = createCustomersService({
    customerCompanyRepository,
    contactRepository,
  });

  const invoicesService = createInvoicesService({
    invoiceRepository,
    installmentRepository,
    paymentRepository,
    collectionCaseRepository,
  });

  const collectionCasesService = createCollectionCasesService({
    collectionCaseRepository,
    communicationAttemptRepository,
    agentRunRepository,
  });

  return {
    customersService,
    invoicesService,
    collectionCasesService,
  };
}

