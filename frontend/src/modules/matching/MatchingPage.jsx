import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';
import { useToast } from '../../lib/ToastContext';
import { Pagination } from '../../components/ui/Pagination';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHead, Surface, StatusBadge } from '../../components/ui/kit';
import { Play, CheckCircle2, XCircle, Package, FileText, ArrowLeftRight, Download, Search } from 'lucide-react';
import MatchDetail from './MatchDetail';

function scoreColor(score) {
  if (score >= 85) return 'var(--status-green)';
  if (score >= 70) return 'var(--gold-500)';
  return 'var(--status-terracotta)';
}

function Side({ icon: Icon, label, title, sub }) {
  return (
    <div className="flex-1 min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-rust-600 mb-2">{label}</p>
      <div className="flex items-center gap-3">
        <span className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(212,162,78,0.14)' }}>
          <Icon className="w-5 h-5 text-gold-500" />
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-navy-900 truncate">{title}</p>
          <p className="text-xs text-rust-600 truncate">{sub}</p>
        </div>
      </div>
    </div>
  );
}

function ManualMatchForm({ onSuccess, onCancel }) {
  const [items, setItems] = useState([]);
  const [reports, setReports] = useState([]);
  const [itemId, setItemId] = useState('');
  const [reportId, setReportId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/findit-found-items', { params: { limit: 100 } }),
      api.get('/findit-lost-reports', { params: { limit: 100 } }),
    ]).then(([i, r]) => {
      setItems((i.data.data || []).filter((x) => ['Unclaimed', 'Matched'].includes(x.Item_Status)));
      setReports((r.data.data || []).filter((x) => ['Active', 'Matched'].includes(x.Report_Status)));
    });
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true); setError('');
    try {
      const { data } = await api.post('/findit-matching/manual', { item_id: Number(itemId), report_id: Number(reportId) });
      onSuccess(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create match');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && (
        <div role="alert" className="p-4 rounded-lg text-sm" style={{ backgroundColor: 'rgba(194, 116, 31, 0.08)', color: 'var(--status-terracotta)', border: '1px solid var(--status-terracotta)' }}>
          {error}
        </div>
      )}
      <p className="text-xs" style={{ color: 'var(--rust-600)' }}>
        Pair a found item with a lost report the auto-matcher missed. The match score is computed automatically and the pairing is recorded as a manual match.
      </p>
      <div>
        <label htmlFor="manual_item" className="label mb-2">Found Item</label>
        <select id="manual_item" className="input" value={itemId} onChange={(e) => setItemId(e.target.value)} required>
          <option value="">Select found item</option>
          {items.map((i) => (
            <option key={i.Item_ID} value={i.Item_ID}>#{i.Item_ID} — {i.Item_Name} ({i.Item_Color}{i.Item_Brand ? `, ${i.Item_Brand}` : ''}) · {i.Item_Status}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="manual_report" className="label mb-2">Lost Report</label>
        <select id="manual_report" className="input" value={reportId} onChange={(e) => setReportId(e.target.value)} required>
          <option value="">Select lost report</option>
          {reports.map((r) => (
            <option key={r.Report_ID} value={r.Report_ID}>#{r.Report_ID} — {r.Item_Name} ({r.Item_Color}{r.Item_Brand ? `, ${r.Item_Brand}` : ''}) · {r.Report_Status}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="px-6 py-3 rounded-lg font-semibold border flex-1" style={{ color: 'var(--brown-900)', borderColor: 'var(--gold-300)', backgroundColor: 'white' }}>Cancel</button>
        <button type="submit" disabled={submitting || !itemId || !reportId} className="px-6 py-3 rounded-lg font-semibold text-white flex-1 disabled:opacity-60" style={{ backgroundColor: 'var(--navy-900)' }}>
          {submitting ? 'Creating…' : 'Create Match'}
        </button>
      </div>
    </form>
  );
}

export default function MatchingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [matches, setMatches] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [sortBy, setSortBy] = useState('score-desc');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);
  const [running, setRunning] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, matchId: null, action: null });
  const canManage = ['Staff', 'Admin'].includes(user.role);

  const load = () => {
    setLoading(true);
    api.get('/findit-matching', { params: { status, page, limit: 10 } })
      .then((r) => { setMatches(r.data.data); setPagination(r.data.pagination); })
      .catch(() => toast('Failed to load matches', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [status, page]);

  const runAutoMatch = async () => {
    setRunning(true);
    try {
      const { data } = await api.post('/findit-matching/run');
      toast(data?.message || 'Auto-match complete', 'success');
      load();
    } catch (e) {
      toast(e.response?.data?.message || e.response?.data?.error || 'Error running auto-match', 'error');
    } finally {
      setRunning(false);
    }
  };

  const updateStatus = async (id, decision) => {
    try {
      await api.put(`/findit-matching/${id}/status`, { status: decision });
      toast(`Match ${decision.toLowerCase()}`, 'success');
      load();
    } catch {
      toast('Could not update match', 'error');
    }
  };

  const sorted = [...matches].sort((a, b) => {
    switch (sortBy) {
      case 'score-asc': return (a.Match_Score || 0) - (b.Match_Score || 0);
      case 'date-newest': return new Date(b.Date_Created) - new Date(a.Date_Created);
      case 'date-oldest': return new Date(a.Date_Created) - new Date(b.Date_Created);
      default: return (b.Match_Score || 0) - (a.Match_Score || 0);
    }
  });

  const exportCSV = () => {
    const headers = ['Match ID', 'Found Item', 'Lost Report', 'Score', 'Type', 'Status'];
    const rows = matches.map((m) => [m.Match_ID, m.Found_Name, m.Lost_Name, m.Match_Score, m.Match_Type, m.Match_Status]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c ?? ''}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `matches-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 py-8">
        <PageHead
          title="Matches"
          subtitle="Suggested pairings between found items and lost reports"
          actions={
            canManage && (
              <>
                <button onClick={exportCSV} disabled={matches.length === 0} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-navy-900 disabled:opacity-50" style={{ backgroundColor: 'var(--gold-300)' }}>
                  <Download className="w-4 h-4" /> Export
                </button>
                <button onClick={() => setShowManual(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-navy-900" style={{ backgroundColor: 'var(--gold-300)' }}>
                  <ArrowLeftRight className="w-4 h-4" /> Manual match
                </button>
                <button onClick={runAutoMatch} disabled={running} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60" style={{ backgroundColor: 'var(--navy-900)' }}>
                  {running ? <span className="loading-spinner" /> : <Play className="w-4 h-4" />} {running ? 'Running…' : 'Run auto-match'}
                </button>
              </>
            )
          }
        />

        <div className="flex items-center gap-2 mb-4">
          <select className="input" style={{ width: 'auto' }} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All statuses</option>
            {['Pending', 'Confirmed', 'Rejected', 'Disputed'].map((s) => <option key={s}>{s}</option>)}
          </select>
          <select className="input" style={{ width: 'auto' }} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="score-desc">Highest confidence</option>
            <option value="score-asc">Lowest confidence</option>
            <option value="date-newest">Newest first</option>
            <option value="date-oldest">Oldest first</option>
          </select>
        </div>

        {loading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-xl skeleton" />)}</div>
        ) : sorted.length === 0 ? (
          <EmptyState icon={Search} title="No matches yet" description="When lost reports and found items line up, they'll appear here." />
        ) : (
          <div className="space-y-3">
            {sorted.map((m) => (
              <Surface key={m.Match_ID} className="p-5 cursor-pointer transition-shadow hover:shadow-md" onClick={() => setSelectedId(m.Match_ID)}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <Side icon={Package} label="Found item" title={m.Found_Name} sub={`Match #${m.Match_ID} · ${m.Match_Type}`} />

                  <div className="flex flex-col items-center px-2">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: `conic-gradient(${scoreColor(m.Match_Score)} ${(m.Match_Score || 0) * 3.6}deg, rgba(212,162,78,0.18) 0deg)` }}>
                      <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center">
                        <span className="text-sm font-bold text-navy-900">{Math.round(m.Match_Score)}</span>
                      </div>
                    </div>
                    <ArrowLeftRight className="w-4 h-4 text-rust-600 mt-2" aria-hidden="true" />
                  </div>

                  <Side icon={FileText} label="Lost report" title={m.Lost_Name} sub={m.Reporter_Name} />

                  <div className="flex flex-col items-end gap-2 w-full sm:w-auto" onClick={(e) => e.stopPropagation()}>
                    <StatusBadge status={m.Match_Status} />
                    {canManage && m.Match_Status === 'Pending' && (
                      <div className="flex gap-2">
                        <button onClick={() => setConfirmDialog({ isOpen: true, matchId: m.Match_ID, action: 'reject' })} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold border" style={{ borderColor: 'var(--gold-300)', color: 'var(--status-terracotta)' }}>
                          <XCircle className="w-4 h-4" /> Reject
                        </button>
                        <button onClick={() => setConfirmDialog({ isOpen: true, matchId: m.Match_ID, action: 'confirm' })} className="btn-success btn-sm">
                          <CheckCircle2 className="w-4 h-4" /> Confirm
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </Surface>
            ))}
          </div>
        )}

        {!loading && <Pagination pagination={pagination} onPageChange={setPage} />}
      </div>

      <Modal isOpen={showManual} onClose={() => setShowManual(false)} title="Create Manual Match">
        <ManualMatchForm
          onSuccess={(data) => { setShowManual(false); toast(`Manual match created (score ${data?.score ?? '—'})`, 'success'); load(); }}
          onCancel={() => setShowManual(false)}
        />
      </Modal>

      <Modal isOpen={!!selectedId} onClose={() => setSelectedId(null)} title="Match Details" size="lg">
        {selectedId && <MatchDetail id={selectedId} onClose={() => setSelectedId(null)} onRefresh={load} />}
      </Modal>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.action === 'confirm' ? 'Confirm Match?' : 'Reject Match?'}
        message={confirmDialog.action === 'confirm' ? 'This match will be marked as confirmed.' : 'This match will be marked as rejected.'}
        confirmText={confirmDialog.action === 'confirm' ? 'Confirm' : 'Reject'}
        cancelText="Cancel"
        onConfirm={() => {
          updateStatus(confirmDialog.matchId, confirmDialog.action === 'confirm' ? 'Confirmed' : 'Rejected');
          setConfirmDialog({ isOpen: false, matchId: null, action: null });
        }}
        onCancel={() => setConfirmDialog({ isOpen: false, matchId: null, action: null })}
        variant={confirmDialog.action === 'reject' ? 'danger' : 'default'}
      />
    </div>
  );
}
