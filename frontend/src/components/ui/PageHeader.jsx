export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  action,
  breadcrumbs,
  className = '',
}) {
  return (
    <div className={`mb-2xl ${className}`}>
      <div className="flex items-start justify-between gap-lg">
        <div className="flex items-start gap-lg flex-1">
          {Icon && (
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon className="w-6 h-6 text-primary" />
            </div>
          )}
          <div className="flex-1">
            {breadcrumbs && (
              <p className="text-label text-slate-500 mb-md">
                {breadcrumbs.map((crumb, i) => (
                  <span key={i}>
                    {i > 0 && <span className="mx-md">/</span>}
                    {crumb}
                  </span>
                ))}
              </p>
            )}
            <h1 className="text-display font-bold text-slate-900">{title}</h1>
            {subtitle && (
              <p className="text-body text-slate-600 mt-md">{subtitle}</p>
            )}
          </div>
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </div>
  );
}
