import React from 'react';
import type { BookingRecord, Room } from '../types/booking';
import type { Language } from '../utils/translations';
import { LogIn, LogOut, BedDouble, Sparkles, Wallet, Check, ChevronRight } from 'lucide-react';
import { formatDateThai, localDate } from '../utils/formatters';
import { balanceDue } from '../utils/bookingRules';
import { roomName } from '../utils/settings';

interface TodayViewProps {
  bookings: BookingRecord[];
  rooms: Room[];
  lang: Language;
  t: any;
  onEdit: (b: BookingRecord) => void;
  onQuickUpdateStatus: (id: string, status: BookingRecord['status']) => void;
  onUpdate: (b: BookingRecord) => void;
  onAddForRoom: (room: Room) => void;
}

/** Bookings that still owe money (only ones with a payment status recorded). */
export const unpaidBookings = (bookings: BookingRecord[]) =>
  bookings
    .filter((b) => b.status !== 'cancelled' && b.paymentStatus && b.paymentStatus !== 'paid' && balanceDue(b) > 0)
    .sort((a, b) => a.checkOutDate.localeCompare(b.checkOutDate));

const Section: React.FC<{ i: number; icon: React.ReactNode; title: string; count: number; tone: string; children: React.ReactNode; empty: string }> = ({
  i, icon, title, count, tone, children, empty,
}) => (
  <section className="card p-4 sm:p-5 animate-rise stagger" style={{ '--i': i } as React.CSSProperties}>
    <header className="flex items-center gap-2.5 mb-3">
      <span className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `var(--${tone}-bg)`, color: `var(--${tone})` }}>{icon}</span>
      <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
      <span className="ml-auto text-sm tabular" style={{ color: 'var(--text-muted)' }}>{count}</span>
    </header>
    {count === 0 ? <p className="text-sm py-2" style={{ color: 'var(--text-muted)' }}>{empty}</p> : <ul className="space-y-1">{children}</ul>}
  </section>
);

const Row: React.FC<{ b: BookingRecord; sub: React.ReactNode; action?: React.ReactNode; onEdit: (b: BookingRecord) => void }> = ({ b, sub, action, onEdit }) => (
  <li className="flex items-center gap-3 -mx-2 px-2 py-2 rounded-xl transition-colors hover:bg-[var(--bg-muted)]">
    <button onClick={() => onEdit(b)} className="flex-1 min-w-0 text-left">
      <p className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>{b.customerName}</p>
      <p className="text-[13px] truncate" style={{ color: 'var(--text-muted)' }}>{sub}</p>
    </button>
    {action}
  </li>
);

export const TodayView: React.FC<TodayViewProps> = ({ bookings, rooms, lang, onEdit, onQuickUpdateStatus, onUpdate, onAddForRoom }) => {
  const today = localDate();
  const active = bookings.filter((b) => b.status !== 'cancelled');
  const label = (b: BookingRecord) => roomName(b, rooms) || (b.bedType === 'small' ? 'เตียงเล็ก' : b.bedType === 'both' ? 'ใหญ่ + เล็ก' : 'เตียงใหญ่');

  const arrivals = active.filter((b) => b.checkInDate === today && b.status === 'confirmed');
  const departures = active.filter((b) => b.checkOutDate === today && b.status === 'checked_in');
  const inHouse = active.filter((b) => b.status === 'checked_in' && b.checkOutDate !== today);
  const toClean = active.filter((b) => b.status === 'checked_out' && !b.cleanedAt && b.checkOutDate >= addDays(today, -3));
  const unpaid = unpaidBookings(bookings);

  // Room board: occupied / arriving / needs cleaning / free
  const board = rooms.map((r) => {
    const onlyRoomOfType = rooms.filter((x) => x.bedType === r.bedType).length === 1;
    const here = active.filter((b) => b.roomId === r.id || (!b.roomId && onlyRoomOfType && b.bedType === r.bedType));
    const occupant = here.find((b) => b.status === 'checked_in');
    const arriving = here.find((b) => b.status === 'confirmed' && b.checkInDate === today);
    const dirty = here.find((b) => b.status === 'checked_out' && !b.cleanedAt && b.checkOutDate >= addDays(today, -3));
    const state = occupant ? 'occupied' : dirty ? 'dirty' : arriving ? 'arriving' : 'free';
    return { r, state, who: occupant || arriving || dirty };
  });
  const STATE: Record<string, { label: string; tone: string }> = {
    occupied: { label: 'มีแขกพัก', tone: 'blue' },
    arriving: { label: 'รอเช็คอินวันนี้', tone: 'amber' },
    dirty: { label: 'รอทำความสะอาด', tone: 'red' },
    free: { label: 'ว่าง', tone: 'green' },
  };

  const markClean = (b: BookingRecord) => onUpdate({ ...b, cleanedAt: today });
  const markPaid = (b: BookingRecord) => onUpdate({ ...b, paymentStatus: 'paid', paymentMethod: b.paymentMethod || (b.bookingChannel === 'booking_com' ? 'booking_com' : 'cash') });

  return (
    <div className="space-y-4">
      {/* Room board */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {board.map(({ r, state, who }, i) => (
          <button
            key={r.id}
            onClick={() => (who ? onEdit(who) : onAddForRoom(r))}
            className="card lift p-4 text-left animate-rise stagger"
            style={{ '--i': i } as React.CSSProperties}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{r.name}</span>
              <BedDouble className="w-4 h-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
            </div>
            <span className="badge mt-2" style={{ background: `var(--${STATE[state].tone}-bg)`, color: `var(--${STATE[state].tone})` }}>
              <span className="badge-dot" />{STATE[state].label}
            </span>
            <p className="text-[13px] mt-2 truncate" style={{ color: 'var(--text-muted)' }}>
              {who ? who.customerName : lang === 'th' ? 'แตะเพื่อเพิ่มการจอง' : 'Tap to add booking'}
            </p>
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section i={1} icon={<LogIn className="w-4 h-4" />} title="เช็คอินวันนี้" count={arrivals.length} tone="green" empty="ไม่มีแขกเช็คอินวันนี้">
          {arrivals.map((b) => (
            <Row key={b.id} b={b} onEdit={onEdit} sub={`${label(b)} · ${b.checkInTime} น.`}
              action={<button onClick={() => onQuickUpdateStatus(b.id, 'checked_in')} className="btn-soft btn-soft-green shrink-0"><LogIn className="w-3.5 h-3.5" />เช็คอิน</button>} />
          ))}
        </Section>

        <Section i={2} icon={<LogOut className="w-4 h-4" />} title="เช็คเอาท์วันนี้" count={departures.length} tone="red" empty="ไม่มีแขกเช็คเอาท์วันนี้">
          {departures.map((b) => (
            <Row key={b.id} b={b} onEdit={onEdit}
              sub={<>{label(b)} · {b.checkOutTime} น.{balanceDue(b) > 0 && b.paymentStatus && b.paymentStatus !== 'paid' && <span style={{ color: 'var(--red)' }}> · ค้าง ฿{balanceDue(b).toLocaleString()}</span>}</>}
              action={<button onClick={() => onQuickUpdateStatus(b.id, 'checked_out')} className="btn-soft btn-soft-red shrink-0"><LogOut className="w-3.5 h-3.5" />เช็คเอาท์</button>} />
          ))}
        </Section>

        <Section i={3} icon={<Wallet className="w-4 h-4" />} title="ค้างชำระ" count={unpaid.length} tone="amber" empty="ไม่มียอดค้างชำระ">
          {unpaid.map((b) => (
            <Row key={b.id} b={b} onEdit={onEdit}
              sub={<><strong className="tabular" style={{ color: 'var(--text-primary)' }}>฿{balanceDue(b).toLocaleString()}</strong> · {b.paymentStatus === 'deposit' ? 'มัดจำแล้ว' : 'ยังไม่ชำระ'} · ออก {formatDateThai(b.checkOutDate)}{b.status === 'checked_out' && <span style={{ color: 'var(--red)' }}> · เช็คเอาท์แล้ว</span>}</>}
              action={<button onClick={() => markPaid(b)} className="btn-soft btn-soft-green shrink-0"><Check className="w-3.5 h-3.5" />รับชำระครบ</button>} />
          ))}
        </Section>

        <Section i={4} icon={<Sparkles className="w-4 h-4" />} title="ห้องที่ต้องทำความสะอาด" count={toClean.length} tone="blue" empty="ทุกห้องสะอาดแล้ว">
          {toClean.map((b) => (
            <Row key={b.id} b={b} onEdit={onEdit} sub={`${label(b)} · ออก ${formatDateThai(b.checkOutDate)}`}
              action={<button onClick={() => markClean(b)} className="btn-soft shrink-0" style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}><Sparkles className="w-3.5 h-3.5" />สะอาดแล้ว</button>} />
          ))}
        </Section>
      </div>

      {inHouse.length > 0 && (
        <Section i={5} icon={<BedDouble className="w-4 h-4" />} title="พักอยู่ตอนนี้" count={inHouse.length} tone="violet" empty="">
          {inHouse.map((b) => (
            <Row key={b.id} b={b} onEdit={onEdit} sub={`${label(b)} · ออก ${formatDateThai(b.checkOutDate)}`}
              action={<ChevronRight className="w-4 h-4 shrink-0" style={{ color: 'var(--text-muted)' }} />} />
          ))}
        </Section>
      )}
    </div>
  );
};

function addDays(d: string, n: number) {
  const x = new Date(d + 'T00:00:00');
  x.setDate(x.getDate() + n);
  return localDate(x);
}
