import React, { useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import { Download, FileText, BarChart2, FileSpreadsheet } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { usePDF } from 'react-to-pdf';
import * as XLSX from 'xlsx';

const COLORS = ['#0071e3', '#34c759', '#ffcc00', '#ff3b30', '#af52de'];

const Reports = () => {
  const { data, activePgId } = useAppData();
  const [reportType, setReportType] = useState('monthly'); // 'monthly' or 'fy'
  const [selectedMonth, setSelectedMonth] = useState('2026-03');
  const [selectedTenantId, setSelectedTenantId] = useState('');

  const { toPDF, targetRef } = usePDF({filename: 'FY_Statement.pdf'});
  const { toPDF: toMonthlyPDF, targetRef: monthlyRef } = usePDF({filename: `Monthly_Report_${selectedMonth}.pdf`});

  const activePg = data.pgs.find(p => p.id === activePgId);
  const tenants = data.tenants.filter(t => t.pgId === activePgId);
  const transactions = data.transactions.filter(tx => tx.pgId === activePgId);

  // --- Compile Monthly Report ---
  const monthlyTx = transactions.filter(tx => tx.forMonth === selectedMonth || tx.date.startsWith(selectedMonth));
  const totalIncome = monthlyTx.reduce((sum, tx) => sum + tx.amount, 0);
  
  const incomeByModeObj = monthlyTx.reduce((acc, tx) => {
    acc[tx.paymentMode] = (acc[tx.paymentMode] || 0) + tx.amount;
    return acc;
  }, {});

  const chartData = Object.entries(incomeByModeObj).map(([name, value]) => ({ name, value }));

  const exportMonthlyExcel = () => {
    const dataObj = Object.entries(incomeByModeObj).map(([Mode, Amount]) => ({
      'Payment Mode': Mode,
      'Amount Received': Amount
    }));
    dataObj.push({ 'Payment Mode': 'TOTAL', 'Amount Received': totalIncome });

    const ws = XLSX.utils.json_to_sheet(dataObj);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "MonthlyReport");
    XLSX.writeFile(wb, `Monthly_Report_${selectedMonth}.xlsx`);
  };

  // --- Compile FY Report ---
  const selectedTenantTx = transactions.filter(tx => tx.tenantId === selectedTenantId);
  const tenantObj = tenants.find(t => t.id === selectedTenantId);

  const exportFYExcel = () => {
    if (!tenantObj) return;
    const dataObj = selectedTenantTx.map(tx => ({
      Date: new Date(tx.date).toLocaleDateString(),
      Type: tx.type,
      'For Month': tx.forMonth || '-',
      'Payment Mode': tx.paymentMode,
      'Amount': tx.amount
    }));
    const ws = XLSX.utils.json_to_sheet(dataObj);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Statement");
    XLSX.writeFile(wb, `FY_Statement_${tenantObj.name}.xlsx`);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Reporting Center</h1>
          <p className="text-secondary">Generate financial statements and overview</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px', marginBottom: '32px' }}>
        <div 
          className={`glass-panel ${reportType === 'monthly' ? 'active' : ''}`} 
          style={{ flex: 1, padding: '24px', cursor: 'pointer', border: reportType === 'monthly' ? '2px solid var(--accent-color)' : '' }}
          onClick={() => setReportType('monthly')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <BarChart2 size={24} color="var(--accent-color)" />
            <h3 style={{ margin: 0 }}>Monthly Overall PG Report</h3>
          </div>
          <p className="text-secondary" style={{ fontSize: '13px' }}>Total income aggregated by payment modes</p>
        </div>

        <div 
          className={`glass-panel ${reportType === 'fy' ? 'active' : ''}`} 
          style={{ flex: 1, padding: '24px', cursor: 'pointer', border: reportType === 'fy' ? '2px solid var(--accent-color)' : '' }}
          onClick={() => setReportType('fy')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <FileText size={24} color="var(--accent-color)" />
            <h3 style={{ margin: 0 }}>Tenant Indian FY Statement</h3>
          </div>
          <p className="text-secondary" style={{ fontSize: '13px' }}>Rent, advances, and deposits ledger</p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '32px' }}>
        {reportType === 'monthly' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <label style={{ fontWeight: '500' }}>Select Month (YYYY-MM):</label>
                <input 
                  type="month" 
                  value={selectedMonth} 
                  onChange={(e) => setSelectedMonth(e.target.value)} 
                  style={{ width: 'auto' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-secondary" onClick={() => toMonthlyPDF()}>
                  <Download size={16} /> Export PDF
                </button>
                <button className="btn btn-secondary" onClick={exportMonthlyExcel}>
                  <FileSpreadsheet size={16} color="var(--success)" /> Export Excel
                </button>
              </div>
            </div>

            <div ref={monthlyRef}>
              <div style={{ textAlign: 'center', marginBottom: '24px', display: 'none' }} className="print-header">
                <h2>{activePg?.name}</h2>
                <p>Monthly Income Report: {selectedMonth}</p>
              </div>
              <div className="dashboard-grid">
                <div className="glass-panel kpi-card" style={{ background: 'var(--success-bg)' }}>
                  <span className="kpi-label" style={{ color: 'var(--success)' }}>Total Income Generated</span>
                  <div className="kpi-value" style={{ color: 'var(--success)' }}>₹{totalIncome.toLocaleString()}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '32px', marginTop: '32px' }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ marginBottom: '16px' }}>Income By Payment Mode</h4>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Payment Mode</th>
                        <th>Total Amount Received (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.keys(incomeByModeObj).length === 0 ? (
                        <tr>
                          <td colSpan="2" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No transactions found for {selectedMonth}</td>
                        </tr>
                      ) : (
                        Object.entries(incomeByModeObj).map(([mode, amount]) => (
                          <tr key={mode}>
                            <td style={{ fontWeight: '500' }}>{mode}</td>
                            <td>₹{amount.toLocaleString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div style={{ flex: 1, height: '300px', display: 'flex', alignItems: 'center' }}>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={chartData} 
                        cx="50%" 
                        cy="50%" 
                        innerRadius={60}
                        outerRadius={100} 
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ width: '100%', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No data to chart
                  </div>
                )}
              </div>
            </div>
            </div>
          </div>
        )}

        {reportType === 'fy' && (
          <div>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '32px' }}>
              <label style={{ fontWeight: '500' }}>Select Tenant:</label>
              <select 
                value={selectedTenantId} 
                onChange={(e) => setSelectedTenantId(e.target.value)}
                style={{ maxWidth: '300px' }}
              >
                <option value="">-- Choose Tenant --</option>
                {tenants.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.roomId})</option>
                ))}
              </select>
            </div>

            {tenantObj ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '16px' }}>
                  <button className="btn btn-secondary" onClick={() => toPDF()}>
                    <Download size={16} /> Export PDF
                  </button>
                  <button className="btn btn-secondary" onClick={exportFYExcel}>
                    <FileSpreadsheet size={16} color="var(--success)" /> Export Excel
                  </button>
                </div>
                
                <div ref={targetRef} style={{ padding: '24px', background: 'var(--card-bg)', borderRadius: '12px' }}>
                  <div style={{ textAlign: 'center', marginBottom: '32px', borderBottom: '1px solid var(--card-border)', paddingBottom: '16px' }}>
                    <h2 style={{ margin: 0, color: 'var(--text-color)' }}>{tenantObj.brand || 'JR LUXURY'}</h2>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>FY Financial Statement</p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-color)' }}>{tenantObj.name}</h3>
                      <p className="text-secondary" style={{ margin: 0 }}>Room: {tenantObj.roomId} | Joined: {new Date(tenantObj.joinDate).toLocaleDateString()}</p>
                      <p className="text-secondary" style={{ margin: '4px 0 0 0' }}>Phone: {tenantObj.phone}</p>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '32px', margin: '32px 0', padding: '16px', background: 'rgba(0,113,227,0.1)', borderRadius: '8px' }}>
                    <div>
                      <div className="text-secondary" style={{ fontSize: '13px' }}>Current Rent</div>
                      <div style={{ fontWeight: '600', fontSize: '18px', color: 'var(--text-color)' }}>₹{tenantObj.rentAmount}/{tenantObj.paymentCycle}</div>
                    </div>
                    <div>
                      <div className="text-secondary" style={{ fontSize: '13px' }}>Security Deposit</div>
                      <div style={{ fontWeight: '600', fontSize: '18px', color: 'var(--text-color)' }}>₹{tenantObj.securityDeposit}</div>
                    </div>
                    <div>
                      <div className="text-secondary" style={{ fontSize: '13px' }}>Total Advance Pay</div>
                      <div style={{ fontWeight: '600', fontSize: '18px', color: 'var(--success)' }}>₹{tenantObj.advancePaid}</div>
                    </div>
                  </div>

                  <h4 style={{ color: 'var(--text-color)', marginBottom: '16px' }}>Transaction Ledger</h4>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Type</th>
                          <th>For Month/Period</th>
                          <th>Payment Mode</th>
                          <th>Amount (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTenantTx.length === 0 ? (
                          <tr>
                            <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No transactions recorded yet.</td>
                          </tr>
                        ) : (
                          selectedTenantTx.sort((a,b) => new Date(b.date) - new Date(a.date)).map(tx => (
                            <tr key={tx.id}>
                              <td>{new Date(tx.date).toLocaleDateString()}</td>
                              <td style={{ textTransform: 'capitalize' }}>
                                <span className={`badge ${tx.type === 'rent' ? 'badge-success' : 'badge-warning'}`}>
                                  {tx.type}
                                </span>
                              </td>
                              <td>{tx.forMonth || '-'}</td>
                              <td>{tx.paymentMode}</td>
                              <td style={{ fontWeight: '500', color: 'var(--text-color)' }}>₹{tx.amount.toLocaleString()}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                Please select a tenant to view their statement.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;