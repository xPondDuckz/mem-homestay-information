import React, { useState } from 'react';
import type { BookingRecord, BookingFilterOptions } from '../types/booking';
import { BookingCard } from './BookingCard';
import { MonthSelector } from './MonthSelector';
import type { Language } from '../utils/translations';
import {
  Search, Globe, Footprints, BedDouble, BedSingle, ArrowRight,
  Pencil, Trash2, X, Printer, FileText, SlidersHorizontal, LogIn, LogOut, Inbox,
} from 'lucide-react';
import { formatDateThai, cleanTimeStr } from '../utils/formatters';

interface BookingTableProps {
  bookings: BookingRecord[];
  filterOptions: BookingFilterOptions;
  onFilterChange: (newFilters: Partial<BookingFilterOptions>) => void;
  onEdit: (booking: BookingRecord) => void;
  onDelete: (id: string) => void;
  onQuickUpdateStatus?: (id: string, status: BookingRecord['status']) => void;
  onPrintReceipt?: (booking: BookingRecord) => void;
  onPrintTaxInvoice?: (booking: BookingRecord) => void;
  onResetFilters: () => void;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  availableMonths: string[];
  lang: Language;
  t: any;
}

export const StatusBadge: React.FC<{ status: string; t: any }> = ({ status, t }) => {
  const label: Record<string, string> = {
    confirmed: t.statusConfirmed, checked_in: t.statusCheckedIn,
    checked_out: t.statusCheckedOut, cancelled: t.statusCancelled,
  };
  const key = label[status] ? status : 'confirmed';
  return (
    <span className={`badge badge-${key}`}>
      <span className="badge-dot" aria-hidden />
      {label[key]}
    </span>
  );
};

export const QuickStatusButton: React.FC<{ booking: BookingRecord; onQuickUpdateStatus?: BookingTableProps['onQuickUpdateStatus']; lang: Language }> = ({
  booking, onQuickUpdateStatus, lang,
}) => {
  if (!onQuickUpdateStatus) return null;
  if (booking.status === 'confirmed') return (
    <button onClick={() => onQuickUpdateStatus(booking.id, 'checked_in')} className="btn-soft btn-soft-green">
      <LogIn className="w-3.5 h-3.5" />{lang === 'th' ? 'เช็คอิน' : 'Check in'}
    </button>
  );
  if (booking.status === 'checked_in') return (
    <button onClick={() => onQuickUpdateStatus(booking.id, 'checked_out')} className="btn-soft btn-soft-red">
      <LogOut className="w-3.5 h-3.5" />{lang === 'th' ? 'เช็คเอาท์' : 'Check out'}
    </button>
  );
  return null;
};

export const RoomLabel: React.FC<{ booking: BookingRecord; t: any }> = ({ booking, t }) => {
  const Bed = booking.bedType === 'small' ? BedSingle : BedDouble;
  const bed = booking.bedType === 'big' ? t.bedBig : booking.bedType === 'small' ? t.bedSmall : t.bedBoth;
  const Ch = booking.bookingChannel === 'booking_com' ? Globe : Footprints;
  return (
    <span className="inline-flex items-center gap-3 text-[13px] whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
      <span className="inline-flex items-center gap-1.5"><Bed className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />{bed}</span>
      <span className="inline-flex items-center gap-1.5"><Ch className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />{booking.bookingChannel === 'booking_com' ? 'Booking' : 'Walk-in'}</span>
    </span>
  );
};

const EmptyState: React.FC<{ t: any; onReset?: () => void; filtered: boolean }> = ({ t, onReset, filtered }) => (
  <div className="py-16 px-6 text-center animate-fade-in">
    <div className="w-12 h-12 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ background: 'var(--bg-muted)' }}>
      <Inbox className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
    </div>
    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{t.emptyMessageTitle}</p>
    <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{t.emptyMessageSub}</p>
    {filtered && onReset && (
      <button onClick={onReset} className="mt-4 btn-ghost h-9 px-4 rounded-xl text-sm">{t.resetFilterTitle}</button>
    )}
  </div>
);

export const BookingTable: React.FC<BookingTableProps> = ({
  bookings, filterOptions, onFilterChange, onEdit, onDelete, onQuickUpdateStatus,
  onPrintReceipt, onPrintTaxInvoice, onResetFilters,
  selectedMonth, onMonthChange, availableMonths, lang, t,
}) => {
  const [filtersOpen, setFiltersOpen] = useState(false);

  const extraFilters = (filterOptions.channel !== 'all' ? 1 : 0) + (filterOptions.bedType !== 'all' ? 1 : 0);
  const hasActiveFilters =
    filterOptions.searchQuery.trim() !== '' || extraFilters > 0 || filterOptions.status !== 'all' ||
    filterOptions.startDate !== '' || filterOptions.endDate !== '';

  const statusChips = [
    { key: 'all',         label: t.quickStatusAll || 'ทั้งหมด' },
    { key: 'confirmed',   label: t.quickStatusConfirmed || 'รอเช็คอิน' },
    { key: 'checked_in',  label: t.quickStatusCheckedIn || 'พักอยู่' },
    { key: 'checked_out', label: t.quickStatusCheckedOut || 'เช็คเอาท์แล้ว' },
    { key: 'cancelled',   label: t.statusCancelled },
  ];

  const sortSelect = (
    <select
      value={filterOptions.sortBy}
      onChange={(e) => onFilterChange({ sortBy: e.target.value as any })}
      className="glass-input h-10 px-3 pr-8 cursor-pointer text-sm w-full"
      aria-label="Sort"
    >
      <option value="date_desc">{t.sortDateDesc}</option>
      <option value="date_asc">{t.sortDateAsc}</option>
      <option value="price_desc">{t.sortPriceDesc}</option>
      <option value="price_asc">{t.sortPriceAsc}</option>
      <option value="name_asc">{t.sortNameAsc}</option>
    </select>
  );

  const chipGroup = (label: string, current: string, key: 'channel' | 'bedType', opts: { value: string; label: string }[]) => (
    <div>
      <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <div className="flex flex-wrap gap-2">
        {opts.map((o) => (
          <button key={o.value} onClick={() => onFilterChange({ [key]: o.value } as any)} aria-pressed={current === o.value} className="chip">
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <MonthSelector selectedMonth={selectedMonth} onMonthChange={onMonthChange} availableMonths={availableMonths} lang={lang} t={t} />

        <div className="flex items-center gap-2 lg:ml-auto lg:w-[420px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
            <input
              type="search"
              id="search-input"
              placeholder={t.searchPlaceholder}
              value={filterOptions.searchQuery}
              onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
              className="w-full glass-input h-10 pl-10 pr-9"
            />
            {filterOptions.searchQuery && (
              <button
                onClick={() => onFilterChange({ searchQuery: '' })}
                aria-label="Clear"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center animate-fade-in hover:bg-[var(--bg-hover)]"
                style={{ color: 'var(--text-muted)' }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            id="filter-toggle-btn"
            onClick={() => setFiltersOpen(!filtersOpen)}
            aria-expanded={filtersOpen}
            className="relative h-10 px-3 rounded-xl flex items-center gap-2 text-sm shrink-0 btn-ghost"
            style={filtersOpen ? { borderColor: 'var(--text-primary)', color: 'var(--text-primary)' } : undefined}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">{filtersOpen ? t.hideFilters : t.showFilters}</span>
            {extraFilters > 0 && (
              <span className="min-w-5 h-5 px-1 rounded-full text-[11px] font-semibold flex items-center justify-center text-white animate-fab-pop" style={{ background: 'var(--brand)' }}>
                {extraFilters}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Status chips */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 lg:mx-0 lg:px-0">
        {statusChips.map((chip) => (
          <button
            key={chip.key}
            onClick={() => onFilterChange({ status: chip.key as any })}
            aria-pressed={filterOptions.status === chip.key}
            className="chip shrink-0"
          >
            {chip.label}
          </button>
        ))}
        {hasActiveFilters && (
          <button
            id="reset-filter-btn"
            onClick={onResetFilters}
            className="h-9 px-3 text-sm shrink-0 rounded-full inline-flex items-center gap-1.5 animate-fade-in hover:bg-[var(--bg-hover)]"
            style={{ color: 'var(--text-secondary)' }}
          >
            <X className="w-3.5 h-3.5" />{t.resetFilterTitle}
          </button>
        )}
        <span className="ml-auto pl-3 text-sm shrink-0 tabular" style={{ color: 'var(--text-muted)' }}>
          {bookings.length} {t.recordsUnit}
        </span>
      </div>

      {/* Advanced filters (animated) */}
      <div className={`collapse ${filtersOpen ? 'open' : ''}`}>
        <div>
          <div className="card p-4 sm:p-5 grid gap-5 sm:grid-cols-3">
            {chipGroup(t.filterLabel, filterOptions.channel, 'channel', [
              { value: 'all', label: t.allChannels },
              { value: 'booking_com', label: 'Booking.com' },
              { value: 'walk_in', label: 'Walk-in' },
            ])}
            {chipGroup(lang === 'th' ? 'ประเภทห้อง' : 'Room', filterOptions.bedType, 'bedType', [
              { value: 'all', label: t.allBeds },
              { value: 'big', label: t.bigBedLabel },
              { value: 'small', label: t.smallBedLabel },
            ])}
            <div>
              <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>{lang === 'th' ? 'เรียงตาม' : 'Sort by'}</p>
              {sortSelect}
            </div>
          </div>
        </div>
      </div>

      {/* Phone & tablet: cards */}
      <div className="lg:hidden">
        {bookings.length === 0 ? (
          <div className="card"><EmptyState t={t} filtered={hasActiveFilters} onReset={onResetFilters} /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {bookings.map((b, i) => (
              <BookingCard
                key={b.id} booking={b} onEdit={onEdit} onDelete={onDelete}
                onQuickUpdateStatus={onQuickUpdateStatus}
                onPrintReceipt={onPrintReceipt} onPrintTaxInvoice={onPrintTaxInvoice}
                t={t} lang={lang} index={i}
              />
            ))}
          </div>
        )}
      </div>

      {/* Desktop: table */}
      <div className="hidden lg:block card overflow-hidden">
        {bookings.length === 0 ? (
          <EmptyState t={t} filtered={hasActiveFilters} onReset={onResetFilters} />
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="table-header">
              <tr className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
                <th className="font-normal py-3 pl-5 pr-3">{t.colCustomer}</th>
                <th className="font-normal py-3 px-3">{t.colCheckInOut}</th>
                <th className="font-normal py-3 px-3">{t.colBed}</th>
                <th className="font-normal py-3 px-3 text-right">{t.colPrice}</th>
                <th className="font-normal py-3 px-3">{t.colStatus}</th>
                <th className="py-3 pr-4 pl-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b, i) => (
                <tr
                  key={b.id}
                  className={`row row-${b.status} animate-rise stagger`}
                  style={{ '--i': i, borderBottom: i === bookings.length - 1 ? 'none' : '1px solid var(--border-light)' } as React.CSSProperties}
                >
                  <td className="py-3.5 pl-5 pr-3">
                    <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{b.customerName}</div>
                    <div className="text-[13px] tabular" style={{ color: 'var(--text-muted)' }}>{b.phoneNumber}</div>
                  </td>
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                      {formatDateThai(b.checkInDate)}
                      <ArrowRight className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                      {formatDateThai(b.checkOutDate)}
                    </div>
                    <div className="text-[13px] tabular" style={{ color: 'var(--text-muted)' }}>
                      {cleanTimeStr(b.checkInTime)} – {cleanTimeStr(b.checkOutTime)}
                    </div>
                  </td>
                  <td className="py-3.5 px-3"><RoomLabel booking={b} t={t} /></td>
                  <td className="py-3.5 px-3 text-right whitespace-nowrap font-semibold tabular" style={{ color: 'var(--text-primary)' }}>
                    ฿{b.price.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={b.status} t={t} />
                      <QuickStatusButton booking={b} onQuickUpdateStatus={onQuickUpdateStatus} lang={lang} />
                    </div>
                  </td>
                  <td className="py-3.5 pr-4 pl-3">
                    <div className="row-actions flex items-center justify-end gap-0.5">
                      {onPrintReceipt && (
                        <button id={`print-btn-${b.id}`} onClick={() => onPrintReceipt(b)} className="action-btn" title="พิมพ์ใบยืนยัน" aria-label="พิมพ์ใบยืนยัน">
                          <Printer className="w-4 h-4" />
                        </button>
                      )}
                      {onPrintTaxInvoice && (
                        <button id={`tax-invoice-btn-${b.id}`} onClick={() => onPrintTaxInvoice(b)} className="action-btn" title="ใบกำกับภาษี" aria-label="ใบกำกับภาษี">
                          <FileText className="w-4 h-4" />
                        </button>
                      )}
                      <button id={`edit-btn-${b.id}`} onClick={() => onEdit(b)} className="action-btn" title={t.btnEditLabel} aria-label={t.btnEditLabel}>
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button id={`delete-btn-${b.id}`} onClick={() => onDelete(b.id)} className="action-btn action-btn-delete" title={t.btnDeleteLabel} aria-label={t.btnDeleteLabel}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
