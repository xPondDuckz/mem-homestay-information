import React, { useState, useEffect, useMemo } from 'react';
import type { BookingRecord, BedType, BookingChannel, BookingStatus, PaymentStatus, PaymentMethod, Room } from '../types/booking';
import { findOverlaps, findGuestHistory, PAYMENT_STATUS_LABEL, PAYMENT_METHOD_LABEL, balanceDue } from '../utils/bookingRules';
import { formatDateThai, localDate } from '../utils/formatters';
import { generateBookingId } from '../utils/storage';
import {
  X, Globe, Footprints, Clock, Plus, Minus, Printer, AlertTriangle, History, BedDouble, ChevronDown,
} from 'lucide-react';

interface BookingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (booking: BookingRecord) => void;
  onPrintReceipt?: (booking: BookingRecord) => void;
  initialData?: BookingRecord | null;
  allBookings?: BookingRecord[];
  rooms?: Room[];
  t: any;
}

const Section: React.FC<{ title: string; children: React.ReactNode; i: number }> = ({ title, children, i }) => (
  <section className="space-y-3 animate-rise stagger" style={{ '--i': i } as React.CSSProperties}>
    <h3 className="text-xs font-semibold tracking-wide" style={{ color: 'var(--text-muted)' }}>{title}</h3>
    {children}
  </section>
);

export const BookingFormModal: React.FC<BookingFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onPrintReceipt,
  initialData,
  allBookings = [],
  rooms = [],
  t,
}) => {

  const todayStr = localDate();
  const tomorrowStr = localDate(new Date(Date.now() + 86400000));

  const [formData, setFormData] = useState<Partial<BookingRecord>>({
    createdAt: todayStr,
    customerName: '',
    phoneNumber: '',
    bedType: 'big',
    bookingChannel: 'booking_com',
    checkInDate: todayStr,
    checkInTime: '14:00',
    checkOutDate: tomorrowStr,
    checkOutTime: '12:00',
    price: 1500,
    notes: '',
    status: 'confirmed',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [overlapAck, setOverlapAck] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        id: generateBookingId(),
        createdAt: todayStr,
        customerName: '',
        phoneNumber: '',
        bedType: rooms.find((r) => r.bedType === 'big')?.bedType ?? rooms[0]?.bedType ?? 'big',
        bookingChannel: 'booking_com',
        checkInDate: todayStr,
        checkInTime: '14:00',
        checkOutDate: tomorrowStr,
        checkOutTime: '12:00',
        price: 1500,
        notes: '',
        status: 'confirmed',
        paymentStatus: 'unpaid',
        roomId: rooms.find((r) => r.bedType === 'big')?.id ?? rooms[0]?.id,
      });
    }
    setErrors({});
    setOverlapAck(false);
  }, [initialData, isOpen]);

  const nights = useMemo(() => {
    if (!formData.checkInDate || !formData.checkOutDate) return 1;
    const dIn = new Date(formData.checkInDate);
    const dOut = new Date(formData.checkOutDate);
    const diffTime = dOut.getTime() - dIn.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  }, [formData.checkInDate, formData.checkOutDate]);

  const overlaps = useMemo(
    () => (formData.status === 'cancelled' || !formData.bedType ? [] :
      findOverlaps({ id: formData.id || '', bedType: formData.bedType as BedType, roomId: formData.roomId, checkInDate: formData.checkInDate || '', checkOutDate: formData.checkOutDate || '' }, allBookings)),
    [formData.id, formData.bedType, formData.roomId, formData.checkInDate, formData.checkOutDate, formData.status, allBookings],
  );
  useEffect(() => setOverlapAck(false), [formData.bedType, formData.roomId, formData.checkInDate, formData.checkOutDate]);

  const history = useMemo(
    () => findGuestHistory(formData.phoneNumber || '', allBookings, formData.id),
    [formData.phoneNumber, formData.id, allBookings],
  );
  const lastStay = history[0];

  if (!isOpen) return null;

  const useLastGuest = () => {
    if (!lastStay) return;
    setFormData((prev) => ({
      ...prev,
      customerName: lastStay.customerName,
      companyName: lastStay.companyName,
      customerAddress: lastStay.customerAddress,
      taxId: lastStay.taxId,
    }));
  };

  const addDaysTo = (d: string, n: number) => {
    const x = new Date((d || todayStr) + 'T00:00:00');
    x.setDate(x.getDate() + n);
    return localDate(x);
  };
  const rate = formData.price && nights > 0 ? Math.round(Number(formData.price) / nights) : 1500;

  /** Change number of nights: moves check-out and scales the price by the nightly rate. */
  const setNights = (n: number) => {
    const next = Math.max(1, n);
    setFormData((prev) => ({ ...prev, checkOutDate: addDaysTo(prev.checkInDate || todayStr, next), price: rate * next }));
  };
  /** Moving check-in keeps the length of stay. */
  const setCheckIn = (d: string) => setFormData((prev) => ({ ...prev, checkInDate: d, checkOutDate: addDaysTo(d, nights) }));

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.customerName?.trim()) newErrors.customerName = t.errNameRequired;
    if (!formData.phoneNumber?.trim())  newErrors.phoneNumber = t.errPhoneRequired;
    if (!formData.price || formData.price <= 0) newErrors.price = t.errPriceRequired;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      document.querySelector('[data-error="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (overlaps.length > 0 && !overlapAck) {
      setOverlapAck(true);
      document.getElementById('overlap-warning')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const recordToSave: BookingRecord = {
      ...(formData as BookingRecord), // keep invoice/tax/payment fields when editing
      id: formData.id || generateBookingId(),
      createdAt: formData.createdAt || todayStr,
      customerName: formData.customerName?.trim() || '',
      phoneNumber: formData.phoneNumber?.trim() || '',
      bedType: (formData.bedType as BedType) || 'big',
      bookingChannel: (formData.bookingChannel as BookingChannel) || 'booking_com',
      checkInDate: formData.checkInDate || todayStr,
      checkInTime: formData.checkInTime || '14:00',
      checkOutDate: formData.checkOutDate || tomorrowStr,
      checkOutTime: formData.checkOutTime || '12:00',
      price: Number(formData.price) || 0,
      notes: formData.notes?.trim() || '',
      status: (formData.status as BookingStatus) || 'confirmed',
      paymentStatus: (formData.paymentStatus as PaymentStatus) || 'unpaid',
      paymentMethod: formData.paymentStatus && formData.paymentStatus !== 'unpaid' ? (formData.paymentMethod as PaymentMethod | undefined) : undefined,
      depositAmount: formData.paymentStatus === 'deposit' ? Number(formData.depositAmount) || 0 : undefined,
    };

    onSave(recordToSave);
    onClose();
  };

  const isEdit = Boolean(initialData?.customerName);
  const label = 'block text-[13px] mb-1.5 text-[var(--text-muted)]';
  const input = 'w-full glass-input h-11 px-3.5';
  const STATUSES: { v: BookingStatus; l: string }[] = [
    { v: 'confirmed', l: 'รอเช็คอิน' }, { v: 'checked_in', l: 'พักอยู่' },
    { v: 'checked_out', l: 'ออกแล้ว' }, { v: 'cancelled', l: 'ยกเลิก' },
  ];
  const BEDS: { v: BedType; l: string }[] = [{ v: 'big', l: t.bedBig || 'เตียงใหญ่' }, { v: 'small', l: t.bedSmall || 'เตียงเล็ก' }, { v: 'both', l: 'ใหญ่ + เล็ก' }];
  const seg = (count: number, index: number) => ({ '--count': count, '--index': Math.max(0, index) } as React.CSSProperties);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center animate-fade-in modal-overlay">
      <div className="modal-panel w-full sm:max-w-xl rounded-b-none sm:rounded-[20px] overflow-hidden max-h-[94dvh] flex flex-col animate-slide-up">
        <div className="sm:hidden pt-2.5 flex justify-center shrink-0"><span className="w-10 h-1 rounded-full" style={{ background: 'var(--border-default)' }} /></div>

        {/* Header */}
        <div className="px-5 pt-3 sm:pt-4 pb-3 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>
              {isEdit ? t.modalEditTitle : t.modalAddTitle}
            </h2>
            <p className="text-xs mt-0.5 tabular" style={{ color: 'var(--text-muted)' }}>
              {formatDateThai(formData.checkInDate)} → {formatDateThai(formData.checkOutDate)} · {nights} คืน · ฿{(Number(formData.price) || 0).toLocaleString()}
            </p>
          </div>
          <button id="form-close-btn" type="button" onClick={onClose} aria-label="ปิด" className="icon-btn"><X className="w-5 h-5" /></button>
        </div>

        <form id="booking-form" onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-5 pb-5 pt-1 space-y-6">

          {/* 1. Guest */}
          <Section title="ลูกค้า" i={0}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div data-error={!!errors.customerName}>
                <label htmlFor="field-name" className={label}>{t.fieldName} <span style={{ color: 'var(--red)' }}>*</span></label>
                <input id="field-name" autoComplete="off" placeholder={t.fieldNamePlaceholder}
                  value={formData.customerName} onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className={input} style={errors.customerName ? { borderColor: 'var(--red)' } : undefined} />
                {errors.customerName && <p className="text-xs mt-1 animate-fade-in" style={{ color: 'var(--red)' }}>{errors.customerName}</p>}
              </div>
              <div data-error={!!errors.phoneNumber}>
                <label htmlFor="field-phone" className={label}>{t.fieldPhone} <span style={{ color: 'var(--red)' }}>*</span></label>
                <input id="field-phone" type="tel" inputMode="tel" autoComplete="off" placeholder={t.fieldPhonePlaceholder}
                  value={formData.phoneNumber} onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className={`${input} tabular`} style={errors.phoneNumber ? { borderColor: 'var(--red)' } : undefined} />
                {errors.phoneNumber && <p className="text-xs mt-1 animate-fade-in" style={{ color: 'var(--red)' }}>{errors.phoneNumber}</p>}
              </div>
            </div>
            {lastStay && (
              <div className="rounded-xl px-3.5 py-3 flex items-center gap-3 animate-rise" style={{ background: 'var(--blue-bg)' }}>
                <History className="w-4 h-4 shrink-0" style={{ color: 'var(--blue)' }} />
                <div className="flex-1 min-w-0 text-[13px] leading-snug" style={{ color: 'var(--text-secondary)' }}>
                  <p><strong style={{ color: 'var(--text-primary)' }}>ลูกค้าเก่า</strong> · พักมาแล้ว {history.length} ครั้ง</p>
                  <p className="truncate">ล่าสุด {formatDateThai(lastStay.checkInDate)} · {lastStay.customerName}</p>
                </div>
                {formData.customerName?.trim() !== lastStay.customerName && (
                  <button type="button" onClick={useLastGuest} className="btn-soft shrink-0" style={{ background: '#fff', color: 'var(--blue)' }}>ใช้ข้อมูลเดิม</button>
                )}
              </div>
            )}
          </Section>

          {/* 2. Stay */}
          <Section title="การเข้าพัก" i={1}>
            {rooms.length > 1 ? (
              <div className="flex flex-wrap gap-2">
                {rooms.map((r) => (
                  <button key={r.id} type="button" className="chip" aria-pressed={formData.roomId === r.id}
                    onClick={() => setFormData({ ...formData, roomId: r.id, bedType: r.bedType })}>
                    <BedDouble className="w-3.5 h-3.5" />{r.name}
                  </button>
                ))}
              </div>
            ) : (
              <div className="segmented" style={seg(3, BEDS.findIndex((b) => b.v === formData.bedType))}>
                <span className="segmented-thumb" aria-hidden />
                {BEDS.map((b) => (
                  <button key={b.v} type="button" className="segmented-btn !px-2" aria-current={formData.bedType === b.v ? 'page' : undefined}
                    onClick={() => setFormData({ ...formData, bedType: b.v })}>{b.l}</button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="field-checkin-date" className={label}>{t.fieldCheckIn}</label>
                <input id="field-checkin-date" type="date" value={formData.checkInDate} onChange={(e) => setCheckIn(e.target.value)} className={input} />
              </div>
              <div>
                <label htmlFor="field-checkout-date" className={label}>{t.fieldCheckOut}</label>
                <input id="field-checkout-date" type="date" value={formData.checkOutDate} min={formData.checkInDate}
                  onChange={(e) => setFormData({ ...formData, checkOutDate: e.target.value })} className={input} />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex items-center rounded-xl p-1" style={{ background: 'var(--bg-muted)' }}>
                <button type="button" onClick={() => setNights(nights - 1)} disabled={nights <= 1} aria-label="ลดคืน"
                  className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors hover:bg-white disabled:opacity-30"><Minus className="w-4 h-4" /></button>
                <span key={nights} className="w-20 text-center text-sm font-medium tabular animate-fade-in">{nights} คืน</span>
                <button type="button" onClick={() => setNights(nights + 1)} aria-label="เพิ่มคืน"
                  className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors hover:bg-white"><Plus className="w-4 h-4" /></button>
              </div>
              {formData.checkInDate !== todayStr && (
                <button type="button" onClick={() => setCheckIn(todayStr)} className="btn-soft" style={{ background: 'var(--brand-light)', color: 'var(--brand)' }}>
                  เข้าวันนี้
                </button>
              )}
            </div>

            <details className="group">
              <summary className="list-none cursor-pointer select-none inline-flex items-center gap-1.5 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                <Clock className="w-3.5 h-3.5" /> เข้า {formData.checkInTime} น. · ออก {formData.checkOutTime} น.
                <ChevronDown className="w-3.5 h-3.5 transition-transform group-open:rotate-180" />
              </summary>
              <div className="grid grid-cols-2 gap-3 mt-3 animate-rise">
                <input id="field-checkin-time" type="time" aria-label="เวลาเช็คอิน" value={formData.checkInTime}
                  onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })} className={input} />
                <input id="field-checkout-time" type="time" aria-label="เวลาเช็คเอาท์" value={formData.checkOutTime}
                  onChange={(e) => setFormData({ ...formData, checkOutTime: e.target.value })} className={input} />
              </div>
            </details>
          </Section>

          {/* 3. Price & payment */}
          <Section title="ราคาและการชำระเงิน" i={2}>
            <div data-error={!!errors.price}>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>฿</span>
                  <input id="field-price" type="number" inputMode="decimal" min="0" step="50" aria-label={t.fieldPrice}
                    value={formData.price || ''} onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full glass-input h-12 pl-8 pr-3 text-lg font-semibold tabular"
                    style={errors.price ? { borderColor: 'var(--red)' } : undefined} />
                </div>
                <span className="text-xs shrink-0 tabular" style={{ color: 'var(--text-muted)' }}>฿{rate.toLocaleString()}/คืน</span>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {[1000, 1500, 2000].map((r) => (
                  <button key={r} type="button" className="chip !h-8 !px-3 !text-[13px]" aria-pressed={rate === r}
                    onClick={() => setFormData({ ...formData, price: r * nights })}>฿{r.toLocaleString()}/คืน</button>
                ))}
              </div>
              {errors.price && <p className="text-xs mt-1 animate-fade-in" style={{ color: 'var(--red)' }}>{errors.price}</p>}
            </div>

            <div className="segmented" style={seg(3, ['unpaid', 'deposit', 'paid'].indexOf(formData.paymentStatus || 'unpaid'))}>
              <span className="segmented-thumb" aria-hidden />
              {(['unpaid', 'deposit', 'paid'] as PaymentStatus[]).map((ps) => (
                <button key={ps} type="button" className="segmented-btn !px-2"
                  aria-current={(formData.paymentStatus || 'unpaid') === ps ? 'page' : undefined}
                  onClick={() => setFormData({
                    ...formData, paymentStatus: ps,
                    paymentMethod: formData.paymentMethod || (formData.bookingChannel === 'booking_com' ? 'booking_com' : 'cash'),
                  })}>
                  {ps === 'deposit' ? 'มัดจำ' : PAYMENT_STATUS_LABEL[ps]}
                </button>
              ))}
            </div>
            <div className={`reveal ${formData.paymentStatus === 'deposit' ? 'open' : ''}`}>
              <div>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <input type="number" min="0" step="50" inputMode="decimal" placeholder="ยอดมัดจำ" aria-label="ยอดมัดจำ"
                      value={formData.depositAmount ?? ''} onChange={(e) => setFormData({ ...formData, depositAmount: parseFloat(e.target.value) || 0 })}
                      className="w-full glass-input h-11 pl-3.5 pr-12 tabular" />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--text-muted)' }}>บาท</span>
                  </div>
                  <p className="text-[13px] shrink-0" style={{ color: 'var(--text-secondary)' }}>
                    คงเหลือ <strong className="tabular" style={{ color: 'var(--text-primary)' }}>฿{balanceDue({ price: Number(formData.price) || 0, paymentStatus: 'deposit', depositAmount: formData.depositAmount }).toLocaleString()}</strong>
                  </p>
                </div>
              </div>
            </div>
            {formData.paymentStatus && formData.paymentStatus !== 'unpaid' && (
              <div className="flex flex-wrap gap-2 animate-fade-in">
                {(['cash', 'transfer', 'booking_com'] as PaymentMethod[]).map((pm) => (
                  <button key={pm} type="button" className="chip" aria-pressed={formData.paymentMethod === pm}
                    onClick={() => setFormData({ ...formData, paymentMethod: pm })}>{PAYMENT_METHOD_LABEL[pm]}</button>
                ))}
              </div>
            )}
          </Section>

          {/* 4. Extras */}
          <Section title="เพิ่มเติม" i={3}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className={label}>{t.fieldChannel}</span>
                <div className="segmented" style={seg(2, formData.bookingChannel === 'walk_in' ? 1 : 0)}>
                  <span className="segmented-thumb" aria-hidden />
                  <button id="channel-booking-btn" type="button" className="segmented-btn !px-2" aria-current={formData.bookingChannel !== 'walk_in' ? 'page' : undefined}
                    onClick={() => setFormData({ ...formData, bookingChannel: 'booking_com' })}><Globe className="w-4 h-4" />Booking</button>
                  <button id="channel-walkin-btn" type="button" className="segmented-btn !px-2" aria-current={formData.bookingChannel === 'walk_in' ? 'page' : undefined}
                    onClick={() => setFormData({ ...formData, bookingChannel: 'walk_in' })}><Footprints className="w-4 h-4" />Walk-in</button>
                </div>
              </div>
              <div>
                <label htmlFor="field-date" className={label}>{t.fieldDate}</label>
                <input id="field-date" type="date" value={formData.createdAt} onChange={(e) => setFormData({ ...formData, createdAt: e.target.value })} className={input} />
              </div>
            </div>
            <div>
              <span className={label}>{t.fieldStatus}</span>
              <div className="segmented" style={seg(4, STATUSES.findIndex((s) => s.v === formData.status))}>
                <span className="segmented-thumb" aria-hidden />
                {STATUSES.map((s) => (
                  <button key={s.v} type="button" className="segmented-btn !px-1 !text-[13px]" aria-current={formData.status === s.v ? 'page' : undefined}
                    onClick={() => setFormData({ ...formData, status: s.v })}>{s.l}</button>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="field-notes" className={label}>{t.fieldNotes}</label>
              <textarea id="field-notes" rows={2} placeholder={t.fieldNotesPlaceholder} value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full glass-input px-3.5 py-2.5" />
            </div>
          </Section>

          {overlaps.length > 0 && (
            <div id="overlap-warning" className="rounded-xl px-4 py-3 animate-rise"
              style={{ background: 'var(--amber-bg)', border: '1px solid ' + (overlapAck ? 'var(--amber)' : 'var(--amber-border)') }}>
              <p className="text-sm font-medium flex items-center gap-2" style={{ color: '#8a5a10' }}>
                <AlertTriangle className="w-4 h-4 shrink-0" />
                ห้องนี้มีคนจองช่วงเดียวกัน {overlaps.length} รายการ
              </p>
              <ul className="mt-1.5 space-y-0.5 text-[13px] pl-6" style={{ color: 'var(--text-secondary)' }}>
                {overlaps.slice(0, 4).map((o) => (
                  <li key={o.id}>{o.customerName} · {formatDateThai(o.checkInDate)} – {formatDateThai(o.checkOutDate)}</li>
                ))}
              </ul>
              {overlapAck && <p className="text-xs mt-2 pl-6" style={{ color: '#8a5a10' }}>กดบันทึกอีกครั้งเพื่อยืนยันว่าต้องการบันทึกซ้อน</p>}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-5 py-3.5 flex items-center justify-between gap-3 shrink-0" style={{ borderTop: '1px solid var(--border-light)', paddingBottom: 'max(14px, env(safe-area-inset-bottom))' }}>
          {isEdit && onPrintReceipt && initialData ? (
            <button type="button" onClick={() => onPrintReceipt(initialData)} className="btn-ghost h-11 px-3.5 rounded-xl text-sm inline-flex items-center gap-2">
              <Printer className="w-4 h-4" /><span className="hidden sm:inline">{t.btnPrintPdf || 'ใบยืนยัน'}</span>
            </button>
          ) : <span />}
          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className="btn-ghost h-11 px-4 rounded-xl text-sm">{t.btnCancel}</button>
            <button type="submit" form="booking-form" className="btn-primary h-11 px-6 rounded-xl text-sm">
              {overlapAck && overlaps.length > 0 ? 'ยืนยันบันทึกซ้อน' : isEdit ? t.btnSaveEdit : t.btnSaveAdd}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
