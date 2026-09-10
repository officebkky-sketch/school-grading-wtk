// src/components/SubjectMarksheetTab.tsx
import React, { useState } from 'react';
import { StudentProfile, SubjectConfig, StudentScoreRecord, AcademicConfig } from '../types/pp5Types';
import { GradingEngine } from '../engines/gradingEngine';
import { exportSchoolMIS_SingleSubjectCSV, exportTeacherPersonalBackupExcel } from '../utils/schoolMisExporter';
import {
  BookOpen,
  BarChart3,
  Save,
  RotateCcw,
  Award,
  CheckCircle2,
  Plus,
  Trash2,
  X,
  FileSpreadsheet,
  Download,
  HardDriveDownload
} from 'lucide-react';

interface Props {
  students: StudentProfile[];
  subjects: SubjectConfig[];
  scores: Record<string, Record<string, StudentScoreRecord>>; // subjectId -> (studentId -> scoreRecord)
  onUpdateScore: (subjectId: string, studentId: string, updatedRecord: StudentScoreRecord) => void;
  semester: 1 | 2;
  config: AcademicConfig;
  teacherName?: string;
  onAddSubject?: (newSub: SubjectConfig) => void;
  onDeleteSubject?: (id: string) => void;
  canEdit?: boolean;
}

export const SubjectMarksheetTab: React.FC<Props> = ({
  students,
  subjects,
  scores,
  onUpdateScore,
  semester,
  config,
  teacherName = 'ครูผู้สอน',
  onAddSubject,
  onDeleteSubject,
  canEdit = true
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || '');
  
  // Auto-switch selected subject when subjects list changes (e.g. user switches class)
  React.useEffect(() => {
    if (subjects.length > 0 && !subjects.some(s => s.id === selectedSubjectId)) {
      setSelectedSubjectId(subjects[0].id);
    }
  }, [subjects, selectedSubjectId]);

  const selectedSubject = subjects.find(s => s.id === selectedSubjectId) || subjects[0];

  const currentSubjectScores = scores[selectedSubjectId] || {};

  // Compute stats based on yearlyTotal or term total
  const scoreList = students.map(s => {
    const rec = currentSubjectScores[s.studentId];
    if (!rec) return null;
    return semester === 1 ? rec.total1 : (rec.yearlyTotal ?? rec.total2);
  });

  const stats = GradingEngine.calculateStatistics(scoreList);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSubCode, setNewSubCode] = useState('');
  const [newSubName, setNewSubName] = useState('');
  const [newSubType, setNewSubType] = useState<'พื้นฐาน' | 'เพิ่มเติม' | 'กิจกรรม'>('เพิ่มเติม');
  const [newSubCredits, setNewSubCredits] = useState(1.0);
  const [newSubHours, setNewSubHours] = useState(40);

  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim() || !newSubCode.trim()) return;
    const newSubject: SubjectConfig = {
      id: 'sub_' + Date.now(),
      code: newSubCode.trim(),
      name: newSubName.trim(),
      type: newSubType,
      credits: Number(newSubCredits) || 1.0,
      hoursPerYear: Number(newSubHours) || 40,
      fullScoreTerm1: 50,
      fullScoreTerm2: 50
    };
    if (onAddSubject) onAddSubject(newSubject);
    setSelectedSubjectId(newSubject.id);
    setIsAddModalOpen(false);
    setNewSubCode('');
    setNewSubName('');
  };

  const handleScoreChange = (
    studentId: string,
    field: 'formative1' | 'midterm1' | 'final1' | 'formative2' | 'midterm2' | 'final2',
    valStr: string
  ) => {
    const num = valStr === '' ? null : Math.max(0, Math.min(100, Number(valStr)));
    const existing = currentSubjectScores[studentId] || {
      studentId,
      formative1: null, midterm1: null, final1: null, total1: null,
      formative2: null, midterm2: null, final2: null, total2: null,
      yearlyTotal: null, grade: '-', isPassed: false
    };

    const updated: StudentScoreRecord = { ...existing, [field]: num };

    // Recalculate totals
    const t1 = (updated.formative1 ?? 0) + (updated.midterm1 ?? 0) + (updated.final1 ?? 0);
    const hasT1 = updated.formative1 !== null || updated.midterm1 !== null || updated.final1 !== null;
    updated.total1 = hasT1 ? t1 : null;

    const t2 = (updated.formative2 ?? 0) + (updated.midterm2 ?? 0) + (updated.final2 ?? 0);
    const hasT2 = updated.formative2 !== null || updated.midterm2 !== null || updated.final2 !== null;
    updated.total2 = hasT2 ? t2 : null;

    // Yearly total & Grade calculation according to OBEC (สพฐ.) regulations
    // คะแนนตลอดปีการศึกษา (เต็ม 100) = ภาคเรียนที่ 1 (เต็ม 50) + ภาคเรียนที่ 2 (เต็ม 50)
    // การตัดสินผลการเรียน (เกรด 0-4) จะเกิดขึ้นเมื่อมีคะแนนครบทั้ง 2 ภาคเรียนเท่านั้น
    if (updated.total1 !== null && updated.total2 !== null) {
      updated.yearlyTotal = Math.round((updated.total1 + updated.total2) * 100) / 100;
      updated.grade = GradingEngine.calculateGrade(updated.yearlyTotal);
      updated.isPassed = updated.yearlyTotal >= 50;
    } else {
      // หากยังไม่มีคะแนนครบ 2 ภาคเรียน: ยังไม่สรุปผลรวมตลอดปี และยังไม่ตัดเกรดปลายปี
      updated.yearlyTotal = null;
      updated.grade = '-';
      updated.isPassed = false;
    }

    onUpdateScore(selectedSubjectId, studentId, updated);
  };

  const getGradeBadgeColor = (grade: string) => {
    switch (grade) {
      case '4': return 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold';
      case '3.5': return 'bg-teal-100 text-teal-800 border-teal-300 font-bold';
      case '3': return 'bg-cyan-100 text-cyan-800 border-cyan-300 font-semibold';
      case '2.5': return 'bg-blue-100 text-blue-800 border-blue-300 font-semibold';
      case '2': return 'bg-amber-100 text-amber-800 border-amber-300 font-medium';
      case '1.5': return 'bg-orange-100 text-orange-800 border-orange-300 font-medium';
      case '1': return 'bg-yellow-100 text-yellow-800 border-yellow-300 font-medium';
      case '0': return 'bg-rose-100 text-rose-800 border-rose-300 font-bold';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Subject Selector and Control Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">เลือกรายวิชาที่ต้องการกรอกคะแนน</div>
              <div className="flex items-center gap-2 mt-0.5">
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="text-base font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.code} {s.name} ({s.credits} นก. / {s.hoursPerYear} ชม.)
                    </option>
                  ))}
                </select>
                <span className="text-xs px-2.5 py-1 rounded bg-slate-100 text-slate-600 font-medium border border-slate-200">
                  {selectedSubject?.type}
                </span>

                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  เพิ่มวิชา
                </button>
                {onDeleteSubject && subjects.length > 1 && (
                  <button
                    onClick={() => {
                      if (confirm(`คุณต้องการลบรายวิชา "${selectedSubject?.name}" ออกจากระบบใช่หรือไม่?`)) {
                        onDeleteSubject(selectedSubjectId);
                        setSelectedSubjectId(subjects[0]?.id || '');
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="ลบรายวิชานี้"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* ปุ่มดาวน์โหลดไฟล์ CSV นำเข้า SchoolMIS */}
            <button
              onClick={() => {
                if (selectedSubject) {
                  exportSchoolMIS_SingleSubjectCSV(
                    students,
                    selectedSubject,
                    currentSubjectScores,
                    config
                  );
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-xs transition"
              title="ดาวน์โหลดไฟล์ CSV เพื่อนำเข้าคะแนนรายวิชานี้สู่ระบบ SchoolMIS ของ สพฐ."
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
              <span>นำเข้า SchoolMIS (.csv)</span>
            </button>

            {/* ปุ่มดาวน์โหลดคะแนนเก็บส่วนตัวครู */}
            <button
              onClick={() => {
                if (selectedSubject) {
                  exportTeacherPersonalBackupExcel(
                    students,
                    selectedSubject,
                    currentSubjectScores,
                    config,
                    teacherName
                  );
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs transition"
              title="ดาวน์โหลดคะแนนเก็บและสถิติของวิชานี้เป็นไฟล์ Excel เพื่อเก็บไว้ส่วนตัว"
            >
              <HardDriveDownload className="w-4 h-4 text-indigo-200" />
              <span>บันทึกคะแนนส่วนตัว (.xlsx)</span>
            </button>
          </div>
        </div>

        {!canEdit && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-amber-800 text-xs font-semibold">
            <span>🔒 โหมดดูข้อมูล (Read-Only): คุณไม่มีสิทธิ์บันทึกคะแนนในห้องนี้ (เฉพาะครูประจำชั้นของห้องนี้หรือหัวหน้าวิชาการเท่านั้น)</span>
          </div>
        )}

        {/* Real-time Statistics Bar */}
        <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200/80">
            <div className="text-xs text-slate-500">จำนวนนักเรียน</div>
            <div className="text-lg font-bold text-slate-800">{stats.count} คน</div>
          </div>
          <div className="bg-emerald-50/60 rounded-lg p-3 border border-emerald-200/60">
            <div className="text-xs text-emerald-700 font-medium">คะแนนเฉลี่ย (Mean)</div>
            <div className="text-lg font-bold text-emerald-800">{stats.mean}</div>
          </div>
          <div className="bg-blue-50/60 rounded-lg p-3 border border-blue-200/60">
            <div className="text-xs text-blue-700 font-medium">ส่วนเบี่ยงเบน (S.D.)</div>
            <div className="text-lg font-bold text-blue-800">{stats.sd}</div>
          </div>
          <div className="bg-indigo-50/60 rounded-lg p-3 border border-indigo-200/60">
            <div className="text-xs text-indigo-700 font-medium">คะแนนสูงสุด / ต่ำสุด</div>
            <div className="text-lg font-bold text-indigo-800">{stats.max} / {stats.min}</div>
          </div>
          <div className="bg-teal-50/60 rounded-lg p-3 border border-teal-200/60">
            <div className="text-xs text-teal-700 font-medium">ผ่านเกณฑ์ (&ge; 50)</div>
            <div className="text-lg font-bold text-teal-800">{stats.passCount} คน ({stats.passPercent}%)</div>
          </div>
          <div className="bg-amber-50/60 rounded-lg p-3 border border-amber-200/60">
            <div className="text-xs text-amber-700 font-medium">เกรด 4 ทั้งหมด</div>
            <div className="text-lg font-bold text-amber-800">{stats.gradeDistribution['4'] || 0} คน</div>
          </div>
        </div>
      </div>

      {/* Interactive Marksheet Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <span className="font-bold text-slate-700">รายชื่อนักเรียนและตารางบันทึกคะแนน</span>
            <span className="text-slate-400 hidden sm:inline">• ลำดับเลขที่ตามมาตรฐาน SchoolMIS</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-700 font-semibold bg-emerald-100/70 px-2.5 py-0.5 rounded-full border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>บันทึกอัตโนมัติทันที (Auto-saved)</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200 uppercase text-xs">
              <tr>
                <th rowSpan={2} className="px-3 py-2.5 text-center w-12 border-r border-slate-200">เลขที่</th>
                <th rowSpan={2} className="px-3 py-2.5 text-center w-20 border-r border-slate-200">รหัส</th>
                <th rowSpan={2} className="px-4 py-2.5 border-r border-slate-200 min-w-[180px]">ชื่อ - นามสกุล</th>
                
                {/* ภาคเรียนที่ 1 */}
                <th colSpan={4} className="px-3 py-1.5 text-center bg-blue-50/60 border-r border-slate-200 text-blue-900 font-bold">
                  ภาคเรียนที่ 1 (เต็ม 50)
                </th>

                {/* ภาคเรียนที่ 2 */}
                <th colSpan={4} className="px-3 py-1.5 text-center bg-indigo-50/60 border-r border-slate-200 text-indigo-900 font-bold">
                  ภาคเรียนที่ 2 (เต็ม 50)
                </th>

                {/* รวมทั้งปี & เกรด */}
                <th rowSpan={2} className="px-3 py-2.5 text-center w-20 bg-amber-50/80 text-amber-900 font-bold border-r border-slate-200">
                  รวม (100)
                </th>
                <th rowSpan={2} className="px-3 py-2.5 text-center w-20 bg-emerald-50/80 text-emerald-900 font-bold border-r border-slate-200">
                  ระดับผลการเรียน
                </th>
                <th rowSpan={2} className="px-3 py-2.5 text-center w-20">
                  ผลการตัดสิน
                </th>
              </tr>
              <tr>
                {/* Term 1 Subheaders */}
                <th className="px-2 py-1.5 text-center w-16 bg-blue-50/40 text-blue-800 text-[11px] font-medium border-r border-slate-200">เก็บ (30)</th>
                <th className="px-2 py-1.5 text-center w-16 bg-blue-50/40 text-blue-800 text-[11px] font-medium border-r border-slate-200">กลาง (10)</th>
                <th className="px-2 py-1.5 text-center w-16 bg-blue-50/40 text-blue-800 text-[11px] font-medium border-r border-slate-200">ปลาย (10)</th>
                <th className="px-2 py-1.5 text-center w-16 bg-blue-100/70 text-blue-900 text-[11px] font-bold border-r border-slate-200">รวม 1</th>

                {/* Term 2 Subheaders */}
                <th className="px-2 py-1.5 text-center w-16 bg-indigo-50/40 text-indigo-800 text-[11px] font-medium border-r border-slate-200">เก็บ (30)</th>
                <th className="px-2 py-1.5 text-center w-16 bg-indigo-50/40 text-indigo-800 text-[11px] font-medium border-r border-slate-200">กลาง (10)</th>
                <th className="px-2 py-1.5 text-center w-16 bg-indigo-50/40 text-indigo-800 text-[11px] font-medium border-r border-slate-200">ปลาย (10)</th>
                <th className="px-2 py-1.5 text-center w-16 bg-indigo-100/70 text-indigo-900 text-[11px] font-bold border-r border-slate-200">รวม 2</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-xs">
              {students.map((s) => {
                const rec = currentSubjectScores[s.studentId] || {
                  studentId: s.studentId,
                  formative1: null, midterm1: null, final1: null, total1: null,
                  formative2: null, midterm2: null, final2: null, total2: null,
                  yearlyTotal: null, grade: '-', isPassed: false
                };

                return (
                  <tr key={s.id} className="hover:bg-slate-50 transition">
                    <td className="px-3 py-2 text-center font-bold text-slate-800 border-r border-slate-200 font-sans">{s.seq}</td>
                    <td className="px-3 py-2 text-center text-slate-500 border-r border-slate-200">{s.studentId}</td>
                    <td className="px-4 py-2 font-medium text-slate-900 border-r border-slate-200 font-sans truncate">
                      {s.prefix}{s.firstName} {s.lastName}
                    </td>

                    {/* Term 1 Inputs */}
                    <td className="p-1 border-r border-slate-200">
                      <input
                        type="number"
                        min={0}
                        max={30}
                        placeholder="-"
                        disabled={!canEdit}
                        readOnly={!canEdit}
                        value={rec.formative1 ?? ''}
                        onChange={(e) => handleScoreChange(s.studentId, 'formative1', e.target.value)}
                        className={`w-full text-center py-1 bg-transparent rounded font-semibold text-slate-800 ${
                          canEdit
                            ? 'hover:bg-blue-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-text'
                            : 'cursor-not-allowed opacity-75'
                        }`}
                      />
                    </td>
                    <td className="p-1 border-r border-slate-200">
                      <input
                        type="number"
                        min={0}
                        max={10}
                        placeholder="-"
                        disabled={!canEdit}
                        readOnly={!canEdit}
                        value={rec.midterm1 ?? ''}
                        onChange={(e) => handleScoreChange(s.studentId, 'midterm1', e.target.value)}
                        className={`w-full text-center py-1 bg-transparent rounded font-semibold text-slate-800 ${
                          canEdit
                            ? 'hover:bg-blue-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-text'
                            : 'cursor-not-allowed opacity-75'
                        }`}
                      />
                    </td>
                    <td className="p-1 border-r border-slate-200">
                      <input
                        type="number"
                        min={0}
                        max={10}
                        placeholder="-"
                        disabled={!canEdit}
                        readOnly={!canEdit}
                        value={rec.final1 ?? ''}
                        onChange={(e) => handleScoreChange(s.studentId, 'final1', e.target.value)}
                        className={`w-full text-center py-1 bg-transparent rounded font-semibold text-slate-800 ${
                          canEdit
                            ? 'hover:bg-blue-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-text'
                            : 'cursor-not-allowed opacity-75'
                        }`}
                      />
                    </td>
                    <td className="px-2 py-2 text-center font-bold bg-blue-50/30 text-blue-900 border-r border-slate-200">
                      {rec.total1 ?? '-'}
                    </td>

                    {/* Term 2 Inputs */}
                    <td className="p-1 border-r border-slate-200">
                      <input
                        type="number"
                        min={0}
                        max={30}
                        placeholder="-"
                        disabled={!canEdit}
                        readOnly={!canEdit}
                        value={rec.formative2 ?? ''}
                        onChange={(e) => handleScoreChange(s.studentId, 'formative2', e.target.value)}
                        className={`w-full text-center py-1 bg-transparent rounded font-semibold text-slate-800 ${
                          canEdit
                            ? 'hover:bg-indigo-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-text'
                            : 'cursor-not-allowed opacity-75'
                        }`}
                      />
                    </td>
                    <td className="p-1 border-r border-slate-200">
                      <input
                        type="number"
                        min={0}
                        max={10}
                        placeholder="-"
                        disabled={!canEdit}
                        readOnly={!canEdit}
                        value={rec.midterm2 ?? ''}
                        onChange={(e) => handleScoreChange(s.studentId, 'midterm2', e.target.value)}
                        className={`w-full text-center py-1 bg-transparent rounded font-semibold text-slate-800 ${
                          canEdit
                            ? 'hover:bg-indigo-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-text'
                            : 'cursor-not-allowed opacity-75'
                        }`}
                      />
                    </td>
                    <td className="p-1 border-r border-slate-200">
                      <input
                        type="number"
                        min={0}
                        max={10}
                        placeholder="-"
                        disabled={!canEdit}
                        readOnly={!canEdit}
                        value={rec.final2 ?? ''}
                        onChange={(e) => handleScoreChange(s.studentId, 'final2', e.target.value)}
                        className={`w-full text-center py-1 bg-transparent rounded font-semibold text-slate-800 ${
                          canEdit
                            ? 'hover:bg-indigo-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-text'
                            : 'cursor-not-allowed opacity-75'
                        }`}
                      />
                    </td>
                    <td className="px-2 py-2 text-center font-bold bg-indigo-50/30 text-indigo-900 border-r border-slate-200">
                      {rec.total2 ?? '-'}
                    </td>

                    {/* Yearly Total & Grade */}
                    <td className="px-2 py-2 text-center font-bold bg-amber-50/30 text-amber-900 border-r border-slate-200">
                      {rec.yearlyTotal ?? '-'}
                    </td>
                    <td className="px-2 py-2 text-center border-r border-slate-200">
                      <span className={`inline-block w-8 py-0.5 rounded text-center text-xs border ${getGradeBadgeColor(rec.grade)}`}>
                        {rec.grade}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-center font-sans text-xs">
                      {rec.grade !== '-' ? (
                        rec.isPassed ? (
                          <span className="text-emerald-600 font-semibold">ผ่าน</span>
                        ) : (
                          <span className="text-rose-600 font-semibold">ไม่ผ่าน</span>
                        )
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Subject Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                เพิ่มรายวิชาใหม่
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubject} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">รหัสวิชา (เช่น ส 11231)</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ส 11231"
                  value={newSubCode}
                  onChange={(e) => setNewSubCode(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อรายวิชา (เช่น หน้าที่พลเมือง)</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น หน้าที่พลเมือง"
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ประเภทวิชา</label>
                  <select
                    value={newSubType}
                    onChange={(e) => setNewSubType(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="พื้นฐาน">พื้นฐาน</option>
                    <option value="เพิ่มเติม">เพิ่มเติม</option>
                    <option value="กิจกรรม">กิจกรรม</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">หน่วยกิต / น้ำหนัก</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    value={newSubCredits}
                    onChange={(e) => setNewSubCredits(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">จำนวนชั่วโมงต่อปี (ชม.)</label>
                <input
                  type="number"
                  min="0"
                  max="400"
                  value={newSubHours}
                  onChange={(e) => setNewSubHours(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition"
                >
                  บันทึกรายวิชา
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
