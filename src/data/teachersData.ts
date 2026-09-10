// src/data/teachersData.ts

export interface TeacherProfile {
  id: string;
  name: string;
  role: 'academic_head' | 'homeroom_teacher' | 'director';
  roleTitle: string;
  assignedClasses: string[]; // e.g. ['ป.1'] or ['*'] for all classes
  phoneNumber?: string;
}

export const AUTHENTIC_DIRECTOR: TeacherProfile = {
  id: '00239ad8-1227-4a33-b309-00e321bf2059',
  name: 'นางจันทวรรณ พิทักษ์ฉนวน',
  role: 'director',
  roleTitle: 'ผู้อำนวยการโรงเรียน',
  assignedClasses: ['*']
};

export const DEFAULT_TEACHERS: TeacherProfile[] = [
  AUTHENTIC_DIRECTOR,
  {
    id: 'ac868b51-4ea9-4345-9bda-01aefd8e73da',
    name: 'นางสุมาวดี สมบูรณ์',
    role: 'academic_head',
    roleTitle: 'หัวหน้าฝ่ายวิชาการ',
    assignedClasses: ['*']
  },
  {
    id: 'cd5e89db-8734-42e3-bf7f-3fa6c1be7147',
    name: 'นายไพโรจน์ มากแก้ว',
    role: 'academic_head',
    roleTitle: 'เจ้าหน้าที่ธุรการ / งานสารสนเทศ',
    assignedClasses: ['*']
  },
  {
    id: '886da97f-79f5-4738-b925-aa9f895df155',
    name: 'นางสาวจีรนุช พรหมเหมือน',
    role: 'homeroom_teacher',
    roleTitle: 'ครูผู้สอน',
    assignedClasses: ['*']
  },
  {
    id: '3bede278-c30a-415e-8f2e-ba034ba3bf36',
    name: 'นางฑิฆัมพร เพ็งแก้ว',
    role: 'homeroom_teacher',
    roleTitle: 'ครูผู้สอน',
    assignedClasses: ['*']
  },
  {
    id: '7bd0ff17-dc71-4296-bbe5-408d0c88db87',
    name: 'นางปิยะนันท์ คงบุญ',
    role: 'homeroom_teacher',
    roleTitle: 'ครูผู้สอน',
    assignedClasses: ['*']
  },
  {
    id: 'd77657a4-f330-4f9b-8340-ad3d990357c5',
    name: 'นางอัญชลี อออิปก',
    role: 'homeroom_teacher',
    roleTitle: 'ครูผู้สอน',
    assignedClasses: ['*']
  },
  {
    id: 'be9a2d08-4514-4422-9956-b4465589a5af',
    name: 'นางสาวสุภิญญา ปานศิริ',
    role: 'homeroom_teacher',
    roleTitle: 'ครูผู้สอน',
    assignedClasses: ['*']
  },
  {
    id: 'c81b8aed-31e0-4634-933e-2b5eb5cab49c',
    name: 'นางสาวบิลกีส เบ็ญตะหลี',
    role: 'homeroom_teacher',
    roleTitle: 'ครูผู้สอน',
    assignedClasses: ['*']
  },
  {
    id: '35575e5d-7a08-4b93-9a8e-853209c70897',
    name: 'นางสาวปิ่นชลียา ดำด้วงโรม',
    role: 'homeroom_teacher',
    roleTitle: 'ครูผู้สอน',
    assignedClasses: ['*']
  },
  {
    id: '4b47ad00-48d1-4fe6-881b-3ae7640b863e',
    name: 'นางสาวธดาภรณ์ สมบูรณ์',
    role: 'homeroom_teacher',
    roleTitle: 'ครูผู้สอน',
    assignedClasses: ['*']
  },
  {
    id: '3209c5d0-a9dd-440f-8c3f-418a28907629',
    name: 'นางนราทิพย์ เมืองสง',
    role: 'homeroom_teacher',
    roleTitle: 'ครูผู้สอน',
    assignedClasses: ['*']
  }
];

export const DEFAULT_CLASS_TEACHER_MAP: Record<string, string> = {
  'อ.2': 'นางสาวบิลกีส เบ็ญตะหลี',
  'อ.3': 'นางสาวสุภิญญา ปานศิริ',
  'ป.1': 'นางสุมาวดี สมบูรณ์',
  'ป.2': 'นางปิยะนันท์ คงบุญ',
  'ป.3': 'นางสาวจีรนุช พรหมเหมือน',
  'ป.4': 'นางฑิฆัมพร เพ็งแก้ว',
  'ป.5': 'นางอัญชลี อออิปก',
  'ป.6': 'นางสาวปิ่นชลียา ดำด้วงโรม'
};
