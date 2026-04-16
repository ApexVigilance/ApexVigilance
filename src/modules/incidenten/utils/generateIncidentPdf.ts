
import autoTable from 'jspdf-autotable';
import { createPdfDoc, finishPdf } from '../../../utils/pdf/pdfCore';
import { makeRef } from '../../../utils/pdf/ref';
import { FullIncident, Client, ClientLocation, Shift } from '../../../data/types';
import i18n from '../../../i18n/i18n';

export const generateIncidentPdf = (
  incident: FullIncident,
  client?: Client,
  location?: ClientLocation,
  shift?: Shift
): { blob: Blob, filename: string } => {
  // 1. Setup Document
  const locale = i18n.language?.startsWith('fr') ? 'fr-BE' : 'nl-BE';
  const ref = makeRef('INC');
  const typeLabel = incident.type === 'Complaint' ? i18n.t('incidenten.types.complaint') : i18n.t('incidenten.types.incident');
  
  const doc = createPdfDoc({ 
    title: `${typeLabel}: ${incident.title}`, 
    subTitle: `ID: ${incident.id} | Status: ${i18n.t(`incidenten.status.${incident.status}`)}`, 
    ref 
  });

  const pageWidth = doc.internal.pageSize.width || doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
  let y = 40;

  // 2. Context Table
  const metaBody = [
    [i18n.t('common.date'), new Date(incident.date).toLocaleString(locale)],
    [i18n.t('incidenten.fields.severity'), i18n.t(`incidenten.severity.${incident.severity}`)],
    [i18n.t('incidenten.fields.author'), incident.auditLog[0]?.user || i18n.t('personeel.badge.status.unknown')],
    [i18n.t('reports.fields.location'), location ? `${location.name}, ${location.city}` : (shift?.location || i18n.t('personeel.badge.status.unknown'))]
  ];

  if (shift) {
    metaBody.push([i18n.t('incidenten.pdf.shiftContext'), `${new Date(shift.startTime).toLocaleString(locale)} - ${new Date(shift.endTime).toLocaleString(locale)}`]);
  }

  // If client exists but wasn't added yet implicitly by shift
  if (client) {
      metaBody.splice(3, 0, [i18n.t('incidenten.pdf.client'), client.name]);
  }

  autoTable(doc, {
    startY: y,
    body: metaBody,
    theme: 'grid',
    styles: { cellPadding: 2, fontSize: 10 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40, fillColor: [245, 245, 245] } }
  });

  y = (doc as any).lastAutoTable.finalY + 15;

  // 3. Description
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(i18n.t('incidenten.fields.description'), 14, y);
  y += 6;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  const descLines = doc.splitTextToSize(incident.description || '-', pageWidth - 28);
  
  // Page Break Logic
  if (y + (descLines.length * 5) > pageHeight - 40) {
      doc.addPage();
      y = 20;
  }
  
  doc.text(descLines, 14, y);
  y += (descLines.length * 5) + 15;

  // 4. Internal Comments
  if (incident.comments && incident.comments.length > 0) {
      if (y > pageHeight - 40) { doc.addPage(); y = 20; }
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(i18n.t('incidenten.pdf.internalComments'), 14, y);
      y += 6;

      const commentRows = incident.comments.map(c => [
          new Date(c.date).toLocaleString(locale),
          c.author,
          c.text
      ]);

      autoTable(doc, {
          startY: y,
          head: [[i18n.t('incidenten.pdf.date'), i18n.t('incidenten.pdf.author'), i18n.t('incidenten.pdf.message')]],
          body: commentRows,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [50, 50, 50] }
      });
      y = (doc as any).lastAutoTable.finalY + 15;
  }

  // 5. Photos
  if (incident.photos && incident.photos.length > 0) {
      if (y > pageHeight - 60) { doc.addPage(); y = 20; }
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(i18n.t('incidenten.fields.photos'), 14, y);
      y += 10;

      const imgWidth = 80;
      const imgHeight = 60;
      let xPos = 14;
      
      incident.photos.forEach((img) => {
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

  // Finish using Core
  return {
    blob: finishPdf(doc),
    filename: `Incident_${incident.id.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
  };
};
