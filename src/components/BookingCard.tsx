import React from 'react';
import type { BookingRecord } from '../types/booking';
import { Globe, Footprints, BedDouble, BedSingle, Phone, Calendar, Clock, Edit2, Trash2, Tag, Printer, FileText } from 'lucide-react';
import { formatDateThai, cleanTimeStr } from '../utils/formatters';

interface BookingCardProps {
  booking: BookingRecord;
  onEdit: (booking: BookingRecord) => void;
  onDelete: (id: string) => void;
  onQuickUpdateStatus?: (id: string, status: BookingRecord['status']) => void;
  onPrintReceipt?: (booking: BookingRecord) => void;
  onPrintTaxInvoice?: (booking: BookingRecord) => void;
  t: any;
  index?: number;
}

const STATUS_CONFIG: Record<string, { badgeCls: string; leftColor: string; label: (t: any) => string }> = {
  confirmed:   { badgeCls: 'badge badge-confirmed',   leftColor: 'var(--green)', label: (t) => t.statusConfirmed },
  checked_in:  { badgeCls: 'badge badge-checked_in',  leftColor: 'var(--blue)',  label: (t) => t.statusCheckedIn },
  checked_out: { badgeCls: 'badge badge-checked_out', leftColor: '#adb5bd',      label: (t) => t.statusCheckedOut },
  cancelled:   { badgeCls: 'badge badge-cancelled',   leftColor: 'var(--red)',   label: (t) => t.statusCancelled },
};

export const BookingCard: React.FC<BookingCardProps> = ({
  booking, onEdit, onDelete, onQuickUpdateStatus, onPrintReceipt, onPrintTaxInvoice, t, index = 0
}) => {
  const cfg = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.confirmed;
  const delays = ['delay-0','delay-75','delay-150','delay-225','delay-300','delay-375','delay-450'];

  return (
    <div
      className={`rounded-2xl p-4 space-y-3.5 animate-slide-left ${delays[Math.min(index, 6)]} transition-all duration-200 hover:shadow-sm`}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderLeftWidth: '3px',
        borderLeftColor: cfg.leftColor,
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      {/* Name + Status */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {/* Date replaces booking ID */}
          <span className="text-[11px] font-medium block mb-0.5" style={{ color: 'var(--text-muted)' }}>
            {formatDateThai(booking.createdAt)}
          </span>
          <h3 className="font-semibold text-base leading-tight truncate" style={{ color: 'var(--text-primary)' }}>
            {booking.customerName}
          </h3>
          <div className="flex items-center gap-1.5 text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            <Phone className="w-3 h-3 shrink-0" />
            <span>{booking.phoneNumber}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className={cfg.badgeCls}>{cfg.label(t)}</span>
          {onQuickUpdateStatus && booking.status === 'confirmed' && (
            <button
              onClick={() => onQuickUpdateStatus(booking.id, 'checked_in')}
              className="text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all active:scale-95 shadow-xs"
              style={{ background: '#e6fcf5', border: '1px solid #c3fae8', color: '#087f5b' }}
            >
              📥 เช็คอินเลย
            </button>
          )}
          {onQuickUpdateStatus && booking.status === 'checked_in' && (
            <button
              onClick={() => onQuickUpdateStatus(booking.id, 'checked_out')}
              className="text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all active:scale-95 shadow-xs"
              style={{ background: '#fff5f5', border: '1px solid #ffc9c9', color: '#c92a2a' }}
            >
              🚪 เช็คเอาท์
            </button>
          )}
        </div>
      </div>

      {/* Channel + Bed */}
      <div className="flex flex-wrap gap-1.5">
        {booking.bookingChannel === 'booking_com'
          ? <span className="badge badge-booking"><Globe className="w-3 h-3" />Booking.com</span>
          : <span className="badge badge-walkin"><Footprints className="w-3 h-3" />Walk-in</span>
        }
        {booking.bedType === 'big'   && <span className="badge badge-bed-big"><BedDouble className="w-3 h-3" />{t.bedBig}</span>}
        {booking.bedType === 'small' && <span className="badge badge-bed-small"><BedSingle className="w-3 h-3" />{t.bedSmall}</span>}
        {booking.bedType === 'both'  && <span className="badge badge-bed-both"><BedDouble className="w-3 h-3" />{t.bedBoth}</span>}
      </div>

      {/* Dates */}
      <div
        className="grid grid-cols-2 gap-3 p-3 rounded-xl text-xs"
        style={{ background: 'var(--bg-muted)', border: '1px solid var(--border-light)' }}
      >
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: 'var(--green)' }}>
            Check-in
          </span>
          <span className="font-semibold flex items-center gap-1.5" style={{ color: '#087f5b' }}>
            <Calendar className="w-3 h-3 shrink-0" />
            {formatDateThai(booking.checkInDate)}
          </span>
          <span className="flex items-center gap-1 text-[10px] mt-0.5 font-mono" style={{ color: 'var(--text-muted)' }}>
            <Clock className="w-2.5 h-2.5" />{cleanTimeStr(booking.checkInTime)}
          </span>
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: 'var(--red)' }}>
            Check-out
          </span>
          <span className="font-semibold flex items-center gap-1.5" style={{ color: '#c92a2a' }}>
            <Calendar className="w-3 h-3 shrink-0" />
            {formatDateThai(booking.checkOutDate)}
          </span>
          <span className="flex items-center gap-1 text-[10px] mt-0.5 font-mono" style={{ color: 'var(--text-muted)' }}>
            <Clock className="w-2.5 h-2.5" />{cleanTimeStr(booking.checkOutTime)}
          </span>
        </div>
      </div>

      {/* Price + Actions */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-medium block mb-0.5" style={{ color: 'var(--text-muted)' }}>{t.colPrice}</span>
          <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>฿{booking.price.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {onPrintReceipt && (
            <button
              id={`card-print-${booking.id}`}
              onClick={() => onPrintReceipt(booking)}
              className="action-btn action-btn-print"
              style={{ width: 38, height: 38 }}
              title="พิมพ์ใบยืนยัน"
            >
              <Printer className="w-4 h-4" style={{ color: 'var(--green)' }} />
            </button>
          )}
          {onPrintTaxInvoice && (
            <button
              id={`card-tax-invoice-${booking.id}`}
              onClick={() => onPrintTaxInvoice(booking)}
              className="action-btn action-btn-tax"
              style={{ width: 38, height: 38 }}
              title="ใบกำกับภาษี"
            >
              <FileText className="w-4 h-4" style={{ color: 'var(--blue)' }} />
            </button>
          )}
          <button
            id={`card-edit-${booking.id}`}
            onClick={() => onEdit(booking)}
            className="action-btn action-btn-edit flex items-center gap-1.5 px-3"
            style={{ width: 'auto', height: 38 }}
          >
            <Edit2 className="w-3.5 h-3.5" style={{ color: 'var(--amber)' }} />
            <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>{t.btnEditLabel}</span>
          </button>
          <button
            id={`card-delete-${booking.id}`}
            onClick={() => onDelete(booking.id)}
            className="action-btn action-btn-delete"
            style={{ width: 38, height: 38 }}
            title={t.btnDeleteLabel}
          >
            <Trash2 className="w-4 h-4" style={{ color: 'var(--red)' }} />
          </button>
        </div>
      </div>

      {/* Notes */}
      {booking.notes && (
        <div
          className="text-xs p-2.5 rounded-xl flex items-start gap-2"
          style={{ background: 'var(--amber-bg)', border: '1px solid var(--amber-border)' }}
        >
          <Tag className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: 'var(--amber)' }} />
          <span className="italic" style={{ color: 'var(--text-secondary)' }}>{booking.notes}</span>
        </div>
      )}
    </div>
  );
};
