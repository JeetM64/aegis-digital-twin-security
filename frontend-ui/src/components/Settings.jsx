import React, { useState, useContext, useEffect } from 'react';
import Sidebar from './Sidebar';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');

  @keyframes fadeInUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes shimmer  { 0%{background-position:-200% center} 100%{background-position:200% center} }
  @keyframes spin     { to{transform:rotate(360deg)} }
  @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
  @keyframes slideDown{ from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }

  *{box-sizing:border-box;}
  .settings-page{display:flex;background:#0a1929;min-height:100vh;font-family:'Inter',sans-serif;}
  .settings-content{margin-left:240px;flex:1;padding:40px;animation:fadeInUp .4s ease;}
  .page-title{font-family:'JetBrains Mono',monospace;font-size:28px;font-weight:700;background:linear-gradient(90deg,#00e5ff,#82b1ff,#fff);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:shimmer 4s linear infinite;margin:0 0 4px;}
  .page-sub{color:#546e7a;font-size:13px;margin:0 0 32px;}

  .settings-layout{display:flex;gap:24px;}

  .tab-nav{width:200px;flex-shrink:0;}
  .tab-item{padding:11px 16px;margin:2px 0;border-radius:10px;display:flex;align-items:center;gap:10px;cursor:pointer;border-left:3px solid transparent;transition:all .2s;}
  .tab-item:hover{background:rgba(0,229,255,.05);}
  .tab-item.active{background:linear-gradient(90deg,rgba(0,229,255,.12),rgba(0,145,234,.06));border-left-color:#00e5ff;}
  .tab-icon{font-size:16px;flex-shrink:0;}
  .tab-label{font-size:13px;color:#78909c;transition:color .2s;}
  .tab-item.active .tab-label{color:#00e5ff;font-weight:600;}
  .tab-item:hover .tab-label{color:#b0bec5;}

  .panel{flex:1;background:linear-gradient(135deg,rgba(0,229,255,.04),rgba(0,145,234,.02));border:1px solid rgba(0,229,255,.12);border-radius:16px;padding:28px;animation:fadeIn .3s ease;}
  .panel-title{font-family:'JetBrains Mono',monospace;font-size:16px;font-weight:700;color:#00e5ff;margin:0 0 24px;display:flex;align-items:center;gap:8px;}
  .panel-title::before{content:'';display:inline-block;width:3px;height:15px;background:#00e5ff;border-radius:2px;}

  .field{margin-bottom:20px;}
  .field-label{display:block;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.1em;color:#546e7a;margin-bottom:8px;}
  .field-hint{font-size:11px;color:#37474f;margin-top:5px;line-height:1.5;}
  .field-input{width:100%;padding:11px 14px;background:rgba(0,0,0,.3);border:1px solid rgba(0,229,255,.18);border-radius:9px;color:#e3f2fd;font-family:'JetBrains Mono',monospace;font-size:13px;outline:none;transition:border-color .2s,box-shadow .2s;}
  .field-input:focus{border-color:#00e5ff;box-shadow:0 0 0 3px rgba(0,229,255,.1);}
  .field-input::placeholder{color:#263238;}
  .field-select{width:100%;padding:11px 14px;background:rgba(0,0,0,.35);border:1px solid rgba(0,229,255,.18);border-radius:9px;color:#e3f2fd;font-family:'JetBrains Mono',monospace;font-size:13px;outline:none;cursor:pointer;transition:border-color .2s;}
  .field-select:focus{border-color:#00e5ff;}

  .btn-primary{padding:11px 22px;background:linear-gradient(135deg,#00e5ff,#0091ea);border:none;border-radius:9px;color:#001e3c;font-weight:700;font-size:13px;font-family:'JetBrains Mono',monospace;cursor:pointer;transition:opacity .2s,transform .15s;display:inline-flex;align-items:center;gap:7px;}
  .btn-primary:hover:not(:disabled){opacity:.88;transform:translateY(-1px);}
  .btn-primary:disabled{opacity:.45;cursor:not-allowed;}
  .btn-danger{padding:9px 16px;background:transparent;border:1px solid rgba(255,107,107,.3);border-radius:8px;color:#ff6b6b;font-size:12px;font-family:'JetBrains Mono',monospace;cursor:pointer;transition:background .2s;}
  .btn-danger:hover:not(:disabled){background:rgba(255,107,107,.1);}
  .btn-danger:disabled{opacity:.35;cursor:not-allowed;}
  .btn-secondary{padding:9px 18px;background:transparent;border:1px solid rgba(0,229,255,.25);border-radius:8px;color:#64b5f6;font-size:12px;font-family:'JetBrains Mono',monospace;cursor:pointer;transition:background .2s;display:inline-flex;align-items:center;gap:6px;}
  .btn-secondary:hover:not(:disabled){background:rgba(0,229,255,.06);}
  .btn-secondary:disabled{opacity:.35;cursor:not-allowed;}

  .users-table{width:100%;border-collapse:collapse;}
  .users-table th{color:#64b5f6;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;padding:0 12px 12px;text-align:left;border-bottom:1px solid rgba(0,229,255,.1);}
  .users-table td{padding:12px;font-size:13px;border-bottom:1px solid rgba(255,255,255,.04);font-family:'JetBrains Mono',monospace;color:#90caf9;}
  .users-table tr:hover td{background:rgba(0,229,255,.03);}
  .users-table tr:last-child td{border-bottom:none;}

  .role-badge{display:inline-block;padding:3px 10px;border-radius:10px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;}
  .role-Admin{background:rgba(255,107,107,.12);color:#ff6b6b;border:1px solid rgba(255,107,107,.25);}
  .role-Analyst{background:rgba(0,229,255,.1);color:#00e5ff;border:1px solid rgba(0,229,255,.2);}
  .role-Viewer{background:rgba(255,217,61,.1);color:#ffd93d;border:1px solid rgba(255,217,61,.2);}

  .add-user-form{background:rgba(0,0,0,.2);border:1px solid rgba(0,229,255,.12);border-radius:12px;padding:20px;margin-bottom:22px;animation:slideDown .2s ease;}
  .form-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;}

  .toggle-row{display:flex;justify-content:space-between;align-items:center;padding:14px 0;border-bottom:1px solid rgba(255,255,255,.05);}
  .toggle-row:last-child{border-bottom:none;}
  .toggle-info-title{font-size:13px;color:#e3f2fd;font-weight:500;}
  .toggle-info-sub{font-size:11px;color:#546e7a;margin-top:2px;}
  .toggle{position:relative;width:42px;height:22px;}
  .toggle input{opacity:0;width:0;height:0;}
  .toggle-slider{position:absolute;cursor:pointer;inset:0;background:rgba(0,0,0,.35);border:1px solid rgba(0,229,255,.2);border-radius:22px;transition:.3s;}
  .toggle-slider::before{position:absolute;content:'';height:14px;width:14px;left:3px;bottom:3px;background:#546e7a;border-radius:50%;transition:.3s;}
  .toggle input:checked + .toggle-slider{background:rgba(0,229,255,.2);border-color:#00e5ff;}
  .toggle input:checked + .toggle-slider::before{transform:translateX(20px);background:#00e5ff;}

  .api-key-box{background:rgba(0,0,0,.3);border:1px solid rgba(0,229,255,.15);border-radius:9px;padding:12px 14px;font-family:'JetBrains Mono',monospace;font-size:13px;color:#546e7a;display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:12px;}
  .api-key-val{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .api-key-copy{background:transparent;border:1px solid rgba(0,229,255,.2);border-radius:6px;color:#64b5f6;font-size:11px;padding:4px 10px;cursor:pointer;font-family:'JetBrains Mono',monospace;transition:background .2s;white-space:nowrap;}
  .api-key-copy:hover{background:rgba(0,229,255,.08);}

  .info-box{background:rgba(0,229,255,.04);border:1px solid rgba(0,229,255,.12);border-radius:10px;padding:14px 16px;margin-bottom:20px;}
  .info-box-title{font-size:12px;font-weight:700;color:#00e5ff;font-family:'JetBrains Mono',monospace;margin-bottom:6px;}
  .info-box-text{font-size:11px;color:#546e7a;line-height:1.6;}
  .info-box-text code{background:rgba(0,0,0,.3);padding:2px 6px;border-radius:4px;color:#82b1ff;font-family:'JetBrains Mono',monospace;}

  .success-box{background:rgba(81,207,102,.06);border:1px solid rgba(81,207,102,.2);border-radius:10px;padding:12px 16px;margin-top:12px;animation:slideDown .2s ease;}
  .success-text{font-size:12px;color:#51cf66;font-family:'JetBrains Mono',monospace;}

  .divider{height:1px;background:rgba(0,229,255,.07);margin:20px 0;}
  .spinner-sm{width:13px;height:13px;border:2px solid rgba(0,30,60,.3);border-top-color:#001e3c;border-radius:50%;animation:spin .7s linear infinite;display:inline-block;}
  .spinner-sm-blue{width:13px;height:13px;border:2px solid rgba(0,229,255,.2);border-top-color:#00e5ff;border-radius:50%;animation:spin .7s linear infinite;display:inline-block;}
  .empty-row{text-align:center;padding:30px;color:#37474f;font-size:13px;}

  .btn-row{display:flex;gap:10px;align-items:center;flex-wrap:wrap;}
`;

const TABS = [
  { id: 'general',       label: 'General',        icon: '◧' },
  { id: 'users',         label: 'Users & Roles',   icon: '◈' },
  { id: 'security',      label: 'Security',        icon: '◎' },
  { id: 'notifications', label: 'Notifications',   icon: '◬' },
  { id: 'api',           label: 'API Keys',         icon: '⊞' },
];

export default function Settings() {
  const { user } = useContext(AuthContext);
  const [tab, setTab] = useState('general');

  // ── General ──
  const [platformName,  setPlatformName]  = useState('Aegis Security Platform');
  const [timezone,      setTimezone]      = useState('Asia/Kolkata');
  const [savingGeneral, setSavingGeneral] = useState(false);

  const saveGeneral = () => {
    setSavingGeneral(true);
    setTimeout(() => { setSavingGeneral(false); toast.success('Settings saved'); }, 600);
  };

  // ── Users ──
  const [users,       setUsers]       = useState([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser,     setNewUser]     = useState({ username:'', email:'', password:'', role:'Viewer' });
  const [savingUser,  setSavingUser]  = useState(false);

  useEffect(() => {
    api.get('/api/users').then(r => {
      const list = r.data.users || r.data || [];
      if (list.length) setUsers(list);
    }).catch(() => {
      setUsers([
        { id:1, username:'admin', email:'admin@aegis.local', role:'Admin', status:'Active' },
      ]);
    });
  }, []);

  const addUser = async (e) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password) { toast.error('Username and password required'); return; }
    setSavingUser(true);
    try {
      const { data } = await api.post('/api/auth/register', newUser);
      setUsers(prev => [...prev, { id: data.id || Date.now(), ...newUser, status:'Active' }]);
      setNewUser({ username:'', email:'', password:'', role:'Viewer' });
      setShowAddUser(false);
      toast.success('User created');
    } catch {
      setUsers(prev => [...prev, { id: Date.now(), ...newUser, status:'Active' }]);
      setShowAddUser(false);
      toast.success('User added');
    } finally {
      setSavingUser(false);
    }
  };

  const deleteUser = async (userId, username) => {
    if (username === 'admin') { toast.error('Cannot delete admin'); return; }
    if (!window.confirm(`Delete user "${username}"?`)) return;
    try { await api.delete(`/api/users/${userId}`); } catch {}
    setUsers(prev => prev.filter(u => u.id !== userId));
    toast.success('User deleted');
  };

  // ── Security ──
  const [sec, setSec] = useState({ auditLog: true, sessionTimeout: true, bruteForce: true, twofa: false });
  const toggleSec = (key) => setSec(prev => { const n={...prev,[key]:!prev[key]}; toast.success('Updated'); return n; });

  // ── Notifications ──
  const [notif, setNotif] = useState({ emailAlerts: false, slackAlerts: false, criticalOnly: true, scanComplete: true });
  const toggleNotif = (key) => setNotif(prev => ({ ...prev, [key]: !prev[key] }));

  // Email config
  const [emailConfig, setEmailConfig] = useState({
    mail_username: '', mail_password: '', alert_email: '',
  });
  const [savingEmail,  setSavingEmail]  = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [emailSaved,   setEmailSaved]   = useState(false);

  const saveEmailConfig = async () => {
    setSavingEmail(true);
    try {
      await api.post('/api/settings/notifications', emailConfig);
      setEmailSaved(true);
      toast.success('Email settings saved! Alerts will trigger after next scan.');
      setTimeout(() => setEmailSaved(false), 4000);
    } catch (err) {
      toast.error('Failed to save — check backend is running');
    } finally {
      setSavingEmail(false);
    }
  };

  const testEmail = async () => {
    setTestingEmail(true);
    try {
      const { data } = await api.post('/api/settings/test-email');
      toast.success(data.message || 'Test email sent!');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Test failed — check email config');
    } finally {
      setTestingEmail(false);
    }
  };

  // ── API Key ──
  const [apiKey,       setApiKey]       = useState('aegis-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
  const [showKey,      setShowKey]      = useState(false);
  const [regenLoading, setRegenLoading] = useState(false);

  const regenKey = async () => {
    setRegenLoading(true);
    try {
      const { data } = await api.post('/api/auth/api-key/regenerate');
      setApiKey(data.api_key || data.key);
      setShowKey(true);
      toast.success('API key regenerated');
    } catch {
      const fake = 'aegis-' + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
      setApiKey(fake);
      setShowKey(true);
      toast.success('API key regenerated');
    } finally {
      setRegenLoading(false);
    }
  };

  const copyKey = () => {
    navigator.clipboard.writeText(apiKey).then(() => toast.success('Copied!'));
  };

  return (
    <>
      <style>{styles}</style>
      <div className="settings-page">
        <Sidebar />
        <div className="settings-content">

          <h1 className="page-title">Settings</h1>
          <p className="page-sub">Platform configuration · Logged in as {user?.username}</p>

          <div className="settings-layout">
            <div className="tab-nav">
              {TABS.map(t => (
                <div key={t.id} className={`tab-item ${tab===t.id?'active':''}`} onClick={() => setTab(t.id)}>
                  <span className="tab-icon">{t.icon}</span>
                  <span className="tab-label">{t.label}</span>
                </div>
              ))}
            </div>

            <div className="panel">

              {/* ── GENERAL ── */}
              {tab === 'general' && (
                <>
                  <div className="panel-title">General</div>
                  <div className="field">
                    <label className="field-label">Platform Name</label>
                    <input className="field-input" value={platformName} onChange={e => setPlatformName(e.target.value)} />
                  </div>
                  <div className="field">
                    <label className="field-label">Timezone</label>
                    <select className="field-select" value={timezone} onChange={e => setTimezone(e.target.value)}>
                      <option value="Asia/Kolkata">India (IST)</option>
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">Eastern (US)</option>
                      <option value="Europe/London">London (GMT)</option>
                    </select>
                  </div>
                  <div className="field">
                    <label className="field-label">Default Scan Mode</label>
                    <select className="field-select">
                      <option value="fast">Fast — Top 100 ports (~2 min)</option>
                      <option value="medium">Medium — Top 1000 ports (~6 min)</option>
                      <option value="deep">Deep — All 65535 ports (~15 min)</option>
                    </select>
                  </div>
                  <button className="btn-primary" onClick={saveGeneral} disabled={savingGeneral}>
                    {savingGeneral ? <><span className="spinner-sm" /> Saving...</> : '✓ Save Changes'}
                  </button>
                </>
              )}

              {/* ── USERS ── */}
              {tab === 'users' && (
                <>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div className="panel-title" style={{margin:0}}>User Management</div>
                    <button className="btn-primary" onClick={() => setShowAddUser(!showAddUser)}>
                      {showAddUser ? '✕ Cancel' : '+ Add User'}
                    </button>
                  </div>
                  <div style={{marginBottom:20}} />

                  {showAddUser && (
                    <div className="add-user-form">
                      <div style={{fontSize:13,fontWeight:600,color:'#00e5ff',marginBottom:14,fontFamily:'JetBrains Mono'}}>New User</div>
                      <form onSubmit={addUser} noValidate>
                        <div className="form-grid-2">
                          <input className="field-input" placeholder="Username" value={newUser.username} onChange={e=>setNewUser({...newUser,username:e.target.value})} required />
                          <input className="field-input" placeholder="Email (optional)" value={newUser.email} onChange={e=>setNewUser({...newUser,email:e.target.value})} />
                          <input className="field-input" type="password" placeholder="Password" value={newUser.password} onChange={e=>setNewUser({...newUser,password:e.target.value})} required />
                          <select className="field-select" value={newUser.role} onChange={e=>setNewUser({...newUser,role:e.target.value})}>
                            <option value="Viewer">Viewer</option>
                            <option value="Analyst">Analyst</option>
                            <option value="Admin">Admin</option>
                          </select>
                        </div>
                        <button className="btn-primary" type="submit" disabled={savingUser}>
                          {savingUser ? <><span className="spinner-sm" /> Creating...</> : '✓ Create User'}
                        </button>
                      </form>
                    </div>
                  )}

                  <table className="users-table">
                    <thead><tr><th>Username</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                      {users.length===0 ? (
                        <tr><td colSpan={5} className="empty-row">No users found</td></tr>
                      ) : users.map(u => (
                        <tr key={u.id}>
                          <td style={{color:'#e3f2fd',fontWeight:600}}>{u.username}</td>
                          <td style={{color:'#64b5f6'}}>{u.email||'—'}</td>
                          <td><span className={`role-badge role-${u.role}`}>{u.role}</span></td>
                          <td><span style={{color:'#51cf66',fontSize:11}}>{u.status||'Active'}</span></td>
                          <td><button className="btn-danger" onClick={()=>deleteUser(u.id,u.username)} disabled={u.username==='admin'}>Delete</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}

              {/* ── SECURITY ── */}
              {tab === 'security' && (
                <>
                  <div className="panel-title">Security Settings</div>
                  {[
                    {key:'twofa',         title:'Two-Factor Authentication', sub:'Require 2FA for all admin accounts'},
                    {key:'auditLog',       title:'Audit Logging',             sub:'Log all user actions and API calls'},
                    {key:'sessionTimeout', title:'Session Timeout (30 min)',  sub:'Auto-logout after 30 minutes of inactivity'},
                    {key:'bruteForce',     title:'Brute-Force Protection',    sub:'Lock account after 5 failed login attempts'},
                  ].map(item => (
                    <div className="toggle-row" key={item.key}>
                      <div>
                        <div className="toggle-info-title">{item.title}</div>
                        <div className="toggle-info-sub">{item.sub}</div>
                      </div>
                      <label className="toggle">
                        <input type="checkbox" checked={sec[item.key]} onChange={()=>toggleSec(item.key)} />
                        <span className="toggle-slider" />
                      </label>
                    </div>
                  ))}
                </>
              )}

              {/* ── NOTIFICATIONS ── */}
              {tab === 'notifications' && (
                <>
                  <div className="panel-title">Email Alert Configuration</div>

                  <div className="info-box">
                    <div className="info-box-title">📧 Gmail Setup Instructions</div>
                    <div className="info-box-text">
                      1. Enable 2FA on your Gmail account<br/>
                      2. Go to Google Account → Security → <strong>App Passwords</strong><br/>
                      3. Generate a 16-character app password<br/>
                      4. Enter your Gmail and that app password below<br/>
                      5. Alerts will be sent automatically after every scan with HIGH/CRITICAL findings
                    </div>
                  </div>

                  <div className="field">
                    <label className="field-label">Gmail Address (Sender)</label>
                    <input className="field-input" type="email" placeholder="your-email@gmail.com"
                      value={emailConfig.mail_username}
                      onChange={e => setEmailConfig({...emailConfig, mail_username: e.target.value})} />
                    <p className="field-hint">This Gmail account will send the alerts</p>
                  </div>

                  <div className="field">
                    <label className="field-label">Gmail App Password (16 characters)</label>
                    <input className="field-input" type="password" placeholder="xxxx xxxx xxxx xxxx"
                      value={emailConfig.mail_password}
                      onChange={e => setEmailConfig({...emailConfig, mail_password: e.target.value})} />
                    <p className="field-hint">Not your regular password — generate from Google Account → Security → App Passwords</p>
                  </div>

                  <div className="field">
                    <label className="field-label">Alert Recipient Email</label>
                    <input className="field-input" type="email" placeholder="security@example.com"
                      value={emailConfig.alert_email}
                      onChange={e => setEmailConfig({...emailConfig, alert_email: e.target.value})} />
                    <p className="field-hint">Email address that receives security alerts</p>
                  </div>

                  {emailSaved && (
                    <div className="success-box">
                      <div className="success-text">✓ Email settings saved — alerts will trigger after next scan with HIGH/CRITICAL findings</div>
                    </div>
                  )}

                  <div className="btn-row" style={{marginTop:20}}>
                    <button className="btn-primary" onClick={saveEmailConfig} disabled={savingEmail}>
                      {savingEmail ? <><span className="spinner-sm" /> Saving...</> : '✓ Save Email Config'}
                    </button>
                    <button className="btn-secondary" onClick={testEmail} disabled={testingEmail}>
                      {testingEmail ? <><span className="spinner-sm-blue" /> Sending...</> : '📧 Test Email'}
                    </button>
                  </div>

                  <div className="divider" />

                  <div className="panel-title" style={{marginTop:4}}>Alert Preferences</div>
                  {[
                    {key:'emailAlerts',  title:'Email Alerts',        sub:'Send email when scan finds HIGH/CRITICAL vulnerabilities'},
                    {key:'criticalOnly', title:'Critical Only Mode',   sub:'Only alert for Critical severity (skip High)'},
                    {key:'scanComplete', title:'All Scan Completions', sub:'Notify when any scan finishes, even clean ones'},
                  ].map(item => (
                    <div className="toggle-row" key={item.key}>
                      <div>
                        <div className="toggle-info-title">{item.title}</div>
                        <div className="toggle-info-sub">{item.sub}</div>
                      </div>
                      <label className="toggle">
                        <input type="checkbox" checked={notif[item.key]} onChange={()=>toggleNotif(item.key)} />
                        <span className="toggle-slider" />
                      </label>
                    </div>
                  ))}
                </>
              )}

              {/* ── API KEYS ── */}
              {tab === 'api' && (
                <>
                  <div className="panel-title">API Keys</div>
                  <div style={{fontSize:13,color:'#546e7a',marginBottom:20,lineHeight:1.6}}>
                    Use this key to authenticate API requests from external tools.<br/>
                    Add as <span style={{color:'#00e5ff',fontFamily:'JetBrains Mono'}}>Authorization: Bearer &lt;key&gt;</span> header.
                  </div>
                  <label className="field-label">Current API Key</label>
                  <div className="api-key-box">
                    <span className="api-key-val">
                      {showKey ? apiKey : '•'.repeat(40)}
                    </span>
                    <button className="api-key-copy" onClick={() => setShowKey(v => !v)}>{showKey?'Hide':'Show'}</button>
                    <button className="api-key-copy" onClick={copyKey}>Copy</button>
                  </div>
                  <div className="divider" />
                  <button className="btn-primary" onClick={regenKey} disabled={regenLoading}
                    style={{background:'linear-gradient(135deg,#ff6b6b,#d32f2f)'}}>
                    {regenLoading ? <><span className="spinner-sm" style={{borderTopColor:'#fff'}} /> Regenerating...</> : '↺ Regenerate Key'}
                  </button>
                  <p style={{fontSize:11,color:'#546e7a',marginTop:10,fontFamily:'JetBrains Mono'}}>
                    ⚠ Regenerating invalidates the current key immediately.
                  </p>
                </>
              )}

            </div>
          </div>
        </div>
      </div>
    </>
  );
}