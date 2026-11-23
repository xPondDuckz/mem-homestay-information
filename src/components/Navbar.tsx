import React, { useEffect, useState } from 'react';
import type { Language } from '../utils/translations';
import { Download, FileSpreadsheet, Plus, Home, Check, Loader2, CloudOff, RotateCw, DoorOpen, Smartphone } from 'lucide-react';
import type { SyncStatus } from '../hooks/useSheetsSync';
import type { LucideIcon } from 'lucide-react';

export type ViewKey = 'today' | 'table' | 'calendar' | 'analytics';
export interface ViewItem { key: ViewKey; label: string; icon: LucideIcon }

interface NavbarProps {
  views: ViewItem[];
  currentView: ViewKey;
  onViewChange: (v: ViewKey) => void;
  onOpenAddModal: () => void;
  onOpenExportModal: () => void;
  onOpenSheetsModal: () => void;
  onOpenRooms: () => void;
  onInstall?: () => void;
  hasSheetsUrl: boolean;
  syncStatus: SyncStatus;
  onRetrySync: () => void;
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  t: any;
}

export const syncDotColor = (s: SyncStatus) =>
  s === 'saved' ? 'var(--green)' : s === 'saving' || s === 'loading' ? 'var(--amber)' : s === 'off' ? 'var(--border-strong)' : 'var(--red)';

/** Small live indicator of the Google Sheets save state. */
const SyncBadge: React.FC<{ status: SyncStatus; onRetry: () => void; onOpen: () => void }> = ({ status, onRetry, onOpen }) => {
  const map: Record<SyncStatus, { icon: React.ReactNode; label: string; color: string }> = {
    off:     { icon: <FileSpreadsheet className="w-4 h-4" />, label: 'ยังไม่เชื่อม Sheet', color: 'var(--text-muted)' },
    loading: { icon: <Loader2 className="w-4 h-4 animate-spin" />, label: 'กำลังโหลด…', color: 'var(--text-secondary)' },
    saving:  { icon: <Loader2 className="w-4 h-4 animate-spin" />, label: 'กำลังบันทึก…', color: 'var(--text-secondary)' },
    saved:   { icon: <Check className="w-4 h-4" />, label: 'บันทึกลง Sheet แล้ว', color: 'var(--green)' },
    error:   { icon: <RotateCw className="w-4 h-4" />, label: 'บันทึกไม่สำเร็จ · ลองใหม่', color: 'var(--red)' },
    offline: { icon: <CloudOff className="w-4 h-4" />, label: 'ออฟไลน์ · รอบันทึก', color: 'var(--amber)' },
  };
  const m = map[status];
  const isProblem = status === 'error' || status === 'offline';
  return (
    <button
      onClick={isProblem ? onRetry : onOpen}
      title={m.label}
      aria-live="polite"
      className={`h-9 px-2.5 rounded-lg inline-flex items-center gap-1.5 text-[13px] transition-colors hover:bg-[var(--bg-hover)] ${isProblem ? 'bg-[var(--red-bg)]' : ''}`}
      style={{ color: m.color }}
    >
      {m.icon}
      <span key={status} className="hidden lg:inline animate-fade-in">{m.label}</span>
    </button>
  );
};

/** Segmented control with a sliding thumb. */
export const Segmented: React.FC<{ views: ViewItem[]; current: ViewKey; onChange: (v: ViewKey) => void }> = ({ views, current, onChange }) => {
  const index = Math.max(0, views.findIndex((v) => v.key === current));
  return (
    <nav className="segmented" style={{ '--count': views.length, '--index': index } as React.CSSProperties}>
      <span className="segmented-thumb" aria-hidden />
      {views.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          aria-current={current === key ? 'page' : undefined}
          className="segmented-btn"
        >
          <Icon className="w-4 h-4" aria-hidden />
          {label}
        </button>
      ))}
    </nav>
  );
};

export const Navbar: React.FC<NavbarProps> = ({
  views, currentView, onViewChange,
  onOpenAddModal, onOpenExportModal, onOpenSheetsModal, onOpenRooms, onInstall,
  syncStatus, onRetrySync, lang, onLanguageChange, t,
}) => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-30 navbar-glass ${scrolled ? 'scrolled' : ''}`} style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="max-w-6xl mx-auto px-4 lg:px-6 h-16 flex items-center justify-between gap-4">

        {/* Brand */}
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--brand)' }}>
            <Home className="w-[18px] h-[18px] text-white" aria-hidden />
          </span>
          <div className="leading-tight min-w-0">
            <p className="text-[15px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>เมม โฮมสเตย์</p>
            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>Mem Homestay</p>
          </div>
        </div>

        {/* Views — tablet & desktop */}
        <div className="hidden md:block">
          <Segmented views={views} current={currentView} onChange={onViewChange} />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <span id="google-sheets-btn" className="inline-flex">
            <SyncBadge status={syncStatus} onRetry={onRetrySync} onOpen={onOpenSheetsModal} />
          </span>

          {onInstall && (
            <button onClick={onInstall} title="ติดตั้งแอปบนเครื่อง" aria-label="ติดตั้งแอป" className="icon-btn animate-fab-pop" style={{ color: 'var(--brand)' }}>
              <Smartphone className="w-[18px] h-[18px]" />
            </button>
          )}

          <button id="rooms-btn" onClick={onOpenRooms} title="ห้องพัก" aria-label="ห้องพัก" className="icon-btn">
            <DoorOpen className="w-[18px] h-[18px]" />
          </button>

          <button id="export-btn" onClick={onOpenExportModal} title={t.csvReportBtn} aria-label={t.csvReportBtn} className="icon-btn">
            <Download className="w-[18px] h-[18px]" />
          </button>

          <button
            id="lang-toggle-btn"
            onClick={() => onLanguageChange(lang === 'th' ? 'en' : 'th')}
            className="icon-btn text-xs font-semibold tracking-wider"
            aria-label="Switch language"
          >
            {lang === 'th' ? 'EN' : 'TH'}
          </button>

          <button
            id="add-booking-desktop-btn"
            onClick={onOpenAddModal}
            className="hidden md:inline-flex items-center gap-2 btn-primary h-10 pl-3.5 pr-4 ml-2 rounded-xl text-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden lg:inline">{t.addBookingBtn}</span>
            <span className="lg:hidden">{lang === 'th' ? 'เพิ่ม' : 'Add'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

/** Phone-only bottom navigation with a central add button. */
export const BottomNav: React.FC<{
  views: ViewItem[]; current: ViewKey; onChange: (v: ViewKey) => void; onAdd: () => void; addLabel: string; badge?: Partial<Record<ViewKey, number>>;
}> = ({ views, current, onChange, onAdd, addLabel, badge = {} }) => {
  const Item = ({ v }: { v: ViewItem }) => (
    <button className="bottom-nav-btn" aria-current={current === v.key ? 'page' : undefined} onClick={() => onChange(v.key)}>
      <span className="relative">
        <v.icon className="w-[22px] h-[22px]" aria-hidden />
        {!!badge[v.key] && (
          <span className="absolute -top-1.5 -right-2.5 min-w-4 h-4 px-1 rounded-full text-[10px] leading-4 text-center text-white animate-fab-pop" style={{ background: 'var(--red)' }}>
            {badge[v.key]}
          </span>
        )}
      </span>
      {v.label}
    </button>
  );
  const half = Math.ceil(views.length / 2);
  return (
    <nav className="bottom-nav md:hidden">
      <div className="flex items-center px-2">
        {views.slice(0, half).map((v) => <Item key={v.key} v={v} />)}
        <div className="flex-1 flex justify-center">
          <button id="fab-add-btn" onClick={onAdd} aria-label={addLabel} className="bottom-nav-add">
            <Plus className="w-6 h-6" />
          </button>
        </div>
        {views.slice(half).map((v) => <Item key={v.key} v={v} />)}
      </div>
    </nav>
  );
};
