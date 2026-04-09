import React, { useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import { Plus, Edit2, Trash2 } from 'lucide-react';

const PGManagement = () => {
  const { data, savePg, deletePg } = useAppData();
  const [editingPg, setEditingPg] = useState(null);

  const handleAddNew = () => {
    setEditingPg({
      id: '',
      name: '',
      floors: []
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!editingPg.name) return;
    savePg(editingPg);
    setEditingPg(null);
  };

  const addFloor = () => {
    setEditingPg(prev => ({
      ...prev,
      floors: [...prev.floors, { floorNumber: prev.floors.length + 1, rooms: [] }]
    }));
  };

  const addRoom = (floorIndex) => {
    const newFloors = [...editingPg.floors];
    const roomId = prompt("Enter Room Number:") || `Room-${Date.now()}`;
    const type = prompt("Enter room type (single, double, triple):") || "double";
    let capacity = 2;
    if(type.toLowerCase() === 'single') capacity = 1;
    if(type.toLowerCase() === 'triple') capacity = 3;

    newFloors[floorIndex].rooms.push({ roomId, type, capacity });
    setEditingPg(prev => ({ ...prev, floors: newFloors }));
  };

  const removeRoom = (floorIndex, roomIndex) => {
    const newFloors = [...editingPg.floors];
    newFloors[floorIndex].rooms.splice(roomIndex, 1);
    setEditingPg(prev => ({ ...prev, floors: newFloors }));
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>PG Profiles</h1>
          <p className="text-secondary">Manage your PG properties, floors, and rooms</p>
        </div>
        <button className="btn btn-primary" onClick={handleAddNew}>
          <Plus size={18} /> New PG Property
        </button>
      </div>

      {editingPg ? (
        <div className="glass-panel" style={{ padding: '24px', marginBottom: '32px' }}>
          <form onSubmit={handleSave}>
            <h3>{editingPg.id ? 'Edit PG Property' : 'Add New PG Property'}</h3>
            <div className="form-group" style={{ marginTop: '20px' }}>
              <label>Property Name</label>
              <input 
                value={editingPg.name} 
                onChange={e => setEditingPg({...editingPg, name: e.target.value})}
                placeholder="e.g. JR LUXURY - Madhapur"
                autoFocus
              />
            </div>
            
            <div style={{ marginTop: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4>Floors Configuration</h4>
                <button type="button" className="btn btn-secondary" onClick={addFloor}>
                  + Add Floor
                </button>
              </div>

              {editingPg.floors.map((floor, fIdx) => (
                <div key={fIdx} className="glass-panel floor-card">
                  <div className="floor-header">
                    <strong>Floor {floor.floorNumber}</strong>
                    <button type="button" className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => addRoom(fIdx)}>
                      + Add Room
                    </button>
                  </div>
                  
                  {floor.rooms.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      No rooms on this floor yet.
                    </div>
                  ) : (
                    <div className="room-grid">
                      {floor.rooms.map((room, rIdx) => (
                        <div key={rIdx} className="room-card" style={{ position: 'relative' }}>
                          <button type="button" style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }} onClick={() => removeRoom(fIdx, rIdx)}>
                            <Trash2 size={16} />
                          </button>
                          <strong>{room.roomId}</strong>
                          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                            {room.type} sharing (Cap: {room.capacity})
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
              <button type="submit" className="btn btn-primary">Save Property</button>
              <button type="button" className="btn btn-secondary" onClick={() => setEditingPg(null)}>Cancel</button>
            </div>
          </form>
        </div>
      ) : null}

      {!editingPg && (
        <div className="dashboard-grid">
          {data.pgs.map((pg) => {
            const totalFloors = pg.floors.length;
            const totalRooms = pg.floors.reduce((acc, f) => acc + f.rooms.length, 0);
            const totalCapacity = pg.floors.reduce((acc, f) => acc + f.rooms.reduce((c, r) => c + r.capacity, 0), 0);
            
            return (
              <div key={pg.id} className="glass-panel kpi-card" style={{ position: 'relative' }}>
                 <div style={{ position: 'absolute', right: 24, top: 24, display: 'flex', gap: '8px' }}>
                   <Edit2 size={18} color="var(--text-secondary)" cursor="pointer" onClick={() => setEditingPg(pg)} />
                   <Trash2 size={18} color="var(--danger)" cursor="pointer" onClick={() => {
                     if(confirm('Are you sure you want to delete this property?')) deletePg(pg.id);
                   }} />
                 </div>
                 <h3 style={{ marginBottom: '16px', paddingRight: '40px' }}>{pg.name}</h3>
                 
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                     <span className="text-secondary">Total Floors:</span>
                     <strong>{totalFloors}</strong>
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                     <span className="text-secondary">Total Rooms:</span>
                     <strong>{totalRooms}</strong>
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                     <span className="text-secondary">Total Capacity (Beds):</span>
                     <strong>{totalCapacity}</strong>
                   </div>
                 </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  );
};

export default PGManagement;
