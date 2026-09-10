// src/data/classSubjectsData.ts
import { SubjectConfig } from '../types/pp5Types';

export const CLASS_SUBJECTS_MAP: Record<string, SubjectConfig[]> = {
  'ป.1': [
    { id: 'sub_p1_tha', code: 'ท 11101', name: 'ภาษาไทย', type: 'พื้นฐาน', credits: 5.0, hoursPerYear: 200, fullScoreTerm1: 50, fullScoreTerm2: 50 },
    { id: 'sub_p1_mat', code: 'ค 11101', name: 'คณิตศาสตร์', type: 'พื้นฐาน', credits: 5.0, hoursPerYear: 200, fullScoreTerm1: 50, fullScoreTerm2: 50 },
    { id: 'sub_p1_sci', code: 'ว 11101', name: 'วิทยาศาสตร์และเทคโนโลยี', type: 'พื้นฐาน', credits: 2.0, hoursPerYear: 80, fullScoreTerm1: 50, fullScoreTerm2: 50 },
    { id: 'sub_p1_soc', code: 'ส 11101', name: 'สังคมศึกษา ศาสนาและวัฒนธรรม', type: 'พื้นฐาน', credits: 2.0, hoursPerYear: 80, fullScoreTerm1: 50, fullScoreTerm2: 50 },
    { id: 'sub_p1_his', code: 'ส 11102', name: 'ประวัติศาสตร์', type: 'พื้นฐาน', credits: 1.0, hoursPerYear: 40, fullScoreTerm1: 50, fullScoreTerm2: 50 },
    { id: 'sub_p1_hpe', code: 'พ 11101', name: 'สุขศึกษาและพลศึกษา', type: 'พื้นฐาน', credits: 2.0, hoursPerYear: 80, fullScoreTerm1: 50, fullScoreTerm2: 50 },
    { id: 'sub_p1_art', code: 'ศ 11101', name: 'ศิลปะ', type: 'พื้นฐาน', credits: 2.0, hoursPerYear: 80, fullScoreTerm1: 50, fullScoreTerm2: 50 },
    { id: 'sub_p1_occ', code: 'ง 11101', name: 'การงานอาชีพ', type: 'พื้นฐาน', credits: 1.0, hoursPerYear: 40, fullScoreTerm1: 50, fullScoreTerm2: 50 },
    { id: 'sub_p1_eng', code: 'อ 11101', name: 'ภาษาอังกฤษ', type: 'พื้นฐาน', credits: 4.0, hoursPerYear: 160, fullScoreTerm1: 50, fullScoreTerm2: 50 },
    { id: 'sub_p1_civ', code: 'ส 11231', name: 'หน้าที่พลเมือง', type: 'เพิ่มเติม', credits: 1.0, hoursPerYear: 40, fullScoreTerm1: 50, fullScoreTerm2: 50 },
    { id: 'sub_p1_eng_ext', code: 'อ 11102', name: 'ภาษาอังกฤษเพิ่มเติม', type: 'เพิ่มเติม', credits: 1.0, hoursPerYear: 40, fullScoreTerm1: 50, fullScoreTerm2: 50 },
  ],

  'ป.2': [
    { id: 'sub_p2_tha', code: 'ท 12101', name: 'ภาษาไทย', type: 'พื้นฐาน', credits: 5.0, hoursPerYear: 200, fullScoreTerm1: 50, fullScoreTerm2: 50 },
    { id: 'sub_p2_mat', code: 'ค 12101', name: 'คณิตศาสตร์', type: 'พื้นฐาน', credits: 5.0, hoursPerYear: 200, fullScoreTerm1: 50, fullScoreTerm2: 50 },
    { id: 'sub_p2_sci', code: 'ว 12101', name: 'วิทยาศาสตร์และเทคโนโลยี', type: 'พื้นฐาน', credits: 2.0, hoursPerYear: 80, fullScoreTerm1: 50, fullScoreTerm2: 50 },
    { id: 'sub_p2_soc', code: 'ส 12101', name: 'สังคมศึกษา ศาสนาและวัฒนธรรม', type: 'พื้นฐาน', credits: 2.0, hoursPerYear: 80, fullScoreTerm1: 50, fullScoreTerm2: 50 },
    { id: 'sub_p2_his', code: 'ส 12102', name: 'ประวัติศาสตร์', type: 'พื้นฐาน', credits: 1.0, hoursPerYear: 40, fullScoreTerm1: 50, fullScoreTerm2: 50 },
    { id: 'sub_p2_hpe', code: 'พ 12101', name: 'สุขศึกษาและพลศึกษา', type: 'พื้นฐาน', credits: 2.0, hoursPerYear: 80, fullScoreTerm1: 50, fullScoreTerm2: 50 },
    { id: 'sub_p2_art', code: 'ศ 12101', name: 'ศิลปะ', type: 'พื้นฐาน', credits: 2.0, hoursPerYear: 80, fullScoreTerm1: 50, fullScoreTerm2: 50 },
    { id: 'sub_p2_occ', code: 'ง 12101', name: 'การงานอาชีพ', type: 'พื้นฐาน', credits: 1.0, hoursPerYear: 40, fullScoreTerm1: 50, fullScoreTerm2: 50 },
    { id: 'sub_p2_eng', code: 'อ 12101', name: 'ภาษาอังกฤษ', type: 'พื้นฐาน', credits: 4.0, hoursPerYear: 160, fullScoreTerm1: 50, fullScoreTerm2: 50 },
    { id: 'sub_p2_civ', code: 'ส 12232', name: 'หน้าที่พลเมือง', type: 'เพิ่มเติม', credits: 1.0, hoursPerYear: 40, fullScoreTerm1: 50, fullScoreTerm2: 50 },
    { id: 'sub_p2_tha_fun', code: 'ท 12102', name: 'ภาษาไทยหรรษา', type: 'เพิ่มเติม', credits: 1.0, hoursPerYear: 40, fullScoreTerm1: 50, fullScoreTerm2: 50 },
  ],

  'ป.3': [
    { id: 'sub_p3_tha', code: 'ท 13101', name: 'ภาษาไทย', type: 'พื้นฐาน', credits: 5.0, hoursPerYear: 200, fullScoreTerm1: 50, fullScoreTerm2: 50 },
    { id: 'sub_p3_mat', code: 'ค 13101', name: 'คณิตศาสตร์', type: 'พื้นฐาน', credits: 5.0, hoursPerYear: 200, fullScoreTerm1: 50, fullScoreTerm2: 50 },
    { id: 'sub_p3_sci', code: 'ว 13101', name: 'วิทยาศาสตร์และเทคโนโลยี', type: 'พื้นฐาน', credits: 2.0, hoursPerYear: 80, fullScoreTerm1: 50, fullScoreTerm2: 50 },
    { id: 'sub_p3_soc', code: 'ส 13101', name: 'สังคมศึกษา ศาสนาและวัฒนธรรม', type: 'พื้นฐาน', credits: 2.0, hoursPerYear: 80, fullScoreTerm1: 50, fullScoreTerm2: 50 },
    { id: 'sub_p3_his', code: 'ส 13102', name: 'ประวัติศาสตร์', type: 'พื้นฐาน', credits: 1.0, hoursPerYear: 40, fullScoreTerm1: 50, fullScoreTerm2: 50 },
    { id: 'sub_p3_hpe', code: 'พ 13101', name: 'สุขศึกษาและพลศึกษา', type: 'พื้นฐาน', credits: 2.0, hoursPerYear: 80, fullScoreTerm1: 50, fullScoreTerm2: 50 },
    { id: 'sub_p3_art', code: 'ศ 13101', name: 'ศิลปะ', type: 'พื้นฐาน', credits: 2.0, hoursPerYear: 80, fullScoreTerm1: 50, fullScoreTerm2: 50 },
    { id: 'sub_p3_occ', code: 'ง 13101', name: 'การงานอาชีพ', type: 'พื้นฐาน', credits: 1.0, hoursPerYear: 40, fullScoreTerm1: 50, fullScoreTerm2: 50 },
    { id: 'sub_p3_eng', code: 'อ 13101', name: 'ภาษาอังกฤษ', type: 'พื้นฐาน', credits: 4.0, hoursPerYear: 160, fullScoreTerm1: 50, fullScoreTerm2: 50 },
    { id: 'sub_p3_civ', code: 'ส 13201', name: 'หน้าที่พลเมือง', type: 'เพิ่มเติม', credits: 1.0, hoursPerYear: 40, fullScoreTerm1: 50, fullScoreTerm2: 50 },
    { id: 'sub_p3_eng_com', code: 'อ 13201', name: 'ภาษาอังกฤษเพื่อการสื่อสาร', type: 'เพิ่มเติม', credits: 1.0, hoursPerYear: 40, fullScoreTerm1: 50, fullScoreTerm2: 50 },
  ],

  'ป.4': [
    { id: 'sub_p4_tha', code: 'ท 14101', name: 'ภาษาไทย', type: 'พื้นฐาน', credits: 4.0, hoursPerYear: 160, fullScoreTerm1: 50, fullScoreTerm2: 50 },
    { id: 'sub_p4_mat', code: 'ค 14101', name: 'คณิตศาสตร์', type: 'พื้นฐาน', credits: 4.0, hoursPerYear: 160, fullScoreTerm1: 50, fullScoreTerm2: 50 },
    { id: 'sub_p4_sci', code: 'ว 14101', name: 'วิทยาศาสตร์และเทคโนโลยี', type: 'พื้นฐาน', credits: 3.0, hoursPerYear: 120, fullScoreTerm1: 50, fullScoreTerm2: 50 },
    { id: 'sub_p4_soc', code: 'ส 14101', name: 'สังคมศึกษา ศาสนาและวัฒนธรรม', type: 'พื้นฐาน', credits: 2.0, hoursPerYear: 80, fullScoreTerm1: 50, fullScoreTerm2: 50 },
    { id: 'sub_p4_his', code: 'ส 14102', name: 'ประวัติศาสตร์', type: 'พื้นฐาน', credits: 1.0, hoursPerYear: 40, fullScoreTerm1: 50, fullScoreTerm2: 50 },
    { id: 'sub_p4_hpe', code: 'พ 14101', name: 'สุขศึกษาและพลศึกษา', type: 'พื้นฐาน', credits: 2.0, hoursPerYear: 80, fullScoreTerm1: 50, fullScoreTerm2: 50 },
    { id: 'sub_p4_art', code: 'ศ 14101', name: 'ศิลปะ', type: 'พื้นฐาน', credits: 2.0, hoursPerYear: 80, fullScoreTerm1: 50, fullScoreTerm2: 50 },
    { id: 'sub_p4_occ', code: 'ง 14101', name: 'การงานอาชีพ', type: 'พื้นฐาน', credits: 2.0, hoursPerYear: 80, fullScoreTerm1: 50, fullScoreTerm2: 50 },
    { id: 'sub_p4_eng', code: 'อ 14101', name: 'ภาษาอังกฤษ', type: 'พื้นฐาน', credits: 3.0, hoursPerYear: 120, fullScoreTerm1: 50, fullScoreTerm2: 50 },
    { id: 'sub_p4_civ', code: 'ส 14234', name: 'หน้าที่พลเมือง', type: 'เพิ่มเติม', credits: 1.0, hoursPerYear: 40, fullScoreTerm1: 50, fullScoreTerm2: 50 },
    { id: 'sub_p4_eng_com', code: 'อ 14201', name: 'ภาษาอังกฤษเพื่อการสื่อสาร', type: 'เพิ่มเติม', credits: 1.0, hoursPerYear: 40, fullScoreTerm1: 50, fullScoreTerm2: 50 },
  ],

  'ป.5': [
    { id: 'sub_p5_tha', code: 'ท 15101', name: 'ภาษาไทย', type: 'พื้นฐาน', credits: 4.0, hoursPerYear: 160, fullScoreTerm1: 50, fullScoreTerm2: 50 },
    { id: 'sub_p5_mat', code: 'ค 15101', name: 'คณิตศาสตร์', type: 'พื้นฐาน', credits: 4.0, hoursPerYear: 160, fullScoreTerm1: 50, fullScoreTerm2: 50 },
    { id: 'sub_p5_sci', code: 'ว 15101', name: 'วิทยาศาสตร์และเทคโนโลยี', type: 'พื้นฐาน', credits: 3.0, hoursPerYear: 120, fullScoreTerm1: 50, fullScoreTerm2: 50 },
    { id: 'sub_p5_soc', code: 'ส 15101', name: 'สังคมศึกษา ศาสนาและวัฒนธรรม', type: 'พื้นฐาน', credits: 2.0, hoursPerYear: 80, fullScoreTerm1: 50, fullScoreTerm2: 50 },
    { id: 'sub_p5_his', code: 'ส 15102', name: 'ประวัติศาสตร์', type: 'พื้นฐาน', credits: 1.0, hoursPerYear: 40, fullScoreTerm1: 50, fullScoreTerm2: 50 },
    { id: 'sub_p5_hpe', code: 'พ 15101', name: 'สุขศึกษาและพลศึกษา', type: 'พื้นฐาน', credits: 2.0, hoursPerYear: 80, fullScoreTerm1: 50, fullScoreTerm2: 50 },
    { id: 'sub_p5_art', code: 'ศ 15101', name: 'ศิลปะ', type: 'พื้นฐาน', credits: 2.0, hoursPerYear: 80, fullScoreTerm1: 50, fullScoreTerm2: 50 },
    { id: 'sub_p5_occ', code: 'ง 15101', name: 'การงานอาชีพ', type: 'พื้นฐาน', credits: 2.0, hoursPerYear: 80, fullScoreTerm1: 50, fullScoreTerm2: 50 },
    { id: 'sub_p5_eng', code: 'อ 15101', name: 'ภาษาอังกฤษ', type: 'พื้นฐาน', credits: 3.0, hoursPerYear: 120, fullScoreTerm1: 50, fullScoreTerm2: 50 },
    { id: 'sub_p5_civ', code: 'ส 15201', name: 'หน้าที่พลเมือง', type: 'เพิ่มเติม', credits: 1.0, hoursPerYear: 40, fullScoreTerm1: 50, fullScoreTerm2: 50 },
    { id: 'sub_p5_eng_com', code: 'อ 15201', name: 'ภาษาอังกฤษเพื่อการสื่อสาร', type: 'เพิ่มเติม', credits: 1.0, hoursPerYear: 40, fullScoreTerm1: 50, fullScoreTerm2: 50 },
  ],

  'ป.6': [
    { id: 'sub_p6_tha', code: 'ท 16101', name: 'ภาษาไทย', type: 'พื้นฐาน', credits: 4.0, hoursPerYear: 160, fullScoreTerm1: 50, fullScoreTerm2: 50 },
    { id: 'sub_p6_mat', code: 'ค 16101', name: 'คณิตศาสตร์', type: 'พื้นฐาน', credits: 4.0, hoursPerYear: 160, fullScoreTerm1: 50, fullScoreTerm2: 50 },
    { id: 'sub_p6_sci', code: 'ว 16101', name: 'วิทยาศาสตร์และเทคโนโลยี', type: 'พื้นฐาน', credits: 3.0, hoursPerYear: 120, fullScoreTerm1: 50, fullScoreTerm2: 50 },
    { id: 'sub_p6_soc', code: 'ส 16101', name: 'สังคมศึกษา ศาสนาและวัฒนธรรม', type: 'พื้นฐาน', credits: 2.0, hoursPerYear: 80, fullScoreTerm1: 50, fullScoreTerm2: 50 },
    { id: 'sub_p6_his', code: 'ส 16102', name: 'ประวัติศาสตร์', type: 'พื้นฐาน', credits: 1.0, hoursPerYear: 40, fullScoreTerm1: 50, fullScoreTerm2: 50 },
    { id: 'sub_p6_hpe', code: 'พ 16101', name: 'สุขศึกษาและพลศึกษา', type: 'พื้นฐาน', credits: 2.0, hoursPerYear: 80, fullScoreTerm1: 50, fullScoreTerm2: 50 },
    { id: 'sub_p6_art', code: 'ศ 16101', name: 'ศิลปะ', type: 'พื้นฐาน', credits: 2.0, hoursPerYear: 80, fullScoreTerm1: 50, fullScoreTerm2: 50 },
    { id: 'sub_p6_occ', code: 'ง 16101', name: 'การงานอาชีพ', type: 'พื้นฐาน', credits: 2.0, hoursPerYear: 80, fullScoreTerm1: 50, fullScoreTerm2: 50 },
    { id: 'sub_p6_eng', code: 'อ 16101', name: 'ภาษาอังกฤษ', type: 'พื้นฐาน', credits: 3.0, hoursPerYear: 120, fullScoreTerm1: 50, fullScoreTerm2: 50 },
    { id: 'sub_p6_civ', code: 'ส 16201', name: 'หน้าที่พลเมือง', type: 'เพิ่มเติม', credits: 1.0, hoursPerYear: 40, fullScoreTerm1: 50, fullScoreTerm2: 50 },
    { id: 'sub_p6_eng_com', code: 'อ 16201', name: 'ภาษาอังกฤษเพื่อการสื่อสาร', type: 'เพิ่มเติม', credits: 1.0, hoursPerYear: 40, fullScoreTerm1: 50, fullScoreTerm2: 50 },
  ],

  'อ.2': [
    { id: 'sub_k2_body', code: 'พฐ 01', name: 'พัฒนาการด้านร่างกาย', type: 'พื้นฐาน', credits: 1.0, hoursPerYear: 100, fullScoreTerm1: 50, fullScoreTerm2: 50 },
    { id: 'sub_k2_emo', code: 'พฐ 02', name: 'พัฒนาการด้านอารมณ์และจิตใจ', type: 'พื้นฐาน', credits: 1.0, hoursPerYear: 100, fullScoreTerm1: 50, fullScoreTerm2: 50 },
    { id: 'sub_k2_soc', code: 'พฐ 03', name: 'พัฒนาการด้านสังคม', type: 'พื้นฐาน', credits: 1.0, hoursPerYear: 100, fullScoreTerm1: 50, fullScoreTerm2: 50 },
    { id: 'sub_k2_intel', code: 'พฐ 04', name: 'พัฒนาการด้านสติปัญญา', type: 'พื้นฐาน', credits: 1.0, hoursPerYear: 100, fullScoreTerm1: 50, fullScoreTerm2: 50 },
  ],

  'อ.3': [
    { id: 'sub_k3_body', code: 'พฐ 01', name: 'พัฒนาการด้านร่างกาย', type: 'พื้นฐาน', credits: 1.0, hoursPerYear: 100, fullScoreTerm1: 50, fullScoreTerm2: 50 },
    { id: 'sub_k3_emo', code: 'พฐ 02', name: 'พัฒนาการด้านอารมณ์และจิตใจ', type: 'พื้นฐาน', credits: 1.0, hoursPerYear: 100, fullScoreTerm1: 50, fullScoreTerm2: 50 },
    { id: 'sub_k3_soc', code: 'พฐ 03', name: 'พัฒนาการด้านสังคม', type: 'พื้นฐาน', credits: 1.0, hoursPerYear: 100, fullScoreTerm1: 50, fullScoreTerm2: 50 },
    { id: 'sub_k3_intel', code: 'พฐ 04', name: 'พัฒนาการด้านสติปัญญา', type: 'พื้นฐาน', credits: 1.0, hoursPerYear: 100, fullScoreTerm1: 50, fullScoreTerm2: 50 },
  ]
};
