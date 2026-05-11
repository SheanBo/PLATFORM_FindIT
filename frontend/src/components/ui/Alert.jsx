import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useState, useEffect } from 'react';

const alertConfig = {
  success: {
    icon: CheckCircle,
    className: 'alert-success',
  },
  error: {
    icon: AlertCircle,
    className: 'alert-error',
  },
  warning: {
    icon: AlertTriangle,
    className: 'alert-warning',
  },
  info: {
    icon: Info,
    className: 'alert-info',
  },
};

export function Alert({
  type = 'info',
  title,
  message,
  dismissible = true,
  onDismiss,
  className = '',
}) {
  const [isVisible, setIsVisible] = useState(true);
  const config = alertConfig[type] || alertConfig.info;
  const Icon = config.icon;

  if (!isVisible) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  return (
    <div className={`${config.className} ${className}`}>
      <div className="flex items-start flex-1">
        <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          {title && <p className="alert-title">{title}</p>}
          {message && <p className="text-sm">{message}</p>}
        </div>
      </div>
      {dismissible && (
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 ml-lg text-current opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export function AlertGroup({ alerts = [] }) {
  const [visibleAlerts, setVisibleAlerts] = useState(alerts);

  const handleDismiss = (index) => {
    setVisibleAlerts(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-md">
      {visibleAlerts.map((alert, index) => (
        <Alert
          key={index}
          {...alert}
          onDismiss={() => handleDismiss(index)}
        />
      ))}
    </div>
  );
}

// Toast-like notifications for bottom-right corner
export function Toast({
  type = 'info',
  message,
  duration = 4000,
  onClose,
}) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!duration) return;
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  const config = alertConfig[type] || alertConfig.info;
  const Icon = config.icon;

  return (
    <div className={`${config.className} rounded-lg shadow-lg max-w-sm`}>
      <div className="flex items-center gap-md">
        <Icon className="w-5 h-5 flex-shrink-0" />
        <p className="text-sm flex-1">{message}</p>
      </div>
    </div>
  );
}
