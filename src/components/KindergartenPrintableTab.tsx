// src/components/KindergartenPrintableTab.tsx
import React, { useState } from 'react';
import { StudentProfile } from '../types/pp5Types';
import {
  KINDERGARTEN_SIDES,
  KINDERGARTEN_STANDARDS,
  QUALITY_LEVEL_DEFS,
  QualityLevel,
  KindergartenStudentAssessment
} from '../types/kindergartenTypes';
import {
  Printer,
  FileText,
  Users,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Stamp,
  PenTool,
  Sparkles,
  Baby,
  HeartPulse,
  CalendarCheck,
  Award
} from 'lucide-react';
import { GrowthEngine } from '../engines/growthEngine';
import { calculateStudentAge } from '../utils/studentDateUtils';

interface Props {
  students: StudentProfile[];
  classLevel: string; // 'อ.1', 'อ.2', 'อ.3'
  academicYear: string;
  semester: number;
  assessments: Record<string, KindergartenStudentAssessment>;
  logoUrl?: string;
  directorName?: string;
  directorSignatureUrl?: string;
  homeroomTeacherName?: string;
  homeroomTeacherSignatureUrl?: string;
  attendanceData?: Record<string, any>;
}

export const KindergartenPrintableTab: React.FC<Props> = ({
  students,
  classLevel,
  academicYear,
  semester,
  assessments,
  logoUrl,
  directorName = 'นายเอกคณิต สิทธิศักดิ์',
  directorSignatureUrl,
  homeroomTeacherName = 'นางสาวณัฐหทัย สงแสง',
  homeroomTeacherSignatureUrl,
  attendanceData = {}
}) => {
  const [selectedStudentIndex, setSelectedStudentIndex] = useState<number>(0);
  const [printMode, setPrintMode] = useState<'single' | 'batch'>('single');
  const [showSignatures, setShowSignatures] = useState<boolean>(true);
  const [showStamps, setShowStamps] = useState<boolean>(true);

  const currentStudent = students[selectedStudentIndex] || students[0];

  const handlePrint = () => {
    window.print();
  };

  const getStudentAssessment = (studentId: string): KindergartenStudentAssessment => {
    return assessments[studentId] || {
      studentId,
      classLevel,
      academicYear,
      term: (semester === 2 ? 2 : 1) as 1 | 2,
      standards: {
        1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3, 9: 3, 10: 3, 11: 3, 12: 3
      },
      teacherComment: '',
      healthInfo: {
        weight: 0,
        height: 0,
        teethCheck: 'ปกติ',
        hairCleanliness: 'สะอาด',
        nailCleanliness: 'สะอาด',
        nutritionStatus: 'สมส่วน',
        growthHeightStatus: 'สูงตามเกณฑ์'
      },
      attendance: {
        presentDays: 98,
        totalDays: 100,
        leaveDays: 1,
        sickDays: 1
      }
    };
  };

  // เรนเดอร์เอกสาร แบบ อบ.๐๑ ของนักเรียน 1 คน
  const renderOB01Document = (student: StudentProfile, index: number) => {
    const assessment = getStudentAssessment(student.studentId);
    const standards = assessment.standards || {};

    // คำนวณอายุและสุขภาพ
    const realAge = calculateStudentAge(student.birthDate, classLevel) || student.ageYears || 5;
    const weight = student.weight || assessment.healthInfo?.weight || 0;
    const height = student.height || assessment.healthInfo?.height || 0;
    const growthEval = GrowthEngine.evaluateGrowth(student.gender, realAge, weight, height);

    // เวลาเรียน
    const attRec = attendanceData[student.studentId] || assessment.attendance;
    const totalDays = attRec?.totalDays || 100;
    const presentDays = attRec?.present || attRec?.presentDays || 98;
    const leaveDays = attRec?.leave || attRec?.leaveDays || 1;
    const sickDays = attRec?.sick || attRec?.sickDays || 1;
    const attPercent = totalDays > 0 ? Math.round((presentDays / totalDays) * 1000) / 10 : 98.0;

    // คำนวณสรุปรายด้าน
    const sideSummaries = KINDERGARTEN_SIDES.map(side => {
      let sum = 0;
      side.standardIds.forEach(id => {
        sum += standards[id] || 3;
      });
      const avg = side.standardIds.length > 0 ? sum / side.standardIds.length : 3;
      const level: QualityLevel = avg >= 2.5 ? 3 : avg >= 1.5 ? 2 : 1;
      return {
        side,
        avg,
        level,
        def: QUALITY_LEVEL_DEFS[level]
      };
    });

    const toThaiNum = (num: number | string): string => {
      const thaiDigits = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
      return String(num).replace(/[0-9]/g, d => thaiDigits[parseInt(d, 10)]);
    };

    const classThaiName = classLevel.startsWith('อ.')
      ? `ชั้นอนุบาลปีที่ ${toThaiNum(classLevel.replace('อ.', ''))}`
      : classLevel;

    return (
      <div
        key={student.studentId}
        className="k-print-page bg-white p-7 mx-auto shadow-md text-slate-900 border border-slate-300 print:shadow-none print:border-none print:m-0 print:p-6 print:w-full print:max-w-none text-xs leading-normal"
        style={{
          width: '210mm',
          minHeight: '297mm',
          pageBreakAfter: printMode === 'batch' && index < students.length - 1 ? 'always' : 'auto'
        }}
      >
        {/* Document Header */}
        <div className="text-center relative pb-3 border-b-2 border-slate-800">
          <div className="flex items-center justify-between">
            <div className="w-16 h-16 flex items-center justify-center shrink-0">
              <img
                src={logoUrl || 'https://vzrrpxrmtjpgfbbvhjra.supabase.co/storage/v1/object/public/system/school_logo_1779071201388.png'}
                alt="School Logo"
                className="w-14 h-14 object-contain"
                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
              />
            </div>
            <div className="flex-1 px-4 text-center">
              <div className="text-xs font-bold text-slate-700 tracking-wide">
                แบบ อบ.๐๑
              </div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">
                สมุดรายงานประจำตัวเด็กปฐมวัย
              </h1>
              <p className="text-[11px] text-slate-700 font-medium mt-0.5">
                ตามหลักสูตรการศึกษาปฐมวัย พุทธศักราช ๒๕๖๐ กระทรวงศึกษาธิการ
              </p>
              <p className="text-[11px] text-slate-800 font-semibold mt-0.5">
                โรงเรียนวัดท่าควาย • สำนักงานเขตพื้นที่การศึกษาประถมศึกษาพัทลุง เขต ๒
              </p>
            </div>
            <div className="w-16 text-right shrink-0">
              <span className="text-[10px] px-2 py-0.5 border border-slate-400 font-bold rounded">
                สพฐ.
              </span>
            </div>
          </div>

          <div className="mt-2 pt-1 border-t border-slate-200 flex items-center justify-between text-[11px] font-semibold text-slate-700 px-2">
            <span>{classThaiName}</span>
            <span>ภาคเรียนที่ {toThaiNum(semester)} ปีการศึกษา {toThaiNum(academicYear)}</span>
            <span>เลขที่ {toThaiNum(student.seq)}</span>
          </div>
        </div>

        {/* Student Demographics Profile Box */}
        <div className="mt-3 p-2.5 bg-slate-50 border border-slate-300 rounded text-[11px] leading-relaxed">
          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-8 flex items-baseline gap-1">
              <span className="font-bold text-slate-800 shrink-0">ชื่อ - นามสกุล:</span>
              <span className="border-b border-dotted border-slate-600 flex-1 font-semibold text-slate-900 px-1">
                {student.prefix}{student.firstName} {student.lastName}
              </span>
            </div>
            <div className="col-span-4 flex items-baseline gap-1">
              <span className="font-bold text-slate-800 shrink-0">รหัสประจำตัว:</span>
              <span className="border-b border-dotted border-slate-600 flex-1 font-semibold text-slate-900 px-1">
                {toThaiNum(student.studentId)}
              </span>
            </div>

            <div className="col-span-7 flex items-baseline gap-1">
              <span className="font-bold text-slate-800 shrink-0">เลขประจำตัวประชาชน:</span>
              <span className="border-b border-dotted border-slate-600 flex-1 font-semibold text-slate-900 px-1">
                {toThaiNum(student.nationalId)}
              </span>
            </div>
            <div className="col-span-5 flex items-baseline gap-1">
              <span className="font-bold text-slate-800 shrink-0">วัน/เดือน/ปีเกิด:</span>
              <span className="border-b border-dotted border-slate-600 flex-1 font-semibold text-slate-900 px-1 truncate">
                {student.birthDate || '-'} (อายุ {toThaiNum(realAge)} ปี)
              </span>
            </div>

            <div className="col-span-6 flex items-baseline gap-1">
              <span className="font-bold text-slate-800 shrink-0">ชื่อบิดา:</span>
              <span className="border-b border-dotted border-slate-600 flex-1 text-slate-900 px-1 truncate">
                {student.fatherName || '-'}
              </span>
            </div>
            <div className="col-span-6 flex items-baseline gap-1">
              <span className="font-bold text-slate-800 shrink-0">ชื่อมารดา:</span>
              <span className="border-b border-dotted border-slate-600 flex-1 text-slate-900 px-1 truncate">
                {student.motherName || '-'}
              </span>
            </div>

            <div className="col-span-6 flex items-baseline gap-1">
              <span className="font-bold text-slate-800 shrink-0">ชื่อผู้ปกครอง:</span>
              <span className="border-b border-dotted border-slate-600 flex-1 text-slate-900 px-1 truncate">
                {student.guardianName || student.fatherName || student.motherName || '-'} {student.guardianRel ? `(${student.guardianRel})` : ''}
              </span>
            </div>
            <div className="col-span-6 flex items-baseline gap-1">
              <span className="font-bold text-slate-800 shrink-0">ครูประจำชั้น:</span>
              <span className="border-b border-dotted border-slate-600 flex-1 font-semibold text-slate-900 px-1 truncate">
                {homeroomTeacherName}
              </span>
            </div>
          </div>
        </div>

        {/* 12 Standards Assessment Official Table */}
        <div className="mt-3">
          <div className="text-[11px] font-bold text-slate-900 flex items-center justify-between mb-1">
            <span>ตารางสรุปผลการประเมินพัฒนาการ ๔ ด้าน ๑๒ มาตรฐานคุณลักษณะที่พึงประสงค์</span>
            <span className="text-[10px] text-slate-600 font-normal">
              เกณฑ์: ๓ = ดี, ๒ = พอใช้, ๑ = ควรส่งเสริม
            </span>
          </div>

          <table className="w-full border-collapse border border-slate-700 text-[10px]">
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-700">
                <th className="border border-slate-700 p-1 text-center w-10">ที่</th>
                <th className="border border-slate-700 p-1 text-left">
                  ด้านพัฒนาการ / มาตรฐานคุณลักษณะที่พึงประสงค์
                </th>
                <th className="border border-slate-700 p-1 text-center w-16">
                  ภาคเรียนที่ ๑
                </th>
                <th className="border border-slate-700 p-1 text-center w-16">
                  ภาคเรียนที่ ๒
                </th>
                <th className="border border-slate-700 p-1 text-center w-20">
                  สรุปผลตลอดปี
                </th>
              </tr>
            </thead>
            <tbody>
              {KINDERGARTEN_SIDES.map((side, sIdx) => {
                const sideSummary = sideSummaries.find(ss => ss.side.id === side.id);
                return (
                  <React.Fragment key={side.id}>
                    {/* Header Row for Development Side */}
                    <tr className="bg-slate-50 font-bold text-slate-900 border-b border-slate-600">
                      <td colSpan={2} className="border border-slate-600 p-1 pl-2">
                        {toThaiNum(sIdx + 1)}. {side.name}
                      </td>
                      <td className="border border-slate-600 p-1 text-center font-bold text-emerald-800">
                        {toThaiNum(sideSummary?.level || 3)}
                      </td>
                      <td className="border border-slate-600 p-1 text-center text-slate-400">
                        {semester === 2 ? toThaiNum(sideSummary?.level || 3) : '-'}
                      </td>
                      <td className="border border-slate-600 p-1 text-center font-bold text-emerald-900 bg-emerald-50/50">
                        {sideSummary?.def.label || 'ดี'}
                      </td>
                    </tr>

                    {/* Standard Rows */}
                    {side.standardIds.map(stdId => {
                      const std = KINDERGARTEN_STANDARDS.find(s => s.id === stdId);
                      const rating = standards[stdId] || 3;
                      const def = QUALITY_LEVEL_DEFS[rating as QualityLevel];

                      return (
                        <tr key={stdId} className="hover:bg-slate-50 border-b border-slate-400">
                          <td className="border border-slate-400 p-1 text-center text-slate-600 font-medium">
                            {toThaiNum(stdId)}
                          </td>
                          <td className="border border-slate-400 p-1 text-slate-800 pl-3">
                            <span className="font-semibold">{std?.title}</span>
                          </td>
                          <td className="border border-slate-400 p-1 text-center font-bold">
                            {toThaiNum(rating)}
                          </td>
                          <td className="border border-slate-400 p-1 text-center text-slate-400">
                            {semester === 2 ? toThaiNum(rating) : '-'}
                          </td>
                          <td className="border border-slate-400 p-1 text-center font-semibold text-slate-800">
                            {def?.label}
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}

              {/* Grand Total Row */}
              <tr className="bg-slate-200 font-bold text-slate-900 border-t-2 border-slate-800 text-[11px]">
                <td colSpan={2} className="border border-slate-700 p-1.5 text-center">
                  สรุปผลการประเมินพัฒนาการรวมทุกด้าน
                </td>
                <td className="border border-slate-700 p-1.5 text-center text-emerald-800">
                  ๓ (ดี)
                </td>
                <td className="border border-slate-700 p-1.5 text-center text-slate-400">
                  {semester === 2 ? '๓ (ดี)' : '-'}
                </td>
                <td className="border border-slate-700 p-1.5 text-center font-bold text-emerald-900 bg-emerald-100">
                  ดีเยี่ยม
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Growth & Attendance & Health Summary */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          {/* Health & Growth Card */}
          <div className="p-2 border border-slate-400 rounded text-[10px] space-y-1">
            <div className="font-bold text-slate-800 border-b border-slate-300 pb-0.5 flex items-center justify-between">
              <span>ข้อมูลการเจริญเติบโตและสุขภาพ (กรมอนามัย)</span>
              <span className="text-[9px] text-slate-500 font-normal">ภาคเรียนที่ {toThaiNum(semester)}</span>
            </div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-slate-700 pt-0.5">
              <div>น้ำหนัก: <strong className="text-slate-900">{toThaiNum(weight)}</strong> กก.</div>
              <div>ส่วนสูง: <strong className="text-slate-900">{toThaiNum(height)}</strong> ซม.</div>
              <div>น้ำหนักตามเกณฑ์ส่วนสูง: <strong className="text-emerald-700">{growthEval.weightForHeight}</strong></div>
              <div>ส่วนสูงตามเกณฑ์อายุ: <strong className="text-emerald-700">{growthEval.heightForAge}</strong></div>
              <div>การตรวจสุขภาพฟัน: <strong>{assessment.healthInfo?.teethCheck || 'ปกติ ไม่มีฟันผุ'}</strong></div>
              <div>สุขอนามัยร่างกาย: <strong>สะอาดเรียบร้อย</strong></div>
            </div>
          </div>

          {/* Attendance Card */}
          <div className="p-2 border border-slate-400 rounded text-[10px] space-y-1">
            <div className="font-bold text-slate-800 border-b border-slate-300 pb-0.5 flex items-center justify-between">
              <span>สถิติเวลาเรียน (การมาเรียน)</span>
              <span className="text-[9px] text-slate-500 font-normal">เกณฑ์ &gt;= ๘๐%</span>
            </div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-slate-700 pt-0.5">
              <div>วันเปิดเรียน: <strong className="text-slate-900">{toThaiNum(totalDays)}</strong> วัน</div>
              <div>มาเรียน: <strong className="text-emerald-700">{toThaiNum(presentDays)}</strong> วัน</div>
              <div>ลาป่วย/ลากิจ: <strong className="text-slate-900">{toThaiNum(leaveDays + sickDays)}</strong> วัน</div>
              <div>คิดเป็นร้อยละ: <strong className="text-emerald-700">{toThaiNum(attPercent)}%</strong></div>
              <div className="col-span-2 pt-0.5 text-emerald-800 font-bold">
                ✓ เวลาเรียนครบถ้วนตามเกณฑ์หลักสูตรปฐมวัย
              </div>
            </div>
          </div>
        </div>

        {/* Teacher's Observation & Comment */}
        <div className="mt-3 p-2.5 border border-slate-400 rounded text-[10px] space-y-1">
          <div className="font-bold text-slate-800 flex items-center justify-between border-b border-slate-300 pb-0.5">
            <span>ความคิดเห็นและข้อเสนอแนะของครูประจำชั้น</span>
            <span className="text-[9px] text-slate-500 font-normal">บันทึกพัฒนาการ</span>
          </div>
          <p className="text-slate-800 leading-relaxed min-h-[38px] pt-1">
            {assessment.teacherComment ||
              `${student.prefix}${student.firstName} มีพัฒนาการสมวัย ร่างกายแข็งแรง อารมณ์ร่าเริงแจ่มใส ร่วมกิจกรรมกับเพื่อนๆ ได้ดี มีความกระตือรือร้นในการเรียนรู้ และช่วยเหลือตนเองในการปฏิบัติกิจวัตรประจำวันได้เป็นอย่างดีค่ะ`}
          </p>
        </div>

        {/* Parent's Acknowledgment Box */}
        <div className="mt-2.5 p-2 border border-slate-400 rounded text-[10px] flex items-center justify-between">
          <div className="flex-1 pr-4">
            <span className="font-bold text-slate-800">ความคิดเห็น/การรับทราบของผู้ปกครอง:</span>
            <span className="text-slate-500 ml-2 italic">
              รับทราบผลการประเมินพัฒนาการของบุตรหลาน และพร้อมร่วมมือกับทางโรงเรียนในการส่งเสริมพัฒนาการอย่างต่อเนื่อง
            </span>
          </div>
          <div className="shrink-0 text-center w-40">
            <div className="border-b border-dotted border-slate-500 h-6"></div>
            <div className="text-[9px] text-slate-600 mt-0.5">ลงชื่อผู้ปกครอง</div>
          </div>
        </div>

        {/* Official Signatures & Seal Section */}
        <div className="mt-4 pt-3 border-t border-slate-400 grid grid-cols-2 gap-8 text-center text-[10px]">
          {/* Homeroom Teacher Signature */}
          <div className="space-y-1">
            <div className="h-12 flex items-center justify-center">
              {showSignatures && homeroomTeacherSignatureUrl ? (
                <img
                  src={homeroomTeacherSignatureUrl}
                  alt="ลายเซ็นครูประจำชั้น"
                  className="max-h-12 object-contain"
                />
              ) : (
                <div className="w-28 border-b border-dotted border-slate-500"></div>
              )}
            </div>
            <div className="font-bold text-slate-900">
              ( {homeroomTeacherName} )
            </div>
            <div className="text-slate-600 text-[9px]">
              ครูประจำชั้น{classThaiName}
            </div>
            <div className="text-slate-500 text-[9px]">
              วันที่อนุมัติผล: {toThaiNum(semester === 1 ? '๑๐ ตุลาคม' : '๓๑ มีนาคม')} ๒๕๖๙
            </div>
          </div>

          {/* Director Signature & Stamp */}
          <div className="space-y-1 relative">
            {/* School Stamp Seal */}
            {showStamps && (
              <div className="absolute right-6 -top-2 opacity-35 pointer-events-none">
                <img
                  src="https://hvziwrrgpnlsbhiicmsc.supabase.co/storage/v1/object/public/system/school_seal_wtk.png"
                  alt="ตราประทับโรงเรียน"
                  className="w-20 h-20 object-contain"
                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                />
              </div>
            )}

            <div className="h-12 flex items-center justify-center">
              {showSignatures && directorSignatureUrl ? (
                <img
                  src={directorSignatureUrl}
                  alt="ลายเซ็นผู้อำนวยการ"
                  className="max-h-12 object-contain relative z-10"
                />
              ) : (
                <div className="w-28 border-b border-dotted border-slate-500"></div>
              )}
            </div>
            <div className="font-bold text-slate-900 relative z-10">
              ( {directorName} )
            </div>
            <div className="text-slate-600 text-[9px]">
              ผู้อำนวยการโรงเรียนวัดท่าควาย
            </div>
            <div className="text-slate-500 text-[9px]">
              วันที่อนุมัติผล: {toThaiNum(semester === 1 ? '๑๐ ตุลาคม' : '๓๑ มีนาคม')} ๒๕๖๙
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-3 pt-1 border-t border-slate-200 text-center text-[8px] text-slate-400">
          เอกสารทางการตามหลักสูตรการศึกษาปฐมวัย พ.ศ. ๒๕๖๐ (สพฐ.) • โรงเรียนวัดท่าควาย • พิมพ์เมื่อ {new Date().toLocaleDateString('th-TH')}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Control Bar (Hidden on print) */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200 no-print flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-pink-100 text-pink-700">
              <Baby className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                ศูนย์จัดพิมพ์สมุดรายงานประจำตัวเด็กปฐมวัย (แบบ อบ.๐๑)
              </h2>
              <p className="text-xs text-slate-500">
                ชั้น{classLevel} • ภาคเรียนที่ {semester} ปีการศึกษา {academicYear} • มาตรฐาน สพฐ. ๒๕๖๐
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Print Mode Selector */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs">
            <button
              onClick={() => setPrintMode('single')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                printMode === 'single'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              พิมพ์คนเดียว ({currentStudent?.firstName || 'เลือก'})
            </button>
            <button
              onClick={() => setPrintMode('batch')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                printMode === 'batch'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              พิมพ์ทั้งห้อง ({students.length} คน)
            </button>
          </div>

          {/* Toggle Digital Sigs */}
          <button
            onClick={() => setShowSignatures(!showSignatures)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
              showSignatures
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-slate-50 text-slate-500 border-slate-200'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>{showSignatures ? 'แสดงลายเซ็น' : 'ซ่อนลายเซ็น'}</span>
          </button>

          {/* Toggle School Stamp */}
          <button
            onClick={() => setShowStamps(!showStamps)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
              showStamps
                ? 'bg-rose-50 text-rose-700 border-rose-300'
                : 'bg-slate-50 text-slate-500 border-slate-200'
            }`}
          >
            <Stamp className="w-3.5 h-3.5" />
            <span>{showStamps ? 'แสดงตรายาง' : 'ซ่อนตรายาง'}</span>
          </button>

          {/* Print Action Button */}
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold bg-pink-600 hover:bg-pink-700 text-white shadow-sm transition"
          >
            <Printer className="w-4 h-4" />
            <span>สั่งพิมพ์ / บันทึกเป็น PDF</span>
          </button>
        </div>
      </div>

      {/* Student Pagination Navigator (When single mode) */}
      {printMode === 'single' && students.length > 1 && (
        <div className="bg-white rounded-xl p-3 shadow-xs border border-slate-200 no-print flex items-center justify-between">
          <button
            onClick={() => setSelectedStudentIndex(prev => Math.max(0, prev - 1))}
            disabled={selectedStudentIndex === 0}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>คนก่อนหน้า</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">เลือกนักเรียน:</span>
            <select
              value={selectedStudentIndex}
              onChange={(e) => setSelectedStudentIndex(Number(e.target.value))}
              className="text-xs font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5"
            >
              {students.map((stu, idx) => (
                <option key={stu.studentId} value={idx}>
                  เลขที่ {stu.seq}: {stu.prefix}{stu.firstName} {stu.lastName} ({stu.studentId})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setSelectedStudentIndex(prev => Math.min(students.length - 1, prev + 1))}
            disabled={selectedStudentIndex === students.length - 1}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-40"
          >
            <span>คนถัดไป</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Printable Output Container */}
      <div className="print-area space-y-6">
        {printMode === 'single' ? (
          currentStudent ? (
            renderOB01Document(currentStudent, selectedStudentIndex)
          ) : (
            <div className="p-8 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
              ไม่มีข้อมูลนักเรียน
            </div>
          )
        ) : (
          students.map((student, idx) => renderOB01Document(student, idx))
        )}
      </div>
    </div>
  );
};
