export const generateOgm = (invoiceNumber: string): string => {
  // Extract numeric part from invoice number (e.g., "20260001" from "2026-0001")
  // Or generate a random unique number if invoice number format isn't purely numeric
  // Standard practice: Use client reference or invoice number.
  // Here we assume invoice number format YYYY-XXXX.
  
  const cleanNum = invoiceNumber.replace(/[^0-9]/g, '');
  
  // Ensure we have enough digits, pad if needed (max 10 digits for base)
  // OGM format: 10 digits + 2 check digits
  // We'll use a 10-digit base derived from year + sequence
  
  const base = cleanNum.padStart(10, '0').slice(0, 10);
  const baseNum = BigInt(base);
  
  let check = Number(baseNum % 97n);
  if (check === 0) check = 97;
  
  const checkStr = check.toString().padStart(2, '0');
  
  const fullOgm = `${base}${checkStr}`;
  
  // Format: +++ 123/4567/89012 +++
  // Groups: 3 / 4 / 5
  const g1 = fullOgm.slice(0, 3);
  const g2 = fullOgm.slice(3, 7);
  const g3 = fullOgm.slice(7, 12);
  
  return `+++ ${g1}/${g2}/${g3} +++`;
};
