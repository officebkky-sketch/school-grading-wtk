// src/components/OnlineAnnouncementControlModal.tsx
import React, { useState, useEffect } from 'react';
import { 
  Megaphone, 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Globe, 
  CheckCircle2, 
  XCircle, 
  QrCode, 
  ExternalLink, 
  LogIn, 
  X, 
  Check, 
  Calendar, 
  User, 
  Save 
} from 'lucide-react';
import { AnnouncementService, AnnouncementConfig } from '../services/announcementService';
import { AuthenticatedUser } from '../services/authService';
import { TeacherProfile } from '../data/teachersData';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  authUser: AuthenticatedUser | null;
  currentTeacher?: TeacherProfile;
  availableClasses: string[];
  schoolName: string;
  schoolId: string;
  academicYear: string;
  onOpenLoginModal: () => void;
  onOpenQrModal: () => void;
  onPreviewPortal: () => void;
  onConfigUpdated?: (config: AnnouncementConfig) => void;
}

export const OnlineAnnouncementControlModal: React.FC<Props> = ({
  isOpen,
  onClose,
  authUser,
  currentTeacher,
  availableClasses,
  schoolName,
  schoolId,
  academicYear,
  onOpenLoginModal,
  onOpenQrModal,
  onPreviewPortal,
  onConfigUpdated
}) => {
  const [config, setConfig] = useState<AnnouncementConfig>(() => AnnouncementService.getConfig());
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const current = AnnouncementService.getConfig();
      setConfig(current);
      setSavedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const canManage = AnnouncementService.canManageAnnouncement(authUser);

  const handleTogglePublish = (publish: boolean) => {
    const announcerName = authUser?.displayName || currentTeacher?.name || 'ผู้อำนวยการโรงเรียน';
    const announcerRole = authUser?.roleTitle || (authUser?.role === 'director' ? 'ผู้อำนวยการโรงเรียน' : 'หัวหน้าฝ่ายวิชาการ');

    setConfig(prev => ({
      ...prev,
      isPublished: publish,
      announcerName: publish ? announcerName : prev.announcerName,
      announcerRole: publish ? announcerRole : prev.announcerRole,
      announcedAt: publish ? new Date().toISOString() : prev.announcedAt
    }));
  };

  const handleToggleAllClasses = () => {
    setConfig(prev => ({
      ...prev,
      publishedClasses: prev.publishedClasses.includes('*') ? [] : ['*']
    }));
  };

  const handleToggleClass = (cls: string) => {
    setConfig(prev => {
      let current = prev.publishedClasses.includes('*') 
        ? [...availableClasses] 
        : [...prev.publishedClasses];

      if (current.includes(cls)) {
        current = current.filter(c => c !== cls);
      } else {
        current.push(cls);
      }

      // ถ้าเลือกครบทุกห้อง ให้ปรับเป็น ['*']
      if (current.length === availableClasses.length) {
        return { ...prev, publishedClasses: ['*'] };
      }
      return { ...prev, publishedClasses: current };
    });
  };

  const handleSave = () => {
    AnnouncementService.saveConfig(config);
    setSavedSuccess(true);
    if (onConfigUpdated) onConfigUpdated(config);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl">
              <Megaphone className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                <span>ระบบอนุมัติประกาศผลการเรียนออนไลน์</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-extrabold uppercase">
                  สิทธิ์ ผอ. / วิชาการ
                </span>
              </h3>
              <p className="text-xs text-emerald-100">
                ควบคุมการเปิด/ปิด ให้นักเรียนและผู้ปกครองตรวจสอบผลการเรียน ปพ.5 - ปพ.6
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-200 hover:text-white p-1 rounded-lg transition hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-800 text-sm">
          
          {/* Permission Check Notice */}
          {!canManage ? (
            <div className="p-5 bg-amber-50 rounded-2xl border border-amber-200 space-y-4 text-center">
              <div className="inline-flex p-3 bg-amber-100 text-amber-800 rounded-full">
                <ShieldAlert className="w-8 h-8 text-amber-600" />
              </div>
              <div>
                <h4 className="font-bold text-base text-amber-900 mb-1">
                  🔒 สงวนสิทธิ์เฉพาะผู้อำนวยการโรงเรียน หรือหัวหน้าฝ่ายวิชาการ
                </h4>
                <p className="text-xs text-amber-800 leading-relaxed max-w-md mx-auto">
                  ตามระเบียบงานวัดและประเมินผลสถานศึกษา (สพฐ.) การสั่งอนุมัติและเปิดประกาศผลการเรียนออนไลน์สู่สาธารณะ 
                  ต้องดำเนินการโดย <strong>ผู้อำนวยการโรงเรียน</strong> หรือ <strong>หัวหน้าฝ่ายวิชาการ</strong> เท่านั้นค่ะ
                </p>
              </div>

              <div className="pt-2 flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={() => { onClose(); onOpenLoginModal(); }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-sm transition"
                >
                  <LogIn className="w-4 h-4" />
                  <span>เข้าสู่ระบบด้วยบัญชี ผอ. หรือ หัวหน้าวิชาการ</span>
                </button>
                <button
                  type="button"
                  onClick={() => { onClose(); onPreviewPortal(); }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs transition"
                >
                  <Globe className="w-4 h-4 text-slate-500" />
                  <span>เข้าดูตัวอย่างระบบ (Preview)</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* 1. Master Toggle Switch */}
              <div className="p-5 rounded-2xl border transition-all duration-200 shadow-xs bg-slate-50 border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                        สถานะการอนุมัติผลการเรียน (Grade Approval & Release Gate)
                      </span>
                      {config.isPublished ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          อนุมัติผลแล้ว (เปิดให้ผู้ปกครองเข้าดูผลได้)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          ไม่อนุมัติผล (ผู้ปกครองไม่สามารถดูผลได้)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600">
                      {config.isPublished 
                        ? '✓ อนุมัติผลเรียบร้อย: ผู้ปกครองและนักเรียนสามารถกรอกเลขบัตรประชาชน 13 หลักเพื่อดูผล ปพ.6 ได้ทันที'
                        : '🔒 ยังไม่อนุมัติผล: ระบบบล็อกการเข้าดูผล ผู้ปกครองจะไม่สามารถดูเกรดหรือผลการเรียนได้จนกว่าจะได้รับอนุมัติ'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleTogglePublish(false)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition border ${
                        !config.isPublished
                          ? 'bg-rose-600 text-white border-rose-700 shadow-sm'
                          : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      ไม่อนุมัติผล (ปิดการดู)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTogglePublish(true)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition border flex items-center gap-1.5 ${
                        config.isPublished
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                          : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <Globe className="w-4 h-4" />
                      <span>อนุมัติผล & เปิดให้ผู้ปกครองดู</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 2. Class Scope Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>ชั้นเรียนที่ได้รับอนุมัติให้ประกาศผล:</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleToggleAllClasses}
                    className="text-xs text-emerald-700 font-bold hover:underline"
                  >
                    {config.publishedClasses.includes('*') ? 'เลือกเฉพาะบางห้อง' : 'เลือกทุกชั้นเรียน (อ.2 - ป.6)'}
                  </button>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {availableClasses.map(cls => {
                    const isSelected = config.publishedClasses.includes('*') || config.publishedClasses.includes(cls);
                    return (
                      <button
                        key={cls}
                        type="button"
                        onClick={() => handleToggleClass(cls)}
                        className={`py-2 px-1 rounded-xl text-xs font-bold border transition text-center ${
                          isSelected
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-500 ring-2 ring-emerald-200'
                            : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {cls}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Signoff & Announcement Note */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">
                      ผู้อนุมัติประกาศผล:
                    </label>
                    <div className="p-2 bg-white rounded-lg border border-slate-300 font-bold text-slate-800 flex items-center gap-2">
                      <User className="w-4 h-4 text-emerald-600" />
                      <span>{config.announcerName || authUser?.displayName || 'ผู้อำนวยการโรงเรียน'}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">
                      ตำแหน่ง / บทบาท:
                    </label>
                    <div className="p-2 bg-white rounded-lg border border-slate-300 text-slate-700 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-teal-600" />
                      <span>{config.announcerRole || authUser?.roleTitle || 'ผู้อำนวยการสถานศึกษา'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    ข้อความชี้แจง / ประกาศถึงผู้ปกครองและนักเรียน:
                  </label>
                  <textarea
                    rows={2}
                    value={config.announcementNote || ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, announcementNote: e.target.value }))}
                    placeholder="เช่น ประกาศผลการเรียนอย่างเป็นทางการ ปีการศึกษา 2569 โรงเรียนวัดท่าควาย หากมีข้อสงสัยโปรดติดต่อครูประจำชั้น"
                    className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* 4. Quick Action Helpers */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => { onClose(); onOpenQrModal(); }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition"
                  >
                    <QrCode className="w-4 h-4 text-indigo-600" />
                    <span>สร้าง QR Code / ลิงก์กลุ่มไลน์</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { onClose(); onPreviewPortal(); }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition"
                  >
                    <ExternalLink className="w-4 h-4 text-slate-500" />
                    <span>ดูตัวอย่างหน้านักเรียน (Preview)</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className={`inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold shadow-sm transition ${
                      savedSuccess
                        ? 'bg-emerald-700 text-white'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {savedSuccess ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>บันทึกสำเร็จเรียบร้อย!</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>บันทึกการตั้งค่า</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}

        </div>

      </div>
    </div>
  );
};
