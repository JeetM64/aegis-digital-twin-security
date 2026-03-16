import React, { useEffect, useState, useRef } from "react";
import Sidebar from "./Sidebar";
import api from "../services/api";
 
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
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.6; transform: scale(0.95); }
  }
  @keyframes nodeGlow {
    0%, 100% { filter: drop-shadow(0 0 6px currentColor); }
    50% { filter: drop-shadow(0 0 14px currentColor); }
  }
 
  .topo-main {
    display: flex;
    background: #0a1929;
    min-height: 100vh;
    font-family: 'Inter', sans-serif;
  }
  .topo-content {
    margin-left: 240px;
    flex: 1;
    padding: 40px;
    animation: fadeInUp 0.5s ease;
  }
  .topo-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 32px;
    padding-bottom: 24px;
    border-bottom: 1px solid rgba(0,229,255,0.1);
  }
  .topo-title {
    font-size: 28px;
    font-weight: 700;
    font-family: 'JetBrains Mono', monospace;
    background: linear-gradient(90deg, #00e5ff, #82b1ff, #fff);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: shimmer 4s linear infinite;
    margin: 0 0 6px;
  }
  .topo-subtitle {
    color: #64b5f6;
    font-size: 14px;
    margin: 0;
  }
  .legend {
    display: flex;
    gap: 20px;
    align-items: center;
    flex-wrap: wrap;
  }
  .legend-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: #90caf9;
    font-family: 'JetBrains Mono', monospace;
  }
  .legend-dot {
    width: 12px; height: 12px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .topo-grid {
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: 20px;
  }
  .topo-canvas-panel {
    background: linear-gradient(135deg, rgba(0,229,255,0.03), rgba(0,145,234,0.01));
    border: 1px solid rgba(0,229,255,0.1);
    border-radius: 16px;
    padding: 24px;
    position: relative;
    min-height: 520px;
  }
  .panel-title {
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
  .panel-title::before {
    content: '';
    display: inline-block;
    width: 3px; height: 13px;
    background: #00e5ff;
    border-radius: 2px;
  }
  .topo-svg {
    width: 100%;
    height: 460px;
    background: rgba(0,0,0,0.2);
    border-radius: 12px;
    border: 1px solid rgba(0,229,255,0.06);
    cursor: grab;
  }
  .topo-svg:active { cursor: grabbing; }
  .side-panel {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .stats-mini {
    background: linear-gradient(135deg, rgba(0,229,255,0.04), rgba(0,145,234,0.02));
    border: 1px solid rgba(0,229,255,0.1);
    border-radius: 14px;
    padding: 20px;
  }
  .mini-stat {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid rgba(255,255,255,0.04);
  }
  .mini-stat:last-child { border-bottom: none; }
  .mini-label {
    font-size: 12px;
    color: #546e7a;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .mini-value {
    font-family: 'JetBrains Mono', monospace;
    font-size: 16px;
    font-weight: 700;
  }
  .node-detail-panel {
    background: linear-gradient(135deg, rgba(0,229,255,0.04), rgba(0,145,234,0.02));
    border: 1px solid rgba(0,229,255,0.1);
    border-radius: 14px;
    padding: 20px;
    flex: 1;
  }
  .node-detail-empty {
    color: #546e7a;
    font-size: 13px;
    text-align: center;
    padding: 24px 0;
  }
  .node-ip {
    font-family: 'JetBrains Mono', monospace;
    font-size: 16px;
    font-weight: 700;
    color: #e3f2fd;
    margin: 0 0 4px;
  }
  .node-host {
    font-size: 12px;
    color: #546e7a;
    margin: 0 0 16px;
  }
  .detail-row {
    display: flex;
    justify-content: space-between;
    padding: 7px 0;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    font-size: 12px;
  }
  .detail-row:last-child { border-bottom: none; }
  .detail-key { color: #546e7a; }
  .detail-val {
    font-family: 'JetBrains Mono', monospace;
    color: #90caf9;
    font-weight: 600;
  }
  .vuln-chips {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-top: 12px;
  }
  .chip {
    padding: 3px 9px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 700;
    font-family: 'JetBrains Mono', monospace;
  }
  .risk-badge {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-family: 'JetBrains Mono', monospace;
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
  .refresh-btn {
    background: rgba(0,229,255,0.1);
    border: 1px solid rgba(0,229,255,0.2);
    color: #00e5ff;
    padding: 8px 18px;
    border-radius: 8px;
    font-size: 12px;
    font-family: 'JetBrains Mono', monospace;
    cursor: pointer;
    transition: all 0.2s;
  }
  .refresh-btn:hover {
    background: rgba(0,229,255,0.18);
    border-color: rgba(0,229,255,0.4);
  }
`;
 
const RISK_COLORS = {
  CRITICAL: "#ff4d4d",
  HIGH:     "#ff6b6b",
  MEDIUM:   "#ffa726",
  LOW:      "#51cf66",
  UNKNOWN:  "#546e7a",
};
 
function getRiskColor(level) {
  return RISK_COLORS[(level || "UNKNOWN").toUpperCase()] || RISK_COLORS.UNKNOWN;
}
 
function getRiskBadgeStyle(level) {
  const c = getRiskColor(level);
  return { background: `${c}22`, border: `1px solid ${c}55`, color: c };
}
 
// Layout nodes in a circular arrangement around a central router node
function layoutNodes(vms) {
  const nodes = [];
  const cx = 400, cy = 230, r = 160;
 
  // Central internet/gateway node
  nodes.push({
    id: "internet",
    label: "INTERNET",
    ip: "Gateway",
    x: cx,
    y: cy,
    color: "#00e5ff",
    type: "gateway",
    risk: "UNKNOWN",
  });
 
  // Place VMs in a circle
  vms.forEach((vm, i) => {
    const angle = (2 * Math.PI * i) / Math.max(vms.length, 1) - Math.PI / 2;
    const radius = r;
    nodes.push({
      id: `vm-${vm.id}`,
      label: vm.ip_address,
      ip: vm.ip_address,
      hostname: vm.hostname,
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
      color: getRiskColor(vm.risk_level),
      type: "vm",
      risk: (vm.risk_level || "UNKNOWN").toUpperCase(),
      data: vm,
    });
  });
 
  return nodes;
}
 
export default function NetworkTopology() {
  const [vms, setVms]             = useState([]);
  const [nodes, setNodes]         = useState([]);
  const [selected, setSelected]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [summary, setSummary]     = useState({ total: 0, critical: 0, high: 0, medium: 0, low: 0 });
  const svgRef = useRef(null);
 
  useEffect(() => { loadData(); }, []);
 
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/vms");
      const list = res.data?.vms || [];
      setVms(list);
      setNodes(layoutNodes(list));
 
      // Compute summary
      const s = { total: list.length, critical: 0, high: 0, medium: 0, low: 0, unknown: 0 };
      list.forEach(vm => {
        const r = (vm.risk_level || "unknown").toLowerCase();
        if (r in s) s[r]++;
        else s.unknown++;
      });
      setSummary(s);
    } catch (e) {
      console.error(e);
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
          <span style={{ color: "#64b5f6", fontSize: 14 }}>Loading Network Topology...</span>
        </div>
      </>
    );
  }
 
  const gatewayNode = nodes.find(n => n.type === "gateway");
  const vmNodes     = nodes.filter(n => n.type === "vm");
  const selectedVm  = selected?.data;
 
  return (
    <>
      <style>{styles}</style>
      <div className="topo-main">
        <Sidebar />
        <div className="topo-content">
 
          {/* Header */}
          <div className="topo-header">
            <div>
              <h1 className="topo-title">Network Topology Map</h1>
              <p className="topo-subtitle">Visual diagram of all discovered devices and their risk levels</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 12 }}>
              <button className="refresh-btn" onClick={loadData}>↻ Refresh</button>
              <div className="legend">
                {Object.entries(RISK_COLORS).map(([level, color]) => (
                  <div key={level} className="legend-item">
                    <div className="legend-dot" style={{ background: color }} />
                    {level}
                  </div>
                ))}
              </div>
            </div>
          </div>
 
          <div className="topo-grid">
 
            {/* SVG Canvas */}
            <div className="topo-canvas-panel">
              <h2 className="panel-title">Live Network Graph</h2>
 
              {vmNodes.length === 0 ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 400, color: "#546e7a", gap: 12 }}>
                  <span style={{ fontSize: 40 }}>🌐</span>
                  <p style={{ margin: 0, fontSize: 14 }}>No devices discovered yet</p>
                  <p style={{ margin: 0, fontSize: 12 }}>Run a scan to populate the topology map</p>
                </div>
              ) : (
                <svg ref={svgRef} className="topo-svg" viewBox="0 0 800 460">
                  <defs>
                    <radialGradient id="bgGrad" cx="50%" cy="50%">
                      <stop offset="0%"   stopColor="#001e3c" stopOpacity="1" />
                      <stop offset="100%" stopColor="#060f1a" stopOpacity="1" />
                    </radialGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
 
                  {/* Background */}
                  <rect width="800" height="460" fill="url(#bgGrad)" rx="12" />
 
                  {/* Grid dots */}
                  {Array.from({ length: 20 }).map((_, i) =>
                    Array.from({ length: 12 }).map((_, j) => (
                      <circle
                        key={`${i}-${j}`}
                        cx={i * 42 + 10} cy={j * 40 + 10}
                        r="1"
                        fill="rgba(0,229,255,0.06)"
                      />
                    ))
                  )}
 
                  {/* Edges from gateway to each VM */}
                  {gatewayNode && vmNodes.map(node => (
                    <line
                      key={`edge-${node.id}`}
                      x1={gatewayNode.x} y1={gatewayNode.y}
                      x2={node.x}        y2={node.y}
                      stroke={node.color}
                      strokeWidth="1.5"
                      strokeOpacity="0.25"
                      strokeDasharray="6 4"
                    />
                  ))}
 
                  {/* Gateway node */}
                  {gatewayNode && (
                    <g
                      key="gateway"
                      style={{ cursor: "pointer" }}
                      onClick={() => setSelected(null)}
                    >
                      <circle
                        cx={gatewayNode.x} cy={gatewayNode.y}
                        r="28"
                        fill="rgba(0,229,255,0.08)"
                        stroke="#00e5ff"
                        strokeWidth="2"
                        filter="url(#glow)"
                      />
                      <circle
                        cx={gatewayNode.x} cy={gatewayNode.y}
                        r="20"
                        fill="rgba(0,229,255,0.15)"
                      />
                      <text
                        x={gatewayNode.x} y={gatewayNode.y - 2}
                        textAnchor="middle"
                        fontSize="14"
                        fill="#00e5ff"
                        fontFamily="JetBrains Mono"
                      >🌐</text>
                      <text
                        x={gatewayNode.x} y={gatewayNode.y + 42}
                        textAnchor="middle"
                        fontSize="10"
                        fill="#00e5ff"
                        fontFamily="JetBrains Mono"
                        fontWeight="600"
                      >INTERNET</text>
                    </g>
                  )}
 
                  {/* VM nodes */}
                  {vmNodes.map(node => {
                    const isSelected = selected?.id === node.id;
                    const color      = node.color;
                    return (
                      <g
                        key={node.id}
                        style={{ cursor: "pointer" }}
                        onClick={() => setSelected(isSelected ? null : node)}
                      >
                        {/* Glow ring when selected */}
                        {isSelected && (
                          <circle
                            cx={node.x} cy={node.y}
                            r="30"
                            fill="none"
                            stroke={color}
                            strokeWidth="2"
                            strokeOpacity="0.4"
                          />
                        )}
                        <circle
                          cx={node.x} cy={node.y}
                          r="22"
                          fill={`${color}18`}
                          stroke={color}
                          strokeWidth={isSelected ? 2.5 : 1.5}
                          filter="url(#glow)"
                        />
                        <circle
                          cx={node.x} cy={node.y}
                          r="14"
                          fill={`${color}30`}
                        />
                        <text
                          x={node.x} y={node.y + 4}
                          textAnchor="middle"
                          fontSize="13"
                          fill={color}
                          fontFamily="JetBrains Mono"
                          fontWeight="700"
                        >⬡</text>
 
                        {/* IP label */}
                        <text
                          x={node.x} y={node.y + 36}
                          textAnchor="middle"
                          fontSize="9.5"
                          fill={color}
                          fontFamily="JetBrains Mono"
                          fontWeight="600"
                        >{node.label}</text>
 
                        {/* Risk badge */}
                        <text
                          x={node.x} y={node.y + 48}
                          textAnchor="middle"
                          fontSize="8"
                          fill={`${color}99`}
                          fontFamily="JetBrains Mono"
                        >{node.risk}</text>
 
                        {/* Vuln count bubble */}
                        {node.data?.vuln_counts?.total > 0 && (
                          <>
                            <circle
                              cx={node.x + 16} cy={node.y - 16}
                              r="9"
                              fill="#ff4d4d"
                              stroke="#0a1929"
                              strokeWidth="2"
                            />
                            <text
                              x={node.x + 16} y={node.y - 12}
                              textAnchor="middle"
                              fontSize="8"
                              fill="#fff"
                              fontFamily="JetBrains Mono"
                              fontWeight="700"
                            >{node.data.vuln_counts.total}</text>
                          </>
                        )}
                      </g>
                    );
                  })}
                </svg>
              )}
            </div>
 
            {/* Side panel */}
            <div className="side-panel">
 
              {/* Summary stats */}
              <div className="stats-mini">
                <h2 className="panel-title" style={{ marginBottom: 12 }}>Network Summary</h2>
                <div className="mini-stat">
                  <span className="mini-label">Total Devices</span>
                  <span className="mini-value" style={{ color: "#00e5ff" }}>{summary.total}</span>
                </div>
                <div className="mini-stat">
                  <span className="mini-label">Critical</span>
                  <span className="mini-value" style={{ color: "#ff4d4d" }}>{summary.critical}</span>
                </div>
                <div className="mini-stat">
                  <span className="mini-label">High</span>
                  <span className="mini-value" style={{ color: "#ff6b6b" }}>{summary.high}</span>
                </div>
                <div className="mini-stat">
                  <span className="mini-label">Medium</span>
                  <span className="mini-value" style={{ color: "#ffa726" }}>{summary.medium}</span>
                </div>
                <div className="mini-stat">
                  <span className="mini-label">Low / Clean</span>
                  <span className="mini-value" style={{ color: "#51cf66" }}>{summary.low}</span>
                </div>
              </div>
 
              {/* Node detail */}
              <div className="node-detail-panel">
                <h2 className="panel-title" style={{ marginBottom: 12 }}>Device Detail</h2>
                {!selected || !selectedVm ? (
                  <p className="node-detail-empty">
                    👆 Click a node on the map to see device details
                  </p>
                ) : (
                  <>
                    <p className="node-ip">{selectedVm.ip_address}</p>
                    <p className="node-host">{selectedVm.hostname}</p>
 
                    <div className="detail-row">
                      <span className="detail-key">OS</span>
                      <span className="detail-val">{selectedVm.os || "Unknown"}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-key">Status</span>
                      <span className="detail-val" style={{ color: "#51cf66" }}>{selectedVm.status || "active"}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-key">Risk Level</span>
                      <span>
                        <span className="risk-badge" style={getRiskBadgeStyle(selectedVm.risk_level)}>
                          {selectedVm.risk_level || "UNKNOWN"}
                        </span>
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-key">Total Vulns</span>
                      <span className="detail-val">{selectedVm.vuln_counts?.total || 0}</span>
                    </div>
 
                    {/* Vuln breakdown chips */}
                    <div className="vuln-chips">
                      {selectedVm.vuln_counts?.critical > 0 && (
                        <span className="chip" style={{ background: "rgba(255,77,77,0.15)", color: "#ff4d4d", border: "1px solid rgba(255,77,77,0.3)" }}>
                          {selectedVm.vuln_counts.critical}C
                        </span>
                      )}
                      {selectedVm.vuln_counts?.high > 0 && (
                        <span className="chip" style={{ background: "rgba(255,107,107,0.15)", color: "#ff6b6b", border: "1px solid rgba(255,107,107,0.3)" }}>
                          {selectedVm.vuln_counts.high}H
                        </span>
                      )}
                      {selectedVm.vuln_counts?.medium > 0 && (
                        <span className="chip" style={{ background: "rgba(255,167,38,0.15)", color: "#ffa726", border: "1px solid rgba(255,167,38,0.3)" }}>
                          {selectedVm.vuln_counts.medium}M
                        </span>
                      )}
                      {selectedVm.vuln_counts?.low > 0 && (
                        <span className="chip" style={{ background: "rgba(81,207,102,0.15)", color: "#51cf66", border: "1px solid rgba(81,207,102,0.3)" }}>
                          {selectedVm.vuln_counts.low}L
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
 
            </div>
          </div>
 
        </div>
      </div>
    </>
  );
}