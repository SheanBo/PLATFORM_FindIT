import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Pagination } from '../../components/ui/Pagination';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { Plus, Search, Eye, Package, MapPin } from 'lucide-react';
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
    api.get('/findit-found-items', { params: { search, status, page, limit: 12 } })
      .then(r => { setItems(r.data.data); setPagination(r.data.pagination); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search, status, page]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--cream-100)' }}>
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40" style={{ borderColor: 'var(--gold-300)' }}>
        <div className="p-6 max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--brown-900)' }}>Found Items</h1>
              <p style={{ color: 'var(--rust-600)' }}>Items surrendered to the OSA</p>
            </div>
            {['Staff','Admin'].includes(user.role) && (
              <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 w-fit">
                <Plus className="w-4 h-4" /> Register Item
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto">
        {/* Filters */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--rust-600)' }} />
              <input className="input pl-9" placeholder="Search by name, brand..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ borderColor: 'var(--gold-300)' }} />
            </div>
            <select className="select sm:w-40" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} style={{ borderColor: 'var(--gold-300)' }}>
              <option value="">All Status</option>
              {['Unclaimed','Matched','Claimed','Disputed','Disposed'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Grid Layout */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg h-72 skeleton" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState icon={Package} title="No items found" description="Start by registering your first found item" actionLabel="Register Item" onAction={() => setShowForm(true)} />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map(item => (
                <div
                  key={item.Item_ID}
                  onClick={() => setSelectedId(item.Item_ID)}
                  className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer transform hover:scale-105"
                >
                  {/* Item Image */}
                  <div className="w-full h-48 bg-gray-100 flex items-center justify-center" style={{ backgroundColor: 'rgba(212, 162, 78, 0.1)' }}>
                    <Package className="w-12 h-12" style={{ color: 'var(--gold-500)' }} />
                  </div>

                  {/* Item Info */}
                  <div className="p-4">
                    {/* Name */}
                    <h3 className="font-bold text-sm mb-1" style={{ color: 'var(--navy-900)' }}>
                      {item.Item_Name}
                    </h3>

                    {/* Details */}
                    <p className="text-xs mb-3" style={{ color: 'var(--rust-600)' }}>
                      {item.Item_Color}{item.Item_Brand ? ` · ${item.Item_Brand}` : ''}
                    </p>

                    {/* Location */}
                    <div className="flex items-center gap-1 mb-3" style={{ color: 'var(--rust-600)' }}>
                      <MapPin className="w-3 h-3" />
                      <span className="text-xs">{item.Place_Name}</span>
                    </div>

                    {/* Status Badge */}
                    <div className="flex justify-between items-center">
                      <StatusBadge status={item.Item_Status} />
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedId(item.Item_ID); }}
                        className="p-2 rounded hover:opacity-80 transition-opacity"
                        style={{ color: 'var(--navy-900)' }}
                        title="View item details"
                        aria-label={`View details for ${item.Item_Name}`}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.total > pagination.limit && (
              <div className="mt-8 flex justify-center">
                <Pagination
                  currentPage={page}
                  totalPages={pagination.pages}
                  onPageChange={setPage}
                />
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
