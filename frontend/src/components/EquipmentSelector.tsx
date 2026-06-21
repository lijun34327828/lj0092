import { useState } from 'react';
import type { Equipment, BookingEquipment } from '../types';

interface EquipmentSelectorProps {
  equipmentList: Equipment[];
  selectedEquipment: BookingEquipment[];
  onChange: (equipment: BookingEquipment[]) => void;
}

function EquipmentSelector({ equipmentList, selectedEquipment, onChange }: EquipmentSelectorProps) {
  const getQuantity = (equipmentId: string): number => {
    const item = selectedEquipment.find((e) => e.equipmentId === equipmentId);
    return item ? item.quantity : 0;
  };

  const updateQuantity = (equipmentId: string, delta: number) => {
    const currentQty = getQuantity(equipmentId);
    const newQty = Math.max(0, currentQty + delta);
    
    if (newQty === 0) {
      onChange(selectedEquipment.filter((e) => e.equipmentId !== equipmentId));
    } else {
      const existing = selectedEquipment.find((e) => e.equipmentId === equipmentId);
      if (existing) {
        onChange(
          selectedEquipment.map((e) =>
            e.equipmentId === equipmentId ? { ...e, quantity: newQty } : e
          )
        );
      } else {
        onChange([...selectedEquipment, { equipmentId, quantity: newQty }]);
      }
    }
  };

  const categories = [
    { key: 'armor', label: '🛡️ 护具类' },
    { key: 'weapon', label: '🔫 枪械类' },
    { key: 'accessory', label: '🎯 配件类' },
  ];

  return (
    <div className="card">
      <h3 className="section-title">🎒 装备租赁</h3>
      {categories.map((category) => {
        const items = equipmentList.filter((e) => e.category === category.key);
        return (
          <div key={category.key} style={{ marginBottom: '16px' }}>
            <h4 style={{ fontSize: '14px', color: '#aaa', marginBottom: '10px' }}>{category.label}</h4>
            <div className="equipment-list">
              {items.map((item) => {
                const qty = getQuantity(item.id);
                const isSelected = qty > 0;
                return (
                  <div
                    key={item.id}
                    className={`equipment-item ${isSelected ? 'selected' : ''}`}
                  >
                    <div>
                      <div className="equipment-name">{item.name}</div>
                      <div className="equipment-price">¥{item.pricePerHour}/小时</div>
                      <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
                        库存: {item.stock}
                      </div>
                    </div>
                    <div className="quantity-control">
                      <button onClick={() => updateQuantity(item.id, -1)} disabled={qty === 0}>
                      -
                      </button>
                      <span>{qty}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} disabled={qty >= item.stock}>
                      +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default EquipmentSelector;
