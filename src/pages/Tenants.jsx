import React, { useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import { Plus, Search, Info, Download, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { usePDF } from 'react-to-pdf';

const Tenants = () => {
  const { data, activePgId, saveTenant, getRoomOccupants } = useAppData();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTenant, setEditingTenant] = useState(null);

  const activePg = data.pgs.find(p => p.id === activePgId);
  if (!activePg) return <div>Please select or create a PG.</div>;

  const { toPDF, targetRef } = usePDF({filename: 'Tenants_List.pdf'});

  const currentTenants = data.tenants.filter(t => t.pgId === activePgId);
  const filteredTenants = currentTenants.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.roomId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddNew = () => {
    setEditingTenant({
      id: '',
      name: '',
      phone: '',
      address: '',
      aadhaar: '',
      gender: 'Male',
      occupation: '',
      pgId: activePgId,
      roomId: '',
      rentAmount: '',
      paymentCycle: 'monthly',
      advancePaid: '',
      securityDeposit: '',
      joinDate: new Date().toISOString().split('T')[0],
      checkoutDate: ''
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    // basic validation
    if (!editingTenant.name || !editingTenant.roomId) return;
    saveTenant({
      ...editingTenant,
      rentAmount: Number(editingTenant.rentAmount),
      advancePaid: Number(editingTenant.advancePaid),
      securityDeposit: Number(editingTenant.securityDeposit),
    });
    setEditingTenant(null);
  };

  // Build room dropdown lookup
  const availableRooms = [];
  activePg.floors.forEach(f => {
    f.rooms.forEach(r => {
      const occupants = getRoomOccupants(r.roomId);
      if (occupants.length < r.capacity) {
        availableRooms.push(r.roomId);
      }
    });
  });

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredTenants.map(t => ({
      Name: t.name,
      Phone: t.phone,
      Room: t.roomId,
      Gender: t.gender,
      Occupation: t.occupation,
      'Payment Cycle': t.paymentCycle,
      'Rent Amount': t.rentAmount,
      'Join Date': t.joinDate,
      'Checkout Date': t.checkoutDate || 'N/A'
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tenants");
    XLSX.writeFile(wb, "Tenants_Registry.xlsx");
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Tenants Registry</h1>
          <p className="text-secondary">Manage occupants for {activePg.name}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={() => toPDF()} title="Export PDF">
            <Download size={18} />
          </button>
          <button className="btn btn-secondary" onClick={exportToExcel} title="Export Excel">
            <FileSpreadsheet size={18} color="var(--success)" />
          </button>
          <button className="btn btn-primary" onClick={handleAddNew}>
            <Plus size={18} /> Add New Tenant
          </button>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <Search size={18} style={{ position: 'absolute', left: '16px', top: '14px', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              placeholder="Search by name or room number" 
              style={{ paddingLeft: '44px' }}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="table-container" ref={targetRef}>
          <table>
            <thead>
              <tr>
                <th>Profile</th>
                <th>Room</th>
                <th>Cycle</th>
                <th>Rent Amount</th>
                <th>Joining Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No tenants found.</td>
                </tr>
              ) : (
                filteredTenants.map(t => (
                  <tr key={t.id}>
                    <td>
                      <div style={{ fontWeight: '500' }}>{t.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Ph: {t.phone}</div>
                    </td>
                    <td>
                      <span className="badge" style={{ background: 'rgba(255,255,255,0.1)' }}>{t.roomId}</span>
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>{t.paymentCycle}</td>
                    <td>₹{t.rentAmount}</td>
                    <td>{new Date(t.joinDate).toLocaleDateString()}</td>
                    <td>
                      <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => setEditingTenant(t)}>
                        <Info size={14} style={{ marginRight: '4px' }} /> View/Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingTenant && (
        <div className="modal-overlay" onClick={() => setEditingTenant(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <h2>{editingTenant.id ? 'Edit Tenant Profile' : 'New Tenant Application'}</h2>
            <p className="text-secondary" style={{ marginBottom: '24px' }}>Please fill all required details carefully.</p>

            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Full Name *</label>
                  <input value={editingTenant.name} onChange={e => setEditingTenant({...editingTenant, name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Phone Number *</label>
                  <input value={editingTenant.phone} onChange={e => setEditingTenant({...editingTenant, phone: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Aadhaar Number</label>
                  <input value={editingTenant.aadhaar} onChange={e => setEditingTenant({...editingTenant, aadhaar: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select value={editingTenant.gender} onChange={e => setEditingTenant({...editingTenant, gender: e.target.value})}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Permanent Address</label>
                  <textarea value={editingTenant.address} onChange={e => setEditingTenant({...editingTenant, address: e.target.value})} rows="2" />
                </div>
                <div className="form-group">
                  <label>Occupation</label>
                  <input value={editingTenant.occupation} onChange={e => setEditingTenant({...editingTenant, occupation: e.target.value})} />
                </div>
                
                <div className="form-group">
                  <label>Room Assignment *</label>
                  <select value={editingTenant.roomId} onChange={e => setEditingTenant({...editingTenant, roomId: e.target.value})} required>
                    <option value="">Select available room</option>
                    {editingTenant.id && !availableRooms.includes(editingTenant.roomId) && (
                      <option value={editingTenant.roomId}>{editingTenant.roomId} (Current)</option>
                    )}
                    {availableRooms.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Payment Cycle</label>
                  <select value={editingTenant.paymentCycle} onChange={e => setEditingTenant({...editingTenant, paymentCycle: e.target.value})}>
                    <option value="monthly">Monthly</option>
                    <option value="daily">Daily (Temporary)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>{editingTenant.paymentCycle === 'daily' ? 'Check-in Date *' : 'Join Date *'}</label>
                  <input type="date" value={editingTenant.joinDate} onChange={e => setEditingTenant({...editingTenant, joinDate: e.target.value})} required />
                </div>
                {editingTenant.paymentCycle === 'daily' && (
                  <div className="form-group">
                    <label>Check-out Date</label>
                    <input type="date" value={editingTenant.checkoutDate || ''} onChange={e => setEditingTenant({...editingTenant, checkoutDate: e.target.value})} />
                  </div>
                )}

                <div className="form-group">
                  <label>Rent / Charge Amount (₹) *</label>
                  <input type="number" value={editingTenant.rentAmount} onChange={e => setEditingTenant({...editingTenant, rentAmount: e.target.value})} required />
                </div>

                <div className="form-group">
                  <label>Advance Paid (₹)</label>
                  <input type="number" value={editingTenant.advancePaid} onChange={e => setEditingTenant({...editingTenant, advancePaid: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Security Deposit (₹)</label>
                  <input type="number" value={editingTenant.securityDeposit} onChange={e => setEditingTenant({...editingTenant, securityDeposit: e.target.value})} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '32px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingTenant(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tenants;
