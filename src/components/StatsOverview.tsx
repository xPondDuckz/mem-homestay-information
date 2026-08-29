import React from 'react';
import type { BookingStats } from '../types/booking';
import { Globe, Footprints, BedDouble, BedSingle, DollarSign, CalendarCheck, TrendingUp } from 'lucide-react';
import { useCountUp } from '../hooks/useCountUp';

interface StatsOverviewProps {
  stats: BookingStats;
  t: any;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ stats, t }) => {
  const totalChannels = (stats.bookingComCount + stats.walkInCount) || 1;
  const bookingComPercent = Math.round((stats.bookingComCount / totalChannels) * 100);
  const walkInPercent     = Math.round((stats.walkInCount    / totalChannels) * 100);

  // Animated counters
  const animatedRevenue    = useCountUp(stats.totalRevenue,   1100);
  const animatedBookings   = useCountUp(stats.totalBookings,  900);
  const animatedBigBed     = useCountUp(stats.bigBedCount,    800);
  const animatedSmallBed   = useCountUp(stats.smallBedCount,  800);
  const animatedCheckIns   = useCountUp(stats.todayCheckIns,  750);
  const animatedCheckOuts  = useCountUp(stats.todayCheckOuts, 750);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

      {/* 1. Total Revenue */}
      <div className="glass-card glass-card-hover rounded-2xl p-5 border-l-4 border-l-amber-500 relative overflow-hidden bg-white animate-scale-in delay-0">
        {/* Decorative shimmer stripe */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full -translate-y-8 translate-x-8 pointer-events-none" />
        <div className="relative flex justify-between items-start">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.totalRevenue}</p>
            <h3 className="text-2xl font-extrabold text-amber-600 mt-1 tabular-nums transition-all duration-150">
              ฿{animatedRevenue.toLocaleString()}
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t.totalBookings}: {stats.totalBookings} {t.recordsUnit}</span>
            </p>
          </div>
          <div className="p-2.5 bg-amber-100 rounded-xl border border-amber-200 text-amber-600 shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 2. Booking Channels */}
      <div className="glass-card glass-card-hover rounded-2xl p-5 border-l-4 border-l-blue-500 relative overflow-hidden bg-white animate-scale-in delay-75">
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -translate-y-8 translate-x-8 pointer-events-none" />
        <div className="relative">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.bookingChannels}</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-extrabold text-slate-900 tabular-nums">{animatedBookings}</span>
                <span className="text-xs text-slate-500">{t.recordsUnit}</span>
              </div>
            </div>
            <div className="p-2.5 bg-blue-100 rounded-xl border border-blue-200 text-blue-600 shrink-0">
              <Globe className="w-5 h-5" />
            </div>
          </div>

          {/* Animated Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold">
              <span className="flex items-center gap-1 text-blue-700">
                <Globe className="w-3 h-3" /> Booking.com ({stats.bookingComCount})
              </span>
              <span className="flex items-center gap-1 text-emerald-700">
                <Footprints className="w-3 h-3" /> Walk-in ({stats.walkInCount})
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 flex overflow-hidden">
              <div
                className="bg-blue-500 h-full rounded-l-full transition-all duration-1000 ease-out"
                style={{ width: `${bookingComPercent}%` }}
              />
              <div
                className="bg-emerald-500 h-full rounded-r-full transition-all duration-1000 ease-out"
                style={{ width: `${walkInPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bed Types */}
      <div className="glass-card glass-card-hover rounded-2xl p-5 border-l-4 border-l-purple-500 relative overflow-hidden bg-white animate-scale-in delay-150">
        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-full -translate-y-8 translate-x-8 pointer-events-none" />
        <div className="relative flex justify-between items-start">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.bedTypesSelected}</p>
            <div className="mt-2 space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-purple-100 rounded-lg">
                  <BedDouble className="w-4 h-4 text-purple-600" />
                </div>
                <span className="text-sm font-bold text-slate-700">{t.bigBedLabel}:</span>
                <span className="text-xl font-extrabold text-purple-600 tabular-nums">{animatedBigBed}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-cyan-100 rounded-lg">
                  <BedSingle className="w-4 h-4 text-cyan-600" />
                </div>
                <span className="text-sm font-bold text-slate-700">{t.smallBedLabel}:</span>
                <span className="text-xl font-extrabold text-cyan-600 tabular-nums">{animatedSmallBed}</span>
              </div>
            </div>
          </div>
          <div className="p-2.5 bg-purple-100 rounded-xl border border-purple-200 text-purple-600 shrink-0">
            <BedDouble className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 4. Today Check-ins */}
      <div className="glass-card glass-card-hover rounded-2xl p-5 border-l-4 border-l-emerald-500 relative overflow-hidden bg-white animate-scale-in delay-225">
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full -translate-y-8 translate-x-8 pointer-events-none" />
        <div className="relative flex justify-between items-start">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.todayCheckIns}</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-emerald-600 tabular-nums">{animatedCheckIns}</span>
              <span className="text-sm text-slate-600 font-semibold">{t.roomsUnit}</span>
            </div>
            <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-400 inline-block shrink-0" />
              {t.todayCheckOuts}:
              <strong className="text-rose-600 font-extrabold ml-0.5">{animatedCheckOuts}</strong>
            </p>
          </div>
          <div className={`p-2.5 bg-emerald-100 rounded-xl border border-emerald-200 text-emerald-600 shrink-0 ${stats.todayCheckIns > 0 ? 'animate-badge-pulse' : ''}`}>
            <CalendarCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

    </div>
  );
};
