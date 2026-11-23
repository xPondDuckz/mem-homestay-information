import { localDate } from './utils/formatters';
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
import { useSheetsSync } from './hooks/useSheetsSync';
import { fetchIcalViaSheets } from './utils/googleSheets';
import { parseIcs, mergeIcal } from './utils/icalImport';
import { useSettings } from './utils/settings';
import { balanceDue } from './utils/bookingRules';
import { RoomsModal } from './components/RoomsModal';
import { TodayView, unpaidBookings } from './components/TodayView';
import { translations } from './utils/translations';
import type { Language } from './utils/translations';
import { Navbar, BottomNav } from './components/Navbar';
import type { ViewKey, ViewItem } from './components/Navbar';
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
import { CheckCircle2, List, Calendar as CalendarIcon, BarChart3, Sun } from 'lucide-react';

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
  const [currentView, setCurrentView] = useState<ViewKey>('today');

  // Month selection state (defaults to current month 'YYYY-MM')
  const [selectedMonth, setSelectedMonth] = useState<string>(() => localDate().slice(0, 7));

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

  const views: ViewItem[] = [
    { key: 'today', label: lang === 'th' ? 'วันนี้' : 'Today', icon: Sun },
    { key: 'table', label: lang === 'th' ? 'รายการ' : 'Bookings', icon: List },
    { key: 'calendar', label: lang === 'th' ? 'ปฏิทิน' : 'Calendar', icon: CalendarIcon },
    { key: 'analytics', label: lang === 'th' ? 'สรุปผล' : 'Insights', icon: BarChart3 },
  ];
  const changeView = (v: ViewKey) => {
    setCurrentView(v);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Force light theme always
  useEffect(() => {
    document.documentElement.className = 'light';
    document.documentElement.style.colorScheme = 'light';
  }, []);

  useEffect(() => {
    localStorage.setItem('mem_homestay_lang', lang);
  }, [lang]);

  // Google Sheets: load once, then save every change (debounced, retried).
  const sync = useSheetsSync(sheetsUrl, bookings, setBookings);

  // PWA install prompt (Chrome / Edge / Android).
  const [installEvt, setInstallEvt] = useState<any>(null);
  useEffect(() => {
    const onPrompt = (e: Event) => { e.preventDefault(); setInstallEvt(e); };
    const onInstalled = () => setInstallEvt(null);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => { window.removeEventListener('beforeinstallprompt', onPrompt); window.removeEventListener('appinstalled', onInstalled); };
  }, []);
  const handleInstall = async () => {
    if (!installEvt) return;
    installEvt.prompt();
    await installEvt.userChoice.catch(() => null);
    setInstallEvt(null);
  };

  // Rooms (shared across devices via the sheet's Settings tab).
  const { settings, save: saveSettings } = useSettings(sheetsUrl);
  const rooms = settings.rooms;
  const [isRoomsOpen, setIsRoomsOpen] = useState(false);

  // Booking.com iCal → bookings (through the Apps Script proxy), one feed per room.
  const bookingsRef = useRef(bookings);
  bookingsRef.current = bookings;
  const roomsRef = useRef(rooms);
  roomsRef.current = rooms;
  const runIcalImport = useCallback(async (): Promise<string> => {
    if (!sheetsUrl) return 'ต้องเชื่อม Google Sheet ก่อน';
    let current = bookingsRef.current, added = 0, updated = 0, cancelled = 0;
    const errors: string[] = [];
    for (const room of roomsRef.current) {
      if (!room.icalUrl) continue;
      try {
        const r = mergeIcal(current, room, parseIcs(await fetchIcalViaSheets(sheetsUrl, room.icalUrl)));
        current = r.bookings; added += r.added; updated += r.updated; cancelled += r.cancelled;
      } catch (err: any) {
        errors.push(`${room.name}: ${err?.message || err}`);
      }
    }
    if (current !== bookingsRef.current) setBookings(current);
    if (errors.length) return 'ดึงไม่สำเร็จ — ' + errors.join(' / ');
    return added || updated || cancelled
      ? `เพิ่ม ${added} · อัปเดต ${updated} · ยกเลิก ${cancelled} รายการ`
      : 'ข้อมูลตรงกับ Booking.com แล้ว';
  }, [sheetsUrl]);

  // Auto-import once the sheet has loaded, then every 30 minutes.
  const sheetLoaded = sync.status === 'saved' || sync.status === 'saving';
  const hasIcal = rooms.some((r) => r.icalUrl);
  useEffect(() => {
    if (!sheetLoaded || !hasIcal) return;
    const run = () => runIcalImport().then((msg) => { if (msg.startsWith('เพิ่ม')) showToast(`Booking.com: ${msg}`); });
    run();
    const id = window.setInterval(run, 30 * 60_000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheetLoaded, hasIcal, runIcalImport]);

  // Local copy (unless cloud-only mode).
  useEffect(() => {
    if (isCloudOnlyState) clearLocalStorageBookings();
    else saveBookingsToStorage(bookings);
  }, [bookings, isCloudOnlyState]);

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
      showToast('เปิดโหมดจัดเก็บใน Google Sheet เท่านั้น');
    } else {
      saveBookingsToStorage(bookings);
      showToast('เปิดโหมดบันทึกคู่กับความจำในเครื่อง');
    }
  };

  // Extract available months from dataset
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    monthsSet.add(localDate().slice(0, 7));
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
        if (filterOptions.roomId && b.roomId !== filterOptions.roomId) return false;
        if (filterOptions.unpaidOnly && !(b.status !== 'cancelled' && b.paymentStatus && b.paymentStatus !== 'paid' && balanceDue(b) > 0)) return false;
        if (filterOptions.startDate || filterOptions.endDate) {
          const d = filterOptions.dateField === 'checkOut' ? b.checkOutDate : b.checkInDate;
          if (filterOptions.startDate && d < filterOptions.startDate) return false;
          if (filterOptions.endDate && d > filterOptions.endDate) return false;
          if (b.status === 'cancelled') return false;
        }
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
    const todayStr = localDate();
    let totalRevenue = 0, bookingComCount = 0, walkInCount = 0, bigBedCount = 0, smallBedCount = 0, todayCheckIns = 0, todayCheckOuts = 0;
    monthlyBookings.forEach((b) => {
      if (b.status !== 'cancelled') totalRevenue += b.price;
      if (b.bookingChannel === 'booking_com') bookingComCount++;
      if (b.bookingChannel === 'walk_in')     walkInCount++;
      if (b.bedType === 'big')   bigBedCount++;
      if (b.bedType === 'small') smallBedCount++;
      if (b.bedType === 'both') { bigBedCount++; smallBedCount++; }
      if (b.status !== 'cancelled' && b.checkInDate === todayStr)  todayCheckIns++;
      if (b.status !== 'cancelled' && b.checkOutDate === todayStr) todayCheckOuts++;
    });
    return { totalBookings: monthlyBookings.length, totalRevenue, bookingComCount, walkInCount, bigBedCount, smallBedCount, todayCheckIns, todayCheckOuts };
  }, [monthlyBookings]);

  const unpaidCount = useMemo(() => unpaidBookings(bookings).length, [bookings]);

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
      checked_in: `เช็คอิน ${target.customerName} เรียบร้อยแล้ว`,
      checked_out: `เช็คเอาท์ ${target.customerName} เรียบร้อยแล้ว`,
      confirmed: `เปลี่ยนสถานะเป็นรอเช็คอิน (${target.customerName})`,
      cancelled: `ยกเลิกการจองของ ${target.customerName}`,
    };
    showToast(statusMapText[newStatus] || 'อัปเดตสถานะเรียบร้อย');
  };

  const handleTodayFilter = (type: 'check_in' | 'check_out') => {
    const todayStr = localDate();
    changeView('table');
    setSelectedMonth(todayStr.slice(0, 7));
    setFilterOptions((prev) => ({
      ...prev,
      startDate: todayStr,
      endDate: todayStr,
      dateField: type === 'check_in' ? 'checkIn' : 'checkOut',
      status: 'all',
      searchQuery: '',
    }));
    showToast(type === 'check_in' ? 'แสดงเฉพาะรายการที่เช็คอินวันนี้' : 'แสดงเฉพาะรายการที่เช็คเอาท์วันนี้');
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
    showToast('บันทึกข้อมูลใบกำกับภาษีเรียบร้อย');
  };

  const handleUpdateBooking = (updated: BookingRecord) =>
    setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));

  const handleAddBookingForDate = (dateStr: string, room = rooms.find((r) => r.id === filterOptions.roomId)) => {
    setEditingBooking({
      roomId: room?.id,
      id: `MEM-${Date.now().toString().slice(-6)}`,
      createdAt: dateStr,
      customerName: '',
      phoneNumber: '',
      bedType: room?.bedType ?? 'big',
      bookingChannel: 'booking_com',
      checkInDate: dateStr,
      checkInTime: '14:00',
      checkOutDate: localDate(new Date(new Date(dateStr + 'T00:00:00').getTime() + 86_400_000)),
      checkOutTime: '12:00',
      price: 1500,
      status: 'confirmed',
    });
    setIsAddModalOpen(true);
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}
    >

      {/* ── Toast ── */}
      {toastMessage && (
        <div
          key={toastMessage}
          role="status"
          className="toast fixed left-1/2 bottom-[calc(var(--bottom-nav-h)+env(safe-area-inset-bottom)+16px)] md:bottom-6 z-50 px-4 py-3 rounded-2xl flex items-center gap-2.5 text-sm max-w-[92vw]"
          style={{ background: 'var(--text-primary)', color: '#fff', boxShadow: 'var(--shadow-lg)' }}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: '#8fd1ad' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      <Navbar
        views={views}
        currentView={currentView}
        onViewChange={changeView}
        onOpenAddModal={openAddModal}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
        onOpenRooms={() => setIsRoomsOpen(true)}
        onInstall={installEvt ? handleInstall : undefined}
        hasSheetsUrl={Boolean(sheetsUrl)}
        syncStatus={sync.status}
        onRetrySync={sync.retry}
        lang={lang}
        onLanguageChange={setLang}
        t={t}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 lg:px-6 pt-4 sm:pt-6 space-y-6 sm:space-y-8 pb-bottom-nav">

        <StatsOverview
          stats={stats}
          t={t}
          lang={lang}
          onTodayCheckInClick={() => handleTodayFilter('check_in')}
          onTodayCheckOutClick={() => handleTodayFilter('check_out')}
        />

        <div key={currentView} className="animate-rise space-y-4">
        {/* Room filter (list & calendar) */}
        {rooms.length > 1 && currentView === 'table' && (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 lg:mx-0 lg:px-0">
            {[{ id: '', name: lang === 'th' ? 'ทุกห้อง' : 'All rooms' }, ...rooms].map((r) => (
              <button key={r.id || 'all'} className="chip shrink-0" aria-pressed={(filterOptions.roomId || '') === r.id}
                onClick={() => setFilterOptions((prev) => ({ ...prev, roomId: r.id || undefined }))}>
                {r.name}
              </button>
            ))}
          </div>
        )}

        {currentView === 'today' && (
          <TodayView
            bookings={bookings}
            rooms={rooms}
            lang={lang}
            t={t}
            onEdit={(b) => { setEditingBooking(b); setIsAddModalOpen(true); }}
            onQuickUpdateStatus={handleQuickUpdateStatus}
            onUpdate={handleUpdateBooking}
            onAddForRoom={(room) => handleAddBookingForDate(localDate(), room)}
          />
        )}

        {/* ── CONDITIONAL VIEW RENDER ── */}
        {currentView === 'table' && (
          <div className="space-y-4">
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
              rooms={rooms}
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
            rooms={rooms}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            availableMonths={availableMonths}
            onEditBooking={(b) => { setEditingBooking(b); setIsAddModalOpen(true); }}
            onAddBookingForDate={(d, room) => handleAddBookingForDate(d, room)}
            lang={lang}
            t={t}
          />
        )}

        {currentView === 'analytics' && (
          <AnalyticsView
            bookings={bookings}
            rooms={rooms}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            availableMonths={availableMonths}
            lang={lang}
            t={t}
          />
        )}

        </div>
      </main>

      <footer className="site-footer hidden md:block pb-6">
        <div className="max-w-6xl mx-auto px-4 lg:px-6 flex items-center justify-between gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
          <p>{t.footerCopyright}</p>
          <p>{isCloudOnlyState || sheetsUrl ? t.footerStorageCloud : t.footerStorage}</p>
        </div>
      </footer>

      {(sync.status === 'error' || sync.status === 'offline') && (
        <button
          onClick={sync.retry}
          className="md:hidden fixed left-3 right-3 z-40 bottom-[calc(var(--bottom-nav-h)+env(safe-area-inset-bottom)+10px)] h-11 px-4 rounded-xl text-sm flex items-center justify-center gap-2 animate-rise"
          style={{ background: 'var(--red-bg)', color: 'var(--red)', border: '1px solid var(--red-border)' }}
        >
          {sync.status === 'offline' ? 'ออฟไลน์ · จะบันทึกลง Sheet เมื่อกลับมาออนไลน์' : 'บันทึกลง Sheet ไม่สำเร็จ · แตะเพื่อลองใหม่'}
        </button>
      )}

      <BottomNav
        views={views}
        current={currentView}
        onChange={changeView}
        onAdd={openAddModal}
        addLabel={t.fabTooltip}
        badge={{ today: unpaidCount }}
      />

      <RoomsModal
        isOpen={isRoomsOpen}
        onClose={() => setIsRoomsOpen(false)}
        settings={settings}
        onSave={saveSettings}
        bookings={bookings}
        onImportIcal={runIcalImport}
        hasSheetsUrl={Boolean(sheetsUrl)}
      />

      {/* ── Modals ── */}
      <BookingFormModal
        isOpen={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); setEditingBooking(null); }}
        onSave={handleSaveBooking}
        onPrintReceipt={handlePrintReceipt}
        initialData={editingBooking}
        allBookings={bookings}
        rooms={rooms}
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
