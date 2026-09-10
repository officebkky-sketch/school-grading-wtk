// src/data/initialSubjects.ts
import { SubjectConfig } from '../types/pp5Types';

export const PRIMARY_SUBJECTS: SubjectConfig[] = [
  { id: 'sub_tha', code: 'ท 11101', name: 'ภาษาไทย', type: 'พื้นฐาน', credits: 5.0, hoursPerYear: 200, fullScoreTerm1: 50, fullScoreTerm2: 50 },
  { id: 'sub_mat', code: 'ค 11101', name: 'คณิตศาสตร์', type: 'พื้นฐาน', credits: 5.0, hoursPerYear: 200, fullScoreTerm1: 50, fullScoreTerm2: 50 },
  { id: 'sub_sci', code: 'ว 11101', name: 'วิทยาศาสตร์และเทคโนโลยี', type: 'พื้นฐาน', credits: 2.0, hoursPerYear: 80, fullScoreTerm1: 50, fullScoreTerm2: 50 },
  { id: 'sub_soc', code: 'ส 11101', name: 'สังคมศึกษา ศาสนาและวัฒนธรรม', type: 'พื้นฐาน', credits: 2.0, hoursPerYear: 80, fullScoreTerm1: 50, fullScoreTerm2: 50 },
  { id: 'sub_his', code: 'ส 11102', name: 'ประวัติศาสตร์', type: 'พื้นฐาน', credits: 1.0, hoursPerYear: 40, fullScoreTerm1: 50, fullScoreTerm2: 50 },
  { id: 'sub_hpe', code: 'พ 11101', name: 'สุขศึกษาและพลศึกษา', type: 'พื้นฐาน', credits: 2.0, hoursPerYear: 80, fullScoreTerm1: 50, fullScoreTerm2: 50 },
  { id: 'sub_art', code: 'ศ 11101', name: 'ศิลปะ', type: 'พื้นฐาน', credits: 2.0, hoursPerYear: 80, fullScoreTerm1: 50, fullScoreTerm2: 50 },
  { id: 'sub_occ', code: 'ง 11101', name: 'การงานอาชีพ', type: 'พื้นฐาน', credits: 1.0, hoursPerYear: 40, fullScoreTerm1: 50, fullScoreTerm2: 50 },
  { id: 'sub_eng', code: 'อ 11101', name: 'ภาษาต่างประเทศ (ภาษาอังกฤษ)', type: 'พื้นฐาน', credits: 4.0, hoursPerYear: 160, fullScoreTerm1: 50, fullScoreTerm2: 50 },
];
