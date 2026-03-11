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
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }

  .reports-page { display: flex; background: #0a1929; min-height: 100vh; font-family: 'Inter', sans-serif; }
  .reports-content { margin-left: 240px; flex: 1; padding: 40px; animation: fadeInUp 0.4s ease; }

  .page-header {
    display: flex; justify-content: space-between; align-items: center;
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

  .btn-primary {
    padding: 11px 22px;
    background: linear-gradient(135deg, #00e5ff, #0091ea);
    border: none; border-radius: 10px;
    color: #001e3c; font-weight: 700;
    font-size: 13px; font-family: 'JetBrains Mono', monospace;
    cursor: pointer; letter-spacing: 0.04em;
    transition: opacity 0.2s, transform 0.15s;
    display: flex; align-items: center; gap: 8px;
  }
  .btn-primary:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
  .btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }

  /* Summary stats */
  .stats-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 28px;
  }
  .stat-card {
    background: #001e3c;
    border: 1px solid rgba(0,229,255,0.08);
    border-radius: 12px;
    padding: 18px;
    position: relative; overflow: hidden;
    animation: fadeInUp 0.4s ease backwards;
    transition: transform 0.2s, border-color 0.2s;
  }
  .stat-card:hover { transform: translateY(-2px); border-color: rgba(0,229,255,0.2); }
  .stat-top { position: absolute; top:0;left:0;right:0; height:2px; border-radius:12px 12px 0 0; }
  .stat-label { color:#546e7a; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.09em; margin-bottom:8px; }
  .stat-value { font-family:'JetBrains Mono',monospace; font-size:28px; font-weight:700; }

  /* Filter bar */
  .filter-bar { display:flex; gap:8px; margin-bottom:24px; flex-wrap:wrap; }
  .filter-pill {
    padding:7px 16px; border-radius:20px;
    font-size:11px; font-weight:700; cursor:pointer;
    border:1px solid rgba(0,229,255,0.18);
    background:transparent; color:#64b5f6;
    font-family:'JetBrains Mono',monospace;
    text-transform:uppercase; letter-spacing:.05em;
    transition:all 0.2s;
  }
  .filter-pill:hover { background:rgba(0,229,255,0.06); }
  .filter-pill.active { background:rgba(0,229,255,0.12); border-color:#00e5ff; color:#00e5ff; }

  /* Reports grid */
  .reports-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 18px;
    margin-bottom: 36px;
  }
  .report-card {
    background: linear-gradient(135deg, rgba(0,229,255,0.04), rgba(0,145,234,0.02));
    border: 1px solid rgba(0,229,255,0.1);
    border-radius: 14px;
    padding: 22px;
    transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
    animation: fadeInUp 0.4s ease backwards;
  }
  .report-card:hover {
    transform: translateY(-4px);
    border-color: rgba(0,229,255,0.22);
    box-shadow: 0 10px 32px rgba(0,0,0,0.3);
  }

  .report-card-header {
    display: flex; justify-content: space-between; align-items: flex-start;
    margin-bottom: 16px;
  }
  .report-card-id {
    font-family: 'JetBrains Mono', monospace;
    font-size: 15px; font-weight: 700; color: #00e5ff;
    margin: 0 0 3px;
  }
  .report-card-target {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px; color: #82b1ff;
  }

  .report-card-meta {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 8px; margin-bottom: 16px;
  }
  .meta-item { background: rgba(0,0,0,0.2); border-radius:7px; padding:8px 10px; }
  .meta-label { font-size:10px; color:#37474f; text-transform:uppercase; letter-spacing:.08em; margin-bottom:3px; }
  .meta-value { font-family:'JetBrains Mono',monospace; font-size:13px; color:#90caf9; font-weight:600; }

  .vuln-summary {
    display: flex; gap: 6px; margin-bottom: 16px; flex-wrap: wrap;
  }
  .vuln-chip {
    padding: 3px 9px; border-radius: 8px;
    font-size: 11px; font-weight: 700;
    font-family: 'JetBrains Mono', monospace;
  }
  .vc-c { background:rgba(255,77,77,0.15);  color:#ff4d4d; }
  .vc-h { background:rgba(255,167,38,0.15); color:#ffa726; }
  .vc-m { background:rgba(255,217,61,0.15); color:#ffd93d; }
  .vc-l { background:rgba(81,207,102,0.15); color:#51cf66; }

  .report-card-actions { display:flex; gap:8px; }
  .action-dl {
    flex:1; padding:9px;
    background:linear-gradient(135deg,#00e5ff,#0091ea);
    border:none; border-radius:8px;
    color:#001e3c; font-weight:700;
    font-size:12px; font-family:'JetBrains Mono',monospace;
    cursor:pointer;
    transition: opacity 0.2s;
    display:flex; align-items:center; justify-content:center; gap:6px;
  }
  .action-dl:hover:not(:disabled) { opacity:0.88; }
  .action-dl:disabled { opacity:0.45; cursor:not-allowed; }
  .action-view {
    padding:9px 14px;
    background:transparent;
    border:1px solid rgba(0,229,255,0.3);
    border-radius:8px; color:#00e5ff;
    font-size:12px; font-family:'JetBrains Mono',monospace;
    cursor:pointer;
    transition:background 0.2s;
  }
  .action-view:hover { background:rgba(0,229,255,0.08); }

  .spinner-sm {
    width:13px; height:13px;
    border:2px solid rgba(0,30,60,0.3);
    border-top-color:#001e3c;
    border-radius:50%;
    animation:spin 0.7s linear infinite;
  }

  /* Empty state */
  .empty-state {
    grid-column: 1/-1;
    text-align:center; padding:60px;
    background:linear-gradient(135deg,rgba(0,229,255,0.04),rgba(0,145,234,0.02));
    border:1px solid rgba(0,229,255,0.1);
    border-radius:14px; color:#37474f;
  }
  .empty-icon { font-size:40px; margin-bottom:14px; opacity:0.4; }
  .empty-title { color:#546e7a; font-size:16px; margin:0 0 6px; }
  .empty-sub { color:#263238; font-size:13px; margin:0; }

  /* Templates section */
  .section-title {
    color:#00e5ff; font-size:13px; font-weight:600;
    text-transform:uppercase; letter-spacing:.1em;
    margin:0 0 16px;
    display:flex; align-items:center; gap:8px;
  }
  .section-title::before { content:''; display:inline-block; width:3px; height:13px; background:#00e5ff; border-radius:2px; }

  .templates-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }
  .template-card {
    background:rgba(0,0,0,0.2);
    border:1px solid rgba(0,229,255,0.08);
    border-radius:12px; padding:20px;
    text-align:center;
    transition:border-color 0.2s, transform 0.2s;
  }
  .template-card:hover { border-color:rgba(0,229,255,0.2); transform:translateY(-2px); }
  .template-icon { font-size:28px; margin-bottom:10px; }
  .template-name { font-size:13px; font-weight:600; color:#e3f2fd; margin:0 0 5px; font-family:'JetBrains Mono',monospace; }
  .template-desc { font-size:11px; color:#546e7a; margin:0 0 12px; line-height:1.5; }
  .template-badge {
    display:inline-block; padding:3px 10px; border-radius:10px;
    font-size:10px; font-weight:700;
    background:rgba(84,110,122,0.15); color:#546e7a;
    border:1px solid rgba(84,110,122,0.2);
    font-family:'JetBrains Mono',monospace;
    letter-spacing:.05em;
  }

  .panel {
    background:linear-gradient(135deg,rgba(0,229,255,0.04),rgba(0,145,234,0.02));
    border:1px solid rgba(0,229,255,0.1);
    border-radius:16px; padding:24px;
  }
`;

export default function Reports() {
  const [scans,      setScans]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState('all');
  const [generating, setGenerating] = useState(null);
  const [vulnMap,    setVulnMap]    = useState({});

  useEffect(() => { loadScans(); }, []);

  const loadScans = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/scans');
      const items = Array.isArray(data) ? data : [];
      const completed = items.filter(s => s.status === 'completed');
      setScans(completed);

      // Load vuln counts for each scan
      const map = {};
      await Promise.allSettled(
        completed.map(async s => {
          try {
            const { data: vd } = await api.get(`/api/scan/${s.id}/vulnerabilities`);
            const vulns = vd.vulnerabilities || vd || [];
            const counts = { critical: 0, high: 0, medium: 0, low: 0 };
            vulns.forEach(v => {
              const sev = (v.severity || 'low').toLowerCase();
              if (counts[sev] !== undefined) counts[sev]++;
            });
            map[s.id] = { ...counts, total: vulns.length };
          } catch { map[s.id] = { critical:0, high:0, medium:0, low:0, total:0 }; }
        })
      );
      setVulnMap(map);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, []);

  const downloadPDF = async (scanId) => {
    setGenerating(scanId);
    try {
      const res = await api.get(`/api/scan/${scanId}/report/pdf`, { responseType: 'blob' });
      const url  = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `aegis_report_scan${scanId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`Report for Scan #${scanId} downloaded`);
    } catch {
      toast.error('PDF generation failed — check pdf_generator.py');
    } finally {
      setGenerating(null);
    }
  };

  const now = new Date();
  const thirtyDaysAgo = new Date(now); thirtyDaysAgo.setDate(now.getDate() - 30);
  const sevenDaysAgo  = new Date(now); sevenDaysAgo.setDate(now.getDate() - 7);

  const filtered = scans.filter(s => {
    const d = new Date(s.start_time);
    if (filter === 'week')   return d > sevenDaysAgo;
    if (filter === 'month')  return d > thirtyDaysAgo;
    if (filter === 'older')  return d <= thirtyDaysAgo;
    return true;
  });

  // Aggregate stats
  const totalVulns    = Object.values(vulnMap).reduce((a, v) => a + (v.total    || 0), 0);
  const totalCritical = Object.values(vulnMap).reduce((a, v) => a + (v.critical || 0), 0);
  const totalHigh     = Object.values(vulnMap).reduce((a, v) => a + (v.high     || 0), 0);

  const formatDate = (dt) => {
    if (!dt) return '—';
    const d = new Date(dt);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };
  const formatTime = (dt) => {
    if (!dt) return '—';
    return new Date(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  const duration = (s) => {
    if (!s.start_time || !s.end_time) return '—';
    const sec = Math.round((new Date(s.end_time) - new Date(s.start_time)) / 1000);
    if (sec < 60)  return `${sec}s`;
    if (sec < 3600) return `${Math.floor(sec/60)}m ${sec%60}s`;
    return `${Math.floor(sec/3600)}h ${Math.floor((sec%3600)/60)}m`;
  };

  return (
    <>
      <style>{styles}</style>
      <div className="reports-page">
        <Sidebar />
        <div className="reports-content">

          {/* Header */}
          <div className="page-header">
            <div>
              <h1 className="page-title">Reports Hub</h1>
              <p className="page-sub">{scans.length} completed scan{scans.length !== 1 ? 's' : ''} · {totalVulns} total vulnerabilities</p>
            </div>
            <button className="btn-primary" onClick={loadScans} disabled={loading}>
              {loading ? <><div className="spinner-sm" /> Loading</> : '↺ Refresh'}
            </button>
          </div>

          {/* Stats */}
          <div className="stats-row">
            {[
              { label: 'Total Reports',  value: scans.length,    color: '#00e5ff',  delay: '0s' },
              { label: 'Total Vulns',    value: totalVulns,      color: '#82b1ff',  delay: '0.08s' },
              { label: 'Critical Found', value: totalCritical,   color: '#ff4d4d',  delay: '0.16s' },
              { label: 'High Found',     value: totalHigh,       color: '#ffa726',  delay: '0.24s' },
            ].map((c, i) => (
              <div key={i} className="stat-card" style={{ animationDelay: c.delay }}>
                <div className="stat-top" style={{ background: c.color }} />
                <div className="stat-label">{c.label}</div>
                <div className="stat-value" style={{ color: c.color }}>{loading ? '—' : c.value}</div>
              </div>
            ))}
          </div>

          {/* Filter */}
          <div className="filter-bar">
            {[
              { key: 'all',   label: 'All Reports' },
              { key: 'week',  label: 'Last 7 Days' },
              { key: 'month', label: 'Last 30 Days' },
              { key: 'older', label: 'Older' },
            ].map(f => (
              <button
                key={f.key}
                className={`filter-pill ${filter === f.key ? 'active' : ''}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label} ({
                  f.key === 'all'   ? scans.length :
                  f.key === 'week'  ? scans.filter(s => new Date(s.start_time) > sevenDaysAgo).length :
                  f.key === 'month' ? scans.filter(s => new Date(s.start_time) > thirtyDaysAgo).length :
                  scans.filter(s => new Date(s.start_time) <= thirtyDaysAgo).length
                })
              </button>
            ))}
          </div>

          {/* Reports Grid */}
          <div className="reports-grid">
            {loading ? (
              <div className="empty-state">
                <div className="empty-icon" style={{ animation: 'pulse 1.5s infinite' }}>⏳</div>
                <p className="empty-title">Loading reports...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📄</div>
                <p className="empty-title">No reports found</p>
                <p className="empty-sub">Complete a scan to generate reports</p>
              </div>
            ) : filtered.map((scan, idx) => {
              const vc = vulnMap[scan.id] || {};
              return (
                <div key={scan.id} className="report-card" style={{ animationDelay: `${idx * 0.05}s` }}>
                  <div className="report-card-header">
                    <div>
                      <p className="report-card-id">Report #{scan.id}</p>
                      <p className="report-card-target">{scan.target}</p>
                    </div>
                    <span style={{
                      padding: '4px 10px', borderRadius: 20,
                      background: 'rgba(81,207,102,0.1)',
                      border: '1px solid rgba(81,207,102,0.25)',
                      color: '#51cf66', fontSize: 10, fontWeight: 700,
                      fontFamily: 'JetBrains Mono',
                    }}>
                      COMPLETED
                    </span>
                  </div>

                  <div className="report-card-meta">
                    <div className="meta-item">
                      <div className="meta-label">Date</div>
                      <div className="meta-value">{formatDate(scan.start_time)}</div>
                    </div>
                    <div className="meta-item">
                      <div className="meta-label">Time</div>
                      <div className="meta-value">{formatTime(scan.start_time)}</div>
                    </div>
                    <div className="meta-item">
                      <div className="meta-label">Mode</div>
                      <div className="meta-value">{(scan.mode || 'fast').toUpperCase()}</div>
                    </div>
                    <div className="meta-item">
                      <div className="meta-label">Duration</div>
                      <div className="meta-value">{duration(scan)}</div>
                    </div>
                  </div>

                  {/* Vuln summary chips */}
                  {vc.total > 0 ? (
                    <div className="vuln-summary">
                      {vc.critical > 0 && <span className="vuln-chip vc-c">{vc.critical} Critical</span>}
                      {vc.high     > 0 && <span className="vuln-chip vc-h">{vc.high} High</span>}
                      {vc.medium   > 0 && <span className="vuln-chip vc-m">{vc.medium} Medium</span>}
                      {vc.low      > 0 && <span className="vuln-chip vc-l">{vc.low} Low</span>}
                    </div>
                  ) : (
                    <div className="vuln-summary">
                      <span style={{ color: '#37474f', fontSize: 12, fontFamily: 'JetBrains Mono' }}>No vulnerabilities found</span>
                    </div>
                  )}

                  <div className="report-card-actions">
                    <button
                      className="action-dl"
                      onClick={() => downloadPDF(scan.id)}
                      disabled={generating === scan.id}
                    >
                      {generating === scan.id
                        ? <><div className="spinner-sm" /> Generating...</>
                        : '↓ Download PDF'
                      }
                    </button>
                    <button
                      className="action-view"
                      onClick={() => window.location.href = `/scans`}
                    >
                      View
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Report Templates */}
          <div className="panel">
            <div className="section-title">Report Templates</div>
            <div className="templates-grid">
              {[
                { icon: '📊', name: 'Executive Summary',  desc: 'High-level risk overview for management and stakeholders' },
                { icon: '🔬', name: 'Technical Details',   desc: 'Full vulnerability breakdown with CVEs and remediation steps' },
                { icon: '✅', name: 'Compliance Report',   desc: 'ISO 27001 / NIST / CIS Controls compliance status' },
              ].map((t, i) => (
                <div key={i} className="template-card">
                  <div className="template-icon">{t.icon}</div>
                  <p className="template-name">{t.name}</p>
                  <p className="template-desc">{t.desc}</p>
                  <span className="template-badge">COMING SOON</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}