import { useState, useEffect } from 'react';
import api from '../../lib/api';
import {
  Package,
  FileText,
  Zap,
  ClipboardCheck,
  AlertTriangle,
  TrendingUp,
  Calendar,
  ArrowUpRight,
  ArrowRight,
} from 'lucide-react';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Link } from 'react-router-dom';

function KPICard({ icon: Icon, label, value, trend, color, to }) {
  const content = (
    <div
      className={`card card-interactive transition-all ${to ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${color} bg-opacity-20`}
        >
          <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-success text-sm font-semibold">
            <ArrowUpRight className="w-4 h-4" />
            {trend}%
          </div>
        )}
      </div>
      <p className="text-3xl font-bold text-amber-950 mb-1">{value ?? '—'}</p>
      <p className="text-sm text-amber-700">{label}</p>
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
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-amber-700">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const totalReports = (stats?.Active_Reports || 0) + (stats?.Closed_Reports || 0);
  const recoveryRate = stats?.Recovery_Rate_Percent ?? 0;

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Header */}
      <div className="bg-white border-b border-amber-200 sticky top-0 z-40">
        <div className="p-6 max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-amber-950 mb-1">Dashboard</h1>
          <p className="text-amber-700">
            FindIT — Office of Student Affairs Operations Overview
          </p>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto">
        {/* Recovery Rate Banner */}
        {stats?.Recovery_Rate_Percent !== null && (
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-8 mb-8 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-300 text-sm font-semibold mb-1">
                  RECOVERY RATE
                </p>
                <p className="text-6xl font-bold mb-2">{recoveryRate}%</p>
                <p className="text-amber-100 text-sm">
                  {stats?.Closed_Reports} of {totalReports} reports closed
                </p>
              </div>
              <div className="hidden sm:block opacity-20">
                <TrendingUp className="w-24 h-24" />
              </div>
            </div>
          </div>
        )}

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <KPICard
            icon={Package}
            label="Unclaimed Items"
            value={stats?.Unclaimed_Items}
            color="bg-slate-500"
            to="/found-items?status=Unclaimed"
          />
          <KPICard
            icon={Zap}
            label="Pending Matches"
            value={stats?.Pending_Matches}
            color="bg-secondary"
            to="/matching?status=Pending"
            trend={stats?.Pending_Matches > 5 ? 5 : undefined}
          />
          <KPICard
            icon={ClipboardCheck}
            label="Pending Claims"
            value={stats?.Pending_Claims}
            color="bg-warning"
            to="/claims?status=Pending"
          />
          <KPICard
            icon={AlertTriangle}
            label="Expired Items"
            value={stats?.Expired_Items}
            color="bg-error"
            to="/storage"
          />
          <KPICard
            icon={Package}
            label="Matched Items"
            value={stats?.Matched_Items}
            color="bg-info"
            to="/found-items?status=Matched"
          />
          <KPICard
            icon={Package}
            label="Claimed Items"
            value={stats?.Claimed_Items}
            color="bg-success"
            to="/found-items?status=Claimed"
          />
          <KPICard
            icon={FileText}
            label="Active Reports"
            value={stats?.Active_Reports}
            color="bg-purple-500"
            to="/lost-reports?status=Active"
          />
          <KPICard
            icon={FileText}
            label="Closed Reports"
            value={stats?.Closed_Reports}
            color="bg-cyan-500"
            to="/lost-reports?status=Closed"
          />
        </div>

        {/* Activity Feeds */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Recent Found Items */}
          <div className="card">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-amber-950">
                Recent Found Items
              </h2>
              <Link
                to="/found-items"
                className="text-amber-600 text-sm font-semibold hover:text-amber-700"
              >
                View all →
              </Link>
            </div>
            <div className="space-y-3">
              {activity?.recent_items && activity.recent_items.length > 0 ? (
                activity.recent_items.slice(0, 5).map((item) => (
                  <Link
                    key={item.Item_ID}
                    to={`/found-items/${item.Item_ID}`}
                    className="block p-3 rounded-lg hover:bg-amber-100 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-amber-950">
                          {item.Item_Name}
                        </p>
                        <p className="text-xs text-amber-700">
                          {item.Category_Name}
                        </p>
                      </div>
                      <StatusBadge status={item.Item_Status} />
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-8">
                  <Package className="w-10 h-10 text-amber-300 mx-auto mb-2" />
                  <p className="text-amber-700 text-sm">No items yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Lost Reports */}
          <div className="card">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-amber-950">
                Recent Lost Reports
              </h2>
              <Link
                to="/lost-reports"
                className="text-amber-600 text-sm font-semibold hover:text-amber-700"
              >
                View all →
              </Link>
            </div>
            <div className="space-y-3">
              {activity?.recent_reports && activity.recent_reports.length > 0 ? (
                activity.recent_reports.slice(0, 5).map((report) => (
                  <Link
                    key={report.Report_ID}
                    to={`/lost-reports/${report.Report_ID}`}
                    className="block p-3 rounded-lg hover:bg-amber-100 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-amber-950">
                          {report.Item_Name}
                        </p>
                        <p className="text-xs text-amber-700">
                          {report.Category_Name}
                        </p>
                      </div>
                      <StatusBadge status={report.Report_Status} />
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-10 h-10 text-amber-300 mx-auto mb-2" />
                  <p className="text-amber-700 text-sm">No reports yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Claims */}
          <div className="card">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-amber-950">Recent Claims</h2>
              <Link
                to="/claims"
                className="text-amber-600 text-sm font-semibold hover:text-amber-700"
              >
                View all →
              </Link>
            </div>
            <div className="space-y-3">
              {activity?.recent_claims && activity.recent_claims.length > 0 ? (
                activity.recent_claims.slice(0, 5).map((claim) => (
                  <Link
                    key={claim.Claim_ID}
                    to={`/claims/${claim.Claim_ID}`}
                    className="block p-3 rounded-lg hover:bg-amber-100 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-amber-950">
                          {claim.Item_Name}
                        </p>
                        <p className="text-xs text-amber-700 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(claim.Claim_Date).toLocaleDateString()}
                        </p>
                      </div>
                      <StatusBadge status={claim.Claim_Status} />
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-8">
                  <ClipboardCheck className="w-10 h-10 text-amber-300 mx-auto mb-2" />
                  <p className="text-amber-700 text-sm">No claims yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
