import type { BookingRecord, Room } from '../types/booking';
import { localDate } from './formatters';

export interface IcalEvent { uid: string; start: string; end: string; summary: string }

/** "20261123" or "20261123T140000Z" -> "2026-11-23" */
const icsDate = (v: string) => {
  const m = v.match(/(\d{4})(\d{2})(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : '';
};

/** Minimal VEVENT parser (DTSTART, DTEND, UID, SUMMARY). */
export function parseIcs(text: string): IcalEvent[] {
  const lines = text.replace(/\r?\n[ \t]/g, '').split(/\r?\n/); // unfold continuation lines
  const events: IcalEvent[] = [];
  let cur: Partial<IcalEvent> | null = null;
  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') cur = {};
    else if (line === 'END:VEVENT') {
      if (cur?.start) events.push({ uid: cur.uid || cur.start, start: cur.start, end: cur.end || cur.start, summary: cur.summary || '' });
      cur = null;
    } else if (cur) {
      const idx = line.indexOf(':');
      if (idx < 0) continue;
      const key = line.slice(0, idx).split(';')[0].toUpperCase();
      const val = line.slice(idx + 1).trim();
      if (key === 'DTSTART') cur.start = icsDate(val);
      else if (key === 'DTEND') cur.end = icsDate(val);
      else if (key === 'UID') cur.uid = val;
      else if (key === 'SUMMARY') cur.summary = val.replace(/\\,/g, ',');
    }
  }
  return events;
}

const icalId = (roomId: string, uid: string) =>
  'ICAL-' + roomId + '-' + uid.replace(/[^a-zA-Z0-9]/g, '').slice(-24);

/**
 * Merge feed events into bookings.
 * - adds new stays (skips ones already entered by hand: same bed + check-in, Booking.com)
 * - updates dates of earlier imports if Booking.com moved them
 * - cancels future imports that disappeared from the feed
 */
export function mergeIcal(bookings: BookingRecord[], room: Room, events: IcalEvent[]) {
  const bed = room.bedType;
  const today = localDate();
  const seen = new Set<string>();
  let added = 0, updated = 0, cancelled = 0;
  const next = bookings.map((b) => ({ ...b }));
  const byId = new Map(next.map((b) => [b.id, b]));

  for (const ev of events) {
    if (ev.end < today) continue; // ignore past stays
    const id = icalId(room.id, ev.uid);
    seen.add(id);
    const existing = byId.get(id);
    if (existing) {
      if (existing.checkInDate !== ev.start || existing.checkOutDate !== ev.end) {
        existing.checkInDate = ev.start;
        existing.checkOutDate = ev.end;
        updated++;
      }
      continue;
    }
    const manual = next.some(
      (b) => b.source !== 'ical' && b.bookingChannel === 'booking_com' && b.status !== 'cancelled' &&
        b.checkInDate === ev.start && (b.roomId ? b.roomId === room.id : b.bedType === bed || b.bedType === 'both'),
    );
    if (manual) continue;
    const rec: BookingRecord = {
      id,
      createdAt: today,
      customerName: 'Booking.com (นำเข้า)',
      phoneNumber: '',
      bedType: bed,
      roomId: room.id,
      bookingChannel: 'booking_com',
      checkInDate: ev.start,
      checkInTime: '14:00',
      checkOutDate: ev.end,
      checkOutTime: '12:00',
      price: 0,
      notes: ev.summary ? `นำเข้าจาก Booking.com: ${ev.summary}` : 'นำเข้าจาก Booking.com',
      status: 'confirmed',
      paymentMethod: 'booking_com',
      source: 'ical',
    };
    next.unshift(rec);
    byId.set(id, rec);
    added++;
  }

  // An empty feed is more likely a broken link than "no bookings" — don't cancel anything then.
  if (events.length) for (const b of next) {
    if (b.source === 'ical' && b.roomId === room.id && b.status === 'confirmed' && b.checkInDate >= today && !seen.has(b.id)) {
      b.status = 'cancelled';
      cancelled++;
    }
  }

  return { bookings: added || updated || cancelled ? next : bookings, added, updated, cancelled };
}
