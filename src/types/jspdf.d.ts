declare module 'jspdf' {
  export class jsPDF {
    constructor(options?: any);
    internal: {
      pageSize: {
        width: number;
        height: number;
        getWidth: () => number;
        getHeight: () => number;
      };
    };
    getNumberOfPages(): number;
    addImage(imageData: string | Uint8Array, format: string, x: number, y: number, w: number, h: number, alias?: string, compression?: string, rotation?: number): void;
    setFontSize(size: number): void;
    setFont(fontName: string, fontStyle?: string): void;
    text(text: string | string[], x: number, y: number, options?: any, transform?: any): void;
    splitTextToSize(text: string, maxlen: number, options?: any): string[];
    output(type: string, options?: any): any;
    save(filename: string): void;
    setPage(pageNumber: number): void;
    setTextColor(r: number, g?: number, b?: number): void;
    setDrawColor(r: number, g?: number, b?: number): void;
    line(x1: number, y1: number, x2: number, y2: number): void;
    rect(x: number, y: number, w: number, h: number, style?: string): void;
    roundedRect(x: number, y: number, w: number, h: number, rx: number, ry: number, style?: string): void;
    setFillColor(r: number, g?: number, b?: number): void;
    addPage(): void;
  }
}
