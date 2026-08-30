import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen, title, body, confirmLabel, cancelLabel, onConfirm, onCancel, variant = 'danger',
}) => {
  if (!isOpen) return null;

  const isDanger = variant === 'danger';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in modal-overlay">
      <div className="modal-panel w-full max-w-sm overflow-hidden animate-slide-up">

        {/* Header */}
        <div
          className="px-5 py-4 flex items-center justify-between"
          style={{
            background: isDanger ? 'var(--red-bg)' : 'var(--amber-bg)',
            borderBottom: `1px solid ${isDanger ? 'var(--red-border)' : 'var(--amber-border)'}`,
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-xl"
              style={{
                background: isDanger ? '#ffc9c9' : '#ffec99',
                border: `1px solid ${isDanger ? 'var(--red-border)' : 'var(--amber-border)'}`,
              }}
            >
              <AlertTriangle className="w-5 h-5" style={{ color: isDanger ? 'var(--red)' : 'var(--amber)' }} />
            </div>
            <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>{title}</h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg transition-all"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5" style={{ background: 'var(--bg-card)' }}>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{body}</p>
        </div>

        {/* Actions */}
        <div
          className="px-5 py-4 flex items-center justify-end gap-3"
          style={{ borderTop: '1px solid var(--border-light)', background: 'var(--bg-muted)' }}
        >
          <button
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all min-h-[44px] btn-ghost"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2.5 rounded-xl text-sm font-bold active:scale-95 transition-all min-h-[44px] text-white"
            style={{
              background: isDanger ? 'var(--red)' : 'var(--amber)',
              boxShadow: isDanger ? '0 3px 12px rgba(250,82,82,0.35)' : '0 3px 12px rgba(245,159,0,0.35)',
            }}
          >
            {confirmLabel}
          </button>
        </div>

      </div>
    </div>
  );
};
