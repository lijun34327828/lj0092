import { useState, useEffect } from 'react';
import { discountApi } from '../../services/api';
import type { GroupDiscountTier } from '../../types';

function DiscountTiersTab() {
  const [tiers, setTiers] = useState<GroupDiscountTier[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadTiers();
  }, []);

  const loadTiers = async () => {
    setLoading(true);
    try {
      const data = await discountApi.getDiscountTiers();
      setTiers(data);
    } catch (err) {
      console.error('加载折扣档位失败', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="section-title">组队折扣档位</h3>

      <div className="grid grid-3" style={{ gap: '16px', marginBottom: '20px' }}>
        {tiers.map((tier, index) => (
          <div
            key={tier.id}
            className="card"
            style={{
              background: `linear-gradient(135deg, rgba(0, 212, 255, ${0.1 + index * 0.05}), rgba(0, 153, 204, ${0.05 + index * 0.03}))`,
              borderColor: 'rgba(0, 212, 255, 0.3)',
            }}
          >
            <h4 style={{ color: '#00d4ff', marginBottom: '8px' }}>{tier.name}</h4>
            <p style={{ fontSize: '13px', color: '#aaa', marginBottom: '12px' }}>
              {tier.description}
            </p>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#00ff88' }}>
              {(tier.discountRate * 100).toFixed(0)}%
              <span style={{ fontSize: '14px', color: '#888', fontWeight: 'normal' }}> 折扣</span>
            </div>
            <p style={{ fontSize: '12px', color: '#888', marginTop: '8px' }}>
              {tier.minPeople} - {tier.maxPeople > 100 ? '不限' : tier.maxPeople} 人
            </p>
          </div>
        ))}
      </div>

      <table>
        <thead>
          <tr>
            <th>档位名称</th>
            <th>最少人数</th>
            <th>最多人数</th>
            <th>折扣率</th>
            <th>描述</th>
          </tr>
        </thead>
        <tbody>
          {tiers.map((tier) => (
            <tr key={tier.id}>
              <td className="text-primary">{tier.name}</td>
              <td>{tier.minPeople}人</td>
              <td>{tier.maxPeople > 100 ? '不限' : tier.maxPeople + '人'}</td>
              <td className="text-success">{(tier.discountRate * 100).toFixed(0)}%</td>
              <td className="text-muted">{tier.description}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="alert alert-info" style={{ marginTop: '16px', marginBottom: 0 }}>
        💡 组队折扣自动叠加：根据预约人数自动匹配对应档位的折扣率
      </div>
    </div>
  );
}

export default DiscountTiersTab;
