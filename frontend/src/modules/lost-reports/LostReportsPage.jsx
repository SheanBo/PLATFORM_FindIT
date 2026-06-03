import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Pagination } from '../../components/ui/Pagination';
import { Modal } from '../../components/ui/Modal';
import { Plus, Search, Eye } from 'lucide-react';
import LostReportForm from './LostReportForm';
import LostReportDetail from './LostReportDetail';

export default function LostReportsPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [reports, setReports] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const load = () => {
    setLoading(true);
    api.get('/findit-lost-reports', { params: { search, status, page, limit: 10 } })
      .then(r => { setReports(r.data.data); setPagination(r.data.pagination); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search, status, page]);

  const handleCreated = () => { setShowForm(false); load(); };

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen bg-amber-50">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-amber-950">Lost Reports</h1>
          <p className="text-amber-700 text-sm">Report and track lost items</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 w-fit">
          <Plus className="w-4 h-4" /> File Report
        </button>
      </div>

      <div className="card mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
            <input className="input pl-9" placeholder="Search by item name..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className="select sm:w-40" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            {['Active','Matched','Closed','Expired','Cancelled'].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-amber-50 border-b border-amber-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-amber-900">#</th>
                <th className="text-left px-4 py-3 font-medium text-amber-900">Item</th>
                <th className="text-left px-4 py-3 font-medium text-amber-900 hidden md:table-cell">Category</th>
                <th className="text-left px-4 py-3 font-medium text-amber-900 hidden lg:table-cell">Date Lost</th>
                {user.role !== 'Student' && <th className="text-left px-4 py-3 font-medium text-amber-900 hidden lg:table-cell">Reporter</th>}
                <th className="text-left px-4 py-3 font-medium text-amber-900">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-amber-400">Loading...</td></tr>
              ) : reports.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-amber-400">No reports found</td></tr>
              ) : reports.map(r => (
                <tr key={r.Report_ID} className="hover:bg-amber-100 transition-colors">
                  <td className="px-4 py-3 text-amber-600">#{r.Report_ID}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-amber-950">{r.Item_Name}</p>
                    <p className="text-amber-700 text-xs">{r.Item_Color}{r.Item_Brand ? ` · ${r.Item_Brand}` : ''}</p>
                  </td>
                  <td className="px-4 py-3 text-amber-700 hidden md:table-cell">{r.Category_Name}</td>
                  <td className="px-4 py-3 text-amber-700 hidden lg:table-cell">{r.Date_Lost}</td>
                  {user.role !== 'Student' && <td className="px-4 py-3 text-amber-700 hidden lg:table-cell">{r.Reporter_Name}</td>}
                  <td className="px-4 py-3"><StatusBadge status={r.Report_Status} /></td>
                  <td className="px-4 py-3">
                    <button onClick={() => setSelectedId(r.Report_ID)} className="text-amber-600 hover:text-amber-800 p-1 transition-colors"><Eye className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 pb-4"><Pagination pagination={pagination} onPageChange={setPage} /></div>
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="File a Lost Report" size="md">
        <LostReportForm onSuccess={handleCreated} onCancel={() => setShowForm(false)} />
      </Modal>

      <Modal isOpen={!!selectedId} onClose={() => setSelectedId(null)} title="Report Details" size="lg">
        {selectedId && <LostReportDetail id={selectedId} onClose={() => setSelectedId(null)} onRefresh={load} />}
      </Modal>
    </div>
  );
}
