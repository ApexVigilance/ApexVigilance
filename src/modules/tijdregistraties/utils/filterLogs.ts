import { TimeLog, Employee } from '../../../data/types';

export interface FilterCriteria {
  date?: string | null;
  status?: string | null;
  search?: string | null;
}

/**
 * Shared filter logic to ensure Print View matches List View exactly.
 */
export const filterTimeLogs = (
  logs: TimeLog[], 
  employees: Employee[], 
  criteria: FilterCriteria
): TimeLog[] => {
  return logs.filter(log => {
    // 1. Date Filter (Strict YYYY-MM-DD match)
    // If date is provided, log MUST match. If null/empty, show all dates.
    if (criteria.date) {
       const logDate = log.clockIn.split('T')[0];
       if (logDate !== criteria.date) return false;
    }
    
    // 2. Status Filter
    if (criteria.status && criteria.status !== 'All' && criteria.status !== '') {
       if (log.status !== criteria.status) return false;
    }

    // 3. Search Filter (Agent Name or Badge)
    if (criteria.search) {
       const emp = employees.find(e => e.id === log.employeeId);
       const q = criteria.search.toLowerCase();
       const nameMatch = emp?.name?.toLowerCase().includes(q);
       const badgeMatch = emp?.badgeNr?.toLowerCase().includes(q);
       
       if (!nameMatch && !badgeMatch) return false;
    }

    return true;
  }).sort((a, b) => new Date(a.clockIn).getTime() - new Date(b.clockIn).getTime());
};