import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Pagination } from '../../components/ui/Pagination';
import { Modal } from '../../components/ui/Modal';
import { Eye, CheckCircle, XCircle } from 'lucide-react';
import ClaimDetail from './ClaimDetail';

export default function ClaimsPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [claims, setClaims] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);

  const load = () => {
    setLoading(true);
    api.get('/findit-claims', { params: { status, page, limit: 10 } })
      .then(r => { setClaims(r.data.data); setPagination(r.data.pagination); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [status, page]);

  const verify = async (id, status, notes) => {
    await api.put(`/findit-claims/${id}/verify`, { status, claim_notes: notes });
    load();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Claims</h1>
          <p className="text-gray-500 text-sm">Ownership claim management</p>
        </div>
      </div>

      <div className="card mb-4">
        <select className="input sm:w-40" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          {['Pending','Approved','Rejected','Disputed'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">#</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Item</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Claimant</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">Loading...</td></tr>
              ) : claims.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">No claims found</td></tr>
              ) : claims.map(c => (
                <tr key={c.Claim_ID} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400">#{c.Claim_ID}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{c.Found_Name}</p>
                    <p className="text-gray-500 text-xs">{c.Found_Color} · {c.Category_Name?.replace(/_/g,' ')}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{c.Claimant_Name}</td>
                  <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{c.Claim_Date}</td>
                  <td className="px-4 py-3"><StatusBadge status={c.Claim_Status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setSelectedId(c.Claim_ID)} className="text-blue-600 hover:text-blue-800 p-1"><Eye className="w-4 h-4" /></button>
                      {['Staff','Admin'].includes(user.role) && c.Claim_Status === 'Pending' && (
                        <>
                          <button onClick={() => verify(c.Claim_ID, 'Approved', 'Verified by staff')} className="text-green-600 hover:text-green-800 p-1" title="Approve"><CheckCircle className="w-4 h-4" /></button>
                          <button onClick={() => verify(c.Claim_ID, 'Rejected', 'Rejected by staff')} className="text-red-600 hover:text-red-800 p-1" title="Reject"><XCircle className="w-4 h-4" /></button>
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

      <Modal isOpen={!!selectedId} onClose={() => setSelectedId(null)} title="Claim Details" size="md">
        {selectedId && <ClaimDetail id={selectedId} onClose={() => setSelectedId(null)} onRefresh={load} />}
      </Modal>
    </div>
  );
}
