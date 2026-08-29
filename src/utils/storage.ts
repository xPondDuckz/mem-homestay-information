import type { BookingRecord } from '../types/booking';

const STORAGE_KEY = 'mem_homestay_bookings_v1';

export const INITIAL_SAMPLE_BOOKINGS: BookingRecord[] = [
  {
    id: 'MEM-2026-001',
    createdAt: '2026-08-27',
    customerName: 'คุณสมชาย ใจดี',
    phoneNumber: '081-234-5678',
    bedType: 'big',
    bookingChannel: 'booking_com',
    checkInDate: '2026-08-27',
    checkInTime: '14:00',
    checkOutDate: '2026-08-29',
    checkOutTime: '12:00',
    price: 1800,
    notes: 'ขอหมอนเพิ่ม 1 ใบ จ่ายเงินผ่าน Booking.com แล้ว',
    status: 'checked_in',
  },
  {
    id: 'MEM-2026-002',
    createdAt: '2026-08-27',
    customerName: 'คุณกัญญา วงศ์สุวรรณ',
    phoneNumber: '089-987-6543',
    bedType: 'small',
    bookingChannel: 'walk_in',
    checkInDate: '2026-08-27',
    checkInTime: '15:30',
    checkOutDate: '2026-08-28',
    checkOutTime: '11:30',
    price: 950,
    notes: 'Walk-in เข้ามารับห้องโดยตรง ชำระเงินสดหน้าร้าน',
    status: 'checked_in',
  },
  {
    id: 'MEM-2026-003',
    createdAt: '2026-08-26',
    customerName: 'Mr. David Smith',
    phoneNumber: '+66 92-333-4444',
    bedType: 'big',
    bookingChannel: 'booking_com',
    checkInDate: '2026-08-28',
    checkInTime: '14:00',
    checkOutDate: '2026-08-31',
    checkOutTime: '12:00',
    price: 3200,
    notes: 'ต้องการบริการเรียกรถแท็กซี่ตอนเช้าวันกลับ',
    status: 'confirmed',
  },
  {
    id: 'MEM-2026-004',
    createdAt: '2026-08-25',
    customerName: 'คุณอนันต์ ชัยเจริญ',
    phoneNumber: '065-111-2233',
    bedType: 'both',
    bookingChannel: 'walk_in',
    checkInDate: '2026-08-26',
    checkInTime: '13:00',
    checkOutDate: '2026-08-27',
    checkOutTime: '12:00',
    price: 2400,
    notes: 'ครอบครัว 4 ท่าน ขอเตียงใหญ่ + เตียงเล็กเสริม',
    status: 'checked_out',
  },
  {
    id: 'MEM-2026-005',
    createdAt: '2026-08-24',
    customerName: 'คุณณิชา รัตนอุบล',
    phoneNumber: '084-555-6677',
    bedType: 'small',
    bookingChannel: 'booking_com',
    checkInDate: '2026-08-30',
    checkInTime: '14:00',
    checkOutDate: '2026-09-01',
    checkOutTime: '12:00',
    price: 1900,
    notes: 'เช็คอินดึกประมาณ 20:00 น.',
    status: 'confirmed',
  },
];

export const loadBookingsFromStorage = (): BookingRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Load sample data on first visit
      saveBookingsToStorage(INITIAL_SAMPLE_BOOKINGS);
      return INITIAL_SAMPLE_BOOKINGS;
    }
    return JSON.parse(raw);
  } catch (error) {
    console.error('Error loading bookings from localStorage:', error);
    return INITIAL_SAMPLE_BOOKINGS;
  }
};

export const saveBookingsToStorage = (bookings: BookingRecord[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  } catch (error) {
    console.error('Error saving bookings to localStorage:', error);
  }
};

export const resetToSampleData = (): BookingRecord[] => {
  saveBookingsToStorage(INITIAL_SAMPLE_BOOKINGS);
  return INITIAL_SAMPLE_BOOKINGS;
};

const SHEETS_URL_KEY = 'mem_homestay_sheets_url';
const SHEETS_CLOUD_ONLY_KEY = 'mem_homestay_cloud_only';

export const getGoogleSheetsUrl = (): string => {
  return localStorage.getItem(SHEETS_URL_KEY) || '';
};

export const saveGoogleSheetsUrl = (url: string): void => {
  if (url.trim()) {
    localStorage.setItem(SHEETS_URL_KEY, url.trim());
  } else {
    localStorage.removeItem(SHEETS_URL_KEY);
  }
};

export const getIsCloudOnly = (): boolean => {
  return localStorage.getItem(SHEETS_CLOUD_ONLY_KEY) === 'true';
};

export const setIsCloudOnly = (enabled: boolean): void => {
  localStorage.setItem(SHEETS_CLOUD_ONLY_KEY, String(enabled));
};

export const clearLocalStorageBookings = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

export const generateBookingId = (): string => {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `MEM-${new Date().getFullYear()}-${randomNum}`;
};

