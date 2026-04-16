import { Invoice, Client } from '../../../data/types';
import { apexInvoiceConfig } from '../config/apexInvoiceConfig';
import { getLogo, APEX_LOGO_URL } from '../../../branding/logo';

export const mapInvoiceToPdfmeInput = (invoice: Invoice, client?: Client, t?: any) => {
  const translate = t || ((key: string, fallback: string) => fallback);

  const companyDetails = [
    apexInvoiceConfig.companyName,
    apexInvoiceConfig.address,
    `${translate('facturatie.pdf.tel', 'Tel')}: ${apexInvoiceConfig.phone}`,
    `${translate('facturatie.pdf.email', 'Email')}: ${apexInvoiceConfig.email}`,
    `${translate('facturatie.pdf.web', 'Web')}: ${apexInvoiceConfig.website}`,
    apexInvoiceConfig.kboIbz,
    apexInvoiceConfig.insurance
  ].join('\n');

  const clientDetails = [
    invoice.clientName,
    invoice.clientAddress || client?.address || '',
    invoice.clientVat ? `${translate('facturatie.pdf.vat', 'BTW')}: ${invoice.clientVat}` : (client?.vat ? `${translate('facturatie.pdf.vat', 'BTW')}: ${client.vat}` : '')
  ].filter(Boolean).join('\n');

  const invoiceMeta = [
    `${translate('facturatie.pdf.number', 'Factuurnummer')}: ${invoice.number}`,
    `${translate('facturatie.pdf.invoiceDate', 'Factuurdatum')}: ${new Date(invoice.date).toLocaleDateString()}`,
    `${translate('facturatie.pdf.dueDate', 'Vervaldatum')}: ${new Date(invoice.dueDate).toLocaleDateString()}`,
    `${translate('facturatie.pdf.period', 'Periode')}: ${new Date(invoice.periodStart).toLocaleDateString()} - ${new Date(invoice.periodEnd).toLocaleDateString()}`
  ].join('\n');

  const invoiceTable = invoice.lines.map(line => [
    line.description,
    line.quantity.toString(),
    `€ ${line.unitPrice.toFixed(2)}`,
    `${line.vatRate}%`,
    `€ ${line.totalIncl.toFixed(2)}`
  ]);

  const summary = [
    `${translate('facturatie.pdf.subtotal', 'Subtotaal (excl. BTW)')}: € ${invoice.subtotalExcl.toFixed(2)}`,
    `${translate('facturatie.pdf.vatTotal', 'BTW')}: € ${invoice.vatTotal.toFixed(2)}`,
    `${translate('facturatie.pdf.total', 'Totaal (incl. BTW)')}: € ${invoice.totalIncl.toFixed(2)}`
  ].join('\n');

  const paymentDetails = [
    `${translate('facturatie.pdf.paymentTerms1', 'Gelieve het totaalbedrag over te maken voor')} ${new Date(invoice.dueDate).toLocaleDateString()}`,
    `${translate('facturatie.pdf.paymentTerms2', 'op rekening:')} ${apexInvoiceConfig.iban}`,
    `${translate('facturatie.pdf.paymentTerms3', 'BIC:')} ${apexInvoiceConfig.bic}`,
    `${translate('facturatie.pdf.paymentTerms4', 'Met vermelding van:')} ${invoice.ogm}`
  ].join('\n');

  const footer = `${apexInvoiceConfig.companyName} | ${apexInvoiceConfig.address} | ${apexInvoiceConfig.kboIbz}`;

  return {
    logo: getLogo() || APEX_LOGO_URL,
    companyDetails,
    clientDetails,
    invoiceTitle: `${translate('facturatie.pdf.title', 'FACTUUR')} ${invoice.number}`,
    invoiceMeta,
    invoiceTable,
    summary,
    paymentDetails,
    footer
  };
};
