import type { BookingRecord } from '../types/booking';

export const exportBookingsToCSV = (bookings: BookingRecord[], filename = 'mem-homestay-bookings.csv') => {
  const headers = [
    'รหัสการจอง (ID)',
    'วันที่บันทึก',
    'ชื่อลูกค้า',
    'เบอร์โทรศัพท์',
    'ประเภทเตียง',
    'ช่องทางการจอง',
    'วันที่ Check-in',
    'เวลา Check-in',
    'วันที่ Check-out',
    'เวลา Check-out',
    'ราคา (บาท)',
    'สถานะ',
    'หมายเหตุ'
  ];

  const channelMap: Record<string, string> = {
    booking_com: 'Booking.com',
    walk_in: 'Walk-in'
  };

  const bedMap: Record<string, string> = {
    big: 'เตียงใหญ่ (Big)',
    small: 'เตียงเล็ก (Small)',
    both: 'เตียงใหญ่ + เตียงเล็ก'
  };

  const statusMap: Record<string, string> = {
    confirmed: 'รอยืนยัน/รอเช็คอิน',
    checked_in: 'เข้าพักอยู่',
    checked_out: 'เช็คเอาท์แล้ว',
    cancelled: 'ยกเลิก'
  };

  const rows = bookings.map(b => [
    `"${b.id}"`,
    `"${b.createdAt}"`,
    `"${b.customerName.replace(/"/g, '""')}"`,
    `"${b.phoneNumber}"`,
    `"${bedMap[b.bedType] || b.bedType}"`,
    `"${channelMap[b.bookingChannel] || b.bookingChannel}"`,
    `"${b.checkInDate}"`,
    `"${b.checkInTime}"`,
    `"${b.checkOutDate}"`,
    `"${b.checkOutTime}"`,
    b.price,
    `"${statusMap[b.status] || b.status}"`,
    `"${(b.notes || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
