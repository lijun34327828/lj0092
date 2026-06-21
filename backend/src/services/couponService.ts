import { coupons, venueZones, timeSlots } from '../data/store';
import { Coupon, CouponType, CouponStatus, TimePeriod, BookingEquipment } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { roundToCents, getDayType, getTimePeriod } from './pricingService';

export interface CreateCouponParams {
  name: string;
  type: CouponType;
  value: number;
  minConsumption: number;
  validFrom: string;
  validTo: string;
  applicableZoneIds?: string[];
  applicableTimePeriods?: TimePeriod[];
  memberId?: string;
}

export interface IsCouponApplicableParams {
  zoneId: string;
  date: string;
  startTime: string;
  endTime: string;
  currentAmountAfterMemberDiscount: number;
  memberId?: string;
}

export interface ApplyCouponsParams {
  zoneId: string;
  date: string;
  startTime: string;
  endTime: string;
  memberId?: string;
  amountAfterMemberDiscount: number;
}

export interface AppliedCouponResult {
  couponId: string;
  name: string;
  type: CouponType;
  value: number;
  discountAmount: number;
}

export interface ApplyCouponsResult {
  appliedCoupons: AppliedCouponResult[];
  totalDiscount: number;
  afterDiscount: number;
}

export interface CalculateCouponDiscountResult {
  discountAmount: number;
  coupon: Coupon;
}

export function createCoupon(params: CreateCouponParams): Coupon {
  const {
    name,
    type,
    value,
    minConsumption,
    validFrom,
    validTo,
    applicableZoneIds = [],
    applicableTimePeriods = [],
    memberId,
  } = params;

  if (!name.trim()) {
    throw new Error('优惠券名称不能为空');
  }

  if (type !== 'fixed' && type !== 'percentage') {
    throw new Error('优惠券类型必须是 fixed 或 percentage');
  }

  if (type === 'fixed' && value <= 0) {
    throw new Error('满减券金额必须大于0');
  }

  if (type === 'percentage' && (value <= 0 || value >= 1)) {
    throw new Error('折扣券折扣率必须在0到1之间（不含0和1）');
  }

  if (minConsumption < 0) {
    throw new Error('最低消费门槛不能为负数');
  }

  const validFromDate = new Date(validFrom);
  const validToDate = new Date(validTo);
  if (isNaN(validFromDate.getTime()) || isNaN(validToDate.getTime())) {
    throw new Error('有效期日期格式无效');
  }
  if (validFromDate.getTime() > validToDate.getTime()) {
    throw new Error('有效期起始日期不能晚于结束日期');
  }

  for (const zid of applicableZoneIds) {
    const zone = venueZones.find((z) => z.id === zid);
    if (!zone) {
      throw new Error(`适用场地ID无效: ${zid}`);
    }
  }

  const validPeriods: TimePeriod[] = ['morning', 'afternoon', 'evening', 'night'];
  for (const period of applicableTimePeriods) {
    if (!validPeriods.includes(period)) {
      throw new Error(`适用时段无效: ${period}`);
    }
  }

  const coupon: Coupon = {
    id: uuidv4(),
    name: name.trim(),
    type,
    value: roundToCents(value),
    minConsumption: roundToCents(minConsumption),
    validFrom,
    validTo,
    applicableZoneIds: [...applicableZoneIds],
    applicableTimePeriods: [...applicableTimePeriods],
    status: 'unused',
    memberId,
    createdAt: new Date().toISOString(),
  };

  coupons.push(coupon);
  return coupon;
}

export function getCouponById(id: string): Coupon | undefined {
  return coupons.find((c) => c.id === id);
}

export function getCouponsByMember(memberId: string): Coupon[] {
  return coupons.filter((c) => c.memberId === memberId);
}

export function getAvailableCoupons(memberId: string): Coupon[] {
  const now = new Date();
  return coupons.filter((c) => {
    if (c.memberId !== memberId) return false;
    if (c.status !== 'unused') return false;
    const validFrom = new Date(c.validFrom);
    const validTo = new Date(c.validTo);
    validTo.setHours(23, 59, 59, 999);
    return now.getTime() >= validFrom.getTime() && now.getTime() <= validTo.getTime();
  });
}

export function getAllCoupons(): Coupon[] {
  return [...coupons];
}

export function isCouponApplicable(couponId: string, params: IsCouponApplicableParams): boolean {
  const { zoneId, date, startTime, endTime, currentAmountAfterMemberDiscount, memberId } = params;

  const coupon = getCouponById(couponId);
  if (!coupon) return false;

  if (coupon.status !== 'unused') return false;

  const now = new Date();
  const validFrom = new Date(coupon.validFrom);
  const validTo = new Date(coupon.validTo);
  validTo.setHours(23, 59, 59, 999);
  if (now.getTime() < validFrom.getTime() || now.getTime() > validTo.getTime()) {
    return false;
  }

  if (coupon.memberId !== undefined) {
    if (memberId === undefined || coupon.memberId !== memberId) {
      return false;
    }
  }

  if (coupon.applicableZoneIds.length > 0) {
    if (!coupon.applicableZoneIds.includes(zoneId)) {
      return false;
    }
  }

  if (coupon.applicableTimePeriods.length > 0) {
    const bookingPeriod = getTimePeriod(startTime);
    const endPeriod = getTimePeriod(endTime);
    const coveredPeriods = new Set<TimePeriod>();
    const allPeriods: TimePeriod[] = ['morning', 'afternoon', 'evening', 'night'];
    const startIdx = allPeriods.indexOf(bookingPeriod);
    const endIdx = allPeriods.indexOf(endPeriod);
    for (let i = Math.min(startIdx, endIdx); i <= Math.max(startIdx, endIdx); i++) {
      coveredPeriods.add(allPeriods[i]);
    }
    const hasMatchingPeriod = coupon.applicableTimePeriods.some((p) => coveredPeriods.has(p));
    if (!hasMatchingPeriod) {
      return false;
    }
  }

  if (currentAmountAfterMemberDiscount < coupon.minConsumption) {
    return false;
  }

  return true;
}

export function calculateCouponDiscount(
  couponId: string,
  currentAmount: number
): CalculateCouponDiscountResult {
  const coupon = getCouponById(couponId);
  if (!coupon) {
    throw new Error('优惠券不存在');
  }

  let discountAmount: number;
  if (coupon.type === 'fixed') {
    discountAmount = Math.min(coupon.value, currentAmount);
  } else {
    discountAmount = roundToCents(currentAmount * coupon.value);
    if (discountAmount > currentAmount) {
      discountAmount = currentAmount;
    }
  }

  discountAmount = roundToCents(discountAmount);
  if (discountAmount < 0) {
    discountAmount = 0;
  }

  return { discountAmount, coupon };
}

export function applyCoupons(
  couponIds: string[],
  params: ApplyCouponsParams
): ApplyCouponsResult {
  const { zoneId, date, startTime, endTime, memberId, amountAfterMemberDiscount } = params;

  const uniqueIds = new Set(couponIds);
  if (uniqueIds.size !== couponIds.length) {
    throw new Error('优惠券列表中存在重复的券');
  }

  const appliedCoupons: AppliedCouponResult[] = [];
  let totalDiscount = 0;
  let runningAmount = roundToCents(amountAfterMemberDiscount);

  for (const couponId of couponIds) {
    const applicableParams: IsCouponApplicableParams = {
      zoneId,
      date,
      startTime,
      endTime,
      currentAmountAfterMemberDiscount: amountAfterMemberDiscount,
      memberId,
    };

    if (!isCouponApplicable(couponId, applicableParams)) {
      continue;
    }

    if (runningAmount <= 0) {
      break;
    }

    const { discountAmount, coupon } = calculateCouponDiscount(couponId, runningAmount);

    if (discountAmount <= 0) {
      continue;
    }

    const adjustedDiscount = discountAmount > runningAmount ? runningAmount : discountAmount;
    const finalDiscount = roundToCents(adjustedDiscount);

    appliedCoupons.push({
      couponId: coupon.id,
      name: coupon.name,
      type: coupon.type,
      value: coupon.value,
      discountAmount: finalDiscount,
    });

    totalDiscount = roundToCents(totalDiscount + finalDiscount);
    runningAmount = roundToCents(runningAmount - finalDiscount);

    if (runningAmount < 0) {
      runningAmount = 0;
    }
  }

  const afterDiscount = roundToCents(Math.max(0, amountAfterMemberDiscount - totalDiscount));

  return {
    appliedCoupons,
    totalDiscount: roundToCents(totalDiscount),
    afterDiscount,
  };
}

export function redeemCoupons(couponIds: string[], bookingId: string): Coupon[] {
  const uniqueIds = new Set(couponIds);
  if (uniqueIds.size !== couponIds.length) {
    throw new Error('优惠券列表中存在重复的券');
  }

  const couponSnapshots: Array<{
    index: number;
    originalStatus: CouponStatus;
    originalUsedAt?: string;
    originalUsedBookingId?: string;
  }> = [];

  const redeemedCoupons: Coupon[] = [];

  try {
    for (const couponId of couponIds) {
      const couponIndex = coupons.findIndex((c) => c.id === couponId);
      if (couponIndex === -1) {
        throw new Error(`优惠券不存在: ${couponId}`);
      }

      const coupon = coupons[couponIndex];
      couponSnapshots.push({
        index: couponIndex,
        originalStatus: coupon.status,
        originalUsedAt: coupon.usedAt,
        originalUsedBookingId: coupon.usedBookingId,
      });

      if (coupon.status !== 'unused') {
        throw new Error(`优惠券状态异常（非未使用状态）: ${couponId}`);
      }

      coupon.status = 'used';
      coupon.usedAt = new Date().toISOString();
      coupon.usedBookingId = bookingId;
      redeemedCoupons.push(coupon);
    }
  } catch (error) {
    for (let i = couponSnapshots.length - 1; i >= 0; i--) {
      const snapshot = couponSnapshots[i];
      const coupon = coupons[snapshot.index];
      coupon.status = snapshot.originalStatus;
      coupon.usedAt = snapshot.originalUsedAt;
      coupon.usedBookingId = snapshot.originalUsedBookingId;
    }
    throw error;
  }

  return redeemedCoupons;
}

export function recycleCoupons(couponIds: string[]): Coupon[] {
  const recycledCoupons: Coupon[] = [];

  for (const couponId of couponIds) {
    const coupon = getCouponById(couponId);
    if (!coupon) {
      throw new Error(`优惠券不存在: ${couponId}`);
    }

    if (coupon.status === 'used') {
      coupon.status = 'unused';
      coupon.usedAt = undefined;
      coupon.usedBookingId = undefined;
    }

    recycledCoupons.push(coupon);
  }

  return recycledCoupons;
}

export function markExpiredCoupons(): Coupon[] {
  const now = new Date();
  const expiredCoupons: Coupon[] = [];

  for (const coupon of coupons) {
    if (coupon.status !== 'unused') {
      continue;
    }

    const validTo = new Date(coupon.validTo);
    validTo.setHours(23, 59, 59, 999);
    if (now.getTime() > validTo.getTime()) {
      coupon.status = 'expired';
      expiredCoupons.push(coupon);
    }
  }

  return expiredCoupons;
}
