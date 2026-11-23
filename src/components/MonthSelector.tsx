import React from 'react';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
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
    <div className="flex items-center gap-2">
      <button onClick={handlePrev} aria-label={t.btnPrevMonth || 'ก่อนหน้า'} className="icon-btn btn-ghost !rounded-xl shrink-0">
        <ChevronLeft className="w-4 h-4" />
      </button>

      <label className="relative flex-1 sm:flex-none sm:min-w-[220px]">
        <span className="sr-only">{t.currentlyViewingMonthLabel || 'เดือน'}</span>
        <select
          value={selectedMonth}
          onChange={(e) => onMonthChange(e.target.value)}
          className="w-full glass-input h-10 pl-4 pr-10 appearance-none cursor-pointer font-medium"
        >
          <option value="all">{formatMonthYear('all', lang)}</option>
          {allMonthOptions.map((mStr) => (
            <option key={mStr} value={mStr}>
              {formatMonthYear(mStr, lang)}{mStr === currentMonthStr ? ` · ${t.tagCurrent || 'เดือนนี้'}` : ''}
            </option>
          ))}
        </select>
        <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
      </label>

      <button onClick={handleNext} aria-label={t.btnNextMonth || 'ถัดไป'} className="icon-btn btn-ghost !rounded-xl shrink-0">
        <ChevronRight className="w-4 h-4" />
      </button>

      {!isCurrentMonth && (
        <button
          onClick={() => onMonthChange(currentMonthStr)}
          className="h-10 px-3 rounded-xl text-sm font-medium shrink-0 animate-fade-in transition-colors hover:bg-[var(--brand-light)]"
          style={{ color: 'var(--brand)' }}
        >
          {t.btnCurrentMonth || 'เดือนนี้'}
        </button>
      )}
    </div>
  );
};
