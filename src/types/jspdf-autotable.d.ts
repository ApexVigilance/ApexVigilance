declare module 'jspdf-autotable' {
  import { jsPDF } from 'jspdf';
  
  export interface AutoTableOptions {
    startY?: number;
    head?: any[][];
    body?: any[][];
    theme?: 'striped' | 'grid' | 'plain';
    styles?: any;
    headStyles?: any;
    bodyStyles?: any;
    footStyles?: any;
    alternateRowStyles?: any;
    columnStyles?: any;
    margin?: any;
    pageBreak?: 'auto' | 'avoid' | 'always';
    rowPageBreak?: 'auto' | 'avoid';
    tableWidth?: 'auto' | 'wrap' | number;
    showHead?: 'everyPage' | 'firstPage' | 'never';
    showFoot?: 'everyPage' | 'lastPage' | 'never';
    tableLineWidth?: number;
    tableLineColor?: any;
    horizontalPageBreak?: boolean;
    horizontalPageBreakRepeat?: number | string;
    didDrawPage?: (data: any) => void;
  }

  export default function autoTable(doc: jsPDF, options: AutoTableOptions): void;
}
