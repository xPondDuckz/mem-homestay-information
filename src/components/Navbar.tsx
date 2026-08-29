import React from 'react';
import type { Language } from '../utils/translations';
import { Home, Download, LogIn, LogOut, DollarSign, FileSpreadsheet } from 'lucide-react';

interface NavbarProps {
  onOpenAddModal: () => void;
  onOpenExportModal: () => void;
  onOpenSheetsModal: () => void;
  hasSheetsUrl: boolean;
  totalBookingsCount: number;
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  t: any;
  todayCheckIns: number;
  todayCheckOuts: number;
  totalRevenue: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAddModal: _onOpenAddModal,
  onOpenExportModal,
  onOpenSheetsModal,
  hasSheetsUrl,
  totalBookingsCount,
  lang,
  onLanguageChange,
  t,
  todayCheckIns,
  todayCheckOuts,
  totalRevenue,
}) => {
  const currentDateFormatted = new Date().toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="sticky top-0 z-30 bg-white shadow-sm border-b border-slate-100 transition-colors">

      {/* ── Top Row: Brand + Controls ── */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-14 gap-3">

          {/* Brand */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-amber-500 flex items-center justify-center shadow-sm shrink-0 animate-logo">
              <Home className="h-4 w-4 text-slate-950" />
            </div>
            <div className="min-w-0 hidden sm:block">
              <h1 className="text-sm font-extrabold text-slate-900 leading-none tracking-tight">
                เมม โฮมสเตย์
                <span className="text-slate-400 font-normal ml-1.5 text-xs">Mem Homestay</span>
              </h1>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-none">{currentDateFormatted}</p>
            </div>
            {/* Mobile — short title */}
            <div className="sm:hidden">
              <h1 className="text-sm font-extrabold text-slate-900">เมม โฮมสเตย์</h1>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 shrink-0">

            {/* Total Badge — desktop */}
            <div className="hidden lg:flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block shrink-0"></span>
              {t.totalRecordsBadge}:
              <strong className="text-amber-700 font-extrabold">{totalBookingsCount}</strong>
            </div>

            {/* Google Sheets Connection Button */}
            <button
              id="google-sheets-btn"
              onClick={onOpenSheetsModal}
              title={hasSheetsUrl ? t.googleSheetsConnected : t.googleSheetsNotConnected}
              className={`flex items-center gap-1.5 border px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm min-h-[36px] ${
                hasSheetsUrl
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
              }`}
            >
              <FileSpreadsheet className={`w-3.5 h-3.5 ${hasSheetsUrl ? 'text-emerald-600' : 'text-amber-600'}`} />
              <span className="hidden sm:inline">
                {hasSheetsUrl ? t.googleSheetsBtn : t.googleSheetsNotConnected}
              </span>
              <span className={`w-2 h-2 rounded-full ${hasSheetsUrl ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            </button>

            {/* Language Switcher — TH / EN only, no flags */}
            <div className="flex items-center bg-slate-100 rounded-xl border border-slate-200 p-0.5 gap-0.5">
              <button
                id="lang-th-btn"
                onClick={() => onLanguageChange('th')}
                title="ภาษาไทย"
                className={`px-4 py-1.5 rounded-[10px] text-sm font-extrabold tracking-wide transition-all min-h-[34px] min-w-[46px] flex items-center justify-center ${
                  lang === 'th'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-white'
                }`}
              >
                TH
              </button>
              <button
                id="lang-en-btn"
                onClick={() => onLanguageChange('en')}
                title="English"
                className={`px-4 py-1.5 rounded-[10px] text-sm font-extrabold tracking-wide transition-all min-h-[34px] min-w-[46px] flex items-center justify-center ${
                  lang === 'en'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-white'
                }`}
              >
                EN
              </button>
            </div>

            {/* Export Button */}
            <button
              id="export-btn"
              onClick={onOpenExportModal}
              className="hidden sm:flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold transition shadow-sm min-h-[36px]"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden md:inline">{t.csvReportBtn}</span>
            </button>

          </div>
        </div>
      </div>


      {/* ── Today Summary Strip ── */}
      <div className="bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-2 flex flex-wrap items-center gap-x-5 gap-y-1.5">

          {/* Today label */}
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest shrink-0">
            {t.todayBarLabel}
          </span>

          <span className="hidden sm:block h-4 w-px bg-slate-200 shrink-0" />

          {/* Check-in */}
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-100 shrink-0">
              <LogIn className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <span className="text-xs font-semibold text-slate-500 hidden sm:inline">{t.todayCheckinLabel}:</span>
            <span className="text-xs font-semibold text-slate-500 sm:hidden">Check-in:</span>
            {todayCheckIns > 0 ? (
              <span className="inline-flex items-center gap-1 bg-emerald-500 text-white text-xs font-extrabold px-2.5 py-0.5 rounded-full shadow-sm">
                {todayCheckIns} {t.todayRooms}
              </span>
            ) : (
              <span className="text-xs text-slate-400 italic">{t.todayNone}</span>
            )}
          </div>

          {/* Check-out */}
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-rose-100 shrink-0">
              <LogOut className="w-3.5 h-3.5 text-rose-600" />
            </div>
            <span className="text-xs font-semibold text-slate-500 hidden sm:inline">{t.todayCheckoutLabel}:</span>
            <span className="text-xs font-semibold text-slate-500 sm:hidden">Check-out:</span>
            {todayCheckOuts > 0 ? (
              <span className="inline-flex items-center gap-1 bg-rose-500 text-white text-xs font-extrabold px-2.5 py-0.5 rounded-full shadow-sm">
                {todayCheckOuts} {t.todayRooms}
              </span>
            ) : (
              <span className="text-xs text-slate-400 italic">{t.todayNone}</span>
            )}
          </div>

          {/* Revenue */}
          <div className="ml-auto flex items-center gap-1.5 shrink-0">
            <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-amber-100">
              <DollarSign className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <span className="text-sm font-extrabold text-amber-700 tracking-tight">
              ฿{totalRevenue.toLocaleString()}
            </span>
          </div>

        </div>
      </div>

    </header>
  );
};
