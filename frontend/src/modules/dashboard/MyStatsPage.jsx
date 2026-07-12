import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { FileText, GitCompareArrows, ClipboardCheck, ArrowUpRight, Sparkles, MapPin, Trophy, HandHeart } from 'lucide-react';
import { PageHead, Surface, SectionLabel, StatusBadge, Meter } from '../../components/ui/kit';

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

// One ranked entry in a leaderboard. The top three get a gold rank badge for
// the "leaderboard" flourish; the rest stay muted.
function LeaderRow({ rank, label, count, value, max }) {
  const isPodium = rank <= 3;
  return (
    <div className="flex items-center gap-3">
      <span
        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
        style={isPodium
          ? { backgroundColor: 'var(--gold-500)', color: 'var(--navy-900)' }
          : { backgroundColor: 'rgba(212,162,78,0.14)', color: 'var(--rust-600)' }}
      >
        {rank}
      </span>
      <span className="text-sm text-navy-900 flex-1 min-w-0 truncate">{label}</span>
      <div className="w-20 flex-shrink-0"><Meter value={value} max={max} /></div>
      <span className="text-sm font-semibold text-navy-900 w-6 text-right tabular-nums">{count}</span>
    </div>
  );
}

export default function MyStatsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [matches, setMatches] = useState([]);
  const [community, setCommunity] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      api.get('/findit-dashboard/my-stats'),
      api.get('/findit-lost-reports', { params: { limit: 5 } }),
      api.get('/findit-matching', { params: { limit: 3 } }),
      api.get('/findit-dashboard/community-stats'),
    ])
      .then(([s, r, m, c]) => {
        if (!mounted) return;
        setStats(s.data);
        setReports(r.data.data || []);
        setMatches(m.data.data || []);
        setCommunity(c.data);
      })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  // Postgres COUNT(*) comes back as a string, so cnt must be coerced to a
  // Number before summing or `+` concatenates ("3" + "1" -> "31") instead
  // of adding (3 + 1 -> 4).
  const totalReports = stats?.my_reports?.reduce((s, r) => s + Number(r.cnt), 0) || 0;
  const totalMatches = Number(stats?.my_matches?.cnt) || 0;
  const totalClaims = stats?.my_claims?.reduce((s, c) => s + Number(c.cnt), 0) || 0;

  const activeReports = reports.filter((r) => ['Active', 'Matched'].includes(r.Report_Status)).slice(0, 5);

  const topCategories = community?.top_categories || [];
  const topLocations = community?.top_locations || [];
  const recoveredCount = community?.recovered_count || 0;
  const maxCat = Math.max(1, ...topCategories.map((c) => c.cnt));
  const maxLoc = Math.max(1, ...topLocations.map((l) => l.cnt));
  const hasCommunity = topCategories.length > 0 || topLocations.length > 0 || recoveredCount > 0;

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

        {/* Campus trends */}
        {hasCommunity && (
          <div className="mt-8">
            <h2 className="text-navy-900 font-semibold mb-1">Campus trends</h2>
            <p className="text-sm text-rust-600 mb-4">What goes missing most across campus — and how many items find their way home.</p>

            {/* Recovered banner */}
            <div className="rounded-xl p-5 mb-4 flex items-center gap-4" style={{ background: 'linear-gradient(90deg, rgba(212,162,78,0.16), rgba(212,162,78,0.04))', border: '1px solid var(--gold-300)' }}>
              <span className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--gold-500)' }}>
                <HandHeart className="w-6 h-6" style={{ color: 'var(--navy-900)' }} aria-hidden="true" />
              </span>
              <div>
                <p className="font-bold text-navy-900" style={{ fontSize: '1.75rem', lineHeight: 1 }}>{recoveredCount}</p>
                <p className="text-sm text-rust-600 mt-1">{recoveredCount === 1 ? 'item reunited with its owner' : 'items reunited with their owners'}</p>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-4">
              {/* Most-lost leaderboard */}
              <Surface className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="w-4 h-4 text-gold-500" aria-hidden="true" />
                  <h3 className="text-navy-900 font-semibold">Most-lost items</h3>
                </div>
                {topCategories.length === 0 ? (
                  <p className="text-sm text-rust-600 py-6 text-center">No reports filed yet.</p>
                ) : (
                  <div className="space-y-3">
                    {topCategories.map((c, i) => (
                      <LeaderRow key={c.Category_Name} rank={i + 1} label={c.Category_Name?.replace(/_/g, ' ')} count={c.cnt} value={c.cnt} max={maxCat} />
                    ))}
                  </div>
                )}
              </Surface>

              {/* Lost hotspots */}
              <Surface className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-4 h-4 text-gold-500" aria-hidden="true" />
                  <h3 className="text-navy-900 font-semibold">Lost hotspots</h3>
                </div>
                {topLocations.length === 0 ? (
                  <p className="text-sm text-rust-600 py-6 text-center">No reports filed yet.</p>
                ) : (
                  <div className="space-y-3">
                    {topLocations.map((l, i) => (
                      <LeaderRow key={l.Place_Name} rank={i + 1} label={l.Place_Name} count={l.cnt} value={l.cnt} max={maxLoc} />
                    ))}
                  </div>
                )}
              </Surface>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
