import { useCallback, useEffect, useRef, useState } from 'react';
import type { BookingRecord } from '../types/booking';
import { fetchFromGoogleSheets, syncToGoogleSheets } from '../utils/googleSheets';

export type SyncStatus = 'off' | 'loading' | 'saving' | 'saved' | 'error' | 'offline';

const DEBOUNCE_MS = 800;

/**
 * Keeps bookings saved to Google Sheets.
 * - Loads from the sheet first; never pushes until a load has succeeded (so a failed load can't wipe the sheet).
 * - Debounces edits, sends one request at a time, always sends the latest list.
 * - Retries with backoff on failure and when the browser comes back online.
 */
export function useSheetsSync(
  url: string,
  bookings: BookingRecord[],
  setBookings: (b: BookingRecord[]) => void,
) {
  const [status, setStatus] = useState<SyncStatus>(url ? 'loading' : 'off');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const latest = useRef(bookings);
  latest.current = bookings;
  const ready = useRef(false);       // a load from the sheet has succeeded
  const skipNext = useRef(false);    // ignore the state change caused by our own load
  const dirty = useRef(false);       // local changes not yet in the sheet
  const inFlight = useRef(false);
  const timer = useRef<number | undefined>(undefined);
  const attempt = useRef(0);
  const urlRef = useRef(url);
  urlRef.current = url;

  const flush = useCallback(async (): Promise<void> => {
    const u = urlRef.current;
    if (!u || !ready.current || inFlight.current || !dirty.current) return;
    if (!navigator.onLine) { setStatus('offline'); return; }

    inFlight.current = true;
    dirty.current = false;
    setStatus('saving');
    try {
      const ok = await syncToGoogleSheets(u, latest.current);
      if (!ok) throw new Error('Sheet rejected the update');
      attempt.current = 0;
      setLastSavedAt(new Date());
      setStatus(dirty.current ? 'saving' : 'saved');
    } catch (err) {
      console.warn('Google Sheets save failed:', err);
      dirty.current = true;
      setStatus(navigator.onLine ? 'error' : 'offline');
      attempt.current += 1;
      const wait = Math.min(30_000, 2_000 * 2 ** (attempt.current - 1));
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => void flush(), wait);
      return;
    } finally {
      inFlight.current = false;
    }
    if (dirty.current) void flush();   // changes arrived while saving
  }, []);

  const schedule = useCallback((delay = DEBOUNCE_MS) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => void flush(), delay);
  }, [flush]);

  const load = useCallback(async () => {
    const u = urlRef.current;
    if (!u) return;
    setStatus('loading');
    try {
      const remote = (await fetchFromGoogleSheets(u)).filter(
        (b) => b && (String(b.customerName || '').trim() !== '' || String(b.id || '').trim() !== ''),
      );
      if (dirty.current) {
        // Edits were made while the sheet was unreachable: keep both, local wins on the same id.
        const merged = new Map(remote.map((b) => [b.id, b]));
        latest.current.forEach((b) => merged.set(b.id, b));
        setBookings(Array.from(merged.values()));
        ready.current = true;
        schedule(0);
      } else {
        skipNext.current = true;
        setBookings(remote);
        ready.current = true;
        setStatus('saved');
      }
    } catch (err) {
      console.warn('Google Sheets load failed:', err);
      ready.current = false;
      setStatus(navigator.onLine ? 'error' : 'offline');
    }
  }, [setBookings, schedule]);

  // (Re)load whenever the URL changes.
  useEffect(() => {
    ready.current = false;
    if (!url) { setStatus('off'); return; }
    void load();
  }, [url, load]);

  // Every real change to bookings → save.
  const prevBookings = useRef(bookings);
  useEffect(() => {
    if (prevBookings.current === bookings) return;
    prevBookings.current = bookings;
    if (!url) return;
    if (skipNext.current) { skipNext.current = false; return; }
    dirty.current = true;
    if (ready.current) schedule();
  }, [bookings, url, schedule]);

  // Come back online → retry.
  useEffect(() => {
    const onOnline = () => (ready.current ? schedule(0) : void load());
    const onOffline = () => setStatus('offline');
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); };
  }, [schedule, load]);

  // Warn before closing the tab with unsaved changes.
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (urlRef.current && (dirty.current || inFlight.current)) e.preventDefault();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  /** Manual retry: reload if the first load failed, otherwise push now. */
  const retry = useCallback(() => {
    attempt.current = 0;
    if (!ready.current) void load();
    else { dirty.current = true; schedule(0); }
  }, [load, schedule]);

  return { status, lastSavedAt, retry };
}
