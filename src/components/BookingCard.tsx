import React from 'react';
import type { BookingRecord, Room } from '../types/booking';
import type { Language } from '../utils/translations';
import { Phone, Pencil, Trash2, Printer, FileText, StickyNote, ArrowRight } from 'lucide-react';
import { formatDateThai, cleanTimeStr } from '../utils/formatters';
import { StatusBadge, QuickStatusButton, RoomLabel, PaymentTag } from './BookingTable';

interface BookingCardProps {
  booking: BookingRecord;
  onEdit: (booking: BookingRecord) => void;
  onDelete: (id: string) => void;
  onQuickUpdateStatus?: (id: string, status: BookingRecord['status']) => void;
  onPrintReceipt?: (booking: BookingRecord) => void;
  onPrintTaxInvoice?: (booking: BookingRecord) => void;
  t: any;
  lang: Language;
  index?: number;
  rooms?: Room[];
}

export const BookingCard: React.FC<BookingCardProps> = ({
  booking: b, onEdit, onDelete, onQuickUpdateStatus, onPrintReceipt, onPrintTaxInvoice, t, lang, index = 0, rooms,
}) => (
  <article
    className={`card lift p-4 flex flex-col gap-3.5 animate-rise stagger ${b.status === 'cancelled' ? 'opacity-60' : ''}`}
    style={{ '--i': index } as React.CSSProperties}
  >
    {/* Head: tap to edit */}
    <button onClick={() => onEdit(b)} className="flex items-start justify-between gap-3 text-left -m-1 p-1 rounded-xl">
      <div className="min-w-0">
        <h3 className="font-semibold text-base leading-snug truncate" style={{ color: 'var(--text-primary)' }}>{b.customerName}</h3>
        <p className="text-[13px] flex items-center gap-1.5 mt-0.5 tabular" style={{ color: 'var(--text-muted)' }}>
          <Phone className="w-3 h-3" />{b.phoneNumber}
        </p>
      </div>
      <StatusBadge status={b.status} t={t} />
    </button>

    {/* Stay */}
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-xl px-3.5 py-2.5" style={{ background: 'var(--bg-muted)' }}>
      <div>
        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Check-in</p>
        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{formatDateThai(b.checkInDate)}</p>
        <p className="text-xs tabular" style={{ color: 'var(--text-muted)' }}>{cleanTimeStr(b.checkInTime)}</p>
      </div>
      <ArrowRight className="w-4 h-4" style={{ color: 'var(--border-strong)' }} />
      <div className="text-right">
        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Check-out</p>
        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{formatDateThai(b.checkOutDate)}</p>
        <p className="text-xs tabular" style={{ color: 'var(--text-muted)' }}>{cleanTimeStr(b.checkOutTime)}</p>
      </div>
    </div>

    <div className="flex items-center justify-between gap-3">
      <RoomLabel booking={b} t={t} rooms={rooms} />
      <span className="text-right leading-tight">
        <span className="block text-lg font-semibold tabular" style={{ color: 'var(--text-primary)' }}>฿{b.price.toLocaleString()}</span>
        <PaymentTag booking={b} />
      </span>
    </div>

    {b.notes && (
      <p className="text-[13px] flex items-start gap-2" style={{ color: 'var(--text-secondary)' }}>
        <StickyNote className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: 'var(--text-muted)' }} />
        <span className="line-clamp-2">{b.notes}</span>
      </p>
    )}

    {/* Footer actions */}
    <div className="flex items-center justify-between gap-2 pt-3 mt-auto" style={{ borderTop: '1px solid var(--border-light)' }}>
      <div className="min-h-8 flex items-center">
        <QuickStatusButton booking={b} onQuickUpdateStatus={onQuickUpdateStatus} lang={lang} />
      </div>
      <div className="flex items-center gap-0.5 -mr-1.5">
        {onPrintReceipt && (
          <button id={`card-print-${b.id}`} onClick={() => onPrintReceipt(b)} className="action-btn !w-10 !h-10" aria-label="พิมพ์ใบยืนยัน">
            <Printer className="w-[18px] h-[18px]" />
          </button>
        )}
        {onPrintTaxInvoice && (
          <button id={`card-tax-invoice-${b.id}`} onClick={() => onPrintTaxInvoice(b)} className="action-btn !w-10 !h-10" aria-label="ใบกำกับภาษี">
            <FileText className="w-[18px] h-[18px]" />
          </button>
        )}
        <button id={`card-edit-${b.id}`} onClick={() => onEdit(b)} className="action-btn !w-10 !h-10" aria-label={t.btnEditLabel}>
          <Pencil className="w-[18px] h-[18px]" />
        </button>
        <button id={`card-delete-${b.id}`} onClick={() => onDelete(b.id)} className="action-btn action-btn-delete !w-10 !h-10" aria-label={t.btnDeleteLabel}>
          <Trash2 className="w-[18px] h-[18px]" />
        </button>
      </div>
    </div>
  </article>
);
