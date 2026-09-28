// src/data/initialKindergartenData.ts
import { KindergartenStudentAssessment } from '../types/kindergartenTypes';

// ข้อมูลตั้งต้นการประเมินพัฒนาการระดับปฐมวัย (อ.2 และ อ.3) โรงเรียนวัดท่าควาย
export const INITIAL_KINDERGARTEN_ASSESSMENTS: Record<string, Record<string, KindergartenStudentAssessment>> = {
  // key: classLevel (เช่น 'อ.2', 'อ.3') -> key: studentId -> Assessment
  'อ.2': {
    'stu_2992': {
      studentId: 'stu_2992',
      classLevel: 'อ.2',
      academicYear: '2569',
      term: 1,
      standards: {
        1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3, 9: 3, 10: 2, 11: 3, 12: 3
      },
      teacherComment: 'เด็กหญิงกัญญาณัฐ มีพัฒนาการด้านร่างกายและอารมณ์ดีมาก อารมณ์ร่าเริงแจ่มใส ชอบร่วมกิจกรรมดนตรีและศิลปะ มีน้ำใจแบ่งปันของเล่นกับเพื่อนๆ ในห้องเรียน ด้านสติปัญญาสามารถสื่อสารเล่าเรื่องราวได้ดี ควรส่งเสริมทักษะการสังเกตและจำแนกสิ่งของเพิ่มเติมร่วมกับผู้ปกครองค่ะ',
      healthInfo: {
        weight: 17.9,
        height: 112,
        teethCheck: 'ปกติ',
        teethCavitiesCount: 0,
        hairCleanliness: 'สะอาด',
        nailCleanliness: 'สะอาด',
        nutritionStatus: 'สมส่วน',
        growthHeightStatus: 'สูงตามเกณฑ์'
      },
      attendance: {
        presentDays: 96,
        totalDays: 100,
        leaveDays: 2,
        sickDays: 2
      }
    },
    'stu_2993': {
      studentId: 'stu_2993',
      classLevel: 'อ.2',
      academicYear: '2569',
      term: 1,
      standards: {
        1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 3, 8: 3, 9: 3, 10: 3, 11: 3, 12: 3
      },
      teacherComment: 'เด็กชายกฤตพัฒน์ ร่างกายแข็งแรง คล่องแคล่ว มีความมั่นใจในตนเอง ช่างซักถามและมีความกระตือรือร้นในการทำกิจกรรมกลุ่ม เข้ากับเพื่อนได้ดีมากค่ะ',
      healthInfo: {
        weight: 18.5,
        height: 110,
        teethCheck: 'ปกติ',
        teethCavitiesCount: 0,
        hairCleanliness: 'สะอาด',
        nailCleanliness: 'สะอาด',
        nutritionStatus: 'สมส่วน',
        growthHeightStatus: 'สูงตามเกณฑ์'
      },
      attendance: {
        presentDays: 97,
        totalDays: 100,
        leaveDays: 2,
        sickDays: 1
      }
    }
  },
  'อ.3': {
    'stu_2978': {
      studentId: 'stu_2978',
      classLevel: 'อ.3',
      academicYear: '2569',
      term: 1,
      standards: {
        1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3, 9: 3, 10: 3, 11: 3, 12: 3
      },
      teacherComment: 'เด็กชายกฤตภัค มีพัฒนาการสมวัยทั้ง 4 ด้านอย่างดีเยี่ยม ร่างกายแข็งแรง คล่องแคล่ว มีความเป็นผู้นำ ช่วยเหลือคุณครูและเพื่อนๆ ได้ดี มีความกระตือรือร้นในการเรียนรู้และแก้ปัญหาได้ด้วยตนเอง มีมารยาทดีมากค่ะ',
      healthInfo: {
        weight: 15.2,
        height: 113,
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
    },
    'stu_2979': {
      studentId: 'stu_2979',
      classLevel: 'อ.3',
      academicYear: '2569',
      term: 1,
      standards: {
        1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3, 7: 3, 8: 2, 9: 3, 10: 2, 11: 3, 12: 3
      },
      teacherComment: 'เด็กชายจักรภัทร มีความสุขในการร่วมกิจกรรม ร่าเริง อัธยาศัยดี มีความคิดสร้างสรรค์ในการวาดภาพระบายสีและเล่านิทาน ควรส่งเสริมการฝึกสมาธิในการทำงานศิลปะต่อเนื่องร่วมกับครอบครัวค่ะ',
      healthInfo: {
        weight: 16.0,
        height: 111,
        teethCheck: 'ปกติ',
        teethCavitiesCount: 0,
        hairCleanliness: 'สะอาด',
        nailCleanliness: 'สะอาด',
        nutritionStatus: 'สมส่วน',
        growthHeightStatus: 'สูงตามเกณฑ์'
      },
      attendance: {
        presentDays: 95,
        totalDays: 100,
        leaveDays: 3,
        sickDays: 2
      }
    }
  }
};
