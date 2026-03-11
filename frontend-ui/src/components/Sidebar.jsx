import React, { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');

  @keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(0.8); }
  }
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-10px); }
    to { opacity: 1; transform: translateX(0); }
  }

  .sidebar {
    width: 240px;
    background: linear-gradient(180deg, #060f1a 0%, #0a1929 60%, #001429 100%);
    height: 100vh;
    position: fixed;
    left: 0; top: 0;
    border-right: 1px solid rgba(0,229,255,0.12);
    display: flex;
    flex-direction: column;
    z-index: 1000;
    font-family: 'Inter', sans-serif;
  }

  .sidebar-logo {
    padding: 24px 20px;
    border-bottom: 1px solid rgba(0,229,255,0.1);
    display: flex;
    align-items: center;
    gap: 14px;
    animation: slideIn 0.4s ease;
  }
  .logo-icon {
    width: 42px; height: 42px;
    background: linear-gradient(135deg, #00e5ff, #0091ea);
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 22px;
    box-shadow: 0 4px 20px rgba(0,229,255,0.3);
    flex-shrink: 0;
  }
  .logo-name {
    font-family: 'JetBrains Mono', monospace;
    font-size: 19px;
    font-weight: 700;
    background: linear-gradient(90deg, #00e5ff, #fff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin: 0;
  }
  .logo-sub {
    font-size: 10px;
    color: #546e7a;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin: 2px 0 0;
  }

  .sidebar-status {
    margin: 12px 16px;
    padding: 8px 12px;
    background: rgba(81,207,102,0.06);
    border: 1px solid rgba(81,207,102,0.15);
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: #51cf66;
  }
  .status-dot {
    width: 6px; height: 6px;
    background: #51cf66;
    border-radius: 50%;
    animation: pulse-dot 2s infinite;
    flex-shrink: 0;
  }

  .sidebar-section-label {
    padding: 16px 20px 6px;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(100,181,246,0.4);
  }

  .sidebar-nav { flex: 1; padding: 8px 0; overflow-y: auto; }
  .sidebar-nav::-webkit-scrollbar { width: 3px; }
  .sidebar-nav::-webkit-scrollbar-thumb { background: rgba(0,229,255,0.2); border-radius: 2px; }

  .nav-item {
    padding: 11px 20px;
    margin: 2px 10px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    border-left: 3px solid transparent;
    transition: all 0.2s ease;
    position: relative;
    animation: slideIn 0.4s ease backwards;
  }
  .nav-item:hover {
    background: rgba(0,229,255,0.06);
    border-left-color: rgba(0,229,255,0.3);
  }
  .nav-item.active {
    background: linear-gradient(90deg, rgba(0,229,255,0.12), rgba(0,145,234,0.06));
    border-left-color: #00e5ff;
  }
  .nav-icon { font-size: 17px; flex-shrink: 0; }
  .nav-label {
    font-size: 13.5px;
    color: #78909c;
    font-weight: 400;
    transition: color 0.2s;
  }
  .nav-item.active .nav-label { color: #00e5ff; font-weight: 600; }
  .nav-item:hover .nav-label { color: #b0bec5; }

  .nav-badge {
    margin-left: auto;
    background: rgba(255,107,107,0.2);
    border: 1px solid rgba(255,107,107,0.3);
    color: #ff6b6b;
    font-size: 10px;
    font-weight: 700;
    font-family: 'JetBrains Mono', monospace;
    padding: 2px 7px;
    border-radius: 10px;
  }

  .sidebar-footer {
    padding: 16px;
    border-top: 1px solid rgba(0,229,255,0.1);
  }
  .user-card {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 10px;
    background: rgba(0,229,255,0.04);
    border: 1px solid rgba(0,229,255,0.08);
    cursor: pointer;
    transition: background 0.2s;
  }
  .user-card:hover { background: rgba(0,229,255,0.08); }
  .user-avatar {
    width: 34px; height: 34px;
    border-radius: 50%;
    background: linear-gradient(135deg, #00e5ff, #0091ea);
    display: flex; align-items: center; justify-content: center;
    font-size: 13px;
    font-weight: 700;
    color: #001e3c;
    font-family: 'JetBrains Mono', monospace;
    flex-shrink: 0;
  }
  .user-name { font-size: 13px; font-weight: 600; color: #e3f2fd; margin: 0; }
  .user-role { font-size: 11px; color: #546e7a; margin: 1px 0 0; }
  .logout-btn {
    margin-left: auto;
    background: none;
    border: none;
    color: #546e7a;
    cursor: pointer;
    font-size: 16px;
    padding: 4px;
    border-radius: 4px;
    transition: color 0.2s;
  }
  .logout-btn:hover { color: #ff6b6b; }
`;

const menuItems = [
  { icon: '⬡', label: 'Dashboard',       path: '/dashboard',       section: 'OVERVIEW' },
  { icon: '◈', label: 'Asset Inventory', path: '/assets',          section: 'MONITOR' },
  { icon: '◎', label: 'Scan Management', path: '/scans',           section: 'MONITOR' },
  { icon: '◬', label: 'Vulnerabilities', path: '/vulnerabilities', section: 'MONITOR' },
  { icon: '⊞', label: 'Reports Hub',     path: '/reports',         section: 'INTEL' },
  { icon: '◧', label: 'Settings',        path: '/settings',        section: 'INTEL' },
];

export default function Sidebar() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, logout } = useContext(AuthContext);

  const isActive = (path) => location.pathname === path;

  // Group items by section
  const sections = [...new Set(menuItems.map(i => i.section))];

  const initials = (user?.username || 'AD')
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <style>{styles}</style>
      <div className="sidebar">

        {/* Logo */}
        <div className="sidebar-logo">
          <div className="logo-icon">🛡️</div>
          <div>
            <p className="logo-name">Aegis</p>
            <p className="logo-sub">Digital Twin Security</p>
          </div>
        </div>

        {/* System status */}
        <div className="sidebar-status">
          <span className="status-dot" />
          ALL SYSTEMS OPERATIONAL
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {sections.map((section, si) => (
            <div key={section}>
              <div className="sidebar-section-label">{section}</div>
              {menuItems
                .filter(item => item.section === section)
                .map((item, idx) => (
                  <div
                    key={item.path}
                    className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                    style={{ animationDelay: `${(si * 3 + idx) * 0.05}s` }}
                    onClick={() => navigate(item.path)}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                  </div>
                ))}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p className="user-name">{user?.username || 'Admin'}</p>
              <p className="user-role">{user?.role || 'Administrator'}</p>
            </div>
            <button
              className="logout-btn"
              title="Logout"
              onClick={logout}
            >⏻</button>
          </div>
        </div>

      </div>
    </>
  );
}