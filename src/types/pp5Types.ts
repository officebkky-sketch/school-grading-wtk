// src/types/pp5Types.ts

export type SchoolLevel = 'อนุบาล' | 'ประถมศึกษา' | 'มัธยมศึกษา';

export interface AcademicConfig {
  academicYear: string;
  semester: 1 | 2;
  schoolId: string;
  schoolName: string;
  directorName: string;
  homeroomTeacher: string;
  classLevel: string; // เช่น "ป.1", "ป.2", "อ.2"
  room: number;
  totalSchoolDaysSemester1: number;
  totalSchoolDaysSemester2: number;
  academicHead?: string; // ชื่อหัวหน้าฝ่ายวิชาการ
  term1Locked?: boolean; // ล็อคคะแนนภาคเรียนที่ 1 เมื่อประกาศผลทางการแล้ว
  clubNameMap?: Record<string, string>; // แมปชื่อชุมนุมตามระดับชั้น เช่น {'ป.1': 'ชุมนุมศิลป์สร้างสรรค์', 'ป.6': 'ชุมนุมสื่อ AI สร้างสรรค์'}
}

export interface StudentProfile {
  id: string;
  seq: number;
  studentId: string;
  nationalId: string;
  prefix: string;
  firstName: string;
  lastName: string;
  gender: 'ชาย' | 'หญิง' | 'ช' | 'ญ';
  birthDate: string; // "DD/MM/YYYY" หรือ "YYYY-MM-DD"
  ageYears: number;
  weight: number;
  height: number;
  bloodGroup: string;
  religion: string;
  ethnicity: string;
  nationality: string;
  address: string;
  fatherName: string;
  fatherOcc: string;
  motherName: string;
  motherOcc: string;
  guardianName: string;
  guardianRel: string;
  guardianOcc: string;
  disadvantage: string;
}

export interface SubjectConfig {
  id: string;
  code: string;         // เช่น "ท 11101"
  name: string;         // เช่น "ภาษาไทย 1"
  type: 'พื้นฐาน' | 'เพิ่มเติม' | 'กิจกรรม';
  credits: number;      // หน่วยกิต/น้ำหนัก เช่น 1.0, 0.5
  hoursPerYear: number; // ชม./ปี เช่น 160, 80
  fullScoreTerm1: number; // ปกติ 50 หรือ 100
  fullScoreTerm2: number; // ปกติ 50 หรือ 100
}

export interface StudentScoreRecord {
  studentId: string;
  // เทอม 1
  formative1: number | null; // คะแนนเก็บระหว่างภาค 1 (เช่น เต็ม 30)
  midterm1: number | null;   // กลางภาค 1 (เช่น เต็ม 10)
  final1: number | null;     // ปลายภาค 1 (เช่น เต็ม 10)
  total1: number | null;     // รวมเทอม 1 (เช่น เต็ม 50)
  // เทอม 2
  formative2: number | null; // คะแนนเก็บระหว่างภาค 2 (เต็ม 30)
  midterm2: number | null;   // กลางภาค 2 (เต็ม 10)
  final2: number | null;     // ปลายภาค 2 (เต็ม 10)
  total2: number | null;     // รวมเทอม 2 (เต็ม 50)
  // รวมทั้งปี
  yearlyTotal: number | null; // รวมทั้งปี (100)
  grade: string;              // "4", "3.5", "3", "2.5", "2", "1.5", "1", "0", "ร", "มส"
  isPassed: boolean;

  // โครงสร้างคะแนนระบบ School MIS สพฐ. 100% (ครั้งที่ 1 - 10)
  c1?: number | null;             // ครั้งที่ 1 ก่อนกลางภาค (เต็ม 10)
  c2?: number | null;             // ครั้งที่ 2 ก่อนกลางภาค (เต็ม 10)
  c3?: number | null;             // ครั้งที่ 3 ก่อนกลางภาค (เต็ม 10)
  c4?: number | null;             // ครั้งที่ 4 ก่อนกลางภาค (เต็ม 5)
  cSumPre?: number | null;        // รวมก่อนกลางภาค (เต็ม 35 = c1+c2+c3+c4)
  c5?: number | null;             // ครั้งที่ 5 กลางภาค (เต็ม 15)
  cRetakeMidterm?: number | null; // แก้ตัวกลางภาค
  c6?: number | null;             // ครั้งที่ 6 หลังกลางภาค (เต็ม 10)
  c7?: number | null;             // ครั้งที่ 7 หลังกลางภาค (เต็ม 10)
  c8?: number | null;             // ครั้งที่ 8 หลังกลางภาค (เต็ม 15)
  c9?: number | null;             // ครั้งที่ 9 หลังกลางภาค (เต็ม 0)
  cSumPost?: number | null;       // รวมหลังกลางภาค (เต็ม 35 = c6+c7+c8+c9)
  cSumFormative?: number | null;  // รวมระหว่างภาค (เต็ม 85 = cSumPre + c5 + cSumPost)
  c10?: number | null;            // ครั้งที่ 10 ปลายภาค (เต็ม 15)
}

export interface StudentAttendance {
  studentId: string;
  presentDays: number;
  leaveDays: number;
  sickDays: number;
  absentDays: number;
  totalDays: number;
  attendancePercent: number;
  hasExamEligibility: boolean; // ร้อยละ 80 ขึ้นไป
}

export interface StudentGrowthRecord {
  studentId: string;
  term: 1 | 2;
  ageMonths: number;
  weight: number;
  height: number;
  bmi: number;
  weightForHeightStatus: string; // ผอมมาก, ผอม, สมส่วน, ท้วม, เริ่มอ้วน, อ้วน
  heightForAgeStatus: string;    // สูงตามเกณฑ์, ค่อนข้างสูง, ค่อนข้างเตี้ย, เตี้ย
  weightForAgeStatus: string;    // น้ำหนักตามเกณฑ์, น้ำหนักน้อยกว่าเกณฑ์, น้ำหนักเกินเกณฑ์
}

export interface AttendanceDetail {
  present: number;
  leave: number;
  sick: number;
  absent: number;
}

export interface LearnerActivityRecord {
  guidanceHours?: number;         // กิจกรรมแนะแนว (ชั่วโมง: 40)
  guidanceResult?: 'ผ' | 'มผ';    // ผลประเมินแนะแนว
  scoutHours?: number;            // ลูกเสือ เนตรนารี (ชั่วโมง: 40)
  scoutResult?: 'ผ' | 'มผ';       // ผลประเมินลูกเสือ
  clubName?: string;              // ชื่อชุมนุมประจำชั้น (เช่น ชุมนุมศิลป์สร้างสรรค์, ชุมนุมสื่อ AI สร้างสรรค์)
  clubHours?: number;             // ชุมนุม (ชั่วโมง: 30 หรือ 40)
  clubResult?: 'ผ' | 'มผ';        // ผลประเมินชุมนุม
  publicServiceHours?: number;    // กิจกรรมเพื่อสังคมและสาธารณประโยชน์ (ชั่วโมง: 10)
  publicServiceResult?: 'ผ' | 'มผ'; // ผลประเมินเพื่อสังคมและสาธารณประโยชน์
}

export interface HolisticDetail {
  traitsScore: number;       // 0-3
  competencyScore: number;   // 0-3
  readingWriting: 'ดีเยี่ยม' | 'ดี' | 'ผ่าน' | 'ไม่ผ่าน';
  activityPassed: boolean;
  activities?: LearnerActivityRecord; // กิจกรรมพัฒนาผู้เรียน 4 กิจกรรม (ตาม ปพ.1/ปพ.5/ปพ.6)
}

export type PrintDocumentMode = 
  | 'pp6'             // ปพ.6 สมุดรายงานผลรายบุคคล
  | 'pp5_class'       // ปพ.5 สรุปผลรายชั้นเรียน (รวมทุกวิชา + GPA + ลำดับที่)
  | 'pp5_subject'     // ปพ.5 แบบบันทึกคะแนนรายวิชา (ครูผู้สอนส่งวิชาการ)
  | 'pp5_cover'       // ปก ปพ.5 ทางการ (ตราครุฑ)
  | 'pp5_attendance'  // ปพ.5 บัญชีเวลาเรียน
  | 'pp5_holistic'    // ปพ.5 คุณลักษณะ & สมรรถนะ & กิจกรรม
  | 'pp5_health'      // ปพ.5 บันทึกสุขภาพและการเจริญเติบโต (ht/age)
  | 'certificate';    // เกียรติบัตรนักเรียนคะแนนสูงสุดรายวิชา & เรียนดีเด่น

