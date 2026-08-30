import React, { useState } from 'react';
import type { BookingRecord, BookingFilterOptions } from '../types/booking';
import { BookingCard } from './BookingCard';
import { MonthSelector } from './MonthSelector';
import type { Language } from '../utils/translations';
import {
  Search, Globe, Footprints, BedDouble, BedSingle, ArrowUpDown,
  Edit2, Trash2, RefreshCw, ChevronDown, ChevronUp, Printer, FileText, SlidersHorizontal
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

const getStatusBadge = (status: string, t: any) => {
  const map: Record<string, { cls: string; label: string; dot?: boolean }> = {
    checked_in:  { cls: 'badge badge-checked_in',  label: t.statusCheckedIn,  dot: true },
    checked_out: { cls: 'badge badge-checked_out', label: t.statusCheckedOut },
    cancelled:   { cls: 'badge badge-cancelled',   label: t.statusCancelled },
    confirmed:   { cls: 'badge badge-confirmed',   label: t.statusConfirmed,  dot: true },
  };
  const cfg = map[status] ?? map.confirmed;
  return (
    <span className={cfg.cls}>
      {cfg.dot && (
        <span
          className="w-1.5 h-1.5 rounded-full inline-block shrink-0"
          style={{ background: status === 'checked_in' ? 'var(--blue)' : 'var(--green)' }}
        />
      )}
      {cfg.label}
    </span>
  );
};

export const BookingTable: React.FC<BookingTableProps> = ({
  bookings, filterOptions, onFilterChange, onEdit, onDelete, onQuickUpdateStatus,
  onPrintReceipt, onPrintTaxInvoice, onResetFilters,
  selectedMonth, onMonthChange, availableMonths, lang, t,
}) => {
  const [filtersOpen, setFiltersOpen] = useState(false);

  const hasActiveFilters =
    filterOptions.searchQuery.trim() !== '' ||
    filterOptions.channel !== 'all' ||
    filterOptions.bedType !== 'all' ||
    filterOptions.status !== 'all';

  const statusChips = [
    { key: 'all',         label: t.quickStatusAll || 'ทั้งหมด' },
    { key: 'confirmed',   label: t.quickStatusConfirmed || 'รอเช็คอิน' },
    { key: 'checked_in',  label: t.quickStatusCheckedIn || 'พักอยู่' },
    { key: 'checked_out', label: t.quickStatusCheckedOut || 'เช็คเอาท์แล้ว' },
  ];

  return (
    <div className="space-y-4">

      <MonthSelector
        selectedMonth={selectedMonth}
        onMonthChange={onMonthChange}
        availableMonths={availableMonths}
        lang={lang}
        t={t}
      />

      {/* Toolbar */}
      <div className="card overflow-hidden">
        <div className="p-4 space-y-3">
          {/* Search row */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search
                className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'var(--text-muted)' }}
              />
              <input
                type="text"
                id="search-input"
                placeholder={t.searchPlaceholder}
                value={filterOptions.searchQuery}
                onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
                className="w-full glass-input pl-10 pr-4 py-2.5 text-sm min-h-[42px]"
              />
            </div>

            {/* Sort */}
            <div
              className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold shrink-0 min-h-[42px]"
              style={{ background: 'var(--bg-muted)', border: '1px solid var(--border-light)' }}
            >
              <ArrowUpDown className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-muted)' }} />
              <select
                value={filterOptions.sortBy}
                onChange={(e) => onFilterChange({ sortBy: e.target.value as any })}
                className="bg-transparent focus:outline-none cursor-pointer text-xs font-semibold"
                style={{ color: 'var(--text-secondary)' }}
              >
                <option value="date_desc">{t.sortDateDesc}</option>
                <option value="date_asc">{t.sortDateAsc}</option>
                <option value="price_desc">{t.sortPriceDesc}</option>
                <option value="price_asc">{t.sortPriceAsc}</option>
                <option value="name_asc">{t.sortNameAsc}</option>
              </select>
            </div>

            {/* Filter toggle */}
            <button
              id="filter-toggle-btn"
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all min-h-[42px] shrink-0"
              style={filtersOpen || hasActiveFilters ? {
                background: 'var(--brand-light)', border: '1.5px solid #c5d0fa', color: 'var(--brand)',
              } : {
                background: 'var(--bg-muted)', border: '1px solid var(--border-light)', color: 'var(--text-secondary)',
              }}
            >
              {hasActiveFilters && !filtersOpen && (
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: 'var(--red)' }} />
              )}
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">{filtersOpen ? t.hideFilters : t.showFilters}</span>
              {filtersOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {hasActiveFilters && (
              <button
                id="reset-filter-btn"
                onClick={onResetFilters}
                className="p-2.5 rounded-xl transition-all min-h-[42px] min-w-[42px] flex items-center justify-center"
                style={{ background: '#fff5f5', border: '1px solid var(--red-border)' }}
                title={t.resetFilterTitle}
              >
                <RefreshCw className="w-4 h-4" style={{ color: 'var(--red)' }} />
              </button>
            )}
          </div>

          {/* Status Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5 no-scrollbar">
            {statusChips.map((chip) => (
              <button
                key={chip.key}
                onClick={() => onFilterChange({ status: chip.key as any })}
                className={filterOptions.status === chip.key ? `chip active-${chip.key}` : 'chip'}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Accordion */}
        {filtersOpen && (
          <div
            className="px-4 py-4 space-y-4 animate-fade-in"
            style={{ borderTop: '1px solid var(--border-light)', background: 'var(--bg-muted)' }}
          >
            {/* Channel */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] mb-2" style={{ color: 'var(--text-muted)' }}>
                {t.filterLabel}
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'all', label: t.allChannels, icon: null },
                  { value: 'booking_com', label: 'Booking.com', icon: <Globe className="w-3.5 h-3.5" /> },
                  { value: 'walk_in', label: 'Walk-in', icon: <Footprints className="w-3.5 h-3.5" /> },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => onFilterChange({ channel: opt.value as any })}
                    className={filterOptions.channel === opt.value
                      ? 'chip active-all'
                      : 'chip'}
                  >
                    {opt.icon}{opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Bed Type */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] mb-2" style={{ color: 'var(--text-muted)' }}>
                ประเภทห้อง
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'all', label: t.allBeds, icon: null },
                  { value: 'big', label: t.bigBedLabel, icon: <BedDouble className="w-3.5 h-3.5" /> },
                  { value: 'small', label: t.smallBedLabel, icon: <BedSingle className="w-3.5 h-3.5" /> },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => onFilterChange({ bedType: opt.value as any })}
                    className={filterOptions.bedType === opt.value ? 'chip active-all' : 'chip'}
                  >
                    {opt.icon}{opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Status */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] mb-2" style={{ color: 'var(--text-muted)' }}>
                สถานะ
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'all', label: t.allStatuses },
                  { value: 'confirmed', label: t.statusConfirmed },
                  { value: 'checked_in', label: t.statusCheckedIn },
                  { value: 'checked_out', label: t.statusCheckedOut },
                  { value: 'cancelled', label: t.statusCancelled },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => onFilterChange({ status: opt.value as any })}
                    className={filterOptions.status === opt.value ? `chip active-${opt.value}` : 'chip'}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort mobile */}
            <div
              className="sm:hidden flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-light)' }}
            >
              <ArrowUpDown className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-muted)' }} />
              <select
                value={filterOptions.sortBy}
                onChange={(e) => onFilterChange({ sortBy: e.target.value as any })}
                className="bg-transparent focus:outline-none cursor-pointer w-full text-xs font-semibold"
                style={{ color: 'var(--text-secondary)' }}
              >
                <option value="date_desc">{t.sortDateDesc}</option>
                <option value="date_asc">{t.sortDateAsc}</option>
                <option value="price_desc">{t.sortPriceDesc}</option>
                <option value="price_asc">{t.sortPriceAsc}</option>
                <option value="name_asc">{t.sortNameAsc}</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Cards */}
      <div className="grid grid-cols-1 md:hidden gap-3">
        {bookings.length === 0 ? (
          <div className="card p-10 text-center">
            <div className="text-5xl mb-4">🏡</div>
            <p className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>{t.emptyMessageTitle}</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{t.emptyMessageSub}</p>
          </div>
        ) : (
          bookings.map((b, i) => (
            <BookingCard
              key={b.id} booking={b} onEdit={onEdit} onDelete={onDelete}
              onQuickUpdateStatus={onQuickUpdateStatus}
              onPrintReceipt={onPrintReceipt} onPrintTaxInvoice={onPrintTaxInvoice}
              t={t} index={i}
            />
          ))
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="table-header">
              <tr>
                {[t.colDate, t.colCustomer].map(h => (
                  <th key={h} className="py-3 px-5 text-[11px] font-bold uppercase tracking-[0.08em]" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
                <th className="py-3 px-4 text-center text-[11px] font-bold uppercase tracking-[0.08em]" style={{ color: 'var(--text-muted)' }}>{t.colBed}</th>
                <th className="py-3 px-4 text-center text-[11px] font-bold uppercase tracking-[0.08em]" style={{ color: 'var(--text-muted)' }}>{t.colChannel}</th>
                <th className="py-3 px-5 text-[11px] font-bold uppercase tracking-[0.08em]" style={{ color: 'var(--text-muted)' }}>{t.colCheckInOut}</th>
                <th className="py-3 px-5 text-right text-[11px] font-bold uppercase tracking-[0.08em]" style={{ color: 'var(--text-muted)' }}>{t.colPrice}</th>
                <th className="py-3 px-4 text-center text-[11px] font-bold uppercase tracking-[0.08em]" style={{ color: 'var(--text-muted)' }}>{t.colStatus}</th>
                <th className="py-3 px-4 w-40" />
              </tr>
            </thead>
            <tbody>
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="text-5xl mb-4">🏡</div>
                    <p className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>{t.emptyMessageTitle}</p>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{t.emptyMessageSub}</p>
                  </td>
                </tr>
              ) : (
                bookings.map((booking, i) => {
                  const delays = ['delay-0','delay-75','delay-150','delay-225','delay-300','delay-375','delay-450'];
                  return (
                    <tr
                      key={booking.id}
                      className={`animate-fade-in ${delays[Math.min(i, 6)]} ${`row-${booking.status}`}`}
                      style={{ borderBottom: '1px solid var(--border-light)' }}
                    >
                      {/* Date only (no ID) */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {formatDateThai(booking.createdAt)}
                        </span>
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{booking.customerName}</div>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          ☎ {booking.phoneNumber}
                        </div>
                      </td>

                      {/* Bed */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {booking.bedType === 'big'   && <span className="badge badge-bed-big"><BedDouble className="w-3 h-3" />{t.bedBig}</span>}
                        {booking.bedType === 'small' && <span className="badge badge-bed-small"><BedSingle className="w-3 h-3" />{t.bedSmall}</span>}
                        {booking.bedType === 'both'  && <span className="badge badge-bed-both"><BedDouble className="w-3 h-3" />{t.bedBoth}</span>}
                      </td>

                      {/* Channel */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {booking.bookingChannel === 'booking_com'
                          ? <span className="badge badge-booking"><Globe className="w-3 h-3" />Booking</span>
                          : <span className="badge badge-walkin"><Footprints className="w-3 h-3" />Walk-in</span>
                        }
                      </td>

                      {/* Check-in/out */}
                      <td className="py-3.5 px-5 whitespace-nowrap text-xs">
                        <div className="flex items-center gap-1.5 font-medium" style={{ color: '#087f5b' }}>
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--green)' }} />
                          {formatDateThai(booking.checkInDate)}
                          <span className="font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>
                            ({cleanTimeStr(booking.checkInTime)})
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 font-medium mt-1" style={{ color: '#c92a2a' }}>
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--red)' }} />
                          {formatDateThai(booking.checkOutDate)}
                          <span className="font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>
                            ({cleanTimeStr(booking.checkOutTime)})
                          </span>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <span className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                          ฿{booking.price.toLocaleString()}
                        </span>
                      </td>

                      {/* Status + 1-Click Quick Update */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex flex-col items-center gap-1">
                          {getStatusBadge(booking.status, t)}
                          {onQuickUpdateStatus && booking.status === 'confirmed' && (
                            <button
                              onClick={() => onQuickUpdateStatus(booking.id, 'checked_in')}
                              className="text-[10px] font-bold px-2 py-0.5 rounded-md hover:scale-105 active:scale-95 transition-all shadow-xs"
                              style={{ background: '#e6fcf5', border: '1px solid #c3fae8', color: '#087f5b' }}
                              title="กด 1-Click เพื่อเช็คอินทันที"
                            >
                              📥 เช็คอินเลย
                            </button>
                          )}
                          {onQuickUpdateStatus && booking.status === 'checked_in' && (
                            <button
                              onClick={() => onQuickUpdateStatus(booking.id, 'checked_out')}
                              className="text-[10px] font-bold px-2 py-0.5 rounded-md hover:scale-105 active:scale-95 transition-all shadow-xs"
                              style={{ background: '#fff5f5', border: '1px solid #ffc9c9', color: '#c92a2a' }}
                              title="กด 1-Click เพื่อเช็คเอาท์ทันที"
                            >
                              🚪 เช็คเอาท์
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {onPrintReceipt && (
                            <button
                              id={`print-btn-${booking.id}`}
                              onClick={() => onPrintReceipt(booking)}
                              className="action-btn action-btn-print"
                              title="พิมพ์ใบยืนยัน"
                            >
                              <Printer className="w-3.5 h-3.5" style={{ color: 'var(--green)' }} />
                            </button>
                          )}
                          {onPrintTaxInvoice && (
                            <button
                              id={`tax-invoice-btn-${booking.id}`}
                              onClick={() => onPrintTaxInvoice(booking)}
                              className="action-btn action-btn-tax"
                              title="ใบกำกับภาษี"
                            >
                              <FileText className="w-3.5 h-3.5" style={{ color: 'var(--blue)' }} />
                            </button>
                          )}
                          <button
                            id={`edit-btn-${booking.id}`}
                            onClick={() => onEdit(booking)}
                            className="action-btn action-btn-edit flex items-center gap-1.5 px-3"
                            style={{ width: 'auto' }}
                          >
                            <Edit2 className="w-3.5 h-3.5" style={{ color: 'var(--amber)' }} />
                            <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                              {t.btnEditLabel}
                            </span>
                          </button>
                          <button
                            id={`delete-btn-${booking.id}`}
                            onClick={() => onDelete(booking.id)}
                            className="action-btn action-btn-delete"
                            title={t.btnDeleteLabel}
                          >
                            <Trash2 className="w-3.5 h-3.5" style={{ color: 'var(--red)' }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
