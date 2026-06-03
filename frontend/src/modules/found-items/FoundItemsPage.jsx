import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Pagination } from '../../components/ui/Pagination';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { TableSkeleton } from '../../components/ui/LoadingSpinner';
import { Plus, Search, Eye, Package } from 'lucide-react';
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
    <div className="p-6 max-w-7xl mx-auto min-h-screen bg-amber-50">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-amber-950">Found Items</h1>
          <p className="text-amber-700 text-sm">Items surrendered to the OSA</p>
        </div>
        {['Staff','Admin'].includes(user.role) && (
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 w-fit" aria-label="Register a new found item">
            <Plus className="w-4 h-4" /> Register Item
          </button>
        )}
      </div>

      <div className="card mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
            <input className="input pl-9" placeholder="Search by name, brand..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} aria-label="Search items" />
          </div>
          <select className="select sm:w-40" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} aria-label="Filter by status">
            <option value="">All Status</option>
            {['Unclaimed','Matched','Claimed','Disputed','Disposed'].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" role="grid" aria-label="Found items list">
            <thead className="bg-amber-50 border-b border-amber-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-amber-900">#</th>
                <th className="text-left px-4 py-3 font-medium text-amber-900">Item</th>
                <th className="text-left px-4 py-3 font-medium text-amber-900 hidden md:table-cell">Category</th>
                <th className="text-left px-4 py-3 font-medium text-amber-900 hidden md:table-cell">Date Found</th>
                <th className="text-left px-4 py-3 font-medium text-amber-900 hidden lg:table-cell">Storage</th>
                <th className="text-left px-4 py-3 font-medium text-amber-900">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100">
              {loading ? (
                <tr><td colSpan={7} className="p-0"><TableSkeleton rows={5} columns={7} /></td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={7} className="p-0"><EmptyState icon={Package} title="No items found" description="Start by registering your first found item" actionLabel="Register Item" onAction={() => setShowForm(true)} /></td></tr>
              ) : items.map(item => (
                <tr key={item.Item_ID} className="hover:bg-amber-100 transition-colors cursor-pointer">
                  <td className="px-4 py-3 text-amber-600">#{item.Item_ID}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-amber-950">{item.Item_Name}</p>
                    <p className="text-amber-700 text-xs">{item.Item_Color}{item.Item_Brand ? ` · ${item.Item_Brand}` : ''}</p>
                  </td>
                  <td className="px-4 py-3 text-amber-700 hidden md:table-cell">{item.Category_Name?.replace(/_/g,' ')}</td>
                  <td className="px-4 py-3 text-amber-700 hidden md:table-cell">{item.Date_Found}</td>
                  <td className="px-4 py-3 text-amber-700 hidden lg:table-cell">
                    {item.Section_Name || item.Storage_Type}
                    <StatusBadge status={item.Storage_Type} />
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={item.Item_Status} /></td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelectedId(item.Item_ID)}
                      className="text-amber-600 hover:text-amber-700 p-1 rounded hover:bg-amber-50 transition-colors"
                      title="View item details"
                      aria-label={`View details for ${item.Item_Name}`}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
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
