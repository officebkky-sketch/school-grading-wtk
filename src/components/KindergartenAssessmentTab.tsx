// src/components/KindergartenAssessmentTab.tsx
import React, { useState } from 'react';
import { StudentProfile } from '../types/pp5Types';
import {
  KINDERGARTEN_SIDES,
  KINDERGARTEN_STANDARDS,
  QUALITY_LEVEL_DEFS,
  QualityLevel,
  KindergartenStudentAssessment,
  DevelopmentSideId
} from '../types/kindergartenTypes';
import {
  Baby,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  HeartPulse,
  CalendarCheck,
  MessageSquare,
  Save,
  Printer,
  ChevronRight,
  UserCheck,
  Smile,
  ShieldCheck,
  Check,
  SlidersHorizontal,
  FileCheck
} from 'lucide-react';

interface Props {
  students: StudentProfile[];
  classLevel: string; // 'อ.1', 'อ.2', 'อ.3'
  academicYear: string;
  semester: number;
  assessments: Record<string, KindergartenStudentAssessment>; // key: studentId
  onUpdateAssessment: (studentId: string, assessment: KindergartenStudentAssessment) => void;
  onBulkUpdateAssessments: (assessments: Record<string, KindergartenStudentAssessment>) => void;
  onNavigateToPrint?: () => void;
  canEdit?: boolean;
}

export const KindergartenAssessmentTab: React.FC<Props> = ({
  students,
  classLevel,
  academicYear,
  semester,
  assessments,
  onUpdateAssessment,
  onBulkUpdateAssessments,
  onNavigateToPrint,
  canEdit = true
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    students[0]?.studentId || ''
  );
  const [activeSideFilter, setActiveSideFilter] = useState<DevelopmentSideId | 'all'>('all');
  const [saveToast, setSaveToast] = useState<string | null>(null);

  const selectedStudent = students.find(s => s.studentId === selectedStudentId) || students[0];

  // ดึงบันทึกการประเมินของนักเรียนคนปัจจุบัน
  const currentAssessment: KindergartenStudentAssessment = selectedStudent
    ? assessments[selectedStudent.studentId] || {
        studentId: selectedStudent.studentId,
        classLevel,
        academicYear,
        term: (semester === 2 ? 2 : 1) as 1 | 2,
        standards: {
          1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3, 9: 3, 10: 3, 11: 3, 12: 3
        },
        teacherComment: '',
        healthInfo: {
          weight: selectedStudent.weight || 0,
          height: selectedStudent.height || 0,
          teethCheck: 'ปกติ',
          teethCavitiesCount: 0,
          hairCleanliness: 'สะอาด',
          nailCleanliness: 'สะอาด',
          nutritionStatus: 'สมส่วน',
          growthHeightStatus: 'สูงตามเกณฑ์'
        },
        attendance: {
          presentDays: 98,
          totalDays: 100,
          leaveDays: 1,
          sickDays: 1
        }
      }
    : ({} as KindergartenStudentAssessment);

  const showToast = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 3000);
  };

  // เปลี่ยนระดับคะแนนของมาตรฐานใดมาตรฐานหนึ่ง
  const handleRatingChange = (standardId: number, level: QualityLevel) => {
    if (!canEdit || !selectedStudent) return;
    const updated: KindergartenStudentAssessment = {
      ...currentAssessment,
      studentId: selectedStudent.studentId,
      classLevel,
      academicYear,
      term: (semester === 2 ? 2 : 1) as 1 | 2,
      standards: {
        ...(currentAssessment.standards || {}),
        [standardId]: level
      },
      updatedAt: new Date().toISOString()
    };
    onUpdateAssessment(selectedStudent.studentId, updated);
  };

  // ประเมินระดับ 3 ทั้งหมดให้คนนี้
  const handleSetAllLevel3ForCurrent = () => {
    if (!canEdit || !selectedStudent) return;
    const all3s: Record<number, QualityLevel> = {};
    for (let i = 1; i <= 12; i++) {
      all3s[i] = 3;
    }
    const updated: KindergartenStudentAssessment = {
      ...currentAssessment,
      studentId: selectedStudent.studentId,
      classLevel,
      academicYear,
      term: (semester === 2 ? 2 : 1) as 1 | 2,
      standards: all3s,
      updatedAt: new Date().toISOString()
    };
    onUpdateAssessment(selectedStudent.studentId, updated);
    showToast(`ตั้งค่าระดับ ๓ (ดี) ทั้ง ๑๒ มาตรฐานให้ ${selectedStudent.prefix}${selectedStudent.firstName} เรียบร้อยแล้ว`);
  };

  // ประเมินระดับ 3 ทั้งห้องเรียน
  const handleSetAllLevel3ForClass = () => {
    if (!canEdit) return;
    if (!window.confirm(`คุณต้องการตั้งค่าผลการประเมินระดับ ๓ (ดี) ครบทั้ง ๑๒ มาตรฐาน ให้นักเรียนชั้น ${classLevel} ทั้งห้อง (${students.length} คน) หรือไม่?`)) {
      return;
    }
    const bulk: Record<string, KindergartenStudentAssessment> = {};
    students.forEach(stu => {
      const existing = assessments[stu.studentId];
      const all3s: Record<number, QualityLevel> = {};
      for (let i = 1; i <= 12; i++) {
        all3s[i] = 3;
      }
      bulk[stu.studentId] = {
        ...(existing || {}),
        studentId: stu.studentId,
        classLevel,
        academicYear,
        term: (semester === 2 ? 2 : 1) as 1 | 2,
        standards: all3s,
        updatedAt: new Date().toISOString()
      };
    });
    onBulkUpdateAssessments(bulk);
    showToast(`ตั้งค่าระดับ ๓ (ดี) ทั้งห้องเรียน (${students.length} คน) เรียบร้อยแล้ว`);
  };

  // เปลี่ยนความคิดเห็นของครู
  const handleTeacherCommentChange = (comment: string) => {
    if (!canEdit || !selectedStudent) return;
    const updated: KindergartenStudentAssessment = {
      ...currentAssessment,
      teacherComment: comment,
      updatedAt: new Date().toISOString()
    };
    onUpdateAssessment(selectedStudent.studentId, updated);
  };

  // Preset คำชื่นชม/ข้อเสนอแนะครู
  const commentPresets = [
    'มีพัฒนาการสมวัย ร่างกายแข็งแรง อารมณ์ร่าเริงแจ่มใส ปฏิบัติตนตามข้อตกลงของห้องเรียนได้ดีเยี่ยม มีน้ำใจช่วยเหลือเพื่อนๆ เสมอ',
    'กล้ามเนื้อมือและสายตาประสานสัมพันธ์กันดีมาก ชื่นชอบกิจกรรมศิลปะและดนตรี สามารถสื่อสารเล่าเรื่องราวได้อย่างชัดเจนสมวัย',
    'มีสุขนิสัยที่ดีในการรับประทานอาหารและดูแลความสะอาด มีทักษะชีวิตช่วยเหลือตนเองได้ดี เป็นเด็กดีมีมารยาทเรียบร้อย',
    'ควรส่งเสริมการฝึกสมาธิในการทำกิจกรรมร่วมกับผู้อื่น และฝึกการรอคอยตามลำดับก่อนหลังอย่างต่อเนื่องค่ะ',
    'ควรส่งเสริมการรับประทานอาหารให้หลากหลาย เพิ่มเติมด้านโภชนาการ และชักชวนทำกิจกรรมเคลื่อนไหวร่างกายให้คล่องแคล่วยิ่งขึ้น'
  ];

  // สรุปจำนวนมาตรฐานในแต่ละระดับคุณภาพ
  const standardsSummary = React.useMemo(() => {
    const stds = currentAssessment.standards || {};
    let level3 = 0;
    let level2 = 0;
    let level1 = 0;
    for (let i = 1; i <= 12; i++) {
      const lvl = stds[i] || 3;
      if (lvl === 3) level3++;
      else if (lvl === 2) level2++;
      else if (lvl === 1) level1++;
    }
    return { level3, level2, level1 };
  }, [currentAssessment.standards]);

  // คำนวณความคืบหน้ารายด้าน
  const getSideSummary = (sideId: DevelopmentSideId) => {
    const side = KINDERGARTEN_SIDES.find(s => s.id === sideId);
    if (!side) return { avg: 3, all3: true };
    const stds = currentAssessment.standards || {};
    let sum = 0;
    let count = 0;
    side.standardIds.forEach(id => {
      sum += stds[id] || 3;
      count++;
    });
    const avg = count > 0 ? sum / count : 3;
    return { avg, all3: avg >= 3 };
  };

  const filteredStandards = KINDERGARTEN_STANDARDS.filter(std => {
    if (activeSideFilter === 'all') return true;
    return std.sideId === activeSideFilter;
  });

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {saveToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-800 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-fade-in border border-emerald-600">
          <CheckCircle2 className="w-5 h-5 text-emerald-300" />
          <span className="text-sm font-medium">{saveToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-pink-600 via-rose-500 to-amber-500 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-6 pointer-events-none">
          <Baby className="w-64 h-64 -mr-10 -mt-10" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-xs mb-2">
              <Baby className="w-3.5 h-3.5" />
              <span>หลักสูตรการศึกษาปฐมวัย พ.ศ. ๒๕๖๐ (สพฐ.)</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              บันทึกการประเมินพัฒนาการระดับปฐมวัย (แบบ อบ.๐๒)
            </h2>
            <p className="text-sm text-pink-100 mt-1">
              ชั้น{classLevel} • ภาคเรียนที่ {semester} ปีการศึกษา {academicYear} • ประเมิน ๔ ด้านพัฒนาการ ๑๒ มาตรฐานคุณลักษณะ
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSetAllLevel3ForClass}
              disabled={!canEdit}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-pink-700 hover:bg-pink-50 transition shadow-sm disabled:opacity-50"
              title="ตั้งค่าระดับ 3 (ดี) ทุกมาตรฐานให้เด็กทุกคนในห้องเรียนเพื่อความรวดเร็ว"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>ประเมินระดับ ๓ ทั้งห้อง</span>
            </button>

            {onNavigateToPrint && (
              <button
                onClick={onNavigateToPrint}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-pink-800/80 hover:bg-pink-800 text-white transition shadow-sm border border-pink-400/30"
              >
                <Printer className="w-4 h-4" />
                <span>พิมพ์แบบ อบ.๐๑</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Sides Quick Score Indicator */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-white/20">
          {KINDERGARTEN_SIDES.map(side => {
            const sum = getSideSummary(side.id);
            return (
              <div
                key={side.id}
                onClick={() => setActiveSideFilter(activeSideFilter === side.id ? 'all' : side.id)}
                className={`p-2.5 rounded-xl cursor-pointer transition flex items-center justify-between ${
                  activeSideFilter === side.id
                    ? 'bg-white text-slate-800 shadow-md ring-2 ring-white'
                    : 'bg-black/15 text-white hover:bg-black/25'
                }`}
              >
                <div>
                  <div className="text-[11px] font-medium opacity-80">{side.name.replace('พัฒนาการ', '')}</div>
                  <div className="text-xs font-bold mt-0.5">
                    {side.standardIds.length} มาตรฐาน
                  </div>
                </div>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                  sum.avg >= 2.8 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                }`}>
                  {sum.avg >= 2.8 ? 'ระดับ ๓ (ดี)' : 'ระดับ ๒ (พอใช้)'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Student Roster Selector & Assessment Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Student Roster List (3 Cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Baby className="w-4 h-4 text-pink-600" />
                รายชื่อนักเรียน ({students.length} คน)
              </span>
              <span className="text-[11px] font-medium text-slate-500">
                เลือกเพื่อประเมิน
              </span>
            </div>

            <div className="divide-y divide-slate-100 max-h-[640px] overflow-y-auto">
              {students.map((stu) => {
                const stuAssessment = assessments[stu.studentId];
                const isSelected = stu.studentId === selectedStudentId;
                const hasAssessed = !!stuAssessment?.standards;
                const level3Count = stuAssessment?.standards
                  ? Object.values(stuAssessment.standards).filter(v => v === 3).length
                  : 0;

                return (
                  <button
                    key={stu.studentId}
                    onClick={() => setSelectedStudentId(stu.studentId)}
                    className={`w-full text-left p-3.5 flex items-center justify-between transition ${
                      isSelected
                        ? 'bg-pink-50/80 border-l-4 border-pink-500 pl-2.5'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        stu.gender === 'ญ'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {stu.seq}
                      </div>
                      <div className="truncate">
                        <div className={`text-sm font-semibold truncate ${isSelected ? 'text-pink-900 font-bold' : 'text-slate-800'}`}>
                          {stu.prefix}{stu.firstName} {stu.lastName}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>เลขที่ {stu.seq}</span>
                          <span>•</span>
                          <span>รหัส {stu.studentId}</span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      {hasAssessed ? (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-1 ${
                          level3Count >= 10
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          <Check className="w-3 h-3" />
                          {level3Count}/12 ดี
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-400">
                          รอประเมิน
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Standards Quality Rating Legend Guide */}
          <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200 space-y-2.5">
            <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-pink-600" />
              เกณฑ์ระดับคุณภาพการประเมินพัฒนาการ (สพฐ.)
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start gap-2">
                <span className="px-2 py-0.5 rounded bg-emerald-200 text-emerald-800 font-bold text-[11px] shrink-0">
                  ๓ (ดี)
                </span>
                <span className="text-emerald-900 leading-relaxed text-[11px]">
                  เด็กแสดงพฤติกรรมหรือปฏิบัติได้คล่องแคล่วด้วยตนเองอย่างสม่ำเสมอ
                </span>
              </div>
              <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2">
                <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-800 font-bold text-[11px] shrink-0">
                  ๒ (พอใช้)
                </span>
                <span className="text-amber-900 leading-relaxed text-[11px]">
                  เด็กแสดงพฤติกรรมหรือปฏิบัติได้เมื่อมีผู้ชี้แนะหรือช่วยเหลือ
                </span>
              </div>
              <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2">
                <span className="px-2 py-0.5 rounded bg-rose-200 text-rose-800 font-bold text-[11px] shrink-0">
                  ๑ (ควรส่งเสริม)
                </span>
                <span className="text-rose-900 leading-relaxed text-[11px]">
                  เด็กยังทำไม่ได้ หรือทำได้น้อย แม้ได้รับการกระตุ้นหรือแนะนำ
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Assessment Workspace (8 Cols) */}
        <div className="lg:col-span-8 space-y-5">
          {selectedStudent ? (
            <>
              {/* Selected Student Banner Card */}
              <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-base ${
                    selectedStudent.gender === 'ญ'
                      ? 'bg-rose-100 text-rose-700 border border-rose-200'
                      : 'bg-blue-100 text-blue-700 border border-blue-200'
                  }`}>
                    {selectedStudent.seq}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-800">
                        {selectedStudent.prefix}{selectedStudent.firstName} {selectedStudent.lastName}
                      </h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                        {selectedStudent.gender === 'ญ' ? 'หญิง' : 'ชาย'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-2.5">
                      <span>รหัสประจำตัว: <strong>{selectedStudent.studentId}</strong></span>
                      <span>•</span>
                      <span>เลข ปชช.: {selectedStudent.nationalId}</span>
                      <span>•</span>
                      <span>อายุ: {selectedStudent.ageYears || 5} ปี</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSetAllLevel3ForCurrent}
                    disabled={!canEdit}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>ตั้งระดับ ๓ (ดี) ทั้งหมด</span>
                  </button>
                </div>
              </div>

              {/* Quality Score Breakdown Pills */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                  <div className="text-xs font-semibold text-emerald-800">ระดับ ๓ (ดี)</div>
                  <div className="text-2xl font-black text-emerald-600 mt-1">{standardsSummary.level3}</div>
                  <div className="text-[10px] text-emerald-700">จาก ๑๒ มาตรฐาน</div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                  <div className="text-xs font-semibold text-amber-800">ระดับ ๒ (พอใช้)</div>
                  <div className="text-2xl font-black text-amber-600 mt-1">{standardsSummary.level2}</div>
                  <div className="text-[10px] text-amber-700">จาก ๑๒ มาตรฐาน</div>
                </div>
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-center">
                  <div className="text-xs font-semibold text-rose-800">ระดับ ๑ (ควรส่งเสริม)</div>
                  <div className="text-2xl font-black text-rose-600 mt-1">{standardsSummary.level1}</div>
                  <div className="text-[10px] text-rose-700">จาก ๑๒ มาตรฐาน</div>
                </div>
              </div>

              {/* Filter Tabs for 4 Sides */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-slate-200">
                <button
                  onClick={() => setActiveSideFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                    activeSideFilter === 'all'
                      ? 'bg-pink-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  ทั้งหมด (๑๒ มาตรฐาน)
                </button>
                {KINDERGARTEN_SIDES.map(side => (
                  <button
                    key={side.id}
                    onClick={() => setActiveSideFilter(side.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                      activeSideFilter === side.id
                        ? 'bg-pink-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>{side.name}</span>
                  </button>
                ))}
              </div>

              {/* 12 Standards Assessment List */}
              <div className="space-y-4">
                {filteredStandards.map(std => {
                  const currentLevel = currentAssessment.standards?.[std.id] || 3;
                  const side = KINDERGARTEN_SIDES.find(s => s.id === std.sideId);

                  return (
                    <div
                      key={std.id}
                      className="bg-white rounded-xl p-4 shadow-xs border border-slate-200 hover:border-slate-300 transition"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1.5 max-w-xl">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase">
                              {side?.name}
                            </span>
                            <h4 className="text-sm font-bold text-slate-800">
                              {std.title}
                            </h4>
                          </div>
                          <p className="text-xs text-slate-600">
                            {std.description}
                          </p>
                          {/* Indicators summary */}
                          <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 mt-2 space-y-0.5">
                            <span className="font-semibold text-slate-700">ตัวบ่งชี้และสภาพที่พึงประสงค์:</span>
                            <ul className="list-disc list-inside space-y-0.5 mt-1">
                              {std.indicators.map((ind, i) => (
                                <li key={i}>{ind}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Rating 3/2/1 Buttons */}
                        <div className="shrink-0 flex sm:flex-col items-center gap-1.5 self-end sm:self-center">
                          <span className="text-[10px] font-bold text-slate-400 mb-0.5 hidden sm:block">
                            ระดับผลประเมิน
                          </span>
                          <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200 gap-1">
                            {([3, 2, 1] as QualityLevel[]).map(lvl => {
                              const isCurrent = currentLevel === lvl;
                              const def = QUALITY_LEVEL_DEFS[lvl];
                              return (
                                <button
                                  key={lvl}
                                  type="button"
                                  onClick={() => handleRatingChange(std.id, lvl)}
                                  disabled={!canEdit}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                                    isCurrent
                                      ? def.badgeClass + ' shadow-xs ring-1 ring-black/10'
                                      : 'text-slate-600 hover:bg-white hover:text-slate-900'
                                  }`}
                                  title={def.description}
                                >
                                  {isCurrent && <Check className="w-3 h-3" />}
                                  <span>{def.label}</span>
                                  <span className="text-[10px] opacity-70">({lvl})</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Teacher Comments & Guidance */}
              <div className="bg-white rounded-xl p-5 shadow-xs border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-pink-600" />
                    ความคิดเห็นและข้อเสนอแนะของครูประจำชั้น (บันทึกลงใน แบบ อบ.๐๑)
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    แสดงในสมุดรายงานประจำตัวเด็ก
                  </span>
                </div>

                <textarea
                  rows={4}
                  value={currentAssessment.teacherComment || ''}
                  onChange={(e) => handleTeacherCommentChange(e.target.value)}
                  disabled={!canEdit}
                  placeholder="พิมพ์ความคิดเห็น สรุปพัฒนาการ และข้อเสนอแนะให้แก่ผู้ปกครอง เช่น พัฒนาการด้านร่างกาย อารมณ์ สังคม และสติปัญญา..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                />

                {/* Preset comment suggestions */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-semibold text-slate-500">
                    ตัวอย่างข้อความแนะนำ (คลิกเพื่อแทรก):
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {commentPresets.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          const existing = currentAssessment.teacherComment || '';
                          const newComment = existing ? `${existing} ${preset}` : preset;
                          handleTeacherCommentChange(newComment);
                        }}
                        disabled={!canEdit}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-pink-50 hover:bg-pink-100 text-pink-800 border border-pink-200 text-left transition truncate max-w-md"
                        title={preset}
                      >
                        + {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl p-12 text-center text-slate-400 border border-slate-200">
              <Baby className="w-12 h-12 mx-auto text-slate-300 mb-2" />
              <p>ไม่มีข้อมูลนักเรียนในระดับชั้นนี้</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
