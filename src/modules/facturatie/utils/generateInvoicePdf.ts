
import autoTable from 'jspdf-autotable';
import { createPdfDoc, finishPdf } from '../../../utils/pdf/pdfCore';
import { Invoice } from '../../../data/types';
import { APEX_LOGO_URL, getLogo } from '../../../branding/logo';

export const generateInvoicePdf = (invoice: Invoice): { blob: Blob, filename: string } => {
  // Use createPdfDoc but we will override some things or just use it for basic setup
  // Actually, createPdfDoc adds a header we might not want exactly as is, but let's see.
  // The user wants "Apex logo, Volledige bedrijfsgegevens, IBAN + BIC, OGM vermelding..."
  // createPdfDoc adds "Ref: ... Export: ... Apex Vigilance Group" at top right.
  // We want "FACTUUR" and invoice details at top right.
  // So maybe we just use new jsPDF() and finishPdf().
  // But finishPdf adds the footer.
  
  // Let's use a clean jsPDF instance to have full control over the header.
  const doc = createPdfDoc({ title: '', ref: '' }); // We will overwrite the header area or just ignore it.
  // Actually createPdfDoc writes to y=20. We can overwrite or just start fresh.
  // Better to just create a new jsPDF instance and use finishPdf.
  
  // Wait, I cannot import jsPDF directly if I want to use the one from pdfCore? 
  // pdfCore exports `createPdfDoc` which returns a doc.
  // I'll use `createPdfDoc` but pass empty strings to avoid default text if possible, 
  // or just clear the page.
  
  // Let's just use the doc returned by createPdfDoc and overwrite the top area with a white rectangle if needed, 
  // or just accept that `createPdfDoc` puts some metadata.
  // The `createPdfDoc` puts "Ref: " and "Export: " at top right.
  // Invoice needs "Factuurnummer", "Datum", etc.
  
  // Let's modify `generateInvoicePdf` to NOT use `createPdfDoc` for the content, 
  // but use `finishPdf` for the footer.
  
  // We need to import jsPDF. `pdfCore` imports it.
  // I will assume I can import jsPDF.
  
  const pageWidth = doc.internal.pageSize.width || doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
  const margin = 14;

  // Clear the default header from createPdfDoc if it conflicts (it might overlap).
  // A simple way is to draw a white box over the top area.
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, 40, 'F');

  // 1. Header
  // Logo Top Left
  const logoData = getLogo() || APEX_LOGO_URL;
  try {
    doc.addImage(logoData, 'PNG', margin, 10, 40, 15); 
  } catch (e) {
    console.warn("Logo add failed", e);
    doc.setFontSize(20);
    doc.setTextColor(0);
    doc.text("APEX", margin, 20);
  }

  // Invoice Details Top Right
  const rightX = pageWidth - margin;
  let headerY = 20;

  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text("FACTUUR", rightX, headerY, { align: 'right' });
  
  headerY += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const headerInfo = [
    [`Factuurnummer:`, invoice.number],
    [`Datum:`, new Date(invoice.date).toLocaleDateString('nl-BE')],
    [`Vervaldatum:`, new Date(invoice.dueDate).toLocaleDateString('nl-BE')]
  ];

  headerInfo.forEach(([label, value]) => {
    doc.text(`${label} ${value}`, rightX, headerY, { align: 'right' });
    headerY += 5;
  });

  // 2. Client Info (Left) & Company Info (Right - optional, but usually on footer. Let's keep client left)
  let clientY = 50;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.clientName, margin, clientY);
  clientY += 5;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  if (invoice.clientAddress) {
    const addressLines = doc.splitTextToSize(invoice.clientAddress, 80);
    doc.text(addressLines, margin, clientY);
    clientY += (addressLines.length * 5);
  }
  if (invoice.clientVat) {
    doc.text(invoice.clientVat, margin, clientY);
  }

  // 3. Table
  const startY = 85;
  const columns = [
    "OMSCHRIJVING",
    "AANTAL",
    "EENHEIDSPRIJS",
    "TOTAAL EXCL. BTW"
  ];

  const rows = invoice.lines.map(line => [
    line.description,
    line.quantity.toFixed(2),
    `€ ${line.unitPrice.toFixed(2)}`,
    `€ ${line.totalExcl.toFixed(2)}`
  ]);

  autoTable(doc, {
    startY: startY,
    head: [columns],
    body: rows,
    theme: 'grid',
    headStyles: { 
      fillColor: [212, 175, 55], // Apex Gold
      textColor: 0,
      fontStyle: 'bold',
      halign: 'left'
    },
    styles: { 
      fontSize: 9,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 'auto', halign: 'left' },
      1: { cellWidth: 25, halign: 'right' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 35, halign: 'right', fontStyle: 'bold' }
    }
  });

  // 4. Totals
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  const totalsX = pageWidth - margin;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // Subtotal
  doc.text("Subtotaal:", totalsX - 40, finalY, { align: 'right' });
  doc.text(`€ ${invoice.subtotalExcl.toFixed(2)}`, totalsX, finalY, { align: 'right' });

  // VAT
  const vatY = finalY + 6;
  doc.text("BTW 21%:", totalsX - 40, vatY, { align: 'right' });
  doc.text(`€ ${invoice.vatTotal.toFixed(2)}`, totalsX, vatY, { align: 'right' });

  // Divider
  doc.setDrawColor(0);
  doc.line(totalsX - 60, vatY + 3, totalsX, vatY + 3);

  // Total
  const totalY = vatY + 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text("TOTAAL:", totalsX - 40, totalY, { align: 'right' });
  doc.text(`€ ${invoice.totalIncl.toFixed(2)}`, totalsX, totalY, { align: 'right' });

  // 5. Payment Info & OGM
  const infoY = totalY + 20;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0);

  // Bank Info
  doc.text("Gelieve te betalen op rekeningnummer:", margin, infoY);
  doc.setFont('helvetica', 'bold');
  doc.text("BE12 3456 7890 1234", margin + 60, infoY); // Example IBAN, replace with real if available in store/config
  doc.setFont('helvetica', 'normal');
  doc.text("(BIC: GEBABEBB)", margin + 100, infoY);

  // OGM
  if (invoice.ogm) {
      const ogmY = infoY + 10;
      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      // OGM Box
      doc.rect(margin, ogmY, 100, 12);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text("+++ " + invoice.ogm + " +++", margin + 50, ogmY + 8, { align: 'center' });
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text("Gelieve deze mededeling te gebruiken bij betaling.", margin, ogmY + 16);
  }

  // Payment Term
  const termY = infoY + 30;
  doc.setFontSize(9);
  doc.text("Betalingstermijn: 30 dagen na factuurdatum.", margin, termY);

  // 6. Finish with Footer
  const blob = finishPdf(doc);

  return {
    blob,
    filename: `Factuur_${invoice.number}.pdf`
  };
};
