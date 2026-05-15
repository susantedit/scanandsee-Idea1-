import React from 'react';
import { useEffect, useState } from 'react';
import {
  Users,
  Activity,
  TrendingUp,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { getDashboard, getSystemHealth } from '../../services/adminApi';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const [dashData, healthData] = await Promise.all([
        getDashboard(),
        getSystemHealth(),
      ]);
      setDashboard(dashData.data);
      setHealth(healthData.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <button className="refresh-btn" onClick={fetchDashboard}>
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="error-banner">
          <AlertCircle size={18} />
          <p>{error}</p>
        </div>
      )}

      {/* KPI Cards */}
      <div className="kpi-grid">
        <KPICard
          title="Total Users"
          value={dashboard?.users?.total || 0}
          icon={Users}
          color="blue"
        />
        <KPICard
          title="Premium Users"
          value={dashboard?.users?.premium || 0}
          icon={TrendingUp}
          color="green"
          subtitle={`${dashboard?.users?.conversionRate || '0%'} conversion`}
        />
        <KPICard
          title="Active Users (7d)"
          value={dashboard?.users?.active || 0}
          icon={Activity}
          color="purple"
        />
        <KPICard
          title="Scans Today"
          value={dashboard?.scans?.today || 0}
          icon={TrendingUp}
          color="orange"
        />
      </div>

      {/* Charts */}
      <div className="dashboard-charts">
        {/* Scans Statistics */}
        <div className="chart-card">
          <h3>Scan Statistics</h3>
          <div className="stat-rows">
            <StatRow
              label="Total Scans"
              value={dashboard?.scans?.total || 0}
            />
            <StatRow label="This Week" value={dashboard?.scans?.week || 0} />
            <StatRow label="This Month" value={dashboard?.scans?.month || 0} />
            <StatRow
              label="Avg. Per Day"
              value={dashboard?.scans?.avgPerDay || '0.00'}
            />
          </div>
        </div>

        {/* API Usage */}
        <div className="chart-card">
          <h3>API Usage</h3>
          <div className="stat-rows">
            <StatRow
              label="Estimated Calls (Today)"
              value={dashboard?.api?.estimatedCallsToday || 0}
            />
            <StatRow
              label="Quota Status"
              value="15 RPM (Gemini Free)"
              color="warning"
            />
            <StatRow
              label="Rate Limit Issues"
              value="Monitor 429 errors"
              color="danger"
            />
          </div>
        </div>

        {/* System Health */}
        <div className="chart-card">
          <h3>System Health</h3>
          <div className="health-status">
            <HealthIndicator service="Firestore" status={health?.services?.firestore} />
            <HealthIndicator service="Firebase" status={health?.services?.firebase} />
            <HealthIndicator service="Gemini" status={health?.services?.gemini} />
            <HealthIndicator service="Stripe" status={health?.services?.stripe} />
          </div>
          <div className="health-metrics">
            <MetricRow label="Response Time" value={health?.metrics?.responseTime} />
            <MetricRow label="Error Rate" value={health?.metrics?.errorRate} />
            <MetricRow label="Memory Usage" value={health?.metrics?.memoryUsage} />
          </div>
        </div>
      </div>
    </div>
  );
};

// KPI Card Component
const KPICard = ({ title, value, icon: Icon, color, subtitle }) => (
  <div className={`kpi-card kpi-${color}`}>
    <div className="kpi-icon">
      <Icon size={24} />
    </div>
    <div className="kpi-content">
      <p className="kpi-title">{title}</p>
      <h3 className="kpi-value">{value}</h3>
      {subtitle && <p className="kpi-subtitle">{subtitle}</p>}
    </div>
  </div>
);

// Stat Row Component
const StatRow = ({ label, value, color = 'default' }) => (
  <div className={`stat-row stat-${color}`}>
    <span className="stat-label">{label}</span>
    <span className="stat-value">{value}</span>
  </div>
);

// Health Indicator Component
const HealthIndicator = ({ service, status }) => (
  <div className={`health-item status-${status?.toLowerCase()}`}>
    <div className="health-dot"></div>
    <span>{service}</span>
    <span className="health-status">{status}</span>
  </div>
);

// Metric Row Component
const MetricRow = ({ label, value }) => (
  <div className="metric-row">
    <span>{label}</span>
    <span className="metric-value">{value}</span>
  </div>
);

export default AdminDashboard;
