// src/components/HealthGrowthStudioTab.tsx
import React, { useState } from 'react';
import { StudentProfile } from '../types/pp5Types';
import { GrowthEngine, NutritionEvaluation } from '../engines/growthEngine';
import { Activity, HeartPulse, Scale, CheckCircle, AlertTriangle } from 'lucide-react';

interface Props {
  students: StudentProfile[];
  classLevel: string;
  semester: 1 | 2;
  onUpdateStudentGrowth: (studentId: string, weight: number, height: number) => void;
}

export const HealthGrowthStudioTab: React.FC<Props> = ({
  students,
  classLevel,
  semester,
  onUpdateStudentGrowth
}) => {
  const [localData, setLocalData] = useState<Record<string, { weight: number; height: number }>>(() => {
    const init: Record<string, { weight: number; height: number }> = {};
    students.forEach(s => {
      init[s.studentId] = { weight: s.weight || 0, height: s.height || 0 };
    });
    return init;
  });

  const handleValChange = (studentId: string, field: 'weight' | 'height', valStr: string) => {
    const val = valStr === '' ? 0 : Number(valStr);
    setLocalData(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], [field]: val }
    }));
    const cur = localData[studentId] || { weight: 0, height: 0 };
    const w = field === 'weight' ? val : cur.weight;
    const h = field === 'height' ? val : cur.height;
    onUpdateStudentGrowth(studentId, w, h);
  };

  // Compute nutrition summaries
  const evaluations = students.map(s => {
    const d = localData[s.studentId] || { weight: s.weight, height: s.height };
    return {
      student: s,
      ...GrowthEngine.evaluateGrowth(s.gender, s.ageYears || 7, d.weight, d.height)
    };
  });

  const normalCount = evaluations.filter(e => e.weightForHeight === 'สมส่วน').length;
  const chubbyCount = evaluations.filter(e => e.weightForHeight === 'ท้วม' || e.weightForHeight === 'เริ่มอ้วน' || e.weightForHeight === 'อ้วน').length;
  const thinCount = evaluations.filter(e => e.weightForHeight === 'ผอม' || e.weightForHeight === 'ผอมมาก').length;
  const normalPercent = students.length > 0 ? Math.round((normalCount / students.length) * 100) : 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'สมส่วน':
      case 'สูงตามเกณฑ์':
      case 'น้ำหนักตามเกณฑ์':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'ท้วม':
      case 'เริ่มอ้วน':
      case 'ค่อนข้างสูง':
      case 'ค่อนข้างมาก':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'อ้วน':
      case 'น้ำหนักเกินเกณฑ์':
        return 'bg-rose-100 text-rose-800 border-rose-300 font-bold';
      case 'ผอม':
      case 'ผอมมาก':
      case 'ค่อนข้างเตี้ย':
      case 'เตี้ย':
      case 'ค่อนข้างน้อย':
      case 'น้ำหนักน้อยกว่าเกณฑ์':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Summary Cards */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-rose-600" />
              การเจริญเติบโตและภาวะโภชนาการ ชั้น {classLevel} (ภาคเรียนที่ {semester})
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              ประเมินดัชนีมวลกาย (BMI) และเกณฑ์การเจริญเติบโต 3 ดัชนี ตามเกณฑ์มาตรฐานกรมอนามัย กระทรวงสาธารณสุข โดยอัตโนมัติ
            </p>
          </div>
        </div>

        {/* Nutrition Summary Grid */}
        <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-emerald-50 rounded-lg p-3.5 border border-emerald-200 flex items-center justify-between">
            <div>
              <div className="text-xs text-emerald-700 font-medium">สมส่วนตามเกณฑ์</div>
              <div className="text-2xl font-bold text-emerald-900 mt-0.5">{normalCount} คน</div>
            </div>
            <span className="text-sm font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
              {normalPercent}%
            </span>
          </div>

          <div className="bg-amber-50 rounded-lg p-3.5 border border-amber-200 flex items-center justify-between">
            <div>
              <div className="text-xs text-amber-700 font-medium">ท้วม / เริ่มอ้วน / อ้วน</div>
              <div className="text-2xl font-bold text-amber-900 mt-0.5">{chubbyCount} คน</div>
            </div>
            <span className="text-sm font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
              {students.length > 0 ? Math.round((chubbyCount / students.length) * 100) : 0}%
            </span>
          </div>

          <div className="bg-blue-50 rounded-lg p-3.5 border border-blue-200 flex items-center justify-between">
            <div>
              <div className="text-xs text-blue-700 font-medium">ผอม / ผอมมาก</div>
              <div className="text-2xl font-bold text-blue-900 mt-0.5">{thinCount} คน</div>
            </div>
            <span className="text-sm font-bold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full">
              {students.length > 0 ? Math.round((thinCount / students.length) * 100) : 0}%
            </span>
          </div>

          <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-medium">นักเรียนทั้งหมด</div>
              <div className="text-2xl font-bold text-slate-800 mt-0.5">{students.length} คน</div>
            </div>
            <Scale className="w-6 h-6 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Health Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase text-xs">
              <tr>
                <th className="px-3 py-3 text-center w-12">เลขที่</th>
                <th className="px-3 py-3 text-center w-20">รหัส</th>
                <th className="px-4 py-3 min-w-[160px]">ชื่อ - นามสกุล</th>
                <th className="px-3 py-3 text-center w-16">เพศ</th>
                <th className="px-3 py-3 text-center w-16">อายุ</th>
                <th className="px-3 py-3 text-center w-24 bg-rose-50/50 text-rose-900">น้ำหนัก (กก.)</th>
                <th className="px-3 py-3 text-center w-24 bg-rose-50/50 text-rose-900">ส่วนสูง (ซม.)</th>
                <th className="px-3 py-3 text-center w-20">BMI</th>
                <th className="px-3 py-3 text-center min-w-[120px]">น้ำหนักตามเกณฑ์ส่วนสูง</th>
                <th className="px-3 py-3 text-center min-w-[120px]">ส่วนสูงตามเกณฑ์อายุ</th>
                <th className="px-3 py-3 text-center min-w-[120px]">น้ำหนักตามเกณฑ์อายุ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {evaluations.map(({ student: s, bmi, weightForHeight, heightForAge, weightForAge }) => {
                const cur = localData[s.studentId] || { weight: s.weight, height: s.height };
                return (
                  <tr key={s.id} className="hover:bg-slate-50 transition">
                    <td className="px-3 py-2.5 text-center font-bold text-slate-800">{s.seq}</td>
                    <td className="px-3 py-2.5 text-center font-mono text-slate-500">{s.studentId}</td>
                    <td className="px-4 py-2.5 font-medium text-slate-900">
                      {s.prefix}{s.firstName} {s.lastName}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {s.gender === 'ชาย' || s.gender === 'ช' ? 'ชาย' : 'หญิง'}
                    </td>
                    <td className="px-3 py-2.5 text-center">{s.ageYears} ปี</td>
                    
                    {/* Weight Input */}
                    <td className="p-1 bg-rose-50/20">
                      <input
                        type="number"
                        step="0.1"
                        value={cur.weight || ''}
                        onChange={(e) => handleValChange(s.studentId, 'weight', e.target.value)}
                        className="w-full text-center py-1.5 bg-white border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-200 rounded font-semibold text-slate-800"
                      />
                    </td>

                    {/* Height Input */}
                    <td className="p-1 bg-rose-50/20">
                      <input
                        type="number"
                        step="0.5"
                        value={cur.height || ''}
                        onChange={(e) => handleValChange(s.studentId, 'height', e.target.value)}
                        className="w-full text-center py-1.5 bg-white border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-200 rounded font-semibold text-slate-800"
                      />
                    </td>

                    {/* BMI */}
                    <td className="px-3 py-2.5 text-center font-bold text-slate-700">
                      {bmi > 0 ? bmi : '-'}
                    </td>

                    {/* 3 Dept of Health Indices */}
                    <td className="px-3 py-2.5 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-medium border ${getStatusBadge(weightForHeight)}`}>
                        {weightForHeight}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-medium border ${getStatusBadge(heightForAge)}`}>
                        {heightForAge}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-medium border ${getStatusBadge(weightForAge)}`}>
                        {weightForAge}
                      </span>
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
