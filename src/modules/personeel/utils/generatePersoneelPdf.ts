import autoTable from 'jspdf-autotable';
import { createPdfDoc, finishPdf } from '../../../utils/pdf/pdfCore';
import { makeRef } from '../../../utils/pdf/ref';
import { Employee } from '../../../data/types';

// --- LIST EXPORT ---
export const generatePersoneelListPdf = (employees: Employee[], activeFilter: string): { blob: Blob, filename: string } => {
  const ref = makeRef('PB');
  const title = `Personeelsbestand: ${activeFilter === 'All' ? 'Alle' : activeFilter}`;
  const doc = createPdfDoc({ title, ref });

  const columns = ["Naam", "Rol", "Badge Nr", "Status", "Badge Vervalt", "Opmerking"];
  
  const rows = employees.map(e => {
    let remark = '';
    if (e.personalInfoStatus === 'PENDING') remark += 'Info check ';
    if (e.idCardStatus === 'PENDING') remark += 'ID check ';
    if (e.badgeDataStatus === 'PENDING') remark += 'Badge check ';
    
    return [
      e.name,
      e.role,
      e.badgeNr || '-',
      e.status,
      e.badgeExpiry || '-',
      remark || '-'
    ];
  });

  autoTable(doc, {
    head: [columns],
    body: rows,
    startY: 40,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [20, 20, 20] },
  });

  return { 
    blob: finishPdf(doc), 
    filename: `Personeelslijst_${new Date().toISOString().slice(0,10)}.pdf` 
  };
};

// --- DETAIL EXPORT ---
export const generatePersoneelDetailPdf = (employee: Employee): { blob: Blob, filename: string } => {
  const ref = makeRef('PBID');
  const doc = createPdfDoc({ title: `Fiche: ${employee.name}`, subTitle: `ID: ${employee.id} | Rol: ${employee.role}`, ref });

  let y = 40;

  // Section: Info
  autoTable(doc, {
    startY: y,
    head: [['Categorie', 'Details']],
    body: [
      ['Contact', `Email: ${employee.email || '-'}\nTel: ${employee.phone || '-'}\nAdres: ${employee.address || '-'}`],
      ['Identiteit', `RR: ${employee.nationalRegisterNr || '-'}\nGeboortedatum: ${employee.birthDate || '-'}`],
      ['Badge', `Nr: ${employee.badgeNr || '-'}\nVervalt: ${employee.badgeExpiry || '-'}`],
      ['Status', `Werkstatus: ${employee.status}\nContract: ${employee.contractType || '-'}`],
    ],
    theme: 'grid',
    headStyles: { fillColor: [212, 175, 55], textColor: 0 }, // Gold headers
    styles: { cellPadding: 3 }
  });

  // Section: Audit Log
  const finalY = (doc as any).lastAutoTable.finalY || 100;
  doc.setFontSize(12);
  doc.text("Audit Log", 14, finalY + 15);

  const auditRows = (employee.auditLog || []).map(log => [
    new Date(log.date).toLocaleString(),
    log.action,
    log.user,
    log.reason || '-'
  ]);

  if (auditRows.length > 0) {
    autoTable(doc, {
        startY: finalY + 20,
        head: [['Datum', 'Actie', 'Door', 'Reden']],
        body: auditRows,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [50, 50, 50] }
    });
  } else {
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text("Geen audit logs beschikbaar.", 14, finalY + 25);
  }

  return {
    blob: finishPdf(doc),
    filename: `Fiche_${employee.name.replace(/\s+/g, '_')}.pdf`
  };
};