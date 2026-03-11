import React, { useEffect, useState, useCallback } from 'react';
import Sidebar from './Sidebar';
import api from '../services/api';
import toast from 'react-hot-toast';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');

  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .vuln-page { display: flex; background: #0a1929; min-height: 100vh; font-family: 'Inter', sans-serif; }
  .vuln-content { margin-left: 240px; flex: 1; padding: 40px; animation: fadeInUp 0.4s ease; }

  .page-header {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 32px;
    padding-bottom: 24px;
    border-bottom: 1px solid rgba(0,229,255,0.1);
  }
  .page-title {
    font-family: 'JetBrains Mono', monospace;
    font-size: 28px; font-weight: 700;
    background: linear-gradient(90deg, #00e5ff, #82b1ff, #fff);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: shimmer 4s linear infinite;
    margin: 0 0 4px;
  }
  .page-sub { color: #546e7a; font-size: 13px; margin: 0; }

  /* Stats */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 14px;
    margin-bottom: 28px;
  }
  .stat-card {
    background: #001e3c;
    border: 1px solid rgba(0,229,255,0.08);
    border-radius: 12px;
    padding: 18px;
    position: relative; overflow: hidden;
    transition: transform 0.2s, border-color 0.2s;
    animation: fadeInUp 0.4s ease backwards;
  }
  .stat-card:hover { transform: translateY(-2px); border-color: rgba(0,229,255,0.2); }
  .stat-top { position: absolute; top: 0; left: 0; right: 0; height: 2px; border-radius: 12px 12px 0 0; }
  .stat-label { color: #546e7a; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.09em; margin-bottom: 8px; }
  .stat-value { font-family: 'JetBrains Mono', monospace; font-size: 30px; font-weight: 700; }

  /* Toolbar */
  .toolbar {
    display: flex; gap: 12px; margin-bottom: 22px; flex-wrap: wrap; align-items: center;
  }
  .search-input {
    flex: 1; min-width: 200px;
    padding: 10px 16px;
    background: rgba(0,0,0,0.25);
    border: 1px solid rgba(0,229,255,0.18);
    border-radius: 8px; color: #e3f2fd;
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px; outline: none;
    transition: border-color 0.2s;
  }
  .search-input:focus { border-color: #00e5ff; }
  .search-input::placeholder { color: #37474f; }
  .filter-pill {
    padding: 7px 14px; border-radius: 20px;
    font-size: 11px; font-weight: 700;
    cursor: pointer;
    border: 1px solid rgba(0,229,255,0.18);
    background: transparent; color: #64b5f6;
    font-family: 'JetBrains Mono', monospace;
    text-transform: uppercase; letter-spacing: 0.05em;
    transition: all 0.2s;
  }
  .filter-pill:hover { background: rgba(0,229,255,0.06); }
  .filter-pill.active { background: rgba(0,229,255,0.12); border-color: #00e5ff; color: #00e5ff; }
  .filter-pill.f-critical.active { background: rgba(255,77,77,0.1); border-color: #ff4d4d; color: #ff4d4d; }
  .filter-pill.f-high.active    { background: rgba(255,167,38,0.1); border-color: #ffa726; color: #ffa726; }
  .filter-pill.f-medium.active  { background: rgba(255,217,61,0.1); border-color: #ffd93d; color: #ffd93d; }
  .filter-pill.f-low.active     { background: rgba(81,207,102,0.1); border-color: #51cf66; color: #51cf66; }

  /* Sort dropdown */
  .sort-select {
    padding: 9px 12px;
    background: rgba(0,0,0,0.25);
    border: 1px solid rgba(0,229,255,0.18);
    border-radius: 8px; color: #64b5f6;
    font-size: 12px;
    font-family: 'JetBrains Mono', monospace;
    outline: none; cursor: pointer;
  }

  /* Panel */
  .panel {
    background: linear-gradient(135deg, rgba(0,229,255,0.04), rgba(0,145,234,0.02));
    border: 1px solid rgba(0,229,255,0.1);
    border-radius: 16px;
    padding: 24px;
  }
  .panel-title {
    color: #00e5ff; font-size: 13px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.1em;
    margin: 0 0 18px;
    display: flex; align-items: center; gap: 8px;
  }
  .panel-title::before { content: ''; display: inline-block; width: 3px; height: 13px; background: #00e5ff; border-radius: 2px; }

  .vuln-table { width: 100%; border-collapse: collapse; }
  .vuln-table th {
    color: #64b5f6; font-size: 11px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.08em;
    padding: 0 12px 12px; text-align: left;
    border-bottom: 1px solid rgba(0,229,255,0.1);
  }
  .vuln-table td {
    padding: 12px; font-size: 12px;
    color: #90caf9;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    font-family: 'JetBrains Mono', monospace;
  }
  .vuln-table tr:hover td { background: rgba(0,229,255,0.03); cursor: pointer; }
  .vuln-table tr:last-child td { border-bottom: none; }

  .sev-badge {
    display: inline-block; padding: 3px 9px;
    border-radius: 10px; font-size: 10px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.04em;
  }
  .sev-critical { background: rgba(255,77,77,0.15);  color: #ff4d4d; border: 1px solid rgba(255,77,77,0.3); }
  .sev-high     { background: rgba(255,167,38,0.15); color: #ffa726; border: 1px solid rgba(255,167,38,0.3); }
  .sev-medium   { background: rgba(255,217,61,0.15); color: #ffd93d; border: 1px solid rgba(255,217,61,0.3); }
  .sev-low      { background: rgba(81,207,102,0.15); color: #51cf66; border: 1px solid rgba(81,207,102,0.3); }
  .sev-unknown  { background: rgba(144,164,174,0.12); color: #90a4ae; border: 1px solid rgba(144,164,174,0.25); }

  .flag-tag { display: inline-block; padding: 2px 6px; border-radius: 5px; font-size: 10px; margin-right: 3px; }
  .flag-exploit  { background: rgba(255,77,77,0.15);  color: #ff6b6b; }
  .flag-misconfig{ background: rgba(255,167,38,0.15); color: #ffa726; }
  .flag-exposed  { background: rgba(0,229,255,0.1);   color: #00e5ff; }

  .cve-tag {
    display: inline-block; padding: 2px 7px;
    border-radius: 4px; font-size: 10px;
    background: rgba(130,177,255,0.1);
    color: #82b1ff; margin-right: 3px;
    border: 1px solid rgba(130,177,255,0.2);
  }

  .remediation-select {
    padding: 4px 8px; border-radius: 6px; font-size: 10px;
    background: rgba(0,0,0,0.3);
    border: 1px solid rgba(0,229,255,0.2);
    color: #90caf9; cursor: pointer; outline: none;
    font-family: 'JetBrains Mono', monospace;
  }

  /* Detail drawer */
  .detail-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.8);
    backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
    z-index: 9999; padding: 20px;
  }
  .detail-modal {
    background: linear-gradient(145deg, #0d1f30, #0a1929);
    border: 1px solid rgba(0,229,255,0.2);
    border-radius: 16px;
    padding: 28px;
    width: 100%; max-width: 720px;
    max-height: 88vh; overflow-y: auto;
  }
  .detail-modal::-webkit-scrollbar { width: 4px; }
  .detail-modal::-webkit-scrollbar-thumb { background: rgba(0,229,255,0.2); border-radius: 2px; }
  .detail-header { display: flex; justify-content: space-between; margin-bottom: 22px; }
  .detail-title { font-family: 'JetBrains Mono', monospace; font-size: 17px; color: #00e5ff; margin: 0 0 4px; }
  .detail-meta  { color: #546e7a; font-size: 12px; }
  .detail-close {
    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
    color: #90caf9; width: 30px; height: 30px;
    border-radius: 8px; cursor: pointer; font-size: 16px;
    display: flex; align-items: center; justify-content: center;
  }
  .detail-close:hover { background: rgba(255,107,107,0.15); color: #ff6b6b; }
  .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 13px; }
  .detail-row:last-child { border-bottom: none; }
  .detail-row-label { color: #546e7a; }
  .detail-row-value { font-family: 'JetBrains Mono', monospace; color: #e3f2fd; font-weight: 600; text-align: right; max-width: 400px; word-break: break-word; }
  .detail-section { margin-top: 18px; }
  .detail-section-title { color: #00e5ff; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
  .detail-section-title::before { content: ''; display: inline-block; width: 3px; height: 11px; background: #00e5ff; border-radius: 2px; }
  .description-box {
    background: rgba(0,0,0,0.25);
    border: 1px solid rgba(0,229,255,0.08);
    border-radius: 8px; padding: 14px;
    font-size: 13px; color: #90caf9; line-height: 1.6;
    font-family: 'Inter', sans-serif;
  }

  .empty-state { text-align: center; padding: 40px; color: #37474f; font-size: 14px; }
  .spinner { width: 20px; height: 20px; border: 2px solid rgba(0,229,255,0.2); border-top-color: #00e5ff; border-radius: 50%; animation: spin 0.8s linear infinite; }

  .pagination { display: flex; justify-content: flex-end; align-items: center; gap: 10px; margin-top: 16px; }
  .page-btn {
    padding: 6px 12px; border-radius: 6px;
    border: 1px solid rgba(0,229,255,0.2);
    background: transparent; color: #64b5f6;
    font-size: 12px; cursor: pointer;
    font-family: 'JetBrains Mono', monospace;
    transition: all 0.2s;
  }
  .page-btn:hover:not(:disabled) { background: rgba(0,229,255,0.08); }
  .page-btn:disabled { opacity: 0.3; cursor: not-allowed; }
  .page-info { color: #546e7a; font-size: 12px; font-family: 'JetBrains Mono', monospace; }
`;

const PAGE_SIZE = 25;

function sevClass(s) {
  return `sev-${(s || 'unknown').toLowerCase()}`;
}

export default function Vulnerabilities() {
  const [vulns,     setVulns]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState('all');
  const [search,    setSearch]    = useState('');
  const [sortBy,    setSortBy]    = useState('risk_score');
  const [selected,  setSelected]  = useState(null);
  const [page,      setPage]      = useState(1);

  useEffect(() => { loadVulns(); }, []);

  const loadVulns = useCallback(async () => {
    setLoading(true);
    try {
      // Load from all scans
      const { data: scanData } = await api.get('/api/scans');
      const scans = Array.isArray(scanData) ? scanData : [];
      const completed = scans.filter(s => s.status === 'completed');

      const results = await Promise.allSettled(
        completed.map(scan =>
          api.get(`/api/scan/${scan.id}/vulnerabilities`)
            .then(r => (r.data.vulnerabilities || r.data || []).map(v => ({
              ...v,
              target:  scan.target,
              scan_id: scan.id,
            })))
        )
      );

      const all = results
        .filter(r => r.status === 'fulfilled')
        .flatMap(r => r.value);

      // Deduplicate by id
      const seen = new Set();
      const unique = all.filter(v => {
        if (seen.has(v.id)) return false;
        seen.add(v.id);
        return true;
      });

      setVulns(unique);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load vulnerabilities');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateRemediation = async (vulnId, status) => {
    try {
      await api.patch(`/api/vulnerability/${vulnId}/remediate`, { remediation_status: status });
      setVulns(prev => prev.map(v =>
        v.id === vulnId ? { ...v, remediation_status: status } : v
      ));
      toast.success('Status updated');
    } catch { toast.error('Update failed'); }
  };

  // Stats
  const counts = { critical: 0, high: 0, medium: 0, low: 0, unknown: 0 };
  vulns.forEach(v => {
    const s = (v.severity || 'unknown').toLowerCase();
    if (counts[s] !== undefined) counts[s]++;
    else counts.unknown++;
  });
  const exploitable = vulns.filter(v => v.exploit_available).length;

  // Filter + search + sort
  const filtered = vulns
    .filter(v => {
      if (filter !== 'all' && (v.severity || 'unknown').toLowerCase() !== filter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          (v.description || '').toLowerCase().includes(q) ||
          (v.service     || '').toLowerCase().includes(q) ||
          (v.target      || '').toLowerCase().includes(q) ||
          (v.cve_ids     || '').toLowerCase().includes(q) ||
          String(v.port  || '').includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'risk_score')  return (b.risk_score  || 0) - (a.risk_score  || 0);
      if (sortBy === 'cvss_score')  return (b.cvss_score  || 0) - (a.cvss_score  || 0);
      if (sortBy === 'severity') {
        const order = { critical: 4, high: 3, medium: 2, low: 1 };
        return (order[(b.severity || '').toLowerCase()] || 0) - (order[(a.severity || '').toLowerCase()] || 0);
      }
      if (sortBy === 'cve_count') return (b.cve_count || 0) - (a.cve_count || 0);
      return 0;
    });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <style>{styles}</style>
      <div className="vuln-page">
        <Sidebar />
        <div className="vuln-content">

          {/* Header */}
          <div className="page-header">
            <div>
              <h1 className="page-title">Vulnerability Intelligence</h1>
              <p className="page-sub">{vulns.length} total · {exploitable} exploitable · {counts.critical} critical</p>
            </div>
            <button
              style={{ padding: '10px 16px', background: 'transparent', border: '1px solid rgba(0,229,255,0.25)', borderRadius: 10, color: '#64b5f6', fontSize: 13, fontFamily: 'JetBrains Mono', cursor: 'pointer' }}
              onClick={loadVulns}
            >↺ Refresh</button>
          </div>

          {/* Stats */}
          <div className="stats-grid">
            {[
              { label: 'Critical', value: counts.critical,  color: '#ff4d4d',  delay: '0s' },
              { label: 'High',     value: counts.high,      color: '#ffa726',  delay: '0.08s' },
              { label: 'Medium',   value: counts.medium,    color: '#ffd93d',  delay: '0.16s' },
              { label: 'Low',      value: counts.low,       color: '#51cf66',  delay: '0.24s' },
              { label: 'Exploitable', value: exploitable,   color: '#ff6b6b',  delay: '0.32s' },
            ].map((c, i) => (
              <div key={i} className="stat-card" style={{ animationDelay: c.delay }}>
                <div className="stat-top" style={{ background: c.color }} />
                <div className="stat-label">{c.label}</div>
                <div className="stat-value" style={{ color: c.color }}>{c.value}</div>
              </div>
            ))}
          </div>

          {/* Toolbar */}
          <div className="toolbar">
            <input
              className="search-input"
              placeholder="Search by CVE, service, port, target..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
            {['all', 'critical', 'high', 'medium', 'low'].map(f => (
              <button
                key={f}
                className={`filter-pill f-${f} ${filter === f ? 'active' : ''}`}
                onClick={() => { setFilter(f); setPage(1); }}
              >
                {f} ({f === 'all' ? vulns.length : counts[f] || 0})
              </button>
            ))}
            <select className="sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="risk_score">Sort: Risk Score</option>
              <option value="cvss_score">Sort: CVSS</option>
              <option value="severity">Sort: Severity</option>
              <option value="cve_count">Sort: CVE Count</option>
            </select>
          </div>

          {/* Table */}
          <div className="panel">
            <div className="panel-title">
              Vulnerabilities ({filtered.length})
            </div>

            {loading ? (
              <div className="empty-state" style={{ display: 'flex', justifyContent: 'center' }}>
                <div className="spinner" />
              </div>
            ) : (
              <>
                <table className="vuln-table">
                  <thead>
                    <tr>
                      <th>Severity</th>
                      <th>Port / Service</th>
                      <th>Version</th>
                      <th>CVEs</th>
                      <th>CVSS</th>
                      <th>Risk</th>
                      <th>Target</th>
                      <th>Flags</th>
                      <th>Remediation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.length === 0 ? (
                      <tr><td colSpan={9} className="empty-state">No vulnerabilities match the current filter.</td></tr>
                    ) : paginated.map((v, i) => (
                      <tr key={v.id || i} onClick={() => setSelected(v)}>
                        <td><span className={`sev-badge ${sevClass(v.severity)}`}>{v.severity || 'unknown'}</span></td>
                        <td style={{ color: '#e3f2fd' }}>{v.port ? `${v.port}/${v.service || '?'}` : v.service || '—'}</td>
                        <td style={{ color: '#546e7a', fontSize: 11 }}>{v.version || '—'}</td>
                        <td>
                          {v.cve_ids
                            ? v.cve_ids.split(',').slice(0, 2).map((c, ci) => (
                                <span key={ci} className="cve-tag">{c.trim()}</span>
                              ))
                            : <span style={{ color: '#37474f' }}>—</span>
                          }
                          {v.cve_count > 2 && <span style={{ color: '#546e7a', fontSize: 10 }}> +{v.cve_count - 2}</span>}
                        </td>
                        <td style={{ color: v.cvss_score >= 9 ? '#ff4d4d' : v.cvss_score >= 7 ? '#ffa726' : '#90caf9', fontWeight: 600 }}>
                          {v.cvss_score ?? '—'}
                        </td>
                        <td style={{ color: '#00e5ff', fontWeight: 700 }}>{v.risk_score ?? '—'}</td>
                        <td style={{ color: '#64b5f6', fontSize: 11 }}>{v.target || `Scan #${v.scan_id}`}</td>
                        <td onClick={e => e.stopPropagation()}>
                          {v.exploit_available  && <span className="flag-tag flag-exploit">⚡EXPLOIT</span>}
                          {v.is_misconfigured   && <span className="flag-tag flag-misconfig">⚠MISCONFIG</span>}
                          {v.internet_exposed   && <span className="flag-tag flag-exposed">🌐EXPOSED</span>}
                        </td>
                        <td onClick={e => e.stopPropagation()}>
                          <select
                            className="remediation-select"
                            value={v.remediation_status || 'open'}
                            onChange={e => updateRemediation(v.id, e.target.value)}
                          >
                            <option value="open">Open</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="false_positive">False Positive</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="pagination">
                    <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                    <span className="page-info">Page {page} / {totalPages} · {filtered.length} results</span>
                    <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
                  </div>
                )}
              </>
            )}
          </div>

        </div>
      </div>

      {/* Detail drawer */}
      {selected && (
        <div className="detail-overlay" onClick={e => e.target === e.currentTarget && setSelected(null)}>
          <div className="detail-modal">
            <div className="detail-header">
              <div>
                <h3 className="detail-title">
                  {selected.port ? `Port ${selected.port} / ${selected.service}` : selected.service || 'Vulnerability'} · {selected.target}
                </h3>
                <p className="detail-meta">Scan #{selected.scan_id} · {selected.version || 'version unknown'}</p>
              </div>
              <button className="detail-close" onClick={() => setSelected(null)}>×</button>
            </div>

            {[
              { label: 'Severity',    value: <span className={`sev-badge ${sevClass(selected.severity)}`}>{selected.severity}</span> },
              { label: 'CVSS Score',  value: selected.cvss_score ?? '—' },
              { label: 'Risk Score',  value: selected.risk_score  ?? '—' },
              { label: 'CVE Count',   value: selected.cve_count   ?? 0 },
              { label: 'CVE IDs',     value: selected.cve_ids     || '—' },
              { label: 'Exploit Available', value: selected.exploit_available ? '⚡ YES' : 'No' },
              { label: 'Misconfigured',     value: selected.is_misconfigured  ? '⚠ YES' : 'No' },
              { label: 'Internet Exposed',  value: selected.internet_exposed  ? '🌐 YES' : 'No' },
              { label: 'Remediation Status', value: selected.remediation_status || 'open' },
            ].map((row, i) => (
              <div key={i} className="detail-row">
                <span className="detail-row-label">{row.label}</span>
                <span className="detail-row-value">{row.value}</span>
              </div>
            ))}

            <div className="detail-section">
              <div className="detail-section-title">Description</div>
              <div className="description-box">{selected.description || 'No description available.'}</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}