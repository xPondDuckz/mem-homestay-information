import React, { useState } from 'react';
import type { BookingRecord } from '../types/booking';
import { MonthSelector } from './MonthSelector';
import type { Language } from '../utils/translations';
import { LogIn, LogOut, BedDouble, User, PlusCircle, X, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { formatDateThai } from '../utils/formatters';

interface CalendarViewProps {
  bookings: BookingRecord[];
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  availableMonths: string[];
  onEditBooking: (booking: BookingRecord) => void;
  onAddBookingForDate: (dateStr: string) => void;
  lang: Language;
  t: any;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  bookings,
  selectedMonth,
  onMonthChange,
  availableMonths,
  onEditBooking,
  onAddBookingForDate,
  lang,
  t,
}) => {
  const [selectedDayDate, setSelectedDayDate] = useState<string | null>(null);

  const [yearStr, monthStr] = (selectedMonth === 'all' ? new Date().toISOString().slice(0, 7) : selectedMonth).split('-');
  const year = parseInt(yearStr, 10) || new Date().getFullYear();
  const monthIdx = (parseInt(monthStr, 10) || (new Date().getMonth() + 1)) - 1;

  const firstDayOfWeek = new Date(year, monthIdx, 1).getDay();
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, monthIdx, 0).getDate();

  const todayStr = new Date().toISOString().slice(0, 10);

  const dayNames = lang === 'th' 
    ? ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getBookingsForDate = (dateStr: string) => {
    return bookings.filter((b) => {
      if (b.status === 'cancelled') return false;
      const isCheckIn = b.checkInDate === dateStr;
      const isCheckOut = b.checkOutDate === dateStr;
      const isStaying = b.checkInDate <= dateStr && dateStr <= b.checkOutDate;
      return isCheckIn || isCheckOut || isStaying;
    });
  };

  const gridCells = [];
  
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    const prevMonthIdx = monthIdx === 0 ? 11 : monthIdx - 1;
    const prevYear = monthIdx === 0 ? year - 1 : year;
    const dateStr = `${prevYear}-${String(prevMonthIdx + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    gridCells.push({ dayNum, isCurrentMonth: false, dateStr });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    gridCells.push({ dayNum: d, isCurrentMonth: true, dateStr });
  }

  const totalCellsSoFar = gridCells.length;
  const targetTotal = totalCellsSoFar > 35 ? 42 : 35;
  const remainingCells = targetTotal - totalCellsSoFar;
  for (let n = 1; n <= remainingCells; n++) {
    const nextMonthIdx = monthIdx === 11 ? 0 : monthIdx + 1;
    const nextYear = monthIdx === 11 ? year + 1 : year;
    const dateStr = `${nextYear}-${String(nextMonthIdx + 1).padStart(2, '0')}-${String(n).padStart(2, '0')}`;
    gridCells.push({ dayNum: n, isCurrentMonth: false, dateStr });
  }

  const selectedDayBookings = selectedDayDate ? getBookingsForDate(selectedDayDate) : [];

  return (
    <div className="space-y-4 animate-fade-in">
      
      <MonthSelector
        selectedMonth={selectedMonth}
        onMonthChange={onMonthChange}
        availableMonths={availableMonths}
        lang={lang}
        t={t}
      />

      <div className="card p-4 sm:p-6 overflow-hidden">
        
        {/* Header Indicator */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3" style={{ borderBottom: '1px solid var(--border-light)' }}>
          <div>
            <h2 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <CalendarIcon className="w-4 h-4" style={{ color: 'var(--brand)' }} />
              ปฏิทินการจองห้องพัก
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold" style={{ background: 'var(--brand-light)', border: '1px solid var(--brand-border)', color: 'var(--brand)' }}>
                {new Date(year, monthIdx).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US', { month: 'long', year: 'numeric' })}
              </span>
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>คลิกที่วันที่เพื่อดูรายละเอียดหรือเพิ่มรายการจองใหม่ได้ทันที</p>
          </div>

          {/* Legend Badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="badge badge-confirmed">
              <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: 'var(--green)' }} /> เช็คอิน
            </span>
            <span className="badge badge-cancelled">
              <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: 'var(--red)' }} /> เช็คเอาท์
            </span>
            <span className="badge badge-checked_in">
              <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: 'var(--blue)' }} /> พักอยู่
            </span>
          </div>
        </div>

        {/* 7 Columns Day Names Header */}
        <div className="grid grid-cols-7 gap-1 text-center font-semibold text-xs uppercase tracking-wider mb-2">
          {dayNames.map((dayName, idx) => (
            <div
              key={dayName}
              className="py-2 rounded-xl"
              style={idx === 0 || idx === 6
                ? { background: 'var(--brand-light)', color: 'var(--brand)', fontWeight: 700 }
                : { background: 'var(--bg-muted)', color: 'var(--text-secondary)' }
              }
            >
              {dayName}
            </div>
          ))}
        </div>

        {/* Calendar Grid Cells */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {gridCells.map((cell) => {
            const dayBookings = getBookingsForDate(cell.dateStr);
            const isToday = cell.dateStr === todayStr;

            return (
              <div
                key={cell.dateStr}
                onClick={() => setSelectedDayDate(cell.dateStr)}
                className="min-h-[85px] sm:min-h-[105px] p-1.5 sm:p-2 rounded-xl transition-all cursor-pointer flex flex-col justify-between group"
                style={cell.isCurrentMonth
                  ? isToday
                    ? { background: 'var(--brand-light)', border: '2px solid var(--brand)', boxShadow: 'var(--shadow-xs)' }
                    : { background: 'var(--bg-card)', border: '1px solid var(--border-light)' }
                  : { background: 'var(--bg-muted)', border: '1px solid var(--border-light)', opacity: 0.45 }
                }
              >
                {/* Date Header */}
                <div className="flex items-center justify-between">
                  <span
                    className="inline-flex items-center justify-center text-xs font-bold rounded-md min-w-[22px] h-[22px] px-1"
                    style={isToday
                      ? { background: 'var(--brand)', color: '#fff' }
                      : cell.isCurrentMonth
                      ? { color: 'var(--text-primary)' }
                      : { color: 'var(--text-muted)' }
                    }
                  >
                    {cell.dayNum}
                  </span>
                  {dayBookings.length > 0 && (
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.2 rounded-full"
                      style={{ background: 'var(--brand-light)', color: 'var(--brand)', border: '1px solid var(--brand-border)' }}
                    >
                      {dayBookings.length}
                    </span>
                  )}
                </div>

                {/* Day Bookings Pills */}
                <div className="space-y-1 my-1 overflow-hidden">
                  {dayBookings.slice(0, 2).map((b) => {
                    const isCheckIn = b.checkInDate === cell.dateStr;
                    const isCheckOut = b.checkOutDate === cell.dateStr;

                    let badgeStyle = { background: 'var(--blue-bg)', color: '#2c5784', border: '1px solid var(--blue-border)' };
                    let prefix = '🛌';
                    if (isCheckIn) {
                      badgeStyle = { background: 'var(--green-bg)', color: '#1d6a49', border: '1px solid var(--green-border)' };
                      prefix = '📥';
                    } else if (isCheckOut) {
                      badgeStyle = { background: 'var(--red-bg)', color: '#9a3026', border: '1px solid var(--red-border)' };
                      prefix = '📤';
                    }

                    return (
                      <div
                        key={b.id}
                        className="text-[10px] sm:text-xs px-1.5 py-0.5 rounded-md truncate flex items-center gap-1 font-medium"
                        style={badgeStyle}
                        title={`${b.customerName} (${b.checkInDate} -> ${b.checkOutDate})`}
                      >
                        <span className="shrink-0">{prefix}</span>
                        <span className="truncate font-semibold">{b.customerName}</span>
                      </div>
                    );
                  })}

                  {dayBookings.length > 2 && (
                    <div
                      className="text-[10px] font-bold text-center rounded py-0.5"
                      style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}
                    >
                      +{dayBookings.length - 2} รายการ
                    </div>
                  )}
                </div>

                <div
                  className="text-[10px] font-semibold text-right transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                >
                  + จอง
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Day Details Modal */}
      {selectedDayDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in modal-overlay">
          <div className="modal-panel max-w-lg w-full overflow-hidden animate-slide-up">
            
            {/* Header */}
            <div
              className="p-4 flex items-center justify-between"
              style={{ background: 'var(--bg-muted)', borderBottom: '1px solid var(--border-light)' }}
            >
              <div>
                <h3 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  🗓️ รายการจองประจำวันที่ {formatDateThai(selectedDayDate)}
                </h3>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>มีรายการจองเข้าพักทั้งหมด {selectedDayBookings.length} รายการ</p>
              </div>
              <button
                onClick={() => setSelectedDayDate(null)}
                className="p-1.5 rounded-xl transition-all"
                style={{ color: 'var(--text-muted)' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
              {selectedDayBookings.length === 0 ? (
                <div className="text-center py-8 rounded-2xl" style={{ background: 'var(--bg-muted)', border: '1px solid var(--border-light)' }}>
                  <div className="text-3xl mb-2">🌿</div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>ยังไม่มีรายการจองในวันนี้</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>สามารถกดปุ่มเพิ่มการจองด้านล่างเพื่อบันทึกลูกค้าได้เลย</p>
                </div>
              ) : (
                selectedDayBookings.map((b) => (
                  <div
                    key={b.id}
                    className="p-3.5 rounded-xl transition-all space-y-2"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-light)' }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-xs text-white"
                          style={{ background: 'var(--brand)' }}
                        >
                          <User className="w-4 h-4" />
                        </span>
                        <div>
                          <strong className="text-sm font-semibold block" style={{ color: 'var(--text-primary)' }}>{b.customerName}</strong>
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>☎️ {b.phoneNumber}</span>
                        </div>
                      </div>
                      <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>฿{b.price.toLocaleString()}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-2" style={{ borderTop: '1px solid var(--border-light)' }}>
                      <div className="font-semibold flex items-center gap-1" style={{ color: '#1d6a49' }}>
                        <LogIn className="w-3.5 h-3.5" /> In: {formatDateThai(b.checkInDate)} ({b.checkInTime})
                      </div>
                      <div className="font-semibold flex items-center gap-1" style={{ color: '#9a3026' }}>
                        <LogOut className="w-3.5 h-3.5" /> Out: {formatDateThai(b.checkOutDate)} ({b.checkOutTime})
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs font-medium flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                        <BedDouble className="w-3.5 h-3.5" style={{ color: 'var(--brand)' }} />
                        {b.bedType === 'big' ? 'เตียงใหญ่' : b.bedType === 'small' ? 'เตียงเล็ก' : 'เตียงใหญ่ + เตียงเล็ก'}
                      </span>

                      <button
                        onClick={() => {
                          setSelectedDayDate(null);
                          onEditBooking(b);
                        }}
                        className="text-xs font-semibold flex items-center gap-0.5 px-3 py-1 rounded-lg transition"
                        style={{ background: 'var(--brand-light)', color: 'var(--brand)', border: '1px solid var(--brand-border)' }}
                      >
                        แก้ไขข้อมูล <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer action button */}
            <div className="p-4 flex items-center justify-end gap-2" style={{ background: 'var(--bg-muted)', borderTop: '1px solid var(--border-light)' }}>
              <button
                onClick={() => {
                  const targetDate = selectedDayDate;
                  setSelectedDayDate(null);
                  onAddBookingForDate(targetDate);
                }}
                className="w-full flex items-center justify-center gap-2 btn-primary px-4 py-2.5 rounded-xl text-sm font-bold active:scale-95 transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                เพิ่มรายการจองใหม่ในวันที่ {formatDateThai(selectedDayDate)}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
