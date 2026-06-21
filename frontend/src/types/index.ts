export type DayType = 'weekday' | 'weekend' | 'holiday';

export type TimePeriod = 'morning' | 'afternoon' | 'evening' | 'night';

export type MemberLevel = 'regular' | 'silver' | 'gold' | 'platinum';

export type CouponType = 'fixed' | 'percentage';

export type CouponStatus = 'unused' | 'used' | 'expired' | 'recycled';

export type WaitlistStatus = 'waiting' | 'matched' | 'cancelled' | 'expired';

export type WalletTransactionType = 'recharge' | 'payment' | 'refund' | 'adjust';

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

export interface MemberLevelRule {
  id: string;
  level: MemberLevel;
  levelName: string;
  minTotalSpent: number;
  discountRate: number;
  description: string;
}

export interface Member {
  id: string;
  name: string;
  phone: string;
  level: MemberLevel;
  totalSpent: number;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

export interface WalletTransaction {
  id: string;
  memberId: string;
  type: WalletTransactionType;
  amount: number;
  balanceAfter: number;
  relatedBookingId?: string;
  relatedCouponId?: string;
  remark: string;
  createdAt: string;
}

export interface Coupon {
  id: string;
  name: string;
  type: CouponType;
  value: number;
  minConsumption: number;
  validFrom: string;
  validTo: string;
  applicableZoneIds: string[];
  applicableTimePeriods: TimePeriod[];
  status: CouponStatus;
  memberId?: string;
  usedBookingId?: string;
  usedAt?: string;
  createdAt: string;
}

export interface DynamicPremiumRule {
  id: string;
  name: string;
  occupancyThreshold: number;
  premiumRate: number;
  enabled: boolean;
  description: string;
}

export interface WaitlistEntry {
  id: string;
  zoneId: string;
  memberId?: string;
  userName: string;
  phone: string;
  date: string;
  startTime: string;
  endTime: string;
  peopleCount: number;
  equipment: BookingEquipment[];
  selectedCouponIds: string[];
  status: WaitlistStatus;
  queuePosition: number;
  matchedBookingId?: string;
  createdAt: string;
  matchedAt?: string;
  cancelledAt?: string;
}

export interface PriceBreakdown {
  basePrice: number;
  dynamicPremiumRate: number;
  dynamicPremiumAmount: number;
  premiumBasePrice: number;
  groupDiscountRate: number;
  groupDiscountAmount: number;
  afterGroupDiscount: number;
  memberLevel: MemberLevel | null;
  memberLevelName: string | null;
  memberDiscountRate: number;
  memberDiscountAmount: number;
  afterMemberDiscount: number;
  appliedCoupons: Array<{
    couponId: string;
    couponName: string;
    couponType: CouponType;
    couponValue: number;
    discountAmount: number;
  }>;
  couponTotalDiscount: number;
  afterCoupons: number;
  equipmentPrice: number;
  temporaryServiceFee: number;
  discountAmount: number;
  total: number;
  details: {
    timeSlotPrice: number;
    durationHours: number;
    dayType: DayType;
    timeSlotId: string;
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
  memberId?: string;
  userName: string;
  phone: string;
  date: string;
  startTime: string;
  endTime: string;
  peopleCount: number;
  equipment: BookingEquipment[];
  appliedCouponIds: string[];
  status: BookingStatus;
  createdAt: string;
  cancelledAt?: string;
  totalPrice: number;
  paidAmount: number;
  refundAmount: number;
  priceBreakdown: PriceBreakdown;
  fromWaitlistId?: string;
}

export interface GroupDiscountTier {
  id: string;
  name: string;
  minPeople: number;
  maxPeople: number;
  discountRate: number;
  description: string;
}

export interface TimePricingRule {
  id: string;
  name: string;
  zoneId: string;
  timeSlotId: string;
  dayType: DayType;
  pricePerHour: number;
}

export interface RefundRule {
  id: string;
  name: string;
  minHoursBefore: number;
  maxHoursBefore: number;
  refundRate: number;
  description: string;
}
