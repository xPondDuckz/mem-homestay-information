import React from 'react';
import type { BookingRecord } from '../types/booking';
import { MonthSelector } from './MonthSelector';
import type { Language } from '../utils/translations';
import { TrendingUp, Globe, Footprints, BedDouble, DollarSign, CalendarCheck, Award, PieChart } from 'lucide-react';

interface AnalyticsViewProps {
  bookings: BookingRecord[];
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  availableMonths: string[];
  lang: Language;
  t: any;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  bookings,
  selectedMonth,
  onMonthChange,
  availableMonths,
  lang,
  t,
}) => {

  // Monthly revenue chart data (all available months)
  const monthlyRevenueMap: Record<string, number> = {};
  bookings.forEach((b) => {
    if (b.status === 'cancelled') return;
    const m = b.checkInDate ? b.checkInDate.slice(0, 7) : b.createdAt.slice(0, 7);
    monthlyRevenueMap[m] = (monthlyRevenueMap[m] || 0) + b.price;
  });

  const sortedMonths = Object.keys(monthlyRevenueMap).sort();
  const maxRevenue = Math.max(...Object.values(monthlyRevenueMap), 1);

  // Selected Month Filtered Bookings
  const currentMonthBookings = selectedMonth === 'all'
    ? bookings
    : bookings.filter((b) => (b.checkInDate && b.checkInDate.startsWith(selectedMonth)) || b.createdAt.startsWith(selectedMonth));

  const validBookings = currentMonthBookings.filter((b) => b.status !== 'cancelled');

  // Stats calculation
  const totalRevenue = validBookings.reduce((sum, b) => sum + b.price, 0);
  const avgRevenuePerBooking = validBookings.length > 0 ? Math.round(totalRevenue / validBookings.length) : 0;

  const bookingComCount = currentMonthBookings.filter((b) => b.bookingChannel === 'booking_com').length;
  const walkInCount = currentMonthBookings.filter((b) => b.bookingChannel === 'walk_in').length;
  const totalChannels = bookingComCount + walkInCount || 1;
  const bookingComPct = Math.round((bookingComCount / totalChannels) * 100);
  const walkInPct = 100 - bookingComPct;

  const bigBedCount = currentMonthBookings.filter((b) => b.bedType === 'big' || b.bedType === 'both').length;
  const smallBedCount = currentMonthBookings.filter((b) => b.bedType === 'small' || b.bedType === 'both').length;

  const statusConfirmedCount = currentMonthBookings.filter((b) => b.status === 'confirmed').length;
  const statusCheckedInCount = currentMonthBookings.filter((b) => b.status === 'checked_in').length;
  const statusCheckedOutCount = currentMonthBookings.filter((b) => b.status === 'checked_out').length;
  const statusCancelledCount = currentMonthBookings.filter((b) => b.status === 'cancelled').length;

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Month Selector Bar */}
      <MonthSelector
        selectedMonth={selectedMonth}
        onMonthChange={onMonthChange}
        availableMonths={availableMonths}
        lang={lang}
        t={t}
      />

      {/* ── TOP KPI CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Revenue Card */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-amber-400 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">รายได้รวมประจำเดือน</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-black">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-950 tracking-tight">฿{totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-slate-500 mt-1 font-bold">จากการจองสำเร็จ {validBookings.length} รายการ</p>
          </div>
        </div>

        {/* Avg Revenue per Stay Card */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-amber-400 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">รายได้เฉลี่ยต่อห้อง</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-950 tracking-tight">฿{avgRevenuePerBooking.toLocaleString()}</div>
            <p className="text-xs text-slate-500 mt-1 font-bold">ราคาเฉลี่ย / การจอง 1 ครั้ง</p>
          </div>
        </div>

        {/* Total Bookings Count Card */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-amber-400 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">จำนวนการจองทั้งหมด</span>
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-black">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-950 tracking-tight">{currentMonthBookings.length} รายการ</div>
            <p className="text-xs text-slate-500 mt-1 font-bold">คำขอลูกค้าในเดือนนี้</p>
          </div>
        </div>

        {/* Top Channel Card */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-amber-400 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">ช่องทางยอดนิยม</span>
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-black">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-black text-slate-950 tracking-tight">
              {bookingComCount >= walkInCount ? 'Booking.com' : 'Walk-in'}
            </div>
            <p className="text-xs text-slate-500 mt-1 font-bold">
              คิดเป็น {bookingComCount >= walkInCount ? bookingComPct : walkInPct}% ของยอดจอง
            </p>
          </div>
        </div>

      </div>

      {/* ── REVENUE BAR CHART & CHANNEL BREAKDOWN GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Monthly Revenue Bar Chart (Spans 2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-600" />
                กราฟเปรียบเทียบรายได้แต่ละเดือน (Monthly Revenue Trend)
              </h3>
              <p className="text-xs text-slate-500 font-bold mt-0.5">ยอดรายได้จากการจองห้องพักแบ่งตามเดือน</p>
            </div>
          </div>

          {/* Bar Chart Container */}
          <div className="pt-6 pb-2">
            {sortedMonths.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs italic">ไม่มีข้อมูลรายได้สำหรับแสดงกราฟ</div>
            ) : (
              <div className="flex items-end justify-around gap-2 h-52 border-b border-slate-200 pb-2">
                {sortedMonths.map((mKey) => {
                  const rev = monthlyRevenueMap[mKey] || 0;
                  const heightPct = Math.max(Math.round((rev / maxRevenue) * 100), 8);
                  const isSelected = selectedMonth === mKey;
                  const monthName = new Date(mKey + '-01').toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US', { month: 'short', year: '2-digit' });

                  return (
                    <div key={mKey} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer" onClick={() => onMonthChange(mKey)}>
                      {/* Tooltip revenue value */}
                      <span className="text-[10px] font-black text-slate-700 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all">
                        ฿{(rev / 1000).toFixed(1)}k
                      </span>

                      {/* Bar Pillar */}
                      <div className="w-full max-w-[48px] bg-slate-100 rounded-t-xl overflow-hidden flex items-end h-full p-0.5">
                        <div
                          style={{ height: `${heightPct}%` }}
                          className={`w-full rounded-t-lg transition-all duration-500 ${
                            isSelected
                              ? 'bg-amber-500 shadow-md ring-2 ring-amber-400/50'
                              : 'bg-slate-800 group-hover:bg-amber-500'
                          }`}
                        />
                      </div>

                      {/* Month label */}
                      <span className={`text-[11px] font-extrabold truncate max-w-full ${isSelected ? 'text-amber-700' : 'text-slate-500'}`}>
                        {monthName}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Channel & Bed Breakdown (1 col) */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-5">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-amber-600" />
              สัดส่วนช่องทางจอง (Channels)
            </h3>
            <p className="text-xs text-slate-500 font-bold mt-0.5">เปรียบเทียบ Booking.com กับ Walk-in</p>
          </div>

          {/* Channel Bar Meter */}
          <div className="space-y-2">
            <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex p-0.5 border border-slate-200">
              <div
                style={{ width: `${bookingComPct}%` }}
                className="bg-blue-600 h-full rounded-full transition-all duration-500"
                title={`Booking.com: ${bookingComPct}%`}
              />
              <div
                style={{ width: `${walkInPct}%` }}
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                title={`Walk-in: ${walkInPct}%`}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
              <div className="bg-blue-50 p-2.5 rounded-xl border border-blue-200">
                <span className="text-blue-900 font-bold flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-blue-600" /> Booking.com
                </span>
                <strong className="text-slate-950 font-black text-sm block mt-0.5">
                  {bookingComCount} รายการ ({bookingComPct}%)
                </strong>
              </div>

              <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                <span className="text-emerald-900 font-bold flex items-center gap-1">
                  <Footprints className="w-3.5 h-3.5 text-emerald-600" /> Walk-in
                </span>
                <strong className="text-slate-950 font-black text-sm block mt-0.5">
                  {walkInCount} รายการ ({walkInPct}%)
                </strong>
              </div>
            </div>
          </div>

          {/* Bed Types Breakdown */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <span className="text-xs font-black text-slate-700 uppercase tracking-wider block">สถิติประเภทเตียงที่ถูกจอง</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-purple-50 p-2.5 rounded-xl border border-purple-200">
                <span className="text-purple-900 font-bold flex items-center gap-1">
                  <BedDouble className="w-3.5 h-3.5 text-purple-600" /> เตียงใหญ่
                </span>
                <strong className="text-slate-950 font-black text-sm block mt-0.5">{bigBedCount} ห้อง</strong>
              </div>

              <div className="bg-cyan-50 p-2.5 rounded-xl border border-cyan-200">
                <span className="text-cyan-900 font-bold flex items-center gap-1">
                  <BedDouble className="w-3.5 h-3.5 text-cyan-600" /> เตียงเล็ก
                </span>
                <strong className="text-slate-950 font-black text-sm block mt-0.5">{smallBedCount} ห้อง</strong>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* ── STATUS BREAKDOWN STRIP ── */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-3">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
          สรุปสถานะรายการทั้งหมดประจำเดือน ({selectedMonth})
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200">
            <span className="text-emerald-800 font-bold block">รอเช็คอิน (Confirmed)</span>
            <strong className="text-slate-950 text-lg font-black">{statusConfirmedCount} รายการ</strong>
          </div>

          <div className="bg-blue-50 p-3 rounded-2xl border border-blue-200">
            <span className="text-blue-800 font-bold block">พักอยู่ (Checked-In)</span>
            <strong className="text-slate-950 text-lg font-black">{statusCheckedInCount} รายการ</strong>
          </div>

          <div className="bg-slate-100 p-3 rounded-2xl border border-slate-200">
            <span className="text-slate-700 font-bold block">เช็คเอาท์แล้ว (Checked-Out)</span>
            <strong className="text-slate-950 text-lg font-black">{statusCheckedOutCount} รายการ</strong>
          </div>

          <div className="bg-rose-50 p-3 rounded-2xl border border-rose-200">
            <span className="text-rose-800 font-bold block">ยกเลิก (Cancelled)</span>
            <strong className="text-slate-950 text-lg font-black">{statusCancelledCount} รายการ</strong>
          </div>
        </div>
      </div>

    </div>
  );
};
