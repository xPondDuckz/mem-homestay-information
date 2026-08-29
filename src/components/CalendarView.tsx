import React, { useState } from 'react';
import type { BookingRecord } from '../types/booking';
import { MonthSelector } from './MonthSelector';
import type { Language } from '../utils/translations';
import { LogIn, LogOut, BedDouble, User, PlusCircle, X, ChevronRight } from 'lucide-react';

interface CalendarViewProps {
  bookings: BookingRecord[];
  selectedMonth: string; // YYYY-MM
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

  // Parse YYYY-MM
  const [yearStr, monthStr] = (selectedMonth === 'all' ? new Date().toISOString().slice(0, 7) : selectedMonth).split('-');
  const year = parseInt(yearStr, 10) || new Date().getFullYear();
  const monthIdx = (parseInt(monthStr, 10) || (new Date().getMonth() + 1)) - 1; // 0-indexed

  // Days in month
  const firstDayOfWeek = new Date(year, monthIdx, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, monthIdx, 0).getDate();

  const todayStr = new Date().toISOString().slice(0, 10);

  // Day names TH / EN
  const dayNames = lang === 'th' 
    ? ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Map dates to bookings
  const getBookingsForDate = (dateStr: string) => {
    return bookings.filter((b) => {
      if (b.status === 'cancelled') return false;
      const isCheckIn = b.checkInDate === dateStr;
      const isCheckOut = b.checkOutDate === dateStr;
      const isStaying = b.checkInDate <= dateStr && dateStr <= b.checkOutDate;
      return isCheckIn || isCheckOut || isStaying;
    });
  };

  // Build grid cells
  const gridCells = [];
  
  // Previous month padding cells
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    const prevMonthIdx = monthIdx === 0 ? 11 : monthIdx - 1;
    const prevYear = monthIdx === 0 ? year - 1 : year;
    const dateStr = `${prevYear}-${String(prevMonthIdx + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    gridCells.push({ dayNum, isCurrentMonth: false, dateStr });
  }

  // Current month cells
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    gridCells.push({ dayNum: d, isCurrentMonth: true, dateStr });
  }

  // Next month padding cells to complete 35 or 42 grid items
  const totalCellsSoFar = gridCells.length;
  const targetTotal = totalCellsSoFar > 35 ? 42 : 35;
  const remainingCells = targetTotal - totalCellsSoFar;
  for (let n = 1; n <= remainingCells; n++) {
    const nextMonthIdx = monthIdx === 11 ? 0 : monthIdx + 1;
    const nextYear = monthIdx === 11 ? year + 1 : year;
    const dateStr = `${nextYear}-${String(nextMonthIdx + 1).padStart(2, '0')}-${String(n).padStart(2, '0')}`;
    gridCells.push({ dayNum: n, isCurrentMonth: false, dateStr });
  }

  // Selected Day Bookings for Modal
  const selectedDayBookings = selectedDayDate ? getBookingsForDate(selectedDayDate) : [];

  return (
    <div className="space-y-4 animate-fade-in">
      
      {/* Month Selector Bar */}
      <MonthSelector
        selectedMonth={selectedMonth}
        onMonthChange={onMonthChange}
        availableMonths={availableMonths}
        lang={lang}
        t={t}
      />

      {/* Calendar Card Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-4 sm:p-6">
        
        {/* Calendar Header Indicator */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              🗓️ ปฏิทินจองห้องพัก
              <span className="text-xs bg-amber-100 text-amber-900 border border-amber-300 font-extrabold px-3 py-0.5 rounded-full">
                {new Date(year, monthIdx).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US', { month: 'long', year: 'numeric' })}
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">กดที่วันที่เพื่อดูรายละเอียดหรือเพิ่มรายการจองใหม่ได้ทันที</p>
          </div>

          {/* Legend Badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> เช็คอิน (Check-in)
            </span>
            <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-950 px-2.5 py-1 rounded-lg border border-rose-300">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span> เช็คเอาท์ (Check-out)
            </span>
            <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-950 px-2.5 py-1 rounded-lg border border-blue-300">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span> พักอยู่ (Active)
            </span>
          </div>
        </div>

        {/* 7 Columns Day Names Header */}
        <div className="grid grid-cols-7 gap-1 text-center font-extrabold text-xs text-slate-500 uppercase tracking-wider mb-2">
          {dayNames.map((dayName, idx) => (
            <div
              key={dayName}
              className={`py-2 rounded-xl ${
                idx === 0 || idx === 6 ? 'bg-amber-50/80 text-amber-900 font-black' : 'bg-slate-50 text-slate-700'
              }`}
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
                className={`min-h-[90px] sm:min-h-[110px] p-1.5 sm:p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group ${
                  cell.isCurrentMonth
                    ? isToday
                      ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/30'
                      : 'bg-white border-slate-200 hover:border-amber-400 hover:shadow-md'
                    : 'bg-slate-50/60 border-slate-100 opacity-40 hover:opacity-80'
                }`}
              >
                {/* Date Number Header */}
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center justify-center text-xs font-black rounded-lg min-w-[24px] h-[24px] px-1 ${
                      isToday
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : cell.isCurrentMonth
                        ? 'text-slate-800'
                        : 'text-slate-400'
                    }`}
                  >
                    {cell.dayNum}
                  </span>
                  {dayBookings.length > 0 && (
                    <span className="text-[10px] bg-slate-900 text-amber-400 font-extrabold px-1.5 py-0.2 rounded-full">
                      {dayBookings.length}
                    </span>
                  )}
                </div>

                {/* Day Bookings Pills */}
                <div className="space-y-1 my-1 overflow-hidden">
                  {dayBookings.slice(0, 2).map((b) => {
                    const isCheckIn = b.checkInDate === cell.dateStr;
                    const isCheckOut = b.checkOutDate === cell.dateStr;

                    let bgClass = 'bg-blue-100 text-blue-900 border-blue-200';
                    let prefix = '🛌';
                    if (isCheckIn) {
                      bgClass = 'bg-emerald-100 text-emerald-950 border-emerald-300 font-black';
                      prefix = '📥';
                    } else if (isCheckOut) {
                      bgClass = 'bg-rose-100 text-rose-950 border-rose-300 font-black';
                      prefix = '📤';
                    }

                    return (
                      <div
                        key={b.id}
                        className={`text-[10px] sm:text-xs px-1.5 py-0.5 rounded-lg border truncate flex items-center gap-1 shadow-xs ${bgClass}`}
                        title={`${b.customerName} (${b.checkInDate} -> ${b.checkOutDate})`}
                      >
                        <span className="shrink-0">{prefix}</span>
                        <span className="truncate font-bold">{b.customerName}</span>
                      </div>
                    );
                  })}

                  {dayBookings.length > 2 && (
                    <div className="text-[10px] font-black text-amber-700 text-center bg-amber-50 rounded-md py-0.5">
                      +{dayBookings.length - 2} รายการ
                    </div>
                  )}
                </div>

                {/* Bottom Add hint */}
                <div className="text-[10px] text-slate-400 group-hover:text-amber-600 font-bold text-right transition-colors">
                  + จอง
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* ── Day Details Modal / Drawer ── */}
      {selectedDayDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            
            {/* Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  🗓️ รายการจองประจำวันที่ {selectedDayDate}
                </h3>
                <p className="text-xs text-slate-400">มีรายการจองเข้าพักทั้งหมด {selectedDayBookings.length} รายการ</p>
              </div>
              <button
                onClick={() => setSelectedDayDate(null)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
              {selectedDayBookings.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="text-3xl mb-2">🌿</div>
                  <p className="font-bold text-slate-700 text-sm">ยังไม่มีรายการจองในวันนี้</p>
                  <p className="text-xs text-slate-500 mt-0.5">สามารถกดปุ่มเพิ่มการจองเพื่อบันทึกลูกค้าคนใหม่ได้เลย</p>
                </div>
              ) : (
                selectedDayBookings.map((b) => (
                  <div
                    key={b.id}
                    className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/80 hover:bg-white hover:border-amber-400 transition-all shadow-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xs">
                          <User className="w-4 h-4" />
                        </span>
                        <div>
                          <strong className="text-slate-950 text-sm font-black block">{b.customerName}</strong>
                          <span className="text-xs text-slate-500 font-bold">☎️ {b.phoneNumber}</span>
                        </div>
                      </div>
                      <span className="text-sm font-black text-amber-600">฿{b.price.toLocaleString()}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200">
                      <div className="text-emerald-700 font-extrabold flex items-center gap-1">
                        <LogIn className="w-3.5 h-3.5" /> In: {b.checkInDate} ({b.checkInTime})
                      </div>
                      <div className="text-rose-700 font-extrabold flex items-center gap-1">
                        <LogOut className="w-3.5 h-3.5" /> Out: {b.checkOutDate} ({b.checkOutTime})
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                        <BedDouble className="w-3.5 h-3.5 text-amber-600" />
                        {b.bedType === 'big' ? 'เตียงใหญ่' : b.bedType === 'small' ? 'เตียงเล็ก' : 'เตียงใหญ่ + เตียงเล็ก'}
                      </span>

                      <button
                        onClick={() => {
                          setSelectedDayDate(null);
                          onEditBooking(b);
                        }}
                        className="text-xs font-extrabold text-amber-700 hover:text-amber-800 flex items-center gap-0.5 bg-amber-100 hover:bg-amber-200 px-3 py-1 rounded-lg transition"
                      >
                        แก้ไขข้อมูล <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer action button */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  const targetDate = selectedDayDate;
                  setSelectedDayDate(null);
                  onAddBookingForDate(targetDate);
                }}
                className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-4 py-2.5 rounded-xl text-sm shadow-md transition-all active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                เพิ่มรายการจองใหม่ในวันที่ {selectedDayDate}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
