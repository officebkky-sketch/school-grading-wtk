import React, { useState, useMemo } from 'react';
import { StudentProfile, SubjectConfig, StudentScoreRecord, AcademicConfig } from '../types/pp5Types';
import { GradingEngine } from '../engines/gradingEngine';
import { exportToSchoolMISExcel, exportSchoolMIS_SingleSubjectCSV } from '../utils/schoolMisExporter';
import { getBasicSubjectSortWeight } from '../utils/subjectSortUtils';
import { BarChart3, Trophy, GraduationCap, Percent, TrendingUp, FileSpreadsheet, Medal, HelpCircle } from 'lucide-react';

interface Props {
  students: StudentProfile[];
  subjects: SubjectConfig[];
  scores: Record<string, Record<string, StudentScoreRecord>>;
  classLevel: string;
  semester: 1 | 2;
  config: AcademicConfig;
}

export const GradeSummaryAnalyticsTab: React.FC<Props> = ({
  students,
  subjects,
  scores,
  classLevel,
  semester,
  config
}) => {
  // วิธีการจัดลำดับกรณีคะแนนเท่ากัน
  const [rankingMethod, setRankingMethod] = useState<'gpa_rawscore_tiebreaker' | 'gpa_standard'>('gpa_rawscore_tiebreaker');

  const basicSubjects = useMemo(() => {
    return [...subjects.filter(s => s.type === 'พื้นฐาน' || !s.type)].sort(
      (a, b) => getBasicSubjectSortWeight(a.code, a.name) - getBasicSubjectSortWeight(b.code, b.name)
    );
  }, [subjects]);
  const additionalSubjects = useMemo(() => subjects.filter(s => s.type === 'เพิ่มเติม'), [subjects]);
  const activitySubjects = useMemo(() => subjects.filter(s => s.type === 'กิจกรรม'), [subjects]);
  const sortedSubjects = useMemo(() => [...basicSubjects, ...additionalSubjects, ...activitySubjects], [basicSubjects, additionalSubjects, activitySubjects]);

  // Calculate GPA & Total Raw Score for each student
  const studentGPAs = useMemo(() => {
    return students.map(s => {
      const gradeList: { grade: string; credits: number }[] = [];
      const subjectGrades: Record<string, string> = {};
      let totalRawScore = 0;
      let hasAnyRawScore = false;

      sortedSubjects.forEach(sub => {
        const rec = scores[sub.id]?.[s.studentId];
        const gr = rec?.grade && rec.grade !== '-' ? rec.grade : '-';
        subjectGrades[sub.id] = gr;
        if (gr !== '-') {
          gradeList.push({ grade: gr, credits: sub.credits });
        }
        const sc = rec?.yearlyTotal ?? rec?.total1;
        if (sc !== undefined && sc !== null && !isNaN(sc)) {
          totalRawScore += sc;
          hasAnyRawScore = true;
        }
      });

      const hasAnyGrade = gradeList.length > 0;
      const gpa = hasAnyGrade ? GradingEngine.calculateGPA(gradeList) : null;
      return {
        student: s,
        subjectGrades,
        gpa,
        totalRawScore: hasAnyRawScore ? totalRawScore : null
      };
    });
  }, [students, sortedSubjects, scores]);

  // คำนวณอันดับที่ (Ranking) รองรับทั้งแบบตัดเชือกด้วยคะแนนดิบ และแบบอันดับร่วม สพฐ.
  const rankingMap = useMemo(() => {
    return GradingEngine.calculateRankings(
      studentGPAs.map(sg => ({
        studentId: sg.student.studentId,
        gpa: sg.gpa,
        totalRawScore: sg.totalRawScore
      })),
      rankingMethod
    );
  }, [studentGPAs, rankingMethod]);

  // Class analytics
  const validGPAs = studentGPAs.map(sg => sg.gpa).filter((g): g is number => g !== null && g > 0);
  const avgGPA = validGPAs.length > 0 
    ? Math.round((validGPAs.reduce((a, b) => a + b, 0) / validGPAs.length) * 100) / 100 
    : 0;
  const maxGPA = validGPAs.length > 0 ? Math.max(...validGPAs) : 0;
  const minGPA = validGPAs.length > 0 ? Math.min(...validGPAs) : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner & GPA Stats */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-indigo-600" />
              สรุปผลสัมฤทธิ์ทางการเรียนและเกรดเฉลี่ย (GPA) ชั้น {classLevel}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              สรุปผลการเรียนจำแนกตามรายวิชาพื้นฐานและรายวิชาเพิ่มเติม พร้อมคำนวณผลการเรียนเฉลี่ยสะสม (GPA) ตามระเบียบการวัดและประเมินผล สพฐ.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                sortedSubjects.forEach((sub, idx) => {
                  setTimeout(() => {
                    exportSchoolMIS_SingleSubjectCSV(students, sub, scores[sub.id] || {}, config);
                  }, idx * 100);
                });
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
              title="ส่งออกไฟล์ CSV สำหรับนำเข้า SchoolMIS ทีละรายวิชา"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>ส่งออก SchoolMIS CSV</span>
            </button>

            <button
              onClick={() => exportToSchoolMISExcel(students, sortedSubjects, scores, config)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>ส่งออก Excel รวมชั้น</span>
            </button>
          </div>
        </div>

        {/* Analytics Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100 text-center">
          <div className="bg-indigo-50/60 p-3 rounded-lg border border-indigo-100">
            <div className="text-xs text-indigo-700 font-medium">เกรดเฉลี่ยรวมทั้งห้อง</div>
            <div className="text-2xl font-black text-indigo-900 mt-0.5">{avgGPA.toFixed(2)}</div>
          </div>
          <div className="bg-emerald-50/60 p-3 rounded-lg border border-emerald-100">
            <div className="text-xs text-emerald-700 font-medium">GPA สูงสุด</div>
            <div className="text-2xl font-black text-emerald-900 mt-0.5">{maxGPA.toFixed(2)}</div>
          </div>
          <div className="bg-amber-50/60 p-3 rounded-lg border border-amber-100">
            <div className="text-xs text-amber-700 font-medium">GPA ต่ำสุด</div>
            <div className="text-2xl font-black text-amber-900 mt-0.5">{minGPA.toFixed(2)}</div>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="text-xs text-slate-600 font-medium">นักเรียนทั้งหมด</div>
            <div className="text-2xl font-black text-slate-800 mt-0.5">{students.length} คน</div>
          </div>
        </div>
      </div>

      {/* Main Matrix Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-slate-500" />
            <h3 className="font-bold text-slate-800 text-sm">
              ตารางสรุปเกรดและคะแนนรายบุคคล ({students.length} คน • พื้นฐาน {basicSubjects.length} วิชา • เพิ่มเติม {additionalSubjects.length} วิชา)
            </h3>
          </div>

          {/* Ranking Rule Selector */}
          <div className="flex items-center gap-4 text-xs">
            <span className="text-slate-500 flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              เกณฑ์จัดลำดับที่:
            </span>
            <label className="inline-flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
              <input
                type="radio"
                name="rankingMethod"
                value="gpa_rawscore_tiebreaker"
                checked={rankingMethod === 'gpa_rawscore_tiebreaker'}
                onChange={() => setRankingMethod('gpa_rawscore_tiebreaker')}
                className="text-emerald-600 focus:ring-emerald-500"
              />
              <span>คะแนนดิบตัดสิน (ไม่มีที่ซ้ำ)</span>
            </label>
            <label className="inline-flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
              <input
                type="radio"
                name="rankingMethod"
                value="gpa_standard"
                checked={rankingMethod === 'gpa_standard'}
                onChange={() => setRankingMethod('gpa_standard')}
                className="text-emerald-600 focus:ring-emerald-500"
              />
              <span>อันดับร่วมตามมาตรฐาน สพฐ. (1, 2, 2, 4)</span>
            </label>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase text-xs">
              {/* Row 1: Group Category Headers */}
              <tr>
                <th rowSpan={2} className="px-3 py-2 text-center w-12 border-r border-slate-200">เลขที่</th>
                <th rowSpan={2} className="px-3 py-2 text-center w-20 border-r border-slate-200">รหัส</th>
                <th rowSpan={2} className="px-4 py-2 border-r border-slate-200 min-w-[170px]">ชื่อ - นามสกุล</th>
                
                {basicSubjects.length > 0 && (
                  <th colSpan={basicSubjects.length} className="py-1 px-2 text-center border-r border-slate-200 bg-emerald-50 text-emerald-900 font-bold text-[11px]">
                    รายวิชาพื้นฐาน ({basicSubjects.length} วิชา)
                  </th>
                )}
                {additionalSubjects.length > 0 && (
                  <th colSpan={additionalSubjects.length} className="py-1 px-2 text-center border-r border-slate-200 bg-blue-50 text-blue-900 font-bold text-[11px]">
                    รายวิชาเพิ่มเติม ({additionalSubjects.length} วิชา)
                  </th>
                )}
                {activitySubjects.length > 0 && (
                  <th colSpan={activitySubjects.length} className="py-1 px-2 text-center border-r border-slate-200 bg-amber-50 text-amber-900 font-bold text-[11px]">
                    กิจกรรม ({activitySubjects.length} วิชา)
                  </th>
                )}

                <th rowSpan={2} className="px-3 py-2 text-center w-24 border-r border-slate-200 bg-slate-100/70 text-slate-800 font-bold">
                  คะแนนรวม
                </th>
                <th rowSpan={2} className="px-3 py-2 text-center w-24 border-r border-slate-200 bg-indigo-50 text-indigo-950 font-bold">
                  เกรดเฉลี่ย (GPA)
                </th>
                <th rowSpan={2} className="px-3 py-2 text-center w-28 bg-amber-50 text-amber-950 font-bold">
                  ลำดับที่ (Rank)
                </th>
              </tr>
              {/* Row 2: Individual Subject Headers */}
              <tr className="bg-slate-50/80">
                {sortedSubjects.map(sub => (
                  <th key={sub.id} className="px-2 py-2 text-center border-r border-slate-200 min-w-[85px]">
                    <div className="font-bold text-slate-800 text-[11px] truncate">{sub.name}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{sub.credits} นก.</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-mono">
              {studentGPAs.map(({ student: s, subjectGrades, gpa, totalRawScore }) => {
                const rankInfo = rankingMap[s.studentId];
                return (
                  <tr key={s.id} className="hover:bg-slate-50 transition">
                    <td className="px-3 py-2.5 text-center font-bold text-slate-800 border-r border-slate-200 font-sans">{s.seq}</td>
                    <td className="px-3 py-2.5 text-center text-slate-500 border-r border-slate-200">{s.studentId}</td>
                    <td className="px-4 py-2.5 font-medium text-slate-900 border-r border-slate-200 font-sans">
                      {s.prefix}{s.firstName} {s.lastName}
                    </td>

                    {/* Subject Grades */}
                    {sortedSubjects.map(sub => {
                      const g = subjectGrades[sub.id] || '-';
                      return (
                        <td key={sub.id} className="px-2 py-2.5 text-center border-r border-slate-200">
                          <span className={`inline-block w-7 py-0.5 rounded text-center text-xs font-bold ${
                            g === '4' ? 'bg-emerald-100 text-emerald-800' :
                            g === '3.5' || g === '3' ? 'bg-teal-100 text-teal-800' :
                            g === '2.5' || g === '2' ? 'bg-blue-100 text-blue-800' :
                            g === '1.5' || g === '1' ? 'bg-amber-100 text-amber-800' :
                            g === '0' ? 'bg-rose-100 text-rose-800' : 'text-slate-400'
                          }`}>
                            {g}
                          </span>
                        </td>
                      );
                    })}

                    {/* Total Raw Score */}
                    <td className="px-3 py-2.5 text-center font-bold text-xs text-slate-800 border-r border-slate-200 bg-slate-50/40">
                      {totalRawScore !== null ? totalRawScore : '-'}
                    </td>

                    {/* GPA */}
                    <td className="px-3 py-2.5 text-center font-bold text-sm bg-indigo-50/50 text-indigo-900 border-r border-slate-200">
                      {gpa !== null ? gpa.toFixed(2) : '-'}
                    </td>

                    {/* Rank */}
                    <td className="px-3 py-2.5 text-center font-bold text-xs bg-amber-50/50 text-slate-900">
                      {rankInfo && rankInfo.rank !== '-' ? (
                        <span className="inline-flex items-center gap-1 font-sans">
                          {rankInfo.rank === 1 && <span>🥇</span>}
                          {rankInfo.rank === 2 && <span>🥈</span>}
                          {rankInfo.rank === 3 && <span>🥉</span>}
                          <span>ที่ {rankInfo.rank}</span>
                          {rankInfo.isTie && (
                            <span className="text-[10px] text-amber-800 bg-amber-200/80 px-1 py-0.2 rounded font-normal">
                              ร่วม
                            </span>
                          )}
                        </span>
                      ) : (
                        '-'
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
  );
};
