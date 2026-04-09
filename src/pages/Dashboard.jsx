import React, { useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import { Users, AlertTriangle, IndianRupee, CheckCircle } from 'lucide-react';

const Dashboard = () => {
  const { data, activePgId, getRoomOccupants, addTransaction } = useAppData();
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(null);
  const [selectedRoomToShow, setSelectedRoomToShow] = useState(null);
  
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMode: data.paymentModes[0] || 'Cash',
    type: 'rent'
  });

  const activePg = data.pgs.find(p => p.id === activePgId);
  if (!activePg) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '16px', textAlign: 'center' }}>
      <div style={{ fontSize: '64px' }}>🏢</div>
      <h2>No PG Property Found</h2>
      <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', lineHeight: 1.6 }}>
        Your <strong>PGs sheet</strong> in Google Sheets is empty. Add at least one PG row and refresh.
      </p>
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '20px 28px', textAlign: 'left', fontSize: '14px', lineHeight: 2 }}>
        <strong>PGs Sheet — Row 1 headers:</strong><br />
        <code style={{ color: 'var(--accent-color)' }}>id &nbsp;&nbsp; name &nbsp;&nbsp; floors</code><br />
        <strong>Row 2 — your PG data:</strong><br />
        <code style={{ color: 'var(--accent-color)', fontSize: '12px' }}>pg-1 &nbsp;&nbsp; JR Luxury - HiTech City &nbsp;&nbsp; []</code>
      </div>
      <button className="btn btn-primary" onClick={() => window.location.reload()}>🔄 Refresh Page</button>
    </div>
  );

  // Calculate KPIs
  let totalRooms = 0;
  let occupiedCapacity = 0;
  let totalCapacity = 0;
  const roomStatuses = [];

  activePg.floors.forEach(floor => {
    floor.rooms.forEach(room => {
      totalRooms++;
      totalCapacity += room.capacity;
      const occupants = getRoomOccupants(room.roomId);
      occupiedCapacity += occupants.length;
      
      roomStatuses.push({
        ...room,
        floorNumber: floor.floorNumber,
        occupants: occupants,
        isVacant: occupants.length < room.capacity
      });
    });
  });

  const vacantBeds = totalCapacity - occupiedCapacity;

  // Find users who haven't paid this month's rent
  const today = new Date();
  const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  
  const pendingRentTenants = data.tenants
    .filter(t => t.pgId === activePgId && t.lastRentPaidMonth !== currentMonthStr)
    .sort((a, b) => a.roomId.localeCompare(b.roomId, undefined, { numeric: true, sensitivity: 'base' }));

  const scrollToRent = () => {
    document.getElementById('rent-management-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSavePayment = (e) => {
    e.preventDefault();
    if (showPaymentModal && paymentForm.amount) {
      addTransaction({
        tenantId: showPaymentModal.id,
        date: new Date().toISOString().split('T')[0],
        amount: Number(paymentForm.amount),
        type: paymentForm.type,
        paymentMode: paymentForm.paymentMode,
        pgId: activePgId,
        forMonth: currentMonthStr
      });
      setShowPaymentModal(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="text-secondary">Overview for {activePg.name}</p>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Occupancy KPI */}
        <div className="glass-panel kpi-card" onClick={() => setShowRoomModal(true)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="kpi-label">Current Occupants</span>
            <Users size={20} color="var(--accent-color)" />
          </div>
          <div className="kpi-value">{occupiedCapacity} <span style={{fontSize: '16px', color: 'var(--text-secondary)'}}>/ {totalCapacity}</span></div>
          <p className="text-secondary" style={{ fontSize: '13px' }}>Click to view room sheet</p>
        </div>

        {/* Vacancy KPI */}
        <div className="glass-panel kpi-card" onClick={() => setShowRoomModal(true)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="kpi-label">Vacant Beds</span>
            <span className="badge badge-success">Available</span>
          </div>
          <div className="kpi-value status-vacant">{vacantBeds}</div>
        </div>

        {/* Pending Rent KPI */}
        <div className="glass-panel kpi-card" onClick={scrollToRent}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="kpi-label">Pending Rent</span>
            <AlertTriangle size={20} color="var(--warning)" />
          </div>
          <div className="kpi-value status-pending">{pendingRentTenants.length}</div>
          <p className="text-secondary" style={{ fontSize: '13px' }}>Click to view details</p>
        </div>
      </div>

      <div id="rent-management-section" className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3>Rent Management</h3>
          <IndianRupee size={20} color="var(--text-secondary)" />
        </div>
        
        {pendingRentTenants.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
            All clear! Everyone has paid rent for {currentMonthStr}.
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Tenant Name</th>
                  <th>Room</th>
                  <th>Monthly Rent</th>
                  <th>Last Paid</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingRentTenants.map(t => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: '500' }}>{t.name}</td>
                    <td>{t.roomId}</td>
                    <td>₹{t.rentAmount}</td>
                    <td>
                      <span className="badge badge-danger">{t.lastRentPaidMonth || 'Never'}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                          Notify
                        </button>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '6px 12px', fontSize: '12px', borderColor: 'var(--success)', color: 'var(--success)' }}
                          onClick={() => {
                            setShowPaymentModal(t);
                            setPaymentForm(prev => ({...prev, amount: t.rentAmount}));
                          }}
                        >
                          <CheckCircle size={14} /> Log Pay
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showRoomModal && (
        <div className="modal-overlay" onClick={() => setShowRoomModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2>Room Occupancy Visulization</h2>
              <button className="btn btn-secondary" onClick={() => setShowRoomModal(false)}>Close</button>
            </div>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}><div style={{width: 12, height: 12, background: 'var(--success)', borderRadius: '50%'}}></div> Vacant</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}><div style={{width: 12, height: 12, background: 'var(--danger)', borderRadius: '50%'}}></div> Occupied</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}><div style={{width: 12, height: 12, background: 'var(--warning)', borderRadius: '50%'}}></div> Partial</div>
            </div>

            <div className="room-grid" style={{ padding: 0 }}>
              {roomStatuses.map((rs, idx) => {
                const filled = rs.occupants.length;
                let bgState = 'rgba(255, 255, 255, 0.05)';
                let borderState = 'var(--card-border)';
                let iconColor = 'var(--text-secondary)';

                if (filled === 0) {
                  borderState = 'var(--success)';
                  iconColor = 'var(--success)';
                } else if (filled < rs.capacity) {
                  borderState = 'var(--warning)';
                  iconColor = 'var(--warning)';
                } else {
                  borderState = 'var(--danger)';
                  iconColor = 'var(--danger)';
                }

                return (
                  <div 
                    key={idx} 
                    className="room-card" 
                    style={{ border: `1px solid ${borderState}`, cursor: 'pointer' }}
                    onClick={() => setSelectedRoomToShow(selectedRoomToShow?.roomId === rs.roomId ? null : rs)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <strong style={{ fontSize: '16px' }}>{rs.roomId}</strong>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Floor {rs.floorNumber}</span>
                    </div>
                    <div style={{ fontSize: '13px', marginBottom: '12px', textTransform: 'capitalize' }}>
                      {rs.type} Sharing
                    </div>
                    
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {Array.from({ length: rs.capacity }).map((_, i) => (
                        <div key={i} style={{ 
                          width: '8px', 
                          height: '24px', 
                          background: i < filled ? iconColor : 'transparent',
                          border: `1px solid ${iconColor}`,
                          borderRadius: '4px'
                        }}></div>
                      ))}
                    </div>
                    <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {filled} / {rs.capacity} filled
                    </div>
                    
                    {selectedRoomToShow?.roomId === rs.roomId && (
                      <div style={{ marginTop: '16px', borderTop: '1px solid var(--card-border)', paddingTop: '12px' }}>
                        <strong style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Occupants:</strong>
                        {filled > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                            {rs.occupants.map(occ => (
                              <div key={occ.id} style={{ fontSize: '13px' }}>
                                - {occ.name}
                              </div>
                            ))}
                          </div>
                        ) : (
                           <div style={{ fontSize: '13px', marginTop: '4px' }}>Empty</div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {showPaymentModal && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <h3 style={{ marginBottom: '8px' }}>Log Payment</h3>
            <p className="text-secondary" style={{ fontSize: '14px', marginBottom: '24px' }}>Record payment for {showPaymentModal.name} ({showPaymentModal.roomId})</p>
            
            <form onSubmit={handleSavePayment}>
              <div className="form-group">
                <label>Amount (₹)</label>
                <input 
                  type="number" 
                  value={paymentForm.amount} 
                  onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})}
                  required 
                />
              </div>
              <div className="form-group">
                <label>Payment Mode</label>
                <select 
                  value={paymentForm.paymentMode} 
                  onChange={e => setPaymentForm({...paymentForm, paymentMode: e.target.value})}
                >
                  {data.paymentModes.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Payment Type</label>
                <select 
                  value={paymentForm.type} 
                  onChange={e => setPaymentForm({...paymentForm, type: e.target.value})}
                >
                  <option value="rent">Rent - {currentMonthStr}</option>
                  <option value="advance">Advance</option>
                  <option value="security">Security Deposit</option>
                </select>
              </div>
              
              <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save</button>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowPaymentModal(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
