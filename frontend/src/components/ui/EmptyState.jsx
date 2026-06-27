import { Package, Search, FileText, Inbox } from 'lucide-react';
import { Button } from './Button';

export function EmptyState({
  icon: Icon = Package,
  title = 'No items found',
  description = 'Get started by creating your first item',
  actionLabel,
  onAction,
  actionIcon,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'rgba(212,162,78,0.15)' }}>
        <Icon className="w-8 h-8 text-gold-500" />
      </div>
      <div className="text-center">
        <h3 className="text-navy-900 font-semibold text-lg mb-1">{title}</h3>
        <p className="text-rust-600 text-sm max-w-sm">{description}</p>
      </div>
      {actionLabel && onAction && (
        <Button variant="primary" icon={actionIcon} onClick={onAction} aria-label={actionLabel}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export const emptyStates = {
  noItems: { icon: Inbox, title: 'No items yet', description: 'Start by adding your first item' },
  noReports: { icon: FileText, title: 'No reports found', description: 'File a new lost report to get started' },
  noMatches: { icon: Search, title: 'No matches found', description: 'Try adjusting your filters or search criteria' },
  noResults: { icon: Search, title: 'No results found', description: 'Try a different search term' },
};
