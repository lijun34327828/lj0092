import { useState, useEffect } from 'react';
import type { Coupon } from '../types';
import { couponApi } from '../services/api';

interface CouponSelectorProps {
  coupons: Coupon[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  zoneId?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  currentAmountAfterMemberDiscount?: number;
  memberId?: string;
}

function CouponSelector({
  coupons,
  selectedIds,
  onChange,
  disabled,
  zoneId,
  date,
  startTime,
  endTime,
  currentAmountAfterMemberDiscount,
  memberId,
}: CouponSelectorProps) {
  const [applicableMap, setApplicableMap] = useState<Record<string, boolean>>({});
  const [checking, setChecking] = useState(false);

  const checkApplicability = async () => {
    if (!zoneId || !date || !startTime || !endTime || currentAmountAfterMemberDiscount === undefined) {
      return;
    }
    setChecking(true);
    const newMap: Record<string, boolean> = {};
    for (const coupon of coupons) {
      if (coupon.status !== 'unused') {
        newMap[coupon.id] = false;
        continue;
      }
      try {
        const result = await couponApi.checkCouponApplicable(coupon.id, {
          zoneId,
          date,
          startTime,
          endTime,
          currentAmountAfterMemberDiscount,
          memberId,
        });
        newMap[coupon.id] = result.applicable;
      } catch {
        newMap[coupon.id] = false;
      }
    }
    setApplicableMap(newMap);
    setChecking(false);
  };

  useEffect(() => {
    checkApplicability();
  }, [coupons, zoneId, date, startTime, endTime, currentAmountAfterMemberDiscount, memberId]);

  const handleToggle = (couponId: string, isApplicable: boolean, isDisabled: boolean) => {
    if (disabled || isDisabled || !isApplicable) return;

    let newIds: string[];
    if (selectedIds.includes(couponId)) {
      newIds = selectedIds.filter((id) => id !== couponId);
    } else {
      newIds = [...selectedIds, couponId];
    }

    const validSelected = newIds.filter((id) => applicableMap[id] !== false);
    onChange(validSelected);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const getStatusBadge = (status: Coupon['status']) => {
    switch (status) {
      case 'unused':
        return <span className="badge badge-success">未使用</span>;
      case 'used':
        return <span className="badge badge-muted">已使用</span>;
      case 'expired':
        return <span className="badge badge-muted">已过期</span>;
      case 'recycled':
        return <span className="badge badge-muted">已回收</span>;
      default:
        return null;
    }
  };

  const getTypeLabel = (type: Coupon['type'], value: number) => {
    if (type === 'fixed') {
      return `满减券 · 减¥${value}`;
    }
    return `折扣券 · ${value}%OFF`;
  };

  const invalidSelectedCount = selectedIds.filter(
    (id) => applicableMap[id] === false
  ).length;

  if (coupons.length === 0) {
    return (
      <div className="card">
        <h3 className="section-title">🎟️ 优惠券</h3>
        <p className="text-muted" style={{ textAlign: 'center', padding: '20px 0' }}>
          暂无可用优惠券
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="section-title">
        🎟️ 优惠券
        {checking && (
          <span className="text-muted" style={{ fontSize: '13px', marginLeft: '8px' }}>
            (检查适用性中...)
          </span>
        )}
      </h3>
      {invalidSelectedCount > 0 && (
        <div
          style={{
            padding: '8px 12px',
            marginBottom: '12px',
            backgroundColor: '#fff5f5',
            color: '#c53030',
            borderRadius: '6px',
            fontSize: '13px',
          }}
        >
          ⚠️ 有 {invalidSelectedCount} 张已选优惠券不适用于当前订单，已自动忽略
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {coupons.map((coupon) => {
          const isSelected = selectedIds.includes(coupon.id);
          const isStatusDisabled = coupon.status !== 'unused';
          const isApplicable = applicableMap[coupon.id] !== false;
          const isCouponDisabled = disabled || isStatusDisabled || !isApplicable;

          return (
            <div
              key={coupon.id}
              onClick={() => handleToggle(coupon.id, isApplicable, isStatusDisabled)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                border: isSelected ? '2px solid #3182ce' : '1px solid #e2e8f0',
                borderRadius: '8px',
                cursor: isCouponDisabled ? 'not-allowed' : 'pointer',
                opacity: isCouponDisabled ? 0.55 : 1,
                backgroundColor: isStatusDisabled ? '#f7fafc' : isSelected ? '#ebf8ff' : 'white',
                transition: 'all 0.2s',
              }}
            >
              <input
                type="checkbox"
                checked={isSelected && isApplicable}
                onChange={() => {}}
                disabled={isCouponDisabled}
                style={{
                  width: '18px',
                  height: '18px',
                  cursor: isCouponDisabled ? 'not-allowed' : 'pointer',
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600, color: '#2d3748' }}>{coupon.name}</span>
                  {getStatusBadge(coupon.status)}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '13px', color: '#4a5568' }}>
                  <span>{getTypeLabel(coupon.type, coupon.value)}</span>
                  <span>有效期: {formatDate(coupon.validFrom)} ~ {formatDate(coupon.validTo)}</span>
                  {coupon.minConsumption > 0 && (
                    <span>满¥{coupon.minConsumption}可用</span>
                  )}
                </div>
                {!isApplicable && !isStatusDisabled && (
                  <div style={{ marginTop: '6px', fontSize: '12px', color: '#e53e3e' }}>
                    当前订单不满足使用条件
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CouponSelector;
