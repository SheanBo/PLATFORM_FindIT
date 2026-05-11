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
    <div className="flex flex-col items-center justify-center p-3xl gap-lg">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
        <Icon className="w-8 h-8 text-slate-400" />
      </div>
      <div className="text-center">
        <h3 className="text-h3 font-semibold text-slate-900 mb-md">
          {title}
        </h3>
        <p className="text-body text-slate-500">
          {description}
        </p>
      </div>
      {actionLabel && onAction && (
        <Button
          variant="primary"
          icon={actionIcon}
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export const emptyStates = {
  noItems: {
    icon: Inbox,
    title: 'No items yet',
    description: 'Start by adding your first item',
  },
  noReports: {
    icon: FileText,
    title: 'No reports found',
    description: 'File a new lost report to get started',
  },
  noMatches: {
    icon: Search,
    title: 'No matches found',
    description: 'Try adjusting your filters or search criteria',
  },
  noResults: {
    icon: Search,
    title: 'No results found',
    description: 'Try a different search term',
  },
};
