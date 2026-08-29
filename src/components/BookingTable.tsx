import React, { useState } from 'react';
import type { BookingRecord, BookingFilterOptions } from '../types/booking';
import { BookingCard } from './BookingCard';
import { MonthSelector } from './MonthSelector';
import type { Language } from '../utils/translations';
import { Search, Globe, Footprints, BedDouble, BedSingle, ArrowUpDown, Edit2, Trash2, RefreshCw, ChevronDown, ChevronUp, Printer } from 'lucide-react';

interface BookingTableProps {
  bookings: BookingRecord[];
  filterOptions: BookingFilterOptions;
  onFilterChange: (newFilters: Partial<BookingFilterOptions>) => void;
  onEdit: (booking: BookingRecord) => void;
  onDelete: (id: string) => void;
  onPrintReceipt?: (booking: BookingRecord) => void;
  onResetFilters: () => void;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  availableMonths: string[];
  lang: Language;
  t: any;
}

const getStatusBadge = (status: string, t: any) => {
  switch (status) {
    case 'checked_in':
      return <span className="bg-blue-100 text-blue-800 border border-blue-300 text-xs px-2.5 py-1 rounded-full font-bold whitespace-nowrap">{t.statusCheckedIn}</span>;
    case 'checked_out':
      return <span className="bg-slate-100 text-slate-600 border border-slate-300 text-xs px-2.5 py-1 rounded-full font-semibold whitespace-nowrap">{t.statusCheckedOut}</span>;
    case 'cancelled':
      return <span className="bg-rose-100 text-rose-700 border border-rose-300 text-xs px-2.5 py-1 rounded-full font-bold whitespace-nowrap">{t.statusCancelled}</span>;
    default:
      return <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs px-2.5 py-1 rounded-full font-bold whitespace-nowrap">{t.statusConfirmed}</span>;
  }
};

export const BookingTable: React.FC<BookingTableProps> = ({
  bookings,
  filterOptions,
  onFilterChange,
  onEdit,
  onDelete,
  onPrintReceipt,
  onResetFilters,
  selectedMonth,
  onMonthChange,
  availableMonths,
  lang,
  t,
}) => {
  const [filtersOpen, setFiltersOpen] = useState(false);


  const hasActiveFilters =
    filterOptions.searchQuery.trim() !== '' ||
    filterOptions.channel !== 'all' ||
    filterOptions.bedType !== 'all' ||
    filterOptions.status !== 'all';


  return (
    <div className="space-y-3">

      {/* ── Month Selector & Indicator Bar ── */}
      <MonthSelector
        selectedMonth={selectedMonth}
        onMonthChange={onMonthChange}
        availableMonths={availableMonths}
        lang={lang}
        t={t}
      />

      {/* ── Toolbar Card ── */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">


        {/* Search Row */}
        <div className="p-3 space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                id="search-input"
                placeholder={t.searchPlaceholder}
                value={filterOptions.searchQuery}
                onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
                className="w-full glass-input pl-10 pr-4 py-2.5 rounded-xl text-sm min-h-[44px]"
              />
            </div>

            {/* Sort */}
            <div className="hidden sm:flex items-center gap-1.5 bg-slate-100 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold shrink-0 min-h-[44px]">
              <ArrowUpDown className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <select
                value={filterOptions.sortBy}
                onChange={(e) => onFilterChange({ sortBy: e.target.value as any })}
                className="bg-transparent text-slate-900 font-bold focus:outline-none cursor-pointer text-xs"
              >
                <option value="date_desc">{t.sortDateDesc}</option>
                <option value="date_asc">{t.sortDateAsc}</option>
                <option value="price_desc">{t.sortPriceDesc}</option>
                <option value="price_asc">{t.sortPriceAsc}</option>
                <option value="name_asc">{t.sortNameAsc}</option>
              </select>
            </div>

            {/* Filter Toggle Button */}
            <button
              id="filter-toggle-btn"
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition min-h-[44px] shrink-0 ${
                filtersOpen || hasActiveFilters
                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {hasActiveFilters && !filtersOpen ? (
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
              ) : null}
              {filtersOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              <span className="hidden sm:inline">{filtersOpen ? t.hideFilters : t.showFilters}</span>
            </button>

            {/* Reset Filters */}
            {hasActiveFilters && (
              <button
                id="reset-filter-btn"
                onClick={onResetFilters}
                className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 transition min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
                title={t.resetFilterTitle}
              >
                <RefreshCw className="w-4 h-4 text-amber-600" />
              </button>
            )}
          </div>

          {/* Quick Status Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 pt-0.5 no-scrollbar">
            {[
              { key: 'all', label: t.quickStatusAll || 'ทั้งหมด', active: 'bg-slate-900 text-white border-slate-900' },
              { key: 'confirmed', label: t.quickStatusConfirmed || 'รอเช็คอิน', active: 'bg-emerald-600 text-white border-emerald-600' },
              { key: 'checked_in', label: t.quickStatusCheckedIn || 'พักอยู่', active: 'bg-blue-600 text-white border-blue-600' },
              { key: 'checked_out', label: t.quickStatusCheckedOut || 'เช็คเอาท์แล้ว', active: 'bg-slate-600 text-white border-slate-600' },
            ].map((chip) => (
              <button
                key={chip.key}
                onClick={() => onFilterChange({ status: chip.key as any })}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition whitespace-nowrap min-h-[34px] ${
                  filterOptions.status === chip.key
                    ? `${chip.active} shadow-sm`
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>


        {/* Expandable Filter Accordion */}
        {filtersOpen && (
          <div className="border-t border-slate-100 px-3 py-3 space-y-2.5 animate-fade-in">

            {/* Channel */}
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t.filterLabel}</p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { value: 'all',         label: t.allChannels,  icon: null,                                         active: 'bg-amber-500 text-slate-950 border-amber-500' },
                  { value: 'booking_com', label: 'Booking.com',  icon: <Globe className="w-3.5 h-3.5" />,           active: 'bg-blue-600 text-white border-blue-600' },
                  { value: 'walk_in',     label: 'Walk-in',       icon: <Footprints className="w-3.5 h-3.5" />,     active: 'bg-emerald-600 text-white border-emerald-600' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => onFilterChange({ channel: opt.value as any })}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition min-h-[36px] ${
                      filterOptions.channel === opt.value
                        ? opt.active
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-400'
                    }`}
                  >
                    {opt.icon}{opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Bed Type */}
            <div className="flex flex-wrap gap-1.5">
              {[
                { value: 'all',   label: t.allBeds,        icon: null,                                       active: 'bg-amber-500 text-slate-950 border-amber-500' },
                { value: 'big',   label: t.bigBedLabel,    icon: <BedDouble className="w-3.5 h-3.5" />,     active: 'bg-purple-600 text-white border-purple-600' },
                { value: 'small', label: t.smallBedLabel,  icon: <BedSingle className="w-3.5 h-3.5" />,    active: 'bg-cyan-600 text-white border-cyan-600' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => onFilterChange({ bedType: opt.value as any })}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition min-h-[36px] ${
                    filterOptions.bedType === opt.value
                      ? opt.active
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-400'
                  }`}
                >
                  {opt.icon}{opt.label}
                </button>
              ))}
            </div>

            {/* Status */}
            <div className="flex flex-wrap gap-1.5">
              {[
                { value: 'all',          label: t.allStatuses,       active: 'bg-amber-500 text-slate-950 border-amber-500' },
                { value: 'confirmed',    label: t.statusConfirmed,   active: 'bg-emerald-600 text-white border-emerald-600' },
                { value: 'checked_in',   label: t.statusCheckedIn,   active: 'bg-blue-600 text-white border-blue-600' },
                { value: 'checked_out',  label: t.statusCheckedOut,  active: 'bg-slate-500 text-white border-slate-500' },
                { value: 'cancelled',    label: t.statusCancelled,   active: 'bg-rose-600 text-white border-rose-600' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => onFilterChange({ status: opt.value as any })}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition min-h-[36px] ${
                    filterOptions.status === opt.value
                      ? opt.active
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-400'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Sort — mobile only */}
            <div className="sm:hidden flex items-center gap-1.5 bg-slate-100 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold">
              <ArrowUpDown className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <select
                value={filterOptions.sortBy}
                onChange={(e) => onFilterChange({ sortBy: e.target.value as any })}
                className="bg-transparent text-slate-900 font-bold focus:outline-none cursor-pointer w-full text-xs"
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


      {/* ── Mobile Cards ── */}
      <div className="grid grid-cols-1 md:hidden gap-3">
        {bookings.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center border border-slate-200 shadow-sm">
            <div className="text-4xl mb-3">🏡</div>
            <p className="font-bold text-slate-800 dark:text-slate-200 text-base">{t.emptyMessageTitle}</p>
            <p className="text-sm text-slate-500 mt-1">{t.emptyMessageSub}</p>
          </div>
        ) : (
          bookings.map((b, i) => (
            <BookingCard key={b.id} booking={b} onEdit={onEdit} onDelete={onDelete} onPrintReceipt={onPrintReceipt} t={t} index={i} />
          ))
        )}
      </div>

      {/* ── Desktop Table ── */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                <th className="py-3 px-4">{t.colDate}</th>
                <th className="py-3 px-4">{t.colCustomer}</th>
                <th className="py-3 px-4 text-center">{t.colBed}</th>
                <th className="py-3 px-4 text-center">{t.colChannel}</th>
                <th className="py-3 px-4">{t.colCheckInOut}</th>
                <th className="py-3 px-4 text-right">{t.colPrice}</th>
                <th className="py-3 px-4 text-center">{t.colStatus}</th>
                <th className="py-3 px-4 w-36"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-14 text-center">
                    <div className="text-4xl mb-3">🏡</div>
                    <p className="font-bold text-slate-800 dark:text-slate-200 text-base">{t.emptyMessageTitle}</p>
                    <p className="text-sm text-slate-500 mt-1">{t.emptyMessageSub}</p>
                  </td>
                </tr>
              ) : (
                bookings.map((booking, i) => {
                  const rowDelays = ['delay-0','delay-75','delay-150','delay-225','delay-300','delay-375','delay-450'];
                  const rowDelay = rowDelays[Math.min(i, rowDelays.length - 1)];
                  return (
                  <tr
                    key={booking.id}
                    className={`transition-colors animate-fade-in ${rowDelay} ${`row-${booking.status}`}`}
                  >
                    {/* Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="block font-mono text-amber-700 text-[11px] font-bold">{booking.id}</span>
                      <span className="text-xs text-slate-500 font-medium">{booking.createdAt}</span>
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{booking.customerName}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">☎️ {booking.phoneNumber}</div>
                    </td>

                    {/* Bed */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {booking.bedType === 'big' && (
                        <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-800 border border-purple-200 px-2.5 py-0.5 rounded-xl text-xs font-bold">
                          <BedDouble className="w-3.5 h-3.5 text-purple-600" />{t.bedBig}
                        </span>
                      )}
                      {booking.bedType === 'small' && (
                        <span className="inline-flex items-center gap-1 bg-cyan-50 text-cyan-800 border border-cyan-200 px-2.5 py-0.5 rounded-xl text-xs font-bold">
                          <BedSingle className="w-3.5 h-3.5 text-cyan-600" />{t.bedSmall}
                        </span>
                      )}
                      {booking.bedType === 'both' && (
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-xl text-xs font-bold">
                          <BedDouble className="w-3 h-3 text-amber-600" />{t.bedBoth}
                        </span>
                      )}
                    </td>

                    {/* Channel */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {booking.bookingChannel === 'booking_com' ? (
                        <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-0.5 rounded-xl text-xs font-bold">
                          <Globe className="w-3.5 h-3.5 text-blue-600" />Booking
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-xl text-xs font-bold">
                          <Footprints className="w-3.5 h-3.5 text-emerald-600" />Walk-in
                        </span>
                      )}
                    </td>

                    {/* Check-in/out */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-xs">
                      <div className="text-emerald-700 font-semibold">In: {booking.checkInDate} <span className="text-slate-400 text-[10px]">{booking.checkInTime}</span></div>
                      <div className="text-rose-700 font-semibold mt-0.5">Out: {booking.checkOutDate} <span className="text-slate-400 text-[10px]">{booking.checkOutTime}</span></div>
                    </td>

                    {/* Price */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <span className="text-base font-extrabold text-amber-600">฿{booking.price.toLocaleString()}</span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {getStatusBadge(booking.status, t)}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {onPrintReceipt && (
                          <button
                            id={`print-btn-${booking.id}`}
                            onClick={() => onPrintReceipt(booking)}
                            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition min-h-[36px] min-w-[36px] flex items-center justify-center"
                            title="พิมพ์ใบเสร็จ (A4)"
                          >
                            <Printer className="w-3.5 h-3.5 text-emerald-600" />
                          </button>
                        )}
                        <button
                          id={`edit-btn-${booking.id}`}
                          onClick={() => onEdit(booking)}
                          className="px-2.5 py-2 rounded-lg bg-slate-100 hover:bg-amber-50 text-slate-700 font-bold text-xs border border-slate-200 flex items-center gap-1 transition min-h-[36px] hover:border-amber-300"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-amber-600" />
                          {t.btnEditLabel}
                        </button>
                        <button
                          id={`delete-btn-${booking.id}`}
                          onClick={() => onDelete(booking.id)}
                          className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition min-h-[36px] min-w-[36px] flex items-center justify-center"
                          title={t.btnDeleteLabel}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
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
