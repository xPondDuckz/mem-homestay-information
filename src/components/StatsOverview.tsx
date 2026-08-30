import React from 'react';
import type { BookingStats } from '../types/booking';
import { Globe, Footprints, BedDouble, BedSingle, Banknote, CalendarCheck, TrendingUp } from 'lucide-react';
import { useCountUp } from '../hooks/useCountUp';

interface StatsOverviewProps {
  stats: BookingStats;
  t: any;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ stats, t }) => {
  const totalChannels    = (stats.bookingComCount + stats.walkInCount) || 1;
  const bookingComPct    = Math.round((stats.bookingComCount / totalChannels) * 100);
  const walkInPct        = Math.round((stats.walkInCount    / totalChannels) * 100);

  const animatedRevenue  = useCountUp(stats.totalRevenue,  1100);
  const animatedBookings = useCountUp(stats.totalBookings,  900);
  const animatedBigBed   = useCountUp(stats.bigBedCount,    800);
  const animatedSmallBed = useCountUp(stats.smallBedCount,  800);
  const animatedCheckIns = useCountUp(stats.todayCheckIns,  750);
  const animatedCheckOuts = useCountUp(stats.todayCheckOuts, 750);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

      {/* 1. Revenue */}
      <div className="stat-card stat-card-revenue animate-scale-in delay-0 col-span-2 sm:col-span-1">
        <div className="flex justify-between items-start mb-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.10em]" style={{ color: 'var(--green)' }}>
            {t.totalRevenue}
          </p>
          <div
            className="p-2 rounded-xl"
            style={{ background: 'var(--green-bg)', border: '1px solid var(--green-border)' }}
          >
            <Banknote className="w-4 h-4" style={{ color: 'var(--green)' }} />
          </div>
        </div>
        <h3 className="text-[28px] font-extrabold tabular-nums leading-none" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          ฿{animatedRevenue.toLocaleString()}
        </h3>
        <p className="text-xs mt-2 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
          <TrendingUp className="w-3.5 h-3.5" style={{ color: 'var(--green)' }} />
          {t.totalBookings}: <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>{stats.totalBookings}</span> {t.recordsUnit}
        </p>
      </div>

      {/* 2. Booking Channels */}
      <div className="stat-card stat-card-bookings animate-scale-in delay-75">
        <div className="flex justify-between items-start mb-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.10em]" style={{ color: 'var(--blue)' }}>
            {t.bookingChannels}
          </p>
          <div
            className="p-2 rounded-xl"
            style={{ background: 'var(--blue-bg)', border: '1px solid var(--blue-border)' }}
          >
            <Globe className="w-4 h-4" style={{ color: 'var(--blue)' }} />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-[28px] font-extrabold tabular-nums leading-none" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {animatedBookings}
          </span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{t.recordsUnit}</span>
        </div>

        {/* Progress */}
        <div className="mt-3 space-y-1.5">
          <div className="flex justify-between text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
            <span className="flex items-center gap-1">
              <Globe className="w-3 h-3" style={{ color: 'var(--blue)' }} /> Booking ({stats.bookingComCount})
            </span>
            <span className="flex items-center gap-1">
              <Footprints className="w-3 h-3" style={{ color: 'var(--green)' }} /> Walk-in ({stats.walkInCount})
            </span>
          </div>
          <div
            className="w-full rounded-full h-1.5 flex overflow-hidden"
            style={{ background: 'var(--border-light)' }}
          >
            <div
              className="h-full rounded-l-full transition-all duration-1000 ease-out"
              style={{ width: `${bookingComPct}%`, background: 'var(--blue)' }}
            />
            <div
              className="h-full rounded-r-full transition-all duration-1000 ease-out"
              style={{ width: `${walkInPct}%`, background: 'var(--green)' }}
            />
          </div>
        </div>
      </div>

      {/* 3. Bed Types */}
      <div className="stat-card stat-card-rooms animate-scale-in delay-150">
        <div className="flex justify-between items-start mb-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.10em]" style={{ color: 'var(--violet)' }}>
            {t.bedTypesSelected}
          </p>
          <div
            className="p-2 rounded-xl"
            style={{ background: 'var(--violet-bg)', border: '1px solid var(--violet-border)' }}
          >
            <BedDouble className="w-4 h-4" style={{ color: 'var(--violet)' }} />
          </div>
        </div>

        <div className="space-y-2.5 mt-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg" style={{ background: 'var(--violet-bg)' }}>
                <BedDouble className="w-3.5 h-3.5" style={{ color: 'var(--violet)' }} />
              </div>
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{t.bigBedLabel}</span>
            </div>
            <span className="text-xl font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>{animatedBigBed}</span>
          </div>
          <div style={{ height: 1, background: 'var(--border-light)' }} />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg" style={{ background: '#e3fafc' }}>
                <BedSingle className="w-3.5 h-3.5" style={{ color: '#0c7a8a' }} />
              </div>
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{t.smallBedLabel}</span>
            </div>
            <span className="text-xl font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>{animatedSmallBed}</span>
          </div>
        </div>
      </div>

      {/* 4. Today */}
      <div className="stat-card stat-card-today animate-scale-in delay-225">
        <div className="flex justify-between items-start mb-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.10em]" style={{ color: 'var(--brand)' }}>
            {t.todayCheckIns}
          </p>
          <div
            className={`p-2 rounded-xl ${stats.todayCheckIns > 0 ? 'animate-badge-pulse' : ''}`}
            style={{ background: 'var(--brand-light)', border: '1px solid #c5d0fa' }}
          >
            <CalendarCheck className="w-4 h-4" style={{ color: 'var(--brand)' }} />
          </div>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-[32px] font-extrabold tabular-nums leading-none" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {animatedCheckIns}
          </span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{t.roomsUnit}</span>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{t.todayCheckOuts}:</span>
          <span className="text-sm font-bold" style={{ color: 'var(--red)' }}>{animatedCheckOuts}</span>
        </div>
      </div>

    </div>
  );
};
