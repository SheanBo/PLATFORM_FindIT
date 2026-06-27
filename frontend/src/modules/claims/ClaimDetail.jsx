import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';

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

  if (loading) return <div className="text-center py-8" style={{ color: 'var(--rust-600)' }}>Loading...</div>;
  if (!claim) return <div className="text-center py-8" style={{ color: 'var(--status-terracotta)' }}>Claim not found</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg p-6 border" style={{ borderColor: 'var(--gold-300)' }}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold" style={{ color: 'var(--navy-900)' }}>Verify Claim #{claim.Claim_ID}</h3>
            <p className="text-sm mt-1" style={{ color: 'var(--rust-600)' }}>Filed {claim.Claim_Date}</p>
          </div>
          <div className="px-4 py-2 rounded-full text-sm font-semibold text-white" style={{ backgroundColor: claim.Claim_Status === 'Pending' ? 'var(--status-blue)' : claim.Claim_Status === 'Approved' ? 'var(--status-green)' : 'var(--status-terracotta)' }}>
            {claim.Claim_Status}
          </div>
        </div>

        {/* Claimant Info - Highlighted */}
        <div className="p-4 rounded-lg mb-4" style={{ backgroundColor: 'rgba(212, 162, 78, 0.2)', borderLeft: '4px solid var(--gold-500)' }}>
          <p className="text-xs font-semibold mb-1" style={{ color: 'var(--rust-600)' }}>CLAIMANT</p>
          <p className="text-lg font-bold" style={{ color: 'var(--navy-900)' }}>{claim.First_Name} {claim.Last_Name}</p>
        </div>

        {/* Items Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p style={{ color: 'var(--rust-600)' }} className="text-xs font-semibold mb-1">FOUND ITEM</p>
            <p style={{ color: 'var(--navy-900)' }} className="font-semibold">{claim.Found_Name}</p>
          </div>
          <div>
            <p style={{ color: 'var(--rust-600)' }} className="text-xs font-semibold mb-1">LOST REPORT</p>
            <p style={{ color: 'var(--navy-900)' }} className="font-semibold">{claim.Lost_Name}</p>
          </div>
          <div>
            <p style={{ color: 'var(--rust-600)' }} className="text-xs font-semibold mb-1">CATEGORY</p>
            <p style={{ color: 'var(--navy-900)' }}>{claim.Category_Name?.replace(/_/g,' ')}</p>
          </div>
          <div>
            <p style={{ color: 'var(--rust-600)' }} className="text-xs font-semibold mb-1">MATCH SCORE</p>
            <p style={{ color: 'var(--navy-900)' }} className="font-semibold">{claim.Match_Score || 'N/A'} / 100</p>
          </div>
        </div>
      </div>

      {/* Photos Comparison */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-4 border" style={{ borderColor: 'var(--gold-300)' }}>
          <p className="text-xs font-semibold mb-3" style={{ color: 'var(--rust-600)' }}>FOUND ITEM</p>
          <div className="w-full h-40 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
            <p style={{ color: 'var(--rust-600)' }}>found item photo</p>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border" style={{ borderColor: 'var(--gold-300)' }}>
          <p className="text-xs font-semibold mb-3" style={{ color: 'var(--rust-600)' }}>REPORTED ITEM</p>
          <div className="w-full h-40 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
            <p style={{ color: 'var(--rust-600)' }}>reported item photo</p>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      {claim.Claim_Notes && (
        <div className="bg-white rounded-lg p-6 border" style={{ borderColor: 'var(--gold-300)' }}>
          <p style={{ color: 'var(--brown-900)' }} className="font-semibold mb-2">Notes</p>
          <p style={{ color: 'var(--rust-600)' }} className="text-sm">{claim.Claim_Notes}</p>
        </div>
      )}

      {claim.Is_Disputed === 'Y' && claim.Dispute_Reason && (
        <div className="bg-white rounded-lg p-6 border" style={{ borderColor: 'var(--status-terracotta)', borderLeftWidth: '4px' }}>
          <p style={{ color: 'var(--status-terracotta)' }} className="font-semibold mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4" aria-hidden="true" /> Dispute Reason</p>
          <p style={{ color: 'var(--status-terracotta)' }} className="text-sm">{claim.Dispute_Reason}</p>
        </div>
      )}

      {/* Verification Section */}
      {['Staff', 'Admin'].includes(user.role) && claim.Claim_Status === 'Pending' && (
        <form onSubmit={handleSubmit(verify)} className="bg-white rounded-lg p-6 border space-y-4" style={{ borderColor: 'var(--gold-300)' }}>
          <h4 className="font-bold" style={{ color: 'var(--brown-900)' }}>Verification Decision</h4>

          <div>
            <label className="label mb-2">Decision</label>
            <select className="input" {...register('status', { required: true })} style={{ borderColor: 'var(--gold-300)' }}>
              <option value="">Select decision</option>
              <option value="Approved">Approve — Release to claimant</option>
              <option value="Rejected">Reject — Not verified</option>
              <option value="Disputed">Mark as Disputed</option>
            </select>
          </div>

          <div>
            <label className="label mb-2">Notes</label>
            <textarea className="input" rows={2} {...register('claim_notes')} placeholder="Verification notes..." style={{ borderColor: 'var(--gold-300)' }} />
          </div>

          <div>
            <label className="label mb-2">Release Date (if approved)</label>
            <input className="input" type="date" {...register('released_date')} style={{ borderColor: 'var(--gold-300)' }} />
          </div>

          <button type="submit" disabled={verifying} className="w-full py-3 rounded-lg font-semibold text-white transition-all" style={{ backgroundColor: 'var(--status-green)' }}>
            {verifying ? 'Processing...' : 'Submit Decision'}
          </button>
        </form>
      )}

      {/* Student Acknowledgement */}
      {user.role === 'Student' && claim.Claim_Status === 'Approved' && claim.Acknowledged === 'N' && (
        <div className="bg-white rounded-lg p-6 border space-y-3" style={{ borderColor: 'var(--status-green)', borderLeftWidth: '4px' }}>
          <p style={{ color: 'var(--status-green)' }} className="font-semibold flex items-center gap-2"><CheckCircle className="w-4 h-4" aria-hidden="true" /> Claim Approved</p>
          <p style={{ color: 'var(--rust-600)' }} className="text-sm">Your claim has been approved. Please visit the OSA to claim your item.</p>
          <button onClick={acknowledge} className="w-full py-3 rounded-lg font-semibold text-white transition-all" style={{ backgroundColor: 'var(--status-green)' }}>Acknowledge Receipt</button>
        </div>
      )}

      {/* Close Button */}
      <div className="flex justify-end pt-4 border-t" style={{ borderColor: 'var(--gold-300)' }}>
        <button onClick={onClose} className="px-6 py-3 rounded-lg font-semibold transition-all border" style={{ color: 'var(--brown-900)', borderColor: 'var(--gold-300)', backgroundColor: 'white' }}>Close</button>
      </div>
    </div>
  );
}
