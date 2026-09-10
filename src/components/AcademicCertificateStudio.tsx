// src/components/AcademicCertificateStudio.tsx
import React, { useState, useMemo } from 'react';
import { 
  StudentProfile, 
  SubjectConfig, 
  AcademicConfig, 
  StudentScoreRecord 
} from '../types/pp5Types';
import { GradingEngine } from '../engines/gradingEngine';
import { 
  Award, 
  Printer, 
  Trophy, 
  Medal, 
  Star, 
  CheckCircle2, 
  Sparkles, 
  Sliders, 
  Filter, 
  Calendar, 
  QrCode, 
  Download,
  ArrowLeft,
  ChevronDown
} from 'lucide-react';
import QRCode from 'qrcode';

interface Props {
  students: StudentProfile[];
  subjects: SubjectConfig[];
  scores: Record<string, Record<string, StudentScoreRecord>>;
  config: AcademicConfig;
  logoUrl?: string;
  directorSignatureUrl?: string;
  homeroomTeacherSignatureUrl?: string;
  onBack?: () => void;
}

export interface CertificateItem {
  id: string;
  type: 'subject_top' | 'academic_excellence';
  student: StudentProfile;
  title: string;
  subjectName?: string;
  subjectCode?: string;
  score?: number;
  fullScore?: number;
  gpa?: number;
  rank?: number | string;
  certificateNo: string;
  isTied: boolean;
}

// แปลงตัวเลขอารบิกเป็นเลขไทย
const toThaiNumber = (num: number | string): string => {
  const thaiDigits = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
  return String(num).replace(/[0-9]/g, (digit) => thaiDigits[parseInt(digit, 10)]);
};

export const AcademicCertificateStudio: React.FC<Props> = ({
  students,
  subjects,
  scores,
  config,
  logoUrl = 'https://vzrrpxrmtjpgfbbvhjra.supabase.co/storage/v1/object/public/system/school_logo_1779071201388.png',
  directorSignatureUrl = 'https://vzrrpxrmtjpgfbbvhjra.supabase.co/storage/v1/object/public/system/director_sig_1778032124756.png',
  homeroomTeacherSignatureUrl = '',
  onBack
}) => {
  // ตัวเลือกการแสดงผล
  const [filterType, setFilterType] = useState<'ALL' | 'SUBJECTS_ONLY' | 'EXCELLENCE_ONLY' | string>('ALL');
  const [borderStyle, setBorderStyle] = useState<'thai_gold' | 'borderless'>('thai_gold');
  const [issueDate, setIssueDate] = useState<string>('๓๑ มีนาคม พุทธศักราช ๒๕๖๙');
  const [blessingText, setBlessingText] = useState<string>(
    'ขออำนวยอวยพรให้มีความเจริญก้าวหน้าในวิทยาการและสัมฤทธิผลในสิ่งอันพึงปรารถนาทุกประการ'
  );
  const [certificatePrefix, setCertificatePrefix] = useState<string>('คย.กบ.');

  // QR Code URL Cache
  const [qrMap, setQrMap] = useState<Record<string, string>>({});

  // คำนวณผู้ได้คะแนนสูงสุดของแต่ละรายวิชา และผู้ได้ GPA สูงสุด (1-3)
  const certificateList = useMemo<CertificateItem[]>(() => {
    const list: CertificateItem[] = [];
    let certCounter = 1;

    // 1. หมวดคะแนนยอดเยี่ยมประจำรายวิชา (Subject Top Scorers)
    subjects.forEach((sub) => {
      const subScores = scores[sub.id] || {};
      let maxScore = -1;

      // หาคะแนนสูงสุด
      students.forEach((s) => {
        const rec = subScores[s.studentId];
        const sc = config.semester === 1
          ? (rec?.total1 ?? rec?.yearlyTotal ?? null)
          : (rec?.yearlyTotal ?? rec?.total2 ?? rec?.total1 ?? null);

        if (sc !== null && !isNaN(sc) && sc > maxScore) {
          maxScore = sc;
        }
      });

      // ถ้ามีคะแนนมากกว่า 0 ให้ค้นหานักเรียนทุกคนที่ได้คะแนนสูงสุดเท่ากัน (รองรับ Tie)
      if (maxScore > 0) {
        const topStudents = students.filter((s) => {
          const rec = subScores[s.studentId];
          const sc = config.semester === 1
            ? (rec?.total1 ?? rec?.yearlyTotal ?? null)
            : (rec?.yearlyTotal ?? rec?.total2 ?? rec?.total1 ?? null);
          return sc === maxScore;
        });

        const isTied = topStudents.length > 1;

        topStudents.forEach((std) => {
          const numStr = String(certCounter).padStart(3, '0');
          list.push({
            id: `sub_${sub.id}_${std.studentId}`,
            type: 'subject_top',
            student: std,
            title: 'เกียรติบัตรคะแนนยอดเยี่ยมประจำรายวิชา',
            subjectName: sub.name,
            subjectCode: sub.code,
            score: maxScore,
            fullScore: config.semester === 1 ? (sub.fullScoreTerm1 || 50) : 100,
            certificateNo: `${certificatePrefix} ${toThaiNumber(numStr)}/${toThaiNumber(config.academicYear)}`,
            isTied
          });
          certCounter++;
        });
      }
    });

    // 2. หมวดผลการเรียนดีเด่น (Academic Excellence GPA Top 1-3)
    const studentGpaList = students.map((s) => {
      const gradeList: { grade: string; credits: number }[] = [];
      let totalRaw = 0;
      let hasAny = false;

      subjects.forEach((sub) => {
        const rec = scores[sub.id]?.[s.studentId];
        const gr = rec?.grade && rec.grade !== '-' ? rec.grade : '-';
        if (gr !== '-') {
          gradeList.push({ grade: gr, credits: sub.credits });
        }
        const sc = rec?.yearlyTotal ?? rec?.total1;
        if (sc !== undefined && sc !== null && !isNaN(sc)) {
          totalRaw += sc;
          hasAny = true;
        }
      });

      const gpa = gradeList.length > 0 ? GradingEngine.calculateGPA(gradeList) : null;
      return {
        studentId: s.studentId,
        student: s,
        gpa,
        totalRawScore: hasAny ? totalRaw : null
      };
    });

    const rankResults = GradingEngine.calculateRankings(studentGpaList, 'gpa_rawscore_tiebreaker');

    studentGpaList.forEach((item) => {
      const rk = rankResults[item.studentId];
      if (rk && typeof rk.rank === 'number' && rk.rank <= 3 && item.gpa !== null) {
        const numStr = String(certCounter).padStart(3, '0');
        list.push({
          id: `gpa_${item.studentId}`,
          type: 'academic_excellence',
          student: item.student,
          title: 'เกียรติบัตรผลการเรียนดีเด่น',
          gpa: item.gpa,
          rank: rk.rank,
          certificateNo: `${certificatePrefix} ${toThaiNumber(numStr)}/${toThaiNumber(config.academicYear)}`,
          isTied: rk.isTie
        });
        certCounter++;
      }
    });

    return list;
  }, [students, subjects, scores, config, certificatePrefix]);

  // สร้าง QR Code สำหรับตรวจสอบเกียรติบัตร
  React.useEffect(() => {
    certificateList.forEach((cert) => {
      const base = typeof window !== 'undefined'
        ? window.location.origin
        : 'https://school-grading-pp56.vercel.app';

      let verifyUrl = `${base}/?verify=1&nid=${cert.student.nationalId}&sid=${cert.student.studentId}`;
      if (cert.type === 'subject_top') {
        // หา subjectId จาก subjects array โดย match subjectCode
        const matchedSubject = subjects.find(s => s.code === cert.subjectCode || s.name === cert.subjectName);
        verifyUrl += `&type=subject&subjectId=${encodeURIComponent(matchedSubject?.id || cert.subjectCode || '')}`;
      } else {
        verifyUrl += `&type=gpa&rank=${cert.rank || 1}`;
      }

      QRCode.toDataURL(verifyUrl, {
        width: 140,
        margin: 1,
        color: {
          dark: '#064e3b',
          light: '#ffffff'
        }
      }).then((url) => {
        setQrMap((prev) => ({ ...prev, [cert.id]: url }));
      });
    });
  }, [certificateList, subjects]);

  // กรองเกียรติบัตรที่แสดงผลตามตัวเลือก
  const filteredCertificates = useMemo(() => {
    if (filterType === 'ALL') return certificateList;
    if (filterType === 'SUBJECTS_ONLY') return certificateList.filter((c) => c.type === 'subject_top');
    if (filterType === 'EXCELLENCE_ONLY') return certificateList.filter((c) => c.type === 'academic_excellence');
    // กรองรายวิชาเฉพาะ
    return certificateList.filter((c) => c.subjectCode === filterType || c.id.includes(filterType));
  }, [certificateList, filterType]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Print Control Toolbar (Hidden on Print) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 no-print">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                title="ย้อนกลับ"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-200">
              <Trophy className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>ระบบออกเกียรติบัตรนักเรียนคะแนนสูงสุดรายวิชา & เรียนดีเด่น</span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold border border-amber-200">
                  {filteredCertificates.length} รายการ
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                พิมพ์เกียรติบัตรมาตรฐาน สพฐ. แนวนอน (A4 Landscape) พร้อมกรอบทองลายไทย หรือโหมดไร้กรอบสำหรับกระดาษการ์ดสำเร็จรูป
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filter Category */}
            <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200 text-xs">
              <button
                onClick={() => setFilterType('ALL')}
                className={`px-3 py-1.5 font-bold rounded-lg transition ${
                  filterType === 'ALL' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ทั้งหมด ({certificateList.length})
              </button>
              <button
                onClick={() => setFilterType('SUBJECTS_ONLY')}
                className={`px-3 py-1.5 font-bold rounded-lg transition ${
                  filterType === 'SUBJECTS_ONLY' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                คะแนนสูงสุดรายวิชา
              </button>
              <button
                onClick={() => setFilterType('EXCELLENCE_ONLY')}
                className={`px-3 py-1.5 font-bold rounded-lg transition ${
                  filterType === 'EXCELLENCE_ONLY' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                เรียนดีเด่น (Top 1-3)
              </button>
            </div>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md transition"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์เกียรติบัตรที่เลือก ({filteredCertificates.length} ใบ)</span>
            </button>
          </div>
        </div>

        {/* Customization Options Bar */}
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {/* Border Option */}
          <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <span className="text-slate-600 font-bold shrink-0">รูปแบบกรอบ:</span>
            <select
              value={borderStyle}
              onChange={(e) => setBorderStyle(e.target.value as any)}
              className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="thai_gold">🌟 กรอบทองลายไทยพรีเมียม (พิมพ์บนกระดาษขาว)</option>
              <option value="borderless">📄 ไม่มีกรอบ (พิมพ์บนกระดาษการ์ดทองสำเร็จรูป)</option>
            </select>
          </div>

          {/* Issue Date */}
          <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <span className="text-slate-600 font-bold shrink-0">วันที่ลงนาม:</span>
            <input
              type="text"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              placeholder="เช่น ๓๑ มีนาคม พุทธศักราช ๒๕๖๙"
              className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Certificate Prefix */}
          <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <span className="text-slate-600 font-bold shrink-0">รหัสเลขที่:</span>
            <input
              type="text"
              value={certificatePrefix}
              onChange={(e) => setCertificatePrefix(e.target.value)}
              placeholder="เช่น คย.กบ."
              className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Certificate Pages List (Rendered on screen and print) */}
      <div className="flex flex-col items-center gap-10 print:gap-0 print:block">
        {filteredCertificates.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 w-full max-w-xl text-slate-500">
            <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <div className="font-bold text-slate-700 text-sm">ยังไม่มีข้อมูลคะแนนสำหรับจัดทำเกียรติบัตร</div>
            <p className="text-xs mt-1">โปรดบันทึกคะแนนในแท็บ "กรอกคะแนน & ตัดเกรด" ให้เรียบร้อยก่อนครับ</p>
          </div>
        ) : (
          filteredCertificates.map((cert) => (
            <div
              key={cert.id}
              className="w-[297mm] h-[210mm] min-h-[210mm] max-h-[210mm] bg-white shadow-2xl p-6 sm:p-10 text-slate-900 flex flex-col justify-between border border-slate-300 rounded-sm relative overflow-hidden print:shadow-none print:border-none print:m-0 print:p-8 print-page"
              style={{ pageBreakAfter: 'always' }}
            >
              {/* Premium Thai Gold Vector Border (Optional) */}
              {borderStyle === 'thai_gold' && (
                <div className="absolute inset-3 sm:inset-4 border-4 border-amber-600/90 rounded-sm pointer-events-none p-1.5">
                  <div className="w-full h-full border-2 border-dashed border-amber-500/70 relative">
                    {/* 4 Corner Thai Ornaments */}
                    <div className="absolute -top-1.5 -left-1.5 w-8 h-8 border-t-4 border-l-4 border-amber-700"></div>
                    <div className="absolute -top-1.5 -right-1.5 w-8 h-8 border-t-4 border-r-4 border-amber-700"></div>
                    <div className="absolute -bottom-1.5 -left-1.5 w-8 h-8 border-b-4 border-l-4 border-amber-700"></div>
                    <div className="absolute -bottom-1.5 -right-1.5 w-8 h-8 border-b-4 border-r-4 border-amber-700"></div>

                    {/* Subtle Golden Guilloche Background Glow */}
                    <div className="absolute inset-0 bg-radial from-amber-50/40 via-transparent to-amber-100/20 pointer-events-none"></div>
                  </div>
                </div>
              )}

              {/* Certificate Inner Content */}
              <div className="relative z-10 flex flex-col justify-between h-full px-6 py-4">
                
                {/* Top Section: Logo & Certificate Header */}
                <div className="text-center space-y-2">
                  <div className="flex justify-center items-center gap-3">
                    <img
                      src={logoUrl || '/logo.png'}
                      alt="School Logo"
                      className="w-16 h-16 object-contain filter drop-shadow-sm"
                      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                    />
                  </div>

                  <div className="space-y-0.5">
                    <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-slate-900 font-serif">
                      โรงเรียน{config.schoolName}
                    </h3>
                    <p className="text-xs sm:text-sm font-medium text-slate-600">
                      สำนักงานเขตพื้นที่การศึกษาประถมศึกษาพัทลุง เขต ๒
                    </p>
                  </div>

                  <div className="pt-2">
                    <div className="inline-block border-b-2 border-amber-600/80 pb-1 px-8">
                      <span className="text-xs sm:text-sm font-bold text-amber-900 tracking-widest uppercase">
                        เกียรติบัตรฉบับนี้ให้ไว้เพื่อแสดงว่า
                      </span>
                    </div>
                  </div>
                </div>

                {/* Center Section: Student Name & Achievement */}
                <div className="text-center my-auto space-y-3">
                  {/* Recipient Student Name */}
                  <div className="py-1">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight font-serif">
                      {cert.student.prefix}{cert.student.firstName} {cert.student.lastName}
                    </h2>
                    <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-1">
                      นักเรียนชั้นประถมศึกษาปีที่ {toThaiNumber(config.classLevel.replace(/\D/g, '') || '๑')} (รหัสประจำตัว {toThaiNumber(cert.student.studentId)})
                    </p>
                  </div>

                  {/* Achievement Description */}
                  <div className="max-w-2xl mx-auto py-2 bg-amber-50/60 rounded-xl border border-amber-200/70 p-3 shadow-xs">
                    {cert.type === 'subject_top' ? (
                      <div className="space-y-1">
                        <div className="text-base sm:text-lg font-bold text-amber-950">
                          ได้ผลการเรียนยอดเยี่ยม คะแนนสูงสุดในรายวิชา
                        </div>
                        <div className="text-lg sm:text-xl font-extrabold text-emerald-900">
                          {cert.subjectName} ({toThaiNumber(cert.subjectCode || '')})
                        </div>
                        <div className="text-xs sm:text-sm font-semibold text-slate-700">
                          ได้คะแนนรวม <span className="text-emerald-800 font-bold">{toThaiNumber(cert.score || 0)}</span> จากคะแนนเต็ม {toThaiNumber(cert.fullScore || 100)} คะแนน {cert.isTied && <span className="text-amber-700 font-normal">(คะแนนสูงสุดร่วม)</span>}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="text-base sm:text-lg font-bold text-amber-950">
                          มีผลการเรียนดีเด่น อันดับที่ {toThaiNumber(cert.rank || 1)} ของระดับชั้น
                        </div>
                        <div className="text-lg sm:text-xl font-extrabold text-emerald-900">
                          เกรดเฉลี่ยสะสม (GPA) {toThaiNumber((cert.gpa || 0).toFixed(2))}
                        </div>
                        <div className="text-xs font-semibold text-slate-600">
                          ระดับชั้นประถมศึกษาปีที่ {toThaiNumber(config.classLevel.replace(/\D/g, '') || '๑')} {cert.isTied && '(ครองอันดับร่วม)'}
                        </div>
                      </div>
                    )}
                    <div className="text-xs text-slate-600 mt-1">
                      ประจำปีการศึกษา {toThaiNumber(config.academicYear)}
                    </div>
                  </div>

                  {/* Blessing Statement */}
                  <p className="text-xs sm:text-sm text-slate-600 italic font-medium max-w-xl mx-auto leading-relaxed pt-1">
                    “{blessingText}”
                  </p>
                </div>

                {/* Bottom Section: Signatures, Issue Date & Verification QR */}
                <div className="pt-4 border-t border-slate-200/80">
                  <div className="grid grid-cols-12 items-end">
                    
                    {/* Left: Certificate No. & Verification QR */}
                    <div className="col-span-3 text-left space-y-1">
                      <div className="flex items-center gap-2">
                        {qrMap[cert.id] && (
                          <img
                            src={qrMap[cert.id]}
                            alt="Verification QR"
                            className="w-14 h-14 border border-slate-300 rounded p-0.5 bg-white shadow-xs"
                          />
                        )}
                        <div className="text-[10px] text-slate-500 font-mono leading-tight">
                          <div className="font-bold text-slate-700">ตรวจสอบความถูกต้อง</div>
                          <div>เลขที่ {cert.certificateNo}</div>
                          <div className="text-[9px] text-emerald-700 font-sans">รับรองโดยสถานศึกษา</div>
                        </div>
                      </div>
                    </div>

                    {/* Center: Issue Date */}
                    <div className="col-span-4 text-center pb-2">
                      <div className="text-xs font-semibold text-slate-700">
                        ให้ไว้ ณ วันที่ {issueDate}
                      </div>
                    </div>

                    {/* Right: Director Signature */}
                    <div className="col-span-5 text-center flex flex-col items-center">
                      <div className="h-12 flex items-center justify-center">
                        {directorSignatureUrl ? (
                          <img
                            src={directorSignatureUrl}
                            alt="Director Signature"
                            className="max-h-12 max-w-[150px] object-contain"
                            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                          />
                        ) : (
                          <div className="h-10"></div>
                        )}
                      </div>
                      <div className="text-xs font-semibold text-slate-800 leading-tight">
                        ( {config.directorName || 'นางจันทวรรณ พิทักษ์ฉนวน'} )
                      </div>
                      <div className="text-[11px] text-slate-600 font-medium mt-0.5">
                        ผู้อำนวยการโรงเรียน{config.schoolName}
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AcademicCertificateStudio;
