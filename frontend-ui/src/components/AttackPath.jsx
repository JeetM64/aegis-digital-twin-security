import React, { useEffect, useState, useCallback } from 'react';
import Sidebar from './Sidebar';
import api from '../services/api';
import toast from 'react-hot-toast';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');

  @keyframes fadeInUp  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes shimmer   { 0%{background-position:-200% center} 100%{background-position:200% center} }
  @keyframes spin      { to{transform:rotate(360deg)} }
  @keyframes pulse     { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.9)} }
  @keyframes dash      { to{stroke-dashoffset:-20} }
  @keyframes glow      { 0%,100%{filter:drop-shadow(0 0 4px #ff4d4d)} 50%{filter:drop-shadow(0 0 12px #ff4d4d)} }

  *{box-sizing:border-box;}
  .ap-page{display:flex;background:#0a1929;min-height:100vh;font-family:'Inter',sans-serif;}
  .ap-content{margin-left:240px;flex:1;padding:36px;animation:fadeInUp .5s ease;}

  .page-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;padding-bottom:20px;border-bottom:1px solid rgba(0,229,255,.1);}
  .page-title{font-family:'JetBrains Mono',monospace;font-size:28px;font-weight:700;background:linear-gradient(90deg,#ff4d4d,#ffa726,#ffd93d);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:shimmer 4s linear infinite;margin:0 0 5px;}
  .page-sub{color:#546e7a;font-size:13px;margin:0;}

  .btn-refresh{padding:10px 18px;background:transparent;border:1px solid rgba(255,77,77,.3);border-radius:10px;color:#ff6b6b;font-size:12px;font-family:'JetBrains Mono',monospace;cursor:pointer;transition:all .2s;}
  .btn-refresh:hover{background:rgba(255,77,77,.08);}

  /* Stats */
  .stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:24px;}
  .stat-card{background:linear-gradient(135deg,#001e3c,#0d2137);border:1px solid rgba(255,77,77,.1);border-radius:14px;padding:18px;position:relative;overflow:hidden;animation:fadeInUp .5s ease backwards;transition:transform .2s,border-color .2s;}
  .stat-card:hover{transform:translateY(-2px);border-color:rgba(255,77,77,.25);}
  .stat-top{position:absolute;top:0;left:0;right:0;height:3px;border-radius:14px 14px 0 0;}
  .stat-label{color:#546e7a;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.09em;margin-bottom:8px;}
  .stat-value{font-family:'JetBrains Mono',monospace;font-size:28px;font-weight:700;}

  /* Two column layout */
  .two-col{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
  .full-col{margin-top:16px;}

  /* Panel */
  .panel{background:linear-gradient(135deg,rgba(255,77,77,.04),rgba(255,107,107,.02));border:1px solid rgba(255,77,77,.12);border-radius:16px;padding:22px;}
  .panel-title{color:#ff6b6b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.1em;margin:0 0 16px;display:flex;align-items:center;justify-content:space-between;}
  .panel-title-left{display:flex;align-items:center;gap:8px;}
  .panel-title-left::before{content:'';display:inline-block;width:3px;height:13px;background:#ff6b6b;border-radius:2px;}

  /* Attack graph SVG */
  .graph-wrap{width:100%;overflow:hidden;border-radius:12px;background:rgba(0,0,0,.3);border:1px solid rgba(255,77,77,.1);}

  /* Path cards */
  .path-card{background:rgba(0,0,0,.25);border:1px solid rgba(255,77,77,.1);border-radius:12px;padding:16px;margin-bottom:12px;cursor:pointer;transition:all .2s;}
  .path-card:hover{border-color:rgba(255,77,77,.3);background:rgba(255,77,77,.04);}
  .path-card.selected{border-color:#ff4d4d;background:rgba(255,77,77,.06);}
  .path-card:last-child{margin-bottom:0;}

  .path-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;}
  .path-target{font-family:'JetBrains Mono',monospace;font-size:14px;font-weight:700;color:#e3f2fd;margin:0 0 3px;}
  .path-hostname{font-size:11px;color:#546e7a;font-family:'JetBrains Mono',monospace;}

  .risk-badge{display:inline-flex;align-items:center;padding:3px 10px;border-radius:20px;font-size:10px;font-weight:700;text-transform:uppercase;font-family:'JetBrains Mono',monospace;}
  .risk-CRITICAL{background:rgba(255,77,77,.15);color:#ff4d4d;border:1px solid rgba(255,77,77,.3);}
  .risk-HIGH{background:rgba(255,167,38,.15);color:#ffa726;border:1px solid rgba(255,167,38,.3);}
  .risk-MEDIUM{background:rgba(255,217,61,.15);color:#ffd93d;border:1px solid rgba(255,217,61,.3);}
  .risk-LOW{background:rgba(81,207,102,.15);color:#51cf66;border:1px solid rgba(81,207,102,.3);}
  .risk-UNKNOWN{background:rgba(144,164,174,.12);color:#78909c;border:1px solid rgba(144,164,174,.2);}

  .path-steps{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;}
  .step-chip{padding:3px 9px;border-radius:6px;font-size:10px;font-weight:700;font-family:'JetBrains Mono',monospace;background:rgba(255,77,77,.1);color:#ff6b6b;border:1px solid rgba(255,77,77,.2);}

  .path-impact{font-size:11px;color:#78909c;line-height:1.5;font-style:italic;}

  .likelihood-bar{height:4px;background:rgba(255,255,255,.05);border-radius:2px;overflow:hidden;margin-top:10px;}
  .likelihood-fill{height:100%;border-radius:2px;background:linear-gradient(90deg,#ff4d4d,#ffa726);}

  /* Detail panel */
  .detail-panel{background:rgba(0,0,0,.25);border:1px solid rgba(255,77,77,.15);border-radius:12px;padding:18px;}
  .detail-title{font-family:'JetBrains Mono',monospace;font-size:15px;font-weight:700;color:#ff6b6b;margin:0 0 14px;}

  .step-timeline{position:relative;padding-left:24px;}
  .step-timeline::before{content:'';position:absolute;left:7px;top:0;bottom:0;width:2px;background:linear-gradient(180deg,rgba(255,77,77,.5),rgba(255,167,38,.2));}

  .timeline-item{position:relative;margin-bottom:16px;}
  .timeline-item:last-child{margin-bottom:0;}
  .timeline-dot{position:absolute;left:-20px;top:4px;width:10px;height:10px;border-radius:50%;border:2px solid #ff4d4d;background:#0a1929;}
  .timeline-dot.critical{background:#ff4d4d;animation:pulse 2s infinite;}

  .timeline-content{background:rgba(255,77,77,.06);border:1px solid rgba(255,77,77,.1);border-radius:8px;padding:12px;}
  .timeline-service{font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:700;color:#e3f2fd;margin:0 0 4px;}
  .timeline-technique{font-size:11px;color:#90caf9;margin:0 0 6px;}
  .timeline-gain{font-size:11px;color:#ffa726;margin:0;}
  .timeline-meta{display:flex;gap:8px;margin-top:8px;flex-wrap:wrap;}
  .meta-tag{font-size:10px;font-family:'JetBrains Mono',monospace;padding:2px 8px;border-radius:5px;}
  .tag-cvss-high{background:rgba(255,77,77,.12);color:#ff4d4d;border:1px solid rgba(255,77,77,.2);}
  .tag-cvss-med{background:rgba(255,167,38,.12);color:#ffa726;border:1px solid rgba(255,167,38,.2);}
  .tag-cvss-low{background:rgba(255,217,61,.12);color:#ffd93d;border:1px solid rgba(255,217,61,.2);}
  .tag-cve{background:rgba(130,177,255,.1);color:#82b1ff;border:1px solid rgba(130,177,255,.2);}

  /* Empty state */
  .empty-state{text-align:center;padding:48px;color:#546e7a;}
  .empty-icon{font-size:40px;opacity:.3;margin-bottom:12px;}

  /* Loading */
  .spinner{width:28px;height:28px;border:2px solid rgba(255,77,77,.2);border-top-color:#ff4d4d;border-radius:50%;animation:spin .8s linear infinite;}
  .loading-wrap{display:flex;justify-content:center;padding:48px;}

  /* Warning banner */
  .warning-banner{background:rgba(255,77,77,.06);border:1px solid rgba(255,77,77,.2);border-radius:12px;padding:14px 18px;margin-bottom:24px;display:flex;gap:12px;align-items:flex-start;}
  .warning-icon{font-size:18px;flex-shrink:0;}
  .warning-text{font-size:12px;color:#ff6b6b;line-height:1.6;}
  .warning-text strong{color:#ff4d4d;}
`;

function AttackGraph({ nodes, edges, selectedIp, onSelectNode }) {
  const W = 700, H = 340;
  const cx = W / 2, cy = H / 2;

  // Layout: internet at center, devices around it
  const deviceNodes = nodes.filter(n => n.id !== 'INTERNET');
  const internetNode = nodes.find(n => n.id === 'INTERNET');
  const r = Math.min(130, Math.max(80, deviceNodes.length * 25));

  const positions = { INTERNET: { x: cx, y: cy } };
  deviceNodes.forEach((n, i) => {
    const angle = (i / deviceNodes.length) * 2 * Math.PI - Math.PI / 2;
    positions[n.id] = { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });

  return (
    <svg className="graph-wrap" viewBox={`0 0 ${W} ${H}`} style={{ width:'100%', height:340 }}>
      <defs>
        <marker id="arrowRed" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#ff4d4d" />
        </marker>
        <marker id="arrowOrange" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#ffa726" />
        </marker>
        <radialGradient id="bgGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#0d1f30" />
          <stop offset="100%" stopColor="#060f1a" />
        </radialGradient>
      </defs>

      <rect width={W} height={H} fill="url(#bgGrad)" />

      {/* Grid dots */}
      {Array.from({length:14}).map((_,i) => Array.from({length:7}).map((_,j) => (
        <circle key={`${i}-${j}`} cx={i*55} cy={j*60} r="1" fill="rgba(0,229,255,0.06)" />
      )))}

      {/* Edges */}
      {edges.map((e, i) => {
        const from = positions[e.from];
        const to   = positions[e.to];
        if (!from || !to) return null;
        const isSelected = selectedIp === e.to;
        return (
          <g key={i}>
            <line
              x1={from.x} y1={from.y} x2={to.x} y2={to.y}
              stroke={isSelected ? e.color : 'rgba(255,77,77,0.25)'}
              strokeWidth={isSelected ? 2 : 1.5}
              strokeDasharray="6,4"
              markerEnd={e.cvss >= 7 ? 'url(#arrowRed)' : 'url(#arrowOrange)'}
              style={isSelected ? { animation:'dash 1s linear infinite' } : {}}
            />
            {isSelected && (
              <text
                x={(from.x+to.x)/2} y={(from.y+to.y)/2 - 6}
                fill={e.color} fontSize="9" textAnchor="middle"
                fontFamily="JetBrains Mono, monospace" fontWeight="600"
              >
                {e.label}
              </text>
            )}
          </g>
        );
      })}

      {/* Nodes */}
      {nodes.map((n, i) => {
        const pos = positions[n.id];
        if (!pos) return null;
        const isSelected = selectedIp === n.id;
        const isInternet = n.id === 'INTERNET';
        const nodeR = isInternet ? 28 : 22;

        return (
          <g key={i} onClick={() => !isInternet && onSelectNode(n.id)} style={{cursor: isInternet?'default':'pointer'}}>
            {isSelected && (
              <circle cx={pos.x} cy={pos.y} r={nodeR+8} fill="none"
                stroke={n.color} strokeWidth="1.5" opacity="0.4"
                style={{animation:'pulse 2s infinite'}} />
            )}
            <circle cx={pos.x} cy={pos.y} r={nodeR}
              fill={isInternet ? 'rgba(0,229,255,0.1)' : `${n.color}18`}
              stroke={isSelected ? n.color : `${n.color}55`}
              strokeWidth={isSelected ? 2 : 1.5}
            />
            <text x={pos.x} y={pos.y+1} textAnchor="middle" dominantBaseline="middle" fontSize={isInternet?16:14}>
              {n.icon}
            </text>
            <text x={pos.x} y={pos.y+nodeR+10} textAnchor="middle"
              fill={isSelected ? n.color : '#90caf9'} fontSize="9"
              fontFamily="JetBrains Mono, monospace" fontWeight={isSelected?'700':'400'}
            >
              {isInternet ? 'INTERNET' : n.ip}
            </text>
            {!isInternet && n.vuln_count > 0 && (
              <g>
                <circle cx={pos.x+nodeR-4} cy={pos.y-nodeR+4} r="8" fill="#ff4d4d" />
                <text x={pos.x+nodeR-4} y={pos.y-nodeR+5} textAnchor="middle"
                  dominantBaseline="middle" fill="white" fontSize="8" fontWeight="700">
                  {n.vuln_count}
                </text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export default function AttackPath() {
  const [data,     setData]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get('/api/attack-paths');
      setData(res);
      if (res.paths && res.paths.length > 0) {
        setSelected(res.paths[0].target);
      }
    } catch (err) {
      toast.error('Failed to load attack paths');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const selectedPath = data?.paths?.find(p => p.target === selected);
  const summary = data?.summary || {};

  return (
    <>
      <style>{styles}</style>
      <div className="ap-page">
        <Sidebar />
        <div className="ap-content">

          <div className="page-header">
            <div>
              <h1 className="page-title">⚔ Attack Path Simulation</h1>
              <p className="page-sub">AI-simulated hacker routes through your network — based on real vulnerability data</p>
            </div>
            <button className="btn-refresh" onClick={load}>↺ Refresh</button>
          </div>

          {/* Warning */}
          <div className="warning-banner">
            <span className="warning-icon">⚠️</span>
            <div className="warning-text">
              <strong>Simulation Only</strong> — These attack paths are generated by AI analysis of your vulnerability data.
              No actual attacks are performed. Use this to understand your risk exposure and prioritize defenses.
            </div>
          </div>

          {/* Stats */}
          <div className="stats-row">
            {[
              { label:'Attack Paths',     value: summary.total_paths    || 0, color:'#ff4d4d', delay:'0s'    },
              { label:'Critical Paths',   value: summary.critical_paths || 0, color:'#ff6b6b', delay:'.07s'  },
              { label:'Exposed Nodes',    value: summary.total_nodes    || 0, color:'#ffa726', delay:'.14s'  },
              { label:'Overall Risk',     value: summary.risk_level     || 'N/A', color:'#ffd93d', delay:'.21s' },
            ].map((c,i) => (
              <div key={i} className="stat-card" style={{animationDelay:c.delay}}>
                <div className="stat-top" style={{background:c.color}} />
                <div className="stat-label">{c.label}</div>
                <div className="stat-value" style={{color:c.color}}>{loading?'—':c.value}</div>
              </div>
            ))}
          </div>

          {loading ? (
            <div className="loading-wrap"><div className="spinner" /></div>
          ) : !data || data.paths.length === 0 ? (
            <div className="panel">
              <div className="empty-state">
                <div className="empty-icon">🛡️</div>
                <p style={{color:'#546e7a',fontSize:15,margin:'0 0 6px'}}>No attack paths found</p>
                <p style={{color:'#37474f',fontSize:13,margin:0}}>Run scans on your network devices to generate attack path analysis</p>
              </div>
            </div>
          ) : (
            <>
              {/* Graph + Path list */}
              <div className="two-col">

                {/* Attack Graph */}
                <div className="panel">
                  <div className="panel-title">
                    <div className="panel-title-left">Live Attack Graph</div>
                    <span style={{color:'#546e7a',fontSize:10,fontFamily:'JetBrains Mono'}}>Click node to select</span>
                  </div>
                  <AttackGraph
                    nodes={data.nodes}
                    edges={data.edges}
                    selectedIp={selected}
                    onSelectNode={setSelected}
                  />
                </div>

                {/* Path list */}
                <div className="panel">
                  <div className="panel-title">
                    <div className="panel-title-left">Attack Paths ({data.paths.length})</div>
                  </div>
                  <div style={{overflowY:'auto',maxHeight:340}}>
                    {data.paths.map((p, i) => (
                      <div
                        key={i}
                        className={`path-card ${selected===p.target?'selected':''}`}
                        onClick={() => setSelected(p.target)}
                      >
                        <div className="path-header">
                          <div>
                            <p className="path-target">{p.target}</p>
                            <p className="path-hostname">{p.hostname}</p>
                          </div>
                          <span className={`risk-badge risk-${p.risk_level||'UNKNOWN'}`}>
                            {p.risk_level}
                          </span>
                        </div>
                        <div className="path-steps">
                          {p.attack_steps.map((s,j) => (
                            <span key={j} className="step-chip">{s.service}:{s.port}</span>
                          ))}
                        </div>
                        <p className="path-impact">{p.impact}</p>
                        <div className="likelihood-bar">
                          <div className="likelihood-fill" style={{width:`${p.likelihood*100}%`}} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Detail panel */}
              {selectedPath && (
                <div className="full-col">
                  <div className="panel">
                    <div className="panel-title">
                      <div className="panel-title-left">
                        Attack Timeline — {selectedPath.hostname} ({selectedPath.target})
                      </div>
                      <span className={`risk-badge risk-${selectedPath.risk_level||'UNKNOWN'}`}>
                        {selectedPath.risk_level}
                      </span>
                    </div>

                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                      <div>
                        <div style={{fontSize:11,color:'#546e7a',marginBottom:14,fontFamily:'JetBrains Mono',textTransform:'uppercase',letterSpacing:'0.08em'}}>
                          Step-by-step attack route
                        </div>
                        <div className="step-timeline">
                          {/* Entry point */}
                          <div className="timeline-item">
                            <div className="timeline-dot" style={{borderColor:'#00e5ff',background:'#00e5ff'}} />
                            <div className="timeline-content" style={{borderColor:'rgba(0,229,255,.2)',background:'rgba(0,229,255,.04)'}}>
                              <p className="timeline-service" style={{color:'#00e5ff'}}>🌐 Internet — Entry Point</p>
                              <p className="timeline-technique" style={{color:'#546e7a'}}>Attacker begins from public internet</p>
                            </div>
                          </div>

                          {selectedPath.attack_steps.map((step, i) => (
                            <div key={i} className="timeline-item">
                              <div className={`timeline-dot ${step.cvss>=9?'critical':''}`}
                                style={{borderColor: step.cvss>=9?'#ff4d4d':step.cvss>=7?'#ffa726':'#ffd93d'}} />
                              <div className="timeline-content">
                                <p className="timeline-service">
                                  {i+1}. {step.service}:{step.port}
                                </p>
                                <p className="timeline-technique">🎯 {step.technique}</p>
                                <p className="timeline-gain">💰 Gain: {step.gain}</p>
                                <div className="timeline-meta">
                                  <span className={`meta-tag ${step.cvss>=9?'tag-cvss-high':step.cvss>=7?'tag-cvss-med':'tag-cvss-low'}`}>
                                    CVSS {step.cvss}
                                  </span>
                                  {step.cve && <span className="meta-tag tag-cve">{step.cve}</span>}
                                  <span className={`meta-tag ${step.severity==='critical'?'tag-cvss-high':step.severity==='high'?'tag-cvss-med':'tag-cvss-low'}`}>
                                    {step.severity?.toUpperCase()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}

                          {/* Final impact */}
                          <div className="timeline-item">
                            <div className="timeline-dot" style={{borderColor:'#ff4d4d',background:'#ff4d4d',animation:'pulse 1.5s infinite'}} />
                            <div className="timeline-content" style={{borderColor:'rgba(255,77,77,.3)',background:'rgba(255,77,77,.06)'}}>
                              <p className="timeline-service" style={{color:'#ff4d4d'}}>🏴 Target Compromised</p>
                              <p className="timeline-technique" style={{color:'#ff6b6b'}}>{selectedPath.impact}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Summary stats */}
                      <div>
                        <div style={{fontSize:11,color:'#546e7a',marginBottom:14,fontFamily:'JetBrains Mono',textTransform:'uppercase',letterSpacing:'0.08em'}}>
                          Risk Summary
                        </div>
                        {[
                          { label:'Target IP',        value: selectedPath.target },
                          { label:'Hostname',          value: selectedPath.hostname },
                          { label:'Total Vulns',       value: selectedPath.total_vulns },
                          { label:'Attack Vectors',    value: selectedPath.attack_steps.length },
                          { label:'Exploit Likelihood',value: `${Math.round(selectedPath.likelihood*100)}%` },
                          { label:'Potential Impact',  value: selectedPath.risk_level },
                        ].map((row,i) => (
                          <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,.04)',fontSize:13}}>
                            <span style={{color:'#546e7a'}}>{row.label}</span>
                            <span style={{color:'#e3f2fd',fontFamily:'JetBrains Mono',fontWeight:600}}>{row.value}</span>
                          </div>
                        ))}

                        <div style={{marginTop:20,padding:14,background:'rgba(255,77,77,.06)',border:'1px solid rgba(255,77,77,.15)',borderRadius:10}}>
                          <div style={{fontSize:11,color:'#ff6b6b',fontWeight:700,marginBottom:8,fontFamily:'JetBrains Mono',textTransform:'uppercase'}}>
                            ⚡ Recommended Actions
                          </div>
                          {selectedPath.attack_steps.slice(0,2).map((s,i) => (
                            <p key={i} style={{fontSize:11,color:'#90caf9',margin:'0 0 6px',lineHeight:1.5}}>
                              {i+1}. Patch or restrict <strong style={{color:'#e3f2fd'}}>{s.service}:{s.port}</strong> — CVSS {s.cvss}
                            </p>
                          ))}
                          <p style={{fontSize:11,color:'#90caf9',margin:0,lineHeight:1.5}}>
                            {selectedPath.attack_steps.length+1}. Enable firewall rules to limit exposure
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </>
  );
}