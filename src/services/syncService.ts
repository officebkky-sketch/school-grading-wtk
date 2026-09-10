// src/services/syncService.ts
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { localDb } from '../db/localDb';
import { StudentProfile, SubjectConfig, StudentScoreRecord, AcademicConfig } from '../types/pp5Types';
import { GrowthEngine } from '../engines/growthEngine';

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  message: string;
  error?: string;
  timestamp: string;
}

export class CloudSyncEngine {
  /**
   * Sync a single class room's entire data to Supabase (Class-Scoped Atomic Upsert)
   * Guaranteed Zero-Conflict: Modifies only records belonging to this specific class room.
   */
  static async syncClassToCloud(
    classLevel: string,
    subjects: SubjectConfig[],
    students: StudentProfile[],
    scores: Record<string, Record<string, StudentScoreRecord>>,
    config: AcademicConfig
  ): Promise<SyncResult> {
    const timestamp = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        syncedCount: 0,
        message: 'ยังไม่ได้เชื่อมต่อ Supabase หรืออยู่ในโหมดออฟไลน์',
        timestamp
      };
    }

    try {
      let totalSynced = 0;

      // 1. Sync Subjects for this class (Smart ID matching & schema resilience)
      const { data: dbSubjectsExisting } = await supabase
        .from('subjects')
        .select('id, code')
        .eq('class_level', classLevel)
        .eq('academic_year', config.academicYear);

      const existingMap = new Map<string, string>(); // code -> id
      dbSubjectsExisting?.forEach(es => existingMap.set(es.code.trim(), es.id));

      const subjectsPayload = subjects.map(s => {
        const existingId = existingMap.get(s.code.trim());
        const row: any = {
          code: s.code.trim(),
          name: s.name.trim(),
          type: s.type,
          credits: s.credits,
          class_level: classLevel,
          academic_year: config.academicYear
        };
        if (existingId) row.id = existingId;
        return row;
      });

      if (subjectsPayload.length > 0) {
        const { error: subErr } = await supabase
          .from('subjects')
          .upsert(subjectsPayload, { onConflict: 'id' });
        if (subErr) {
          const { error: fallbackErr } = await supabase
            .from('subjects')
            .upsert(subjectsPayload);
          if (fallbackErr) throw new Error(`ไม่สามารถซิงค์รายวิชา: ${fallbackErr.message}`);
        }
      }

      // Fetch refreshed subject mapping from Supabase to obtain actual UUIDs
      const { data: dbSubjects, error: fetchSubErr } = await supabase
        .from('subjects')
        .select('id, code')
        .eq('class_level', classLevel)
        .eq('academic_year', config.academicYear);

      if (fetchSubErr) throw new Error(`ไม่สามารถอ่านข้อมูลรายวิชา: ${fetchSubErr.message}`);

      const subjectIdMap = new Map<string, string>(); // code -> uuid
      dbSubjects?.forEach(ds => subjectIdMap.set(ds.code.trim(), ds.id));

      // 2. Sync Student Grades
      const gradesPayload: any[] = [];
      for (const sub of subjects) {
        const subDbId = subjectIdMap.get(sub.code.trim());
        if (!subDbId) continue;

        const subScores = scores[sub.id] || {};
        for (const s of students) {
          const rec = subScores[s.studentId];
          if (!rec) continue;

          gradesPayload.push({
            student_id: s.studentId,
            subject_id: subDbId,
            academic_year: config.academicYear,
            semester: config.semester,
            formative1: rec.formative1,
            midterm1: rec.midterm1,
            final1: rec.final1,
            total1: rec.total1,
            formative2: rec.formative2,
            midterm2: rec.midterm2,
            final2: rec.final2,
            total2: rec.total2,
            yearly_total: rec.yearlyTotal,
            grade: rec.grade || '-',
            is_passed: rec.isPassed ?? true,
            updated_by: config.homeroomTeacher || 'ครูประจำชั้น',
            updated_at: new Date().toISOString()
          });
        }
      }

      if (gradesPayload.length > 0) {
        const { error: gradeErr } = await supabase
          .from('student_grades')
          .upsert(gradesPayload, { onConflict: 'student_id,subject_id,academic_year' });
        if (gradeErr) throw new Error(`ไม่สามารถซิงค์คะแนน: ${gradeErr.message}`);
        totalSynced += gradesPayload.length;
      }

      // 3. Sync Health & Growth (BMI)
      const healthPayload = students.map(s => {
        const evalResult = GrowthEngine.evaluateGrowth(s.gender, s.ageYears, s.weight, s.height);

        return {
          student_id: s.studentId,
          academic_year: config.academicYear,
          semester: config.semester,
          age_years: s.ageYears,
          weight: s.weight,
          height: s.height,
          bmi: evalResult.bmi,
          weight_for_height: evalResult.weightForHeight,
          height_for_age: evalResult.heightForAge,
          weight_for_age: evalResult.weightForAge,
          recorded_date: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString()
        };
      });

      if (healthPayload.length > 0) {
        const { error: healthErr } = await supabase
          .from('student_health_growth')
          .upsert(healthPayload, { onConflict: 'student_id,academic_year,semester' });
        if (healthErr) throw new Error(`ไม่สามารถซิงค์ข้อมูลสุขภาพ: ${healthErr.message}`);
        totalSynced += healthPayload.length;
      }

      // Log successful sync locally
      await localDb.syncLogs.add({
        timestamp: new Date().toISOString(),
        classLevel,
        scope: 'full_class_sync',
        recordCount: totalSynced,
        status: 'success',
        message: `ซิงค์คะแนนและข้อมูลชั้น ${classLevel} สำเร็จ (${totalSynced} รายการ)`
      });

      return {
        success: true,
        syncedCount: totalSynced,
        message: `ซิงค์ข้อมูลชั้น ${classLevel} ขึ้นระบบโรงเรียนเรียบร้อย (${totalSynced} รายการ)`,
        timestamp
      };

    } catch (err: any) {
      console.error('Cloud Sync Error:', err);
      // Log failed sync locally
      await localDb.syncLogs.add({
        timestamp: new Date().toISOString(),
        classLevel,
        scope: 'full_class_sync',
        recordCount: 0,
        status: 'failed',
        message: err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ Supabase'
      });

      return {
        success: false,
        syncedCount: 0,
        message: `การซิงค์ล้มเหลว: ${err.message || 'เน็ตหลุดหรือไม่สามารถเข้าถึงเซิร์ฟเวอร์'}`,
        error: err.message,
        timestamp
      };
    }
  }

  /**
   * ตรวจสอบจำนวนรายการที่รอซิงค์ใน Outbox (Offline Queue)
   */
  static async getOutboxCount(): Promise<number> {
    try {
      return await localDb.outbox.count();
    } catch {
      return 0;
    }
  }

  private static isFlushingOutbox = false;

  /**
   * ดึงข้อมูลคะแนนทั้งหมดจาก Supabase Cloud (On-Launch Rehydration)
   * เพื่อนำมาผสานเข้ากับ Local State ทันทีที่เปิดแอป
   */
  static async fetchAllScoresFromCloud(academicYear: string = '2569'): Promise<{
    scores: Record<string, Record<string, Record<string, StudentScoreRecord>>>;
    subjectsMap: Record<string, SubjectConfig[]>;
  } | null> {
    if (!isSupabaseConfigured || !supabase) return null;

    try {
      const [gradesRes, subjectsRes] = await Promise.all([
        supabase
          .from('student_grades')
          .select('*')
          .eq('academic_year', academicYear)
          .limit(5000),
        supabase
          .from('subjects')
          .select('*')
          .eq('academic_year', academicYear)
          .limit(5000)
      ]);

      if (gradesRes.error || subjectsRes.error) {
        console.warn('Cannot fetch cloud scores/subjects:', gradesRes.error || subjectsRes.error);
        return null;
      }

      const dbGrades = gradesRes.data || [];
      const dbSubjects = subjectsRes.data || [];

      if (dbGrades.length === 0) return null;

      // จัดกลุ่มวิชาตาม class_level
      const subjectsMap: Record<string, SubjectConfig[]> = {};
      const subjectLookup = new Map<string, { classLevel: string; subjectId: string }>();

      dbSubjects.forEach(s => {
        const cls = s.class_level?.trim() || 'ป.1';
        if (!subjectsMap[cls]) subjectsMap[cls] = [];

        const subConfig: SubjectConfig = {
          id: s.id,
          code: s.code?.trim() || '',
          name: s.name?.trim() || '',
          type: (s.type || 'พื้นฐาน') as any,
          credits: Number(s.credits) || 1,
          hoursPerYear: Number(s.hours_per_year) || 80,
          fullScoreTerm1: Number(s.full_score_term1) || 50,
          fullScoreTerm2: Number(s.full_score_term2) || 50
        };

        subjectsMap[cls].push(subConfig);
        subjectLookup.set(s.id, { classLevel: cls, subjectId: s.id });
        if (s.code) subjectLookup.set(s.code.trim(), { classLevel: cls, subjectId: s.id });
      });

      // จัดกลุ่มคะแนน: classLevel -> subjectId -> studentId -> StudentScoreRecord
      const scores: Record<string, Record<string, Record<string, StudentScoreRecord>>> = {};

      dbGrades.forEach(g => {
        const lookup = subjectLookup.get(g.subject_id);
        if (!lookup) return;

        const { classLevel, subjectId } = lookup;
        if (!scores[classLevel]) scores[classLevel] = {};
        if (!scores[classLevel][subjectId]) scores[classLevel][subjectId] = {};

        scores[classLevel][subjectId][g.student_id] = {
          studentId: g.student_id,
          formative1: g.formative1,
          midterm1: g.midterm1,
          final1: g.final1,
          total1: g.total1,
          formative2: g.formative2,
          midterm2: g.midterm2,
          final2: g.final2,
          total2: g.total2,
          yearlyTotal: g.yearly_total,
          grade: g.grade || '-',
          isPassed: g.is_passed ?? true
        };
      });

      return { scores, subjectsMap };
    } catch (err) {
      console.warn('Rehydration error from cloud:', err);
      return null;
    }
  }

  /**
   * ระบายคิว Outbox ที่ค้างอยู่ขึ้น Supabase (Auto-Sync Flush)
   * ป้องกัน Race Condition ด้วย Concurrency Lock
   */
  static async processPendingOutbox(): Promise<number> {
    if (this.isFlushingOutbox) return 0;
    if (!isSupabaseConfigured || !supabase) return 0;
    if (typeof navigator !== 'undefined' && !navigator.onLine) return 0;

    this.isFlushingOutbox = true;
    try {
      const items = await localDb.outbox.orderBy('id').limit(50).toArray();
      if (!items || items.length === 0) return 0;

      let flushedCount = 0;
      for (const item of items) {
        try {
          if (item.entity === 'student_grades' && Array.isArray(item.payload)) {
            // Deduplicate payload within batch by composite key
            const dedupMap = new Map<string, any>();
            item.payload.forEach((p: any) => {
              const k = `${p.student_id}_${p.subject_id}_${p.academic_year}`;
              dedupMap.set(k, p);
            });
            const dedupedPayload = Array.from(dedupMap.values());

            const { error } = await supabase
              .from('student_grades')
              .upsert(dedupedPayload, { onConflict: 'student_id,subject_id,academic_year' });
            if (error) throw error;
          } else if (item.entity === 'student_health_growth' && Array.isArray(item.payload)) {
            const { error } = await supabase
              .from('student_health_growth')
              .upsert(item.payload, { onConflict: 'student_id,academic_year,semester' });
            if (error) throw error;
          } else if (item.entity === 'subjects' && Array.isArray(item.payload)) {
            const { error } = await supabase
              .from('subjects')
              .upsert(item.payload, { onConflict: 'id' });
            if (error) throw error;
          }

          if (item.id) await localDb.outbox.delete(item.id);
          flushedCount++;
        } catch (itemErr: any) {
          console.warn(`Outbox item ${item.id} retry failed:`, itemErr);
          if (item.id) {
            await localDb.outbox.update(item.id, {
              tries: (item.tries || 0) + 1,
              lastError: itemErr.message
            });
          }
        }
      }
      return flushedCount;
    } catch (err) {
      console.warn('Error processing outbox:', err);
      return 0;
    } finally {
      this.isFlushingOutbox = false;
    }
  }

  /**
   * ระบบ Auto-Sync เบื้องหลัง (Non-blocking Background Auto-Sync)
   * บันทึก Local-First ทันที หากต่อเน็ตได้จะ Push ขึ้น Cloud หากเน็ตหลุดจะเก็บเข้า Outbox
   */
  static async autoSyncClassToCloud(
    classLevel: string,
    subjects: SubjectConfig[],
    students: StudentProfile[],
    scores: Record<string, Record<string, StudentScoreRecord>>,
    config: AcademicConfig
  ): Promise<void> {
    const isOnline = typeof navigator === 'undefined' || navigator.onLine;

    if (isOnline && isSupabaseConfigured && supabase) {
      // ซิงค์ตรงแบบ background
      this.syncClassToCloud(classLevel, subjects, students, scores, config)
        .catch(async () => {
          // หากเกิดข้อผิดพลาด ให้พักใส่ Outbox
          await this.queueClassToOutbox(classLevel, subjects, students, scores, config);
        });
    } else {
      // ออฟไลน์: พักใส่ Outbox ทันที
      await this.queueClassToOutbox(classLevel, subjects, students, scores, config);
    }
  }

  private static async queueClassToOutbox(
    classLevel: string,
    subjects: SubjectConfig[],
    students: StudentProfile[],
    scores: Record<string, Record<string, StudentScoreRecord>>,
    config: AcademicConfig
  ): Promise<void> {
    try {
      const gradesPayload: any[] = [];
      for (const sub of subjects) {
        const subScores = scores[sub.id] || {};
        for (const s of students) {
          const rec = subScores[s.studentId];
          if (!rec) continue;
          gradesPayload.push({
            student_id: s.studentId,
            subject_id: sub.id,
            academic_year: config.academicYear,
            semester: config.semester,
            formative1: rec.formative1,
            midterm1: rec.midterm1,
            final1: rec.final1,
            total1: rec.total1,
            formative2: rec.formative2,
            midterm2: rec.midterm2,
            final2: rec.final2,
            total2: rec.total2,
            yearly_total: rec.yearlyTotal,
            grade: rec.grade || '-',
            is_passed: rec.isPassed ?? true,
            updated_by: config.homeroomTeacher || 'ครูประจำชั้น',
            updated_at: new Date().toISOString()
          });
        }
      }

      if (gradesPayload.length > 0) {
        await localDb.outbox.add({
          entity: 'student_grades',
          classLevel,
          payload: gradesPayload,
          createdAt: new Date().toISOString(),
          tries: 0
        });
      }
    } catch (e) {
      console.warn('Failed to queue to outbox:', e);
    }
  }
}
