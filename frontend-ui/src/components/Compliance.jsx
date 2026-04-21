import React, { useEffect, useState, useCallback } from 'react';
import Sidebar from './Sidebar';
import api from '../services/api';
import toast from 'react-hot-toast';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');

  @keyframes fadeInUp  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes shimmer   { 0%{background-position:-200% center} 100%{background-position:200% center} }
  @keyframes spin      { to{transform:rotate(360deg)} }
  @keyframes scoreGrow { from{stroke-dashoffset:283} to{stroke-dashoffset:var(--offset)} }
  @keyframes slideDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulse     { 0%,100%{opacity:1} 50%{opacity:.5} }

  *{box-sizing:border-box;}
  .comp-page{display:flex;background:#0a1929;min-height:100vh;font-family:'Inter',sans-serif;}
  .comp-content{margin-left:240px;flex:1;padding:36px;animation:fadeInUp .5s ease;}

  .page-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;padding-bottom:20px;border-bottom:1px solid rgba(0,229,255,.1);}
  .page-title{font-family:'JetBrains Mono',monospace;font-size:28px;font-weight:700;background:linear-gradient(90deg,#00e5ff,#82b1ff,#51cf66);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:shimmer 4s linear infinite;margin:0 0 5px;}
  .page-sub{color:#546e7a;font-size:13px;margin:0;}

  .btn-refresh{padding:10px 18px;background:transparent;border:1px solid rgba(0,229,255,.25);border-radius:10px;color:#64b5f6;font-size:12px;font-family:'JetBrains Mono',monospace;cursor:pointer;transition:all .2s;display:flex;align-items:center;gap:7px;}
  .btn-refresh:hover{background:rgba(0,229,255,.08);}

  /* Top row */
  .top-row{display:grid;grid-template-columns:220px 1fr 1fr;gap:16px;margin-bottom:20px;}

  /* Score gauge panel */
  .score-panel{background:linear-gradient(135deg,rgba(0,229,255,.05),rgba(0,145,234,.02));border:1px solid rgba(0,229,255,.12);border-radius:16px;padding:22px;display:flex;flex-direction:column;align-items:center;}
  .score-panel-title{color:#00e5ff;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.1em;margin-bottom:14px;display:flex;align-items:center;gap:6px;}
  .score-panel-title::before{content:'';display:inline-block;width:3px;height:11px;background:#00e5ff;border-radius:2px;}
  .score-num{font-family:'JetBrains Mono',monospace;font-size:36px;font-weight:700;text-anchor:middle;dominant-baseline:middle;}
  .score-label{font-size:9px;text-anchor:middle;dominant-baseline:middle;letter-spacing:.08em;text-transform:uppercase;}
  .status-badge{display:inline-block;padding:5px 16px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;font-family:'JetBrains Mono',monospace;margin-top:10px;}

  /* Stats panel */
  .panel{background:linear-gradient(135deg,rgba(0,229,255,.04),rgba(0,145,234,.02));border:1px solid rgba(0,229,255,.1);border-radius:16px;padding:20px;}
  .panel-title{color:#00e5ff;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.1em;margin:0 0 14px;display:flex;align-items:center;gap:7px;}
  .panel-title::before{content:'';display:inline-block;width:3px;height:12px;background:#00e5ff;border-radius:2px;}

  .stat-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
  .stat-box{background:rgba(0,0,0,.2);border-radius:10px;padding:14px;text-align:center;}
  .stat-box-label{font-size:10px;color:#546e7a;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px;}
  .stat-box-value{font-family:'JetBrains Mono',monospace;font-size:24px;font-weight:700;}

  /* Framework tabs */
  .fw-tabs{display:flex;gap:8px;margin-bottom:16px;}
  .fw-tab{padding:8px 20px;border-radius:20px;font-size:12px;font-weight:700;cursor:pointer;border:1px solid rgba(0,229,255,.15);background:transparent;color:#546e7a;font-family:'JetBrains Mono',monospace;transition:all .2s;}
  .fw-tab:hover{background:rgba(0,229,255,.06);color:#64b5f6;}
  .fw-tab.active{background:rgba(0,229,255,.12);border-color:#00e5ff;color:#00e5ff;}

  /* Controls table */
  .controls-wrap{display:flex;flex-direction:column;gap:8px;}
  .control-card{background:rgba(0,0,0,.2);border:1px solid rgba(255,255,255,.05);border-radius:12px;padding:16px;cursor:pointer;transition:all .2s;animation:slideDown .25s ease backwards;}
  .control-card:hover{border-color:rgba(0,229,255,.15);background:rgba(0,229,255,.03);}
  .control-card.expanded{border-color:rgba(0,229,255,.2);background:rgba(0,229,255,.04);}

  .control-header{display:flex;align-items:center;gap:12px;}
  .control-id{font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;color:#64b5f6;min-width:72px;flex-shrink:0;}
  .control-title{font-size:13px;font-weight:500;color:#e3f2fd;flex:1;}
  .control-category{font-size:10px;color:#546e7a;font-family:'JetBrains Mono',monospace;flex-shrink:0;display:none;}
  .control-status{flex-shrink:0;}

  .status-pill{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:20px;font-size:10px;font-weight:700;text-transform:uppercase;font-family:'JetBrains Mono',monospace;}
  .status-PASS{background:rgba(81,207,102,.12);color:#51cf66;border:1px solid rgba(81,207,102,.25);}
  .status-FAIL{background:rgba(255,77,77,.12);color:#ff4d4d;border:1px solid rgba(255,77,77,.25);}
  .status-WARNING{background:rgba(255,167,38,.12);color:#ffa726;border:1px solid rgba(255,167,38,.25);}

  .control-detail{margin-top:14px;padding-top:14px;border-top:1px solid rgba(255,255,255,.06);animation:slideDown .2s ease;}
  .detail-desc{font-size:12px;color:#78909c;line-height:1.6;margin-bottom:10px;}
  .detail-finding{font-size:12px;color:#90caf9;margin-bottom:10px;padding:10px 12px;background:rgba(0,0,0,.2);border-radius:8px;border-left:3px solid #64b5f6;}
  .detail-remediation{font-size:12px;color:#ffa726;padding:10px 12px;background:rgba(255,167,38,.06);border-radius:8px;border-left:3px solid #ffa726;}
  .detail-remediation-label{font-size:10px;font-weight:700;color:#ffa726;text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px;font-family:'JetBrains Mono',monospace;}

  /* Summary boxes */
  .summary-row{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px;}
  .summary-box{background:rgba(0,0,0,.2);border:1px solid rgba(255,255,255,.06);border-radius:12px;padding:16px;}
  .summary-box-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px;display:flex;align-items:center;gap:6px;font-family:'JetBrains Mono',monospace;}
  .summary-item{font-size:12px;color:#90caf9;padding:5px 0;border-bottom:1px solid rgba(255,255,255,.04);line-height:1.5;}
  .summary-item:last-child{border-bottom:none;}

  /* Filter bar */
  .filter-bar{display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;}
  .filter-pill{padding:6px 14px;border-radius:20px;font-size:11px;font-weight:700;cursor:pointer;border:1px solid rgba(0,229,255,.12);background:transparent;color:#546e7a;font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.04em;transition:all .2s;}
  .filter-pill:hover{background:rgba(0,229,255,.06);color:#64b5f6;}
  .filter-pill.active{background:rgba(0,229,255,.1);border-color:#00e5ff;color:#00e5ff;}
  .filter-pill.f-FAIL.active{background:rgba(255,77,77,.1);border-color:#ff4d4d;color:#ff4d4d;}
  .filter-pill.f-WARNING.active{background:rgba(255,167,38,.1);border-color:#ffa726;color:#ffa726;}
  .filter-pill.f-PASS.active{background:rgba(81,207,102,.1);border-color:#51cf66;color:#51cf66;}

  /* Progress bar */
  .progress-bar-wrap{height:6px;background:rgba(255,255,255,.05);border-radius:3px;overflow:hidden;margin-top:8px;}
  .progress-bar-fill{height:100%;border-radius:3px;transition:width .8s ease;}

  .empty-state{text-align:center;padding:48px;color:#546e7a;}
  .spinner{width:28px;height:28px;border:2px solid rgba(0,229,255,.2);border-top-color:#00e5ff;border-radius:50%;animation:spin .8s linear infinite;}
  .loading-wrap{display:flex;justify-content:center;padding:48px;}
`;

function ScoreGauge({ score, status }) {
  const size = 160;
  const r    = 60;
  const cx   = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;

  const color = score >= 80 ? '#51cf66' : score >= 60 ? '#ffa726' : '#ff4d4d';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor={color} stopOpacity="0.8" />
          <stop offset="100%" stopColor={color} />
        </linearGradient>
      </defs>
      {/* Background circle */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
      {/* Score arc */}
      <circle cx={cx} cy={cy} r={r} fill="none"
        stroke="url(#scoreGrad)" strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: 'stroke-dashoffset 1.2s ease' }}
      />
      <text x={cx} y={cy - 8} className="score-num" fill={color} textAnchor="middle" dominantBaseline="middle"
        style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 28, fontWeight: 700 }}>
        {score}%
      </text>
      <text x={cx} y={cy + 16} fill="#546e7a" textAnchor="middle" dominantBaseline="middle"
        style={{ fontFamily: 'Inter, sans-serif', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        COMPLIANCE
      </text>
    </svg>
  );
}

export default function Compliance() {
  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [framework,  setFramework]  = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expanded,   setExpanded]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get('/api/compliance');
      setData(res);
    } catch (err) {
      toast.error('Failed to load compliance data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const score  = data?.score || 0;
  const status = data?.overall_status || 'N/A';

  const statusColor = score >= 80 ? '#51cf66' : score >= 60 ? '#ffa726' : '#ff4d4d';
  const statusBg    = score >= 80 ? 'rgba(81,207,102,.12)' : score >= 60 ? 'rgba(255,167,38,.12)' : 'rgba(255,77,77,.12)';
  const statusBorder= score >= 80 ? 'rgba(81,207,102,.3)'  : score >= 60 ? 'rgba(255,167,38,.3)'  : 'rgba(255,77,77,.3)';

  // Combine and filter controls
  const allControls = [
    ...(data?.iso_results  || []),
    ...(data?.nist_results || []),
  ];

  const filtered = allControls.filter(c => {
    const matchFW     = framework === 'all' || c.framework.includes(framework);
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchFW && matchStatus;
  });

  const counts = {
    PASS:    allControls.filter(c => c.status === 'PASS').length,
    FAIL:    allControls.filter(c => c.status === 'FAIL').length,
    WARNING: allControls.filter(c => c.status === 'WARNING').length,
  };

  const toggleExpand = (id) => setExpanded(prev => prev === id ? null : id);

  return (
    <>
      <style>{styles}</style>
      <div className="comp-page">
        <Sidebar />
        <div className="comp-content">

          <div className="page-header">
            <div>
              <h1 className="page-title">✅ Compliance Checker</h1>
              <p className="page-sub">Automated mapping of vulnerabilities to ISO 27001:2022 and NIST CSF 2.0 controls</p>
            </div>
            <button className="btn-refresh" onClick={load}>↺ Refresh</button>
          </div>

          {loading ? (
            <div className="loading-wrap"><div className="spinner" /></div>
          ) : (
            <>
              {/* Top row — Score + Stats + Summary */}
              <div className="top-row">

                {/* Score gauge */}
                <div className="score-panel">
                  <div className="score-panel-title">Overall Score</div>
                  <ScoreGauge score={score} status={status} />
                  <div className="status-badge" style={{
                    background: statusBg,
                    border: `1px solid ${statusBorder}`,
                    color: statusColor,
                  }}>
                    {status}
                  </div>
                  <div style={{marginTop:12,width:'100%'}}>
                    <div style={{fontSize:10,color:'#546e7a',fontFamily:'JetBrains Mono',textAlign:'center',marginBottom:6}}>
                      {data?.passed}/{data?.total_controls} controls passed
                    </div>
                    <div className="progress-bar-wrap">
                      <div className="progress-bar-fill" style={{
                        width:`${score}%`,
                        background: `linear-gradient(90deg, ${statusColor}88, ${statusColor})`,
                      }} />
                    </div>
                  </div>
                </div>

                {/* ISO 27001 stats */}
                <div className="panel">
                  <div className="panel-title">ISO 27001:2022</div>
                  <div className="stat-grid">
                    {[
                      { label:'Passed',   value: (data?.iso_results||[]).filter(c=>c.status==='PASS').length,    color:'#51cf66' },
                      { label:'Failed',   value: (data?.iso_results||[]).filter(c=>c.status==='FAIL').length,    color:'#ff4d4d' },
                      { label:'Warnings', value: (data?.iso_results||[]).filter(c=>c.status==='WARNING').length, color:'#ffa726' },
                      { label:'Total',    value: (data?.iso_results||[]).length,                                  color:'#00e5ff' },
                    ].map((s,i) => (
                      <div key={i} className="stat-box">
                        <div className="stat-box-label">{s.label}</div>
                        <div className="stat-box-value" style={{color:s.color}}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* NIST CSF stats */}
                <div className="panel">
                  <div className="panel-title">NIST CSF 2.0</div>
                  <div className="stat-grid">
                    {[
                      { label:'Passed',   value: (data?.nist_results||[]).filter(c=>c.status==='PASS').length,    color:'#51cf66' },
                      { label:'Failed',   value: (data?.nist_results||[]).filter(c=>c.status==='FAIL').length,    color:'#ff4d4d' },
                      { label:'Warnings', value: (data?.nist_results||[]).filter(c=>c.status==='WARNING').length, color:'#ffa726' },
                      { label:'Total',    value: (data?.nist_results||[]).length,                                  color:'#00e5ff' },
                    ].map((s,i) => (
                      <div key={i} className="stat-box">
                        <div className="stat-box-label">{s.label}</div>
                        <div className="stat-box-value" style={{color:s.color}}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Summary rows */}
              {(data?.summary?.critical_issues?.length > 0 || data?.summary?.quick_wins?.length > 0) && (
                <div className="summary-row">
                  <div className="summary-box">
                    <div className="summary-box-title" style={{color:'#ff4d4d'}}>
                      🔴 Critical Issues — Fix Immediately
                    </div>
                    {(data?.summary?.critical_issues || []).map((item, i) => (
                      <div key={i} className="summary-item">⛔ {item}</div>
                    ))}
                    {data?.summary?.critical_issues?.length === 0 && (
                      <div className="summary-item" style={{color:'#51cf66'}}>✓ No critical issues</div>
                    )}
                  </div>
                  <div className="summary-box">
                    <div className="summary-box-title" style={{color:'#ffa726'}}>
                      ⚠ Warnings — Review Soon
                    </div>
                    {(data?.summary?.quick_wins || []).map((item, i) => (
                      <div key={i} className="summary-item">⚠ {item}</div>
                    ))}
                    {data?.summary?.quick_wins?.length === 0 && (
                      <div className="summary-item" style={{color:'#51cf66'}}>✓ No warnings</div>
                    )}
                  </div>
                </div>
              )}

              {/* Controls list */}
              <div className="panel">
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
                  <div className="panel-title" style={{margin:0}}>
                    Controls ({filtered.length})
                  </div>
                  <div style={{display:'flex',gap:6,alignItems:'center'}}>
                    <span style={{fontSize:11,color:'#546e7a',fontFamily:'JetBrains Mono'}}>
                      ✓{counts.PASS} ✗{counts.FAIL} ⚠{counts.WARNING}
                    </span>
                  </div>
                </div>

                {/* Framework tabs */}
                <div className="fw-tabs">
                  {['all','ISO 27001','NIST'].map(f => (
                    <button key={f} className={`fw-tab ${framework===f?'active':''}`} onClick={()=>setFramework(f)}>
                      {f==='all'?'All Frameworks':f}
                    </button>
                  ))}
                </div>

                {/* Status filter */}
                <div className="filter-bar">
                  {['all','FAIL','WARNING','PASS'].map(f => (
                    <button key={f}
                      className={`filter-pill f-${f} ${statusFilter===f?'active':''}`}
                      onClick={()=>setStatusFilter(f)}
                    >
                      {f==='all'?`All (${allControls.length})`:
                       f==='FAIL'?`Failed (${counts.FAIL})`:
                       f==='WARNING'?`Warnings (${counts.WARNING})`:
                       `Passed (${counts.PASS})`}
                    </button>
                  ))}
                </div>

                <div className="controls-wrap">
                  {filtered.length === 0 ? (
                    <div className="empty-state">
                      <p style={{color:'#546e7a',margin:0}}>No controls match the current filter</p>
                    </div>
                  ) : filtered.map((ctrl, i) => (
                    <div
                      key={`${ctrl.framework}-${ctrl.id}`}
                      className={`control-card ${expanded===ctrl.id?'expanded':''}`}
                      style={{animationDelay:`${i*0.03}s`}}
                      onClick={() => toggleExpand(ctrl.id)}
                    >
                      <div className="control-header">
                        <span className="control-id">{ctrl.id}</span>
                        <span className="control-title">{ctrl.title}</span>
                        <span style={{
                          fontSize:10,color:'#37474f',fontFamily:'JetBrains Mono',
                          marginRight:8,flexShrink:0,display:'none'
                        }}>
                          {ctrl.framework}
                        </span>
                        <span style={{
                          fontSize:9,color:'#37474f',fontFamily:'JetBrains Mono',
                          marginRight:8,flexShrink:0,
                        }}>
                          {ctrl.framework.includes('ISO')?'ISO':'NIST'}
                        </span>
                        <span className={`status-pill status-${ctrl.status}`}>
                          {ctrl.status==='PASS'?'✓ PASS':ctrl.status==='FAIL'?'✗ FAIL':'⚠ WARN'}
                        </span>
                        <span style={{color:'#37474f',fontSize:12,marginLeft:8,flexShrink:0}}>
                          {expanded===ctrl.id?'▲':'▼'}
                        </span>
                      </div>

                      {expanded === ctrl.id && (
                        <div className="control-detail">
                          <p className="detail-desc">{ctrl.description}</p>
                          <div className="detail-finding">
                            🔍 {ctrl.detail}
                          </div>
                          {ctrl.status !== 'PASS' && (
                            <div className="detail-remediation">
                              <div className="detail-remediation-label">Recommended Action</div>
                              {ctrl.remediation}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

            </>
          )}

        </div>
      </div>
    </>
  );
}