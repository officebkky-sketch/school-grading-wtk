// src/utils/schoolMisExporter.ts
import * as XLSX from 'xlsx';
import { StudentProfile, SubjectConfig, AcademicConfig, StudentScoreRecord } from '../types/pp5Types';
import { GradingEngine } from '../engines/gradingEngine';

/**
 * ตัดคำนำหน้าชื่อออกเพื่อให้ได้ชื่อตัวแท้จริงตามรูปแบบระบบ SchoolMIS
 */
export function extractCleanFirstName(prefix: string, firstName: string): string {
  let name = firstName.trim();
  const prefixes = ['เด็กชาย', 'เด็กหญิง', 'ด.ช.', 'ด.ญ.', 'นาย', 'นางสาว', 'นาง'];
  for (const p of prefixes) {
    if (name.startsWith(p)) {
      name = name.slice(p.length).trim();
      break;
    }
  }
  return name;
}

/**
 * เรียงลำดับนักเรียนตามมาตรฐานระเบียบ SchoolMIS สพฐ. 100%
 * 1. เพศชาย (ช/ด.ช./นาย) มาก่อน เพศหญิง (ญ/ด.ญ./นางสาว)
 * 2. ภายในเพศเดียวกัน เรียงตามรหัสนักเรียน (studentId) จากน้อยไปมาก
 */
export function sortStudentsForSchoolMIS(students: StudentProfile[]): StudentProfile[] {
  return [...students].sort((a, b) => {
    const isMaleA = a.gender === 'ช' || a.gender === 'ชาย' || a.prefix.includes('ชาย') || a.prefix.includes('ด.ช.') || a.prefix.includes('นาย');
    const isMaleB = b.gender === 'ช' || b.gender === 'ชาย' || b.prefix.includes('ชาย') || b.prefix.includes('ด.ช.') || b.prefix.includes('นาย');

    if (isMaleA && !isMaleB) return -1;
    if (!isMaleA && isMaleB) return 1;

    const numA = parseInt(a.studentId.replace(/\D/g, ''), 10) || 0;
    const numB = parseInt(b.studentId.replace(/\D/g, ''), 10) || 0;
    return numA - numB;
  });
}

/**
 * ส่งออกไฟล์ CSV สำหรับนำเข้าคะแนนรายวิชาสู่ระบบ SchoolMIS
 * โครงสร้างตรงกับตัวอย่างราชการ: 93010069_06_1_ไฟล์นำเข้าgpa_ชั้น_ป.3_หัอง_1.csv 100%
 */
export function exportSchoolMIS_SingleSubjectCSV(
  students: StudentProfile[],
  subject: SubjectConfig,
  scores: Record<string, StudentScoreRecord>,
  config: AcademicConfig
) {
  // 1. Header 21 คอลัมน์ตรงตามแบบฟอร์ม SchoolMIS เป๊ะๆ
  const header = [
    'ที่',
    'รหัสนักเรียน',
    '"เลข ปชช."',
    'ชื่อ',
    'นามสกุล',
    '"ครั้งที่ 1"',
    '"ครั้งที่ 2"',
    '"ครั้งที่ 3"',
    '"ครั้งที่ 4"',
    'รวม',
    'ครั้งที่5',
    'แก้ตัวกลางภาค',
    'ครั้งที่6',
    'ครั้งที่7',
    'ครั้งที่8',
    'ครั้งที่9',
    'รวม',
    'รวมระหว่างภาค',
    'ครั้งที่10ปลายภาค',
    'ทั้งหมด',
    'เกรด'
  ].join(',');

  // 2. เรียงลำดับนักเรียนตามมาตรฐาน SchoolMIS เป๊ะๆ
  const sortedStudents = sortStudentsForSchoolMIS(students);
  const rows: string[] = [header];

  sortedStudents.forEach((s, idx) => {
    const rec = scores[s.studentId];
    const cleanName = extractCleanFirstName(s.prefix, s.firstName);
    const lastName = s.lastName.trim();

    // ดึงคะแนนตามเทอม
    const formative = config.semester === 1 ? rec?.formative1 : rec?.formative2;
    const midterm = config.semester === 1 ? rec?.midterm1 : rec?.midterm2;
    const finalScore = config.semester === 1 ? rec?.final1 : rec?.final2;
    const total = config.semester === 1 ? rec?.total1 : (rec?.yearlyTotal ?? rec?.total2);
    const grade = rec?.grade && rec.grade !== '-' ? rec.grade : '';

    const colSeq = idx + 1; // เลขที่ 1, 2, 3... ตาม SchoolMIS
    const colStudentId = s.studentId;
    const colNationalId = s.nationalId;
    const colFirstName = cleanName;
    const colLastName = lastName;

    const c1 = '';
    const c2 = '';
    const c3 = '';
    const c4 = '';
    const cSum1 = formative !== null && formative !== undefined ? formative : '';
    const c5_midterm = midterm !== null && midterm !== undefined ? midterm : '';
    const cRetakeMidterm = '';
    const c6 = '';
    const c7 = '';
    const c8 = '';
    const c9 = '';
    const cSum2 = '';
    const cSumFormative = formative !== null && formative !== undefined ? formative : '';
    const c10_final = finalScore !== null && finalScore !== undefined ? finalScore : '';
    const cTotal = total !== null && total !== undefined ? total : '';
    const cGrade = grade;

    const line = [
      colSeq,
      colStudentId,
      colNationalId,
      colFirstName,
      colLastName,
      c1,
      c2,
      c3,
      c4,
      cSum1,
      c5_midterm,
      cRetakeMidterm,
      c6,
      c7,
      c8,
      c9,
      cSum2,
      cSumFormative,
      c10_final,
      cTotal,
      cGrade
    ].join(',');

    rows.push(line);
  });

  // 3. UTF-8 with BOM (\uFEFF) เพื่อป้องกันภาษาต่างดาวใน Microsoft Excel
  const csvContent = '\uFEFF' + rows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

  // 4. ชื่อไฟล์ตามระเบียบ SchoolMIS
  // เช่น 93010069_06_1_ไฟล์นำเข้าgpa_ชั้น_ป.3_หัอง_1.csv
  const cleanSubjectCode = subject.code.replace(/\s+/g, '');
  const fileName = `${config.schoolId}_${cleanSubjectCode}_${config.semester}_ไฟล์นำเข้าgpa_ชั้น_${config.classLevel}_หัอง_${config.room}.csv`;

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * ดาวน์โหลดข้อมูลคะแนนเพื่อเก็บเป็นหลักฐานส่วนตัวของครู (Teacher Personal Backup)
 * ทั้งแบบ Excel (.xlsx) ที่มีรายละเอียดคะแนนและสถิติครบถ้วน
 */
export function exportTeacherPersonalBackupExcel(
  students: StudentProfile[],
  subject: SubjectConfig,
  scores: Record<string, StudentScoreRecord>,
  config: AcademicConfig,
  teacherName: string
) {
  const timestamp = new Date().toLocaleString('th-TH');

  const titleRows = [
    [`บันทึกคะแนนเก็บและผลการเรียนส่วนตัวครูผู้สอน`],
    [`โรงเรียน${config.schoolName} (รหัสสถานศึกษา: ${config.schoolId})`],
    [`รายวิชา: ${subject.name} (${subject.code}) • ระดับชั้น ${config.classLevel} ห้อง ${config.room}`],
    [`ครูผู้สอน/ผู้บันทึก: ${teacherName} • ภาคเรียนที่ ${config.semester} ปีการศึกษา ${config.academicYear}`],
    [`วันที่บันทึกสำรองข้อมูล: ${timestamp}`],
    []
  ];

  const headers = [
    'ที่',
    'รหัสนักเรียน',
    'เลขประจำตัวประชาชน',
    'ชื่อ - สกุล',
    'คะแนนเก็บ (เทอม 1)',
    'กลางภาค (เทอม 1)',
    'ปลายภาค (เทอม 1)',
    'รวมเทอม 1',
    'คะแนนเก็บ (เทอม 2)',
    'กลางภาค (เทอม 2)',
    'ปลายภาค (เทอม 2)',
    'รวมเทอม 2',
    'คะแนนรวมทั้งปี',
    'ระดับผลการเรียน (เกรด)',
    'ผลการตัดสิน'
  ];

  const sortedStudents = sortStudentsForSchoolMIS(students);
  const studentRows = sortedStudents.map((s, idx) => {
    const rec = scores[s.studentId];
    return [
      idx + 1,
      s.studentId,
      s.nationalId,
      `${s.prefix}${s.firstName} ${s.lastName}`.trim(),
      rec?.formative1 ?? '-',
      rec?.midterm1 ?? '-',
      rec?.final1 ?? '-',
      rec?.total1 ?? '-',
      rec?.formative2 ?? '-',
      rec?.midterm2 ?? '-',
      rec?.final2 ?? '-',
      rec?.total2 ?? '-',
      rec?.yearlyTotal ?? '-',
      rec?.grade && rec.grade !== '-' ? rec.grade : '-',
      rec?.isPassed ? 'ผ่าน' : 'ไม่ผ่าน'
    ];
  });

  // คำนวณสถิติ
  const scoreValues = students.map(s => {
    const rec = scores[s.studentId];
    return config.semester === 1 ? rec?.total1 : (rec?.yearlyTotal ?? rec?.total2);
  });
  const stats = GradingEngine.calculateStatistics(scoreValues);

  const statsRows = [
    [],
    ['--- สรุปข้อมูลสถิติของห้องเรียน ---'],
    ['จำนวนนักเรียนทั้งหมด', `${stats.count} คน`],
    ['คะแนนเฉลี่ย (Mean)', stats.mean.toFixed(2)],
    ['ส่วนเบี่ยงเบนมาตรฐาน (S.D.)', stats.sd.toFixed(2)],
    ['คะแนนสูงสุด (Max)', stats.max],
    ['คะแนนต่ำสุด (Min)', stats.min],
    ['จำนวนนักเรียนที่ผ่านเกณฑ์', `${stats.passCount} คน (${stats.passPercent}%)`],
    ['การกระจายเกรด 4', stats.gradeDistribution['4'] || 0],
    ['การกระจายเกรด 3.5', stats.gradeDistribution['3.5'] || 0],
    ['การกระจายเกรด 3', stats.gradeDistribution['3'] || 0],
    ['การกระจายเกรด 2.5', stats.gradeDistribution['2.5'] || 0],
    ['การกระจายเกรด 2', stats.gradeDistribution['2'] || 0],
    ['การกระจายเกรด 1.5', stats.gradeDistribution['1.5'] || 0],
    ['การกระจายเกรด 1', stats.gradeDistribution['1'] || 0],
    ['การกระจายเกรด 0', stats.gradeDistribution['0'] || 0]
  ];

  const allRows = [...titleRows, headers, ...studentRows, ...statsRows];

  const ws = XLSX.utils.aoa_to_sheet(allRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'คะแนนเก็บส่วนตัว');

  const cleanSubjectCode = subject.code.replace(/\s+/g, '');
  const fileName = `คะแนนส่วนตัว_${cleanSubjectCode}_${subject.name}_ชั้น${config.classLevel}_${teacherName.replace(/\s+/g, '_')}.xlsx`;

  XLSX.writeFile(wb, fileName);
}

/**
 * ส่งออกไฟล์ Excel ภาพรวมคะแนนทุกวิชาเข้า SchoolMIS
 */
export function exportToSchoolMISExcel(
  students: StudentProfile[],
  subjects: SubjectConfig[],
  scores: Record<string, Record<string, StudentScoreRecord>>,
  config: AcademicConfig
) {
  const header: string[] = ['#', 'รหัสนักเรียน', 'ชื่อ-สกุล'];

  subjects.forEach(sub => {
    header.push(`${sub.code.replace(/\s+/g, '')} ${sub.name}`);
  });

  const gradeDigit = config.classLevel.replace(/\D/g, '') || '1';
  const defaultActivities = [
    `ก1${gradeDigit}901 แนะแนว`,
    `ก1${gradeDigit}902 ลูกเสือ เนตรนารี`,
    `ก1${gradeDigit}903 ชุมนุม`,
    `ก1${gradeDigit}904 กิจกรรมเพื่อสังคมและสาธารณประโยชน์`
  ];
  defaultActivities.forEach(act => header.push(act));

  const rows: any[][] = [header];

  students.forEach(s => {
    const row: any[] = [
      s.seq,
      Number(s.studentId) || s.studentId,
      `${s.prefix}${s.firstName} ${s.lastName}`.trim()
    ];

    subjects.forEach(sub => {
      const rec = scores[sub.id]?.[s.studentId];
      if (rec && rec.grade && rec.grade !== '-') {
        const num = parseFloat(rec.grade);
        row.push(isNaN(num) ? rec.grade : num);
      } else {
        row.push('');
      }
    });

    defaultActivities.forEach(() => {
      row.push('ผ');
    });

    rows.push(row);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);

  const colWidths = [
    { wch: 5 },
    { wch: 14 },
    { wch: 28 },
  ];
  for (let i = 3; i < header.length; i++) {
    colWidths.push({ wch: 20 });
  }
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

  let classTitle = config.classLevel;
  if (classTitle.startsWith('ป.')) {
    classTitle = `ประถมศึกษาปีที่ ${classTitle.replace('ป.', '')}`;
  } else if (classTitle.startsWith('อ.')) {
    classTitle = `อนุบาลปีที่ ${classTitle.replace('อ.', '')}`;
  }

  const fileName = `คะแนน_ชั้น${classTitle}_ห้อง_${config.room}.xlsx`;

  XLSX.writeFile(wb, fileName);
}
