import { useState, useEffect } from 'react';
import { venueApi, timeSlotApi } from '../../services/api';
import type { TimePricingRule, VenueZone, TimeSlot, DayType } from '../../types';

function PricingRulesTab() {
  const [rules, setRules] = useState<TimePricingRule[]>([]);
  const [zones, setZones] = useState<VenueZone[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterZone, setFilterZone] = useState<string>('');
  const [filterDayType, setFilterDayType] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [zonesData, slotsData] = await Promise.all([
        venueApi.getZones(),
        timeSlotApi.getTimeSlots(),
      ]);
      setZones(zonesData);
      setTimeSlots(slotsData);
      
      const rulesData: TimePricingRule[] = [];
      zonesData.forEach((zone) => {
        slotsData.forEach((slot) => {
          (['weekday', 'weekend'] as DayType[]).forEach((dayType) => {
            const basePrice = zone.basePrice;
            const dayMultiplier = dayType === 'weekend' ? 1.4 : 1;
            const periodMultiplier = slot.period === 'night' ? 1.3 : slot.period === 'evening' ? 1.15 : 1;
            const price = Math.round(basePrice * dayMultiplier * periodMultiplier);
            
            rulesData.push({
              id: `${zone.id}-${slot.id}-${dayType}`,
              name: `${dayType === 'weekday' ? '工作日' : '周末'}${slot.name}${zone.name}`,
              zoneId: zone.id,
              timeSlotId: slot.id,
              dayType,
              pricePerHour: price,
            });
          });
        });
      });
      setRules(rulesData);
    } catch (err) {
      console.error('加载定价规则失败', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredRules = rules.filter((rule) => {
    if (filterZone && rule.zoneId !== filterZone) return false;
    if (filterDayType && rule.dayType !== filterDayType) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="section-title">时段定价规则</h3>
      
      <div className="grid grid-3" style={{ marginBottom: '16px' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>场地筛选</label>
          <select value={filterZone} onChange={(e) => setFilterZone(e.target.value)}>
            <option value="">全部场地</option>
            {zones.map((zone) => (
              <option key={zone.id} value={zone.id}>{zone.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>日期类型</label>
          <select value={filterDayType} onChange={(e) => setFilterDayType(e.target.value)}>
            <option value="">全部</option>
            <option value="weekday">工作日</option>
            <option value="weekend">周末</option>
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <p className="text-muted" style={{ fontSize: '13px' }}>
            共 {filteredRules.length} 条定价规则
          </p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>规则名称</th>
            <th>场地</th>
            <th>时段</th>
            <th>日期类型</th>
            <th>单价</th>
          </tr>
        </thead>
        <tbody>
          {filteredRules.map((rule) => {
            const zone = zones.find((z) => z.id === rule.zoneId);
            const slot = timeSlots.find((s) => s.id === rule.timeSlotId);
            return (
              <tr key={rule.id}>
                <td className="text-primary">{rule.name}</td>
                <td>{zone?.name || rule.zoneId}</td>
                <td>{slot?.name || rule.timeSlotId}</td>
                <td>
                  <span className={`badge ${rule.dayType === 'weekend' ? 'badge-confirmed' : 'badge-pending'}`}>
                    {rule.dayType === 'weekday' ? '工作日' : '周末'}
                  </span>
                </td>
                <td className="text-success">¥{rule.pricePerHour}/小时</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="alert alert-info" style={{ marginTop: '16px', marginBottom: 0 }}>
        💡 提示：定价规则由场地基础价 × 日期系数（周末1.4倍）× 时段系数（夜间1.3倍、晚场1.15倍）计算得出
      </div>
    </div>
  );
}

export default PricingRulesTab;
