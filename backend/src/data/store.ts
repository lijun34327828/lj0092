import {
  VenueZone,
  TimeSlot,
  TimePricingRule,
  GroupDiscountTier,
  Equipment,
  RefundRule,
  TemporaryServiceFeeRule,
  Booking,
} from '../types';

export const venueZones: VenueZone[] = [
  {
    id: 'zone-a',
    name: 'A区 - 丛林战场',
    description: '模拟丛林环境，适合伏击战术',
    capacity: 20,
    basePrice: 120,
    position: { x: 50, y: 50, width: 180, height: 150 },
  },
  {
    id: 'zone-b',
    name: 'B区 - 城市巷战',
    description: '城市废墟风格，适合近距离作战',
    capacity: 16,
    basePrice: 150,
    position: { x: 280, y: 50, width: 180, height: 150 },
  },
  {
    id: 'zone-c',
    name: 'C区 - 沙漠营地',
    description: '开阔沙地，适合远距离精准射击',
    capacity: 24,
    basePrice: 100,
    position: { x: 510, y: 50, width: 180, height: 150 },
  },
  {
    id: 'zone-d',
    name: 'D区 - 室内CQB',
    description: '室内近距离作战室，专业CQB训练',
    capacity: 10,
    basePrice: 180,
    position: { x: 50, y: 250, width: 180, height: 150 },
  },
  {
    id: 'zone-e',
    name: 'E区 - 综合训练场',
    description: '多功能综合场地，可自由组合玩法',
    capacity: 30,
    basePrice: 200,
    position: { x: 280, y: 250, width: 180, height: 150 },
  },
  {
    id: 'zone-f',
    name: 'F区 - 新手体验区',
    description: '适合新手入门，配备专业指导',
    capacity: 8,
    basePrice: 80,
    position: { x: 510, y: 250, width: 180, height: 150 },
  },
];

export const timeSlots: TimeSlot[] = [
  {
    id: 'slot-morning',
    name: '早场',
    startTime: '09:00',
    endTime: '12:00',
    period: 'morning',
    dayTypes: ['weekday', 'weekend', 'holiday'],
  },
  {
    id: 'slot-afternoon',
    name: '午场',
    startTime: '13:00',
    endTime: '17:00',
    period: 'afternoon',
    dayTypes: ['weekday', 'weekend', 'holiday'],
  },
  {
    id: 'slot-evening',
    name: '晚场',
    startTime: '18:00',
    endTime: '21:00',
    period: 'evening',
    dayTypes: ['weekday', 'weekend', 'holiday'],
  },
  {
    id: 'slot-night',
    name: '夜场',
    startTime: '21:00',
    endTime: '24:00',
    period: 'night',
    dayTypes: ['weekday', 'weekend', 'holiday'],
  },
];

export const timePricingRules: TimePricingRule[] = [
  { id: 'tp-1', name: '工作日早场A区', zoneId: 'zone-a', timeSlotId: 'slot-morning', dayType: 'weekday', pricePerHour: 100 },
  { id: 'tp-2', name: '工作日午场A区', zoneId: 'zone-a', timeSlotId: 'slot-afternoon', dayType: 'weekday', pricePerHour: 120 },
  { id: 'tp-3', name: '工作日晚场A区', zoneId: 'zone-a', timeSlotId: 'slot-evening', dayType: 'weekday', pricePerHour: 140 },
  { id: 'tp-4', name: '工作日夜场A区', zoneId: 'zone-a', timeSlotId: 'slot-night', dayType: 'weekday', pricePerHour: 160 },
  
  { id: 'tp-5', name: '周末早场A区', zoneId: 'zone-a', timeSlotId: 'slot-morning', dayType: 'weekend', pricePerHour: 140 },
  { id: 'tp-6', name: '周末午场A区', zoneId: 'zone-a', timeSlotId: 'slot-afternoon', dayType: 'weekend', pricePerHour: 160 },
  { id: 'tp-7', name: '周末晚场A区', zoneId: 'zone-a', timeSlotId: 'slot-evening', dayType: 'weekend', pricePerHour: 180 },
  { id: 'tp-8', name: '周末夜场A区', zoneId: 'zone-a', timeSlotId: 'slot-night', dayType: 'weekend', pricePerHour: 200 },
  
  { id: 'tp-9', name: '工作日早场B区', zoneId: 'zone-b', timeSlotId: 'slot-morning', dayType: 'weekday', pricePerHour: 120 },
  { id: 'tp-10', name: '工作日午场B区', zoneId: 'zone-b', timeSlotId: 'slot-afternoon', dayType: 'weekday', pricePerHour: 140 },
  { id: 'tp-11', name: '工作日晚场B区', zoneId: 'zone-b', timeSlotId: 'slot-evening', dayType: 'weekday', pricePerHour: 160 },
  { id: 'tp-12', name: '工作日夜场B区', zoneId: 'zone-b', timeSlotId: 'slot-night', dayType: 'weekday', pricePerHour: 180 },
  
  { id: 'tp-13', name: '周末早场B区', zoneId: 'zone-b', timeSlotId: 'slot-morning', dayType: 'weekend', pricePerHour: 160 },
  { id: 'tp-14', name: '周末午场B区', zoneId: 'zone-b', timeSlotId: 'slot-afternoon', dayType: 'weekend', pricePerHour: 180 },
  { id: 'tp-15', name: '周末晚场B区', zoneId: 'zone-b', timeSlotId: 'slot-evening', dayType: 'weekend', pricePerHour: 200 },
  { id: 'tp-16', name: '周末夜场B区', zoneId: 'zone-b', timeSlotId: 'slot-night', dayType: 'weekend', pricePerHour: 220 },
  
  { id: 'tp-17', name: '工作日早场C区', zoneId: 'zone-c', timeSlotId: 'slot-morning', dayType: 'weekday', pricePerHour: 80 },
  { id: 'tp-18', name: '工作日午场C区', zoneId: 'zone-c', timeSlotId: 'slot-afternoon', dayType: 'weekday', pricePerHour: 100 },
  { id: 'tp-19', name: '工作日晚场C区', zoneId: 'zone-c', timeSlotId: 'slot-evening', dayType: 'weekday', pricePerHour: 120 },
  { id: 'tp-20', name: '工作日夜场C区', zoneId: 'zone-c', timeSlotId: 'slot-night', dayType: 'weekday', pricePerHour: 140 },
  
  { id: 'tp-21', name: '周末早场C区', zoneId: 'zone-c', timeSlotId: 'slot-morning', dayType: 'weekend', pricePerHour: 120 },
  { id: 'tp-22', name: '周末午场C区', zoneId: 'zone-c', timeSlotId: 'slot-afternoon', dayType: 'weekend', pricePerHour: 140 },
  { id: 'tp-23', name: '周末晚场C区', zoneId: 'zone-c', timeSlotId: 'slot-evening', dayType: 'weekend', pricePerHour: 160 },
  { id: 'tp-24', name: '周末夜场C区', zoneId: 'zone-c', timeSlotId: 'slot-night', dayType: 'weekend', pricePerHour: 180 },
  
  { id: 'tp-25', name: '工作日早场D区', zoneId: 'zone-d', timeSlotId: 'slot-morning', dayType: 'weekday', pricePerHour: 150 },
  { id: 'tp-26', name: '工作日午场D区', zoneId: 'zone-d', timeSlotId: 'slot-afternoon', dayType: 'weekday', pricePerHour: 170 },
  { id: 'tp-27', name: '工作日晚场D区', zoneId: 'zone-d', timeSlotId: 'slot-evening', dayType: 'weekday', pricePerHour: 190 },
  { id: 'tp-28', name: '工作日夜场D区', zoneId: 'zone-d', timeSlotId: 'slot-night', dayType: 'weekday', pricePerHour: 210 },
  
  { id: 'tp-29', name: '周末早场D区', zoneId: 'zone-d', timeSlotId: 'slot-morning', dayType: 'weekend', pricePerHour: 200 },
  { id: 'tp-30', name: '周末午场D区', zoneId: 'zone-d', timeSlotId: 'slot-afternoon', dayType: 'weekend', pricePerHour: 220 },
  { id: 'tp-31', name: '周末晚场D区', zoneId: 'zone-d', timeSlotId: 'slot-evening', dayType: 'weekend', pricePerHour: 240 },
  { id: 'tp-32', name: '周末夜场D区', zoneId: 'zone-d', timeSlotId: 'slot-night', dayType: 'weekend', pricePerHour: 260 },
  
  { id: 'tp-33', name: '工作日早场E区', zoneId: 'zone-e', timeSlotId: 'slot-morning', dayType: 'weekday', pricePerHour: 170 },
  { id: 'tp-34', name: '工作日午场E区', zoneId: 'zone-e', timeSlotId: 'slot-afternoon', dayType: 'weekday', pricePerHour: 190 },
  { id: 'tp-35', name: '工作日晚场E区', zoneId: 'zone-e', timeSlotId: 'slot-evening', dayType: 'weekday', pricePerHour: 210 },
  { id: 'tp-36', name: '工作日夜场E区', zoneId: 'zone-e', timeSlotId: 'slot-night', dayType: 'weekday', pricePerHour: 230 },
  
  { id: 'tp-37', name: '周末早场E区', zoneId: 'zone-e', timeSlotId: 'slot-morning', dayType: 'weekend', pricePerHour: 220 },
  { id: 'tp-38', name: '周末午场E区', zoneId: 'zone-e', timeSlotId: 'slot-afternoon', dayType: 'weekend', pricePerHour: 240 },
  { id: 'tp-39', name: '周末晚场E区', zoneId: 'zone-e', timeSlotId: 'slot-evening', dayType: 'weekend', pricePerHour: 260 },
  { id: 'tp-40', name: '周末夜场E区', zoneId: 'zone-e', timeSlotId: 'slot-night', dayType: 'weekend', pricePerHour: 280 },
  
  { id: 'tp-41', name: '工作日早场F区', zoneId: 'zone-f', timeSlotId: 'slot-morning', dayType: 'weekday', pricePerHour: 60 },
  { id: 'tp-42', name: '工作日午场F区', zoneId: 'zone-f', timeSlotId: 'slot-afternoon', dayType: 'weekday', pricePerHour: 70 },
  { id: 'tp-43', name: '工作日晚场F区', zoneId: 'zone-f', timeSlotId: 'slot-evening', dayType: 'weekday', pricePerHour: 80 },
  { id: 'tp-44', name: '工作日夜场F区', zoneId: 'zone-f', timeSlotId: 'slot-night', dayType: 'weekday', pricePerHour: 90 },
  
  { id: 'tp-45', name: '周末早场F区', zoneId: 'zone-f', timeSlotId: 'slot-morning', dayType: 'weekend', pricePerHour: 90 },
  { id: 'tp-46', name: '周末午场F区', zoneId: 'zone-f', timeSlotId: 'slot-afternoon', dayType: 'weekend', pricePerHour: 100 },
  { id: 'tp-47', name: '周末晚场F区', zoneId: 'zone-f', timeSlotId: 'slot-evening', dayType: 'weekend', pricePerHour: 110 },
  { id: 'tp-48', name: '周末夜场F区', zoneId: 'zone-f', timeSlotId: 'slot-night', dayType: 'weekend', pricePerHour: 120 },
  
  { id: 'tp-49', name: '节假日早场A区', zoneId: 'zone-a', timeSlotId: 'slot-morning', dayType: 'holiday', pricePerHour: 160 },
  { id: 'tp-50', name: '节假日午场A区', zoneId: 'zone-a', timeSlotId: 'slot-afternoon', dayType: 'holiday', pricePerHour: 180 },
  { id: 'tp-51', name: '节假日晚场A区', zoneId: 'zone-a', timeSlotId: 'slot-evening', dayType: 'holiday', pricePerHour: 200 },
  { id: 'tp-52', name: '节假日夜场A区', zoneId: 'zone-a', timeSlotId: 'slot-night', dayType: 'holiday', pricePerHour: 220 },
  
  { id: 'tp-53', name: '节假日早场B区', zoneId: 'zone-b', timeSlotId: 'slot-morning', dayType: 'holiday', pricePerHour: 180 },
  { id: 'tp-54', name: '节假日午场B区', zoneId: 'zone-b', timeSlotId: 'slot-afternoon', dayType: 'holiday', pricePerHour: 200 },
  { id: 'tp-55', name: '节假日晚场B区', zoneId: 'zone-b', timeSlotId: 'slot-evening', dayType: 'holiday', pricePerHour: 220 },
  { id: 'tp-56', name: '节假日夜场B区', zoneId: 'zone-b', timeSlotId: 'slot-night', dayType: 'holiday', pricePerHour: 240 },
  
  { id: 'tp-57', name: '节假日早场C区', zoneId: 'zone-c', timeSlotId: 'slot-morning', dayType: 'holiday', pricePerHour: 140 },
  { id: 'tp-58', name: '节假日午场C区', zoneId: 'zone-c', timeSlotId: 'slot-afternoon', dayType: 'holiday', pricePerHour: 160 },
  { id: 'tp-59', name: '节假日晚场C区', zoneId: 'zone-c', timeSlotId: 'slot-evening', dayType: 'holiday', pricePerHour: 180 },
  { id: 'tp-60', name: '节假日夜场C区', zoneId: 'zone-c', timeSlotId: 'slot-night', dayType: 'holiday', pricePerHour: 200 },
  
  { id: 'tp-61', name: '节假日早场D区', zoneId: 'zone-d', timeSlotId: 'slot-morning', dayType: 'holiday', pricePerHour: 220 },
  { id: 'tp-62', name: '节假日午场D区', zoneId: 'zone-d', timeSlotId: 'slot-afternoon', dayType: 'holiday', pricePerHour: 240 },
  { id: 'tp-63', name: '节假日晚场D区', zoneId: 'zone-d', timeSlotId: 'slot-evening', dayType: 'holiday', pricePerHour: 260 },
  { id: 'tp-64', name: '节假日夜场D区', zoneId: 'zone-d', timeSlotId: 'slot-night', dayType: 'holiday', pricePerHour: 280 },
  
  { id: 'tp-65', name: '节假日早场E区', zoneId: 'zone-e', timeSlotId: 'slot-morning', dayType: 'holiday', pricePerHour: 240 },
  { id: 'tp-66', name: '节假日午场E区', zoneId: 'zone-e', timeSlotId: 'slot-afternoon', dayType: 'holiday', pricePerHour: 260 },
  { id: 'tp-67', name: '节假日晚场E区', zoneId: 'zone-e', timeSlotId: 'slot-evening', dayType: 'holiday', pricePerHour: 280 },
  { id: 'tp-68', name: '节假日夜场E区', zoneId: 'zone-e', timeSlotId: 'slot-night', dayType: 'holiday', pricePerHour: 300 },
  
  { id: 'tp-69', name: '节假日早场F区', zoneId: 'zone-f', timeSlotId: 'slot-morning', dayType: 'holiday', pricePerHour: 110 },
  { id: 'tp-70', name: '节假日午场F区', zoneId: 'zone-f', timeSlotId: 'slot-afternoon', dayType: 'holiday', pricePerHour: 120 },
  { id: 'tp-71', name: '节假日晚场F区', zoneId: 'zone-f', timeSlotId: 'slot-evening', dayType: 'holiday', pricePerHour: 130 },
  { id: 'tp-72', name: '节假日夜场F区', zoneId: 'zone-f', timeSlotId: 'slot-night', dayType: 'holiday', pricePerHour: 140 },
];

export const groupDiscountTiers: GroupDiscountTier[] = [
  { id: 'gd-1', name: '双人组队', minPeople: 2, maxPeople: 3, discountRate: 0.95, description: '2-3人享95折' },
  { id: 'gd-2', name: '小队作战', minPeople: 4, maxPeople: 6, discountRate: 0.9, description: '4-6人享9折' },
  { id: 'gd-3', name: '中队突击', minPeople: 7, maxPeople: 10, discountRate: 0.85, description: '7-10人享85折' },
  { id: 'gd-4', name: '大队冲锋', minPeople: 11, maxPeople: 20, discountRate: 0.8, description: '11-20人享8折' },
  { id: 'gd-5', name: '团战包场', minPeople: 21, maxPeople: 999, discountRate: 0.75, description: '21人以上享75折' },
];

export const equipmentList: Equipment[] = [
  { id: 'eq-1', name: '标准护具套装', category: 'armor', pricePerHour: 20, stock: 50, description: '包含头盔、护膝、护肘' },
  { id: 'eq-2', name: '专业护具套装', category: 'armor', pricePerHour: 35, stock: 30, description: '全防护装备，含面罩、战术背心' },
  { id: 'eq-3', name: '初级仿真枪', category: 'weapon', pricePerHour: 30, stock: 40, description: '入门级电动仿真枪' },
  { id: 'eq-4', name: '中级仿真枪', category: 'weapon', pricePerHour: 50, stock: 25, description: '中级电动仿真枪，精准度更高' },
  { id: 'eq-5', name: '专业级仿真枪', category: 'weapon', pricePerHour: 80, stock: 15, description: '专业比赛级仿真枪' },
  { id: 'eq-6', name: '战术手套', category: 'accessory', pricePerHour: 10, stock: 60, description: '防滑战术手套' },
  { id: 'eq-7', name: '护目镜', category: 'accessory', pricePerHour: 15, stock: 45, description: '防冲击护目镜' },
  { id: 'eq-8', name: '对讲机', category: 'accessory', pricePerHour: 25, stock: 20, description: '团队通讯对讲机' },
];

export const refundRules: RefundRule[] = [
  { id: 'refund-1', name: '全额退款', minHoursBefore: 24, maxHoursBefore: 9999, refundRate: 1.0, description: '提前24小时以上取消，全额退款' },
  { id: 'refund-2', name: '八成退款', minHoursBefore: 12, maxHoursBefore: 24, refundRate: 0.8, description: '提前12-24小时取消，退80%' },
  { id: 'refund-3', name: '五成退款', minHoursBefore: 6, maxHoursBefore: 12, refundRate: 0.5, description: '提前6-12小时取消，退50%' },
  { id: 'refund-4', name: '两成退款', minHoursBefore: 2, maxHoursBefore: 6, refundRate: 0.2, description: '提前2-6小时取消，退20%' },
  { id: 'refund-5', name: '不予退款', minHoursBefore: 0, maxHoursBefore: 2, refundRate: 0, description: '不足2小时取消，不予退款' },
];

export const temporaryServiceFeeRule: TemporaryServiceFeeRule = {
  id: 'tsf-1',
  name: '临时预留服务费',
  thresholdHours: 2,
  feeAmount: 30,
  feeType: 'fixed',
  description: '预约距离开场不足2小时，收取临时预留服务费30元',
};

export const bookings: Booking[] = [];
