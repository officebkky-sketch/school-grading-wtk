import React, { useState, useEffect } from 'react';
import { StudentProfile, HolisticDetail } from '../types/pp5Types';
import { Award, CheckCheck, Sparkles, CheckCircle, ShieldCheck } from 'lucide-react';

interface Props {
  students: StudentProfile[];
  classLevel: string;
  holisticData?: Record<string, HolisticDetail>;
  onUpdateHolistic?: (studentId: string, data: HolisticDetail) => void;
  onBulkUpdateHolistic?: (records: Record<string, HolisticDetail>) => void;
}

export const HolisticAssessmentTab: React.FC<Props> = ({ 
  students, 
  classLevel,
  holisticData,
  onUpdateHolistic,
  onBulkUpdateHolistic
}) => {
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
        activityPassed: true
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
      traitsScore: 3, competencyScore: 3, readingWriting: 'ดีเยี่ยม', activityPassed: true
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

  const handleBulkExcellent = () => {
    const updated: Record<string, HolisticDetail> = {};
    students.forEach(s => {
      updated[s.studentId] = {
        traitsScore: 3,
        competencyScore: 3,
        readingWriting: 'ดีเยี่ยม',
        activityPassed: true
      };
    });
    setEvaluations(updated);
    if (onBulkUpdateHolistic) {
      onBulkUpdateHolistic(updated);
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
      {/* Top Banner */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-600" />
              การประเมินคุณลักษณะอันพึงประสงค์ & สมรรถนะผู้เรียน ชั้น {classLevel}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              ตามหลักสูตรแกนกลาง สพฐ. 2551 (คุณลักษณะ 8 ประการ, สมรรถนะ 5 ด้าน, การอ่าน คิดวิเคราะห์ เขียน, และกิจกรรมพัฒนาผู้เรียน)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleBulkExcellent}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-50 text-amber-800 hover:bg-amber-100 text-sm font-semibold rounded-lg border border-amber-300 transition shadow-xs"
            >
              <Sparkles className="w-4 h-4 text-amber-600" />
              ประเมินระดับ "ดีเยี่ยม" และผ่านกิจกรรมทั้งห้อง
            </button>
          </div>
        </div>
      </div>

      {/* Holistic Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase text-xs">
              <tr>
                <th className="px-3 py-3 text-center w-12">เลขที่</th>
                <th className="px-3 py-3 text-center w-20">รหัส</th>
                <th className="px-4 py-3 min-w-[170px]">ชื่อ - นามสกุล</th>
                <th className="px-4 py-3 text-center min-w-[160px] bg-amber-50/50 text-amber-900">คุณลักษณะ 8 ประการ</th>
                <th className="px-4 py-3 text-center min-w-[160px] bg-teal-50/50 text-teal-900">สมรรถนะสำคัญ 5 ด้าน</th>
                <th className="px-4 py-3 text-center min-w-[150px]">อ่าน คิดวิเคราะห์ เขียน</th>
                <th className="px-4 py-3 text-center min-w-[140px] bg-emerald-50/50 text-emerald-900">กิจกรรมพัฒนาผู้เรียน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {students.map((s) => {
                const cur = evaluations[s.studentId] || {
                  traitsScore: 3, competencyScore: 3, readingWriting: 'ดีเยี่ยม', activityPassed: true
                };

                return (
                  <tr key={s.id} className="hover:bg-slate-50 transition">
                    <td className="px-3 py-2.5 text-center font-bold text-slate-800">{s.seq}</td>
                    <td className="px-3 py-2.5 text-center font-mono text-slate-500">{s.studentId}</td>
                    <td className="px-4 py-2.5 font-medium text-slate-900">
                      {s.prefix}{s.firstName} {s.lastName}
                    </td>

                    {/* Desirable Traits */}
                    <td className="px-4 py-2 text-center">
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
                    <td className="px-4 py-2 text-center">
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
                    <td className="px-4 py-2 text-center">
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
                    <td className="px-4 py-2 text-center">
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
    </div>
  );
};
