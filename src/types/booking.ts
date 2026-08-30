export type BedType = 'big' | 'small' | 'both';

export type BookingChannel = 'booking_com' | 'walk_in';

export type BookingStatus = 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';

export interface TaxInvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface BookingRecord {
  id: string;
  createdAt: string; // ISO Date format YYYY-MM-DD
  customerName: string;
  phoneNumber: string;
  bedType: BedType;
  bookingChannel: BookingChannel;
  checkInDate: string;  // YYYY-MM-DD
  checkInTime: string;  // HH:mm
  checkOutDate: string; // YYYY-MM-DD
  checkOutTime: string; // HH:mm
  price: number;
  notes?: string;
  status: BookingStatus;

  // Official Tax Invoice / Cash Sale fields
  bookNo?: string;          // เล่มที่
  billNo?: string;          // เลขที่
  taxId?: string;           // เลขประจำตัวผู้เสียภาษีอากร 13 หลัก
  personalId?: string;      // เลขประจำตัวประชาชน
  customerAddress?: string; // ที่อยู่สำหรับออกบิล
  companyName?: string;     // ชื่อบริษัท/หน่วยงานที่ขอเบิก
  customItems?: TaxInvoiceItem[]; // รายการในบิล
  vatRate?: number;         // ภาษีมูลค่าเพิ่ม (%) เช่น 0 หรือ 7
  withholdingTaxRate?: number; // ภาษีหัก ณ ที่จ่าย (%) เช่น 0, 1, 3
  collectorName?: string;   // ชื่อผู้รับเงิน
}

export interface BookingFilterOptions {
  searchQuery: string;
  channel: 'all' | BookingChannel;
  bedType: 'all' | BedType;
  startDate: string;
  endDate: string;
  status: 'all' | BookingStatus;
  sortBy: 'date_desc' | 'date_asc' | 'price_desc' | 'price_asc' | 'name_asc';
}

export interface BookingStats {
  totalBookings: number;
  totalRevenue: number;
  bookingComCount: number;
  walkInCount: number;
  bigBedCount: number;
  smallBedCount: number;
  todayCheckIns: number;
  todayCheckOuts: number;
}
