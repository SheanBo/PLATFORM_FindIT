import { ChevronUp, ChevronDown } from 'lucide-react';
import { EmptyState, emptyStates } from './EmptyState';
import { LoadingSpinner, TableSkeleton } from './LoadingSpinner';

export function DataTable({
  columns = [],
  data = [],
  loading = false,
  empty = false,
  rowKey = 'id',
  onRowClick,
  renderRow,
  sortable = false,
  onSort,
  sortColumn,
  sortDirection,
  className = '',
}) {
  if (loading) {
    return <TableSkeleton rows={5} />;
  }

  if (!data.length || empty) {
    return <EmptyState {...emptyStates.noItems} />;
  }

  const handleSort = (columnKey) => {
    if (!sortable || !onSort) return;
    const newDirection =
      sortColumn === columnKey && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort(columnKey, newDirection);
  };

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
          <tr>
            {columns.map(({ key, label, sortable: colSortable, width }) => (
              <th
                key={key}
                className={`text-left px-lg py-md font-semibold text-slate-700 ${
                  colSortable ? 'cursor-pointer hover:bg-slate-100' : ''
                }`}
                onClick={() => colSortable && handleSort(key)}
                style={width ? { width } : {}}
              >
                <div className="flex items-center gap-sm">
                  {label}
                  {colSortable && (
                    <span className="opacity-50">
                      {sortColumn === key ? (
                        sortDirection === 'asc' ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )
                      ) : (
                        <ChevronUp className="w-4 h-4 opacity-25" />
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((row, rowIndex) => (
            <tr
              key={row[rowKey] || rowIndex}
              className={`hover:bg-slate-50 transition-colors ${
                onRowClick ? 'cursor-pointer' : ''
              }`}
              onClick={() => onRowClick?.(row)}
            >
              {renderRow ? (
                renderRow(row)
              ) : (
                <>
                  {columns.map(({ key }) => (
                    <td key={key} className="px-lg py-md text-slate-900">
                      {row[key] || '—'}
                    </td>
                  ))}
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Simple list view alternative for mobile
export function DataList({
  data = [],
  loading = false,
  renderItem,
  emptyMessage = 'No items',
  className = '',
}) {
  if (loading) {
    return <LoadingSpinner />;
  }

  if (!data.length) {
    return (
      <div className="text-center py-xl text-slate-500">
        <p className="text-body-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`space-y-md ${className}`}>
      {data.map((item, index) => (
        <div
          key={item.id || index}
          className="bg-white border border-slate-200 rounded-lg p-lg hover:shadow-sm transition-shadow"
        >
          {renderItem(item)}
        </div>
      ))}
    </div>
  );
}
