export type DayType = 'weekday' | 'weekend' | 'holiday';
export type TimePeriod = 'morning' | 'afternoon' | 'evening' | 'night';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface VenueZone {
  id: string;
  name: string;
  description: string;
  capacity: number;
  basePrice: number;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface TimeSlot {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  period: TimePeriod;
  dayTypes: DayType[];
}

export interface Equipment {
  id: string;
  name: string;
  category: 'armor' | 'weapon' | 'accessory';
  pricePerHour: number;
  stock: number;
  description: string;
}

export interface BookingEquipment {
  equipmentId: string;
  quantity: number;
}

export interface PriceBreakdown {
  basePrice: number;
  discountAmount: number;
  equipmentPrice: number;
  temporaryServiceFee: number;
  total: number;
  details: {
    timeSlotPrice: number;
    durationHours: number;
    groupDiscountRate: number;
    groupDiscountTier: string;
    equipmentItems: Array<{
      equipmentId: string;
      name: string;
      quantity: number;
      pricePerHour: number;
      total: number;
    }>;
    temporaryServiceFeeApplied: boolean;
    temporaryServiceFeeAmount: number;
  };
}

export interface Booking {
  id: string;
  zoneId: string;
  userId?: string;
  userName: string;
  phone: string;
  date: string;
  startTime: string;
  endTime: string;
  peopleCount: number;
  equipment: BookingEquipment[];
  status: BookingStatus;
  createdAt: string;
  totalPrice: number;
  priceBreakdown: PriceBreakdown;
}

export interface GroupDiscountTier {
  id: string;
  name: string;
  minPeople: number;
  maxPeople: number;
  discountRate: number;
  description: string;
}

export interface RefundRule {
  id: string;
  name: string;
  minHoursBefore: number;
  maxHoursBefore: number;
  refundRate: number;
  description: string;
}
