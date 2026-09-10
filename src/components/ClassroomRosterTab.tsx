// src/components/ClassroomRosterTab.tsx
import React, { useState } from 'react';
import { StudentProfile } from '../types/pp5Types';
import { Users, Search, FileSpreadsheet, Plus, CheckCircle, AlertCircle } from 'lucide-react';
import { formatThaiBirthDate } from '../utils/studentDateUtils';

interface Props {
  students: StudentProfile[];
  classLevel: string;
  onUpdateStudents: (updated: StudentProfile[]) => void;
}

export const ClassroomRosterTab: React.FC<Props> = ({ students, classLevel, onUpdateStudents }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingStudent, setEditingStudent] = useState<StudentProfile | null>(null);

  const filtered = students.filter(s =>
    (s.firstName + s.lastName).includes(searchTerm) ||
    s.studentId.includes(searchTerm) ||
    s.nationalId.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              ทะเบียนรายชื่อนักเรียน ชั้น {classLevel}
              <span className="ml-2 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                {students.length} คน
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              ข้อมูลเชื่อมโยงจากระบบ SchoolMIS / DMC พร้อมเลขที่ รหัสประจำตัว และข้อมูลทางทะเบียนครบถ้วน
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ค้นหาชื่อ, รหัสนักเรียน..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-1.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
              />
            </div>

            <button
              onClick={() => alert('ฟังก์ชันนำเข้าไฟล์ Excel SchoolMIS/DMC: พร้อมรองรับการอัปโหลดไฟล์คะแนนหรือทะเบียนเพื่ออัปเดตรายชื่อ')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-sm font-medium rounded-lg border border-emerald-200 transition"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              นำเข้าไฟล์ Excel
            </button>
          </div>
        </div>
      </div>

      {/* Student Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-center w-16">เลขที่</th>
                <th className="px-4 py-3">รหัสนักเรียน</th>
                <th className="px-4 py-3">เลขประจำตัวประชาชน</th>
                <th className="px-4 py-3">ชื่อ - นามสกุล</th>
                <th className="px-4 py-3 text-center">เพศ</th>
                <th className="px-4 py-3 text-center">วันเกิด</th>
                <th className="px-4 py-3 text-center">อายุ</th>
                <th className="px-4 py-3 text-center">นน./สส.</th>
                <th className="px-4 py-3">ผู้ปกครอง</th>
                <th className="px-4 py-3 text-center">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-emerald-50/40 transition">
                  <td className="px-4 py-3 text-center font-bold text-slate-800">{s.seq}</td>
                  <td className="px-4 py-3 font-mono font-medium text-emerald-700">{s.studentId}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{s.nationalId}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {s.prefix}{s.firstName} {s.lastName}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                      s.gender === 'ชาย' || s.gender === 'ช' 
                        ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {s.gender === 'ชาย' || s.gender === 'ช' ? 'ชาย' : 'หญิง'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-xs font-mono">{formatThaiBirthDate(s.birthDate, 'short')}</td>
                  <td className="px-4 py-3 text-center">{s.ageYears} ปี</td>
                  <td className="px-4 py-3 text-center text-xs">
                    {s.weight > 0 ? `${s.weight} กก.` : '-'} / {s.height > 0 ? `${s.height} ซม.` : '-'}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <div className="font-medium text-slate-700">{s.guardianName || s.fatherName || s.motherName || '-'}</div>
                    <div className="text-slate-400">{s.guardianRel ? `(${s.guardianRel})` : ''}</div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                      <CheckCircle className="w-3.5 h-3.5" /> ปกติ
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-slate-400">
                    ไม่พบข้อมูลนักเรียนที่ตรงกับคำค้นหา
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
