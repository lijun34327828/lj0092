import type { GroupDiscountTier } from '../types';

interface DiscountTiersProps {
  tiers: GroupDiscountTier[];
  currentPeople: number;
}

function DiscountTiers({ tiers, currentPeople }: DiscountTiersProps) {
  const getActiveTier = () => {
    for (const tier of tiers) {
      if (currentPeople >= tier.minPeople && currentPeople <= tier.maxPeople) {
        return tier.id;
      }
    }
    return null;
  };

  const activeTierId = getActiveTier();

  return (
    <div>
      <label style={{ display: 'block', marginBottom: '6px', color: '#aaa', fontSize: '14px' }}>
        🎉 组队折扣
      </label>
      <div className="discount-tiers">
        {tiers.map((tier) => (
          <div
            key={tier.id}
            className={`discount-tier ${activeTierId === tier.id ? 'active' : ''}`}
          >
            {tier.description}
          </div>
        ))}
      </div>
      {currentPeople < 2 && (
        <p style={{ fontSize: '12px', color: '#888', marginTop: '8px' }}>
          提示：2人及以上即可享受组队折扣
        </p>
      )}
    </div>
  );
}

export default DiscountTiers;
