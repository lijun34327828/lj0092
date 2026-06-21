import { useState, useEffect } from 'react';
import { venueApi, timeSlotApi, pricingRulesApi } from '../../services/api';
import type { TimePricingRule, VenueZone, TimeSlot, DayType } from '../../types';

const DAY_TYPE_LABELS: Record<DayType, string> = {
  weekday: '工作日',
  weekend: '周末',
  holiday: '节假日',
};

const DAY_TYPE_BADGE: Record<DayType, string> = {
  weekday: 'badge-pending',
  weekend: 'badge-confirmed',
  holiday: 'badge-cancelled',
};

function formatPrice(value: number): string {
  return value.toFixed(2);
}

interface EditFormState {
  id?: string;
  name: string;
  zoneId: string;
  timeSlotId: string;
  dayType: DayType;
  pricePerHour: number;
}

function PricingRulesTab() {
  const [rules, setRules] = useState<TimePricingRule[]>([]);
  const [zones, setZones] = useState<VenueZone[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterZone, setFilterZone] = useState<string>('');
  const [filterDayType, setFilterDayType] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingRule, setEditingRule] = useState<EditFormState | null>(null);
  const [formState, setFormState] = useState<EditFormState>({
    name: '',
    zoneId: '',
    timeSlotId: '',
    dayType: 'weekday',
    pricePerHour: 0,
  });
  const [saving, setSaving] = useState<boolean>(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [zonesData, slotsData, rulesData] = await Promise.all([
        venueApi.getZones(),
        timeSlotApi.getTimeSlots(),
        pricingRulesApi.getPricingRules(),
      ]);
      setZones(zonesData);
      setTimeSlots(slotsData);
      setRules(rulesData);
    } catch (err) {
      console.error('加载定价规则失败', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormState({
      name: '',
      zoneId: zones[0]?.id || '',
      timeSlotId: timeSlots[0]?.id || '',
      dayType: 'weekday',
      pricePerHour: 0,
    });
  };

  const handleAddClick = () => {
    resetForm();
    setEditingRule(null);
    setShowAddModal(true);
  };

  const handleEditClick = (rule: TimePricingRule) => {
    setFormState({
      id: rule.id,
      name: rule.name,
      zoneId: rule.zoneId,
      timeSlotId: rule.timeSlotId,
      dayType: rule.dayType,
      pricePerHour: rule.pricePerHour,
    });
    setEditingRule({ ...rule });
    setShowAddModal(true);
  };

  const handleSave = async () => {
    if (!formState.zoneId || !formState.timeSlotId || !formState.name.trim()) {
      alert('请填写完整信息');
      return;
    }
    if (formState.pricePerHour < 0) {
      alert('单价不能为负数');
      return;
    }

    setSaving(true);
    try {
      if (editingRule && formState.id) {
        await pricingRulesApi.updatePricingRule(formState.id, {
          name: formState.name.trim(),
          zoneId: formState.zoneId,
          timeSlotId: formState.timeSlotId,
          dayType: formState.dayType,
          pricePerHour: Math.round(formState.pricePerHour * 100) / 100,
        });
      } else {
        await pricingRulesApi.addPricingRule({
          name: formState.name.trim(),
          zoneId: formState.zoneId,
          timeSlotId: formState.timeSlotId,
          dayType: formState.dayType,
          pricePerHour: Math.round(formState.pricePerHour * 100) / 100,
        });
      }
      setShowAddModal(false);
      setEditingRule(null);
      await loadData();
    } catch (err) {
      console.error('保存定价规则失败', err);
      alert('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await pricingRulesApi.deletePricingRule(deleteConfirmId);
      setDeleteConfirmId(null);
      await loadData();
    } catch (err) {
      console.error('删除定价规则失败', err);
      alert('删除失败，请重试');
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
      <p className="text-muted" style={{ marginBottom: '16px' }}>
        所有定价均由后端统一管理，下单计价实时读取此表数据
      </p>
      
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
            <option value="holiday">节假日</option>
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <p className="text-muted" style={{ fontSize: '13px' }}>
            共 {filteredRules.length} 条定价规则
          </p>
          <button className="btn btn-primary" onClick={handleAddClick}>
            新增规则
          </button>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>规则名称</th>
            <th>场地</th>
            <th>时段</th>
            <th>日期类型</th>
            <th>单价（元/小时）</th>
            <th>操作</th>
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
                  <span className={`badge ${DAY_TYPE_BADGE[rule.dayType]}`}>
                    {DAY_TYPE_LABELS[rule.dayType]}
                  </span>
                </td>
                <td className="text-success">¥{formatPrice(rule.pricePerHour)}</td>
                <td>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '4px 12px', marginRight: '8px' }}
                    onClick={() => handleEditClick(rule)}
                  >
                    编辑
                  </button>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '4px 12px', background: '#ff6b6b', borderColor: '#ff6b6b' }}
                    onClick={() => handleDeleteClick(rule.id)}
                  >
                    删除
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="alert alert-info" style={{ marginTop: '16px', marginBottom: 0 }}>
        💡 提示：价格精确到分（两位小数）。节假日规则缺失时将自动回退到周末价格，再缺失回退到工作日价格
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingRule ? '编辑定价规则' : '新增定价规则'}</h3>
            
            <div className="form-group">
              <label>规则名称</label>
              <input
                type="text"
                value={formState.name}
                onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                placeholder="例如：工作日早场A区"
              />
            </div>

            <div className="grid grid-2">
              <div className="form-group">
                <label>场地</label>
                <select
                  value={formState.zoneId}
                  onChange={(e) => setFormState({ ...formState, zoneId: e.target.value })}
                >
                  {zones.map((zone) => (
                    <option key={zone.id} value={zone.id}>{zone.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>时段</label>
                <select
                  value={formState.timeSlotId}
                  onChange={(e) => setFormState({ ...formState, timeSlotId: e.target.value })}
                >
                  {timeSlots.map((slot) => (
                    <option key={slot.id} value={slot.id}>
                      {slot.name} ({slot.startTime}-{slot.endTime})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-2">
              <div className="form-group">
                <label>日期类型</label>
                <select
                  value={formState.dayType}
                  onChange={(e) => setFormState({ ...formState, dayType: e.target.value as DayType })}
                >
                  <option value="weekday">工作日</option>
                  <option value="weekend">周末</option>
                  <option value="holiday">节假日</option>
                </select>
              </div>
              <div className="form-group">
                <label>单价（元/小时，精确到分）</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formState.pricePerHour}
                  onChange={(e) => setFormState({ ...formState, pricePerHour: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div className="modal-overlay" onClick={() => setDeleteConfirmId(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>确认删除</h3>
            <p>确定要删除这条定价规则吗？此操作不可恢复。</p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirmId(null)}>
                取消
              </button>
              <button
                className="btn btn-primary"
                style={{ background: '#ff6b6b', borderColor: '#ff6b6b' }}
                onClick={confirmDelete}
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PricingRulesTab;
