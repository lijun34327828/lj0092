import { useState, useEffect } from 'react';
import type {
  Member,
  WalletTransaction,
  Coupon,
  Booking,
  WaitlistEntry,
  MemberLevelRule,
} from '../types';
import {
  memberApi,
  couponApi,
  bookingApi,
  waitlistApi,
} from '../services/api';

type TabKey = 'transactions' | 'coupons' | 'bookings' | 'waitlist';
type CouponFilter = 'all' | 'available';

function MemberCenterPage() {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [levelRules, setLevelRules] = useState<MemberLevelRule[]>([]);

  const [activeTab, setActiveTab] = useState<TabKey>('transactions');
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponFilter, setCouponFilter] = useState<CouponFilter>('all');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [waitlists, setWaitlists] = useState<WaitlistEntry[]>([]);

  const [showRecharge, setShowRecharge] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [rechargeRemark, setRechargeRemark] = useState('');
  const [recharging, setRecharging] = useState(false);

  useEffect(() => {
    memberApi.getLevelRules().then(setLevelRules).catch(() => {});
  }, []);

  const handleLogin = async () => {
    if (!phone.trim()) {
      setError('请输入手机号');
      return;
    }
    if (!name.trim()) {
      setError('请输入姓名');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const existing = await memberApi.getMembers(phone.trim());
      if (existing && existing.length > 0) {
        setMember(existing[0]);
      } else {
        const newMember = await memberApi.createMember({
          name: name.trim(),
          phone: phone.trim(),
        });
        setMember(newMember);
      }
    } catch (e: any) {
      setError(e.response?.data?.error || e.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const loadMemberData = async (memberId: string) => {
    try {
      const [txs, cps, allBookings, wls] = await Promise.all([
        memberApi.getMemberTransactions(memberId),
        couponApi.getCoupons({ memberId }),
        bookingApi.getBookings(),
        waitlistApi.getWaitlists({ memberId }),
      ]);
      setTransactions(txs || []);
      setCoupons(cps || []);
      setBookings((allBookings || []).filter((b) => b.memberId === memberId));
      setWaitlists(wls || []);
    } catch (e) {
      console.error('加载会员数据失败', e);
    }
  };

  useEffect(() => {
    if (member) {
      loadMemberData(member.id);
    }
  }, [member]);

  const handleRecharge = async () => {
    if (!member) return;
    const amount = Number(rechargeAmount);
    if (!amount || amount <= 0) {
      setError('请输入有效的充值金额');
      return;
    }
    setRecharging(true);
    setError('');
    try {
      const updated = await memberApi.rechargeMember(member.id, {
        amount,
        remark: rechargeRemark || undefined,
      });
      setMember(updated);
      setShowRecharge(false);
      setRechargeAmount('');
      setRechargeRemark('');
      const txs = await memberApi.getMemberTransactions(member.id);
      setTransactions(txs || []);
    } catch (e: any) {
      setError(e.response?.data?.error || e.message || '充值失败');
    } finally {
      setRecharging(false);
    }
  };

  const getNextLevelInfo = () => {
    if (!member || levelRules.length === 0) return null;
    const sorted = [...levelRules].sort((a, b) => a.minTotalSpent - b.minTotalSpent);
    const currentIndex = sorted.findIndex((r) => r.level === member.level);
    if (currentIndex < sorted.length - 1) {
      const next = sorted[currentIndex + 1];
      const diff = Math.max(0, next.minTotalSpent - member.totalSpent);
      return { nextLevel: next.levelName, needSpent: diff };
    }
    return null;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(
      d.getMinutes()
    ).padStart(2, '0')}`;
  };

  const getLevelBadgeStyle = (level: string) => {
    switch (level) {
      case 'platinum':
        return { backgroundColor: '#e2e8f0', color: '#1a202c' };
      case 'gold':
        return { backgroundColor: '#fefcbf', color: '#744210' };
      case 'silver':
        return { backgroundColor: '#e2e8f0', color: '#4a5568' };
      default:
        return { backgroundColor: '#c6f6d5', color: '#22543d' };
    }
  };

  const getTxStyle = (type: WalletTransaction['type'], amount: number) => {
    switch (type) {
      case 'recharge':
        return { color: '#38a169', sign: '+' };
      case 'payment':
        return { color: '#e53e3e', sign: '-' };
      case 'refund':
        return { color: '#3182ce', sign: '+' };
      case 'adjust':
        return { color: '#805ad5', sign: amount >= 0 ? '+' : '' };
      default:
        return { color: '#4a5568', sign: '' };
    }
  };

  const getTxTypeLabel = (type: WalletTransaction['type']) => {
    switch (type) {
      case 'recharge':
        return '充值';
      case 'payment':
        return '消费';
      case 'refund':
        return '退款';
      case 'adjust':
        return '调整';
      default:
        return type;
    }
  };

  const getStatusBadge = (status: Coupon['status']) => {
    switch (status) {
      case 'unused':
        return <span className="badge badge-success">未使用</span>;
      case 'used':
        return <span className="badge badge-muted">已使用</span>;
      case 'expired':
        return <span className="badge badge-muted">已过期</span>;
      case 'recycled':
        return <span className="badge badge-muted">已回收</span>;
      default:
        return null;
    }
  };

  const getBookingStatusStyle = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed':
        return { backgroundColor: '#c6f6d5', color: '#22543d' };
      case 'pending':
        return { backgroundColor: '#fefcbf', color: '#744210' };
      case 'cancelled':
        return { backgroundColor: '#fed7d7', color: '#742a2a' };
      case 'completed':
        return { backgroundColor: '#bee3f8', color: '#2a4365' };
      default:
        return { backgroundColor: '#e2e8f0', color: '#4a5568' };
    }
  };

  const getBookingStatusLabel = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed':
        return '已确认';
      case 'pending':
        return '待确认';
      case 'cancelled':
        return '已取消';
      case 'completed':
        return '已完成';
      default:
        return status;
    }
  };

  const getWaitlistStatusStyle = (status: WaitlistEntry['status']) => {
    switch (status) {
      case 'waiting':
        return { backgroundColor: '#fefcbf', color: '#744210' };
      case 'matched':
        return { backgroundColor: '#c6f6d5', color: '#22543d' };
      case 'cancelled':
        return { backgroundColor: '#fed7d7', color: '#742a2a' };
      case 'expired':
        return { backgroundColor: '#e2e8f0', color: '#4a5568' };
      default:
        return { backgroundColor: '#e2e8f0', color: '#4a5568' };
    }
  };

  const getWaitlistStatusLabel = (status: WaitlistEntry['status']) => {
    switch (status) {
      case 'waiting':
        return '等待中';
      case 'matched':
        return '已匹配';
      case 'cancelled':
        return '已取消';
      case 'expired':
        return '已过期';
      default:
        return status;
    }
  };

  const filteredCoupons =
    couponFilter === 'available'
      ? coupons.filter((c) => c.status === 'unused')
      : coupons;

  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const sortedBookings = [...bookings].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const sortedWaitlists = [...waitlists].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const nextLevelInfo = getNextLevelInfo();
  const currentLevelRule = levelRules.find((r) => r.level === member?.level);

  if (!member) {
    return (
      <div className="card" style={{ maxWidth: '420px', margin: '40px auto' }}>
        <h3 className="section-title" style={{ textAlign: 'center' }}>
          👤 会员登录 / 注册
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="form-label">手机号</label>
            <input
              className="form-input"
              type="tel"
              placeholder="请输入手机号"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">姓名</label>
            <input
              className="form-input"
              type="text"
              placeholder="请输入姓名"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          {error && (
            <div style={{ color: '#e53e3e', fontSize: '14px' }}>{error}</div>
          )}
          <button
            className="btn btn-primary"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? '处理中...' : '登录 / 注册'}
          </button>
          <p className="text-muted" style={{ fontSize: '13px', textAlign: 'center' }}>
            如果手机号已存在将直接登录，否则自动注册新账号
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <h2 style={{ margin: 0 }}>{member.name}</h2>
              <span
                style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: 600,
                  ...getLevelBadgeStyle(member.level),
                }}
              >
                {currentLevelRule?.levelName || member.level}
              </span>
              {(currentLevelRule?.discountRate || 0) > 0 && (
                <span className="badge badge-success">
                  折扣 {(currentLevelRule!.discountRate * 100).toFixed(0)}%OFF
                </span>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
              <div>
                <div className="text-muted" style={{ fontSize: '13px', marginBottom: '4px' }}>
                  手机号
                </div>
                <div style={{ fontSize: '16px', fontWeight: 600 }}>{member.phone}</div>
              </div>
              <div>
                <div className="text-muted" style={{ fontSize: '13px', marginBottom: '4px' }}>
                  累计消费
                </div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#2d3748' }}>
                  ¥{member.totalSpent.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-muted" style={{ fontSize: '13px', marginBottom: '4px' }}>
                  当前余额
                </div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#38a169' }}>
                  ¥{member.balance.toFixed(2)}
                </div>
              </div>
              {nextLevelInfo && (
                <div>
                  <div className="text-muted" style={{ fontSize: '13px', marginBottom: '4px' }}>
                    距离 {nextLevelInfo.nextLevel}
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: '#d69e2e' }}>
                    还差 ¥{nextLevelInfo.needSpent.toFixed(2)}
                  </div>
                </div>
              )}
            </div>
            <div style={{ marginTop: '16px', fontSize: '13px', color: '#718096' }}>
              注册时间: {formatDate(member.createdAt)}
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => setShowRecharge(true)}>
            💰 充值
          </button>
        </div>
      </div>

      <div>
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'transactions' ? 'active' : ''}`}
            onClick={() => setActiveTab('transactions')}
          >
            余额明细
          </button>
          <button
            className={`tab ${activeTab === 'coupons' ? 'active' : ''}`}
            onClick={() => setActiveTab('coupons')}
          >
            优惠券 ({coupons.length})
          </button>
          <button
            className={`tab ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            预约记录 ({bookings.length})
          </button>
          <button
            className={`tab ${activeTab === 'waitlist' ? 'active' : ''}`}
            onClick={() => setActiveTab('waitlist')}
          >
            候补记录 ({waitlists.length})
          </button>
        </div>

        <div className="card">
          {activeTab === 'transactions' && (
            <>
              {sortedTransactions.length === 0 ? (
                <p className="text-muted" style={{ textAlign: 'center', padding: '30px 0' }}>
                  暂无交易记录
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {sortedTransactions.map((tx) => {
                    const style = getTxStyle(tx.type, tx.amount);
                    return (
                      <div
                        key={tx.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, color: '#2d3748', marginBottom: '4px' }}>
                            {getTxTypeLabel(tx.type)}
                            {tx.remark && (
                              <span className="text-muted" style={{ fontSize: '13px', marginLeft: '8px' }}>
                                ({tx.remark})
                              </span>
                            )}
                          </div>
                          <div className="text-muted" style={{ fontSize: '12px' }}>
                            {formatDate(tx.createdAt)}
                          </div>
                          {tx.relatedBookingId && (
                            <div className="text-muted" style={{ fontSize: '12px' }}>
                              订单号: {tx.relatedBookingId.slice(0, 8)}...
                            </div>
                          )}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '18px', fontWeight: 700, color: style.color }}>
                            {style.sign}¥{Math.abs(tx.amount).toFixed(2)}
                          </div>
                          <div className="text-muted" style={{ fontSize: '12px', marginTop: '4px' }}>
                            余额 ¥{tx.balanceAfter.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {activeTab === 'coupons' && (
            <>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <button
                  className={`btn ${couponFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setCouponFilter('all')}
                >
                  全部 ({coupons.length})
                </button>
                <button
                  className={`btn ${couponFilter === 'available' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setCouponFilter('available')}
                >
                  可用 ({coupons.filter((c) => c.status === 'unused').length})
                </button>
              </div>
              {filteredCoupons.length === 0 ? (
                <p className="text-muted" style={{ textAlign: 'center', padding: '30px 0' }}>
                  暂无优惠券
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {filteredCoupons.map((coupon) => (
                    <div
                      key={coupon.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '14px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        opacity: coupon.status !== 'unused' ? 0.6 : 1,
                      }}
                    >
                      <div
                        style={{
                          width: '72px',
                          height: '72px',
                          borderRadius: '8px',
                          background:
                            coupon.type === 'fixed'
                              ? 'linear-gradient(135deg, #fed7d7 0%, #fc8181 100%)'
                              : 'linear-gradient(135deg, #c6f6d5 0%, #68d391 100%)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: coupon.type === 'fixed' ? '#742a2a' : '#22543d',
                          flexShrink: 0,
                        }}
                      >
                        <div style={{ fontSize: '22px', fontWeight: 800 }}>
                          {coupon.type === 'fixed' ? `¥${coupon.value}` : `${coupon.value}%`}
                        </div>
                        <div style={{ fontSize: '11px' }}>
                          {coupon.type === 'fixed' ? '满减券' : '折扣券'}
                        </div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <span style={{ fontWeight: 600, color: '#2d3748' }}>{coupon.name}</span>
                          {getStatusBadge(coupon.status)}
                        </div>
                        <div style={{ fontSize: '13px', color: '#4a5568', marginBottom: '4px' }}>
                          有效期: {formatDate(coupon.validFrom).slice(0, 10)} ~{' '}
                          {formatDate(coupon.validTo).slice(0, 10)}
                        </div>
                        {coupon.minConsumption > 0 && (
                          <div style={{ fontSize: '12px', color: '#718096' }}>
                            满 ¥{coupon.minConsumption} 可用
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'bookings' && (
            <>
              {sortedBookings.length === 0 ? (
                <p className="text-muted" style={{ textAlign: 'center', padding: '30px 0' }}>
                  暂无预约记录
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {sortedBookings.map((booking) => (
                    <div
                      key={booking.id}
                      style={{
                        padding: '14px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <div>
                          <div style={{ fontWeight: 600, color: '#2d3748', marginBottom: '4px' }}>
                            📅 {booking.date} {booking.startTime} - {booking.endTime}
                          </div>
                          <div className="text-muted" style={{ fontSize: '13px' }}>
                            场地ID: {booking.zoneId.slice(0, 8)}... · {booking.peopleCount}人
                          </div>
                        </div>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 600,
                            ...getBookingStatusStyle(booking.status),
                          }}
                        >
                          {getBookingStatusLabel(booking.status)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                        <div className="text-muted">
                          下单时间: {formatDate(booking.createdAt)}
                        </div>
                        <div style={{ display: 'flex', gap: '16px' }}>
                          <span>实付 <b style={{ color: '#e53e3e' }}>¥{booking.paidAmount.toFixed(2)}</b></span>
                          {booking.refundAmount > 0 && (
                            <span style={{ color: '#38a169' }}>退款 ¥{booking.refundAmount.toFixed(2)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'waitlist' && (
            <>
              {sortedWaitlists.length === 0 ? (
                <p className="text-muted" style={{ textAlign: 'center', padding: '30px 0' }}>
                  暂无候补记录
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {sortedWaitlists.map((entry) => (
                    <div
                      key={entry.id}
                      style={{
                        padding: '14px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <div>
                          <div style={{ fontWeight: 600, color: '#2d3748', marginBottom: '4px' }}>
                            📅 {entry.date} {entry.startTime} - {entry.endTime}
                          </div>
                          <div className="text-muted" style={{ fontSize: '13px' }}>
                            场地ID: {entry.zoneId.slice(0, 8)}... · {entry.peopleCount}人 · 排队 #{entry.queuePosition}
                          </div>
                        </div>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 600,
                            ...getWaitlistStatusStyle(entry.status),
                          }}
                        >
                          {getWaitlistStatusLabel(entry.status)}
                        </span>
                      </div>
                      <div style={{ fontSize: '13px' }} className="text-muted">
                        候补时间: {formatDate(entry.createdAt)}
                        {entry.matchedAt && (
                          <span style={{ marginLeft: '12px', color: '#38a169' }}>
                            匹配时间: {formatDate(entry.matchedAt)}
                          </span>
                        )}
                        {entry.matchedBookingId && (
                          <span style={{ marginLeft: '12px', color: '#3182ce' }}>
                            生成订单: {entry.matchedBookingId.slice(0, 8)}...
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showRecharge && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
          onClick={() => setShowRecharge(false)}
        >
          <div
            className="card"
            style={{ maxWidth: '400px', width: '100%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="section-title">💰 充值余额</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="form-label">充值金额 (元)</label>
                <input
                  className="form-input"
                  type="number"
                  placeholder="请输入充值金额"
                  value={rechargeAmount}
                  onChange={(e) => setRechargeAmount(e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="form-label">备注 (可选)</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="充值备注"
                  value={rechargeRemark}
                  onChange={(e) => setRechargeRemark(e.target.value)}
                />
              </div>
              {error && (
                <div style={{ color: '#e53e3e', fontSize: '14px' }}>{error}</div>
              )}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => {
                    setShowRecharge(false);
                    setError('');
                  }}
                >
                  取消
                </button>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  onClick={handleRecharge}
                  disabled={recharging}
                >
                  {recharging ? '充值中...' : '确认充值'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MemberCenterPage;
