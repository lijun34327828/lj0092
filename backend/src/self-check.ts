import { venueZones, timeSlots, timePricingRules } from './data/store';
import { getTimeSlotPrice, calculateTotalPrice, getDayType, roundToCents } from './services/pricingService';
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

function runSelfCheck(): { passed: boolean; mismatches: Mismatch[]; totalChecked: number } {
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

  return {
    passed: mismatches.length === 0,
    mismatches,
    totalChecked,
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

  if (result.mismatches.length === 0) {
    console.log('✅ 全部一致！展示价与计价完全对齐。\n');

    const sampleRule = timePricingRules.find(
      (r) => r.zoneId === 'zone-a' && r.timeSlotId === 'slot-morning' && r.dayType === 'weekday'
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
      console.log(`验证 A区平日早场: 展示价¥${sampleRule.pricePerHour}/h, 下单计价¥${calcResult.details.timeSlotPrice}/h, 3小时总价¥${calcResult.total}`);
      console.log(`   → ${sampleRule.pricePerHour === calcResult.details.timeSlotPrice ? '✅ 完全一致' : '❌ 不一致'}\n`);
    }
    process.exit(0);
  } else {
    console.log('❌ 发现不一致条目，详情如下：\n');
    result.mismatches.forEach((m, idx) => {
      console.log(`[${idx + 1}] ${m.zoneName} / ${m.timeSlotName} / ${DAY_TYPE_LABELS[m.dayType]}`);
      console.log(`    展示价: ${m.displayPrice !== null ? `¥${m.displayPrice}` : '缺失规则'}`);
      console.log(`    计价单价: ${m.calculatedPrice !== null ? `¥${m.calculatedPrice}` : '无法获取'}`);
      console.log(`    下单总价: ${m.bookedTotal !== null ? `¥${m.bookedTotal}` : '无法计算'}`);
      console.log(`    期望总价: ${m.expectedTotal !== null ? `¥${m.expectedTotal}` : '无法计算'}`);
      if (m.note) {
        console.log(`    说明: ${m.note}`);
      }
      console.log('');
    });
    process.exit(1);
  }
}

export { runSelfCheck };
