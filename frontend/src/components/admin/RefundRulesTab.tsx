import { useState, useEffect } from 'react';
import { refundApi } from '../../services/api';
import type { RefundRule } from '../../types';

function RefundRulesTab() {
  const [rules, setRules] = useState<RefundRule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    setLoading(true);
    try {
      const data = await refundApi.getRefundRules();
      setRules([...data].sort((a, b) => b.maxHoursBefore - a.maxHoursBefore));
    } catch (err) {
      console.error('加载退款规则失败', err);
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
      <h3 className="section-title">阶梯退款规则</h3>
      <p className="text-muted" style={{ marginBottom: '20px' }}>
        取消预约时，根据提前取消的时长执行不同的退款比例
      </p>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {rules.map((rule, index) => (
          <div
            key={rule.id}
            className="card"
            style={{
              flex: 1,
              textAlign: 'center',
              background: rule.refundRate === 0 
                ? 'rgba(255, 107, 107, 0.1)' 
                : rule.refundRate === 1 
                  ? 'rgba(0, 255, 136, 0.1)'
                  : 'rgba(255, 204, 0, 0.1)',
              borderColor: rule.refundRate === 0 
                ? 'rgba(255, 107, 107, 0.3)' 
                : rule.refundRate === 1 
                  ? 'rgba(0, 255, 136, 0.3)'
                  : 'rgba(255, 204, 0, 0.3)',
            }}
          >
            <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px', color: rule.refundRate === 0 ? '#ff6b6b' : rule.refundRate === 1 ? '#00ff88' : '#ffcc00' }}>
              {(rule.refundRate * 100).toFixed(0)}%
            </div>
            <div style={{ fontSize: '13px', color: '#ddd', marginBottom: '4px' }}>
              {rule.name}
            </div>
            <div style={{ fontSize: '11px', color: '#888' }}>
              {rule.minHoursBefore >= 24 ? `${rule.minHoursBefore / 24}天` : `${rule.minHoursBefore}小时`} - {rule.maxHoursBefore >= 24 ? `${rule.maxHoursBefore / 24}天` : `${rule.maxHoursBefore}小时`} 前
            </div>
          </div>
        ))}
      </div>

      <table>
        <thead>
          <tr>
            <th>规则名称</th>
            <th>提前时间（最低）</th>
            <th>提前时间（最高）</th>
            <th>退款比例</th>
            <th>描述</th>
          </tr>
        </thead>
        <tbody>
          {rules.map((rule) => (
            <tr key={rule.id}>
              <td className="text-primary">{rule.name}</td>
              <td>{rule.minHoursBefore >= 24 ? `${rule.minHoursBefore / 24}天` : `${rule.minHoursBefore}小时`}</td>
              <td>{rule.maxHoursBefore >= 9999 ? '不限' : rule.maxHoursBefore >= 24 ? `${rule.maxHoursBefore / 24}天` : `${rule.maxHoursBefore}小时`}</td>
              <td>
                <span className={`badge ${rule.refundRate === 0 ? 'badge-cancelled' : rule.refundRate === 1 ? 'badge-confirmed' : 'badge-pending'}`}>
                  {(rule.refundRate * 100).toFixed(0)}%
                </span>
              </td>
              <td className="text-muted">{rule.description}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="alert alert-info" style={{ marginTop: '16px', marginBottom: 0 }}>
        💡 临时预留服务费：预约距离开场不足2小时，收取30元临时预留服务费
      </div>
    </div>
  );
}

export default RefundRulesTab;
