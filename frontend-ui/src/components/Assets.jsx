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

  *{box-sizing:border-box;}
  .assets-page{display:flex;background:#0a1929;min-height:100vh;font-family:'Inter',sans-serif;}
  .assets-content{margin-left:240px;flex:1;padding:40px;animation:fadeInUp .5s ease;}

  .page-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;padding-bottom:24px;border-bottom:1px solid rgba(0,229,255,.1);}
  .page-title{font-family:'JetBrains Mono',monospace;font-size:28px;font-weight:700;background:linear-gradient(90deg,#00e5ff,#82b1ff,#fff);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:shimmer 4s linear infinite;margin:0 0 4px;}
  .page-sub{color:#546e7a;font-size:13px;margin:0;}

  .stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:28px;}
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

  .assets-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:18px;}

  .asset-card{background:linear-gradient(135deg,rgba(0,229,255,.04),rgba(0,145,234,.02));border:1px solid rgba(0,229,255,.1);border-radius:16px;padding:22px;transition:transform .2s,border-color .2s,box-shadow .2s;animation:fadeInUp .5s ease backwards;}
  .asset-card:hover{transform:translateY(-4px);border-color:rgba(0,229,255,.22);box-shadow:0 12px 36px rgba(0,0,0,.3);}

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

  .card-actions{display:flex;gap:8px;}
  .btn-scan{flex:1;padding:10px;background:linear-gradient(135deg,#00e5ff,#0091ea);border:none;border-radius:9px;color:#001e3c;font-weight:700;font-size:12px;font-family:'JetBrains Mono',monospace;cursor:pointer;transition:opacity .2s,transform .15s;display:flex;align-items:center;justify-content:center;gap:6px;}
  .btn-scan:hover:not(:disabled){opacity:.88;transform:translateY(-1px);}
  .btn-scan:disabled{opacity:.45;cursor:not-allowed;}
  .btn-vulns{padding:10px 16px;background:transparent;border:1px solid rgba(0,229,255,.25);border-radius:9px;color:#00e5ff;font-size:12px;font-family:'JetBrains Mono',monospace;cursor:pointer;transition:background .2s;}
  .btn-vulns:hover{background:rgba(0,229,255,.08);}

  .status-dot{width:6px;height:6px;border-radius:50%;display:inline-block;margin-right:5px;}
  .dot-active{background:#51cf66;animation:pulse-dot 2s infinite;}
  .dot-inactive{background:#546e7a;}

  .empty-card{grid-column:1/-1;text-align:center;padding:64px;background:linear-gradient(135deg,rgba(0,229,255,.03),rgba(0,145,234,.01));border:1px dashed rgba(0,229,255,.15);border-radius:16px;}
  .spinner{width:28px;height:28px;border:2px solid rgba(0,229,255,.2);border-top-color:#00e5ff;border-radius:50%;animation:spin .8s linear infinite;}
  .loading-wrap{display:flex;justify-content:center;padding:60px;}
  .spinner-sm{width:12px;height:12px;border:2px solid rgba(0,30,60,.3);border-top-color:#001e3c;border-radius:50%;animation:spin .7s linear infinite;}
  .btn-refresh{padding:10px 18px;background:transparent;border:1px solid rgba(0,229,255,.25);border-radius:10px;color:#64b5f6;font-size:12px;font-family:'JetBrains Mono',monospace;cursor:pointer;transition:all .2s;}
  .btn-refresh:hover{background:rgba(0,229,255,.08);}
`;

function getRiskLevel(vc = {}) {
  if ((vc.critical||0) > 0) return 'CRITICAL';
  if ((vc.high||0)     > 0) return 'HIGH';
  if ((vc.medium||0)   > 0) return 'MEDIUM';
  if ((vc.low||0)      > 0) return 'LOW';
  return 'UNKNOWN';
}

export default function Assets() {
  const [vms,     setVms]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [filter,  setFilter]  = useState('all');
  const [scanning,setScanning]= useState({});

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

  const startScan = async (vm) => {
    setScanning(prev => ({ ...prev, [vm.id]: true }));
    try {
      const { data } = await api.post('/api/scan/start', { target: vm.ip_address, mode: 'fast' });
      toast.success(`Scan #${data.scan_id} started for ${vm.ip_address}`);
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Scan failed');
    } finally {
      setScanning(prev => ({ ...prev, [vm.id]: false }));
    }
  };

  const counts = { CRITICAL:0, HIGH:0, MEDIUM:0, LOW:0, UNKNOWN:0 };
  vms.forEach(vm => { const k = vm.risk_level||'UNKNOWN'; counts[k] = (counts[k]||0)+1; });

  const filtered = vms.filter(vm => {
    const q = search.toLowerCase();
    const matchSearch =
      (vm.ip_address||'').toLowerCase().includes(q) ||
      (vm.hostname||'').toLowerCase().includes(q) ||
      (vm.os||'').toLowerCase().includes(q);
    const matchFilter =
      filter === 'all' ||
      (filter === 'at-risk' && ['CRITICAL','HIGH'].includes(vm.risk_level)) ||
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
              <p className="page-sub">{vms.length} assets · {counts.CRITICAL + counts.HIGH} at risk</p>
            </div>
            <button className="btn-refresh" onClick={loadAssets}>↺ Refresh</button>
          </div>

          <div className="stats-row">
            {[
              { label:'Total Assets', value:vms.length,           color:'#00e5ff', delay:'0s'   },
              { label:'Critical',     value:counts.CRITICAL,      color:'#ff4d4d', delay:'.08s' },
              { label:'High Risk',    value:counts.HIGH,          color:'#ffa726', delay:'.16s' },
              { label:'Clean',        value:counts.LOW+counts.UNKNOWN, color:'#51cf66', delay:'.24s' },
            ].map((c,i) => (
              <div key={i} className="stat-card" style={{animationDelay:c.delay}}>
                <div className="stat-top" style={{background:c.color}} />
                <div className="stat-label">{c.label}</div>
                <div className="stat-value" style={{color:c.color}}>{loading?'—':c.value}</div>
              </div>
            ))}
          </div>

          <div className="toolbar">
            <div className="search-wrap">
              <span className="search-icon">🔍</span>
              <input className="search-input" placeholder="Search IP, hostname, OS..."
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            {['all','at-risk','CRITICAL','HIGH','MEDIUM','LOW'].map(f => (
              <button key={f} className={`filter-pill ${filter===f?'active':''}`} onClick={()=>setFilter(f)}>
                {f==='at-risk'?'At Risk':f} ({
                  f==='all'     ? vms.length :
                  f==='at-risk' ? counts.CRITICAL+counts.HIGH :
                  counts[f]||0
                })
              </button>
            ))}
          </div>

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
                const vc = vm.vuln_counts || {};
                return (
                  <div key={vm.id} className="asset-card" style={{animationDelay:`${idx*0.04}s`}}>
                    <div className="card-header">
                      <div>
                        <p className="card-host">{vm.hostname || `host-${vm.id}`}</p>
                        <p className="card-ip">{vm.ip_address}</p>
                      </div>
                      <span className={`risk-badge risk-${vm.risk_level||'UNKNOWN'}`}>
                        {vm.risk_level||'UNKNOWN'}
                      </span>
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
                        <div className="meta-value">
                          {vm.last_seen ? new Date(vm.last_seen).toLocaleDateString() : '—'}
                        </div>
                      </div>
                      <div className="meta-item">
                        <div className="meta-label">Total Vulns</div>
                        <div className="meta-value" style={{color:vc.total>0?'#ffa726':'#51cf66'}}>
                          {vc.total||0}
                        </div>
                      </div>
                    </div>

                    <div className="vuln-chips">
                      {(vc.critical||0)>0 && <span className="vuln-chip vc-c">{vc.critical}C</span>}
                      {(vc.high||0)>0     && <span className="vuln-chip vc-h">{vc.high}H</span>}
                      {(vc.medium||0)>0   && <span className="vuln-chip vc-m">{vc.medium}M</span>}
                      {(vc.low||0)>0      && <span className="vuln-chip vc-l">{vc.low}L</span>}
                      {!vc.total && (
                        <span style={{color:'#37474f',fontSize:11,fontFamily:'JetBrains Mono'}}>
                          No vulnerabilities
                        </span>
                      )}
                    </div>

                    <div className="card-actions">
                      <button className="btn-scan" onClick={()=>startScan(vm)} disabled={scanning[vm.id]}>
                        {scanning[vm.id]
                          ? <><span className="spinner-sm" /> Scanning...</>
                          : '▶ Quick Scan'
                        }
                      </button>
                      <button className="btn-vulns" onClick={()=>window.location.href='/vulnerabilities'}>
                        Vulns
                      </button>
                    </div>
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