import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import Sidebar from "./Sidebar";
import api from "../services/api";
import toast from "react-hot-toast";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');

  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes shimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes pulse-dot {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .md-wrap {
    display: flex;
    background: #0a1929;
    min-height: 100vh;
    font-family: 'Inter', sans-serif;
  }
  .md-content {
    margin-left: 240px;
    flex: 1;
    padding: 40px;
    animation: fadeInUp 0.5s ease;
  }
  .md-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 32px;
    padding-bottom: 24px;
    border-bottom: 1px solid rgba(0,229,255,0.1);
  }
  .md-title {
    font-family: 'JetBrains Mono', monospace;
    font-size: 30px;
    font-weight: 700;
    background: linear-gradient(90deg, #00e5ff, #82b1ff, #fff);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: shimmer 4s linear infinite;
    margin: 0 0 6px;
  }
  .md-subtitle {
    color: #64b5f6;
    font-size: 14px;
    margin: 0;
  }
  .md-live {
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: #51cf66;
    background: rgba(81,207,102,0.08);
    border: 1px solid rgba(81,207,102,0.2);
    padding: 6px 12px;
    border-radius: 20px;
    align-self: center;
  }
  .live-dot {
    width: 7px; height: 7px;
    background: #51cf66;
    border-radius: 50%;
    animation: pulse-dot 1.5s infinite;
  }

  /* Discovery bar */
  .discovery-bar {
    display: flex;
    gap: 12px;
    align-items: center;
    background: linear-gradient(135deg, rgba(0,229,255,0.04), rgba(0,145,234,0.02));
    border: 1px solid rgba(0,229,255,0.12);
    border-radius: 14px;
    padding: 16px 20px;
    margin-bottom: 28px;
  }
  .discovery-label {
    font-size: 12px;
    font-weight: 600;
    color: #64b5f6;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    white-space: nowrap;
  }
  .discovery-input {
    flex: 1;
    padding: 10px 16px;
    border-radius: 8px;
    background: #001e3c;
    border: 1px solid rgba(0,229,255,0.2);
    color: #fff;
    font-family: 'JetBrains Mono', monospace;
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s;
  }
  .discovery-input:focus {
    border-color: #00e5ff;
  }
  .discovery-input::placeholder { color: #546e7a; }
  .discovery-btn {
    padding: 10px 24px;
    background: linear-gradient(135deg, #00e5ff, #0091ea);
    border: none;
    border-radius: 8px;
    color: #0a1929;
    font-weight: 700;
    font-size: 13px;
    cursor: pointer;
    letter-spacing: 0.04em;
    transition: opacity 0.2s, transform 0.15s;
    white-space: nowrap;
  }
  .discovery-btn:hover { opacity: 0.88; transform: translateY(-1px); }
  .discovery-btn:active { transform: translateY(0); }

  /* Stats */
  .md-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 28px;
  }
  .md-stat {
    background: #001e3c;
    border: 1px solid rgba(0,229,255,0.08);
    border-radius: 14px;
    padding: 20px;
    position: relative;
    overflow: hidden;
    transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
    animation: fadeInUp 0.5s ease backwards;
  }
  .md-stat:hover {
    transform: translateY(-3px);
    border-color: rgba(0,229,255,0.2);
    box-shadow: 0 8px 30px rgba(0,0,0,0.3);
  }
  .md-stat-top {
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    border-radius: 14px 14px 0 0;
  }
  .md-stat-label {
    color: #90caf9;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.09em;
    margin: 0 0 10px;
  }
  .md-stat-value {
    font-family: 'JetBrains Mono', monospace;
    font-size: 36px;
    font-weight: 700;
    margin: 0;
    color: #00e5ff;
  }

  /* Panels */
  .md-panels {
    display: grid;
    grid-template-columns: 1.4fr 1fr;
    gap: 20px;
    margin-bottom: 24px;
  }
  .md-panel {
    background: linear-gradient(135deg, rgba(0,229,255,0.04), rgba(0,145,234,0.02));
    border: 1px solid rgba(0,229,255,0.1);
    border-radius: 16px;
    padding: 24px;
    position: relative;
    overflow: hidden;
  }
  .md-panel-title {
    color: #00e5ff;
    font-size: 13px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin: 0 0 20px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .md-panel-title::before {
    content: '';
    display: inline-block;
    width: 3px; height: 13px;
    background: #00e5ff;
    border-radius: 2px;
  }

  /* Chart tooltip */
  .custom-tooltip {
    background: #001e3c;
    border: 1px solid rgba(0,229,255,0.2);
    border-radius: 8px;
    padding: 10px 14px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    color: #e3f2fd;
  }

  /* Asset table */
  .asset-table {
    width: 100%;
    border-collapse: collapse;
  }
  .asset-table thead tr th {
    color: #64b5f6;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    padding: 0 14px 12px;
    text-align: left;
    border-bottom: 1px solid rgba(0,229,255,0.1);
  }
  .asset-table tbody tr { transition: background 0.15s; }
  .asset-table tbody tr:hover { background: rgba(0,229,255,0.04); }
  .asset-table tbody tr td {
    padding: 12px 14px;
    font-size: 13px;
    font-family: 'JetBrains Mono', monospace;
    color: #cfd8dc;
    border-bottom: 1px solid rgba(255,255,255,0.04);
  }
  .os-badge {
    display: inline-block;
    background: rgba(0,229,255,0.08);
    border: 1px solid rgba(0,229,255,0.15);
    color: #80deea;
    padding: 2px 10px;
    border-radius: 20px;
    font-size: 12px;
  }
  .ip-text { color: #82b1ff; }
  .empty-row td {
    text-align: center;
    color: #546e7a;
    padding: 28px 0 !important;
    font-family: 'Inter', sans-serif !important;
  }
`;

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <div style={{ color: "#90caf9", marginBottom: 4 }}>{label}</div>
        <div style={{ color: "#00e5ff" }}>{payload[0].value} instances</div>
      </div>
    );
  }
  return null;
};

const CHART_COLORS = ["#00e5ff", "#0091ea", "#82b1ff", "#26c6da", "#4dd0e1"];

export default function ModernDashboard() {
  const { user } = useContext(AuthContext);
  const [vms, setVms] = useState([]);
  const [summary, setSummary] = useState({});
  const [insights, setInsights] = useState({});
  const [network, setNetwork] = useState("192.168.1.0/24");
  const [discovering, setDiscovering] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const [vm, sum, ins] = await Promise.all([
        api.get("/api/vms"),
        api.get("/api/summary"),
        api.get("/api/network/insights"),
      ]);
      setVms(vm.data.vms || []);
      setSummary(sum.data);
      setInsights(ins.data);
    } catch (err) {
      console.error(err);
    }
  };

  const discover = async () => {
    setDiscovering(true);
    try {
      const res = await api.post("/api/vm/discover", { network });
      toast.success(`Found ${res.data.total} hosts`);
      load();
    } catch {
      toast.error("Discovery failed");
    } finally {
      setDiscovering(false);
    }
  };

  const stats = [
    { label: "Total Assets", value: summary.totalVMs, color: "#00e5ff", delay: "0s" },
    { label: "At Risk", value: summary.atRiskVMs, color: "#ff6b6b", delay: "0.1s" },
    { label: "Hosts Found", value: insights.total_hosts, color: "#51cf66", delay: "0.2s" },
    { label: "Open Ports", value: insights.total_ports, color: "#ffa726", delay: "0.3s" },
  ];

  return (
    <>
      <style>{styles}</style>
      <div className="md-wrap">
        <Sidebar />
        <div className="md-content">

          {/* Header */}
          <div className="md-header">
            <div>
              <h1 className="md-title">Security Dashboard</h1>
              <p className="md-subtitle">Welcome, {user?.username} — Network monitor active</p>
            </div>
            <div className="md-live">
              <span className="live-dot" />
              LIVE
            </div>
          </div>

          {/* Discovery */}
          <div className="discovery-bar">
            <span className="discovery-label">Discover</span>
            <input
              className="discovery-input"
              value={network}
              onChange={(e) => setNetwork(e.target.value)}
              placeholder="CIDR / IP / Domain (e.g. 192.168.1.0/24)"
            />
            <button
              className="discovery-btn"
              onClick={discover}
              disabled={discovering}
            >
              {discovering ? "Scanning..." : "▶ Discover"}
            </button>
          </div>

          {/* Stats */}
          <div className="md-stats">
            {stats.map((s, i) => (
              <div key={i} className="md-stat" style={{ animationDelay: s.delay }}>
                <div className="md-stat-top" style={{ background: s.color }} />
                <p className="md-stat-label">{s.label}</p>
                <h2 className="md-stat-value" style={{ color: s.color }}>{s.value ?? 0}</h2>
              </div>
            ))}
          </div>

          {/* Chart + Table panels */}
          <div className="md-panels">

            {/* Services Chart */}
            <div className="md-panel">
              <h2 className="md-panel-title">Top Services</h2>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  data={insights.top_services || []}
                  barCategoryGap="30%"
                >
                  <XAxis
                    dataKey="name"
                    stroke="#546e7a"
                    tick={{ fill: "#90caf9", fontSize: 12, fontFamily: "JetBrains Mono" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#546e7a"
                    tick={{ fill: "#90caf9", fontSize: 12, fontFamily: "JetBrains Mono" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,229,255,0.05)" }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {(insights.top_services || []).map((_, idx) => (
                      <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Asset Summary mini */}
            <div className="md-panel">
              <h2 className="md-panel-title">Asset Overview</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
                {[
                  { label: "Total VMs", value: summary.totalVMs, color: "#00e5ff" },
                  { label: "Healthy", value: summary.healthyVMs, color: "#51cf66" },
                  { label: "At Risk", value: summary.atRiskVMs, color: "#ff6b6b" },
                ].map((item, i) => (
                  <div key={i} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "12px 16px",
                    background: "rgba(255,255,255,0.025)",
                    border: "1px solid rgba(255,255,255,0.05)",
                    borderRadius: 10,
                  }}>
                    <span style={{ color: "#90caf9", fontSize: 13 }}>{item.label}</span>
                    <span style={{
                      fontFamily: "JetBrains Mono, monospace",
                      fontWeight: 700, fontSize: 22,
                      color: item.color,
                    }}>{item.value ?? 0}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Asset Table */}
          <div className="md-panel">
            <h2 className="md-panel-title">Assets</h2>
            <table className="asset-table">
              <thead>
                <tr>
                  <th>Hostname</th>
                  <th>IP Address</th>
                  <th>OS</th>
                </tr>
              </thead>
              <tbody>
                {vms.length === 0 ? (
                  <tr className="empty-row">
                    <td colSpan={3}>No assets discovered yet</td>
                  </tr>
                ) : (
                  vms.map((vm) => (
                    <tr key={vm.id}>
                      <td>{vm.hostname}</td>
                      <td><span className="ip-text">{vm.ip_address}</span></td>
                      <td><span className="os-badge">{vm.os || "Unknown"}</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </>
  );
}