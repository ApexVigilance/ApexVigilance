import { Shift, PricingConfig, InvoiceLine } from '../data/types';
import { isBelgianHoliday } from './belgianHolidayService';

// 2026 Rates (Hardcoded fallback if config missing, but intended to be used via config)
const DEFAULT_RATES_2026 = {
  'Statisch': { 'Week': 39, 'Zaterdag': 45, 'Zondag': 49, 'Feestdag': 55 },
  'Winkel': { 'Week': 42, 'Zaterdag': 48, 'Zondag': 52, 'Feestdag': 58 },
  'Werf': { 'Week': 41, 'Zaterdag': 47, 'Zondag': 51, 'Feestdag': 57 },
  'Event': { 'Week': 45, 'Zaterdag': 52, 'Zondag': 58, 'Feestdag': 65 },
  'Haven': { 'Week': 48, 'Zaterdag': 56, 'Zondag': 62, 'Feestdag': 70 },
  'Overig': { 'Week': 40, 'Zaterdag': 48, 'Zondag': 60, 'Feestdag': 80 }
};

const NIGHT_START = 22;
const NIGHT_END = 6;
const NIGHT_SURCHARGE = 1.15; // +15%
const MIN_HOURS = 4;

interface TimeBucket {
  hours: number;
  rate: number;
  description: string;
  isNight: boolean;
}

export const calculateShiftCost = (shift: Shift, config: PricingConfig): InvoiceLine[] => {
  const serviceType = shift.serviceType || 'Statisch';
  const rates = config.matrix[serviceType] || DEFAULT_RATES_2026['Statisch'];
  
  const start = new Date(shift.startTime);
  const end = new Date(shift.endTime);
  
  // Buckets for aggregation
  const buckets: Record<string, TimeBucket> = {};

  let current = new Date(start.getTime());
  let totalMinutes = 0;

  // Minute-by-minute iteration for precision across boundaries
  while (current < end) {
    const nextMinute = new Date(current.getTime() + 60000);
    if (nextMinute > end) break;

    const isNight = current.getHours() >= NIGHT_START || current.getHours() < NIGHT_END;
    const isHoliday = isBelgianHoliday(current);
    const day = current.getDay(); // 0=Sun, 6=Sat
    
    let dayType = 'Week';
    if (isHoliday) dayType = 'Feestdag';
    else if (day === 0) dayType = 'Zondag';
    else if (day === 6) dayType = 'Zaterdag';

    let baseRate = rates[dayType] || 0;
    let finalRate = isNight ? baseRate * NIGHT_SURCHARGE : baseRate;
    
    // Round rate to 2 decimals for consistency
    finalRate = Math.round((finalRate + Number.EPSILON) * 100) / 100;

    const key = `${dayType}|${isNight ? 'Nacht' : 'Dag'}`;
    
    if (!buckets[key]) {
      buckets[key] = {
        hours: 0,
        rate: finalRate,
        description: `${serviceType} - ${dayType}${isNight ? ' (Nacht +15%)' : ''}`,
        isNight
      };
    }
    
    buckets[key].hours += (1/60);
    totalMinutes++;
    
    current = nextMinute;
  }

  // Minimum Duration Check
  const totalHours = totalMinutes / 60;
  
  const lines: InvoiceLine[] = Object.values(buckets).map(b => {
    const qty = Number(b.hours.toFixed(2));
    const totalExcl = Number((qty * b.rate).toFixed(2));
    const vatAmount = Number((totalExcl * (config.vatRate / 100)).toFixed(2));
    const totalIncl = Number((totalExcl + vatAmount).toFixed(2));

    return {
      description: b.description,
      quantity: qty,
      unitPrice: b.rate,
      vatRate: config.vatRate,
      totalExcl,
      vatAmount,
      totalIncl
    };
  });

  if (totalHours < MIN_HOURS && totalHours > 0) {
    const missingHours = MIN_HOURS - totalHours;
    // Charge missing hours at the rate of the first bucket (or standard week rate)
    // Logic: Usually charge at the rate of the shift start
    const firstBucket = Object.values(buckets)[0];
    const rate = firstBucket ? firstBucket.rate : rates['Week'];
    
    const qty = Number(missingHours.toFixed(2));
    const totalExcl = Number((qty * rate).toFixed(2));
    const vatAmount = Number((totalExcl * (config.vatRate / 100)).toFixed(2));
    const totalIncl = Number((totalExcl + vatAmount).toFixed(2));

    lines.push({
      description: `Minimum prestatie toeslag (${MIN_HOURS}u)`,
      quantity: qty,
      unitPrice: rate,
      vatRate: config.vatRate,
      totalExcl,
      vatAmount,
      totalIncl
    });
  }

  return lines;
};
