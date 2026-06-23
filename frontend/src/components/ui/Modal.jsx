import { X } from 'lucide-react';
import { useEffect } from 'react';

export function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;
  const sizes = { sm: 'max-w-md', md: 'max-w-2xl', lg: 'max-w-4xl', xl: 'max-w-6xl' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="presentation">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-label="Close modal" />
      <div className={`relative bg-white rounded-xl shadow-xl w-full ${sizes[size]} max-h-[90vh] flex flex-col`} role="dialog" aria-labelledby="modal-title" aria-modal="true">
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--gold-300)' }}>
          <h2 id="modal-title" className="text-lg font-semibold" style={{ color: 'var(--brown-900)' }}>{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded transition-colors hover:bg-amber-100"
            style={{ color: 'var(--rust-600)' }}
            aria-label="Close modal"
            title="Close"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-6">{children}</div>
      </div>
    </div>
  );
}
