import { useCallback, useEffect, useState } from 'react';
import type { AppSettings, BookingRecord, Room } from '../types/booking';

const LOCAL_KEY = 'mem_homestay_settings';
const LEGACY_ICAL_KEY = 'mem_homestay_ical';

const defaultSettings = (): AppSettings => {
  let legacy: { big?: string; small?: string } = {};
  try { legacy = JSON.parse(localStorage.getItem(LEGACY_ICAL_KEY) || '{}'); } catch { /* ignore */ }
  return {
    rooms: [
      { id: 'big-1', name: 'ห้องเตียงใหญ่', bedType: 'big', icalUrl: legacy.big || '' },
      { id: 'small-1', name: 'ห้องเตียงเล็ก', bedType: 'small', icalUrl: legacy.small || '' },
    ],
  };
};

const isSettings = (v: any): v is AppSettings => v && typeof v === 'object' && !Array.isArray(v) && Array.isArray(v.rooms);

export const loadLocalSettings = (): AppSettings => {
  try {
    const v = JSON.parse(localStorage.getItem(LOCAL_KEY) || 'null');
    if (isSettings(v)) return v;
  } catch { /* ignore */ }
  return defaultSettings();
};

const saveLocal = (s: AppSettings) => localStorage.setItem(LOCAL_KEY, JSON.stringify(s));

/** GET ?settings=1 — returns null when the deployed script is older (it answers with the bookings array). */
async function fetchRemote(url: string): Promise<AppSettings | null | 'empty'> {
  const sep = url.includes('?') ? '&' : '?';
  const res = await fetch(`${url.trim()}${sep}settings=1`, { redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (Array.isArray(data)) return null;              // old script
  if (data && data.settings === null) return 'empty'; // new script, nothing saved yet
  return isSettings(data?.settings) ? data.settings : null;
}

async function pushRemote(url: string, settings: AppSettings) {
  await fetch(url.trim(), {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'save_settings', settings }),
    redirect: 'follow',
  });
}

/** Rooms etc. — cached locally, shared across devices through the "Settings" tab of the sheet. */
export function useSettings(sheetsUrl: string) {
  const [settings, setSettings] = useState<AppSettings>(() => loadLocalSettings());

  useEffect(() => {
    if (!sheetsUrl) return;
    let cancelled = false;
    fetchRemote(sheetsUrl)
      .then((remote) => {
        if (cancelled) return;
        if (remote === 'empty') void pushRemote(sheetsUrl, loadLocalSettings()); // first device seeds the sheet
        else if (remote) { setSettings(remote); saveLocal(remote); }
      })
      .catch((err) => console.warn('Settings load failed:', err));
    return () => { cancelled = true; };
  }, [sheetsUrl]);

  const save = useCallback((next: AppSettings) => {
    setSettings(next);
    saveLocal(next);
    if (sheetsUrl) pushRemote(sheetsUrl, next).catch((err) => console.warn('Settings save failed:', err));
  }, [sheetsUrl]);

  return { settings, save };
}

export const roomName = (b: Pick<BookingRecord, 'roomId'>, rooms: Room[]) =>
  rooms.find((r) => r.id === b.roomId)?.name;

export const newRoomId = () => 'room-' + Date.now().toString(36);
