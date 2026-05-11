import { ChevronLeft, ChevronRight } from 'lucide-react';

export function Pagination({ pagination, onPageChange }) {
  if (!pagination || pagination.pages <= 1) return null;
  const { page, pages, total } = pagination;
  return (
    <div className="flex items-center justify-between mt-4">
      <p className="text-sm text-gray-600">{total} total records</p>
      <div className="flex gap-1">
        <button onClick={() => onPageChange(page - 1)} disabled={page <= 1} className="btn-secondary px-2 py-1">
          <ChevronLeft className="w-4 h-4" />
        </button>
        {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
          const p = Math.max(1, Math.min(page - 2, pages - 4)) + i;
          return p <= pages ? (
            <button key={p} onClick={() => onPageChange(p)} className={`px-3 py-1 rounded text-sm font-medium ${p === page ? 'bg-blue-600 text-white' : 'btn-secondary'}`}>{p}</button>
          ) : null;
        })}
        <button onClick={() => onPageChange(page + 1)} disabled={page >= pages} className="btn-secondary px-2 py-1">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
