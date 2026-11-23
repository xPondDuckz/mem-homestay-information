import React, { useMemo } from 'react';
import type { BookingRecord, Room } from '../types/booking';
import { MonthSelector } from './MonthSelector';
import type { Language } from '../utils/translations';
import { localDate } from '../utils/formatters';

interface CalendarViewProps {
  bookings: BookingRecord[];
  rooms: Room[];
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  availableMonths: string[];
  onEditBooking: (booking: BookingRecord) => void;
  onAddBookingForDate: (dateStr: string, room?: Room) => void;
  lang: Language;
  t: any;
}

const STATUS_STYLE: Record<string, { bg: string; fg: string; label: string }> = {
  confirmed:   { bg: 'var(--amber-bg)', fg: '#8a5a10', label: 'รอเช็คอิน' },
  checked_in:  { bg: 'var(--green-bg)', fg: '#1d6a49', label: 'พักอยู่' },
  checked_out: { bg: 'var(--bg-muted)', fg: 'var(--text-secondary)', label: 'เช็คเอาท์แล้ว' },
};
const EDGE: Record<string, string> = { confirmed: 'var(--amber)', checked_in: 'var(--green)', checked_out: 'var(--border-strong)' };

const pad = (n: number) => String(n).padStart(2, '0');
const dayDiff = (a: string, b: string) => Math.round((new Date(b + 'T00:00:00').getTime() - new Date(a + 'T00:00:00').getTime()) / 86_400_000);

interface Bar { b: BookingRecord; start: number; span: number; lane: number; clipL: boolean; clipR: boolean }

export const CalendarView: React.FC<CalendarViewProps> = ({
  bookings, rooms, selectedMonth, onMonthChange, availableMonths, onEditBooking, onAddBookingForDate, lang, t,
}) => {
  const month = selectedMonth === 'all' ? localDate().slice(0, 7) : selectedMonth;
  const [y, m] = month.split('-').map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const first = `${month}-01`;
  const afterLast = localDate(new Date(y, m, 1));
  const today = localDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(y, m - 1, i + 1);
    return { n: i + 1, date: `${month}-${pad(i + 1)}`, dow: d.getDay() };
  });
  const dowLabel = lang === 'th' ? ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'] : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  // Rows = rooms (+ "unassigned" for older bookings that can't be matched to one room).
  const rows = useMemo(() => {
    const visible = bookings.filter(
      (b) => b.status !== 'cancelled' && b.checkInDate && b.checkInDate < afterLast && (b.checkOutDate > b.checkInDate ? b.checkOutDate : b.checkInDate) >= first,
    );
    const rowOf = (b: BookingRecord) => {
      if (b.roomId && rooms.some((r) => r.id === b.roomId)) return b.roomId;
      const same = rooms.filter((r) => r.bedType === b.bedType);
      return same.length === 1 ? same[0].id : '__none';
    };
    const groups = new Map<string, BookingRecord[]>();
    visible.forEach((b) => { const k = rowOf(b); groups.set(k, [...(groups.get(k) || []), b]); });

    const layout = (list: BookingRecord[]): { bars: Bar[]; lanes: number } => {
      const laneEnds: number[] = [];
      const bars = [...list].sort((a, b) => a.checkInDate.localeCompare(b.checkInDate)).map((b) => {
        const nights = Math.max(1, dayDiff(b.checkInDate, b.checkOutDate));
        const s = dayDiff(first, b.checkInDate);
        const e = s + nights;
        const start = Math.max(0, s), end = Math.min(daysInMonth, e);
        let lane = laneEnds.findIndex((le) => le <= start);
        if (lane < 0) { lane = laneEnds.length; laneEnds.push(end); } else laneEnds[lane] = end;
        return { b, start, span: Math.max(1, end - start), lane, clipL: s < 0, clipR: e > daysInMonth };
      });
      return { bars, lanes: Math.max(1, laneEnds.length) };
    };

    const out = rooms.map((r) => ({ key: r.id, room: r as Room | undefined, name: r.name, ...layout(groups.get(r.id) || []) }));
    if (groups.has('__none')) out.push({ key: '__none', room: undefined, name: lang === 'th' ? 'ไม่ระบุห้อง' : 'No room', ...layout(groups.get('__none')!) });
    return out;
  }, [bookings, rooms, first, afterLast, daysInMonth, lang]);

  const occupiedNights = rows.filter((r) => r.room).reduce((s, r) => s + r.bars.reduce((x, bar) => x + bar.span, 0), 0);
  const capacity = rooms.length * daysInMonth || 1;

  const cols = `minmax(112px, 150px) repeat(${daysInMonth}, minmax(var(--day-min), 1fr))`;
  const LANE = 34;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <MonthSelector selectedMonth={month} onMonthChange={onMonthChange} availableMonths={availableMonths} lang={lang} t={t} />
        <div className="flex items-center gap-4 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
          <span className="tabular">{lang === 'th' ? 'เข้าพัก' : 'Occupancy'} <strong style={{ color: 'var(--text-primary)' }}>{Math.round((occupiedNights / capacity) * 100)}%</strong></span>
          {Object.entries(STATUS_STYLE).map(([k, s]) => (
            <span key={k} className="hidden sm:inline-flex items-center gap-1.5">
              <span className="w-4 h-2.5 rounded-sm" style={{ background: s.bg, boxShadow: `inset 3px 0 0 ${EDGE[k]}` }} />{s.label}
            </span>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden [--day-min:34px] lg:[--day-min:24px]">
        <div className="overflow-x-auto">
          <div className="min-w-max" style={{ minWidth: '100%' }}>
            {/* Day header */}
            <div className="grid sticky top-0 z-20 bg-[var(--bg-surface)]" style={{ gridTemplateColumns: cols, borderBottom: '1px solid var(--border-light)' }}>
              <div className="sticky left-0 z-10 bg-[var(--bg-surface)] px-3 py-2 text-xs" style={{ color: 'var(--text-muted)', borderRight: '1px solid var(--border-light)' }}>
                {lang === 'th' ? 'ห้อง' : 'Room'}
              </div>
              {days.map((d) => (
                <div key={d.n} className="py-1.5 text-center leading-tight"
                  style={{ background: d.date === today ? 'var(--brand-light)' : d.dow === 0 || d.dow === 6 ? '#fbfaf7' : undefined }}>
                  <div className="text-[10.5px]" style={{ color: d.dow === 0 ? 'var(--red)' : 'var(--text-muted)' }}>{dowLabel[d.dow]}</div>
                  <div className="text-[13px] tabular" style={{ color: d.date === today ? 'var(--brand)' : 'var(--text-primary)', fontWeight: d.date === today ? 600 : 400 }}>{d.n}</div>
                </div>
              ))}
            </div>

            {/* Rooms */}
            {rows.map((row, ri) => (
              <div key={row.key} className="grid relative" style={{ gridTemplateColumns: cols, gridTemplateRows: `repeat(${row.lanes}, ${LANE}px)`, borderBottom: ri === rows.length - 1 ? 'none' : '1px solid var(--border-light)' }}>
                <div className="sticky left-0 z-10 bg-[var(--bg-surface)] px-3 flex items-center text-sm font-medium truncate"
                  style={{ gridRow: '1 / -1', gridColumn: 1, color: row.room ? 'var(--text-primary)' : 'var(--text-muted)', borderRight: '1px solid var(--border-light)' }}>
                  <span className="truncate">{row.name}</span>
                </div>

                {/* Empty cells: tap to book */}
                {days.map((d, i) => (
                  <button
                    key={d.n}
                    onClick={() => onAddBookingForDate(d.date, row.room)}
                    title={`${lang === 'th' ? 'เพิ่มการจอง' : 'Add booking'} · ${d.n}`}
                    className="cal-cell"
                    style={{
                      gridRow: '1 / -1', gridColumn: i + 2,
                      background: d.date === today ? 'rgba(31,111,84,0.05)' : d.dow === 0 || d.dow === 6 ? '#fbfaf7' : undefined,
                      borderLeft: i === 0 ? 'none' : '1px solid #f3f2ee',
                    }}
                  />
                ))}

                {/* Booking bars */}
                {row.bars.map(({ b, start, span, lane, clipL, clipR }, i) => {
                  const st = STATUS_STYLE[b.status] ?? STATUS_STYLE.confirmed;
                  return (
                    <button
                      key={b.id}
                      onClick={() => onEditBooking(b)}
                      title={`${b.customerName} · ${b.checkInDate} → ${b.checkOutDate}`}
                      className="cal-bar relative z-[5] my-[3px] mx-[2px] px-2 flex items-center gap-1.5 text-[12.5px] text-left overflow-hidden"
                      style={{
                        gridRow: lane + 1, gridColumn: `${start + 2} / span ${span}`,
                        background: st.bg, color: st.fg,
                        borderRadius: `${clipL ? 0 : 8}px ${clipR ? 0 : 8}px ${clipR ? 0 : 8}px ${clipL ? 0 : 8}px`,
                        boxShadow: clipL ? undefined : `inset 3px 0 0 ${EDGE[b.status] ?? EDGE.confirmed}`,
                        animationDelay: `${Math.min(ri * 3 + i, 12) * 30}ms`,
                      }}
                    >
                      <span className="truncate font-medium">{b.customerName}</span>
                    </button>
                  );
                })}
              </div>
            ))}

            {rows.length === 0 && (
              <p className="p-6 text-sm text-center" style={{ color: 'var(--text-muted)' }}>
                {lang === 'th' ? 'ยังไม่มีห้อง — เพิ่มห้องได้จากไอคอนประตูด้านบน' : 'No rooms yet'}
              </p>
            )}
          </div>
        </div>
      </div>

      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        {lang === 'th' ? 'แตะช่องว่างเพื่อเพิ่มการจองในห้องและวันนั้น · แตะแถบเพื่อดู/แก้ไข · ไม่แสดงรายการที่ยกเลิก' : 'Tap an empty cell to book · tap a bar to edit'}
      </p>
    </div>
  );
};
