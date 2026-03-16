import React, { useEffect, useState, useCallback } from 'react';
import Sidebar from './Sidebar';
import api from '../services/api';
import toast from 'react-hot-toast';
 
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');
 
  @keyframes fadeInUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
  @keyframes spin { to{transform:rotate(360deg)} }
  @keyframes pulse-ring { 0%{box-shadow:0 0 0 0 rgba(0,229,255,0.3)} 70%{box-shadow:0 0 0 8px rgba(0,229,255,0)} 100%{box-shadow:0 0 0 0 rgba(0,229,255,0)} }
  @keyframes slideDown { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
 
  * { box-sizing: border-box; }
 
  .vuln-page { display:flex; background:#0a1929; min-height:100vh; font-family:'Inter',sans-serif; }
  .vuln-content { margin-left:240px; flex:1; padding:40px; animation:fadeInUp 0.5s ease; }
 
  .page-header {
    display:flex; justify-content:space-between; align-items:flex-start;
    margin-bottom:32px; padding-bottom:24px;
    border-bottom:1px solid rgba(0,229,255,0.1);
  }
  .page-title {
    font-family:'JetBrains Mono',monospace; font-size:28px; font-weight:700;
    background:linear-gradient(90deg,#00e5ff,#82b1ff,#fff);
    background-size:200% auto; -webkit-background-clip:text; -webkit-text-fill-color:transparent;
    animation:shimmer 4s linear infinite; margin:0 0 4px;
  }
  .page-sub { color:#546e7a; font-size:13px; margin:0; }
 
  .header-actions { display:flex; gap:10px; align-items:center; }
  .btn-refresh {
    padding:10px 18px; background:transparent;
    border:1px solid rgba(0,229,255,0.25); border-radius:10px;
    color:#64b5f6; font-size:12px; font-family:'JetBrains Mono',monospace;
    cursor:pointer; transition:all 0.2s;
  }
  .btn-refresh:hover { background:rgba(0,229,255,0.08); border-color:rgba(0,229,255,0.4); }
 
  /* Stats */
  .stats-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:14px; margin-bottom:28px; }
  .stat-card {
    background:linear-gradient(135deg,#001e3c,#0d2137);
    border:1px solid rgba(0,229,255,0.08); border-radius:14px;
    padding:20px; position:relative; overflow:hidden;
    transition:transform 0.2s,border-color 0.2s,box-shadow 0.2s;
    animation:fadeInUp 0.5s ease backwards; cursor:pointer;
  }
  .stat-card:hover { transform:translateY(-3px); border-color:rgba(0,229,255,0.22); box-shadow:0 8px 28px rgba(0,0,0,0.3); }
  .stat-card.active-filter { border-color:rgba(0,229,255,0.5); box-shadow:0 0 0 2px rgba(0,229,255,0.15); }
  .stat-top { position:absolute; top:0;left:0;right:0; height:3px; border-radius:14px 14px 0 0; }
  .stat-icon { position:absolute; top:16px;right:16px; font-size:18px; opacity:0.2; }
  .stat-label { color:#546e7a; font-size:10px; font-weight:600; text-transform:uppercase; letter-spacing:0.09em; margin-bottom:8px; }
  .stat-value { font-family:'JetBrains Mono',monospace; font-size:32px; font-weight:700; }
 
  /* Toolbar */
  .toolbar { display:flex; gap:10px; margin-bottom:20px; flex-wrap:wrap; align-items:center; }
  .search-wrap { flex:1; min-width:220px; position:relative; }
  .search-icon { position:absolute; left:12px; top:50%; transform:translateY(-50%); color:#37474f; font-size:14px; pointer-events:none; }
  .search-input {
    width:100%; padding:11px 16px 11px 36px;
    background:rgba(0,0,0,0.3); border:1px solid rgba(0,229,255,0.15);
    border-radius:10px; color:#e3f2fd;
    font-family:'JetBrains Mono',monospace; font-size:13px; outline:none;
    transition:border-color 0.2s,box-shadow 0.2s;
  }
  .search-input:focus { border-color:#00e5ff; box-shadow:0 0 0 3px rgba(0,229,255,0.08); }
  .search-input::placeholder { color:#37474f; }
 
  .sort-select {
    padding:11px 14px; background:rgba(0,0,0,0.3);
    border:1px solid rgba(0,229,255,0.15); border-radius:10px;
    color:#64b5f6; font-size:12px; font-family:'JetBrains Mono',monospace;
    outline:none; cursor:pointer;
  }
 
  .results-info { color:#546e7a; font-size:12px; font-family:'JetBrains Mono',monospace; white-space:nowrap; }
 
  /* Panel */
  .panel {
    background:linear-gradient(135deg,rgba(0,229,255,0.04),rgba(0,145,234,0.02));
    border:1px solid rgba(0,229,255,0.1); border-radius:16px; padding:24px;
  }
  .panel-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; }
  .panel-title {
    color:#00e5ff; font-size:13px; font-weight:600;
    text-transform:uppercase; letter-spacing:0.1em;
    display:flex; align-items:center; gap:8px; margin:0;
  }
  .panel-title::before { content:''; display:inline-block; width:3px; height:13px; background:#00e5ff; border-radius:2px; }
 
  /* Table */
  .table-wrap { overflow-x:auto; }
  .vuln-table { width:100%; border-collapse:collapse; min-width:900px; }
  .vuln-table th {
    color:#546e7a; font-size:10px; font-weight:600;
    text-transform:uppercase; letter-spacing:0.08em;
    padding:0 14px 14px; text-align:left;
    border-bottom:1px solid rgba(0,229,255,0.1);
    white-space:nowrap;
  }
  .vuln-table th.sortable { cursor:pointer; user-select:none; }
  .vuln-table th.sortable:hover { color:#00e5ff; }
  .vuln-table td {
    padding:13px 14px; font-size:12px; color:#90caf9;
    border-bottom:1px solid rgba(255,255,255,0.04);
    font-family:'JetBrains Mono',monospace;
    vertical-align:middle;
  }
  .vuln-table tr { transition:background 0.15s; }
  .vuln-table tr:hover td { background:rgba(0,229,255,0.04); cursor:pointer; }
  .vuln-table tr:last-child td { border-bottom:none; }
 
  /* Badges */
  .sev-badge {
    display:inline-block; padding:3px 10px; border-radius:10px;
    font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.05em;
  }
  .sev-critical { background:rgba(255,77,77,0.15);   color:#ff4d4d; border:1px solid rgba(255,77,77,0.3); }
  .sev-high     { background:rgba(255,167,38,0.15);  color:#ffa726; border:1px solid rgba(255,167,38,0.3); }
  .sev-medium   { background:rgba(255,217,61,0.15);  color:#ffd93d; border:1px solid rgba(255,217,61,0.3); }
  .sev-low      { background:rgba(81,207,102,0.15);  color:#51cf66; border:1px solid rgba(81,207,102,0.3); }
  .sev-unknown  { background:rgba(144,164,174,0.12); color:#90a4ae; border:1px solid rgba(144,164,174,0.25); }
 
  .cve-tag {
    display:inline-block; padding:2px 7px; border-radius:5px;
    font-size:10px; background:rgba(130,177,255,0.1);
    color:#82b1ff; margin-right:3px; border:1px solid rgba(130,177,255,0.2);
  }
 
  .flag-tag { display:inline-block; padding:2px 7px; border-radius:5px; font-size:10px; margin-right:3px; white-space:nowrap; }
  .flag-exploit   { background:rgba(255,77,77,0.12);   color:#ff6b6b; border:1px solid rgba(255,77,77,0.2); }
  .flag-misconfig { background:rgba(255,167,38,0.12);  color:#ffa726; border:1px solid rgba(255,167,38,0.2); }
  .flag-exposed   { background:rgba(0,229,255,0.08);   color:#00e5ff; border:1px solid rgba(0,229,255,0.15); }
 
  .risk-bar-wrap { display:flex; align-items:center; gap:8px; }
  .risk-bar-bg { width:60px; height:5px; background:rgba(255,255,255,0.06); border-radius:3px; overflow:hidden; }
  .risk-bar-fill { height:100%; border-radius:3px; }
 
  .remediation-select {
    padding:5px 10px; border-radius:7px; font-size:10px;
    background:rgba(0,0,0,0.3); border:1px solid rgba(0,229,255,0.2);
    color:#90caf9; cursor:pointer; outline:none;
    font-family:'JetBrains Mono',monospace;
  }
 
  /* Pagination */
  .pagination { display:flex; justify-content:space-between; align-items:center; margin-top:20px; padding-top:16px; border-top:1px solid rgba(255,255,255,0.04); }
  .page-btn {
    padding:7px 16px; border-radius:8px;
    border:1px solid rgba(0,229,255,0.2);
    background:transparent; color:#64b5f6;
    font-size:12px; cursor:pointer;
    font-family:'JetBrains Mono',monospace;
    transition:all 0.2s;
  }
  .page-btn:hover:not(:disabled) { background:rgba(0,229,255,0.08); border-color:rgba(0,229,255,0.4); }
  .page-btn:disabled { opacity:0.3; cursor:not-allowed; }
  .page-btns { display:flex; gap:6px; }
  .page-num {
    padding:7px 12px; border-radius:8px; font-size:12px;
    border:1px solid transparent; background:transparent;
    color:#546e7a; cursor:pointer; font-family:'JetBrains Mono',monospace;
    transition:all 0.2s;
  }
  .page-num.active { background:rgba(0,229,255,0.12); border-color:rgba(0,229,255,0.3); color:#00e5ff; }
  .page-num:hover:not(.active) { background:rgba(255,255,255,0.04); color:#90caf9; }
 
  /* Empty */
  .empty-state { text-align:center; padding:48px; color:#37474f; }
  .empty-icon { font-size:36px; margin-bottom:12px; opacity:0.4; }
 
  /* Loading */
  .spinner { width:24px; height:24px; border:2px solid rgba(0,229,255,0.2); border-top-color:#00e5ff; border-radius:50%; animation:spin 0.8s linear infinite; }
  .loading-wrap { display:flex; justify-content:center; padding:48px; }
 
  /* Detail Modal */
  .detail-overlay {
    position:fixed; inset:0; background:rgba(0,0,0,0.85);
    backdrop-filter:blur(6px); display:flex;
    align-items:center; justify-content:center;
    z-index:9999; padding:20px; animation:fadeInUp 0.2s ease;
  }
  .detail-modal {
    background:linear-gradient(145deg,#0d1f30,#0a1929);
    border:1px solid rgba(0,229,255,0.25); border-radius:18px;
    padding:32px; width:100%; max-width:740px;
    max-height:90vh; overflow-y:auto;
    animation:slideDown 0.25s ease;
  }
  .detail-modal::-webkit-scrollbar { width:4px; }
  .detail-modal::-webkit-scrollbar-thumb { background:rgba(0,229,255,0.2); border-radius:2px; }
  .detail-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; }
  .detail-title { font-family:'JetBrains Mono',monospace; font-size:18px; color:#00e5ff; margin:0 0 6px; }
  .detail-subtitle { color:#546e7a; font-size:12px; margin:0; }
  .detail-close {
    background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1);
    color:#90caf9; width:34px; height:34px; border-radius:10px;
    cursor:pointer; font-size:18px; display:flex; align-items:center; justify-content:center;
    flex-shrink:0; transition:all 0.2s;
  }
  .detail-close:hover { background:rgba(255,107,107,0.15); color:#ff6b6b; border-color:rgba(255,107,107,0.3); }
 
  .detail-badges { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:20px; }
  .detail-score-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:20px; }
  .score-box {
    background:rgba(0,0,0,0.25); border:1px solid rgba(0,229,255,0.08);
    border-radius:10px; padding:14px; text-align:center;
  }
  .score-box-label { color:#546e7a; font-size:10px; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:6px; }
  .score-box-value { font-family:'JetBrains Mono',monospace; font-size:22px; font-weight:700; }
 
  .detail-row { display:flex; justify-content:space-between; padding:11px 0; border-bottom:1px solid rgba(255,255,255,0.05); font-size:13px; }
  .detail-row:last-child { border-bottom:none; }
  .detail-row-label { color:#546e7a; }
  .detail-row-value { font-family:'JetBrains Mono',monospace; color:#e3f2fd; font-weight:600; text-align:right; max-width:400px; word-break:break-word; }
 
  .detail-section { margin-top:20px; }
  .detail-section-title {
    color:#00e5ff; font-size:12px; font-weight:600;
    text-transform:uppercase; letter-spacing:0.1em;
    margin-bottom:10px; display:flex; align-items:center; gap:6px;
  }
  .detail-section-title::before { content:''; display:inline-block; width:3px; height:11px; background:#00e5ff; border-radius:2px; }
  .description-box {
    background:rgba(0,0,0,0.25); border:1px solid rgba(0,229,255,0.08);
    border-radius:10px; padding:16px;
    font-size:13px; color:#90caf9; line-height:1.7;
    font-family:'Inter',sans-serif;
  }
  .cve-grid { display:flex; flex-wrap:wrap; gap:8px; }
  .cve-pill {
    padding:5px 12px; border-radius:8px; font-size:12px;
    background:rgba(130,177,255,0.1); color:#82b1ff;
    border:1px solid rgba(130,177,255,0.2);
    font-family:'JetBrains Mono',monospace;
  }
`;
 
const PAGE_SIZE = 20;
 
function sevClass(s) { return `sev-${(s||'unknown').toLowerCase()}`; }
 
function getRiskColor(score) {
  if (!score) return '#546e7a';
  if (score >= 80) return '#ff4d4d';
  if (score >= 50) return '#ffa726';
  if (score >= 25) return '#ffd93d';
  return '#51cf66';
}
 
export default function Vulnerabilities() {
  const [vulns,    setVulns]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('all');
  const [search,   setSearch]   = useState('');
  const [sortBy,   setSortBy]   = useState('risk_score');
  const [selected, setSelected] = useState(null);
  const [page,     setPage]     = useState(1);
 
  useEffect(() => { loadVulns(); }, []);
 
  const loadVulns = useCallback(async () => {
    setLoading(true);
    try {
      const { data: scanData } = await api.get('/api/scans');
      const scans = Array.isArray(scanData) ? scanData : [];
      const completed = scans.filter(s => s.status === 'completed');
 
      const results = await Promise.allSettled(
        completed.map(scan =>
          api.get(`/api/scan/${scan.id}/vulnerabilities`)
            .then(r => (r.data.vulnerabilities || r.data || []).map(v => ({
              ...v, target: scan.target, scan_id: scan.id,
            })))
        )
      );
 
      const all = results.filter(r => r.status === 'fulfilled').flatMap(r => r.value);
      const seen = new Set();
      const unique = all.filter(v => { if (seen.has(v.id)) return false; seen.add(v.id); return true; });
      setVulns(unique);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load vulnerabilities');
    } finally {
      setLoading(false);
    }
  }, []);
 
  const updateRemediation = async (vulnId, status) => {
    try {
      await api.patch(`/api/vulnerability/${vulnId}/remediate`, { remediation_status: status });
      setVulns(prev => prev.map(v => v.id === vulnId ? { ...v, remediation_status: status } : v));
      toast.success('Status updated');
    } catch { toast.error('Update failed'); }
  };
 
  const counts = { critical:0, high:0, medium:0, low:0, unknown:0 };
  vulns.forEach(v => { const s=(v.severity||'unknown').toLowerCase(); if(counts[s]!==undefined)counts[s]++; else counts.unknown++; });
  const exploitable = vulns.filter(v => v.exploit_available).length;
 
  const filtered = vulns
    .filter(v => {
      if (filter !== 'all' && (v.severity||'unknown').toLowerCase() !== filter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (v.description||'').toLowerCase().includes(q) ||
               (v.service||'').toLowerCase().includes(q) ||
               (v.target||'').toLowerCase().includes(q) ||
               (v.cve_ids||'').toLowerCase().includes(q) ||
               String(v.port||'').includes(q);
      }
      return true;
    })
    .sort((a,b) => {
      if (sortBy==='risk_score') return (b.risk_score||0)-(a.risk_score||0);
      if (sortBy==='cvss_score') return (b.cvss_score||0)-(a.cvss_score||0);
      if (sortBy==='severity') { const o={critical:4,high:3,medium:2,low:1}; return (o[(b.severity||'').toLowerCase()]||0)-(o[(a.severity||'').toLowerCase()]||0); }
      if (sortBy==='cve_count') return (b.cve_count||0)-(a.cve_count||0);
      return 0;
    });
 
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);
 
  const statCards = [
    { label:'Critical',    value:counts.critical,  color:'#ff4d4d', icon:'🔴', f:'critical' },
    { label:'High',        value:counts.high,       color:'#ffa726', icon:'🟠', f:'high'     },
    { label:'Medium',      value:counts.medium,     color:'#ffd93d', icon:'🟡', f:'medium'   },
    { label:'Low',         value:counts.low,        color:'#51cf66', icon:'🟢', f:'low'      },
    { label:'Exploitable', value:exploitable,       color:'#ff6b6b', icon:'⚡', f:'all'      },
  ];
 
  const pageNums = [];
  for (let i=Math.max(1,page-2); i<=Math.min(totalPages,page+2); i++) pageNums.push(i);
 
  return (
    <>
      <style>{styles}</style>
      <div className="vuln-page">
        <Sidebar />
        <div className="vuln-content">
 
          <div className="page-header">
            <div>
              <h1 className="page-title">Vulnerability Intelligence</h1>
              <p className="page-sub">{vulns.length} total · {exploitable} exploitable · {counts.critical} critical</p>
            </div>
            <div className="header-actions">
              <button className="btn-refresh" onClick={loadVulns}>↺ Refresh</button>
            </div>
          </div>
 
          {/* Stats — clickable to filter */}
          <div className="stats-grid">
            {statCards.map((c,i) => (
              <div key={i} className={`stat-card ${filter===c.f?'active-filter':''}`}
                style={{animationDelay:`${i*0.07}s`}}
                onClick={() => { setFilter(filter===c.f?'all':c.f); setPage(1); }}
              >
                <div className="stat-top" style={{background:c.color}} />
                <span className="stat-icon">{c.icon}</span>
                <div className="stat-label">{c.label}</div>
                <div className="stat-value" style={{color:c.color}}>{c.value}</div>
              </div>
            ))}
          </div>
 
          {/* Toolbar */}
          <div className="toolbar">
            <div className="search-wrap">
              <span className="search-icon">🔍</span>
              <input className="search-input"
                placeholder="Search CVE ID, service, port, target..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <select className="sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="risk_score">↓ Risk Score</option>
              <option value="cvss_score">↓ CVSS Score</option>
              <option value="severity">↓ Severity</option>
              <option value="cve_count">↓ CVE Count</option>
            </select>
            <span className="results-info">{filtered.length} results</span>
          </div>
 
          {/* Table */}
          <div className="panel">
            <div className="panel-header">
              <h2 className="panel-title">Vulnerabilities ({filtered.length})</h2>
            </div>
 
            {loading ? (
              <div className="loading-wrap"><div className="spinner" /></div>
            ) : (
              <>
                <div className="table-wrap">
                  <table className="vuln-table">
                    <thead>
                      <tr>
                        <th>Severity</th>
                        <th>Port / Service</th>
                        <th>Version</th>
                        <th>CVE IDs</th>
                        <th className="sortable" onClick={() => setSortBy('cvss_score')}>CVSS {sortBy==='cvss_score'?'↓':''}</th>
                        <th className="sortable" onClick={() => setSortBy('risk_score')}>Risk Score {sortBy==='risk_score'?'↓':''}</th>
                        <th>Target</th>
                        <th>Flags</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginated.length === 0 ? (
                        <tr><td colSpan={9}>
                          <div className="empty-state">
                            <div className="empty-icon">🛡️</div>
                            <p style={{color:'#546e7a',margin:0}}>No vulnerabilities match your filter</p>
                          </div>
                        </td></tr>
                      ) : paginated.map((v,i) => (
                        <tr key={v.id||i} onClick={() => setSelected(v)}>
                          <td><span className={`sev-badge ${sevClass(v.severity)}`}>{v.severity||'unknown'}</span></td>
                          <td style={{color:'#e3f2fd',fontWeight:600}}>
                            {v.port ? `${v.port}` : '—'}
                            {v.service && <span style={{color:'#64b5f6',fontWeight:400}}>/{v.service}</span>}
                          </td>
                          <td style={{color:'#546e7a',fontSize:11,maxWidth:120,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                            {v.version||'—'}
                          </td>
                          <td>
                            {v.cve_ids
                              ? v.cve_ids.split(',').slice(0,2).map((c,ci) => <span key={ci} className="cve-tag">{c.trim()}</span>)
                              : <span style={{color:'#37474f'}}>—</span>
                            }
                            {(v.cve_count||0) > 2 && <span style={{color:'#546e7a',fontSize:10}}> +{v.cve_count-2}</span>}
                          </td>
                          <td style={{color:v.cvss_score>=9?'#ff4d4d':v.cvss_score>=7?'#ffa726':'#90caf9',fontWeight:700}}>
                            {v.cvss_score!=null ? Number(v.cvss_score).toFixed(1) : '—'}
                          </td>
                          <td>
                            <div className="risk-bar-wrap">
                              <div className="risk-bar-bg">
                                <div className="risk-bar-fill" style={{
                                  width:`${Math.min(100, (v.risk_score||0))}%`,
                                  background:getRiskColor(v.risk_score),
                                }} />
                              </div>
                              <span style={{color:getRiskColor(v.risk_score),fontWeight:700,fontSize:11}}>
                                {v.risk_score!=null ? Math.round(v.risk_score) : '—'}
                              </span>
                            </div>
                          </td>
                          <td style={{color:'#64b5f6',fontSize:11}}>{v.target||`Scan #${v.scan_id}`}</td>
                          <td onClick={e=>e.stopPropagation()}>
                            {v.exploit_available && <span className="flag-tag flag-exploit">⚡EXPLOIT</span>}
                            {v.is_misconfigured  && <span className="flag-tag flag-misconfig">⚠MISCONFIG</span>}
                            {v.internet_exposed  && <span className="flag-tag flag-exposed">🌐EXPOSED</span>}
                          </td>
                          <td onClick={e=>e.stopPropagation()}>
                            <select className="remediation-select"
                              value={v.remediation_status||'open'}
                              onChange={e => updateRemediation(v.id, e.target.value)}
                            >
                              <option value="open">Open</option>
                              <option value="in_progress">In Progress</option>
                              <option value="resolved">Resolved ✓</option>
                              <option value="false_positive">False Positive</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
 
                {totalPages > 1 && (
                  <div className="pagination">
                    <span style={{color:'#546e7a',fontSize:12,fontFamily:'JetBrains Mono'}}>
                      Showing {(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE,filtered.length)} of {filtered.length}
                    </span>
                    <div className="page-btns">
                      <button className="page-btn" disabled={page===1} onClick={()=>setPage(1)}>«</button>
                      <button className="page-btn" disabled={page===1} onClick={()=>setPage(p=>p-1)}>‹</button>
                      {pageNums.map(n => (
                        <button key={n} className={`page-num ${page===n?'active':''}`} onClick={()=>setPage(n)}>{n}</button>
                      ))}
                      <button className="page-btn" disabled={page===totalPages} onClick={()=>setPage(p=>p+1)}>›</button>
                      <button className="page-btn" disabled={page===totalPages} onClick={()=>setPage(totalPages)}>»</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
 
        </div>
      </div>
 
      {/* Detail Modal */}
      {selected && (
        <div className="detail-overlay" onClick={e => e.target===e.currentTarget && setSelected(null)}>
          <div className="detail-modal">
            <div className="detail-header">
              <div>
                <h3 className="detail-title">
                  {selected.port ? `Port ${selected.port}` : ''}{selected.service ? ` / ${selected.service}` : ''} · {selected.target}
                </h3>
                <p className="detail-subtitle">Scan #{selected.scan_id} · {selected.version||'version unknown'}</p>
              </div>
              <button className="detail-close" onClick={()=>setSelected(null)}>×</button>
            </div>
 
            <div className="detail-badges">
              <span className={`sev-badge ${sevClass(selected.severity)}`}>{selected.severity||'unknown'}</span>
              {selected.exploit_available && <span className="flag-tag flag-exploit">⚡ EXPLOIT AVAILABLE</span>}
              {selected.is_misconfigured  && <span className="flag-tag flag-misconfig">⚠ MISCONFIGURED</span>}
              {selected.internet_exposed  && <span className="flag-tag flag-exposed">🌐 INTERNET EXPOSED</span>}
            </div>
 
            <div className="detail-score-grid">
              <div className="score-box">
                <div className="score-box-label">CVSS Score</div>
                <div className="score-box-value" style={{color:selected.cvss_score>=9?'#ff4d4d':selected.cvss_score>=7?'#ffa726':'#90caf9'}}>
                  {selected.cvss_score!=null ? Number(selected.cvss_score).toFixed(1) : 'N/A'}
                </div>
              </div>
              <div className="score-box">
                <div className="score-box-label">Risk Score</div>
                <div className="score-box-value" style={{color:getRiskColor(selected.risk_score)}}>
                  {selected.risk_score!=null ? Math.round(selected.risk_score) : 'N/A'}
                </div>
              </div>
              <div className="score-box">
                <div className="score-box-label">CVE Count</div>
                <div className="score-box-value" style={{color:'#82b1ff'}}>{selected.cve_count||0}</div>
              </div>
            </div>
 
            {[
              { label:'Port',     value: selected.port||'—' },
              { label:'Service',  value: selected.service||'—' },
              { label:'Version',  value: selected.version||'—' },
              { label:'Target',   value: selected.target||'—' },
              { label:'Remediation Status', value: selected.remediation_status||'open' },
            ].map((row,i) => (
              <div key={i} className="detail-row">
                <span className="detail-row-label">{row.label}</span>
                <span className="detail-row-value">{row.value}</span>
              </div>
            ))}
 
            {selected.cve_ids && (
              <div className="detail-section">
                <div className="detail-section-title">CVE References</div>
                <div className="cve-grid">
                  {selected.cve_ids.split(',').map((c,i) => (
                    <span key={i} className="cve-pill">{c.trim()}</span>
                  ))}
                </div>
              </div>
            )}
 
            <div className="detail-section">
              <div className="detail-section-title">Description</div>
              <div className="description-box">{selected.description||'No description available.'}</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}