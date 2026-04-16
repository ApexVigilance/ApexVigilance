
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PdfInitOptions {
  title: string;
  subTitle?: string;
  ref: string;
}

export const createPdfDoc = ({ title, subTitle, ref }: PdfInitOptions) => {
  const doc = new jsPDF();
  const now = new Date();

  // -- Header --
  doc.setFontSize(18);
  doc.text(title, 14, 20);

  if (subTitle) {
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(subTitle, 14, 26);
  }

  // -- Meta Data (Right Aligned) --
  doc.setFontSize(9);
  doc.setTextColor(100);
  const pageWidth = doc.internal.pageSize.width || doc.internal.pageSize.getWidth();
  
  doc.text(`Ref: ${ref}`, pageWidth - 14, 20, { align: 'right' });
  doc.text(`Export: ${now.toLocaleString('nl-BE')}`, pageWidth - 14, 25, { align: 'right' });
  doc.text(`Apex Vigilance Group`, pageWidth - 14, 30, { align: 'right' });

  // Reset for content
  doc.setTextColor(0);
  
  return doc;
};

export const addApexFooterEachPage = (doc: jsPDF) => {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.width || doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    doc.setFontSize(8);
    doc.setTextColor(100);
    const footerY = pageHeight - 25;

    doc.setDrawColor(200);
    doc.line(14, footerY - 5, pageWidth - 14, footerY - 5);

    // EXACT 4-LINE FOOTER REQUIREMENT FOR PRODUCTION
    const centerX = pageWidth / 2;
    doc.text("Apex Vigilance Group (Apex VG BV)", centerX, footerY, { align: 'center' });
    doc.text("Dorp 65 bus B, 2275 Poederlee (Lille), België", centerX, footerY + 4, { align: 'center' });
    doc.text("T: 0488 60 16 86 | E: info@apexsecurity.be | W: apexsecurity.be", centerX, footerY + 8, { align: 'center' });
    doc.text("KBO/Verg. Nummer IBZ: BE 1007.737.354 | Verzekerd: Vivium (P&V) – polis 3200235321 | Vertrouwelijk document", centerX, footerY + 12, { align: 'center' });

    // Page Numbers
    doc.text(`Pagina ${i} / ${pageCount}`, pageWidth - 14, 10, { align: 'right' });
  }
};

export const downloadPdf = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const finishPdf = (doc: jsPDF): Blob => {
  addApexFooterEachPage(doc);
  return doc.output('blob');
};
