import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Pagination } from '../../components/ui/Pagination';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { TableSkeleton } from '../../components/ui/LoadingSpinner';
import { Eye, CheckCircle, XCircle, FileText } from 'lucide-react';
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
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, claimId: null, action: null });

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
    <div className="p-6 max-w-7xl mx-auto min-h-screen bg-amber-50">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-amber-950">Claims</h1>
          <p className="text-amber-700 text-sm">Ownership claim management</p>
        </div>
      </div>

      <div className="card mb-4">
        <select className="select sm:w-40" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} aria-label="Filter claims by status">
          <option value="">All Status</option>
          {['Pending','Approved','Rejected','Disputed'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" role="grid" aria-label="Claims list">
            <thead className="bg-amber-50 border-b border-amber-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-amber-900">#</th>
                <th className="text-left px-4 py-3 font-medium text-amber-900">Item</th>
                <th className="text-left px-4 py-3 font-medium text-amber-900 hidden md:table-cell">Claimant</th>
                <th className="text-left px-4 py-3 font-medium text-amber-900 hidden md:table-cell">Date</th>
                <th className="text-left px-4 py-3 font-medium text-amber-900">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100">
              {loading ? (
                <tr><td colSpan={6} className="p-0"><TableSkeleton rows={5} columns={6} /></td></tr>
              ) : claims.length === 0 ? (
                <tr><td colSpan={6} className="p-0"><EmptyState icon={FileText} title="No claims found" description="Claim requests will appear here" /></td></tr>
              ) : claims.map(c => (
                <tr key={c.Claim_ID} className="hover:bg-amber-100 transition-colors cursor-pointer">
                  <td className="px-4 py-3 text-amber-600">#{c.Claim_ID}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-amber-950">{c.Found_Name}</p>
                    <p className="text-amber-700 text-xs">{c.Found_Color} · {c.Category_Name?.replace(/_/g,' ')}</p>
                  </td>
                  <td className="px-4 py-3 text-amber-700 hidden md:table-cell">{c.Claimant_Name}</td>
                  <td className="px-4 py-3 text-amber-700 hidden md:table-cell">{c.Claim_Date}</td>
                  <td className="px-4 py-3"><StatusBadge status={c.Claim_Status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setSelectedId(c.Claim_ID)}
                        className="text-amber-600 hover:text-amber-700 p-1 rounded hover:bg-amber-50 transition-colors"
                        title="View claim details"
                        aria-label={`View details for claim ${c.Claim_ID}`}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {['Staff','Admin'].includes(user.role) && c.Claim_Status === 'Pending' && (
                        <>
                          <button onClick={() => setConfirmDialog({ isOpen: true, claimId: c.Claim_ID, action: 'approve' })} className="text-amber-600 hover:text-amber-700 p-1 rounded hover:bg-amber-50" title="Approve" aria-label="Approve claim"><CheckCircle className="w-4 h-4" /></button>
                          <button onClick={() => setConfirmDialog({ isOpen: true, claimId: c.Claim_ID, action: 'reject' })} className="text-amber-600 hover:text-amber-700 p-1 rounded hover:bg-amber-50" title="Reject" aria-label="Reject claim"><XCircle className="w-4 h-4" /></button>
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

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.action === 'approve' ? 'Approve Claim?' : 'Reject Claim?'}
        message={confirmDialog.action === 'approve' ? 'This claim will be marked as approved.' : 'This claim will be marked as rejected.'}
        confirmText={confirmDialog.action === 'approve' ? 'Approve' : 'Reject'}
        cancelText="Cancel"
        onConfirm={() => {
          verify(confirmDialog.claimId, confirmDialog.action === 'approve' ? 'Approved' : 'Rejected', confirmDialog.action === 'approve' ? 'Verified by staff' : 'Rejected by staff');
          setConfirmDialog({ isOpen: false, claimId: null, action: null });
        }}
        onCancel={() => setConfirmDialog({ isOpen: false, claimId: null, action: null })}
        variant={confirmDialog.action === 'reject' ? 'danger' : 'default'}
      />
    </div>
  );
}
