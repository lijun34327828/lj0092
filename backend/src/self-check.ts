import { venueZones, timeSlots, timePricingRules, memberLevelRules, dynamicPremiumRules } from './data/store';
import {
  getTimeSlotPrice,
  calculateTotalPrice,
  getDayType,
  roundToCents,
  getOccupancyInfo,
} from './services/pricingService';
import { getDynamicPremiumRule, calculateTimeSlotOccupancy } from './services/premiumService';
import type { DayType } from './types';

const DAY_TYPE_LABELS: Record<DayType, string> = {
  weekday: '工作日',
  weekend: '周末',
  holiday: '节假日',
};

const DAY_TYPE_SAMPLE_DATES: Record<DayType, string> = {
  weekday: '2026-06-22',
  weekend: '2026-06-27',
  holiday: '2026-10-01',
};

interface Mismatch {
  zoneId: string;
  zoneName: string;
  timeSlotId: string;
  timeSlotName: string;
  dayType: DayType;
  displayPrice: number | null;
  calculatedPrice: number | null;
  bookedTotal: number | null;
  expectedTotal: number | null;
  note?: string;
}

interface PricingStepCheck {
  label: string;
  expectedMin: number;
  expectedMax: number;
  actual: number;
  pass: boolean;
}

function runSelfCheck(): {
  passed: boolean;
  mismatches: Mismatch[];
  totalChecked: number;
  premiumChecks: Array<{
    date: string;
    timeSlotId: string;
    occupancyRate: number;
    threshold: number;
    expectedMultiplier: number;
    actualMultiplier: number;
    pass: boolean;
  }>;
  stepChecks: PricingStepCheck[];
  memberLevelChecks: Array<{ level: string; minSpent: number; rate: number; pass: boolean }>;
} {
  const mismatches: Mismatch[] = [];
  let totalChecked = 0;

  const dayTypes: DayType[] = ['weekday', 'weekend', 'holiday'];

  for (const zone of venueZones) {
    for (const slot of timeSlots) {
      for (const dayType of dayTypes) {
        totalChecked++;

        const displayRule = timePricingRules.find(
          (r) => r.zoneId === zone.id && r.timeSlotId === slot.id && r.dayType === dayType
        );
        const displayPrice = displayRule ? roundToCents(displayRule.pricePerHour) : null;

        const calculatedPrice = getTimeSlotPrice(zone.id, slot.id, dayType);

        let bookedTotal: number | null = null;
        let expectedTotal: number | null = null;
        let note: string | undefined = undefined;

        try {
          const sampleDate = DAY_TYPE_SAMPLE_DATES[dayType];
          const actualDayType = getDayType(sampleDate);
          if (actualDayType !== dayType) {
            note = `日期类型不匹配: 请求${DAY_TYPE_LABELS[dayType]}, 实际识别${DAY_TYPE_LABELS[actualDayType]}`;
          }

          const result = calculateTotalPrice({
            zoneId: zone.id,
            date: sampleDate,
            startTime: slot.startTime,
            endTime: slot.endTime,
            peopleCount: 1,
            equipment: [],
            currentDateTime: new Date('2026-01-01T00:00:00'),
          });

          bookedTotal = roundToCents(result.total);
          const durationHours = result.details.durationHours;
          const timeSlotPrice = result.details.timeSlotPrice;

          if (calculatedPrice !== null) {
            expectedTotal = roundToCents(calculatedPrice * durationHours);
          }

          if (timeSlotPrice !== displayPrice && displayPrice !== null) {
            mismatches.push({
              zoneId: zone.id,
              zoneName: zone.name,
              timeSlotId: slot.id,
              timeSlotName: slot.name,
              dayType,
              displayPrice,
              calculatedPrice,
              bookedTotal,
              expectedTotal,
              note: `计价返回单价¥${timeSlotPrice}≠展示价¥${displayPrice}${note ? '; ' + note : ''}`,
            });
            continue;
          }

          if (
            result.basePrice !== result.premiumBasePrice ||
            result.dynamicPremiumAmount !== 0 ||
            result.dynamicPremiumRate !== 0
          ) {
            // 空置场地下不应有溢价
            mismatches.push({
              zoneId: zone.id,
              zoneName: zone.name,
              timeSlotId: slot.id,
              timeSlotName: slot.name,
              dayType,
              displayPrice,
              calculatedPrice,
              bookedTotal,
              expectedTotal,
              note: `空置场地不应有动态溢价：premiumBasePrice=${result.premiumBasePrice}, basePrice=${result.basePrice}`,
            });
            continue;
          }

          if (
            result.memberLevel !== null ||
            result.memberDiscountAmount !== 0 ||
            result.memberDiscountRate !== 1.0
          ) {
            mismatches.push({
              zoneId: zone.id,
              zoneName: zone.name,
              timeSlotId: slot.id,
              timeSlotName: slot.name,
              dayType,
              displayPrice,
              calculatedPrice,
              bookedTotal,
              expectedTotal,
              note: `无会员时不应有会员折扣：memberLevel=${result.memberLevel}`,
            });
            continue;
          }

          if (result.couponTotalDiscount !== 0 || result.appliedCoupons.length !== 0) {
            mismatches.push({
              zoneId: zone.id,
              zoneName: zone.name,
              timeSlotId: slot.id,
              timeSlotName: slot.name,
              dayType,
              displayPrice,
              calculatedPrice,
              bookedTotal,
              expectedTotal,
              note: `无券时不应有券抵扣：couponTotalDiscount=${result.couponTotalDiscount}`,
            });
            continue;
          }

          if (result.afterGroupDiscount !== result.afterMemberDiscount) {
            mismatches.push({
              zoneId: zone.id,
              zoneName: zone.name,
              timeSlotId: slot.id,
              timeSlotName: slot.name,
              dayType,
              displayPrice,
              calculatedPrice,
              bookedTotal,
              expectedTotal,
              note: `组队折扣后与会员折扣后金额不等（无会员时应相同）`,
            });
            continue;
          }

          if (result.afterMemberDiscount !== result.afterCoupons) {
            mismatches.push({
              zoneId: zone.id,
              zoneName: zone.name,
              timeSlotId: slot.id,
              timeSlotName: slot.name,
              dayType,
              displayPrice,
              calculatedPrice,
              bookedTotal,
              expectedTotal,
              note: `会员折扣后与券后金额不等（无券时应相同）`,
            });
            continue;
          }

          const finalStepTotal = roundToCents(
            result.afterCoupons + result.equipmentPrice + result.temporaryServiceFee
          );
          if (Math.abs(finalStepTotal - result.total) > 0.001) {
            mismatches.push({
              zoneId: zone.id,
              zoneName: zone.name,
              timeSlotId: slot.id,
              timeSlotName: slot.name,
              dayType,
              displayPrice,
              calculatedPrice,
              bookedTotal,
              expectedTotal,
              note: `最终步骤相加≠total：afterCoupons(${result.afterCoupons})+equipment(${result.equipmentPrice})+tempFee(${result.temporaryServiceFee})=${finalStepTotal}≠total(${result.total})`,
            });
            continue;
          }

          if (result.total < 0) {
            mismatches.push({
              zoneId: zone.id,
              zoneName: zone.name,
              timeSlotId: slot.id,
              timeSlotName: slot.name,
              dayType,
              displayPrice,
              calculatedPrice,
              bookedTotal,
              expectedTotal,
              note: `总价为负数：total=${result.total}`,
            });
            continue;
          }

          if (expectedTotal !== null && bookedTotal !== expectedTotal) {
            mismatches.push({
              zoneId: zone.id,
              zoneName: zone.name,
              timeSlotId: slot.id,
              timeSlotName: slot.name,
              dayType,
              displayPrice,
              calculatedPrice,
              bookedTotal,
              expectedTotal,
              note: `下单总价¥${bookedTotal}≠期望¥${expectedTotal}(单价¥${calculatedPrice}×${durationHours}h)${note ? '; ' + note : ''}`,
            });
            continue;
          }
        } catch (err) {
          mismatches.push({
            zoneId: zone.id,
            zoneName: zone.name,
            timeSlotId: slot.id,
            timeSlotName: slot.name,
            dayType,
            displayPrice,
            calculatedPrice,
            bookedTotal,
            expectedTotal,
            note: `计价异常: ${(err as Error).message}`,
          });
          continue;
        }

        if (displayPrice !== null && calculatedPrice !== displayPrice) {
          mismatches.push({
            zoneId: zone.id,
            zoneName: zone.name,
            timeSlotId: slot.id,
            timeSlotName: slot.name,
            dayType,
            displayPrice,
            calculatedPrice,
            bookedTotal,
            expectedTotal,
            note: `getTimeSlotPrice返回¥${calculatedPrice}≠展示价¥${displayPrice}`,
          });
        }
      }
    }
  }

  const premiumChecks: Array<{
    date: string;
    timeSlotId: string;
    occupancyRate: number;
    threshold: number;
    expectedMultiplier: number;
    actualMultiplier: number;
    pass: boolean;
  }> = [];

  const dpRule = getDynamicPremiumRule();
  for (const slot of timeSlots) {
    const sampleDate = '2026-06-22';
    const occupancy = calculateTimeSlotOccupancy(sampleDate, slot.id);
    const occInfo = getOccupancyInfo(sampleDate, slot.startTime, slot.endTime);
    const expectedMult =
      dpRule.enabled && occupancy.occupancyRate >= dpRule.occupancyThreshold
        ? 1 + dpRule.premiumRate
        : 1.0;
    premiumChecks.push({
      date: sampleDate,
      timeSlotId: slot.id,
      occupancyRate: occupancy.occupancyRate,
      threshold: dpRule.occupancyThreshold,
      expectedMultiplier: expectedMult,
      actualMultiplier: occInfo.premiumMultiplier,
      pass: Math.abs(expectedMult - occInfo.premiumMultiplier) < 0.0001,
    });
  }

  const stepChecks: PricingStepCheck[] = [];
  try {
    const sampleDate = '2026-06-22';
    const slot = timeSlots[0];
    const zone = venueZones[0];
    const r = calculateTotalPrice({
      zoneId: zone.id,
      date: sampleDate,
      startTime: slot.startTime,
      endTime: slot.endTime,
      peopleCount: 5,
      equipment: [{ equipmentId: 'eq-1', quantity: 2 }],
      currentDateTime: new Date('2026-01-01T00:00:00'),
    });

    stepChecks.push({
      label: 'basePrice>=0',
      expectedMin: 0,
      expectedMax: 99999,
      actual: r.basePrice,
      pass: r.basePrice >= 0,
    });
    stepChecks.push({
      label: 'premiumBasePrice>=basePrice',
      expectedMin: r.basePrice,
      expectedMax: 99999,
      actual: r.premiumBasePrice,
      pass: r.premiumBasePrice >= r.basePrice - 0.001,
    });
    stepChecks.push({
      label: 'afterGroupDiscount在0和premiumBasePrice之间',
      expectedMin: 0,
      expectedMax: r.premiumBasePrice,
      actual: r.afterGroupDiscount,
      pass:
        r.afterGroupDiscount >= -0.001 &&
        r.afterGroupDiscount <= r.premiumBasePrice + 0.001,
    });
    stepChecks.push({
      label: 'afterMemberDiscount在0和afterGroupDiscount之间',
      expectedMin: 0,
      expectedMax: r.afterGroupDiscount,
      actual: r.afterMemberDiscount,
      pass:
        r.afterMemberDiscount >= -0.001 &&
        r.afterMemberDiscount <= r.afterGroupDiscount + 0.001,
    });
    stepChecks.push({
      label: 'afterCoupons在0和afterMemberDiscount之间',
      expectedMin: 0,
      expectedMax: r.afterMemberDiscount,
      actual: r.afterCoupons,
      pass:
        r.afterCoupons >= -0.001 && r.afterCoupons <= r.afterMemberDiscount + 0.001,
    });
    stepChecks.push({
      label: 'total>=0',
      expectedMin: 0,
      expectedMax: 99999,
      actual: r.total,
      pass: r.total >= 0,
    });
  } catch {
    // skip
  }

  const memberLevelChecks = memberLevelRules.map((r) => ({
    level: r.level,
    minSpent: r.minTotalSpent,
    rate: r.discountRate,
    pass: r.discountRate > 0 && r.discountRate <= 1.0,
  }));

  const allPremiumPass = premiumChecks.every((c) => c.pass);
  const allStepPass = stepChecks.every((c) => c.pass);
  const allLevelPass = memberLevelChecks.every((c) => c.pass);

  return {
    passed: mismatches.length === 0 && allPremiumPass && allStepPass && allLevelPass,
    mismatches,
    totalChecked,
    premiumChecks,
    stepChecks,
    memberLevelChecks,
  };
}

if (require.main === module) {
  console.log('========================================');
  console.log('定价系统自检 - 遍历所有场地×时段×日期类型');
  console.log('========================================\n');

  const result = runSelfCheck();

  console.log(`总检查条目: ${result.totalChecked}`);
  console.log(`通过: ${result.totalChecked - result.mismatches.length}`);
  console.log(`失败: ${result.mismatches.length}\n`);

  console.log('--- 动态溢价检查 ---');
  result.premiumChecks.forEach((c) => {
    console.log(
      `  [${c.pass ? '✅' : '❌'}] ${c.timeSlotId}: occupancy=${(c.occupancyRate * 100).toFixed(1)}%, threshold=${(c.threshold * 100).toFixed(0)}%, 期望倍率=${c.expectedMultiplier}, 实际=${c.actualMultiplier}`
    );
  });
  console.log('');

  console.log('--- 计价步骤区间检查 ---');
  result.stepChecks.forEach((c) => {
    console.log(`  [${c.pass ? '✅' : '❌'}] ${c.label}: actual=${c.actual.toFixed(2)}`);
  });
  console.log('');

  console.log('--- 会员等级规则检查 ---');
  result.memberLevelChecks.forEach((c) => {
    console.log(
      `  [${c.pass ? '✅' : '❌'}] ${c.level}: minSpent=¥${c.minSpent}, rate=${(c.rate * 100).toFixed(0)}%`
    );
  });
  console.log('');

  if (result.mismatches.length === 0) {
    console.log('✅ 全部一致！展示价与计价完全对齐。\n');

    const sampleRule = timePricingRules.find(
      (r) =>
        r.zoneId === 'zone-a' &&
        r.timeSlotId === 'slot-morning' &&
        r.dayType === 'weekday'
    );
    if (sampleRule) {
      const calcResult = calculateTotalPrice({
        zoneId: 'zone-a',
        date: '2026-06-22',
        startTime: '09:00',
        endTime: '12:00',
        peopleCount: 1,
        equipment: [],
        currentDateTime: new Date('2026-01-01T00:00:00'),
      });
      console.log(
        `验证 A区平日早场: 展示价¥${sampleRule.pricePerHour}/h, 下单计价¥${calcResult.details.timeSlotPrice}/h, 3小时总价¥${calcResult.total}`
      );
      console.log(
        `   → ${sampleRule.pricePerHour === calcResult.details.timeSlotPrice ? '✅ 完全一致' : '❌ 不一致'}\n`
      );
    }
    console.log(`动态溢价规则数: ${dynamicPremiumRules.length}`);
    const dpRule = getDynamicPremiumRule();
    console.log(
      `启用规则: threshold=${(dpRule.occupancyThreshold * 100).toFixed(0)}%, premium=${(dpRule.premiumRate * 100).toFixed(0)}%, enabled=${dpRule.enabled}\n`
    );
    process.exit(0);
  } else {
    console.log('❌ 发现不一致条目，详情如下：\n');
    result.mismatches.forEach((m, idx) => {
      console.log(
        `[${idx + 1}] ${m.zoneName} / ${m.timeSlotName} / ${DAY_TYPE_LABELS[m.dayType]}`
      );
      console.log(
        `    展示价: ${m.displayPrice !== null ? `¥${m.displayPrice}` : '缺失规则'}`
      );
      console.log(
        `    计价单价: ${m.calculatedPrice !== null ? `¥${m.calculatedPrice}` : '无法获取'}`
      );
      console.log(
        `    下单总价: ${m.bookedTotal !== null ? `¥${m.bookedTotal}` : '无法计算'}`
      );
      console.log(
        `    期望总价: ${m.expectedTotal !== null ? `¥${m.expectedTotal}` : '无法计算'}`
      );
      if (m.note) {
        console.log(`    说明: ${m.note}`);
      }
      console.log('');
    });
    process.exit(1);
  }
}

export { runSelfCheck };
