import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';
import { StatusBadge, ScoreBadge } from '../../components/ui/StatusBadge';
import { Pagination } from '../../components/ui/Pagination';
import { Modal } from '../../components/ui/Modal';
import { Eye, Play, CheckCircle, XCircle } from 'lucide-react';
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
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Item Matches</h1>
          <p className="text-gray-500 text-sm">Auto and manual matches between lost reports and found items</p>
        </div>
        {['Staff','Admin'].includes(user.role) && (
          <button onClick={runAutoMatch} disabled={running} className="btn-primary flex items-center gap-2 w-fit">
            <Play className="w-4 h-4" /> {running ? 'Running...' : 'Run Auto-Match'}
          </button>
        )}
      </div>

      <div className="card mb-4">
        <select className="input sm:w-40" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          {['Pending','Confirmed','Rejected','Disputed'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">#</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Found Item</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Lost Report</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Score</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">Loading...</td></tr>
              ) : matches.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">No matches found</td></tr>
              ) : matches.map(m => (
                <tr key={m.Match_ID} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400">#{m.Match_ID}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{m.Found_Name}</p>
                    <p className="text-gray-500 text-xs">{m.Found_Color} · {m.Category_Name?.replace(/_/g,' ')}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{m.Lost_Name}</p>
                    <p className="text-gray-500 text-xs">{m.Reporter_Name}</p>
                  </td>
                  <td className="px-4 py-3"><ScoreBadge score={m.Match_Score} /></td>
                  <td className="px-4 py-3"><span className="badge-blue">{m.Match_Type}</span></td>
                  <td className="px-4 py-3"><StatusBadge status={m.Match_Status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setSelectedId(m.Match_ID)} className="text-blue-600 hover:text-blue-800 p-1"><Eye className="w-4 h-4" /></button>
                      {['Staff','Admin'].includes(user.role) && m.Match_Status === 'Pending' && (
                        <>
                          <button onClick={() => updateStatus(m.Match_ID, 'Confirmed')} className="text-green-600 hover:text-green-800 p-1" title="Confirm"><CheckCircle className="w-4 h-4" /></button>
                          <button onClick={() => updateStatus(m.Match_ID, 'Rejected')} className="text-red-600 hover:text-red-800 p-1" title="Reject"><XCircle className="w-4 h-4" /></button>
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
    </div>
  );
}
