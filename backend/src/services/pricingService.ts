import { DayType, TimePeriod, MemberLevel, CouponType } from '../types';
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
): {
  total: number;
  details: Array<{
    equipmentId: string;
    name: string;
    quantity: number;
    pricePerHour: number;
    total: number;
  }>;
} {
  let total = 0;
  const details: Array<{
    equipmentId: string;
    name: string;
    quantity: number;
    pricePerHour: number;
    total: number;
  }> = [];

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

import { getPremiumMultiplier, getOccupancyInfo } from './premiumService';
import { getLevelRule, getLevelRuleByTotalSpent } from './memberService';
import { applyCoupons } from './couponService';

export interface CalculatePriceParams {
  zoneId: string;
  date: string;
  startTime: string;
  endTime: string;
  peopleCount: number;
  equipment: Array<{ equipmentId: string; quantity: number }>;
  currentDateTime?: Date;
  memberId?: string;
  memberTotalSpent?: number;
  couponIds?: string[];
}

export function calculateTotalPrice(params: CalculatePriceParams) {
  const {
    zoneId,
    date,
    startTime,
    endTime,
    peopleCount,
    equipment,
    currentDateTime,
    memberId,
    memberTotalSpent,
    couponIds = [],
  } = params;

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

  // 步骤1：场地基础价 × 时长
  const basePrice = roundToCents(pricePerHour * durationHours);

  // 步骤2：动态溢价
  const premiumMultiplier = getPremiumMultiplier(date, startTime, endTime);
  const premiumRate = premiumMultiplier > 1 ? premiumMultiplier - 1 : 0;
  const premiumBasePrice = roundToCents(basePrice * premiumMultiplier);
  const dynamicPremiumAmount = roundToCents(premiumBasePrice - basePrice);

  // 步骤3：组队折扣
  const { discountRate: groupDiscountRate, tierName: groupDiscountTier } = getGroupDiscount(peopleCount);
  const afterGroupDiscount = roundToCents(premiumBasePrice * groupDiscountRate);
  const groupDiscountAmount = roundToCents(premiumBasePrice - afterGroupDiscount);

  // 步骤4：会员折扣
  let memberLevel: MemberLevel | null = null;
  let memberLevelName: string | null = null;
  let memberDiscountRate = 1.0;
  if (memberTotalSpent !== undefined && memberTotalSpent !== null) {
    const levelRule = getLevelRuleByTotalSpent(memberTotalSpent);
    memberLevel = levelRule.level;
    memberLevelName = levelRule.levelName;
    memberDiscountRate = levelRule.discountRate;
  } else if (memberId) {
    const levelRule = getLevelRule('regular');
    if (levelRule) {
      memberLevel = 'regular';
      memberLevelName = levelRule.levelName;
      memberDiscountRate = levelRule.discountRate;
    }
  }
  const afterMemberDiscount = roundToCents(afterGroupDiscount * memberDiscountRate);
  const memberDiscountAmount = roundToCents(afterGroupDiscount - afterMemberDiscount);

  // 步骤5：优惠券抵扣（按顺序叠加，每张券对剩余金额单独计算）
  let couponTotalDiscount = 0;
  const appliedCoupons: Array<{
    couponId: string;
    couponName: string;
    couponType: CouponType;
    couponValue: number;
    discountAmount: number;
  }> = [];
  let afterCoupons = afterMemberDiscount;

  if (couponIds && couponIds.length > 0) {
    try {
      const couponResult = applyCoupons(couponIds, {
        zoneId,
        date,
        startTime,
        endTime,
        memberId,
        amountAfterMemberDiscount: afterMemberDiscount,
      });
      appliedCoupons.push(
        ...couponResult.appliedCoupons.map((c) => ({
          couponId: c.couponId,
          couponName: c.name,
          couponType: c.type,
          couponValue: c.value,
          discountAmount: c.discountAmount,
        }))
      );
      couponTotalDiscount = roundToCents(couponResult.totalDiscount);
      afterCoupons = roundToCents(couponResult.afterDiscount);
      if (afterCoupons < 0) {
        afterCoupons = 0;
      }
    } catch {
      // 券应用失败则跳过所有券
    }
  }

  // 步骤6：装备费
  const { total: equipmentTotal, details: equipmentDetails } = calculateEquipmentTotalPrice(
    equipment,
    durationHours
  );

  // 步骤7：临时预留服务费
  const bookingDateTime = `${date}T${startTime}:00`;
  const { applied: tempFeeApplied, amount: tempFeeAmount } = calculateTemporaryServiceFee(
    bookingDateTime,
    currentDateTime
  );

  // 最终总价
  let total = roundToCents(afterCoupons + equipmentTotal + tempFeeAmount);
  if (total < 0) {
    total = 0;
  }

  // 总优惠金额（组队折扣+会员折扣+券抵扣）
  const totalDiscountAmount = roundToCents(groupDiscountAmount + memberDiscountAmount + couponTotalDiscount);

  const occupancyInfo = getOccupancyInfo(date, startTime, endTime);

  return {
    basePrice,
    dynamicPremiumRate: premiumRate,
    dynamicPremiumAmount,
    premiumBasePrice,
    groupDiscountRate,
    groupDiscountAmount,
    afterGroupDiscount,
    memberLevel,
    memberLevelName,
    memberDiscountRate,
    memberDiscountAmount,
    afterMemberDiscount,
    appliedCoupons,
    couponTotalDiscount,
    afterCoupons,
    equipmentPrice: equipmentTotal,
    temporaryServiceFee: tempFeeAmount,
    discountAmount: totalDiscountAmount,
    total,
    occupancyInfo,
    details: {
      timeSlotPrice: pricePerHour,
      durationHours,
      dayType,
      timeSlotId,
      groupDiscountRate,
      groupDiscountTier,
      equipmentItems: equipmentDetails,
      temporaryServiceFeeApplied: tempFeeApplied,
      temporaryServiceFeeAmount: tempFeeAmount,
    },
  };
}

export { getPremiumMultiplier, getOccupancyInfo };
