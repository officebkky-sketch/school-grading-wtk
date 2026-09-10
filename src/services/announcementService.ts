// src/services/announcementService.ts

export interface AnnouncementConfig {
  isPublished: boolean;
  publishedClasses: string[]; // e.g. ['*'] or ['อ.2', 'ป.1', 'ป.2', ...]
  announcerName: string;
  announcerRole: string;
  announcedAt?: string;
  announcementNote?: string;
}

const STORAGE_KEY = 'pp5_announcement_config';

const DEFAULT_CONFIG: AnnouncementConfig = {
  isPublished: true,
  publishedClasses: ['*'],
  announcerName: 'ฝ่ายวิชาการและวัดผลการศึกษา',
  announcerRole: 'หัวหน้าฝ่ายวิชาการ',
  announcedAt: '',
  announcementNote: 'ประกาศผลการเรียนออนไลน์อย่างเป็นทางการ โรงเรียนวัดท่าควาย'
};

export class AnnouncementService {
  /**
   * ดึงการตั้งค่าสถานะประกาศผลออนไลน์
   */
  public static getConfig(): AnnouncementConfig {
    if (typeof window === 'undefined') return DEFAULT_CONFIG;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return { ...DEFAULT_CONFIG, ...parsed };
        }
      } catch {}
    }
    return DEFAULT_CONFIG;
  }

  /**
   * บันทึกการตั้งค่าสถานะประกาศผลออนไลน์ (สิทธิ์ ผอ. / หัวหน้าวิชาการ)
   */
  public static saveConfig(config: AnnouncementConfig): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    }
  }

  /**
   * ตรวจสอบว่าชั้นเรียนนี้เปิดประกาศผลแล้วหรือไม่
   */
  public static isClassPublished(classLevel: string, config?: AnnouncementConfig): boolean {
    const cfg = config || this.getConfig();
    if (!cfg.isPublished) return false;
    if (cfg.publishedClasses.includes('*')) return true;
    return cfg.publishedClasses.includes(classLevel);
  }

  /**
   * ตรวจสอบสิทธิ์ว่าผู้ใช้นี้สามารถสั่งประกาศผล หรือเปิด/ปิดระบบได้หรือไม่
   * (เฉพาะ ผู้อำนวยการ, หัวหน้าฝ่ายวิชาการ และผู้ดูแลระบบ)
   */
  public static canManageAnnouncement(user: { role?: string } | null): boolean {
    if (!user) return false;
    return user.role === 'director' || user.role === 'academic_head' || user.role === 'admin';
  }
}
