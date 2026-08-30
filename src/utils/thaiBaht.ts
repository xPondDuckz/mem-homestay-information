/**
 * Converts a number into Thai Baht Text format.
 * Example: 1800 -> "(หนึ่งพันแปดร้อยบาทถ้วน)"
 * Example: 1250.50 -> "(หนึ่งพันสองร้อยห้าสิบบาทห้าสิบสตางค์)"
 */
export function thaiBahtText(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '(ศูนย์บาทถ้วน)';
  }

  // Round to 2 decimal places to prevent float precision issues
  const rounded = Math.round(amount * 100) / 100;
  if (rounded === 0) {
    return '(ศูนย์บาทถ้วน)';
  }

  const digits = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
  const positions = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];

  function convertSection(numStr: string): string {
    let result = '';
    const len = numStr.length;

    for (let i = 0; i < len; i++) {
      const digit = parseInt(numStr.charAt(i), 10);
      const pos = len - i - 1;

      if (digit !== 0) {
        if (pos === 1 && digit === 1) {
          result += 'สิบ';
        } else if (pos === 1 && digit === 2) {
          result += 'ยี่สิบ';
        } else if (pos === 0 && digit === 1 && len > 1 && numStr.charAt(len - 2) !== '0') {
          result += 'เอ็ด';
        } else {
          result += digits[digit] + positions[pos];
        }
      }
    }
    return result;
  }

  const isNegative = rounded < 0;
  const absAmount = Math.abs(rounded);
  const str = absAmount.toFixed(2);
  const [bahtStr, satangStr] = str.split('.');

  let bahtResult = '';
  // Handle numbers larger than 1 million
  let remainingBaht = bahtStr;
  while (remainingBaht.length > 6) {
    const chunk = remainingBaht.slice(-6);
    remainingBaht = remainingBaht.slice(0, -6);
    bahtResult = convertSection(chunk) + bahtResult;
  }
  if (remainingBaht.length > 0) {
    bahtResult = convertSection(remainingBaht) + bahtResult;
  }

  const satangNum = parseInt(satangStr, 10);
  let satangResult = '';
  if (satangNum > 0) {
    satangResult = convertSection(satangStr) + 'สตางค์';
  } else {
    satangResult = 'ถ้วน';
  }

  const fullText = (isNegative ? 'ลบ' : '') + (bahtResult ? bahtResult + 'บาท' : '') + satangResult;
  return `(${fullText})`;
}
