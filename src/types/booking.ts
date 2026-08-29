export type BedType = 'big' | 'small' | 'both';

export type BookingChannel = 'booking_com' | 'walk_in';

export type BookingStatus = 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';

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
