// src/engines/gradingEngine.ts

export interface GradeStatResult {
  count: number;
  mean: number;
  sd: number;
  min: number;
  max: number;
  passCount: number;
  passPercent: number;
  gradeDistribution: Record<string, number>;
}

export class GradingEngine {
  /**
   * ตัดเกรดตามเกณฑ์ สพฐ. 8 ระดับ (0 - 4)
   */
  public static calculateGrade(score: number | null, isEligible: boolean = true, isPending: boolean = false): string {
    if (isPending) return 'ร';
    if (!isEligible) return 'มส';
    if (score === null || isNaN(score)) return '-';

    const rounded = Math.round(score * 100) / 100;

    if (rounded >= 80) return '4';
    if (rounded >= 75) return '3.5';
    if (rounded >= 70) return '3';
    if (rounded >= 65) return '2.5';
    if (rounded >= 60) return '2';
    if (rounded >= 55) return '1.5';
    if (rounded >= 50) return '1';
    return '0';
  }

  /**
   * แปลงเกรดตัวอักษรเป็นค่าตัวเลขเพื่อคิด GPA
   */
  public static gradeToNumeric(grade: string): number | null {
    const val = parseFloat(grade);
    return isNaN(val) ? null : val;
  }

  /**
   * คำนวณ GPA ถ่วงน้ำหนักด้วยหน่วยกิต
   */
  public static calculateGPA(grades: { grade: string; credits: number }[]): number {
    let totalScore = 0;
    let totalCredits = 0;

    for (const g of grades) {
      const numGrade = this.gradeToNumeric(g.grade);
      if (numGrade !== null && g.credits > 0) {
        totalScore += numGrade * g.credits;
        totalCredits += g.credits;
      }
    }

    if (totalCredits === 0) return 0;
    return Math.round((totalScore / totalCredits) * 100) / 100;
  }

  /**
   * คำนวณค่าสถิติ Mean, SD, Min, Max และการกระจายเกรด
   */
  public static calculateStatistics(scores: (number | null)[]): GradeStatResult {
    const validScores = scores.filter((s): s is number => s !== null && !isNaN(s));
    const count = validScores.length;

    const distribution: Record<string, number> = {
      '4': 0, '3.5': 0, '3': 0, '2.5': 0, '2': 0, '1.5': 0, '1': 0, '0': 0, 'ร': 0, 'มส': 0
    };

    if (count === 0) {
      return {
        count: 0,
        mean: 0,
        sd: 0,
        min: 0,
        max: 0,
        passCount: 0,
        passPercent: 0,
        gradeDistribution: distribution
      };
    }

    const sum = validScores.reduce((acc, val) => acc + val, 0);
    const mean = Math.round((sum / count) * 100) / 100;

    // Sample Standard Deviation
    let varianceSum = 0;
    for (const val of validScores) {
      varianceSum += Math.pow(val - mean, 2);
    }
    const sd = count > 1 ? Math.round(Math.sqrt(varianceSum / (count - 1)) * 100) / 100 : 0;

    const min = Math.min(...validScores);
    const max = Math.max(...validScores);

    let passCount = 0;
    for (const s of validScores) {
      const g = this.calculateGrade(s);
      if (distribution[g] !== undefined) {
        distribution[g]++;
      }
      if (s >= 50) passCount++;
    }

    const passPercent = Math.round((passCount / count) * 10000) / 100;

    return {
      count,
      mean,
      sd,
      min,
      max,
      passCount,
      passPercent,
      gradeDistribution: distribution
    };
  }

  /**
   * คำนวณการจัดลำดับที่ (Ranking) ตามระเบียบ สพฐ.
   * @param items รายชื่อนักเรียนพร้อม GPA และคะแนนรวมดิบ
   * @param method รูปแบบการจัดอันดับ:
   *   - 'gpa_rawscore_tiebreaker' (แนะนำ): เรียงตาม GPA หาก GPA เท่ากัน ให้ตัดเชือกด้วยคะแนนรวมดิบ ถ้าคะแนนดิบเท่ากันจึงได้อันดับร่วม
   *   - 'gpa_standard': เรียงตาม GPA หากเท่ากันได้อันดับร่วม (1, 2, 2, 4) ตามมาตรฐาน สพฐ.
   *   - 'rawscore_standard': เรียงตามคะแนนรวมดิบทั้งหมด หากเท่ากันได้อันดับร่วม
   */
  public static calculateRankings(
    items: { studentId: string; gpa: number | null; totalRawScore?: number | null }[],
    method: 'gpa_rawscore_tiebreaker' | 'gpa_standard' | 'rawscore_standard' = 'gpa_rawscore_tiebreaker'
  ): Record<string, { studentId: string; gpa: number | null; totalRawScore: number | null; rank: number | string; isTie: boolean }> {
    const validItems = items.filter(it => it.gpa !== null || (it.totalRawScore !== undefined && it.totalRawScore !== null));

    const sorted = [...validItems].sort((a, b) => {
      const gpaA = a.gpa ?? -1;
      const gpaB = b.gpa ?? -1;
      const rawA = a.totalRawScore ?? -1;
      const rawB = b.totalRawScore ?? -1;

      if (method === 'rawscore_standard') {
        return rawB - rawA;
      }

      if (method === 'gpa_rawscore_tiebreaker') {
        if (gpaB !== gpaA) {
          return gpaB - gpaA;
        }
        return rawB - rawA;
      }

      return gpaB - gpaA;
    });

    const resultMap: Record<string, { studentId: string; gpa: number | null; totalRawScore: number | null; rank: number | string; isTie: boolean }> = {};
    let currentRank = 1;

    sorted.forEach((item, idx) => {
      if (idx > 0) {
        const prev = sorted[idx - 1];
        let isEqual = false;

        if (method === 'gpa_standard') {
          isEqual = item.gpa === prev.gpa;
        } else if (method === 'gpa_rawscore_tiebreaker') {
          isEqual = item.gpa === prev.gpa && item.totalRawScore === prev.totalRawScore;
        } else if (method === 'rawscore_standard') {
          isEqual = item.totalRawScore === prev.totalRawScore;
        }

        if (!isEqual) {
          currentRank = idx + 1;
        }
      }

      resultMap[item.studentId] = {
        studentId: item.studentId,
        gpa: item.gpa,
        totalRawScore: item.totalRawScore ?? null,
        rank: currentRank,
        isTie: false
      };
    });

    // หาว่าใครได้อันดับร่วม (Tie)
    const rankCounts: Record<number, number> = {};
    Object.values(resultMap).forEach(res => {
      if (typeof res.rank === 'number') {
        rankCounts[res.rank] = (rankCounts[res.rank] || 0) + 1;
      }
    });

    Object.values(resultMap).forEach(res => {
      if (typeof res.rank === 'number' && rankCounts[res.rank] > 1) {
        res.isTie = true;
      }
    });

    items.forEach(it => {
      if (!resultMap[it.studentId]) {
        resultMap[it.studentId] = {
          studentId: it.studentId,
          gpa: it.gpa,
          totalRawScore: it.totalRawScore ?? null,
          rank: '-',
          isTie: false
        };
      }
    });

    return resultMap;
  }
}
