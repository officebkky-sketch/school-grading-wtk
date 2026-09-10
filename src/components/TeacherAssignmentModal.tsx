// src/components/TeacherAssignmentModal.tsx
import React, { useState } from 'react';
import { X, UserCheck, RotateCcw, ShieldCheck, Check } from 'lucide-react';
import { DEFAULT_CLASS_TEACHER_MAP, DEFAULT_TEACHERS } from '../data/teachersData';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  classTeacherMap: Record<string, string>;
  onSaveAssignments: (newMap: Record<string, string>) => void;
  availableClasses: string[];
}

export const TeacherAssignmentModal: React.FC<Props> = ({
  isOpen,
  onClose,
  classTeacherMap,
  onSaveAssignments,
  availableClasses
}) => {
  const [currentMap, setCurrentMap] = useState<Record<string, string>>({ ...classTeacherMap });

  if (!isOpen) return null;

  const handleTeacherChange = (cls: string, teacherName: string) => {
    setCurrentMap(prev => ({ ...prev, [cls]: teacherName }));
  };

  const handleResetToDefault = () => {
    if (confirm('คุณต้องการรีเซ็ตการมอบหมายครูประจำชั้นเป็นค่าเริ่มต้นของโรงเรียนวัดท่าควายใช่หรือไม่?')) {
      setCurrentMap(DEFAULT_CLASS_TEACHER_MAP);
    }
  };

  const handleSave = () => {
    onSaveAssignments(currentMap);
    onClose();
  };

  // List of distinct teacher names for quick select
  const candidateNames = Array.from(
    new Set([
      ...DEFAULT_TEACHERS.filter(t => t.role !== 'director').map(t => t.name),
      ...Object.values(currentMap)
    ])
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 no-print">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150">
        
        {/* Modal Header */}
        <div className="bg-emerald-800 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-700/80 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-lg font-bold">กำหนดครูประจำชั้นเข้าบันทึกข้อมูล</h2>
              <p className="text-xs text-emerald-200">งานวิชาการและทะเบียน • โรงเรียนวัดท่าควาย</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-700/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
          <div className="text-xs text-slate-500 bg-emerald-50 border border-emerald-200 p-3 rounded-lg flex items-start gap-2">
            <UserCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <span>
              ครูประจำชั้นที่ได้รับการมอบหมาย จะมีสิทธิ์บันทึกคะแนน เวลาเรียน โภชนาการ และการประเมินคุณลักษณะของห้องนั้นๆ โดยตรง
              พร้อมทั้งแสดงชื่อในช่องลงนาม ปพ.5 และ ปพ.6 อัตโนมัติ
            </span>
          </div>

          <div className="space-y-3">
            {availableClasses.map((cls) => {
              const assigned = currentMap[cls] || '';
              return (
                <div
                  key={cls}
                  className="flex items-center justify-between gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200 hover:border-emerald-300 transition"
                >
                  <div className="w-20 shrink-0">
                    <span className="inline-block px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-md">
                      ชั้น {cls}
                    </span>
                  </div>

                  <div className="flex-1">
                    <input
                      type="text"
                      list={`teachers-list-${cls}`}
                      value={assigned}
                      onChange={(e) => handleTeacherChange(cls, e.target.value)}
                      placeholder="ระบุชื่อ - สกุลครูประจำชั้น"
                      className="w-full text-sm font-medium text-slate-800 bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <datalist id={`teachers-list-${cls}`}>
                      {candidateNames.map(name => (
                        <option key={name} value={name} />
                      ))}
                    </datalist>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={handleResetToDefault}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-200 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            คืนค่าเริ่มต้น
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg shadow-sm transition"
            >
              <Check className="w-4 h-4" />
              บันทึกการมอบหมาย
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
