import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Pagination } from '../../components/ui/Pagination';
import { Modal } from '../../components/ui/Modal';
import { Plus, Search, Eye } from 'lucide-react';
import FoundItemForm from './FoundItemForm';
import FoundItemDetail from './FoundItemDetail';

export default function FoundItemsPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const load = () => {
    setLoading(true);
    api.get('/findit-found-items', { params: { search, status, page, limit: 10 } })
      .then(r => { setItems(r.data.data); setPagination(r.data.pagination); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search, status, page]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Found Items</h1>
          <p className="text-gray-500 text-sm">Items surrendered to the OSA</p>
        </div>
        {['Staff','Admin'].includes(user.role) && (
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 w-fit">
            <Plus className="w-4 h-4" /> Register Item
          </button>
        )}
      </div>

      <div className="card mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input className="input pl-9" placeholder="Search by name, brand..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className="input sm:w-40" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            {['Unclaimed','Matched','Claimed','Disputed','Disposed'].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">#</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Item</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Category</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Date Found</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Storage</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">Loading...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">No items found</td></tr>
              ) : items.map(item => (
                <tr key={item.Item_ID} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400">#{item.Item_ID}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{item.Item_Name}</p>
                    <p className="text-gray-500 text-xs">{item.Item_Color}{item.Item_Brand ? ` · ${item.Item_Brand}` : ''}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{item.Category_Name?.replace(/_/g,' ')}</td>
                  <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{item.Date_Found}</td>
                  <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">
                    {item.Section_Name || item.Storage_Type}
                    <StatusBadge status={item.Storage_Type} />
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={item.Item_Status} /></td>
                  <td className="px-4 py-3">
                    <button onClick={() => setSelectedId(item.Item_ID)} className="text-blue-600 hover:text-blue-800 p-1"><Eye className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 pb-4"><Pagination pagination={pagination} onPageChange={setPage} /></div>
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Register Found Item" size="md">
        <FoundItemForm onSuccess={() => { setShowForm(false); load(); }} onCancel={() => setShowForm(false)} />
      </Modal>

      <Modal isOpen={!!selectedId} onClose={() => setSelectedId(null)} title="Found Item Details" size="lg">
        {selectedId && <FoundItemDetail id={selectedId} onClose={() => setSelectedId(null)} onRefresh={load} />}
      </Modal>
    </div>
  );
}
