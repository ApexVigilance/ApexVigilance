import { Shift } from '../data/types';

export const isShiftEligibleForInvoice = (shift: Shift): boolean => {
  if (shift.status !== 'Approved') return false;
  if (shift.invoiceId) return false;
  if (shift.invoicedAt) return false;
  return true;
};
