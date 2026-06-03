import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Pagination } from '../../components/ui/Pagination';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { Plus, Search, Eye, FileText, MapPin } from 'lucide-react';
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

  const load = () => {
    setLoading(true);
    api.get('/findit-lost-reports', { params: { search, status, page, limit: 12 } })
      .then(r => { setReports(r.data.data); setPagination(r.data.pagination); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search, status, page]);

  const handleCreated = () => { setShowForm(false); load(); };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--cream-100)' }}>
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40" style={{ borderColor: 'var(--gold-300)' }}>
        <div className="p-6 max-w-7xl mx-auto">
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

      <div className="p-6 max-w-7xl mx-auto">
        {/* Filters */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--rust-600)' }} />
              <input className="input pl-9" placeholder="Search by item name..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ borderColor: 'var(--gold-300)' }} />
            </div>
            <select className="select sm:w-40" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} style={{ borderColor: 'var(--gold-300)' }}>
              <option value="">All Status</option>
              {['Active','Matched','Closed','Expired','Cancelled'].map(s => <option key={s}>{s}</option>)}
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
        ) : reports.length === 0 ? (
          <EmptyState icon={FileText} title="No reports found" description="File your first lost report to get started" actionLabel="File Report" onAction={() => setShowForm(true)} />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {reports.map(report => (
                <div
                  key={report.Report_ID}
                  onClick={() => setSelectedId(report.Report_ID)}
                  className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer transform hover:scale-105"
                >
                  {/* Item Image */}
                  <div className="w-full h-48 bg-gray-100 flex items-center justify-center" style={{ backgroundColor: 'rgba(212, 162, 78, 0.1)' }}>
                    <FileText className="w-12 h-12" style={{ color: 'var(--gold-500)' }} />
                  </div>

                  {/* Report Info */}
                  <div className="p-4">
                    {/* Name */}
                    <h3 className="font-bold text-sm mb-1" style={{ color: 'var(--navy-900)' }}>
                      {report.Item_Name}
                    </h3>

                    {/* Details */}
                    <p className="text-xs mb-3" style={{ color: 'var(--rust-600)' }}>
                      {report.Item_Color}{report.Item_Brand ? ` · ${report.Item_Brand}` : ''}
                    </p>

                    {/* Location */}
                    <div className="flex items-center gap-1 mb-3" style={{ color: 'var(--rust-600)' }}>
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

            {/* Pagination */}
            {pagination && pagination.total > pagination.limit && (
              <div className="mt-8 flex justify-center">
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
