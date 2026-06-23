import { useState, useEffect } from 'react';
import { Search, Filter, Calendar } from 'lucide-react';
import api from '../../lib/api';
import { Link } from 'react-router-dom';

export default function AdvancedSearchPage() {
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [error, setError] = useState('');

  // Filter states
  const [filters, setFilters] = useState({
    searchTerm: '',
    category: '',
    color: '',
    status: '',
    dateFrom: '',
    dateTo: '',
    location: '',
    itemType: 'all', // all, lost, found
  });

  const COLORS = ['Black', 'White', 'Gray', 'Brown', 'Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Purple', 'Pink', 'Gold', 'Silver', 'Multicolor'];

  useEffect(() => {
    Promise.all([
      api.get('/findit-dashboard/categories'),
      api.get('/findit-dashboard/locations'),
    ])
      .then(([c, l]) => {
        setCategories(c.data.data);
        setLocations(l.data.data);
      });
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSearchPerformed(true);
    setError('');

    try {
      const [lostRes, foundRes] = await Promise.all([
        api.get('/findit-lost-reports'),
        api.get('/findit-found-items'),
      ]);

      let lostItems = lostRes.data?.data || lostRes.data || [];
      let foundItems = foundRes.data?.data || foundRes.data || [];

      // Apply filters
      const applyFilters = (items, isLost) => {
        return items.filter(item => {
          const itemName = (item.Item_Name || '').toLowerCase();
          const description = (item.Item_Description || '').toLowerCase();
          const searchTermLower = filters.searchTerm.toLowerCase();

          // Search term
          if (searchTermLower && !itemName.includes(searchTermLower) && !description.includes(searchTermLower)) {
            return false;
          }

          // Category
          if (filters.category && item.Category_ID != filters.category) {
            return false;
          }

          // Color
          if (filters.color && item.Item_Color !== filters.color) {
            return false;
          }

          // Location
          if (filters.location && item.Location_ID != filters.location) {
            return false;
          }

          // Status (for found items)
          if (!isLost && filters.status && item.Item_Status !== filters.status) {
            return false;
          }

          // Date range
          const itemDate = new Date(isLost ? item.Date_Lost : item.Date_Found);
          if (filters.dateFrom && itemDate < new Date(filters.dateFrom)) {
            return false;
          }
          if (filters.dateTo && itemDate > new Date(filters.dateTo)) {
            return false;
          }

          return true;
        });
      };

      let filteredResults = [];

      if (filters.itemType === 'lost' || filters.itemType === 'all') {
        filteredResults = [...filteredResults, ...applyFilters(lostItems, true).map(item => ({
          ...item,
          type: 'Lost',
          typeColor: '#c74545',
          link: `/lost-reports/${item.Report_ID}`,
        }))];
      }

      if (filters.itemType === 'found' || filters.itemType === 'all') {
        filteredResults = [...filteredResults, ...applyFilters(foundItems, false).map(item => ({
          ...item,
          type: 'Found',
          typeColor: '#5c8e6e',
          link: `/found-items/${item.Item_ID}`,
        }))];
      }

      setResults(filteredResults);
    } catch (err) {
      setError(err.response?.data?.error || 'Search failed. Please try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'white' }}>
      {/* Header */}
      <div className="border-b sticky top-0 z-40" style={{ backgroundColor: 'var(--cream-100)', borderColor: 'var(--gold-300)' }}>
        <div className="p-6 max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-1" style={{ color: 'var(--brown-900)' }}>Advanced Search</h1>
          <p style={{ color: 'var(--rust-600)' }}>Find lost or found items with detailed filters</p>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto">
        {/* Search Form */}
        <div className="rounded-lg shadow-sm p-6 mb-6" style={{ backgroundColor: 'var(--cream-100)' }}>
          <form onSubmit={handleSearch} className="space-y-6">
            {/* Search Term */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--brown-900)' }}>
                <Search className="w-4 h-4 inline mr-2" />
                Search Term
              </label>
              <input
                type="text"
                name="searchTerm"
                value={filters.searchTerm}
                onChange={handleFilterChange}
                placeholder="Search by item name or description..."
                className="w-full px-4 py-2 rounded-lg border-2"
                style={{ borderColor: 'var(--gold-300)' }}
              />
            </div>

            {/* Filter Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Item Type */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--brown-900)' }}>Type</label>
                <select
                  name="itemType"
                  value={filters.itemType}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-2 rounded-lg border-2"
                  style={{ borderColor: 'var(--gold-300)' }}
                >
                  <option value="all">All Items</option>
                  <option value="lost">Lost Items</option>
                  <option value="found">Found Items</option>
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--brown-900)' }}>Category</label>
                <select
                  name="category"
                  value={filters.category}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-2 rounded-lg border-2"
                  style={{ borderColor: 'var(--gold-300)' }}
                >
                  <option value="">All Categories</option>
                  {categories.map(c => (
                    <option key={c.Category_ID} value={c.Category_ID}>
                      {c.Category_Name.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--brown-900)' }}>Color</label>
                <select
                  name="color"
                  value={filters.color}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-2 rounded-lg border-2"
                  style={{ borderColor: 'var(--gold-300)' }}
                >
                  <option value="">All Colors</option>
                  {COLORS.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--brown-900)' }}>Location</label>
                <select
                  name="location"
                  value={filters.location}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-2 rounded-lg border-2"
                  style={{ borderColor: 'var(--gold-300)' }}
                >
                  <option value="">All Locations</option>
                  {locations.map(l => (
                    <option key={l.Location_ID} value={l.Location_ID}>
                      {l.Place_Name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status (Found items only) */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--brown-900)' }}>Status</label>
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-2 rounded-lg border-2"
                  style={{ borderColor: 'var(--gold-300)' }}
                >
                  <option value="">All Statuses</option>
                  <option value="Unclaimed">Unclaimed</option>
                  <option value="Matched">Matched</option>
                  <option value="Claimed">Claimed</option>
                </select>
              </div>
            </div>

            {/* Date Range */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--brown-900)' }}>
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Date From
                </label>
                <input
                  type="date"
                  name="dateFrom"
                  value={filters.dateFrom}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-2 rounded-lg border-2"
                  style={{ borderColor: 'var(--gold-300)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--brown-900)' }}>Date To</label>
                <input
                  type="date"
                  name="dateTo"
                  value={filters.dateTo}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-2 rounded-lg border-2"
                  style={{ borderColor: 'var(--gold-300)' }}
                />
              </div>
            </div>

            {/* Search Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 font-semibold rounded-lg text-white transition-all"
              style={{ backgroundColor: 'var(--navy-900)' }}
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg text-sm" style={{ backgroundColor: '#F5E5D7', color: 'var(--status-terracotta)', border: '1px solid var(--status-terracotta)' }}>
            {error}
          </div>
        )}

        {/* Results */}
        {searchPerformed && (
          <div>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--brown-900)' }}>
              Results ({results.length})
            </h2>

            {results.length === 0 ? (
              <div className="rounded-lg p-12 text-center" style={{ backgroundColor: 'var(--cream-100)' }}>
                <Search className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--gold-500)' }} aria-hidden="true" />
                <p className="font-semibold mb-1" style={{ color: 'var(--brown-900)' }}>Nothing matched</p>
                <p style={{ color: 'var(--rust-600)' }}>Try using different keywords or broader filters</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {results.map((item, idx) => (
                  <Link key={idx} to={item.link}>
                    <div className="rounded-lg p-4 shadow-sm border hover:shadow-md transition-all" style={{ backgroundColor: 'var(--cream-100)', borderColor: 'var(--gold-300)', borderLeftColor: item.typeColor, borderLeftWidth: '4px' }}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-semibold px-3 py-1 rounded" style={{ backgroundColor: item.typeColor + '20', color: item.typeColor }}>
                              {item.type}
                            </span>
                            {item.Item_Status && (
                              <span className="text-xs font-semibold px-2 py-1 rounded" style={{ backgroundColor: 'var(--gold-300)', color: 'var(--navy-900)' }}>
                                {item.Item_Status}
                              </span>
                            )}
                          </div>
                          <h3 className="text-lg font-bold" style={{ color: 'var(--navy-900)' }}>{item.Item_Name}</h3>
                          <p className="text-sm mt-2" style={{ color: 'var(--rust-600)' }}>
                            {item.Item_Description?.substring(0, 100)}...
                          </p>
                          <div className="flex gap-4 mt-3 text-xs" style={{ color: 'var(--brown-700)' }}>
                            <span>📍 {item.Place_Name || 'Unknown Location'}</span>
                            <span>🎨 {item.Item_Color}</span>
                            {item.Item_Size && <span>📏 {item.Item_Size}</span>}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs" style={{ color: 'var(--rust-600)' }}>
                            {item.type === 'Lost' ? 'Lost: ' : 'Found: '}
                            {new Date(item.type === 'Lost' ? item.Date_Lost : item.Date_Found).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
