import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';
import { StatusBadge, ScoreBadge } from '../../components/ui/StatusBadge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

export default function LostReportDetail({ id, onClose, onRefresh }) {
  const { user } = useAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelOpen, setCancelOpen] = useState(false);

  useEffect(() => {
    api.get(`/findit-lost-reports/${id}`).then(r => setReport(r.data)).finally(() => setLoading(false));
  }, [id]);

  const handleCancel = async () => {
    await api.delete(`/findit-lost-reports/${id}`);
    setCancelOpen(false); onClose(); onRefresh();
  };

  if (loading) return <div className="text-center py-8 text-gray-400">Loading...</div>;
  if (!report) return <div className="text-center py-8 text-red-500">Report not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">{report.Item_Name}</h3>
          <p className="text-gray-500 text-sm">Report #{report.Report_ID} · Filed {report.Date_Filed}</p>
        </div>
        <StatusBadge status={report.Report_Status} />
      </div>

      {report.Photo_Path && <img src={report.Photo_Path} alt="Item" className="w-full max-h-48 object-contain rounded-lg border" />}

      <div className="grid grid-cols-2 gap-4 text-sm">
        {[['Category', report.Category_Name?.replace(/_/g,' ')], ['Color', report.Item_Color],
          ['Brand', report.Item_Brand||'—'], ['Size', report.Item_Size||'—'],
          ['Date Lost', report.Date_Lost], ['Location', report.Place_Name],
          ['Contact', report.Contact_Information], ['Reporter', `${report.First_Name} ${report.Last_Name}`]
        ].map(([k, v]) => (
          <div key={k}>
            <p className="text-gray-500 font-medium">{k}</p>
            <p className="text-gray-900">{v}</p>
          </div>
        ))}
        <div className="col-span-2">
          <p className="text-gray-500 font-medium">Description</p>
          <p className="text-gray-900">{report.Item_Description}</p>
        </div>
        {report.Detail_Location && <div className="col-span-2">
          <p className="text-gray-500 font-medium">Specific Location</p>
          <p className="text-gray-900">{report.Detail_Location}</p>
        </div>}
      </div>

      {report.matches?.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Potential Matches ({report.matches.length})</h4>
          <div className="space-y-2">
            {report.matches.map(m => (
              <div key={m.Match_ID} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
                <div>
                  <p className="font-medium">{m.Found_Name}</p>
                  <p className="text-gray-500 text-xs">{m.Found_Color} · {m.Found_Category} · Found at {m.Found_Location}</p>
                </div>
                <ScoreBadge score={m.Match_Score} />
              </div>
            ))}
          </div>
        </div>
      )}

      {(user.role !== 'Student' || report.User_ID === user.id) && report.Report_Status === 'Active' && (
        <div className="flex gap-3 pt-2 border-t">
          <button onClick={() => setCancelOpen(true)} className="btn-danger">Cancel Report</button>
        </div>
      )}

      <ConfirmDialog isOpen={cancelOpen} onClose={() => setCancelOpen(false)} onConfirm={handleCancel}
        title="Cancel Report" message="Are you sure you want to cancel this report?" confirmLabel="Cancel Report" danger />
    </div>
  );
}
