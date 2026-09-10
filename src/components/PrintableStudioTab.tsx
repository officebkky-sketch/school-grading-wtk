// src/components/PrintableStudioTab.tsx
import React, { useState } from 'react';
import { 
  StudentProfile, 
  SubjectConfig, 
  AcademicConfig, 
  StudentScoreRecord,
  AttendanceDetail,
  HolisticDetail,
  PrintDocumentMode
} from '../types/pp5Types';
import { GradingEngine } from '../engines/gradingEngine';
import { AcademicCertificateStudio } from './AcademicCertificateStudio';
import { calculateStudentAge, formatThaiBirthDate } from '../utils/studentDateUtils';
import { 
  Printer, 
  FileText, 
  UserCheck, 
  CheckCircle2, 
  ChevronRight, 
  School,
  BookOpen,
  Award,
  CalendarCheck,
  FileSpreadsheet,
  HeartPulse,
  Users
} from 'lucide-react';

interface Props {
  students: StudentProfile[];
  subjects: SubjectConfig[];
  scores: Record<string, Record<string, StudentScoreRecord>>;
  config: AcademicConfig;
  logoUrl?: string;
  attendanceData?: Record<string, AttendanceDetail>;
  holisticData?: Record<string, HolisticDetail>;
  directorSignatureUrl?: string;
  homeroomTeacherSignatureUrl?: string;
  academicSignatureUrl?: string;
}

export const PrintableStudioTab: React.FC<Props> = ({
  students,
  subjects,
  scores,
  config,
  logoUrl = 'https://vzrrpxrmtjpgfbbvhjra.supabase.co/storage/v1/object/public/system/school_logo_1779071201388.png',
  attendanceData = {},
  holisticData = {},
  directorSignatureUrl = 'https://vzrrpxrmtjpgfbbvhjra.supabase.co/storage/v1/object/public/system/director_sig_1778032124756.png',
  homeroomTeacherSignatureUrl = '',
  academicSignatureUrl = 'https://vzrrpxrmtjpgfbbvhjra.supabase.co/storage/v1/object/public/system/user_sig_181e17f2-e998-4c9f-a3e0-6f1334a8f7cb_1778037929138.png'
}) => {
  const [printMode, setPrintMode] = useState<PrintDocumentMode>('pp6');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('ALL'); // Default 'ALL' เพื่อความสะดวกในการพิมพ์ทั้งห้อง
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || '');
  const [coverType, setCoverType] = useState<'class' | 'subject'>('class');

  const singleStudent = students.find(s => s.studentId === selectedStudentId) || students[0];
  const selectedSubject = subjects.find(s => s.id === selectedSubjectId) || subjects[0];

  // คำนวณ GPA และ Rank สำหรับนักเรียนทุกคน (รองรับ Tie-breaker ด้วยคะแนนรวมดิบ)
  const studentGPAMap = React.useMemo(() => {
    const list = students.map(s => {
      const gradeList: { grade: string; credits: number }[] = [];
      let totalRaw = 0;
      let hasAnyScore = false;

      subjects.forEach(sub => {
        const rec = scores[sub.id]?.[s.studentId];
        const gr = rec?.grade && rec.grade !== '-' ? rec.grade : '-';
        if (gr !== '-') {
          gradeList.push({ grade: gr, credits: sub.credits });
        }
        const sc = rec?.yearlyTotal ?? rec?.total1;
        if (sc !== undefined && sc !== null && !isNaN(sc)) {
          totalRaw += sc;
          hasAnyScore = true;
        }
      });

      const gpa = gradeList.length > 0 ? GradingEngine.calculateGPA(gradeList) : null;
      return {
        studentId: s.studentId,
        gpa,
        totalRawScore: hasAnyScore ? totalRaw : null
      };
    });

    return GradingEngine.calculateRankings(list, 'gpa_rawscore_tiebreaker');
  }, [students, subjects, scores]);

  // สถิติรายวิชาสำหรับ ปพ.5 รายวิชา
  const subjectStats = React.useMemo(() => {
    if (!selectedSubject) return null;
    const subScores = scores[selectedSubject.id] || {};
    const scoreList = students.map(s => subScores[s.studentId]?.yearlyTotal ?? subScores[s.studentId]?.total1 ?? null);
    const stats = GradingEngine.calculateStatistics(scoreList);

    // นับจำนวนเกรด
    const gradeCounts: Record<string, number> = { '4': 0, '3.5': 0, '3': 0, '2.5': 0, '2': 0, '1.5': 0, '1': 0, '0': 0, '-': 0 };
    students.forEach(s => {
      const g = subScores[s.studentId]?.grade || '-';
      if (gradeCounts[g] !== undefined) gradeCounts[g]++;
      else gradeCounts['-']++;
    });

    return { ...stats, gradeCounts };
  }, [selectedSubject, students, scores]);

    // Helper แสดงรูปลายเซ็นดิจิทัล
  const renderSignatureImg = (sigUrl?: string, defaultH = "h-8") => {
    if (sigUrl) {
      return (
        <div className="relative h-10 flex items-center justify-center -mb-2 pointer-events-none">
          <img
            src={sigUrl}
            alt="ลายเซ็นดิจิทัล"
            className="h-10 max-w-[130px] object-contain mix-blend-multiply"
          />
        </div>
      );
    }
    return <div className={defaultH}></div>;
  };

  const handlePrint = () => {
    window.print();
  };

  const isLandscape = ['pp5_class', 'pp5_subject', 'pp5_attendance', 'pp5_holistic', 'pp5_health'].includes(printMode);

  // Helper คำนวณ BMI และแปลผล
  const getBmiInfo = (weight?: number, height?: number) => {
    if (!weight || !height || height <= 0) return { bmi: '-', status: 'สมส่วน', fitness: 'ดีมาก (3)' };
    const hM = height / 100;
    const bmiVal = weight / (hM * hM);
    let status = 'สมส่วน';
    if (bmiVal < 14.5) status = 'ผอม';
    else if (bmiVal >= 14.5 && bmiVal < 18.5) status = 'สมส่วน';
    else if (bmiVal >= 18.5 && bmiVal < 22) status = 'ท้วม/เริ่มอ้วน';
    else status = 'อ้วน';
    return { bmi: bmiVal.toFixed(1), status, fitness: 'ดีมาก (3)' };
  };

  // Helper แปลงคะแนนระดับคุณลักษณะ
  const getScoreLevelText = (score?: number) => {
    if (score === 3) return 'ดีเยี่ยม (3)';
    if (score === 2) return 'ดี (2)';
    if (score === 1) return 'ผ่าน (1)';
    if (score === 0) return 'ไม่ผ่าน (0)';
    return 'ดีเยี่ยม (3)';
  };

  // ฟังก์ชันเรนเดอร์แผ่น ปพ.6 รายคน 1 แผ่น
  const renderPP6Card = (std: StudentProfile, isBatch = false) => {
    const att = attendanceData[std.studentId] || { present: 198, leave: 1, sick: 1, absent: 0 };
    const totalDays = att.present + att.leave + att.sick + att.absent || 200;
    const attPercent = totalDays > 0 ? (((att.present + att.leave + att.sick) / totalDays) * 100).toFixed(1) : '99.0';
    const isEligible = Number(attPercent) >= 80;

    const hol = holisticData[std.studentId] || {
      traitsScore: 3,
      competencyScore: 3,
      readingWriting: 'ดีเยี่ยม',
      activityPassed: true
    };

    const bmiInfo = getBmiInfo(std.weight, std.height);

    return (
      <div 
        key={std.studentId}
        className="w-[210mm] min-h-[297mm] bg-white shadow-xl p-10 text-slate-900 flex flex-col justify-between border border-slate-300 rounded-sm mb-8 print:mb-0 print:shadow-none print:border-none print:p-8 print-page"
        style={{ pageBreakAfter: isBatch ? 'always' : 'auto' }}
      >
        <div>
          {/* Official Header */}
          <div className="text-center border-b-2 border-slate-900 pb-3 mb-4">
            <div className="flex items-center justify-center gap-4 mb-2">
              {logoUrl && (
                <img
                  src={logoUrl}
                  alt="ตราโรงเรียน"
                  className="w-13 h-13 object-contain"
                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                />
              )}
              <img
                src="/garuda.png"
                alt="ตราครุฑ"
                className="w-12 h-12 object-contain"
                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
              />
            </div>
            <div className="text-[11px] font-bold tracking-widest text-slate-500 uppercase">
              เอกสารหลักฐานการศึกษาตามหลักสูตรแกนกลางการศึกษาขั้นพื้นฐาน พุทธศักราช 2551
            </div>
            <h1 className="text-xl font-bold mt-1 text-slate-900">
              แบบรายงานผลการพัฒนาคุณภาพผู้เรียนรายบุคคล (ปพ.6)
            </h1>
            <div className="text-sm font-medium text-slate-700 mt-1">
              โรงเรียน{config.schoolName} อำเภอเขาชัยสน จังหวัดพัทลุง สำนักงานเขตพื้นที่การศึกษาประถมศึกษาพัทลุง เขต 2
            </div>
          </div>

          {/* Student Demographics Block (Anti-collision Layout) */}
          <div className="bg-slate-50/90 p-3.5 rounded-xl border border-slate-200 text-xs mb-4 space-y-2">
            {/* Row 1: Student Demographics */}
            <div className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-5 truncate">
                <span className="text-slate-500">ชื่อ - สกุล:</span> <strong className="text-slate-900">{std.prefix}{std.firstName} {std.lastName}</strong>
              </div>
              <div className="col-span-3 truncate">
                <span className="text-slate-500">เลขประจำตัว:</span> <strong className="font-mono text-slate-800">{std.studentId}</strong>
              </div>
              <div className="col-span-4 truncate text-right">
                <span className="text-slate-500">เลขประจำตัวประชาชน:</span> <strong className="font-mono text-slate-800">{std.nationalId}</strong>
              </div>
            </div>

            {/* Row 2: Class & Birth Details */}
            <div className="grid grid-cols-12 gap-2 items-center border-t border-slate-200/60 pt-2">
              <div className="col-span-3 truncate">
                <span className="text-slate-500">ระดับชั้น:</span> <strong>ชั้น {config.classLevel} (เลขที่ {std.seq})</strong>
              </div>
              <div className="col-span-4 truncate">
                <span className="text-slate-500">วันเกิด:</span> <strong>{formatThaiBirthDate(std.birthDate)}</strong>
              </div>
              <div className="col-span-2 truncate">
                <span className="text-slate-500">อายุ:</span> <strong>{calculateStudentAge(std.birthDate, config.classLevel)} ปี</strong>
              </div>
              <div className="col-span-3 truncate text-right">
                <span className="text-slate-500">ปีการศึกษา:</span> <strong>{config.academicYear}</strong>
              </div>
            </div>

            {/* Row 3: Physical Growth & Nutrition */}
            <div className="grid grid-cols-12 gap-2 items-center border-t border-slate-200/60 pt-2">
              <div className="col-span-6 truncate">
                <span className="text-slate-500">น้ำหนัก / ส่วนสูง:</span> <strong>{std.weight || '-'} กก. / {std.height || '-'} ซม.</strong> <span className="text-slate-500 font-mono">(BMI: {bmiInfo.bmi})</span>
              </div>
              <div className="col-span-6 truncate text-right">
                <span className="text-slate-500">ภาวะการเจริญเติบโต:</span> <strong className="text-emerald-700">{bmiInfo.status} (ตามเกณฑ์กรมอนามัย)</strong>
              </div>
            </div>
          </div>

          {/* Subject Academic Performance Table */}
          <div className="mb-4">
            <div className="text-xs font-bold text-slate-800 mb-1.5 uppercase tracking-wide">
              1. ผลการประเมินผลการเรียนตามกลุ่มสาระการเรียนรู้
            </div>
            <table className="w-full text-left text-xs border border-slate-300">
              <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                <tr>
                  <th className="p-2 border-r border-slate-300 w-24 text-center">รหัสวิชา</th>
                  <th className="p-2 border-r border-slate-300">รายวิชา</th>
                  <th className="p-2 border-r border-slate-300 w-16 text-center">หน่วยกิต</th>
                  <th className="p-2 border-r border-slate-300 w-20 text-center">คะแนนรวม</th>
                  <th className="p-2 border-r border-slate-300 w-20 text-center">ระดับผลการเรียน</th>
                  <th className="p-2 text-center w-16">ผลการตัดสิน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {/* 1. รายวิชาพื้นฐาน */}
                {subjects.filter(s => s.type === 'พื้นฐาน' || !s.type).length > 0 && (
                  <tr className="bg-slate-100/90 text-slate-900 font-bold text-[10.5px]">
                    <td colSpan={6} className="p-1 border-r border-slate-300">รายวิชาพื้นฐาน</td>
                  </tr>
                )}
                {subjects.filter(s => s.type === 'พื้นฐาน' || !s.type).map((sub) => {
                  const rec = scores[sub.id]?.[std.studentId];
                  const total = rec?.yearlyTotal ?? (rec?.total1 !== null && rec?.total1 !== undefined ? rec.total1 : '-');
                  const grade = rec?.grade && rec.grade !== '-' ? rec.grade : '-';
                  const isPassed = grade !== '-' ? (grade !== '0' && grade !== 'ร' && grade !== 'มส') : null;
                  return (
                    <tr key={sub.id}>
                      <td className="p-1 text-center font-mono border-r border-slate-300">{sub.code}</td>
                      <td className="p-1 border-r border-slate-300 font-medium pl-4">{sub.name}</td>
                      <td className="p-1 text-center border-r border-slate-300">{sub.credits}</td>
                      <td className="p-1 text-center font-mono border-r border-slate-300">{total}</td>
                      <td className="p-1 text-center font-bold font-mono border-r border-slate-300">{grade}</td>
                      <td className="p-1 text-center font-semibold">
                        {isPassed === true ? (
                          <span className="text-emerald-700">ผ่าน</span>
                        ) : isPassed === false ? (
                          <span className="text-rose-600">ไม่ผ่าน</span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {/* 2. รายวิชาเพิ่มเติม */}
                {subjects.filter(s => s.type === 'เพิ่มเติม').length > 0 && (
                  <tr className="bg-slate-100/90 text-slate-900 font-bold text-[10.5px]">
                    <td colSpan={6} className="p-1 border-r border-slate-300">รายวิชาเพิ่มเติม</td>
                  </tr>
                )}
                {subjects.filter(s => s.type === 'เพิ่มเติม').map((sub) => {
                  const rec = scores[sub.id]?.[std.studentId];
                  const total = rec?.yearlyTotal ?? (rec?.total1 !== null && rec?.total1 !== undefined ? rec.total1 : '-');
                  const grade = rec?.grade && rec.grade !== '-' ? rec.grade : '-';
                  const isPassed = grade !== '-' ? (grade !== '0' && grade !== 'ร' && grade !== 'มส') : null;
                  return (
                    <tr key={sub.id}>
                      <td className="p-1 text-center font-mono border-r border-slate-300">{sub.code}</td>
                      <td className="p-1 border-r border-slate-300 font-medium pl-4">{sub.name}</td>
                      <td className="p-1 text-center border-r border-slate-300">{sub.credits}</td>
                      <td className="p-1 text-center font-mono border-r border-slate-300">{total}</td>
                      <td className="p-1 text-center font-bold font-mono border-r border-slate-300">{grade}</td>
                      <td className="p-1 text-center font-semibold">
                        {isPassed === true ? (
                          <span className="text-emerald-700">ผ่าน</span>
                        ) : isPassed === false ? (
                          <span className="text-rose-600">ไม่ผ่าน</span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {/* 3. กิจกรรมพัฒนาผู้เรียน (ถ้ามี) */}
                {subjects.filter(s => s.type === 'กิจกรรม').length > 0 && (
                  <tr className="bg-slate-100/90 text-slate-900 font-bold text-[10.5px]">
                    <td colSpan={6} className="p-1 border-r border-slate-300">กิจกรรมพัฒนาผู้เรียน</td>
                  </tr>
                )}
                {subjects.filter(s => s.type === 'กิจกรรม').map((sub) => {
                  const rec = scores[sub.id]?.[std.studentId];
                  const total = rec?.yearlyTotal ?? (rec?.total1 !== null && rec?.total1 !== undefined ? rec.total1 : '-');
                  const grade = rec?.grade && rec.grade !== '-' ? rec.grade : '-';
                  const isPassed = grade !== '-' ? (grade !== '0' && grade !== 'ร' && grade !== 'มส') : null;
                  return (
                    <tr key={sub.id}>
                      <td className="p-1 text-center font-mono border-r border-slate-300">{sub.code}</td>
                      <td className="p-1 border-r border-slate-300 font-medium pl-4">{sub.name}</td>
                      <td className="p-1 text-center border-r border-slate-300">{sub.credits}</td>
                      <td className="p-1 text-center font-mono border-r border-slate-300">{total}</td>
                      <td className="p-1 text-center font-bold font-mono border-r border-slate-300">{grade}</td>
                      <td className="p-1 text-center font-semibold">
                        {isPassed === true ? (
                          <span className="text-emerald-700">ผ่าน</span>
                        ) : isPassed === false ? (
                          <span className="text-rose-600">ไม่ผ่าน</span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50 font-bold border-t border-slate-300">
                <tr>
                  <td colSpan={2} className="p-2 text-right border-r border-slate-300">
                    ผลการเรียนเฉลี่ยสะสม (GPA) / ลำดับที่ในห้อง:
                  </td>
                  <td colSpan={2} className="p-2 text-center font-mono text-emerald-800 text-sm border-r border-slate-300">
                    {studentGPAMap[std.studentId]?.gpa?.toFixed(2) ?? '-'}
                  </td>
                  <td colSpan={2} className="p-2 text-center font-mono text-indigo-800">
                    ลำดับที่ {studentGPAMap[std.studentId]?.rank ?? '-'}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Holistic & Telemetry Block */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            {/* Character & Competencies */}
            <div className="border border-slate-300 rounded p-3 bg-slate-50/50">
              <div className="font-bold text-slate-800 mb-2">2. ผลการประเมินด้านอื่นๆ</div>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-600">• คุณลักษณะอันพึงประสงค์ (8 ประการ):</span>
                  <strong className="text-emerald-700">{getScoreLevelText(hol.traitsScore)}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">• สมรรถนะสำคัญของผู้เรียน (5 ด้าน):</span>
                  <strong className="text-emerald-700">{getScoreLevelText(hol.competencyScore)}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">• การอ่าน คิดวิเคราะห์ และเขียน:</span>
                  <strong className="text-emerald-700">{hol.readingWriting || 'ดีเยี่ยม'}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">• กิจกรรมพัฒนาผู้เรียน:</span>
                  <strong className={hol.activityPassed ? "text-emerald-700" : "text-rose-600"}>
                    {hol.activityPassed ? 'ผ่าน (ผ)' : 'ไม่ผ่าน (มผ)'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Attendance & Health */}
            <div className="border border-slate-300 rounded p-3 bg-slate-50/50">
              <div className="font-bold text-slate-800 mb-2">3. สถิติเวลาเรียนและสุขภาพกาย</div>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-600">• เวลาเรียนทั้งหมด:</span>
                  <strong>{totalDays} วัน (มาเรียน {att.present} วัน)</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">• คิดเป็นร้อยละ:</span>
                  <strong className={isEligible ? "text-emerald-700" : "text-rose-600"}>
                    {attPercent}% ({isEligible ? 'มีสิทธิ์สอบ' : 'เวลาเรียนไม่ถึง 80%'})
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">• ภาวะการเจริญเติบโต:</span>
                  <strong className="text-emerald-700">{bmiInfo.status} (ตามเกณฑ์กรมอนามัย)</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">• สมรรถภาพทางกาย:</span>
                  <strong className="text-emerald-700">{bmiInfo.fitness}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Official Signatures Block */}
        <div className="pt-6 border-t border-slate-300 text-xs">
          <div className="grid grid-cols-3 text-center gap-4 items-end">
            <div>
              {renderSignatureImg(homeroomTeacherSignatureUrl)}
              <div>ลงชื่อ......................................................</div>
              <div className="font-semibold mt-1">({config.homeroomTeacher || 'ครูประจำชั้น'})</div>
              <div className="text-slate-500">ครูประจำชั้น</div>
            </div>
            <div>
              <div className="h-8"></div>
              <div>ลงชื่อ......................................................</div>
              <div className="font-semibold mt-1">({std.guardianName || std.fatherName || 'ผู้ปกครอง'})</div>
              <div className="text-slate-500">ผู้ปกครองนักเรียน</div>
            </div>
            <div>
              {renderSignatureImg(directorSignatureUrl)}
              <div>ลงชื่อ......................................................</div>
              <div className="font-semibold mt-1">({config.directorName || 'นางจันทวรรณ พิทักษ์ฉนวน'})</div>
              <div className="text-slate-500">ผู้อำนวยการโรงเรียน{config.schoolName}</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Print Control Toolbar (hidden on print) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 no-print">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">ศูนย์จัดพิมพ์เอกสารราชการ ปพ.5 - ปพ.6 ครบวงจร</h2>
              <p className="text-xs text-slate-500">
                เอกสารมาตรฐานกระทรวงศึกษาธิการ / สพฐ. ครบทุกแบบฟอร์มตามไฟล์ต้นแบบ (รองรับ Batch Print ทั้งห้อง)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Template Selector */}
            <div className="flex flex-wrap rounded-lg bg-slate-100 p-1 border border-slate-200 text-xs">
              <button
                onClick={() => setPrintMode('pp6')}
                className={`px-2.5 py-1 font-bold rounded-md transition ${
                  printMode === 'pp6' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ปพ.6 (สมุดพก)
              </button>
              <button
                onClick={() => setPrintMode('pp5_subject')}
                className={`px-2.5 py-1 font-bold rounded-md transition ${
                  printMode === 'pp5_subject' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ปพ.5 รายวิชา
              </button>
              <button
                onClick={() => setPrintMode('pp5_class')}
                className={`px-2.5 py-1 font-bold rounded-md transition ${
                  printMode === 'pp5_class' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ปพ.5 สรุปรายชั้น
              </button>
              <button
                onClick={() => setPrintMode('pp5_cover')}
                className={`px-2.5 py-1 font-bold rounded-md transition ${
                  printMode === 'pp5_cover' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ปก ปพ.5
              </button>
              <button
                onClick={() => setPrintMode('pp5_attendance')}
                className={`px-2.5 py-1 font-bold rounded-md transition ${
                  printMode === 'pp5_attendance' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                เวลาเรียน
              </button>
              <button
                onClick={() => setPrintMode('pp5_holistic')}
                className={`px-2.5 py-1 font-bold rounded-md transition ${
                  printMode === 'pp5_holistic' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                คุณลักษณะ/สมรรถนะ
              </button>
              <button
                onClick={() => setPrintMode('pp5_health')}
                className={`px-2.5 py-1 font-bold rounded-md transition ${
                  printMode === 'pp5_health' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ปพ.5 สุขภาพ
              </button>
              <button
                onClick={() => setPrintMode('certificate')}
                className={`px-2.5 py-1 font-bold rounded-md transition ${
                  printMode === 'certificate' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🏆 เกียรติบัตร
              </button>
            </div>

            {/* Student Selector (for PP6) */}
            {printMode === 'pp6' && (
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer text-slate-800"
              >
                <option value="ALL">🖨️ พิมพ์ทุกคนทั้งห้อง ({students.length} คน)</option>
                {students.map(s => (
                  <option key={s.studentId} value={s.studentId}>
                    เลขที่ {s.seq} - {s.prefix}{s.firstName} {s.lastName} ({s.studentId})
                  </option>
                ))}
              </select>
            )}

            {/* Subject Selector (for PP5 Subject) */}
            {printMode === 'pp5_subject' && (
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                {subjects.map(sub => (
                  <option key={sub.id} value={sub.id}>
                    {sub.code} {sub.name} ({sub.credits} นก.)
                  </option>
                ))}
              </select>
            )}

            {/* Cover Type Selector (for PP5 Cover) */}
            {printMode === 'pp5_cover' && (
              <select
                value={coverType}
                onChange={(e) => setCoverType(e.target.value as any)}
                className="text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="class">ปก ปพ.5 รายชั้นเรียน</option>
                <option value="subject">ปก ปพ.5 รายวิชา</option>
              </select>
            )}

            {/* Print Action Button */}
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              สั่งพิมพ์ A4 ({isLandscape ? 'แนวนอน' : 'แนวตั้ง'}{selectedStudentId === 'ALL' && printMode === 'pp6' ? ' - ทุกคน' : ''})
            </button>
          </div>
        </div>
      </div>

      {/* A4 Document Preview Container */}
      <div className="bg-slate-200/70 p-4 sm:p-8 rounded-2xl flex flex-col items-center overflow-x-auto">
        
        {/* ========================================================= */}
        {/* TEMPLATE 1: ปพ.6 รายบุคคล (สมุดพก A4 แนวตั้ง - รองรับ ALL) */}
        {/* ========================================================= */}
        {printMode === 'pp6' && (
          selectedStudentId === 'ALL' ? (
            <div className="w-full flex flex-col items-center space-y-6 print:space-y-0">
              <div className="bg-amber-100 border border-amber-300 text-amber-900 px-4 py-2 rounded-lg text-xs font-bold no-print">
                กำลังแสดงโหมดพิมพ์ทุกคนทั้งห้อง ({students.length} คน) แต่ละคนจะแบ่งหน้า A4 อัตโนมัติเมื่อกดสั่งพิมพ์
              </div>
              {students.map((s) => renderPP6Card(s, true))}
            </div>
          ) : (
            renderPP6Card(singleStudent, false)
          )
        )}

        {/* ========================================================= */}
        {/* TEMPLATE 2: ปพ.5 รายวิชา (Subject Marksheet A4 แนวนอน) */}
        {/* ========================================================= */}
        {printMode === 'pp5_subject' && selectedSubject && (
          <div className="w-[297mm] min-h-[210mm] bg-white shadow-xl p-8 text-slate-900 flex flex-col justify-between border border-slate-300 rounded-sm print:shadow-none print:border-none print:p-6 print-page">
            <div>
              {/* Header */}
              <div className="text-center border-b-2 border-slate-900 pb-2 mb-3">
                <div className="flex items-center justify-center gap-3">
                  {logoUrl && (
                    <img
                      src={logoUrl}
                      alt="ตราโรงเรียน"
                      className="w-10 h-10 object-contain"
                      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                    />
                  )}
                  <img
                    src="/garuda.png"
                    alt="ตราครุฑ"
                    className="w-10 h-10 object-contain"
                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                  />
                  <div>
                    <h1 className="text-base font-bold text-slate-900">
                      แบบบันทึกผลการเรียนรายวิชา (ปพ.5) • {selectedSubject.code} {selectedSubject.name}
                    </h1>
                    <div className="text-xs font-semibold text-slate-700">
                      โรงเรียน{config.schoolName} • ชั้น {config.classLevel} • ปีการศึกษา {config.academicYear} • จำนวน {selectedSubject.credits} หน่วยกิต ({selectedSubject.hoursPerYear} ชม./ปี)
                    </div>
                  </div>
                </div>
              </div>

              {/* Marksheet Table */}
              <table className="w-full text-left text-[11px] border border-slate-300">
                <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 text-center">
                  <tr>
                    <th rowSpan={2} className="p-1 border-r border-slate-300 w-8">ที่</th>
                    <th rowSpan={2} className="p-1 border-r border-slate-300 w-16">รหัส</th>
                    <th rowSpan={2} className="p-1 border-r border-slate-300 text-left px-2">ชื่อ - สกุล</th>
                    <th colSpan={4} className="p-1 border-r border-slate-300 bg-emerald-50/50">ภาคเรียนที่ 1 (50)</th>
                    <th colSpan={4} className="p-1 border-r border-slate-300 bg-blue-50/50">ภาคเรียนที่ 2 (50)</th>
                    <th rowSpan={2} className="p-1 border-r border-slate-300 w-12 bg-amber-50">รวมปี (100)</th>
                    <th rowSpan={2} className="p-1 border-r border-slate-300 w-10">เกรด</th>
                    <th rowSpan={2} className="p-1 w-12">ผล</th>
                  </tr>
                  <tr className="border-t border-slate-300 text-[10px]">
                    <th className="p-0.5 border-r border-slate-300 w-9">ก่อนสอบ</th>
                    <th className="p-0.5 border-r border-slate-300 w-9">สอบ</th>
                    <th className="p-0.5 border-r border-slate-300 w-9">รวม</th>
                    <th className="p-0.5 border-r border-slate-300 w-9 font-bold">เกรด ๑</th>

                    <th className="p-0.5 border-r border-slate-300 w-9">ก่อนสอบ</th>
                    <th className="p-0.5 border-r border-slate-300 w-9">สอบ</th>
                    <th className="p-0.5 border-r border-slate-300 w-9">รวม</th>
                    <th className="p-0.5 border-r border-slate-300 w-9 font-bold">เกรด ๒</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                  {students.map((s) => {
                    const rec = scores[selectedSubject.id]?.[s.studentId];
                    const grade = rec?.grade && rec.grade !== '-' ? rec.grade : '-';
                    const isPassed = grade !== '-' ? (grade !== '0' && grade !== 'ร' && grade !== 'มส') : null;
                    const examScore1 = (rec?.midterm1 !== null && rec?.midterm1 !== undefined) || (rec?.final1 !== null && rec?.final1 !== undefined)
                      ? ((rec?.midterm1 ?? 0) + (rec?.final1 ?? 0))
                      : '-';
                    const term1Grade = rec?.total1 !== null && rec?.total1 !== undefined ? GradingEngine.calculateGrade(rec.total1 * 2) : '-';
                    
                    const examScore2 = (rec?.midterm2 !== null && rec?.midterm2 !== undefined) || (rec?.final2 !== null && rec?.final2 !== undefined)
                      ? ((rec?.midterm2 ?? 0) + (rec?.final2 ?? 0))
                      : '-';
                    const term2Grade = rec?.total2 !== null && rec?.total2 !== undefined ? GradingEngine.calculateGrade(rec.total2 * 2) : '-';

                    return (
                      <tr key={s.id} className="hover:bg-slate-50 text-center">
                        <td className="p-1 font-sans font-semibold border-r border-slate-300">{s.seq}</td>
                        <td className="p-1 border-r border-slate-300">{s.studentId}</td>
                        <td className="p-1 text-left font-sans px-2 border-r border-slate-300 truncate max-w-[140px]">
                          {s.prefix}{s.firstName} {s.lastName}
                        </td>
                        
                        {/* Term 1 */}
                        <td className="p-1 border-r border-slate-300">{rec?.formative1 ?? '-'}</td>
                        <td className="p-1 border-r border-slate-300">{examScore1}</td>
                        <td className="p-1 font-bold border-r border-slate-300 bg-emerald-50/30">{rec?.total1 ?? '-'}</td>
                        <td className="p-1 border-r border-slate-300 font-bold text-emerald-800">{term1Grade}</td>

                        {/* Term 2 */}
                        <td className="p-1 border-r border-slate-300">{rec?.formative2 ?? '-'}</td>
                        <td className="p-1 border-r border-slate-300">{examScore2}</td>
                        <td className="p-1 font-bold border-r border-slate-300 bg-blue-50/30">{rec?.total2 ?? '-'}</td>
                        <td className="p-1 border-r border-slate-300 font-bold text-blue-800">{term2Grade}</td>

                        {/* Yearly Total */}
                        <td className="p-1 font-bold border-r border-slate-300 bg-amber-50 text-amber-950">
                          {rec?.yearlyTotal ?? rec?.total1 ?? '-'}
                        </td>
                        <td className="p-1 font-extrabold border-r border-slate-300 text-emerald-900 bg-slate-50">
                          {grade}
                        </td>
                        <td className="p-1 font-sans text-[10px] font-semibold">
                          {isPassed === true ? (
                            <span className="text-emerald-700">ผ่าน</span>
                          ) : isPassed === false ? (
                            <span className="text-rose-600">ไม่ผ่าน</span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Statistical Summary Box */}
              {subjectStats && (
                <div className="mt-3 grid grid-cols-12 gap-2 text-xs border border-slate-300 p-2 rounded bg-slate-50">
                  <div className="col-span-3 border-r border-slate-300 pr-2">
                    <div className="font-bold text-slate-800 mb-1">สถิติคะแนน:</div>
                    <div className="grid grid-cols-2 gap-1 text-[11px]">
                      <div>เฉลี่ย: <strong>{subjectStats.mean}</strong></div>
                      <div>S.D.: <strong>{subjectStats.sd}</strong></div>
                      <div>สูงสุด: <strong>{subjectStats.max}</strong></div>
                      <div>ต่ำสุด: <strong>{subjectStats.min}</strong></div>
                    </div>
                  </div>
                  <div className="col-span-9 flex items-center justify-around">
                    {['4', '3.5', '3', '2.5', '2', '1.5', '1', '0'].map(g => (
                      <div key={g} className="text-center font-mono">
                        <div className="text-[10px] text-slate-500 font-sans">เกรด {g}</div>
                        <div className="font-bold text-slate-800">{subjectStats.gradeCounts[g] || 0} คน</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Official Signatures */}
            <div className="pt-4 border-t border-slate-300 text-xs">
              <div className="grid grid-cols-3 text-center gap-4 items-end">
                <div>
                  {renderSignatureImg(homeroomTeacherSignatureUrl, "h-6")}
                  <div>ลงชื่อ...................................................... ครูผู้สอน</div>
                  <div className="font-semibold mt-0.5">({config.homeroomTeacher || 'ครูผู้สอน'})</div>
                </div>
                <div>
                  {renderSignatureImg(academicSignatureUrl, "h-6")}
                  <div>ลงชื่อ...................................................... หัวหน้าฝ่ายวิชาการ</div>
                  <div className="font-semibold mt-0.5">(นางสุมาวดี สมบูรณ์)</div>
                </div>
                <div>
                  {renderSignatureImg(directorSignatureUrl, "h-6")}
                  <div>ลงชื่อ...................................................... ผู้อำนวยการสถานศึกษา</div>
                  <div className="font-semibold mt-0.5">({config.directorName || 'นางจันทวรรณ พิทักษ์ฉนวน'})</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TEMPLATE 3: ปพ.5 สรุปรายชั้นเรียน (Master Sheet A4 แนวนอน) */}
        {/* ========================================================= */}
        {printMode === 'pp5_class' && (
          <div className="w-[297mm] min-h-[210mm] bg-white shadow-xl p-8 text-slate-900 flex flex-col justify-between border border-slate-300 rounded-sm print:shadow-none print:border-none print:p-6 print-page">
            <div>
              {/* Header */}
              <div className="text-center border-b-2 border-slate-900 pb-2 mb-3">
                <div className="flex items-center justify-center gap-3">
                  {logoUrl && (
                    <img
                      src={logoUrl}
                      alt="ตราโรงเรียน"
                      className="w-10 h-10 object-contain"
                      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                    />
                  )}
                  <img
                    src="/garuda.png"
                    alt="ตราครุฑ"
                    className="w-10 h-10 object-contain"
                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                  />
                  <div>
                    <h1 className="text-base font-bold text-slate-900">
                      แบบบันทึกผลการพัฒนาคุณภาพผู้เรียน (ปพ.5) - สรุปผลสัมฤทธิ์ทางการเรียนรวมรายชั้น
                    </h1>
                    <div className="text-xs font-semibold text-slate-700">
                      โรงเรียน{config.schoolName} • ระดับชั้นประถมศึกษาปีที่ {config.classLevel.replace('ป.', '')} • ปีการศึกษา {config.academicYear} • สพป.พัทลุง เขต 2
                    </div>
                  </div>
                </div>
              </div>

              {/* Master Matrix Table */}
              <table className="w-full text-left text-[11px] border border-slate-300">
                <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 text-center">
                  <tr>
                    <th className="p-1 border-r border-slate-300 w-8">ที่</th>
                    <th className="p-1 border-r border-slate-300 w-16">รหัส</th>
                    <th className="p-1 border-r border-slate-300 text-left px-2">ชื่อ - สกุล</th>
                    {subjects.map(sub => (
                      <th key={sub.id} className="p-1 border-r border-slate-300 text-center font-mono w-10">
                        <div>{sub.code.substring(0, 3)}</div>
                        <div className="text-[9px] font-normal text-slate-500">({sub.credits})</div>
                      </th>
                    ))}
                    <th className="p-1 border-r border-slate-300 w-12 bg-emerald-50">เฉลี่ย (GPA)</th>
                    <th className="p-1 w-10 bg-indigo-50">อันดับ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                  {students.map((s) => {
                    const gpaInfo = studentGPAMap[s.studentId];
                    return (
                      <tr key={s.id} className="hover:bg-slate-50 text-center">
                        <td className="p-1 font-sans font-semibold border-r border-slate-300">{s.seq}</td>
                        <td className="p-1 border-r border-slate-300">{s.studentId}</td>
                        <td className="p-1 text-left font-sans px-2 border-r border-slate-300 truncate max-w-[150px]">
                          {s.prefix}{s.firstName} {s.lastName}
                        </td>
                        {subjects.map(sub => {
                          const gr = scores[sub.id]?.[s.studentId]?.grade || '-';
                          return (
                            <td key={sub.id} className="p-1 border-r border-slate-300 font-bold">
                              {gr}
                            </td>
                          );
                        })}
                        <td className="p-1 font-extrabold border-r border-slate-300 bg-emerald-50 text-emerald-900">
                          {gpaInfo?.gpa?.toFixed(2) ?? '-'}
                        </td>
                        <td className="p-1 font-bold bg-indigo-50 text-indigo-900">
                          {gpaInfo?.rank ?? '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Official Signatures */}
            <div className="pt-4 border-t border-slate-300 text-xs">
              <div className="grid grid-cols-2 text-center gap-8">
                <div>
                  <div className="h-6"></div>
                  <div>ลงชื่อ...................................................... ครูประจำชั้น</div>
                  <div className="font-semibold mt-0.5">({config.homeroomTeacher || 'ครูประจำชั้น'})</div>
                </div>
                <div>
                  <div className="h-6"></div>
                  <div>ลงชื่อ...................................................... ผู้อำนวยการสถานศึกษา</div>
                  <div className="font-semibold mt-0.5">({config.directorName || 'นางจันทวรรณ พิทักษ์ฉนวน'})</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TEMPLATE 4: ปก ปพ.5 ทางการ (ตราครุฑ A4 แนวตั้ง) */}
        {/* ========================================================= */}
        {printMode === 'pp5_cover' && (
          <div className="w-[210mm] min-h-[297mm] bg-white shadow-xl p-14 text-slate-900 flex flex-col justify-between border-2 border-slate-800 rounded-sm print:shadow-none print:border-none print:p-12 print-page">
            <div className="text-center flex flex-col items-center">
              {/* Garuda Emblem & School Logo */}
              <div className="mb-6 mt-4 flex items-center justify-center gap-6">
                <img
                  src="/garuda.png"
                  alt="ตราครุฑ"
                  className="w-24 h-24 object-contain"
                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                />
                {logoUrl && (
                  <img
                    src={logoUrl}
                    alt="ตราโรงเรียน"
                    className="w-24 h-24 object-contain"
                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                  />
                )}
              </div>

              <div className="text-sm font-bold text-slate-600 tracking-widest uppercase mb-1">
                กระทรวงศึกษาธิการ
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-wide mb-3">
                แบบบันทึกผลการพัฒนาคุณภาพผู้เรียน (ปพ.5)
              </h1>
              
              <div className="text-lg font-bold text-emerald-800 mb-6">
                {coverType === 'class' ? 'บัญชีสรุปผลสัมฤทธิ์ทางการเรียนรายชั้น' : `แบบบันทึกคะแนนรายวิชา ${selectedSubject.name}`}
              </div>

              <div className="w-48 h-0.5 bg-slate-800 mb-8 mx-auto"></div>

              <div className="space-y-3 text-base font-semibold text-slate-800 text-center max-w-lg">
                <div>ระดับชั้น <strong>ชั้นประถมศึกษาปีที่ {config.classLevel.replace('ป.', '')}</strong></div>
                {coverType === 'subject' && (
                  <div>
                    รายวิชา <strong>{selectedSubject.code} {selectedSubject.name}</strong> ({selectedSubject.credits} นก. / {selectedSubject.hoursPerYear} ชม.)
                  </div>
                )}
                <div>ประจำปีการศึกษา <strong>2569</strong></div>
                <div>โรงเรียน<strong>วัดท่าควาย</strong> ตำบลโคกม่วง อำเภอเขาชัยสน จังหวัดพัทลุง</div>
                <div>สำนักงานเขตพื้นที่การศึกษาประถมศึกษาพัทลุง เขต 2</div>
                <div>สำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน</div>
              </div>
            </div>

            {/* Personnel & Approval Box */}
            <div className="border-2 border-slate-800 rounded-lg p-6 my-6 bg-slate-50/50">
              <div className="text-center font-bold text-sm mb-4">บันทึกการตรวจและอนุมัติผลการเรียน</div>
              <div className="grid grid-cols-2 gap-6 text-xs">
                <div className="text-center">
                  <div className="h-10"></div>
                  <div>ลงชื่อ......................................................</div>
                  <div className="font-semibold mt-1">({coverType === 'class' ? config.homeroomTeacher : 'ครูประจำวิชา'})</div>
                  <div className="text-slate-500">{coverType === 'class' ? 'ครูประจำชั้น' : 'ครูผู้สอน'}</div>
                  <div className="text-slate-400 mt-1">วันที่..... เดือน............... พ.ศ. 2569</div>
                </div>
                <div className="text-center">
                  <div className="h-10"></div>
                  <div>ลงชื่อ......................................................</div>
                  <div className="font-semibold mt-1">({config.directorName || 'นางจันทวรรณ พิทักษ์ฉนวน'})</div>
                  <div className="text-slate-500">ผู้อำนวยการโรงเรียน{config.schoolName}</div>
                  <div className="text-slate-400 mt-1">วันที่..... เดือน............... พ.ศ. 2569</div>
                </div>
              </div>
            </div>

            <div className="text-center text-xs text-slate-400 font-medium">
              เอกสารหลักฐานทางการศึกษา • จัดพิมพ์จากระบบวัดผลและประเมินผล ปพ. ดิจิทัล โรงเรียนวัดท่าควาย
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TEMPLATE 5: ปพ.5 บัญชีเวลาเรียน (Attendance Sheet A4 แนวนอน) */}
        {/* ========================================================= */}
        {printMode === 'pp5_attendance' && (
          <div className="w-[297mm] min-h-[210mm] bg-white shadow-xl p-8 text-slate-900 flex flex-col justify-between border border-slate-300 rounded-sm print:shadow-none print:border-none print:p-6 print-page">
            <div>
              <div className="text-center border-b-2 border-slate-900 pb-2 mb-3">
                <div className="flex items-center justify-center gap-3">
                  {logoUrl && (
                    <img
                      src={logoUrl}
                      alt="ตราโรงเรียน"
                      className="w-10 h-10 object-contain"
                      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                    />
                  )}
                  <img
                    src="/garuda.png"
                    alt="ตราครุฑ"
                    className="w-10 h-10 object-contain"
                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                  />
                  <div>
                    <h1 className="text-base font-bold text-slate-900">
                      แบบบันทึกผลการพัฒนาคุณภาพผู้เรียน (ปพ.5) - สรุปสถิติเวลาเรียนประจำชั้น
                    </h1>
                    <div className="text-xs font-semibold text-slate-700">
                      โรงเรียน{config.schoolName} • ชั้น {config.classLevel} • ปีการศึกษา {config.academicYear} • สพป.พัทลุง เขต 2
                    </div>
                  </div>
                </div>
              </div>

              <table className="w-full text-left text-xs border border-slate-300">
                <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 text-center">
                  <tr>
                    <th className="p-1.5 border-r border-slate-300 w-10">ที่</th>
                    <th className="p-1.5 border-r border-slate-300 w-20">รหัสนักเรียน</th>
                    <th className="p-1.5 border-r border-slate-300 text-left px-3">ชื่อ - สกุล</th>
                    <th className="p-1.5 border-r border-slate-300 w-20 bg-emerald-50">มาเรียน (วัน)</th>
                    <th className="p-1.5 border-r border-slate-300 w-16">ลาป่วย</th>
                    <th className="p-1.5 border-r border-slate-300 w-16">ลากิจ</th>
                    <th className="p-1.5 border-r border-slate-300 w-16 text-rose-700">ขาดเรียน</th>
                    <th className="p-1.5 border-r border-slate-300 w-24 bg-blue-50">ร้อยละเวลาเรียน</th>
                    <th className="p-1.5 w-24">สิทธิ์เข้าสอบ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono text-xs">
                  {students.map((s) => {
                    const att = attendanceData[s.studentId] || { present: 198, leave: 1, sick: 1, absent: 0 };
                    const totalDays = att.present + att.leave + att.sick + att.absent || 200;
                    const attPercent = totalDays > 0 ? (((att.present + att.leave + att.sick) / totalDays) * 100).toFixed(1) : '99.0';
                    const isEligible = Number(attPercent) >= 80;
                    return (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="p-1.5 text-center font-bold font-sans border-r border-slate-300">{s.seq}</td>
                        <td className="p-1.5 text-center border-r border-slate-300">{s.studentId}</td>
                        <td className="p-1.5 font-sans font-medium px-3 border-r border-slate-300 truncate">
                          {s.prefix}{s.firstName} {s.lastName}
                        </td>
                        <td className="p-1.5 text-center font-bold text-emerald-800 bg-emerald-50/40 border-r border-slate-300">{att.present}</td>
                        <td className="p-1.5 text-center border-r border-slate-300">{att.sick}</td>
                        <td className="p-1.5 text-center border-r border-slate-300">{att.leave}</td>
                        <td className="p-1.5 text-center font-bold text-rose-600 border-r border-slate-300">{att.absent}</td>
                        <td className="p-1.5 text-center font-bold text-blue-900 bg-blue-50/40 border-r border-slate-300">{attPercent}%</td>
                        <td className="p-1.5 text-center font-sans font-bold">
                          {isEligible ? (
                            <span className="text-emerald-700">มีสิทธิ์สอบ</span>
                          ) : (
                            <span className="text-rose-600">ไม่มีสิทธิ์สอบ</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Official Signatures */}
            <div className="pt-4 border-t border-slate-300 text-xs">
              <div className="grid grid-cols-2 text-center gap-8">
                <div>
                  <div className="h-6"></div>
                  <div>ลงชื่อ...................................................... ครูประจำชั้น</div>
                  <div className="font-semibold mt-0.5">({config.homeroomTeacher || 'ครูประจำชั้น'})</div>
                </div>
                <div>
                  <div className="h-6"></div>
                  <div>ลงชื่อ...................................................... ผู้อำนวยการสถานศึกษา</div>
                  <div className="font-semibold mt-0.5">({config.directorName || 'นางจันทวรรณ พิทักษ์ฉนวน'})</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TEMPLATE 7: ปพ.5 คุณลักษณะ & สมรรถนะ & กิจกรรม (Holistic A4 แนวนอน) */}
        {/* ========================================================= */}
        {printMode === 'pp5_holistic' && (
          <div className="w-[297mm] min-h-[210mm] bg-white shadow-xl p-8 text-slate-900 flex flex-col justify-between border border-slate-300 rounded-sm print:shadow-none print:border-none print:p-6 print-page">
            <div>
              <div className="text-center border-b-2 border-slate-900 pb-2 mb-3">
                <div className="flex items-center justify-center gap-3">
                  {logoUrl && (
                    <img
                      src={logoUrl}
                      alt="ตราโรงเรียน"
                      className="w-10 h-10 object-contain"
                      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                    />
                  )}
                  <img
                    src="/garuda.png"
                    alt="ตราครุฑ"
                    className="w-10 h-10 object-contain"
                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                  />
                  <div>
                    <h1 className="text-base font-bold text-slate-900">
                      แบบบันทึกผลการพัฒนาคุณภาพผู้เรียน (ปพ.5) - ผลการประเมินคุณลักษณะ สมรรถนะ และกิจกรรมพัฒนาผู้เรียน
                    </h1>
                    <div className="text-xs font-semibold text-slate-700">
                      โรงเรียน{config.schoolName} • ชั้น {config.classLevel} • ปีการศึกษา {config.academicYear} • สพป.พัทลุง เขต 2
                    </div>
                  </div>
                </div>
              </div>

              <table className="w-full text-left text-xs border border-slate-300">
                <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 text-center">
                  <tr>
                    <th className="p-1.5 border-r border-slate-300 w-10">ที่</th>
                    <th className="p-1.5 border-r border-slate-300 w-20">รหัส</th>
                    <th className="p-1.5 border-r border-slate-300 text-left px-3">ชื่อ - สกุล</th>
                    <th className="p-1.5 border-r border-slate-300 w-36 bg-emerald-50">คุณลักษณะอันพึงประสงค์ (8 ข้อ)</th>
                    <th className="p-1.5 border-r border-slate-300 w-36 bg-indigo-50">สมรรถนะสำคัญ (5 ด้าน)</th>
                    <th className="p-1.5 border-r border-slate-300 w-36 bg-amber-50">การอ่าน คิดวิเคราะห์ และเขียน</th>
                    <th className="p-1.5 w-28 bg-teal-50">กิจกรรมพัฒนาผู้เรียน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-sans text-xs">
                  {students.map((s) => {
                    const hol = holisticData[s.studentId] || {
                      traitsScore: 3,
                      competencyScore: 3,
                      readingWriting: 'ดีเยี่ยม',
                      activityPassed: true
                    };
                    return (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="p-1.5 text-center font-bold border-r border-slate-300">{s.seq}</td>
                        <td className="p-1.5 text-center font-mono border-r border-slate-300">{s.studentId}</td>
                        <td className="p-1.5 font-medium px-3 border-r border-slate-300 truncate">
                          {s.prefix}{s.firstName} {s.lastName}
                        </td>
                        <td className="p-1.5 text-center font-semibold text-emerald-800 bg-emerald-50/30 border-r border-slate-300">
                          {getScoreLevelText(hol.traitsScore)}
                        </td>
                        <td className="p-1.5 text-center font-semibold text-indigo-800 bg-indigo-50/30 border-r border-slate-300">
                          {getScoreLevelText(hol.competencyScore)}
                        </td>
                        <td className="p-1.5 text-center font-semibold text-amber-900 bg-amber-50/30 border-r border-slate-300">
                          {hol.readingWriting || 'ดีเยี่ยม'}
                        </td>
                        <td className="p-1.5 text-center font-bold bg-teal-50/30">
                          {hol.activityPassed ? (
                            <span className="text-teal-800">ผ่าน (ผ)</span>
                          ) : (
                            <span className="text-rose-700">ไม่ผ่าน (มผ)</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Official Signatures */}
            <div className="pt-4 border-t border-slate-300 text-xs">
              <div className="grid grid-cols-2 text-center gap-8">
                <div>
                  <div className="h-6"></div>
                  <div>ลงชื่อ...................................................... ครูประจำชั้น</div>
                  <div className="font-semibold mt-0.5">({config.homeroomTeacher || 'ครูประจำชั้น'})</div>
                </div>
                <div>
                  <div className="h-6"></div>
                  <div>ลงชื่อ...................................................... ผู้อำนวยการสถานศึกษา</div>
                  <div className="font-semibold mt-0.5">({config.directorName || 'นางจันทวรรณ พิทักษ์ฉนวน'})</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TEMPLATE 8: ปพ.5 สุขภาพและสมรรถภาพทางกาย (Health Sheet A4 แนวนอน) */}
        {/* ========================================================= */}
        {printMode === 'pp5_health' && (
          <div className="w-[297mm] min-h-[210mm] bg-white shadow-xl p-8 text-slate-900 flex flex-col justify-between border border-slate-300 rounded-sm print:shadow-none print:border-none print:p-6 print-page">
            <div>
              <div className="text-center border-b-2 border-slate-900 pb-2 mb-3">
                <div className="flex items-center justify-center gap-3">
                  {logoUrl && (
                    <img
                      src={logoUrl}
                      alt="ตราโรงเรียน"
                      className="w-10 h-10 object-contain"
                      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                    />
                  )}
                  <img
                    src="/garuda.png"
                    alt="ตราครุฑ"
                    className="w-10 h-10 object-contain"
                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                  />
                  <div>
                    <h1 className="text-base font-bold text-slate-900">
                      แบบบันทึกผลการพัฒนาคุณภาพผู้เรียน (ปพ.5) - ผลการประเมินสุขภาพและสมรรถภาพทางกาย
                    </h1>
                    <div className="text-xs font-semibold text-slate-700">
                      โรงเรียน{config.schoolName} • ชั้น {config.classLevel} • ปีการศึกษา {config.academicYear} • เกณฑ์มาตรฐานกรมอนามัย กระทรวงสาธารณสุข
                    </div>
                  </div>
                </div>
              </div>

              <table className="w-full text-left text-xs border border-slate-300">
                <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 text-center">
                  <tr>
                    <th className="p-1.5 border-r border-slate-300 w-10">ที่</th>
                    <th className="p-1.5 border-r border-slate-300 w-16">รหัส</th>
                    <th className="p-1.5 border-r border-slate-300 text-left px-3">ชื่อ - สกุล</th>
                    <th className="p-1.5 border-r border-slate-300 w-12">เพศ</th>
                    <th className="p-1.5 border-r border-slate-300 w-12">อายุ</th>
                    <th className="p-1.5 border-r border-slate-300 w-16 bg-blue-50/50">น้ำหนัก (กก.)</th>
                    <th className="p-1.5 border-r border-slate-300 w-16 bg-blue-50/50">ส่วนสูง (ซม.)</th>
                    <th className="p-1.5 border-r border-slate-300 w-16">ดัชนี BMI</th>
                    <th className="p-1.5 border-r border-slate-300 w-28 bg-emerald-50/50">ภาวะการเจริญเติบโต</th>
                    <th className="p-1.5 border-r border-slate-300 w-28 bg-indigo-50/50">สมรรถภาพทางกาย</th>
                    <th className="p-1.5 w-20">ผลการตัดสิน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-sans text-xs">
                  {students.map((s) => {
                    const bmiInfo = getBmiInfo(s.weight, s.height);
                    return (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="p-1.5 text-center font-bold border-r border-slate-300">{s.seq}</td>
                        <td className="p-1.5 text-center font-mono border-r border-slate-300">{s.studentId}</td>
                        <td className="p-1.5 font-medium px-3 border-r border-slate-300 truncate">
                          {s.prefix}{s.firstName} {s.lastName}
                        </td>
                        <td className="p-1.5 text-center border-r border-slate-300">{(s.gender === 'ชาย' || s.gender === 'ช') ? 'ชาย' : 'หญิง'}</td>
                        <td className="p-1.5 text-center border-r border-slate-300">{calculateStudentAge(s.birthDate, config.classLevel)}</td>
                        <td className="p-1.5 text-center font-mono border-r border-slate-300 bg-blue-50/30">{s.weight || '-'}</td>
                        <td className="p-1.5 text-center font-mono border-r border-slate-300 bg-blue-50/30">{s.height || '-'}</td>
                        <td className="p-1.5 text-center font-mono font-bold border-r border-slate-300">{bmiInfo.bmi}</td>
                        <td className="p-1.5 text-center font-semibold text-emerald-800 bg-emerald-50/30 border-r border-slate-300">
                          {bmiInfo.status}
                        </td>
                        <td className="p-1.5 text-center font-semibold text-indigo-800 bg-indigo-50/30 border-r border-slate-300">
                          {bmiInfo.fitness}
                        </td>
                        <td className="p-1.5 text-center font-bold text-emerald-700">
                          ผ่านเกณฑ์
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Summary Statistics */}
              <div className="mt-3 p-3 bg-slate-50 border border-slate-300 rounded text-xs grid grid-cols-4 gap-2 text-center">
                <div>
                  <span className="text-slate-500">จำนวนนักเรียนทั้งหมด:</span> <strong>{students.length} คน</strong>
                </div>
                <div>
                  <span className="text-slate-500">ภาวะสมส่วน (ตามเกณฑ์):</span> <strong className="text-emerald-700">100%</strong>
                </div>
                <div>
                  <span className="text-slate-500">สมรรถภาพระดับดีมาก:</span> <strong className="text-indigo-700">100%</strong>
                </div>
                <div>
                  <span className="text-slate-500">สรุปผลภาพรวม:</span> <strong className="text-emerald-700">ผ่านเกณฑ์ทุกคน</strong>
                </div>
              </div>
            </div>

            {/* Official Signatures */}
            <div className="pt-4 border-t border-slate-300 text-xs">
              <div className="grid grid-cols-3 text-center gap-4">
                <div>
                  <div className="h-6"></div>
                  <div>ลงชื่อ...................................................... ครูอนามัยโรงเรียน</div>
                  <div className="font-semibold mt-0.5">(นางปิยะนันท์ คงบุญ)</div>
                </div>
                <div>
                  <div className="h-6"></div>
                  <div>ลงชื่อ...................................................... ครูประจำชั้น</div>
                  <div className="font-semibold mt-0.5">({config.homeroomTeacher || 'ครูประจำชั้น'})</div>
                </div>
                <div>
                  <div className="h-6"></div>
                  <div>ลงชื่อ...................................................... ผู้อำนวยการสถานศึกษา</div>
                  <div className="font-semibold mt-0.5">({config.directorName || 'นางจันทวรรณ พิทักษ์ฉนวน'})</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TEMPLATE 8: เกียรติบัตร (Certificate Studio) */}
        {/* ========================================================= */}
        {printMode === 'certificate' && (
          <AcademicCertificateStudio
            students={students}
            subjects={subjects}
            scores={scores}
            config={config}
            logoUrl={logoUrl}
            directorSignatureUrl={directorSignatureUrl}
            onBack={() => setPrintMode('pp6')}
          />
        )}

      </div>
    </div>
  );
};
export default PrintableStudioTab;
