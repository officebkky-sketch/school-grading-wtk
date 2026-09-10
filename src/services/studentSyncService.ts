// src/services/studentSyncService.ts
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { StudentProfile, SubjectConfig, StudentScoreRecord, AcademicConfig, AttendanceDetail, HolisticDetail } from '../types/pp5Types';
import { TeacherProfile } from '../data/teachersData';
import { INITIAL_ROSTER } from '../data/initialRosterData';
import { CLASS_SUBJECTS_MAP } from '../data/classSubjectsData';
import { INITIAL_SCORES } from '../data/initialScoresData';
import { GradingEngine } from '../engines/gradingEngine';
import { GrowthEngine } from '../engines/growthEngine';
import { calculateStudentAge, formatThaiBirthDate } from '../utils/studentDateUtils';

export interface StudentOnlineResult {
  student: StudentProfile;
  classLevel: string;
  academicYear: string;
  subjectsWithGrades: {
    subject: SubjectConfig;
    scoreRecord: StudentScoreRecord | null;
  }[];
  gpa: number;
  totalCredits: number;
  passedCredits: number;
  attendancePercent: number;
  attendanceEligible: boolean;
  nutrition: {
    bmi: number;
    weightForHeight: string;
    heightForAge: string;
    weightForAge: string;
    summaryStatus: string;
  };
  holistic: {
    traitsResult: string;
    competenciesResult: string;
    readingWritingResult: string;
    activityResult: string;
  };
}

export class StudentSyncService {
  /**
   * ดึงข้อมูลนักเรียนที่มีตัวตนอยู่จริงจากระบบหลัก (Supabase)
   * กรองนักเรียนที่ย้ายสถานศึกษาออกโดยอัตโนมัติ
   */
  public static async fetchActiveStudentsFromSupabase(): Promise<Record<string, StudentProfile[]> | null> {
    if (!isSupabaseConfigured || !supabase) {
      return null;
    }

    try {
      // ดึงนักเรียนทั้งหมดจากระบบหลัก
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('class_level', { ascending: true })
        .order('student_id', { ascending: true });

      if (error) throw error;
      if (!data || data.length === 0) return null;

      // กรองเฉพาะนักเรียนที่มีตัวตนอยู่จริง (ไม่ย้ายสถานศึกษา)
      const activeRows = data.filter((row: any) => {
        const gradStatus = (row.graduation_status || '').trim();
        return gradStatus !== 'ย้ายสถานศึกษา' && gradStatus !== 'ย้าย' && gradStatus !== 'จำหน่าย' && gradStatus !== 'ลาออก';
      });

      // จัดกลุ่มตามระดับชั้น (เช่น "ป.1", "ป.2", "อ.2")
      const grouped: Record<string, StudentProfile[]> = {};

      activeRows.forEach((row: any) => {
        let cls = row.class_level?.trim() || 'ป.1';
        if (!cls.startsWith('ป.') && !cls.startsWith('อ.') && !cls.startsWith('ม.')) {
          if (cls.includes('ประถม')) cls = 'ป.' + cls.replace(/\D/g, '');
          else if (cls.includes('อนุบาล')) cls = 'อ.' + cls.replace(/\D/g, '');
        }

        if (!grouped[cls]) {
          grouped[cls] = [];
        }

        const seq = grouped[cls].length + 1;
        const profile: StudentProfile = {
          id: row.id ? `stu_${row.student_id || row.id}` : `stu_${row.student_id}`,
          seq,
          studentId: String(row.student_id || '').trim(),
          nationalId: String(row.national_id || '').trim(),
          prefix: row.prefix?.trim() || '',
          firstName: row.first_name?.trim() || '',
          lastName: row.last_name?.trim() || '',
          gender: (row.gender === 'หญิง' || row.gender === 'ญ') ? 'ญ' : 'ช',
          birthDate: row.birth_date ? formatThaiBirthDate(row.birth_date, 'short') : '',
          ageYears: calculateStudentAge(row.birth_date, cls),
          weight: Number(row.weight) || 0,
          height: Number(row.height) || 0,
          bloodGroup: row.blood_group || '-',
          religion: row.religion || 'พุทธ',
          ethnicity: row.ethnicity || 'ไทย',
          nationality: row.nationality || 'ไทย',
          address: [
            row.address_no ? `บ้านเลขที่ ${row.address_no}` : '',
            row.moo ? `ม.${row.moo}` : '',
            row.sub_district ? `ต.${row.sub_district}` : '',
            row.district ? `อ.${row.district}` : '',
            row.province ? `จ.${row.province}` : ''
          ].filter(Boolean).join(' '),
          fatherName: `${row.father_first_name || ''} ${row.father_last_name || ''}`.trim(),
          fatherOcc: row.father_occupation || '-',
          motherName: `${row.mother_first_name || ''} ${row.mother_last_name || ''}`.trim(),
          motherOcc: row.mother_occupation || '-',
          guardianName: `${row.parent_first_name || ''} ${row.parent_last_name || ''}`.trim(),
          guardianRel: row.parent_relation || 'ผู้ปกครอง',
          guardianOcc: row.parent_occupation || '-',
          disadvantage: row.disadvantage_status || '-'
        };

        grouped[cls].push(profile);
      });

      // เรียงลำดับนักเรียนตามมาตรฐาน SchoolMIS สพฐ. 100%
      // 1. เพศชาย (ช/ด.ช./นาย) มาก่อน เพศหญิง (ญ/ด.ญ./นางสาว)
      // 2. ภายในเพศเดียวกัน เรียงตามรหัสนักเรียน (studentId) จากน้อยไปมาก
      Object.keys(grouped).forEach(cls => {
        grouped[cls].sort((a, b) => {
          const isMaleA = a.gender === 'ช' || a.gender === 'ชาย' || a.prefix.includes('ชาย') || a.prefix.includes('ด.ช.') || a.prefix.includes('นาย');
          const isMaleB = b.gender === 'ช' || b.gender === 'ชาย' || b.prefix.includes('ชาย') || b.prefix.includes('ด.ช.') || b.prefix.includes('นาย');

          if (isMaleA && !isMaleB) return -1;
          if (!isMaleA && isMaleB) return 1;

          const numA = parseInt(a.studentId.replace(/\D/g, ''), 10) || 0;
          const numB = parseInt(b.studentId.replace(/\D/g, ''), 10) || 0;
          return numA - numB;
        });

        // กำหนดเลขที่ (seq) เริ่มต้นจาก 1 ต่อเนื่องกัน
        grouped[cls].forEach((stu, idx) => {
          stu.seq = idx + 1;
        });
      });

      return grouped;
    } catch (err) {
      console.warn('Cannot fetch students from Supabase, fallback to local roster:', err);
      return null;
    }
  }

  /**
   * ค้นหาและตรวจสอบผลการเรียนออนไลน์สำหรับนักเรียนและผู้ปกครอง
   * กรอก: เลขประจำตัวประชาชน (13 หลัก) + รหัสผ่าน: เลขประจำตัวนักเรียน
   * อิงข้อมูลนักเรียนที่มีตัวตนอยู่จริง หากย้ายสถานศึกษาจะไม่แสดงผล
   */
  public static async queryOnlineGradeResult(
    nationalId: string,
    studentId: string,
    localStudents: Record<string, StudentProfile[]>,
    localScores: Record<string, Record<string, Record<string, StudentScoreRecord>>>,
    localClassSubjects: Record<string, SubjectConfig[]>,
    academicYear: string = '2569',
    localAttendance?: Record<string, Record<string, AttendanceDetail>>,
    localHolistic?: Record<string, Record<string, HolisticDetail>>
  ): Promise<{ success: boolean; data?: StudentOnlineResult; message: string }> {
    const cleanNationalId = nationalId.trim().replace(/\D/g, '');
    const cleanStudentId = studentId.trim();

    if (!cleanNationalId || !cleanStudentId) {
      return { success: false, message: 'กรุณากรอกเลขประจำตัวประชาชน และรหัสผ่าน (เลขประจำตัวนักเรียน) ให้ครบถ้วน' };
    }

    if (cleanNationalId.length !== 13) {
      return { success: false, message: 'เลขประจำตัวประชาชนต้องมี 13 หลัก' };
    }

    // 1. ตรวจสอบข้อมูลนักเรียนและสถานะจาก Supabase ก่อน (ถ้าออนไลน์)
    let foundStudent: StudentProfile | null = null;
    let foundClassLevel: string = '';

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: dbStudent, error } = await supabase
          .from('students')
          .select('*')
          .eq('national_id', cleanNationalId)
          .eq('student_id', cleanStudentId)
          .maybeSingle();

        if (error) throw error;

        if (dbStudent) {
          const grad = (dbStudent.graduation_status || '').trim();
          if (grad === 'ย้ายสถานศึกษา' || grad === 'ย้าย' || grad === 'จำหน่าย' || grad === 'ลาออก') {
            return {
              success: false,
              message: 'ไม่พบข้อมูลผลการเรียนในสถานะกำลังศึกษาปัจจุบัน (นักเรียนมีสถานะย้ายสถานศึกษาหรือจำหน่ายออกจากระบบแล้ว)'
            };
          }

          let cls = dbStudent.class_level?.trim() || 'ป.1';
          if (!cls.startsWith('ป.') && !cls.startsWith('อ.') && !cls.startsWith('ม.')) {
            if (cls.includes('ประถม')) cls = 'ป.' + cls.replace(/\D/g, '');
            else if (cls.includes('อนุบาล')) cls = 'อ.' + cls.replace(/\D/g, '');
          }
          foundClassLevel = cls;

          foundStudent = {
            id: dbStudent.id ? `stu_${dbStudent.student_id || dbStudent.id}` : `stu_${dbStudent.student_id}`,
            seq: 1,
            studentId: String(dbStudent.student_id || '').trim(),
            nationalId: String(dbStudent.national_id || '').trim(),
            prefix: dbStudent.prefix?.trim() || '',
            firstName: dbStudent.first_name?.trim() || '',
            lastName: dbStudent.last_name?.trim() || '',
            gender: (dbStudent.gender === 'หญิง' || dbStudent.gender === 'ญ') ? 'ญ' : 'ช',
            birthDate: dbStudent.birth_date ? formatThaiBirthDate(dbStudent.birth_date, 'short') : '',
            ageYears: calculateStudentAge(dbStudent.birth_date, cls),
            weight: Number(dbStudent.weight) || 0,
            height: Number(dbStudent.height) || 0,
            bloodGroup: dbStudent.blood_group || '-',
            religion: dbStudent.religion || 'พุทธ',
            ethnicity: dbStudent.ethnicity || 'ไทย',
            nationality: dbStudent.nationality || 'ไทย',
            address: [
              dbStudent.address_no ? `บ้านเลขที่ ${dbStudent.address_no}` : '',
              dbStudent.moo ? `ม.${dbStudent.moo}` : '',
              dbStudent.sub_district ? `ต.${dbStudent.sub_district}` : '',
              dbStudent.district ? `อ.${dbStudent.district}` : '',
              dbStudent.province ? `จ.${dbStudent.province}` : ''
            ].filter(Boolean).join(' '),
            fatherName: `${dbStudent.father_first_name || ''} ${dbStudent.father_last_name || ''}`.trim(),
            fatherOcc: dbStudent.father_occupation || '-',
            motherName: `${dbStudent.mother_first_name || ''} ${dbStudent.mother_last_name || ''}`.trim(),
            motherOcc: dbStudent.mother_occupation || '-',
            guardianName: `${dbStudent.parent_first_name || ''} ${dbStudent.parent_last_name || ''}`.trim(),
            guardianRel: dbStudent.parent_relation || 'ผู้ปกครอง',
            guardianOcc: dbStudent.parent_occupation || '-',
            disadvantage: dbStudent.disadvantage_status || '-'
          };
        }
      } catch (e) {
        console.warn('Error checking student status on Supabase:', e);
      }
    }

    // 2. หากไม่พบใน Supabase ให้ค้นหาใน Local State สำรอง (Offline-First)
    if (!foundStudent) {
      for (const [cls, list] of Object.entries(localStudents)) {
        const match = list.find(s => s.nationalId === cleanNationalId && s.studentId === cleanStudentId);
        if (match) {
          foundStudent = match;
          foundClassLevel = cls;
          break;
        }
      }
    }

    // ถ้ายังไม่พบ ลองหาใน INITIAL_ROSTER สำรอง
    if (!foundStudent) {
      for (const [cls, list] of Object.entries(INITIAL_ROSTER)) {
        const match = list.find(s => s.nationalId === cleanNationalId && s.studentId === cleanStudentId);
        if (match) {
          foundStudent = match;
          foundClassLevel = cls;
          break;
        }
      }
    }

    if (!foundStudent) {
      return {
        success: false,
        message: 'ไม่พบข้อมูลนักเรียน หรือเลขประจำตัวประชาชน/รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง'
      };
    }

    // 3. รวบรวมรายวิชาและคะแนนของนักเรียน (ดึงจาก Supabase Cloud ก่อนเสมอหากออนไลน์)
    let subjectsWithGrades: { subject: SubjectConfig; scoreRecord: StudentScoreRecord | null }[] = [];
    let cloudGradesFound = false;

    if (isSupabaseConfigured && supabase) {
      try {
        const [gradesRes, subjectsRes, healthRes] = await Promise.all([
          supabase
            .from('student_grades')
            .select('*')
            .eq('student_id', cleanStudentId)
            .eq('academic_year', academicYear),
          supabase
            .from('subjects')
            .select('*')
            .eq('class_level', foundClassLevel)
            .eq('academic_year', academicYear),
          supabase
            .from('student_health_growth')
            .select('*')
            .eq('student_id', cleanStudentId)
            .eq('academic_year', academicYear)
            .order('semester', { ascending: false })
            .limit(1)
        ]);

        const dbGrades = gradesRes.data;
        const dbSubjects = subjectsRes.data;
        const dbHealth = healthRes.data?.[0];

        if (dbHealth && foundStudent) {
          if (dbHealth.weight) foundStudent.weight = Number(dbHealth.weight);
          if (dbHealth.height) foundStudent.height = Number(dbHealth.height);
        }

        if (dbGrades && dbGrades.length > 0) {
          cloudGradesFound = true;
          const normCode = (c: string) => (c || '').replace(/\s+/g, '').toUpperCase();
          const localSubs = localClassSubjects[foundClassLevel] || CLASS_SUBJECTS_MAP[foundClassLevel] || [];

          // กรองและ Deduplicate รายวิชาจาก Supabase พร้อมตัดวิชาที่ถูกลบออกไปแล้ว
          let activeSubjects: SubjectConfig[] = [];
          if (dbSubjects && dbSubjects.length > 0) {
            const seenCodes = new Set<string>();
            const mappedSubs: SubjectConfig[] = [];

            for (const s of dbSubjects) {
              const nc = normCode(s.code);
              if (seenCodes.has(nc)) continue; // ข้ามวิชาซ้ำ
              seenCodes.add(nc);

              const matchLocal = localSubs.find(ls => normCode(ls.code) === nc || ls.id === s.id);

              // หากใน localClassSubjects มีรายวิชาที่กำหนดไว้เฉพาะ (และไม่ใช่ CLASS_SUBJECTS_MAP ค่าเริ่มต้น)
              // และวิชานี้ไม่ได้อยู่ใน localClassSubjects แสดงว่าเป็นวิชาที่ถูกลบออกไปแล้ว! ให้ข้าม ไม่นำมาแสดงผล
              if (localClassSubjects[foundClassLevel] && localClassSubjects[foundClassLevel].length > 0) {
                const isStillActiveInLocal = localClassSubjects[foundClassLevel].some(
                  ls => normCode(ls.code) === nc || ls.id === s.id
                );
                if (!isStillActiveInLocal) {
                  continue; // ข้ามวิชาที่ถูกลบออกไปแล้ว
                }
              }

              mappedSubs.push({
                id: s.id,
                code: s.code?.trim() || matchLocal?.code || '',
                name: s.name?.trim() || matchLocal?.name || '',
                type: (s.type || matchLocal?.type || 'พื้นฐาน') as any,
                credits: Number(s.credits) || matchLocal?.credits || 1,
                hoursPerYear: Number(s.hours_per_year) || matchLocal?.hoursPerYear || 80,
                fullScoreTerm1: Number(s.full_score_term1) || matchLocal?.fullScoreTerm1 || 50,
                fullScoreTerm2: Number(s.full_score_term2) || matchLocal?.fullScoreTerm2 || 50
              });
            }
            activeSubjects = mappedSubs;
          } else {
            activeSubjects = localSubs;
          }

          subjectsWithGrades = activeSubjects.map(sub => {
            const subNorm = normCode(sub.code);
            const gRow = dbGrades.find((g: any) => {
              if (g.subject_id === sub.id) return true;
              if (sub.code && g.subject_id === sub.code.trim()) return true;
              if (subNorm && normCode(g.subject_id) === subNorm) return true;
              const matchedDbSub = dbSubjects?.find((ds: any) => ds.id === g.subject_id);
              if (matchedDbSub && normCode(matchedDbSub.code) === subNorm) return true;
              return false;
            });
            const scoreRecord: StudentScoreRecord | null = gRow ? {
              studentId: cleanStudentId,
              formative1: gRow.formative1,
              midterm1: gRow.midterm1,
              final1: gRow.final1,
              total1: gRow.total1,
              formative2: gRow.formative2,
              midterm2: gRow.midterm2,
              final2: gRow.final2,
              total2: gRow.total2,
              yearlyTotal: gRow.yearly_total,
              grade: gRow.grade || '-',
              isPassed: gRow.is_passed ?? true
            } : null;

            return {
              subject: sub,
              scoreRecord
            };
          });
        }
      } catch (err) {
        console.warn('Error fetching grades from Supabase, falling back to local scores:', err);
      }
    }

    // ถ้าไม่มีข้อมูลคะแนนบน Cloud ให้ Fallback ไปหาใน Local Scores
    if (!cloudGradesFound) {
      const subjects = localClassSubjects[foundClassLevel] || CLASS_SUBJECTS_MAP[foundClassLevel] || [];
      const classScores = localScores[foundClassLevel] || INITIAL_SCORES[foundClassLevel] || {};

      subjectsWithGrades = subjects.map(sub => {
        const rec = classScores[sub.id]?.[foundStudent!.studentId] || null;
        return {
          subject: sub,
          scoreRecord: rec
        };
      });
    }

    // คำนวณ GPA
    const gradeList: { grade: string; credits: number }[] = [];
    let totalCredits = 0;
    let passedCredits = 0;

    subjectsWithGrades.forEach(item => {
      const g = item.scoreRecord?.grade;
      if (item.subject.credits > 0) {
        totalCredits += item.subject.credits;
        if (g && g !== '-' && g !== '0' && g !== 'ร' && g !== 'มส') {
          passedCredits += item.subject.credits;
        }
        if (g && g !== '-') {
          gradeList.push({ grade: g, credits: item.subject.credits });
        }
      }
    });

    const gpa = gradeList.length > 0 ? GradingEngine.calculateGPA(gradeList) : 0.0;

    // คำนวณอายุที่ถูกต้องแท้จริงตามวันเดือนปีเกิด
    const realAge = calculateStudentAge(foundStudent.birthDate, foundClassLevel) || foundStudent.ageYears || 7;
    foundStudent.ageYears = realAge;

    // ประเมินภาวะโภชนาการตามอายุจริง
    const nutritionEval = GrowthEngine.evaluateGrowth(
      foundStudent.gender,
      realAge,
      foundStudent.weight || 0,
      foundStudent.height || 0
    );

    // คำนวณเวลาเรียนจาก attendanceStore จริง
    const attRec = localAttendance?.[foundClassLevel]?.[foundStudent.studentId];
    let attPercent = 98.0;
    let attEligible = true;
    if (attRec && (attRec.present + attRec.leave + attRec.sick + attRec.absent) > 0) {
      const totalRecorded = attRec.present + attRec.leave + attRec.sick + attRec.absent;
      attPercent = Math.round((attRec.present / totalRecorded) * 1000) / 10;
      attEligible = attPercent >= 80;
    }

    // ข้อมูลคุณลักษณะจาก holisticStore จริง
    const holRec = localHolistic?.[foundClassLevel]?.[foundStudent.studentId];
    const traitsLabel = holRec ? (holRec.traitsScore === 3 ? 'ดีเยี่ยม' : holRec.traitsScore === 2 ? 'ดี' : holRec.traitsScore === 1 ? 'ผ่าน' : 'ไม่ผ่าน') : 'ดีเยี่ยม';
    const compLabel = holRec ? (holRec.competencyScore === 3 ? 'ดีเยี่ยม' : holRec.competencyScore === 2 ? 'ดี' : holRec.competencyScore === 1 ? 'ผ่าน' : 'ไม่ผ่าน') : 'ดีเยี่ยม';
    const rwLabel = holRec?.readingWriting || 'ดีเยี่ยม';
    const actLabel = holRec ? (holRec.activityPassed ? 'ผ่าน' : 'ไม่ผ่าน') : 'ผ่าน';

    // ผลการประเมินรอบด้าน (Holistic) & เวลาเรียน
    const result: StudentOnlineResult = {
      student: foundStudent,
      classLevel: foundClassLevel,
      academicYear,
      subjectsWithGrades,
      gpa,
      totalCredits,
      passedCredits,
      attendancePercent: attPercent,
      attendanceEligible: attEligible,
      nutrition: {
        bmi: nutritionEval.bmi,
        weightForHeight: nutritionEval.weightForHeight,
        heightForAge: nutritionEval.heightForAge,
        weightForAge: nutritionEval.weightForAge,
        summaryStatus: nutritionEval.summaryStatus
      },
      holistic: {
        traitsResult: traitsLabel,
        competenciesResult: compLabel,
        readingWritingResult: rwLabel,
        activityResult: actLabel
      }
    };

    return {
      success: true,
      data: result,
      message: `ค้นพบข้อมูลผลการเรียนของ ${foundStudent.prefix}${foundStudent.firstName} ${foundStudent.lastName}`
    };
  }

  /**
   * ดึงข้อมูลการแต่งตั้งครูประจำชั้นจากตาราง teacher_duties ในระบบหลัก (Supabase)
   */
  public static async fetchHomeroomAssignmentsFromSupabase(): Promise<{
    classTeacherMap: Record<string, string>;
    classAllTeachersMap: Record<string, string[]>;
    classTeacherSigMap: Record<string, string>;
    teacherNameSigMap: Record<string, string>;
    teachers: TeacherProfile[];
  } | null> {
    if (!isSupabaseConfigured || !supabase) {
      return null;
    }

    try {
      // 1. ดึงครูทั้งหมด
      const { data: teacherRows, error: tErr } = await supabase
        .from('teachers')
        .select('*');
      if (tErr) throw tErr;

      // 2. ดึง duties ประเภทครูประจำชั้น (ถ้ามี)
      let duties: any[] = [];
      try {
        const { data: dData } = await supabase
          .from('teacher_duties')
          .select('*')
          .in('duty_type', ['ครูประจำชั้น', 'ครูประจำชั้นหลัก', 'ครูประจำชั้นร่วม', 'ครูพี่เลี้ยง']);
        if (dData) duties = dData;
      } catch (dErr) {
        console.warn('Could not query teacher_duties:', dErr);
      }

      if (!teacherRows || teacherRows.length === 0) return null;

      // 3. ดึงข้อมูลลายเซ็นครู (signature_url) จากตาราง profiles ในระบบหลัก
      let profileRows: any[] = [];
      try {
        const { data: pRows } = await supabase
          .from('profiles')
          .select('id, email, display_name, signature_url');
        if (pRows) profileRows = pRows;
      } catch (pErr) {
        console.warn('Profiles query failed or restricted by RLS:', pErr);
      }

      // Helper ค้นหาลายเซ็นของครูจาก profiles
      const findTeacherSignature = (t: any): string => {
        // 1. เช็คจาก user_id
        if (t.user_id) {
          const matched = profileRows.find(p => p.id === t.user_id && p.signature_url);
          if (matched?.signature_url) return matched.signature_url;
        }
        // 2. เช็คจาก email
        if (t.email) {
          const emailClean = t.email.toLowerCase().trim();
          const matched = profileRows.find(p => p.email && p.email.toLowerCase().trim() === emailClean && p.signature_url);
          if (matched?.signature_url) return matched.signature_url;
        }
        // 3. เช็คจากชื่อ-นามสกุล (display_name)
        const tFirst = (t.first_name || '').trim();
        const tLast = (t.last_name || '').trim();
        if (tFirst) {
          const matched = profileRows.find(p => {
            if (!p.signature_url || !p.display_name) return false;
            return p.display_name.includes(tFirst) || (tLast && p.display_name.includes(tLast));
          });
          if (matched?.signature_url) return matched.signature_url;
        }
        return '';
      };

      const teacherMap: Record<string, { id: string; name: string; position: string; phone?: string; signatureUrl?: string }> = {};
      (teacherRows || []).forEach((t: any) => {
        const sigUrl = findTeacherSignature(t);
        teacherMap[t.id] = {
          id: t.id,
          name: `${t.prefix || ''}${t.first_name || ''} ${t.last_name || ''}`.trim(),
          position: t.position || '',
          phone: t.phone || '',
          signatureUrl: sigUrl || undefined
        };
      });

      const classTeacherMap: Record<string, string> = {};
      const classTeacherSigMap: Record<string, string> = {};
      const teacherNameSigMap: Record<string, string> = {};
      const classAllTeachersMap: Record<string, string[]> = {};
      const teacherClassAssignments: Record<string, string[]> = {};

      // รวบรวมลายเซ็นครูตามชื่อ
      Object.values(teacherMap).forEach(t => {
        if (t.name && t.signatureUrl) {
          teacherNameSigMap[t.name] = t.signatureUrl;
        }
      });
      profileRows.forEach(p => {
        if (p.display_name && p.signature_url) {
          teacherNameSigMap[p.display_name.trim()] = p.signature_url;
        }
      });

      duties.forEach((d: any) => {
        const cls = (d.duty_day || '').trim();
        const teacherObj = teacherMap[d.teacher_id];
        const teacherName = teacherObj ? teacherObj.name : '';
        const teacherSig = teacherObj?.signatureUrl || '';

        if (cls && teacherName) {
          if (!classAllTeachersMap[cls]) classAllTeachersMap[cls] = [];
          if (!classAllTeachersMap[cls].includes(teacherName)) {
            classAllTeachersMap[cls].push(teacherName);
          }

          // ครูประจำชั้นหลัก เป็นค่า default สำหรับหัวเอกสาร ปพ.
          if (d.duty_type.includes('หลัก') || !classTeacherMap[cls]) {
            classTeacherMap[cls] = teacherName;
            if (teacherSig) {
              classTeacherSigMap[cls] = teacherSig;
            }
          }

          if (!teacherClassAssignments[d.teacher_id]) {
            teacherClassAssignments[d.teacher_id] = [];
          }
          if (!teacherClassAssignments[d.teacher_id].includes(cls)) {
            teacherClassAssignments[d.teacher_id].push(cls);
          }
        }
      });

      // สร้าง TeacherProfile list สำหรับล็อกอินและแสดงผล
      const teachers: TeacherProfile[] = (teacherRows || []).map((t: any) => {
        const isDirector = ((t.position || '').includes('ผู้อำนวยการ') || (t.position || '').includes('ผอ.') || (t.first_name || '').includes('เอกคณิต') || (t.first_name || '').includes('จันทวรรณ')) && !(t.position || '').includes('รอง');
        const isAcademicHead = (t.position || '').includes('วิชาการ') || (t.first_name || '').includes('วัชรี') || (t.first_name || '').includes('สุมาวดี');
        const isAdmin = (t.position || '').includes('ธุรการ') || (t.position || '').includes('สารสนเทศ') || (t.first_name || '').includes('อดิศักดิ์') || (t.first_name || '').includes('ไพโรจน์');
        const hasAllAccess = isDirector || isAcademicHead || isAdmin;
        const assigned = hasAllAccess 
          ? ['*'] 
          : (teacherClassAssignments[t.id] || []);
        
        return {
          id: t.id,
          name: `${(t.prefix || '').trim()}${(t.first_name || '').trim()} ${(t.last_name || '').trim()}`.replace(/\s+/g, ' ').trim(),
          role: isDirector ? 'director' : (isAcademicHead || isAdmin ? 'academic_head' : 'homeroom_teacher'),
          roleTitle: t.position || (isDirector ? 'ผู้อำนวยการโรงเรียน' : (assigned.length > 0 && !hasAllAccess ? `ครูประจำชั้น ${assigned.join(', ')}` : 'ครูผู้สอน')),
          assignedClasses: assigned,
          phoneNumber: t.phone || undefined,
          signatureUrl: findTeacherSignature(t) || undefined
        };
      });

      // นำผู้อำนวยการขึ้นอันดับ 1 ตามด้วยหัวหน้าฝ่ายวิชาการ แล้วตามด้วยครูผู้สอน
      teachers.sort((a, b) => {
        if (a.role === 'director') return -1;
        if (b.role === 'director') return 1;
        if (a.role === 'academic_head') return -1;
        if (b.role === 'academic_head') return 1;
        return a.name.localeCompare(b.name, 'th');
      });

      return {
        classTeacherMap,
        classAllTeachersMap,
        classTeacherSigMap,
        teacherNameSigMap,
        teachers
      };
    } catch (err) {
      console.warn('Could not fetch homeroom duties from Supabase:', err);
      return null;
    }
  }

  /**
   * ดึงข้อมูลการตั้งค่าโรงเรียนและตราสัญลักษณ์ (School Logo & Branding) จากระบบหลัก
   */
  public static async fetchSchoolSettingsFromSupabase(): Promise<{
    schoolName?: string;
    schoolLogoUrl?: string;
    directorName?: string;
    directorSignatureUrl?: string;
  } | null> {
    if (!isSupabaseConfigured || !supabase) return null;
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('school_name, school_logo_url, director_name, director_signature_url')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      // strip prefix "โรงเรียน" ออกเพื่อป้องกัน "โรงเรียนโรงเรียน..." ใน template
      const rawName: string = data.school_name || '';
      const cleanSchoolName = rawName.startsWith('โรงเรียน') ? rawName.slice('โรงเรียน'.length).trim() : rawName;
      return {
        schoolName: cleanSchoolName || undefined,
        schoolLogoUrl: data.school_logo_url || undefined,
        directorName: data.director_name || undefined,
        directorSignatureUrl: data.director_signature_url || undefined
      };
    } catch (err) {
      console.warn('Could not fetch school settings from Supabase:', err);
      return null;
    }
  }
}
