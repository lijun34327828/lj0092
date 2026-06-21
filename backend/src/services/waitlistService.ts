import { waitlistEntries, bookings, notifications, venueZones } from '../data/store';
import { WaitlistEntry, WaitlistStatus, BookingEquipment, Booking, PriceBreakdown } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { calculateTotalPrice } from './pricingService';
import { redeemCoupons } from './couponService';
import { getMemberById, deductBalance } from './memberService';

function getIsZoneAvailable(): (zoneId: string, date: string, startTime: string, endTime: string) => boolean {
  const mod = require('./bookingService');
  return mod.isZoneAvailable;
}

function addNotification(
  memberId: string | undefined,
  bookingId: string | undefined,
  waitlistId: string | undefined,
  type: 'waitlist_matched' | 'booking_cancelled' | 'refund_completed' | 'coupon_expiring' | 'level_upgraded',
  title: string,
  content: string
): void {
  notifications.push({
    id: uuidv4(),
    memberId,
    bookingId,
    waitlistId,
    type,
    title,
    content,
    read: false,
    createdAt: new Date().toISOString(),
  });
}

export function renumberWaitlistQueue(zoneId: string, date: string, startTime: string, endTime: string): void {
  const waitingEntries = waitlistEntries
    .filter(
      (e) =>
        e.zoneId === zoneId &&
        e.date === date &&
        e.startTime === startTime &&
        e.endTime === endTime &&
        e.status === 'waiting'
    )
    .sort((a, b) => a.queuePosition - b.queuePosition);

  waitingEntries.forEach((entry, index) => {
    entry.queuePosition = index + 1;
  });
}

export interface AddToWaitlistParams {
  zoneId: string;
  memberId?: string;
  userName: string;
  phone: string;
  date: string;
  startTime: string;
  endTime: string;
  peopleCount: number;
  equipment: BookingEquipment[];
  selectedCouponIds?: string[];
}

export function addToWaitlist(params: AddToWaitlistParams): WaitlistEntry {
  const {
    zoneId,
    memberId,
    userName,
    phone,
    date,
    startTime,
    endTime,
    peopleCount,
    equipment,
    selectedCouponIds = [],
  } = params;

  const isZoneAvailable = getIsZoneAvailable();
  if (isZoneAvailable(zoneId, date, startTime, endTime)) {
    throw new Error('该时段场地空闲，无需加入候补队列，请直接预约');
  }

  const zone = venueZones.find((z) => z.id === zoneId);
  if (!zone) {
    throw new Error('场地不存在');
  }

  if (peopleCount > zone.capacity) {
    throw new Error(`人数超出场地容量限制（最多${zone.capacity}人）`);
  }

  const waitingCount = waitlistEntries.filter(
    (e) =>
      e.zoneId === zoneId &&
      e.date === date &&
      e.startTime === startTime &&
      e.endTime === endTime &&
      e.status === 'waiting'
  ).length;

  const entry: WaitlistEntry = {
    id: uuidv4(),
    zoneId,
    memberId,
    userName,
    phone,
    date,
    startTime,
    endTime,
    peopleCount,
    equipment: [...equipment],
    selectedCouponIds: [...selectedCouponIds],
    status: 'waiting',
    queuePosition: waitingCount + 1,
    createdAt: new Date().toISOString(),
  };

  waitlistEntries.push(entry);
  return entry;
}

export function getWaitlistEntryById(id: string): WaitlistEntry | undefined {
  return waitlistEntries.find((e) => e.id === id);
}

export function getWaitlistByZoneDateTime(
  zoneId: string,
  date: string,
  startTime: string,
  endTime: string
): WaitlistEntry[] {
  return waitlistEntries
    .filter(
      (e) =>
        e.zoneId === zoneId &&
        e.date === date &&
        e.startTime === startTime &&
        e.endTime === endTime &&
        e.status === 'waiting'
    )
    .sort((a, b) => a.queuePosition - b.queuePosition);
}

export function getWaitlistByMember(memberId: string): WaitlistEntry[] {
  return waitlistEntries
    .filter((e) => e.memberId === memberId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getAllWaitlistEntries(): WaitlistEntry[] {
  return [...waitlistEntries];
}

export function cancelWaitlistEntry(id: string): WaitlistEntry {
  const entry = getWaitlistEntryById(id);
  if (!entry) {
    throw new Error('候补记录不存在');
  }

  if (entry.status !== 'waiting') {
    throw new Error(`当前状态为${entry.status}，无法取消`);
  }

  entry.status = 'cancelled';
  entry.cancelledAt = new Date().toISOString();

  renumberWaitlistQueue(entry.zoneId, entry.date, entry.startTime, entry.endTime);

  return entry;
}

export interface ProcessWaitlistResult {
  success: boolean;
  entry?: WaitlistEntry;
  booking?: Booking;
  error?: string;
}

export function processWaitlistForSlot(
  zoneId: string,
  date: string,
  startTime: string,
  endTime: string
): ProcessWaitlistResult {
  const waitingEntries = getWaitlistByZoneDateTime(zoneId, date, startTime, endTime);

  if (waitingEntries.length === 0) {
    return { success: false, error: '该时段无等待中的候补记录' };
  }

  const entry = waitingEntries[0];

  const isZoneAvailable = getIsZoneAvailable();
  if (!isZoneAvailable(zoneId, date, startTime, endTime)) {
    return { success: false, error: '该时段场地仍被占用' };
  }

  const zone = venueZones.find((z) => z.id === zoneId);
  if (!zone) {
    return { success: false, error: '场地不存在' };
  }

  if (entry.peopleCount > zone.capacity) {
    return { success: false, error: '候补人数超出场地容量限制' };
  }

  let memberTotalSpent: number | undefined;
  if (entry.memberId) {
    const member = getMemberById(entry.memberId);
    if (member) {
      memberTotalSpent = member.totalSpent;
    }
  }

  const priceResult = calculateTotalPrice({
    zoneId,
    date,
    startTime,
    endTime,
    peopleCount: entry.peopleCount,
    equipment: entry.equipment,
    memberId: entry.memberId,
    memberTotalSpent,
    couponIds: entry.selectedCouponIds,
  });

  const priceBreakdown: PriceBreakdown = {
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
  };

  const appliedCouponIds = priceResult.appliedCoupons.map((c) => c.couponId);
  const totalPrice = priceResult.total;

  const booking: Booking = {
    id: uuidv4(),
    zoneId,
    memberId: entry.memberId,
    userName: entry.userName,
    phone: entry.phone,
    date,
    startTime,
    endTime,
    peopleCount: entry.peopleCount,
    equipment: [...entry.equipment],
    appliedCouponIds,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
    totalPrice,
    paidAmount: totalPrice,
    refundAmount: 0,
    priceBreakdown,
    fromWaitlistId: entry.id,
  };

  try {
    if (entry.memberId) {
      const member = getMemberById(entry.memberId);
      if (member && member.balance >= totalPrice) {
        deductBalance(entry.memberId, totalPrice, booking.id, '候补补位自动扣款');
      }
    }

    if (appliedCouponIds.length > 0) {
      redeemCoupons(appliedCouponIds, booking.id);
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `支付或核销优惠券失败：${errorMsg}` };
  }

  bookings.push(booking);

  entry.status = 'matched';
  entry.matchedAt = new Date().toISOString();
  entry.matchedBookingId = booking.id;

  renumberWaitlistQueue(zoneId, date, startTime, endTime);

  addNotification(
    entry.memberId,
    booking.id,
    entry.id,
    'waitlist_matched',
    '候补成功匹配',
    `您好，${entry.userName}！您候补的${zone.name}（${date} ${startTime}-${endTime}）已成功匹配，订单号：${booking.id}，金额：${totalPrice.toFixed(2)}元`
  );

  return { success: true, entry, booking };
}
