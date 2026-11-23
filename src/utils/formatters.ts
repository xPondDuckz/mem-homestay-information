/**
 * Sanitizes and cleans raw date string from Google Sheets or form input
 * Removes garbage timestamps like '1899-12-30T07:17:56.000Z'
 */
export function cleanDateStr(rawStr: any): string {
  if (!rawStr) return '';
  const str = String(rawStr).trim();

  // If string contains multiple dates separated by space (e.g. '2026-08-28T17:00:00.000Z 1899-12-30...')
  const firstPart = str.split(' ')[0];

  // Match YYYY-MM-DD pattern
  const isoMatch = firstPart.match(/\d{4}-\d{2}-\d{2}/);
  if (isoMatch) {
    return isoMatch[0];
  }

  if (firstPart.includes('T')) {
    return firstPart.split('T')[0];
  }

  return firstPart;
}

/**
 * Sanitizes raw time string
 * Extracts clean HH:mm (e.g. '14:00')
 */
export function cleanTimeStr(rawTime: any): string {
  if (!rawTime) return '14:00';
  const str = String(rawTime).trim();

  // Search for standard HH:mm or H:mm
  const timeMatch = str.match(/\b\d{1,2}:\d{2}\b/);
  if (timeMatch) {
    // Ensure two digits for hour if needed
    const parts = timeMatch[0].split(':');
    const hh = parts[0].padStart(2, '0');
    return `${hh}:${parts[1]}`;
  }

  if (str.includes('T')) {
    const afterT = str.split('T')[1];
    if (afterT) {
      return afterT.slice(0, 5);
    }
  }

  return str.length > 5 ? str.slice(0, 5) : str || '14:00';
}

/**
 * Formats YYYY-MM-DD date into short Thai date format
 * Example: '2026-08-28' -> '28 ส.ค. 2569' (Buddhist year)
 */
export function formatDateThai(rawDateStr: any): string {
  const clean = cleanDateStr(rawDateStr);
  if (!clean || clean.length < 10) return clean || '-';

  const parts = clean.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const monthIdx = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);

    const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    if (monthIdx >= 0 && monthIdx < 12) {
      return `${day} ${thaiMonths[monthIdx]} ${year < 2400 ? year + 543 : year}`;
    }
  }

  return clean;
}

/** Local (not UTC) date as YYYY-MM-DD — avoids "yesterday" before 07:00 in Thailand. */
export function localDate(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
