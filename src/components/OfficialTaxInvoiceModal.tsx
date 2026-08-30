import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { BookingRecord, TaxInvoiceItem } from '../types/booking';
import { thaiBahtText } from '../utils/thaiBaht';
import { formatDateThai } from '../utils/formatters';
import { X, Printer, Plus, Trash2, FileText, Building2 } from 'lucide-react';

interface OfficialTaxInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingRecord | null;
  onSaveTaxDetails?: (updatedBooking: BookingRecord) => void;
}

export const OfficialTaxInvoiceModal: React.FC<OfficialTaxInvoiceModalProps> = ({
  isOpen,
  onClose,
  booking,
  onSaveTaxDetails,
}) => {
  // Document Type: 'cash_sale' (บิลเงินสด) | 'tax_invoice' (ใบกำกับภาษี/ใบเสร็จรับเงิน)
  const [docType, setDocType] = useState<'cash_sale' | 'tax_invoice'>('cash_sale');

  // Form State
  const [bookNo, setBookNo] = useState<string>('001');
  const [billNo, setBillNo] = useState<string>('');
  const [issueDate, setIssueDate] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');
  const [customerAddress, setCustomerAddress] = useState<string>('');
  const [personalId, setPersonalId] = useState<string>('');
  const [taxId, setTaxId] = useState<string>('');
  const [collectorName, setCollectorName] = useState<string>('ผู้จัดการ เมม โฮมสเตย์');
  const [vatRate, setVatRate] = useState<number>(0); // 0% or 7%
  const [withholdingTaxRate, setWithholdingTaxRate] = useState<number>(0); // 0%, 1%, 3%

  // Items List State
  const [items, setItems] = useState<TaxInvoiceItem[]>([]);

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

  // Sync state when booking changes
  useEffect(() => {
    if (booking) {
      setBookNo(booking.bookNo || '001');
      setBillNo(booking.billNo || booking.id.replace('MEM-', 'NO.'));
      setIssueDate(booking.checkInDate || new Date().toISOString().slice(0, 10));
      setCustomerName(booking.customerName || '');
      setCompanyName(booking.companyName || '');
      setCustomerAddress(booking.customerAddress || '');
      setPersonalId(booking.personalId || '');
      setTaxId(booking.taxId || '');
      setCollectorName(booking.collectorName || 'ผู้จัดการ เมม โฮมสเตย์');
      setVatRate(booking.vatRate || 0);
      setWithholdingTaxRate(booking.withholdingTaxRate || 0);

      if (booking.customItems && booking.customItems.length > 0) {
        setItems(booking.customItems);
      } else {
        // Default 1 item: room rental with clean Thai date formatting
        const bedLabel =
          booking.bedType === 'big'
            ? 'เตียงใหญ่'
            : booking.bedType === 'small'
            ? 'เตียงเล็ก'
            : 'เตียงใหญ่ + เตียงเล็ก';

        const formattedIn = formatDateThai(booking.checkInDate);
        const formattedOut = formatDateThai(booking.checkOutDate);

        setItems([
          {
            id: '1',
            description: `ค่าเช่าห้องพัก เมม โฮมสเตย์ (${bedLabel}) วันที่ ${formattedIn} ถึง ${formattedOut}`,
            quantity: 1,
            unitPrice: booking.price,
            amount: booking.price,
          },
        ]);
      }
    }
  }, [booking]);

  if (!isOpen || !booking) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleAddItem = () => {
    const newItem: TaxInvoiceItem = {
      id: Date.now().toString(),
      description: 'รายการบริการเพิ่มเติม',
      quantity: 1,
      unitPrice: 0,
      amount: 0,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const handleUpdateItem = (id: string, field: keyof TaxInvoiceItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === 'quantity' || field === 'unitPrice') {
            const q = field === 'quantity' ? Number(value) || 0 : item.quantity;
            const p = field === 'unitPrice' ? Number(value) || 0 : item.unitPrice;
            updated.amount = q * p;
          }
          return updated;
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const subtotal = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const vatAmount = Math.round(subtotal * (vatRate / 100) * 100) / 100;
  const withholdingTaxAmount = Math.round(subtotal * (withholdingTaxRate / 100) * 100) / 100;
  const grandTotal = subtotal + vatAmount - withholdingTaxAmount;

  const bahtText = thaiBahtText(grandTotal);

  const handleSaveState = () => {
    if (onSaveTaxDetails && booking) {
      onSaveTaxDetails({
        ...booking,
        bookNo,
        billNo,
        companyName,
        customerAddress,
        personalId,
        taxId,
        customItems: items,
        vatRate,
        withholdingTaxRate,
        collectorName,
      });
    }
  };

  const receiptContent = (
    <>
      {/* ── Global Print Styles for Perfect Single Page A4 Fit ── */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0mm !important;
          }
          html, body {
            background: #ffffff !important;
            margin: 0mm !important;
            padding: 0mm !important;
            font-family: 'Prompt', 'Inter', sans-serif !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body.print-receipt-mode #root {
            display: none !important;
          }
          body.print-receipt-mode .receipt-print-portal {
            display: block !important;
          }
          .tax-modal-overlay {
            position: static !important;
            background: transparent !important;
            backdrop-filter: none !important;
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .tax-modal-card {
            box-shadow: none !important;
            border: 2px solid #1e3a8a !important;
            border-radius: 12px !important;
            max-height: none !important;
            overflow: visible !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            page-break-inside: avoid !important;
            page-break-after: avoid !important;
          }
          .no-print {
            display: none !important;
          }
          .tax-scroll-body {
            overflow: visible !important;
            max-height: none !important;
            padding: 8mm 10mm !important;
          }
          .print-border-blue {
            border-color: #1d4ed8 !important;
          }
          .print-bg-blue {
            background-color: #1e40af !important;
            color: #ffffff !important;
          }
          input, textarea {
            border: none !important;
            background: transparent !important;
            padding: 0 !important;
          }
        }
      `}</style>

      <div className="receipt-print-portal" style={{ display: 'contents' }}>
        {/* Screen Modal Overlay */}
        <div
          className="tax-modal-overlay fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          {/* Main Printable Card */}
          <div className="tax-modal-card bg-white rounded-3xl shadow-2xl border-2 border-slate-300 max-w-3xl w-full max-h-[96vh] flex flex-col overflow-hidden my-2">

            {/* ── Action Control Bar (Hidden on Print) ── */}
            <div className="no-print bg-slate-900 text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-600 text-white font-black">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-white">ออกบิลเงินสด / ใบกำกับภาษี (สำหรับเบิกบริษัท)</h2>
                  <p className="text-[11px] text-slate-400 font-medium">
                    แบบฟอร์มทางการ • ออกแบบพอดีกระดาษ A4 1 แผ่น
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as any)}
                  className="bg-slate-800 text-amber-400 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold focus:outline-none cursor-pointer"
                >
                  <option value="cash_sale">📄 บิลเงินสด (CASH SALE)</option>
                  <option value="tax_invoice">🧾 ใบกำกับภาษี / ใบเสร็จรับเงิน (TAX INVOICE)</option>
                </select>

                <button
                  onClick={() => {
                    handleSaveState();
                    handlePrint();
                  }}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-black px-4 py-2 rounded-xl text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  พิมพ์บิล / PDF (A4)
                </button>

                <button
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* ── Form Controls Panel (Hidden on Print) ── */}
            <div className="no-print bg-blue-50/80 border-b border-blue-200 px-5 py-3 space-y-2.5 text-xs">
              <div className="flex items-center justify-between font-bold text-blue-900">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-blue-600" /> ข้อมูลสำหรับการเบิกบริษัท (แก้ไขก่อนพิมพ์ได้)
                </span>
                <span className="text-[11px] text-blue-700 font-medium">* ข้อมูลจะพิมพ์ลงในบิล A4 อัตโนมัติ</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block">ชื่อบริษัท / องค์กรที่ขอเบิก:</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="เช่น บริษัท เอสซีจี จำกัด (มหาชน)"
                    className="w-full px-2.5 py-1.5 bg-white border border-blue-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-600 block">เลขประจำตัวผู้เสียภาษีอากร 13 หลัก:</label>
                  <input
                    type="text"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    placeholder="เช่น 0105558012345"
                    className="w-full px-2.5 py-1.5 bg-white border border-blue-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold text-slate-600 block">ที่อยู่สำหรับออกบิล/บริษัท:</label>
                  <input
                    type="text"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="เช่น 181 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110"
                    className="w-full px-2.5 py-1.5 bg-white border border-blue-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-600 block">ชื่อผู้รับเงิน / ออกบิล:</label>
                  <input
                    type="text"
                    value={collectorName}
                    onChange={(e) => setCollectorName(e.target.value)}
                    placeholder="เช่น ผู้จัดการ เมม โฮมสเตย์"
                    className="w-full px-2.5 py-1.5 bg-white border border-blue-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* ── PRINTABLE A4 SHEET CONTENT ── */}
            <div className="tax-scroll-body p-6 sm:p-8 overflow-y-auto flex-1 bg-white text-slate-900 space-y-4 font-sans">

              {/* 1. SHOP EXECUTIVE HEADER */}
              <div className="flex items-start justify-between gap-4 border-b-2 border-blue-900 pb-3">
                {/* Shop logo & address info */}
                <div className="space-y-1">
                  <h1 className="text-2xl font-black text-blue-950 tracking-tight leading-tight flex items-center gap-2">
                    Mem Homestay
                    <span className="text-xs font-extrabold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                      เมม โฮมสเตย์
                    </span>
                  </h1>
                  <p className="text-xs font-bold text-slate-700 leading-normal">
                    181 หมู่ 6 ตำบลชุมโค อำเภอปะทิว จังหวัดชุมพร 86160
                  </p>
                  <p className="text-xs font-extrabold text-blue-900">
                    โทร. 087-8939131
                  </p>
                </div>

                {/* Book No & Bill No box */}
                <div className="text-right space-y-1.5 shrink-0 pt-1">
                  <div className="flex items-center justify-end gap-2 text-xs font-bold text-slate-800">
                    <span>เล่มที่ <span className="text-[10px] text-slate-500 font-mono uppercase">BOOK NO.</span></span>
                    <input
                      type="text"
                      value={bookNo}
                      onChange={(e) => setBookNo(e.target.value)}
                      className="w-20 px-2 py-1 border border-slate-300 rounded text-center font-mono font-black text-xs text-slate-900 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 text-xs font-bold text-slate-800">
                    <span>เลขที่ <span className="text-[10px] text-slate-500 font-mono uppercase">BILL NO.</span></span>
                    <input
                      type="text"
                      value={billNo}
                      onChange={(e) => setBillNo(e.target.value)}
                      className="w-32 px-2 py-1 border border-slate-300 rounded text-center font-mono font-black text-xs text-blue-900 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* 2. TITLE BANNER */}
              <div className="bg-blue-900 text-white text-center py-2.5 px-4 rounded-lg shadow-sm print-bg-blue">
                <h2 className="text-lg font-black tracking-wide flex items-center justify-center gap-2">
                  {docType === 'cash_sale' ? (
                    <>
                      <span>บิลเงินสด</span>
                      <span className="text-xs font-bold opacity-90 font-mono">CASH SALE</span>
                    </>
                  ) : (
                    <>
                      <span>ใบกำกับภาษี / ใบเสร็จรับเงิน</span>
                      <span className="text-xs font-bold opacity-90 font-mono">TAX INVOICE / RECEIPT</span>
                    </>
                  )}
                </h2>
              </div>

              {/* 3. CUSTOMER DETAILS GRID */}
              <div className="border border-slate-300 rounded-xl p-3.5 text-xs space-y-2.5 bg-slate-50/50">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 flex items-center gap-2">
                    <span className="font-bold text-slate-800 shrink-0">
                      นาม <span className="text-[10px] text-slate-500 font-mono">CUSTOMER</span>:
                    </span>
                    <input
                      type="text"
                      value={companyName || customerName}
                      onChange={(e) => {
                        if (companyName) setCompanyName(e.target.value);
                        else setCustomerName(e.target.value);
                      }}
                      className="w-full border-b border-dotted border-slate-400 font-black text-slate-950 px-1 py-0.5 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 shrink-0">
                      วันที่ <span className="text-[10px] text-slate-500 font-mono">DATE</span>:
                    </span>
                    <input
                      type="date"
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                      className="w-full border-b border-dotted border-slate-400 font-bold text-slate-900 px-1 py-0.5 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 shrink-0">
                    ที่อยู่ <span className="text-[10px] text-slate-500 font-mono">ADDRESS</span>:
                  </span>
                  <input
                    type="text"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="ระบุที่อยู่ลูกค้า / บริษัทสำหรับเบิก"
                    className="w-full border-b border-dotted border-slate-400 font-semibold text-slate-900 px-1 py-0.5 focus:outline-none focus:border-blue-600"
                  />
                </div>

                {/* Tax ID Prominent Line for Corporate Reimbursements */}
                <div className="flex items-center gap-2 pt-0.5">
                  <span className="font-bold text-slate-800 shrink-0">
                    เลขประจำตัวผู้เสียภาษีอากร <span className="text-[10px] text-slate-500 font-mono">TAX IDENTIFICATION NO.</span>:
                  </span>
                  <input
                    type="text"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    placeholder="ระบุเลขประจำตัวผู้เสียภาษีอากร 13 หลัก"
                    className="w-full border-b border-dotted border-slate-400 font-mono font-bold text-blue-900 px-1 py-0.5 focus:outline-none focus:border-blue-600 tracking-wider text-xs"
                  />
                </div>
              </div>

              {/* 4. ITEMS TABLE */}
              <div className="border border-slate-400 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-blue-900 text-white font-bold border-b border-blue-950 text-[11px] print-bg-blue">
                      <th className="py-2.5 px-3 text-center border-r border-blue-700 w-16">
                        จำนวน<br />
                        <span className="text-[9px] font-mono font-normal">QTY</span>
                      </th>
                      <th className="py-2.5 px-3 border-r border-blue-700">
                        รายการ<br />
                        <span className="text-[9px] font-mono font-normal">DESCRIPTION</span>
                      </th>
                      <th className="py-2.5 px-3 text-right border-r border-blue-700 w-28">
                        หน่วยละ<br />
                        <span className="text-[9px] font-mono font-normal">UNIT PRICE</span>
                      </th>
                      <th className="py-2.5 px-3 text-right w-36">
                        จำนวนเงิน<br />
                        <span className="text-[9px] font-mono font-normal">AMOUNT (THB)</span>
                      </th>
                      <th className="no-print py-2.5 px-2 text-center w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300 text-slate-900">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        {/* Quantity */}
                        <td className="py-2.5 px-2 text-center border-r border-slate-300">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleUpdateItem(item.id, 'quantity', e.target.value)}
                            className="w-full text-center font-bold text-slate-900 focus:outline-none"
                          />
                        </td>

                        {/* Description - Auto Wrapping Multiline Textarea */}
                        <td className="py-2 px-3 border-r border-slate-300">
                          <textarea
                            value={item.description}
                            onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                            rows={2}
                            className="w-full font-bold text-slate-900 focus:outline-none bg-transparent resize-none leading-relaxed py-1 text-xs block"
                          />
                        </td>

                        {/* Unit Price */}
                        <td className="py-2.5 px-3 text-right border-r border-slate-300">
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => handleUpdateItem(item.id, 'unitPrice', e.target.value)}
                            className="w-full text-right font-mono font-bold text-slate-900 focus:outline-none"
                          />
                        </td>

                        {/* Amount */}
                        <td className="py-2.5 px-3 text-right font-mono font-black text-slate-950 text-sm">
                          ฿{item.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                        </td>

                        {/* Remove item button (no print) */}
                        <td className="no-print py-2.5 px-1 text-center">
                          {items.length > 1 && (
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-rose-500 hover:text-rose-700 p-1 rounded"
                              title="ลบรายการ"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}

                    {/* Minimum rows filler so receipt looks complete like real paper pad */}
                    {Array.from({ length: Math.max(0, 4 - items.length) }).map((_, i) => (
                      <tr key={`empty-${i}`} className="h-10">
                        <td className="border-r border-slate-300"></td>
                        <td className="border-r border-slate-300"></td>
                        <td className="border-r border-slate-300"></td>
                        <td></td>
                        <td className="no-print"></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add row button (no print) */}
              <div className="no-print flex items-center justify-between pt-1">
                <button
                  onClick={handleAddItem}
                  className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-blue-900 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-300 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> เพิ่มรายการสินค้า/บริการ
                </button>
              </div>

              {/* 5. SUMMARY & THAI BAHT TEXT */}
              <div className="border border-slate-400 rounded-xl p-3.5 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center bg-slate-50/60">
                {/* Baht Text Box (บาท BAHT) */}
                <div className="sm:col-span-2 border-r-0 sm:border-r border-slate-300 pr-0 sm:pr-3 space-y-1">
                  <div className="text-xs font-bold text-slate-700 flex items-center gap-2">
                    <span>บาท <span className="text-[10px] font-mono text-slate-500">BAHT</span>:</span>
                    <strong className="text-blue-950 text-sm font-black tracking-tight">{bahtText}</strong>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium leading-tight">
                    * ยอดเงินตัวอักษรคำนวณตามหลักภาษีสรรพากรอัตโนมัติ
                  </p>
                </div>

                {/* Total amount box */}
                <div className="text-right space-y-0.5">
                  <div className="text-xs font-bold text-slate-700">
                    รวมเงินสุทธิ <span className="text-[10px] font-mono text-slate-500 uppercase">TOTAL</span>
                  </div>
                  <div className="text-2xl font-black text-blue-950 font-mono tracking-tight">
                    ฿{grandTotal.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* 6. SIGNATURE SECTION */}
              <div className="pt-6 flex items-center justify-between text-xs border-t border-slate-300">
                <div className="text-[11px] text-slate-600 space-y-1">
                  <p className="font-bold text-slate-800 text-xs">ขอบคุณที่เลือกใช้บริการ / Thank you for your stay</p>
                  <p className="font-semibold text-slate-600">Mem Homestay (เมม โฮมสเตย์)</p>
                </div>

                <div className="text-center space-y-1.5 min-w-[220px]">
                  <div className="border-b-2 border-slate-800 w-48 mx-auto pb-1 font-bold text-slate-900">
                    {collectorName || '________________________'}
                  </div>
                  <div className="text-[11px] font-bold text-slate-800">
                    ผู้รับเงิน <span className="text-[10px] font-mono text-slate-500 uppercase">COLLECTOR</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(receiptContent, document.body);
};
