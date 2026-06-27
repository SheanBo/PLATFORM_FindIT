/* Shared design-system primitives (promoted from the design prototype). */

export function Surface({ className = '', children, style, ...rest }) {
  return (
    <div
      className={`bg-white rounded-xl ${className}`}
      style={{ border: '1px solid var(--gold-300)', boxShadow: '0 1px 2px rgba(22,33,61,0.04)', ...style }}
      {...rest}
    >
      {children}
    </div>
  );
}

export function PageHead({ title, subtitle, actions }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
      <div>
        <h1 className="text-navy-900" style={{ fontSize: '1.75rem', lineHeight: 1.15 }}>{title}</h1>
        {subtitle && <p className="text-sm text-rust-600 mt-1.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

export function SectionLabel({ children, className = '' }) {
  return (
    <p className={`text-[11px] font-semibold uppercase tracking-[0.08em] text-rust-600 ${className}`}>
      {children}
    </p>
  );
}

const TONES = {
  neutral: { bg: 'rgba(212,162,78,0.20)', fg: 'var(--navy-900)' },
  info: { bg: 'rgba(59,95,217,0.12)', fg: 'var(--status-blue)' },
  success: { bg: 'rgba(47,158,88,0.15)', fg: 'var(--status-green)' },
  danger: { bg: 'rgba(210,105,30,0.15)', fg: 'var(--status-terracotta)' },
};

export function statusTone(status) {
  const s = String(status || '').toLowerCase();
  if (['matched'].includes(s)) return 'info';
  if (['confirmed', 'approved', 'claimed', 'closed'].includes(s)) return 'success';
  if (['rejected', 'disputed', 'cancelled', 'expired', 'disposed'].includes(s)) return 'danger';
  return 'neutral'; // pending, unclaimed, active
}

export function Badge({ tone = 'neutral', children }) {
  const t = TONES[tone] || TONES.neutral;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap"
      style={{ backgroundColor: t.bg, color: t.fg }}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }) {
  const tone = statusTone(status);
  const dot = TONES[tone].fg;
  return (
    <Badge tone={tone}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dot }} />
      {status}
    </Badge>
  );
}

export function Meter({ value, max, tone = 'var(--gold-500)' }) {
  const pct = Math.min(100, Math.round((value / (max || 1)) * 100));
  return (
    <div className="h-1.5 rounded-full w-full" style={{ backgroundColor: 'rgba(212,162,78,0.20)' }}>
      <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: tone }} />
    </div>
  );
}

export function Btn({ variant = 'primary', icon: Icon, children, className = '', ...rest }) {
  const base =
    'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed';
  const styles = variant === 'ghost' ? 'text-navy-900 hover:bg-black/5' : variant === 'primary' ? 'text-white' : 'text-navy-900';
  const inline =
    variant === 'primary' ? { backgroundColor: 'var(--navy-900)' } : variant === 'secondary' ? { backgroundColor: 'var(--gold-300)' } : {};
  return (
    <button className={`${base} ${styles} ${className}`} style={inline} {...rest}>
      {Icon && <Icon className="w-4 h-4" aria-hidden="true" />}
      {children}
    </button>
  );
}
