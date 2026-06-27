import { ChevronLeft, ChevronRight } from 'lucide-react';

export function Pagination({ pagination, onPageChange }) {
  if (!pagination || pagination.pages <= 1) return null;
  const { page, pages, total } = pagination;

  const navStyle = { border: '1px solid var(--gold-300)', color: 'var(--navy-900)' };

  return (
    <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
      <p className="text-sm text-rust-600">{total} total</p>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(page - 1)} disabled={page <= 1} className="px-2.5 py-1 rounded-lg disabled:opacity-40" style={navStyle} aria-label="Previous page">
          <ChevronLeft className="w-4 h-4" />
        </button>
        {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
          const p = Math.max(1, Math.min(page - 2, pages - 4)) + i;
          if (p > pages) return null;
          const active = p === page;
          return (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className="px-3 py-1 rounded-lg text-sm font-semibold"
              style={active ? { backgroundColor: 'var(--navy-900)', color: '#fff' } : navStyle}
              aria-current={active ? 'page' : undefined}
            >
              {p}
            </button>
          );
        })}
        <button onClick={() => onPageChange(page + 1)} disabled={page >= pages} className="px-2.5 py-1 rounded-lg disabled:opacity-40" style={navStyle} aria-label="Next page">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
