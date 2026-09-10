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
import { AUTHENTIC_DIRECTOR, DEFAULT_CLASS_TEACHER_MAP } from '../data/teachersData';
import { getBasicSubjectSortWeight } from '../utils/subjectSortUtils';

interface Props {
  localStudents: Record<string, StudentProfile[]>;
  localScores: Record<string, Record<string, Record<string, StudentScoreRecord>>>;
  localClassSubjects: Record<string, SubjectConfig[]>;
  academicYear: string;
  schoolName: string;
  schoolId?: string;
  logoUrl?: string;
  directorName?: string;
  directorSignatureUrl?: string;
  classTeacherMap?: Record<string, string>;
  classTeacherSigMap?: Record<string, string>;
  teacherNameSigMap?: Record<string, string>;
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
  directorName,
  directorSignatureUrl,
  classTeacherMap,
  classTeacherSigMap,
  teacherNameSigMap,
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

  // ผู้อำนวยการ, ลายเซ็น ผอ., และครูประจำชั้น (พร้อมลายเซ็นจากข้อมูลส่วนตัว)
  const [syncedDirectorName, setSyncedDirectorName] = useState<string>(directorName || '');
  const [syncedDirectorSig, setSyncedDirectorSig] = useState<string>(directorSignatureUrl || '');
  const [syncedTeacherMap, setSyncedTeacherMap] = useState<Record<string, string>>(classTeacherMap || {});
  const [syncedTeacherSigMap, setSyncedTeacherSigMap] = useState<Record<string, string>>(classTeacherSigMap || {});
  const [syncedTeacherNameSigMap, setSyncedTeacherNameSigMap] = useState<Record<string, string>>(teacherNameSigMap || {});

  // ดึงข้อมูลโรงเรียน/ผอ./ครูประจำชั้น และลายเซ็นจาก Supabase สดใหม่
  useEffect(() => {
    StudentSyncService.fetchSchoolSettingsFromSupabase().then(settings => {
      if (settings) {
        if (settings.directorName) setSyncedDirectorName(settings.directorName.trim());
        if (settings.directorSignatureUrl) setSyncedDirectorSig(settings.directorSignatureUrl);
      }
    });

    StudentSyncService.fetchHomeroomAssignmentsFromSupabase().then(dutyRes => {
      if (dutyRes) {
        if (dutyRes.classTeacherMap && Object.keys(dutyRes.classTeacherMap).length > 0) {
          setSyncedTeacherMap(prev => ({ ...prev, ...dutyRes.classTeacherMap }));
        }
        if (dutyRes.classTeacherSigMap && Object.keys(dutyRes.classTeacherSigMap).length > 0) {
          setSyncedTeacherSigMap(prev => ({ ...prev, ...dutyRes.classTeacherSigMap }));
        }
        if (dutyRes.teacherNameSigMap && Object.keys(dutyRes.teacherNameSigMap).length > 0) {
          setSyncedTeacherNameSigMap(prev => ({ ...prev, ...dutyRes.teacherNameSigMap }));
        }
      }
    });
  }, []);

  // Sync props if changed
  useEffect(() => {
    if (directorName) setSyncedDirectorName(directorName);
  }, [directorName]);

  useEffect(() => {
    if (directorSignatureUrl) setSyncedDirectorSig(directorSignatureUrl);
  }, [directorSignatureUrl]);

  useEffect(() => {
    if (classTeacherMap && Object.keys(classTeacherMap).length > 0) {
      setSyncedTeacherMap(prev => ({ ...prev, ...classTeacherMap }));
    }
  }, [classTeacherMap]);

  useEffect(() => {
    if (classTeacherSigMap && Object.keys(classTeacherSigMap).length > 0) {
      setSyncedTeacherSigMap(prev => ({ ...prev, ...classTeacherSigMap }));
    }
  }, [classTeacherSigMap]);

  useEffect(() => {
    if (teacherNameSigMap && Object.keys(teacherNameSigMap).length > 0) {
      setSyncedTeacherNameSigMap(prev => ({ ...prev, ...teacherNameSigMap }));
    }
  }, [teacherNameSigMap]);

  const effectiveDirectorName = (syncedDirectorName || directorName || AUTHENTIC_DIRECTOR?.name || 'นายเอกคณิต สิทธิศักดิ์').replace(/\s+/g, ' ').trim();
  const effectiveDirectorSig = syncedDirectorSig || directorSignatureUrl || 'https://vzrrpxrmtjpgfbbvhjra.supabase.co/storage/v1/object/public/system/director_sig_1778032124756.png';

  const getHomeroomTeacherName = (cls: string) => {
    return syncedTeacherMap[cls] || classTeacherMap?.[cls] || DEFAULT_CLASS_TEACHER_MAP[cls] || 'นางสาวปภาดา พรหมเศรษฐ์';
  };

  const getHomeroomTeacherSignature = (cls: string): string => {
    // 1. จาก classTeacherSigMap
    const fromClass = syncedTeacherSigMap[cls] || classTeacherSigMap?.[cls];
    if (fromClass) return fromClass;

    // 2. จากชื่อครูประจำชั้น
    const teacherName = getHomeroomTeacherName(cls);
    if (teacherName) {
      const clean = teacherName.replace(/\s+/g, ' ').trim();
      const allNameSigs = { ...teacherNameSigMap, ...syncedTeacherNameSigMap };
      if (allNameSigs[clean]) return allNameSigs[clean];
      for (const [tName, sig] of Object.entries(allNameSigs)) {
        if (sig && (clean.includes(tName) || tName.includes(clean))) {
          return sig;
        }
      }
    }
    return '';
  };

  const getClassDisplayName = (cls: string): string => {
    if (cls.startsWith('ป.')) {
      const num = cls.replace('ป.', '').trim();
      const thaiNum = ['๐', '๑', '๒', '๓', '๔', '๕', '๖'][Number(num)] || num;
      return `ประถมศึกษาปีที่ ${thaiNum}`;
    }
    if (cls.startsWith('อ.')) {
      const num = cls.replace('อ.', '').trim();
      const thaiNum = ['๐', '๑', '๒', '๓'][Number(num)] || num;
      return `อนุบาลปีที่ ${thaiNum}`;
    }
    return cls;
  };

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
    <div className="print-root-container min-h-screen bg-slate-100 flex flex-col font-sans print:bg-white print:min-h-0">
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
      <main className="print-main-content flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-center print:p-0 print:m-0 print:max-w-none">
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
          <div className="space-y-6 print:space-y-0">
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
                    ประกาศผลการเรียนออนไลน์อย่างเป็นทางการแล้ว โดย <strong>{announcementConfig.announcerRole || 'ผู้อำนวยการโรงเรียน'}</strong> ({announcementConfig.announcerName || 'นายเอกคณิต สิทธิศักดิ์'})
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

            {/* Print Stylesheet for Strict 1-Page A4 Fit */}
            <style dangerouslySetInnerHTML={{ __html: `
              @page {
                size: A4 portrait;
                margin: 6mm 8mm 6mm 8mm;
              }
              @media print {
                html, body {
                  background: #ffffff !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                .no-print {
                  display: none !important;
                }
                .print-root-container {
                  padding: 0 !important;
                  margin: 0 !important;
                  background: #ffffff !important;
                  min-height: auto !important;
                }
                .print-card-box {
                  box-shadow: none !important;
                  border: none !important;
                  padding: 0 !important;
                  margin: 0 !important;
                  max-width: 100% !important;
                  width: 100% !important;
                  border-radius: 0 !important;
                }
                .print-table-row th, .print-table-row td {
                  padding-top: 2px !important;
                  padding-bottom: 2px !important;
                  font-size: 11px !important;
                  line-height: 1.25 !important;
                }
                .print-signature-img {
                  max-height: 36px !important;
                  display: block !important;
                }
              }
            `}} />

            {/* Official Report Card (Strict Single-Page A4 on Print) */}
            <div className="print-card-box bg-white rounded-2xl shadow-xl border border-slate-200 p-5 sm:p-8 text-slate-900 print:shadow-none print:border-none print:p-0">
              {/* Official Header */}
              <div className="text-center border-b-2 border-slate-900 pb-2 mb-2.5">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <img
                    src={logoUrl || '/logo.png'}
                    alt="Logo"
                    className="w-11 h-11 object-contain"
                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                  />
                </div>
                <div className="text-[10.5px] font-bold tracking-wider text-slate-500 uppercase">
                  เอกสารหลักฐานการศึกษาตามหลักสูตรแกนกลางการศึกษาขั้นพื้นฐาน พุทธศักราช ๒๕๕๑
                </div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight mt-0.5">
                  แบบรายงานผลการพัฒนาคุณภาพผู้เรียนรายบุคคล (ปพ.๖)
                </h2>
                <p className="text-[11.5px] font-medium text-slate-700 mt-0.5">
                  โรงเรียน{schoolName} อำเภอเขาชัยสน จังหวัดพัทลุง สำนักงานเขตพื้นที่การศึกษาประถมศึกษาพัทลุง เขต ๒
                </p>
              </div>

              {/* Student Demographics Info (Clean Multi-column, No overlap on print) */}
              <div className="bg-slate-50/90 p-2.5 rounded-lg border border-slate-300 text-xs mb-2.5 grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-1.5 text-slate-800">
                <div className="col-span-2 flex items-baseline gap-1.5 overflow-hidden">
                  <span className="text-slate-500 shrink-0">ชื่อ - สกุล:</span>
                  <strong className="text-slate-900 truncate">{result.student.prefix}{result.student.firstName} {result.student.lastName}</strong>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-slate-500 shrink-0">เลขประจำตัว:</span>
                  <strong className="font-mono">{result.student.studentId}</strong>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-slate-500 shrink-0">เลข ปชช.:</span>
                  <strong className="font-mono">{result.student.nationalId}</strong>
                </div>

                <div className="flex items-baseline gap-1.5">
                  <span className="text-slate-500 shrink-0">ระดับชั้น:</span>
                  <strong>ชั้น {result.classLevel} (เลขที่ {result.student.seq})</strong>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-slate-500 shrink-0">วันเกิด:</span>
                  <strong>{formatThaiBirthDate(result.student.birthDate)}</strong>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-slate-500 shrink-0">อายุ:</span>
                  <strong>{calculateStudentAge(result.student.birthDate, result.classLevel)} ปี</strong>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-slate-500 shrink-0">ปีการศึกษา:</span>
                  <strong>{result.academicYear}</strong>
                </div>

                <div className="col-span-2 sm:col-span-4 flex items-baseline gap-3 text-[11px] text-slate-600 pt-0.5 border-t border-slate-200/80">
                  <span>น้ำหนัก: <strong className="text-slate-800">{result.student.weight || '-'}</strong> กก.</span>
                  <span>ส่วนสูง: <strong className="text-slate-800">{result.student.height || '-'}</strong> ซม.</span>
                  <span>กลุ่มเลือด: <strong className="text-slate-800">{result.student.bloodGroup || '-'}</strong></span>
                </div>
              </div>

              {/* Summary Badges Grid (Compact & Neat) */}
              <div className="grid grid-cols-4 gap-2 mb-2.5">
                <div className="bg-emerald-50/90 border border-emerald-200 p-2 rounded-lg text-center sm:text-left">
                  <div className="text-[10px] font-semibold text-emerald-800 flex items-center justify-center sm:justify-start gap-1">
                    <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                    GPA สะสม
                  </div>
                  <div className="text-lg font-bold text-emerald-900 mt-0.5">
                    {result.gpa.toFixed(2)}
                  </div>
                  <div className="text-[9.5px] text-emerald-700">
                    ผ่าน {result.passedCredits}/{result.totalCredits} นก.
                  </div>
                </div>

                <div className="bg-teal-50/90 border border-teal-200 p-2 rounded-lg text-center sm:text-left">
                  <div className="text-[10px] font-semibold text-teal-800 flex items-center justify-center sm:justify-start gap-1">
                    <CalendarCheck className="w-3.5 h-3.5 text-teal-600" />
                    เวลาเรียน
                  </div>
                  <div className="text-lg font-bold text-teal-900 mt-0.5">
                    {result.attendancePercent}%
                  </div>
                  <div className="text-[9.5px] text-teal-700">
                    {result.attendancePercent >= 80 ? 'มีสิทธิ์สอบ (≥ 80%)' : 'ต่ำกว่าเกณฑ์'}
                  </div>
                </div>

                <div className="bg-amber-50/90 border border-amber-200 p-2 rounded-lg text-center sm:text-left">
                  <div className="text-[10px] font-semibold text-amber-800 flex items-center justify-center sm:justify-start gap-1">
                    <Award className="w-3.5 h-3.5 text-amber-600" />
                    คุณลักษณะ
                  </div>
                  <div className="text-sm font-bold text-amber-900 mt-1 truncate">
                    {result.holistic.traitsResult}
                  </div>
                  <div className="text-[9.5px] text-amber-700 truncate">
                    คิดวิเคราะห์: {result.holistic.readingWritingResult}
                  </div>
                </div>

                <div className="bg-rose-50/90 border border-rose-200 p-2 rounded-lg text-center sm:text-left">
                  <div className="text-[10px] font-semibold text-rose-800 flex items-center justify-center sm:justify-start gap-1">
                    <HeartPulse className="w-3.5 h-3.5 text-rose-600" />
                    โภชนาการ
                  </div>
                  <div className="text-sm font-bold text-rose-900 mt-1 truncate">
                    {result.nutrition.weightForHeight}
                  </div>
                  <div className="text-[9.5px] text-rose-700 truncate">
                    ส่วนสูง: {result.nutrition.heightForAge}
                  </div>
                </div>
              </div>

              {/* Subject Academic Performance Table */}
              <div className="mb-2.5">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-[11.5px] font-bold text-slate-800 uppercase tracking-wide">
                    ๑. ผลสัมฤทธิ์ทางการเรียนตามกลุ่มสาระการเรียนรู้
                  </h3>
                  <span className="text-[10.5px] text-slate-500">
                    รวมทั้งสิ้น {result.subjectsWithGrades.length} รายวิชา
                  </span>
                </div>
                <table className="w-full text-left text-xs border border-slate-300">
                  <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <tr className="print-table-row">
                      <th className="py-1 px-2 border-r border-slate-300 w-20 text-center">รหัสวิชา</th>
                      <th className="py-1 px-2 border-r border-slate-300">รายวิชา</th>
                      <th className="py-1 px-2 border-r border-slate-300 text-center w-20">น้ำหนัก (นก.)</th>
                      <th className="py-1 px-2 border-r border-slate-300 text-center w-24">คะแนนรวม (100)</th>
                      <th className="py-1 px-2 border-r border-slate-300 text-center w-24">ระดับผลการเรียน</th>
                      <th className="py-1 px-2 text-center w-20">ผลการตัดสิน</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {/* 1. รายวิชาพื้นฐาน */}
                    {result.subjectsWithGrades.filter(i => i.subject.type === 'พื้นฐาน' || !i.subject.type).length > 0 && (
                      <tr className="bg-slate-100/90 text-slate-900 font-bold text-[10.5px] print-table-row">
                        <td colSpan={6} className="py-0.5 px-2 border-r border-slate-300">
                          รายวิชาพื้นฐาน
                        </td>
                      </tr>
                    )}
                    {[...result.subjectsWithGrades.filter(i => i.subject.type === 'พื้นฐาน' || !i.subject.type)]
                      .sort((a, b) => getBasicSubjectSortWeight(a.subject.code, a.subject.name) - getBasicSubjectSortWeight(b.subject.code, b.subject.name))
                      .map(({ subject, scoreRecord }) => {
                        const total = scoreRecord?.yearlyTotal ?? (scoreRecord?.total1 !== null && scoreRecord?.total1 !== undefined ? scoreRecord.total1 : '-');
                        const grade = scoreRecord?.grade && scoreRecord.grade !== '-' ? scoreRecord.grade : '-';
                        const isPassed = grade !== '-' ? (grade !== '0' && grade !== 'ร' && grade !== 'มส') : null;

                        return (
                          <tr key={subject.id} className="print-table-row hover:bg-slate-50">
                            <td className="py-1 px-2 text-center font-mono border-r border-slate-300">{subject.code}</td>
                            <td className="py-1 px-2 border-r border-slate-300 font-medium pl-4">{subject.name}</td>
                            <td className="py-1 px-2 text-center border-r border-slate-300">{subject.credits}</td>
                            <td className="py-1 px-2 text-center font-bold border-r border-slate-300">
                              {total}
                            </td>
                            <td className="py-1 px-2 text-center font-bold border-r border-slate-300">
                              <span className={`inline-block px-2 py-0.5 rounded text-xs ${
                                grade === '4' ? 'bg-emerald-100 text-emerald-800' :
                                grade === '3.5' || grade === '3' ? 'bg-teal-100 text-teal-800' :
                                grade === '2.5' || grade === '2' ? 'bg-blue-100 text-blue-800' :
                                grade === '1.5' || grade === '1' ? 'bg-amber-100 text-amber-800' :
                                grade === '0' ? 'bg-rose-100 text-rose-800' : 'text-slate-500'
                              }`}>
                                {grade}
                              </span>
                            </td>
                            <td className="py-1 px-2 text-center font-semibold">
                              {isPassed === true && <span className="text-emerald-700">ผ่าน</span>}
                              {isPassed === false && <span className="text-rose-700">ไม่ผ่าน</span>}
                              {isPassed === null && <span className="text-slate-400">-</span>}
                            </td>
                          </tr>
                        );
                      })}

                    {/* 2. รายวิชาเพิ่มเติม */}
                    {result.subjectsWithGrades.filter(i => i.subject.type === 'เพิ่มเติม').length > 0 && (
                      <tr className="bg-slate-100/90 text-slate-900 font-bold text-[10.5px] print-table-row">
                        <td colSpan={6} className="py-0.5 px-2 border-r border-slate-300">
                          รายวิชาเพิ่มเติม
                        </td>
                      </tr>
                    )}
                    {result.subjectsWithGrades
                      .filter(i => i.subject.type === 'เพิ่มเติม')
                      .map(({ subject, scoreRecord }) => {
                        const total = scoreRecord?.yearlyTotal ?? (scoreRecord?.total1 !== null && scoreRecord?.total1 !== undefined ? scoreRecord.total1 : '-');
                        const grade = scoreRecord?.grade && scoreRecord.grade !== '-' ? scoreRecord.grade : '-';
                        const isPassed = grade !== '-' ? (grade !== '0' && grade !== 'ร' && grade !== 'มส') : null;

                        return (
                          <tr key={subject.id} className="print-table-row hover:bg-slate-50">
                            <td className="py-1 px-2 text-center font-mono border-r border-slate-300">{subject.code}</td>
                            <td className="py-1 px-2 border-r border-slate-300 font-medium pl-4">{subject.name}</td>
                            <td className="py-1 px-2 text-center border-r border-slate-300">{subject.credits}</td>
                            <td className="py-1 px-2 text-center font-bold border-r border-slate-300">
                              {total}
                            </td>
                            <td className="py-1 px-2 text-center font-bold border-r border-slate-300">
                              <span className={`inline-block px-2 py-0.5 rounded text-xs ${
                                grade === '4' ? 'bg-emerald-100 text-emerald-800' :
                                grade === '3.5' || grade === '3' ? 'bg-teal-100 text-teal-800' :
                                grade === '2.5' || grade === '2' ? 'bg-blue-100 text-blue-800' :
                                grade === '1.5' || grade === '1' ? 'bg-amber-100 text-amber-800' :
                                grade === '0' ? 'bg-rose-100 text-rose-800' : 'text-slate-500'
                              }`}>
                                {grade}
                              </span>
                            </td>
                            <td className="py-1 px-2 text-center font-semibold">
                              {isPassed === true && <span className="text-emerald-700">ผ่าน</span>}
                              {isPassed === false && <span className="text-rose-700">ไม่ผ่าน</span>}
                              {isPassed === null && <span className="text-slate-400">-</span>}
                            </td>
                          </tr>
                        );
                      })}

                    {/* 3. กิจกรรมพัฒนาผู้เรียน (ถ้ามี) */}
                    {result.subjectsWithGrades.filter(i => i.subject.type === 'กิจกรรม').length > 0 && (
                      <tr className="bg-slate-100/90 text-slate-900 font-bold text-[10.5px] print-table-row">
                        <td colSpan={6} className="py-0.5 px-2 border-r border-slate-300">
                          กิจกรรมพัฒนาผู้เรียน
                        </td>
                      </tr>
                    )}
                    {result.subjectsWithGrades
                      .filter(i => i.subject.type === 'กิจกรรม')
                      .map(({ subject, scoreRecord }) => {
                        const total = scoreRecord?.yearlyTotal ?? (scoreRecord?.total1 !== null && scoreRecord?.total1 !== undefined ? scoreRecord.total1 : '-');
                        const grade = scoreRecord?.grade && scoreRecord.grade !== '-' ? scoreRecord.grade : '-';
                        const isPassed = grade !== '-' ? (grade !== '0' && grade !== 'ร' && grade !== 'มส') : null;

                        return (
                          <tr key={subject.id} className="print-table-row hover:bg-slate-50">
                            <td className="py-1 px-2 text-center font-mono border-r border-slate-300">{subject.code}</td>
                            <td className="py-1 px-2 border-r border-slate-300 font-medium pl-4">{subject.name}</td>
                            <td className="py-1 px-2 text-center border-r border-slate-300">{subject.credits}</td>
                            <td className="py-1 px-2 text-center font-bold border-r border-slate-300">
                              {total}
                            </td>
                            <td className="py-1 px-2 text-center font-bold border-r border-slate-300">
                              <span className={`inline-block px-2 py-0.5 rounded text-xs ${
                                grade === '4' ? 'bg-emerald-100 text-emerald-800' :
                                grade === '3.5' || grade === '3' ? 'bg-teal-100 text-teal-800' :
                                grade === '2.5' || grade === '2' ? 'bg-blue-100 text-blue-800' :
                                grade === '1.5' || grade === '1' ? 'bg-amber-100 text-amber-800' :
                                grade === '0' ? 'bg-rose-100 text-rose-800' : 'text-slate-500'
                              }`}>
                                {grade}
                              </span>
                            </td>
                            <td className="py-1 px-2 text-center font-semibold">
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

              {/* Signatures & Certification (Strict Single-Page Placement) */}
              <div className="pt-2 border-t border-slate-300 grid grid-cols-2 text-center text-xs text-slate-800 break-inside-avoid">
                {/* ครูประจำชั้น */}
                <div className="flex flex-col items-center justify-end">
                  <div className="h-9 flex items-center justify-center">
                    {getHomeroomTeacherSignature(result.classLevel) ? (
                      <img
                        src={getHomeroomTeacherSignature(result.classLevel)}
                        alt="ลายมือชื่อครูประจำชั้น"
                        className="print-signature-img h-9 max-w-[130px] object-contain mix-blend-multiply"
                        onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div className="h-9"></div>
                    )}
                  </div>
                  <div>ลงชื่อ..........................................................</div>
                  <div className="mt-1 font-bold">
                    ( {getHomeroomTeacherName(result.classLevel)} )
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    ครูประจำชั้น{getClassDisplayName(result.classLevel)}
                  </div>
                </div>

                {/* ผู้อำนวยการโรงเรียน */}
                <div className="flex flex-col items-center justify-end">
                  <div className="h-9 flex items-center justify-center">
                    {effectiveDirectorSig ? (
                      <img
                        src={effectiveDirectorSig}
                        alt="ลายมือชื่อผู้อำนวยการ"
                        className="print-signature-img h-9 max-w-[130px] object-contain mix-blend-multiply"
                        onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div className="h-9"></div>
                    )}
                  </div>
                  <div>ลงชื่อ..........................................................</div>
                  <div className="mt-1 font-bold">
                    ( {effectiveDirectorName} )
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    ผู้อำนวยการโรงเรียน{schoolName}
                  </div>
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
