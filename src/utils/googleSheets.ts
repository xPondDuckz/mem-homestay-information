import type { BookingRecord } from '../types/booking';

/** Columns stored in the sheet (order = column order). */
export const SHEET_COLUMNS = [
  'id', 'createdAt', 'customerName', 'phoneNumber',
  'bedType', 'bookingChannel', 'checkInDate', 'checkInTime',
  'checkOutDate', 'checkOutTime', 'price', 'notes', 'status',
  'bookNo', 'billNo', 'companyName', 'customerAddress', 'personalId', 'taxId',
  'collectorName', 'vatRate', 'withholdingTaxRate', 'customItems',
  'paymentStatus', 'paymentMethod', 'depositAmount', 'source',
  'roomId', 'cleanedAt',
] as const;

export const GOOGLE_APPS_SCRIPT_TEMPLATE = `// ----------------------------------------------------
// Mem Homestay — Google Apps Script (เวอร์ชัน 2: เก็บข้อมูลบิล/ภาษีครบทุกช่อง)
// วางใน Extensions > Apps Script แล้วกด Deploy > Manage deployments
// > แก้ไข (ไอคอนดินสอ) > Version: New version > Deploy
// (ใช้ deployment เดิม URL จะไม่เปลี่ยน)
// Who has access: Anyone
// ----------------------------------------------------

var HEADERS = ${JSON.stringify(SHEET_COLUMNS)};
var TEXT_COLS = ['id', 'phoneNumber', 'taxId', 'personalId', 'bookNo', 'billNo'];
var NUM_COLS = ['price', 'vatRate', 'withholdingTaxRate', 'depositAmount'];
var SETTINGS_SHEET = 'Settings';

// The bookings tab = first tab that is not "Settings" (don't rely on the active sheet).
function bookingSheet() {
  var sheets = SpreadsheetApp.getActiveSpreadsheet().getSheets();
  for (var i = 0; i < sheets.length; i++) if (sheets[i].getName() !== SETTINGS_SHEET) return sheets[i];
  return sheets[0];
}

function settingsSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(SETTINGS_SHEET) || ss.insertSheet(SETTINGS_SHEET, ss.getSheets().length);
}

function doGet(e) {
  if (e && e.parameter && e.parameter.settings) {
    var raw = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SETTINGS_SHEET);
    var txt = raw ? String(raw.getRange(1, 1).getValue() || '') : '';
    var parsed = null;
    try { parsed = txt ? JSON.parse(txt) : null; } catch (err) { parsed = null; }
    return json({ settings: parsed });
  }
  var sheet = bookingSheet();
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return json([]);
  var headers = data[0];
  var result = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i], obj = {};
    for (var j = 0; j < headers.length; j++) {
      var key = headers[j], val = row[j];
      if (NUM_COLS.indexOf(key) >= 0) {
        val = Number(val) || 0;
      } else if (key === 'customItems') {
        try { val = val ? JSON.parse(val) : []; } catch (err) { val = []; }
      } else if (val instanceof Date) {
        val = Utilities.formatDate(val, Session.getScriptTimeZone(), key.indexOf('Time') >= 0 ? 'HH:mm' : 'yyyy-MM-dd');
      } else {
        val = val !== undefined && val !== null ? String(val).trim().replace(/^'/, '') : '';
      }
      obj[key] = val;
    }
    if (!obj.id && !obj.customerName) continue;
    result.push(obj);
  }
  return json(result);
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var contents = JSON.parse(e.postData.contents);
    if (contents.action === 'ping') return json({ success: true, status: 'ok' });
    if (contents.action === 'ical') {
      // Proxy for Booking.com calendar export (browsers can't fetch it directly because of CORS).
      var icalUrl = String(contents.url || '');
      var host = icalUrl.indexOf('https://') === 0 ? icalUrl.slice(8).split('/')[0].toLowerCase() : '';
      if (host !== 'booking.com' && host.slice(-12) !== '.booking.com') {
        return json({ success: false, error: 'Only booking.com calendar links are allowed' });
      }
      var res = UrlFetchApp.fetch(icalUrl, { muteHttpExceptions: true, followRedirects: true });
      return json({ success: res.getResponseCode() === 200, status: res.getResponseCode(), ics: res.getContentText() });
    }
    if (contents.action === 'save_settings') {
      settingsSheet().getRange(1, 1).setValue(JSON.stringify(contents.settings || {}));
      return json({ success: true });
    }
    if (contents.action !== 'sync' && contents.action !== 'save_all') {
      return json({ success: false, message: 'Unknown action' });
    }

    var rows = (contents.bookings || [])
      .filter(function (b) { return b && (String(b.id || '').trim() || String(b.customerName || '').trim()); })
      .map(function (b) {
        return HEADERS.map(function (key) {
          var v = b[key];
          if (key === 'customItems') return v && v.length ? JSON.stringify(v) : '';
          if (NUM_COLS.indexOf(key) >= 0) return Number(v) || 0;
          if (v === undefined || v === null) return '';
          return TEXT_COLS.indexOf(key) >= 0 && String(v) !== '' ? "'" + String(v) : String(v);
        });
      });

    var sheet = bookingSheet();
    sheet.clearContents();
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
    if (rows.length) sheet.getRange(2, 1, rows.length, HEADERS.length).setValues(rows);
    sheet.setFrozenRows(1);

    return json({ success: true, count: rows.length, version: 2 });
  } catch (err) {
    return json({ success: false, error: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

function json(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
`;

import { cleanDateStr, cleanTimeStr, localDate } from './formatters';

const str = (v: any) => (v === undefined || v === null ? '' : String(v).replace(/^'/, '').trim());

/** Invoice / tax fields — only included when present so older sheets stay compatible. */
function extraFields(item: any): Partial<BookingRecord> {
  const out: Partial<BookingRecord> = {};
  (['bookNo', 'billNo', 'companyName', 'customerAddress', 'personalId', 'taxId', 'collectorName', 'paymentStatus', 'paymentMethod', 'source', 'roomId', 'cleanedAt'] as const).forEach((k) => {
    const v = str(item[k]);
    if (v) (out as any)[k] = v;
  });
  if (item.vatRate !== undefined && item.vatRate !== '') out.vatRate = Number(item.vatRate) || 0;
  if (item.withholdingTaxRate !== undefined && item.withholdingTaxRate !== '') out.withholdingTaxRate = Number(item.withholdingTaxRate) || 0;
  if (item.depositAmount !== undefined && item.depositAmount !== '' && Number(item.depositAmount)) out.depositAmount = Number(item.depositAmount);
  let items = item.customItems;
  if (typeof items === 'string' && items.trim()) {
    try { items = JSON.parse(items); } catch { items = undefined; }
  }
  if (Array.isArray(items) && items.length) out.customItems = items;
  return out;
}

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

  const todayStr = localDate();

  return data
    .filter((item: any) => item && (String(item.customerName || '').trim() !== '' || String(item.id || '').trim() !== ''))
    .map((item: any) => {
      let phone = String(item.phoneNumber || '').trim().replace(/^'/, '');
      if (phone && phone.length === 9 && !phone.startsWith('0')) {
        phone = '0' + phone;
      }

      const cleanCreated = cleanDateStr(item.createdAt);
      const cleanCheckIn = cleanDateStr(item.checkInDate);
      const cleanCheckOut = cleanDateStr(item.checkOutDate);

      // Fallback empty dates to today's date so legacy corrupted rows appear in table and can be deleted
      const validCheckIn = (cleanCheckIn && cleanCheckIn.length >= 7) ? cleanCheckIn : (cleanCreated && cleanCreated.length >= 7 ? cleanCreated : todayStr);
      const validCreated = (cleanCreated && cleanCreated.length >= 7) ? cleanCreated : validCheckIn;
      const validCheckOut = (cleanCheckOut && cleanCheckOut.length >= 7) ? cleanCheckOut : validCheckIn;

      return {
        id: String(item.id || '').replace(/^'/, '').trim(),
        createdAt: validCreated,
        customerName: String(item.customerName || '').trim(),
        phoneNumber: phone,
        bedType: item.bedType || 'big',
        bookingChannel: item.bookingChannel || 'walk_in',
        checkInDate: validCheckIn,
        checkInTime: cleanTimeStr(item.checkInTime),
        checkOutDate: validCheckOut,
        checkOutTime: cleanTimeStr(item.checkOutTime),
        price: Number(item.price) || 0,
        notes: String(item.notes || '').trim(),
        status: item.status || 'confirmed',
        ...extraFields(item),
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

/**
 * Download a Booking.com iCal feed through the Apps Script proxy (action: 'ical').
 */
export async function fetchIcalViaSheets(sheetsUrl: string, icalUrl: string): Promise<string> {
  const response = await fetch(sheetsUrl.trim(), {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'ical', url: icalUrl.trim() }),
    redirect: 'follow',
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const res = await response.json();
  if (!res?.success || typeof res.ics !== 'string') {
    throw new Error(res?.error || res?.message || 'สคริปต์ Google ยังไม่รองรับ iCal (กรุณาอัปเดตสคริปต์)');
  }
  return res.ics;
}
