import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { Archive, AlertTriangle, Eye } from 'lucide-react';

function UsageBar({ load, capacity }) {
  const pct = capacity > 0 ? Math.round((load / capacity) * 100) : 0;
  const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-yellow-500' : 'bg-green-500';
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{load}/{capacity} items</span><span>{pct}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function StoragePage() {
  const [sections, setSections] = useState([]);
  const [expired, setExpired] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState(null);
  const [sectionDetail, setSectionDetail] = useState(null);
  const [showExpired, setShowExpired] = useState(false);
  const [tab, setTab] = useState('sections');

  useEffect(() => {
    Promise.all([
      api.get('/findit-storage'),
      api.get('/findit-storage/expired/items'),
    ]).then(([s, e]) => { setSections(s.data.data); setExpired(e.data.data); })
      .finally(() => setLoading(false));
  }, []);

  const loadSection = (id) => {
    api.get(`/findit-storage/${id}`).then(r => { setSectionDetail(r.data); setSelectedSection(id); });
  };

  const lockers = sections.filter(s => s.Storage_Type === 'Locker');
  const safes = sections.filter(s => s.Storage_Type === 'Office_Safe');

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Storage</h1>
          <p className="text-gray-500 text-sm">OSA storage sections and item tracking</p>
        </div>
        {expired.length > 0 && (
          <button onClick={() => setShowExpired(true)} className="flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-200 w-fit">
            <AlertTriangle className="w-4 h-4" /> {expired.length} Expired Items
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-6">
        {['sections','lockers','safes'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${tab === t ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'}`}>
            {t}
          </button>
        ))}
      </div>

      {loading ? <div className="text-center py-8 text-gray-400">Loading...</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(tab === 'lockers' ? lockers : tab === 'safes' ? safes : sections).map(s => (
            <div key={s.Section_ID} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.Storage_Type === 'Office_Safe' ? 'bg-purple-100' : 'bg-blue-100'}`}>
                    <Archive className={`w-4 h-4 ${s.Storage_Type === 'Office_Safe' ? 'text-purple-600' : 'text-blue-600'}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{s.Section_Name}</p>
                    <StatusBadge status={s.Storage_Type} />
                  </div>
                </div>
                <button onClick={() => loadSection(s.Section_ID)} className="text-blue-600 hover:text-blue-800 p-1">
                  <Eye className="w-4 h-4" />
                </button>
              </div>
              <UsageBar load={s.Actual_Load ?? s.Current_Load} capacity={s.Capacity} />
              <p className="text-xs text-gray-500 mt-2">{s.Usage_Percent}% capacity used</p>
            </div>
          ))}
        </div>
      )}

      {/* Section detail modal */}
      <Modal isOpen={!!selectedSection} onClose={() => setSelectedSection(null)} title={sectionDetail?.Section_Name || 'Section'} size="lg">
        {sectionDetail && (
          <div className="space-y-4">
            <div className="flex gap-4 text-sm">
              <div className="card flex-1 text-center p-3">
                <p className="text-2xl font-bold">{sectionDetail.item_count}</p>
                <p className="text-gray-500">Items stored</p>
              </div>
              <div className="card flex-1 text-center p-3">
                <p className="text-2xl font-bold">{sectionDetail.Capacity}</p>
                <p className="text-gray-500">Capacity</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Item</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Category</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Days Stored</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sectionDetail.items?.length === 0 && (
                    <tr><td colSpan={4} className="text-center py-4 text-gray-400">No items stored</td></tr>
                  )}
                  {sectionDetail.items?.map(item => (
                    <tr key={item.Item_ID} className={item.Days_Stored > 30 ? 'bg-red-50' : ''}>
                      <td className="px-3 py-2">
                        <p className="font-medium text-gray-900">{item.Item_Name}</p>
                        <p className="text-gray-500 text-xs">{item.Item_Color}{item.Item_Brand ? ` · ${item.Item_Brand}` : ''}</p>
                      </td>
                      <td className="px-3 py-2 text-gray-600">{item.Category_Name?.replace(/_/g,' ')}</td>
                      <td className="px-3 py-2">
                        <span className={item.Days_Stored > 30 ? 'text-red-600 font-medium' : 'text-gray-600'}>
                          {item.Days_Stored}d
                        </span>
                      </td>
                      <td className="px-3 py-2"><StatusBadge status={item.Item_Status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>

      {/* Expired items modal */}
      <Modal isOpen={showExpired} onClose={() => setShowExpired(false)} title={`Expired Items (${expired.length})`} size="lg">
        <div className="space-y-3">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            These items have been stored for more than 30 days without being claimed.
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">#</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">Item</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">Category</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">Days</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {expired.map(e => (
                  <tr key={e.Item_ID}>
                    <td className="px-3 py-2 text-gray-400">#{e.Item_ID}</td>
                    <td className="px-3 py-2"><p className="font-medium">{e.Item_Name}</p><p className="text-xs text-gray-500">{e.Item_Color}</p></td>
                    <td className="px-3 py-2 text-gray-600">{e.Category_Name?.replace(/_/g,' ')}</td>
                    <td className="px-3 py-2 text-red-600 font-semibold">{e.Days_Unclaimed}d</td>
                    <td className="px-3 py-2 text-gray-600">{e.Storage_Location || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>
    </div>
  );
}
