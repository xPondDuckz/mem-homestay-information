import React from 'react';
import { Calendar, ChevronLeft, ChevronRight, RotateCcw, Eye } from 'lucide-react';
import type { Language } from '../utils/translations';

interface MonthSelectorProps {
  selectedMonth: string; // 'YYYY-MM' or 'all'
  onMonthChange: (month: string) => void;
  availableMonths: string[]; // ['2026-08', '2026-07', ...]
  t: any;
  lang: Language;
}

export const formatMonthYear = (monthStr: string, lang: Language): string => {
  if (monthStr === 'all') {
    return lang === 'th' ? 'ทุกเดือนสะสม (All Time)' : 'All Time Records';
  }

  const [yearStr, monthStrNum] = monthStr.split('-');
  const year = parseInt(yearStr, 10);
  const monthIdx = parseInt(monthStrNum, 10) - 1;

  const date = new Date(year, monthIdx, 1);

  if (lang === 'th') {
    const monthNameTH = date.toLocaleDateString('th-TH', { month: 'long' });
    const yearTH = year + 543;
    return `${monthNameTH} ${yearTH}`;
  } else {
    const monthNameEN = date.toLocaleDateString('en-US', { month: 'long' });
    return `${monthNameEN} ${year}`;
  }
};

export const MonthSelector: React.FC<MonthSelectorProps> = ({
  selectedMonth,
  onMonthChange,
  availableMonths,
  t,
  lang,
}) => {
  const currentMonthStr = new Date().toISOString().slice(0, 7); // '2026-08'

  // Ensure current month and surrounding months exist in list
  const allMonthOptions = Array.from(new Set([...availableMonths, currentMonthStr])).sort().reverse();

  const handlePrev = () => {
    if (selectedMonth === 'all') {
      onMonthChange(allMonthOptions[0] || currentMonthStr);
      return;
    }
    const idx = allMonthOptions.indexOf(selectedMonth);
    if (idx < allMonthOptions.length - 1) {
      onMonthChange(allMonthOptions[idx + 1]);
    } else {
      // Calculate previous month mathematically
      const [y, m] = selectedMonth.split('-').map(Number);
      const prevDate = new Date(y, m - 2, 1);
      const prevStr = prevDate.toISOString().slice(0, 7);
      onMonthChange(prevStr);
    }
  };

  const handleNext = () => {
    if (selectedMonth === 'all') return;
    const idx = allMonthOptions.indexOf(selectedMonth);
    if (idx > 0) {
      onMonthChange(allMonthOptions[idx - 1]);
    } else {
      // Calculate next month mathematically
      const [y, m] = selectedMonth.split('-').map(Number);
      const nextDate = new Date(y, m, 1);
      const nextStr = nextDate.toISOString().slice(0, 7);
      onMonthChange(nextStr);
    }
  };

  const isCurrentMonthSelected = selectedMonth === currentMonthStr;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-sm space-y-2.5">
      {/* Month Active Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-amber-500/10 border border-amber-300/60 rounded-xl px-3.5 py-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold shrink-0">
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-amber-900 font-bold uppercase tracking-wider block">
              {t.currentlyViewingMonthLabel || 'กำลังแสดงผลข้อมูลประจำเดือน:'}
            </span>
            <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
              {formatMonthYear(selectedMonth, lang)}
            </h3>
          </div>
        </div>

        {!isCurrentMonthSelected && (
          <button
            onClick={() => onMonthChange(currentMonthStr)}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition active:scale-95 shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {t.btnCurrentMonth || 'กลับสู่เดือนปัจจุบัน'}
          </button>
        )}
      </div>

      {/* Month Control Controls */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={handlePrev}
          className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3 py-2 rounded-xl text-xs border border-slate-200 transition active:scale-95 shrink-0 min-h-[38px]"
          title={t.btnPrevMonth || 'เดือนก่อนหน้า'}
        >
          <ChevronLeft className="w-4 h-4 text-amber-600" />
          <span className="hidden sm:inline">{t.btnPrevMonth || 'เดือนก่อนหน้า'}</span>
        </button>

        {/* Month Selector Dropdown */}
        <div className="flex-1 max-w-xs relative flex items-center">
          <Calendar className="w-4 h-4 text-amber-600 absolute left-3 pointer-events-none" />
          <select
            value={selectedMonth}
            onChange={(e) => onMonthChange(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-extrabold pl-9 pr-8 py-2 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none cursor-pointer appearance-none min-h-[38px]"
          >
            <option value="all">🌐 {formatMonthYear('all', lang)}</option>
            {allMonthOptions.map((mStr) => (
              <option key={mStr} value={mStr}>
                📅 {formatMonthYear(mStr, lang)} {mStr === currentMonthStr ? `(${t.tagCurrent || 'เดือนนี้'})` : ''}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-3 text-slate-500 text-xs">▼</div>
        </div>

        <button
          onClick={handleNext}
          className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3 py-2 rounded-xl text-xs border border-slate-200 transition active:scale-95 shrink-0 min-h-[38px]"
          title={t.btnNextMonth || 'เดือนถัดไป'}
        >
          <span className="hidden sm:inline">{t.btnNextMonth || 'เดือนถัดไป'}</span>
          <ChevronRight className="w-4 h-4 text-amber-600" />
        </button>
      </div>
    </div>
  );
};
