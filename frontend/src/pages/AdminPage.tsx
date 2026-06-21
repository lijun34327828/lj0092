import { useState } from 'react';
import PricingRulesTab from '../components/admin/PricingRulesTab';
import DiscountTiersTab from '../components/admin/DiscountTiersTab';
import EquipmentTab from '../components/admin/EquipmentTab';
import RefundRulesTab from '../components/admin/RefundRulesTab';
import ZonesTab from '../components/admin/ZonesTab';

function AdminPage() {
  const [activeTab, setActiveTab] = useState<string>('pricing');

  const tabs = [
    { id: 'zones', label: '🗺️ 场地管理' },
    { id: 'pricing', label: '💰 时段定价' },
    { id: 'discount', label: '🎉 组队折扣' },
    { id: 'equipment', label: '🎒 装备管理' },
    { id: 'refund', label: '📋 退款规则' },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>⚙️ 后台管理</h2>
      
      <div className="card">
        <div className="tabs">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={`tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </div>
          ))}
        </div>
        
        {activeTab === 'zones' && <ZonesTab />}
        {activeTab === 'pricing' && <PricingRulesTab />}
        {activeTab === 'discount' && <DiscountTiersTab />}
        {activeTab === 'equipment' && <EquipmentTab />}
        {activeTab === 'refund' && <RefundRulesTab />}
      </div>
    </div>
  );
}

export default AdminPage;
