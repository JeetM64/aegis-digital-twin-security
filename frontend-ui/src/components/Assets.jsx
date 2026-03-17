import React, { useEffect, useState, useCallback } from 'react';
import Sidebar from './Sidebar';
import api from '../services/api';
import toast from 'react-hot-toast';
 
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');
 
  @keyframes fadeInUp  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes shimmer   { 0%{background-position:-200% center} 100%{background-position:200% center} }
  @keyframes spin      { to{transform:rotate(360deg)} }
  @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.8)} }
  @keyframes twin-glow { 0%,100%{box-shadow:0 0 0 0 rgba(130,177,255,.3)} 50%{box-shadow:0 0 12px 3px rgba(130,177,255,.15)} }
  @keyframes slideDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
 
  *{box-sizing:border-box;}
  .assets-page{display:flex;background:#0a1929;min-height:100vh;font-family:'Inter',sans-serif;}
  .assets-content{margin-left:240px;flex:1;padding:40px;animation:fadeInUp .5s ease;}
 
  .page-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;padding-bottom:24px;border-bottom:1px solid rgba(0,229,255,.1);}
  .page-title{font-family:'JetBrains Mono',monospace;font-size:28px;font-weight:700;background:linear-gradient(90deg,#00e5ff,#82b1ff,#fff);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:shimmer 4s linear infinite;margin:0 0 4px;}
  .page-sub{color:#546e7a;font-size:13px;margin:0;}
  .header-actions{display:flex;gap:10px;}
  .btn-refresh{padding:10px 18px;background:transparent;border:1px solid rgba(0,229,255,.25);border-radius:10px;color:#64b5f6;font-size:12px;font-family:'JetBrains Mono',monospace;cursor:pointer;transition:all .2s;}
  .btn-refresh:hover{background:rgba(0,229,255,.08);}
 
  .stats-row{display:grid;grid-template-columns:repeat(5,1fr);gap:14px;margin-bottom:28px;}
  .stat-card{background:linear-gradient(135deg,#001e3c,#0d2137);border:1px solid rgba(0,229,255,.08);border-radius:14px;padding:18px;position:relative;overflow:hidden;transition:transform .2s,border-color .2s;animation:fadeInUp .5s ease backwards;}
  .stat-card:hover{transform:translateY(-2px);border-color:rgba(0,229,255,.2);}
  .stat-top{position:absolute;top:0;left:0;right:0;height:3px;border-radius:14px 14px 0 0;}
  .stat-label{color:#546e7a;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.09em;margin-bottom:8px;}
  .stat-value{font-family:'JetBrains Mono',monospace;font-size:28px;font-weight:700;}
 
  .toolbar{display:flex;gap:10px;margin-bottom:24px;flex-wrap:wrap;align-items:center;}
  .search-wrap{flex:1;min-width:200px;position:relative;}
  .search-icon{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:#37474f;font-size:13px;pointer-events:none;}
  .search-input{width:100%;padding:10px 16px 10px 34px;background:rgba(0,0,0,.3);border:1px solid rgba(0,229,255,.15);border-radius:10px;color:#e3f2fd;font-family:'JetBrains Mono',monospace;font-size:13px;outline:none;transition:border-color .2s;}
  .search-input:focus{border-color:#00e5ff;}
  .search-input::placeholder{color:#37474f;}
  .filter-pill{padding:8px 16px;border-radius:20px;font-size:11px;font-weight:700;cursor:pointer;border:1px solid rgba(0,229,255,.15);background:transparent;color:#546e7a;font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.05em;transition:all .2s;}
  .filter-pill:hover{background:rgba(0,229,255,.06);color:#64b5f6;}
  .filter-pill.active{background:rgba(0,229,255,.12);border-color:#00e5ff;color:#00e5ff;}
 
  /* Grid */
  .assets-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:18px;}
 
  /* Asset card */
  .asset-card{background:linear-gradient(135deg,rgba(0,229,255,.04),rgba(0,145,234,.02));border:1px solid rgba(0,229,255,.1);border-radius:16px;padding:22px;transition:transform .2s,border-color .2s,box-shadow .2s;animation:fadeInUp .5s ease backwards;position:relative;overflow:hidden;}
  .asset-card:hover{transform:translateY(-4px);border-color:rgba(0,229,255,.22);box-shadow:0 12px 36px rgba(0,0,0,.3);}
  .asset-card.has-twin{border-color:rgba(130,177,255,.2);animation:twin-glow 3s infinite;}
  .asset-card.has-twin:hover{border-color:rgba(130,177,255,.4);}
 
  /* Twin badge on card */
  .twin-indicator{position:absolute;top:12px;right:12px;display:flex;align-items:center;gap:5px;background:rgba(130,177,255,.1);border:1px solid rgba(130,177,255,.25);border-radius:20px;padding:3px 10px;font-size:10px;font-weight:700;color:#82b1ff;font-family:'JetBrains Mono',monospace;}
  .twin-dot{width:5px;height:5px;border-radius:50%;background:#82b1ff;animation:pulse-dot 2s infinite;}
 
  .card-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;}
  .card-host{font-family:'JetBrains Mono',monospace;font-size:15px;font-weight:700;color:#e3f2fd;margin:0 0 3px;}
  .card-ip{font-family:'JetBrains Mono',monospace;font-size:12px;color:#82b1ff;margin:0;}
 
  .risk-badge{display:inline-flex;align-items:center;padding:4px 12px;border-radius:20px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;font-family:'JetBrains Mono',monospace;}
  .risk-CRITICAL{background:rgba(255,77,77,.15);color:#ff4d4d;border:1px solid rgba(255,77,77,.3);}
  .risk-HIGH{background:rgba(255,167,38,.15);color:#ffa726;border:1px solid rgba(255,167,38,.3);}
  .risk-MEDIUM{background:rgba(255,217,61,.15);color:#ffd93d;border:1px solid rgba(255,217,61,.3);}
  .risk-LOW{background:rgba(81,207,102,.15);color:#51cf66;border:1px solid rgba(81,207,102,.3);}
  .risk-UNKNOWN{background:rgba(144,164,174,.12);color:#78909c;border:1px solid rgba(144,164,174,.2);}
 
  .card-meta{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px;}
  .meta-item{background:rgba(0,0,0,.2);border-radius:8px;padding:9px 11px;}
  .meta-label{font-size:9px;color:#37474f;text-transform:uppercase;letter-spacing:.08em;margin-bottom:3px;}
  .meta-value{font-family:'JetBrains Mono',monospace;font-size:12px;color:#90caf9;font-weight:600;}
 
  .vuln-chips{display:flex;gap:5px;margin-bottom:14px;flex-wrap:wrap;min-height:22px;}
  .vuln-chip{padding:3px 9px;border-radius:6px;font-size:11px;font-weight:700;font-family:'JetBrains Mono',monospace;}
  .vc-c{background:rgba(255,77,77,.15);color:#ff4d4d;}
  .vc-h{background:rgba(255,167,38,.15);color:#ffa726;}
  .vc-m{background:rgba(255,217,61,.15);color:#ffd93d;}
  .vc-l{background:rgba(81,207,102,.15);color:#51cf66;}
 
  /* Twin panel inside card */
  .twin-panel{background:rgba(130,177,255,.06);border:1px solid rgba(130,177,255,.15);border-radius:10px;padding:12px;margin-bottom:14px;animation:slideDown .3s ease;}
  .twin-panel-title{font-size:10px;font-weight:700;color:#82b1ff;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px;display:flex;align-items:center;gap:6px;}
  .twin-panel-title::before{content:'';display:inline-block;width:3px;height:10px;background:#82b1ff;border-radius:2px;}
  .twin-meta{display:flex;gap:10px;flex-wrap:wrap;}
  .twin-tag{font-size:10px;font-family:'JetBrains Mono',monospace;color:#64b5f6;background:rgba(100,181,246,.08);border:1px solid rgba(100,181,246,.15);padding:2px 8px;border-radius:5px;}
 
  /* Action buttons */
  .card-actions{display:flex;gap:7px;flex-wrap:wrap;}
  .btn-scan{flex:1;padding:9px;background:linear-gradient(135deg,#00e5ff,#0091ea);border:none;border-radius:9px;color:#001e3c;font-weight:700;font-size:11px;font-family:'JetBrains Mono',monospace;cursor:pointer;transition:opacity .2s,transform .15s;display:flex;align-items:center;justify-content:center;gap:5px;}
  .btn-scan:hover:not(:disabled){opacity:.88;transform:translateY(-1px);}
  .btn-scan:disabled{opacity:.45;cursor:not-allowed;}
  .btn-twin{padding:9px 12px;background:rgba(130,177,255,.1);border:1px solid rgba(130,177,255,.3);border-radius:9px;color:#82b1ff;font-size:11px;font-family:'JetBrains Mono',monospace;cursor:pointer;transition:all .2s;display:flex;align-items:center;gap:5px;}
  .btn-twin:hover:not(:disabled){background:rgba(130,177,255,.18);border-color:rgba(130,177,255,.5);}
  .btn-twin:disabled{opacity:.45;cursor:not-allowed;}
  .btn-twin-scan{padding:9px 12px;background:rgba(130,177,255,.15);border:1px solid rgba(130,177,255,.4);border-radius:9px;color:#b0c4ff;font-size:11px;font-family:'JetBrains Mono',monospace;cursor:pointer;transition:all .2s;display:flex;align-items:center;gap:5px;}
  .btn-twin-scan:hover:not(:disabled){background:rgba(130,177,255,.25);}
  .btn-twin-scan:disabled{opacity:.45;cursor:not-allowed;}
  .btn-vulns{padding:9px 12px;background:transparent;border:1px solid rgba(0,229,255,.25);border-radius:9px;color:#00e5ff;font-size:11px;font-family:'JetBrains Mono',monospace;cursor:pointer;transition:background .2s;}
  .btn-vulns:hover{background:rgba(0,229,255,.08);}
 
  .spinner-sm{width:11px;height:11px;border:2px solid rgba(0,30,60,.3);border-top-color:#001e3c;border-radius:50%;animation:spin .7s linear infinite;}
  .spinner-sm-blue{width:11px;height:11px;border:2px solid rgba(130,177,255,.2);border-top-color:#82b1ff;border-radius:50%;animation:spin .7s linear infinite;}
 
  .status-dot{width:6px;height:6px;border-radius:50%;display:inline-block;margin-right:5px;}
  .dot-active{background:#51cf66;animation:pulse-dot 2s infinite;}
  .dot-inactive{background:#546e7a;}
 
  .empty-card{grid-column:1/-1;text-align:center;padding:64px;background:linear-gradient(135deg,rgba(0,229,255,.03),rgba(0,145,234,.01));border:1px dashed rgba(0,229,255,.15);border-radius:16px;}
  .spinner{width:28px;height:28px;border:2px solid rgba(0,229,255,.2);border-top-color:#00e5ff;border-radius:50%;animation:spin .8s linear infinite;}
  .loading-wrap{display:flex;justify-content:center;padding:60px;}
 
  /* Tooltip / info box */
  .twin-info-box{background:rgba(130,177,255,.06);border:1px solid rgba(130,177,255,.15);border-radius:12px;padding:14px 18px;margin-bottom:24px;display:flex;align-items:flex-start;gap:12px;}
  .twin-info-icon{font-size:20px;flex-shrink:0;margin-top:1px;}
  .twin-info-text{font-size:12px;color:#82b1ff;line-height:1.6;}
  .twin-info-text strong{color:#b0c4ff;}
`;
 
function getRiskLevel(vc = {}) {
  if ((vc.critical||0) > 0) return 'CRITICAL';
  if ((vc.high||0)     > 0) return 'HIGH';
  if ((vc.medium||0)   > 0) return 'MEDIUM';
  if ((vc.low||0)      > 0) return 'LOW';
  return 'UNKNOWN';
}
 
export default function Assets() {
  const [vms,      setVms]      = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [filter,   setFilter]   = useState('all');
  const [busy,     setBusy]     = useState({}); // { vmId_action: true }
 
  useEffect(() => { loadAssets(); }, []);
 
  const loadAssets = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/vms');
      const list = data.vms || data || [];
      setVms(list.map(vm => ({
        ...vm,
        risk_level: vm.risk_level || getRiskLevel(vm.vuln_counts || {}),
      })));
    } catch {
      toast.error('Failed to load assets');
    } finally {
      setLoading(false);
    }
  }, []);
 
  const setBusyKey = (vmId, action, val) =>
    setBusy(prev => ({ ...prev, [`${vmId}_${action}`]: val }));
 
  const isBusy = (vmId, action) => !!busy[`${vmId}_${action}`];
 
  // Start real scan
  const startScan = async (vm) => {
    setBusyKey(vm.id, 'scan', true);
    try {
      const { data } = await api.post('/api/scan/start', { target: vm.ip_address, mode: 'fast' });
      toast.success(`Scan #${data.scan_id} started for ${vm.ip_address}`);
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Scan failed');
    } finally {
      setBusyKey(vm.id, 'scan', false);
    }
  };
 
  // Create digital twin
  const createTwin = async (vm) => {
    setBusyKey(vm.id, 'twin', true);
    try {
      const { data } = await api.post(`/api/twin/create/${vm.id}`);
      toast.success(`Digital Twin created for ${vm.ip_address} — ${data.ports_captured} ports captured`);
      await loadAssets();
    } catch (err) {
      const msg = err?.response?.data?.error || 'Failed to create twin';
      toast.error(msg);
      if (msg.includes('already exists')) await loadAssets();
    } finally {
      setBusyKey(vm.id, 'twin', false);
    }
  };
 
  // Sync digital twin
  const syncTwin = async (vm) => {
    setBusyKey(vm.id, 'sync', true);
    try {
      const { data } = await api.post(`/api/twin/sync/${vm.id}`);
      toast.success(`Twin synced — ${data.ports_captured} ports updated`);
      await loadAssets();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Sync failed');
    } finally {
      setBusyKey(vm.id, 'sync', false);
    }
  };
 
  // Scan digital twin (virtual scan)
  const scanTwin = async (vm) => {
    setBusyKey(vm.id, 'twinscan', true);
    try {
      const { data } = await api.post(`/api/twin/scan/${vm.id}`);
      toast.success(`Virtual twin scan #${data.scan_id} started — no packets sent to real network!`);
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Twin scan failed');
    } finally {
      setBusyKey(vm.id, 'twinscan', false);
    }
  };
 
  const counts = { CRITICAL:0, HIGH:0, MEDIUM:0, LOW:0, UNKNOWN:0 };
  vms.forEach(vm => { const k = vm.risk_level||'UNKNOWN'; counts[k] = (counts[k]||0)+1; });
  const twinCount = vms.filter(v => v.has_twin).length;
 
  const filtered = vms.filter(vm => {
    const q = search.toLowerCase();
    const matchSearch =
      (vm.ip_address||'').toLowerCase().includes(q) ||
      (vm.hostname||'').toLowerCase().includes(q) ||
      (vm.os||'').toLowerCase().includes(q);
    const matchFilter =
      filter === 'all' ||
      filter === 'twins' ? vm.has_twin :
      filter === 'at-risk' ? ['CRITICAL','HIGH'].includes(vm.risk_level) :
      (vm.risk_level||'UNKNOWN') === filter;
    return matchSearch && matchFilter;
  });
 
  return (
    <>
      <style>{styles}</style>
      <div className="assets-page">
        <Sidebar />
        <div className="assets-content">
 
          <div className="page-header">
            <div>
              <h1 className="page-title">Asset Inventory</h1>
              <p className="page-sub">{vms.length} assets · {counts.CRITICAL+counts.HIGH} at risk · {twinCount} digital twins</p>
            </div>
            <div className="header-actions">
              <button className="btn-refresh" onClick={loadAssets}>↺ Refresh</button>
            </div>
          </div>
 
          {/* Digital Twin Info Banner */}
          <div className="twin-info-box">
            <span className="twin-info-icon">🔷</span>
            <div className="twin-info-text">
              <strong>Digital Twin Technology</strong> — Create a virtual copy of any device.
              Future scans run on the digital twin — <strong>no packets sent to real network</strong>.
              Safe for production environments. Click <strong>Create Twin</strong> on any device to get started.
            </div>
          </div>
 
          {/* Stats */}
          <div className="stats-row">
            {[
              { label:'Total Assets',   value:vms.length,           color:'#00e5ff', delay:'0s'    },
              { label:'Critical',       value:counts.CRITICAL,      color:'#ff4d4d', delay:'.07s'  },
              { label:'High Risk',      value:counts.HIGH,          color:'#ffa726', delay:'.14s'  },
              { label:'Clean',          value:counts.LOW+counts.UNKNOWN, color:'#51cf66', delay:'.21s' },
              { label:'Digital Twins',  value:twinCount,            color:'#82b1ff', delay:'.28s'  },
            ].map((c,i) => (
              <div key={i} className="stat-card" style={{animationDelay:c.delay}}>
                <div className="stat-top" style={{background:c.color}} />
                <div className="stat-label">{c.label}</div>
                <div className="stat-value" style={{color:c.color}}>{loading?'—':c.value}</div>
              </div>
            ))}
          </div>
 
          {/* Toolbar */}
          <div className="toolbar">
            <div className="search-wrap">
              <span className="search-icon">🔍</span>
              <input className="search-input" placeholder="Search IP, hostname, OS..."
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            {[
              {f:'all',     label:'All'},
              {f:'twins',   label:'🔷 Has Twin'},
              {f:'at-risk', label:'At Risk'},
              {f:'CRITICAL',label:'Critical'},
              {f:'HIGH',    label:'High'},
              {f:'MEDIUM',  label:'Medium'},
              {f:'LOW',     label:'Low'},
            ].map(({f,label}) => (
              <button key={f} className={`filter-pill ${filter===f?'active':''}`} onClick={()=>setFilter(f)}>
                {label} ({
                  f==='all'     ? vms.length :
                  f==='twins'   ? twinCount :
                  f==='at-risk' ? counts.CRITICAL+counts.HIGH :
                  counts[f]||0
                })
              </button>
            ))}
          </div>
 
          {/* Grid */}
          {loading ? (
            <div className="loading-wrap"><div className="spinner" /></div>
          ) : (
            <div className="assets-grid">
              {filtered.length === 0 ? (
                <div className="empty-card">
                  <div style={{fontSize:36,opacity:.3,marginBottom:12}}>◈</div>
                  <p style={{color:'#546e7a',fontSize:15,margin:'0 0 6px'}}>No assets found</p>
                  <p style={{color:'#263238',fontSize:13,margin:0}}>
                    {vms.length===0 ? 'Run Asset Discovery to find devices' : 'Try adjusting your filter'}
                  </p>
                </div>
              ) : filtered.map((vm, idx) => {
                const vc  = vm.vuln_counts || {};
                const twin = vm.twin;
                return (
                  <div key={vm.id}
                    className={`asset-card ${vm.has_twin ? 'has-twin' : ''}`}
                    style={{animationDelay:`${idx*0.04}s`}}
                  >
                    {/* Twin badge */}
                    {vm.has_twin && (
                      <div className="twin-indicator">
                        <span className="twin-dot" />
                        DIGITAL TWIN
                      </div>
                    )}
 
                    <div className="card-header">
                      <div style={{paddingRight: vm.has_twin ? 100 : 0}}>
                        <p className="card-host">{vm.hostname || `host-${vm.id}`}</p>
                        <p className="card-ip">{vm.ip_address}</p>
                      </div>
                      {!vm.has_twin && (
                        <span className={`risk-badge risk-${vm.risk_level||'UNKNOWN'}`}>
                          {vm.risk_level||'UNKNOWN'}
                        </span>
                      )}
                    </div>
 
                    <div className="card-meta">
                      <div className="meta-item">
                        <div className="meta-label">OS</div>
                        <div className="meta-value">{vm.os||'Unknown'}</div>
                      </div>
                      <div className="meta-item">
                        <div className="meta-label">Status</div>
                        <div className="meta-value">
                          <span className={`status-dot ${vm.status==='active'?'dot-active':'dot-inactive'}`} />
                          {vm.status||'active'}
                        </div>
                      </div>
                      <div className="meta-item">
                        <div className="meta-label">Last Seen</div>
                        <div className="meta-value">{vm.last_seen ? new Date(vm.last_seen).toLocaleDateString() : '—'}</div>
                      </div>
                      <div className="meta-item">
                        <div className="meta-label">Total Vulns</div>
                        <div className="meta-value" style={{color:vc.total>0?'#ffa726':'#51cf66'}}>{vc.total||0}</div>
                      </div>
                    </div>
 
                    {/* Vuln chips */}
                    <div className="vuln-chips">
                      {(vc.critical||0)>0 && <span className="vuln-chip vc-c">{vc.critical}C</span>}
                      {(vc.high||0)>0     && <span className="vuln-chip vc-h">{vc.high}H</span>}
                      {(vc.medium||0)>0   && <span className="vuln-chip vc-m">{vc.medium}M</span>}
                      {(vc.low||0)>0      && <span className="vuln-chip vc-l">{vc.low}L</span>}
                      {!vc.total && <span style={{color:'#37474f',fontSize:11,fontFamily:'JetBrains Mono'}}>No vulnerabilities yet</span>}
                    </div>
 
                    {/* Digital Twin panel */}
                    {twin && (
                      <div className="twin-panel">
                        <div className="twin-panel-title">🔷 Digital Twin Profile</div>
                        <div className="twin-meta">
                          <span className="twin-tag">📡 {twin.port_count} ports captured</span>
                          <span className="twin-tag">🔄 Synced {twin.sync_count}x</span>
                          <span className="twin-tag">📅 {twin.last_synced ? new Date(twin.last_synced).toLocaleDateString() : '—'}</span>
                          <span className={`twin-tag`} style={{
                            color: twin.status==='active'?'#51cf66':'#ffa726',
                            background: twin.status==='active'?'rgba(81,207,102,.08)':'rgba(255,167,38,.08)',
                            border: twin.status==='active'?'1px solid rgba(81,207,102,.2)':'1px solid rgba(255,167,38,.2)',
                          }}>
                            {twin.status==='active'?'✓ Active':'⚠ Outdated'}
                          </span>
                        </div>
                      </div>
                    )}
 
                    {/* Actions */}
                    <div className="card-actions">
                      {/* Real scan */}
                      <button className="btn-scan" onClick={()=>startScan(vm)} disabled={isBusy(vm.id,'scan')}>
                        {isBusy(vm.id,'scan') ? <><span className="spinner-sm" /> Scanning...</> : '▶ Real Scan'}
                      </button>
 
                      {/* Twin actions */}
                      {!vm.has_twin ? (
                        <button className="btn-twin" onClick={()=>createTwin(vm)} disabled={isBusy(vm.id,'twin')||!vc.total}>
                          {isBusy(vm.id,'twin') ? <><span className="spinner-sm-blue" /> Creating...</> : '🔷 Create Twin'}
                        </button>
                      ) : (
                        <>
                          <button className="btn-twin" onClick={()=>syncTwin(vm)} disabled={isBusy(vm.id,'sync')}>
                            {isBusy(vm.id,'sync') ? <><span className="spinner-sm-blue" /> Syncing...</> : '🔄 Sync'}
                          </button>
                          <button className="btn-twin-scan" onClick={()=>scanTwin(vm)} disabled={isBusy(vm.id,'twinscan')}>
                            {isBusy(vm.id,'twinscan') ? <><span className="spinner-sm-blue" /> Scanning...</> : '🔷 Twin Scan'}
                          </button>
                        </>
                      )}
 
                      <button className="btn-vulns" onClick={()=>window.location.href='/vulnerabilities'}>Vulns</button>
                    </div>
 
                    {/* Helper text */}
                    {!vm.has_twin && vc.total === 0 && (
                      <p style={{fontSize:10,color:'#37474f',fontFamily:'JetBrains Mono',margin:'10px 0 0',textAlign:'center'}}>
                        Run a real scan first to enable Digital Twin
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
 
        </div>
      </div>
    </>
  );
}