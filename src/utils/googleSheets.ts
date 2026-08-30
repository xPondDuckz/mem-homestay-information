import type { BookingRecord } from '../types/booking';

export const GOOGLE_APPS_SCRIPT_TEMPLATE = `// ----------------------------------------------------
// โค้ดสำหรับวางใน Google Apps Script (extensions > Apps Script)
// เมื่อวางแล้ว กด "ทำให้ใช้งานได้" (Deploy) > "การทำให้ใช้งานได้ใหม่" (New Deployment)
// เลือกประเภท: "เว็บแอป" (Web App)
// ผู้มีสิทธิ์เข้าถึง (Who has access): "ทุกคน" (Anyone)
// ----------------------------------------------------

function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return createJsonResponse([]);
  }
  var headers = data[0];
  var result = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    
    // ข้ามแถวที่ไม่มีข้อมูล id หรือ customerName (ป้องกันแถวว่างเด็ดขาด)
    var rowId = row[0] ? String(row[0]).trim().replace(/^'/, '') : '';
    var rowName = row[2] ? String(row[2]).trim() : '';
    if (!rowId && !rowName) continue;

    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      var key = headers[j];
      var val = row[j];
      
      // คงเลข 0 นำหน้าของเบอร์โทรศัพท์
      if (key === 'phoneNumber') {
        val = val ? String(val).trim().replace(/^'/, '') : '';
        if (val && val.length === 9 && !val.startsWith('0')) {
          val = '0' + val;
        }
      } else if (key === 'price') {
        val = Number(val) || 0;
      } else {
        val = val !== undefined && val !== null ? String(val).trim().replace(/^'/, '') : '';
      }
      
      obj[key] = val;
    }
    result.push(obj);
  }
  return createJsonResponse(result);
}

function doPost(e) {
  try {
    var contents = JSON.parse(e.postData.contents);
    var action = contents.action;
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    if (action === 'sync' || action === 'save_all' || action === 'ping') {
      if (action === 'ping') {
        return createJsonResponse({ success: true, status: 'ok' });
      }

      sheet.clear();
      var headers = [
        'id', 'createdAt', 'customerName', 'phoneNumber', 
        'bedType', 'bookingChannel', 'checkInDate', 'checkInTime', 
        'checkOutDate', 'checkOutTime', 'price', 'notes', 'status'
      ];
      sheet.appendRow(headers);
      
      // ตั้งค่าหัวตารางเป็นตัวหนา
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");

      var bookings = contents.bookings || [];
      var validCount = 0;

      bookings.forEach(function(b) {
        if (!b) return;
        var name = b.customerName ? String(b.customerName).trim() : '';
        var idVal = b.id ? String(b.id).trim() : '';
        
        // ข้ามแถวที่ไม่มีชื่อลูกค้าหรือ id เด็ดขาด
        if (!name && !idVal) return;

        var phoneStr = b.phoneNumber ? String(b.phoneNumber).trim().replace(/^'/, '') : '';
        if (phoneStr && phoneStr.length === 9 && !phoneStr.startsWith('0')) {
          phoneStr = '0' + phoneStr;
        }

        // ใช้ ' นำหน้าเบอร์โทรศัพท์เพื่อบังคับให้ Google Sheet มองเป็นข้อความ (ไม่ตัดเลข 0)
        var formattedPhone = phoneStr ? "'" + phoneStr : '';

        sheet.appendRow([
          "'" + (idVal || ''),
          b.createdAt || '',
          name,
          formattedPhone,
          b.bedType || 'big',
          b.bookingChannel || 'walk_in',
          b.checkInDate || '',
          b.checkInTime || '',
          b.checkOutDate || '',
          b.checkOutTime || '',
          b.price !== undefined && b.price !== null ? Number(b.price) : 0,
          b.notes || '',
          b.status || 'confirmed'
        ]);
        validCount++;
      });

      // ตั้งค่า Format คอลัมน์เบอร์โทรศัพท์ (Column D) ให้เป็น Plain Text เพื่อคงเลข 0
      if (sheet.getLastRow() > 1) {
        sheet.getRange(2, 4, sheet.getLastRow() - 1, 1).setNumberFormat("@");
        sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).setNumberFormat("@");
      }

      return createJsonResponse({ success: true, count: validCount });
    }

    return createJsonResponse({ success: false, message: 'Unknown action' });
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
}

function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
`;

import { cleanDateStr, cleanTimeStr } from './formatters';

/**
 * Fetch all bookings from Google Sheets
 */
export async function fetchFromGoogleSheets(url: string): Promise<BookingRecord[]> {
  const cleanUrl = url.trim();
  if (!cleanUrl) return [];

  const response = await fetch(cleanUrl, {
    method: 'GET',
    redirect: 'follow',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch from Google Sheets (HTTP ${response.status})`);
  }

  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error('Invalid format returned from Google Sheets');
  }

  return data
    .filter((item: any) => item && (String(item.customerName || '').trim() !== '' || String(item.id || '').trim() !== ''))
    .map((item: any) => {
      let phone = String(item.phoneNumber || '').trim().replace(/^'/, '');
      if (phone && phone.length === 9 && !phone.startsWith('0')) {
        phone = '0' + phone;
      }

      return {
        id: String(item.id || '').replace(/^'/, '').trim(),
        createdAt: cleanDateStr(item.createdAt),
        customerName: String(item.customerName || '').trim(),
        phoneNumber: phone,
        bedType: item.bedType || 'big',
        bookingChannel: item.bookingChannel || 'walk_in',
        checkInDate: cleanDateStr(item.checkInDate),
        checkInTime: cleanTimeStr(item.checkInTime),
        checkOutDate: cleanDateStr(item.checkOutDate),
        checkOutTime: cleanTimeStr(item.checkOutTime),
        price: Number(item.price) || 0,
        notes: String(item.notes || '').trim(),
        status: item.status || 'confirmed',
      };
    });
}

/**
 * Sync full list of bookings to Google Sheets
 */
export async function syncToGoogleSheets(url: string, bookings: BookingRecord[]): Promise<boolean> {
  const cleanUrl = url.trim();
  if (!cleanUrl) return false;

  // กรองเอาเฉพาะข้อมูลที่มีชื่อลูกค้าหรือ ID จริงเท่านั้น
  const cleanBookings = bookings.filter(
    (b) => b && (String(b.customerName || '').trim() !== '' || String(b.id || '').trim() !== '')
  );

  const payload = {
    action: 'sync',
    bookings: cleanBookings,
  };

  const response = await fetch(cleanUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify(payload),
    redirect: 'follow',
  });

  if (!response.ok) {
    throw new Error(`Failed to send data to Google Sheets (HTTP ${response.status})`);
  }

  const resJson = await response.json();
  return resJson?.success === true;
}

/**
 * Test Google Sheets Web App Connection
 */
export async function testGoogleSheetsConnection(url: string): Promise<{ success: boolean; message: string; count?: number }> {
  try {
    const cleanUrl = url.trim();
    if (!cleanUrl) {
      return { success: false, message: 'กรุณาระบุ URL ของ Google Web App' };
    }

    if (!cleanUrl.includes('script.google.com')) {
      return { success: false, message: 'URL ต้องมาจาก script.google.com' };
    }

    const records = await fetchFromGoogleSheets(cleanUrl);
    return {
      success: true,
      count: records.length,
      message: `เชื่อมต่อสำเร็จ! พบข้อมูลทั้งหมด ${records.length} รายการใน Google Sheet`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `เชื่อมต่อไม่สำเร็จ: ${err?.message || 'ไม่สามารถติดต่อ Google Apps Script ได้'}`,
    };
  }
}
