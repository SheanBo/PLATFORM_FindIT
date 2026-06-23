import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Pagination } from '../../components/ui/Pagination';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { Plus, Search, Eye, FileText, MapPin, Rows3, Grid3x3 } from 'lucide-react';
import LostReportForm from './LostReportForm';
import LostReportDetail from './LostReportDetail';

export default function LostReportsPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [reports, setReports] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [viewMode, setViewMode] = useState('column');

  const load = () => {
    setLoading(true);
    api.get('/findit-lost-reports', { params: { search, status, page, limit: 12 } })
      .then(r => { setReports(r.data.data); setPagination(r.data.pagination); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search, status, page]);

  const handleCreated = () => { setShowForm(false); load(); };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'white' }}>
      {/* Header */}
      <div className="border-b sticky top-0 z-40" style={{ backgroundColor: 'var(--cream-100)', borderColor: 'var(--gold-300)' }}>
        <div className="p-3 max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--brown-900)' }}>Lost Reports</h1>
              <p style={{ color: 'var(--rust-600)' }}>Report and track lost items</p>
            </div>
            <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 w-fit">
              <Plus className="w-4 h-4" /> File Report
            </button>
          </div>
        </div>
      </div>

      <div className="p-3 max-w-7xl mx-auto">
        {/* Filters */}
        <div className="rounded-lg p-3 shadow-sm border border-gray-100 mb-3" style={{ backgroundColor: 'var(--cream-100)' }}>
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--rust-600)' }} />
              <input className="input pl-9" placeholder="Search by item name..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ borderColor: 'var(--gold-300)' }} />
            </div>
            <div className="flex gap-3 items-center">
              <select className="select sm:w-40" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} style={{ borderColor: 'var(--gold-300)' }}>
                <option value="">All Status</option>
                {['Active','Matched','Closed','Expired','Cancelled'].map(s => <option key={s}>{s}</option>)}
              </select>
              <div className="flex items-center gap-1 border rounded-lg p-1" style={{ borderColor: 'var(--gold-300)' }}>
                <button
                  onClick={() => setViewMode('list')}
                  className="p-2 rounded transition-all cursor-pointer hover:opacity-80"
                  style={{
                    backgroundColor: viewMode === 'list' ? 'var(--gold-500)' : 'transparent',
                    color: viewMode === 'list' ? 'var(--navy-900)' : 'var(--brown-900)',
                  }}
                  title="List view"
                  aria-label="Switch to list view"
                  aria-pressed={viewMode === 'list'}
                >
                  <Rows3 className="w-4 h-4" aria-hidden="true" />
                </button>
                <button
                  onClick={() => setViewMode('column')}
                  className="p-2 rounded transition-all cursor-pointer hover:opacity-80"
                  style={{
                    backgroundColor: viewMode === 'column' ? 'var(--gold-500)' : 'transparent',
                    color: viewMode === 'column' ? 'var(--navy-900)' : 'var(--brown-900)',
                  }}
                  title="Column view"
                  aria-label="Switch to column view"
                  aria-pressed={viewMode === 'column'}
                >
                  <Grid3x3 className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Grid/List Layout */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-lg h-56 skeleton" style={{ backgroundColor: 'var(--cream-100)' }} />
            ))}
          </div>
        ) : reports.length === 0 ? (
          <EmptyState icon={FileText} title="No lost reports yet" description="Your lost items will appear here. File a report to get the search started!" actionLabel="File First Report" onAction={() => setShowForm(true)} />
        ) : (
          <>
            {viewMode === 'list' ? (
              // List View - Table Layout
              <div className="rounded-lg overflow-hidden shadow-sm border border-gray-100" style={{ backgroundColor: 'var(--cream-100)' }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead style={{ backgroundColor: 'rgba(212, 162, 78, 0.1)', borderBottom: '2px solid var(--gold-300)' }}>
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--navy-900)' }}>Item Name</th>
                        <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--navy-900)' }}>Details</th>
                        <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--navy-900)' }}>Location</th>
                        <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--navy-900)' }}>Status</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: 'var(--gold-300)' }}>
                      {reports.map(report => (
                        <tr key={report.Report_ID} className="hover:bg-amber-50 transition-colors cursor-pointer">
                          <td className="px-4 py-3 font-semibold" style={{ color: 'var(--navy-900)' }}>{report.Item_Name}</td>
                          <td className="px-4 py-3 text-xs" style={{ color: 'var(--rust-600)' }}>
                            {report.Item_Color}{report.Item_Brand ? ` · ${report.Item_Brand}` : ''}
                          </td>
                          <td className="px-4 py-3 text-xs" style={{ color: 'var(--rust-600)' }}>
                            <MapPin className="w-3 h-3 inline mr-1" />{report.Place_Name}
                          </td>
                          <td className="px-4 py-3"><StatusBadge status={report.Report_Status} /></td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => setSelectedId(report.Report_ID)}
                              className="p-2 rounded hover:opacity-80 transition-opacity"
                              style={{ color: 'var(--navy-900)' }}
                              title="View report details"
                              aria-label={`View details for ${report.Item_Name}`}
                            >
                              <Eye className="w-4 h-4" aria-hidden="true" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              // Column View - Grid Layout
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {reports.map(report => (
                  <div
                    key={report.Report_ID}
                    onClick={() => setSelectedId(report.Report_ID)}
                    className="rounded-lg overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer transform hover:scale-105"
                    style={{ backgroundColor: 'var(--cream-100)' }}
                  >
                    {/* Item Image */}
                    <div className="w-full h-32 bg-gray-100 flex items-center justify-center overflow-hidden" style={{ backgroundColor: 'rgba(212, 162, 78, 0.1)' }}>
                      {report.Photo_Path ? (
                        <img src={report.Photo_Path} alt={report.Item_Name} className="w-full h-full object-cover" />
                      ) : (
                        <FileText className="w-12 h-12" style={{ color: 'var(--gold-500)' }} />
                      )}
                    </div>

                    {/* Report Info */}
                    <div className="p-2.5">
                      {/* Name */}
                      <h3 className="font-bold text-xs mb-1" style={{ color: 'var(--navy-900)' }}>
                        {report.Item_Name}
                      </h3>

                      {/* Details */}
                      <p className="text-xs mb-1.5" style={{ color: 'var(--rust-600)' }}>
                        {report.Item_Color}{report.Item_Brand ? ` · ${report.Item_Brand}` : ''}
                      </p>

                      {/* Location */}
                      <div className="flex items-center gap-1 mb-1.5" style={{ color: 'var(--rust-600)' }}>
                        <MapPin className="w-3 h-3" />
                        <span className="text-xs">{report.Place_Name}</span>
                      </div>

                      {/* Status Badge */}
                      <div className="flex justify-between items-center">
                        <StatusBadge status={report.Report_Status} />
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedId(report.Report_ID); }}
                          className="p-2 rounded hover:opacity-80 transition-opacity"
                          style={{ color: 'var(--navy-900)' }}
                          title="View report details"
                          aria-label={`View details for ${report.Item_Name}`}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.total > pagination.limit && (
              <div className="mt-4 flex justify-center">
                <Pagination
                  currentPage={page}
                  totalPages={pagination.pages}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        )}
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="File a Lost Report" size="md">
        <LostReportForm onSuccess={handleCreated} onCancel={() => setShowForm(false)} />
      </Modal>

      <Modal isOpen={!!selectedId} onClose={() => setSelectedId(null)} title="Report Details" size="lg">
        {selectedId && <LostReportDetail id={selectedId} onClose={() => setSelectedId(null)} onRefresh={load} />}
      </Modal>
    </div>
  );
}
