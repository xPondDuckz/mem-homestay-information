import type { BookingRecord } from '../types/booking';

const STORAGE_KEY = 'mem_homestay_bookings_v1';

export const INITIAL_SAMPLE_BOOKINGS: BookingRecord[] = [];

export const loadBookingsFromStorage = (): BookingRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Filter out any blank or corrupted items
      const valid = parsed.filter((b: any) => b && (b.customerName?.trim() || b.id?.trim()));
      return valid;
    }
    return [];
  } catch (error) {
    console.error('Error loading bookings from localStorage:', error);
    return [];
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
  saveBookingsToStorage([]);
  return [];
};

const SHEETS_URL_KEY = 'mem_homestay_sheets_url';
const SHEETS_CLOUD_ONLY_KEY = 'mem_homestay_cloud_only';

export const getGoogleSheetsUrl = (): string => {
  const savedUrl = localStorage.getItem(SHEETS_URL_KEY);
  if (savedUrl && savedUrl.trim()) {
    return savedUrl.trim();
  }
  const envUrl = (import.meta.env.VITE_GOOGLE_SHEETS_URL as string) || '';
  return envUrl.trim();
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

