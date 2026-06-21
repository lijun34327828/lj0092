import { useState, useEffect } from 'react';
import { venueApi } from '../../services/api';
import type { VenueZone } from '../../types';

function ZonesTab() {
  const [zones, setZones] = useState<VenueZone[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editingZone, setEditingZone] = useState<VenueZone | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);

  useEffect(() => {
    loadZones();
  }, []);

  const loadZones = async () => {
    setLoading(true);
    try {
      const data = await venueApi.getZones();
      setZones(data);
    } catch (err) {
      console.error('加载场地失败', err);
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 className="section-title" style={{ marginBottom: 0 }}>场地列表</h3>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingZone(null);
            setShowForm(true);
          }}
        >
          + 添加场地
        </button>
      </div>

      <table>
        <thead>
          <tr>
            <th>场地名称</th>
            <th>描述</th>
            <th>容量</th>
            <th>基础价格</th>
            <th>位置</th>
          </tr>
        </thead>
        <tbody>
          {zones.map((zone) => (
            <tr key={zone.id}>
              <td className="text-primary">{zone.name}</td>
              <td className="text-muted">{zone.description}</td>
              <td>{zone.capacity}人</td>
              <td>¥{zone.basePrice}/小时</td>
              <td className="text-muted">
                ({zone.position.x}, {zone.position.y}) {zone.position.width}×{zone.position.height}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ZonesTab;
