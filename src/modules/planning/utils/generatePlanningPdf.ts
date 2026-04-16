import autoTable from 'jspdf-autotable';
import { createPdfDoc, finishPdf } from '../../../utils/pdf/pdfCore';
import { makeRef } from '../../../utils/pdf/ref';
import { Shift, Employee } from '../../../data/types';

// --- OVERVIEW EXPORT ---
export const generatePlanningOverviewPdf = (
  groups: any[], 
  period: string
): { blob: Blob, filename: string } => {
  const ref = makeRef('PL');
  const title = `Planning Overzicht: ${period}`;
  const doc = createPdfDoc({ title, ref });

  const columns = ["Datum", "Klant", "Locatie", "Tijd", "Slots", "Open", "EXE"];
  
  const rows = groups.map(g => [
    new Date(g.details.startTime).toLocaleDateString('nl-BE'),
    g.details.clientName,
    g.details.location,
    `${new Date(g.details.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - ${new Date(g.details.endTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`,
    `${g.assigned} / ${g.total}`,
    g.total - g.assigned,
    g.details.exeCode || '-'
  ]);

  autoTable(doc, {
    head: [columns],
    body: rows,
    startY: 40,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [20, 20, 20] },
    columnStyles: {
        4: { halign: 'center' }, // Slots
        5: { halign: 'center', fontStyle: 'bold', textColor: [200, 0, 0] }, // Open
    }
  });

  return {
    blob: finishPdf(doc),
    filename: `Planning_${period}_${new Date().toISOString().slice(0,10)}.pdf`
  };
};

// --- GROUP DETAIL EXPORT ---
export const generatePlanningGroupPdf = (
  shifts: Shift[], 
  employees: Employee[]
): { blob: Blob, filename: string } => {
  if (shifts.length === 0) throw new Error("No shifts provided");
  const first = shifts[0];
  const ref = makeRef('PL-GRP');
  const doc = createPdfDoc({ title: `Planning Detail: ${first.clientName}`, subTitle: `Ref: ${first.groupId}`, ref });

  // Meta Box
  autoTable(doc, {
    startY: 40,
    body: [
        ['Locatie', first.location],
        ['Datum', new Date(first.startTime).toLocaleDateString('nl-BE')],
        ['Tijdstip', `${new Date(first.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - ${new Date(first.endTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`],
        ['Functiecode', first.exeCode || 'Geen'],
        ['Rol Vereiste', first.requiredRole || 'Standaard']
    ],
    theme: 'plain',
    styles: { cellPadding: 2, fontSize: 10 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } }
  });

  // Agents Table
  const finalY = (doc as any).lastAutoTable.finalY || 80;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text("Toegewezen Personeel", 14, finalY + 15);

  const columns = ["Slot", "Agent Naam", "Rol", "Badge Nr", "Opmerking"];
  const rows = shifts.map((s, idx) => {
      const emp = employees.find(e => e.id === s.employeeId);
      return [
          `#${idx + 1}`,
          emp ? emp.name : 'OPEN POSITIE',
          emp?.role || '-',
          emp?.badgeNr || '-',
          !emp ? 'Nog in te vullen' : ''
      ];
  });

  autoTable(doc, {
      startY: finalY + 20,
      head: [columns],
      body: rows,
      headStyles: { fillColor: [50, 50, 50] },
      styles: { fontSize: 9 }
  });

  // Briefing
  if (first.briefing) {
      const briefingY = (doc as any).lastAutoTable.finalY + 15;
      doc.text("Briefing & Instructies", 14, briefingY);
      
      autoTable(doc, {
          startY: briefingY + 5,
          body: [[first.briefing]],
          theme: 'plain',
          styles: { fontSize: 9, fontStyle: 'italic', cellPadding: 0 }
      });
  }

  return {
    blob: finishPdf(doc),
    filename: `Planning_Groep_${first.clientName.replace(/\s+/g, '_')}.pdf`
  };
};