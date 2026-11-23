import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { BookingRecord } from '../types/booking';
import { X, Printer, ArrowRight } from 'lucide-react';
import { formatDateThai, cleanTimeStr } from '../utils/formatters';
import { DocHeader, DocSignature } from './DocParts';

interface BookingReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingRecord | null;
  t: any;
}

const BED: Record<string, string> = {
  big: 'เตียงใหญ่ (King / Queen)',
  small: 'เตียงเล็ก (Single)',
  both: 'เตียงใหญ่ + เตียงเล็ก',
};
const CHANNEL: Record<string, string> = { booking_com: 'Booking.com', walk_in: 'Walk-in' };
const STATUS: Record<string, string> = {
  confirmed: 'ยืนยันแล้ว · รอเช็คอิน',
  checked_in: 'เข้าพักอยู่',
  checked_out: 'เช็คเอาท์แล้ว',
  cancelled: 'ยกเลิก',
};

const nightsBetween = (a: string, b: string) => {
  const d = (new Date(b).getTime() - new Date(a).getTime()) / 86_400_000;
  return Number.isFinite(d) && d > 0 ? Math.round(d) : 0;
};

const Info: React.FC<{ label: string; en: string; children: React.ReactNode }> = ({ label, en, children }) => (
  <div>
    <span className="doc-label">{label}<em>{en}</em></span>
    <div className="mt-0.5">{children}</div>
  </div>
);

export const BookingReceiptModal: React.FC<BookingReceiptModalProps> = ({ isOpen, onClose, booking }) => {
  useEffect(() => {
    document.body.classList.toggle('print-receipt-mode', isOpen);
    return () => document.body.classList.remove('print-receipt-mode');
  }, [isOpen]);

  if (!isOpen || !booking) return null;

  const b = booking;
  const nights = nightsBetween(b.checkInDate, b.checkOutDate);
  const issued = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
  const money = (n: number) => n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const content = (
    <div className="receipt-print-portal" style={{ display: 'contents' }}>
      <div
        className="doc-overlay modal-overlay fixed inset-0 z-[9999] flex items-start sm:items-center justify-center sm:p-4 animate-fade-in overflow-y-auto"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="doc-shell w-full sm:max-w-[860px] min-h-[100dvh] sm:min-h-0 sm:max-h-[96vh] flex flex-col overflow-hidden sm:rounded-[20px] shadow-[var(--shadow-lg)] animate-scale-in">

          {/* Toolbar */}
          <div className="doc-toolbar no-print px-4 sm:px-6 py-4 shrink-0 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-base font-semibold truncate" style={{ color: 'var(--text-primary)' }}>ใบยืนยันการจอง</h2>
              <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{b.customerName} · พิมพ์ A4 1 หน้า</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button onClick={() => window.print()} className="btn-primary h-10 px-4 rounded-xl inline-flex items-center gap-2 text-sm">
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">พิมพ์ / PDF</span>
                <span className="sm:hidden">พิมพ์</span>
              </button>
              <button onClick={onClose} aria-label="ปิด" className="icon-btn"><X className="w-5 h-5" /></button>
            </div>
          </div>

          {/* Paper */}
          <div className="doc-scroll flex-1 overflow-y-auto p-3 sm:p-8">
            <div className="doc-paper mx-auto w-full max-w-[794px] px-5 py-7 sm:px-12 sm:py-11 animate-rise">

              <DocHeader
                title="ใบยืนยันการจอง"
                titleEn="Booking Confirmation"
                right={
                  <p className="text-xs mt-3 tabular-nums" style={{ color: '#57564f' }}>
                    เลขที่ {b.id}<br />ออกเมื่อ {issued}
                  </p>
                }
              />

              {/* Guest */}
              <section className="mt-7 grid grid-cols-1 sm:grid-cols-3 gap-5">
                <Info label="ผู้เข้าพัก" en="Guest"><p className="text-[15px] font-semibold">{b.customerName}</p></Info>
                <Info label="เบอร์โทร" en="Phone"><p className="tabular-nums">{b.phoneNumber}</p></Info>
                <Info label="สถานะ" en="Status">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: b.status === 'cancelled' ? 'var(--red)' : 'var(--brand)' }} />
                    {STATUS[b.status] ?? b.status}
                  </span>
                </Info>
              </section>

              {/* Stay */}
              <section className="mt-6 rounded-xl px-5 py-4 grid grid-cols-[1fr_auto_1fr] items-center gap-4" style={{ background: '#f7f6f3' }}>
                <div>
                  <span className="doc-label">เช็คอิน<em>Check-in</em></span>
                  <p className="text-[15px] font-semibold mt-0.5">{formatDateThai(b.checkInDate)}</p>
                  <p className="text-xs tabular-nums" style={{ color: '#57564f' }}>ตั้งแต่ {cleanTimeStr(b.checkInTime)} น.</p>
                </div>
                <div className="text-center">
                  <ArrowRight className="w-4 h-4 mx-auto" style={{ color: '#c6c3ba' }} />
                  {nights > 0 && <p className="text-xs mt-1" style={{ color: '#8f8d85' }}>{nights} คืน</p>}
                </div>
                <div className="text-right">
                  <span className="doc-label">เช็คเอาท์<em>Check-out</em></span>
                  <p className="text-[15px] font-semibold mt-0.5">{formatDateThai(b.checkOutDate)}</p>
                  <p className="text-xs tabular-nums" style={{ color: '#57564f' }}>ก่อน {cleanTimeStr(b.checkOutTime)} น.</p>
                </div>
              </section>

              <section className="mt-5 grid grid-cols-2 gap-5">
                <Info label="ห้องพัก" en="Room">{BED[b.bedType] ?? b.bedType}</Info>
                <Info label="ช่องทางการจอง" en="Channel">{CHANNEL[b.bookingChannel] ?? b.bookingChannel}</Info>
              </section>

              {/* Charges */}
              <section className="mt-8">
                <table className="doc-table w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="py-2 pr-3">รายการ</th>
                      <th className="py-2 pl-3 w-36 !text-right">จำนวนเงิน</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-3 pr-3">
                        <p>ค่าห้องพัก{nights > 0 ? ` ${nights} คืน` : ''}</p>
                        <p className="text-xs" style={{ color: '#8f8d85' }}>
                          {formatDateThai(b.checkInDate)} – {formatDateThai(b.checkOutDate)} · {BED[b.bedType] ?? b.bedType}
                        </p>
                      </td>
                      <td className="py-3 pl-3 text-right tabular-nums align-top">{money(b.price)}</td>
                    </tr>
                  </tbody>
                </table>
                <div className="flex items-baseline justify-end gap-8 pt-3">
                  <span className="font-medium">รวมทั้งสิ้น</span>
                  <span className="text-[22px] font-semibold tabular-nums">฿{money(b.price)}</span>
                </div>
              </section>

              {b.notes && (
                <section className="mt-6">
                  <span className="doc-label">หมายเหตุ<em>Notes</em></span>
                  <p className="mt-0.5 whitespace-pre-wrap">{b.notes}</p>
                </section>
              )}

              <section className="mt-8 text-xs space-y-1" style={{ color: '#57564f' }}>
                <p>• กรุณาแสดงเอกสารนี้หรือแจ้งชื่อผู้จองเมื่อเช็คอิน</p>
                <p>• สอบถามหรือเปลี่ยนแปลงการจอง โทร. 087-8939131</p>
              </section>

              <DocSignature name="เมม โฮมสเตย์" role="ผู้ออกเอกสาร" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};
