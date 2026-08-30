import type { BookingRecord } from '../types/booking';

export const exportBookingsToCSV = (bookings: BookingRecord[], filename = 'mem-homestay-bookings.csv') => {
  const headers = [
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
    big: 'เตียงใหญ่',
    small: 'เตียงเล็ก',
    both: 'เตียงใหญ่ + เตียงเล็ก'
  };

  const statusMap: Record<string, string> = {
    confirmed: 'รอเช็คอิน',
    checked_in: 'พักอยู่',
    checked_out: 'เช็คเอาท์แล้ว',
    cancelled: 'ยกเลิก'
  };

  const rows = bookings.map(b => {
    // Format phone and dates with Excel text formula `="value"` to prevent 8.54E+08 scientific notation & `######` narrow date truncation
    const phoneFormatted = b.phoneNumber ? `="${b.phoneNumber.replace(/^'/, '')}"` : '""';
    const dateCreatedFormatted = b.createdAt ? `="${b.createdAt}"` : '""';
    const checkInFormatted = b.checkInDate ? `="${b.checkInDate}"` : '""';
    const checkOutFormatted = b.checkOutDate ? `="${b.checkOutDate}"` : '""';

    return [
      dateCreatedFormatted,
      `"${b.customerName.replace(/"/g, '""')}"`,
      phoneFormatted,
      `"${bedMap[b.bedType] || b.bedType}"`,
      `"${channelMap[b.bookingChannel] || b.bookingChannel}"`,
      checkInFormatted,
      `"${b.checkInTime}"`,
      checkOutFormatted,
      `"${b.checkOutTime}"`,
      b.price,
      `"${statusMap[b.status] || b.status}"`,
      `"${(b.notes || '').replace(/"/g, '""')}"`
    ];
  });

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
