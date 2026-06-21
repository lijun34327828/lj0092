import { DayType, TimePeriod } from '../types';
import { timeSlots, timePricingRules, groupDiscountTiers, equipmentList, temporaryServiceFeeRule } from '../data/store';

export function getDayType(dateStr: string): DayType {
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
  return (endMinutes - startMinutes) / 60;
}

export function getTimeSlotPrice(zoneId: string, timeSlotId: string, dayType: DayType): number | null {
  const rule = timePricingRules.find(
    (r) => r.zoneId === zoneId && r.timeSlotId === timeSlotId && r.dayType === dayType
  );
  return rule ? rule.pricePerHour : null;
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
      const itemTotal = equipment.pricePerHour * item.quantity * durationHours;
      total += itemTotal;
      details.push({
        equipmentId: equipment.id,
        name: equipment.name,
        quantity: item.quantity,
        pricePerHour: equipment.pricePerHour,
        total: itemTotal,
      });
    }
  }

  return { total, details };
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
      amount: temporaryServiceFeeRule.feeAmount,
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
  const basePrice = pricePerHour * durationHours;

  const { discountRate, tierName } = getGroupDiscount(peopleCount);
  const discountedPrice = basePrice * discountRate;
  const discountAmount = basePrice - discountedPrice;

  const { total: equipmentTotal, details: equipmentDetails } = calculateEquipmentTotalPrice(
    equipment,
    durationHours
  );

  const bookingDateTime = `${date}T${startTime}:00`;
  const { applied: tempFeeApplied, amount: tempFeeAmount } = calculateTemporaryServiceFee(
    bookingDateTime,
    currentDateTime
  );

  const total = discountedPrice + equipmentTotal + tempFeeAmount;

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
