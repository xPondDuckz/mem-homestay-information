import React, { useEffect, useState } from 'react';
import { X, Plus, Trash2, RefreshCw } from 'lucide-react';
import type { AppSettings, BedType, BookingRecord, Room } from '../types/booking';
import { newRoomId } from '../utils/settings';

interface RoomsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (s: AppSettings) => void;
  bookings: BookingRecord[];
  onImportIcal: () => Promise<string>;
  hasSheetsUrl: boolean;
}

const BED_LABEL: Record<BedType, string> = { big: 'เตียงใหญ่', small: 'เตียงเล็ก', both: 'ใหญ่ + เล็ก' };

export const RoomsModal: React.FC<RoomsModalProps> = ({ isOpen, onClose, settings, onSave, bookings, onImportIcal, hasSheetsUrl }) => {
  const [rooms, setRooms] = useState<Room[]>(settings.rooms);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { if (isOpen) { setRooms(settings.rooms); setMsg(''); } }, [isOpen, settings.rooms]);

  if (!isOpen) return null;

  const update = (id: string, patch: Partial<Room>) => setRooms((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const add = () => setRooms((rs) => [...rs, { id: newRoomId(), name: `ห้อง ${rs.length + 1}`, bedType: 'big', icalUrl: '' }]);
  const usedBy = (id: string) => bookings.filter((b) => b.roomId === id && b.status !== 'cancelled').length;
  const remove = (id: string) => setRooms((rs) => rs.filter((r) => r.id !== id));

  const clean = rooms.map((r) => ({ ...r, name: r.name.trim() || 'ไม่มีชื่อ', icalUrl: (r.icalUrl || '').trim() }));
  const dirty = JSON.stringify(clean) !== JSON.stringify(settings.rooms);

  const saveAndClose = () => { if (dirty) onSave({ ...settings, rooms: clean }); onClose(); };
  const importNow = async () => {
    if (dirty) onSave({ ...settings, rooms: clean });
    setBusy(true); setMsg('');
    try { setMsg(await onImportIcal()); } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center modal-overlay animate-fade-in" onClick={(e) => e.target === e.currentTarget && saveAndClose()}>
      <div className="modal-panel w-full sm:max-w-xl max-h-[92dvh] flex flex-col overflow-hidden rounded-b-none sm:rounded-[20px] animate-slide-up">
        <div className="px-5 py-4 flex items-center justify-between shrink-0" style={{ borderBottom: '1px solid var(--border-light)' }}>
          <div>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>ห้องพัก</h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>ใช้เช็คจองซ้อน แยกปฏิทิน และดึงการจองจาก Booking.com ทีละห้อง</p>
          </div>
          <button onClick={saveAndClose} aria-label="ปิด" className="icon-btn"><X className="w-5 h-5" /></button>
        </div>

        <div className="overflow-y-auto p-5 space-y-3">
          {rooms.map((r, i) => (
            <div key={r.id} className="card p-4 space-y-3 animate-rise stagger" style={{ '--i': i } as React.CSSProperties}>
              <div className="flex items-center gap-2">
                <input value={r.name} onChange={(e) => update(r.id, { name: e.target.value })} aria-label="ชื่อห้อง"
                  className="glass-input flex-1 h-10 px-3 font-medium" />
                <select value={r.bedType} onChange={(e) => update(r.id, { bedType: e.target.value as BedType })} aria-label="ประเภทเตียง"
                  className="glass-input h-10 px-3 cursor-pointer">
                  {(['big', 'small', 'both'] as BedType[]).map((b) => <option key={b} value={b}>{BED_LABEL[b]}</option>)}
                </select>
                <button
                  onClick={() => remove(r.id)}
                  disabled={rooms.length <= 1 || usedBy(r.id) > 0}
                  title={usedBy(r.id) > 0 ? `มีการจอง ${usedBy(r.id)} รายการใช้ห้องนี้อยู่` : 'ลบห้อง'}
                  className="action-btn action-btn-delete !w-10 !h-10 disabled:opacity-30"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <label className="block">
                <span className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>ลิงก์ iCal จาก Booking.com (ไม่บังคับ)</span>
                <input value={r.icalUrl || ''} onChange={(e) => update(r.id, { icalUrl: e.target.value })}
                  placeholder="https://ical.booking.com/v1/export?t=..." className="glass-input w-full h-10 px-3 text-sm" />
              </label>
            </div>
          ))}

          <button onClick={add} className="w-full h-11 rounded-xl text-sm inline-flex items-center justify-center gap-2 transition-colors hover:bg-[var(--brand-light)]"
            style={{ color: 'var(--brand)', border: '1px dashed var(--brand-border)' }}>
            <Plus className="w-4 h-4" /> เพิ่มห้อง
          </button>

          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            ลิงก์ iCal: Booking.com Extranet &gt; Rates &amp; Availability &gt; Sync calendars &gt; Export calendar (เลือกห้อง) แล้วคัดลอกลิงก์มาวาง
            ระบบจะดึงเมื่อเปิดแอปและทุก 30 นาที
          </p>
        </div>

        <div className="px-5 py-4 flex items-center justify-between gap-3 shrink-0" style={{ borderTop: '1px solid var(--border-light)', background: 'var(--bg-muted)' }}>
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={importNow} disabled={busy || !hasSheetsUrl || !clean.some((r) => r.icalUrl)}
              className="btn-ghost h-10 px-3.5 rounded-xl text-sm inline-flex items-center gap-2 disabled:opacity-50 shrink-0">
              <RefreshCw className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} /> ดึงจาก Booking.com
            </button>
            {msg && <p className="text-xs truncate animate-fade-in" style={{ color: 'var(--text-secondary)' }} title={msg}>{msg}</p>}
          </div>
          <button onClick={saveAndClose} className="btn-primary h-10 px-5 rounded-xl text-sm shrink-0">บันทึก</button>
        </div>
      </div>
    </div>
  );
};
