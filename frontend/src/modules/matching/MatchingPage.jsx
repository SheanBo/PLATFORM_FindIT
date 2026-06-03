import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';
import { StatusBadge, ScoreBadge } from '../../components/ui/StatusBadge';
import { Pagination } from '../../components/ui/Pagination';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { TableSkeleton } from '../../components/ui/LoadingSpinner';
import { Eye, Play, CheckCircle, XCircle, Search } from 'lucide-react';
import MatchDetail from './MatchDetail';

export default function MatchingPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [matches, setMatches] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);
  const [running, setRunning] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, matchId: null, action: null });

  const load = () => {
    setLoading(true);
    api.get('/findit-matching', { params: { status, page, limit: 10 } })
      .then(r => { setMatches(r.data.data); setPagination(r.data.pagination); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [status, page]);

  const runAutoMatch = async () => {
    setRunning(true);
    try {
      const { data } = await api.post('/findit-matching/run');
      alert(data.message);
      load();
    } catch (e) { alert('Error running matching'); }
    finally { setRunning(false); }
  };

  const updateStatus = async (id, status) => {
    await api.put(`/findit-matching/${id}/status`, { status });
    load();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen bg-amber-50">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-amber-950">Item Matches</h1>
          <p className="text-amber-700 text-sm">Auto and manual matches between lost reports and found items</p>
        </div>
        {['Staff','Admin'].includes(user.role) && (
          <button onClick={runAutoMatch} disabled={running} className="btn-primary flex items-center gap-2 w-fit" aria-label="Run automatic matching">
            {running && <span className="loading-spinner" />}
            {running ? 'Running...' : <><Play className="w-4 h-4" /> Run Auto-Match</>}
          </button>
        )}
      </div>

      <div className="card mb-4">
        <select className="select sm:w-40" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} aria-label="Filter matches by status">
          <option value="">All Status</option>
          {['Pending','Confirmed','Rejected','Disputed'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" role="grid" aria-label="Matches list">
            <thead className="bg-amber-50 border-b border-amber-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-amber-900">#</th>
                <th className="text-left px-4 py-3 font-medium text-amber-900">Found Item</th>
                <th className="text-left px-4 py-3 font-medium text-amber-900">Lost Report</th>
                <th className="text-left px-4 py-3 font-medium text-amber-900">Score</th>
                <th className="text-left px-4 py-3 font-medium text-amber-900">Type</th>
                <th className="text-left px-4 py-3 font-medium text-amber-900">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100">
              {loading ? (
                <tr><td colSpan={7} className="p-0"><TableSkeleton rows={5} columns={7} /></td></tr>
              ) : matches.length === 0 ? (
                <tr><td colSpan={7} className="p-0"><EmptyState icon={Search} title="No matches found" description="Matches between lost reports and found items will appear here" /></td></tr>
              ) : matches.map(m => (
                <tr key={m.Match_ID} className="hover:bg-amber-100 transition-colors cursor-pointer">
                  <td className="px-4 py-3 text-amber-600">#{m.Match_ID}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-amber-950">{m.Found_Name}</p>
                    <p className="text-amber-700 text-xs">{m.Found_Color} · {m.Category_Name?.replace(/_/g,' ')}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-amber-950">{m.Lost_Name}</p>
                    <p className="text-amber-700 text-xs">{m.Reporter_Name}</p>
                  </td>
                  <td className="px-4 py-3"><ScoreBadge score={m.Match_Score} /></td>
                  <td className="px-4 py-3"><span className="badge-info">{m.Match_Type}</span></td>
                  <td className="px-4 py-3"><StatusBadge status={m.Match_Status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setSelectedId(m.Match_ID)}
                        className="text-amber-600 hover:text-amber-700 p-1 rounded hover:bg-amber-50 transition-colors"
                        title="View match details"
                        aria-label={`View details for match ${m.Match_ID}`}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {['Staff','Admin'].includes(user.role) && m.Match_Status === 'Pending' && (
                        <>
                          <button onClick={() => setConfirmDialog({ isOpen: true, matchId: m.Match_ID, action: 'confirm' })} className="text-amber-600 hover:text-amber-700 p-1 rounded hover:bg-amber-50" title="Confirm" aria-label="Confirm match"><CheckCircle className="w-4 h-4" /></button>
                          <button onClick={() => setConfirmDialog({ isOpen: true, matchId: m.Match_ID, action: 'reject' })} className="text-amber-600 hover:text-amber-700 p-1 rounded hover:bg-amber-50" title="Reject" aria-label="Reject match"><XCircle className="w-4 h-4" /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 pb-4"><Pagination pagination={pagination} onPageChange={setPage} /></div>
      </div>

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
