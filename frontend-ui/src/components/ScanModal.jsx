import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');

  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(30px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0)    scale(1); }
  }
  @keyframes scan-pulse {
    0%   { box-shadow: 0 0 0 0 rgba(0,229,255,0.4); }
    70%  { box-shadow: 0 0 0 12px rgba(0,229,255,0); }
    100% { box-shadow: 0 0 0 0 rgba(0,229,255,0); }
  }
  @keyframes progress-shine {
    from { background-position: -200% center; }
    to   { background-position: 200% center; }
  }
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0; }
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .sm-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.85);
    backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    z-index: 9999;
    padding: 20px;
    animation: fadeIn 0.2s ease;
    font-family: 'Inter', sans-serif;
  }
  .sm-modal {
    background: linear-gradient(145deg, #0d1f30, #0a1929, #061624);
    border: 1px solid rgba(0,229,255,0.2);
    border-radius: 18px;
    padding: 32px;
    width: 100%;
    max-width: 580px;
    max-height: 90vh;
    overflow-y: auto;
    animation: slideUp 0.3s ease;
    position: relative;
  }
  .sm-modal::-webkit-scrollbar { width: 4px; }
  .sm-modal::-webkit-scrollbar-thumb { background: rgba(0,229,255,0.2); border-radius: 2px; }

  .sm-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 28px;
    padding-bottom: 20px;
    border-bottom: 1px solid rgba(0,229,255,0.1);
  }
  .sm-title {
    font-family: 'JetBrains Mono', monospace;
    font-size: 20px;
    font-weight: 700;
    color: #00e5ff;
    margin: 0 0 4px;
  }
  .sm-subtitle { color: #546e7a; font-size: 13px; margin: 0; }
  .sm-close {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    color: #90caf9;
    width: 32px; height: 32px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 18px;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.2s;
    flex-shrink: 0;
  }
  .sm-close:hover { background: rgba(255,107,107,0.15); border-color: rgba(255,107,107,0.3); color: #ff6b6b; }

  .sm-label {
    display: block;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #64b5f6;
    margin-bottom: 8px;
  }
  .sm-input {
    width: 100%;
    padding: 13px 16px;
    background: rgba(0,0,0,0.3);
    border: 1px solid rgba(0,229,255,0.2);
    border-radius: 10px;
    color: #e3f2fd;
    font-family: 'JetBrains Mono', monospace;
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    box-sizing: border-box;
  }
  .sm-input:focus {
    border-color: #00e5ff;
    box-shadow: 0 0 0 3px rgba(0,229,255,0.1);
  }
  .sm-input::placeholder { color: #37474f; }

  .sm-modes {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin-top: 0;
  }
  .sm-mode {
    padding: 14px 10px;
    border-radius: 10px;
    border: 1px solid rgba(0,229,255,0.12);
    background: rgba(0,0,0,0.2);
    cursor: pointer;
    text-align: center;
    transition: all 0.2s;
  }
  .sm-mode:hover { border-color: rgba(0,229,255,0.3); background: rgba(0,229,255,0.05); }
  .sm-mode.selected {
    border-color: #00e5ff;
    background: rgba(0,229,255,0.1);
    box-shadow: 0 0 0 1px rgba(0,229,255,0.3);
  }
  .sm-mode-icon { font-size: 22px; margin-bottom: 6px; }
  .sm-mode-name {
    font-size: 13px;
    font-weight: 600;
    color: #e3f2fd;
    font-family: 'JetBrains Mono', monospace;
    margin-bottom: 4px;
  }
  .sm-mode-desc { font-size: 11px; color: #546e7a; line-height: 1.4; }
  .sm-mode.selected .sm-mode-name { color: #00e5ff; }

  .sm-start-btn {
    width: 100%;
    padding: 15px;
    background: linear-gradient(135deg, #00e5ff, #0091ea);
    border: none;
    border-radius: 10px;
    color: #001e3c;
    font-weight: 700;
    font-size: 15px;
    font-family: 'JetBrains Mono', monospace;
    cursor: pointer;
    letter-spacing: 0.05em;
    transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
    animation: scan-pulse 2.5s infinite;
  }
  .sm-start-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(0,229,255,0.3); }
  .sm-start-btn:disabled { opacity: 0.5; cursor: not-allowed; animation: none; }

  /* Progress section */
  .sm-progress-wrap {
    background: rgba(0,0,0,0.3);
    border: 1px solid rgba(0,229,255,0.15);
    border-radius: 12px;
    padding: 20px;
    margin-top: 20px;
  }
  .sm-progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }
  .sm-phase {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    color: #00e5ff;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .sm-phase-dot {
    width: 6px; height: 6px;
    background: #00e5ff;
    border-radius: 50%;
    animation: blink 1s infinite;
  }
  .sm-pct {
    font-family: 'JetBrains Mono', monospace;
    font-size: 22px;
    font-weight: 700;
    color: #00e5ff;
  }
  .sm-bar-bg {
    height: 10px;
    background: rgba(0,0,0,0.4);
    border-radius: 5px;
    overflow: hidden;
    margin-bottom: 10px;
  }
  .sm-bar-fill {
    height: 100%;
    border-radius: 5px;
    background: linear-gradient(90deg, #00e5ff, #82b1ff, #00e5ff);
    background-size: 200% auto;
    animation: progress-shine 2s linear infinite;
    transition: width 0.5s ease;
  }
  .sm-bar-fill.done {
    background: linear-gradient(90deg, #51cf66, #69db7c);
    animation: none;
  }
  .sm-bar-fill.failed {
    background: linear-gradient(90deg, #ff6b6b, #ff4d4d);
    animation: none;
  }
  .sm-log {
    margin-top: 14px;
    max-height: 140px;
    overflow-y: auto;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: #546e7a;
    line-height: 1.7;
  }
  .sm-log::-webkit-scrollbar { width: 3px; }
  .sm-log::-webkit-scrollbar-thumb { background: rgba(0,229,255,0.15); }
  .sm-log-line { padding: 1px 0; }
  .sm-log-line.active { color: #64b5f6; }
  .sm-log-line.done { color: #51cf66; }
  .sm-log-line.error { color: #ff6b6b; }

  .sm-result-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    font-size: 13px;
  }
  .sm-result-row:last-child { border-bottom: none; }
  .sm-result-label { color: #64b5f6; }
  .sm-result-value {
    font-family: 'JetBrains Mono', monospace;
    font-weight: 600;
    color: #e3f2fd;
  }
  .sev-crit { color: #ff4d4d; }
  .sev-high { color: #ffa726; }
  .sev-med  { color: #ffd93d; }
  .sev-low  { color: #51cf66; }

  .sm-field { margin-bottom: 20px; }
  .sm-divider {
    height: 1px;
    background: rgba(0,229,255,0.08);
    margin: 20px 0;
  }
`;

const MODES = [
  { id: 'fast',   icon: '⚡', name: 'Fast',   desc: 'Top 100 ports\n~2 min/host',   time: '~2m' },
  { id: 'medium', icon: '🔍', name: 'Medium', desc: 'Top 1000 ports\n~6 min/host',  time: '~6m' },
  { id: 'deep',   icon: '🔬', name: 'Deep',   desc: 'All 65535 ports\n~15 min/host', time: '~15m' },
];

const LOG_PHASES = [
  { phase: 'queued',                    label: '⬡ Queued — waiting to start' },
  { phase: 'initialising',              label: '◎ Initialising scanner...' },
  { phase: 'scanning',                  label: '◈ Running nmap scan...' },
  { phase: 'parsing results',           label: '⊞ Parsing nmap XML output...' },
  { phase: 'analysing vulnerabilities', label: '◬ Analysing vulnerabilities + CVE lookup...' },
  { phase: 'prioritising',              label: '⬡ Running AI prioritization...' },
  { phase: 'completed',                 label: '✓ Scan completed successfully' },
];

export default function ScanModal({ onClose, onScanStarted }) {
  const [target,     setTarget]     = useState('');
  const [mode,       setMode]       = useState('fast');
  const [scanning,   setScanning]   = useState(false);
  const [scanId,     setScanId]     = useState(null);
  const [progress,   setProgress]   = useState(0);
  const [phase,      setPhase]      = useState('');
  const [status,     setStatus]     = useState('');
  const [vulnResult, setVulnResult] = useState(null);
  const pollRef = useRef(null);

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const startScan = async () => {
    const t = target.trim();
    if (!t) { toast.error('Enter a target IP, CIDR, or hostname'); return; }

    setScanning(true);
    setProgress(0);
    setPhase('queued');
    setStatus('running');
    setVulnResult(null);

    try {
      const res = await api.post('/api/scan/start', { target: t, mode });
      const id  = res.data.scan_id;
      setScanId(id);
      if (onScanStarted) onScanStarted(id);
      toast.success(`Scan #${id} started`);
      _pollScan(id);
    } catch (err) {
      const msg = err?.response?.data?.error || 'Failed to start scan';
      toast.error(msg);
      setScanning(false);
      setStatus('failed');
    }
  };

  const _pollScan = (id) => {
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await api.get(`/api/scan/${id}`);
        setProgress(data.progress || 0);
        setPhase(data.phase   || '');
        setStatus(data.status || '');

        if (data.status === 'completed' || data.status === 'failed') {
          clearInterval(pollRef.current);
          setScanning(false);

          if (data.status === 'completed') {
            toast.success('Scan completed!');
            // Load vuln summary
            try {
              const { data: vd } = await api.get(`/api/scan/${id}/vulnerabilities`);
              const vulns = vd.vulnerabilities || vd || [];
              const counts = { critical: 0, high: 0, medium: 0, low: 0 };
              vulns.forEach(v => {
                const s = (v.severity || 'low').toLowerCase();
                if (counts[s] !== undefined) counts[s]++;
              });
              setVulnResult({ total: vulns.length, ...counts });
            } catch { /* non-fatal */ }
          } else {
            toast.error('Scan failed');
          }
        }
      } catch {
        clearInterval(pollRef.current);
        setScanning(false);
        setStatus('failed');
      }
    }, 2000);
  };

  const barClass = status === 'completed' ? 'done' : status === 'failed' ? 'failed' : '';

  const currentLogIdx = LOG_PHASES.findIndex(l =>
    phase && l.phase && phase.toLowerCase().includes(l.phase)
  );

  return (
    <>
      <style>{styles}</style>
      <div className="sm-overlay" onClick={(e) => e.target === e.currentTarget && !scanning && onClose()}>
        <div className="sm-modal">

          {/* Header */}
          <div className="sm-header">
            <div>
              <h2 className="sm-title">▶ New Security Scan</h2>
              <p className="sm-subtitle">Configure and launch a vulnerability scan</p>
            </div>
            <button className="sm-close" onClick={onClose} disabled={scanning}>×</button>
          </div>

          {/* Target input */}
          <div className="sm-field">
            <label className="sm-label">Target</label>
            <input
              className="sm-input"
              value={target}
              onChange={e => setTarget(e.target.value)}
              placeholder="192.168.1.1 · 192.168.1.0/24 · hostname.local"
              disabled={scanning}
              onKeyDown={e => e.key === 'Enter' && !scanning && startScan()}
            />
          </div>

          {/* Mode selector */}
          <div className="sm-field">
            <label className="sm-label">Scan Mode</label>
            <div className="sm-modes">
              {MODES.map(m => (
                <div
                  key={m.id}
                  className={`sm-mode ${mode === m.id ? 'selected' : ''}`}
                  onClick={() => !scanning && setMode(m.id)}
                >
                  <div className="sm-mode-icon">{m.icon}</div>
                  <div className="sm-mode-name">{m.name}</div>
                  <div className="sm-mode-desc" style={{ whiteSpace: 'pre-line' }}>{m.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Progress section */}
          {(scanning || status === 'completed' || status === 'failed') && (
            <div className="sm-progress-wrap">
              <div className="sm-progress-header">
                <div className="sm-phase">
                  {scanning && <span className="sm-phase-dot" />}
                  {phase || 'initialising...'}
                </div>
                <div className="sm-pct">{progress}%</div>
              </div>

              <div className="sm-bar-bg">
                <div
                  className={`sm-bar-fill ${barClass}`}
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Phase log */}
              <div className="sm-log">
                {LOG_PHASES.map((lp, idx) => {
                  let cls = '';
                  if (idx < currentLogIdx) cls = 'done';
                  else if (idx === currentLogIdx) cls = 'active';
                  if (status === 'failed' && idx === currentLogIdx) cls = 'error';
                  if (status === 'completed') cls = 'done';
                  if (idx > currentLogIdx && status !== 'completed') return null;
                  return (
                    <div key={idx} className={`sm-log-line ${cls}`}>
                      {lp.label}
                    </div>
                  );
                })}
              </div>

              {/* Results summary */}
              {vulnResult && (
                <>
                  <div className="sm-divider" />
                  <div className="sm-result-row">
                    <span className="sm-result-label">Scan ID</span>
                    <span className="sm-result-value">#{scanId}</span>
                  </div>
                  <div className="sm-result-row">
                    <span className="sm-result-label">Total Vulnerabilities</span>
                    <span className="sm-result-value">{vulnResult.total}</span>
                  </div>
                  <div className="sm-result-row">
                    <span className="sm-result-label">Critical</span>
                    <span className={`sm-result-value sev-crit`}>{vulnResult.critical}</span>
                  </div>
                  <div className="sm-result-row">
                    <span className="sm-result-label">High</span>
                    <span className={`sm-result-value sev-high`}>{vulnResult.high}</span>
                  </div>
                  <div className="sm-result-row">
                    <span className="sm-result-label">Medium</span>
                    <span className={`sm-result-value sev-med`}>{vulnResult.medium}</span>
                  </div>
                  <div className="sm-result-row">
                    <span className="sm-result-label">Low</span>
                    <span className={`sm-result-value sev-low`}>{vulnResult.low}</span>
                  </div>
                </>
              )}
            </div>
          )}

          <div style={{ marginTop: 24 }}>
            {!scanning && status !== 'completed' && (
              <button className="sm-start-btn" onClick={startScan} disabled={scanning}>
                ▶ START SCAN
              </button>
            )}
            {scanning && (
              <button className="sm-start-btn" disabled style={{ background: 'rgba(0,229,255,0.2)', color: '#00e5ff' }}>
                SCANNING... {progress}%
              </button>
            )}
            {status === 'completed' && (
              <button
                className="sm-start-btn"
                style={{ background: 'linear-gradient(135deg, #51cf66, #40c057)', animation: 'none' }}
                onClick={onClose}
              >
                ✓ DONE — VIEW RESULTS
              </button>
            )}
            {status === 'failed' && (
              <button
                className="sm-start-btn"
                style={{ background: 'linear-gradient(135deg, #ff6b6b, #ff4d4d)', animation: 'none' }}
                onClick={() => { setStatus(''); setScanning(false); }}
              >
                ↺ RETRY
              </button>
            )}
          </div>

        </div>
      </div>
    </>
  );
}