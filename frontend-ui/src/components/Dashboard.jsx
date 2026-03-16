import React, { useEffect, useState, useContext, useCallback, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import Sidebar from "./Sidebar";
import api from "../services/api";
import toast from "react-hot-toast";
 
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');
 
  @keyframes fadeInUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
  @keyframes spin { to{transform:rotate(360deg)} }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(0.95)} }
  @keyframes countUp { from{opacity:0;transform:scale(0.7)} to{opacity:1;transform:scale(1)} }
  @keyframes glow { 0%,100%{filter:drop-shadow(0 0 4px currentColor)} 50%{filter:drop-shadow(0 0 12px currentColor)} }
  @keyframes slideIn { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:translateX(0)} }
  @keyframes barGrow { from{width:0} to{width:var(--w)} }
  @keyframes countdown { from{stroke-dashoffset:0} to{stroke-dashoffset:88} }
 
  *{box-sizing:border-box;}
  .dash-main{display:flex;background:#0a1929;min-height:100vh;font-family:'Inter',sans-serif;}
  .dash-content{margin-left:240px;flex:1;padding:36px;animation:fadeInUp 0.5s ease;}
 
  /* Header */
  .dash-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;padding-bottom:20px;border-bottom:1px solid rgba(0,229,255,0.1);}
  .dash-title{font-size:30px;font-weight:700;font-family:'JetBrains Mono',monospace;background:linear-gradient(90deg,#00e5ff,#82b1ff,#fff);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:shimmer 4s linear infinite;margin:0 0 5px;}
  .dash-subtitle{color:#64b5f6;font-size:13px;margin:0;}
  .header-right{display:flex;flex-direction:column;align-items:flex-end;gap:8px;}
  .dash-clock{font-family:'JetBrains Mono',monospace;font-size:13px;color:#90caf9;text-align:right;}
  .refresh-wrap{display:flex;align-items:center;gap:8px;}
  .refresh-btn{padding:7px 14px;background:rgba(0,229,255,0.08);border:1px solid rgba(0,229,255,0.2);border-radius:8px;color:#00e5ff;font-size:11px;font-family:'JetBrains Mono',monospace;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;gap:6px;}
  .refresh-btn:hover{background:rgba(0,229,255,0.15);border-color:rgba(0,229,255,0.4);}
  .refresh-btn.spinning .refresh-icon{animation:spin 0.8s linear infinite;}
  .countdown-wrap{display:flex;align-items:center;gap:6px;font-family:'JetBrains Mono',monospace;font-size:10px;color:#546e7a;}
  .countdown-svg{transform:rotate(-90deg);}
  .countdown-track{fill:none;stroke:rgba(0,229,255,0.1);stroke-width:2;}
  .countdown-fill{fill:none;stroke:#00e5ff;stroke-width:2;stroke-linecap:round;transition:stroke-dashoffset 1s linear;}
 
  /* Stats grid */
  .stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:24px;}
  .stat-card{background:linear-gradient(135deg,#001e3c,#0d2137);border:1px solid rgba(0,229,255,0.08);border-radius:14px;padding:20px;position:relative;overflow:hidden;transition:transform 0.2s,border-color 0.2s,box-shadow 0.2s;animation:fadeInUp 0.5s ease backwards;}
  .stat-card:hover{transform:translateY(-3px);border-color:rgba(0,229,255,0.22);box-shadow:0 8px 28px rgba(0,0,0,0.3);}
  .stat-top{position:absolute;top:0;left:0;right:0;height:3px;border-radius:14px 14px 0 0;}
  .stat-icon-bg{position:absolute;bottom:-8px;right:-4px;font-size:52px;opacity:0.05;}
  .stat-label{color:#546e7a;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.09em;margin-bottom:8px;}
  .stat-value{font-family:'JetBrains Mono',monospace;font-size:36px;font-weight:700;margin:0;animation:countUp 0.5s ease;}
  .stat-trend{font-size:10px;margin-top:6px;font-family:'JetBrains Mono',monospace;}
 
  /* Two column layout */
  .two-col{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;}
  .three-col{display:grid;grid-template-columns:2fr 1fr;gap:16px;margin-bottom:16px;}
 
  /* Panel */
  .panel{background:linear-gradient(135deg,rgba(0,229,255,0.04),rgba(0,145,234,0.02));border:1px solid rgba(0,229,255,0.1);border-radius:16px;padding:22px;position:relative;overflow:hidden;}
  .panel::after{content:'';position:absolute;top:-40px;right:-40px;width:120px;height:120px;background:radial-gradient(circle,rgba(0,229,255,0.04),transparent 70%);pointer-events:none;}
  .panel-title{color:#00e5ff;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 16px;display:flex;align-items:center;justify-content:space-between;}
  .panel-title-left{display:flex;align-items:center;gap:8px;}
  .panel-title-left::before{content:'';display:inline-block;width:3px;height:13px;background:#00e5ff;border-radius:2px;}
 
  /* Risk Gauge */
  .gauge-wrap{display:flex;flex-direction:column;align-items:center;padding:10px 0;}
  .gauge-svg{overflow:visible;}
  .gauge-score{font-family:'JetBrains Mono',monospace;font-size:32px;font-weight:700;text-anchor:middle;dominant-baseline:middle;}
  .gauge-label{font-family:'Inter',monospace;font-size:10px;text-anchor:middle;dominant-baseline:middle;letter-spacing:0.06em;}
  .risk-badge{display:inline-block;padding:5px 18px;border-radius:20px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;font-family:'JetBrains Mono',monospace;margin-top:10px;}
  .gauge-stats{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px;width:100%;}
  .gauge-stat{background:rgba(0,0,0,0.2);border-radius:8px;padding:8px 10px;text-align:center;}
  .gauge-stat-label{font-size:9px;color:#37474f;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:3px;}
  .gauge-stat-value{font-family:'JetBrains Mono',monospace;font-size:14px;font-weight:700;}
 
  /* Severity bar chart */
  .sev-chart{display:flex;flex-direction:column;gap:10px;margin-top:4px;}
  .sev-row{display:flex;align-items:center;gap:10px;}
  .sev-row-label{font-family:'JetBrains Mono',monospace;font-size:10px;width:58px;text-align:right;flex-shrink:0;}
  .sev-bar-track{flex:1;height:8px;background:rgba(255,255,255,0.05);border-radius:4px;overflow:hidden;}
  .sev-bar-fill{height:100%;border-radius:4px;transition:width 0.8s ease;}
  .sev-row-count{font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;width:28px;text-align:right;flex-shrink:0;}
 
  /* Scan trend mini chart */
  .trend-chart{width:100%;height:80px;margin-top:8px;}
  .trend-line{fill:none;stroke:#00e5ff;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;}
  .trend-area{fill:url(#trendGrad);opacity:0.3;}
  .trend-dot{fill:#00e5ff;animation:pulse 2s infinite;}
 
  /* Vuln rows */
  .vuln-row{display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-radius:10px;margin-bottom:7px;background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.05);transition:background 0.2s,border-color 0.2s;cursor:pointer;}
  .vuln-row:hover{background:rgba(0,229,255,0.06);border-color:rgba(0,229,255,0.15);}
  .vuln-row:last-child{margin-bottom:0;}
  .vuln-service{color:#e3f2fd;font-weight:600;font-size:13px;font-family:'JetBrains Mono',monospace;margin:0 0 4px;}
  .vuln-meta{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-top:3px;}
  .tag{font-size:10px;font-weight:600;padding:2px 7px;border-radius:4px;font-family:'JetBrains Mono',monospace;}
  .tag-cvss{background:rgba(255,167,38,0.1);border:1px solid rgba(255,167,38,0.2);color:#ffa726;}
  .tag-cve{background:rgba(100,181,246,0.08);border:1px solid rgba(100,181,246,0.15);color:#64b5f6;}
  .tag-critical{background:rgba(255,77,77,0.12);border:1px solid rgba(255,77,77,0.25);color:#ff4d4d;}
  .tag-high{background:rgba(255,107,107,0.12);border:1px solid rgba(255,107,107,0.25);color:#ff6b6b;}
  .tag-medium{background:rgba(255,167,38,0.12);border:1px solid rgba(255,167,38,0.25);color:#ffa726;}
  .tag-low{background:rgba(81,207,102,0.12);border:1px solid rgba(81,207,102,0.25);color:#51cf66;}
  .priority-badge{background:linear-gradient(135deg,rgba(255,107,107,0.2),rgba(255,107,107,0.1));border:1px solid rgba(255,107,107,0.3);color:#ff6b6b;font-size:11px;font-weight:700;font-family:'JetBrains Mono',monospace;padding:4px 10px;border-radius:6px;white-space:nowrap;flex-shrink:0;}
 
  /* Activity feed */
  .activity-feed{display:flex;flex-direction:column;gap:10px;}
  .activity-item{display:flex;gap:12px;align-items:flex-start;padding:10px;border-radius:10px;background:rgba(0,0,0,0.15);border:1px solid rgba(255,255,255,0.04);animation:slideIn 0.3s ease;}
  .activity-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;margin-top:5px;}
  .activity-text{font-size:12px;color:#90caf9;line-height:1.5;flex:1;}
  .activity-text strong{color:#e3f2fd;}
  .activity-time{font-family:'JetBrains Mono',monospace;font-size:10px;color:#37474f;white-space:nowrap;}
 
  /* Recent scans table */
  .scans-table{width:100%;border-collapse:collapse;}
  .scans-table th{color:#546e7a;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;padding:0 12px 10px;text-align:left;border-bottom:1px solid rgba(0,229,255,0.08);}
  .scans-table td{padding:11px 12px;font-size:12px;color:#cfd8dc;font-family:'JetBrains Mono',monospace;border-bottom:1px solid rgba(255,255,255,0.03);}
  .scans-table tr:hover td{background:rgba(0,229,255,0.03);}
  .scans-table tr:last-child td{border-bottom:none;}
  .status-pill{display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:20px;font-size:10px;}
  .status-completed{background:rgba(81,207,102,0.1);color:#51cf66;border:1px solid rgba(81,207,102,0.2);}
  .status-running{background:rgba(0,229,255,0.1);color:#00e5ff;border:1px solid rgba(0,229,255,0.2);}
  .status-failed{background:rgba(255,77,77,0.1);color:#ff4d4d;border:1px solid rgba(255,77,77,0.2);}
  .prog-wrap{display:flex;align-items:center;gap:8px;}
  .prog-bar{width:60px;height:4px;background:rgba(255,255,255,0.05);border-radius:2px;overflow:hidden;}
  .prog-fill{height:100%;border-radius:2px;background:linear-gradient(90deg,#00e5ff,#0091ea);}
 
  /* Loading */
  .loading-screen{background:#0a1929;color:#fff;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;font-family:'JetBrains Mono',monospace;}
  .loading-spinner{width:40px;height:40px;border:2px solid rgba(0,229,255,0.2);border-top-color:#00e5ff;border-radius:50%;animation:spin 0.8s linear infinite;}
  .empty-state{color:#546e7a;font-size:12px;text-align:center;padding:20px 0;}
`;
 
const REFRESH_INTERVAL = 30;
 
function getRiskColor(level) {
  if (!level) return '#546e7a';
  const l = level.toUpperCase();
  if (l === 'CRITICAL') return '#ff4d4d';
  if (l === 'HIGH')     return '#ff6b6b';
  if (l === 'MEDIUM')   return '#ffa726';
  return '#51cf66';
}
 
function getSevTag(sev) {
  const s = (sev || '').toLowerCase();
  return `tag tag-${s || 'low'}`;
}
 
// Simple SVG gauge
function RiskGauge({ score, level }) {
  const color = getRiskColor(level);
  const size  = 140;
  const r     = 54;
  const cx    = size / 2;
  const cy    = size / 2 + 10;
  const circumference = Math.PI * r; // half circle
  const offset = circumference - (score / 100) * circumference;
 
  return (
    <div className="gauge-wrap">
      <svg className="gauge-svg" width={size} height={size * 0.65} viewBox={`0 0 ${size} ${size * 0.65}`}>
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#51cf66" />
            <stop offset="50%"  stopColor="#ffa726" />
            <stop offset="100%" stopColor="#ff4d4d" />
          </linearGradient>
        </defs>
        {/* Track */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" strokeLinecap="round"
        />
        {/* Fill */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke="url(#gaugeGrad)" strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
        {/* Score text */}
        <text x={cx} y={cy - 12} className="gauge-score" fill={color}>{score}</text>
        <text x={cx} y={cy + 8}  className="gauge-label" fill="#546e7a">RISK SCORE</text>
      </svg>
    </div>
  );
}
 
// Mini bar chart for severity
function SevChart({ counts }) {
  const max = Math.max(counts.critical, counts.high, counts.medium, counts.low, 1);
  const bars = [
    { label: 'Critical', count: counts.critical, color: '#ff4d4d' },
    { label: 'High',     count: counts.high,     color: '#ffa726' },
    { label: 'Medium',   count: counts.medium,   color: '#ffd93d' },
    { label: 'Low',      count: counts.low,       color: '#51cf66' },
  ];
  return (
    <div className="sev-chart">
      {bars.map((b, i) => (
        <div key={i} className="sev-row">
          <span className="sev-row-label" style={{ color: b.color }}>{b.label}</span>
          <div className="sev-bar-track">
            <div className="sev-bar-fill" style={{
              width: `${(b.count / max) * 100}%`,
              background: b.color,
            }} />
          </div>
          <span className="sev-row-count" style={{ color: b.color }}>{b.count}</span>
        </div>
      ))}
    </div>
  );
}
 
// Mini trend line chart
function TrendChart({ scans }) {
  if (!scans || scans.length < 2) return (
    <div className="empty-state" style={{ padding: '12px 0' }}>Not enough scan data for trend</div>
  );
 
  const last10 = scans.slice(-10);
  const counts = last10.map((_, i) => i + 1);
  const w = 240, h = 60;
  const maxC = last10.length;
 
  const pts = last10.map((_, i) => {
    const x = (i / (last10.length - 1)) * w;
    const y = h - ((i + 1) / maxC) * (h - 10) - 5;
    return `${x},${y}`;
  });
 
  const polyline = pts.join(' ');
  const areaPath = `M 0,${h} L ${pts.join(' L ')} L ${w},${h} Z`;
 
  return (
    <svg className="trend-chart" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#00e5ff" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#00e5ff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} className="trend-area" />
      <polyline points={polyline} className="trend-line" />
      {last10.map((_, i) => {
        const [x, y] = pts[i].split(',');
        return <circle key={i} cx={x} cy={y} r="3" className="trend-dot" fill="#00e5ff" />;
      })}
    </svg>
  );
}
 
// Countdown circle
function CountdownCircle({ seconds, total }) {
  const r = 7;
  const circ = 2 * Math.PI * r;
  const offset = circ - (seconds / total) * circ;
  return (
    <svg className="countdown-svg" width="18" height="18" viewBox="0 0 18 18">
      <circle className="countdown-track" cx="9" cy="9" r={r} />
      <circle className="countdown-fill" cx="9" cy="9" r={r}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        style={{ transformOrigin: '9px 9px' }}
      />
    </svg>
  );
}
 
export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const [summary,     setSummary]     = useState({});
  const [recentScans, setRecentScans] = useState([]);
  const [allScans,    setAllScans]    = useState([]);
  const [networkRisk, setNetworkRisk] = useState({});
  const [topVulns,    setTopVulns]    = useState([]);
  const [sevCounts,   setSevCounts]   = useState({ critical:0, high:0, medium:0, low:0 });
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [now,         setNow]         = useState(new Date());
  const [countdown,   setCountdown]   = useState(REFRESH_INTERVAL);
  const countdownRef = useRef(REFRESH_INTERVAL);
 
  const loadDashboard = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const [summaryRes, scansRes, riskRes, topRes] = await Promise.all([
        api.get('/api/summary'),
        api.get('/api/scans'),
        api.get('/api/network-risk'),
        api.get('/api/top-vulnerabilities'),
      ]);
 
      setSummary(summaryRes.data);
 
      const scans = Array.isArray(scansRes.data) ? scansRes.data : [];
      setAllScans(scans);
      setRecentScans(scans.slice(0, 6));
 
      setNetworkRisk(riskRes.data);
 
      const vulns = topRes.data.top_vulnerabilities || [];
      setTopVulns(vulns);
 
      // Count severities from top vulns
      const counts = { critical:0, high:0, medium:0, low:0 };
      vulns.forEach(v => {
        const s = (v.severity||'low').toLowerCase();
        if (counts[s] !== undefined) counts[s]++;
      });
      setSevCounts(counts);
 
    } catch (err) {
      console.error(err);
      if (!silent) toast.error('Dashboard failed to load');
    } finally {
      setLoading(false);
      setRefreshing(false);
      countdownRef.current = REFRESH_INTERVAL;
      setCountdown(REFRESH_INTERVAL);
    }
  }, []);
 
  useEffect(() => {
    loadDashboard();
 
    // Clock
    const clockT = setInterval(() => setNow(new Date()), 1000);
 
    // Countdown + auto-refresh
    const countT = setInterval(() => {
      countdownRef.current -= 1;
      setCountdown(countdownRef.current);
      if (countdownRef.current <= 0) {
        loadDashboard(true);
      }
    }, 1000);
 
    return () => { clearInterval(clockT); clearInterval(countT); };
  }, [loadDashboard]);
 
  if (loading) {
    return (
      <>
        <style>{styles}</style>
        <div className="loading-screen">
          <div className="loading-spinner" />
          <span style={{ color: '#64b5f6', fontSize: 14 }}>Loading Security Dashboard...</span>
        </div>
      </>
    );
  }
 
  const riskScore = networkRisk.network_risk_score || 0;
  const riskLevel = networkRisk.risk_level || 'UNKNOWN';
  const riskColor = getRiskColor(riskLevel);
 
  const statCards = [
    { title:'Total Assets',   value: summary.totalVMs   ?? 0, color:'#00e5ff', icon:'🖥',  delay:'0s',    trend: null },
    { title:'Healthy Assets', value: summary.healthyVMs ?? 0, color:'#51cf66', icon:'✅',  delay:'0.07s', trend: null },
    { title:'At Risk',        value: summary.atRiskVMs  ?? 0, color:'#ff6b6b', icon:'⚠️', delay:'0.14s', trend: null },
    { title:'Total Vulns',    value: summary.totalVulns ?? 0, color:'#ffa726', icon:'🔍',  delay:'0.21s', trend: null },
  ];
 
  // Build activity feed from recent scans
  const activities = recentScans.slice(0,4).map(s => ({
    color: s.status==='completed' ? '#51cf66' : s.status==='failed' ? '#ff4d4d' : '#00e5ff',
    text: s.status==='completed'
      ? <><strong>{s.target}</strong> scan completed — {s.total_vulns||0} vulnerabilities found</>
      : s.status==='failed'
      ? <><strong>{s.target}</strong> scan failed</>
      : <><strong>{s.target}</strong> scan in progress ({s.progress||0}%)</>,
    time: s.start_time ? new Date(s.start_time).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}) : '—',
  }));
 
  return (
    <>
      <style>{styles}</style>
      <div className="dash-main">
        <Sidebar />
        <div className="dash-content">
 
          {/* Header */}
          <div className="dash-header">
            <div>
              <h1 className="dash-title">AI Security Dashboard</h1>
              <p className="dash-subtitle">Welcome back, <strong style={{color:'#00e5ff'}}>{user?.username}</strong> — System monitoring active</p>
            </div>
            <div className="header-right">
              <div className="dash-clock">
                🕐 {now.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit', second:'2-digit' })}
                <span style={{marginLeft:8,color:'#546e7a'}}>{now.toLocaleDateString([],{weekday:'short',month:'short',day:'numeric'})}</span>
              </div>
              <div className="refresh-wrap">
                <CountdownCircle seconds={countdown} total={REFRESH_INTERVAL} />
                <span style={{fontFamily:'JetBrains Mono',fontSize:10,color:'#37474f'}}>Auto-refresh in {countdown}s</span>
                <button
                  className={`refresh-btn ${refreshing ? 'spinning' : ''}`}
                  onClick={() => loadDashboard(true)}
                  disabled={refreshing}
                >
                  <span className="refresh-icon">↺</span>
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
            </div>
          </div>
 
          {/* Stat Cards */}
          <div className="stats-grid">
            {statCards.map((c, i) => (
              <div key={i} className="stat-card" style={{ animationDelay: c.delay }}>
                <div className="stat-top" style={{ background: c.color }} />
                <span className="stat-icon-bg">{c.icon}</span>
                <p className="stat-label">{c.title}</p>
                <h2 className="stat-value" style={{ color: c.color }}>{c.value}</h2>
                {i === 0 && (
                  <p className="stat-trend" style={{ color: '#546e7a' }}>
                    {allScans.filter(s=>s.status==='completed').length} scans completed
                  </p>
                )}
                {i === 2 && c.value > 0 && (
                  <p className="stat-trend" style={{ color: '#ff6b6b' }}>⚡ Needs attention</p>
                )}
              </div>
            ))}
          </div>
 
          {/* Row 1: Risk Gauge + Severity Chart + Vuln List */}
          <div style={{ display:'grid', gridTemplateColumns:'200px 1fr 1.5fr', gap:16, marginBottom:16 }}>
 
            {/* Risk Gauge */}
            <div className="panel" style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
              <div className="panel-title" style={{ width:'100%' }}>
                <div className="panel-title-left">Network Risk</div>
              </div>
              <RiskGauge score={riskScore} level={riskLevel} />
              <div className="risk-badge" style={{ background:`${riskColor}22`, border:`1px solid ${riskColor}55`, color:riskColor }}>
                {riskLevel}
              </div>
              <div className="gauge-stats">
                <div className="gauge-stat">
                  <div className="gauge-stat-label">Vulns</div>
                  <div className="gauge-stat-value" style={{ color:'#ffa726' }}>{networkRisk.total_vulnerabilities||0}</div>
                </div>
                <div className="gauge-stat">
                  <div className="gauge-stat-label">Assets</div>
                  <div className="gauge-stat-value" style={{ color:'#00e5ff' }}>{networkRisk.total_assets||0}</div>
                </div>
              </div>
            </div>
 
            {/* Severity Chart + Trend */}
            <div className="panel">
              <div className="panel-title">
                <div className="panel-title-left">Severity Breakdown</div>
              </div>
              <SevChart counts={sevCounts} />
              <div style={{ marginTop:16, paddingTop:14, borderTop:'1px solid rgba(255,255,255,0.05)' }}>
                <div className="panel-title" style={{ marginBottom:8 }}>
                  <div className="panel-title-left">Scan Activity</div>
                  <span style={{ color:'#546e7a', fontSize:10, fontFamily:'JetBrains Mono' }}>{allScans.length} total</span>
                </div>
                <TrendChart scans={allScans} />
              </div>
            </div>
 
            {/* Top Vulnerabilities */}
            <div className="panel">
              <div className="panel-title">
                <div className="panel-title-left">AI Priority Threats</div>
                <span style={{ color:'#546e7a', fontSize:10, fontFamily:'JetBrains Mono' }}>Top {Math.min(topVulns.length, 5)}</span>
              </div>
              {topVulns.length === 0 ? (
                <p className="empty-state">✓ No vulnerabilities detected</p>
              ) : topVulns.slice(0, 5).map((v, i) => (
                <div key={i} className="vuln-row">
                  <div style={{ flex:1, minWidth:0 }}>
                    <p className="vuln-service">{v.service || '?'}:{v.port || '?'}</p>
                    <div className="vuln-meta">
                      {v.cvss_score && <span className="tag tag-cvss">CVSS {Number(v.cvss_score).toFixed(1)}</span>}
                      {v.top_cve    && <span className="tag tag-cve">{v.top_cve}</span>}
                      {v.severity   && <span className={getSevTag(v.severity)}>{v.severity}</span>}
                      {(v.cve_count||0) > 1 && <span style={{ color:'#37474f', fontSize:10 }}>+{v.cve_count-1}</span>}
                    </div>
                  </div>
                  <div className="priority-badge">P{Math.round(v.risk_score||0)}</div>
                </div>
              ))}
            </div>
 
          </div>
 
          {/* Row 2: Recent Scans + Activity Feed */}
          <div className="two-col">
 
            {/* Recent Scans */}
            <div className="panel">
              <div className="panel-title">
                <div className="panel-title-left">Recent Scans</div>
                <span style={{ color:'#546e7a', fontSize:10, fontFamily:'JetBrains Mono' }}>Last {recentScans.length}</span>
              </div>
              <table className="scans-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Target</th>
                    <th>Mode</th>
                    <th>Status</th>
                    <th>Vulns</th>
                    <th>Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {recentScans.length === 0 ? (
                    <tr><td colSpan={6} className="empty-state">No scans yet</td></tr>
                  ) : recentScans.map(scan => (
                    <tr key={scan.id}>
                      <td style={{ color:'#546e7a' }}>#{scan.id}</td>
                      <td style={{ color:'#e3f2fd' }}>{scan.target}</td>
                      <td style={{ color:'#546e7a', textTransform:'uppercase', fontSize:10 }}>{scan.mode||'fast'}</td>
                      <td>
                        <span className={`status-pill status-${scan.status}`}>
                          {scan.status==='completed' ? '✓' : scan.status==='failed' ? '✗' : '●'} {scan.status}
                        </span>
                      </td>
                      <td style={{ color: scan.total_vulns>0?'#ffa726':'#51cf66', fontWeight:600 }}>
                        {scan.total_vulns||0}
                      </td>
                      <td>
                        <div className="prog-wrap">
                          <div className="prog-bar">
                            <div className="prog-fill" style={{ width:`${scan.progress||0}%` }} />
                          </div>
                          <span style={{ color:'#546e7a', fontSize:10 }}>{scan.progress||0}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
 
            {/* Activity Feed */}
            <div className="panel">
              <div className="panel-title">
                <div className="panel-title-left">Live Activity Feed</div>
                <span style={{
                  display:'flex', alignItems:'center', gap:5,
                  color:'#51cf66', fontSize:10, fontFamily:'JetBrains Mono',
                }}>
                  <span style={{ width:6, height:6, borderRadius:'50%', background:'#51cf66', display:'inline-block', animation:'pulse 2s infinite' }} />
                  LIVE
                </span>
              </div>
              {activities.length === 0 ? (
                <p className="empty-state">No recent activity</p>
              ) : (
                <div className="activity-feed">
                  {activities.map((a, i) => (
                    <div key={i} className="activity-item">
                      <div className="activity-dot" style={{ background: a.color }} />
                      <div className="activity-text">{a.text}</div>
                      <div className="activity-time">{a.time}</div>
                    </div>
                  ))}
                  <div className="activity-item" style={{ opacity:0.4 }}>
                    <div className="activity-dot" style={{ background:'#546e7a' }} />
                    <div className="activity-text" style={{ color:'#37474f' }}>System started monitoring</div>
                    <div className="activity-time">—</div>
                  </div>
                </div>
              )}
            </div>
 
          </div>
 
        </div>
      </div>
    </>
  );
}