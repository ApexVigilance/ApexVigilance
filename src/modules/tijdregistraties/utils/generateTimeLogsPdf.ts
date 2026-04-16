import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TimeLog, Employee, Shift } from '../../../data/types';

export const generateTimeLogsPdf = (
  logs: TimeLog[],
  employees: Employee[],
  shifts: Shift[],
  filters: { date?: string | null, status?: string | null, search?: string | null }
): Blob => {
  const doc = new jsPDF();
  
  // Header Info
  const now = new Date();
  const dateStr = now.toISOString().replace(/[-:T.]/g, '').slice(0, 14); 
  const ref = `TR-${dateStr}-${Math.floor(Math.random()*1000).toString().padStart(4, '0')}`;
  
  // Title
  doc.setFontSize(18);
  doc.text("Tijdsregistraties", 14, 20);
  
  // Meta
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`Ref: ${ref}`, 14, 27);
  doc.text(`Export: ${now.toLocaleString('nl-BE')}`, 14, 32);
  
  let filterTxt = "Filters: ";
  filterTxt += filters.date ? `Datum: ${filters.date} ` : "Datum: Alle ";
  filterTxt += (filters.status && filters.status !== 'All') ? `| Status: ${filters.status} ` : "";
  filterTxt += filters.search ? `| Zoek: "${filters.search}"` : "";
  doc.text(filterTxt, 14, 37);

  // Table Data
  const columns = ["Datum", "Agent", "Badge", "Klant", "Locatie", "In", "Uit", "Status", "Opmerking"];
  const rows = logs.map(log => {
    const emp = employees.find(e => e.id === log.employeeId);
    const shift = shifts.find(s => s.id === log.shiftId);
    
    // Formatting
    const d = new Date(log.clockIn);
    const dateDisp = d.toLocaleDateString('nl-BE');
    const inTime = d.toLocaleTimeString('nl-BE', {hour:'2-digit', minute:'2-digit'});
    const outTime = log.clockOut ? new Date(log.clockOut).toLocaleTimeString('nl-BE', {hour:'2-digit', minute:'2-digit'}) : '-';
    
    // Status Logic
    let status = log.status;
    if (log.deviationMinutes !== 0) status += ` (${log.deviationMinutes > 0 ? '+' : ''}${log.deviationMinutes}m)`;
    
    return [
        dateDisp,
        emp?.name || 'Onbekend',
        emp?.badgeNr || '-',
        shift?.clientName || '-',
        shift?.location || '-',
        inTime,
        outTime,
        status,
        log.correctionReason || ''
    ];
  });

  // Table Generation
  autoTable(doc, {
    head: [columns],
    body: rows,
    startY: 45,
    margin: { top: 10, right: 10, bottom: 25, left: 10 }, // Bottom margin for footer
    styles: { 
        fontSize: 8, 
        cellPadding: 2, 
        overflow: 'linebreak',
        cellWidth: 'wrap'
    },
    headStyles: { 
        fillColor: [20, 20, 20], 
        textColor: [255, 255, 255],
        fontStyle: 'bold'
    },
    columnStyles: {
        0: { cellWidth: 20 }, // Datum
        1: { cellWidth: 30 }, // Agent
        2: { cellWidth: 20 }, // Badge
        3: { cellWidth: 25 }, // Klant
        4: { cellWidth: 25 }, // Locatie
        5: { cellWidth: 12 }, // In
        6: { cellWidth: 12 }, // Uit
        7: { cellWidth: 20 }, // Status
        8: { cellWidth: 'auto' } // Opmerking (Takes remaining space)
    },
    didDrawPage: (data: any) => {
        // Footer on every page
        const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
        const pageWidth = doc.internal.pageSize.width || doc.internal.pageSize.getWidth();
        
        doc.setFontSize(8);
        doc.setTextColor(100);
        
        const footerY = pageHeight - 15;
        doc.text("Apex Vigilance Group (Apex VG BV)", pageWidth / 2, footerY, { align: 'center' });
        doc.text("Dorp 65 bus B, 2275 Poederlee (Lille), België", pageWidth / 2, footerY + 4, { align: 'center' });
        doc.text("KBO/Verg. Nummer IBZ: BE 1007.737.354 | Verzekerd: Vivium (P&V) – polis 3200235321", pageWidth / 2, footerY + 8, { align: 'center' });
        
        // Page Number
        const str = "Pagina " + doc.getNumberOfPages();
        doc.text(str, pageWidth - 10, 10, { align: 'right' }); 
    }
  });

  return doc.output('blob');
};