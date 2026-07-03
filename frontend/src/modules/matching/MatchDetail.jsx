import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';

export default function MatchDetail({ id, onClose, onRefresh }) {
  const { user } = useAuth();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/findit-matching/${id}`).then(r => setMatch(r.data)).finally(() => setLoading(false));
  }, [id]);

  const update = async (status) => {
    await api.put(`/findit-matching/${id}/status`, { status });
    onClose(); onRefresh();
  };

  if (loading) return <div className="text-center py-8" style={{ color: 'var(--rust-600)' }}>Loading...</div>;
  if (!match) return <div className="text-center py-8" style={{ color: 'var(--status-terracotta)' }}>Not found</div>;

  const breakdown = match.breakdown || {};
  const scorePercentage = Math.round((match.Match_Score / 100) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: 'var(--gold-300)' }}>
        <h3 className="text-lg font-bold" style={{ color: 'var(--navy-900)' }}>Match #{match.Match_ID}</h3>
        <div className="flex items-center gap-4">
          {/* Score Circle */}
          <div className="relative w-24 h-24 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--status-green)', color: 'white' }}>
            <div className="text-center">
              <div className="text-2xl font-bold">{match.Match_Score}</div>
              <div className="text-xs">/ 100</div>
            </div>
          </div>
          {/* Status */}
          <div className="text-right">
            <div className="text-xs font-semibold mb-1" style={{ color: 'var(--rust-600)' }}>Status</div>
            <div className="px-3 py-1 rounded-full text-sm font-semibold text-white" style={{ backgroundColor: match.Match_Status === 'Pending' ? 'var(--status-blue)' : match.Match_Status === 'Confirmed' ? 'var(--status-green)' : 'var(--status-terracotta)' }}>
              {match.Match_Status}
            </div>
          </div>
        </div>
      </div>

      {/* Items Comparison */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Found Item */}
        <div className="bg-white rounded-lg p-6 border" style={{ borderColor: 'var(--gold-300)' }}>
          <h4 className="font-semibold mb-4 text-sm pb-2 border-b" style={{ color: 'var(--brown-900)', borderColor: 'var(--gold-300)' }}>FOUND ITEM</h4>
          {match.Found_Photo && <img src={match.Found_Photo} alt="" className="w-full h-40 object-cover mb-4 rounded-lg" />}
          <div className="space-y-2 text-sm">
            <p className="font-bold" style={{ color: 'var(--navy-900)' }}>{match.Found_Item_Name}</p>
            <p style={{ color: 'var(--rust-600)' }}>{match.Category_Name?.replace(/_/g,' ')} · {match.Found_Color}{match.Found_Brand ? ` · ${match.Found_Brand}` : ''}</p>
            <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--gold-300)' }}>
              <p style={{ color: 'var(--rust-600)' }}>
                <span className="font-semibold">Location:</span> {match.Found_Location}
              </p>
              <p style={{ color: 'var(--rust-600)' }}>
                <span className="font-semibold">Found:</span> {match.Date_Found}
              </p>
            </div>
          </div>
        </div>

        {/* Lost Report */}
        <div className="bg-white rounded-lg p-6 border" style={{ borderColor: 'var(--gold-300)' }}>
          <h4 className="font-semibold mb-4 text-sm pb-2 border-b" style={{ color: 'var(--brown-900)', borderColor: 'var(--gold-300)' }}>LOST REPORT</h4>
          {match.Lost_Photo && <img src={match.Lost_Photo} alt="" className="w-full h-40 object-cover mb-4 rounded-lg" />}
          <div className="space-y-2 text-sm">
            <p className="font-bold" style={{ color: 'var(--navy-900)' }}>{match.Lost_Item_Name}</p>
            <p style={{ color: 'var(--rust-600)' }}>By: {match.First_Name} {match.Last_Name}</p>
            <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--gold-300)' }}>
              <p style={{ color: 'var(--rust-600)' }}>
                <span className="font-semibold">Location:</span> {match.Lost_Location}
              </p>
              <p style={{ color: 'var(--rust-600)' }}>
                <span className="font-semibold">Lost:</span> {match.Date_Lost}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="bg-white rounded-lg p-6 border" style={{ borderColor: 'var(--gold-300)' }}>
        <h4 className="font-semibold mb-4 text-sm" style={{ color: 'var(--brown-900)' }}>MATCH SCORE BREAKDOWN</h4>
        <div className="space-y-4">
          {[['Category', 'category', 20], ['Color', 'color', 15], ['Brand', 'brand', 30], ['Size', 'size', 20], ['Location', 'location', 15]].map(([label, key, max]) => (
            <div key={key}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-semibold" style={{ color: 'var(--brown-900)' }}>{label}</span>
                <span className="text-sm font-bold" style={{ color: 'var(--navy-900)' }}>{breakdown[key] || 0}/{max}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="h-2.5 rounded-full transition-all"
                  style={{
                    width: `${((breakdown[key] || 0) / max) * 100}%`,
                    backgroundColor: breakdown[key] > 0 ? 'var(--status-green)' : 'var(--gold-300)'
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t" style={{ borderColor: 'var(--gold-300)' }}>
        {['Staff', 'Admin'].includes(user.role) && match.Match_Status === 'Pending' && (
          <>
            <button onClick={() => update('Confirmed')} className="flex-1 py-3 rounded-lg font-semibold text-white transition-all" style={{ backgroundColor: 'var(--status-green)' }}>Confirm Match</button>
            <button onClick={() => update('Rejected')} className="flex-1 py-3 rounded-lg font-semibold text-white transition-all" style={{ backgroundColor: 'var(--status-terracotta)' }}>Reject Match</button>
          </>
        )}
        <button onClick={onClose} className="px-6 py-3 rounded-lg font-semibold transition-all border" style={{ color: 'var(--brown-900)', borderColor: 'var(--gold-300)', backgroundColor: 'white' }}>Close</button>
      </div>
    </div>
  );
}
