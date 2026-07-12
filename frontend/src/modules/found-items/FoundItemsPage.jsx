import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';
import { useToast } from '../../lib/ToastContext';
import { useDebounce } from '../../lib/useDebounce';
import { Pagination } from '../../components/ui/Pagination';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHead, Surface, StatusBadge } from '../../components/ui/kit';
import { Plus, Search, ChevronRight, Package, MapPin, Rows3, LayoutGrid } from 'lucide-react';
import FoundItemForm from './FoundItemForm';
import FoundItemDetail from './FoundItemDetail';

export default function FoundItemsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [view, setView] = useState('gallery');
  const canManage = ['Staff', 'Admin'].includes(user.role);

  const load = () => {
    setLoading(true);
    api.get('/findit-found-items', { params: { search: debouncedSearch, status, page, limit: 12 } })
      .then((r) => { setItems(r.data.data); setPagination(r.data.pagination); })
      .catch(() => toast('Failed to load found items', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [debouncedSearch, status, page]);

  const registerBtn = canManage && (
    <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: 'var(--navy-900)' }}>
      <Plus className="w-4 h-4" /> Register item
    </button>
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 py-8">
        <PageHead
          title="Found items"
          subtitle={`Items surrendered to the Office of Student Affairs${pagination ? ` · ${pagination.total} total` : ''}`}
          actions={registerBtn}
        />

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-rust-600" />
            <input className="input pl-9" placeholder="Search by name, brand, or description" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className="input" style={{ width: 'auto' }} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">Any status</option>
            {['Unclaimed', 'Matched', 'Claimed', 'Disputed', 'Disposed'].map((s) => <option key={s}>{s}</option>)}
          </select>
          <div className="flex items-center gap-1 rounded-lg p-1" style={{ border: '1px solid var(--gold-300)' }}>
            {[['gallery', LayoutGrid, 'Gallery'], ['table', Rows3, 'Table']].map(([key, Icon, label]) => (
              <button
                key={key}
                onClick={() => setView(key)}
                className="p-2 rounded transition-colors"
                style={{ backgroundColor: view === key ? 'var(--gold-500)' : 'transparent', color: view === key ? 'var(--navy-900)' : 'var(--rust-600)' }}
                title={`${label} view`}
                aria-label={`${label} view`}
                aria-pressed={view === key}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => <div key={i} className="rounded-xl h-64 skeleton" />)}
          </div>
        ) : items.length === 0 ? (
          <EmptyState icon={Package} title="No items yet" description="Items brought to the OSA will show up here." actionLabel={canManage ? 'Register first item' : undefined} onAction={canManage ? () => setShowForm(true) : undefined} />
        ) : view === 'gallery' ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((item) => (
              <Surface key={item.Item_ID} onClick={() => setSelectedId(item.Item_ID)} className="overflow-hidden p-0 cursor-pointer transition-shadow hover:shadow-md group">
                <div className="aspect-[4/3] overflow-hidden" style={{ backgroundColor: 'rgba(212,162,78,0.10)' }}>
                  {item.Photo_Path ? (
                    <img src={item.Photo_Path} alt={item.Item_Name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-rust-600">
                      <Package className="w-9 h-9 text-gold-500" aria-hidden="true" />
                      <span className="text-xs">No photo</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-navy-900 leading-snug">{item.Item_Name}</h3>
                    <StatusBadge status={item.Item_Status} />
                  </div>
                  <p className="text-xs text-rust-600 mt-1">
                    {item.Category_Name?.replace(/_/g, ' ')}{item.Item_Brand ? ` · ${item.Item_Brand}` : ''} · {item.Item_Color}
                  </p>
                  <div className="flex items-center justify-between mt-3 pt-3 text-xs text-rust-600" style={{ borderTop: '1px solid rgba(212,162,78,0.20)' }}>
                    <span className="flex items-center gap-1.5 min-w-0"><MapPin className="w-3.5 h-3.5 flex-shrink-0" /> <span className="truncate">{item.Place_Name}</span></span>
                    <span className="tabular-nums flex-shrink-0">{item.Date_Found}</span>
                  </div>
                </div>
              </Surface>
            ))}
          </div>
        ) : (
          <Surface className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[680px]">
                <thead>
                  <tr style={{ backgroundColor: 'rgba(212,162,78,0.08)', borderBottom: '1px solid var(--gold-300)' }}>
                    {['Item', 'Category', 'Details', 'Location', 'Date found', 'Status', ''].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-rust-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={item.Item_ID} onClick={() => setSelectedId(item.Item_ID)} className="cursor-pointer transition-colors hover:bg-cream-100" style={{ borderTop: i === 0 ? 'none' : '1px solid rgba(212,162,78,0.18)' }}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <span className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(212,162,78,0.14)' }}>
                            <Package className="w-4 h-4 text-gold-500" />
                          </span>
                          <span className="font-semibold text-navy-900">{item.Item_Name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-rust-600">{item.Category_Name?.replace(/_/g, ' ')}</td>
                      <td className="px-5 py-3 text-rust-600">{item.Item_Color}{item.Item_Brand ? ` · ${item.Item_Brand}` : ''}</td>
                      <td className="px-5 py-3 text-rust-600">{item.Place_Name}</td>
                      <td className="px-5 py-3 text-rust-600 tabular-nums">{item.Date_Found}</td>
                      <td className="px-5 py-3"><StatusBadge status={item.Item_Status} /></td>
                      <td className="px-5 py-3 text-right"><ChevronRight className="w-4 h-4 text-rust-600 inline" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Surface>
        )}

        {!loading && <Pagination pagination={pagination} onPageChange={setPage} />}
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Register Found Item" size="md">
        <FoundItemForm onSuccess={() => { setShowForm(false); load(); toast('Found item registered successfully', 'success'); }} onCancel={() => setShowForm(false)} />
      </Modal>

      <Modal isOpen={!!selectedId} onClose={() => setSelectedId(null)} title="Found Item Details" size="lg">
        {selectedId && <FoundItemDetail id={selectedId} onClose={() => setSelectedId(null)} onRefresh={load} />}
      </Modal>
    </div>
  );
}
