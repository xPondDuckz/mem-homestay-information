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
  isOpen,
  title,
  body,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  variant = 'danger',
}) => {
  if (!isOpen) return null;

  const isDanger = variant === 'danger';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-sm rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-slide-up">
        
        {/* Header */}
        <div className={`px-5 py-4 flex items-center justify-between border-b ${isDanger ? 'border-rose-100 bg-rose-50' : 'border-amber-100 bg-amber-50'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isDanger ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5">
          <p className="text-slate-700 text-sm leading-relaxed">{body}</p>
        </div>

        {/* Actions */}
        <div className={`px-5 py-4 border-t ${isDanger ? 'border-rose-100 bg-rose-50/50' : 'border-amber-100 bg-amber-50/50'} flex items-center justify-end gap-3`}>
          <button
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition min-h-[44px]"
          >
            {cancelLabel}
          </button>

          <button
            onClick={onConfirm}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm active:scale-95 transition min-h-[44px] ${
              isDanger
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-amber-500 hover:bg-amber-600 text-slate-950'
            }`}
          >
            {confirmLabel}
          </button>
        </div>

      </div>
    </div>
  );
};
