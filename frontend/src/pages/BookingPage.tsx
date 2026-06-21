import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { venueApi, timeSlotApi, equipmentApi, discountApi, bookingApi, memberApi, couponApi, waitlistApi, premiumApi } from '../services/api';
import type { VenueZone, TimeSlot, Equipment, BookingEquipment, PriceBreakdown, GroupDiscountTier, Booking, Member, Coupon, MemberLevelRule } from '../types';
import VenueMap from '../components/VenueMap';
import PriceBreakdownComponent from '../components/PriceBreakdown';
import EquipmentSelector from '../components/EquipmentSelector';
import DiscountTiers from '../components/DiscountTiers';
import CouponSelector from '../components/CouponSelector';

function BookingPage() {
  const navigate = useNavigate();
  const [zones, setZones] = useState<VenueZone[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [discountTiers, setDiscountTiers] = useState<GroupDiscountTier[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [memberLevelRules, setMemberLevelRules] = useState<MemberLevelRule[]>([]);

  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [date, setDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [peopleCount, setPeopleCount] = useState<number>(2);
  const [selectedEquipment, setSelectedEquipment] = useState<BookingEquipment[]>([]);

  const [userName, setUserName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');

  const [priceData, setPriceData] = useState<PriceBreakdown | null>(null);
  const [priceLoading, setPriceLoading] = useState<boolean>(false);
  const [bookingLoading, setBookingLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  const [memberPhone, setMemberPhone] = useState<string>('');
  const [memberName, setMemberName] = useState<string>('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [memberSearching, setMemberSearching] = useState<boolean>(false);
  const [showMemberRegister, setShowMemberRegister] = useState<boolean>(false);

  const [useBalance, setUseBalance] = useState<boolean>(false);

  const [memberCoupons, setMemberCoupons] = useState<Coupon[]>([]);
  const [selectedCouponIds, setSelectedCouponIds] = useState<string[]>([]);

  const [occupancyInfo, setOccupancyInfo] = useState<{
    occupancyRate: number;
    threshold: number;
    premiumRate: number;
    premiumMultiplier: number;
    occupiedCount: number;
    totalCount: number;
  } | null>(null);

  const [isZoneAvailable, setIsZoneAvailable] = useState<boolean | null>(null);
  const [availabilityChecking, setAvailabilityChecking] = useState<boolean>(false);
  const [showWaitlistModal, setShowWaitlistModal] = useState<boolean>(false);
  const [waitlistSubmitting, setWaitlistSubmitting] = useState<boolean>(false);

  useEffect(() => {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    setDate(today.toISOString().split('T')[0]);

    loadData();
  }, []);

  useEffect(() => {
    loadBookings();
  }, [date]);

  useEffect(() => {
    loadMemberLevelRules();
  }, []);

  const loadMemberLevelRules = async () => {
    try {
      const rules = await memberApi.getLevelRules();
      setMemberLevelRules(rules);
    } catch (err) {
      console.error('加载会员等级规则失败', err);
    }
  };

  const loadData = async () => {
    try {
      const [zonesData, slotsData, equipmentData, tiersData] = await Promise.all([
        venueApi.getZones(),
        timeSlotApi.getTimeSlots(),
        equipmentApi.getEquipment(),
        discountApi.getDiscountTiers(),
      ]);
      setZones(zonesData);
      setTimeSlots(slotsData);
      setEquipmentList(equipmentData);
      setDiscountTiers(tiersData);

      if (slotsData.length > 0) {
        setStartTime(slotsData[0].startTime);
        setEndTime(slotsData[0].endTime);
      }
    } catch (err) {
      setError('加载数据失败');
    }
  };

  const loadBookings = async () => {
    if (!date) return;
    try {
      const data = await bookingApi.getBookings(date);
      setBookings(data);
    } catch (err) {
      console.error('加载预约失败', err);
    }
  };

  const handleMemberSearch = async () => {
    if (!memberPhone.trim()) {
      setError('请输入会员手机号');
      return;
    }
    setMemberSearching(true);
    setError('');
    try {
      const members = await memberApi.getMembers(memberPhone.trim());
      if (members && members.length > 0) {
        setSelectedMember(members[0]);
        setMemberName(members[0].name);
        setPhone(members[0].phone);
        setUserName(members[0].name);
        setShowMemberRegister(false);
        loadMemberCoupons(members[0].id);
      } else {
        setShowMemberRegister(true);
        setSelectedMember(null);
        setMemberCoupons([]);
        setSelectedCouponIds([]);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || '查询会员失败');
    } finally {
      setMemberSearching(false);
    }
  };

  const handleMemberRegister = async () => {
    if (!memberPhone.trim()) {
      setError('请输入手机号');
      return;
    }
    if (!memberName.trim()) {
      setError('请输入姓名');
      return;
    }
    setMemberSearching(true);
    setError('');
    try {
      const newMember = await memberApi.createMember({
        name: memberName.trim(),
        phone: memberPhone.trim(),
      });
      setSelectedMember(newMember);
      setPhone(newMember.phone);
      setUserName(newMember.name);
      setShowMemberRegister(false);
      loadMemberCoupons(newMember.id);
    } catch (err: any) {
      setError(err.response?.data?.error || '注册会员失败');
    } finally {
      setMemberSearching(false);
    }
  };

  const clearMember = () => {
    setSelectedMember(null);
    setMemberPhone('');
    setMemberName('');
    setMemberCoupons([]);
    setSelectedCouponIds([]);
    setUseBalance(false);
    setShowMemberRegister(false);
  };

  const loadMemberCoupons = async (memberId: string) => {
    try {
      const coupons = await couponApi.getAvailableCoupons(memberId);
      setMemberCoupons(coupons);
    } catch (err) {
      console.error('加载会员优惠券失败', err);
      setMemberCoupons([]);
    }
  };

  const estimateAfterMemberDiscount = (): number | undefined => {
    if (!priceData || !selectedMember) {
      return undefined;
    }
    const afterGroup = priceData.afterGroupDiscount;
    const memberRule = memberLevelRules.find((r) => r.level === selectedMember.level);
    const memberDiscountRate = memberRule?.discountRate ?? 1;
    return afterGroup * memberDiscountRate;
  };

  useEffect(() => {
    const checkAvailabilityAndOccupancy = async () => {
      if (!selectedZoneId || !date || !startTime || !endTime) {
        setIsZoneAvailable(null);
        setOccupancyInfo(null);
        return;
      }

      setAvailabilityChecking(true);
      try {
        const [availResult, occResult] = await Promise.all([
          bookingApi.checkAvailability(selectedZoneId, date, startTime, endTime),
          premiumApi.getOccupancyInfo(date, startTime, endTime),
        ]);
        setIsZoneAvailable(availResult.available ?? true);
        setOccupancyInfo(occResult);
      } catch (err) {
        console.error('检查可用性失败', err);
        setIsZoneAvailable(true);
      } finally {
        setAvailabilityChecking(false);
      }
    };

    checkAvailabilityAndOccupancy();
  }, [selectedZoneId, date, startTime, endTime]);

  useEffect(() => {
    if (selectedZoneId && date && startTime && endTime && peopleCount >= 1) {
      calculatePrice();
    } else {
      setPriceData(null);
    }
  }, [selectedZoneId, date, startTime, endTime, peopleCount, selectedEquipment, selectedMember, selectedCouponIds]);

  const calculatePrice = async () => {
    if (!selectedZoneId || !date || !startTime || !endTime) return;

    setPriceLoading(true);
    setError('');
    try {
      const data = await bookingApi.calculatePrice({
        zoneId: selectedZoneId,
        date,
        startTime,
        endTime,
        peopleCount,
        equipment: selectedEquipment,
        memberId: selectedMember?.id,
        memberTotalSpent: selectedMember?.totalSpent,
        couponIds: selectedCouponIds.length > 0 ? selectedCouponIds : undefined,
      });
      setPriceData(data);
    } catch (err: any) {
      setError(err.response?.data?.error || '价格计算失败');
      setPriceData(null);
    } finally {
      setPriceLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!selectedZoneId) {
      setError('请选择对战区域');
      return;
    }
    if (!userName.trim()) {
      setError('请输入姓名');
      return;
    }
    if (!phone.trim()) {
      setError('请输入手机号');
      return;
    }
    if (isZoneAvailable === false) {
      setError('该时段区域不可用，请选择其他时段或加入候补队列');
      return;
    }
    setError('');
    setShowConfirmModal(true);
  };

  const confirmBooking = async () => {
    if (!selectedZoneId) return;

    setBookingLoading(true);
    setError('');
    try {
      const booking = await bookingApi.createBooking({
        zoneId: selectedZoneId,
        userName,
        phone,
        date,
        startTime,
        endTime,
        peopleCount,
        equipment: selectedEquipment,
        memberId: selectedMember?.id,
        couponIds: selectedCouponIds.length > 0 ? selectedCouponIds : undefined,
        useBalance: selectedMember && selectedMember.balance > 0 ? useBalance : undefined,
      });
      setSuccess(`预约成功！预约号：${booking.id}`);
      setShowConfirmModal(false);
      loadBookings();

      setTimeout(() => {
        navigate('/bookings');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || '预约失败');
      setShowConfirmModal(false);
    } finally {
      setBookingLoading(false);
    }
  };

  const handleTimeSlotChange = (slotId: string) => {
    const slot = timeSlots.find((s) => s.id === slotId);
    if (slot) {
      setStartTime(slot.startTime);
      setEndTime(slot.endTime);
    }
  };

  const handleJoinWaitlist = () => {
    if (!selectedZoneId) {
      setError('请选择对战区域');
      return;
    }
    if (!userName.trim()) {
      setError('请输入姓名');
      return;
    }
    if (!phone.trim()) {
      setError('请输入手机号');
      return;
    }
    setError('');
    setShowWaitlistModal(true);
  };

  const confirmWaitlist = async () => {
    if (!selectedZoneId) return;

    setWaitlistSubmitting(true);
    setError('');
    try {
      const entry = await waitlistApi.addWaitlist({
        zoneId: selectedZoneId,
        memberId: selectedMember?.id,
        userName,
        phone,
        date,
        startTime,
        endTime,
        peopleCount,
        equipment: selectedEquipment,
        selectedCouponIds: selectedCouponIds.length > 0 ? selectedCouponIds : undefined,
      });
      setSuccess(`已加入候补队列！队列位置：#${entry.queuePosition}`);
      setShowWaitlistModal(false);

      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || '加入候补队列失败');
      setShowWaitlistModal(false);
    } finally {
      setWaitlistSubmitting(false);
    }
  };

  const selectedZone = zones.find((z) => z.id === selectedZoneId);
  const currentMemberLevelRule = selectedMember
    ? memberLevelRules.find((r) => r.level === selectedMember.level)
    : null;
  const estimatedAfterMemberDiscount = estimateAfterMemberDiscount();
  const showPremiumBanner = occupancyInfo && occupancyInfo.premiumMultiplier > 1;

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>🎯 预约对战场地</h2>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card" style={{ marginBottom: '20px' }}>
        <h3 className="section-title">👤 会员信息</h3>
        {!selectedMember ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="grid grid-2">
              <div className="form-group" style={{ margin: 0 }}>
                <label>手机号</label>
                <input
                  type="tel"
                  placeholder="请输入会员手机号查询"
                  value={memberPhone}
                  onChange={(e) => setMemberPhone(e.target.value)}
                />
              </div>
              {showMemberRegister && (
                <div className="form-group" style={{ margin: 0 }}>
                  <label>姓名</label>
                  <input
                    type="text"
                    placeholder="请输入姓名注册新会员"
                    value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                  />
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="btn btn-primary"
                onClick={showMemberRegister ? handleMemberRegister : handleMemberSearch}
                disabled={memberSearching}
                style={{ flex: showMemberRegister ? '1' : 'none' }}
              >
                {memberSearching
                  ? '处理中...'
                  : showMemberRegister
                  ? '注册新会员'
                  : '查询会员'}
              </button>
              {!showMemberRegister && (
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowMemberRegister(true);
                    setMemberName(userName);
                  }}
                >
                  注册新会员
                </button>
              )}
              {showMemberRegister && (
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowMemberRegister(false)}
                >
                  返回查询
                </button>
              )}
            </div>
            <p className="text-muted" style={{ fontSize: '12px', margin: 0 }}>
              使用会员可享受等级折扣、余额支付、专属优惠券等权益
            </p>
          </div>
        ) : (
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '16px',
                padding: '12px',
                backgroundColor: '#f7fafc',
                borderRadius: '8px',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 600, fontSize: '16px' }}>{selectedMember.name}</span>
                  {currentMemberLevelRule && (
                    <span
                      className="badge"
                      style={{
                        backgroundColor:
                          selectedMember.level === 'platinum'
                            ? '#e2e8f0'
                            : selectedMember.level === 'gold'
                            ? '#fefcbf'
                            : selectedMember.level === 'silver'
                            ? '#e2e8f0'
                            : '#c6f6d5',
                        color:
                          selectedMember.level === 'platinum'
                            ? '#1a202c'
                            : selectedMember.level === 'gold'
                            ? '#744210'
                            : selectedMember.level === 'silver'
                            ? '#4a5568'
                            : '#22543d',
                      }}
                    >
                      {currentMemberLevelRule.levelName}
                    </span>
                  )}
                  {currentMemberLevelRule && currentMemberLevelRule.discountRate < 1 && (
                    <span className="badge badge-success">
                      {(currentMemberLevelRule.discountRate * 100).toFixed(0)}% OFF
                    </span>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', fontSize: '13px' }}>
                  <div>
                    <span className="text-muted">手机号：</span>
                    <span>{selectedMember.phone}</span>
                  </div>
                  <div>
                    <span className="text-muted">余额：</span>
                    <span style={{ color: '#38a169', fontWeight: 600 }}>
                      ¥{selectedMember.balance.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted">累计消费：</span>
                    <span>¥{selectedMember.totalSpent.toFixed(2)}</span>
                  </div>
                  {currentMemberLevelRule && currentMemberLevelRule.discountRate < 1 && (
                    <div>
                      <span className="text-muted">会员折扣：</span>
                      <span style={{ color: '#38a169', fontWeight: 600 }}>
                        {(currentMemberLevelRule.discountRate * 100).toFixed(0)}% OFF
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <button className="btn btn-secondary" onClick={clearMember}>
                切换会员
              </button>
            </div>

            {selectedMember.balance > 0 && (
              <div
                style={{
                  marginTop: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <input
                  type="checkbox"
                  id="useBalance"
                  checked={useBalance}
                  onChange={(e) => setUseBalance(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label
                  htmlFor="useBalance"
                  style={{ cursor: 'pointer', fontSize: '14px', margin: 0 }}
                >
                  使用余额支付（当前余额：¥{selectedMember.balance.toFixed(2)}）
                </label>
              </div>
            )}
          </div>
        )}
      </div>

      {showPremiumBanner && (
        <div
          style={{
            padding: '12px 16px',
            marginBottom: '20px',
            backgroundColor: '#fffaf0',
            border: '1px solid #fbd38d',
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ color: '#c05621', fontWeight: 600 }}>
            🔥 本时段全场预约率达 {(occupancyInfo!.occupancyRate * 100).toFixed(0)}%
          </span>
          <span style={{ color: '#c05621', fontWeight: 700 }}>
            当前价格上浮 {((occupancyInfo!.premiumMultiplier - 1) * 100).toFixed(0)}%
          </span>
        </div>
      )}

      <div className="grid grid-2" style={{ gap: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <VenueMap
            zones={zones}
            selectedZoneId={selectedZoneId}
            onZoneSelect={setSelectedZoneId}
            date={date}
            startTime={startTime}
            endTime={endTime}
            bookings={bookings}
          />

          <EquipmentSelector
            equipmentList={equipmentList}
            selectedEquipment={selectedEquipment}
            onChange={setSelectedEquipment}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card">
            <h3 className="section-title">📅 预约信息</h3>

            <div className="form-group">
              <label>选择日期</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="form-group">
              <label>选择时段</label>
              <select
                value={timeSlots.find((s) => s.startTime === startTime)?.id || ''}
                onChange={(e) => handleTimeSlotChange(e.target.value)}
              >
                {timeSlots.map((slot) => (
                  <option key={slot.id} value={slot.id}>
                    {slot.name} ({slot.startTime} - {slot.endTime})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-2">
              <div className="form-group">
                <label>开始时间</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>结束时间</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>同行人数</label>
              <input
                type="number"
                min="1"
                max={selectedZone?.capacity || 30}
                value={peopleCount}
                onChange={(e) => setPeopleCount(Math.max(1, parseInt(e.target.value) || 1))}
              />
              {selectedZone && (
                <p style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                  场地容量：{selectedZone.capacity}人
                </p>
              )}
            </div>

            <DiscountTiers tiers={discountTiers} currentPeople={peopleCount} />

            {memberLevelRules.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', color: '#aaa', fontSize: '14px' }}>
                  🏆 会员等级折扣
                </label>
                <div className="discount-tiers">
                  {memberLevelRules.map((rule) => {
                    const isActive = selectedMember && selectedMember.level === rule.level;
                    return (
                      <div
                        key={rule.id}
                        className={`discount-tier ${isActive ? 'active' : ''}`}
                      >
                        {rule.levelName}
                        {rule.discountRate < 1
                          ? ` ${(rule.discountRate * 100).toFixed(0)}%OFF`
                          : ' 无折扣'}
                      </div>
                    );
                  })}
                </div>
                {!selectedMember && (
                  <p style={{ fontSize: '12px', color: '#888', marginTop: '8px' }}>
                    提示：登录/注册会员即可享受等级折扣
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="card">
            <h3 className="section-title">📝 联系人信息</h3>
            <div className="form-group">
              <label>姓名</label>
              <input
                type="text"
                placeholder="请输入您的姓名"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>手机号</label>
              <input
                type="tel"
                placeholder="请输入手机号"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          {selectedMember && (
            <CouponSelector
              coupons={memberCoupons}
              selectedIds={selectedCouponIds}
              onChange={setSelectedCouponIds}
              zoneId={selectedZoneId || undefined}
              date={date}
              startTime={startTime}
              endTime={endTime}
              currentAmountAfterMemberDiscount={estimatedAfterMemberDiscount}
              memberId={selectedMember.id}
            />
          )}

          <PriceBreakdownComponent priceData={priceData} loading={priceLoading} occupancyInfo={occupancyInfo || undefined} />

          {selectedZoneId && date && startTime && endTime && availabilityChecking && (
            <div className="alert alert-info">正在检查时段可用性...</div>
          )}

          {selectedZoneId && date && startTime && endTime && !availabilityChecking && isZoneAvailable === false && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="alert alert-warning">
                ⚠️ 该时段该区域已约满，可加入候补队列等待空位
              </div>
              <button
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '14px',
                  fontSize: '16px',
                  backgroundColor: '#dd6b20',
                }}
                onClick={handleJoinWaitlist}
              >
                📋 加入候补队列
              </button>
            </div>
          )}

          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px', fontSize: '16px' }}
            onClick={handleSubmit}
            disabled={!selectedZoneId || priceLoading || bookingLoading || isZoneAvailable === false}
          >
            {bookingLoading ? '提交中...' : '立即预约'}
          </button>
        </div>
      </div>

      {showConfirmModal && (
        <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>确认预约信息</h3>

            <div style={{ marginBottom: '20px' }}>
              <div className="price-row">
                <span className="text-muted">场地</span>
                <span>{selectedZone?.name}</span>
              </div>
              <div className="price-row">
                <span className="text-muted">日期</span>
                <span>{date}</span>
              </div>
              <div className="price-row">
                <span className="text-muted">时段</span>
                <span>
                  {startTime} - {endTime}
                </span>
              </div>
              <div className="price-row">
                <span className="text-muted">人数</span>
                <span>{peopleCount}人</span>
              </div>
              <div className="price-row">
                <span className="text-muted">联系人</span>
                <span>
                  {userName} ({phone})
                </span>
              </div>
              {selectedMember && (
                <div className="price-row">
                  <span className="text-muted">会员</span>
                  <span>
                    {selectedMember.name} ({currentMemberLevelRule?.levelName})
                  </span>
                </div>
              )}
              {selectedCouponIds.length > 0 && (
                <div className="price-row">
                  <span className="text-muted">使用优惠券</span>
                  <span style={{ color: '#38a169' }}>{selectedCouponIds.length}张</span>
                </div>
              )}
              {useBalance && selectedMember && (
                <div className="price-row">
                  <span className="text-muted">余额支付</span>
                  <span style={{ color: '#38a169' }}>
                    余额 ¥{selectedMember.balance.toFixed(2)}
                  </span>
                </div>
              )}
              {priceData && (
                <div className="price-row price-total">
                  <span>总计金额</span>
                  <span>¥{priceData.total.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="alert alert-info" style={{ marginBottom: '0' }}>
              ⚠️ 若距离开场不足2小时，将收取临时预留服务费
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowConfirmModal(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={confirmBooking} disabled={bookingLoading}>
                {bookingLoading ? '提交中...' : '确认预约'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showWaitlistModal && (
        <div className="modal-overlay" onClick={() => setShowWaitlistModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>加入候补队列</h3>

            <div style={{ marginBottom: '20px' }}>
              <div className="alert alert-warning" style={{ marginBottom: '16px' }}>
                📋 当前时段该区域已约满，加入候补队列后，如有空位将按顺序通知
              </div>

              <div className="price-row">
                <span className="text-muted">场地</span>
                <span>{selectedZone?.name}</span>
              </div>
              <div className="price-row">
                <span className="text-muted">日期</span>
                <span>{date}</span>
              </div>
              <div className="price-row">
                <span className="text-muted">时段</span>
                <span>
                  {startTime} - {endTime}
                </span>
              </div>
              <div className="price-row">
                <span className="text-muted">人数</span>
                <span>{peopleCount}人</span>
              </div>
              <div className="price-row">
                <span className="text-muted">联系人</span>
                <span>
                  {userName} ({phone})
                </span>
              </div>
              {selectedMember && (
                <div className="price-row">
                  <span className="text-muted">会员</span>
                  <span>
                    {selectedMember.name} ({currentMemberLevelRule?.levelName})
                  </span>
                </div>
              )}
              {selectedCouponIds.length > 0 && (
                <div className="price-row">
                  <span className="text-muted">使用优惠券</span>
                  <span style={{ color: '#38a169' }}>{selectedCouponIds.length}张</span>
                </div>
              )}

              <div
                className="price-row"
                style={{
                  marginTop: '12px',
                  paddingTop: '12px',
                  borderTop: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <span className="text-muted">预计计价说明</span>
                <span style={{ fontSize: '12px', color: '#a0aec0', textAlign: 'right' }}>
                  匹配成功后将根据当时的价格规则、会员折扣、优惠券重新计价
                </span>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowWaitlistModal(false)}>
                取消
              </button>
              <button
                className="btn btn-primary"
                onClick={confirmWaitlist}
                disabled={waitlistSubmitting}
              >
                {waitlistSubmitting ? '提交中...' : '确认加入候补'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BookingPage;
