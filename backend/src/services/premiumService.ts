import { dynamicPremiumRules, bookings, venueZones, timeSlots } from '../data/store';
import { DynamicPremiumRule } from '../types';
import { getTimeSlotByTime } from './pricingService';

export function getDynamicPremiumRule(): DynamicPremiumRule {
  const enabledRule = dynamicPremiumRules.find((r) => r.enabled === true);
  if (enabledRule) {
    return enabledRule;
  }
  return {
    id: 'default',
    name: '默认动态溢价规则',
    occupancyThreshold: 0,
    premiumRate: 0,
    enabled: false,
    description: '默认规则：无溢价',
  };
}

export interface UpdatePremiumRuleUpdates {
  occupancyThreshold?: number;
  premiumRate?: number;
  enabled?: boolean;
}

export function updateDynamicPremiumRule(id: string, updates: UpdatePremiumRuleUpdates): DynamicPremiumRule {
  const ruleIndex = dynamicPremiumRules.findIndex((r) => r.id === id);
  if (ruleIndex === -1) {
    throw new Error(`动态溢价规则不存在: ${id}`);
  }
  const rule = dynamicPremiumRules[ruleIndex];
  const updatedRule: DynamicPremiumRule = {
    ...rule,
    ...updates,
  };
  dynamicPremiumRules[ruleIndex] = updatedRule;
  return updatedRule;
}

export function calculateTimeSlotOccupancy(date: string, timeSlotId: string): { occupancyRate: number; occupiedCount: number; totalCount: number } {
  const timeSlot = timeSlots.find((t) => t.id === timeSlotId);
  if (!timeSlot) {
    return { occupancyRate: 0, occupiedCount: 0, totalCount: venueZones.length };
  }

  const totalCount = venueZones.length;
  let occupiedCount = 0;

  for (const zone of venueZones) {
    const hasActiveBooking = bookings.some((booking) => {
      if (booking.zoneId !== zone.id || booking.date !== date) {
        return false;
      }
      if (booking.status === 'cancelled') {
        return false;
      }
      const bookingSlotId = getTimeSlotByTime(booking.startTime, booking.endTime);
      return bookingSlotId === timeSlotId;
    });
    if (hasActiveBooking) {
      occupiedCount++;
    }
  }

  const occupancyRate = totalCount > 0 ? occupiedCount / totalCount : 0;
  return { occupancyRate, occupiedCount, totalCount };
}

export function getPremiumMultiplier(date: string, startTime: string, endTime: string): number {
  const rule = getDynamicPremiumRule();
  if (!rule.enabled) {
    return 1.0;
  }

  const timeSlotId = getTimeSlotByTime(startTime, endTime);
  if (!timeSlotId) {
    return 1.0;
  }

  const { occupancyRate } = calculateTimeSlotOccupancy(date, timeSlotId);
  if (occupancyRate >= rule.occupancyThreshold) {
    return 1 + rule.premiumRate;
  }
  return 1.0;
}

export interface OccupancyInfo {
  occupancyRate: number;
  threshold: number;
  premiumRate: number;
  premiumMultiplier: number;
  occupiedCount: number;
  totalCount: number;
}

export function getOccupancyInfo(date: string, startTime: string, endTime: string): OccupancyInfo {
  const rule = getDynamicPremiumRule();
  const timeSlotId = getTimeSlotByTime(startTime, endTime);

  if (!timeSlotId) {
    return {
      occupancyRate: 0,
      threshold: rule.occupancyThreshold,
      premiumRate: rule.premiumRate,
      premiumMultiplier: 1.0,
      occupiedCount: 0,
      totalCount: venueZones.length,
    };
  }

  const { occupancyRate, occupiedCount, totalCount } = calculateTimeSlotOccupancy(date, timeSlotId);
  const premiumMultiplier = rule.enabled && occupancyRate >= rule.occupancyThreshold ? 1 + rule.premiumRate : 1.0;

  return {
    occupancyRate,
    threshold: rule.occupancyThreshold,
    premiumRate: rule.premiumRate,
    premiumMultiplier,
    occupiedCount,
    totalCount,
  };
}
