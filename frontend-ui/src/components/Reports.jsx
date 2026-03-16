import React, { useEffect, useState, useCallback } from 'react';
import Sidebar from './Sidebar';
import api from '../services/api';
import toast from 'react-hot-toast';
 
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');
 
  @keyframes fadeInUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
  @keyframes spin { to{transform:rotate(360deg)} }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
 
  * { box-sizing:border-box; }
  .reports-page { display:flex; background:#0a1929; min-height:100vh; font-family:'Inter',sans-serif; }
  .reports-content { margin-left:240px; flex:1; padding:40px; animation:fadeInUp 0.5s ease; }
 
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
 
  .btn-refresh {
    padding:11px 20px; background:transparent;
    border:1px solid rgba(0,229,255,0.25); border-radius:10px;
    color:#64b5f6; font-size:12px; font-family:'JetBrains Mono',monospace;
    cursor:pointer; transition:all 0.2s; display:flex; align-items:center; gap:8px;
  }
  .btn-refresh:hover:not(:disabled) { background:rgba(0,229,255,0.08); border-color:rgba(0,229,255,0.4); }
  .btn-refresh:disabled { opacity:0.5; cursor:not-allowed; }
 
  /* Stats */
  .stats-row { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:28px; }
  .stat-card {
    background:linear-gradient(135deg,#001e3c,#0d2137);
    border:1px solid rgba(0,229,255,0.08); border-radius:14px;
    padding:20px; position:relative; overflow:hidden;
    animation:fadeInUp 0.5s ease backwards;
    transition:transform 0.2s,border-color 0.2s,box-shadow 0.2s;
  }
  .stat-card:hover { transform:translateY(-3px); border-color:rgba(0,229,255,0.2); box-shadow:0 8px 28px rgba(0,0,0,0.3); }
  .stat-top { position:absolute; top:0;left:0;right:0; height:3px; border-radius:14px 14px 0 0; }
  .stat-icon { position:absolute; top:16px;right:16px; font-size:20px; opacity:0.15; }
  .stat-label { color:#546e7a; font-size:10px; font-weight:600; text-transform:uppercase; letter-spacing:0.09em; margin-bottom:8px; }
  .stat-value { font-family:'JetBrains Mono',monospace; font-size:32px; font-weight:700; }
 
  /* Filter */
  .filter-bar { display:flex; gap:8px; margin-bottom:24px; flex-wrap:wrap; }
  .filter-pill {
    padding:8px 18px; border-radius:20px;
    font-size:11px; font-weight:700; cursor:pointer;
    border:1px solid rgba(0,229,255,0.15);
    background:transparent; color:#546e7a;
    font-family:'JetBrains Mono',monospace;
    text-transform:uppercase; letter-spacing:0.05em;
    transition:all 0.2s;
  }
  .filter-pill:hover { background:rgba(0,229,255,0.06); color:#64b5f6; }
  .filter-pill.active { background:rgba(0,229,255,0.12); border-color:#00e5ff; color:#00e5ff; }
 
  /* Grid */
  .reports-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(340px,1fr)); gap:18px; margin-bottom:36px; }
 
  .report-card {
    background:linear-gradient(135deg,rgba(0,229,255,0.04),rgba(0,145,234,0.02));
    border:1px solid rgba(0,229,255,0.1); border-radius:16px; padding:24px;
    transition:transform 0.2s,border-color 0.2s,box-shadow 0.2s;
    animation:fadeInUp 0.5s ease backwards; position:relative; overflow:hidden;
  }
  .report-card::after {
    content:''; position:absolute; top:-40px;right:-40px;
    width:100px; height:100px;
    background:radial-gradient(circle,rgba(0,229,255,0.04),transparent 70%);
    pointer-events:none;
  }
  .report-card:hover { transform:translateY(-4px); border-color:rgba(0,229,255,0.22); box-shadow:0 12px 36px rgba(0,0,0,0.35); }
 
  .card-top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:18px; }
  .card-id { font-family:'JetBrains Mono',monospace; font-size:16px; font-weight:700; color:#00e5ff; margin:0 0 4px; }
  .card-target { font-family:'JetBrains Mono',monospace; font-size:13px; color:#82b1ff; margin:0; }
  .status-badge {
    padding:4px 12px; border-radius:20px;
    font-size:10px; font-weight:700; letter-spacing:0.06em;
    font-family:'JetBrains Mono',monospace; white-space:nowrap; flex-shrink:0;
  }
 
  .card-meta { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:16px; }
  .meta-item { background:rgba(0,0,0,0.2); border-radius:8px; padding:10px 12px; }
  .meta-label { font-size:9px; color:#37474f; text-transform:uppercase; letter-spacing:0.09em; margin-bottom:4px; }
  .meta-value { font-family:'JetBrains Mono',monospace; font-size:13px; color:#90caf9; font-weight:600; }
 
  /* Severity bar */
  .sev-bar { margin-bottom:16px; }
  .sev-bar-label { font-size:10px; color:#546e7a; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:8px; }
  .sev-bar-track { height:6px; background:rgba(255,255,255,0.05); border-radius:3px; overflow:hidden; display:flex; }
  .sev-bar-seg { height:100%; transition:width 0.5s ease; }
 
  .vuln-chips { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:16px; }
  .vuln-chip { padding:4px 10px; border-radius:8px; font-size:11px; font-weight:700; font-family:'JetBrains Mono',monospace; }
  .vc-c { background:rgba(255,77,77,0.15);   color:#ff4d4d; }
  .vc-h { background:rgba(255,167,38,0.15);  color:#ffa726; }
  .vc-m { background:rgba(255,217,61,0.15);  color:#ffd93d; }
  .vc-l { background:rgba(81,207,102,0.15);  color:#51cf66; }
 
  .card-actions { display:flex; gap:8px; }
  .btn-download {
    flex:1; padding:10px;
    background:linear-gradient(135deg,#00e5ff,#0091ea);
    border:none; border-radius:9px;
    color:#001e3c; font-weight:700; font-size:12px;
    font-family:'JetBrains Mono',monospace;
    cursor:pointer; transition:opacity 0.2s,transform 0.15s;
    display:flex; align-items:center; justify-content:center; gap:7px;
  }
  .btn-download:hover:not(:disabled) { opacity:0.88; transform:translateY(-1px); }
  .btn-download:disabled { opacity:0.45; cursor:not-allowed; }
  .btn-view {
    padding:10px 16px; background:transparent;
    border:1px solid rgba(0,229,255,0.25); border-radius:9px;
    color:#00e5ff; font-size:12px; font-family:'JetBrains Mono',monospace;
    cursor:pointer; transition:background 0.2s;
  }
  .btn-view:hover { background:rgba(0,229,255,0.08); }
 
  .spinner-sm { width:12px; height:12px; border:2px solid rgba(0,30,60,0.3); border-top-color:#001e3c; border-radius:50%; animation:spin 0.7s linear infinite; }
 
  /* Empty */
  .empty-card {
    grid-column:1/-1; text-align:center; padding:64px;
    background:linear-gradient(135deg,rgba(0,229,255,0.03),rgba(0,145,234,0.01));
    border:1px dashed rgba(0,229,255,0.15); border-radius:16px;
  }
  .empty-icon { font-size:44px; margin-bottom:16px; opacity:0.35; }
  .empty-title { color:#546e7a; font-size:16px; font-weight:600; margin:0 0 8px; font-family:'JetBrains Mono',monospace; }
  .empty-sub { color:#37474f; font-size:13px; margin:0; }
 
  /* Templates */
  .section-panel { background:linear-gradient(135deg,rgba(0,229,255,0.04),rgba(0,145,234,0.02)); border:1px solid rgba(0,229,255,0.1); border-radius:16px; padding:24px; }
  .section-title { color:#00e5ff; font-size:13px; font-weight:600; text-transform:uppercase; letter-spacing:0.1em; margin:0 0 18px; display:flex; align-items:center; gap:8px; }
  .section-title::before { content:''; display:inline-block; width:3px; height:13px; background:#00e5ff; border-radius:2px; }
  .templates-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }
  .template-card {
    background:rgba(0,0,0,0.2); border:1px solid rgba(0,229,255,0.07);
    border-radius:12px; padding:22px; text-align:center;
    transition:border-color 0.2s,transform 0.2s;
  }
  .template-card:hover { border-color:rgba(0,229,255,0.18); transform:translateY(-2px); }
  .template-icon { font-size:30px; margin-bottom:12px; }
  .template-name { font-size:13px; font-weight:600; color:#e3f2fd; margin:0 0 6px; font-family:'JetBrains Mono',monospace; }
  .template-desc { font-size:11px; color:#546e7a; margin:0 0 14px; line-height:1.6; }
  .template-badge { display:inline-block; padding:3px 12px; border-radius:10px; font-size:10px; font-weight:700; background:rgba(84,110,122,0.12); color:#546e7a; border:1px solid rgba(84,110,122,0.2); font-family:'JetBrains Mono',monospace; letter-spacing:0.05em; }
 
  .loading-wrap { display:flex; justify-content:center; padding:48px; }
  .spinner { width:28px; height:28px; border:2px solid rgba(0,229,255,0.2); border-top-color:#00e5ff; border-radius:50%; animation:spin 0.8s linear infinite; }
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
 
      const map = {};
      await Promise.allSettled(completed.map(async s => {
        try {
          const { data: vd } = await api.get(`/api/scan/${s.id}/vulnerabilities`);
          const vulns = vd.vulnerabilities || vd || [];
          const counts = { critical:0, high:0, medium:0, low:0 };
          vulns.forEach(v => { const sev=(v.severity||'low').toLowerCase(); if(counts[sev]!==undefined)counts[sev]++; });
          map[s.id] = { ...counts, total: vulns.length };
        } catch { map[s.id] = { critical:0, high:0, medium:0, low:0, total:0 }; }
      }));
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
      const res = await api.get(`/api/scan/${scanId}/report/pdf`, { responseType:'blob' });
      const url  = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `aegis_scan${scanId}_report.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`Report #${scanId} downloaded!`);
    } catch {
      toast.error('PDF generation failed');
    } finally {
      setGenerating(null);
    }
  };
 
  const now = new Date();
  const d30 = new Date(now); d30.setDate(now.getDate()-30);
  const d7  = new Date(now); d7.setDate(now.getDate()-7);
 
  const filtered = scans.filter(s => {
    const d = new Date(s.start_time);
    if (filter==='week')  return d > d7;
    if (filter==='month') return d > d30;
    if (filter==='older') return d <= d30;
    return true;
  });
 
  const totalVulns    = Object.values(vulnMap).reduce((a,v)=>a+(v.total||0),0);
  const totalCritical = Object.values(vulnMap).reduce((a,v)=>a+(v.critical||0),0);
  const totalHigh     = Object.values(vulnMap).reduce((a,v)=>a+(v.high||0),0);
 
  const fmt = dt => dt ? new Date(dt).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : '—';
  const fmtT = dt => dt ? new Date(dt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}) : '—';
  const dur = s => {
    if (!s.start_time||!s.end_time) return '—';
    const sec = Math.round((new Date(s.end_time)-new Date(s.start_time))/1000);
    if (sec<60) return `${sec}s`;
    if (sec<3600) return `${Math.floor(sec/60)}m ${sec%60}s`;
    return `${Math.floor(sec/3600)}h ${Math.floor((sec%3600)/60)}m`;
  };
 
  const getSevBarWidth = (vc) => {
    const t = vc.total||1;
    return { c:(vc.critical/t)*100, h:(vc.high/t)*100, m:(vc.medium/t)*100, l:(vc.low/t)*100 };
  };
 
  const statCards = [
    { label:'Total Reports',  value:scans.length,    color:'#00e5ff', icon:'📋', delay:'0s'    },
    { label:'Total Vulns',    value:totalVulns,       color:'#82b1ff', icon:'🔍', delay:'0.08s' },
    { label:'Critical Found', value:totalCritical,    color:'#ff4d4d', icon:'🔴', delay:'0.16s' },
    { label:'High Found',     value:totalHigh,        color:'#ffa726', icon:'🟠', delay:'0.24s' },
  ];
 
  return (
    <>
      <style>{styles}</style>
      <div className="reports-page">
        <Sidebar />
        <div className="reports-content">
 
          <div className="page-header">
            <div>
              <h1 className="page-title">Reports Hub</h1>
              <p className="page-sub">{scans.length} completed scan{scans.length!==1?'s':''} · {totalVulns} total vulnerabilities</p>
            </div>
            <button className="btn-refresh" onClick={loadScans} disabled={loading}>
              {loading ? <><div className="spinner-sm" style={{borderTopColor:'#64b5f6'}} /> Loading</> : '↺ Refresh'}
            </button>
          </div>
 
          <div className="stats-row">
            {statCards.map((c,i) => (
              <div key={i} className="stat-card" style={{animationDelay:c.delay}}>
                <div className="stat-top" style={{background:c.color}} />
                <span className="stat-icon">{c.icon}</span>
                <div className="stat-label">{c.label}</div>
                <div className="stat-value" style={{color:c.color}}>{loading?'—':c.value}</div>
              </div>
            ))}
          </div>
 
          <div className="filter-bar">
            {[
              {key:'all',  label:'All'},
              {key:'week', label:'Last 7 Days'},
              {key:'month',label:'Last 30 Days'},
              {key:'older',label:'Older'},
            ].map(f => (
              <button key={f.key} className={`filter-pill ${filter===f.key?'active':''}`} onClick={()=>setFilter(f.key)}>
                {f.label} ({f.key==='all'?scans.length:f.key==='week'?scans.filter(s=>new Date(s.start_time)>d7).length:f.key==='month'?scans.filter(s=>new Date(s.start_time)>d30).length:scans.filter(s=>new Date(s.start_time)<=d30).length})
              </button>
            ))}
          </div>
 
          <div className="reports-grid">
            {loading ? (
              <div className="empty-card"><div className="loading-wrap"><div className="spinner" /></div></div>
            ) : filtered.length===0 ? (
              <div className="empty-card">
                <div className="empty-icon">📄</div>
                <p className="empty-title">No Reports Found</p>
                <p className="empty-sub">Complete a scan to generate a report</p>
              </div>
            ) : filtered.map((scan,idx) => {
              const vc = vulnMap[scan.id]||{};
              const bars = getSevBarWidth(vc);
              return (
                <div key={scan.id} className="report-card" style={{animationDelay:`${idx*0.05}s`}}>
                  <div className="card-top">
                    <div>
                      <p className="card-id">Report #{scan.id}</p>
                      <p className="card-target">{scan.target}</p>
                    </div>
                    <span className="status-badge" style={{background:'rgba(81,207,102,0.1)',border:'1px solid rgba(81,207,102,0.25)',color:'#51cf66'}}>
                      ✓ COMPLETED
                    </span>
                  </div>
 
                  <div className="card-meta">
                    <div className="meta-item">
                      <div className="meta-label">Date</div>
                      <div className="meta-value">{fmt(scan.start_time)}</div>
                    </div>
                    <div className="meta-item">
                      <div className="meta-label">Time</div>
                      <div className="meta-value">{fmtT(scan.start_time)}</div>
                    </div>
                    <div className="meta-item">
                      <div className="meta-label">Mode</div>
                      <div className="meta-value">{(scan.mode||'fast').toUpperCase()}</div>
                    </div>
                    <div className="meta-item">
                      <div className="meta-label">Duration</div>
                      <div className="meta-value">{dur(scan)}</div>
                    </div>
                  </div>
 
                  {vc.total>0 && (
                    <div className="sev-bar">
                      <div className="sev-bar-label">Severity Distribution</div>
                      <div className="sev-bar-track">
                        {bars.c>0 && <div className="sev-bar-seg" style={{width:`${bars.c}%`,background:'#ff4d4d'}} />}
                        {bars.h>0 && <div className="sev-bar-seg" style={{width:`${bars.h}%`,background:'#ffa726'}} />}
                        {bars.m>0 && <div className="sev-bar-seg" style={{width:`${bars.m}%`,background:'#ffd93d'}} />}
                        {bars.l>0 && <div className="sev-bar-seg" style={{width:`${bars.l}%`,background:'#51cf66'}} />}
                      </div>
                    </div>
                  )}
 
                  <div className="vuln-chips">
                    {vc.total>0 ? <>
                      {vc.critical>0 && <span className="vuln-chip vc-c">{vc.critical} Critical</span>}
                      {vc.high>0     && <span className="vuln-chip vc-h">{vc.high} High</span>}
                      {vc.medium>0   && <span className="vuln-chip vc-m">{vc.medium} Medium</span>}
                      {vc.low>0      && <span className="vuln-chip vc-l">{vc.low} Low</span>}
                    </> : <span style={{color:'#37474f',fontSize:12,fontFamily:'JetBrains Mono'}}>No vulnerabilities found</span>}
                  </div>
 
                  <div className="card-actions">
                    <button className="btn-download" onClick={()=>downloadPDF(scan.id)} disabled={generating===scan.id}>
                      {generating===scan.id ? <><div className="spinner-sm" /> Generating...</> : '↓ Download PDF'}
                    </button>
                    <button className="btn-view" onClick={()=>window.location.href='/scans'}>View</button>
                  </div>
                </div>
              );
            })}
          </div>
 
          <div className="section-panel">
            <div className="section-title">Report Templates</div>
            <div className="templates-grid">
              {[
                {icon:'📊', name:'Executive Summary',  desc:'High-level risk overview for management and stakeholders'},
                {icon:'🔬', name:'Technical Details',   desc:'Full vulnerability breakdown with CVEs and remediation steps'},
                {icon:'✅', name:'Compliance Report',   desc:'ISO 27001 / NIST / CIS Controls compliance mapping'},
              ].map((t,i) => (
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