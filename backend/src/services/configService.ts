import {
  TimePricingRule,
  GroupDiscountTier,
  Equipment,
  RefundRule,
  TemporaryServiceFeeRule,
  VenueZone,
  TimeSlot,
} from '../types';
import {
  timePricingRules,
  groupDiscountTiers,
  equipmentList,
  refundRules,
  temporaryServiceFeeRule as defaultTemporaryFeeRule,
  venueZones,
  timeSlots,
} from '../data/store';
import { v4 as uuidv4 } from 'uuid';

let temporaryServiceFeeRule = { ...defaultTemporaryFeeRule };

export function getAllZones(): VenueZone[] {
  return [...venueZones];
}

export function updateZone(zoneId: string, updates: Partial<VenueZone>): VenueZone | null {
  const index = venueZones.findIndex((z) => z.id === zoneId);
  if (index === -1) return null;
  venueZones[index] = { ...venueZones[index], ...updates };
  return venueZones[index];
}

export function addZone(zone: Omit<VenueZone, 'id'>): VenueZone {
  const newZone = { ...zone, id: uuidv4() };
  venueZones.push(newZone);
  return newZone;
}

export function deleteZone(zoneId: string): boolean {
  const index = venueZones.findIndex((z) => z.id === zoneId);
  if (index === -1) return false;
  venueZones.splice(index, 1);
  return true;
}

export function getAllTimeSlots(): TimeSlot[] {
  return [...timeSlots];
}

export function getAllTimePricingRules(): TimePricingRule[] {
  return [...timePricingRules];
}

export function addTimePricingRule(rule: Omit<TimePricingRule, 'id'>): TimePricingRule {
  const newRule = { ...rule, id: uuidv4() };
  timePricingRules.push(newRule);
  return newRule;
}

export function updateTimePricingRule(
  ruleId: string,
  updates: Partial<TimePricingRule>
): TimePricingRule | null {
  const index = timePricingRules.findIndex((r) => r.id === ruleId);
  if (index === -1) return null;
  timePricingRules[index] = { ...timePricingRules[index], ...updates };
  return timePricingRules[index];
}

export function deleteTimePricingRule(ruleId: string): boolean {
  const index = timePricingRules.findIndex((r) => r.id === ruleId);
  if (index === -1) return false;
  timePricingRules.splice(index, 1);
  return true;
}

export function getAllGroupDiscountTiers(): GroupDiscountTier[] {
  return [...groupDiscountTiers];
}

export function addGroupDiscountTier(tier: Omit<GroupDiscountTier, 'id'>): GroupDiscountTier {
  const newTier = { ...tier, id: uuidv4() };
  groupDiscountTiers.push(newTier);
  return newTier;
}

export function updateGroupDiscountTier(
  tierId: string,
  updates: Partial<GroupDiscountTier>
): GroupDiscountTier | null {
  const index = groupDiscountTiers.findIndex((t) => t.id === tierId);
  if (index === -1) return null;
  groupDiscountTiers[index] = { ...groupDiscountTiers[index], ...updates };
  return groupDiscountTiers[index];
}

export function deleteGroupDiscountTier(tierId: string): boolean {
  const index = groupDiscountTiers.findIndex((t) => t.id === tierId);
  if (index === -1) return false;
  groupDiscountTiers.splice(index, 1);
  return true;
}

export function getAllEquipment(): Equipment[] {
  return [...equipmentList];
}

export function addEquipment(equipment: Omit<Equipment, 'id'>): Equipment {
  const newEquipment = { ...equipment, id: uuidv4() };
  equipmentList.push(newEquipment);
  return newEquipment;
}

export function updateEquipment(
  equipmentId: string,
  updates: Partial<Equipment>
): Equipment | null {
  const index = equipmentList.findIndex((e) => e.id === equipmentId);
  if (index === -1) return null;
  equipmentList[index] = { ...equipmentList[index], ...updates };
  return equipmentList[index];
}

export function deleteEquipment(equipmentId: string): boolean {
  const index = equipmentList.findIndex((e) => e.id === equipmentId);
  if (index === -1) return false;
  equipmentList.splice(index, 1);
  return true;
}

export function getRefundRules(): RefundRule[] {
  return [...refundRules];
}

export function addRefundRule(rule: Omit<RefundRule, 'id'>): RefundRule {
  const newRule = { ...rule, id: uuidv4() };
  refundRules.push(newRule);
  return newRule;
}

export function updateRefundRule(
  ruleId: string,
  updates: Partial<RefundRule>
): RefundRule | null {
  const index = refundRules.findIndex((r) => r.id === ruleId);
  if (index === -1) return null;
  refundRules[index] = { ...refundRules[index], ...updates };
  return refundRules[index];
}

export function deleteRefundRule(ruleId: string): boolean {
  const index = refundRules.findIndex((r) => r.id === ruleId);
  if (index === -1) return false;
  refundRules.splice(index, 1);
  return true;
}

export function getTemporaryServiceFeeRule(): TemporaryServiceFeeRule {
  return { ...temporaryServiceFeeRule };
}

export function updateTemporaryServiceFeeRule(
  updates: Partial<TemporaryServiceFeeRule>
): TemporaryServiceFeeRule {
  temporaryServiceFeeRule = { ...temporaryServiceFeeRule, ...updates };
  return { ...temporaryServiceFeeRule };
}
