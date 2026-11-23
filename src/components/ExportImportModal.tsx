import { localDate } from '../utils/formatters';
import React from 'react';
import type { BookingRecord } from '../types/booking';
import { exportBookingsToCSV } from '../utils/csvExport';
import { X, Download, FileSpreadsheet, RotateCcw, FileJson } from 'lucide-react';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookings: BookingRecord[];
  onResetData: () => void;
  t: any;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  isOpen,
  onClose,
  bookings,
  onResetData,
  t,
}) => {
  if (!isOpen) return null;

  const handleDownloadJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(bookings, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `mem-homestay-backup-${localDate()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-[20px] border border-[var(--border-light)] shadow-[var(--shadow-lg)] overflow-hidden animate-scale-in">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">{t.exportModalTitle}</h2>
              <p className="text-xs text-slate-500">Mem Homestay Booking Manager</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          
          {/* Export CSV Option */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl border border-emerald-500/20">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{t.exportCsvTitle}</h3>
                <p className="text-xs text-slate-500">{t.exportCsvDesc}</p>
              </div>
            </div>
            <button
              onClick={() => {
                exportBookingsToCSV(bookings);
                onClose();
              }}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition whitespace-nowrap"
            >
              {t.btnDownloadCsv}
            </button>
          </div>

          {/* Export JSON Backup */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/10 text-blue-600 rounded-xl border border-blue-500/20">
                <FileJson className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{t.exportJsonTitle}</h3>
                <p className="text-xs text-slate-500">{t.exportJsonDesc}</p>
              </div>
            </div>
            <button
              onClick={handleDownloadJSON}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition whitespace-nowrap"
            >
              {t.btnDownloadJson}
            </button>
          </div>

          {/* Reset to Sample Data */}
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-500/10 text-rose-600 rounded-xl border border-rose-500/20">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-rose-700 text-sm">{t.resetTitle}</h3>
                <p className="text-xs text-slate-500">{t.resetDesc}</p>
              </div>
            </div>
            <button
              onClick={() => {
                if (confirm(t.confirmReset)) {
                  onResetData();
                  onClose();
                }
              }}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition whitespace-nowrap"
            >
              {t.btnReset}
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-200 transition"
          >
            {t.btnCloseModal}
          </button>
        </div>

      </div>
    </div>

  );
};
