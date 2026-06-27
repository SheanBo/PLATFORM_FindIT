import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';
import { Pagination } from '../../components/ui/Pagination';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHead, Surface, StatusBadge } from '../../components/ui/kit';
import { ChevronRight, CheckCircle2, XCircle, ClipboardCheck } from 'lucide-react';
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
  const canManage = ['Staff', 'Admin'].includes(user.role);

  const load = () => {
    setLoading(true);
    api.get('/findit-claims', { params: { status, page, limit: 10 } })
      .then((r) => { setClaims(r.data.data); setPagination(r.data.pagination); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [status, page]);

  const verify = async (id, decision, notes) => {
    await api.put(`/findit-claims/${id}/verify`, { status: decision, claim_notes: notes });
    load();
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 py-8">
        <PageHead title="Claims" subtitle="Ownership claim verification" />

        <div className="mb-4">
          <select className="input" style={{ width: 'auto' }} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Filter claims by status">
            <option value="">All statuses</option>
            {['Pending', 'Approved', 'Rejected', 'Disputed'].map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="grid gap-3">{[...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-xl skeleton" />)}</div>
        ) : claims.length === 0 ? (
          <EmptyState icon={CheckCircle2} title="All clear" description="No claims to show for this filter." />
        ) : (
          <Surface className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr style={{ backgroundColor: 'rgba(212,162,78,0.08)', borderBottom: '1px solid var(--gold-300)' }}>
                    {['Item claimed', 'Claimant', 'Filed', 'Verified by', 'Status', ''].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-rust-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {claims.map((c, i) => (
                    <tr key={c.Claim_ID} onClick={() => setSelectedId(c.Claim_ID)} className="cursor-pointer transition-colors hover:bg-cream-100" style={{ borderTop: i === 0 ? 'none' : '1px solid rgba(212,162,78,0.18)' }}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <span className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(212,162,78,0.14)' }}>
                            <ClipboardCheck className="w-4 h-4 text-gold-500" />
                          </span>
                          <div>
                            <p className="font-semibold text-navy-900">{c.Found_Name}</p>
                            <p className="text-xs text-rust-600">{c.Found_Color} · {c.Category_Name?.replace(/_/g, ' ')}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-rust-600">{c.Claimant_Name}</td>
                      <td className="px-5 py-3 text-rust-600 tabular-nums">{c.Claim_Date}</td>
                      <td className="px-5 py-3 text-rust-600">{c.Verifier_Name || '—'}</td>
                      <td className="px-5 py-3"><StatusBadge status={c.Claim_Status} /></td>
                      <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {canManage && c.Claim_Status === 'Pending' && (
                            <>
                              <button onClick={() => setConfirmDialog({ isOpen: true, claimId: c.Claim_ID, action: 'approve' })} className="p-1.5 rounded hover:bg-cream-100" title="Approve" aria-label="Approve claim" style={{ color: 'var(--status-green)' }}>
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                              <button onClick={() => setConfirmDialog({ isOpen: true, claimId: c.Claim_ID, action: 'reject' })} className="p-1.5 rounded hover:bg-cream-100" title="Reject" aria-label="Reject claim" style={{ color: 'var(--status-terracotta)' }}>
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <ChevronRight className="w-4 h-4 text-rust-600" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3" style={{ borderTop: '1px solid rgba(212,162,78,0.18)' }}>
              <Pagination pagination={pagination} onPageChange={setPage} />
            </div>
          </Surface>
        )}
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
