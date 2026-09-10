import React from 'react';
import { Users, Calendar, Award, ShieldCheck, UserCheck, UserCog, LogIn, LogOut, Globe, Megaphone } from 'lucide-react';
import { AcademicConfig } from '../types/pp5Types';
import { TeacherProfile } from '../data/teachersData';
import { AuthenticatedUser } from '../services/authService';
import { AnnouncementConfig } from '../services/announcementService';

interface HeaderProps {
  config: AcademicConfig;
  onConfigChange: (newConfig: AcademicConfig) => void;
  availableClasses: string[];
  logoUrl?: string;
  teachers: TeacherProfile[];
  currentTeacher: TeacherProfile;
  authUser: AuthenticatedUser | null;
  announcementConfig?: AnnouncementConfig;
  onSelectTeacher: (teacher: TeacherProfile) => void;
  onOpenTeacherModal: () => void;
  onOpenLoginModal: () => void;
  onOpenAnnouncementModal?: () => void;
  onSignOut: () => void;
  onSwitchToPortal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  onConfigChange,
  availableClasses,
  logoUrl,
  teachers,
  currentTeacher,
  authUser,
  announcementConfig,
  onSelectTeacher,
  onOpenTeacherModal,
  onOpenLoginModal,
  onOpenAnnouncementModal,
  onSignOut,
  onSwitchToPortal
}) => {
  // กรองชั้นเรียนที่แสดงใน Dropdown ตามสิทธิ์ครูที่ล็อกอิน (Strict Class Scoping)
  const allowedClasses = authUser && !authUser.assignedClasses.includes('*')
    ? availableClasses.filter(cls => authUser.assignedClasses.includes(cls))
    : availableClasses;

  return (
    <header className="bg-emerald-800 text-white shadow-lg border-b border-emerald-900 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          
          {/* Logo & School Title */}
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-white/95 p-1 shadow-md border border-emerald-600 flex items-center justify-center overflow-hidden shrink-0">
              <img 
                src={logoUrl || '/logo.png'} 
                alt="School Logo" 
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  ระบบวัดผลและประเมินผล ปพ.5-6 ดิจิทัล
                  <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-emerald-600 text-emerald-100 border border-emerald-500">
                    Standalone Local
                  </span>
                </h1>
              </div>
              <p className="text-xs text-emerald-200">
                โรงเรียน{config.schoolName} (รหัส {config.schoolId}) • สพป.พัทลุง เขต 2
              </p>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            
            {/* Online Announcement Control (ผอ. / วิชาการ) */}
            <button
              onClick={onOpenAnnouncementModal}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition border ${
                announcementConfig?.isPublished
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400'
                  : 'bg-rose-900/90 hover:bg-rose-800 text-rose-100 border-rose-600'
              }`}
              title={
                authUser?.role === 'director' || authUser?.role === 'academic_head' || authUser?.role === 'admin'
                  ? 'คลิกเพื่อตั้งค่าและอนุมัติประกาศผลการเรียนออนไลน์ (สำหรับ ผอ./ฝ่ายวิชาการ)'
                  : 'สถานะการประกาศผลการเรียนออนไลน์ (เฉพาะ ผอ./ฝ่ายวิชาการ ที่มีสิทธิ์อนุมัติ)'
              }
            >
              <Megaphone className="w-4 h-4 text-amber-300" />
              <span>
                {announcementConfig?.isPublished ? 'ประกาศผลออนไลน์แล้ว' : 'ปิดประกาศผลอยู่'}
              </span>
              <span className={`w-2 h-2 rounded-full ${announcementConfig?.isPublished ? 'bg-emerald-300 animate-pulse' : 'bg-rose-400'}`} />
            </button>

            {/* Online Portal Switcher for Students/Parents */}
            <button
              onClick={onSwitchToPortal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-sm transition border border-amber-300"
              title="เปิดระบบตรวจสอบผลการเรียนออนไลน์สำหรับนักเรียนและผู้ปกครอง"
            >
              <Globe className="w-4 h-4 text-slate-900" />
              <span>พอร์ทัล นร./ผู้ปกครอง</span>
            </button>

            {/* Active Teacher / User Profile */}
            <div className="flex items-center bg-emerald-900/80 rounded-lg px-3 py-1.5 border border-emerald-700 shadow-xs">
              {authUser?.role === 'academic_head' || authUser?.role === 'admin' ? (
                <ShieldCheck className="w-4 h-4 text-amber-300 mr-2 shrink-0" />
              ) : (
                <UserCheck className="w-4 h-4 text-emerald-300 mr-2 shrink-0" />
              )}
              <div className="flex flex-col mr-2">
                <span className="text-[10px] text-emerald-300 leading-tight">
                  {authUser?.roleTitle || 'ครูผู้บันทึก'}:
                </span>
                <span className="text-xs font-bold text-white leading-tight truncate max-w-[130px] sm:max-w-[160px]">
                  {authUser?.displayName || currentTeacher?.name || 'ครูผู้บันทึก'}
                </span>
              </div>

              {/* Login / Switch Button */}
              <button
                onClick={onOpenLoginModal}
                className="p-1 px-2 text-[11px] font-semibold bg-emerald-700 hover:bg-emerald-600 text-white rounded transition border border-emerald-500 flex items-center gap-1"
                title="เข้าสู่ระบบด้วยรหัสผ่านหลัก หรือสลับครู"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>เข้าสู่ระบบ</span>
              </button>

              {/* Teacher Assignment Modal Button for Academic Head */}
              {(authUser?.role === 'academic_head' || authUser?.role === 'admin') && (
                <button
                  onClick={onOpenTeacherModal}
                  className="ml-1 p-1 text-emerald-200 hover:text-white hover:bg-emerald-700/80 rounded transition"
                  title="กำหนดครูประจำชั้นเข้าบันทึกข้อมูล"
                >
                  <UserCog className="w-4 h-4 text-amber-300" />
                </button>
              )}
            </div>

            {/* Class Selector (Filtered by role) */}
            <div className="flex items-center bg-emerald-900/60 rounded-lg px-3 py-1.5 border border-emerald-700">
              <Users className="w-4 h-4 text-emerald-300 mr-2 shrink-0" />
              <span className="text-xs text-emerald-300 mr-2">ระดับชั้น:</span>
              <select
                value={config.classLevel}
                onChange={(e) => onConfigChange({ ...config, classLevel: e.target.value })}
                className="bg-emerald-800 text-white text-sm font-semibold rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer"
              >
                {allowedClasses.map((cls) => (
                  <option key={cls} value={cls}>ชั้น {cls}</option>
                ))}
              </select>
            </div>

            {/* Semester Selector */}
            <div className="flex items-center bg-emerald-900/60 rounded-lg px-3 py-1.5 border border-emerald-700">
              <Calendar className="w-4 h-4 text-emerald-300 mr-2 shrink-0" />
              <span className="text-xs text-emerald-300 mr-2">ภาคเรียน:</span>
              <select
                value={config.semester}
                onChange={(e) => onConfigChange({ ...config, semester: Number(e.target.value) as 1 | 2 })}
                className="bg-emerald-800 text-white text-sm font-semibold rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer"
              >
                <option value={1}>ภาคเรียนที่ 1</option>
                <option value={2}>ภาคเรียนที่ 2</option>
              </select>
            </div>

            {/* Academic Year */}
            <div className="flex items-center bg-emerald-900/60 rounded-lg px-3 py-1.5 border border-emerald-700">
              <Award className="w-4 h-4 text-emerald-300 mr-1.5 shrink-0" />
              <span className="text-xs text-emerald-300 mr-1.5">ปี:</span>
              <span className="text-sm font-bold text-amber-300">{config.academicYear}</span>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};

