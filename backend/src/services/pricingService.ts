import { DayType, TimePeriod } from '../types';
import { timeSlots, timePricingRules, groupDiscountTiers, equipmentList, temporaryServiceFeeRule } from '../data/store';

const HOLIDAY_DATES: Set<string> = new Set([
  '2026-01-01',
  '2026-02-16', '2026-02-17', '2026-02-18',
  '2026-04-04', '2026-04-05', '2026-04-06',
  '2026-05-01', '2026-05-02', '2026-05-03',
  '2026-06-19', '2026-06-20', '2026-06-21',
  '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05', '2026-10-06', '2026-10-07',
]);

export function roundToCents(value: number): number {
  return Math.round(value * 100) / 100;
}

export function isHoliday(dateStr: string): boolean {
  return HOLIDAY_DATES.has(dateStr);
}

export function addHolidayDate(dateStr: string): void {
  HOLIDAY_DATES.add(dateStr);
}

export function removeHolidayDate(dateStr: string): void {
  HOLIDAY_DATES.delete(dateStr);
}

export function getHolidayDates(): string[] {
  return Array.from(HOLIDAY_DATES).sort();
}

export function getDayType(dateStr: string): DayType {
  if (isHoliday(dateStr)) {
    return 'holiday';
  }
  const date = new Date(dateStr);
  const dayOfWeek = date.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return 'weekend';
  }
  return 'weekday';
}

export function getTimePeriod(startTime: string): TimePeriod {
  const hour = parseInt(startTime.split(':')[0], 10);
  if (hour >= 9 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

export function getTimeSlotByTime(startTime: string, endTime: string): string | null {
  const startHour = parseInt(startTime.split(':')[0], 10);
  const endHour = parseInt(endTime.split(':')[0], 10);
  
  for (const slot of timeSlots) {
    const slotStartHour = parseInt(slot.startTime.split(':')[0], 10);
    const slotEndHour = parseInt(slot.endTime.split(':')[0], 10);
    if (startHour >= slotStartHour && endHour <= slotEndHour) {
      return slot.id;
    }
  }
  return null;
}

export function calculateDurationHours(startTime: string, endTime: string): number {
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  return roundToCents((endMinutes - startMinutes) / 60);
}

const DAY_TYPE_FALLBACK: Record<DayType, DayType[]> = {
  holiday: ['weekend', 'weekday'],
  weekend: ['weekday'],
  weekday: [],
};

export function getTimeSlotPrice(zoneId: string, timeSlotId: string, dayType: DayType): number | null {
  const dayTypesToTry: DayType[] = [dayType, ...DAY_TYPE_FALLBACK[dayType]];
  
  for (const dt of dayTypesToTry) {
    const rule = timePricingRules.find(
      (r) => r.zoneId === zoneId && r.timeSlotId === timeSlotId && r.dayType === dt
    );
    if (rule) {
      return roundToCents(rule.pricePerHour);
    }
  }
  return null;
}

export function getGroupDiscount(peopleCount: number): { discountRate: number; tierName: string } {
  for (const tier of groupDiscountTiers) {
    if (peopleCount >= tier.minPeople && peopleCount <= tier.maxPeople) {
      return { discountRate: tier.discountRate, tierName: tier.name };
    }
  }
  return { discountRate: 1.0, tierName: '无折扣' };
}

export function calculateEquipmentTotalPrice(
  equipmentItems: Array<{ equipmentId: string; quantity: number }>,
  durationHours: number
): { total: number; details: Array<{ equipmentId: string; name: string; quantity: number; pricePerHour: number; total: number }> } {
  let total = 0;
  const details: Array<{ equipmentId: string; name: string; quantity: number; pricePerHour: number; total: number }> = [];

  for (const item of equipmentItems) {
    const equipment = equipmentList.find((e) => e.id === item.equipmentId);
    if (equipment) {
      const itemTotal = roundToCents(equipment.pricePerHour * item.quantity * durationHours);
      total = roundToCents(total + itemTotal);
      details.push({
        equipmentId: equipment.id,
        name: equipment.name,
        quantity: item.quantity,
        pricePerHour: roundToCents(equipment.pricePerHour),
        total: itemTotal,
      });
    }
  }

  return { total: roundToCents(total), details };
}

export function calculateTemporaryServiceFee(
  bookingDateTime: string,
  currentDateTime?: Date
): { applied: boolean; amount: number } {
  const now = currentDateTime || new Date();
  const bookingStart = new Date(bookingDateTime);
  const diffMs = bookingStart.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < temporaryServiceFeeRule.thresholdHours && diffHours > 0) {
    return {
      applied: true,
      amount: roundToCents(temporaryServiceFeeRule.feeAmount),
    };
  }
  return { applied: false, amount: 0 };
}

export interface CalculatePriceParams {
  zoneId: string;
  date: string;
  startTime: string;
  endTime: string;
  peopleCount: number;
  equipment: Array<{ equipmentId: string; quantity: number }>;
  currentDateTime?: Date;
}

export function calculateTotalPrice(params: CalculatePriceParams) {
  const { zoneId, date, startTime, endTime, peopleCount, equipment, currentDateTime } = params;

  const dayType = getDayType(date);
  const timeSlotId = getTimeSlotByTime(startTime, endTime);
  
  if (!timeSlotId) {
    throw new Error('预约时间不在可用时段范围内');
  }

  const pricePerHour = getTimeSlotPrice(zoneId, timeSlotId, dayType);
  if (!pricePerHour) {
    throw new Error('未找到对应的时段定价规则');
  }

  const durationHours = calculateDurationHours(startTime, endTime);
  const basePrice = roundToCents(pricePerHour * durationHours);

  const { discountRate, tierName } = getGroupDiscount(peopleCount);
  const discountedPrice = roundToCents(basePrice * discountRate);
  const discountAmount = roundToCents(basePrice - discountedPrice);

  const { total: equipmentTotal, details: equipmentDetails } = calculateEquipmentTotalPrice(
    equipment,
    durationHours
  );

  const bookingDateTime = `${date}T${startTime}:00`;
  const { applied: tempFeeApplied, amount: tempFeeAmount } = calculateTemporaryServiceFee(
    bookingDateTime,
    currentDateTime
  );

  const total = roundToCents(discountedPrice + equipmentTotal + tempFeeAmount);

  return {
    basePrice,
    discountAmount,
    equipmentPrice: equipmentTotal,
    temporaryServiceFee: tempFeeAmount,
    total,
    details: {
      timeSlotPrice: pricePerHour,
      durationHours,
      dayType,
      timeSlotId,
      groupDiscountRate: discountRate,
      groupDiscountTier: tierName,
      equipmentItems: equipmentDetails,
      temporaryServiceFeeApplied: tempFeeApplied,
      temporaryServiceFeeAmount: tempFeeAmount,
    },
  };
}
