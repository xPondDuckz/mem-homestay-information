import React, { useState, useEffect, useMemo } from 'react';
import type { BookingRecord, BedType, BookingChannel, BookingStatus } from '../types/booking';
import { generateBookingId } from '../utils/storage';
import {
  X, User, Phone, BedDouble, BedSingle, Globe, Footprints,
  Calendar, Clock, DollarSign, FileText, CheckCircle2, Plus,
  CalendarCheck, LogOut, Ban, Printer
} from 'lucide-react';

interface BookingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (booking: BookingRecord) => void;
  onPrintReceipt?: (booking: BookingRecord) => void;
  initialData?: BookingRecord | null;
  t: any;
}

const STATUS_OPTIONS: { value: BookingStatus; icon: React.ReactNode; colorClass: string; activeClass: string; activeStyle?: React.CSSProperties }[] = [
  {
    value: 'confirmed',
    icon: <CalendarCheck className="w-4 h-4" />,
    colorClass: '',
    activeClass: '',
    activeStyle: { background: 'var(--green-bg)', border: '1.5px solid var(--green)', color: '#1d6a49', fontWeight: 700 },
  },
  {
    value: 'checked_in',
    icon: <CheckCircle2 className="w-4 h-4" />,
    colorClass: '',
    activeClass: '',
    activeStyle: { background: 'var(--blue-bg)', border: '1.5px solid var(--blue)', color: '#2c5784', fontWeight: 700 },
  },
  {
    value: 'checked_out',
    icon: <LogOut className="w-4 h-4" />,
    colorClass: '',
    activeClass: '',
    activeStyle: { background: '#f1f3f5', border: '1.5px solid #adb5bd', color: '#495057', fontWeight: 700 },
  },
  {
    value: 'cancelled',
    icon: <Ban className="w-4 h-4" />,
    colorClass: '',
    activeClass: '',
    activeStyle: { background: 'var(--red-bg)', border: '1.5px solid var(--red)', color: '#9a3026', fontWeight: 700 },
  },
];

export const BookingFormModal: React.FC<BookingFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onPrintReceipt,
  initialData,
  t,
}) => {

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

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

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        id: generateBookingId(),
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
    }
    setErrors({});
  }, [initialData, isOpen]);

  const nights = useMemo(() => {
    if (!formData.checkInDate || !formData.checkOutDate) return 1;
    const dIn = new Date(formData.checkInDate);
    const dOut = new Date(formData.checkOutDate);
    const diffTime = dOut.getTime() - dIn.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  }, [formData.checkInDate, formData.checkOutDate]);

  if (!isOpen) return null;

  const addNights = (numDays: number) => {
    const start = formData.checkInDate ? new Date(formData.checkInDate) : new Date();
    start.setDate(start.getDate() + numDays);
    const newOutDate = start.toISOString().split('T')[0];
    const newNights = numDays;
    const currentRate = (formData.price && nights > 0) ? Math.round(formData.price / nights) : 1500;
    setFormData((prev) => ({
      ...prev,
      checkOutDate: newOutDate,
      price: currentRate * newNights,
    }));
  };

  const setToday = () => {
    setFormData((prev) => ({ ...prev, checkInDate: todayStr }));
  };

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
    if (!validate()) return;

    const recordToSave: BookingRecord = {
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
    };

    onSave(recordToSave);
    onClose();
  };

  const statusLabel = (status: BookingStatus) => {
    switch (status) {
      case 'confirmed':   return t.statusConfirmed;
      case 'checked_in':  return t.statusCheckedIn;
      case 'checked_out': return t.statusCheckedOut;
      case 'cancelled':   return t.statusCancelled;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center animate-fade-in modal-overlay">
      <div
        className="w-full sm:max-w-xl rounded-t-[24px] sm:rounded-[20px] overflow-hidden max-h-[95dvh] flex flex-col animate-slide-up"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div className="sm:hidden pt-2.5 flex justify-center shrink-0"><span className="w-10 h-1 rounded-full" style={{ background: 'var(--border-default)' }} /></div>
        {/* Header Bar */}
        <div
          className="px-5 py-4 flex items-center justify-between shrink-0"
          style={{ borderBottom: '1px solid var(--border-light)' }}
        >
          <div className="flex items-center gap-3">
                        <div>
              <h2 className="text-lg font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>
                {initialData ? t.modalEditTitle : t.modalAddTitle}
              </h2>
              <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>{t.modalSubtitle}</p>
            </div>
          </div>
          <button
            id="form-close-btn"
            onClick={onClose}
            className="p-2 rounded-xl transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form id="booking-form" onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-5 space-y-5" style={{ background: 'var(--bg-card)' }}>

          {/* Row 1: Date & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[13px] font-medium mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                <Calendar className="w-4 h-4 shrink-0" style={{ color: 'var(--brand)' }} />
                {t.fieldDate}
              </label>
              <input
                type="date"
                id="field-date"
                value={formData.createdAt}
                onChange={(e) => setFormData({ ...formData, createdAt: e.target.value })}
                className="w-full glass-input px-3.5 py-2.5 rounded-xl text-sm min-h-[44px]"
              />
            </div>

            {/* Status Picker */}
            <div>
              <label className="block text-[13px] font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                {t.fieldStatus}
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, status: opt.value })}
                    className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl border text-xs font-semibold transition-all min-h-[44px] justify-center"
                    style={formData.status === opt.value
                      ? opt.activeStyle
                      : { background: 'var(--bg-muted)', border: '1px solid var(--border-light)', color: 'var(--text-muted)' }
                    }
                  >
                    {opt.icon}
                    <span className="leading-tight">{statusLabel(opt.value)}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Row 2: Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[13px] font-medium mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                <User className="w-4 h-4 shrink-0" style={{ color: 'var(--brand)' }} />
                {t.fieldName} <span className="font-black" style={{ color: 'var(--red)' }}>*</span>
              </label>
              <input
                type="text"
                id="field-name"
                placeholder={t.fieldNamePlaceholder}
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                className={`w-full glass-input px-3.5 py-2.5 rounded-xl text-sm min-h-[44px] ${errors.customerName ? 'border-red-400' : ''}`}
              />
              {errors.customerName && (
                <p className="text-xs font-semibold mt-1 flex items-center gap-1" style={{ color: 'var(--red)' }}>
                  {errors.customerName}
                </p>
              )}
            </div>

            <div>
              <label className="block text-[13px] font-medium mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                <Phone className="w-4 h-4 shrink-0" style={{ color: 'var(--brand)' }} />
                {t.fieldPhone} <span className="font-black" style={{ color: 'var(--red)' }}>*</span>
              </label>
              <input
                type="tel"
                id="field-phone"
                placeholder={t.fieldPhonePlaceholder}
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className={`w-full glass-input px-3.5 py-2.5 rounded-xl text-sm min-h-[44px] ${errors.phoneNumber ? 'border-red-400' : ''}`}
              />
              {errors.phoneNumber && (
                <p className="text-xs font-semibold mt-1 flex items-center gap-1" style={{ color: 'var(--red)' }}>
                  {errors.phoneNumber}
                </p>
              )}
            </div>
          </div>

          {/* Row 3: Booking Channel */}
          <div>
            <label className="block text-[13px] font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
              {t.fieldChannel}
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                id="channel-booking-btn"
                onClick={() => setFormData({ ...formData, bookingChannel: 'booking_com' })}
                className="p-3 rounded-xl flex items-center gap-2.5 text-left transition-all min-h-[62px]"
                style={formData.bookingChannel === 'booking_com' ? {
                  background: 'var(--blue-bg)',
                  border: '1.5px solid var(--blue)',
                } : {
                  background: 'var(--bg-muted)',
                  border: '1.5px solid var(--border-default)',
                }}
              >
                <div
                  className="p-2.5 rounded-xl shrink-0"
                  style={formData.bookingChannel === 'booking_com'
                    ? { background: 'var(--blue)', color: '#fff' }
                    : { background: 'var(--bg-hover)', color: 'var(--text-muted)' }}
                >
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Booking.com</div>
                  <div className="text-xs leading-tight" style={{ color: 'var(--text-muted)' }}>{t.fieldChannelBookingDesc}</div>
                </div>
                {formData.bookingChannel === 'booking_com' && <CheckCircle2 className="w-5 h-5 ml-auto shrink-0" style={{ color: 'var(--blue)' }} />}
              </button>

              <button
                type="button"
                id="channel-walkin-btn"
                onClick={() => setFormData({ ...formData, bookingChannel: 'walk_in' })}
                className="p-3 rounded-xl flex items-center gap-2.5 text-left transition-all min-h-[62px]"
                style={formData.bookingChannel === 'walk_in' ? {
                  background: 'var(--green-bg)',
                  border: '1.5px solid var(--green)',
                } : {
                  background: 'var(--bg-muted)',
                  border: '1.5px solid var(--border-default)',
                }}
              >
                <div
                  className="p-2.5 rounded-xl shrink-0"
                  style={formData.bookingChannel === 'walk_in'
                    ? { background: 'var(--green)', color: '#fff' }
                    : { background: 'var(--bg-hover)', color: 'var(--text-muted)' }}
                >
                  <Footprints className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Walk-in</div>
                  <div className="text-xs leading-tight" style={{ color: 'var(--text-muted)' }}>{t.fieldChannelWalkInDesc}</div>
                </div>
                {formData.bookingChannel === 'walk_in' && <CheckCircle2 className="w-5 h-5 ml-auto shrink-0" style={{ color: 'var(--green)' }} />}
              </button>
            </div>
          </div>

          {/* Row 4: Bed Type */}
          <div>
            <label className="block text-[13px] font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
              {t.fieldBed}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'big',   icon: <BedDouble className="w-5 h-5" />, label: t.bedBig,   desc: t.bedBigDesc,   activeStyle: { background: 'var(--violet-bg)', border: '1.5px solid var(--violet)', color: '#544690' }, iconStyle: { background: 'var(--violet)', color: '#fff' } },
                { value: 'small', icon: <BedSingle className="w-5 h-5" />, label: t.bedSmall, desc: t.bedSmallDesc, activeStyle: { background: 'var(--bg-muted)', border: '1.5px solid #66d9e8', color: '#57564f' }, iconStyle: { background: '#0c8599', color: '#fff' } },
                { value: 'both',  icon: <><BedDouble className="w-4 h-4" /><BedSingle className="w-3.5 h-3.5 -ml-0.5" /></>, label: t.bedBoth, desc: t.bedBothDesc, activeStyle: { background: 'var(--amber-bg)', border: '1.5px solid var(--amber)', color: '#7d5e00' }, iconStyle: { background: 'var(--amber)', color: '#fff' } },
              ].map((bed) => (
                <button
                  key={bed.value}
                  type="button"
                  id={`bed-${bed.value}-btn`}
                  onClick={() => setFormData({ ...formData, bedType: bed.value as BedType })}
                  className="p-3 rounded-xl flex flex-col items-center text-center transition-all min-h-[74px] justify-center gap-1"
                  style={formData.bedType === bed.value
                    ? bed.activeStyle
                    : { background: 'var(--bg-muted)', border: '1.5px solid var(--border-default)', color: 'var(--text-muted)' }
                  }
                >
                  <div
                    className="p-1.5 rounded-lg flex items-center gap-0.5"
                    style={formData.bedType === bed.value ? bed.iconStyle : { background: 'var(--bg-hover)', color: 'var(--text-muted)' }}
                  >
                    {bed.icon}
                  </div>
                  <span className="text-xs font-semibold leading-tight">{bed.label}</span>
                  <span className="text-[11px] leading-tight hidden sm:block" style={{ color: 'var(--text-muted)' }}>{bed.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Row 5: Check-in / Check-out Box */}
          <div
            className="rounded-2xl p-4 space-y-3"
            style={{ background: 'var(--bg-muted)', border: '1px solid var(--border-light)' }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                  <Clock className="w-4 h-4" style={{ color: 'var(--brand)' }} />
                  {t.fieldCheckIn} / {t.fieldCheckOut}
                </span>
                <span
                  className="text-xs font-extrabold px-2.5 py-0.5 rounded-full"
                  style={{ background: 'var(--brand-light)', border: '1px solid var(--brand-border)', color: 'var(--brand)' }}
                >
                  🌙 พัก {nights} คืน
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => addNights(1)}
                  className="px-2.5 py-1 rounded-lg font-semibold text-xs transition flex items-center gap-0.5 min-h-[32px]"
                  style={{ background: 'var(--brand)', color: '#fff', boxShadow: '0 1px 4px var(--brand-ring)' }}
                >
                  <Plus className="w-3.5 h-3.5" />1 คืน
                </button>
                <button
                  type="button"
                  onClick={() => addNights(2)}
                  className="px-2.5 py-1 rounded-lg font-semibold text-xs transition flex items-center gap-0.5 min-h-[32px]"
                  style={{ background: 'var(--brand)', color: '#fff', boxShadow: '0 1px 4px var(--brand-ring)' }}
                >
                  <Plus className="w-3.5 h-3.5" />2 คืน
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold" style={{ color: 'var(--green)' }}>
                  ✅ {t.fieldCheckIn}
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="date"
                    id="field-checkin-date"
                    value={formData.checkInDate}
                    onChange={(e) => setFormData({ ...formData, checkInDate: e.target.value })}
                    className="flex-1 glass-input px-3 py-2 rounded-xl text-sm min-h-[44px]"
                  />
                  <button
                    type="button"
                    onClick={setToday}
                    className="px-2.5 py-1.5 rounded-xl font-semibold text-xs transition shrink-0 min-h-[42px]"
                    style={{ background: 'var(--green-bg)', border: '1px solid var(--green-border)', color: '#1d6a49' }}
                  >
                    {t.btnTodayDate}
                  </button>
                </div>
                <input
                  type="time"
                  id="field-checkin-time"
                  value={formData.checkInTime}
                  onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })}
                  className="w-full glass-input px-3 py-2 rounded-xl text-sm min-h-[44px]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold" style={{ color: 'var(--red)' }}>
                  🚪 {t.fieldCheckOut}
                </label>
                <input
                  type="date"
                  id="field-checkout-date"
                  value={formData.checkOutDate}
                  onChange={(e) => setFormData({ ...formData, checkOutDate: e.target.value })}
                  className="w-full glass-input px-3 py-2 rounded-xl text-sm min-h-[44px]"
                />
                <input
                  type="time"
                  id="field-checkout-time"
                  value={formData.checkOutTime}
                  onChange={(e) => setFormData({ ...formData, checkOutTime: e.target.value })}
                  className="w-full glass-input px-3 py-2 rounded-xl text-sm min-h-[44px]"
                />
              </div>
            </div>
          </div>

          {/* Row 6: Price */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                <DollarSign className="w-4 h-4" style={{ color: 'var(--brand)' }} />
                {t.fieldPrice} <span className="font-black" style={{ color: 'var(--red)' }}>*</span>
              </label>
              <div className="flex items-center gap-1">
                {[1000, 1500, 2000].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setFormData({ ...formData, price: rate * nights })}
                    className="px-2.5 py-1 rounded-xl font-semibold text-xs transition min-h-[32px]"
                    style={formData.price === rate * nights ? {
                      background: 'var(--brand)',
                      color: '#fff',
                    } : {
                      background: 'var(--bg-muted)',
                      border: '1px solid var(--border-light)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    ฿{rate.toLocaleString()}/คืน
                  </button>
                ))}
              </div>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-lg" style={{ color: 'var(--text-secondary)' }}>฿</span>
              <input
                type="number"
                id="field-price"
                min="0"
                step="50"
                placeholder="1500"
                value={formData.price || ''}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                className={`w-full glass-input pl-9 pr-14 py-3 rounded-xl text-xl font-bold min-h-[52px] ${errors.price ? 'border-red-400' : ''}`}
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{t.priceUnit}</span>
            </div>
            {errors.price && (
              <p className="text-xs font-semibold mt-1 flex items-center gap-1" style={{ color: 'var(--red)' }}>{errors.price}</p>
            )}
          </div>

          {/* Row 7: Notes */}
          <div>
            <label className="block text-[13px] font-medium mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
              <FileText className="w-4 h-4" style={{ color: 'var(--brand)' }} />
              {t.fieldNotes}
            </label>
            <textarea
              id="field-notes"
              rows={2}
              placeholder={t.fieldNotesPlaceholder}
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full glass-input px-3.5 py-2.5 rounded-xl text-sm"
            />
          </div>

        </form>

        {/* Sticky Footer Actions */}
        <div
          className="px-5 py-4 flex items-center justify-between gap-3 shrink-0"
          style={{ borderTop: '1px solid var(--border-light)', background: 'var(--bg-muted)' }}
        >
          {initialData && onPrintReceipt ? (
            <button
              type="button"
              onClick={() => onPrintReceipt(initialData)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-95 min-h-[44px] btn-ghost"
            >
              <Printer className="w-4 h-4" style={{ color: 'var(--green)' }} />
              <span style={{ color: 'var(--text-secondary)' }}>{t.btnPrintPdf || 'พิมพ์ใบเสร็จ (A4)'}</span>
            </button>
          ) : <div />}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all min-h-[44px] btn-ghost"
            >
              {t.btnCancel}
            </button>
            <button
              type="submit"
              form="booking-form"
              onClick={handleSubmit as any}
              className="px-6 py-2.5 rounded-xl text-sm font-bold btn-primary active:scale-95 transition-all min-h-[44px]"
            >
              {initialData ? t.btnSaveEdit : t.btnSaveAdd}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
