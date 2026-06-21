import { Booking, BookingEquipment } from '../types';
import { bookings, refundRules, venueZones, notifications } from '../data/store';
import { v4 as uuidv4 } from 'uuid';
import {
  calculateTotalPrice,
  calculateDurationHours,
} from './pricingService';
import {
  generateZoneLockKey,
  generateCouponLockKey,
  generateMemberLockKey,
  withLock,
} from './lockService';
import { getMemberById, deductBalance, refundToBalance, verifyBalanceConsistency } from './memberService';
import { redeemCoupons, recycleCoupons } from './couponService';

export function isZoneAvailable(
  zoneId: string,
  date: string,
  startTime: string,
  endTime: string
): boolean {
  const conflictingBooking = bookings.find(
    (b) =>
      b.zoneId === zoneId &&
      b.date === date &&
      b.status !== 'cancelled' &&
      isTimeOverlap(b.startTime, b.endTime, startTime, endTime)
  );
  return !conflictingBooking;
}

function isTimeOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const [s1h, s1m] = start1.split(':').map(Number);
  const [e1h, e1m] = end1.split(':').map(Number);
  const [s2h, s2m] = start2.split(':').map(Number);
  const [e2h, e2m] = end2.split(':').map(Number);

  const start1Minutes = s1h * 60 + s1m;
  const end1Minutes = e1h * 60 + e1m;
  const start2Minutes = s2h * 60 + s2m;
  const end2Minutes = e2h * 60 + e2m;

  return start1Minutes < end2Minutes && start2Minutes < end1Minutes;
}

export function findAvailableZones(
  date: string,
  startTime: string,
  endTime: string
): string[] {
  return venueZones
    .filter((zone) => isZoneAvailable(zone.id, date, startTime, endTime))
    .map((zone) => zone.id);
}

export interface CreateBookingParams {
  zoneId: string;
  userName: string;
  phone: string;
  date: string;
  startTime: string;
  endTime: string;
  peopleCount: number;
  equipment: BookingEquipment[];
  memberId?: string;
  couponIds?: string[];
  useBalance?: boolean;
  fromWaitlistId?: string;
}

export async function createBooking(params: CreateBookingParams): Promise<Booking> {
  const {
    zoneId,
    userName,
    phone,
    date,
    startTime,
    endTime,
    peopleCount,
    equipment,
    memberId,
    couponIds = [],
    useBalance = false,
    fromWaitlistId,
  } = params;

  const holderId = uuidv4();

  const lockKeys: string[] = [generateZoneLockKey(zoneId, date, startTime, endTime)];
  couponIds.forEach((cid) => lockKeys.push(generateCouponLockKey(cid)));
  if (memberId) {
    lockKeys.push(generateMemberLockKey(memberId));
  }

  return withLock(lockKeys, holderId, async (): Promise<Booking> => {
    if (!isZoneAvailable(zoneId, date, startTime, endTime)) {
      const availableZones = findAvailableZones(date, startTime, endTime);
      const availableZoneNames = availableZones
        .map((zid) => venueZones.find((z) => z.id === zid)?.name || zid)
        .join('、');
      throw new Error(`该时段场地已被占用，推荐空闲场地：${availableZoneNames || '无'}`);
    }

    const zone = venueZones.find((z) => z.id === zoneId);
    if (!zone) {
      throw new Error('场地不存在');
    }

    if (peopleCount > zone.capacity) {
      throw new Error(`人数超出场地容量限制（最多${zone.capacity}人）`);
    }

    let memberTotalSpent: number | undefined;
    if (memberId) {
      const member = getMemberById(memberId);
      if (!member) {
        throw new Error('会员不存在');
      }
      memberTotalSpent = member.totalSpent;
    }

    const priceResult = calculateTotalPrice({
      zoneId,
      date,
      startTime,
      endTime,
      peopleCount,
      equipment,
      memberId,
      memberTotalSpent,
      couponIds,
    });

    const now = new Date().toISOString();

    const booking: Booking = {
      id: uuidv4(),
      zoneId,
      memberId,
      userName,
      phone,
      date,
      startTime,
      endTime,
      peopleCount,
      equipment,
      appliedCouponIds: priceResult.appliedCoupons.map((c) => c.couponId),
      status: 'confirmed',
      createdAt: now,
      totalPrice: priceResult.total,
      paidAmount: 0,
      refundAmount: 0,
      priceBreakdown: {
        basePrice: priceResult.basePrice,
        dynamicPremiumRate: priceResult.dynamicPremiumRate,
        dynamicPremiumAmount: priceResult.dynamicPremiumAmount,
        premiumBasePrice: priceResult.premiumBasePrice,
        groupDiscountRate: priceResult.groupDiscountRate,
        groupDiscountAmount: priceResult.groupDiscountAmount,
        afterGroupDiscount: priceResult.afterGroupDiscount,
        memberLevel: priceResult.memberLevel,
        memberLevelName: priceResult.memberLevelName,
        memberDiscountRate: priceResult.memberDiscountRate,
        memberDiscountAmount: priceResult.memberDiscountAmount,
        afterMemberDiscount: priceResult.afterMemberDiscount,
        appliedCoupons: priceResult.appliedCoupons,
        couponTotalDiscount: priceResult.couponTotalDiscount,
        afterCoupons: priceResult.afterCoupons,
        equipmentPrice: priceResult.equipmentPrice,
        temporaryServiceFee: priceResult.temporaryServiceFee,
        discountAmount: priceResult.discountAmount,
        total: priceResult.total,
        details: {
          timeSlotPrice: priceResult.details.timeSlotPrice,
          durationHours: priceResult.details.durationHours,
          dayType: priceResult.details.dayType,
          timeSlotId: priceResult.details.timeSlotId,
          groupDiscountRate: priceResult.details.groupDiscountRate,
          groupDiscountTier: priceResult.details.groupDiscountTier,
          equipmentItems: priceResult.details.equipmentItems,
          temporaryServiceFeeApplied: priceResult.details.temporaryServiceFeeApplied,
          temporaryServiceFeeAmount: priceResult.details.temporaryServiceFeeAmount,
        },
      },
      fromWaitlistId,
    };

    if (priceResult.appliedCoupons.length > 0) {
      try {
        redeemCoupons(
          priceResult.appliedCoupons.map((c) => c.couponId),
          booking.id
        );
      } catch (err) {
        throw new Error(`券核销失败：${(err as Error).message}`);
      }
    }

    if (memberId && useBalance && priceResult.total > 0) {
      const member = getMemberById(memberId);
      if (!member) {
        if (priceResult.appliedCoupons.length > 0) {
          recycleCoupons(priceResult.appliedCoupons.map((c) => c.couponId));
        }
        throw new Error('会员不存在，无法使用余额支付');
      }
      try {
        deductBalance(memberId, priceResult.total, booking.id, '预约支付');
        booking.paidAmount = priceResult.total;
        verifyBalanceConsistency(memberId);
      } catch (err) {
        if (priceResult.appliedCoupons.length > 0) {
          recycleCoupons(priceResult.appliedCoupons.map((c) => c.couponId));
        }
        throw new Error(`余额扣款失败：${(err as Error).message}`);
      }
    }

    bookings.push(booking);
    return booking;
  });
}

export function getBookingById(bookingId: string): Booking | undefined {
  return bookings.find((b) => b.id === bookingId);
}

export function getBookingsByDate(date: string): Booking[] {
  return bookings.filter((b) => b.date === date && b.status !== 'cancelled');
}

export function getAllBookings(): Booking[] {
  return [...bookings];
}

export function calculateRefund(
  bookingId: string,
  cancelTime?: Date
): { refundAmount: number; refundRate: number; ruleName: string } {
  const booking = getBookingById(bookingId);
  if (!booking) {
    throw new Error('预约不存在');
  }

  if (booking.status === 'cancelled') {
    throw new Error('预约已取消');
  }

  const now = cancelTime || new Date();
  const bookingStart = new Date(`${booking.date}T${booking.startTime}:00`);
  const diffMs = bookingStart.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours <= 0) {
    return { refundAmount: 0, refundRate: 0, ruleName: '已过预约时间' };
  }

  for (const rule of refundRules) {
    if (diffHours >= rule.minHoursBefore && diffHours < rule.maxHoursBefore) {
      const refundAmount = booking.totalPrice * rule.refundRate;
      return {
        refundAmount: Math.round(refundAmount * 100) / 100,
        refundRate: rule.refundRate,
        ruleName: rule.name,
      };
    }
  }

  return { refundAmount: 0, refundRate: 0, ruleName: '无匹配退款规则' };
}

export async function cancelBooking(
  bookingId: string
): Promise<{
  booking: Booking;
  refundInfo: { refundAmount: number; refundRate: number; ruleName: string };
}> {
  const booking = getBookingById(bookingId);
  if (!booking) {
    throw new Error('预约不存在');
  }

  if (booking.status === 'cancelled') {
    throw new Error('预约已取消');
  }

  const holderId = uuidv4();

  const lockKeys: string[] = [generateZoneLockKey(booking.zoneId, booking.date, booking.startTime, booking.endTime)];
  booking.appliedCouponIds.forEach((cid) => lockKeys.push(generateCouponLockKey(cid)));
  if (booking.memberId) {
    lockKeys.push(generateMemberLockKey(booking.memberId));
  }

  return withLock(lockKeys, holderId, async () => {
    const currentBooking = getBookingById(bookingId);
    if (!currentBooking || currentBooking.status === 'cancelled') {
      throw new Error('预约已取消');
    }

    const refundInfo = calculateRefund(bookingId);

    if (currentBooking.appliedCouponIds && currentBooking.appliedCouponIds.length > 0) {
      try {
        recycleCoupons(currentBooking.appliedCouponIds);
      } catch {
        // 回收失败不阻断取消流程
      }
    }

    if (currentBooking.memberId && refundInfo.refundAmount > 0 && currentBooking.paidAmount > 0) {
      try {
        refundToBalance(
          currentBooking.memberId,
          refundInfo.refundAmount,
          currentBooking.id,
          `预约取消退款（${refundInfo.ruleName}）`
        );
        verifyBalanceConsistency(currentBooking.memberId);
      } catch {
        // 退款回冲失败不阻断
      }
    }

    currentBooking.status = 'cancelled';
    currentBooking.cancelledAt = new Date().toISOString();
    currentBooking.refundAmount = refundInfo.refundAmount;

    notifications.push({
      id: uuidv4(),
      memberId: currentBooking.memberId,
      bookingId: currentBooking.id,
      type: 'booking_cancelled',
      title: '预约已取消',
      content: `您的${currentBooking.date} ${currentBooking.startTime}-${currentBooking.endTime}预约已取消，退款${refundInfo.refundAmount.toFixed(2)}元`,
      read: false,
      createdAt: new Date().toISOString(),
    });

    let waitlistResult: { success: boolean; bookingId?: string } = { success: false };
    try {
      const { processWaitlistForSlot } = await import('./waitlistService');
      const result = processWaitlistForSlot(
        currentBooking.zoneId,
        currentBooking.date,
        currentBooking.startTime,
        currentBooking.endTime
      );
      if (result && result.success && result.booking) {
        waitlistResult = { success: true, bookingId: result.booking.id };
      }
    } catch {
      // 候补处理失败不阻断
    }

    return { booking: currentBooking, refundInfo };
  });
}

export function getZoneBookings(zoneId: string, date: string): Booking[] {
  return bookings.filter(
    (b) => b.zoneId === zoneId && b.date === date && b.status !== 'cancelled'
  );
}

export { calculateDurationHours };
