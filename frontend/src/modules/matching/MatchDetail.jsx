import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';
import { StatusBadge, ScoreBadge } from '../../components/ui/StatusBadge';

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

  if (loading) return <div className="text-center py-8 text-gray-400">Loading...</div>;
  if (!match) return <div className="text-center py-8 text-red-500">Not found</div>;

  const breakdown = match.breakdown || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">Match #{match.Match_ID}</h3>
        <div className="flex items-center gap-3">
          <ScoreBadge score={match.Match_Score} />
          <StatusBadge status={match.Match_Status} />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <h4 className="font-semibold text-green-800 mb-3 text-sm">✅ Found Item</h4>
          {match.Found_Photo && <img src={match.Found_Photo} alt="" className="w-full h-32 object-contain mb-3 rounded" />}
          <div className="space-y-1 text-sm">
            <p className="font-medium text-gray-900">{match.Found_Item_Name}</p>
            <p className="text-gray-600">{match.Category_Name?.replace(/_/g,' ')}</p>
            <p className="text-gray-600">Color: {match.Found_Color}</p>
            {match.Found_Brand && <p className="text-gray-600">Brand: {match.Found_Brand}</p>}
            <p className="text-gray-600">Location: {match.Found_Location}</p>
            <p className="text-gray-600">Found: {match.Date_Found}</p>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h4 className="font-semibold text-blue-800 mb-3 text-sm">🔍 Lost Report</h4>
          {match.Lost_Photo && <img src={match.Lost_Photo} alt="" className="w-full h-32 object-contain mb-3 rounded" />}
          <div className="space-y-1 text-sm">
            <p className="font-medium text-gray-900">{match.Lost_Item_Name}</p>
            <p className="text-gray-600">Color: {match.Lost_Color}</p>
            {match.Lost_Brand && <p className="text-gray-600">Brand: {match.Lost_Brand}</p>}
            <p className="text-gray-600">Location: {match.Lost_Location}</p>
            <p className="text-gray-600">Lost: {match.Date_Lost}</p>
            <p className="text-gray-600">Reporter: {match.First_Name} {match.Last_Name}</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-4">
        <h4 className="font-semibold text-gray-900 mb-3 text-sm">Score Breakdown</h4>
        <div className="space-y-2">
          {[['Category','category',40], ['Color','color',20], ['Brand','brand',20], ['Size','size',10], ['Location','location',10]].map(([label, key, max]) => (
            <div key={key} className="flex items-center gap-3 text-sm">
              <span className="w-20 text-gray-600">{label}</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div className={`h-2 rounded-full ${breakdown[key] > 0 ? 'bg-green-500' : 'bg-gray-300'}`}
                  style={{ width: `${((breakdown[key] || 0) / max) * 100}%` }} />
              </div>
              <span className="w-16 text-right font-medium">{breakdown[key] || 0}/{max}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t flex justify-between font-semibold">
          <span>Total Score</span>
          <span>{match.Match_Score}/100</span>
        </div>
      </div>

      <div className="flex gap-3 pt-2 border-t">
        {['Staff','Admin'].includes(user.role) && match.Match_Status === 'Pending' && (
          <>
            <button onClick={() => update('Confirmed')} className="btn-primary">Confirm Match</button>
            <button onClick={() => update('Rejected')} className="btn-danger">Reject Match</button>
          </>
        )}
        <button onClick={onClose} className="btn-secondary ml-auto">Close</button>
      </div>
    </div>
  );
}
