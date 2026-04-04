import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data } = await api.get('/user/dashboard');
        setData(data);
        if (data.user.passwordExpired) navigate('/change-password');
      } catch { navigate('/login'); }
      finally { setLoading(false); }
    };
    fetchDashboard();
  }, [navigate]);

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) return <div className="auth-page"><div className="auth-card"><h2>Loading...</h2></div></div>;
  if (!data) return null;

  const actionBadge = (action) => {
    const map = {
      login_success: { cls: 'badge-success', text: 'Login' },
      login_failed: { cls: 'badge-danger', text: 'Failed Login' },
      logout: { cls: 'badge-info', text: 'Logout' },
      password_change: { cls: 'badge-warning', text: 'Password Changed' },
      password_reset: { cls: 'badge-warning', text: 'Password Reset' },
      password_reset_request: { cls: 'badge-info', text: 'Reset Requested' },
      account_locked: { cls: 'badge-danger', text: 'Locked' },
      otp_verified: { cls: 'badge-success', text: 'OTP Verified' }
    };
    const b = map[action] || { cls: 'badge-info', text: action };
    return <span className={`badge ${b.cls}`}>{b.text}</span>;
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>🛡️ Security Dashboard</h1>
          <p style={{ color: '#8888aa', fontSize: 14, marginTop: 4 }}>Welcome, {data.user.username}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/change-password"><button className="btn-secondary" style={{ width: 'auto', padding: '8px 16px' }}>Change Password</button></Link>
          <button className="btn-secondary" style={{ width: 'auto', padding: '8px 16px', borderColor: '#ef4444', color: '#ef4444' }} onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Logins</div>
          <div className="stat-value">{data.stats.totalLogins}</div>
        </div>
        <div className={`stat-card ${data.failedAttemptsLast7Days > 3 ? 'danger' : data.failedAttemptsLast7Days > 0 ? 'warning' : ''}`}>
          <div className="stat-label">Failed Attempts (7 days)</div>
          <div className="stat-value">{data.failedAttemptsLast7Days}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Last Password Change</div>
          <div className="stat-value" style={{ fontSize: 16 }}>{new Date(data.user.lastPasswordChange).toLocaleDateString()}</div>
        </div>
        <div className={`stat-card ${data.user.passwordExpired ? 'danger' : ''}`}>
          <div className="stat-label">Password Expires</div>
          <div className="stat-value" style={{ fontSize: 16 }}>{new Date(data.user.passwordExpiresAt).toLocaleDateString()}</div>
        </div>
      </div>

      {data.suspiciousActivity.length > 0 && (
        <div className="section-card" style={{ borderColor: 'rgba(239,68,68,0.3)' }}>
          <h3>⚠️ Suspicious Activity</h3>
          <table className="activity-table">
            <thead><tr><th>Action</th><th>IP</th><th>Details</th><th>Time</th></tr></thead>
            <tbody>
              {data.suspiciousActivity.map((a, i) => (
                <tr key={i} className="suspicious">
                  <td>{actionBadge(a.action)}</td>
                  <td>{a.ipAddress}</td>
                  <td>{a.details}</td>
                  <td>{new Date(a.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="section-card">
        <h3>📋 Recent Activity</h3>
        <table className="activity-table">
          <thead><tr><th>Action</th><th>IP Address</th><th>Browser</th><th>OS</th><th>Device</th><th>Time</th></tr></thead>
          <tbody>
            {data.recentActivity.map((a, i) => (
              <tr key={i} className={a.isSuspicious ? 'suspicious' : ''}>
                <td>{actionBadge(a.action)}</td>
                <td>{a.ipAddress}</td>
                <td>{a.browser || '-'}</td>
                <td>{a.os || '-'}</td>
                <td>{a.device || 'desktop'}</td>
                <td>{new Date(a.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
