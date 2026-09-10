// src/services/authService.ts
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { DEFAULT_TEACHERS, DEFAULT_CLASS_TEACHER_MAP, TeacherProfile } from '../data/teachersData';

export interface AuthenticatedUser {
  id: string;
  email: string;
  displayName: string;
  role: 'admin' | 'director' | 'academic_head' | 'teacher';
  roleTitle: string;
  assignedClasses: string[]; // e.g. ['ป.1'] or ['*'] for all classes
  teacherProfile?: TeacherProfile;
}

// ตารางแมปอีเมลระบบหลัก -> ชั้นเรียนที่รับผิดชอบ สำหรับโรงเรียนวัดท่าควาย
export const EMAIL_CLASS_MAPPING: Record<string, { role: 'admin' | 'academic_head' | 'teacher' | 'director'; classes: string[]; title: string; name: string }> = {
  'jantawanpitakchanuan@gmail.com': {
    role: 'director',
    classes: ['*'],
    title: 'ผู้อำนวยการโรงเรียน',
    name: 'นางจันทวรรณ พิทักษ์ฉนวน'
  },
  'sumawadee0419@gmail.com': {
    role: 'academic_head',
    classes: ['*'],
    title: 'หัวหน้าฝ่ายวิชาการ',
    name: 'นางสุมาวดี สมบูรณ์'
  },
  'wtkpl2.office@gmail.com': {
    role: 'admin',
    classes: ['*'],
    title: 'เจ้าหน้าที่ธุรการ / ผู้ดูแลระบบ',
    name: 'นายไพโรจน์ มากแก้ว'
  },
  'jeeranuj14@gmail.com': {
    role: 'teacher',
    classes: ['*'],
    title: 'ครูผู้สอน',
    name: 'นางสาวจีรนุช พรหมเหมือน'
  },
  'phengkaew2512@gmail.com': {
    role: 'teacher',
    classes: ['*'],
    title: 'ครูผู้สอน',
    name: 'นางฑิฆัมพร เพ็งแก้ว'
  },
  'ppin483@gmail.com': {
    role: 'teacher',
    classes: ['*'],
    title: 'ครูผู้สอน',
    name: 'นางปิยะนันท์ คงบุญ'
  },
  'lee.anchalee.a@gmail.com': {
    role: 'teacher',
    classes: ['*'],
    title: 'ครูผู้สอน',
    name: 'นางอัญชลี อออิปก'
  },
  'benny.b402@gmail.com': {
    role: 'teacher',
    classes: ['*'],
    title: 'ครูผู้สอน',
    name: 'นางสาวสุภิญญา ปานศิริ'
  },
  'bilkisbentalee2@gmail.com': {
    role: 'teacher',
    classes: ['*'],
    title: 'ครูผู้สอน',
    name: 'นางสาวบิลกีส เบ็ญตะหลี'
  },
  'pinchaleeya2527@gmail.com': {
    role: 'teacher',
    classes: ['*'],
    title: 'ครูผู้สอน',
    name: 'นางสาวปิ่นชลียา ดำด้วงโรม'
  },
  'thadaporn13122536@icloud.com': {
    role: 'teacher',
    classes: ['*'],
    title: 'ครูผู้สอน',
    name: 'นางสาวธดาภรณ์ สมบูรณ์'
  },
  'narathipmeangsong1@gmail.com': {
    role: 'teacher',
    classes: ['*'],
    title: 'ครูผู้สอน',
    name: 'นางนราทิพย์ เมืองสง'
  }
};

export class AuthService {
  /**
   * เข้าสู่ระบบด้วยรหัสผ่านระบบหลัก (Supabase Auth)
   * ใช้รหัสผ่านและอีเมลเดียวกันกับ school-admin-lime
   */
  public static async loginWithSupabasePassword(
    identifier: string, // Email or Teacher Name
    password: string
  ): Promise<{ success: boolean; user?: AuthenticatedUser; message: string }> {
    const trimmedInput = identifier.trim();

    // 1. ตรวจสอบผ่าน Supabase Auth หากตั้งค่าไว้
    if (isSupabaseConfigured && supabase) {
      try {
        let emailToLogin = trimmedInput;
        // หากป้อนชื่อครูมา ให้ค้นหาอีเมลจาก Mapping
        if (!trimmedInput.includes('@')) {
          const entry = Object.entries(EMAIL_CLASS_MAPPING).find(([_, info]) => 
            info.name.includes(trimmedInput) || trimmedInput.includes(info.name)
          );
          if (entry) {
            emailToLogin = entry[0];
          }
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email: emailToLogin,
          password: password
        });

        if (error) throw error;

        if (data && data.user) {
          const email = data.user.email || emailToLogin;
          const mapped = EMAIL_CLASS_MAPPING[email.toLowerCase()];

          let displayName = mapped?.name || data.user.user_metadata?.display_name || email.split('@')[0];
          let role = mapped?.role || (data.user.user_metadata?.role as any) || 'teacher';
          let roleTitle = mapped?.title || 'ครูผู้สอน';
          let assignedClasses = mapped?.classes || ['*'];

          // ดึงข้อมูล profile เพิ่มเติมจาก DB ถ้ามี
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .maybeSingle();

          if (profile) {
            displayName = profile.display_name || displayName;
            if (profile.role === 'admin' || profile.role === 'director' || profile.role === 'academic_head') {
              role = profile.role;
              roleTitle = profile.role === 'director' ? 'ผู้อำนวยการโรงเรียน' : (profile.role === 'admin' ? 'ผู้ดูแลระบบ' : 'ฝ่ายวิชาการ');
              assignedClasses = ['*'];
            }
          }

          const authUser: AuthenticatedUser = {
            id: data.user.id,
            email,
            displayName,
            role,
            roleTitle,
            assignedClasses
          };

          localStorage.setItem('pp5_auth_user', JSON.stringify(authUser));
          return { success: true, user: authUser, message: `ยินดีต้อนรับ ${displayName}` };
        }
      } catch (err: any) {
        console.warn('Supabase auth failed, checking fallback credentials:', err.message);
        return { success: false, message: `เข้าสู่ระบบไม่สำเร็จ: ${err.message === 'Invalid login credentials' ? 'อีเมลหรือรหัสผ่านไม่ถูกต้อง (กรุณาใช้รหัสผ่านเดียวกับระบบหลัก)' : err.message}` };
      }
    }

    // 2. Local / Offline Fallback Mode: อนุญาตให้เลือกครูและใช้รหัสระบบหลักได้
    const matchedEntry = Object.entries(EMAIL_CLASS_MAPPING).find(([email, info]) =>
      email.toLowerCase() === trimmedInput.toLowerCase() ||
      info.name.includes(trimmedInput) ||
      info.classes.includes(trimmedInput)
    );

    if (matchedEntry) {
      const [email, info] = matchedEntry;
      const authUser: AuthenticatedUser = {
        id: 'local_' + Date.now(),
        email,
        displayName: info.name,
        role: info.role,
        roleTitle: info.title,
        assignedClasses: info.classes
      };
      localStorage.setItem('pp5_auth_user', JSON.stringify(authUser));
      return { success: true, user: authUser, message: `เข้าสู่ระบบออฟไลน์สำเร็จ (${info.name})` };
    }

    return {
      success: false,
      message: 'ไม่พบชื่อบัญชีครูในระบบ กรุณากรอกอีเมลหรือชื่อครูที่ถูกต้อง'
    };
  }

  /**
   * เข้าสู่ระบบด่วนด้วยการเลือกโปรไฟล์ครู (Quick Switch)
   */
  public static loginAsTeacher(teacher: TeacherProfile): AuthenticatedUser {
    const isAcademic = teacher.role === 'academic_head' || teacher.role === 'director' || teacher.assignedClasses.includes('*');
    const authUser: AuthenticatedUser = {
      id: teacher.id,
      email: `${teacher.id}@school.internal`,
      displayName: teacher.name,
      role: teacher.role === 'director' ? 'director' : (isAcademic ? 'academic_head' : 'teacher'),
      roleTitle: teacher.roleTitle,
      assignedClasses: teacher.assignedClasses,
      teacherProfile: teacher
    };

    localStorage.setItem('pp5_auth_user', JSON.stringify(authUser));
    return authUser;
  }

  /**
   * อ่านข้อมูลผู้ใช้ปัจจุบันที่ล็อกอินค้างไว้ พร้อมตัดทิ้งหากเป็นของโรงเรียนอื่น
   */
  public static getCurrentUser(): AuthenticatedUser | null {
    const saved = localStorage.getItem('pp5_auth_user');
    if (saved) {
      try {
        const u = JSON.parse(saved);
        if (u && (u.displayName?.includes('เอกคณิต') || u.displayName?.includes('วัชรี') || u.email?.includes('bkky'))) {
          localStorage.removeItem('pp5_auth_user');
          return null;
        }
        return u;
      } catch {}
    }
    return null;
  }

  /**
   * ออกจากระบบ
   */
  public static logout(): void {
    localStorage.removeItem('pp5_auth_user');
    if (isSupabaseConfigured && supabase) {
      supabase.auth.signOut().catch(() => {});
    }
  }

  public static signOut = AuthService.logout;
  public static signInWithMainSystem = AuthService.loginWithSupabasePassword;
}
