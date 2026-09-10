import React, { useState, useEffect } from 'react';
import { StudentSyncService, StudentOnlineResult } from '../services/studentSyncService';
import { StudentProfile, SubjectConfig, StudentScoreRecord } from '../types/pp5Types';
import {
  Search,
  Key,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  GraduationCap,
  HeartPulse,
  CalendarCheck,
  Award,
  Printer,
  ArrowLeft,
  School,
  CheckCircle2,
  XCircle,
  User,
  QrCode,
  Share2,
  Lock,
  Megaphone
} from 'lucide-react';
import { PortalQrModal } from './PortalQrModal';
import { calculateStudentAge, formatThaiBirthDate } from '../utils/studentDateUtils';
import { AnnouncementService, AnnouncementConfig } from '../services/announcementService';
import { AuthenticatedUser } from '../services/authService';

interface Props {
  localStudents: Record<string, StudentProfile[]>;
  localScores: Record<string, Record<string, Record<string, StudentScoreRecord>>>;
  localClassSubjects: Record<string, SubjectConfig[]>;
  academicYear: string;
  schoolName: string;
  schoolId?: string;
  logoUrl?: string;
  localAttendance?: Record<string, Record<string, any>>;
  localHolistic?: Record<string, Record<string, any>>;
  authUser?: AuthenticatedUser | null;
  announcementConfig?: AnnouncementConfig;
  onOpenAnnouncementModal?: () => void;
  onBackToAdmin: () => void;
}

export const OnlineStudentResultPortal: React.FC<Props> = ({
  localStudents,
  localScores,
  localClassSubjects,
  academicYear,
  schoolName,
  schoolId = '93010069',
  logoUrl,
  localAttendance,
  localHolistic,
  authUser,
  announcementConfig,
  onOpenAnnouncementModal,
  onBackToAdmin
}) => {
  const [nationalId, setNationalId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<StudentOnlineResult | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // ตรวจสอบสิทธิ์ผู้บริหาร/วิชาการ และสถานะการประกาศผล
  const isPrivilegedUser = AnnouncementService.canManageAnnouncement(authUser);
  const isClassPublished = result ? AnnouncementService.isClassPublished(result.classLevel, announcementConfig) : false;

  // Auto-detect QR parameters from URL (e.g. ?mode=portal&nid=1939901054427&sid=3797)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const nid = params.get('nid');
      const sid = params.get('sid');
      if (nid && sid) {
        if (!announcementConfig?.isPublished && !isPrivilegedUser) {
          setErrorMsg('🔒 ไม่อนุญาตให้เข้าดูผล: ผลการเรียนยังไม่ได้รับการอนุมัติจากผู้อำนวยการโรงเรียนหรือฝ่ายวิชาการ ผู้ปกครองจึงยังไม่สามารถดูผลได้ในขณะนี้');
          return;
        }
        setNationalId(nid);
        setStudentId(sid);
        setLoading(true);
        StudentSyncService.queryOnlineGradeResult(
          nid,
          sid,
          localStudents,
          localScores,
          localClassSubjects,
          academicYear,
          localAttendance,
          localHolistic
        ).then(queryRes => {
          setLoading(false);
          if (queryRes.success && queryRes.data) {
            setResult(queryRes.data);
          } else {
            setErrorMsg(queryRes.message);
          }
        });
      }
    }
  }, [announcementConfig?.isPublished, isPrivilegedUser]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // หากระบบยังไม่ได้รับการอนุมัติ และไม่ใช่ ผอ./วิชาการ -> ไม่อนุญาตให้ดูผลโดยเด็ดขาด
    if (!announcementConfig?.isPublished && !isPrivilegedUser) {
      setErrorMsg('🔒 ไม่อนุญาตให้เข้าดูผล: ผลการเรียนยังไม่ได้รับการอนุมัติจากผู้อำนวยการโรงเรียนหรือฝ่ายวิชาการ ผู้ปกครองจึงยังไม่สามารถดูผลได้ในขณะนี้');
      return;
    }

    setLoading(true);

    const queryRes = await StudentSyncService.queryOnlineGradeResult(
      nationalId,
      studentId,
      localStudents,
      localScores,
      localClassSubjects,
      academicYear,
      localAttendance,
      localHolistic
    );

    setLoading(false);

    if (queryRes.success && queryRes.data) {
      setResult(queryRes.data);
    } else {
      setErrorMsg(queryRes.message);
    }
  };

  const handleResetSearch = () => {
    setResult(null);
    setNationalId('');
    setStudentId('');
    setErrorMsg(null);
  };

  const handlePrintResult = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="bg-emerald-800 text-white shadow-md no-print sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={logoUrl || '/logo.png'}
              alt="School Logo"
              className="w-10 h-10 object-contain rounded-full bg-white/10 p-1"
              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
            />
            <div>
              <h1 className="text-base font-bold leading-tight">
                ระบบประกาศผลการเรียนออนไลน์
              </h1>
              <p className="text-xs text-emerald-200">
                โรงเรียน{schoolName} • ประจำปีการศึกษา {academicYear}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* ปุ่มจัดการเฉพาะ Admin เท่านั้น — ซ่อนจากผู้ปกครอง/นักเรียน */}
            {isPrivilegedUser && (
              <>
                <button
                  onClick={() => setIsQrModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-700/70 hover:bg-emerald-600 text-white transition border border-emerald-500 shadow-xs"
                  title="สร้าง QR Code ประชาสัมพันธ์สำหรับสแกนเข้าสู่ระบบ"
                >
                  <QrCode className="w-4 h-4 text-emerald-200" />
                  <span>QR Code ประชาสัมพันธ์</span>
                </button>

                <button
                  onClick={onBackToAdmin}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-900/60 hover:bg-emerald-900 text-white transition border border-emerald-600/50"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>กลับหน้าระบบครูผู้สอน</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-center">
        {!result ? (
          /* Search Card */
          <div className="max-w-md w-full mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="bg-emerald-50 p-6 border-b border-emerald-100 text-center">
              <div className="inline-flex p-3 rounded-full bg-emerald-100 text-emerald-700 mb-3 shadow-inner">
                <GraduationCap className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-bold text-slate-800">
                ตรวจสอบผลการเรียนออนไลน์
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                สำหรับนักเรียนและผู้ปกครอง โรงเรียน{schoolName}
              </p>
            </div>

            <div className="p-6 sm:p-8">
              {/* Announcement Status Badge */}
              <div className={`mb-5 p-3 rounded-xl text-xs flex items-center justify-between gap-2 border ${
                announcementConfig?.isPublished 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                  : 'bg-amber-50 border-amber-200 text-amber-950'
              }`}>
                <div className="flex items-center gap-2.5">
                  {announcementConfig?.isPublished ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <Lock className="w-5 h-5 text-amber-600 shrink-0" />
                  )}
                  <div>
                    <div className="font-bold">
                      {announcementConfig?.isPublished ? 'ระบบเปิดประกาศผลการเรียนแล้ว' : 'ระบบยังไม่เปิดประกาศผลอย่างเป็นทางการ'}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {announcementConfig?.isPublished
                        ? `ชั้นที่เปิดให้ตรวจผล: ${announcementConfig.publishedClasses.includes('*') ? 'ทุกระดับชั้น (อ.2 - ป.6)' : announcementConfig.publishedClasses.join(', ')}`
                        : 'อยู่ระหว่างรอผู้อำนวยการหรือฝ่ายวิชาการอนุมัติเปิดระบบ'}
                    </div>
                  </div>
                </div>

                {isPrivilegedUser && onOpenAnnouncementModal && (
                  <button
                    type="button"
                    onClick={onOpenAnnouncementModal}
                    className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0 shadow-xs"
                    title="เปิดหน้าต่างอนุมัติประกาศผลการเรียนออนไลน์"
                  >
                    <Megaphone className="w-3.5 h-3.5 text-amber-300" />
                    <span>จัดการ</span>
                  </button>
                )}
              </div>

              <form onSubmit={handleSearch} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    เลขประจำตัวประชาชน (13 หลัก)
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      maxLength={13}
                      pattern="[0-9]{13}"
                      placeholder="เช่น 1939901054427"
                      value={nationalId}
                      onChange={(e) => setNationalId(e.target.value.replace(/\D/g, ''))}
                      className="w-full pl-9 pr-4 py-2.5 text-sm font-mono bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">กรอกตัวเลข 13 หลักโดยไม่ต้องใส่ขีด</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    รหัสผ่าน (เลขประจำตัวนักเรียน)
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      placeholder="เช่น 3797"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 text-sm font-mono bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">ใช้เลขประจำตัวนักเรียน 4 หลักเป็นรหัสผ่าน</p>
                </div>

                <div className="pt-3 flex flex-col gap-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition disabled:opacity-50"
                  >
                    <Search className="w-4 h-4" />
                    {loading ? 'กำลังค้นหาผลการเรียน...' : 'เข้าสู่ระบบดูผลการเรียน'}
                  </button>

                  {/* ปุ่ม QR แสดงเฉพาะ Admin */}
                  {isPrivilegedUser && (
                    <button
                      type="button"
                      onClick={() => setIsQrModalOpen(true)}
                      className="w-full inline-flex items-center justify-center gap-2 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-200 transition"
                    >
                      <QrCode className="w-4 h-4 text-emerald-600" />
                      <span>สร้าง QR Code ประชาสัมพันธ์ / ป้ายสแกน</span>
                    </button>
                  )}
                </div>
              </form>

              <div className="mt-6 pt-5 border-t border-slate-100 text-[11px] text-slate-400 text-center leading-relaxed">
                <ShieldCheck className="w-4 h-4 inline mr-1 text-emerald-600" />
                ระบบเชื่อมโยงข้อมูลทะเบียนและคะแนนที่มีตัวตนอยู่จริงในสถานศึกษา หากมีข้อสงสัยโปรดติดต่อฝ่ายวิชาการ
              </div>
            </div>
          </div>
        ) : !isClassPublished && !isPrivilegedUser ? (
          /* Locked Screen for Unprivileged User (Parents / Students) */
          <div className="max-w-md w-full mx-auto bg-white rounded-2xl shadow-xl border border-rose-200 overflow-hidden text-center p-8 space-y-4">
            <div className="w-16 h-16 bg-rose-100 text-rose-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">
              🔒 ยังไม่ได้รับการอนุมัติผลการเรียน
            </h2>
            <div className="p-4 bg-rose-50 rounded-xl text-xs text-rose-950 leading-relaxed border border-rose-200 text-left space-y-2">
              <div className="font-bold text-sm text-rose-950">
                นักเรียน: {result.student.prefix}{result.student.firstName} {result.student.lastName}
              </div>
              <div className="text-slate-700">
                ระดับชั้น: <strong className="text-slate-900">ชั้น {result.classLevel}</strong>
              </div>
              <p className="pt-2 text-slate-700 border-t border-rose-200/70">
                ผลการเรียนของระดับชั้น <strong>{result.classLevel}</strong> ยังไม่ได้รับการอนุมัติประกาศผลจาก <strong>ผู้อำนวยการโรงเรียน</strong> หรือ <strong>ฝ่ายวิชาการ</strong>
              </p>
              <div className="p-2.5 bg-white/80 rounded-lg border border-rose-300 font-semibold text-rose-800">
                ⚠️ ไม่อนุญาตให้ผู้ปกครองและนักเรียนเข้าดูผลการเรียนได้จนกว่าจะได้รับการอนุมัติอย่างเป็นทางการ
              </div>
            </div>
            {announcementConfig?.announcementNote && (
              <div className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-lg border border-slate-200 text-left">
                หมายเหตุจากทางโรงเรียน: “{announcementConfig.announcementNote}”
              </div>
            )}
            <button
              onClick={handleResetSearch}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow transition inline-flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>ค้นหาข้อมูลนักเรียนคนอื่น</span>
            </button>
          </div>
        ) : (
          /* Result View */
          <div className="space-y-6">
            {/* Preview Banner for Director / Academic Head */}
            {!isClassPublished && isPrivilegedUser && (
              <div className="bg-amber-500 text-slate-950 p-3.5 rounded-xl font-semibold text-xs flex flex-wrap items-center justify-between gap-2 border border-amber-600 shadow-sm no-print">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-slate-950 shrink-0" />
                  <span>
                    <strong>[โหมดพรีวิวสำหรับผู้บริหาร / ฝ่ายวิชาการ]</strong> ระดับชั้น {result.classLevel} ยังไม่ได้เปิดประกาศผลต่อสาธารณะ
                  </span>
                </div>
                {onOpenAnnouncementModal && (
                  <button
                    onClick={onOpenAnnouncementModal}
                    className="px-3 py-1 bg-slate-900 text-white hover:bg-slate-800 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                  >
                    <Megaphone className="w-3.5 h-3.5 text-amber-300" />
                    <span>อนุมัติประกาศผลชั้นนี้</span>
                  </button>
                )}
              </div>
            )}

            {/* Official Sign-off Badge if Published */}
            {isClassPublished && announcementConfig?.isPublished && (
              <div className="bg-emerald-50 text-emerald-900 p-3 rounded-xl border border-emerald-200 text-xs flex items-center justify-between gap-2 no-print">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    ประกาศผลการเรียนออนไลน์อย่างเป็นทางการแล้ว โดย <strong>{announcementConfig.announcerRole || 'ผู้อำนวยการโรงเรียน'}</strong> ({announcementConfig.announcerName || 'นางจันทวรรณ พิทักษ์ฉนวน'})
                  </span>
                </div>
              </div>
            )}

            {/* Action Bar (hidden on print) */}
            <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3 no-print">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>รายงานผลการเรียนรายบุคคล (ปพ.6 ดิจิทัล)</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsQrModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-lg border border-emerald-300 transition"
                  title="สร้าง QR Code ส่วนตัวสำหรับนักเรียนคนนี้ เพื่อสแกนดูผลได้ทันทีโดยไม่ต้องพิมพ์รหัส"
                >
                  <QrCode className="w-4 h-4 text-emerald-600" />
                  <span>QR Code เฉพาะบุคคล</span>
                </button>
                <button
                  onClick={handleResetSearch}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  ค้นหาคนอื่น
                </button>
                <button
                  onClick={handlePrintResult}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>พิมพ์ใบรายงานผล (Print)</span>
                </button>
              </div>
            </div>

            {/* Official Report Card (A4 format on print) */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-10 text-slate-900 print:shadow-none print:border-none print:p-4">
              {/* Official Header */}
              <div className="text-center border-b-2 border-slate-900 pb-4 mb-6">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <img
                    src={logoUrl || '/logo.png'}
                    alt="Logo"
                    className="w-14 h-14 object-contain"
                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                  />
                </div>
                <div className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                  เอกสารหลักฐานการศึกษาตามหลักสูตรแกนกลางการศึกษาขั้นพื้นฐาน พุทธศักราช ๒๕๕๑
                </div>
                <h2 className="text-xl font-bold mt-1 text-slate-900">
                  แบบรายงานผลการพัฒนาคุณภาพผู้เรียนรายบุคคล (ปพ.๖)
                </h2>
                <p className="text-sm font-medium text-slate-700 mt-1">
                  โรงเรียน{schoolName} อำเภอเขาชัยสน จังหวัดพัทลุง สำนักงานเขตพื้นที่การศึกษาประถมศึกษาพัทลุง เขต ๒
                </p>
              </div>

              {/* Student Demographics Info */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-12 gap-y-2.5 gap-x-3 text-xs mb-6">
                <div className="col-span-12 sm:col-span-4 whitespace-nowrap">
                  <span className="text-slate-500">ชื่อ - สกุล:</span> <strong className="text-slate-900">{result.student.prefix}{result.student.firstName} {result.student.lastName}</strong>
                </div>
                <div className="col-span-4 sm:col-span-2 whitespace-nowrap">
                  <span className="text-slate-500">เลขประจำตัว:</span> <strong className="font-mono">{result.student.studentId}</strong>
                </div>
                <div className="col-span-8 sm:col-span-3 whitespace-nowrap">
                  <span className="text-slate-500">เลขประจำตัวประชาชน:</span> <strong className="font-mono">{result.student.nationalId}</strong>
                </div>
                <div className="col-span-12 sm:col-span-3 whitespace-nowrap">
                  <span className="text-slate-500">ระดับชั้น:</span> <strong>ชั้น {result.classLevel} (เลขที่ {result.student.seq})</strong>
                </div>

                <div className="col-span-12 sm:col-span-4 whitespace-nowrap">
                  <span className="text-slate-500">วันเกิด:</span> <strong>{formatThaiBirthDate(result.student.birthDate)}</strong>
                </div>
                <div className="col-span-4 sm:col-span-2 whitespace-nowrap">
                  <span className="text-slate-500">อายุ:</span> <strong>{calculateStudentAge(result.student.birthDate, result.classLevel)} ปี</strong>
                </div>
                <div className="col-span-8 sm:col-span-3 whitespace-nowrap">
                  <span className="text-slate-500">น้ำหนัก / ส่วนสูง:</span> <strong>{result.student.weight || '-'} กก. / {result.student.height || '-'} ซม.</strong>
                </div>
                <div className="col-span-12 sm:col-span-3 whitespace-nowrap">
                  <span className="text-slate-500">ปีการศึกษา:</span> <strong>{result.academicYear}</strong>
                </div>
              </div>

              {/* Summary Badges Grid (GPA, Nutrition, Attendance) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div className="bg-emerald-50/80 border border-emerald-200 p-3 rounded-xl">
                  <div className="text-[11px] font-semibold text-emerald-800 flex items-center gap-1">
                    <GraduationCap className="w-4 h-4 text-emerald-600" />
                    เกรดเฉลี่ยสะสม (GPA)
                  </div>
                  <div className="text-2xl font-bold text-emerald-900 mt-1">
                    {result.gpa.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-emerald-600 mt-0.5">
                    ได้ {result.passedCredits} จาก {result.totalCredits} นก.
                  </div>
                </div>

                <div className="bg-teal-50/80 border border-teal-200 p-3 rounded-xl">
                  <div className="text-[11px] font-semibold text-teal-800 flex items-center gap-1">
                    <CalendarCheck className="w-4 h-4 text-teal-600" />
                    สถิติเวลาเรียน
                  </div>
                  <div className="text-2xl font-bold text-teal-900 mt-1">
                    {result.attendancePercent}%
                  </div>
                  <div className="text-[10px] text-teal-600 mt-0.5">
                    มีสิทธิ์เข้าสอบตามเกณฑ์ (&ge; 80%)
                  </div>
                </div>

                <div className="bg-amber-50/80 border border-amber-200 p-3 rounded-xl">
                  <div className="text-[11px] font-semibold text-amber-800 flex items-center gap-1">
                    <Award className="w-4 h-4 text-amber-600" />
                    คุณลักษณะ & สมรรถนะ
                  </div>
                  <div className="text-base font-bold text-amber-900 mt-2">
                    {result.holistic.traitsResult}
                  </div>
                  <div className="text-[10px] text-amber-700 mt-0.5">
                    อ่าน คิดวิเคราะห์: {result.holistic.readingWritingResult}
                  </div>
                </div>

                <div className="bg-rose-50/80 border border-rose-200 p-3 rounded-xl">
                  <div className="text-[11px] font-semibold text-rose-800 flex items-center gap-1">
                    <HeartPulse className="w-4 h-4 text-rose-600" />
                    ภาวะโภชนาการ (BMI)
                  </div>
                  <div className="text-base font-bold text-rose-900 mt-2">
                    {result.nutrition.weightForHeight}
                  </div>
                  <div className="text-[10px] text-rose-700 mt-0.5">
                    ส่วนสูง: {result.nutrition.heightForAge}
                  </div>
                </div>
              </div>

              {/* Subject Academic Performance Table */}
              <div className="mb-6">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  ๑. ผลสัมฤทธิ์ทางการเรียนตามกลุ่มสาระการเรียนรู้
                </h3>
                <table className="w-full text-left text-xs border border-slate-300">
                  <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <tr>
                      <th className="p-2 border-r border-slate-300 w-24 text-center">รหัสวิชา</th>
                      <th className="p-2 border-r border-slate-300">รายวิชา</th>
                      <th className="p-2 border-r border-slate-300 text-center w-20">น้ำหนัก (นก.)</th>
                      <th className="p-2 border-r border-slate-300 text-center w-24">คะแนนรวม (100)</th>
                      <th className="p-2 border-r border-slate-300 text-center w-24">ระดับผลการเรียน</th>
                      <th className="p-2 text-center w-20">ผลการตัดสิน</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {result.subjectsWithGrades.map(({ subject, scoreRecord }) => {
                      const total = scoreRecord?.yearlyTotal ?? (scoreRecord?.total1 !== null && scoreRecord?.total1 !== undefined ? scoreRecord.total1 : '-');
                      const grade = scoreRecord?.grade && scoreRecord.grade !== '-' ? scoreRecord.grade : '-';
                      const isPassed = grade !== '-' ? (grade !== '0' && grade !== 'ร' && grade !== 'มส') : null;

                      return (
                        <tr key={subject.id} className="hover:bg-slate-50">
                          <td className="p-2 text-center font-mono border-r border-slate-300">{subject.code}</td>
                          <td className="p-2 border-r border-slate-300 font-medium">{subject.name}</td>
                          <td className="p-2 text-center border-r border-slate-300">{subject.credits}</td>
                          <td className="p-2 text-center font-bold border-r border-slate-300">
                            {total}
                          </td>
                          <td className="p-2 text-center font-bold border-r border-slate-300">
                            <span className={`inline-block px-2.5 py-0.5 rounded text-xs ${
                              grade === '4' ? 'bg-emerald-100 text-emerald-800' :
                              grade === '3.5' || grade === '3' ? 'bg-teal-100 text-teal-800' :
                              grade === '2.5' || grade === '2' ? 'bg-blue-100 text-blue-800' :
                              grade === '1.5' || grade === '1' ? 'bg-amber-100 text-amber-800' :
                              grade === '0' ? 'bg-rose-100 text-rose-800' : 'text-slate-500'
                            }`}>
                              {grade}
                            </span>
                          </td>
                          <td className="p-2 text-center font-semibold">
                            {isPassed === true && <span className="text-emerald-700">ผ่าน</span>}
                            {isPassed === false && <span className="text-rose-700">ไม่ผ่าน</span>}
                            {isPassed === null && <span className="text-slate-400">-</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Signatures & Certification */}
              <div className="pt-6 border-t border-slate-300 grid grid-cols-2 text-center text-xs text-slate-700">
                <div>
                  <div className="h-10"></div>
                  <div>ลงชื่อ..........................................................</div>
                  <div className="mt-1 font-bold">ครูประจำชั้น</div>
                </div>
                <div>
                  <div className="h-10"></div>
                  <div>ลงชื่อ..........................................................</div>
                  <div className="mt-1 font-bold">ผู้อำนวยการโรงเรียน{schoolName}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* QR Code Modal for sharing & poster generation */}
      <PortalQrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        schoolName={schoolName}
        schoolId={schoolId}
        academicYear={academicYear}
        studentInfo={
          result
            ? {
                nationalId: result.student.nationalId,
                studentId: result.student.studentId,
                studentName: `${result.student.prefix}${result.student.firstName} ${result.student.lastName}`,
                classLevel: result.classLevel,
              }
            : undefined
        }
      />
    </div>
  );
};
