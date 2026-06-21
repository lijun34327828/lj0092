import type { PriceBreakdown } from '../types';

interface PriceBreakdownProps {
  priceData: PriceBreakdown | null;
  loading?: boolean;
  occupancyInfo?: {
    occupancyRate: number;
    threshold: number;
    premiumRate: number;
    premiumMultiplier: number;
    occupiedCount: number;
    totalCount: number;
  };
}

function PriceBreakdown({ priceData, loading, occupancyInfo }: PriceBreakdownProps) {
  if (loading) {
    return (
      <div className="card">
        <h3 className="section-title">💰 价格明细</h3>
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (!priceData) {
    return (
      <div className="card">
        <h3 className="section-title">💰 价格明细</h3>
        <p className="text-muted" style={{ textAlign: 'center', padding: '30px 0' }}>
          请选择场地和时段后显示价格
        </p>
      </div>
    );
  }

  const hasDynamicPremium = priceData.dynamicPremiumAmount > 0;
  const hasGroupDiscount = priceData.groupDiscountAmount > 0;
  const hasMemberDiscount = priceData.memberDiscountAmount > 0;
  const hasCoupons = priceData.appliedCoupons && priceData.appliedCoupons.length > 0;
  const hasEquipment = priceData.details.equipmentItems && priceData.details.equipmentItems.length > 0;
  const hasTempFee = priceData.details.temporaryServiceFeeApplied;

  return (
    <div className="card">
      <h3 className="section-title">💰 价格明细</h3>
      <div className="price-breakdown">
        {occupancyInfo && occupancyInfo.premiumRate > 0 && occupancyInfo.occupancyRate >= occupancyInfo.threshold && (
          <div
            className="price-row"
            style={{
              padding: '10px 12px',
              marginBottom: '8px',
              backgroundColor: '#fff5f5',
              borderRadius: '6px',
              border: '1px solid #fed7d7',
            }}
          >
            <span className="text-warning" style={{ fontWeight: 600 }}>
              🔥 全场占用率 {(occupancyInfo.occupancyRate * 100).toFixed(0)}%
            </span>
            <span className="text-warning" style={{ fontWeight: 600 }}>
              溢价 +{(occupancyInfo.premiumRate * 100).toFixed(0)}%
            </span>
          </div>
        )}

        <div className="price-row">
          <span className="text-muted">基础价格</span>
          <span>¥{priceData.basePrice.toFixed(2)}</span>
        </div>

        {priceData.details.durationHours && (
          <div className="price-row">
            <span className="text-muted">时长</span>
            <span>{priceData.details.durationHours}小时</span>
          </div>
        )}

        {hasDynamicPremium && (
          <>
            <div className="price-row">
              <span className="text-warning">
                动态溢价 +{(priceData.dynamicPremiumRate * 100).toFixed(0)}%
              </span>
              <span className="text-warning">+¥{priceData.dynamicPremiumAmount.toFixed(2)}</span>
            </div>
            <div className="price-row" style={{ paddingLeft: '16px', fontSize: '13px' }}>
              <span className="text-muted">溢价后小计</span>
              <span className="text-muted">¥{priceData.premiumBasePrice.toFixed(2)}</span>
            </div>
          </>
        )}

        {hasGroupDiscount && (
          <>
            <div className="price-row">
              <span className="text-success">组队折扣 ({priceData.details.groupDiscountTier})</span>
              <span className="text-success">-¥{priceData.groupDiscountAmount.toFixed(2)}</span>
            </div>
            <div className="price-row" style={{ paddingLeft: '16px', fontSize: '13px' }}>
              <span className="text-muted">组队折扣后小计</span>
              <span className="text-muted">¥{priceData.afterGroupDiscount.toFixed(2)}</span>
            </div>
          </>
        )}

        {hasMemberDiscount && (
          <>
            <div className="price-row">
              <span className="text-success">
                会员折扣 ({priceData.memberLevelName}) {(priceData.memberDiscountRate * 100).toFixed(0)}%
              </span>
              <span className="text-success">-¥{priceData.memberDiscountAmount.toFixed(2)}</span>
            </div>
            <div className="price-row" style={{ paddingLeft: '16px', fontSize: '13px' }}>
              <span className="text-muted">会员折扣后小计</span>
              <span className="text-muted">¥{priceData.afterMemberDiscount.toFixed(2)}</span>
            </div>
          </>
        )}

        {hasCoupons && (
          <>
            {priceData.appliedCoupons.map((coupon) => (
              <div key={coupon.couponId} className="price-row">
                <span className="text-success">
                  优惠券 · {coupon.couponName}
                  {coupon.couponType === 'percentage'
                    ? ` ${coupon.couponValue}%OFF`
                    : ` 减¥${coupon.couponValue}`}
                </span>
                <span className="text-success">-¥{coupon.discountAmount.toFixed(2)}</span>
              </div>
            ))}
            <div className="price-row" style={{ paddingLeft: '16px', fontSize: '13px' }}>
              <span className="text-muted">优惠券后小计</span>
              <span className="text-muted">¥{priceData.afterCoupons.toFixed(2)}</span>
            </div>
          </>
        )}

        {hasEquipment && (
          <>
            <div className="price-row">
              <span className="text-muted">装备租赁</span>
              <span>¥{priceData.equipmentPrice.toFixed(2)}</span>
            </div>
            {priceData.details.equipmentItems.map((item) => (
              <div
                key={item.equipmentId}
                className="price-row"
                style={{ paddingLeft: '16px', fontSize: '13px' }}
              >
                <span className="text-muted">
                  {item.name} × {item.quantity}
                </span>
                <span className="text-muted">¥{item.total.toFixed(2)}</span>
              </div>
            ))}
          </>
        )}

        {hasTempFee && (
          <div className="price-row">
            <span className="text-warning">临时预留服务费</span>
            <span className="text-warning">+¥{priceData.temporaryServiceFee.toFixed(2)}</span>
          </div>
        )}

        {priceData.discountAmount > 0 && (
          <div
            className="price-row"
            style={{
              borderTop: '1px dashed #e2e8f0',
              paddingTop: '8px',
              marginTop: '4px',
            }}
          >
            <span className="text-success" style={{ fontWeight: 600 }}>
              总优惠
            </span>
            <span className="text-success" style={{ fontWeight: 600 }}>
              -¥{priceData.discountAmount.toFixed(2)}
            </span>
          </div>
        )}

        <div className="price-row price-total">
          <span>总计</span>
          <span>¥{priceData.total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

export default PriceBreakdown;
