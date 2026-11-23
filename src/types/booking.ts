export type BedType = 'big' | 'small' | 'both';

export type BookingChannel = 'booking_com' | 'walk_in';

export type BookingStatus = 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';

export type PaymentStatus = 'unpaid' | 'deposit' | 'paid';

export type PaymentMethod = 'cash' | 'transfer' | 'booking_com';

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

  // Payment
  paymentStatus?: PaymentStatus;  // ยังไม่จ่าย / มัดจำ / จ่ายครบ
  paymentMethod?: PaymentMethod;  // เงินสด / โอน / Booking.com
  depositAmount?: number;         // ยอดมัดจำ (เมื่อ paymentStatus = 'deposit')
  source?: 'ical';                // นำเข้าอัตโนมัติจาก Booking.com iCal

  // Rooms & housekeeping
  roomId?: string;                // ห้องที่พัก (ดู Room)
  cleanedAt?: string;             // วันที่ทำความสะอาดห้องหลังเช็คเอาท์ (YYYY-MM-DD)
}

export interface Room {
  id: string;
  name: string;      // เช่น "ห้อง 1"
  bedType: BedType;  // ประเภทเตียงของห้อง
  icalUrl?: string;  // ลิงก์ iCal ของห้องนี้จาก Booking.com
}

export interface AppSettings {
  rooms: Room[];
}

export interface BookingFilterOptions {
  searchQuery: string;
  channel: 'all' | BookingChannel;
  bedType: 'all' | BedType;
  startDate: string;
  endDate: string;
  dateField?: 'checkIn' | 'checkOut'; // which date startDate/endDate apply to
  roomId?: string;                    // '' / undefined = all rooms
  unpaidOnly?: boolean;               // show only bookings with a balance due
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
