import React from 'react';
import type { BookingStats } from '../types/booking';
import { useCountUp } from '../hooks/useCountUp';
import { LogIn, LogOut, ChevronRight } from 'lucide-react';
import type { Language } from '../utils/translations';

interface StatsOverviewProps {
  stats: BookingStats;
  t: any;
  lang: Language;
  onTodayCheckInClick?: () => void;
  onTodayCheckOutClick?: () => void;
}

const Stat: React.FC<{ i: number; label: string; value: number; prefix?: string; sub?: React.ReactNode; bar?: number }> = ({
  i, label, value, prefix = '', sub, bar,
}) => {
  const n = useCountUp(value, 700);
  return (
    <div className="stat-card animate-rise stagger" style={{ '--i': i } as React.CSSProperties}>
      <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="text-[26px] sm:text-[28px] font-semibold tabular mt-1 leading-tight" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
        {prefix}{n.toLocaleString()}
      </p>
      {bar !== undefined && (
        <div className="mt-3 h-1 rounded-full overflow-hidden" style={{ background: 'var(--bg-muted)' }}>
          <div
            className="h-full rounded-full"
            style={{ width: `${bar}%`, background: 'var(--brand)', transition: 'width 900ms var(--ease-out)' }}
          />
        </div>
      )}
      {sub && <p className="text-xs mt-2 truncate" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
    </div>
  );
};

const TodayPill: React.FC<{ icon: React.ReactNode; label: string; count: number; tone: 'green' | 'red'; onClick?: () => void }> = ({
  icon, label, count, tone, onClick,
}) => (
  <button
    onClick={onClick}
    disabled={count === 0}
    className="group flex items-center gap-3 h-12 pl-3 pr-2.5 rounded-2xl border transition-all duration-200 enabled:hover:shadow-[var(--shadow-sm)] enabled:active:scale-[0.97] flex-1 sm:flex-none"
    style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-light)' }}
  >
    <span
      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
      style={{ background: `var(--${tone}-bg)`, color: `var(--${tone})` }}
    >
      {icon}
    </span>
    <span className="text-left leading-tight">
      <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span className="block text-[15px] font-semibold tabular" style={{ color: count ? 'var(--text-primary)' : 'var(--text-muted)' }}>
        {count}
      </span>
    </span>
    <ChevronRight
      className="w-4 h-4 ml-auto sm:ml-1 transition-transform duration-200 group-enabled:group-hover:translate-x-0.5"
      style={{ color: count ? 'var(--text-muted)' : 'transparent' }}
    />
  </button>
);

export const StatsOverview: React.FC<StatsOverviewProps> = ({ stats, t, lang, onTodayCheckInClick, onTodayCheckOutClick }) => {
  const now = new Date();
  const weekday = now.toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US', { weekday: 'long' });
  const date = now.toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  const totalCh = stats.bookingComCount + stats.walkInCount || 1;

  return (
    <section className="space-y-4">
      {/* Today */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 animate-rise">
        <div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{weekday}</p>
          <h1 className="text-2xl sm:text-[28px] font-semibold leading-tight" style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            {date}
          </h1>
        </div>
        <div className="flex gap-2">
          <TodayPill icon={<LogIn className="w-4 h-4" />} label={t.todayCheckinLabel} count={stats.todayCheckIns} tone="green" onClick={onTodayCheckInClick} />
          <TodayPill icon={<LogOut className="w-4 h-4" />} label={t.todayCheckoutLabel} count={stats.todayCheckOuts} tone="red" onClick={onTodayCheckOutClick} />
        </div>
      </div>

      {/* Monthly numbers */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat i={1} label={t.totalRevenue} value={stats.totalRevenue} prefix="฿" />
        <Stat i={2} label={t.totalBookings} value={stats.totalBookings}
          bar={Math.round((stats.bookingComCount / totalCh) * 100)}
          sub={`Booking ${stats.bookingComCount} · Walk-in ${stats.walkInCount}`} />
        <Stat i={3} label={t.bigBedLabel} value={stats.bigBedCount} />
        <Stat i={4} label={t.smallBedLabel} value={stats.smallBedCount} />
      </div>
    </section>
  );
};
