import React, { useState, useEffect } from 'react';
import { StudentProfile, HolisticDetail, LearnerActivityRecord } from '../types/pp5Types';
import { Award, Sparkles, CheckCircle, Compass, Users } from 'lucide-react';

interface Props {
  students: StudentProfile[];
  classLevel: string;
  holisticData?: Record<string, HolisticDetail>;
  onUpdateHolistic?: (studentId: string, data: HolisticDetail) => void;
  onBulkUpdateHolistic?: (records: Record<string, HolisticDetail>) => void;
  clubName?: string;
  onUpdateClubName?: (cls: string, name: string) => void;
}

export const HolisticAssessmentTab: React.FC<Props> = ({ 
  students, 
  classLevel,
  holisticData,
  onUpdateHolistic,
  onBulkUpdateHolistic,
  clubName = '',
  onUpdateClubName
}) => {
  const [subTab, setSubTab] = useState<'holistic' | 'activities'>('activities');
  const [currentClubName, setCurrentClubName] = useState<string>(() => {
    return clubName || (classLevel === 'ป.6' ? 'ชุมนุมสื่อ AI สร้างสรรค์' : 'ชุมนุมศิลป์สร้างสรรค์');
  });

  useEffect(() => {
    if (clubName) setCurrentClubName(clubName);
  }, [clubName]);

  const defaultActivityRecord = (cName?: string): LearnerActivityRecord => ({
    guidanceHours: 40,
    guidanceResult: 'ผ',
    scoutHours: 40,
    scoutResult: 'ผ',
    clubName: cName || currentClubName,
    clubHours: 30,
    clubResult: 'ผ',
    publicServiceHours: 10,
    publicServiceResult: 'ผ'
  });

  const [evaluations, setEvaluations] = useState<Record<string, HolisticDetail>>(() => {
    if (holisticData && Object.keys(holisticData).length > 0) {
      return holisticData;
    }
    const init: Record<string, HolisticDetail> = {};
    students.forEach(s => {
      init[s.studentId] = {
        traitsScore: 3, // Default: ดีเยี่ยม
        competencyScore: 3,
        readingWriting: 'ดีเยี่ยม',
        activityPassed: true,
        activities: defaultActivityRecord()
      };
    });
    return init;
  });

  useEffect(() => {
    if (holisticData && Object.keys(holisticData).length > 0) {
      setEvaluations(holisticData);
    }
  }, [holisticData]);

  const handleScoreChange = (studentId: string, field: keyof HolisticDetail, val: any) => {
    const current = evaluations[studentId] || {
      traitsScore: 3, competencyScore: 3, readingWriting: 'ดีเยี่ยม', activityPassed: true,
      activities: defaultActivityRecord()
    };
    const updated = { ...current, [field]: val };
    setEvaluations(prev => ({
      ...prev,
      [studentId]: updated
    }));
    if (onUpdateHolistic) {
      onUpdateHolistic(studentId, updated);
    }
  };

  const handleActivityItemChange = (
    studentId: string,
    field: keyof LearnerActivityRecord,
    val: any
  ) => {
    const current = evaluations[studentId] || {
      traitsScore: 3, competencyScore: 3, readingWriting: 'ดีเยี่ยม', activityPassed: true,
      activities: defaultActivityRecord()
    };
    const currentAct = current.activities || defaultActivityRecord();
    const updatedAct = { ...currentAct, [field]: val };

    // กิจกรรมพัฒนาผู้เรียนผ่านเกณฑ์ (ผ) เมื่อผ่านครบทั้ง 4 กิจกรรม
    const isAllPassed = 
      (updatedAct.guidanceResult ?? 'ผ') === 'ผ' &&
      (updatedAct.scoutResult ?? 'ผ') === 'ผ' &&
      (updatedAct.clubResult ?? 'ผ') === 'ผ' &&
      (updatedAct.publicServiceResult ?? 'ผ') === 'ผ';

    const updated: HolisticDetail = {
      ...current,
      activityPassed: isAllPassed,
      activities: updatedAct
    };

    setEvaluations(prev => ({
      ...prev,
      [studentId]: updated
    }));
    if (onUpdateHolistic) {
      onUpdateHolistic(studentId, updated);
    }
  };

  const handleBulkPassActivities = () => {
    const updated: Record<string, HolisticDetail> = {};
    students.forEach(s => {
      const cur = evaluations[s.studentId] || {
        traitsScore: 3, competencyScore: 3, readingWriting: 'ดีเยี่ยม', activityPassed: true
      };
      updated[s.studentId] = {
        ...cur,
        activityPassed: true,
        activities: {
          guidanceHours: 40,
          guidanceResult: 'ผ',
          scoutHours: 40,
          scoutResult: 'ผ',
          clubName: currentClubName,
          clubHours: 30,
          clubResult: 'ผ',
          publicServiceHours: 10,
          publicServiceResult: 'ผ'
        }
      };
    });
    setEvaluations(updated);
    if (onBulkUpdateHolistic) {
      onBulkUpdateHolistic(updated);
    }
  };

  const handleBulkExcellent = () => {
    const updated: Record<string, HolisticDetail> = {};
    students.forEach(s => {
      const cur = evaluations[s.studentId];
      updated[s.studentId] = {
        traitsScore: 3,
        competencyScore: 3,
        readingWriting: 'ดีเยี่ยม',
        activityPassed: true,
        activities: cur?.activities || defaultActivityRecord()
      };
    });
    setEvaluations(updated);
    if (onBulkUpdateHolistic) {
      onBulkUpdateHolistic(updated);
    }
  };

  const handleSaveClubName = (name: string) => {
    setCurrentClubName(name);
    if (onUpdateClubName) {
      onUpdateClubName(classLevel, name);
    }
  };

  const getLevelLabel = (score: number) => {
    switch (score) {
      case 3: return 'ดีเยี่ยม (3)';
      case 2: return 'ดี (2)';
      case 1: return 'ผ่าน (1)';
      default: return 'ไม่ผ่าน (0)';
    }
  };

  const getLevelBadge = (score: number) => {
    switch (score) {
      case 3: return 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold';
      case 2: return 'bg-teal-100 text-teal-800 border-teal-300 font-semibold';
      case 1: return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-rose-100 text-rose-800 border-rose-300 font-bold';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Sub-Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-600" />
              การประเมินคุณภาพผู้เรียน & กิจกรรมพัฒนาผู้เรียน ชั้น {classLevel}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              อ้างอิงเกณฑ์ สพฐ. 2551 และมาตรฐานแบบพิมพ์ ปพ.1 / ปพ.5 / ปพ.6 ครบทั้ง 4 กิจกรรม (120 ชม./ปี)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Tab Switcher */}
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setSubTab('activities')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
                  subTab === 'activities'
                    ? 'bg-white text-emerald-800 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Compass className="w-4 h-4 text-emerald-600" />
                <span>กิจกรรมพัฒนาผู้เรียน (4 กิจกรรม)</span>
              </button>
              <button
                type="button"
                onClick={() => setSubTab('holistic')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
                  subTab === 'holistic'
                    ? 'bg-white text-blue-800 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Award className="w-4 h-4 text-blue-600" />
                <span>คุณลักษณะ & สมรรถนะ (3 ด้าน)</span>
              </button>
            </div>

            {subTab === 'activities' ? (
              <button
                onClick={handleBulkPassActivities}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-bold rounded-lg border border-emerald-300 transition shadow-xs"
              >
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                ประเมิน "ผ่าน (ผ)" ทุกกิจกรรมทั้งห้อง
              </button>
            ) : (
              <button
                onClick={handleBulkExcellent}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-50 text-amber-800 hover:bg-amber-100 text-xs font-bold rounded-lg border border-amber-300 transition shadow-xs"
              >
                <Sparkles className="w-4 h-4 text-amber-600" />
                ประเมินระดับ "ดีเยี่ยม" ทั้งห้อง
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: กิจกรรมพัฒนาผู้เรียน 4 กิจกรรม (ตรงตามสกรีนช็อต ปพ.1 100%) */}
      {/* ========================================================================= */}
      {subTab === 'activities' && (
        <div className="space-y-4">
          {/* Club Customization Bar */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-700 shrink-0" />
              <span className="font-bold text-emerald-950">กำหนดชื่อชุมนุมประจำชั้น {classLevel}:</span>
              <input
                type="text"
                value={currentClubName}
                onChange={(e) => handleSaveClubName(e.target.value)}
                placeholder="เช่น ชุมนุมศิลป์สร้างสรรค์ หรือ ชุมนุมสื่อ AI สร้างสรรค์"
                className="px-3 py-1 bg-white border border-emerald-300 rounded-lg text-slate-800 font-semibold w-72 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
              />
              <span className="text-emerald-700 text-[11px]">(บันทึกลง ปพ.1 / ปพ.5 / ปพ.6 อัตโนมัติ)</span>
            </div>

            <div className="flex items-center gap-4 text-slate-600 text-[11px]">
              <span>เกณฑ์เวลาเรียน: <strong>120 ชม./ปี</strong></span>
              <span>• แนะแนว 40 ชม.</span>
              <span>• ลูกเสือ 40 ชม.</span>
              <span>• ชุมนุม 30 ชม.</span>
              <span>• สาธารณประโยชน์ 10 ชม.</span>
            </div>
          </div>

          {/* Activities Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 border-collapse">
                <thead className="bg-[#f8f9fa] text-slate-700 font-bold border-b border-slate-300 text-center">
                  <tr>
                    <th rowSpan={2} className="px-2 py-2 w-10 border border-slate-300">ที่</th>
                    <th rowSpan={2} className="px-2 py-2 w-16 border border-slate-300">รหัส</th>
                    <th rowSpan={2} className="px-3 py-2 text-left min-w-[150px] border border-slate-300">ชื่อ - สกุล</th>
                    <th colSpan={2} className="px-2 py-1.5 border border-slate-300 bg-blue-50/60 text-blue-900">
                      1. กิจกรรมแนะแนว
                    </th>
                    <th colSpan={2} className="px-2 py-1.5 border border-slate-300 bg-amber-50/60 text-amber-900">
                      2. ลูกเสือ เนตรนารี
                    </th>
                    <th colSpan={2} className="px-2 py-1.5 border border-slate-300 bg-indigo-50/60 text-indigo-900">
                      3. {currentClubName || 'กิจกรรมชุมนุม'}
                    </th>
                    <th colSpan={2} className="px-2 py-1.5 border border-slate-300 bg-teal-50/60 text-teal-900">
                      4. กิจกรรมเพื่อสังคมและสาธารณประโยชน์
                    </th>
                    <th rowSpan={2} className="px-3 py-2 w-24 border border-slate-300 bg-emerald-50 text-emerald-950">
                      ผลการตัดสิน
                    </th>
                  </tr>
                  <tr className="text-[11px] font-medium text-slate-600">
                    <th className="px-1 py-1 w-14 border border-slate-300 bg-blue-50/30">เวลา (ชม.)</th>
                    <th className="px-1 py-1 w-16 border border-slate-300 bg-blue-50/30">ผลประเมิน</th>
                    <th className="px-1 py-1 w-14 border border-slate-300 bg-amber-50/30">เวลา (ชม.)</th>
                    <th className="px-1 py-1 w-16 border border-slate-300 bg-amber-50/30">ผลประเมิน</th>
                    <th className="px-1 py-1 w-14 border border-slate-300 bg-indigo-50/30">เวลา (ชม.)</th>
                    <th className="px-1 py-1 w-16 border border-slate-300 bg-indigo-50/30">ผลประเมิน</th>
                    <th className="px-1 py-1 w-14 border border-slate-300 bg-teal-50/30">เวลา (ชม.)</th>
                    <th className="px-1 py-1 w-16 border border-slate-300 bg-teal-50/30">ผลประเมิน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((s, idx) => {
                    const cur = evaluations[s.studentId] || {
                      traitsScore: 3, competencyScore: 3, readingWriting: 'ดีเยี่ยม', activityPassed: true
                    };
                    const act = cur.activities || defaultActivityRecord(currentClubName);
                    const isAllPass = 
                      (act.guidanceResult ?? 'ผ') === 'ผ' &&
                      (act.scoutResult ?? 'ผ') === 'ผ' &&
                      (act.clubResult ?? 'ผ') === 'ผ' &&
                      (act.publicServiceResult ?? 'ผ') === 'ผ';

                    return (
                      <tr key={s.id} className="hover:bg-slate-50 transition border-b border-slate-200">
                        <td className="px-2 py-2 text-center font-bold text-slate-800 border border-slate-300 font-sans">{idx + 1}</td>
                        <td className="px-2 py-2 text-center font-mono text-slate-500 border border-slate-300">{s.studentId}</td>
                        <td className="px-3 py-2 font-medium text-slate-900 border border-slate-300">
                          {s.prefix}{s.firstName} {s.lastName}
                        </td>

                        {/* 1. แนะแนว */}
                        <td className="p-1 text-center font-mono border border-slate-300 text-slate-700 bg-blue-50/20">
                          {act.guidanceHours || 40}
                        </td>
                        <td className="p-1 text-center border border-slate-300 bg-blue-50/20">
                          <select
                            value={act.guidanceResult || 'ผ'}
                            onChange={(e) => handleActivityItemChange(s.studentId, 'guidanceResult', e.target.value)}
                            className={`px-1.5 py-0.5 rounded text-xs font-bold border focus:outline-none ${
                              act.guidanceResult === 'ผ'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : 'bg-rose-50 text-rose-800 border-rose-300'
                            }`}
                          >
                            <option value="ผ">ผ (ผ่าน)</option>
                            <option value="มผ">มผ (ไม่ผ่าน)</option>
                          </select>
                        </td>

                        {/* 2. ลูกเสือ เนตรนารี */}
                        <td className="p-1 text-center font-mono border border-slate-300 text-slate-700 bg-amber-50/20">
                          {act.scoutHours || 40}
                        </td>
                        <td className="p-1 text-center border border-slate-300 bg-amber-50/20">
                          <select
                            value={act.scoutResult || 'ผ'}
                            onChange={(e) => handleActivityItemChange(s.studentId, 'scoutResult', e.target.value)}
                            className={`px-1.5 py-0.5 rounded text-xs font-bold border focus:outline-none ${
                              act.scoutResult === 'ผ'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : 'bg-rose-50 text-rose-800 border-rose-300'
                            }`}
                          >
                            <option value="ผ">ผ (ผ่าน)</option>
                            <option value="มผ">มผ (ไม่ผ่าน)</option>
                          </select>
                        </td>

                        {/* 3. ชุมนุม */}
                        <td className="p-1 text-center font-mono border border-slate-300 text-slate-700 bg-indigo-50/20">
                          {act.clubHours || 30}
                        </td>
                        <td className="p-1 text-center border border-slate-300 bg-indigo-50/20">
                          <select
                            value={act.clubResult || 'ผ'}
                            onChange={(e) => handleActivityItemChange(s.studentId, 'clubResult', e.target.value)}
                            className={`px-1.5 py-0.5 rounded text-xs font-bold border focus:outline-none ${
                              act.clubResult === 'ผ'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : 'bg-rose-50 text-rose-800 border-rose-300'
                            }`}
                          >
                            <option value="ผ">ผ (ผ่าน)</option>
                            <option value="มผ">มผ (ไม่ผ่าน)</option>
                          </select>
                        </td>

                        {/* 4. สาธารณประโยชน์ */}
                        <td className="p-1 text-center font-mono border border-slate-300 text-slate-700 bg-teal-50/20">
                          {act.publicServiceHours || 10}
                        </td>
                        <td className="p-1 text-center border border-slate-300 bg-teal-50/20">
                          <select
                            value={act.publicServiceResult || 'ผ'}
                            onChange={(e) => handleActivityItemChange(s.studentId, 'publicServiceResult', e.target.value)}
                            className={`px-1.5 py-0.5 rounded text-xs font-bold border focus:outline-none ${
                              act.publicServiceResult === 'ผ'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : 'bg-rose-50 text-rose-800 border-rose-300'
                            }`}
                          >
                            <option value="ผ">ผ (ผ่าน)</option>
                            <option value="มผ">มผ (ไม่ผ่าน)</option>
                          </select>
                        </td>

                        {/* ผลการตัดสิน */}
                        <td className="px-2 py-1 text-center border border-slate-300 bg-emerald-50/40 font-bold">
                          {isAllPass ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                              <CheckCircle className="w-3.5 h-3.5" /> ผ่าน (ผ)
                            </span>
                          ) : (
                            <span className="inline-block text-rose-600 font-bold">
                              ไม่ผ่าน (มผ)
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: คุณลักษณะ 8 ประการ, สมรรถนะ 5 ด้าน, อ่าน คิดวิเคราะห์ เขียน */}
      {/* ========================================================================= */}
      {subTab === 'holistic' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 border-collapse">
              <thead className="bg-[#f8f9fa] text-slate-700 font-bold border-b border-slate-300 text-center uppercase">
                <tr>
                  <th className="px-3 py-3 text-center w-12 border border-slate-300">ลำดับ</th>
                  <th className="px-3 py-3 text-center w-20 border border-slate-300">รหัส</th>
                  <th className="px-4 py-3 text-left min-w-[170px] border border-slate-300">ชื่อ - นามสกุล</th>
                  <th className="px-4 py-3 text-center min-w-[160px] bg-amber-50/50 text-amber-900 border border-slate-300">คุณลักษณะ 8 ประการ</th>
                  <th className="px-4 py-3 text-center min-w-[160px] bg-teal-50/50 text-teal-900 border border-slate-300">สมรรถนะสำคัญ 5 ด้าน</th>
                  <th className="px-4 py-3 text-center min-w-[150px] border border-slate-300">อ่าน คิดวิเคราะห์ เขียน</th>
                  <th className="px-4 py-3 text-center min-w-[140px] bg-emerald-50/50 text-emerald-900 border border-slate-300">กิจกรรมพัฒนาผู้เรียน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((s, idx) => {
                  const cur = evaluations[s.studentId] || {
                    traitsScore: 3, competencyScore: 3, readingWriting: 'ดีเยี่ยม', activityPassed: true
                  };

                  return (
                    <tr key={s.id} className="hover:bg-slate-50 transition border-b border-slate-200">
                      <td className="px-3 py-2 text-center font-bold text-slate-800 border border-slate-300 font-sans">{idx + 1}</td>
                      <td className="px-3 py-2 text-center font-mono text-slate-500 border border-slate-300">{s.studentId}</td>
                      <td className="px-4 py-2 font-medium text-slate-900 border border-slate-300">
                        {s.prefix}{s.firstName} {s.lastName}
                      </td>

                      {/* Desirable Traits */}
                      <td className="px-4 py-2 text-center border border-slate-300">
                        <select
                          value={cur.traitsScore}
                          onChange={(e) => handleScoreChange(s.studentId, 'traitsScore', Number(e.target.value))}
                          className={`text-xs font-semibold rounded-lg px-2.5 py-1 border focus:outline-none focus:ring-2 focus:ring-amber-400 ${getLevelBadge(cur.traitsScore)}`}
                        >
                          <option value={3}>ดีเยี่ยม (ระดับ 3)</option>
                          <option value={2}>ดี (ระดับ 2)</option>
                          <option value={1}>ผ่าน (ระดับ 1)</option>
                          <option value={0}>ไม่ผ่าน (ระดับ 0)</option>
                        </select>
                      </td>

                      {/* Competencies */}
                      <td className="px-4 py-2 text-center border border-slate-300">
                        <select
                          value={cur.competencyScore}
                          onChange={(e) => handleScoreChange(s.studentId, 'competencyScore', Number(e.target.value))}
                          className={`text-xs font-semibold rounded-lg px-2.5 py-1 border focus:outline-none focus:ring-2 focus:ring-teal-400 ${getLevelBadge(cur.competencyScore)}`}
                        >
                          <option value={3}>ดีเยี่ยม (ระดับ 3)</option>
                          <option value={2}>ดี (ระดับ 2)</option>
                          <option value={1}>ผ่าน (ระดับ 1)</option>
                          <option value={0}>ไม่ผ่าน (ระดับ 0)</option>
                        </select>
                      </td>

                      {/* Reading, Analytical Thinking & Writing */}
                      <td className="px-4 py-2 text-center border border-slate-300">
                        <select
                          value={cur.readingWriting}
                          onChange={(e) => handleScoreChange(s.studentId, 'readingWriting', e.target.value)}
                          className="text-xs font-semibold rounded-lg px-2.5 py-1 border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        >
                          <option value="ดีเยี่ยม">ดีเยี่ยม</option>
                          <option value="ดี">ดี</option>
                          <option value="ผ่าน">ผ่าน</option>
                          <option value="ไม่ผ่าน">ไม่ผ่าน</option>
                        </select>
                      </td>

                      {/* Activities Passed */}
                      <td className="px-4 py-2 text-center border border-slate-300">
                        <button
                          onClick={() => handleScoreChange(s.studentId, 'activityPassed', !cur.activityPassed)}
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border transition ${
                            cur.activityPassed
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                              : 'bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-200'
                          }`}
                        >
                          {cur.activityPassed ? (
                            <>
                              <CheckCircle className="w-3.5 h-3.5" /> ผ่าน
                            </>
                          ) : (
                            'ไม่ผ่าน'
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
