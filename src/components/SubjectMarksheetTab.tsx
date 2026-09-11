// src/components/SubjectMarksheetTab.tsx
import React, { useState } from 'react';
import { StudentProfile, SubjectConfig, StudentScoreRecord, AcademicConfig } from '../types/pp5Types';
import { GradingEngine } from '../engines/gradingEngine';
import {
  exportSchoolMIS_SingleSubjectCSV,
  importSchoolMIS_SingleSubjectCSV,
  exportTeacherPersonalBackupExcel,
  sortStudentsForSchoolMIS,
  extractCleanFirstName
} from '../utils/schoolMisExporter';
import { getBasicSubjectSortWeight } from '../utils/subjectSortUtils';
import {
  BookOpen,
  BarChart3,
  Save,
  RotateCcw,
  Award,
  CheckCircle2,
  Plus,
  Trash2,
  Pencil,
  X,
  FileSpreadsheet,
  Download,
  Upload,
  HardDriveDownload,
  SlidersHorizontal,
  Lock,
  Unlock
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
  onUpdateSubject?: (updatedSub: SubjectConfig) => void;
  onDeleteSubject?: (id: string) => void;
  canEdit?: boolean;
  isTerm1Locked?: boolean;
  onToggleTerm1Lock?: () => void;
  canToggleLock?: boolean;
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
  onUpdateSubject,
  onDeleteSubject,
  canEdit = true,
  isTerm1Locked = false,
  onToggleTerm1Lock,
  canToggleLock = false
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

  // Edit Subject State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editSubCode, setEditSubCode] = useState('');
  const [editSubName, setEditSubName] = useState('');
  const [editSubType, setEditSubType] = useState<'พื้นฐาน' | 'เพิ่มเติม' | 'กิจกรรม'>('พื้นฐาน');
  const [editSubCredits, setEditSubCredits] = useState(1.0);
  const [editSubHours, setEditSubHours] = useState(40);

  const handleOpenEditModal = () => {
    if (!selectedSubject) return;
    setEditSubCode(selectedSubject.code);
    setEditSubName(selectedSubject.name);
    setEditSubType(selectedSubject.type);
    setEditSubCredits(selectedSubject.credits);
    setEditSubHours(selectedSubject.hoursPerYear);
    setIsEditModalOpen(true);
  };

  const handleSaveEditSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject || !editSubName.trim() || !editSubCode.trim()) return;
    const updated: SubjectConfig = {
      ...selectedSubject,
      code: editSubCode.trim(),
      name: editSubName.trim(),
      type: editSubType,
      credits: Number(editSubCredits) || 1.0,
      hoursPerYear: Number(editSubHours) || 40
    };
    if (onUpdateSubject) onUpdateSubject(updated);
    setIsEditModalOpen(false);
  };

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

  // View Mode: 'schoolmis' (10 ครั้งตามแบบสพฐ.) หรือ 'semester' (แบบ 2 เทอม)
  const [viewMode, setViewMode] = useState<'schoolmis' | 'semester'>('schoolmis');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // คะแนนเต็มแต่ละครั้งตามมาตรฐาน School MIS (ตรงกับสกรีนช็อต 100%)
  const fullScores = {
    c1: 10,
    c2: 10,
    c3: 10,
    c4: 5,
    cSumPre: 35,
    c5: 15,
    c6: 10,
    c7: 10,
    c8: 15,
    c9: 0,
    cSumPost: 35,
    cSumFormative: 85,
    c10: 15,
    total: 100,
    gpa: 4
  };

  const handleSchoolMisScoreChange = (
    studentId: string,
    field: 'c1' | 'c2' | 'c3' | 'c4' | 'c5' | 'cRetakeMidterm' | 'c6' | 'c7' | 'c8' | 'c9' | 'c10',
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

    // 1. รวมก่อนกลางภาค (c1..c4)
    const hasPre = (updated.c1 !== null && updated.c1 !== undefined) ||
                   (updated.c2 !== null && updated.c2 !== undefined) ||
                   (updated.c3 !== null && updated.c3 !== undefined) ||
                   (updated.c4 !== null && updated.c4 !== undefined);
    const sumPre = (updated.c1 ?? 0) + (updated.c2 ?? 0) + (updated.c3 ?? 0) + (updated.c4 ?? 0);
    updated.cSumPre = hasPre ? sumPre : (existing.cSumPre ?? existing.formative1 ?? null);

    // 2. รวมหลังกลางภาค (c6..c9)
    const hasPost = (updated.c6 !== null && updated.c6 !== undefined) ||
                    (updated.c7 !== null && updated.c7 !== undefined) ||
                    (updated.c8 !== null && updated.c8 !== undefined) ||
                    (updated.c9 !== null && updated.c9 !== undefined);
    const sumPost = (updated.c6 ?? 0) + (updated.c7 ?? 0) + (updated.c8 ?? 0) + (updated.c9 ?? 0);
    updated.cSumPost = hasPost ? sumPost : (existing.cSumPost ?? existing.formative2 ?? null);

    // 3. รวมระหว่างภาค (ก่อนกลาง + กลาง c5 + หลังกลาง)
    const effectivePre = updated.cSumPre ?? 0;
    const effectiveMidterm = updated.c5 ?? updated.midterm1 ?? 0;
    const effectivePost = updated.cSumPost ?? 0;
    const hasTerm1 = hasPre || (updated.c5 !== null && updated.c5 !== undefined);
    const hasFormative = hasTerm1 || hasPost || (existing.formative1 !== null && existing.formative1 !== undefined);
    updated.cSumFormative = hasFormative ? (effectivePre + effectiveMidterm + effectivePost) : null;

    // 4. ตัดสินผลการเรียนปลายปีตามระเบียบ สพฐ. (หลักสูตรรายปี เต็ม 100)
    // การคำนวณคะแนนรวมตลอดปี (yearlyTotal) และตัดเกรด (0 - 4) จะคำนวณก็ต่อเมื่อ:
    // มีคะแนนสอบปลายภาค (c10 หรือ final2) แล้วเท่านั้น
    // หากยังอยู่ระหว่างภาคเรียนที่ 1 หรือยังไม่ได้สอบปลายภาค ให้แสดงเกรดเป็น '-' (อยู่ระหว่างเรียน)
    // เพื่อป้องกันไม่ให้นำคะแนนเฉพาะเทอม 1 (เช่น 45/50) ไปตัดเกรดเป็น 0 ก่อนเวลาอันควร
    const hasFinal = (updated.c10 !== null && updated.c10 !== undefined) || (updated.final2 !== null && updated.final2 !== undefined);
    const effectiveFinal = updated.c10 ?? updated.final2 ?? 0;

    if (hasFinal && hasFormative) {
      const totalAll = (updated.cSumFormative ?? 0) + effectiveFinal;
      updated.yearlyTotal = Math.round(totalAll * 100) / 100;
      updated.grade = GradingEngine.calculateGrade(updated.yearlyTotal);
      updated.isPassed = updated.yearlyTotal >= 50;
    } else {
      updated.yearlyTotal = null;
      updated.grade = '-';
      updated.isPassed = false;
    }

    // 5. ซิงค์กับระบบ 2 เทอมเพื่อความเข้ากันได้ 100% กับ ปพ.5 และ ปพ.6
    updated.formative1 = updated.cSumPre;
    updated.midterm1 = updated.c5;
    updated.total1 = (updated.cSumPre !== null || updated.c5 !== null) ? (effectivePre + effectiveMidterm) : null;
    updated.formative2 = updated.cSumPost;
    updated.final2 = updated.c10;
    updated.total2 = (updated.cSumPost !== null || updated.c10 !== null) ? (effectivePost + effectiveFinal) : null;

    onUpdateScore(selectedSubjectId, studentId, updated);
  };

  const handleImportSchoolMIS = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedSubject) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      const res = importSchoolMIS_SingleSubjectCSV(content, currentSubjectScores);
      if (res.success && res.updatedScores) {
        Object.entries(res.updatedScores).forEach(([sId, record]) => {
          onUpdateScore(selectedSubjectId, sId, record);
        });
        setImportStatus(`✅ ${res.message} เรียบร้อยแล้ว`);
        setTimeout(() => setImportStatus(null), 4000);
      } else {
        alert(res.message);
      }
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
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
                  {subjects.filter(s => s.type === 'พื้นฐาน' || !s.type).length > 0 && (
                    <optgroup label="── รายวิชาพื้นฐาน ──">
                      {[...subjects.filter(s => s.type === 'พื้นฐาน' || !s.type)]
                        .sort((a, b) => getBasicSubjectSortWeight(a.code, a.name) - getBasicSubjectSortWeight(b.code, b.name))
                        .map(s => (
                          <option key={s.id} value={s.id}>
                            {s.code} {s.name} ({s.credits} นก. / {s.hoursPerYear} ชม.)
                          </option>
                        ))}
                    </optgroup>
                  )}
                  {subjects.filter(s => s.type === 'เพิ่มเติม').length > 0 && (
                    <optgroup label="── รายวิชาเพิ่มเติม ──">
                      {subjects.filter(s => s.type === 'เพิ่มเติม').map(s => (
                        <option key={s.id} value={s.id}>
                          {s.code} {s.name} ({s.credits} นก. / {s.hoursPerYear} ชม.)
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {subjects.filter(s => s.type === 'กิจกรรม').length > 0 && (
                    <optgroup label="── กิจกรรมพัฒนาผู้เรียน ──">
                      {subjects.filter(s => s.type === 'กิจกรรม').map(s => (
                        <option key={s.id} value={s.id}>
                          {s.code} {s.name} ({s.credits} นก.)
                        </option>
                      ))}
                    </optgroup>
                  )}
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
                {onUpdateSubject && selectedSubject && (
                  <button
                    onClick={handleOpenEditModal}
                    className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                    title="แก้ไขข้อมูลรายวิชานี้ (รหัส, ชื่อ, หน่วยกิต)"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
                {onDeleteSubject && subjects.length > 1 && (
                  <button
                    onClick={() => {
                      if (confirm(`คุณต้องการลบรายวิชา "${selectedSubject?.name}" (${selectedSubject?.code}) ออกจากระบบใช่หรือไม่?\n\n⚠️ คำเตือน: ข้อมูลคะแนนทั้งหมดที่เคยบันทึกในรายวิชานี้จะถูกลบออกจากระบบอย่างถาวร`)) {
                        const remaining = subjects.filter(s => s.id !== selectedSubjectId);
                        onDeleteSubject(selectedSubjectId);
                        setSelectedSubjectId(remaining[0]?.id || '');
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
        {/* Header Bar: School MIS Badge & Controls */}
        <div className="bg-[#f8f9fa] px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-bold text-slate-800 text-sm">บันทึกคะแนนรายวิชา</span>
            {selectedSubject && (
              <span className="px-3 py-1 bg-[#689f38] text-white text-xs font-bold rounded shadow-xs">
                {selectedSubject.code.replace(/\s+/g, '')} {selectedSubject.name} ชั้น {config.classLevel} ห้อง {config.room} จำนวน {students.length} คน ลงทะเบียนแล้ว {students.length} คน ({config.academicYear}/{config.semester})
              </span>
            )}
            {importStatus && (
              <span className="text-emerald-700 bg-emerald-100/90 border border-emerald-300 px-2.5 py-0.5 rounded-full font-semibold animate-pulse">
                {importStatus}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Switcher */}
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs font-medium">
              <button
                type="button"
                onClick={() => setViewMode('schoolmis')}
                className={`px-2.5 py-1 rounded-md font-bold transition ${
                  viewMode === 'schoolmis'
                    ? 'bg-white text-emerald-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📋 แบบ School MIS (10 ครั้ง)
              </button>
              <button
                type="button"
                onClick={() => setViewMode('semester')}
                className={`px-2.5 py-1 rounded-md font-bold transition ${
                  viewMode === 'semester'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📑 แบบ 2 ภาคเรียน (เทอม 1/2)
              </button>
            </div>

            {/* ปุ่มนำเข้าไฟล์ CSV จาก School MIS */}
            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition" title="นำเข้าคะแนนจากไฟล์ CSV ที่ดาวน์โหลดจากระบบ School MIS">
              <Upload className="w-3.5 h-3.5 text-blue-200" />
              <span>นำเข้า SchoolMIS (.csv)</span>
              <input
                type="file"
                accept=".csv"
                disabled={!canEdit}
                onChange={handleImportSchoolMIS}
                className="hidden"
              />
            </label>

            {/* ปุ่มส่งออกไฟล์ CSV นำเข้า School MIS */}
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#689f38] hover:bg-[#558b2f] text-white text-xs font-bold rounded-lg shadow-xs transition"
              title="ดาวน์โหลดไฟล์ CSV เพื่อนำเข้าคะแนนรายวิชานี้สู่ระบบ SchoolMIS ของ สพฐ."
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-100" />
              <span>ส่งออก SchoolMIS (.csv)</span>
            </button>

            {/* ปุ่มล็อค / ปปลดล็อคคะแนนภาคเรียนที่ 1 */}
            {canToggleLock ? (
              <button
                type="button"
                onClick={onToggleTerm1Lock}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs ${
                  isTerm1Locked
                    ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                }`}
                title={isTerm1Locked ? 'คลิกเพื่อปลดล็อคให้ครูแก้ไขคะแนนเทอม 1 ได้' : 'คลิกเพื่อล็อคคะแนนเทอม 1 หลังประกาศผลทางการ'}
              >
                {isTerm1Locked ? (
                  <>
                    <Lock className="w-3.5 h-3.5 text-amber-700" />
                    <span>เทอม 1: ล็อคแล้ว</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-3.5 h-3.5 text-slate-500" />
                    <span>เทอม 1: ปลดล็อค</span>
                  </>
                )}
              </button>
            ) : isTerm1Locked ? (
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300" title="คะแนนภาคเรียนที่ 1 ถูกล็อคหลังประกาศผลทางการแล้ว">
                <Lock className="w-3.5 h-3.5 text-amber-700" />
                <span>เทอม 1: ล็อคแล้ว</span>
              </div>
            ) : null}

            {/* Semester Indicator Badge */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold">
              <span>ภาคเรียนที่ {semester}</span>
              {semester === 1 ? (
                <span className="text-[11px] font-medium text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                  🔒 คะแนนหลังกลางภาค/ปลายภาคจะเปิดให้กรอกในเทอม 2
                </span>
              ) : (
                <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  เปิดกรอกครบทุกช่อง
                </span>
              )}
            </div>

            {/* Auto-saved badge */}
            <div className="flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Auto-saved</span>
            </div>
          </div>
        </div>

        {viewMode === 'schoolmis' ? (
          /* School MIS 10-Assessments Grid (ตรงตามสกรีนช็อต 100%) */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#f8f9fa] text-slate-700 font-semibold border-b border-slate-300">
                {/* Header Row 1: Section Groups */}
                <tr>
                  <th rowSpan={2} className="px-2 py-2 text-center w-10 border border-slate-300 font-bold bg-[#f8f9fa]">No.</th>
                  <th rowSpan={2} className="px-2 py-2 text-center w-14 border border-slate-300 font-bold bg-[#f8f9fa]">รหัส</th>
                  <th rowSpan={2} className="px-3 py-2 text-left min-w-[90px] border border-slate-300 font-bold bg-[#f8f9fa]">ชื่อ</th>
                  <th rowSpan={2} className="px-3 py-2 text-left min-w-[90px] border border-slate-300 font-bold bg-[#f8f9fa]">นามสกุล</th>
                  <th colSpan={5} className="px-2 py-1.5 text-center font-bold border border-slate-300 bg-[#f8f9fa]">
                    คะแนนก่อนกลางภาค(ปี) {isTerm1Locked && <span className="text-[10px] text-amber-700 bg-amber-100 px-1 py-0.5 rounded ml-1 font-bold">🔒 ล็อค</span>}
                  </th>
                  <th colSpan={1} className="px-2 py-1.5 text-center font-bold border border-slate-300 bg-[#f8f9fa]">
                    คะแนนกลางภาค(ปี) {isTerm1Locked && <span className="text-[10px] text-amber-700 bg-amber-100 px-1 py-0.5 rounded ml-1 font-bold">🔒</span>}
                  </th>
                  <th colSpan={1} className="px-2 py-1.5 text-center font-bold border border-slate-300 bg-[#f8f9fa]">
                    แก้ตัวกลางภาค(ปี) {isTerm1Locked && <span className="text-[10px] text-amber-700 bg-amber-100 px-1 py-0.5 rounded ml-1 font-bold">🔒</span>}
                  </th>
                  <th colSpan={5} className="px-2 py-1.5 text-center font-bold border border-slate-300 bg-[#f8f9fa]">
                    คะแนนหลังกลางภาค(ปี) {semester === 1 && <span className="text-[10px] text-slate-500 bg-slate-200 border border-slate-300 px-1 py-0.5 rounded ml-1 font-semibold">🔒 เปิดเทอม 2</span>}
                  </th>
                  <th colSpan={1} className="px-2 py-1.5 text-center font-bold border border-slate-300 bg-[#f8f9fa]">
                    รวมระหว่างภาค(ปี)
                  </th>
                  <th colSpan={1} className="px-2 py-1.5 text-center font-bold border border-slate-300 bg-[#f8f9fa]">
                    คะแนนปลายภาค(ปี) {semester === 1 && <span className="text-[10px] text-slate-500 bg-slate-200 border border-slate-300 px-1 py-0.5 rounded ml-1 font-semibold">🔒 เปิดเทอม 2</span>}
                  </th>
                  <th colSpan={1} className="px-2 py-1.5 text-center font-bold border border-slate-300 bg-[#f8f9fa]">
                    รวมคะแนนทั้งหมด
                  </th>
                  <th rowSpan={2} className="px-2 py-2 text-center w-12 font-bold border border-slate-300 bg-[#f8f9fa]">
                    GPA
                  </th>
                </tr>

                {/* Header Row 2: Assessment Names */}
                <tr>
                  <th className="px-1 py-1 text-center w-11 border border-slate-300 font-normal">ครั้งที่ 1</th>
                  <th className="px-1 py-1 text-center w-11 border border-slate-300 font-normal">ครั้งที่ 2</th>
                  <th className="px-1 py-1 text-center w-11 border border-slate-300 font-normal">ครั้งที่ 3</th>
                  <th className="px-1 py-1 text-center w-11 border border-slate-300 font-normal">ครั้งที่ 4</th>
                  <th className="px-1 py-1 text-center w-11 border border-slate-300 font-normal">รวม</th>
                  
                  <th className="px-1 py-1 text-center w-12 border border-slate-300 font-normal">ครั้งที่ 5</th>
                  <th className="px-1 py-1 text-center w-12 border border-slate-300 font-normal"></th>

                  <th className="px-1 py-1 text-center w-11 border border-slate-300 font-normal">ครั้งที่ 6</th>
                  <th className="px-1 py-1 text-center w-11 border border-slate-300 font-normal">ครั้งที่ 7</th>
                  <th className="px-1 py-1 text-center w-11 border border-slate-300 font-normal">ครั้งที่ 8</th>
                  <th className="px-1 py-1 text-center w-11 border border-slate-300 font-normal">ครั้งที่ 9</th>
                  <th className="px-1 py-1 text-center w-11 border border-slate-300 font-normal">รวม</th>

                  <th className="px-1 py-1 text-center w-12 border border-slate-300 font-normal"></th>
                  <th className="px-1 py-1 text-center w-12 border border-slate-300 font-normal">ครั้งที่ 10</th>
                  <th className="px-1 py-1 text-center w-12 border border-slate-300 font-normal"></th>
                </tr>

                {/* Header Row 3: Weight / Full Scores Row (ตรงตามสกรีนช็อต 100%) */}
                <tr className="bg-[#f2f4f7] text-slate-800 text-center">
                  <td className="border border-slate-300"></td>
                  <td className="border border-slate-300"></td>
                  <td className="border border-slate-300"></td>
                  <td className="border border-slate-300"></td>
                  
                  <td className="p-1 border border-slate-300">
                    <div className="w-full text-center bg-white border border-slate-300 rounded py-0.5 text-xs font-mono text-slate-700">
                      {fullScores.c1}
                    </div>
                  </td>
                  <td className="p-1 border border-slate-300">
                    <div className="w-full text-center bg-white border border-slate-300 rounded py-0.5 text-xs font-mono text-slate-700">
                      {fullScores.c2}
                    </div>
                  </td>
                  <td className="p-1 border border-slate-300">
                    <div className="w-full text-center bg-white border border-slate-300 rounded py-0.5 text-xs font-mono text-slate-700">
                      {fullScores.c3}
                    </div>
                  </td>
                  <td className="p-1 border border-slate-300">
                    <div className="w-full text-center bg-white border border-slate-300 rounded py-0.5 text-xs font-mono text-slate-700">
                      {fullScores.c4}
                    </div>
                  </td>
                  <td className="p-1 border border-slate-300">
                    <div className="w-full text-center bg-white border border-slate-300 rounded py-0.5 text-xs font-mono text-slate-700">
                      {fullScores.cSumPre}
                    </div>
                  </td>

                  <td className="p-1 border border-slate-300">
                    <div className="w-full text-center bg-white border border-slate-300 rounded py-0.5 text-xs font-mono text-slate-700">
                      {fullScores.c5}
                    </div>
                  </td>
                  <td className="p-1 border border-slate-300">
                    <div className="w-full py-0.5 bg-white border border-slate-300 rounded text-center text-slate-400 min-h-[22px]"></div>
                  </td>

                  <td className="p-1 border border-slate-300">
                    <div className="w-full text-center bg-white border border-slate-300 rounded py-0.5 text-xs font-mono text-slate-700">
                      {fullScores.c6}
                    </div>
                  </td>
                  <td className="p-1 border border-slate-300">
                    <div className="w-full text-center bg-white border border-slate-300 rounded py-0.5 text-xs font-mono text-slate-700">
                      {fullScores.c7}
                    </div>
                  </td>
                  <td className="p-1 border border-slate-300">
                    <div className="w-full text-center bg-white border border-slate-300 rounded py-0.5 text-xs font-mono text-slate-700">
                      {fullScores.c8}
                    </div>
                  </td>
                  <td className="p-1 border border-slate-300">
                    <div className="w-full text-center bg-white border border-slate-300 rounded py-0.5 text-xs font-mono text-slate-700">
                      {fullScores.c9}
                    </div>
                  </td>
                  <td className="p-1 border border-slate-300">
                    <div className="w-full text-center bg-white border border-slate-300 rounded py-0.5 text-xs font-mono text-slate-700">
                      {fullScores.cSumPost}
                    </div>
                  </td>

                  <td className="p-1 border border-slate-300">
                    <div className="w-full text-center bg-white border border-slate-300 rounded py-0.5 text-xs font-mono text-slate-700">
                      {fullScores.cSumFormative}
                    </div>
                  </td>
                  <td className="p-1 border border-slate-300">
                    <div className="w-full text-center bg-white border border-slate-300 rounded py-0.5 text-xs font-mono text-slate-700">
                      {fullScores.c10}
                    </div>
                  </td>
                  <td className="p-1 border border-slate-300">
                    <div className="w-full text-center bg-white border border-slate-300 rounded py-0.5 text-xs font-mono text-slate-700">
                      {fullScores.total}
                    </div>
                  </td>
                  <td className="p-1 border border-slate-300">
                    <div className="w-full py-0.5 text-center text-slate-800 font-bold">{fullScores.gpa}</div>
                  </td>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 font-sans text-xs bg-white">
                {sortStudentsForSchoolMIS(students).map((s, idx) => {
                  const rec = currentSubjectScores[s.studentId] || {
                    studentId: s.studentId,
                    formative1: null, midterm1: null, final1: null, total1: null,
                    formative2: null, midterm2: null, final2: null, total2: null,
                    yearlyTotal: null, grade: '-', isPassed: false
                  };
                  const cleanFirstName = extractCleanFirstName(s.prefix, s.firstName);

                  // Sum pre (c1..c4)
                  const hasExplicitPre = (rec.c1 !== null && rec.c1 !== undefined) ||
                                         (rec.c2 !== null && rec.c2 !== undefined) ||
                                         (rec.c3 !== null && rec.c3 !== undefined) ||
                                         (rec.c4 !== null && rec.c4 !== undefined);
                  const sumPre = rec.cSumPre !== undefined && rec.cSumPre !== null
                    ? rec.cSumPre
                    : (hasExplicitPre
                        ? ((rec.c1 ?? 0) + (rec.c2 ?? 0) + (rec.c3 ?? 0) + (rec.c4 ?? 0))
                        : (rec.formative1 ?? 0));

                  // Midterm c5
                  const c5 = rec.c5 ?? rec.midterm1 ?? 0;

                  // Sum post (c6..c9)
                  const hasExplicitPost = (rec.c6 !== null && rec.c6 !== undefined) ||
                                          (rec.c7 !== null && rec.c7 !== undefined) ||
                                          (rec.c8 !== null && rec.c8 !== undefined) ||
                                          (rec.c9 !== null && rec.c9 !== undefined);
                  const sumPost = rec.cSumPost !== undefined && rec.cSumPost !== null
                    ? rec.cSumPost
                    : (hasExplicitPost
                        ? ((rec.c6 ?? 0) + (rec.c7 ?? 0) + (rec.c8 ?? 0) + (rec.c9 ?? 0))
                        : (rec.formative2 ?? 0));

                  // Sum formative (pre + c5 + post)
                  const sumFormative = rec.cSumFormative !== undefined && rec.cSumFormative !== null
                    ? rec.cSumFormative
                    : (sumPre + c5 + sumPost);

                  // Final c10
                  const c10 = rec.c10 ?? rec.final2 ?? 0;

                  // Total All
                  const totalAll = rec.yearlyTotal !== null && rec.yearlyTotal !== undefined
                    ? rec.yearlyTotal
                    : (sumFormative + c10);

                  // GPA
                  const gpa = rec.grade && rec.grade !== '-' ? rec.grade : (totalAll > 0 ? GradingEngine.calculateGrade(totalAll) : '');

                  return (
                    <tr key={s.id} className="hover:bg-slate-50 transition border-b border-slate-200">
                      <td className="px-2 py-1 text-center text-slate-700 border border-slate-300 font-sans">{idx + 1}.</td>
                      <td className="px-2 py-1 text-center font-mono text-slate-600 border border-slate-300">{s.studentId}</td>
                      <td className="px-3 py-1 font-medium text-slate-900 border border-slate-300">{cleanFirstName}</td>
                      <td className="px-3 py-1 font-medium text-slate-900 border border-slate-300">{s.lastName}</td>

                      {/* c1 */}
                      <td className="p-1 border border-slate-300">
                        <input
                          type="number"
                          min={0}
                          max={10}
                          disabled={!canEdit || isTerm1Locked}
                          value={rec.c1 ?? ''}
                          placeholder="0"
                          title={isTerm1Locked ? "ภาคเรียนที่ 1 ล็อคแล้ว" : ""}
                          onChange={(e) => handleSchoolMisScoreChange(s.studentId, 'c1', e.target.value)}
                          className={`w-full text-center py-1 border rounded font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                            isTerm1Locked
                              ? 'bg-amber-50/50 border-amber-200 text-slate-500 cursor-not-allowed'
                              : 'bg-white border-slate-300 text-slate-800'
                          }`}
                        />
                      </td>
                      {/* c2 */}
                      <td className="p-1 border border-slate-300">
                        <input
                          type="number"
                          min={0}
                          max={10}
                          disabled={!canEdit || isTerm1Locked}
                          value={rec.c2 ?? ''}
                          placeholder="0"
                          title={isTerm1Locked ? "ภาคเรียนที่ 1 ล็อคแล้ว" : ""}
                          onChange={(e) => handleSchoolMisScoreChange(s.studentId, 'c2', e.target.value)}
                          className={`w-full text-center py-1 border rounded font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                            isTerm1Locked
                              ? 'bg-amber-50/50 border-amber-200 text-slate-500 cursor-not-allowed'
                              : 'bg-white border-slate-300 text-slate-800'
                          }`}
                        />
                      </td>
                      {/* c3 */}
                      <td className="p-1 border border-slate-300">
                        <input
                          type="number"
                          min={0}
                          max={10}
                          disabled={!canEdit || isTerm1Locked}
                          value={rec.c3 ?? ''}
                          placeholder="0"
                          title={isTerm1Locked ? "ภาคเรียนที่ 1 ล็อคแล้ว" : ""}
                          onChange={(e) => handleSchoolMisScoreChange(s.studentId, 'c3', e.target.value)}
                          className={`w-full text-center py-1 border rounded font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                            isTerm1Locked
                              ? 'bg-amber-50/50 border-amber-200 text-slate-500 cursor-not-allowed'
                              : 'bg-white border-slate-300 text-slate-800'
                          }`}
                        />
                      </td>
                      {/* c4 */}
                      <td className="p-1 border border-slate-300">
                        <input
                          type="number"
                          min={0}
                          max={5}
                          disabled={!canEdit || isTerm1Locked}
                          value={rec.c4 ?? ''}
                          placeholder="0"
                          title={isTerm1Locked ? "ภาคเรียนที่ 1 ล็อคแล้ว" : ""}
                          onChange={(e) => handleSchoolMisScoreChange(s.studentId, 'c4', e.target.value)}
                          className={`w-full text-center py-1 border rounded font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                            isTerm1Locked
                              ? 'bg-amber-50/50 border-amber-200 text-slate-500 cursor-not-allowed'
                              : 'bg-white border-slate-300 text-slate-800'
                          }`}
                        />
                      </td>
                      {/* รวมก่อนกลาง */}
                      <td className="p-1 border border-slate-300 text-center">
                        <div className={`py-1 px-1 rounded border border-slate-300 bg-white font-mono ${sumPre === 0 ? 'text-red-600' : 'text-slate-800 font-bold'}`}>
                          {sumPre}
                        </div>
                      </td>

                      {/* c5 กลางภาค */}
                      <td className="p-1 border border-slate-300">
                        <input
                          type="number"
                          min={0}
                          max={15}
                          disabled={!canEdit || isTerm1Locked}
                          value={rec.c5 ?? rec.midterm1 ?? ''}
                          placeholder="0"
                          title={isTerm1Locked ? "ภาคเรียนที่ 1 ล็อคแล้ว" : ""}
                          onChange={(e) => handleSchoolMisScoreChange(s.studentId, 'c5', e.target.value)}
                          className={`w-full text-center py-1 border rounded font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                            isTerm1Locked
                              ? 'bg-amber-50/50 border-amber-200 text-slate-500 cursor-not-allowed'
                              : 'bg-white border-slate-300 text-slate-800'
                          }`}
                        />
                      </td>
                      {/* แก้ตัวกลางภาค */}
                      <td className="p-1 border border-slate-300">
                        <input
                          type="number"
                          min={0}
                          max={15}
                          disabled={!canEdit || isTerm1Locked}
                          value={rec.cRetakeMidterm ?? ''}
                          placeholder="0"
                          title={isTerm1Locked ? "ภาคเรียนที่ 1 ล็อคแล้ว" : ""}
                          onChange={(e) => handleSchoolMisScoreChange(s.studentId, 'cRetakeMidterm', e.target.value)}
                          className={`w-full text-center py-1 border rounded font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                            isTerm1Locked
                              ? 'bg-amber-50/50 border-amber-200 text-slate-500 cursor-not-allowed'
                              : 'bg-white border-slate-300 text-slate-800'
                          }`}
                        />
                      </td>

                      {/* c6 */}
                      <td className="p-1 border border-slate-300">
                        <input
                          type="number"
                          min={0}
                          max={10}
                          disabled={!canEdit || semester === 1}
                          value={rec.c6 ?? ''}
                          placeholder={semester === 1 ? "-" : "0"}
                          title={semester === 1 ? "คะแนนหลังกลางภาคจะเปิดให้กรอกในภาคเรียนที่ 2" : ""}
                          onChange={(e) => handleSchoolMisScoreChange(s.studentId, 'c6', e.target.value)}
                          className={`w-full text-center py-1 border rounded font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                            semester === 1
                              ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                              : 'bg-white border-slate-300 text-slate-800'
                          }`}
                        />
                      </td>
                      {/* c7 */}
                      <td className="p-1 border border-slate-300">
                        <input
                          type="number"
                          min={0}
                          max={10}
                          disabled={!canEdit || semester === 1}
                          value={rec.c7 ?? ''}
                          placeholder={semester === 1 ? "-" : "0"}
                          title={semester === 1 ? "คะแนนหลังกลางภาคจะเปิดให้กรอกในภาคเรียนที่ 2" : ""}
                          onChange={(e) => handleSchoolMisScoreChange(s.studentId, 'c7', e.target.value)}
                          className={`w-full text-center py-1 border rounded font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                            semester === 1
                              ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                              : 'bg-white border-slate-300 text-slate-800'
                          }`}
                        />
                      </td>
                      {/* c8 */}
                      <td className="p-1 border border-slate-300">
                        <input
                          type="number"
                          min={0}
                          max={15}
                          disabled={!canEdit || semester === 1}
                          value={rec.c8 ?? ''}
                          placeholder={semester === 1 ? "-" : "0"}
                          title={semester === 1 ? "คะแนนหลังกลางภาคจะเปิดให้กรอกในภาคเรียนที่ 2" : ""}
                          onChange={(e) => handleSchoolMisScoreChange(s.studentId, 'c8', e.target.value)}
                          className={`w-full text-center py-1 border rounded font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                            semester === 1
                              ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                              : 'bg-white border-slate-300 text-slate-800'
                          }`}
                        />
                      </td>
                      {/* c9 */}
                      <td className="p-1 border border-slate-300">
                        <div className={`w-full py-1 border rounded text-center min-h-[26px] ${
                          semester === 1 ? 'bg-slate-100 border-slate-200 text-slate-400' : 'bg-white border-slate-300 text-slate-400'
                        }`}>-</div>
                      </td>
                      {/* รวมหลังกลาง */}
                      <td className="p-1 border border-slate-300 text-center">
                        <div className={`py-1 px-1 rounded border border-slate-300 bg-white font-mono ${sumPost === 0 ? 'text-red-600' : 'text-slate-800 font-bold'}`}>
                          {sumPost}
                        </div>
                      </td>

                      {/* รวมระหว่างภาค */}
                      <td className="p-1 border border-slate-300 text-center">
                        <div className={`py-1 px-1 rounded border border-slate-300 bg-white font-mono ${sumFormative === 0 ? 'text-red-600' : 'text-slate-800 font-bold'}`}>
                          {sumFormative}
                        </div>
                      </td>

                      {/* c10 ปลายภาค */}
                      <td className="p-1 border border-slate-300">
                        <input
                          type="number"
                          min={0}
                          max={15}
                          disabled={!canEdit || semester === 1}
                          value={rec.c10 ?? rec.final2 ?? ''}
                          placeholder={semester === 1 ? "-" : "0"}
                          title={semester === 1 ? "คะแนนปลายภาคจะเปิดให้กรอกในภาคเรียนที่ 2" : ""}
                          onChange={(e) => handleSchoolMisScoreChange(s.studentId, 'c10', e.target.value)}
                          className={`w-full text-center py-1 border rounded font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                            semester === 1
                              ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                              : 'bg-white border-slate-300 text-slate-800'
                          }`}
                        />
                      </td>

                      {/* รวมคะแนนทั้งหมด */}
                      <td className="p-1 border border-slate-300 text-center">
                        <div className={`py-1 px-1 rounded border border-slate-300 bg-white font-mono ${totalAll === 0 ? 'text-red-600' : 'text-slate-800 font-bold'}`}>
                          {totalAll}
                        </div>
                      </td>

                      {/* GPA */}
                      <td className="p-1 border border-slate-300 text-center">
                        <div className="w-full py-1 bg-white border border-slate-300 rounded text-center text-slate-800 font-mono font-bold">
                          {gpa || ''}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Semester View Table */
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
                          disabled={!canEdit || isTerm1Locked}
                          readOnly={!canEdit || isTerm1Locked}
                          value={rec.formative1 ?? ''}
                          title={isTerm1Locked ? "ภาคเรียนที่ 1 ล็อคแล้ว" : ""}
                          onChange={(e) => handleScoreChange(s.studentId, 'formative1', e.target.value)}
                          className={`w-full text-center py-1 bg-transparent rounded font-semibold text-slate-800 ${
                            canEdit && !isTerm1Locked
                              ? 'hover:bg-blue-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-text'
                              : 'cursor-not-allowed opacity-75 bg-amber-50/40'
                          }`}
                        />
                      </td>
                      <td className="p-1 border-r border-slate-200">
                        <input
                          type="number"
                          min={0}
                          max={10}
                          placeholder="-"
                          disabled={!canEdit || isTerm1Locked}
                          readOnly={!canEdit || isTerm1Locked}
                          value={rec.midterm1 ?? ''}
                          title={isTerm1Locked ? "ภาคเรียนที่ 1 ล็อคแล้ว" : ""}
                          onChange={(e) => handleScoreChange(s.studentId, 'midterm1', e.target.value)}
                          className={`w-full text-center py-1 bg-transparent rounded font-semibold text-slate-800 ${
                            canEdit && !isTerm1Locked
                              ? 'hover:bg-blue-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-text'
                              : 'cursor-not-allowed opacity-75 bg-amber-50/40'
                          }`}
                        />
                      </td>
                      <td className="p-1 border-r border-slate-200">
                        <input
                          type="number"
                          min={0}
                          max={10}
                          placeholder="-"
                          disabled={!canEdit || isTerm1Locked}
                          readOnly={!canEdit || isTerm1Locked}
                          value={rec.final1 ?? ''}
                          title={isTerm1Locked ? "ภาคเรียนที่ 1 ล็อคแล้ว" : ""}
                          onChange={(e) => handleScoreChange(s.studentId, 'final1', e.target.value)}
                          className={`w-full text-center py-1 bg-transparent rounded font-semibold text-slate-800 ${
                            canEdit && !isTerm1Locked
                              ? 'hover:bg-blue-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-text'
                              : 'cursor-not-allowed opacity-75 bg-amber-50/40'
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
                          disabled={!canEdit || semester === 1}
                          readOnly={!canEdit || semester === 1}
                          value={rec.formative2 ?? ''}
                          title={semester === 1 ? "เปิดให้กรอกในภาคเรียนที่ 2" : ""}
                          onChange={(e) => handleScoreChange(s.studentId, 'formative2', e.target.value)}
                          className={`w-full text-center py-1 bg-transparent rounded font-semibold text-slate-800 ${
                            canEdit && semester === 2
                              ? 'hover:bg-indigo-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-text'
                              : 'cursor-not-allowed opacity-75 bg-slate-100'
                          }`}
                        />
                      </td>
                      <td className="p-1 border-r border-slate-200">
                        <input
                          type="number"
                          min={0}
                          max={10}
                          placeholder="-"
                          disabled={!canEdit || semester === 1}
                          readOnly={!canEdit || semester === 1}
                          value={rec.midterm2 ?? ''}
                          title={semester === 1 ? "เปิดให้กรอกในภาคเรียนที่ 2" : ""}
                          onChange={(e) => handleScoreChange(s.studentId, 'midterm2', e.target.value)}
                          className={`w-full text-center py-1 bg-transparent rounded font-semibold text-slate-800 ${
                            canEdit && semester === 2
                              ? 'hover:bg-indigo-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-text'
                              : 'cursor-not-allowed opacity-75 bg-slate-100'
                          }`}
                        />
                      </td>
                      <td className="p-1 border-r border-slate-200">
                        <input
                          type="number"
                          min={0}
                          max={10}
                          placeholder="-"
                          disabled={!canEdit || semester === 1}
                          readOnly={!canEdit || semester === 1}
                          value={rec.final2 ?? ''}
                          title={semester === 1 ? "เปิดให้กรอกในภาคเรียนที่ 2" : ""}
                          onChange={(e) => handleScoreChange(s.studentId, 'final2', e.target.value)}
                          className={`w-full text-center py-1 bg-transparent rounded font-semibold text-slate-800 ${
                            canEdit && semester === 2
                              ? 'hover:bg-indigo-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-text'
                              : 'cursor-not-allowed opacity-75 bg-slate-100'
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
        )}
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

      {/* Modal แก้ไขรายวิชา */}
      {isEditModalOpen && selectedSubject && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Pencil className="w-5 h-5 text-amber-600" />
                <span>แก้ไขข้อมูลรายวิชา</span>
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditSubject} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">รหัสวิชา</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ส 11231"
                  value={editSubCode}
                  onChange={(e) => setEditSubCode(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อรายวิชา</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น หน้าที่พลเมือง"
                  value={editSubName}
                  onChange={(e) => setEditSubName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ประเภทวิชา</label>
                  <select
                    value={editSubType}
                    onChange={(e) => setEditSubType(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
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
                    value={editSubCredits}
                    onChange={(e) => setEditSubCredits(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">จำนวนชั่วโมงต่อปี (ชม.)</label>
                <input
                  type="number"
                  min="0"
                  max="400"
                  value={editSubHours}
                  onChange={(e) => setEditSubHours(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>

              <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800">
                💡 คะแนนของนักเรียนที่กรอกไว้ในวิชานี้จะยังคงอยู่ครบถ้วน ไม่สูญหาย
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-sm transition"
                >
                  บันทึกการแก้ไข
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
