import { CheckCircle2, AlertCircle, Clock, XCircle, Info, HelpCircle } from 'lucide-react';

const statusConfig = {
  // Item statuses
  Unclaimed: { badge: 'badge-neutral', icon: HelpCircle, label: 'Unclaimed' },
  Matched: { badge: 'badge-info', icon: Info, label: 'Matched' },
  Claimed: { badge: 'badge-success', icon: CheckCircle2, label: 'Claimed' },
  Disputed: { badge: 'badge-error', icon: AlertCircle, label: 'Disputed' },
  Disposed: { badge: 'badge-neutral', icon: XCircle, label: 'Disposed' },

  // Report statuses
  Active: { badge: 'badge-info', icon: Clock, label: 'Active' },
  Closed: { badge: 'badge-success', icon: CheckCircle2, label: 'Closed' },
  Expired: { badge: 'badge-error', icon: AlertCircle, label: 'Expired' },
  Cancelled: { badge: 'badge-neutral', icon: XCircle, label: 'Cancelled' },

  // Claim statuses
  Pending: { badge: 'badge-pending', icon: Clock, label: 'Pending' },
  Approved: { badge: 'badge-success', icon: CheckCircle2, label: 'Approved' },
  Rejected: { badge: 'badge-error', icon: XCircle, label: 'Rejected' },
  Confirmed: { badge: 'badge-success', icon: CheckCircle2, label: 'Confirmed' },

  // Storage types
  Office_Safe: { badge: 'badge-info', icon: Info, label: 'Office Safe' },
  Locker: { badge: 'badge-neutral', icon: HelpCircle, label: 'Locker' },
};

export function Badge({ status, showIcon = true, className = '' }) {
  const config = statusConfig[status] || { badge: 'badge-neutral', icon: HelpCircle, label: status };
  const Icon = config.icon;

  return (
    <span className={`${config.badge} ${className}`}>
      {showIcon && <Icon className="w-3 h-3" />}
      {config.label}
    </span>
  );
}

export function ScoreBadge({ score, className = '' }) {
  let badge = 'badge-error';
  if (score >= 80) badge = 'badge-success';
  else if (score >= 60) badge = 'badge-pending';

  return (
    <span className={`${badge} ${className}`}>
      {Math.round(score)}%
    </span>
  );
}

// For backwards compatibility
export const StatusBadge = Badge;
