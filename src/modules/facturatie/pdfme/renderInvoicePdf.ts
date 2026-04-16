import { generate } from '@pdfme/generator';
import { invoiceTemplate } from './invoiceTemplate';
import { mapInvoiceToPdfmeInput } from './mapInvoiceToPdfmeInput';
import { Invoice, Client } from '../../../data/types';

export const renderInvoicePdf = async (invoice: Invoice, client?: Client, t?: any): Promise<{ blob: Blob; filename: string }> => {
  try {
    const input = mapInvoiceToPdfmeInput(invoice, client, t);
    
    const pdfBytes = await generate({
      template: invoiceTemplate,
      inputs: [input]
    });

    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const filename = `Factuur_${invoice.number}.pdf`;

    return { blob, filename };
  } catch (error) {
    console.error("Failed to generate PDF with pdfme:", error);
    throw new Error(t ? t('facturatie.downloadError') : "Er is een fout opgetreden bij het genereren van de factuur PDF.");
  }
};
