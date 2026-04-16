export const getNextInvoiceNumber = (
  year: number, 
  lastSequence: number
): { number: string; sequence: number } => {
  const nextSeq = lastSequence + 1;
  const number = `${year}-${nextSeq.toString().padStart(4, '0')}`;
  return { number, sequence: nextSeq };
};
