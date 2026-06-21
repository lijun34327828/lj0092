import axios from 'axios';
import type { VenueZone, TimeSlot, Equipment, Booking, BookingEquipment, PriceBreakdown, GroupDiscountTier, RefundRule, TimePricingRule } from '../types';

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

export interface CalculatePriceParams {
  zoneId: string;
  date: string;
  startTime: string;
  endTime: string;
  peopleCount: number;
  equipment: BookingEquipment[];
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
