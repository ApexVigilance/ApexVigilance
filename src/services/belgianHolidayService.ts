export const isBelgianHoliday = (date: Date): boolean => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-12
  const day = date.getDate();

  // Fixed Holidays
  const fixedHolidays = [
    { d: 1, m: 1 },   // Nieuwjaar
    { d: 1, m: 5 },   // Dag van de Arbeid
    { d: 21, m: 7 },  // Nationale Feestdag
    { d: 15, m: 8 },  // O.L.V. Hemelvaart
    { d: 1, m: 11 },  // Allerheiligen
    { d: 11, m: 11 }, // Wapenstilstand
    { d: 25, m: 12 }, // Kerstmis
  ];

  if (fixedHolidays.some(h => h.d === day && h.m === month)) return true;

  // Variable Holidays (Easter based)
  const easter = getEasterDate(year);
  
  // Paasmaandag (Easter + 1)
  const easterMonday = addDays(easter, 1);
  if (isSameDate(date, easterMonday)) return true;

  // O.L.H. Hemelvaart (Easter + 39)
  const ascension = addDays(easter, 39);
  if (isSameDate(date, ascension)) return true;

  // Pinkstermaandag (Easter + 50)
  const whitMonday = addDays(easter, 50);
  if (isSameDate(date, whitMonday)) return true;

  return false;
};

const getEasterDate = (year: number): Date => {
  const f = Math.floor;
  const G = year % 19;
  const C = f(year / 100);
  const H = (C - f(C / 4) - f((8 * C + 13) / 25) + 19 * G + 15) % 30;
  const I = H - f(H / 28) * (1 - f(29 / (H + 1)) * f((21 - G) / 11));
  const J = (year + f(year / 4) + I + 2 - C + f(C / 4)) % 7;
  const L = I - J;
  const month = 3 + f((L + 40) / 44);
  const day = L + 28 - 31 * f(month / 4);
  return new Date(year, month - 1, day);
};

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const isSameDate = (d1: Date, d2: Date): boolean => {
  return d1.getDate() === d2.getDate() && 
         d1.getMonth() === d2.getMonth() && 
         d1.getFullYear() === d2.getFullYear();
};
