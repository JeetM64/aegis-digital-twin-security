import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-8px); }
  }
  @keyframes pulse-ring {
    0%   { box-shadow: 0 0 0 0   rgba(0,229,255,0.35); }
    70%  { box-shadow: 0 0 0 16px rgba(0,229,255,0); }
    100% { box-shadow: 0 0 0 0   rgba(0,229,255,0); }
  }
  @keyframes grid-move {
    from { background-position: 0 0; }
    to   { background-position: 40px 40px; }
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  * { box-sizing: border-box; }

  .login-page {
    min-height: 100vh;
    background: #060f1a;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Inter', sans-serif;
    position: relative;
    overflow: hidden;
  }

  /* Animated grid background */
  .login-grid {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(0,229,255,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,229,255,0.04) 1px, transparent 1px);
    background-size: 40px 40px;
    animation: grid-move 8s linear infinite;
    pointer-events: none;
  }
  /* Glow blobs */
  .login-blob-1 {
    position: absolute;
    width: 500px; height: 500px;
    background: radial-gradient(circle, rgba(0,229,255,0.08) 0%, transparent 70%);
    top: -100px; left: -100px;
    pointer-events: none;
  }
  .login-blob-2 {
    position: absolute;
    width: 400px; height: 400px;
    background: radial-gradient(circle, rgba(0,145,234,0.07) 0%, transparent 70%);
    bottom: -80px; right: -80px;
    pointer-events: none;
  }

  .login-card {
    position: relative;
    width: 420px;
    background: linear-gradient(145deg, rgba(13,31,48,0.95), rgba(10,25,41,0.98));
    border: 1px solid rgba(0,229,255,0.18);
    border-radius: 20px;
    padding: 44px 40px;
    box-shadow: 0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,229,255,0.05);
    animation: fadeIn 0.5s ease;
    backdrop-filter: blur(20px);
  }

  .login-logo-wrap {
    text-align: center;
    margin-bottom: 36px;
  }
  .login-logo {
    width: 68px; height: 68px;
    background: linear-gradient(135deg, #00e5ff, #0091ea);
    border-radius: 16px;
    display: inline-flex;
    align-items: center; justify-content: center;
    font-size: 32px;
    box-shadow: 0 8px 32px rgba(0,229,255,0.35);
    margin-bottom: 18px;
    animation: float 4s ease-in-out infinite, pulse-ring 3s infinite;
  }
  .login-brand {
    font-family: 'JetBrains Mono', monospace;
    font-size: 26px;
    font-weight: 700;
    background: linear-gradient(90deg, #00e5ff, #82b1ff, #fff);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: shimmer 4s linear infinite;
    margin: 0 0 4px;
  }
  .login-brand-sub {
    font-size: 12px;
    color: #37474f;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    font-family: 'JetBrains Mono', monospace;
  }

  .login-heading {
    font-size: 15px;
    font-weight: 600;
    color: #64b5f6;
    text-align: center;
    margin: 0 0 28px;
    letter-spacing: 0.04em;
  }

  .login-field { margin-bottom: 18px; }
  .login-label {
    display: block;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #546e7a;
    margin-bottom: 8px;
  }
  .login-input {
    width: 100%;
    padding: 13px 16px;
    background: rgba(0,0,0,0.3);
    border: 1px solid rgba(0,229,255,0.15);
    border-radius: 10px;
    color: #e3f2fd;
    font-family: 'JetBrains Mono', monospace;
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .login-input:focus {
    border-color: #00e5ff;
    box-shadow: 0 0 0 3px rgba(0,229,255,0.1);
  }
  .login-input::placeholder { color: #263238; }

  .login-btn {
    width: 100%;
    padding: 14px;
    background: linear-gradient(135deg, #00e5ff, #0091ea);
    border: none;
    border-radius: 10px;
    color: #001e3c;
    font-weight: 700;
    font-size: 14px;
    font-family: 'JetBrains Mono', monospace;
    letter-spacing: 0.06em;
    cursor: pointer;
    margin-top: 8px;
    transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .login-btn:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0,229,255,0.3);
  }
  .login-btn:disabled { opacity: 0.6; cursor: not-allowed; }

  .login-spinner {
    width: 16px; height: 16px;
    border: 2px solid rgba(0,30,60,0.3);
    border-top-color: #001e3c;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  .login-error {
    margin-top: 16px;
    padding: 11px 14px;
    background: rgba(255,107,107,0.08);
    border: 1px solid rgba(255,107,107,0.25);
    border-radius: 8px;
    color: #ff6b6b;
    font-size: 13px;
    text-align: center;
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }

  .login-footer {
    margin-top: 24px;
    text-align: center;
    font-size: 12px;
    color: #263238;
    font-family: 'JetBrains Mono', monospace;
  }
  .login-footer span { color: #37474f; }

  .login-divider {
    height: 1px;
    background: rgba(0,229,255,0.07);
    margin: 24px 0 20px;
  }

  .login-features {
    display: flex;
    justify-content: center;
    gap: 20px;
    margin-top: 20px;
  }
  .login-feature {
    display: flex; align-items: center; gap: 5px;
    font-size: 11px; color: #37474f;
    font-family: 'JetBrains Mono', monospace;
  }
  .login-feature-dot {
    width: 5px; height: 5px;
    border-radius: 50%;
    background: #00e5ff;
    opacity: 0.4;
  }
`;

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const { login }  = useContext(AuthContext);
  const navigate   = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Username and password are required');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(username.trim(), password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.msg || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="login-page">
        <div className="login-grid" />
        <div className="login-blob-1" />
        <div className="login-blob-2" />

        <div className="login-card">

          {/* Logo */}
          <div className="login-logo-wrap">
            <div className="login-logo">🛡️</div>
            <p className="login-brand">Aegis</p>
            <p className="login-brand-sub">Digital Twin Security Platform</p>
          </div>

          <p className="login-heading">Sign in to your account</p>

          <form onSubmit={handleSubmit} noValidate>
            <div className="login-field">
              <label className="login-label">Username</label>
              <input
                className="login-input"
                type="text"
                placeholder="admin"
                value={username}
                onChange={e => setUsername(e.target.value)}
                disabled={loading}
                autoComplete="username"
                autoFocus
              />
            </div>

            <div className="login-field">
              <label className="login-label">Password</label>
              <input
                className="login-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            <button
              className="login-btn"
              type="submit"
              disabled={loading}
            >
              {loading
                ? <><div className="login-spinner" /> AUTHENTICATING...</>
                : '→ SIGN IN'
              }
            </button>
          </form>

          {error && (
            <div className="login-error">
              <span>⚠</span> {error}
            </div>
          )}

          <div className="login-divider" />

          <div className="login-features">
            <div className="login-feature"><span className="login-feature-dot" />AI Scanning</div>
            <div className="login-feature"><span className="login-feature-dot" />CVE Lookup</div>
            <div className="login-feature"><span className="login-feature-dot" />ML Risk Score</div>
          </div>

          <p className="login-footer" style={{ marginTop: 20 }}>
            <span>Aegis v1.0 · Secure Access Only</span>
          </p>

        </div>
      </div>
    </>
  );
}