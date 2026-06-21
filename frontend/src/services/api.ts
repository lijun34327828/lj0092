import axios from 'axios';
import type {
  VenueZone,
  TimeSlot,
  Equipment,
  Booking,
  BookingEquipment,
  PriceBreakdown,
  GroupDiscountTier,
  RefundRule,
  TimePricingRule,
  Member,
  MemberLevelRule,
  WalletTransaction,
  Coupon,
  WaitlistEntry,
  DynamicPremiumRule,
} from '../types';

const api = axios.create({
  baseURL: '/api',
});

export const venueApi = {
  getZones: (): Promise<VenueZone[]> => api.get('/config/zones').then((res) => res.data),
};

export const timeSlotApi = {
  getTimeSlots: (): Promise<TimeSlot[]> => api.get('/config/time-slots').then((res) => res.data),
};

export const pricingRulesApi = {
  getPricingRules: (): Promise<TimePricingRule[]> => api.get('/config/pricing-rules').then((res) => res.data),
  addPricingRule: (rule: Omit<TimePricingRule, 'id'>): Promise<TimePricingRule> =>
    api.post('/config/pricing-rules', rule).then((res) => res.data),
  updatePricingRule: (id: string, updates: Partial<TimePricingRule>): Promise<TimePricingRule> =>
    api.put(`/config/pricing-rules/${id}`, updates).then((res) => res.data),
  deletePricingRule: (id: string): Promise<{ success: boolean }> =>
    api.delete(`/config/pricing-rules/${id}`).then((res) => res.data),
};

export const equipmentApi = {
  getEquipment: (): Promise<Equipment[]> => api.get('/config/equipment').then((res) => res.data),
};

export const discountApi = {
  getDiscountTiers: (): Promise<GroupDiscountTier[]> => api.get('/config/discount-tiers').then((res) => res.data),
};

export const refundApi = {
  getRefundRules: (): Promise<RefundRule[]> => api.get('/config/refund-rules').then((res) => res.data),
};

export const memberApi = {
  getMembers: (phone?: string): Promise<Member[]> =>
    api.get('/members', { params: phone ? { phone } : {} }).then((res) => res.data),
  getMember: (id: string): Promise<Member> => api.get(`/members/${id}`).then((res) => res.data),
  createMember: (params: { name: string; phone: string }): Promise<Member> =>
    api.post('/members', params).then((res) => res.data),
  updateMember: (id: string, params: { name?: string; phone?: string }): Promise<Member> =>
    api.put(`/members/${id}`, params).then((res) => res.data),
  rechargeMember: (id: string, params: { amount: number; remark?: string }): Promise<Member> =>
    api.post(`/members/${id}/recharge`, params).then((res) => res.data),
  getMemberTransactions: (id: string, limit?: number): Promise<WalletTransaction[]> =>
    api.get(`/members/${id}/transactions`, { params: limit ? { limit } : {} }).then((res) => res.data),
  verifyMemberConsistency: (id: string): Promise<{ consistent: boolean; message: string }> =>
    api.get(`/members/${id}/verify-consistency`).then((res) => res.data),
  getLevelRules: (): Promise<MemberLevelRule[]> => api.get('/members/level-rules').then((res) => res.data),
};

export const couponApi = {
  getCoupons: (params?: { memberId?: string; status?: string }): Promise<Coupon[]> =>
    api.get('/coupons', { params: params || {} }).then((res) => res.data),
  getCoupon: (id: string): Promise<Coupon> => api.get(`/coupons/${id}`).then((res) => res.data),
  createCoupon: (params: {
    name: string;
    type: string;
    value: number;
    minConsumption: number;
    validFrom: string;
    validTo: string;
    applicableZoneIds?: string[];
    applicableTimePeriods?: string[];
    memberId?: string;
  }): Promise<Coupon> => api.post('/coupons', params).then((res) => res.data),
  getAvailableCoupons: (memberId: string): Promise<Coupon[]> =>
    api.get(`/coupons/member/${memberId}/available`).then((res) => res.data),
  checkCouponApplicable: (
    id: string,
    params: {
      zoneId: string;
      date: string;
      startTime: string;
      endTime: string;
      currentAmountAfterMemberDiscount: number;
      memberId?: string;
    }
  ): Promise<{ applicable: boolean; reason?: string; discountAmount?: number }> =>
    api.post(`/coupons/${id}/check-applicable`, params).then((res) => res.data),
  recycleCoupons: (couponIds: string[]): Promise<{ success: boolean }> =>
    api.post('/coupons/batch/recycle', { couponIds }).then((res) => res.data),
  markExpired: (): Promise<{ processed: number }> =>
    api.post('/coupons/mark-expired').then((res) => res.data),
};

export const waitlistApi = {
  addWaitlist: (params: {
    zoneId: string;
    memberId?: string;
    userName: string;
    phone: string;
    date: string;
    startTime: string;
    endTime: string;
    peopleCount: number;
    equipment?: BookingEquipment[];
    selectedCouponIds?: string[];
  }): Promise<WaitlistEntry> => api.post('/waitlist', params).then((res) => res.data),
  getWaitlists: (params?: {
    zoneId?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
    memberId?: string;
  }): Promise<WaitlistEntry[]> =>
    api.get('/waitlist', { params: params || {} }).then((res) => res.data),
  getWaitlist: (id: string): Promise<WaitlistEntry> =>
    api.get(`/waitlist/${id}`).then((res) => res.data),
  cancelWaitlist: (id: string): Promise<WaitlistEntry> =>
    api.post(`/waitlist/${id}/cancel`).then((res) => res.data),
  getWaitlistByZoneDateTime: (
    zoneId: string,
    date: string,
    startTime: string,
    endTime: string
  ): Promise<WaitlistEntry[]> =>
    api.get(`/waitlist/zone/${zoneId}/${date}/${startTime}/${endTime}`).then((res) => res.data),
  processSlot: (params: {
    zoneId: string;
    date: string;
    startTime: string;
    endTime: string;
  }): Promise<{ success: boolean; bookingId?: string; error?: string }> =>
    api.post('/waitlist/process-slot', params).then((res) => res.data),
};

export const premiumApi = {
  getRule: (): Promise<DynamicPremiumRule> =>
    api.get('/config/premium/rule').then((res) => res.data),
  updateRule: (
    id: string,
    params: { occupancyThreshold?: number; premiumRate?: number; enabled?: boolean }
  ): Promise<DynamicPremiumRule> =>
    api.put(`/config/premium/rule/${id}`, params).then((res) => res.data),
  getOccupancyInfo: (
    date: string,
    startTime: string,
    endTime: string
  ): Promise<{
    occupancyRate: number;
    threshold: number;
    premiumRate: number;
    premiumMultiplier: number;
    occupiedCount: number;
    totalCount: number;
  }> =>
    api
      .get('/config/premium/occupancy', { params: { date, startTime, endTime } })
      .then((res) => res.data),
};

export interface CalculatePriceParams {
  zoneId: string;
  date: string;
  startTime: string;
  endTime: string;
  peopleCount: number;
  equipment: BookingEquipment[];
  memberId?: string;
  memberTotalSpent?: number;
  couponIds?: string[];
}

export const bookingApi = {
  calculatePrice: (params: CalculatePriceParams): Promise<PriceBreakdown> =>
    api.post('/bookings/calculate-price', params).then((res) => res.data),

  checkAvailability: (zoneId: string, date: string, startTime: string, endTime: string) =>
    api.get('/bookings/availability/check', { params: { zoneId, date, startTime, endTime } }).then((res) => res.data),

  getAvailableZones: (date: string, startTime: string, endTime: string) =>
    api.get('/bookings/availability/zones', { params: { date, startTime, endTime } }).then((res) => res.data),

  createBooking: (params: {
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
  }): Promise<Booking> => api.post('/bookings', params).then((res) => res.data),

  getBooking: (id: string): Promise<Booking> => api.get(`/bookings/${id}`).then((res) => res.data),

  getBookings: (date?: string): Promise<Booking[]> =>
    api.get('/bookings', { params: date ? { date } : {} }).then((res) => res.data),

  cancelBooking: (id: string): Promise<{ booking: Booking; refundInfo: { refundAmount: number; refundRate: number; ruleName: string } }> =>
    api.post(`/bookings/${id}/cancel`).then((res) => res.data),

  getRefundInfo: (id: string): Promise<{ refundAmount: number; refundRate: number; ruleName: string }> =>
    api.get(`/bookings/${id}/refund`).then((res) => res.data),

  getZoneBookings: (zoneId: string, date: string): Promise<Booking[]> =>
    api.get(`/bookings/zone/${zoneId}/${date}`).then((res) => res.data),
};

export default api;
