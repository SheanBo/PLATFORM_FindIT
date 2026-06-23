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
import { Eye, Play, CheckCircle, XCircle, Search, Rows3, Columns3, Download, ChevronDown, Package } from 'lucide-react';
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
  const [viewMode, setViewMode] = useState('list'); // list or sideBySide
  const [sortBy, setSortBy] = useState('score-desc');
  const [selectedMatches, setSelectedMatches] = useState(new Set());
  const [hoverMatch, setHoverMatch] = useState(null);
  const [photos, setPhotos] = useState({});
  const [error, setError] = useState('');

  const load = () => {
    setError('');
    setLoading(true);
    api.get('/findit-matching', { params: { status, page, limit: 10 } })
      .then(r => {
        setMatches(r.data.data);
        setPagination(r.data.pagination);
        // Fetch photos for all matches
        loadPhotos(r.data.data);
      })
      .finally(() => setLoading(false));
  };

  const loadPhotos = async (matchList) => {
    const photoMap = {};
    try {
      const photoRequests = matchList.flatMap(match => {
        const reqs = [];
        if (match.Report_ID) {
          reqs.push(
            api.get(`/findit-lost-reports/${match.Report_ID}`)
              .then(res => {
                if (res.data?.Photo_Path) photoMap[`lost-${match.Report_ID}`] = res.data.Photo_Path;
              })
              .catch(() => {})
          );
        }
        if (match.Item_ID) {
          reqs.push(
            api.get(`/findit-found-items/${match.Item_ID}`)
              .then(res => {
                if (res.data?.Photo_Path) photoMap[`found-${match.Item_ID}`] = res.data.Photo_Path;
              })
              .catch(() => {})
          );
        }
        return reqs;
      });
      await Promise.all(photoRequests);
      setPhotos(photoMap);
    } catch (e) { console.error('Error loading photos:', e); }
  };

  useEffect(() => { load(); }, [status, page]);

  const runAutoMatch = async () => {
    setRunning(true);
    setError('');
    try {
      const { data } = await api.post('/findit-matching/run');
      setError('');
      load();
    } catch (e) {
      setError(e.response?.data?.message || 'Error running auto-match');
    }
    finally { setRunning(false); }
  };

  const updateStatus = async (id, status) => {
    await api.put(`/findit-matching/${id}/status`, { status });
    load();
  };

  const getSortedMatches = (matchesArr) => {
    const sorted = [...matchesArr];
    switch (sortBy) {
      case 'score-desc':
        return sorted.sort((a, b) => (b.Match_Score || 0) - (a.Match_Score || 0));
      case 'score-asc':
        return sorted.sort((a, b) => (a.Match_Score || 0) - (b.Match_Score || 0));
      case 'date-newest':
        return sorted.sort((a, b) => new Date(b.Created_At) - new Date(a.Created_At));
      case 'date-oldest':
        return sorted.sort((a, b) => new Date(a.Created_At) - new Date(b.Created_At));
      case 'status-asc':
        return sorted.sort((a, b) => (a.Match_Status || '').localeCompare(b.Match_Status || ''));
      case 'type-asc':
        return sorted.sort((a, b) => (a.Match_Type || '').localeCompare(b.Match_Type || ''));
      default:
        return sorted;
    }
  };

  const handleSelectMatch = (id) => {
    const newSelected = new Set(selectedMatches);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedMatches(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedMatches.size === matches.length) {
      setSelectedMatches(new Set());
    } else {
      setSelectedMatches(new Set(matches.map(m => m.Match_ID)));
    }
  };

  const bulkAction = async (action) => {
    if (selectedMatches.size === 0) return;
    const status = action === 'confirm' ? 'Confirmed' : 'Rejected';
    try {
      for (const id of selectedMatches) {
        await api.put(`/findit-matching/${id}/status`, { status });
      }
      setSelectedMatches(new Set());
      load();
    } catch (e) { alert('Error performing bulk action'); }
  };

  const exportCSV = () => {
    const headers = ['Match ID', 'Found Item', 'Lost Report', 'Score', 'Type', 'Status', 'Date'];
    const rows = matches.map(m => [
      m.Match_ID,
      m.Found_Name,
      m.Lost_Name,
      m.Match_Score,
      m.Match_Type,
      m.Match_Status,
      new Date(m.Created_At).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `matches-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sortedMatches = getSortedMatches(matches);

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen" style={{ backgroundColor: 'white' }}>
      {error && (
        <div className="mb-6 p-4 rounded-lg text-sm" style={{ backgroundColor: '#F5E5D7', color: 'var(--status-terracotta)', border: '1px solid var(--status-terracotta)' }}>
          {error}
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-amber-950">Item Matches</h1>
          <p className="text-amber-700 text-sm">Auto and manual matches between lost reports and found items</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {['Staff','Admin'].includes(user.role) && (
            <div className="hidden md:flex items-center gap-1 border border-amber-300 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className="p-2 rounded transition-all cursor-pointer hover:opacity-80"
                style={{
                  backgroundColor: viewMode === 'list' ? 'var(--gold-500)' : 'transparent',
                  color: viewMode === 'list' ? 'var(--navy-900)' : 'var(--brown-900)',
                }}
                title="List view"
              >
                <Rows3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('sideBySide')}
                className="p-2 rounded transition-all cursor-pointer hover:opacity-80"
                style={{
                  backgroundColor: viewMode === 'sideBySide' ? 'var(--gold-500)' : 'transparent',
                  color: viewMode === 'sideBySide' ? 'var(--navy-900)' : 'var(--brown-900)',
                }}
                title="Side by side view"
              >
                <Columns3 className="w-4 h-4" />
              </button>
            </div>
          )}
          <button onClick={exportCSV} disabled={matches.length === 0} className="btn-secondary flex items-center gap-2 text-sm" title="Export matches to CSV">
            <Download className="w-4 h-4" /> Export
          </button>
          {['Staff','Admin'].includes(user.role) && (
            <button onClick={runAutoMatch} disabled={running} className="btn-primary flex items-center gap-2 w-fit" aria-label="Run automatic matching">
              {running && <span className="loading-spinner" />}
              {running ? 'Running...' : <><Play className="w-4 h-4" /> Run Auto-Match</>}
            </button>
          )}
        </div>
      </div>

      <div className="card mb-4" style={{ backgroundColor: 'var(--cream-100)' }}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-2 flex-1">
            <select className="select sm:w-40" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} aria-label="Filter matches by status">
              <option value="">All Status</option>
              {['Pending','Confirmed','Rejected','Disputed'].map(s => <option key={s}>{s}</option>)}
            </select>
            <select className="select sm:w-40" value={sortBy} onChange={e => setSortBy(e.target.value)} aria-label="Sort matches">
              <option value="score-desc">Score (High to Low)</option>
              <option value="score-asc">Score (Low to High)</option>
              <option value="date-newest">Newest First</option>
              <option value="date-oldest">Oldest First</option>
              <option value="status-asc">Status (A-Z)</option>
              <option value="type-asc">Type (A-Z)</option>
            </select>
          </div>
          {selectedMatches.size > 0 && ['Staff','Admin'].includes(user.role) && (
            <div className="flex gap-2">
              <button onClick={() => bulkAction('confirm')} className="text-sm px-3 py-2 rounded text-white cursor-pointer hover:opacity-90 transition-all" style={{ backgroundColor: '#22c55e' }}>
                ✓ Confirm ({selectedMatches.size})
              </button>
              <button onClick={() => bulkAction('reject')} className="text-sm px-3 py-2 rounded text-white cursor-pointer hover:opacity-90 transition-all" style={{ backgroundColor: '#ef4444' }}>
                ✗ Reject ({selectedMatches.size})
              </button>
            </div>
          )}
          {['Staff','Admin'].includes(user.role) && (
            <div className="md:hidden flex items-center gap-1 border border-amber-300 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className="p-2 rounded transition-all cursor-pointer hover:opacity-80"
                style={{
                  backgroundColor: viewMode === 'list' ? 'var(--gold-500)' : 'transparent',
                  color: viewMode === 'list' ? 'var(--navy-900)' : 'var(--brown-900)',
                }}
                title="List view"
              >
                <Rows3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('sideBySide')}
                className="p-2 rounded transition-all cursor-pointer hover:opacity-80"
                style={{
                  backgroundColor: viewMode === 'sideBySide' ? 'var(--gold-500)' : 'transparent',
                  color: viewMode === 'sideBySide' ? 'var(--navy-900)' : 'var(--brown-900)',
                }}
                title="Side by side view"
              >
                <Columns3 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>


      {/* Desktop Table View (only show if in list mode) */}
      <div className={`${viewMode === 'list' ? 'hidden md:block' : 'hidden'} card overflow-hidden p-0`} style={{ backgroundColor: 'var(--cream-100)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" role="grid" aria-label="Matches list">
            <thead style={{ backgroundColor: 'rgba(212, 162, 78, 0.1)', borderBottom: '2px solid var(--gold-300)' }}>
              <tr>
                {['Staff','Admin'].includes(user.role) && (
                  <th className="text-left px-4 py-3 font-medium text-amber-900 w-12">
                    <input type="checkbox" checked={selectedMatches.size === matches.length && matches.length > 0} onChange={handleSelectAll} aria-label="Select all" />
                  </th>
                )}
                <th className="text-left px-4 py-3 font-medium text-amber-900">#</th>
                <th className="text-left px-4 py-3 font-medium text-amber-900">Found Item</th>
                <th className="text-left px-4 py-3 font-medium text-amber-900">Lost Report</th>
                <th className="text-left px-4 py-3 font-medium text-amber-900">Score</th>
                <th className="text-left px-4 py-3 font-medium text-amber-900">Type</th>
                <th className="text-left px-4 py-3 font-medium text-amber-900">Status</th>
                <th className="text-left px-4 py-3 font-medium text-amber-900">Verified</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100">
              {loading ? (
                <tr><td colSpan={['Staff','Admin'].includes(user.role) ? 9 : 8} className="p-0"><TableSkeleton rows={5} columns={8} /></td></tr>
              ) : sortedMatches.length === 0 ? (
                <tr><td colSpan={['Staff','Admin'].includes(user.role) ? 9 : 8} className="p-0"><EmptyState icon={Search} title="No matches yet" description="When lost reports and found items match, they'll appear here" /></td></tr>
              ) : sortedMatches.map(m => (
                <tr key={m.Match_ID} className="hover:bg-amber-100 transition-colors" onMouseEnter={() => setHoverMatch(m.Match_ID)} onMouseLeave={() => setHoverMatch(null)}>
                  {['Staff','Admin'].includes(user.role) && (
                    <td className="px-4 py-3 text-center">
                      <input type="checkbox" checked={selectedMatches.has(m.Match_ID)} onChange={() => handleSelectMatch(m.Match_ID)} aria-label={`Select match ${m.Match_ID}`} />
                    </td>
                  )}
                  <td className="px-4 py-3 text-amber-600">#{m.Match_ID}</td>
                  <td className="px-4 py-3 relative">
                    <p className="font-medium text-amber-950">{m.Found_Name}</p>
                    <p className="text-amber-700 text-xs">{m.Found_Color} · {m.Category_Name?.replace(/_/g,' ')}</p>
                    {hoverMatch === m.Match_ID && (
                      <div className="absolute left-0 top-full mt-1 bg-white border border-amber-300 rounded shadow-lg p-3 z-50 w-48">
                        <p className="text-xs font-semibold text-amber-900 mb-1">Found Details</p>
                        <p className="text-xs text-amber-700 line-clamp-2">{m.Found_Description}</p>
                        {m.Date_Found && <p className="text-xs text-amber-600 mt-1">Found: {new Date(m.Date_Found).toLocaleDateString()}</p>}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 relative">
                    <p className="font-medium text-amber-950">{m.Lost_Name}</p>
                    <p className="text-amber-700 text-xs">{m.Reporter_Name}</p>
                    {hoverMatch === m.Match_ID && (
                      <div className="absolute left-0 top-full mt-1 bg-white border border-amber-300 rounded shadow-lg p-3 z-50 w-48">
                        <p className="text-xs font-semibold text-amber-900 mb-1">Lost Details</p>
                        <p className="text-xs text-amber-700 line-clamp-2">{m.Lost_Description}</p>
                        {m.Date_Lost && <p className="text-xs text-amber-600 mt-1">Lost: {new Date(m.Date_Lost).toLocaleDateString()}</p>}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3"><ScoreBadge score={m.Match_Score} /></td>
                  <td className="px-4 py-3"><span className="badge-info">{m.Match_Type}</span></td>
                  <td className="px-4 py-3"><StatusBadge status={m.Match_Status} /></td>
                  <td className="px-4 py-3 text-xs text-amber-700">
                    {m.Match_Status === 'Pending' ? (
                      <span className="italic">Awaiting verification</span>
                    ) : (
                      <>
                        <p className="font-semibold">{m.Match_Status}</p>
                        {m.Verified_By_ID && <p className="text-amber-600">✓ Verified</p>}
                      </>
                    )}
                  </td>
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

      {/* Mobile/Custom Card Views */}
      <div className={`${viewMode !== 'list' ? 'block' : 'md:hidden'} space-y-4`}>
        {loading ? (
          <div className="card p-4"><p className="text-amber-700 text-center">Loading matches...</p></div>
        ) : sortedMatches.length === 0 ? (
          <EmptyState icon={Search} title="No matches yet" description="When lost reports and found items match, they'll appear here" />
        ) : (
          sortedMatches.map(m => (
            <div key={m.Match_ID} className="card p-4 space-y-3 relative" onMouseEnter={() => setHoverMatch(m.Match_ID)} onMouseLeave={() => setHoverMatch(null)}>
              {['Staff','Admin'].includes(user.role) && (
                <div className="absolute top-4 right-4">
                  <input type="checkbox" checked={selectedMatches.has(m.Match_ID)} onChange={() => handleSelectMatch(m.Match_ID)} aria-label={`Select match ${m.Match_ID}`} />
                </div>
              )}
              {viewMode === 'sideBySide' ? (
                // Side by side view
                <div className="flex gap-3 items-stretch">
                  <div className="flex-1 flex flex-col">
                    <p className="text-xs text-amber-600 font-semibold mb-2">Found Item</p>
                    <div className="w-full h-32 bg-gray-100 rounded mb-2 flex items-center justify-center overflow-hidden" style={{ backgroundColor: 'rgba(212, 162, 78, 0.1)' }}>
                      {photos[`found-${m.Item_ID}`] ? (
                        <img src={photos[`found-${m.Item_ID}`]} alt={m.Found_Name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-8 h-8" style={{ color: 'var(--gold-500)' }} aria-hidden="true" />
                      )}
                    </div>
                    <h3 className="font-bold text-amber-950 text-sm mb-1">{m.Found_Name}</h3>
                    <p className="text-xs text-amber-700 mb-2">{m.Found_Color}</p>
                    <ScoreBadge score={m.Match_Score} />
                  </div>
                  <div className="flex items-center justify-center text-2xl font-bold" style={{ color: 'var(--gold-500)' }}>↔️</div>
                  <div className="flex-1 flex flex-col">
                    <p className="text-xs text-amber-600 font-semibold mb-2">Lost Report</p>
                    <div className="w-full h-32 bg-gray-100 rounded mb-2 flex items-center justify-center overflow-hidden" style={{ backgroundColor: 'rgba(212, 162, 78, 0.1)' }}>
                      {photos[`lost-${m.Report_ID}`] ? (
                        <img src={photos[`lost-${m.Report_ID}`]} alt={m.Lost_Name} className="w-full h-full object-cover" />
                      ) : (
                        <Search className="w-8 h-8" style={{ color: 'var(--gold-500)' }} aria-hidden="true" />
                      )}
                    </div>
                    <h3 className="font-bold text-amber-950 text-sm mb-1">{m.Lost_Name}</h3>
                    <p className="text-xs text-amber-700">{m.Reporter_Name}</p>
                  </div>
                </div>
              ) : (
                // List or column view
                <>
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <p className="text-xs text-amber-600 font-semibold">Match #{m.Match_ID}</p>
                      <h3 className="font-bold text-amber-950">{m.Found_Name}</h3>
                      <p className="text-xs text-amber-700">{m.Found_Color}</p>
                    </div>
                    <ScoreBadge score={m.Match_Score} />
                  </div>

                  <div className="border-t border-amber-100 pt-2">
                    <p className="text-xs font-semibold text-amber-900 mb-1">Matched with:</p>
                    <p className="font-medium text-amber-950">{m.Lost_Name}</p>
                    <p className="text-xs text-amber-700">{m.Reporter_Name}</p>
                  </div>
                </>
              )}

              <div className="flex gap-2 flex-wrap">
                <span className="badge-info text-xs">{m.Match_Type}</span>
                <StatusBadge status={m.Match_Status} />
                {m.Match_Status === 'Pending' ? (
                  <span className="text-xs italic text-amber-700">Awaiting verification</span>
                ) : (
                  <span className="text-xs font-semibold text-amber-600">✓ Verified</span>
                )}
              </div>

              {hoverMatch === m.Match_ID && (
                <div className="bg-amber-50 border border-amber-200 rounded p-2 text-xs space-y-1">
                  <p className="font-semibold text-amber-900">Match Preview</p>
                  {m.Found_Description && <p className="text-amber-700"><span className="font-semibold">Found:</span> {m.Found_Description.substring(0, 60)}...</p>}
                  {m.Lost_Description && <p className="text-amber-700"><span className="font-semibold">Lost:</span> {m.Lost_Description.substring(0, 60)}...</p>}
                </div>
              )}

              <div className="flex gap-2 pt-2 border-t border-amber-100">
                <button
                  onClick={() => setSelectedId(m.Match_ID)}
                  className="py-2 text-xs font-semibold text-amber-600 hover:bg-amber-50 rounded transition-colors flex-1"
                  title="View match details"
                >
                  View Details
                </button>
                {['Staff','Admin'].includes(user.role) && m.Match_Status === 'Pending' && (
                  <>
                    <button onClick={() => setConfirmDialog({ isOpen: true, matchId: m.Match_ID, action: 'confirm' })} className="py-2 text-xs font-semibold text-green-600 hover:bg-green-50 rounded flex-1" title="Confirm"><CheckCircle className="w-4 h-4 inline mr-1" />Confirm</button>
                    <button onClick={() => setConfirmDialog({ isOpen: true, matchId: m.Match_ID, action: 'reject' })} className="py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded flex-1" title="Reject"><XCircle className="w-4 h-4 inline mr-1" />Reject</button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
        <div className="px-4"><Pagination pagination={pagination} onPageChange={setPage} /></div>
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
