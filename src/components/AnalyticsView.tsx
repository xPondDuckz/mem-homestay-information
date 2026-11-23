import React, { useState, useMemo } from 'react';
import type { BookingRecord } from '../types/booking';
import { MonthSelector } from './MonthSelector';
import type { Language } from '../utils/translations';
import {
  TrendingUp,
  Globe,
  Footprints,
  BedDouble,
  DollarSign,
  CalendarCheck,
  Award,
  PieChart,
  Users,
  BarChart3,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

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
  const [chartMode, setChartMode] = useState<'monthly' | 'compare_years' | 'yearly'>('monthly');
  const [chartMetric, setChartMetric] = useState<'customers' | 'revenue'>('customers');

  const availableYears = useMemo(() => {
    const yearsSet = new Set<string>();
    yearsSet.add(new Date().getFullYear().toString());
    bookings.forEach((b) => {
      const year = b.checkInDate ? b.checkInDate.slice(0, 4) : b.createdAt.slice(0, 4);
      if (year && year.length === 4) {
        yearsSet.add(year);
      }
    });
    return Array.from(yearsSet).sort().reverse();
  }, [bookings]);

  const [selectedYear, setSelectedYear] = useState<string>(() => {
    return new Date().getFullYear().toString();
  });

  const [compareYear, setCompareYear] = useState<string>(() => {
    const years = Array.from(new Set([new Date().getFullYear().toString(), ...availableYears])).sort().reverse();
    if (years.length > 1) return years[1];
    return (new Date().getFullYear() - 1).toString();
  });

  const monthNames = [
    { key: '01', th: 'ม.ค.', en: 'Jan' },
    { key: '02', th: 'ก.พ.', en: 'Feb' },
    { key: '03', th: 'มี.ค.', en: 'Mar' },
    { key: '04', th: 'เม.ย.', en: 'Apr' },
    { key: '05', th: 'พ.ค.', en: 'May' },
    { key: '06', th: 'มิ.ย.', en: 'Jun' },
    { key: '07', th: 'ก.ค.', en: 'Jul' },
    { key: '08', th: 'ส.ค.', en: 'Aug' },
    { key: '09', th: 'ก.ย.', en: 'Sep' },
    { key: '10', th: 'ต.ค.', en: 'Oct' },
    { key: '11', th: 'พ.ย.', en: 'Nov' },
    { key: '12', th: 'ธ.ค.', en: 'Dec' },
  ];

  const monthlyChartData = useMemo(() => {
    return monthNames.map((m) => {
      const monthStr = `${selectedYear}-${m.key}`;
      const monthBookings = bookings.filter((b) => {
        const checkInM = b.checkInDate ? b.checkInDate.slice(0, 7) : b.createdAt.slice(0, 7);
        return checkInM === monthStr;
      });

      const validBookings = monthBookings.filter((b) => b.status !== 'cancelled');
      const customerCount = validBookings.length;
      const revenue = validBookings.reduce((sum, b) => sum + (b.price || 0), 0);

      return {
        monthKey: monthStr,
        label: lang === 'th' ? m.th : m.en,
        customerCount,
        revenue,
        totalBookings: monthBookings.length,
      };
    });
  }, [bookings, selectedYear, lang]);

  const compareYearsChartData = useMemo(() => {
    return monthNames.map((m) => {
      const monthStrBase = `${selectedYear}-${m.key}`;
      const monthStrCompare = `${compareYear}-${m.key}`;

      const baseBookings = bookings.filter((b) => {
        const checkInM = b.checkInDate ? b.checkInDate.slice(0, 7) : b.createdAt.slice(0, 7);
        return checkInM === monthStrBase && b.status !== 'cancelled';
      });

      const compareBookings = bookings.filter((b) => {
        const checkInM = b.checkInDate ? b.checkInDate.slice(0, 7) : b.createdAt.slice(0, 7);
        return checkInM === monthStrCompare && b.status !== 'cancelled';
      });

      const custBase = baseBookings.length;
      const revBase = baseBookings.reduce((sum, b) => sum + (b.price || 0), 0);

      const custCompare = compareBookings.length;
      const revCompare = compareBookings.reduce((sum, b) => sum + (b.price || 0), 0);

      const valBase = chartMetric === 'customers' ? custBase : revBase;
      const valCompare = chartMetric === 'customers' ? custCompare : revCompare;

      const diff = valBase - valCompare;
      let growthPct = 0;
      if (valCompare > 0) {
        growthPct = Math.round(((valBase - valCompare) / valCompare) * 100);
      } else if (valBase > 0) {
        growthPct = 100;
      }

      return {
        monthKey: m.key,
        label: lang === 'th' ? m.th : m.en,
        custBase,
        revBase,
        custCompare,
        revCompare,
        valBase,
        valCompare,
        diff,
        growthPct,
      };
    });
  }, [bookings, selectedYear, compareYear, chartMetric, lang]);

  const yearlyChartData = useMemo(() => {
    const yearsList = [...availableYears].sort();
    let prevCustomers = 0;
    let prevRevenue = 0;

    return yearsList.map((yearStr) => {
      const yearBookings = bookings.filter((b) => {
        const y = b.checkInDate ? b.checkInDate.slice(0, 4) : b.createdAt.slice(0, 4);
        return y === yearStr;
      });

      const validBookings = yearBookings.filter((b) => b.status !== 'cancelled');
      const customerCount = validBookings.length;
      const revenue = validBookings.reduce((sum, b) => sum + (b.price || 0), 0);

      let customerGrowthPct = 0;
      if (prevCustomers > 0) {
        customerGrowthPct = Math.round(((customerCount - prevCustomers) / prevCustomers) * 100);
      }

      let revenueGrowthPct = 0;
      if (prevRevenue > 0) {
        revenueGrowthPct = Math.round(((revenue - prevRevenue) / prevRevenue) * 100);
      }

      prevCustomers = customerCount;
      prevRevenue = revenue;

      return {
        year: yearStr,
        customerCount,
        revenue,
        customerGrowthPct,
        revenueGrowthPct,
        totalBookings: yearBookings.length,
      };
    });
  }, [bookings, availableYears]);

  const maxMonthlyVal = useMemo(() => {
    const vals = monthlyChartData.map((d) => (chartMetric === 'customers' ? d.customerCount : d.revenue));
    return Math.max(...vals, 1);
  }, [monthlyChartData, chartMetric]);

  const maxCompareVal = useMemo(() => {
    const vals = compareYearsChartData.flatMap((d) => [d.valBase, d.valCompare]);
    return Math.max(...vals, 1);
  }, [compareYearsChartData]);

  const maxYearlyVal = useMemo(() => {
    const vals = yearlyChartData.map((d) => (chartMetric === 'customers' ? d.customerCount : d.revenue));
    return Math.max(...vals, 1);
  }, [yearlyChartData, chartMetric]);

  const currentMonthBookings = selectedMonth === 'all'
    ? bookings
    : bookings.filter((b) => (b.checkInDate && b.checkInDate.startsWith(selectedMonth)) || b.createdAt.startsWith(selectedMonth));

  const validBookings = currentMonthBookings.filter((b) => b.status !== 'cancelled');

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

      <MonthSelector
        selectedMonth={selectedMonth}
        onMonthChange={onMonthChange}
        availableMonths={availableMonths}
        lang={lang}
        t={t}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        <div className="card p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>รายได้รวมประจำเดือน</span>
            <div className="p-2 rounded-xl" style={{ background: 'var(--green-bg)', border: '1px solid var(--green-border)' }}>
              <DollarSign className="w-4 h-4" style={{ color: 'var(--green)' }} />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>฿{totalRevenue.toLocaleString()}</div>
          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>จากการจองสำเร็จ {validBookings.length} รายการ</p>
        </div>

        <div className="card p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>รายได้เฉลี่ยต่อห้อง</span>
            <div className="p-2 rounded-xl" style={{ background: 'var(--blue-bg)', border: '1px solid var(--blue-border)' }}>
              <TrendingUp className="w-4 h-4" style={{ color: 'var(--blue)' }} />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>฿{avgRevenuePerBooking.toLocaleString()}</div>
          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>ราคาเฉลี่ย / การจอง 1 ครั้ง</p>
        </div>

        <div className="card p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>จำนวนการจองทั้งหมด</span>
            <div className="p-2 rounded-xl" style={{ background: 'var(--violet-bg)', border: '1px solid var(--violet-border)' }}>
              <CalendarCheck className="w-4 h-4" style={{ color: 'var(--violet)' }} />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>{currentMonthBookings.length} รายการ</div>
          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>คำขอลูกค้าในเดือนนี้</p>
        </div>

        <div className="card p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>ช่องทางยอดนิยม</span>
            <div className="p-2 rounded-xl" style={{ background: 'var(--brand-light)', border: '1px solid var(--brand-border)' }}>
              <Award className="w-4 h-4" style={{ color: 'var(--brand)' }} />
            </div>
          </div>
          <div className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {bookingComCount >= walkInCount ? 'Booking.com' : 'Walk-in'}
          </div>
          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            คิดเป็น {bookingComCount >= walkInCount ? bookingComPct : walkInPct}% ของยอดจอง
          </p>
        </div>
      </div>

      {/* Comparison Chart Container */}
      <div className="card p-5 sm:p-6 space-y-5">

        {/* Controls Bar */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4" style={{ borderBottom: '1px solid var(--border-light)' }}>
          <div>
            <h3 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <BarChart3 className="w-5 h-5" style={{ color: 'var(--brand)' }} />
              กราฟเปรียบเทียบสถิติลูกค้าและรายได้
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              เปรียบเทียบจำนวนลูกค้าหรือรายได้รวม แยกตามรายเดือน หรือ รายปี (YoY)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-stretch lg:self-auto">
            {/* Mode Switcher */}
            <div className="flex flex-wrap items-center p-1 rounded-xl" style={{ background: 'var(--bg-muted)', border: '1px solid var(--border-light)' }}>
              <button
                onClick={() => setChartMode('monthly')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={chartMode === 'monthly' ? { background: 'var(--brand)', color: '#fff' } : { color: 'var(--text-secondary)' }}
              >
                <Calendar className="w-3.5 h-3.5" />
                รายเดือน
              </button>
              <button
                onClick={() => setChartMode('compare_years')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={chartMode === 'compare_years' ? { background: 'var(--brand)', color: '#fff' } : { color: 'var(--text-secondary)' }}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                เทียบ 2 ปี
              </button>
              <button
                onClick={() => setChartMode('yearly')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={chartMode === 'yearly' ? { background: 'var(--brand)', color: '#fff' } : { color: 'var(--text-secondary)' }}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                รายปี YoY
              </button>
            </div>

            {/* Metric Switcher */}
            <div className="flex items-center p-1 rounded-xl" style={{ background: 'var(--bg-muted)', border: '1px solid var(--border-light)' }}>
              <button
                onClick={() => setChartMetric('customers')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={chartMetric === 'customers' ? { background: 'var(--brand)', color: '#fff' } : { color: 'var(--text-secondary)' }}
              >
                <Users className="w-3.5 h-3.5" />
                จำนวนคน
              </button>
              <button
                onClick={() => setChartMetric('revenue')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={chartMetric === 'revenue' ? { background: 'var(--brand)', color: '#fff' } : { color: 'var(--text-secondary)' }}
              >
                <DollarSign className="w-3.5 h-3.5" />
                รายได้
              </button>
            </div>

            {/* Year Selector Dropdown */}
            {chartMode === 'monthly' && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold" style={{ background: 'var(--bg-muted)', border: '1px solid var(--border-light)' }}>
                <span style={{ color: 'var(--text-muted)' }}>ปี:</span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="bg-transparent font-bold cursor-pointer"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {availableYears.map((y) => (
                    <option key={y} value={y}>
                      {y} ({parseInt(y) + 543})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* MODE 1: MONTHLY CHART */}
        {chartMode === 'monthly' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold px-1" style={{ color: 'var(--text-muted)' }}>
              <span>
                แสดงสถิติรายเดือนประจำปี <strong style={{ color: 'var(--text-primary)' }}>{selectedYear}</strong> (
                {chartMetric === 'customers' ? 'จำนวนลูกค้าเข้าพัก' : 'ยอดเงินรายได้บาท'})
              </span>
              <span className="font-bold" style={{ color: 'var(--brand)' }}>
                {chartMetric === 'customers'
                  ? `รวมทั้งปี: ${monthlyChartData.reduce((sum, d) => sum + d.customerCount, 0)} รายการ`
                  : `รายได้รวมทั้งปี: ฿${monthlyChartData.reduce((sum, d) => sum + d.revenue, 0).toLocaleString()}`}
              </span>
            </div>

            <div className="pt-6 pb-2">
              <div className="flex items-end justify-between gap-1 sm:gap-2 h-60 pb-2" style={{ borderBottom: '1px solid var(--border-light)' }}>
                {monthlyChartData.map((d) => {
                  const val = chartMetric === 'customers' ? d.customerCount : d.revenue;
                  const heightPct = Math.max(Math.round((val / maxMonthlyVal) * 100), val > 0 ? 10 : 3);
                  const isCurrentSelected = selectedMonth === d.monthKey;

                  return (
                    <div
                      key={d.monthKey}
                      className="flex-1 flex flex-col items-center gap-1.5 group cursor-pointer"
                      onClick={() => onMonthChange(d.monthKey)}
                      title={`${d.label} ${selectedYear}: ${
                        chartMetric === 'customers' ? `${d.customerCount} รายการ` : `฿${d.revenue.toLocaleString()}`
                      }`}
                    >
                      <span className="text-[10px] font-bold transition-all text-center" style={{ color: 'var(--text-secondary)' }}>
                        {chartMetric === 'customers'
                          ? val > 0 ? `${val}` : '-'
                          : val > 0 ? `฿${(val / 1000).toFixed(1)}k` : '-'}
                      </span>

                      <div className="w-full max-w-[36px] rounded-t-xl overflow-hidden flex items-end h-full p-0.5" style={{ background: 'var(--bg-muted)' }}>
                        <div
                          style={{
                            height: `${heightPct}%`,
                            background: isCurrentSelected ? 'var(--brand)' : val > 0 ? 'var(--text-primary)' : 'var(--border-default)',
                          }}
                          className="w-full rounded-t-md transition-all duration-500 group-hover:bg-brand"
                        />
                      </div>

                      <span
                        className="text-[11px] font-semibold truncate max-w-full"
                        style={{ color: isCurrentSelected ? 'var(--brand)' : 'var(--text-secondary)' }}
                      >
                        {d.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* MODE 2: COMPARE 2 YEARS CHART */}
        {chartMode === 'compare_years' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs p-3 rounded-xl" style={{ background: 'var(--bg-muted)', border: '1px solid var(--border-light)' }}>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1.5 font-semibold">
                  <span className="w-3.5 h-3.5 rounded-md inline-block" style={{ background: 'var(--brand)' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>ปีหลัก:</span>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="bg-white font-bold border rounded-lg px-2 py-1 text-xs cursor-pointer"
                    style={{ borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                  >
                    {availableYears.map((y) => (
                      <option key={`base-${y}`} value={y}>
                        {y} ({parseInt(y) + 543})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5 font-semibold">
                  <span className="w-3.5 h-3.5 rounded-md inline-block" style={{ background: 'var(--green)' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>ปีเทียบ:</span>
                  <select
                    value={compareYear}
                    onChange={(e) => setCompareYear(e.target.value)}
                    className="bg-white font-bold border rounded-lg px-2 py-1 text-xs cursor-pointer"
                    style={{ borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                  >
                    {availableYears.map((y) => (
                      <option key={`comp-${y}`} value={y}>
                        {y} ({parseInt(y) + 543})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-6 pb-2">
              <div className="flex items-end justify-between gap-1 sm:gap-2 h-64 pb-2" style={{ borderBottom: '1px solid var(--border-light)' }}>
                {compareYearsChartData.map((d) => {
                  const hBasePct = Math.max(Math.round((d.valBase / maxCompareVal) * 100), d.valBase > 0 ? 10 : 3);
                  const hCompPct = Math.max(Math.round((d.valCompare / maxCompareVal) * 100), d.valCompare > 0 ? 10 : 3);

                  return (
                    <div
                      key={d.monthKey}
                      className="flex-1 flex flex-col items-center gap-1.5 group relative min-w-0"
                    >
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border whitespace-nowrap ${
                        d.growthPct > 0 ? 'badge-confirmed' : d.growthPct < 0 ? 'badge-cancelled' : 'badge-checked_out'
                      }`}>
                        {d.growthPct > 0 ? `+${d.growthPct}%` : `${d.growthPct}%`}
                      </span>

                      <div className="w-full flex items-end justify-center gap-0.5 rounded-t-xl h-full p-0.5" style={{ background: 'var(--bg-muted)', border: '1px solid var(--border-light)' }}>
                        <div className="flex-1 flex flex-col items-center justify-end h-full min-w-0">
                          <div
                            style={{ height: `${hBasePct}%`, background: 'var(--brand)' }}
                            className="w-full rounded-t-md transition-all duration-500"
                          />
                        </div>

                        <div className="flex-1 flex flex-col items-center justify-end h-full min-w-0">
                          <div
                            style={{ height: `${hCompPct}%`, background: 'var(--green)' }}
                            className="w-full rounded-t-md transition-all duration-500"
                          />
                        </div>
                      </div>

                      <span className="text-[11px] font-semibold mt-1" style={{ color: 'var(--text-primary)' }}>{d.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* MODE 3: YEARLY YoY CHART */}
        {chartMode === 'yearly' && (
          <div className="space-y-4">
            <div className="text-xs font-semibold px-1" style={{ color: 'var(--text-muted)' }}>
              เปรียบเทียบสถิติรายปี (Year-over-Year Comparison) ครอบคลุมทุกปีที่มีข้อมูล
            </div>

            <div className="pt-6 pb-2">
              <div className="flex items-end justify-around gap-4 h-64 pb-2" style={{ borderBottom: '1px solid var(--border-light)' }}>
                {yearlyChartData.map((yData) => {
                  const val = chartMetric === 'customers' ? yData.customerCount : yData.revenue;
                  const heightPct = Math.max(Math.round((val / maxYearlyVal) * 100), val > 0 ? 12 : 5);
                  const growth = chartMetric === 'customers' ? yData.customerGrowthPct : yData.revenueGrowthPct;

                  return (
                    <div key={yData.year} className="flex-1 max-w-[120px] flex flex-col items-center gap-2 group">
                      {growth !== 0 && (
                        <div
                          className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            growth > 0 ? 'badge-confirmed' : 'badge-cancelled'
                          }`}
                        >
                          {growth > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {growth > 0 ? `+${growth}%` : `${growth}%`} YoY
                        </div>
                      )}

                      <span className="text-xs font-bold text-center" style={{ color: 'var(--text-primary)' }}>
                        {chartMetric === 'customers'
                          ? `${yData.customerCount} รายการ`
                          : `฿${yData.revenue.toLocaleString()}`}
                      </span>

                      <div className="w-full rounded-t-2xl overflow-hidden flex items-end h-full p-1" style={{ background: 'var(--bg-muted)', border: '1px solid var(--border-light)' }}>
                        <div
                          style={{ height: `${heightPct}%`, background: 'var(--brand)' }}
                          className="w-full rounded-t-xl transition-all duration-500"
                        />
                      </div>

                      <div className="text-center">
                        <span className="text-sm font-bold block" style={{ color: 'var(--text-primary)' }}>{yData.year}</span>
                        <span className="text-[10px] block font-medium" style={{ color: 'var(--text-muted)' }}>
                          ({parseInt(yData.year) + 543})
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CHANNEL & BED BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 card p-5 sm:p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <PieChart className="w-5 h-5" style={{ color: 'var(--brand)' }} />
              สัดส่วนช่องทางจอง (Channels)
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>เปรียบเทียบ Booking.com กับ Walk-in</p>
          </div>

          <div className="space-y-3">
            <div className="h-4 w-full rounded-full overflow-hidden flex p-0.5" style={{ background: 'var(--bg-muted)', border: '1px solid var(--border-light)' }}>
              <div
                style={{ width: `${bookingComPct}%`, background: 'var(--blue)' }}
                className="h-full rounded-full transition-all duration-500"
              />
              <div
                style={{ width: `${walkInPct}%`, background: 'var(--green)' }}
                className="h-full rounded-full transition-all duration-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
              <div className="p-3 rounded-xl" style={{ background: 'var(--blue-bg)', border: '1px solid var(--blue-border)' }}>
                <span className="font-semibold flex items-center gap-1" style={{ color: '#2c5784' }}>
                  <Globe className="w-4 h-4" /> Booking.com
                </span>
                <strong className="font-bold text-base block mt-1" style={{ color: 'var(--text-primary)' }}>
                  {bookingComCount} รายการ ({bookingComPct}%)
                </strong>
              </div>

              <div className="p-3 rounded-xl" style={{ background: 'var(--green-bg)', border: '1px solid var(--green-border)' }}>
                <span className="font-semibold flex items-center gap-1" style={{ color: '#1d6a49' }}>
                  <Footprints className="w-4 h-4" /> Walk-in
                </span>
                <strong className="font-bold text-base block mt-1" style={{ color: 'var(--text-primary)' }}>
                  {walkInCount} รายการ ({walkInPct}%)
                </strong>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-5 sm:p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <BedDouble className="w-5 h-5" style={{ color: 'var(--brand)' }} />
              สถิติประเภทเตียง
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>จำแนกประเภทเตียงที่ลูกค้าจอง</p>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-xl flex items-center justify-between" style={{ background: 'var(--violet-bg)', border: '1px solid var(--violet-border)' }}>
              <span className="font-semibold flex items-center gap-1.5" style={{ color: '#544690' }}>
                <BedDouble className="w-4 h-4" /> เตียงใหญ่ (Big Bed)
              </span>
              <strong className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>{bigBedCount} ห้อง</strong>
            </div>

            <div className="p-3 rounded-xl flex items-center justify-between" style={{ background: 'var(--bg-muted)', border: '1px solid var(--border-default)' }}>
              <span className="font-semibold flex items-center gap-1.5" style={{ color: '#57564f' }}>
                <BedDouble className="w-4 h-4" /> เตียงเล็ก (Small Bed)
              </span>
              <strong className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>{smallBedCount} ห้อง</strong>
            </div>
          </div>
        </div>
      </div>

      {/* STATUS BREAKDOWN STRIP */}
      <div className="card p-5 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
          สรุปสถานะรายการทั้งหมดประจำเดือน ({selectedMonth})
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl" style={{ background: 'var(--green-bg)', border: '1px solid var(--green-border)' }}>
            <span className="font-semibold block" style={{ color: '#1d6a49' }}>รอเช็คอิน (Confirmed)</span>
            <strong className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{statusConfirmedCount} รายการ</strong>
          </div>

          <div className="p-3 rounded-xl" style={{ background: 'var(--blue-bg)', border: '1px solid var(--blue-border)' }}>
            <span className="font-semibold block" style={{ color: '#2c5784' }}>พักอยู่ (Checked-In)</span>
            <strong className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{statusCheckedInCount} รายการ</strong>
          </div>

          <div className="p-3 rounded-xl" style={{ background: 'var(--bg-muted)', border: '1px solid var(--border-light)' }}>
            <span className="font-semibold block" style={{ color: 'var(--text-secondary)' }}>เช็คเอาท์แล้ว (Checked-Out)</span>
            <strong className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{statusCheckedOutCount} รายการ</strong>
          </div>

          <div className="p-3 rounded-xl" style={{ background: 'var(--red-bg)', border: '1px solid var(--red-border)' }}>
            <span className="font-semibold block" style={{ color: '#9a3026' }}>ยกเลิก (Cancelled)</span>
            <strong className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{statusCancelledCount} รายการ</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
