import React, { useState, useEffect } from 'react';
import { StudentProfile, AttendanceDetail } from '../types/pp5Types';
import { CalendarCheck, CheckCircle, AlertTriangle, Clock, Sparkles } from 'lucide-react';

interface Props {
  students: StudentProfile[];
  classLevel: string;
  semester: 1 | 2;
  totalDays: number;
  attendanceData?: Record<string, AttendanceDetail>;
  onUpdateAttendance?: (studentId: string, data: AttendanceDetail) => void;
  onBulkUpdateAttendance?: (records: Record<string, AttendanceDetail>) => void;
}

export const AttendanceTrackerTab: React.FC<Props> = ({
  students,
  classLevel,
  semester,
  totalDays,
  attendanceData,
  onUpdateAttendance,
  onBulkUpdateAttendance
}) => {
  const [records, setRecords] = useState<Record<string, AttendanceDetail>>(() => {
    if (attendanceData && Object.keys(attendanceData).length > 0) {
      return attendanceData;
    }
    const init: Record<string, AttendanceDetail> = {};
    students.forEach(s => {
      // Default: 95-100% attendance
      init[s.studentId] = { present: totalDays - 2, leave: 1, sick: 1, absent: 0 };
    });
    return init;
  });

  useEffect(() => {
    if (attendanceData && Object.keys(attendanceData).length > 0) {
      setRecords(attendanceData);
    }
  }, [attendanceData]);

  const handleDayChange = (studentId: string, field: 'present' | 'leave' | 'sick' | 'absent', valStr: string) => {
    const val = valStr === '' ? 0 : Math.max(0, Number(valStr));
    const current = records[studentId] || { present: totalDays, leave: 0, sick: 0, absent: 0 };
    const updatedRecord = { ...current, [field]: val };
    
    setRecords(prev => ({
      ...prev,
      [studentId]: updatedRecord
    }));

    if (onUpdateAttendance) {
      onUpdateAttendance(studentId, updatedRecord);
    }
  };

  const handleBulkFill100 = () => {
    const updated: Record<string, AttendanceDetail> = {};
    students.forEach(s => {
      updated[s.studentId] = { present: totalDays, leave: 0, sick: 0, absent: 0 };
    });
    setRecords(updated);
    if (onBulkUpdateAttendance) {
      onBulkUpdateAttendance(updated);
    }
  };

  // Compute attendance stats
  const evaluations = students.map(s => {
    const r = records[s.studentId] || { present: totalDays, leave: 0, sick: 0, absent: 0 };
    const attended = r.present + r.leave + r.sick; // Days considered valid
    const percent = totalDays > 0 ? Math.round((r.present / totalDays) * 1000) / 10 : 0;
    const isEligible = percent >= 80;
    return {
      student: s,
      record: r,
      percent,
      isEligible
    };
  });

  const eligibleCount = evaluations.filter(e => e.isEligible).length;
  const inEligibleCount = evaluations.filter(e => !e.isEligible).length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-emerald-600" />
              การบันทึกเวลาเรียน ชั้น {classLevel} (ภาคเรียนที่ {semester})
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              เวลาเรียนทั้งหมด {totalDays} วัน • เกณฑ์สิทธิ์เข้าสอบตามระเบียบ สพฐ. ต้องมีเวลาเรียนไม่น้อยกว่าร้อยละ 80 (&ge; {Math.ceil(totalDays * 0.8)} วัน)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleBulkFill100}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-sm font-medium rounded-lg border border-emerald-200 transition"
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              ลงเวลามาเรียนเต็ม ({totalDays} วัน) ทั้งห้อง
            </button>
          </div>
        </div>

        {/* Attendance Summary */}
        <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-emerald-50 rounded-lg p-3.5 border border-emerald-200 flex items-center justify-between">
            <div>
              <div className="text-xs text-emerald-700 font-medium">มีสิทธิ์เข้าสอบ (&ge; 80%)</div>
              <div className="text-2xl font-bold text-emerald-900 mt-0.5">{eligibleCount} คน</div>
            </div>
            <CheckCircle className="w-6 h-6 text-emerald-600" />
          </div>

          <div className="bg-rose-50 rounded-lg p-3.5 border border-rose-200 flex items-center justify-between">
            <div>
              <div className="text-xs text-rose-700 font-medium">หมดสิทธิ์สอบ / มส. (&lt; 80%)</div>
              <div className="text-2xl font-bold text-rose-900 mt-0.5">{inEligibleCount} คน</div>
            </div>
            <AlertTriangle className="w-6 h-6 text-rose-600" />
          </div>

          <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-medium">วันเปิดเรียนทั้งหมด</div>
              <div className="text-2xl font-bold text-slate-800 mt-0.5">{totalDays} วัน</div>
            </div>
            <Clock className="w-6 h-6 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase text-xs">
              <tr>
                <th className="px-3 py-3 text-center w-12">เลขที่</th>
                <th className="px-3 py-3 text-center w-20">รหัส</th>
                <th className="px-4 py-3 min-w-[160px]">ชื่อ - นามสกุล</th>
                <th className="px-3 py-3 text-center w-24 bg-emerald-50/50 text-emerald-900">มาเรียน (วัน)</th>
                <th className="px-3 py-3 text-center w-20">ลา (วัน)</th>
                <th className="px-3 py-3 text-center w-20">ป่วย (วัน)</th>
                <th className="px-3 py-3 text-center w-20 bg-rose-50/50 text-rose-900">ขาด (วัน)</th>
                <th className="px-3 py-3 text-center w-28">ร้อยละเวลาเรียน</th>
                <th className="px-3 py-3 text-center w-28">สิทธิ์เข้าสอบ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {evaluations.map(({ student: s, record: r, percent, isEligible }) => (
                <tr key={s.id} className="hover:bg-slate-50 transition">
                  <td className="px-3 py-2.5 text-center font-bold text-slate-800">{s.seq}</td>
                  <td className="px-3 py-2.5 text-center font-mono text-slate-500">{s.studentId}</td>
                  <td className="px-4 py-2.5 font-medium text-slate-900">
                    {s.prefix}{s.firstName} {s.lastName}
                  </td>

                  {/* Present */}
                  <td className="p-1 bg-emerald-50/20">
                    <input
                      type="number"
                      min={0}
                      max={totalDays}
                      value={r.present}
                      onChange={(e) => handleDayChange(s.studentId, 'present', e.target.value)}
                      className="w-full text-center py-1.5 bg-white border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded font-semibold text-emerald-800"
                    />
                  </td>

                  {/* Leave */}
                  <td className="p-1">
                    <input
                      type="number"
                      min={0}
                      max={totalDays}
                      value={r.leave}
                      onChange={(e) => handleDayChange(s.studentId, 'leave', e.target.value)}
                      className="w-full text-center py-1.5 bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded text-slate-700"
                    />
                  </td>

                  {/* Sick */}
                  <td className="p-1">
                    <input
                      type="number"
                      min={0}
                      max={totalDays}
                      value={r.sick}
                      onChange={(e) => handleDayChange(s.studentId, 'sick', e.target.value)}
                      className="w-full text-center py-1.5 bg-white border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 rounded text-slate-700"
                    />
                  </td>

                  {/* Absent */}
                  <td className="p-1 bg-rose-50/20">
                    <input
                      type="number"
                      min={0}
                      max={totalDays}
                      value={r.absent}
                      onChange={(e) => handleDayChange(s.studentId, 'absent', e.target.value)}
                      className="w-full text-center py-1.5 bg-white border border-slate-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 rounded font-semibold text-rose-700"
                    />
                  </td>

                  {/* Attendance Percent */}
                  <td className="px-3 py-2.5 text-center font-bold">
                    <span className={percent >= 80 ? 'text-emerald-700' : 'text-rose-600'}>
                      {percent}%
                    </span>
                  </td>

                  {/* Exam Eligibility */}
                  <td className="px-3 py-2.5 text-center">
                    {isEligible ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <CheckCircle className="w-3.5 h-3.5" /> มีสิทธิ์สอบ
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                        <AlertTriangle className="w-3.5 h-3.5" /> มส.
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
