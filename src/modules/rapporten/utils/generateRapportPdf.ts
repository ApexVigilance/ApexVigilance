import autoTable from 'jspdf-autotable';
import { createPdfDoc, finishPdf } from '../../../utils/pdf/pdfCore';
import { makeRef } from '../../../utils/pdf/ref';
import { FullReport, Client, ClientLocation, Shift } from '../../../data/types';
import i18n from 'i18next'; // Direct import for translations inside generator

export const generateRapportDetailPdf = (
  report: FullReport,
  client?: Client,
  location?: ClientLocation,
  shift?: Shift
): { blob: Blob, filename: string } => {
  const ref = makeRef('RP');
  // Use translations based on current language or fallback to NL
  const typeLabel = i18n.t(`reports.types.${report.type}`) || report.type;
  
  const doc = createPdfDoc({ 
    title: `Rapport: ${typeLabel}`, 
    subTitle: `ID: ${report.id}`, 
    ref 
  });

  const pageWidth = doc.internal.pageSize.width || doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
  let y = 40;

  // -- 1. META DATA TABLE --
  const metaBody = [
    ['Datum', new Date(report.date).toLocaleDateString('nl-BE')],
    ['Auteur', report.author],
    ['Status', i18n.t(`reports.status.${report.status}`)],
    ['Klant', client?.name || (shift?.clientName || 'Onbekend')],
    ['Locatie', location ? `${location.name}, ${location.city}` : (shift?.location || 'Onbekend')]
  ];

  if (shift) {
    metaBody.push(['Shift Info', `${new Date(shift.startTime).toLocaleString()} - ${new Date(shift.endTime).toLocaleString()}`]);
  } else {
    metaBody.push(['Shift Info', 'Geen gekoppelde shift']);
  }

  // Add Incident Specifics if applicable
  if (report.type === 'Incident') {
      metaBody.push(['Categorie', report.category || '-']);
      metaBody.push(['Ernst', i18n.t(`reports.severity.${report.severity}`) || report.severity || '-']);
      if (report.vehicleInfo) metaBody.push(['Voertuig', report.vehicleInfo]);
      if (report.involvedParties) metaBody.push(['Betrokkenen', report.involvedParties]);
  }

  autoTable(doc, {
    startY: y,
    body: metaBody,
    theme: 'grid',
    styles: { cellPadding: 2, fontSize: 10 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40, fillColor: [245, 245, 245] } }
  });

  y = (doc as any).lastAutoTable.finalY + 15;

  // -- 2. CONTENT SECTIONS --
  
  // Content with Page Break logic
  const sections = [
      { title: i18n.t('reports.fields.summary'), text: report.summary },
      { title: i18n.t('reports.fields.details'), text: report.details || report.activities }
  ];

  sections.forEach(sec => {
      if (!sec.text) return;
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(sec.title, 14, y);
      y += 6;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      const lines = doc.splitTextToSize(sec.text, pageWidth - 28);
      
      // Check of tekst op pagina past, anders nieuwe pagina
      if (y + (lines.length * 5) > pageHeight - 40) {
          doc.addPage();
          y = 20;
      }
      
      doc.text(lines, 14, y);
      y += (lines.length * 5) + 10;
  });

  // -- 3. IMAGES (Grid Layout) --
  if (report.images && report.images.length > 0) {
      if (y > pageHeight - 60) { doc.addPage(); y = 20; }
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(i18n.t('reports.fields.photos'), 14, y);
      y += 10;

      const imgWidth = 80;
      const imgHeight = 60;
      let xPos = 14;
      
      // Loop images
      report.images.forEach((img, i) => {
          // Check horizontal space
          if (xPos + imgWidth > pageWidth - 14) {
              xPos = 14;
              y += imgHeight + 10;
          }
          // Check vertical space
          if (y + imgHeight > pageHeight - 30) {
              doc.addPage();
              y = 20;
              xPos = 14;
          }

          try {
              doc.addImage(img, 'JPEG', xPos, y, imgWidth, imgHeight);
              xPos += imgWidth + 10;
          } catch (e) {
              console.warn("Image add failed", e);
          }
      });
  }

  return {
    blob: finishPdf(doc),
    filename: `Rapport_${report.id.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
  };
};