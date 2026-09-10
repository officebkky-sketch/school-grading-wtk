// src/components/TeacherLoginModal.tsx
import React, { useState } from 'react';
import { AuthService, AuthenticatedUser, EMAIL_CLASS_MAPPING } from '../services/authService';
import { DEFAULT_TEACHERS, TeacherProfile } from '../data/teachersData';
import { Lock, Mail, Key, ShieldCheck, UserCheck, LogIn, AlertCircle, Sparkles, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: AuthenticatedUser) => void;
  currentUser: AuthenticatedUser | null;
  teachers?: TeacherProfile[];
}

export const TeacherLoginModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  currentUser,
  teachers
}) => {
  const [activeMode, setActiveMode] = useState<'password' | 'quick'>('password');
  const [emailOrUser, setEmailOrUser] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrUser.trim() || !password.trim()) {
      setErrorMsg('กรุณากรอกอีเมล/ชื่อผู้ใช้ และรหัสผ่าน');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const res = await AuthService.signInWithMainSystem(emailOrUser, password);
    setLoading(false);

    if (res.success && res.user) {
      onLoginSuccess(res.user);
      onClose();
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleSelectTeacherQuick = (t: TeacherProfile) => {
    const user = AuthService.loginAsTeacher(t);
    onLoginSuccess(user);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-emerald-700 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-800 rounded-lg">
              <Lock className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-bold text-base">เข้าสู่ระบบครูผู้สอน & ฝ่ายวิชาการ</h3>
              <p className="text-xs text-emerald-100">ใช้รหัสผ่านชุดเดียวกับระบบบริหารสถานศึกษาหลัก</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-200 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold">
          <button
            onClick={() => { setActiveMode('password'); setErrorMsg(null); }}
            className={`flex-1 py-3 text-center border-b-2 transition ${
              activeMode === 'password'
                ? 'border-emerald-600 text-emerald-800 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            เข้าสู่ระบบด้วยรหัสผ่านหลัก (Supabase Auth)
          </button>
          <button
            onClick={() => { setActiveMode('quick'); setErrorMsg(null); }}
            className={`flex-1 py-3 text-center border-b-2 transition ${
              activeMode === 'quick'
                ? 'border-emerald-600 text-emerald-800 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            เลือกโปรไฟล์ครูด่วน (โหมดออฟไลน์ / ประจำชั้น)
          </button>
        </div>

        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {activeMode === 'password' ? (
            <form onSubmit={handleSubmitPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  อีเมลระบบหลัก หรือ ชื่อครู
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="เช่น watchan6441@gmail.com หรือ สุธัญญา"
                    value={emailOrUser}
                    onChange={(e) => setEmailOrUser(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  รหัสผ่าน (Password เดียวกับระบบหลัก)
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                <div className="font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  กติกาการจำกัดสิทธิ์ (Class Scoping)
                </div>
                <ul className="list-disc pl-4 space-y-0.5 text-slate-500">
                  <li><strong>ครูประจำชั้น</strong> จะเห็นและบันทึกคะแนนได้เฉพาะชั้นที่ตนเองรับผิดชอบ</li>
                  <li><strong>หัวหน้าวิชาการ / ผู้อำนวยการ</strong> สามารถเข้าถึงและอนุมัติได้ทุกชั้นเรียน</li>
                </ul>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition disabled:opacity-50"
                >
                  {loading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
                  <LogIn className="w-4 h-4" />
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 mb-2">
                เลือกโปรไฟล์ของคุณเพื่อเข้าสู่ห้องเรียนที่รับผิดชอบทันที (เหมาะสำหรับเครื่องที่ทำงานแบบออฟไลน์):
              </p>
              <div className="grid grid-cols-1 gap-2 max-h-72 overflow-y-auto pr-1">
                {(teachers && teachers.length > 0 ? teachers : DEFAULT_TEACHERS).map((t) => {
                  const isCurrent = currentUser?.displayName === t.name;
                  const isDirector = t.role === 'director';
                  const isAcademic = t.role === 'academic_head' || isDirector || t.assignedClasses.includes('*');

                  return (
                    <button
                      key={t.id}
                      onClick={() => handleSelectTeacherQuick(t)}
                      className={`text-left p-3 rounded-xl border transition flex items-center justify-between ${
                        isCurrent
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-200'
                          : 'border-slate-200 hover:border-emerald-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isAcademic ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {isAcademic ? <ShieldCheck className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800">{t.name}</div>
                          <div className="text-[11px] text-slate-500">{t.roleTitle}</div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {t.assignedClasses.includes('*') ? 'ทุกชั้นเรียน' : (t.assignedClasses.length > 0 ? `ชั้น ${t.assignedClasses.join(', ')}` : 'บุคลากร')}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
