import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { venueApi, timeSlotApi, equipmentApi, discountApi, bookingApi } from '../services/api';
import type { VenueZone, TimeSlot, Equipment, BookingEquipment, PriceBreakdown, GroupDiscountTier, Booking } from '../types';
import VenueMap from '../components/VenueMap';
import PriceBreakdownComponent from '../components/PriceBreakdown';
import EquipmentSelector from '../components/EquipmentSelector';
import DiscountTiers from '../components/DiscountTiers';

function BookingPage() {
  const navigate = useNavigate();
  const [zones, setZones] = useState<VenueZone[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [discountTiers, setDiscountTiers] = useState<GroupDiscountTier[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  
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

  useEffect(() => {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    setDate(today.toISOString().split('T')[0]);
    
    loadData();
  }, []);

  useEffect(() => {
    loadBookings();
  }, [date]);

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

  useEffect(() => {
    if (selectedZoneId && date && startTime && endTime && peopleCount >= 1) {
      calculatePrice();
    } else {
      setPriceData(null);
    }
  }, [selectedZoneId, date, startTime, endTime, peopleCount, selectedEquipment]);

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

  const selectedZone = zones.find((z) => z.id === selectedZoneId);

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>🎯 预约对战场地</h2>
      
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      
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
          
          <PriceBreakdownComponent priceData={priceData} loading={priceLoading} />
          
          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px', fontSize: '16px' }}
            onClick={handleSubmit}
            disabled={!selectedZoneId || priceLoading || bookingLoading}
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
                <span>{startTime} - {endTime}</span>
              </div>
              <div className="price-row">
                <span className="text-muted">人数</span>
                <span>{peopleCount}人</span>
              </div>
              <div className="price-row">
                <span className="text-muted">联系人</span>
                <span>{userName} ({phone})</span>
              </div>
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
    </div>
  );
}

export default BookingPage;
