import React from 'react';
import type { Language } from '../utils/translations';
import { Home, Download, LogIn, LogOut, Banknote, FileSpreadsheet, Wifi } from 'lucide-react';

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
  onTodayCheckInClick?: () => void;
  onTodayCheckOutClick?: () => void;
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
  onTodayCheckInClick,
  onTodayCheckOutClick,
}) => {
  const currentDateFormatted = new Date().toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <header className="sticky top-0 z-30 navbar-glass transition-all">

      {/* Top Row */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-[56px] gap-3">

          {/* Brand */}
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="h-9 w-9 rounded-xl flex items-center justify-center animate-logo shrink-0"
              style={{ background: '#3b5bdb', boxShadow: '0 3px 12px rgba(59,91,219,0.28)' }}
            >
              <Home className="h-4.5 w-4.5 text-white" style={{ width: 18, height: 18 }} />
            </div>
            <div className="min-w-0 hidden sm:block">
              <h1 className="text-[14px] font-bold leading-none" style={{ color: 'var(--text-primary)' }}>
                เมม โฮมสเตย์
                <span className="font-normal ml-2 text-xs" style={{ color: 'var(--text-muted)' }}>Mem Homestay</span>
              </h1>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{currentDateFormatted}</p>
            </div>
            <div className="sm:hidden">
              <h1 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>เมม โฮมสเตย์</h1>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 shrink-0">

            {/* Total Badge */}
            <div
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold"
              style={{ background: 'var(--bg-muted)', border: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
              {t.totalRecordsBadge}:
              <strong style={{ color: 'var(--brand)', fontWeight: 700 }}>{totalBookingsCount}</strong>
            </div>

            {/* Google Sheets Button */}
            <button
              id="google-sheets-btn"
              onClick={onOpenSheetsModal}
              title={hasSheetsUrl ? t.googleSheetsConnected : t.googleSheetsNotConnected}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all min-h-[36px]"
              style={hasSheetsUrl ? {
                background: '#e6fcf5', border: '1px solid #c3fae8', color: '#087f5b',
              } : {
                background: 'var(--bg-muted)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)',
              }}
            >
              {hasSheetsUrl
                ? <Wifi className="w-3.5 h-3.5" />
                : <FileSpreadsheet className="w-3.5 h-3.5" />
              }
              <span className="hidden sm:inline">
                {hasSheetsUrl ? 'Google Sheet' : t.googleSheetsNotConnected}
              </span>
              {hasSheetsUrl && (
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              )}
            </button>

            {/* Language Switcher */}
            <div
              className="flex items-center rounded-xl p-0.5 gap-0.5"
              style={{ background: 'var(--bg-muted)', border: '1px solid var(--border-light)' }}
            >
              {(['th', 'en'] as Language[]).map((l) => (
                <button
                  key={l}
                  id={`lang-${l}-btn`}
                  onClick={() => onLanguageChange(l)}
                  className="px-3 py-1.5 rounded-[10px] text-xs font-bold tracking-widest transition-all min-h-[30px] min-w-[38px]"
                  style={lang === l ? {
                    background: 'var(--brand)', color: '#fff',
                    boxShadow: '0 1px 4px rgba(59,91,219,0.25)',
                  } : {
                    color: 'var(--text-muted)',
                    background: 'transparent',
                  }}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Export Button */}
            <button
              id="export-btn"
              onClick={onOpenExportModal}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all min-h-[36px] btn-ghost"
            >
              <Download className="w-3.5 h-3.5" style={{ color: 'var(--green)' }} />
              <span className="hidden md:inline">{t.csvReportBtn}</span>
            </button>

          </div>
        </div>
      </div>

      {/* Today Summary Strip */}
      <div className="today-strip">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-2 flex flex-wrap items-center gap-x-6 gap-y-1">

          <span
            className="text-[10px] font-black uppercase tracking-[0.15em] shrink-0"
            style={{ color: 'var(--text-muted)' }}
          >
            {t.todayBarLabel}
          </span>

          <span className="hidden sm:block h-3 w-px" style={{ background: 'var(--border-light)' }} />

          {/* Check-in */}
          <button
            onClick={onTodayCheckInClick}
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-all text-left"
            title="กดเพื่อกรองเฉพาะรายการที่ต้อง Check-in วันนี้"
          >
            <div
              className="flex items-center justify-center w-6 h-6 rounded-lg shrink-0"
              style={{ background: '#e6fcf5' }}
            >
              <LogIn className="w-3.5 h-3.5" style={{ color: 'var(--green)' }} />
            </div>
            <span className="text-xs font-medium hidden sm:inline" style={{ color: 'var(--text-secondary)' }}>
              {t.todayCheckinLabel}:
            </span>
            <span className="text-xs font-medium sm:hidden" style={{ color: 'var(--text-secondary)' }}>Check-in:</span>
            {todayCheckIns > 0 ? (
              <span
                className="text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-xs"
                style={{ background: '#e6fcf5', border: '1px solid var(--green-border)', color: '#087f5b' }}
              >
                {todayCheckIns} {t.todayRooms} 🔍
              </span>
            ) : (
              <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{t.todayNone}</span>
            )}
          </button>

          {/* Check-out */}
          <button
            onClick={onTodayCheckOutClick}
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-all text-left"
            title="กดเพื่อกรองเฉพาะรายการที่ต้อง Check-out วันนี้"
          >
            <div
              className="flex items-center justify-center w-6 h-6 rounded-lg shrink-0"
              style={{ background: '#fff5f5' }}
            >
              <LogOut className="w-3.5 h-3.5" style={{ color: 'var(--red)' }} />
            </div>
            <span className="text-xs font-medium hidden sm:inline" style={{ color: 'var(--text-secondary)' }}>
              {t.todayCheckoutLabel}:
            </span>
            <span className="text-xs font-medium sm:hidden" style={{ color: 'var(--text-secondary)' }}>Check-out:</span>
            {todayCheckOuts > 0 ? (
              <span
                className="text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-xs"
                style={{ background: '#fff5f5', border: '1px solid var(--red-border)', color: '#c92a2a' }}
              >
                {todayCheckOuts} {t.todayRooms} 🔍
              </span>
            ) : (
              <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{t.todayNone}</span>
            )}
          </button>

          {/* Revenue */}
          <div className="ml-auto flex items-center gap-2 shrink-0">
            <div
              className="flex items-center justify-center w-6 h-6 rounded-lg"
              style={{ background: 'var(--amber-bg)' }}
            >
              <Banknote className="w-3.5 h-3.5" style={{ color: 'var(--amber)' }} />
            </div>
            <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              ฿{totalRevenue.toLocaleString()}
            </span>
          </div>

        </div>
      </div>

    </header>
  );
};
