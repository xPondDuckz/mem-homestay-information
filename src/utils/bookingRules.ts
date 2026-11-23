import type { BookingRecord, PaymentMethod, PaymentStatus } from '../types/booking';

/** Two bookings need the same bed if either uses "both", or they use the same type. */
const bedsClash = (a: BookingRecord['bedType'], b: BookingRecord['bedType']) =>
  a === 'both' || b === 'both' || a === b;

/** Stays overlap when one starts before the other ends (check-out day is free for a new check-in). */
const nextDay = (d: string) => new Date(new Date(d + 'T00:00:00Z').getTime() + 86_400_000).toISOString().slice(0, 10);
const stayEnd = (inD: string, outD: string) => (outD > inD ? outD : nextDay(inD)); // same-day stay = 1 night
const staysOverlap = (aIn: string, aOut: string, bIn: string, bOut: string) =>
  aIn < stayEnd(bIn, bOut) && bIn < stayEnd(aIn, aOut);

/** Same room when both have one; otherwise fall back to bed type (older records). */
const unitsClash = (a: Pick<BookingRecord, 'roomId' | 'bedType'>, b: Pick<BookingRecord, 'roomId' | 'bedType'>) =>
  a.roomId && b.roomId ? a.roomId === b.roomId : bedsClash(a.bedType, b.bedType);

/** Other active bookings that need the same room/bed on overlapping dates. */
export function findOverlaps(target: Pick<BookingRecord, 'id' | 'bedType' | 'roomId' | 'checkInDate' | 'checkOutDate'>, all: BookingRecord[]) {
  if (!target.checkInDate) return [];
  return all.filter(
    (b) =>
      b.id !== target.id &&
      b.status !== 'cancelled' &&
      b.status !== 'checked_out' &&
      unitsClash(b, target) &&
      staysOverlap(target.checkInDate, target.checkOutDate || target.checkInDate, b.checkInDate, b.checkOutDate || b.checkInDate),
  );
}

const digits = (s: string) => String(s || '').replace(/\D/g, '');

/** Previous stays of the same guest, matched by phone number (newest first). */
export function findGuestHistory(phone: string, all: BookingRecord[], excludeId?: string) {
  const p = digits(phone);
  if (p.length < 9) return [];
  return all
    .filter((b) => b.id !== excludeId && b.source !== 'ical' && digits(b.phoneNumber) === p)
    .sort((a, b) => b.checkInDate.localeCompare(a.checkInDate));
}

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  unpaid: 'ยังไม่ชำระ',
  deposit: 'มัดจำแล้ว',
  paid: 'ชำระครบ',
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: 'เงินสด',
  transfer: 'โอนเงิน',
  booking_com: 'Booking.com',
};

/** Amount still owed. */
export const balanceDue = (b: Pick<BookingRecord, 'price' | 'paymentStatus' | 'depositAmount'>) =>
  b.paymentStatus === 'paid' ? 0 : b.paymentStatus === 'deposit' ? Math.max(0, b.price - (Number(b.depositAmount) || 0)) : b.price;
