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

export interface HolisticDetail {
  traitsScore: number;       // 0-3
  competencyScore: number;   // 0-3
  readingWriting: 'ดีเยี่ยม' | 'ดี' | 'ผ่าน' | 'ไม่ผ่าน';
  activityPassed: boolean;
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

