import { Search, X } from 'lucide-react';
import { Input } from './Input';
import { Select } from './Input';

export function SearchBar({
  placeholder = 'Search...',
  value,
  onChange,
  onClear,
  className = '',
}) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-md top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input pl-10"
      />
      {value && (
        <button
          onClick={() => {
            onChange('');
            onClear?.();
          }}
          className="absolute right-md top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          aria-label="Clear search"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export function FilterBar({
  filters = [],
  values = {},
  onChange,
  onReset,
  className = '',
}) {
  const hasActiveFilters = Object.values(values).some(v => v);

  return (
    <div className={`flex flex-col sm:flex-row gap-md items-stretch sm:items-end ${className}`}>
      {filters.map(({ key, label, type = 'text', options }) => {
        if (type === 'select' && options) {
          return (
            <div key={key} className="flex-1 sm:flex-none">
              <Select
                label={label}
                options={options}
                value={values[key] || ''}
                onChange={(e) => onChange(key, e.target.value)}
              />
            </div>
          );
        }

        return (
          <div key={key} className="flex-1 sm:flex-none">
            <Input
              label={label}
              type={type}
              placeholder={label}
              value={values[key] || ''}
              onChange={(e) => onChange(key, e.target.value)}
            />
          </div>
        );
      })}

      {hasActiveFilters && (
        <button
          onClick={onReset}
          className="btn-ghost whitespace-nowrap"
        >
          Reset Filters
        </button>
      )}
    </div>
  );
}

export function FilterChip({ label, onRemove }) {
  return (
    <div className="inline-flex items-center gap-sm px-md py-sm rounded-full bg-primary/10 text-primary text-sm">
      <span>{label}</span>
      <button
        onClick={onRemove}
        className="hover:opacity-70 transition-opacity"
        aria-label={`Remove ${label} filter`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function FilterChips({ filters = [], onRemove, className = '' }) {
  if (!filters.length) return null;

  return (
    <div className={`flex flex-wrap gap-sm ${className}`}>
      {filters.map(({ id, label }) => (
        <FilterChip
          key={id}
          label={label}
          onRemove={() => onRemove(id)}
        />
      ))}
    </div>
  );
}
