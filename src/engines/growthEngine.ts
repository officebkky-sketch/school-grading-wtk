// src/engines/growthEngine.ts

export interface NutritionEvaluation {
  bmi: number;
  weightForHeight: 'ผอมมาก' | 'ผอม' | 'สมส่วน' | 'ท้วม' | 'เริ่มอ้วน' | 'อ้วน';
  heightForAge: 'สูงกว่าเกณฑ์' | 'ค่อนข้างสูง' | 'สูงตามเกณฑ์' | 'ค่อนข้างเตี้ย' | 'เตี้ย';
  weightForAge: 'น้ำหนักเกินเกณฑ์' | 'ค่อนข้างมาก' | 'น้ำหนักตามเกณฑ์' | 'ค่อนข้างน้อย' | 'น้ำหนักน้อยกว่าเกณฑ์';
  summaryStatus: string;
}

export class GrowthEngine {
  /**
   * คำนวณ BMI
   */
  public static calculateBMI(weightKg: number, heightCm: number): number {
    if (heightCm <= 0 || weightKg <= 0) return 0;
    const heightM = heightCm / 100;
    return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
  }

  /**
   * ประเมินภาวะการเจริญเติบโตตามเกณฑ์อ้างอิงกรมอนามัย (กระทรวงสาธารณสุข)
   */
  public static evaluateGrowth(
    gender: 'ชาย' | 'หญิง' | 'ช' | 'ญ',
    ageYears: number,
    weightKg: number,
    heightCm: number
  ): NutritionEvaluation {
    const bmi = this.calculateBMI(weightKg, heightCm);
    const isMale = gender === 'ชาย' || gender === 'ช';

    // 1. น้ำหนักตามเกณฑ์ส่วนสูง (Weight for Height) อ้างอิงอัตราส่วนมาตรฐาน
    let weightForHeight: NutritionEvaluation['weightForHeight'] = 'สมส่วน';
    if (bmi < 13.5) weightForHeight = 'ผอมมาก';
    else if (bmi < 15.0) weightForHeight = 'ผอม';
    else if (bmi <= 18.5) weightForHeight = 'สมส่วน';
    else if (bmi <= 21.0) weightForHeight = 'ท้วม';
    else if (bmi <= 24.0) weightForHeight = 'เริ่มอ้วน';
    else weightForHeight = 'อ้วน';

    // 2. ส่วนสูงตามเกณฑ์อายุ (Height for Age)
    // เกณฑ์มัธยฐานส่วนสูงคร่าวๆ เด็กไทย: อายุ 6 = 115 ซม., อายุ 12 = 148 ซม.
    const expectedHeight = isMale ? (ageYears * 5.5 + 80) : (ageYears * 5.7 + 78);
    let heightForAge: NutritionEvaluation['heightForAge'] = 'สูงตามเกณฑ์';
    const heightDiff = heightCm - expectedHeight;
    if (heightDiff > 10) heightForAge = 'สูงกว่าเกณฑ์';
    else if (heightDiff > 4) heightForAge = 'ค่อนข้างสูง';
    else if (heightDiff >= -4) heightForAge = 'สูงตามเกณฑ์';
    else if (heightDiff >= -10) heightForAge = 'ค่อนข้างเตี้ย';
    else heightForAge = 'เตี้ย';

    // 3. น้ำหนักตามเกณฑ์อายุ (Weight for Age)
    const expectedWeight = isMale ? (ageYears * 2.5 + 8) : (ageYears * 2.4 + 8);
    let weightForAge: NutritionEvaluation['weightForAge'] = 'น้ำหนักตามเกณฑ์';
    const weightDiff = weightKg - expectedWeight;
    if (weightDiff > 8) weightForAge = 'น้ำหนักเกินเกณฑ์';
    else if (weightDiff > 3) weightForAge = 'ค่อนข้างมาก';
    else if (weightDiff >= -3) weightForAge = 'น้ำหนักตามเกณฑ์';
    else if (weightDiff >= -6) weightForAge = 'ค่อนข้างน้อย';
    else weightForAge = 'น้ำหนักน้อยกว่าเกณฑ์';

    const summaryStatus = `${weightForHeight} / ${heightForAge}`;

    return {
      bmi,
      weightForHeight,
      heightForAge,
      weightForAge,
      summaryStatus
    };
  }
}
