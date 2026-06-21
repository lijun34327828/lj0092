import type { PriceBreakdown } from '../types';

interface PriceBreakdownProps {
  priceData: PriceBreakdown | null;
  loading?: boolean;
}

function PriceBreakdown({ priceData, loading }: PriceBreakdownProps) {
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

  return (
    <div className="card">
      <h3 className="section-title">💰 价格明细</h3>
      <div className="price-breakdown">
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
        
        {priceData.discountAmount > 0 && (
          <div className="price-row">
            <span className="text-success">
              组队折扣 ({priceData.details.groupDiscountTier})
            </span>
            <span className="text-success">-¥{priceData.discountAmount.toFixed(2)}</span>
          </div>
        )}
        
        {priceData.details.equipmentItems && priceData.details.equipmentItems.length > 0 && (
          <>
            <div className="price-row">
              <span className="text-muted">装备租赁</span>
              <span>¥{priceData.equipmentPrice.toFixed(2)}</span>
            </div>
            {priceData.details.equipmentItems.map((item) => (
              <div key={item.equipmentId} className="price-row" style={{ paddingLeft: '16px', fontSize: '13px' }}>
                <span className="text-muted">
                  {item.name} × {item.quantity}
                </span>
                <span className="text-muted">¥{item.total.toFixed(2)}</span>
              </div>
            ))}
          </>
        )}
        
        {priceData.details.temporaryServiceFeeApplied && (
          <div className="price-row">
            <span className="text-warning">临时预留服务费</span>
            <span className="text-warning">+¥{priceData.temporaryServiceFee.toFixed(2)}</span>
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
