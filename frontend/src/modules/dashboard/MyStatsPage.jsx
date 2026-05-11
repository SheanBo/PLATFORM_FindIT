import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';
import { Link } from 'react-router-dom';
import { FileText, GitMerge, ClipboardCheck } from 'lucide-react';

export default function MyStatsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => { api.get('/findit-dashboard/my-stats').then(r => setStats(r.data)); }, []);

  const count = (arr, status) => arr?.find(x => x.Report_Status === status || x.Claim_Status === status)?.cnt || 0;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.first_name}!</h1>
        <p className="text-gray-500 text-sm">Your FindIT overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="card text-center">
          <FileText className="w-8 h-8 text-blue-500 mx-auto mb-2" />
          <p className="text-3xl font-bold">{stats?.my_reports?.reduce((s, r) => s + r.cnt, 0) || 0}</p>
          <p className="text-gray-500 text-sm">My Lost Reports</p>
          <Link to="/lost-reports" className="text-blue-600 text-xs hover:underline mt-1 block">View all →</Link>
        </div>
        <div className="card text-center">
          <GitMerge className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
          <p className="text-3xl font-bold">{stats?.my_matches?.cnt || 0}</p>
          <p className="text-gray-500 text-sm">Potential Matches</p>
          <Link to="/matching" className="text-blue-600 text-xs hover:underline mt-1 block">View matches →</Link>
        </div>
        <div className="card text-center">
          <ClipboardCheck className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <p className="text-3xl font-bold">{stats?.my_claims?.reduce((s, c) => s + c.cnt, 0) || 0}</p>
          <p className="text-gray-500 text-sm">My Claims</p>
          <Link to="/claims" className="text-blue-600 text-xs hover:underline mt-1 block">View claims →</Link>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="font-semibold mb-3">Quick Actions</h2>
          <div className="space-y-2">
            <Link to="/lost-reports/new" className="btn-primary w-full text-center block">+ File a Lost Report</Link>
            <Link to="/found-items" className="btn-secondary w-full text-center block">Browse Found Items</Link>
          </div>
        </div>
        <div className="card">
          <h2 className="font-semibold mb-3">Report Status Breakdown</h2>
          {stats?.my_reports?.length ? (
            <div className="space-y-2">
              {stats.my_reports.map(r => (
                <div key={r.Report_Status} className="flex justify-between text-sm">
                  <span className="text-gray-600">{r.Report_Status}</span>
                  <span className="font-medium">{r.cnt}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-400 text-sm">No reports yet.</p>}
        </div>
      </div>
    </div>
  );
}
