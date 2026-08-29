import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  Copy,
  Check,
  Link2,
  RefreshCw,
  Cloud,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react';
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden transition-all my-8">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-md">
              <FileSpreadsheet className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                {t.googleSheetsModalTitle}
                <span className="text-xs bg-emerald-400/20 border border-emerald-300/30 text-emerald-100 font-medium px-2.5 py-0.5 rounded-full">
                  Cloud Database
                </span>
              </h2>
              <p className="text-xs text-emerald-100 font-medium mt-0.5">{t.googleSheetsModalSub}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-emerald-100 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Step 1: Copy Code */}
          <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4.5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-extrabold flex items-center justify-center">
                  1
                </span>
                {t.googleSheetsStep1Title}
              </h3>
              <button
                onClick={handleCopyScript}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm transition-all active:scale-95"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />}
                {copied ? t.copiedScript : t.btnCopyScript}
              </button>
            </div>

            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              {t.googleSheetsStep1Desc}
            </p>

            {/* Steps checklist */}
            <div className="bg-white rounded-xl p-3 text-xs text-slate-600 space-y-1.5 border border-emerald-100">
              <p className="flex items-center gap-2">
                <span className="text-emerald-500 font-bold">1.</span> เปิด Google Sheet ใหม่ แล้วไปที่{' '}
                <strong className="text-slate-800">ส่วนขยาย (Extensions) &gt; Apps Script</strong>
              </p>
              <p className="flex items-center gap-2">
                <span className="text-emerald-500 font-bold">2.</span> วางโค้ดที่คัดลอก และกด{' '}
                <strong className="text-slate-800">ทำให้ใช้งานได้ (Deploy) &gt; New deployment</strong>
              </p>
              <p className="flex items-center gap-2">
                <span className="text-emerald-500 font-bold">3.</span> เลือกประเภท{' '}
                <strong className="text-emerald-600">เว็บแอป (Web App)</strong> และตั้งค่า Access:{' '}
                <strong className="text-amber-600">Everyone (ทุกคน)</strong>
              </p>
            </div>

            <button
              onClick={() => setShowScriptPreview(!showScriptPreview)}
              className="text-xs text-emerald-700 font-semibold underline flex items-center gap-1"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              {showScriptPreview ? 'ซ่อนโค้ด Apps Script' : 'ดูโค้ด Apps Script ทั้งหมด'}
            </button>

            {showScriptPreview && (
              <pre className="bg-slate-900 text-slate-200 text-[11px] p-3 rounded-xl overflow-x-auto max-h-48 font-mono border border-slate-700">
                {GOOGLE_APPS_SCRIPT_TEMPLATE}
              </pre>
            )}
          </div>

          {/* Step 2: URL Config */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 space-y-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-slate-700 text-white text-xs font-extrabold flex items-center justify-center">
                2
              </span>
              {t.googleSheetsStep2Title}
            </h3>
            <p className="text-xs text-slate-600 font-medium">{t.googleSheetsStep2Desc}</p>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-emerald-600" />
                Google Apps Script Web App URL:
              </label>
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder={t.sheetsUrlPlaceholder}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-sm placeholder:text-slate-400"
              />
            </div>

            {/* Test Result Message */}
            {testResult && (
              <div
                className={`p-3 rounded-xl text-xs font-medium flex items-start gap-2 border ${
                  testResult.success
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-rose-50 text-rose-800 border-rose-300'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                onClick={handleTestConnection}
                disabled={isTesting || !urlInput.trim()}
                className="flex-1 min-w-[160px] flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-sm transition-all active:scale-95"
              >
                <RefreshCw className={`w-4 h-4 ${isTesting ? 'animate-spin' : ''}`} />
                {isTesting ? t.btnTesting : t.btnTestConnection}
              </button>

              <button
                onClick={handleSyncCurrentDataToSheets}
                disabled={isSyncing || !urlInput.trim()}
                className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-sm transition-all active:scale-95 disabled:opacity-50"
              >
                <Cloud className={`w-4 h-4 text-emerald-400 ${isSyncing ? 'animate-bounce' : ''}`} />
                ซิงค์ข้อมูลลง Google Sheet ตอนนี้
              </button>
            </div>
          </div>

          {/* Cloud Only Mode Switch */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <h4 className="text-xs font-bold text-slate-900">
                  {t.cloudOnlyToggleLabel}
                </h4>
              </div>
              <p className="text-[11px] text-slate-600 font-medium">
                {t.cloudOnlyToggleDesc}
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={isCloudOnly}
                onChange={(e) => onToggleCloudOnly(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
            <Cloud className="w-4 h-4 text-emerald-500" />
            {sheetsUrl ? 'สถานะ: ตั้งค่า URL แล้ว' : 'สถานะ: ยังไม่ได้เชื่อมต่อ'}
          </span>

          <button
            onClick={onClose}
            className="bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold px-5 py-2.5 rounded-xl transition-all"
          >
            {t.btnCloseModal}
          </button>
        </div>
      </div>
    </div>

  );
};
