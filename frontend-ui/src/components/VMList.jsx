import React, { useEffect, useState, useCallback } from 'react';
import Sidebar from './Sidebar';
import api from '../services/api';
import toast from 'react-hot-toast';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');

  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse-dot {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.3; }
  }

  .vml-page { display: flex; background: #0a1929; min-height: 100vh; font-family: 'Inter', sans-serif; }
  .vml-content { margin-left: 240px; flex: 1; padding: 40px; animation: fadeInUp 0.4s ease; }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32px;
    padding-bottom: 24px;
    border-bottom: 1px solid rgba(0,229,255,0.1);
  }
  .page-title {
    font-family: 'JetBrains Mono', monospace;
    font-size: 28px; font-weight: 700;
    background: linear-gradient(90deg, #00e5ff, #82b1ff, #fff);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: shimmer 4s linear infinite;
    margin: 0 0 4px;
  }
  .page-sub { color: #546e7a; font-size: 13px; margin: 0; }

  .header-actions { display: flex; gap: 10px; align-items: center; }
  .btn-primary {
    padding: 10px 20px;
    background: linear-gradient(135deg, #00e5ff, #0091ea);
    border: none; border-radius: 10px;
    color: #001e3c; font-weight: 700;
    font-size: 13px;
    font-family: 'JetBrains Mono', monospace;
    cursor: pointer;
    transition: opacity 0.2s, transform 0.15s;
  }
  .btn-primary:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn-secondary {
    padding: 10px 16px;
    background: transparent;
    border: 1px solid rgba(0,229,255,0.25);
    border-radius: 10px;
    color: #64b5f6; font-size: 13px;
    font-family: 'JetBrains Mono', monospace;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn-secondary:hover { background: rgba(0,229,255,0.06); border-color: rgba(0,229,255,0.4); }

  /* Summary cards */
  .summary-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 28px;
  }
  .summary-card {
    background: #001e3c;
    border: 1px solid rgba(0,229,255,0.08);
    border-radius: 14px;
    padding: 20px;
    position: relative;
    overflow: hidden;
    transition: transform 0.2s, border-color 0.2s;
    animation: fadeInUp 0.4s ease backwards;
  }
  .summary-card:hover { transform: translateY(-2px); border-color: rgba(0,229,255,0.2); }
  .summary-card-top {
    position: absolute; top: 0; left: 0; right: 0; height: 2px;
    border-radius: 14px 14px 0 0;
  }
  .summary-card-label { color: #546e7a; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.09em; margin-bottom: 8px; }
  .summary-card-value { font-family: 'JetBrains Mono', monospace; font-size: 34px; font-weight: 700; }

  /* Search + filter */
  .toolbar {
    display: flex; gap: 12px; align-items: center;
    margin-bottom: 24px; flex-wrap: wrap;
  }
  .search-input {
    flex: 1; min-width: 200px;
    padding: 10px 16px;
    background: rgba(0,0,0,0.25);
    border: 1px solid rgba(0,229,255,0.18);
    border-radius: 8px; color: #e3f2fd;
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px; outline: none;
    transition: border-color 0.2s;
  }
  .search-input:focus { border-color: #00e5ff; }
  .search-input::placeholder { color: #37474f; }
  .filter-pill {
    padding: 7px 14px; border-radius: 20px;
    font-size: 11px; font-weight: 700;
    cursor: pointer;
    border: 1px solid rgba(0,229,255,0.18);
    background: transparent; color: #64b5f6;
    font-family: 'JetBrains Mono', monospace;
    text-transform: uppercase; letter-spacing: 0.05em;
    transition: all 0.2s;
  }
  .filter-pill:hover { background: rgba(0,229,255,0.06); }
  .filter-pill.active { background: rgba(0,229,255,0.12); border-color: #00e5ff; color: #00e5ff; }

  /* Table panel */
  .panel {
    background: linear-gradient(135deg, rgba(0,229,255,0.04), rgba(0,145,234,0.02));
    border: 1px solid rgba(0,229,255,0.1);
    border-radius: 16px;
    padding: 24px;
  }
  .panel-title {
    color: #00e5ff; font-size: 13px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.1em;
    margin: 0 0 18px;
    display: flex; align-items: center; gap: 8px;
  }
  .panel-title::before {
    content: ''; display: inline-block;
    width: 3px; height: 13px;
    background: #00e5ff; border-radius: 2px;
  }

  .vm-table { width: 100%; border-collapse: collapse; }
  .vm-table th {
    color: #64b5f6; font-size: 11px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.08em;
    padding: 0 14px 12px; text-align: left;
    border-bottom: 1px solid rgba(0,229,255,0.1);
  }
  .vm-table td {
    padding: 13px 14px; font-size: 13px;
    color: #90caf9;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    font-family: 'JetBrains Mono', monospace;
  }
  .vm-table tr:hover td { background: rgba(0,229,255,0.03); cursor: pointer; }
  .vm-table tr:last-child td { border-bottom: none; }

  .risk-badge {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 4px 11px; border-radius: 20px;
    font-size: 11px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.05em;
  }
  .risk-CRITICAL { background: rgba(255,77,77,0.15);   color: #ff4d4d; border: 1px solid rgba(255,77,77,0.3); }
  .risk-HIGH     { background: rgba(255,167,38,0.15);  color: #ffa726; border: 1px solid rgba(255,167,38,0.3); }
  .risk-MEDIUM   { background: rgba(255,217,61,0.15);  color: #ffd93d; border: 1px solid rgba(255,217,61,0.3); }
  .risk-LOW      { background: rgba(81,207,102,0.15);  color: #51cf66; border: 1px solid rgba(81,207,102,0.3); }
  .risk-UNKNOWN  { background: rgba(144,164,174,0.12); color: #78909c; border: 1px solid rgba(144,164,174,0.2); }

  .vuln-bar { display: flex; align-items: center; gap: 4px; }
  .vuln-chip {
    padding: 2px 7px; border-radius: 6px;
    font-size: 10px; font-weight: 700;
    font-family: 'JetBrains Mono', monospace;
  }
  .vc-critical { background: rgba(255,77,77,0.15);   color: #ff4d4d; }
  .vc-high     { background: rgba(255,167,38,0.15);  color: #ffa726; }
  .vc-medium   { background: rgba(255,217,61,0.15);  color: #ffd93d; }
  .vc-low      { background: rgba(81,207,102,0.12);  color: #51cf66; }

  .status-dot {
    width: 7px; height: 7px; border-radius: 50%;
    display: inline-block; margin-right: 6px;
    animation: pulse-dot 2s infinite;
  }
  .dot-active   { background: #51cf66; }
  .dot-inactive { background: #546e7a; animation: none; }

  .action-btn {
    padding: 5px 11px; border-radius: 6px;
    font-size: 11px; cursor: pointer;
    font-family: 'JetBrains Mono', monospace;
    font-weight: 600; transition: all 0.2s;
    background: transparent; color: #00e5ff;
    border: 1px solid rgba(0,229,255,0.3);
    margin-right: 6px;
  }
  .action-btn:hover { background: rgba(0,229,255,0.1); }
  .action-btn.danger { color: #ff6b6b; border-color: rgba(255,107,107,0.3); }
  .action-btn.danger:hover { background: rgba(255,107,107,0.1); }

  /* Discovery bar */
  .discovery-bar {
    display: flex; gap: 10px; align-items: center;
    background: rgba(0,0,0,0.2);
    border: 1px solid rgba(0,229,255,0.12);
    border-radius: 10px;
    padding: 12px 16px;
    margin-bottom: 24px;
    flex-wrap: wrap;
  }
  .disc-label {
    font-size: 11px; font-weight: 600;
    color: #64b5f6; text-transform: uppercase;
    letter-spacing: 0.08em; white-space: nowrap;
  }
  .disc-input {
    flex: 1; min-width: 180px;
    padding: 8px 14px;
    background: rgba(0,0,0,0.3);
    border: 1px solid rgba(0,229,255,0.2);
    border-radius: 7px; color: #e3f2fd;
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px; outline: none;
    transition: border-color 0.2s;
  }
  .disc-input:focus { border-color: #00e5ff; }
  .disc-input::placeholder { color: #37474f; }

  /* Detail drawer */
  .detail-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.75);
    backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
    z-index: 9999; padding: 20px;
  }
  .detail-modal {
    background: linear-gradient(145deg, #0d1f30, #0a1929);
    border: 1px solid rgba(0,229,255,0.2);
    border-radius: 16px;
    padding: 28px;
    width: 100%; max-width: 860px;
    max-height: 88vh;
    overflow-y: auto;
  }
  .detail-modal::-webkit-scrollbar { width: 4px; }
  .detail-modal::-webkit-scrollbar-thumb { background: rgba(0,229,255,0.2); border-radius: 2px; }
  .detail-header { display: flex; justify-content: space-between; margin-bottom: 22px; }
  .detail-title { font-family: 'JetBrains Mono', monospace; font-size: 18px; color: #00e5ff; margin: 0 0 4px; }
  .detail-meta { color: #546e7a; font-size: 13px; }
  .detail-close {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    color: #90caf9; width: 30px; height: 30px;
    border-radius: 8px; cursor: pointer;
    font-size: 16px; display: flex; align-items: center; justify-content: center;
  }
  .detail-close:hover { background: rgba(255,107,107,0.15); color: #ff6b6b; }

  .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 22px; }
  .info-card { background: rgba(0,0,0,0.25); border: 1px solid rgba(0,229,255,0.08); border-radius: 10px; padding: 14px; }
  .info-label { font-size: 11px; color: #546e7a; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; }
  .info-value { font-family: 'JetBrains Mono', monospace; font-size: 14px; color: #e3f2fd; font-weight: 600; }

  .vuln-table { width: 100%; border-collapse: collapse; font-size: 12px; }
  .vuln-table th {
    color: #64b5f6; font-size: 10px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.08em;
    padding: 0 10px 10px; text-align: left;
    border-bottom: 1px solid rgba(0,229,255,0.1);
  }
  .vuln-table td {
    padding: 10px;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    font-family: 'JetBrains Mono', monospace;
    color: #90caf9;
  }
  .sev-badge { display: inline-block; padding: 3px 9px; border-radius: 10px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; }
  .sev-critical { background: rgba(255,77,77,0.15);  color: #ff4d4d; border: 1px solid rgba(255,77,77,0.3); }
  .sev-high     { background: rgba(255,167,38,0.15); color: #ffa726; border: 1px solid rgba(255,167,38,0.3); }
  .sev-medium   { background: rgba(255,217,61,0.15); color: #ffd93d; border: 1px solid rgba(255,217,61,0.3); }
  .sev-low      { background: rgba(81,207,102,0.15); color: #51cf66; border: 1px solid rgba(81,207,102,0.3); }
  .flag-tag { display: inline-block; padding: 2px 6px; border-radius: 5px; font-size: 10px; margin-left: 4px; }
  .flag-exploit  { background: rgba(255,77,77,0.15);  color: #ff6b6b; }
  .flag-misconfig{ background: rgba(255,167,38,0.15); color: #ffa726; }
  .flag-exposed  { background: rgba(0,229,255,0.1);   color: #00e5ff; }

  .empty-state { text-align: center; padding: 40px; color: #37474f; font-size: 14px; }
  .spinner { width: 20px; height: 20px; border: 2px solid rgba(0,229,255,0.2); border-top-color: #00e5ff; border-radius: 50%; animation: spin 0.8s linear infinite; }
`;

function getRiskLevel(vc) {
  if (vc.critical > 0) return 'CRITICAL';
  if (vc.high     > 0) return 'HIGH';
  if (vc.medium   > 0) return 'MEDIUM';
  if (vc.low      > 0) return 'LOW';
  return 'UNKNOWN';
}

export default function VMList() {
  const [vms,          setVms]          = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [riskFilter,   setRiskFilter]   = useState('all');
  const [selectedVM,   setSelectedVM]   = useState(null);
  const [vmVulns,      setVmVulns]      = useState([]);
  const [loadingVulns, setLoadingVulns] = useState(false);
  const [discovering,  setDiscovering]  = useState(false);
  const [network,      setNetwork]      = useState('192.168.1.0/24');

  useEffect(() => { loadVMs(); }, []);

  const loadVMs = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/vms');
      const list = data.vms || data || [];
      // Compute risk_level from vuln_counts if not set
      const enriched = list.map(vm => ({
        ...vm,
        risk_level: vm.risk_level || getRiskLevel(vm.vuln_counts || {}),
      }));
      setVms(enriched);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load assets');
    } finally {
      setLoading(false);
    }
  }, []);

  const openDetail = async (vm) => {
    setSelectedVM(vm);
    setVmVulns([]);
    setLoadingVulns(true);
    try {
      const { data } = await api.get(`/api/vm/${vm.id}/vulnerabilities`);
      setVmVulns(data.vulnerabilities || []);
    } catch { toast.error('Could not load vulnerabilities'); }
    finally { setLoadingVulns(false); }
  };

  const discover = async () => {
    if (!network.trim()) { toast.error('Enter a network CIDR'); return; }
    setDiscovering(true);
    try {
      const { data } = await api.post('/api/vm/discover', { network: network.trim() });
      toast.success(`Discovered ${data.total} new host(s)`);
      loadVMs();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Discovery failed');
    } finally {
      setDiscovering(false);
    }
  };

  const deleteVM = async (vmId, e) => {
    e.stopPropagation();
    if (!window.confirm('Remove this asset?')) return;
    try {
      await api.delete(`/api/vm/${vmId}`);
      toast.success('Asset removed');
      setVms(prev => prev.filter(v => v.id !== vmId));
    } catch { toast.error('Delete failed'); }
  };

  const filtered = vms.filter(vm => {
    const q = search.toLowerCase();
    const matchSearch =
      (vm.ip_address || '').toLowerCase().includes(q) ||
      (vm.hostname   || '').toLowerCase().includes(q) ||
      (vm.os         || '').toLowerCase().includes(q);
    const matchRisk = riskFilter === 'all' || (vm.risk_level || 'UNKNOWN') === riskFilter;
    return matchSearch && matchRisk;
  });

  const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, UNKNOWN: 0 };
  vms.forEach(vm => { counts[vm.risk_level || 'UNKNOWN'] = (counts[vm.risk_level || 'UNKNOWN'] || 0) + 1; });

  return (
    <>
      <style>{styles}</style>
      <div className="vml-page">
        <Sidebar />
        <div className="vml-content">

          {/* Header */}
          <div className="page-header">
            <div>
              <h1 className="page-title">Asset Inventory</h1>
              <p className="page-sub">{vms.length} assets discovered · {counts.CRITICAL + counts.HIGH} at risk</p>
            </div>
            <div className="header-actions">
              <button className="btn-secondary" onClick={loadVMs}>↺ Refresh</button>
            </div>
          </div>

          {/* Summary cards */}
          <div className="summary-grid">
            {[
              { label: 'Total Assets',    value: vms.length,         color: '#00e5ff',  delay: '0s' },
              { label: 'Critical Risk',   value: counts.CRITICAL,    color: '#ff4d4d',  delay: '0.1s' },
              { label: 'High Risk',       value: counts.HIGH,        color: '#ffa726',  delay: '0.2s' },
              { label: 'Clean Assets',    value: counts.LOW + counts.UNKNOWN, color: '#51cf66', delay: '0.3s' },
            ].map((c, i) => (
              <div key={i} className="summary-card" style={{ animationDelay: c.delay }}>
                <div className="summary-card-top" style={{ background: c.color }} />
                <div className="summary-card-label">{c.label}</div>
                <div className="summary-card-value" style={{ color: c.color }}>{c.value}</div>
              </div>
            ))}
          </div>

          {/* Network discovery bar */}
          <div className="discovery-bar">
            <span className="disc-label">◈ Discover</span>
            <input
              className="disc-input"
              value={network}
              onChange={e => setNetwork(e.target.value)}
              placeholder="192.168.1.0/24"
              disabled={discovering}
            />
            <button className="btn-primary" onClick={discover} disabled={discovering}>
              {discovering ? 'Scanning...' : '▶ Run Discovery'}
            </button>
          </div>

          {/* Toolbar */}
          <div className="toolbar">
            <input
              className="search-input"
              placeholder="Search by IP, hostname, OS..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {['all', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'UNKNOWN'].map(r => (
              <button
                key={r}
                className={`filter-pill ${riskFilter === r ? 'active' : ''}`}
                onClick={() => setRiskFilter(r)}
              >
                {r} ({r === 'all' ? vms.length : counts[r] || 0})
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="panel">
            <div className="panel-title">Discovered Assets ({filtered.length})</div>
            {loading ? (
              <div className="empty-state" style={{ display: 'flex', justifyContent: 'center' }}>
                <div className="spinner" />
              </div>
            ) : (
              <table className="vm-table">
                <thead>
                  <tr>
                    <th>IP Address</th>
                    <th>Hostname</th>
                    <th>OS</th>
                    <th>Risk Level</th>
                    <th>Vulnerabilities</th>
                    <th>Status</th>
                    <th>Last Seen</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={8} className="empty-state">
                      {vms.length === 0
                        ? 'No assets found — run a discovery scan above'
                        : 'No assets match the current filter'}
                    </td></tr>
                  ) : filtered.map(vm => {
                    const vc = vm.vuln_counts || {};
                    return (
                      <tr key={vm.id} onClick={() => openDetail(vm)}>
                        <td style={{ color: '#82b1ff', fontWeight: 600 }}>{vm.ip_address}</td>
                        <td style={{ color: '#e3f2fd' }}>{vm.hostname || '—'}</td>
                        <td style={{ color: '#64b5f6', fontSize: 12 }}>{vm.os || 'Unknown'}</td>
                        <td>
                          <span className={`risk-badge risk-${vm.risk_level || 'UNKNOWN'}`}>
                            {vm.risk_level || 'UNKNOWN'}
                          </span>
                        </td>
                        <td>
                          {vc.total > 0 ? (
                            <div className="vuln-bar">
                              {vc.critical > 0 && <span className="vuln-chip vc-critical">{vc.critical}C</span>}
                              {vc.high     > 0 && <span className="vuln-chip vc-high">{vc.high}H</span>}
                              {vc.medium   > 0 && <span className="vuln-chip vc-medium">{vc.medium}M</span>}
                              {vc.low      > 0 && <span className="vuln-chip vc-low">{vc.low}L</span>}
                            </div>
                          ) : (
                            <span style={{ color: '#37474f', fontSize: 12 }}>None</span>
                          )}
                        </td>
                        <td>
                          <span className={`status-dot ${vm.status === 'active' ? 'dot-active' : 'dot-inactive'}`} />
                          <span style={{ color: vm.status === 'active' ? '#51cf66' : '#546e7a', fontSize: 12 }}>
                            {vm.status || 'active'}
                          </span>
                        </td>
                        <td style={{ color: '#37474f', fontSize: 11 }}>
                          {vm.last_seen ? new Date(vm.last_seen).toLocaleDateString() : '—'}
                        </td>
                        <td onClick={e => e.stopPropagation()}>
                          <button className="action-btn" onClick={() => openDetail(vm)}>View</button>
                          <button className="action-btn danger" onClick={e => deleteVM(vm.id, e)}>✕</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

        </div>
      </div>

      {/* VM Detail Modal */}
      {selectedVM && (
        <div className="detail-overlay" onClick={e => e.target === e.currentTarget && setSelectedVM(null)}>
          <div className="detail-modal">
            <div className="detail-header">
              <div>
                <h3 className="detail-title">{selectedVM.ip_address} · {selectedVM.hostname || 'Unknown'}</h3>
                <p className="detail-meta">{selectedVM.os || 'Unknown OS'} · {selectedVM.os_family || ''}</p>
              </div>
              <button className="detail-close" onClick={() => setSelectedVM(null)}>×</button>
            </div>

            <div className="info-grid">
              {[
                { label: 'IP Address',  value: selectedVM.ip_address },
                { label: 'Hostname',    value: selectedVM.hostname || '—' },
                { label: 'OS',          value: selectedVM.os || 'Unknown' },
                { label: 'Risk Level',  value: selectedVM.risk_level || 'UNKNOWN' },
                { label: 'Status',      value: selectedVM.status || 'active' },
                { label: 'Total Vulns', value: vmVulns.length },
              ].map((item, i) => (
                <div key={i} className="info-card">
                  <div className="info-label">{item.label}</div>
                  <div className="info-value">{item.value}</div>
                </div>
              ))}
            </div>

            <div className="panel-title" style={{ marginBottom: 14 }}>
              Vulnerabilities ({vmVulns.length})
            </div>

            {loadingVulns ? (
              <div className="empty-state" style={{ display: 'flex', justifyContent: 'center' }}>
                <div className="spinner" />
              </div>
            ) : vmVulns.length === 0 ? (
              <div className="empty-state">No vulnerabilities found for this asset.</div>
            ) : (
              <table className="vuln-table">
                <thead>
                  <tr>
                    <th>Severity</th>
                    <th>Port/Service</th>
                    <th>CVSS</th>
                    <th>Risk</th>
                    <th>CVEs</th>
                    <th>Flags</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {vmVulns.map((v, i) => (
                    <tr key={i}>
                      <td>
                        <span className={`sev-badge sev-${(v.severity || 'unknown').toLowerCase()}`}>
                          {v.severity || 'unknown'}
                        </span>
                      </td>
                      <td style={{ color: '#e3f2fd' }}>{v.port ? `${v.port}/${v.service}` : v.service || '—'}</td>
                      <td style={{ color: v.cvss_score >= 9 ? '#ff4d4d' : '#90caf9' }}>{v.cvss_score ?? '—'}</td>
                      <td style={{ color: '#00e5ff', fontWeight: 700 }}>{v.risk_score ?? '—'}</td>
                      <td style={{ fontSize: 11 }}>
                        {v.cve_ids ? v.cve_ids.split(',').slice(0, 2).join(', ') : '—'}
                        {v.cve_count > 2 && ` +${v.cve_count - 2}`}
                      </td>
                      <td>
                        {v.exploit_available && <span className="flag-tag flag-exploit">EXPLOIT</span>}
                        {v.is_misconfigured  && <span className="flag-tag flag-misconfig">MISCONFIG</span>}
                        {v.internet_exposed  && <span className="flag-tag flag-exposed">EXPOSED</span>}
                      </td>
                      <td style={{ color: '#546e7a', fontSize: 11, maxWidth: 180 }}>
                        {(v.description || '—').slice(0, 80)}{v.description?.length > 80 ? '…' : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </>
  );
}