import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '../../lib/api';

export default function ClaimForm({ itemId, onSuccess, onCancel }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors } } = useForm();

  useEffect(() => {
    api.get('/findit-lost-reports', { params: { status: 'Active', limit: 100 } })
      .then(r => setReports(r.data.data || []));
  }, []);

  const onSubmit = async (data) => {
    setLoading(true); setError('');
    try {
      await api.post('/findit-claims', { item_id: itemId, ...data });
      onSuccess();
    } catch (err) { setError(err.response?.data?.error || 'Failed to submit claim'); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
        Select your lost report that matches this found item. OSA staff will verify your ownership claim.
      </div>

      <div>
        <label className="label">Your Lost Report *</label>
        <select className="input" {...register('report_id', { required: 'Select a lost report' })}>
          <option value="">Select report</option>
          {reports.map(r => (
            <option key={r.Report_ID} value={r.Report_ID}>
              #{r.Report_ID} — {r.Item_Name} ({r.Item_Color}, {r.Date_Lost})
            </option>
          ))}
        </select>
        {errors.report_id && <p className="text-red-500 text-xs mt-1">{errors.report_id.message}</p>}
        {reports.length === 0 && <p className="text-amber-600 text-xs mt-1">No active lost reports found. File a lost report first.</p>}
      </div>

      <div>
        <label className="label">Additional Notes</label>
        <textarea className="input" rows={3} {...register('claim_notes')}
          placeholder="Provide any additional proof of ownership (e.g. serial number, unique markings, receipts)" />
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
        <button type="submit" disabled={loading || reports.length === 0} className="btn-primary flex-1">
          {loading ? 'Submitting...' : 'Submit Claim'}
        </button>
      </div>
    </form>
  );
}
