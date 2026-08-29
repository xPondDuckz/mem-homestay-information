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
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      var key = headers[j];
      var val = row[j];
      if (key === 'price') val = Number(val) || 0;
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
      
      var bookings = contents.bookings || [];
      bookings.forEach(function(b) {
        sheet.appendRow([
          b.id || '',
          b.createdAt || '',
          b.customerName || '',
          b.phoneNumber || '',
          b.bedType || 'big',
          b.bookingChannel || 'walk_in',
          b.checkInDate || '',
          b.checkInTime || '',
          b.checkOutDate || '',
          b.checkOutTime || '',
          b.price || 0,
          b.notes || '',
          b.status || 'confirmed'
        ]);
      });
      return createJsonResponse({ success: true, count: bookings.length });
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

  return data.map((item: any) => ({
    id: String(item.id || ''),
    createdAt: String(item.createdAt || ''),
    customerName: String(item.customerName || ''),
    phoneNumber: String(item.phoneNumber || ''),
    bedType: item.bedType || 'big',
    bookingChannel: item.bookingChannel || 'walk_in',
    checkInDate: String(item.checkInDate || ''),
    checkInTime: String(item.checkInTime || ''),
    checkOutDate: String(item.checkOutDate || ''),
    checkOutTime: String(item.checkOutTime || ''),
    price: Number(item.price) || 0,
    notes: String(item.notes || ''),
    status: item.status || 'confirmed',
  }));
}

/**
 * Sync full list of bookings to Google Sheets
 */
export async function syncToGoogleSheets(url: string, bookings: BookingRecord[]): Promise<boolean> {
  const cleanUrl = url.trim();
  if (!cleanUrl) return false;

  const payload = {
    action: 'sync',
    bookings: bookings,
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

    // Try fetching existing data
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
