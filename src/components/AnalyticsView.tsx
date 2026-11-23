import React, { useMemo, useState } from 'react';
import type { BookingRecord, Room } from '../types/booking';
import type { Language } from '../utils/translations';
import { localDate } from '../utils/formatters';

interface AnalyticsViewProps {
  bookings: BookingRecord[];
  rooms?: Room[];
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  availableMonths: string[];
  lang: Language;
  t: any;
}

type Metric = 'revenue' | 'bookings' | 'nights';

// Palette validated with the dataviz checker (light surface): series + comparison context.
const C_THIS = '#1a8a5f';
const C_PREV = '#d9d6ce';
const C_BOOKING = '#5b8fc7';
const C_WALKIN = '#1a8a5f';

const MONTHS_TH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const nightsOf = (b: BookingRecord) => {
  const d = Math.round((new Date(b.checkOutDate + 'T00:00:00').getTime() - new Date(b.checkInDate + 'T00:00:00').getTime()) / 86_400_000);
  return Number.isFinite(d) && d > 0 ? d : 1;
};

function summarize(list: BookingRecord[]) {
  const revenue = list.reduce((s, b) => s + (Number(b.price) || 0), 0);
  const nights = list.reduce((s, b) => s + nightsOf(b), 0);
  return { revenue, bookings: list.length, nights, adr: nights ? revenue / nights : 0 };
}

const fmt = (n: number) => Math.round(n).toLocaleString('th-TH');
const fmtShort = (n: number) => (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k` : fmt(n));

const Delta: React.FC<{ now: number; prev: number }> = ({ now, prev }) => {
  if (!prev) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
  const pct = Math.round(((now - prev) / prev) * 100);
  const up = pct >= 0;
  return <span style={{ color: up ? '#1d6a49' : '#9a3026' }}>{up ? '▲' : '▼'} {Math.abs(pct)}%</span>;
};

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ bookings, rooms = [], selectedMonth, lang }) => {
  const be = (y: number) => (lang === 'th' ? y + 543 : y);
  const months = lang === 'th' ? MONTHS_TH : MONTHS_EN;
  const thisYear = Number(localDate().slice(0, 4));

  const active = useMemo(() => bookings.filter((b) => b.status !== 'cancelled' && b.checkInDate), [bookings]);
  const years = useMemo(() => {
    const ys = new Set<number>([thisYear]);
    active.forEach((b) => ys.add(Number(b.checkInDate.slice(0, 4))));
    return Array.from(ys).filter(Boolean).sort((a, b) => b - a);
  }, [active, thisYear]);

  const [year, setYear] = useState<number>(() => (selectedMonth !== 'all' ? Number(selectedMonth.slice(0, 4)) : thisYear) || thisYear);
  const [metric, setMetric] = useState<Metric>('revenue');
  const [hover, setHover] = useState<number | null>(null);

  const inYear = (y: number) => active.filter((b) => b.checkInDate.startsWith(String(y)));
  const cur = summarize(inYear(year));
  const prev = summarize(inYear(year - 1));

  // Occupancy: nights sold / room-nights available (year to date for the current year).
  const daysInScope = year === thisYear
    ? Math.round((new Date(localDate() + 'T00:00:00').getTime() - new Date(`${year}-01-01T00:00:00`).getTime()) / 86_400_000) + 1
    : (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 366 : 365);
  const occupancy = rooms.length ? Math.min(100, Math.round((cur.nights / (rooms.length * daysInScope)) * 100)) : null;

  const monthly = useMemo(() => months.map((label, i) => {
    const key = String(i + 1).padStart(2, '0');
    const a = summarize(active.filter((b) => b.checkInDate.startsWith(`${year}-${key}`)));
    const p = summarize(active.filter((b) => b.checkInDate.startsWith(`${year - 1}-${key}`)));
    return { label, now: a[metric], prev: p[metric], a, p };
  }), [active, year, metric, months]);
  const max = Math.max(1, ...monthly.flatMap((m) => [m.now, m.prev]));
  const metricLabel: Record<Metric, string> = { revenue: 'รายได้', bookings: 'การจอง', nights: 'คืนที่ขายได้' };
  const show = (v: number) => (metric === 'revenue' ? `฿${fmt(v)}` : fmt(v));

  const yearList = inYear(year);
  const booking = yearList.filter((b) => b.bookingChannel === 'booking_com').length;
  const walkin = yearList.length - booking;
  const bookingPct = yearList.length ? Math.round((booking / yearList.length) * 100) : 0;

  const roomRows = rooms.map((r) => {
    const n = yearList.filter((b) => b.roomId === r.id).reduce((s, b) => s + nightsOf(b), 0);
    return { r, n, pct: Math.min(100, Math.round((n / daysInScope) * 100)) };
  });
  const unassigned = yearList.filter((b) => !b.roomId || !rooms.some((r) => r.id === b.roomId)).length;

  const tiles = [
    { label: 'รายได้', value: `฿${fmt(cur.revenue)}`, d: <Delta now={cur.revenue} prev={prev.revenue} /> },
    { label: 'การจอง', value: fmt(cur.bookings), d: <Delta now={cur.bookings} prev={prev.bookings} /> },
    { label: 'คืนที่ขายได้', value: fmt(cur.nights), d: <Delta now={cur.nights} prev={prev.nights} /> },
    { label: 'ราคาเฉลี่ย/คืน', value: `฿${fmt(cur.adr)}`, d: <Delta now={cur.adr} prev={prev.adr} /> },
    ...(occupancy !== null ? [{ label: year === thisYear ? 'อัตราเข้าพัก (ถึงวันนี้)' : 'อัตราเข้าพัก', value: `${occupancy}%`, d: null }] : []),
  ];

  return (
    <div className="space-y-4">
      {/* Year + metric */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {years.map((y) => (
            <button key={y} className="chip shrink-0" aria-pressed={y === year} onClick={() => setYear(y)}>
              {lang === 'th' ? `ปี ${be(y)}` : y}
            </button>
          ))}
        </div>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          เทียบกับปี {be(year - 1)} · นับตามวันเช็คอิน · ไม่รวมรายการยกเลิก
        </p>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {tiles.map((k, i) => (
          <div key={k.label} className="stat-card animate-rise stagger" style={{ '--i': i } as React.CSSProperties}>
            <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>{k.label}</p>
            <p className="text-[22px] sm:text-2xl font-semibold tabular mt-1 leading-tight" style={{ color: 'var(--text-primary)' }}>{k.value}</p>
            {k.d && <p className="text-xs mt-1 tabular">{k.d} <span style={{ color: 'var(--text-muted)' }}>จากปีก่อน</span></p>}
          </div>
        ))}
      </div>

      {/* Monthly chart */}
      <section className="card p-4 sm:p-5 animate-rise stagger" style={{ '--i': 5 } as React.CSSProperties}>
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{metricLabel[metric]}รายเดือน</h2>
            <div className="flex items-center gap-4 mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
              <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: C_THIS }} />ปี {be(year)}</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: C_PREV }} />ปี {be(year - 1)}</span>
            </div>
          </div>
          <div className="segmented sm:w-[300px]" style={{ '--count': 3, '--index': ['revenue', 'bookings', 'nights'].indexOf(metric) } as React.CSSProperties}>
            <span className="segmented-thumb" aria-hidden />
            {(['revenue', 'bookings', 'nights'] as Metric[]).map((k) => (
              <button key={k} className="segmented-btn !px-2" aria-current={metric === k ? 'page' : undefined} onClick={() => setMetric(k)}>
                {k === 'revenue' ? 'รายได้' : k === 'bookings' ? 'การจอง' : 'คืน'}
              </button>
            ))}
          </div>
        </header>

        <div className="relative" onMouseLeave={() => setHover(null)}>
          {/* recessive grid */}
          <div className="absolute inset-x-0 top-0 h-[200px] pointer-events-none">
            {[1, 0.5, 0].map((f) => (
              <div key={f} className="absolute inset-x-0 flex items-center gap-2" style={{ top: `${(1 - f) * 100}%`, transform: 'translateY(-50%)' }}>
                <span className="text-[10.5px] w-9 text-right tabular" style={{ color: 'var(--text-muted)' }}>{fmtShort(max * f)}</span>
                <span className="flex-1 h-px" style={{ background: f === 0 ? 'var(--border-default)' : 'var(--border-light)' }} />
              </div>
            ))}
          </div>

          <div className="relative grid grid-cols-12 gap-1 sm:gap-2 pl-11 h-[200px] items-end">
            {monthly.map((m, i) => (
              <button
                key={m.label}
                className="relative h-full flex items-end justify-center gap-[2px] rounded-md"
                style={{ background: hover === i ? 'var(--bg-muted)' : undefined }}
                onMouseEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
                onClick={() => setHover(hover === i ? null : i)}
                aria-label={`${m.label}: ${show(m.now)}, ปีก่อน ${show(m.prev)}`}
              >
                <span className="w-[30%] max-w-[10px] rounded-t-[4px] origin-bottom chart-bar" style={{ height: `${(m.prev / max) * 100}%`, background: C_PREV, animationDelay: `${i * 25}ms` }} />
                <span className="w-[42%] max-w-[16px] rounded-t-[4px] origin-bottom chart-bar" style={{ height: `${(m.now / max) * 100}%`, background: C_THIS, animationDelay: `${i * 25 + 80}ms` }} />
              </button>
            ))}
          </div>
          <div className="grid grid-cols-12 gap-1 sm:gap-2 pl-11 mt-1.5">
            {monthly.map((m) => <span key={m.label} className="text-[10.5px] sm:text-xs text-center" style={{ color: 'var(--text-muted)' }}>{m.label}</span>)}
          </div>

          {hover !== null && (
            <div
              className="absolute z-10 top-0 px-3 py-2 rounded-xl text-xs pointer-events-none animate-fade-in whitespace-nowrap"
              style={{
                left: `calc(44px + (100% - 44px) * ${(hover + 0.5) / 12})`,
                transform: `translateX(${hover > 8 ? '-100%' : hover < 3 ? '0' : '-50%'})`,
                background: 'var(--text-primary)', color: '#fff', boxShadow: 'var(--shadow-md)',
              }}
            >
              <p className="font-medium mb-1">{monthly[hover].label}</p>
              <p className="tabular"><span className="inline-block w-2 h-2 rounded-sm mr-1.5" style={{ background: C_THIS }} />{be(year)}: {show(monthly[hover].now)}</p>
              <p className="tabular opacity-80"><span className="inline-block w-2 h-2 rounded-sm mr-1.5" style={{ background: C_PREV }} />{be(year - 1)}: {show(monthly[hover].prev)}</p>
            </div>
          )}
        </div>

        <details className="mt-4 group">
          <summary className="text-sm cursor-pointer select-none" style={{ color: 'var(--brand)' }}>ดูเป็นตาราง</summary>
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-[13px] tabular">
              <thead>
                <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-light)' }}>
                  <th className="text-left font-normal py-2">เดือน</th>
                  <th className="text-right font-normal py-2">รายได้</th>
                  <th className="text-right font-normal py-2">การจอง</th>
                  <th className="text-right font-normal py-2">คืน</th>
                  <th className="text-right font-normal py-2">รายได้ปีก่อน</th>
                </tr>
              </thead>
              <tbody>
                {monthly.map((m) => (
                  <tr key={m.label} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td className="py-1.5">{m.label}</td>
                    <td className="text-right">฿{fmt(m.a.revenue)}</td>
                    <td className="text-right">{m.a.bookings}</td>
                    <td className="text-right">{m.a.nights}</td>
                    <td className="text-right" style={{ color: 'var(--text-muted)' }}>฿{fmt(m.p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Channel split */}
        <section className="card p-4 sm:p-5 animate-rise stagger" style={{ '--i': 6 } as React.CSSProperties}>
          <h2 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>ช่องทางการจอง</h2>
          {yearList.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>ยังไม่มีข้อมูลปีนี้</p>
          ) : (
            <>
              <div className="flex h-3 rounded-full overflow-hidden gap-[2px]">
                {booking > 0 && <span className="chart-hbar" style={{ width: `${bookingPct}%`, background: C_BOOKING }} />}
                {walkin > 0 && <span className="chart-hbar" style={{ width: `${100 - bookingPct}%`, background: C_WALKIN }} />}
              </div>
              <div className="flex justify-between mt-3 text-sm">
                <span className="inline-flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: C_BOOKING }} />Booking.com <strong className="tabular">{bookingPct}%</strong> <span className="tabular" style={{ color: 'var(--text-muted)' }}>({booking})</span></span>
                <span className="inline-flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: C_WALKIN }} />Walk-in <strong className="tabular">{100 - bookingPct}%</strong> <span className="tabular" style={{ color: 'var(--text-muted)' }}>({walkin})</span></span>
              </div>
            </>
          )}
        </section>

        {/* Room occupancy */}
        <section className="card p-4 sm:p-5 animate-rise stagger" style={{ '--i': 7 } as React.CSSProperties}>
          <h2 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>อัตราเข้าพักรายห้อง</h2>
          {roomRows.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>ยังไม่ได้ตั้งค่าห้อง</p>
          ) : (
            <ul className="space-y-3">
              {roomRows.map(({ r, n, pct }) => (
                <li key={r.id} title={`${r.name}: ${n} คืน`}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span style={{ color: 'var(--text-primary)' }}>{r.name}</span>
                    <span className="tabular" style={{ color: 'var(--text-secondary)' }}>{pct}% <span style={{ color: 'var(--text-muted)' }}>· {n} คืน</span></span>
                  </div>
                  <div className="h-2 rounded-full" style={{ background: 'var(--bg-muted)' }}>
                    <div className="h-full rounded-full chart-hbar" style={{ width: `${pct}%`, background: C_THIS }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
          {unassigned > 0 && (
            <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>มี {unassigned} รายการที่ยังไม่ได้ระบุห้อง (ไม่นับในรายห้อง)</p>
          )}
        </section>
      </div>
    </div>
  );
};
