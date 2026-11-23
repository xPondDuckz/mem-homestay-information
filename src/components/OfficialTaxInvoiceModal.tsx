import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { BookingRecord, TaxInvoiceItem } from '../types/booking';
import { thaiBahtText } from '../utils/thaiBaht';
import { formatDateThai } from '../utils/formatters';
import { X, Printer, Plus, Trash2, Building2, ChevronDown } from 'lucide-react';
import { DocHeader, DocSignature } from './DocParts';

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

  // Save edits whenever the document is closed, not only on print.
  const close = () => { handleSaveState(); onClose(); };

  const money = (n: number) => n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const isTax = docType === 'tax_invoice';
  const title = isTax ? 'ใบกำกับภาษี / ใบเสร็จรับเงิน' : 'บิลเงินสด';
  const titleEn = isTax ? 'Tax Invoice / Receipt' : 'Cash Sale';

  const ctlInput = 'glass-input w-full h-10 px-3 text-sm';
  const ctlLabel = 'block text-xs mb-1.5 text-[var(--text-muted)]';

  const receiptContent = (
    <div className="receipt-print-portal" style={{ display: 'contents' }}>
      <div
        className="doc-overlay modal-overlay fixed inset-0 z-[9999] flex items-start sm:items-center justify-center sm:p-4 animate-fade-in overflow-y-auto"
        onClick={(e) => { if (e.target === e.currentTarget) close(); }}
      >
        <div className="doc-shell w-full sm:max-w-[860px] min-h-[100dvh] sm:min-h-0 sm:max-h-[96vh] flex flex-col overflow-hidden sm:rounded-[20px] shadow-[var(--shadow-lg)] animate-scale-in">

          {/* ── Toolbar ── */}
          <div className="doc-toolbar no-print relative px-4 sm:px-6 py-4 shrink-0 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-base font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{title}</h2>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>แก้ไขข้อมูลบนเอกสารได้โดยตรง · พิมพ์ A4 1 หน้า</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => { handleSaveState(); handlePrint(); }}
                  className="btn-primary h-10 px-4 rounded-xl inline-flex items-center gap-2 text-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span className="hidden sm:inline">พิมพ์ / PDF</span>
                  <span className="sm:hidden">พิมพ์</span>
                </button>
                <button onClick={close} aria-label="ปิด" className="icon-btn">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="segmented sm:w-[300px]" style={{ '--count': 2, '--index': isTax ? 1 : 0 } as React.CSSProperties}>
                <span className="segmented-thumb" aria-hidden />
                {([['cash_sale', 'บิลเงินสด'], ['tax_invoice', 'ใบกำกับภาษี']] as const).map(([k, l]) => (
                  <button key={k} onClick={() => setDocType(k)} aria-current={docType === k ? 'page' : undefined} className="segmented-btn">{l}</button>
                ))}
              </div>
              <details className="group sm:ml-auto">
                <summary className="list-none cursor-pointer select-none h-10 px-3 rounded-xl inline-flex items-center gap-2 text-sm btn-ghost">
                  <Building2 className="w-4 h-4" />
                  ข้อมูลบริษัท &amp; ภาษี
                  <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
                </summary>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-6 gap-3 sm:absolute sm:left-6 sm:right-6 sm:z-10 sm:p-4 sm:rounded-2xl sm:bg-white sm:border sm:border-[var(--border-light)] sm:shadow-[var(--shadow-md)] animate-rise">
                  <label className="sm:col-span-3"><span className={ctlLabel}>ชื่อบริษัท / องค์กร</span>
                    <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="เช่น บริษัท ตัวอย่าง จำกัด" className={ctlInput} />
                  </label>
                  <label className="sm:col-span-3"><span className={ctlLabel}>เลขประจำตัวผู้เสียภาษี 13 หลัก</span>
                    <input value={taxId} onChange={(e) => setTaxId(e.target.value)} inputMode="numeric" placeholder="0000000000000" className={`${ctlInput} tabular-nums`} />
                  </label>
                  <label className="sm:col-span-4"><span className={ctlLabel}>ที่อยู่สำหรับออกบิล</span>
                    <input value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} placeholder="เลขที่ ถนน ตำบล อำเภอ จังหวัด รหัสไปรษณีย์" className={ctlInput} />
                  </label>
                  <label className="sm:col-span-2"><span className={ctlLabel}>ผู้รับเงิน</span>
                    <input value={collectorName} onChange={(e) => setCollectorName(e.target.value)} className={ctlInput} />
                  </label>
                  <label className="sm:col-span-3"><span className={ctlLabel}>ภาษีมูลค่าเพิ่ม (VAT)</span>
                    <select value={vatRate} onChange={(e) => setVatRate(Number(e.target.value))} className={`${ctlInput} cursor-pointer`}>
                      <option value={0}>ไม่คิด VAT</option>
                      <option value={7}>VAT 7%</option>
                    </select>
                  </label>
                  <label className="sm:col-span-3"><span className={ctlLabel}>หัก ณ ที่จ่าย</span>
                    <select value={withholdingTaxRate} onChange={(e) => setWithholdingTaxRate(Number(e.target.value))} className={`${ctlInput} cursor-pointer`}>
                      <option value={0}>ไม่หัก</option>
                      <option value={1}>หัก 1%</option>
                      <option value={3}>หัก 3%</option>
                    </select>
                  </label>
                </div>
              </details>
            </div>
          </div>

          {/* ── Paper ── */}
          <div className="doc-scroll flex-1 overflow-y-auto p-3 sm:p-8">
            <div key={docType} className="doc-paper mx-auto w-full max-w-[794px] px-5 py-7 sm:px-12 sm:py-11 animate-rise">

              <DocHeader title={title} titleEn={titleEn} />

              {/* Customer + meta */}
              <section className="mt-7 grid grid-cols-1 sm:grid-cols-[1fr_200px] gap-x-10 gap-y-4">
                <div className="space-y-3">
                  <div>
                    <span className="doc-label">ลูกค้า<em>Customer</em></span>
                    <input
                      value={companyName || customerName}
                      onChange={(e) => (companyName ? setCompanyName(e.target.value) : setCustomerName(e.target.value))}
                      className="doc-field text-[15px] font-semibold"
                    />
                  </div>
                  <div>
                    <span className="doc-label">ที่อยู่<em>Address</em></span>
                    <input value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} placeholder="ระบุที่อยู่ลูกค้า / บริษัท" className="doc-field" />
                  </div>
                  <div>
                    <span className="doc-label">เลขประจำตัวผู้เสียภาษี<em>Tax ID</em></span>
                    <input value={taxId} onChange={(e) => setTaxId(e.target.value)} placeholder="—" className="doc-field tabular-nums tracking-wider" />
                  </div>
                </div>

                <dl className="space-y-3">
                  <div>
                    <dt className="doc-label">เลขที่<em>No.</em></dt>
                    <dd><input value={billNo} onChange={(e) => setBillNo(e.target.value)} className="doc-field tabular-nums font-medium" /></dd>
                  </div>
                  <div>
                    <dt className="doc-label">เล่มที่<em>Book</em></dt>
                    <dd><input value={bookNo} onChange={(e) => setBookNo(e.target.value)} className="doc-field tabular-nums" /></dd>
                  </div>
                  <div>
                    <dt className="doc-label">วันที่<em>Date</em></dt>
                    <dd>
                      <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className="doc-field doc-screen-only" />
                      <span className="doc-print-only">{formatDateThai(issueDate)}</span>
                    </dd>
                  </div>
                </dl>
              </section>

              {/* Items */}
              <section className="mt-8">
                <table className="doc-table w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="py-2 pr-3 w-14">จำนวน</th>
                      <th className="py-2 px-3">รายการ</th>
                      <th className="py-2 px-3 w-28 !text-right">หน่วยละ</th>
                      <th className="py-2 pl-3 w-32 !text-right">จำนวนเงิน</th>
                      <th className="no-print w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="align-top">
                        <td className="py-3 pr-3">
                          <input type="number" min="1" value={item.quantity} onChange={(e) => handleUpdateItem(item.id, 'quantity', e.target.value)} className="doc-field tabular-nums" />
                        </td>
                        <td className="py-3 px-3">
                          <textarea value={item.description} onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)} rows={2} className="doc-field resize-none block" />
                        </td>
                        <td className="py-3 px-3">
                          <input type="number" value={item.unitPrice} onChange={(e) => handleUpdateItem(item.id, 'unitPrice', e.target.value)} className="doc-field text-right tabular-nums" />
                        </td>
                        <td className="py-3 pl-3 text-right tabular-nums whitespace-nowrap pt-[14px]">{money(item.amount)}</td>
                        <td className="no-print py-3 text-right">
                          {items.length > 1 && (
                            <button onClick={() => handleRemoveItem(item.id)} title="ลบรายการ" className="row-del action-btn action-btn-delete !w-7 !h-7">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {Array.from({ length: Math.max(0, 3 - items.length) }).map((_, i) => (
                      <tr key={`empty-${i}`} className="h-11"><td /><td /><td /><td /><td className="no-print" /></tr>
                    ))}
                  </tbody>
                </table>

                <button onClick={handleAddItem} className="no-print mt-3 h-9 px-3 rounded-lg inline-flex items-center gap-1.5 text-sm transition-colors hover:bg-[var(--brand-light)]" style={{ color: 'var(--brand)' }}>
                  <Plus className="w-4 h-4" /> เพิ่มรายการ
                </button>
              </section>

              {/* Totals */}
              <section className="mt-6 grid grid-cols-1 sm:grid-cols-[1fr_260px] gap-6 items-end">
                <div>
                  <span className="doc-label">จำนวนเงิน (ตัวอักษร)</span>
                  <p className="mt-0.5">{bahtText}</p>
                </div>
                <div className="space-y-1.5">
                  {(vatRate > 0 || withholdingTaxRate > 0) && (
                    <>
                      <div className="flex justify-between"><span style={{ color: '#57564f' }}>รวมเป็นเงิน</span><span className="tabular-nums">{money(subtotal)}</span></div>
                      {vatRate > 0 && <div className="flex justify-between"><span style={{ color: '#57564f' }}>ภาษีมูลค่าเพิ่ม {vatRate}%</span><span className="tabular-nums">{money(vatAmount)}</span></div>}
                      {withholdingTaxRate > 0 && <div className="flex justify-between"><span style={{ color: '#57564f' }}>หัก ณ ที่จ่าย {withholdingTaxRate}%</span><span className="tabular-nums">−{money(withholdingTaxAmount)}</span></div>}
                    </>
                  )}
                  <div className="flex items-baseline justify-between pt-2.5 mt-1" style={{ borderTop: '1.5px solid #1b1b19' }}>
                    <span className="font-medium">รวมทั้งสิ้น</span>
                    <span className="text-[22px] font-semibold tabular-nums">฿{money(grandTotal)}</span>
                  </div>
                </div>
              </section>

              <DocSignature name={collectorName} role="ผู้รับเงิน" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(receiptContent, document.body);
};
