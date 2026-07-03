import { useState, useEffect } from 'react';
import { Search, Package, FileText, MapPin, Palette, Ruler } from 'lucide-react';
import api from '../../lib/api';
import { Link } from 'react-router-dom';
import { PageHead, Surface, SectionLabel, StatusBadge, Badge } from '../../components/ui/kit';

const COLORS = ['Black', 'White', 'Gray', 'Brown', 'Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Purple', 'Pink', 'Gold', 'Silver', 'Multicolor'];

export default function AdvancedSearchPage() {
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    searchTerm: '', category: '', color: '', status: '', dateFrom: '', dateTo: '', location: '', itemType: 'all',
  });

  useEffect(() => {
    Promise.all([api.get('/findit-dashboard/categories'), api.get('/findit-dashboard/locations')])
      .then(([c, l]) => { setCategories(c.data.data); setLocations(l.data.data); });
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSearchPerformed(true);
    setError('');
    try {
      const [lostRes, foundRes] = await Promise.all([
        api.get('/findit-lost-reports', { params: { limit: 100 } }),
        api.get('/findit-found-items', { params: { limit: 100 } }),
      ]);
      const lostItems = lostRes.data?.data || [];
      const foundItems = foundRes.data?.data || [];

      const applyFilters = (items, isLost) => items.filter((item) => {
        const name = (item.Item_Name || '').toLowerCase();
        const desc = (item.Item_Description || '').toLowerCase();
        const term = filters.searchTerm.toLowerCase();
        if (term && !name.includes(term) && !desc.includes(term)) return false;
        if (filters.category && item.Category_ID != filters.category) return false;
        if (filters.color && item.Item_Color !== filters.color) return false;
        if (filters.location && item.Location_ID != filters.location) return false;
        if (!isLost && filters.status && item.Item_Status !== filters.status) return false;
        const itemDate = new Date(isLost ? item.Date_Lost : item.Date_Found);
        if (filters.dateFrom && itemDate < new Date(filters.dateFrom)) return false;
        if (filters.dateTo && itemDate > new Date(filters.dateTo)) return false;
        return true;
      });

      let out = [];
      if (filters.itemType === 'lost' || filters.itemType === 'all') {
        out = out.concat(applyFilters(lostItems, true).map((i) => ({ ...i, type: 'Lost', link: '/lost-reports' })));
      }
      if (filters.itemType === 'found' || filters.itemType === 'all') {
        out = out.concat(applyFilters(foundItems, false).map((i) => ({ ...i, type: 'Found', link: '/found-items' })));
      }
      setResults(out);
    } catch (err) {
      setError(err.response?.data?.error || 'Search failed. Please try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 py-8">
        <PageHead title="Search" subtitle="Find lost or found items with detailed filters" />

        {/* Search panel */}
        <Surface className="p-5 mb-4">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-rust-600" />
              <input className="input pl-9" name="searchTerm" value={filters.searchTerm} onChange={handleFilterChange} placeholder="Describe the item — e.g. black leather wallet" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <SectionLabel className="mb-1.5">Type</SectionLabel>
                <select className="input" name="itemType" value={filters.itemType} onChange={handleFilterChange}>
                  <option value="all">Everything</option>
                  <option value="found">Found items</option>
                  <option value="lost">Lost reports</option>
                </select>
              </div>
              <div>
                <SectionLabel className="mb-1.5">Category</SectionLabel>
                <select className="input" name="category" value={filters.category} onChange={handleFilterChange}>
                  <option value="">Any</option>
                  {categories.map((c) => <option key={c.Category_ID} value={c.Category_ID}>{c.Category_Name.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div>
                <SectionLabel className="mb-1.5">Color</SectionLabel>
                <select className="input" name="color" value={filters.color} onChange={handleFilterChange}>
                  <option value="">Any</option>
                  {COLORS.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <SectionLabel className="mb-1.5">Location</SectionLabel>
                <select className="input" name="location" value={filters.location} onChange={handleFilterChange}>
                  <option value="">Any</option>
                  {locations.map((l) => <option key={l.Location_ID} value={l.Location_ID}>{l.Place_Name}</option>)}
                </select>
              </div>
              <div>
                <SectionLabel className="mb-1.5">Status</SectionLabel>
                <select className="input" name="status" value={filters.status} onChange={handleFilterChange}>
                  <option value="">Any</option>
                  <option value="Unclaimed">Unclaimed</option>
                  <option value="Matched">Matched</option>
                  <option value="Claimed">Claimed</option>
                </select>
              </div>
              <div className="col-span-2 sm:col-span-1 grid grid-cols-2 gap-2">
                <div>
                  <SectionLabel className="mb-1.5">From</SectionLabel>
                  <input type="date" className="input" name="dateFrom" value={filters.dateFrom} onChange={handleFilterChange} />
                </div>
                <div>
                  <SectionLabel className="mb-1.5">To</SectionLabel>
                  <input type="date" className="input" name="dateTo" value={filters.dateTo} onChange={handleFilterChange} />
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60" style={{ backgroundColor: 'var(--navy-900)' }}>
              <Search className="w-4 h-4" /> {loading ? 'Searching…' : 'Search'}
            </button>
          </form>
        </Surface>

        {error && (
          <div role="alert" className="mb-4 p-4 rounded-lg text-sm" style={{ backgroundColor: 'rgba(210,105,30,0.08)', color: 'var(--status-terracotta)', border: '1px solid var(--status-terracotta)' }}>
            {error}
          </div>
        )}

        {searchPerformed && (
          <>
            <div className="flex items-center justify-between mb-3">
              <SectionLabel>{results.length} result{results.length === 1 ? '' : 's'}{filters.searchTerm ? ` for “${filters.searchTerm}”` : ''}</SectionLabel>
            </div>

            {results.length === 0 ? (
              <Surface className="p-12 text-center">
                <Search className="w-10 h-10 mx-auto mb-3 text-gold-500" aria-hidden="true" />
                <p className="font-semibold text-navy-900 mb-1">Nothing matched</p>
                <p className="text-rust-600 text-sm">Try different keywords or broader filters.</p>
              </Surface>
            ) : (
              <div className="space-y-3">
                {results.map((item, idx) => (
                  <Link key={`${item.type}-${idx}`} to={item.link}>
                    <Surface className="p-4 flex items-center gap-4 transition-shadow hover:shadow-md">
                      <span className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(212,162,78,0.14)' }}>
                        {item.type === 'Found' ? <Package className="w-5 h-5 text-gold-500" /> : <FileText className="w-5 h-5 text-gold-500" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge tone={item.type === 'Found' ? 'success' : 'danger'}>{item.type}</Badge>
                          {item.Item_Status && <StatusBadge status={item.Item_Status} />}
                          <p className="font-semibold text-navy-900 truncate">{item.Item_Name}</p>
                        </div>
                        <div className="flex items-center gap-4 mt-1.5 text-xs text-rust-600 flex-wrap">
                          <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {item.Place_Name || 'Unknown'}</span>
                          <span className="flex items-center gap-1"><Palette className="w-3.5 h-3.5" /> {item.Item_Color}</span>
                          {item.Item_Size && <span className="flex items-center gap-1"><Ruler className="w-3.5 h-3.5" /> {item.Item_Size}</span>}
                          <span>{item.type === 'Lost' ? 'Lost' : 'Found'} {new Date(item.type === 'Lost' ? item.Date_Lost : item.Date_Found).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </Surface>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
