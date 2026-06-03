import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';
import { Link } from 'react-router-dom';
import {
  FileText,
  Zap,
  CheckCircle,
  Plus,
  ArrowRight,
  Activity,
} from 'lucide-react';

export default function MyStatsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/findit-dashboard/my-stats')
      .then((r) => setStats(r.data))
      .finally(() => setLoading(false));
  }, []);

  const totalReports = stats?.my_reports?.reduce((s, r) => s + r.cnt, 0) || 0;
  const totalMatches = stats?.my_matches?.cnt || 0;
  const totalClaims = stats?.my_claims?.reduce((s, c) => s + c.cnt, 0) || 0;

  const StatCard = ({
    icon: Icon,
    label,
    value,
    color,
    link,
    description,
  }) => (
    <Link
      to={link}
      className="card card-interactive hover:border-secondary hover:border-opacity-50 flex flex-col"
    >
      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${color} mb-4`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <p className="text-4xl font-bold text-slate-900 mb-1">{value}</p>
      <p className="text-sm font-medium text-slate-600 mb-2">{label}</p>
      {description && (
        <p className="text-xs text-slate-500 mb-3">{description}</p>
      )}
      <div className="mt-auto flex items-center text-secondary text-sm font-semibold">
        View Details <ArrowRight className="w-4 h-4 ml-1" />
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="p-6 max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-900 mb-1">
            Welcome back, {user?.first_name}! 👋
          </h1>
          <p className="text-slate-600">Here's your FindIT overview</p>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto">
        {/* Main Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon={FileText}
            label="Lost Reports"
            value={totalReports}
            color="bg-gradient-to-br from-blue-500 to-blue-600"
            link="/lost-reports"
            description="Reports you filed"
          />
          <StatCard
            icon={Zap}
            label="Potential Matches"
            value={totalMatches}
            color="bg-gradient-to-br from-secondary to-amber-500"
            link="/matching"
            description="Items that might be yours"
          />
          <StatCard
            icon={CheckCircle}
            label="My Claims"
            value={totalClaims}
            color="bg-gradient-to-br from-success to-green-600"
            link="/claims"
            description="Items you claimed"
          />
        </div>

        {/* Quick Actions & Details */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="md:col-span-1">
            <div className="card">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-secondary" />
                Quick Actions
              </h2>
              <div className="space-y-3">
                <Link
                  to="/lost-reports/new"
                  className="btn-primary w-full justify-center"
                >
                  <Plus className="w-4 h-4" />
                  File Lost Report
                </Link>
                <Link
                  to="/found-items"
                  className="btn-secondary w-full justify-center"
                >
                  Browse Found Items
                </Link>
              </div>
            </div>
          </div>

          {/* Report Status Breakdown */}
          <div className="md:col-span-2">
            <div className="card">
              <h2 className="text-lg font-bold text-slate-900 mb-4">
                Report Status Breakdown
              </h2>
              {!loading && stats?.my_reports?.length ? (
                <div className="space-y-3">
                  {stats.my_reports.map((report) => (
                    <div
                      key={report.Report_Status}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-2 h-2 rounded-full bg-secondary"></div>
                        <span className="font-medium text-slate-700">
                          {report.Report_Status || 'Unknown'}
                        </span>
                      </div>
                      <span className="text-2xl font-bold text-primary">
                        {report.cnt}
                      </span>
                    </div>
                  ))}
                </div>
              ) : loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-12 bg-slate-200 rounded-lg animate-pulse"
                    ></div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No reports yet.</p>
                  <Link
                    to="/lost-reports/new"
                    className="text-secondary font-semibold text-sm mt-3 inline-block hover:text-opacity-80"
                  >
                    Create your first report →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Claims Status */}
        {stats?.my_claims?.length > 0 && (
          <div className="mt-6">
            <div className="card">
              <h2 className="text-lg font-bold text-slate-900 mb-4">
                Claim Status Summary
              </h2>
              <div className="space-y-3">
                {stats.my_claims.map((claim) => (
                  <div
                    key={claim.Claim_Status}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          claim.Claim_Status === 'Approved'
                            ? 'bg-success'
                            : claim.Claim_Status === 'Pending'
                              ? 'bg-warning'
                              : 'bg-error'
                        }`}
                      ></div>
                      <span className="font-medium text-slate-700">
                        {claim.Claim_Status || 'Unknown'}
                      </span>
                    </div>
                    <span className="text-lg font-bold text-primary">
                      {claim.cnt}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
