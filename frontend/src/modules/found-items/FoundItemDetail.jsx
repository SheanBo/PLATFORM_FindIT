import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';
import { StatusBadge, ScoreBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import ClaimForm from '../claims/ClaimForm';

export default function FoundItemDetail({ id, onClose, onRefresh }) {
  const { user } = useAuth();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showClaim, setShowClaim] = useState(false);

  useEffect(() => {
    api.get(`/findit-found-items/${id}`).then(r => setItem(r.data)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-center py-8 text-gray-400">Loading...</div>;
  if (!item) return <div className="text-center py-8 text-red-500">Item not found</div>;

  const canClaim = user.role === 'Student' && ['Unclaimed','Matched'].includes(item.Item_Status);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">{item.Item_Name}</h3>
          <p className="text-gray-500 text-sm">Item #{item.Item_ID} · Found {item.Date_Found}</p>
        </div>
        <StatusBadge status={item.Item_Status} />
      </div>

      {item.Photo_Path && <img src={item.Photo_Path} alt="Item" className="w-full max-h-48 object-contain rounded-lg border" />}

      <div className="grid grid-cols-2 gap-4 text-sm">
        {[
          ['Category', item.Category_Name?.replace(/_/g,' ')],
          ['Color', item.Item_Color],
          ['Brand', item.Item_Brand || '—'],
          ['Size', item.Item_Size || '—'],
          ['Location Found', item.Place_Name],
          ['Storage', `${item.Storage_Type} · ${item.Section_Name || '—'}`],
        ].map(([k, v]) => (
          <div key={k}><p className="text-gray-500 font-medium">{k}</p><p className="text-gray-900">{v}</p></div>
        ))}
        <div className="col-span-2">
          <p className="text-gray-500 font-medium">Description</p>
          <p className="text-gray-900">{item.Item_Description}</p>
        </div>
        {item.Detail_Location && <div className="col-span-2">
          <p className="text-gray-500 font-medium">Specific Location</p>
          <p className="text-gray-900">{item.Detail_Location}</p>
        </div>}
      </div>

      {item.matches?.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-2">Related Matches</h4>
          <div className="space-y-2">
            {item.matches.map(m => (
              <div key={m.Match_ID} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
                <span className="font-medium">{m.Lost_Name}</span>
                <ScoreBadge score={m.Match_Score} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-2 border-t">
        {canClaim && (
          <button onClick={() => setShowClaim(true)} className="btn-primary">File a Claim</button>
        )}
        <button onClick={onClose} className="btn-secondary ml-auto">Close</button>
      </div>

      <Modal isOpen={showClaim} onClose={() => setShowClaim(false)} title="File Ownership Claim" size="md">
        <ClaimForm itemId={id} onSuccess={() => { setShowClaim(false); onClose(); onRefresh(); }} onCancel={() => setShowClaim(false)} />
      </Modal>
    </div>
  );
}
