// src/components/CertificateVerifyPage.tsx
// หน้าตรวจสอบเกียรติบัตรดิจิทัล — เข้าถึงผ่าน QR Code สแกน
// URL Pattern: ?verify=1&nid=XXXXX&sid=YYYY&type=subject&subjectId=ZZZ
//              ?verify=1&nid=XXXXX&sid=YYYY&type=gpa&rank=1
import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import {
  CheckCircle2,
  XCircle,
  Award,
  Trophy,
  Loader2,
  School,
  Calendar,
  ShieldCheck,
  BookOpen,
  GraduationCap
} from 'lucide-react';

interface VerifyParams {
  nid: string;         // เลขประจำตัวประชาชน 13 หลัก
  sid: string;         // รหัสนักเรียน
  type: 'subject' | 'gpa' | '';
  subjectId?: string;  // สำหรับ type=subject
  rank?: string;       // สำหรับ type=gpa (1,2,3)
  certNo?: string;     // เลขที่เกียรติบัตร (optional)
}

interface VerifyResult {
  status: 'verified' | 'not_found' | 'error';
  studentName: string;
  classLevel: string;
  academicYear: string;
  schoolName: string;
  certType: string;
  certDetail: string;
  score?: number;
  fullScore?: number;
  gpa?: number;
  issuedDate: string;
  directorName: string;
  schoolLogoUrl?: string;
}

// แปลงตัวเลขอารบิกเป็นเลขไทย
const toThaiNum = (n: number | string) => {
  const d = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
  return String(n).replace(/[0-9]/g, (x) => d[parseInt(x, 10)]);
};

async function verifyCertificate(params: VerifyParams): Promise<VerifyResult> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('ระบบออฟไลน์ — ไม่สามารถตรวจสอบได้');
  }

  // 1. ค้นหานักเรียน
  const { data: studentData, error: studentErr } = await supabase
    .from('students')
    .select('*')
    .eq('national_id', params.nid)
    .eq('student_id', params.sid)
    .maybeSingle();

  if (studentErr) throw studentErr;
  if (!studentData) {
    return {
      status: 'not_found',
      studentName: '',
      classLevel: '',
      academicYear: '',
      schoolName: '',
      certType: '',
      certDetail: 'ไม่พบข้อมูลนักเรียนในระบบ',
      issuedDate: '',
      directorName: ''
    };
  }

  // 2. ดึง settings โรงเรียน
  const { data: settings } = await supabase
    .from('settings')
    .select('school_name, director_name, academic_year, school_logo_url')
    .limit(1)
    .maybeSingle();

  const rawSchoolName: string = settings?.school_name || 'วัดท่าควาย';
  const cleanSchoolName = rawSchoolName.startsWith('โรงเรียน')
    ? rawSchoolName.slice('โรงเรียน'.length).trim()
    : rawSchoolName;
  const directorName = settings?.director_name || 'นางจันทวรรณ พิทักษ์ฉนวน';
  const academicYear = settings?.academic_year || '2569';

  const fullName = `${studentData.prefix || ''}${studentData.first_name} ${studentData.last_name}`;
  const classLevel = studentData.class_level || '';

  if (params.type === 'subject' && params.subjectId) {
    // 3a. ตรวจสอบเกียรติบัตรคะแนนสูงสุดรายวิชา
    const { data: scoreData } = await supabase
      .from('scores')
      .select('subject_id, yearly_total, total1, total2, grade')
      .eq('student_id', params.sid)
      .eq('class_level', classLevel)
      .eq('subject_id', params.subjectId)
      .maybeSingle();

    // ดึงรายชื่อวิชา
    const { data: subjectData } = await supabase
      .from('subjects')
      .select('name, code, class_level')
      .eq('id', params.subjectId)
      .maybeSingle();

    if (!scoreData || !subjectData) {
      return {
        status: 'not_found',
        studentName: fullName,
        classLevel,
        academicYear,
        schoolName: cleanSchoolName,
        certType: 'เกียรติบัตรคะแนนยอดเยี่ยมประจำรายวิชา',
        certDetail: 'ไม่พบข้อมูลคะแนนวิชานี้',
        issuedDate: `31 มีนาคม ${academicYear}`,
        directorName,
        schoolLogoUrl: settings?.school_logo_url
      };
    }

    const studentScore = scoreData.yearly_total ?? scoreData.total1 ?? 0;

    // ตรวจสอบว่าคะแนนนี้สูงสุดในชั้นจริงๆ
    const { data: allScores } = await supabase
      .from('scores')
      .select('student_id, yearly_total, total1')
      .eq('subject_id', params.subjectId)
      .eq('class_level', classLevel);

    const maxScore = Math.max(...(allScores || []).map((r: any) => r.yearly_total ?? r.total1 ?? 0));
    const isTopScorer = studentScore >= maxScore && studentScore > 0;

    return {
      status: isTopScorer ? 'verified' : 'not_found',
      studentName: fullName,
      classLevel,
      academicYear,
      schoolName: cleanSchoolName,
      certType: 'เกียรติบัตรคะแนนยอดเยี่ยมประจำรายวิชา',
      certDetail: isTopScorer
        ? `วิชา ${subjectData.code} ${subjectData.name}`
        : 'คะแนนไม่ตรงกับเกียรติบัตรที่ออก',
      score: studentScore,
      fullScore: 100,
      issuedDate: `31 มีนาคม ${academicYear}`,
      directorName,
      schoolLogoUrl: settings?.school_logo_url
    };
  } else if (params.type === 'gpa') {
    // 3b. ตรวจสอบเกียรติบัตรเรียนดีเด่น
    const { data: allStudentScores } = await supabase
      .from('scores')
      .select('student_id, subject_id, grade, yearly_total, total1')
      .eq('class_level', classLevel);

    if (!allStudentScores) {
      return {
        status: 'not_found',
        studentName: fullName,
        classLevel,
        academicYear,
        schoolName: cleanSchoolName,
        certType: 'เกียรติบัตรผลการเรียนดีเด่น',
        certDetail: 'ไม่พบข้อมูลคะแนนในระบบ',
        issuedDate: `31 มีนาคม ${academicYear}`,
        directorName,
        schoolLogoUrl: settings?.school_logo_url
      };
    }

    // คำนวณ GPA ของนักเรียนทุกคน
    const studentGpaMap: Record<string, number> = {};
    const byStudent: Record<string, { grade: string; credits: number }[]> = {};

    allStudentScores.forEach((row: any) => {
      if (!byStudent[row.student_id]) byStudent[row.student_id] = [];
      if (row.grade && row.grade !== '-') {
        byStudent[row.student_id].push({ grade: row.grade, credits: 1 });
      }
    });

    const gradeMap: Record<string, number> = { '4': 4, '3.5': 3.5, '3': 3, '2.5': 2.5, '2': 2, '1.5': 1.5, '1': 1, '0': 0, 'ร': 0, 'มส': 0, 'มผ': 0 };
    Object.entries(byStudent).forEach(([sid2, grades]) => {
      if (grades.length === 0) return;
      const totalPoints = grades.reduce((s, g) => s + (gradeMap[g.grade] ?? 0) * g.credits, 0);
      const totalCredits = grades.reduce((s, g) => s + g.credits, 0);
      studentGpaMap[sid2] = totalCredits > 0 ? totalPoints / totalCredits : 0;
    });

    // เรียงลำดับ GPA
    const sorted = Object.entries(studentGpaMap)
      .sort(([, a], [, b]) => b - a);

    const myGpa = studentGpaMap[params.sid] ?? 0;
    const myRank = sorted.findIndex(([sid2]) => sid2 === params.sid) + 1;
    const isTop3 = myRank >= 1 && myRank <= 3 && myGpa > 0;

    return {
      status: isTop3 ? 'verified' : 'not_found',
      studentName: fullName,
      classLevel,
      academicYear,
      schoolName: cleanSchoolName,
      certType: 'เกียรติบัตรผลการเรียนดีเด่น',
      certDetail: isTop3
        ? `อันดับที่ ${toThaiNum(myRank)} ของระดับชั้น ประถมศึกษาปีที่ ${toThaiNum(classLevel.replace(/\D/g, ''))}`
        : 'ข้อมูลไม่ตรงกับเกียรติบัตรที่ออก',
      gpa: myGpa,
      issuedDate: `31 มีนาคม ${academicYear}`,
      directorName,
      schoolLogoUrl: settings?.school_logo_url
    };
  }

  return {
    status: 'error',
    studentName: fullName,
    classLevel,
    academicYear,
    schoolName: cleanSchoolName,
    certType: '',
    certDetail: 'ไม่ระบุประเภทเกียรติบัตร',
    issuedDate: '',
    directorName
  };
}

export const CertificateVerifyPage: React.FC = () => {
  const params = new URLSearchParams(window.location.search);
  const verifyParams: VerifyParams = {
    nid: params.get('nid') || '',
    sid: params.get('sid') || '',
    type: (params.get('type') as 'subject' | 'gpa') || '',
    subjectId: params.get('subjectId') || undefined,
    rank: params.get('rank') || undefined,
    certNo: params.get('certNo') || undefined
  };

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!verifyParams.nid || !verifyParams.sid) {
      setErrorMsg('URL ไม่ถูกต้อง — ไม่พบข้อมูลที่ต้องการตรวจสอบ');
      setLoading(false);
      return;
    }
    verifyCertificate(verifyParams)
      .then((r) => setResult(r))
      .catch((e) => setErrorMsg(e.message || 'เกิดข้อผิดพลาดในการตรวจสอบ'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-emerald-700 text-white px-4 py-2 rounded-full text-sm font-bold shadow mb-3">
          <ShieldCheck className="w-4 h-4" />
          ระบบตรวจสอบเกียรติบัตรดิจิทัล
        </div>
        <p className="text-slate-500 text-xs">โรงเรียนวัดท่าควาย • สพป.พัทลุง เขต ๒</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        {loading && (
          <div className="p-12 flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
            <p className="text-slate-500 text-sm font-medium">กำลังตรวจสอบข้อมูล...</p>
          </div>
        )}

        {!loading && errorMsg && (
          <div className="p-10 flex flex-col items-center gap-4 text-center">
            <XCircle className="w-14 h-14 text-red-400" />
            <p className="text-red-700 font-bold text-lg">เกิดข้อผิดพลาด</p>
            <p className="text-slate-500 text-sm">{errorMsg}</p>
          </div>
        )}

        {!loading && result && (
          <>
            {/* Status Banner */}
            <div className={`px-6 py-5 flex items-center gap-4 ${
              result.status === 'verified'
                ? 'bg-emerald-600'
                : 'bg-red-500'
            }`}>
              {result.status === 'verified'
                ? <CheckCircle2 className="w-10 h-10 text-white flex-shrink-0" />
                : <XCircle className="w-10 h-10 text-white flex-shrink-0" />
              }
              <div className="text-white">
                <div className="font-extrabold text-lg leading-tight">
                  {result.status === 'verified' ? 'เกียรติบัตรถูกต้อง ✓' : 'ไม่พบเกียรติบัตร ✗'}
                </div>
                <div className="text-emerald-100 text-xs mt-0.5">
                  {result.status === 'verified' ? 'ตรวจสอบแล้ว — ออกโดยสถานศึกษา' : 'ไม่พบข้อมูลตรงกับระบบ'}
                </div>
              </div>
            </div>

            {/* Certificate Info */}
            <div className="p-6 space-y-4">
              {result.status === 'verified' && (
                <>
                  {/* Certificate Type Badge */}
                  <div className="flex items-center gap-2">
                    {result.certType.includes('ดีเด่น')
                      ? <Trophy className="w-5 h-5 text-amber-500" />
                      : <Award className="w-5 h-5 text-emerald-600" />
                    }
                    <span className="font-bold text-slate-800 text-sm">{result.certType}</span>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-4 space-y-3 border border-slate-100">
                    {/* Student */}
                    <div className="flex items-start gap-3">
                      <GraduationCap className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-[11px] text-slate-400 font-medium">ชื่อ - สกุล</div>
                        <div className="font-bold text-slate-900">{result.studentName}</div>
                      </div>
                    </div>

                    {/* Class */}
                    <div className="flex items-start gap-3">
                      <School className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-[11px] text-slate-400 font-medium">ระดับชั้น / โรงเรียน</div>
                        <div className="font-semibold text-slate-800 text-sm">
                          ชั้น{result.classLevel} • โรงเรียน{result.schoolName}
                        </div>
                      </div>
                    </div>

                    {/* Detail */}
                    <div className="flex items-start gap-3">
                      <BookOpen className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-[11px] text-slate-400 font-medium">รายละเอียด</div>
                        <div className="font-semibold text-slate-800 text-sm">{result.certDetail}</div>
                        {result.score !== undefined && (
                          <div className="text-xs text-emerald-700 font-bold mt-0.5">
                            คะแนน {toThaiNum(result.score)} คะแนน
                          </div>
                        )}
                        {result.gpa !== undefined && (
                          <div className="text-xs text-emerald-700 font-bold mt-0.5">
                            GPA {toThaiNum(result.gpa.toFixed(2))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Year */}
                    <div className="flex items-start gap-3">
                      <Calendar className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-[11px] text-slate-400 font-medium">ปีการศึกษา / วันที่ออก</div>
                        <div className="font-semibold text-slate-800 text-sm">
                          ปีการศึกษา {toThaiNum(result.academicYear)} • {toThaiNum(result.issuedDate)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Director */}
                  <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-100">
                    ลงนามโดย <span className="font-semibold text-slate-600">{result.directorName}</span>
                    <br />ผู้อำนวยการโรงเรียน{result.schoolName}
                  </div>

                  {/* Verified Stamp */}
                  <div className="flex items-center justify-center gap-1.5 py-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs text-emerald-600 font-bold">
                      ตรวจสอบเมื่อ {new Date().toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </div>
                </>
              )}

              {result.status === 'not_found' && (
                <div className="text-center py-4 space-y-2">
                  <p className="text-slate-600 text-sm font-semibold">{result.certDetail}</p>
                  <p className="text-slate-400 text-xs">
                    กรุณาติดต่อโรงเรียน{result.schoolName || 'วัดท่าควาย'} เพื่อตรวจสอบ
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="mt-6 text-center text-xs text-slate-400">
        ระบบวัดผลและประเมินผล ปพ.5-6 ดิจิทัล • สพป.พัทลุง เขต ๒<br />
        ข้อมูลเชื่อมต่อกับฐานข้อมูลโรงเรียนแบบ Real-time
      </div>
    </div>
  );
};

export default CertificateVerifyPage;
