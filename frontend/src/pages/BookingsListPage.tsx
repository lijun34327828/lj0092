import { useState, useEffect } from 'react';
import { bookingApi } from '../services/api';
import type { Booking } from '../types';

function BookingsListPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [refundInfo, setRefundInfo] = useState<{ refundAmount: number; refundRate: number; ruleName: string } | null>(null);
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [cancelling, setCancelling] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const data = await bookingApi.getBookings();
      setBookings(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (err) {
      console.error('加载预约失败', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = async (booking: Booking) => {
    setSelectedBooking(booking);
    try {
      const info = await bookingApi.getRefundInfo(booking.id);
      setRefundInfo(info);
    } catch (err) {
      console.error('获取退款信息失败', err);
    }
    setShowCancelModal(true);
  };

  const confirmCancel = async () => {
    if (!selectedBooking) return;
    
    setCancelling(true);
    try {
      const result = await bookingApi.cancelBooking(selectedBooking.id);
      setMessage({ type: 'success', text: `取消成功！退款金额：¥${result.refundInfo.refundAmount.toFixed(2)}` });
      setShowCancelModal(false);
      loadBookings();
      
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || '取消失败' });
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { class: string; text: string }> = {
      confirmed: { class: 'badge-confirmed', text: '已确认' },
      pending: { class: 'badge-pending', text: '待确认' },
      cancelled: { class: 'badge-cancelled', text: '已取消' },
      completed: { class: 'badge-completed', text: '已完成' },
    };
    const info = statusMap[status] || { class: '', text: status };
    return <span className={`badge ${info.class}`}>{info.text}</span>;
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
      <h2 style={{ marginBottom: '20px' }}>📋 我的预约</h2>
      
      {message && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}
      
      <div className="card">
        {bookings.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '40px 0', color: '#888' }}>
            暂无预约记录
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>预约号</th>
                <th>场地</th>
                <th>日期</th>
                <th>时段</th>
                <th>人数</th>
                <th>金额</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                    {booking.id.slice(0, 8)}...
                  </td>
                  <td>{booking.zoneId.replace('zone-', '')}区</td>
                  <td>{booking.date}</td>
                  <td>{booking.startTime} - {booking.endTime}</td>
                  <td>{booking.peopleCount}人</td>
                  <td className="text-primary">¥{booking.totalPrice.toFixed(2)}</td>
                  <td>{getStatusBadge(booking.status)}</td>
                  <td>
                    {booking.status === 'confirmed' && (
                      <button
                        className="btn btn-danger"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => handleCancelClick(booking)}
                      >
                        取消预约
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      {showCancelModal && selectedBooking && (
        <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>取消预约</h3>
            
            <div style={{ marginBottom: '20px' }}>
              <p style={{ marginBottom: '12px' }}>
                确定要取消以下预约吗？
              </p>
              <div className="price-row">
                <span className="text-muted">场地</span>
                <span>{selectedBooking.zoneId.replace('zone-', '')}区</span>
              </div>
              <div className="price-row">
                <span className="text-muted">日期</span>
                <span>{selectedBooking.date}</span>
              </div>
              <div className="price-row">
                <span className="text-muted">时段</span>
                <span>{selectedBooking.startTime} - {selectedBooking.endTime}</span>
              </div>
              <div className="price-row">
                <span className="text-muted">原金额</span>
                <span>¥{selectedBooking.totalPrice.toFixed(2)}</span>
              </div>
              {refundInfo && (
                <div className="price-row" style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <span className="text-warning">{refundInfo.ruleName}</span>
                  <span className="text-success">
                    退 ¥{refundInfo.refundAmount.toFixed(2)}
                    <span style={{ fontSize: '12px', color: '#888' }}>
                      ({(refundInfo.refundRate * 100).toFixed(0)}%)
                    </span>
                  </span>
                </div>
              )}
            </div>
            
            <div className="alert alert-warning" style={{ marginBottom: '0' }}>
              ⚠️ 取消后将按照退款规则退还相应金额
            </div>
            
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowCancelModal(false)}>
                再想想
              </button>
              <button className="btn btn-danger" onClick={confirmCancel} disabled={cancelling}>
                {cancelling ? '取消中...' : '确认取消'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BookingsListPage;
