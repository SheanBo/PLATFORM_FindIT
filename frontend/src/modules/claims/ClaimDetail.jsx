import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';
import { StatusBadge } from '../../components/ui/StatusBadge';

export default function ClaimDetail({ id, onClose, onRefresh }) {
  const { user } = useAuth();
  const [claim, setClaim] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const { register, handleSubmit } = useForm();

  useEffect(() => {
    api.get(`/findit-claims/${id}`).then(r => setClaim(r.data)).finally(() => setLoading(false));
  }, [id]);

  const verify = async (data) => {
    setVerifying(true);
    try {
      await api.put(`/findit-claims/${id}/verify`, data);
      onClose(); onRefresh();
    } catch (e) { alert(e.response?.data?.error || 'Verification failed'); }
    finally { setVerifying(false); }
  };

  const acknowledge = async () => {
    await api.put(`/findit-claims/${id}/acknowledge`);
    onClose(); onRefresh();
  };

  if (loading) return <div className="text-center py-8 text-gray-400">Loading...</div>;
  if (!claim) return <div className="text-center py-8 text-red-500">Claim not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Claim #{claim.Claim_ID}</h3>
          <p className="text-gray-500 text-sm">Filed {claim.Claim_Date}</p>
        </div>
        <StatusBadge status={claim.Claim_Status} />
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div><p className="text-gray-500 font-medium">Found Item</p><p className="text-gray-900">{claim.Found_Name}</p></div>
        <div><p className="text-gray-500 font-medium">Lost Report</p><p className="text-gray-900">{claim.Lost_Name}</p></div>
        <div><p className="text-gray-500 font-medium">Category</p><p className="text-gray-900">{claim.Category_Name?.replace(/_/g,' ')}</p></div>
        <div><p className="text-gray-500 font-medium">Claimant</p><p className="text-gray-900">{claim.First_Name} {claim.Last_Name}</p></div>
        {claim.Claim_Notes && (
          <div className="col-span-2"><p className="text-gray-500 font-medium">Notes</p><p className="text-gray-900">{claim.Claim_Notes}</p></div>
        )}
        {claim.Verifier_First && (
          <div className="col-span-2">
            <p className="text-gray-500 font-medium">Verified by</p>
            <p className="text-gray-900">{claim.Verifier_First} {claim.Verifier_Last} on {claim.Verification_Date}</p>
          </div>
        )}
        {claim.Is_Disputed === 'Y' && claim.Dispute_Reason && (
          <div className="col-span-2 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-700 font-medium text-sm">Dispute Reason</p>
            <p className="text-red-600 text-sm">{claim.Dispute_Reason}</p>
          </div>
        )}
      </div>

      {['Staff','Admin'].includes(user.role) && claim.Claim_Status === 'Pending' && (
        <form onSubmit={handleSubmit(verify)} className="border-t pt-4 space-y-3">
          <h4 className="font-semibold text-gray-900">Verify Claim</h4>
          <div>
            <label className="label">Decision</label>
            <select className="input" {...register('status', { required: true })}>
              <option value="">Select</option>
              <option value="Approved">Approve — Release item to claimant</option>
              <option value="Rejected">Reject — Ownership not verified</option>
              <option value="Disputed">Mark as Disputed</option>
            </select>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={2} {...register('claim_notes')} placeholder="Verification notes..." />
          </div>
          <div>
            <label className="label">Release Date (if approved)</label>
            <input className="input" type="date" {...register('released_date')} />
          </div>
          <button type="submit" disabled={verifying} className="btn-primary w-full">{verifying ? 'Processing...' : 'Submit Decision'}</button>
        </form>
      )}

      {user.role === 'Student' && claim.Claim_Status === 'Approved' && claim.Acknowledged === 'N' && (
        <div className="border-t pt-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700 mb-3">
            Your claim has been approved. Please visit the OSA to claim your item.
          </div>
          <button onClick={acknowledge} className="btn-primary w-full">Acknowledge Receipt</button>
        </div>
      )}

      <div className="flex justify-end pt-2 border-t">
        <button onClick={onClose} className="btn-secondary">Close</button>
      </div>
    </div>
  );
}
