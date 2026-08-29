import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { BookingRecord } from '../types/booking';
import { X, Printer, Home, Calendar, User, Phone, BedDouble, CreditCard, Clock, FileText, CheckCircle2 } from 'lucide-react';

interface BookingReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingRecord | null;
  t: any;
}

export const BookingReceiptModal: React.FC<BookingReceiptModalProps> = ({
  isOpen,
  onClose,
  booking,
  // t is reserved for future translations
}) => {
  // Add/remove print-receipt-mode class on body
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('print-receipt-mode');
    } else {
      document.body.classList.remove('print-receipt-mode');
    }
    return () => {
      document.body.classList.remove('print-receipt-mode');
    };
  }, [isOpen]);

  if (!isOpen || !booking) return null;

  const handlePrint = () => {
    window.print();
  };

  const getBedLabel = (bed: string) => {
    switch (bed) {
      case 'big':   return 'เตียงใหญ่ (King / Queen Size)';
      case 'small': return 'เตียงเล็ก (Single Bed)';
      case 'both':  return 'เตียงใหญ่ + เตียงเล็ก (King + Single)';
      default:      return bed;
    }
  };

  const getChannelLabel = (ch: string) => {
    switch (ch) {
      case 'booking_com': return 'Booking.com (ออนไลน์)';
      case 'walk_in':     return 'Walk-in (หน้าร้าน)';
      default:            return ch;
    }
  };

  const getStatusLabel = (st: string) => {
    switch (st) {
      case 'confirmed':   return 'รอเช็คอิน (Confirmed)';
      case 'checked_in':  return 'เข้าพักอยู่ (Checked-In)';
      case 'checked_out': return 'เช็คเอาท์แล้ว (Checked-Out)';
      case 'cancelled':   return 'ยกเลิกการจอง (Cancelled)';
      default:            return st;
    }
  };

  const formattedIssueDate = new Date().toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Receipt content rendered as a Portal (direct child of <body>)
  const receiptContent = (
    <>
      {/* ── Global Print Styles ── */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0 !important;
          }
          html, body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Hide the app root, show only receipt portal */
          body.print-receipt-mode #root {
            display: none !important;
          }
          body.print-receipt-mode .receipt-print-portal {
            display: block !important;
          }
          /* Receipt overlay: become flat white background */
          .receipt-modal-overlay {
            position: static !important;
            background: transparent !important;
            backdrop-filter: none !important;
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          /* Receipt card: flat, no shadow, margin 0 */
          .receipt-modal-card {
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            max-height: none !important;
            overflow: visible !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .receipt-scroll-body {
            overflow: visible !important;
            max-height: none !important;
            padding: 12mm 15mm !important;
          }
        }
      `}</style>

      {/* Portal root: direct child of body, display:none by default, shown on print */}
      <div
        className="receipt-print-portal"
        style={{ display: 'contents' }}
      >
        {/* Screen Modal Overlay */}
        <div
          className="receipt-modal-overlay fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in overflow-y-auto"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          {/* Card */}
          <div className="receipt-modal-card bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[94vh] flex flex-col overflow-hidden my-4">

            {/* ── Action Bar (hidden on print) ── */}
            <div className="no-print px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500 text-slate-950">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-white leading-tight">ใบยืนยันการจอง / ใบเสร็จรับเงิน</h2>
                  <p className="text-[11px] text-slate-400 font-medium">พิมพ์ขนาด A4 หน้าเดียว • {booking.customerName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-4 py-2 rounded-xl text-xs shadow-md transition-all active:scale-95 min-h-[38px]"
                >
                  <Printer className="w-3.5 h-3.5" />
                  พิมพ์ / บันทึก PDF
                </button>
                <button
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition min-h-[38px] min-w-[38px] flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* ── Printable Content ── */}
            <div className="receipt-scroll-body p-7 overflow-y-auto flex-1 bg-white text-slate-900 space-y-4">

              {/* Header */}
              <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-amber-500 flex items-center justify-center text-slate-950 shadow-sm shrink-0">
                    <Home className="w-6 h-6" />
                  </div>
                  <div>
                    <h1 className="text-xl font-black tracking-tight text-slate-900 leading-none">
                      เมม โฮมสเตย์&nbsp;
                      <span className="text-amber-600 font-bold text-lg">MEM HOMESTAY</span>
                    </h1>
                    <p className="text-[11px] text-slate-500 font-bold mt-0.5">
                      ใบยืนยันการจองห้องพัก &amp; ใบเสร็จรับเงิน (BOOKING CONFIRMATION &amp; RECEIPT)
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="inline-block bg-slate-900 text-amber-400 font-mono font-black text-xs px-3 py-1.5 rounded-lg">
                    {booking.id}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-1.5 font-bold">
                    วันที่ออกเอกสาร: {formattedIssueDate}
                  </p>
                </div>
              </div>

              {/* Guest Info */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <h3 className="text-[11px] font-black uppercase tracking-wider text-amber-700 flex items-center gap-1.5 mb-2.5">
                  <User className="w-3.5 h-3.5 text-amber-600" />
                  ข้อมูลผู้เข้าพัก (GUEST INFORMATION)
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[11px] text-slate-500 font-bold block">ชื่อ-นามสกุลลูกค้า (Guest Name):</span>
                    <strong className="text-slate-950 text-base font-black mt-0.5 block">{booking.customerName}</strong>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 font-bold block">เบอร์โทรศัพท์ติดต่อ (Phone Number):</span>
                    <strong className="text-slate-950 text-base font-black flex items-center gap-1.5 mt-0.5">
                      <Phone className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      {booking.phoneNumber}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Stay Details */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                <h3 className="text-[11px] font-black uppercase tracking-wider text-amber-700 flex items-center gap-1.5 border-b border-slate-200 pb-2">
                  <Calendar className="w-3.5 h-3.5 text-amber-600" />
                  กำหนดการเข้าพัก (STAY DETAILS)
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-900 font-black mb-1">
                      <Clock className="w-3 h-3 text-emerald-600" />
                      วันเวลาเช็คอิน (CHECK-IN)
                    </div>
                    <div className="text-base font-black text-slate-950">{booking.checkInDate}</div>
                    <div className="text-[11px] font-extrabold text-emerald-800 mt-0.5">เวลา {booking.checkInTime} น.</div>
                  </div>
                  <div className="bg-rose-50 p-3 rounded-xl border border-rose-200">
                    <div className="flex items-center gap-1.5 text-[11px] text-rose-900 font-black mb-1">
                      <Clock className="w-3 h-3 text-rose-600" />
                      วันเวลาเช็คเอาท์ (CHECK-OUT)
                    </div>
                    <div className="text-base font-black text-slate-950">{booking.checkOutDate}</div>
                    <div className="text-[11px] font-extrabold text-rose-800 mt-0.5">เวลา {booking.checkOutTime} น.</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1 mb-0.5">
                      <BedDouble className="w-3 h-3 text-amber-600" /> ประเภทเตียง:
                    </span>
                    <strong className="text-slate-950 font-black text-xs block">{getBedLabel(booking.bedType)}</strong>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1 mb-0.5">
                      <CreditCard className="w-3 h-3 text-amber-600" /> ช่องทางจอง:
                    </span>
                    <strong className="text-slate-950 font-black text-xs block">{getChannelLabel(booking.bookingChannel)}</strong>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold mb-0.5 block">สถานะรายการ:</span>
                    <strong className="text-amber-800 font-black text-xs block">{getStatusLabel(booking.status)}</strong>
                  </div>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="space-y-2">
                <h3 className="text-[11px] font-black uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-600" />
                  สรุปรายการชำระเงิน (PAYMENT SUMMARY)
                </h3>
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-900 text-white text-[11px] uppercase">
                      <th className="py-2 px-3 rounded-l-lg font-black">รายการ (Description)</th>
                      <th className="py-2 px-3 font-black text-center">สถานะ</th>
                      <th className="py-2 px-3 rounded-r-lg font-black text-right">จำนวนเงิน (THB)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-900">
                    <tr>
                      <td className="py-3 px-3">
                        <strong className="block text-slate-950 font-black text-sm">ค่าเช่าห้องพัก เมม โฮมสเตย์</strong>
                        <span className="text-[11px] text-slate-600 font-bold">
                          เข้าพักวันที่ {booking.checkInDate} ถึง {booking.checkOutDate} · {getBedLabel(booking.bedType)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="bg-emerald-100 text-emerald-950 border border-emerald-300 font-black px-2.5 py-1 rounded-full text-[11px] inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> ชำระแล้ว
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-black text-slate-950 text-base">
                        ฿{booking.price.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-900">
                      <td colSpan={2} className="py-3 px-3 font-black text-slate-950 text-right text-[11px] uppercase">
                        ยอดชำระสุทธิทั้งหมด (TOTAL AMOUNT PAID):
                      </td>
                      <td className="py-3 px-3 text-right font-black text-amber-600 text-xl">
                        ฿{booking.price.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Notes */}
              {booking.notes && (
                <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 text-[11px] text-amber-950">
                  <strong className="font-black block mb-0.5">หมายเหตุเพิ่มเติม (Notes):</strong>
                  <p className="whitespace-pre-wrap font-bold text-slate-800">{booking.notes}</p>
                </div>
              )}

              {/* Footer */}
              <div className="pt-3 border-t border-slate-300 text-center space-y-1">
                <p className="font-black text-slate-800 text-sm">ขอขอบพระคุณท่านที่เลือกใช้บริการ เมม โฮมสเตย์ (MEM HOMESTAY)</p>
                <p className="text-[10px] font-bold text-slate-400">
                  เอกสารใบยืนยันและใบเสร็จรับเงินฉบับนี้ออกโดยระบบบริหารจัดการ เมม โฮมสเตย์ แบบอิเล็กทรอนิกส์
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );

  // Render as React Portal — directly into document.body (sibling of #root)
  return createPortal(receiptContent, document.body);
};
