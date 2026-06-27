import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { FileText, GitCompareArrows, ClipboardCheck, Plus, ArrowUpRight, Sparkles, MapPin } from 'lucide-react';
import { PageHead, Surface, SectionLabel, StatusBadge } from '../../components/ui/kit';

function Stat({ icon: Icon, value, label, to }) {
  return (
    <Link to={to}>
      <Surface className="p-5 flex items-center gap-4 h-full transition-shadow hover:shadow-md">
        <span className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(212,162,78,0.14)' }}>
          <Icon className="w-5 h-5 text-gold-500" />
        </span>
        <div>
          <p className="font-bold text-navy-900" style={{ fontSize: '1.5rem', lineHeight: 1 }}>{value}</p>
          <p className="text-xs text-rust-600 mt-1">{label}</p>
        </div>
      </Surface>
    </Link>
  );
}

export default function MyStatsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      api.get('/findit-dashboard/my-stats'),
      api.get('/findit-lost-reports', { params: { limit: 5 } }),
      api.get('/findit-matching', { params: { limit: 3 } }),
    ])
      .then(([s, r, m]) => {
        if (!mounted) return;
        setStats(s.data);
        setReports(r.data.data || []);
        setMatches(m.data.data || []);
      })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const totalReports = stats?.my_reports?.reduce((s, r) => s + r.cnt, 0) || 0;
  const totalMatches = stats?.my_matches?.cnt || 0;
  const totalClaims = stats?.my_claims?.reduce((s, c) => s + c.cnt, 0) || 0;

  const activeReports = reports.filter((r) => ['Active', 'Matched'].includes(r.Report_Status)).slice(0, 5);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-rust-600">Loading your overview…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 py-8">
        <PageHead
          title={`Welcome back, ${user?.first_name || ''}`.trim()}
          subtitle="Track your reports and any items we've matched to them"
          actions={
            <Link to="/lost-reports" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: 'var(--navy-900)' }}>
              <Plus className="w-4 h-4" /> File a lost report
            </Link>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Stat icon={FileText} value={totalReports} label="Reports filed" to="/lost-reports" />
          <Stat icon={GitCompareArrows} value={totalMatches} label="Potential matches" to="/matching" />
          <Stat icon={ClipboardCheck} value={totalClaims} label="Active claims" to="/claims" />
        </div>

        <div className="grid lg:grid-cols-2 gap-4 mt-4">
          {/* Active reports */}
          <Surface className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-navy-900 font-semibold">Your active reports</h3>
              <Link to="/lost-reports" className="text-xs font-semibold text-navy-900 hover:opacity-70 flex items-center gap-1">
                All <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {activeReports.length === 0 ? (
              <p className="text-sm text-rust-600 py-6 text-center">No active reports. File one to start the search.</p>
            ) : (
              <ul className="divide-y" style={{ borderColor: 'rgba(212,162,78,0.25)' }}>
                {activeReports.map((r) => (
                  <li key={r.Report_ID} className="flex items-center justify-between py-3 gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-navy-900 truncate">{r.Item_Name}</p>
                      <p className="text-xs text-rust-600 truncate">{r.Place_Name} · {r.Date_Lost}</p>
                    </div>
                    <StatusBadge status={r.Report_Status} />
                  </li>
                ))}
              </ul>
            )}
          </Surface>

          {/* Possible matches */}
          <Surface className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-gold-500" />
              <h3 className="text-navy-900 font-semibold">Possible matches for you</h3>
            </div>
            {matches.length === 0 ? (
              <p className="text-sm text-rust-600 py-6 text-center">No matches yet. We'll notify you when one turns up.</p>
            ) : (
              <div className="space-y-3">
                {matches.map((m) => (
                  <Link
                    key={m.Match_ID}
                    to="/matching"
                    className="flex items-center justify-between rounded-lg p-3 hover:shadow-sm transition-shadow"
                    style={{ border: '1px solid rgba(212,162,78,0.25)' }}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-navy-900 truncate">{m.Found_Name}</p>
                      <p className="text-xs text-rust-600 truncate flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> {m.Found_Location}
                      </p>
                    </div>
                    <SectionLabel>{Math.round(m.Match_Score)}% match</SectionLabel>
                  </Link>
                ))}
              </div>
            )}
          </Surface>
        </div>
      </div>
    </div>
  );
}
