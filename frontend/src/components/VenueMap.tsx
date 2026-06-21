import { useEffect, useState } from 'react';
import type { VenueZone, Booking } from '../types';

interface VenueMapProps {
  zones: VenueZone[];
  selectedZoneId: string | null;
  onZoneSelect: (zoneId: string) => void;
  date: string;
  startTime: string;
  endTime: string;
  bookings: Booking[];
}

function VenueMap({ zones, selectedZoneId, onZoneSelect, date, startTime, endTime, bookings }: VenueMapProps) {
  const [zoneStatuses, setZoneStatuses] = useState<Record<string, 'available' | 'occupied'>>({});

  useEffect(() => {
    if (!date || !startTime || !endTime) {
      const statuses: Record<string, 'available' | 'occupied'> = {};
      zones.forEach((zone) => {
        statuses[zone.id] = 'available';
      });
      setZoneStatuses(statuses);
      return;
    }

    const statuses: Record<string, 'available' | 'occupied'> = {};
    zones.forEach((zone) => {
      const zoneBookings = bookings.filter(
        (b) => b.zoneId === zone.id && b.date === date && b.status !== 'cancelled'
      );
      
      const isOccupied = zoneBookings.some((b) => {
        const [s1h, s1m] = b.startTime.split(':').map(Number);
        const [e1h, e1m] = b.endTime.split(':').map(Number);
        const [s2h, s2m] = startTime.split(':').map(Number);
        const [e2h, e2m] = endTime.split(':').map(Number);
        
        const start1 = s1h * 60 + s1m;
        const end1 = e1h * 60 + e1m;
        const start2 = s2h * 60 + s2m;
        const end2 = e2h * 60 + e2m;
        
        return start1 < end2 && start2 < end1;
      });
      
      statuses[zone.id] = isOccupied ? 'occupied' : 'available';
    });
    setZoneStatuses(statuses);
  }, [zones, date, startTime, endTime, bookings]);

  return (
    <div className="venue-map" style={{ height: '450px' }}>
      <h3 className="section-title">🗺️ 场馆平面图</h3>
      <div style={{ position: 'relative', width: '100%', height: '380px', marginTop: '20px' }}>
        {zones.map((zone) => {
          const status = zoneStatuses[zone.id] || 'available';
          const isSelected = selectedZoneId === zone.id;
          const statusClass = isSelected ? 'selected' : status;
          
          return (
            <div
              key={zone.id}
              className={`zone-rect ${statusClass}`}
              style={{
                left: `${zone.position.x}px`,
                top: `${zone.position.y}px`,
                width: `${zone.position.width}px`,
                height: `${zone.position.height}px`,
              }}
              onClick={() => {
                if (status === 'available') {
                  onZoneSelect(zone.id);
                }
              }}
            >
              <div className="zone-name">{zone.name}</div>
              <div className="zone-info">
                容量: {zone.capacity}人
              </div>
              <div className="zone-info">
                ¥{zone.basePrice}/小时起
              </div>
              <div className="zone-info" style={{ marginTop: '4px', fontWeight: 600 }}>
                {status === 'occupied' ? '❌ 已占用' : isSelected ? '✓ 已选择' : '✓ 可预约'}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: '20px', marginTop: '16px', fontSize: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '16px', height: '16px', background: 'rgba(0, 255, 136, 0.2)', border: '2px solid #00ff88', borderRadius: '4px' }}></div>
          <span className="text-muted">可预约</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '16px', height: '16px', background: 'rgba(0, 212, 255, 0.2)', border: '2px solid #00d4ff', borderRadius: '4px' }}></div>
          <span className="text-muted">已选择</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '16px', height: '16px', background: 'rgba(255, 107, 107, 0.2)', border: '2px solid #ff6b6b', borderRadius: '4px' }}></div>
          <span className="text-muted">已占用</span>
        </div>
      </div>
    </div>
  );
}

export default VenueMap;
