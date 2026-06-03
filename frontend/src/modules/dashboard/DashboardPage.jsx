import { useState, useEffect } from 'react';
import api from '../../lib/api';
import {
  Package,
  FileText,
  Zap,
  ClipboardCheck,
  AlertTriangle,
  TrendingUp,
  Eye,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

function StatCard({ icon: Icon, label, value, color, to }) {
  const bgColor = color === 'gold' ? 'var(--gold-500)' :
                  color === 'green' ? 'var(--status-green)' :
                  color === 'blue' ? 'var(--status-blue)' :
                  'var(--rust-600)';

  const content = (
    <div className="bg-white rounded-lg p-6 shadow-sm border hover:shadow-md transition-all" style={{ borderLeftColor: bgColor, borderLeftWidth: '4px', borderColor: '#f0f0f0' }}>
      <div className="flex items-start justify-between mb-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg" style={{ backgroundColor: bgColor + '20', color: bgColor }}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <p className="text-3xl font-bold mb-1" style={{ color: 'var(--navy-900)' }}>{value ?? '—'}</p>
      <p className="text-sm" style={{ color: 'var(--rust-600)' }}>{label}</p>
    </div>
  );
  return to ? <Link to={to}>{content}</Link> : content;
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/findit-dashboard/stats'),
      api.get('/findit-dashboard/recent-activity'),
    ])
      .then(([s, a]) => {
        setStats(s.data);
        setActivity(a.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--cream-100)' }}>
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p style={{ color: 'var(--rust-600)' }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const totalReports = (stats?.Active_Reports || 0) + (stats?.Closed_Reports || 0);
  const recoveryRate = stats?.Recovery_Rate_Percent ?? 0;

  // Chart data
  const itemStatusData = [
    { name: 'Unclaimed', value: stats?.Unclaimed_Items || 0 },
    { name: 'Matched', value: stats?.Matched_Items || 0 },
    { name: 'Claimed', value: stats?.Claimed_Items || 0 },
  ];

  const reportStatusData = [
    { name: 'Active', value: stats?.Active_Reports || 0 },
    { name: 'Closed', value: stats?.Closed_Reports || 0 },
  ];

  const CHART_COLORS = ['#D4A24E', '#2F9E58', '#C2741F', '#3B5FD9'];

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--cream-100)' }}>
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40" style={{ borderColor: 'var(--gold-300)' }}>
        <div className="p-6 max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-1" style={{ color: 'var(--brown-900)' }}>Dashboard</h1>
          <p style={{ color: 'var(--rust-600)' }}>FindIT — Office of Student Affairs Operations Overview</p>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto space-y-8">
        {/* Recovery Rate Banner */}
        {stats?.Recovery_Rate_Percent !== null && (
          <div className="rounded-xl p-8 text-white shadow-lg" style={{ backgroundColor: 'var(--navy-900)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold mb-1" style={{ color: 'var(--gold-300)' }}>RECOVERY RATE</p>
                <p className="text-6xl font-bold mb-2 text-white">{recoveryRate}%</p>
                <p className="text-sm opacity-90 text-white">{stats?.Closed_Reports} of {totalReports} reports closed</p>
              </div>
              <div className="hidden sm:block opacity-20">
                <TrendingUp className="w-24 h-24" />
              </div>
            </div>
          </div>
        )}

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Package} label="Unclaimed Items" value={stats?.Unclaimed_Items} color="gold" to="/found-items?status=Unclaimed" />
          <StatCard icon={Zap} label="Pending Matches" value={stats?.Pending_Matches} color="green" to="/matching?status=Pending" />
          <StatCard icon={ClipboardCheck} label="Pending Claims" value={stats?.Pending_Claims} color="blue" to="/claims?status=Pending" />
          <StatCard icon={AlertTriangle} label="Expired Items" value={stats?.Expired_Items} color="rust" to="/storage" />
          <StatCard icon={Package} label="Matched Items" value={stats?.Matched_Items} color="green" to="/found-items?status=Matched" />
          <StatCard icon={CheckCircle} label="Claimed Items" value={stats?.Claimed_Items} color="gold" to="/found-items?status=Claimed" />
          <StatCard icon={FileText} label="Active Reports" value={stats?.Active_Reports} color="blue" to="/lost-reports?status=Active" />
          <StatCard icon={FileText} label="Closed Reports" value={stats?.Closed_Reports} color="rust" to="/lost-reports?status=Closed" />
        </div>

        {/* Charts Section */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Items Status Chart */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold mb-6" style={{ color: 'var(--brown-900)' }}>Items Status Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={itemStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {itemStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Reports Status Chart */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold mb-6" style={{ color: 'var(--brown-900)' }}>Reports Status Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={reportStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {reportStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activity Feeds */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Recent Found Items */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold" style={{ color: 'var(--brown-900)' }}>Recent Found Items</h3>
              <Link to="/found-items" className="text-sm font-semibold hover:opacity-80 transition-all" style={{ color: 'var(--rust-600)' }}>View all →</Link>
            </div>
            <div className="space-y-3">
              {activity?.recent_items && activity.recent_items.length > 0 ? (
                activity.recent_items.slice(0, 5).map((item) => (
                  <Link key={item.Item_ID} to={`/found-items/${item.Item_ID}`} className="block p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100">
                    <p className="font-semibold text-sm" style={{ color: 'var(--navy-900)' }}>{item.Item_Name}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--rust-600)' }}>{item.Category_Name}</p>
                  </Link>
                ))
              ) : (
                <div className="text-center py-8">
                  <Package className="w-10 h-10 mx-auto mb-2" style={{ color: 'var(--gold-300)' }} />
                  <p className="text-sm" style={{ color: 'var(--rust-600)' }}>No items yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Lost Reports */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold" style={{ color: 'var(--brown-900)' }}>Recent Lost Reports</h3>
              <Link to="/lost-reports" className="text-sm font-semibold hover:opacity-80 transition-all" style={{ color: 'var(--rust-600)' }}>View all →</Link>
            </div>
            <div className="space-y-3">
              {activity?.recent_reports && activity.recent_reports.length > 0 ? (
                activity.recent_reports.slice(0, 5).map((report) => (
                  <Link key={report.Report_ID} to={`/lost-reports/${report.Report_ID}`} className="block p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100">
                    <p className="font-semibold text-sm" style={{ color: 'var(--navy-900)' }}>{report.Item_Name}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--rust-600)' }}>{report.Category_Name}</p>
                  </Link>
                ))
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-10 h-10 mx-auto mb-2" style={{ color: 'var(--gold-300)' }} />
                  <p className="text-sm" style={{ color: 'var(--rust-600)' }}>No reports yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Claims */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold" style={{ color: 'var(--brown-900)' }}>Recent Claims</h3>
              <Link to="/claims" className="text-sm font-semibold hover:opacity-80 transition-all" style={{ color: 'var(--rust-600)' }}>View all →</Link>
            </div>
            <div className="space-y-3">
              {activity?.recent_claims && activity.recent_claims.length > 0 ? (
                activity.recent_claims.slice(0, 5).map((claim) => (
                  <Link key={claim.Claim_ID} to={`/claims/${claim.Claim_ID}`} className="block p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100">
                    <p className="font-semibold text-sm" style={{ color: 'var(--navy-900)' }}>{claim.Item_Name}</p>
                    <p className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--rust-600)' }}>
                      <Clock className="w-3 h-3" />
                      {new Date(claim.Claim_Date).toLocaleDateString()}
                    </p>
                  </Link>
                ))
              ) : (
                <div className="text-center py-8">
                  <ClipboardCheck className="w-10 h-10 mx-auto mb-2" style={{ color: 'var(--gold-300)' }} />
                  <p className="text-sm" style={{ color: 'var(--rust-600)' }}>No claims yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
