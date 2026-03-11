import React, { useEffect, useState, useCallback } from 'react';
import Sidebar from './Sidebar';
import ScanModal from './ScanModal';
import api from '../services/api';
import { initSocket } from '../services/socket';
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
  @keyframes pulse-dot {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.3; }
  }
  @keyframes progress-glow {
    from { background-position: -200% center; }
    to   { background-position:  200% center; }
  }

  .scans-page { display: flex; background: #0a1929; min-height: 100vh; font-family: 'Inter', sans-serif; }
  .scans-content { margin-left: 240px; flex: 1; padding: 40px; animation: fadeInUp 0.4s ease; }

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
    font-size: 28px;
    font-weight: 700;
    background: linear-gradient(90deg, #00e5ff, #82b1ff, #fff);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: shimmer 4s linear infinite;
    margin: 0 0 4px;
  }
  .page-sub { color: #546e7a; font-size: 13px; margin: 0; }

  .new-scan-btn {
    padding: 11px 22px;
    background: linear-gradient(135deg, #00e5ff, #0091ea);
    border: none;
    border-radius: 10px;
    color: #001e3c;
    font-weight: 700;
    font-size: 13px;
    font-family: 'JetBrains Mono', monospace;
    cursor: pointer;
    letter-spacing: 0.04em;
    transition: opacity 0.2s, transform 0.15s;
  }
  .new-scan-btn:hover { opacity: 0.88; transform: translateY(-1px); }

  /* Filter pills */
  .filter-bar {
    display: flex;
    gap: 8px;
    margin-bottom: 28px;
    flex-wrap: wrap;
  }
  .filter-pill {
    padding: 7px 16px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid rgba(0,229,255,0.2);
    background: transparent;
    color: #64b5f6;
    transition: all 0.2s;
    font-family: 'JetBrains Mono', monospace;
  }
  .filter-pill:hover { background: rgba(0,229,255,0.06); border-color: rgba(0,229,255,0.35); }
  .filter-pill.active {
    background: linear-gradient(135deg, rgba(0,229,255,0.15), rgba(0,145,234,0.1));
    border-color: #00e5ff;
    color: #00e5ff;
  }

  /* Active scans banner */
  .active-banner {
    background: linear-gradient(135deg, rgba(0,229,255,0.08), rgba(0,145,234,0.04));
    border: 1px solid rgba(0,229,255,0.25);
    border-radius: 14px;
    padding: 22px 24px;
    margin-bottom: 28px;
  }
  .active-banner-title {
    font-size: 13px;
    font-weight: 600;
    color: #00e5ff;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin: 0 0 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .running-dot {
    width: 7px; height: 7px;
    background: #00e5ff;
    border-radius: 50%;
    animation: pulse-dot 1.2s infinite;
  }
  .active-scan-card {
    background: rgba(0,0,0,0.2);
    border: 1px solid rgba(0,229,255,0.12);
    border-radius: 10px;
    padding: 14px 18px;
    margin-bottom: 10px;
  }
  .active-scan-card:last-child { margin-bottom: 0; }
  .active-scan-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }
  .active-scan-target {
    font-family: 'JetBrains Mono', monospace;
    font-size: 14px;
    color: #e3f2fd;
    font-weight: 600;
  }
  .active-scan-id { color: #546e7a; font-size: 12px; }
  .active-scan-phase {
    font-size: 12px;
    color: #64b5f6;
    display: flex; align-items: center; gap: 6px;
  }
  .active-scan-pct {
    font-family: 'JetBrains Mono', monospace;
    font-weight: 700;
    font-size: 18px;
    color: #00e5ff;
  }
  .progress-bar {
    height: 8px;
    background: rgba(0,0,0,0.35);
    border-radius: 4px;
    overflow: hidden;
  }
  .progress-fill {
    height: 100%;
    border-radius: 4px;
    background: linear-gradient(90deg, #00e5ff, #82b1ff, #00e5ff);
    background-size: 200% auto;
    animation: progress-glow 2s linear infinite;
    transition: width 0.5s ease;
  }

  /* Table panel */
  .panel {
    background: linear-gradient(135deg, rgba(0,229,255,0.04), rgba(0,145,234,0.02));
    border: 1px solid rgba(0,229,255,0.1);
    border-radius: 16px;
    padding: 24px;
  }
  .panel-title {
    color: #00e5ff;
    font-size: 13px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin: 0 0 20px;
    display: flex; align-items: center; gap: 8px;
  }
  .panel-title::before {
    content: '';
    display: inline-block;
    width: 3px; height: 13px;
    background: #00e5ff;
    border-radius: 2px;
  }
  .scans-table { width: 100%; border-collapse: collapse; }
  .scans-table th {
    color: #64b5f6;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    padding: 0 14px 12px;
    text-align: left;
    border-bottom: 1px solid rgba(0,229,255,0.1);
  }
  .scans-table td {
    padding: 13px 14px;
    font-size: 13px;
    color: #90caf9;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    font-family: 'JetBrains Mono', monospace;
  }
  .scans-table tr:hover td { background: rgba(0,229,255,0.03); }
  .scans-table tr:last-child td { border-bottom: none; }

  .status-pill {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 4px 11px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .status-pill.completed { background: rgba(81,207,102,0.12); color: #51cf66; border: 1px solid rgba(81,207,102,0.25); }
  .status-pill.running   { background: rgba(0,229,255,0.12);  color: #00e5ff; border: 1px solid rgba(0,229,255,0.25); }
  .status-pill.queued    { background: rgba(255,211,61,0.12);  color: #ffd93d; border: 1px solid rgba(255,211,61,0.25); }
  .status-pill.failed    { background: rgba(255,107,107,0.12); color: #ff6b6b; border: 1px solid rgba(255,107,107,0.25); }
  .status-pill.cancelled { background: rgba(144,164,174,0.12); color: #90a4ae; border: 1px solid rgba(144,164,174,0.25); }

  .inline-bar { display: flex; align-items: center; gap: 10px; }
  .mini-bar-bg { width: 80px; height: 5px; background: rgba(0,0,0,0.4); border-radius: 3px; overflow: hidden; }
  .mini-bar-fill { height: 100%; border-radius: 3px; background: linear-gradient(90deg, #00e5ff, #0091ea); transition: width 0.3s; }

  .action-btn {
    padding: 5px 12px;
    border-radius: 6px;
    font-size: 12px;
    cursor: pointer;
    font-family: 'JetBrains Mono', monospace;
    font-weight: 600;
    transition: all 0.2s;
  }
  .action-btn.view {
    background: transparent;
    color: #00e5ff;
    border: 1px solid rgba(0,229,255,0.35);
  }
  .action-btn.view:hover { background: rgba(0,229,255,0.1); }
  .action-btn.report {
    background: linear-gradient(135deg, #00e5ff, #0091ea);
    color: #001e3c;
    border: none;
    margin-left: 6px;
  }
  .action-btn.report:hover { opacity: 0.85; }

  /* Detail modal */
  .detail-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.8);
    backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
    z-index: 9999; padding: 20px;
  }
  .detail-modal {
    background: linear-gradient(145deg, #0d1f30, #0a1929);
    border: 1px solid rgba(0,229,255,0.2);
    border-radius: 16px;
    padding: 28px;
    width: 100%; max-width: 900px;
    max-height: 88vh;
    overflow-y: auto;
  }
  .detail-modal::-webkit-scrollbar { width: 4px; }
  .detail-modal::-webkit-scrollbar-thumb { background: rgba(0,229,255,0.2); border-radius: 2px; }
  .detail-header { display: flex; justify-content: space-between; margin-bottom: 24px; }
  .detail-title {
    font-family: 'JetBrains Mono', monospace;
    font-size: 18px; color: #00e5ff; margin: 0 0 4px;
  }
  .detail-meta { color: #546e7a; font-size: 13px; }
  .detail-close {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    color: #90caf9;
    width: 30px; height: 30px;
    border-radius: 8px; cursor: pointer;
    font-size: 16px; display: flex; align-items: center; justify-content: center;
  }
  .detail-close:hover { background: rgba(255,107,107,0.15); color: #ff6b6b; }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 24px;
  }
  .info-card {
    background: rgba(0,0,0,0.25);
    border: 1px solid rgba(0,229,255,0.08);
    border-radius: 10px;
    padding: 14px;
  }
  .info-card-label { font-size: 11px; color: #546e7a; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; }
  .info-card-value { font-family: 'JetBrains Mono', monospace; font-size: 14px; color: #e3f2fd; font-weight: 600; }

  .vuln-table { width: 100%; border-collapse: collapse; font-size: 12px; }
  .vuln-table th {
    color: #64b5f6; font-size: 10px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.08em;
    padding: 0 10px 10px; text-align: left;
    border-bottom: 1px solid rgba(0,229,255,0.1);
  }
  .vuln-table td {
    padding: 10px; color: #90caf9;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    font-family: 'JetBrains Mono', monospace;
  }
  .vuln-table tr:hover td { background: rgba(0,229,255,0.03); }

  .sev-badge {
    display: inline-block;
    padding: 3px 9px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .sev-critical { background: rgba(255,77,77,0.15);  color: #ff4d4d; border: 1px solid rgba(255,77,77,0.3); }
  .sev-high     { background: rgba(255,167,38,0.15); color: #ffa726; border: 1px solid rgba(255,167,38,0.3); }
  .sev-medium   { background: rgba(255,217,61,0.15); color: #ffd93d; border: 1px solid rgba(255,217,61,0.3); }
  .sev-low      { background: rgba(81,207,102,0.15); color: #51cf66; border: 1px solid rgba(81,207,102,0.3); }
  .sev-unknown  { background: rgba(144,164,174,0.15); color: #90a4ae; border: 1px solid rgba(144,164,174,0.3); }

  .flag-tag {
    display: inline-block;
    padding: 2px 7px;
    border-radius: 6px;
    font-size: 10px;
    margin-left: 4px;
  }
  .flag-exploit { background: rgba(255,77,77,0.15); color: #ff6b6b; }
  .flag-misconfig { background: rgba(255,167,38,0.15); color: #ffa726; }
  .flag-exposed  { background: rgba(0,229,255,0.1); color: #00e5ff; }

  .empty-state {
    text-align: center;
    padding: 40px;
    color: #37474f;
    font-size: 14px;
  }
`;

const STATUS_COLORS = {
  completed: 'completed',
  running:   'running',
  queued:    'queued',
  failed:    'failed',
  cancelled: 'cancelled',
};

function sevClass(s) {
  const v = (s || '').toLowerCase();
  return `sev-${v || 'unknown'}`;
}

export default function Scans() {
  const [scans,        setScans]        = useState([]);
  const [filter,       setFilter]       = useState('all');
  const [showModal,    setShowModal]    = useState(false);
  const [selectedScan, setSelectedScan] = useState(null);
  const [detailVulns,  setDetailVulns]  = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    loadScans();
    const socket = initSocket();
    socket.on('scan_update', (data) => {
      setScans(prev => prev.map(s =>
        s.id === data.scan_id
          ? { ...s, status: data.status, progress: data.progress, phase: data.phase }
          : s
      ));
      if (data.status === 'completed' || data.status === 'failed') {
        setTimeout(loadScans, 1200);
      }
    });
    return () => { socket.off('scan_update'); };
  }, []);

  const loadScans = useCallback(() => {
    api.get('/api/scans')
      .then(res => {
        const items = Array.isArray(res.data) ? res.data : [];
        setScans(items);
      })
      .catch(err => console.error(err));
  }, []);

  const viewDetail = async (scan) => {
    setSelectedScan(scan);
    setDetailVulns([]);
    setLoadingDetail(true);
    try {
      const { data } = await api.get(`/api/scan/${scan.id}/vulnerabilities`);
      setDetailVulns(data.vulnerabilities || data || []);
    } catch { toast.error('Could not load vulnerabilities'); }
    finally { setLoadingDetail(false); }
  };

  const downloadReport = async (scanId) => {
    try {
      const res = await api.get(`/api/scan/${scanId}/report/pdf`, { responseType: 'blob' });
      const url  = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `scan_${scanId}_report.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch { toast.error('Report not available'); }
  };

  const filtered = scans.filter(s => filter === 'all' || s.status === filter);
  const running  = scans.filter(s => s.status === 'running' || s.status === 'queued');

  const filterCounts = { all: scans.length };
  scans.forEach(s => { filterCounts[s.status] = (filterCounts[s.status] || 0) + 1; });

  return (
    <>
      <style>{styles}</style>
      <div className="scans-page">
        <Sidebar />
        <div className="scans-content">

          {/* Header */}
          <div className="page-header">
            <div>
              <h1 className="page-title">Scan Management</h1>
              <p className="page-sub">{scans.length} total scans · {running.length} active</p>
            </div>
            <button className="new-scan-btn" onClick={() => setShowModal(true)}>
              ▶ NEW SCAN
            </button>
          </div>

          {/* Filter bar */}
          <div className="filter-bar">
            {['all', 'running', 'queued', 'completed', 'failed'].map(f => (
              <button
                key={f}
                className={`filter-pill ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f.toUpperCase()} ({filterCounts[f] || 0})
              </button>
            ))}
          </div>

          {/* Active scans banner */}
          {running.length > 0 && (filter === 'all' || filter === 'running' || filter === 'queued') && (
            <div className="active-banner">
              <div className="active-banner-title">
                <span className="running-dot" />
                Active Scans ({running.length})
              </div>
              {running.map(scan => (
                <div key={scan.id} className="active-scan-card">
                  <div className="active-scan-top">
                    <div>
                      <div className="active-scan-target">
                        {scan.target}
                        <span className="active-scan-id"> · #{scan.id} · {scan.mode || 'fast'}</span>
                      </div>
                      <div className="active-scan-phase">
                        <span className="running-dot" />
                        {scan.phase || 'initialising...'}
                      </div>
                    </div>
                    <div className="active-scan-pct">{scan.progress}%</div>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${scan.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Scans table */}
          <div className="panel">
            <div className="panel-title">Scan History</div>
            <table className="scans-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Target</th>
                  <th>Mode</th>
                  <th>Status</th>
                  <th>Progress</th>
                  <th>Vulns</th>
                  <th>Started</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="empty-state">No scans found</td></tr>
                ) : filtered.map(scan => (
                  <tr key={scan.id}>
                    <td style={{ color: '#e3f2fd', fontWeight: 600 }}>#{scan.id}</td>
                    <td style={{ color: '#82b1ff' }}>{scan.target}</td>
                    <td style={{ color: '#64b5f6', textTransform: 'uppercase' }}>{scan.mode || 'fast'}</td>
                    <td>
                      <span className={`status-pill ${STATUS_COLORS[scan.status] || 'queued'}`}>
                        {scan.status}
                      </span>
                    </td>
                    <td>
                      <div className="inline-bar">
                        <div className="mini-bar-bg">
                          <div className="mini-bar-fill" style={{ width: `${scan.progress || 0}%` }} />
                        </div>
                        <span style={{ fontSize: 11 }}>{scan.progress || 0}%</span>
                      </div>
                    </td>
                    <td style={{ color: scan.critical_count > 0 ? '#ff4d4d' : '#90caf9' }}>
                      {scan.total_vulns || 0}
                      {scan.critical_count > 0 && (
                        <span style={{ color: '#ff4d4d', marginLeft: 4, fontSize: 11 }}>
                          ({scan.critical_count} crit)
                        </span>
                      )}
                    </td>
                    <td style={{ color: '#546e7a', fontSize: 12 }}>
                      {scan.start_time ? new Date(scan.start_time).toLocaleString() : '—'}
                    </td>
                    <td>
                      <button className="action-btn view" onClick={() => viewDetail(scan)}>View</button>
                      {scan.status === 'completed' && (
                        <button className="action-btn report" onClick={() => downloadReport(scan.id)}>PDF</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>

      {/* Scan Modal */}
      {showModal && (
        <ScanModal
          onClose={() => { setShowModal(false); loadScans(); }}
          onScanStarted={() => { loadScans(); }}
        />
      )}

      {/* Detail Modal */}
      {selectedScan && (
        <div className="detail-overlay" onClick={e => e.target === e.currentTarget && setSelectedScan(null)}>
          <div className="detail-modal">
            <div className="detail-header">
              <div>
                <h3 className="detail-title">Scan #{selectedScan.id} · {selectedScan.target}</h3>
                <p className="detail-meta">
                  {selectedScan.mode?.toUpperCase() || 'FAST'} mode ·{' '}
                  {selectedScan.start_time ? new Date(selectedScan.start_time).toLocaleString() : ''}
                </p>
              </div>
              <button className="detail-close" onClick={() => setSelectedScan(null)}>×</button>
            </div>

            <div className="info-grid">
              {[
                { label: 'Status',      value: selectedScan.status },
                { label: 'Progress',    value: `${selectedScan.progress || 0}%` },
                { label: 'Phase',       value: selectedScan.phase || '—' },
                { label: 'Total Vulns', value: selectedScan.total_vulns ?? detailVulns.length },
                { label: 'Critical',    value: selectedScan.critical_count || detailVulns.filter(v => v.severity === 'critical').length },
                { label: 'High',        value: selectedScan.high_count    || detailVulns.filter(v => v.severity === 'high').length },
              ].map((item, i) => (
                <div key={i} className="info-card">
                  <div className="info-card-label">{item.label}</div>
                  <div className="info-card-value">{item.value}</div>
                </div>
              ))}
            </div>

            <div className="panel-title" style={{ marginBottom: 14 }}>
              Vulnerabilities ({detailVulns.length})
            </div>

            {loadingDetail ? (
              <div className="empty-state">Loading vulnerabilities...</div>
            ) : detailVulns.length === 0 ? (
              <div className="empty-state">No vulnerabilities recorded for this scan.</div>
            ) : (
              <table className="vuln-table">
                <thead>
                  <tr>
                    <th>Severity</th>
                    <th>Port / Service</th>
                    <th>Version</th>
                    <th>CVEs</th>
                    <th>CVSS</th>
                    <th>Risk</th>
                    <th>Flags</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {detailVulns.map((v, i) => (
                    <tr key={i}>
                      <td><span className={`sev-badge ${sevClass(v.severity)}`}>{v.severity || 'unknown'}</span></td>
                      <td style={{ color: '#e3f2fd' }}>{v.port ? `${v.port}/${v.service || '?'}` : v.service || '—'}</td>
                      <td style={{ color: '#64b5f6', fontSize: 11 }}>{v.version || '—'}</td>
                      <td style={{ color: '#90caf9', fontSize: 11 }}>
                        {v.cve_ids
                          ? v.cve_ids.split(',').slice(0,2).map(c => c.trim()).join(', ')
                          : '—'}
                        {v.cve_count > 2 && ` +${v.cve_count - 2}`}
                      </td>
                      <td style={{ color: v.cvss_score >= 9 ? '#ff4d4d' : v.cvss_score >= 7 ? '#ffa726' : '#90caf9' }}>
                        {v.cvss_score ?? '—'}
                      </td>
                      <td style={{ color: '#00e5ff', fontWeight: 700 }}>{v.risk_score ?? '—'}</td>
                      <td>
                        {v.exploit_available  && <span className="flag-tag flag-exploit">EXPLOIT</span>}
                        {v.is_misconfigured   && <span className="flag-tag flag-misconfig">MISCONFIG</span>}
                        {v.internet_exposed   && <span className="flag-tag flag-exposed">EXPOSED</span>}
                      </td>
                      <td style={{ color: '#546e7a', fontSize: 11, maxWidth: 200 }}>
                        {(v.description || '—').slice(0, 100)}{v.description?.length > 100 ? '…' : ''}
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