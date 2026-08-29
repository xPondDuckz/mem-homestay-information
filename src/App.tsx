import React, { useState, useEffect, useMemo } from 'react';
import type { BookingRecord, BookingFilterOptions, BookingStats } from './types/booking';
import {
  loadBookingsFromStorage,
  saveBookingsToStorage,
  resetToSampleData,
  getGoogleSheetsUrl,
  saveGoogleSheetsUrl,
  getIsCloudOnly,
  setIsCloudOnly,
  clearLocalStorageBookings,
} from './utils/storage';
import { fetchFromGoogleSheets, syncToGoogleSheets } from './utils/googleSheets';
import { translations } from './utils/translations';
import type { Language } from './utils/translations';
import { Navbar } from './components/Navbar';
import { StatsOverview } from './components/StatsOverview';
import { BookingTable } from './components/BookingTable';
import { BookingFormModal } from './components/BookingFormModal';
import { ExportImportModal } from './components/ExportImportModal';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { BookingReceiptModal } from './components/BookingReceiptModal';
import { ConfirmModal } from './components/ConfirmModal';
import { CalendarView } from './components/CalendarView';
import { AnalyticsView } from './components/AnalyticsView';
import { PlusCircle, CheckCircle2, Table, Calendar as CalendarIcon, BarChart3 } from 'lucide-react';

export const App: React.FC = () => {
  const [bookings, setBookings] = useState<BookingRecord[]>(() => loadBookingsFromStorage());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<BookingRecord | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [receiptBooking, setReceiptBooking] = useState<BookingRecord | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // View state: 'table' | 'calendar' | 'analytics'
  const [currentView, setCurrentView] = useState<'table' | 'calendar' | 'analytics'>('table');

  // Month selection state (defaults to current month 'YYYY-MM')
  const [selectedMonth, setSelectedMonth] = useState<string>(() => new Date().toISOString().slice(0, 7));

  // Google Sheets state
  const [sheetsUrl, setSheetsUrl] = useState<string>(() => getGoogleSheetsUrl());
  const [isCloudOnlyState, setIsCloudOnlyState] = useState<boolean>(() => getIsCloudOnly());

  // Confirm Modal state
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    body: string;
    confirmLabel: string;
    cancelLabel: string;
    onConfirm: () => void;
    variant: 'danger' | 'warning';
  }>({ open: false, title: '', body: '', confirmLabel: '', cancelLabel: '', onConfirm: () => {}, variant: 'danger' });

  const [lang, setLang] = useState<Language>(() => (localStorage.getItem('mem_homestay_lang') as Language) || 'th');

  const [filterOptions, setFilterOptions] = useState<BookingFilterOptions>({
    searchQuery: '',
    channel: 'all',
    bedType: 'all',
    startDate: '',
    endDate: '',
    status: 'all',
    sortBy: 'date_desc',
  });

  const t = translations[lang];

  // Force light theme always — remove any saved dark theme
  useEffect(() => {
    document.documentElement.className = 'light';
    localStorage.removeItem('mem_homestay_theme');
  }, []);

  useEffect(() => {
    localStorage.setItem('mem_homestay_lang', lang);
  }, [lang]);

  // Initial load from Google Sheets if URL exists
  useEffect(() => {
    if (sheetsUrl) {
      fetchFromGoogleSheets(sheetsUrl)
        .then((remoteBookings) => {
          if (remoteBookings && remoteBookings.length >= 0) {
            setBookings(remoteBookings);
          }
        })
        .catch((err) => {
          console.warn('Failed to auto-fetch from Google Sheets:', err);
        });
    }
  }, [sheetsUrl]);

  // Auto-sync or save bookings when state changes
  useEffect(() => {
    if (isCloudOnlyState) {
      clearLocalStorageBookings();
    } else {
      saveBookingsToStorage(bookings);
    }

    if (sheetsUrl) {
      syncToGoogleSheets(sheetsUrl, bookings).catch((err) => {
        console.warn('Failed auto-syncing to Google Sheets:', err);
      });
    }
  }, [bookings, sheetsUrl, isCloudOnlyState]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const openConfirm = (opts: Omit<typeof confirmState, 'open'>) => {
    setConfirmState({ ...opts, open: true });
  };

  const closeConfirm = () => {
    setConfirmState((prev) => ({ ...prev, open: false }));
  };

  const handleSaveSheetsUrl = (url: string) => {
    setSheetsUrl(url);
    saveGoogleSheetsUrl(url);
  };

  const handleToggleCloudOnly = (enabled: boolean) => {
    setIsCloudOnlyState(enabled);
    setIsCloudOnly(enabled);
    if (enabled) {
      clearLocalStorageBookings();
      showToast('☁️ เปิดโหมดจัดเก็บใน Google Sheet เท่านั้น');
    } else {
      saveBookingsToStorage(bookings);
      showToast('💾 เปิดโหมดบันทึกคู่กับความจำในเครื่อง');
    }
  };

  // Extract available months from dataset
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    monthsSet.add(new Date().toISOString().slice(0, 7));
    bookings.forEach((b) => {
      if (b.checkInDate && b.checkInDate.length >= 7) {
        monthsSet.add(b.checkInDate.slice(0, 7));
      } else if (b.createdAt && b.createdAt.length >= 7) {
        monthsSet.add(b.createdAt.slice(0, 7));
      }
    });
    return Array.from(monthsSet).sort().reverse();
  }, [bookings]);

  // Bookings filtered by Selected Month
  const monthlyBookings = useMemo(() => {
    if (selectedMonth === 'all') return bookings;
    return bookings.filter((b) => {
      const matchIn = b.checkInDate && b.checkInDate.startsWith(selectedMonth);
      const matchCreated = b.createdAt && b.createdAt.startsWith(selectedMonth);
      return matchIn || matchCreated;
    });
  }, [bookings, selectedMonth]);

  // Filter & Sort for Table
  const filteredBookings = useMemo(() => {
    return monthlyBookings
      .filter((b) => {
        if (filterOptions.searchQuery.trim()) {
          const q = filterOptions.searchQuery.toLowerCase();
          if (!b.customerName.toLowerCase().includes(q) && !b.phoneNumber.includes(q) && !b.id.toLowerCase().includes(q)) return false;
        }
        if (filterOptions.channel !== 'all' && b.bookingChannel !== filterOptions.channel) return false;
        if (filterOptions.bedType !== 'all' && b.bedType !== filterOptions.bedType) return false;
        if (filterOptions.status !== 'all' && b.status !== filterOptions.status) return false;
        return true;
      })
      .sort((a, b) => {
        switch (filterOptions.sortBy) {
          case 'date_asc':   return a.createdAt.localeCompare(b.createdAt);
          case 'price_desc': return b.price - a.price;
          case 'price_asc':  return a.price - b.price;
          case 'name_asc':   return a.customerName.localeCompare(b.customerName, lang === 'th' ? 'th' : 'en');
          default:           return b.createdAt.localeCompare(a.createdAt);
        }
      });
  }, [monthlyBookings, filterOptions, lang]);

  // Monthly Stats calculation
  const stats: BookingStats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    let totalRevenue = 0, bookingComCount = 0, walkInCount = 0, bigBedCount = 0, smallBedCount = 0, todayCheckIns = 0, todayCheckOuts = 0;
    monthlyBookings.forEach((b) => {
      if (b.status !== 'cancelled') totalRevenue += b.price;
      if (b.bookingChannel === 'booking_com') bookingComCount++;
      if (b.bookingChannel === 'walk_in')     walkInCount++;
      if (b.bedType === 'big')   bigBedCount++;
      if (b.bedType === 'small') smallBedCount++;
      if (b.bedType === 'both') { bigBedCount++; smallBedCount++; }
      if (b.checkInDate === todayStr)  todayCheckIns++;
      if (b.checkOutDate === todayStr) todayCheckOuts++;
    });
    return { totalBookings: monthlyBookings.length, totalRevenue, bookingComCount, walkInCount, bigBedCount, smallBedCount, todayCheckIns, todayCheckOuts };
  }, [monthlyBookings]);

  // Handlers
  const handleSaveBooking = (bookingToSave: BookingRecord) => {
    setBookings((prev) => {
      const existsIndex = prev.findIndex((item) => item.id === bookingToSave.id);
      if (existsIndex >= 0) {
        const copy = [...prev];
        copy[existsIndex] = bookingToSave;
        showToast(t.toastUpdated.replace('{name}', bookingToSave.customerName));
        return copy;
      }
      showToast(t.toastAdded.replace('{name}', bookingToSave.customerName));
      return [bookingToSave, ...prev];
    });
    setEditingBooking(null);
  };

  const handleDeleteBooking = (id: string) => {
    const target = bookings.find((b) => b.id === id);
    openConfirm({
      title: t.confirmDeleteTitle,
      body: t.confirmDeleteBody.replace('{name}', target?.customerName || id),
      confirmLabel: t.confirmDeleteBtn,
      cancelLabel: t.confirmCancelBtn,
      variant: 'danger',
      onConfirm: () => {
        setBookings((prev) => prev.filter((b) => b.id !== id));
        showToast(t.toastDeleted);
        closeConfirm();
      },
    });
  };

  const handleResetData = () => {
    openConfirm({
      title: t.confirmResetTitle,
      body: t.confirmResetBody,
      confirmLabel: t.confirmResetBtn,
      cancelLabel: t.confirmCancelBtn,
      variant: 'warning',
      onConfirm: () => {
        const freshData = resetToSampleData();
        setBookings(freshData);
        showToast(t.toastReset);
        closeConfirm();
      },
    });
  };

  const handleResetFilters = () => {
    setFilterOptions({ searchQuery: '', channel: 'all', bedType: 'all', startDate: '', endDate: '', status: 'all', sortBy: 'date_desc' });
  };

  const openAddModal = () => {
    setEditingBooking(null);
    setIsAddModalOpen(true);
  };

  const handlePrintReceipt = (booking: BookingRecord) => {
    setReceiptBooking(booking);
    setIsReceiptModalOpen(true);
  };

  const handleAddBookingForDate = (dateStr: string) => {
    setEditingBooking({
      id: `MEM-${Date.now().toString().slice(-6)}`,
      createdAt: dateStr,
      customerName: '',
      phoneNumber: '',
      bedType: 'big',
      bookingChannel: 'booking_com',
      checkInDate: dateStr,
      checkInTime: '14:00',
      checkOutDate: dateStr,
      checkOutTime: '12:00',
      price: 1500,
      status: 'confirmed',
    });
    setIsAddModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-900 transition-colors duration-300">

      {/* ── Toast Notification ── */}
      {toastMessage && (
        <div className="fixed bottom-24 right-4 sm:bottom-6 sm:right-6 z-50 bg-slate-800 text-white font-semibold px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-fade-in text-sm max-w-xs">
          <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── Navbar (includes Today Summary Row & Google Sheets Btn) ── */}
      <Navbar
        onOpenAddModal={openAddModal}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
        hasSheetsUrl={Boolean(sheetsUrl)}
        totalBookingsCount={monthlyBookings.length}
        lang={lang}
        onLanguageChange={setLang}
        t={t}
        todayCheckIns={stats.todayCheckIns}
        todayCheckOuts={stats.todayCheckOuts}
        totalRevenue={stats.totalRevenue}
      />

      {/* ── Main Content ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-5 space-y-5">

        {/* Stats Cards */}
        <StatsOverview stats={stats} t={t} />

        {/* ── VIEW SWITCHER TABS ── */}
        <div className="flex items-center justify-between gap-3 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
          <div className="flex items-center gap-1 min-w-max">
            <button
              onClick={() => setCurrentView('table')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
                currentView === 'table'
                  ? 'bg-slate-900 text-amber-400 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Table className="w-4 h-4" />
              📋 รายการลูกค้า (Table View)
            </button>

            <button
              onClick={() => setCurrentView('calendar')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
                currentView === 'calendar'
                  ? 'bg-slate-900 text-amber-400 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              🗓️ ปฏิทินจอง (Calendar View)
            </button>

            <button
              onClick={() => setCurrentView('analytics')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
                currentView === 'analytics'
                  ? 'bg-slate-900 text-amber-400 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              📊 กราฟสรุปรายได้ (Analytics)
            </button>
          </div>

          {/* Desktop Add Button */}
          <button
            id="add-booking-desktop-btn"
            onClick={openAddModal}
            className="hidden sm:flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-4 py-2 rounded-xl text-xs shadow-sm active:scale-95 transition-all shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            {t.addBookingBtn}
          </button>
        </div>

        {/* ── CONDITIONAL VIEW RENDER ── */}
        {currentView === 'table' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                {t.filteredRecordsCount}
                <span className="text-xs text-amber-900 bg-amber-100 border border-amber-300 px-3 py-0.5 rounded-full font-extrabold shadow-sm">
                  {filteredBookings.length} {t.recordsUnit}
                </span>
              </h2>
            </div>

            <BookingTable
              bookings={filteredBookings}
              filterOptions={filterOptions}
              onFilterChange={(f) => setFilterOptions((prev) => ({ ...prev, ...f }))}
              onEdit={(b) => { setEditingBooking(b); setIsAddModalOpen(true); }}
              onDelete={handleDeleteBooking}
              onPrintReceipt={handlePrintReceipt}
              onResetFilters={handleResetFilters}
              selectedMonth={selectedMonth}
              onMonthChange={setSelectedMonth}
              availableMonths={availableMonths}
              lang={lang}
              t={t}
            />
          </div>
        )}

        {currentView === 'calendar' && (
          <CalendarView
            bookings={bookings}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            availableMonths={availableMonths}
            onEditBooking={(b) => { setEditingBooking(b); setIsAddModalOpen(true); }}
            onAddBookingForDate={handleAddBookingForDate}
            lang={lang}
            t={t}
          />
        )}

        {currentView === 'analytics' && (
          <AnalyticsView
            bookings={bookings}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            availableMonths={availableMonths}
            lang={lang}
            t={t}
          />
        )}

      </main>

      {/* ── Footer ── */}
      <footer className="mt-8 border-t border-slate-200 dark:border-slate-800 py-4 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
          <p>{t.footerCopyright}</p>
          <p>
            {isCloudOnlyState || sheetsUrl ? `☁️ ${t.footerStorageCloud}` : `💾 ${t.footerStorage}`}
          </p>
        </div>
      </footer>

      {/* ── FAB (Floating Add Button) — Mobile Only ── */}
      <button
        id="fab-add-btn"
        onClick={openAddModal}
        className="fab-btn md:hidden animate-fab-pop"
        title={t.fabTooltip}
        aria-label={t.fabTooltip}
      >
        <PlusCircle className="w-7 h-7 text-slate-950" />
      </button>

      {/* ── Modals ── */}
      <BookingFormModal
        isOpen={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); setEditingBooking(null); }}
        onSave={handleSaveBooking}
        onPrintReceipt={handlePrintReceipt}
        initialData={editingBooking}
        t={t}
      />

      <ExportImportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        bookings={bookings}
        onResetData={handleResetData}
        t={t}
      />

      <GoogleSheetsModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
        sheetsUrl={sheetsUrl}
        onSaveSheetsUrl={handleSaveSheetsUrl}
        isCloudOnly={isCloudOnlyState}
        onToggleCloudOnly={handleToggleCloudOnly}
        currentBookings={bookings}
        onBookingsLoaded={(b) => setBookings(b)}
        t={t}
        showToast={showToast}
      />

      <BookingReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => { setIsReceiptModalOpen(false); setReceiptBooking(null); }}
        booking={receiptBooking}
        t={t}
      />

      <ConfirmModal
        isOpen={confirmState.open}
        title={confirmState.title}
        body={confirmState.body}
        confirmLabel={confirmState.confirmLabel}
        cancelLabel={confirmState.cancelLabel}
        variant={confirmState.variant}
        onConfirm={confirmState.onConfirm}
        onCancel={closeConfirm}
      />

    </div>
  );
};

export default App;
