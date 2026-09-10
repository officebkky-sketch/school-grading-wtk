// src/utils/studentDateUtils.ts

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

/**
 * คำนวณอายุจริงของนักเรียนจากวันเดือนปีเกิด (พิจารณาปีการศึกษาปัจจุบัน)
 */
export function calculateStudentAge(birthDateStr?: string, classLevel?: string): number {
  if (!birthDateStr) {
    return getFallbackAgeByClass(classLevel);
  }

  const clean = birthDateStr.trim();
  let day = 1;
  let month = 0; // 0-11
  let year = 0;

  if (clean.includes('-')) {
    // รูปแบบ YYYY-MM-DD
    const parts = clean.split('-');
    if (parts.length === 3) {
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1;
      day = parseInt(parts[2], 10);
    }
  } else if (clean.includes('/')) {
    // รูปแบบ DD/MM/YYYY
    const parts = clean.split('/');
    if (parts.length === 3) {
      day = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1;
      year = parseInt(parts[2], 10);
    }
  }

  if (!year || isNaN(year)) {
    return getFallbackAgeByClass(classLevel);
  }

  // หากเป็น พ.ศ. (เช่น 2558) แปลงเป็น ค.ศ. (2015)
  if (year > 2400) {
    year -= 543;
  }

  // อิงวันที่ปัจจุบัน (ปีการศึกษา 2569 / 2026)
  const now = new Date();
  let age = now.getFullYear() - year;
  const monthDiff = now.getMonth() - month;
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < day)) {
    age--;
  }

  // ถ้าคำนวณแล้วได้อายุน้อยกว่า 3 หรือมากกว่า 20 ให้ fallback ตามชั้นเรียน
  if (age < 3 || age > 20) {
    return getFallbackAgeByClass(classLevel);
  }

  return age;
}

export function getFallbackAgeByClass(classLevel?: string): number {
  if (!classLevel) return 7;
  const cls = classLevel.trim();
  if (cls.includes('อ.1')) return 4;
  if (cls.includes('อ.2')) return 5;
  if (cls.includes('อ.3')) return 6;
  if (cls.includes('ป.1')) return 7;
  if (cls.includes('ป.2')) return 8;
  if (cls.includes('ป.3')) return 9;
  if (cls.includes('ป.4')) return 10;
  if (cls.includes('ป.5')) return 11;
  if (cls.includes('ป.6')) return 12;
  return 7;
}

/**
 * แปลงวันเกิดเป็นรูปแบบไทยมาตรฐานทางการ (พ.ศ. เสมอ)
 * mode: 'full'  -> "22 เมษายน 2558"
 * mode: 'short' -> "22/04/2558"
 */
export function formatThaiBirthDate(birthDateStr?: string, mode: 'full' | 'short' = 'full'): string {
  if (!birthDateStr) return '-';

  const clean = birthDateStr.trim();
  let day = 0;
  let month = 0; // 1-12
  let year = 0;

  if (clean.includes('-')) {
    // รูปแบบ YYYY-MM-DD หรือ YYYY-MM-DDT...
    const datePart = clean.split('T')[0];
    const parts = datePart.split('-');
    if (parts.length === 3) {
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      day = parseInt(parts[2], 10);
    }
  } else if (clean.includes('/')) {
    // รูปแบบ DD/MM/YYYY หรือ YYYY/MM/DD
    const parts = clean.split('/');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
        day = parseInt(parts[2], 10);
      } else {
        day = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
        year = parseInt(parts[2], 10);
      }
    }
  }

  if (!year || !month || !day || isNaN(year) || isNaN(month) || isNaN(day)) return clean;

  const thaiYear = year < 2400 ? year + 543 : year;

  if (mode === 'short') {
    const dd = String(day).padStart(2, '0');
    const mm = String(month).padStart(2, '0');
    return `${dd}/${mm}/${thaiYear}`;
  }

  const monthName = THAI_MONTHS[month - 1] || `${month}`;
  return `${day} ${monthName} ${thaiYear}`;
}
