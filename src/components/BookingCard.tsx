import React from 'react';
import type { BookingRecord } from '../types/booking';
import { Globe, Footprints, BedDouble, BedSingle, Phone, Calendar, Clock, Edit2, Trash2, Tag, Printer } from 'lucide-react';

interface BookingCardProps {
  booking: BookingRecord;
  onEdit: (booking: BookingRecord) => void;
  onDelete: (id: string) => void;
  onPrintReceipt?: (booking: BookingRecord) => void;
  t: any;
  index?: number;
}

const STATUS_BADGE: Record<string, { cls: string; label: (t: any) => string }> = {
  confirmed:   { cls: 'bg-emerald-100 text-emerald-800 border-emerald-300', label: (t) => t.statusConfirmed },
  checked_in:  { cls: 'bg-blue-100 text-blue-800 border-blue-300',          label: (t) => t.statusCheckedIn },
  checked_out: { cls: 'bg-slate-100 text-slate-600 border-slate-300',       label: (t) => t.statusCheckedOut },
  cancelled:   { cls: 'bg-rose-100 text-rose-700 border-rose-300',          label: (t) => t.statusCancelled },
};

export const BookingCard: React.FC<BookingCardProps> = ({ booking, onEdit, onDelete, onPrintReceipt, t, index = 0 }) => {

  const badge = STATUS_BADGE[booking.status] ?? STATUS_BADGE.confirmed;
  const delays = ['delay-0', 'delay-75', 'delay-150', 'delay-225', 'delay-300', 'delay-375', 'delay-450'];
  const delayClass = delays[Math.min(index, delays.length - 1)];

  return (
    <div className={`bg-white rounded-2xl p-4 space-y-3 border border-slate-200 border-l-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 card-${booking.status} animate-slide-left ${delayClass}`}>

      {/* Top Row: Name + Status Badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className="text-[11px] font-mono font-bold text-amber-700 block leading-tight mb-0.5">{booking.id}</span>
          <h3 className="font-bold text-slate-900 text-base leading-tight truncate">{booking.customerName}</h3>
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 mt-1">
            <Phone className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>{booking.phoneNumber}</span>
          </div>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-bold border whitespace-nowrap shrink-0 ${badge.cls}`}>
          {badge.label(t)}
        </span>
      </div>

      {/* Badges Row: Channel + Bed */}
      <div className="flex flex-wrap gap-1.5">
        {booking.bookingChannel === 'booking_com' ? (
          <span className="bg-blue-50 text-blue-800 border border-blue-200 text-xs px-2.5 py-1 rounded-xl font-bold flex items-center gap-1">
            <Globe className="w-3.5 h-3.5 text-blue-600" /> Booking.com
          </span>
        ) : (
          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs px-2.5 py-1 rounded-xl font-bold flex items-center gap-1">
            <Footprints className="w-3.5 h-3.5 text-emerald-600" /> Walk-in
          </span>
        )}

        {booking.bedType === 'big' && (
          <span className="bg-purple-50 text-purple-800 border border-purple-200 text-xs px-2.5 py-1 rounded-xl font-bold flex items-center gap-1">
            <BedDouble className="w-3.5 h-3.5 text-purple-600" /> {t.bedBig}
          </span>
        )}
        {booking.bedType === 'small' && (
          <span className="bg-cyan-50 text-cyan-800 border border-cyan-200 text-xs px-2.5 py-1 rounded-xl font-bold flex items-center gap-1">
            <BedSingle className="w-3.5 h-3.5 text-cyan-600" /> {t.bedSmall}
          </span>
        )}
        {booking.bedType === 'both' && (
          <span className="bg-amber-50 text-amber-800 border border-amber-200 text-xs px-2.5 py-1 rounded-xl font-bold flex items-center gap-1">
            <BedDouble className="w-3.5 h-3.5 text-amber-600" /> {t.bedBoth}
          </span>
        )}
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
        <div>
          <span className="text-[10px] text-slate-500 font-bold block mb-0.5">Check-in</span>
          <span className="font-bold text-emerald-700 flex items-center gap-1">
            <Calendar className="w-3 h-3" />{booking.checkInDate}
          </span>
          <span className="text-slate-500 flex items-center gap-1 text-[10px] mt-0.5">
            <Clock className="w-2.5 h-2.5" />{booking.checkInTime}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 font-bold block mb-0.5">Check-out</span>
          <span className="font-bold text-rose-700 flex items-center gap-1">
            <Calendar className="w-3 h-3" />{booking.checkOutDate}
          </span>
          <span className="text-slate-500 flex items-center gap-1 text-[10px] mt-0.5">
            <Clock className="w-2.5 h-2.5" />{booking.checkOutTime}
          </span>
        </div>
      </div>

      {/* Price + Actions */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <span className="text-[10px] font-bold text-slate-500 block">{t.colPrice}</span>
          <span className="text-xl font-extrabold text-amber-600">฿{booking.price.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {onPrintReceipt && (
            <button
              id={`card-print-${booking.id}`}
              onClick={() => onPrintReceipt(booking)}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="พิมพ์ใบเสร็จ (A4)"
            >
              <Printer className="w-4 h-4 text-emerald-600" />
            </button>
          )}
          <button
            id={`card-edit-${booking.id}`}
            onClick={() => onEdit(booking)}
            className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-amber-50 text-slate-800 font-bold text-xs border border-slate-200 flex items-center gap-1 transition min-h-[44px]"
          >
            <Edit2 className="w-3.5 h-3.5 text-amber-600" />
            {t.btnEditLabel}
          </button>
          <button
            id={`card-delete-${booking.id}`}
            onClick={() => onDelete(booking.id)}
            className="px-3 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 flex items-center gap-1 transition min-h-[44px]"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            {t.btnDeleteLabel}
          </button>
        </div>

      </div>

      {/* Notes */}
      {booking.notes && (
        <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-start gap-1.5">
          <Tag className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
          <span className="italic">{booking.notes}</span>
        </div>
      )}
    </div>
  );
};
