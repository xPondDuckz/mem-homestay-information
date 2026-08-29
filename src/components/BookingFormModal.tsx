import React, { useState, useEffect } from 'react';
import type { BookingRecord, BedType, BookingChannel, BookingStatus } from '../types/booking';
import { generateBookingId } from '../utils/storage';
import {
  X, User, Phone, BedDouble, BedSingle, Globe, Footprints,
  Calendar, Clock, DollarSign, FileText, CheckCircle2, ShieldCheck, Plus,
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

const STATUS_OPTIONS: { value: BookingStatus; icon: React.ReactNode; colorClass: string; activeClass: string }[] = [
  {
    value: 'confirmed',
    icon: <CalendarCheck className="w-4 h-4" />,
    colorClass: 'border-emerald-300 text-emerald-950 bg-emerald-50 hover:bg-emerald-100 font-bold',
    activeClass: 'bg-emerald-600 text-white border-emerald-700 shadow-md ring-2 ring-emerald-300 font-black',
  },
  {
    value: 'checked_in',
    icon: <CheckCircle2 className="w-4 h-4" />,
    colorClass: 'border-blue-300 text-blue-950 bg-blue-50 hover:bg-blue-100 font-bold',
    activeClass: 'bg-blue-600 text-white border-blue-700 shadow-md ring-2 ring-blue-300 font-black',
  },
  {
    value: 'checked_out',
    icon: <LogOut className="w-4 h-4" />,
    colorClass: 'border-slate-300 text-slate-900 bg-slate-100 hover:bg-slate-200 font-bold',
    activeClass: 'bg-slate-700 text-white border-slate-800 shadow-md ring-2 ring-slate-400 font-black',
  },
  {
    value: 'cancelled',
    icon: <Ban className="w-4 h-4" />,
    colorClass: 'border-rose-300 text-rose-950 bg-rose-50 hover:bg-rose-100 font-bold',
    activeClass: 'bg-rose-600 text-white border-rose-700 shadow-md ring-2 ring-rose-300 font-black',
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

  if (!isOpen) return null;

  const addNights = (numDays: number) => {
    const start = formData.checkInDate ? new Date(formData.checkInDate) : new Date();
    start.setDate(start.getDate() + numDays);
    setFormData((prev) => ({ ...prev, checkOutDate: start.toISOString().split('T')[0] }));
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/70 backdrop-blur-md animate-fade-in">
      {/* Modal Container */}
      <div className="bg-white w-full sm:max-w-xl rounded-t-3xl sm:rounded-2xl border-t sm:border border-slate-200 shadow-2xl overflow-hidden max-h-[95dvh] flex flex-col animate-slide-up">

        {/* Header Bar */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500 text-slate-950 font-black shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white leading-tight">
                {initialData ? t.modalEditTitle : t.modalAddTitle}
              </h2>
              <p className="text-xs text-slate-300 font-medium mt-0.5">{t.modalSubtitle}</p>
            </div>
          </div>
          <button
            id="form-close-btn"
            onClick={onClose}
            className="p-2 text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form id="booking-form" onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-5 space-y-5 text-slate-900 bg-white">

          {/* Row 1: Date & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
                {t.fieldDate}
              </label>
              <input
                type="date"
                id="field-date"
                value={formData.createdAt}
                onChange={(e) => setFormData({ ...formData, createdAt: e.target.value })}
                className="w-full glass-input px-3.5 py-2.5 rounded-xl text-sm font-bold min-h-[44px]"
              />
            </div>

            {/* Status Picker */}
            <div>
              <label className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-1.5">
                {t.fieldStatus}
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, status: opt.value })}
                    className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl border text-xs font-bold transition-all min-h-[44px] justify-center ${
                      formData.status === opt.value ? opt.activeClass : opt.colorClass
                    }`}
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
              <label className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <User className="w-4 h-4 text-amber-600 shrink-0" />
                {t.fieldName} <span className="text-rose-600 font-black">*</span>
              </label>
              <input
                type="text"
                id="field-name"
                placeholder={t.fieldNamePlaceholder}
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                className={`w-full glass-input px-3.5 py-2.5 rounded-xl text-sm font-bold min-h-[44px] ${errors.customerName ? 'border-rose-500 ring-2 ring-rose-200' : ''}`}
              />
              {errors.customerName && (
                <p className="text-xs font-black text-rose-600 mt-1 flex items-center gap-1">
                  ⚠️ {errors.customerName}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-amber-600 shrink-0" />
                {t.fieldPhone} <span className="text-rose-600 font-black">*</span>
              </label>
              <input
                type="tel"
                id="field-phone"
                placeholder={t.fieldPhonePlaceholder}
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className={`w-full glass-input px-3.5 py-2.5 rounded-xl text-sm font-bold min-h-[44px] ${errors.phoneNumber ? 'border-rose-500 ring-2 ring-rose-200' : ''}`}
              />
              {errors.phoneNumber && (
                <p className="text-xs font-black text-rose-600 mt-1 flex items-center gap-1">
                  ⚠️ {errors.phoneNumber}
                </p>
              )}
            </div>
          </div>

          {/* Row 3: Booking Channel */}
          <div>
            <label className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-1.5">
              {t.fieldChannel}
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                id="channel-booking-btn"
                onClick={() => setFormData({ ...formData, bookingChannel: 'booking_com' })}
                className={`p-3 rounded-xl border flex items-center gap-2.5 text-left transition-all min-h-[62px] ${
                  formData.bookingChannel === 'booking_com'
                    ? 'bg-blue-50/90 border-blue-600 shadow-md ring-2 ring-blue-300'
                    : 'bg-slate-50 border-slate-300 hover:border-slate-400'
                }`}
              >
                <div className={`p-2.5 rounded-xl shrink-0 ${formData.bookingChannel === 'booking_com' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-200 text-slate-600'}`}>
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-black text-slate-900">Booking.com</div>
                  <div className="text-xs text-slate-700 font-bold leading-tight">{t.fieldChannelBookingDesc}</div>
                </div>
                {formData.bookingChannel === 'booking_com' && <CheckCircle2 className="w-5 h-5 text-blue-600 ml-auto shrink-0" />}
              </button>

              <button
                type="button"
                id="channel-walkin-btn"
                onClick={() => setFormData({ ...formData, bookingChannel: 'walk_in' })}
                className={`p-3 rounded-xl border flex items-center gap-2.5 text-left transition-all min-h-[62px] ${
                  formData.bookingChannel === 'walk_in'
                    ? 'bg-emerald-50/90 border-emerald-600 shadow-md ring-2 ring-emerald-300'
                    : 'bg-slate-50 border-slate-300 hover:border-slate-400'
                }`}
              >
                <div className={`p-2.5 rounded-xl shrink-0 ${formData.bookingChannel === 'walk_in' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-200 text-slate-600'}`}>
                  <Footprints className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-black text-slate-900">Walk-in</div>
                  <div className="text-xs text-slate-700 font-bold leading-tight">{t.fieldChannelWalkInDesc}</div>
                </div>
                {formData.bookingChannel === 'walk_in' && <CheckCircle2 className="w-5 h-5 text-emerald-600 ml-auto shrink-0" />}
              </button>
            </div>
          </div>

          {/* Row 4: Bed Type */}
          <div>
            <label className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-1.5">
              {t.fieldBed}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'big',   icon: <BedDouble className="w-5 h-5" />, label: t.bedBig,   desc: t.bedBigDesc,   active: 'bg-purple-50/90 border-purple-600 ring-2 ring-purple-300 text-purple-950', icon_active: 'bg-purple-600 text-white shadow-sm' },
                { value: 'small', icon: <BedSingle className="w-5 h-5" />, label: t.bedSmall, desc: t.bedSmallDesc, active: 'bg-cyan-50/90 border-cyan-600 ring-2 ring-cyan-300 text-cyan-950',       icon_active: 'bg-cyan-600 text-white shadow-sm' },
                { value: 'both',  icon: <><BedDouble className="w-4 h-4" /><BedSingle className="w-3.5 h-3.5 -ml-0.5" /></>, label: t.bedBoth, desc: t.bedBothDesc, active: 'bg-amber-50/90 border-amber-600 ring-2 ring-amber-300 text-amber-950', icon_active: 'bg-amber-600 text-white shadow-sm' },
              ].map((bed) => (
                <button
                  key={bed.value}
                  type="button"
                  id={`bed-${bed.value}-btn`}
                  onClick={() => setFormData({ ...formData, bedType: bed.value as BedType })}
                  className={`p-3 rounded-xl border flex flex-col items-center text-center transition-all min-h-[74px] justify-center gap-1 ${
                    formData.bedType === bed.value
                      ? bed.active + ' shadow-md'
                      : 'bg-slate-50 border-slate-300 text-slate-800 hover:border-slate-400'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg flex items-center gap-0.5 ${formData.bedType === bed.value ? bed.icon_active : 'bg-slate-200 text-slate-600'}`}>
                    {bed.icon}
                  </div>
                  <span className="text-xs font-black text-slate-900 leading-tight">{bed.label}</span>
                  <span className="text-[11px] text-slate-700 font-bold leading-tight hidden sm:block">{bed.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Row 5: Check-in / Check-out Box */}
          <div className="bg-slate-50 rounded-2xl border-2 border-slate-200 p-4 space-y-3 shadow-xs">
            {/* Section Header + Night Presets */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600" />
                {t.fieldCheckIn} / {t.fieldCheckOut}
              </span>
              <div className="flex items-center gap-1.5">
                <button type="button" onClick={() => addNights(1)} className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs transition flex items-center gap-0.5 min-h-[32px] shadow-xs">
                  <Plus className="w-3.5 h-3.5" />{t.preset1Night}
                </button>
                <button type="button" onClick={() => addNights(2)} className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs transition flex items-center gap-0.5 min-h-[32px] shadow-xs">
                  <Plus className="w-3.5 h-3.5" />{t.preset2Nights}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Check-in */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-emerald-800">
                  ✅ {t.fieldCheckIn}
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="date"
                    id="field-checkin-date"
                    value={formData.checkInDate}
                    onChange={(e) => setFormData({ ...formData, checkInDate: e.target.value })}
                    className="flex-1 glass-input px-3 py-2 rounded-xl text-xs font-bold min-h-[42px]"
                  />
                  <button
                    type="button"
                    onClick={setToday}
                    className="px-2.5 py-1.5 rounded-xl bg-emerald-100 border border-emerald-400 text-emerald-950 font-black text-xs hover:bg-emerald-200 transition shrink-0 min-h-[42px]"
                  >
                    {t.btnTodayDate}
                  </button>
                </div>
                <input
                  type="time"
                  id="field-checkin-time"
                  value={formData.checkInTime}
                  onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })}
                  className="w-full glass-input px-3 py-2 rounded-xl text-xs font-bold min-h-[42px]"
                />
              </div>

              {/* Check-out */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-rose-800">
                  🚪 {t.fieldCheckOut}
                </label>
                <input
                  type="date"
                  id="field-checkout-date"
                  value={formData.checkOutDate}
                  onChange={(e) => setFormData({ ...formData, checkOutDate: e.target.value })}
                  className="w-full glass-input px-3 py-2 rounded-xl text-xs font-bold min-h-[42px]"
                />
                <input
                  type="time"
                  id="field-checkout-time"
                  value={formData.checkOutTime}
                  onChange={(e) => setFormData({ ...formData, checkOutTime: e.target.value })}
                  className="w-full glass-input px-3 py-2 rounded-xl text-xs font-bold min-h-[42px]"
                />
              </div>
            </div>
          </div>

          {/* Row 6: Price */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-amber-600" />
                {t.fieldPrice} <span className="text-rose-600 font-black">*</span>
              </label>
              <div className="flex items-center gap-1">
                {[1000, 1500, 2000].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setFormData({ ...formData, price: p })}
                    className={`px-3 py-1 rounded-xl font-black text-xs transition min-h-[32px] ${
                      formData.price === p
                        ? 'bg-amber-500 text-slate-950 shadow-sm border border-amber-600'
                        : 'bg-slate-100 hover:bg-amber-100 border border-slate-300 text-slate-900'
                    }`}
                  >
                    {p.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-950 font-black text-lg">฿</span>
              <input
                type="number"
                id="field-price"
                min="0"
                step="50"
                placeholder="1500"
                value={formData.price || ''}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                className={`w-full glass-input pl-9 pr-14 py-3 rounded-xl text-xl font-black text-amber-900 min-h-[52px] ${errors.price ? 'border-rose-500 ring-2 ring-rose-200' : ''}`}
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-extrabold text-slate-600">{t.priceUnit}</span>
            </div>
            {errors.price && (
              <p className="text-xs font-black text-rose-600 mt-1 flex items-center gap-1">⚠️ {errors.price}</p>
            )}
          </div>

          {/* Row 7: Notes */}
          <div>
            <label className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-amber-600" />
              {t.fieldNotes}
            </label>
            <textarea
              id="field-notes"
              rows={2}
              placeholder={t.fieldNotesPlaceholder}
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full glass-input px-3.5 py-2.5 rounded-xl text-sm font-bold"
            />
          </div>

        </form>

        {/* Sticky Footer Actions */}
        <div className="px-5 py-4 border-t border-slate-200 flex items-center justify-between gap-3 bg-white shrink-0">
          {initialData && onPrintReceipt ? (
            <button
              type="button"
              onClick={() => onPrintReceipt(initialData)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-extrabold bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 transition active:scale-95 min-h-[44px]"
            >
              <Printer className="w-4 h-4 text-emerald-600" />
              <span>{t.btnPrintPdf || 'พิมพ์ใบเสร็จ (A4)'}</span>
            </button>
          ) : <div />}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-100 transition min-h-[44px]"
            >
              {t.btnCancel}
            </button>
            <button
              type="submit"
              form="booking-form"
              onClick={handleSubmit as any}
              className="px-6 py-2.5 rounded-xl text-sm font-black bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md active:scale-95 transition min-h-[44px]"
            >
              {initialData ? t.btnSaveEdit : t.btnSaveAdd}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
