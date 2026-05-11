import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { Package, FileText, GitMerge, ClipboardCheck, AlertTriangle, TrendingUp } from 'lucide-react';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Link } from 'react-router-dom';

function StatCard({ icon: Icon, label, value, color, to }) {
  const content = (
    <div className={`card flex items-center gap-4 hover:shadow-md transition-shadow ${to ? 'cursor-pointer' : ''}`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
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
    ]).then(([s, a]) => { setStats(s.data); setActivity(a.data); }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">FindIT — Office of Student Affairs Overview</p>
      </div>

      {stats?.Recovery_Rate_Percent !== null && (
        <div className="card bg-gradient-to-r from-blue-600 to-blue-800 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-200 text-sm">Recovery Rate</p>
              <p className="text-4xl font-bold text-white">{stats?.Recovery_Rate_Percent ?? 0}%</p>
              <p className="text-blue-200 text-sm mt-1">{stats?.Closed_Reports} of {(stats?.Active_Reports || 0) + (stats?.Closed_Reports || 0)} reports closed</p>
            </div>
            <TrendingUp className="w-16 h-16 text-blue-300 opacity-50" />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Package} label="Unclaimed Items" value={stats?.Unclaimed_Items} color="bg-gray-500" to="/found-items?status=Unclaimed" />
        <StatCard icon={GitMerge} label="Pending Matches" value={stats?.Pending_Matches} color="bg-yellow-500" to="/matching?status=Pending" />
        <StatCard icon={ClipboardCheck} label="Pending Claims" value={stats?.Pending_Claims} color="bg-orange-500" to="/claims?status=Pending" />
        <StatCard icon={AlertTriangle} label="Expired Items" value={stats?.Expired_Items} color="bg-red-500" to="/storage" />
        <StatCard icon={Package} label="Matched Items" value={stats?.Matched_Items} color="bg-blue-500" to="/found-items?status=Matched" />
        <StatCard icon={Package} label="Claimed Items" value={stats?.Claimed_Items} color="bg-green-500" to="/found-items?status=Claimed" />
        <StatCard icon={FileText} label="Active Reports" value={stats?.Active_Reports} color="bg-purple-500" to="/lost-reports?status=Active" />
        <StatCard icon={FileText} label="Closed Reports" value={stats?.Closed_Reports} color="bg-teal-500" to="/lost-reports?status=Closed" />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Recent Found Items</h2>
          <div className="space-y-3">
            {activity?.recent_items?.map(item => (
              <div key={item.Item_ID} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-gray-900">{item.Item_Name}</p>
                  <p className="text-gray-500 text-xs">{item.Category_Name}</p>
                </div>
                <StatusBadge status={item.Item_Status} />
              </div>
            ))}
            {!activity?.recent_items?.length && <p className="text-gray-400 text-sm">No items yet</p>}
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Recent Lost Reports</h2>
          <div className="space-y-3">
            {activity?.recent_reports?.map(r => (
              <div key={r.Report_ID} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-gray-900">{r.Item_Name}</p>
                  <p className="text-gray-500 text-xs">{r.Category_Name}</p>
                </div>
                <StatusBadge status={r.Report_Status} />
              </div>
            ))}
            {!activity?.recent_reports?.length && <p className="text-gray-400 text-sm">No reports yet</p>}
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Recent Claims</h2>
          <div className="space-y-3">
            {activity?.recent_claims?.map(c => (
              <div key={c.Claim_ID} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-gray-900">{c.Item_Name}</p>
                  <p className="text-gray-500 text-xs">{c.Claim_Date}</p>
                </div>
                <StatusBadge status={c.Claim_Status} />
              </div>
            ))}
            {!activity?.recent_claims?.length && <p className="text-gray-400 text-sm">No claims yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
