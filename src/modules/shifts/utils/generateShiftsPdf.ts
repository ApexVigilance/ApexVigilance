import autoTable from 'jspdf-autotable';
import { createPdfDoc, finishPdf } from '../../../utils/pdf/pdfCore';
import { makeRef } from '../../../utils/pdf/ref';
import { Shift, Employee, ShiftApplication } from '../../../data/types';

// --- OVERVIEW EXPORT ---
export const generateShiftsListPdf = (
  groups: any[], 
  filter: string
): { blob: Blob, filename: string } => {
  const ref = makeRef('SH');
  const title = `Overzicht Shifts: ${filter === 'ALL' ? 'Alle' : filter}`;
  const doc = createPdfDoc({ title, ref });

  const columns = ["Datum", "Klant", "Locatie", "Tijd", "Status", "Bezetting"];
  
  const rows = groups.map(g => [
    new Date(g.data.startTime).toLocaleDateString('nl-BE'),
    g.data.clientName,
    g.data.location,
    `${new Date(g.data.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - ${new Date(g.data.endTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`,
    g.status,
    `${g.assigned}/${g.total}`
  ]);

  autoTable(doc, {
    head: [columns],
    body: rows,
    startY: 40,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [20, 20, 20] },
  });

  return {
    blob: finishPdf(doc),
    filename: `Shifts_Lijst_${new Date().toISOString().slice(0,10)}.pdf`
  };
};

// --- DETAIL EXPORT ---
export const generateShiftDetailPdf = (
  shift: Shift,
  groupShifts: Shift[],
  employees: Employee[],
  applications: ShiftApplication[]
): { blob: Blob, filename: string } => {
  const ref = makeRef('SH-DET');
  const doc = createPdfDoc({ title: `Opdrachtfiche: ${shift.clientName}`, subTitle: `Groep ID: ${shift.groupId}`, ref });

  // 1. Meta Info
  autoTable(doc, {
    startY: 40,
    body: [
        ['Locatie', shift.location],
        ['Datum', new Date(shift.startTime).toLocaleDateString('nl-BE')],
        ['Tijdstip', `${new Date(shift.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - ${new Date(shift.endTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`],
        ['Totale Slots', groupShifts.length.toString()],
        ['Functiecode', shift.exeCode || '-']
    ],
    theme: 'grid',
    styles: { cellPadding: 2, fontSize: 10 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } }
  });

  // 2. Assigned Agents
  const finalY = (doc as any).lastAutoTable.finalY || 80;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text("Toegewezen Personeel", 14, finalY + 15);

  const assignRows = groupShifts.map((s, idx) => {
      const emp = employees.find(e => e.id === s.employeeId);
      return [
          `#${idx + 1}`,
          emp ? emp.name : 'OPEN POSITIE',
          emp?.role || '-',
          emp?.badgeNr || '-'
      ];
  });

  autoTable(doc, {
      startY: finalY + 20,
      head: [['Slot', 'Naam', 'Rol', 'Badge']],
      body: assignRows,
      headStyles: { fillColor: [50, 50, 50] },
      styles: { fontSize: 9 }
  });

  // 3. Briefing
  let currentY = (doc as any).lastAutoTable.finalY + 15;
  if (shift.briefing) {
      doc.text("Briefing", 14, currentY);
      autoTable(doc, {
          startY: currentY + 5,
          body: [[shift.briefing]],
          theme: 'plain',
          styles: { fontSize: 9, fontStyle: 'italic' }
      });
      currentY = (doc as any).lastAutoTable.finalY + 15;
  }

  // 4. Aanmeldingen Summary
  const pendingCount = applications.filter(a => a.status === 'PENDING').length;
  if (pendingCount > 0) {
      doc.text("Openstaande Aanmeldingen", 14, currentY);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Er zijn ${pendingCount} openstaande aanmeldingen voor deze shift.`, 14, currentY + 6);
  }

  return {
    blob: finishPdf(doc),
    filename: `Opdracht_${shift.clientName.replace(/\s+/g, '_')}.pdf`
  };
};