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
import { OfficialTaxInvoiceModal } from './components/OfficialTaxInvoiceModal';
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
  const [taxInvoiceBooking, setTaxInvoiceBooking] = useState<BookingRecord | null>(null);
  const [isTaxInvoiceModalOpen, setIsTaxInvoiceModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // View state: 'table' | 'calendar' | 'analytics'
  const [currentView, setCurrentView] = useState<'table' | 'calendar' | 'analytics'>('table');

  // Month selection state (defaults to current month 'YYYY-MM')
  const [selectedMonth, setSelectedMonth] = useState<string>(() => new Date().toISOString().slice(0, 7));

  // Google Sheets state
  const [sheetsUrl, setSheetsUrl] = useState<string>(() => getGoogleSheetsUrl());
  const [isCloudOnlyState, setIsCloudOnlyState] = useState<boolean>(() => getIsCloudOnly());
  // ป้องกันการ sync ก่อนที่จะโหลดข้อมูลจาก Google Sheets เสร็จ
  const [isSheetsReady, setIsSheetsReady] = useState<boolean>(() => !getGoogleSheetsUrl());

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

  // Force light theme always
  useEffect(() => {
    document.documentElement.className = 'light';
    document.documentElement.style.colorScheme = 'light';
  }, []);

  useEffect(() => {
    localStorage.setItem('mem_homestay_lang', lang);
  }, [lang]);

  // Initial load from Google Sheets if URL exists
  useEffect(() => {
    if (sheetsUrl) {
      // isSheetsReady = false เพื่อหยุด auto-sync ระหว่างโหลด
      setIsSheetsReady(false);
      fetchFromGoogleSheets(sheetsUrl)
        .then((remoteBookings) => {
          // กรองแถวว่างออกก่อนอัปเดต state
          const valid = remoteBookings.filter(
            (b) => b && (String(b.customerName || '').trim() !== '' || String(b.id || '').trim() !== '')
          );
          setBookings(valid);
        })
        .catch((err) => {
          console.warn('Failed to auto-fetch from Google Sheets:', err);
        })
        .finally(() => {
          // อนุญาตให้ auto-sync ทำงานได้หลังจากโหลดเสร็จแล้ว
          setIsSheetsReady(true);
        });
    }
  }, [sheetsUrl]);

  // Auto-sync หรือบันทึก bookings เมื่อ state เปลี่ยน
  // จะทำงานก็ต่อเมื่อ isSheetsReady = true เท่านั้น (ป้องกัน race condition)
  useEffect(() => {
    if (!isSheetsReady) return;

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
  }, [bookings, sheetsUrl, isCloudOnlyState, isSheetsReady]);

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

  const handleQuickUpdateStatus = (id: string, newStatus: BookingRecord['status']) => {
    const target = bookings.find((b) => b.id === id);
    if (!target) return;
    const updated = { ...target, status: newStatus };
    setBookings((prev) => prev.map((b) => (b.id === id ? updated : b)));

    const statusMapText: Record<string, string> = {
      checked_in: `✅ เช็คอิน ${target.customerName} เรียบร้อยแล้ว`,
      checked_out: `🚪 เช็คเอาท์ ${target.customerName} เรียบร้อยแล้ว`,
      confirmed: `📋 เปลี่ยนสถานะเป็นรอเช็คอิน (${target.customerName})`,
      cancelled: `❌ ยกเลิกการจองของ ${target.customerName}`,
    };
    showToast(statusMapText[newStatus] || 'อัปเดตสถานะเรียบร้อย');
  };

  const handleTodayFilter = (type: 'check_in' | 'check_out') => {
    const todayStr = new Date().toISOString().slice(0, 10);
    setCurrentView('table');
    if (type === 'check_in') {
      setFilterOptions((prev) => ({
        ...prev,
        startDate: todayStr,
        endDate: todayStr,
        status: 'confirmed',
        searchQuery: '',
      }));
      showToast('🔍 แสดงเฉพาะรายการที่ต้อง Check-in วันนี้');
    } else {
      setFilterOptions((prev) => ({
        ...prev,
        startDate: todayStr,
        endDate: todayStr,
        status: 'checked_in',
        searchQuery: '',
      }));
      showToast('🔍 แสดงเฉพาะรายการที่ต้อง Check-out วันนี้');
    }
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

  const handlePrintTaxInvoice = (booking: BookingRecord) => {
    setTaxInvoiceBooking(booking);
    setIsTaxInvoiceModalOpen(true);
  };

  const handleSaveTaxDetails = (updatedBooking: BookingRecord) => {
    setBookings((prev) => {
      const idx = prev.findIndex((b) => b.id === updatedBooking.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updatedBooking;
        return copy;
      }
      return prev;
    });
    showToast('💾 บันทึกข้อมูลใบกำกับภาษีเรียบร้อย');
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
    <div
      className="min-h-screen flex flex-col transition-colors duration-300"
      style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}
    >

      {/* ── Toast Notification ── */}
      {toastMessage && (
        <div
          className="fixed bottom-24 right-4 sm:bottom-6 sm:right-6 z-50 font-semibold px-5 py-3.5 rounded-2xl flex items-center gap-2.5 animate-fade-in text-sm max-w-xs"
          style={{
            background: '#ffffff',
            border: '1px solid var(--border-light)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 1px 0 var(--border-light)',
            color: 'var(--text-primary)',
          }}
        >
          <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: 'var(--green)' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── Navbar ── */}
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
        onTodayCheckInClick={() => handleTodayFilter('check_in')}
        onTodayCheckOutClick={() => handleTodayFilter('check_out')}
      />

      {/* ── Main Content ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 space-y-6">

        {/* Stats Cards */}
        <StatsOverview stats={stats} t={t} />

        {/* ── VIEW SWITCHER TABS ── */}
        <div className="view-tab-bar flex items-center justify-between gap-3 overflow-x-auto">
          <div className="flex items-center gap-1.5 min-w-max">
            <button
              onClick={() => setCurrentView('table')}
              className={`view-tab ${currentView === 'table' ? 'active' : ''}`}
            >
              <Table className="w-4 h-4" />
              📋 รายการลูกค้า
            </button>

            <button
              onClick={() => setCurrentView('calendar')}
              className={`view-tab ${currentView === 'calendar' ? 'active' : ''}`}
            >
              <CalendarIcon className="w-4 h-4" />
              🗓️ ปฏิทินจอง
            </button>

            <button
              onClick={() => setCurrentView('analytics')}
              className={`view-tab ${currentView === 'analytics' ? 'active' : ''}`}
            >
              <BarChart3 className="w-4 h-4" />
              📊 Analytics
            </button>
          </div>

          {/* Desktop Add Button */}
          <button
            id="add-booking-desktop-btn"
            onClick={openAddModal}
            className="hidden sm:flex items-center gap-2 btn-primary px-5 py-2.5 rounded-xl text-sm font-black active:scale-95 transition-all shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            {t.addBookingBtn}
          </button>
        </div>

        {/* ── CONDITIONAL VIEW RENDER ── */}
        {currentView === 'table' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                {t.filteredRecordsCount}
                <span
                  className="text-xs px-2.5 py-0.5 rounded-full font-bold"
                  style={{
                    background: 'var(--brand-light)',
                    border: '1px solid #c5d0fa',
                    color: 'var(--brand)',
                  }}
                >
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
              onQuickUpdateStatus={handleQuickUpdateStatus}
              onPrintReceipt={handlePrintReceipt}
              onPrintTaxInvoice={handlePrintTaxInvoice}
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
      <footer className="site-footer mt-8 py-4">
        <div
          className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-medium"
          style={{ color: 'var(--text-muted)' }}
        >
          <p>{t.footerCopyright}</p>
          <p>
            {isCloudOnlyState || sheetsUrl
              ? `☁️ ${t.footerStorageCloud}`
              : `💾 ${t.footerStorage}`
            }
          </p>
        </div>
      </footer>

      {/* ── FAB — Mobile Only ── */}
      <button
        id="fab-add-btn"
        onClick={openAddModal}
        className="fab-btn md:hidden animate-fab-pop"
        title={t.fabTooltip}
        aria-label={t.fabTooltip}
      >
        <PlusCircle className="w-7 h-7" style={{ color: '#0f1117' }} />
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

      <OfficialTaxInvoiceModal
        isOpen={isTaxInvoiceModalOpen}
        onClose={() => { setIsTaxInvoiceModalOpen(false); setTaxInvoiceBooking(null); }}
        booking={taxInvoiceBooking}
        onSaveTaxDetails={handleSaveTaxDetails}
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
