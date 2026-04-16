
import autoTable from 'jspdf-autotable';
import { createPdfDoc, finishPdf } from '../../../utils/pdf/pdfCore';
import { FullClient, ClientLocation } from '../../../data/types';

export const generateClientPdf = (
  client: FullClient, 
  locations: ClientLocation[]
): { blob: Blob, filename: string } => {
  const ref = client.clientRef || client.id;
  const doc = createPdfDoc({ 
    title: `Klantendossier: ${client.name}`, 
    subTitle: `Ref: ${ref} | ID: ${client.id}`, 
    ref 
  });

  let y = 40;

  // -- 1. KLANTGEGEVENS --
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Klantgegevens", 14, y);
  y += 5;

  autoTable(doc, {
    startY: y,
    head: [['Veld', 'Waarde']],
    body: [
      ['Bedrijfsnaam', client.name],
      ['BTW / KBO', client.vat || '-'],
      ['Contactpersoon', client.contact || '-'],
      ['Telefoon', client.phone || '-'],
      ['E-mail', client.email || '-'],
      ['Facturatieadres', client.address || '-'],
      ['Status', client.status === 'Active' ? 'ACTIEF' : 'INACTIEF']
    ],
    theme: 'grid',
    headStyles: { fillColor: [212, 175, 55], textColor: 0 }, // Apex Gold
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } }
  });

  y = (doc as any).lastAutoTable.finalY + 15;

  // -- 2. LOCATIES --
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`Locaties (${locations.length})`, 14, y);
  y += 5;

  if (locations.length > 0) {
    const locRows = locations.map(loc => [
      loc.name,
      loc.type,
      `${loc.address}, ${loc.city}`,
      loc.accessInfo || '-'
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Naam', 'Type', 'Adres', 'Toegangsinfo']],
      body: locRows,
      theme: 'grid',
      headStyles: { fillColor: [50, 50, 50] },
      styles: { fontSize: 9 },
      columnStyles: { 
        3: { cellWidth: 'auto' }
      }
    });
  } else {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Geen locaties gekoppeld.", 14, y + 5);
  }

  // -- FINISH --
  const safeName = client.name.replace(/[^a-z0-9]/gi, '_');
  return {
    blob: finishPdf(doc),
    filename: `Dossier_${safeName}_${ref}.pdf`
  };
};
