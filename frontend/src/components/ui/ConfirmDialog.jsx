import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';

// Tolerant of both prop conventions used across the app:
//   onCancel / onClose, confirmText / confirmLabel, variant='danger' / danger
export function ConfirmDialog({
  isOpen,
  onCancel,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  confirmLabel,
  cancelText = 'Cancel',
  variant = 'default',
  danger = false,
}) {
  const isDanger = danger || variant === 'danger';
  const cancel = onCancel || onClose || (() => {});
  const confirmLbl = confirmText || confirmLabel || 'Confirm';
  const tint = isDanger ? 'rgba(210,105,30,0.15)' : 'rgba(212,162,78,0.18)';
  const fg = isDanger ? 'var(--status-terracotta)' : 'var(--gold-500)';

  return (
    <Modal isOpen={isOpen} onClose={cancel} title="" size="sm">
      <div className="text-center">
        <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: tint }}>
          <AlertTriangle className="w-6 h-6" style={{ color: fg }} />
        </div>
        <h3 className="text-lg font-semibold text-navy-900 mb-2">{title}</h3>
        <p className="text-rust-600 mb-6">{message}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={cancel} className="btn-ghost border" style={{ borderColor: 'var(--gold-300)' }}>{cancelText}</button>
          <button onClick={onConfirm} className={isDanger ? 'btn-danger' : 'btn-primary'}>{confirmLbl}</button>
        </div>
      </div>
    </Modal>
  );
}
