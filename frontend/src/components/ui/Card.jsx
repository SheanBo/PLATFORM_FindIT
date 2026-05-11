export function Card({
  children,
  elevated = false,
  interactive = false,
  onClick,
  className = '',
}) {
  const baseClass = 'card';
  const elevatedClass = elevated ? 'card-elevated' : '';
  const interactiveClass = interactive ? 'card-interactive' : '';

  return (
    <div
      className={`${baseClass} ${elevatedClass} ${interactiveClass} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`mb-lg flex items-start justify-between gap-lg ${className}`}>
      <div className="flex-1">
        {title && <h2 className="text-h3 font-semibold text-slate-900">{title}</h2>}
        {subtitle && <p className="text-body-sm text-slate-500 mt-xs">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

export function CardContent({ children, className = '' }) {
  return <div className={className}>{children}</div>;
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={`mt-lg pt-lg border-t border-slate-200 flex items-center gap-md ${className}`}>
      {children}
    </div>
  );
}

export function StatCard({
  icon: Icon,
  label,
  value,
  change,
  trend,
  onClick,
  className = '',
}) {
  const trendColor = trend === 'up' ? 'text-success' : trend === 'down' ? 'text-error' : 'text-slate-500';

  return (
    <Card
      interactive={!!onClick}
      onClick={onClick}
      className={className}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-label text-slate-600 mb-md">{label}</p>
          <p className="text-display font-bold text-slate-900">{value ?? '—'}</p>
          {change && (
            <p className={`text-caption ${trendColor} mt-md`}>
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {change}
            </p>
          )}
        </div>
        {Icon && (
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Icon className="w-6 h-6 text-primary" />
          </div>
        )}
      </div>
    </Card>
  );
}

export function GridCard({
  icon: Icon,
  title,
  description,
  action,
  onClick,
  className = '',
}) {
  return (
    <Card
      interactive={!!onClick}
      onClick={onClick}
      className={className}
    >
      {Icon && (
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-lg">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      )}
      <h3 className="text-h4 font-semibold text-slate-900 mb-md">{title}</h3>
      {description && <p className="text-body-sm text-slate-600 mb-lg">{description}</p>}
      {action && <div className="mt-lg">{action}</div>}
    </Card>
  );
}
