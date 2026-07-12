import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { useToast } from '../../lib/ToastContext';
import { Package, FileText, GitCompareArrows, ClipboardCheck, AlertTriangle, ArrowUpRight, Boxes } from 'lucide-react';
import { PageHead, Surface, SectionLabel, StatusBadge, Meter } from '../../components/ui/kit';

const typeMeta = {
  found: { icon: Package, label: 'Found item' },
  report: { icon: FileText, label: 'Lost report' },
  claim: { icon: ClipboardCheck, label: 'Claim' },
};

function Kpi({ icon: Icon, label, value, foot, to }) {
  const body = (
    <Surface className="p-5 h-full transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <SectionLabel>{label}</SectionLabel>
        <Icon className="w-4 h-4 text-gold-500" aria-hidden="true" />
      </div>
      <p className="mt-3 font-bold text-navy-900" style={{ fontSize: '2rem', lineHeight: 1 }}>{value ?? '—'}</p>
      <div className="mt-2 text-xs text-rust-600">{foot}</div>
    </Surface>
  );
  return to ? <Link to={to}>{body}</Link> : body;
}

export default function DashboardPage() {
  const { toast } = useToast();
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      api.get('/findit-dashboard/stats'),
      api.get('/findit-dashboard/recent-activity'),
    ])
      .then(([s, a]) => {
        if (isMounted) { setStats(s.data); setActivity(a.data); }
      })
      .catch(() => { if (isMounted) toast('Failed to load dashboard data', 'error'); })
      .finally(() => { if (isMounted) setLoading(false); });

    api.get('/findit-dashboard/analytics')
      .then((r) => { if (isMounted) setAnalytics(r.data); })
      .catch(() => { /* admin-only — sections hidden for other roles */ });

    return () => { isMounted = false; };
  }, [toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-rust-600">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  const totalReports = (stats?.Active_Reports || 0) + (stats?.Closed_Reports || 0);
  const recoveryRate = stats?.Recovery_Rate_Percent ?? 0;

  const feed = [
    ...(activity?.recent_items || []).map((x) => ({ key: `i${x.Item_ID}`, type: 'found', title: x.Item_Name, meta: x.Category_Name, status: x.Item_Status, date: x.Date_Created })),
    ...(activity?.recent_reports || []).map((x) => ({ key: `r${x.Report_ID}`, type: 'report', title: x.Item_Name, meta: x.Category_Name, status: x.Report_Status, date: x.Date_Filed })),
    ...(activity?.recent_claims || []).map((x) => ({ key: `c${x.Claim_ID}`, type: 'claim', title: x.Item_Name, meta: 'Claim', status: x.Claim_Status, date: x.Claim_Date })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);

  const storageUsage = stats?.storage_usage || [];

  const monthMap = {};
  (analytics?.monthly_found || []).forEach((m) => { monthMap[m.Month] = { month: m.Month, items: m.Count, reports: 0 }; });
  (analytics?.monthly_lost || []).forEach((m) => { monthMap[m.Month] = { ...(monthMap[m.Month] || { month: m.Month, items: 0 }), reports: m.Count }; });
  const monthlyData = Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month)).slice(-6);
  const maxMonth = Math.max(1, ...monthlyData.flatMap((m) => [m.items, m.reports]));

  const topCategories = [...(analytics?.category_stats || [])].sort((a, b) => (b.Lost_Count || 0) - (a.Lost_Count || 0)).slice(0, 5);
  const maxCat = Math.max(1, ...topCategories.map((c) => c.Lost_Count || 0));

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 py-8">
        <PageHead title="Dashboard" subtitle="Operations overview — Office of Student Affairs" />

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Kpi icon={FileText} label="Reports filed" value={stats?.Total_Reports} foot="lost reports on file" to="/lost-reports" />
          <Kpi icon={Package} label="Unclaimed" value={stats?.Unclaimed_Items} foot="items in storage" to="/found-items?status=Unclaimed" />
          <Kpi icon={GitCompareArrows} label="Pending matches" value={stats?.Pending_Matches} foot="awaiting review" to="/matching?status=Pending" />
          <Kpi icon={ClipboardCheck} label="Pending claims" value={stats?.Pending_Claims} foot="awaiting verification" to="/claims?status=Pending" />
          <Kpi icon={AlertTriangle} label="Expired" value={stats?.Expired_Items} foot="over 30 days unclaimed" to="/storage?expired=1" />
        </div>

        {/* Main split */}
        <div className="grid lg:grid-cols-3 gap-4 mt-4">
          <Surface className="lg:col-span-2 p-5">
            <h3 className="text-navy-900 font-semibold mb-4">Recent activity</h3>
            {feed.length === 0 ? (
              <p className="text-sm text-rust-600 py-6 text-center">No recent activity yet.</p>
            ) : (
              <ul className="divide-y" style={{ borderColor: 'rgba(212,162,78,0.25)' }}>
                {feed.map((a) => {
                  const meta = typeMeta[a.type];
                  const Icon = meta.icon;
                  return (
                    <li key={a.key} className="flex items-center gap-3 py-3">
                      <span className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(212,162,78,0.15)' }}>
                        <Icon className="w-4 h-4 text-rust-600" aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-navy-900 truncate">{a.title}</p>
                        <p className="text-xs text-rust-600 truncate">{meta.label}{a.meta ? ` · ${String(a.meta).replace(/_/g, ' ')}` : ''}</p>
                      </div>
                      {a.status && <StatusBadge status={a.status} />}
                      <span className="text-xs text-rust-600 w-24 text-right hidden sm:block">
                        {a.date ? new Date(a.date).toLocaleDateString() : ''}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Surface>

          <div className="space-y-4">
            <Surface className="p-5">
              <SectionLabel>Recovery rate</SectionLabel>
              <div className="flex items-end gap-2 mt-2 mb-3">
                <span className="font-bold text-navy-900" style={{ fontSize: '2.25rem', lineHeight: 1 }}>{recoveryRate}%</span>
                <span className="text-xs text-rust-600 mb-1">{stats?.Closed_Reports} of {totalReports} closed</span>
              </div>
              <Meter value={recoveryRate} max={100} tone="var(--status-green)" />
            </Surface>

            {storageUsage.length > 0 && (
              <Surface className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Boxes className="w-4 h-4 text-gold-500" />
                  <SectionLabel>Storage capacity</SectionLabel>
                </div>
                <div className="space-y-4">
                  {storageUsage.map((s) => {
                    const pct = s.Total ? Math.round((s.Used / s.Total) * 100) : 0;
                    return (
                      <div key={s.Storage_Type}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm text-navy-900">{s.Storage_Type?.replace(/_/g, ' ')}</span>
                          <span className="text-xs text-rust-600">{pct}% full</span>
                        </div>
                        <Meter value={s.Used} max={s.Total} tone={pct > 85 ? 'var(--status-terracotta)' : 'var(--gold-500)'} />
                      </div>
                    );
                  })}
                </div>
              </Surface>
            )}
          </div>
        </div>

        {/* Category demand + monthly volume (admin analytics) */}
        {(topCategories.length > 0 || monthlyData.length > 0) && (
          <div className="grid lg:grid-cols-2 gap-4 mt-4">
            {topCategories.length > 0 && (
              <Surface className="p-5">
                <h3 className="text-navy-900 font-semibold mb-4">Most-lost categories</h3>
                <div className="space-y-3">
                  {topCategories.map((c) => (
                    <Link key={c.Category_Name} to="/lost-reports" className="flex items-center gap-3 group">
                      <span className="text-sm text-navy-900 w-44 truncate group-hover:underline">{c.Category_Name?.replace(/_/g, ' ')}</span>
                      <div className="flex-1"><Meter value={c.Lost_Count || 0} max={maxCat} /></div>
                      <span className="text-sm font-semibold text-navy-900 w-6 text-right">{c.Lost_Count || 0}</span>
                    </Link>
                  ))}
                </div>
              </Surface>
            )}

            {monthlyData.length > 0 && (
              <Surface className="p-5">
                <h3 className="text-navy-900 font-semibold mb-4">Monthly volume</h3>
                <div className="flex items-end justify-between gap-3 h-40">
                  {monthlyData.map((m) => (
                    <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                      <div className="flex items-end gap-1 h-32 w-full justify-center">
                        <div className="w-3 rounded-t" style={{ height: `${(m.items / maxMonth) * 100}%`, backgroundColor: 'var(--gold-500)' }} title={`${m.items} found`} />
                        <div className="w-3 rounded-t" style={{ height: `${(m.reports / maxMonth) * 100}%`, backgroundColor: 'var(--status-blue)' }} title={`${m.reports} reports`} />
                      </div>
                      <span className="text-xs text-rust-600">{m.month}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-4 mt-4 text-xs text-rust-600">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-gold-500" /> Found items</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: 'var(--status-blue)' }} /> Reports filed</span>
                </div>
              </Surface>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
