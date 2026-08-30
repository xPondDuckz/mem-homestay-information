import React from 'react';
import { Calendar, ChevronLeft, ChevronRight, RotateCcw, Eye } from 'lucide-react';
import type { Language } from '../utils/translations';

interface MonthSelectorProps {
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  availableMonths: string[];
  t: any;
  lang: Language;
}

export const formatMonthYear = (monthStr: string, lang: Language): string => {
  if (monthStr === 'all') return lang === 'th' ? 'ทุกเดือนสะสม (All Time)' : 'All Time Records';
  const [yearStr, monthStrNum] = monthStr.split('-');
  const year = parseInt(yearStr, 10);
  const monthIdx = parseInt(monthStrNum, 10) - 1;
  const date = new Date(year, monthIdx, 1);
  if (lang === 'th') {
    return `${date.toLocaleDateString('th-TH', { month: 'long' })} ${year + 543}`;
  }
  return `${date.toLocaleDateString('en-US', { month: 'long' })} ${year}`;
};

export const MonthSelector: React.FC<MonthSelectorProps> = ({
  selectedMonth, onMonthChange, availableMonths, t, lang,
}) => {
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const allMonthOptions = Array.from(new Set([...availableMonths, currentMonthStr])).sort().reverse();

  const handlePrev = () => {
    if (selectedMonth === 'all') { onMonthChange(allMonthOptions[0] || currentMonthStr); return; }
    const idx = allMonthOptions.indexOf(selectedMonth);
    if (idx < allMonthOptions.length - 1) {
      onMonthChange(allMonthOptions[idx + 1]);
    } else {
      const [y, m] = selectedMonth.split('-').map(Number);
      onMonthChange(new Date(y, m - 2, 1).toISOString().slice(0, 7));
    }
  };

  const handleNext = () => {
    if (selectedMonth === 'all') return;
    const idx = allMonthOptions.indexOf(selectedMonth);
    if (idx > 0) onMonthChange(allMonthOptions[idx - 1]);
    else {
      const [y, m] = selectedMonth.split('-').map(Number);
      onMonthChange(new Date(y, m, 1).toISOString().slice(0, 7));
    }
  };

  const isCurrentMonth = selectedMonth === currentMonthStr;

  return (
    <div className="card p-4 space-y-3">

      {/* Active Month Banner */}
      <div
        className="flex flex-wrap items-center justify-between gap-2 rounded-xl px-4 py-2.5"
        style={{ background: 'var(--brand-light)', border: '1px solid #c5d0fa' }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="p-1.5 rounded-lg shrink-0"
            style={{ background: 'var(--brand)' }}
          >
            <Eye className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.12em] block" style={{ color: 'var(--brand)' }}>
              {t.currentlyViewingMonthLabel || 'กำลังแสดงข้อมูล:'}
            </span>
            <h3 className="text-sm font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
              {formatMonthYear(selectedMonth, lang)}
            </h3>
          </div>
        </div>

        {!isCurrentMonth && (
          <button
            onClick={() => onMonthChange(currentMonthStr)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all active:scale-95 shrink-0"
            style={{ background: 'var(--brand)', color: '#fff', boxShadow: '0 2px 8px rgba(59,91,219,0.25)' }}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {t.btnCurrentMonth || 'เดือนนี้'}
          </button>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={handlePrev}
          className="flex items-center gap-1.5 font-semibold px-3 py-2 rounded-xl text-xs transition-all active:scale-95 shrink-0 min-h-[38px] btn-ghost"
        >
          <ChevronLeft className="w-4 h-4" style={{ color: 'var(--brand)' }} />
          <span className="hidden sm:inline">{t.btnPrevMonth || 'ก่อนหน้า'}</span>
        </button>

        <div className="flex-1 relative flex items-center">
          <Calendar
            className="w-4 h-4 absolute left-3 pointer-events-none"
            style={{ color: 'var(--text-muted)' }}
          />
          <select
            value={selectedMonth}
            onChange={(e) => onMonthChange(e.target.value)}
            className="w-full glass-input pl-9 pr-8 py-2 cursor-pointer appearance-none min-h-[38px] font-semibold text-xs"
          >
            <option value="all">🌐 {formatMonthYear('all', lang)}</option>
            {allMonthOptions.map((mStr) => (
              <option key={mStr} value={mStr}>
                📅 {formatMonthYear(mStr, lang)} {mStr === currentMonthStr ? `(${t.tagCurrent || 'เดือนนี้'})` : ''}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-3 text-xs" style={{ color: 'var(--text-muted)' }}>▼</div>
        </div>

        <button
          onClick={handleNext}
          className="flex items-center gap-1.5 font-semibold px-3 py-2 rounded-xl text-xs transition-all active:scale-95 shrink-0 min-h-[38px] btn-ghost"
        >
          <span className="hidden sm:inline">{t.btnNextMonth || 'ถัดไป'}</span>
          <ChevronRight className="w-4 h-4" style={{ color: 'var(--brand)' }} />
        </button>
      </div>
    </div>
  );
};
