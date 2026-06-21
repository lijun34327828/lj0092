import { useState, useEffect } from 'react';
import { equipmentApi } from '../../services/api';
import type { Equipment } from '../../types';

function EquipmentTab() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadEquipment();
  }, []);

  const loadEquipment = async () => {
    setLoading(true);
    try {
      const data = await equipmentApi.getEquipment();
      setEquipment(data);
    } catch (err) {
      console.error('加载装备失败', err);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryLabel = (category: string) => {
    const map: Record<string, string> = {
      armor: '🛡️ 护具类',
      weapon: '🔫 枪械类',
      accessory: '🎯 配件类',
    };
    return map[category] || category;
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  const categories = ['armor', 'weapon', 'accessory'];

  return (
    <div>
      <h3 className="section-title">装备管理</h3>
      <p className="text-muted" style={{ marginBottom: '16px' }}>
        共 {equipment.length} 件装备
      </p>

      {categories.map((category) => {
        const items = equipment.filter((e) => e.category === category);
        return (
          <div key={category} style={{ marginBottom: '24px' }}>
            <h4 style={{ color: '#00d4ff', marginBottom: '12px' }}>
              {getCategoryLabel(category)}
            </h4>
            <div className="grid grid-3" style={{ gap: '12px' }}>
              {items.map((item) => (
                <div
                  key={item.id}
                  className="card"
                  style={{ padding: '16px' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h5 style={{ color: '#fff', marginBottom: '6px' }}>{item.name}</h5>
                      <p style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>
                        {item.description}
                      </p>
                    </div>
                    <span className="badge badge-confirmed">
                      ¥{item.pricePerHour}/时
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <span className="text-muted" style={{ fontSize: '12px' }}>
                      库存: {item.stock}件
                    </span>
                    <span className="text-primary" style={{ fontSize: '12px' }}>
                      {item.stock > 20 ? '库存充足' : item.stock > 10 ? '库存正常' : '库存紧张'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default EquipmentTab;
