import React, { useState } from 'react';
import { X, Copy, Check, RefreshCw, Upload, CheckCircle2, AlertCircle, ChevronDown } from 'lucide-react';
import {
  GOOGLE_APPS_SCRIPT_TEMPLATE,
  testGoogleSheetsConnection,
  syncToGoogleSheets,
  fetchFromGoogleSheets,
} from '../utils/googleSheets';
import type { BookingRecord } from '../types/booking';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sheetsUrl: string;
  onSaveSheetsUrl: (url: string) => void;
  isCloudOnly: boolean;
  onToggleCloudOnly: (enabled: boolean) => void;
  currentBookings: BookingRecord[];
  onBookingsLoaded: (bookings: BookingRecord[]) => void;
  t: any;
  showToast: (msg: string) => void;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  sheetsUrl,
  onSaveSheetsUrl,
  isCloudOnly,
  onToggleCloudOnly,
  currentBookings,
  onBookingsLoaded,
  t,
  showToast,
}) => {

  const [urlInput, setUrlInput] = useState(sheetsUrl);
  const [copied, setCopied] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showScriptPreview, setShowScriptPreview] = useState(false);
  if (!isOpen) return null;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    const result = await testGoogleSheetsConnection(urlInput);
    setIsTesting(false);
    setTestResult(result);

    if (result.success) {
      onSaveSheetsUrl(urlInput);
      showToast(t.googleSheetsConnected);

      try {
        const remoteData = await fetchFromGoogleSheets(urlInput);
        if (remoteData && remoteData.length > 0) {
          onBookingsLoaded(remoteData);
        }
      } catch (e) {
        console.warn('Could not auto load bookings on test:', e);
      }
    }
  };


  const handleSyncCurrentDataToSheets = async () => {
    if (!urlInput.trim()) {
      setTestResult({ success: false, message: 'กรุณากรอก Web App URL ก่อนกดซิงค์ข้อมูล' });
      return;
    }

    setIsSyncing(true);
    try {
      const ok = await syncToGoogleSheets(urlInput, currentBookings);
      setIsSyncing(false);
      if (ok) {
        onSaveSheetsUrl(urlInput);
        setTestResult({
          success: true,
          message: `ส่งข้อมูลทั้งหมด ${currentBookings.length} รายการไปยัง Google Sheet เรียบร้อยแล้ว!`,
        });
        showToast(t.toastSyncedSheets);
      } else {
        setTestResult({ success: false, message: 'ไม่สามารถส่งข้อมูลไปยัง Google Sheet ได้' });
      }
    } catch (err: any) {
      setIsSyncing(false);
      setTestResult({ success: false, message: err?.message || 'เกิดข้อผิดพลาดในการซิงค์' });
    }
  };

  const step = (n: number, title: string, body: React.ReactNode) => (
    <li className="flex gap-3">
      <span className="w-6 h-6 rounded-full text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'var(--brand-light)', color: 'var(--brand)' }}>{n}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{title}</p>
        <div className="text-[13px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>{body}</div>
      </div>
    </li>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center modal-overlay animate-fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel w-full sm:max-w-xl max-h-[92dvh] flex flex-col overflow-hidden rounded-b-none sm:rounded-[20px] animate-slide-up">
        <div className="px-5 py-4 flex items-center justify-between shrink-0" style={{ borderBottom: '1px solid var(--border-light)' }}>
          <div>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Google Sheet</h2>
            <p className="text-xs flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: sheetsUrl ? 'var(--green)' : 'var(--border-strong)' }} />
              {sheetsUrl ? 'เชื่อมต่อแล้ว · บันทึกอัตโนมัติทุกครั้งที่แก้ไข' : 'ยังไม่ได้เชื่อมต่อ'}
            </p>
          </div>
          <button onClick={onClose} aria-label="ปิด" className="icon-btn"><X className="w-5 h-5" /></button>
        </div>

        <div className="overflow-y-auto p-5 space-y-6">
          {/* Connection */}
          <section className="space-y-3 animate-rise">
            <label htmlFor="sheets-url" className="block text-[13px]" style={{ color: 'var(--text-muted)' }}>Web App URL</label>
            <input
              id="sheets-url"
              value={urlInput}
              onChange={(e) => { setUrlInput(e.target.value); setTestResult(null); }}
              placeholder={t.sheetsUrlPlaceholder || 'https://script.google.com/macros/s/.../exec'}
              className="glass-input w-full h-11 px-3.5 text-sm"
            />
            <div className="flex flex-wrap gap-2">
              <button onClick={handleTestConnection} disabled={isTesting || !urlInput.trim()}
                className="btn-primary h-10 px-4 rounded-xl text-sm inline-flex items-center gap-2 disabled:opacity-50">
                <RefreshCw className={`w-4 h-4 ${isTesting ? 'animate-spin' : ''}`} /> ทดสอบและเชื่อมต่อ
              </button>
              <button onClick={handleSyncCurrentDataToSheets} disabled={isSyncing || !urlInput.trim()}
                className="btn-ghost h-10 px-4 rounded-xl text-sm inline-flex items-center gap-2 disabled:opacity-50">
                <Upload className={`w-4 h-4 ${isSyncing ? 'animate-pulse' : ''}`} /> ส่งข้อมูลทั้งหมดตอนนี้
              </button>
            </div>
            {testResult && (
              <p className="text-[13px] flex items-start gap-2 rounded-xl px-3.5 py-2.5 animate-rise"
                style={{ background: testResult.success ? 'var(--green-bg)' : 'var(--red-bg)', color: testResult.success ? '#1d6a49' : '#9a3026' }}>
                {testResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                {testResult.message}
              </p>
            )}
          </section>

          {/* Setup guide */}
          <section className="space-y-4 animate-rise stagger" style={{ '--i': 1 } as React.CSSProperties}>
            <h3 className="text-xs font-semibold tracking-wide" style={{ color: 'var(--text-muted)' }}>ตั้งค่า / อัปเดตสคริปต์</h3>
            <ol className="space-y-4">
              {step(1, 'คัดลอกสคริปต์', (
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <button onClick={handleCopyScript} className="btn-soft" style={{ background: copied ? 'var(--green-bg)' : 'var(--bg-muted)', color: copied ? '#1d6a49' : 'var(--text-primary)' }}>
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}{copied ? 'คัดลอกแล้ว' : 'คัดลอกโค้ด'}
                    </button>
                    <button onClick={() => setShowScriptPreview(!showScriptPreview)} className="btn-soft" style={{ background: 'transparent', color: 'var(--text-secondary)' }}>
                      ดูโค้ด <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showScriptPreview ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                  <div className={`reveal ${showScriptPreview ? 'open' : ''}`}>
                    <div>
                      <pre className="text-[11px] leading-relaxed p-3 rounded-xl overflow-auto max-h-56" style={{ background: '#1b1b19', color: '#e8e6df' }}>{GOOGLE_APPS_SCRIPT_TEMPLATE}</pre>
                    </div>
                  </div>
                </div>
              ))}
              {step(2, 'วางใน Apps Script', <>เปิด Google Sheet → ส่วนขยาย (Extensions) &gt; Apps Script → ลบโค้ดเดิม แล้ววาง → บันทึก</>)}
              {step(3, 'Deploy', <>
                <p>ครั้งแรก: ทำให้ใช้งานได้ (Deploy) &gt; New deployment &gt; เว็บแอป · ผู้มีสิทธิ์เข้าถึง: Anyone → คัดลอก URL มาวางด้านบน</p>
                <p className="mt-1">อัปเดต: Deploy &gt; Manage deployments &gt; แก้ไข &gt; Version: New version &gt; Deploy (URL เดิม)</p>
              </>)}
              {step(4, 'จำ URL ถาวรบน Vercel (ไม่บังคับ)', <>Project Settings &gt; Environment Variables → <code className="px-1 rounded" style={{ background: 'var(--bg-muted)' }}>VITE_GOOGLE_SHEETS_URL</code> แล้ว Redeploy</>)}
            </ol>
          </section>

          {/* Cloud only */}
          <section className="animate-rise stagger" style={{ '--i': 2 } as React.CSSProperties}>
            <label className="flex items-center justify-between gap-4 cursor-pointer rounded-2xl p-4" style={{ border: '1px solid var(--border-light)' }}>
              <span>
                <span className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{t.cloudOnlyToggleLabel}</span>
                <span className="block text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{t.cloudOnlyToggleDesc}</span>
              </span>
              <span className="relative inline-flex shrink-0">
                <input type="checkbox" checked={isCloudOnly} onChange={(e) => onToggleCloudOnly(e.target.checked)} className="sr-only peer" />
                <span className="w-11 h-6 rounded-full transition-colors bg-[var(--border-default)] peer-checked:bg-[var(--brand)]" />
                <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 peer-checked:translate-x-5" />
              </span>
            </label>
          </section>
        </div>
      </div>
    </div>
  );
};
