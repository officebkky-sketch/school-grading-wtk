// src/utils/subjectSortUtils.ts
import { SubjectConfig } from '../types/pp5Types';

/**
 * คำนวณน้ำหนักลำดับรายวิชาพื้นฐานตามมาตรฐาน สพฐ. กระทรวงศึกษาธิการ:
 * 1. ท - ภาษาไทย (10)
 * 2. ค - คณิตศาสตร์ (20)
 * 3. ว - วิทยาศาสตร์และเทคโนโลยี (30)
 * 4. ส - สังคมศึกษา ศาสนาและวัฒนธรรม (40)
 * 5. ส - ประวัติศาสตร์ (50)
 * 6. พ - สุขศึกษาและพลศึกษา (60)
 * 7. ศ - ศิลปะ (70)
 * 8. ง - การงานอาชีพ (80)
 * 9. อ - ภาษาต่างประเทศ (ภาษาอังกฤษ) (90)
 */
export function getBasicSubjectSortWeight(code?: string, name?: string): number {
  const c = (code || '').replace(/\s+/g, '').toUpperCase();
  const n = (name || '').trim();

  // 1. ภาษาไทย (ท)
  if (c.startsWith('ท') || n.includes('ภาษาไทย')) {
    return 10;
  }
  // 2. คณิตศาสตร์ (ค)
  if (c.startsWith('ค') || n.includes('คณิตศาสตร์')) {
    return 20;
  }
  // 3. วิทยาศาสตร์และเทคโนโลยี (ว)
  if (c.startsWith('ว') || n.includes('วิทยาศาสตร์') || n.includes('เทคโนโลยี')) {
    return 30;
  }
  // 5. ส - ประวัติศาสตร์ (ต้องเช็คก่อนสังคมศึกษาทั่วไป)
  if (
    n.includes('ประวัติศาสตร์') || 
    n.includes('ประวัติ') || 
    c.endsWith('102') || 
    (c.startsWith('ส') && c.includes('102'))
  ) {
    return 50;
  }
  // 4. ส - สังคมศึกษา ศาสนาและวัฒนธรรม
  if (
    c.startsWith('ส') || 
    n.includes('สังคมศึกษา') || 
    n.includes('ศาสนา') || 
    n.includes('วัฒนธรรม')
  ) {
    return 40;
  }
  // 6. สุขศึกษาและพลศึกษา (พ)
  if (c.startsWith('พ') || n.includes('สุขศึกษา') || n.includes('พลศึกษา')) {
    return 60;
  }
  // 7. ศิลปะ (ศ)
  if (c.startsWith('ศ') || n.includes('ศิลปะ') || n.includes('ดนตรี') || n.includes('นาฏศิลป์')) {
    return 70;
  }
  // 8. การงานอาชีพ (ง)
  if (c.startsWith('ง') || n.includes('การงาน')) {
    return 80;
  }
  // 9. ภาษาอังกฤษ / ภาษาต่างประเทศ (อ)
  if (c.startsWith('อ') || n.includes('ภาษาอังกฤษ') || n.includes('ต่างประเทศ')) {
    return 90;
  }

  // วิชาพื้นฐานอื่นๆ
  return 100;
}

/**
 * จัดเรียงอาร์เรย์รายวิชาให้รายวิชาพื้นฐานเรียงตาม: ท, ค, ว, ส(สังคม), ส(ประวัติศาสตร์), พ, ศ, ง, อ
 * และรักษารายวิชาเพิ่มเติม/กิจกรรมตามลำดับเดิม
 */
export function sortSubjectConfigs(subjects: SubjectConfig[]): SubjectConfig[] {
  if (!subjects || subjects.length === 0) return [];

  const basic = subjects.filter(s => s.type === 'พื้นฐาน' || !s.type);
  const additional = subjects.filter(s => s.type === 'เพิ่มเติม');
  const activity = subjects.filter(s => s.type === 'กิจกรรม');

  // เรียงเฉพาะรายวิชาพื้นฐาน
  const sortedBasic = [...basic].sort((a, b) => {
    const wA = getBasicSubjectSortWeight(a.code, a.name);
    const wB = getBasicSubjectSortWeight(b.code, b.name);
    return wA - wB;
  });

  return [...sortedBasic, ...additional, ...activity];
}

/**
 * จัดเรียง subjectsWithGrades สำหรับหน้า Portal และการพิมพ์
 */
export function sortSubjectsWithGrades<T extends { subject: SubjectConfig }>(items: T[]): T[] {
  if (!items || items.length === 0) return [];

  const basic = items.filter(i => i.subject.type === 'พื้นฐาน' || !i.subject.type);
  const additional = items.filter(i => i.subject.type === 'เพิ่มเติม');
  const activity = items.filter(i => i.subject.type === 'กิจกรรม');

  const sortedBasic = [...basic].sort((a, b) => {
    const wA = getBasicSubjectSortWeight(a.subject.code, a.subject.name);
    const wB = getBasicSubjectSortWeight(b.subject.code, b.subject.name);
    return wA - wB;
  });

  return [...sortedBasic, ...additional, ...activity];
}
