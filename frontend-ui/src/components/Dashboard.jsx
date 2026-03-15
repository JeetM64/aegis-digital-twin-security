import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import Sidebar from "./Sidebar";
import api from "../services/api";
import toast from "react-hot-toast";
 
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');
 
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse-ring {
    0% { box-shadow: 0 0 0 0 rgba(0,229,255,0.3); }
    70% { box-shadow: 0 0 0 10px rgba(0,229,255,0); }
    100% { box-shadow: 0 0 0 0 rgba(0,229,255,0); }
  }
  @keyframes shimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes countUp {
    from { opacity: 0; transform: scale(0.8); }
    to { opacity: 1; transform: scale(1); }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  .dash-main {
    display: flex;
    background: #0a1929;
    min-height: 100vh;
    font-family: 'Inter', sans-serif;
  }
  .dash-content {
    margin-left: 240px;
    flex: 1;
    padding: 40px;
    animation: fadeInUp 0.5s ease;
  }
  .dash-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 36px;
    padding-bottom: 24px;
    border-bottom: 1px solid rgba(0,229,255,0.1);
  }
  .dash-title {
    font-size: 32px;
    font-weight: 700;
    font-family: 'JetBrains Mono', monospace;
    background: linear-gradient(90deg, #00e5ff, #82b1ff, #fff);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: shimmer 4s linear infinite;
    margin: 0 0 6px;
  }
  .dash-subtitle {
    color: #64b5f6;
    font-size: 14px;
    font-weight: 400;
    letter-spacing: 0.03em;
    margin: 0;
  }
  .dash-timestamp {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    color: rgba(100,181,246,0.5);
    text-align: right;
  }
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 28px;
  }
  .stat-card {
    background: linear-gradient(135deg, #001e3c 0%, #0d2137 100%);
    border: 1px solid rgba(0,229,255,0.1);
    border-radius: 14px;
    padding: 22px 20px;
    position: relative;
    overflow: hidden;
    cursor: default;
    transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
    animation: fadeInUp 0.5s ease backwards;
  }
  .stat-card:hover {
    transform: translateY(-3px);
    border-color: rgba(0,229,255,0.25);
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
  }
  .stat-label {
    color: #90caf9;
    font-size: 12px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin: 0 0 10px;
  }
  .stat-value {
    font-family: 'JetBrains Mono', monospace;
    font-size: 38px;
    font-weight: 700;
    margin: 0;
    animation: countUp 0.4s ease;
  }
  .stat-icon {
    position: absolute;
    top: 18px; right: 18px;
    font-size: 20px;
    opacity: 0.25;
  }
  .panels-grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 20px;
    margin-bottom: 24px;
  }
  .panel {
    background: linear-gradient(135deg, rgba(0,229,255,0.04), rgba(0,145,234,0.02));
    border: 1px solid rgba(0,229,255,0.1);
    border-radius: 16px;
    padding: 24px;
    position: relative;
    overflow: hidden;
  }
  .panel-title {
    color: #00e5ff;
    font-size: 14px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin: 0 0 20px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .panel-title::before {
    content: '';
    display: inline-block;
    width: 3px; height: 14px;
    background: #00e5ff;
    border-radius: 2px;
  }
  .vuln-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 14px;
    border-radius: 10px;
    margin-bottom: 8px;
    background: rgba(255,255,255,0.025);
    border: 1px solid rgba(255,255,255,0.05);
    transition: background 0.2s ease, border-color 0.2s ease;
  }
  .vuln-row:hover {
    background: rgba(0,229,255,0.06);
    border-color: rgba(0,229,255,0.15);
  }
  .vuln-service {
    color: #e3f2fd;
    font-weight: 600;
    font-size: 14px;
    font-family: 'JetBrains Mono', monospace;
    margin: 0 0 4px;
  }
  .vuln-meta {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
    margin-top: 4px;
  }
  .vuln-cvss {
    color: #ffa726;
    font-size: 11px;
    font-weight: 600;
    font-family: 'JetBrains Mono', monospace;
    background: rgba(255,167,38,0.1);
    border: 1px solid rgba(255,167,38,0.2);
    padding: 2px 7px;
    border-radius: 4px;
  }
  .vuln-cve {
    color: #64b5f6;
    font-size: 11px;
    font-family: 'JetBrains Mono', monospace;
    background: rgba(100,181,246,0.08);
    border: 1px solid rgba(100,181,246,0.15);
    padding: 2px 7px;
    border-radius: 4px;
  }
  .vuln-severity {
    font-size: 10px;
    font-weight: 700;
    padding: 2px 7px;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .priority-badge {
    background: linear-gradient(135deg, rgba(255,107,107,0.2), rgba(255,107,107,0.1));
    border: 1px solid rgba(255,107,107,0.3);
    color: #ff6b6b;
    font-size: 12px;
    font-weight: 700;
    font-family: 'JetBrains Mono', monospace;
    padding: 4px 10px;
    border-radius: 6px;
    white-space: nowrap;
  }
  .risk-display {
    text-align: center;
    margin-top: 16px;
    padding: 20px;
  }
  .risk-score {
    font-family: 'JetBrains Mono', monospace;
    font-size: 56px;
    font-weight: 700;
    line-height: 1;
    margin-bottom: 12px;
    animation: pulse-ring 2.5s infinite;
    display: inline-block;
    border-radius: 50%;
    width: 100px; height: 100px;
    line-height: 100px;
  }
  .risk-label {
    color: #90caf9;
    font-size: 13px;
    letter-spacing: 0.06em;
  }
  .risk-level-badge {
    display: inline-block;
    margin-top: 10px;
    padding: 5px 16px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .scans-table-wrap { overflow: hidden; }
  .scans-table {
    width: 100%;
    border-collapse: collapse;
  }
  .scans-table thead tr th {
    color: #64b5f6;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    padding: 0 14px 12px;
    text-align: left;
    border-bottom: 1px solid rgba(0,229,255,0.1);
  }
  .scans-table tbody tr:hover { background: rgba(0,229,255,0.04); }
  .scans-table tbody tr td {
    padding: 13px 14px;
    font-size: 13px;
    color: #cfd8dc;
    font-family: 'JetBrains Mono', monospace;
    border-bottom: 1px solid rgba(255,255,255,0.04);
  }
  .status-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(0,229,255,0.1);
    color: #00e5ff;
    padding: 3px 10px;
    border-radius: 20px;
    font-size: 12px;
  }
  .status-pill::before {
    content: '';
    width: 6px; height: 6px;
    border-radius: 50%;
    background: #00e5ff;
    animation: pulse-ring 2s infinite;
  }
  .progress-bar-wrap {
    background: rgba(255,255,255,0.06);
    border-radius: 4px;
    height: 6px;
    width: 80px;
    overflow: hidden;
  }
  .progress-bar-fill {
    height: 100%;
    border-radius: 4px;
    background: linear-gradient(90deg, #00e5ff, #0091ea);
    transition: width 0.4s ease;
  }
  .loading-screen {
    background: #0a1929;
    color: #fff;
    height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    font-family: 'JetBrains Mono', monospace;
  }
  .loading-spinner {
    width: 40px; height: 40px;
    border: 2px solid rgba(0,229,255,0.2);
    border-top-color: #00e5ff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  .empty-state {
    color: #546e7a;
    font-size: 13px;
    text-align: center;
    padding: 24px 0;
  }
`;
 
function getRiskColor(level) {
  if (level === "CRITICAL") return "#ff4d4d";
  if (level === "HIGH")     return "#ff4d4d";
  if (level === "MEDIUM")   return "#ffa726";
  return "#51cf66";
}
 
function getSeverityStyle(sev) {
  const s = (sev || "").toLowerCase();
  if (s === "critical") return { background: "rgba(255,77,77,0.15)",  border: "1px solid rgba(255,77,77,0.3)",  color: "#ff4d4d" };
  if (s === "high")     return { background: "rgba(255,107,107,0.15)",border: "1px solid rgba(255,107,107,0.3)",color: "#ff6b6b" };
  if (s === "medium")   return { background: "rgba(255,167,38,0.15)", border: "1px solid rgba(255,167,38,0.3)", color: "#ffa726" };
  return                       { background: "rgba(81,207,102,0.15)", border: "1px solid rgba(81,207,102,0.3)", color: "#51cf66" };
}
 
function getRiskBadgeStyle(level) {
  const color = getRiskColor(level);
  return { background: `${color}22`, border: `1px solid ${color}55`, color };
}
 
export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const [summary, setSummary]       = useState({});
  const [recentScans, setRecentScans] = useState([]);
  const [networkRisk, setNetworkRisk] = useState({});
  const [topVulns, setTopVulns]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [now, setNow]               = useState(new Date());
 
  useEffect(() => {
    loadDashboard();
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);
 
  const loadDashboard = async () => {
    try {
      const [summaryRes, scans, risk, top] = await Promise.all([
        api.get("/api/summary"),
        api.get("/api/scans"),
        api.get("/api/network-risk"),
        api.get("/api/top-vulnerabilities"),
      ]);
      setSummary(summaryRes.data);
      setRecentScans(scans.data?.slice(0, 5) || []);
      setNetworkRisk(risk.data);
      setTopVulns(top.data.top_vulnerabilities || []);
    } catch (err) {
      console.error(err);
      toast.error("Dashboard failed to load");
    } finally {
      setLoading(false);
    }
  };
 
  if (loading) {
    return (
      <>
        <style>{styles}</style>
        <div className="loading-screen">
          <div className="loading-spinner" />
          <span style={{ color: "#64b5f6", fontSize: 14 }}>Loading Security Dashboard...</span>
        </div>
      </>
    );
  }
 
  const statCards = [
    { title: "Total Assets",   value: summary.totalVMs,   color: "#00e5ff", icon: "🖥",  delay: "0s"   },
    { title: "Healthy Assets", value: summary.healthyVMs, color: "#51cf66", icon: "✅",  delay: "0.1s" },
    { title: "At Risk Assets", value: summary.atRiskVMs,  color: "#ff6b6b", icon: "⚠️", delay: "0.2s" },
    { title: "Network Risk",   value: networkRisk.risk_level || "N/A", color: getRiskColor(networkRisk.risk_level), icon: "🌐", delay: "0.3s" },
  ];
 
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
              <p className="dash-subtitle">Welcome back, {user?.username} — System monitoring active</p>
            </div>
            <div className="dash-timestamp">
              <div>🕐 {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
              <div style={{ marginTop: 4 }}>{now.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}</div>
            </div>
          </div>
 
          {/* Stats */}
          <div className="stats-grid">
            {statCards.map((c, i) => (
              <div key={i} className="stat-card" style={{ animationDelay: c.delay }}>
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: 2,
                  background: c.color, borderRadius: "14px 14px 0 0",
                }} />
                <span className="stat-icon">{c.icon}</span>
                <p className="stat-label">{c.title}</p>
                <h2 className="stat-value" style={{ color: c.color }}>{c.value ?? 0}</h2>
              </div>
            ))}
          </div>
 
          {/* Panels */}
          <div className="panels-grid">
 
            {/* Top Vulnerabilities — now shows CVE ID + CVSS */}
            <div className="panel">
              <h2 className="panel-title">AI Priority Vulnerabilities</h2>
              {topVulns.length === 0 ? (
                <p className="empty-state">✓ No vulnerabilities detected</p>
              ) : (
                topVulns.map((v, i) => (
                  <div key={i} className="vuln-row">
                    <div>
                      <p className="vuln-service">{v.service}:{v.port}</p>
                      <div className="vuln-meta">
                        {/* CVSS Score */}
                        {v.cvss_score && (
                          <span className="vuln-cvss">
                            CVSS {Number(v.cvss_score).toFixed(1)}
                          </span>
                        )}
                        {/* Top CVE ID */}
                        {v.top_cve && (
                          <span className="vuln-cve">{v.top_cve}</span>
                        )}
                        {/* Severity badge */}
                        {v.severity && (
                          <span className="vuln-severity" style={getSeverityStyle(v.severity)}>
                            {v.severity}
                          </span>
                        )}
                        {/* CVE count if more than 1 */}
                        {v.cve_count > 1 && (
                          <span style={{ color: "#546e7a", fontSize: 11 }}>
                            +{v.cve_count - 1} more CVEs
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="priority-badge">
                      P{Number(v.risk_score || 0).toFixed(0)}
                    </div>
                  </div>
                ))
              )}
            </div>
 
            {/* Network Risk */}
            <div className="panel">
              <h2 className="panel-title">Network Risk</h2>
              <div className="risk-display">
                <div
                  className="risk-score"
                  style={{ color: getRiskColor(networkRisk.risk_level) }}
                >
                  {networkRisk.network_risk_score || 0}
                </div>
                <p className="risk-label" style={{ marginTop: 12 }}>Overall Risk Score</p>
                <div
                  className="risk-level-badge"
                  style={getRiskBadgeStyle(networkRisk.risk_level)}
                >
                  {networkRisk.risk_level || "UNKNOWN"}
                </div>
              </div>
            </div>
 
          </div>
 
          {/* Recent Scans */}
          <div className="panel">
            <h2 className="panel-title">Recent Scans</h2>
            <div className="scans-table-wrap">
              <table className="scans-table">
                <thead>
                  <tr>
                    <th>Target</th>
                    <th>Status</th>
                    <th>Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {recentScans.length === 0 ? (
                    <tr>
                      <td colSpan={3} style={{ textAlign: "center", color: "#546e7a", padding: "24px 0" }}>
                        No recent scans
                      </td>
                    </tr>
                  ) : (
                    recentScans.map((scan) => (
                      <tr key={scan.id}>
                        <td>{scan.target}</td>
                        <td><span className="status-pill">{scan.status}</span></td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div className="progress-bar-wrap">
                              <div className="progress-bar-fill" style={{ width: `${scan.progress || 0}%` }} />
                            </div>
                            <span style={{ color: "#64b5f6", fontSize: 12 }}>{scan.progress}%</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
 
        </div>
      </div>
    </>
  );
}