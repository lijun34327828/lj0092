import { Booking, BookingEquipment } from '../types';
import { bookings, refundRules, venueZones } from '../data/store';
import { v4 as uuidv4 } from 'uuid';
import { calculateTotalPrice, calculateDurationHours } from './pricingService';

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
}

export function createBooking(params: CreateBookingParams): Booking {
  const { zoneId, userName, phone, date, startTime, endTime, peopleCount, equipment } = params;

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

  const priceResult = calculateTotalPrice({
    zoneId,
    date,
    startTime,
    endTime,
    peopleCount,
    equipment,
  });

  const booking: Booking = {
    id: uuidv4(),
    zoneId,
    userName,
    phone,
    date,
    startTime,
    endTime,
    peopleCount,
    equipment,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
    totalPrice: priceResult.total,
    priceBreakdown: {
      basePrice: priceResult.basePrice,
      discountAmount: priceResult.discountAmount,
      equipmentPrice: priceResult.equipmentPrice,
      temporaryServiceFee: priceResult.temporaryServiceFee,
      total: priceResult.total,
      details: {
        timeSlotPrice: priceResult.details.timeSlotPrice,
        durationHours: priceResult.details.durationHours,
        groupDiscountRate: priceResult.details.groupDiscountRate,
        equipmentItems: priceResult.details.equipmentItems,
        temporaryServiceFeeApplied: priceResult.details.temporaryServiceFeeApplied,
        temporaryServiceFeeAmount: priceResult.details.temporaryServiceFeeAmount,
      },
    },
  };

  bookings.push(booking);
  return booking;
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

export function calculateRefund(bookingId: string, cancelTime?: Date): { refundAmount: number; refundRate: number; ruleName: string } {
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

export function cancelBooking(bookingId: string): { booking: Booking; refundInfo: { refundAmount: number; refundRate: number; ruleName: string } } {
  const booking = getBookingById(bookingId);
  if (!booking) {
    throw new Error('预约不存在');
  }

  if (booking.status === 'cancelled') {
    throw new Error('预约已取消');
  }

  const refundInfo = calculateRefund(bookingId);

  booking.status = 'cancelled';

  return { booking, refundInfo };
}

export function getZoneBookings(zoneId: string, date: string): Booking[] {
  return bookings.filter(
    (b) => b.zoneId === zoneId && b.date === date && b.status !== 'cancelled'
  );
}
