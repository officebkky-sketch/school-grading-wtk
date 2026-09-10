// src/db/localDb.ts
import Dexie, { Table } from 'dexie';
import { StudentProfile, StudentScoreRecord, SubjectConfig } from '../types/pp5Types';

export interface LocalGradeRecord extends StudentScoreRecord {
  id: string; // composite key: `${classLevel}_${subjectId}_${studentId}_${academicYear}`
  classLevel: string;
  subjectId: string;
  academicYear: string;
  syncStatus: 'synced' | 'pending' | 'failed';
  lastModified: number;
}

export interface LocalAttendanceRecord {
  id: string; // `${classLevel}_${studentId}_${academicYear}_${semester}`
  studentId: string;
  classLevel: string;
  academicYear: string;
  semester: number;
  presentDays: number;
  leaveDays: number;
  sickDays: number;
  absentDays: number;
  totalSchoolDays: number;
  attendancePercent: number;
  hasExamEligibility: boolean;
  syncStatus: 'synced' | 'pending' | 'failed';
  lastModified: number;
}

export interface LocalHealthRecord {
  id: string;
  studentId: string;
  classLevel: string;
  academicYear: string;
  semester: number;
  ageYears?: number;
  weight: number;
  height: number;
  bmi: number;
  weightForHeight: string;
  heightForAge: string;
  weightForAge: string;
  syncStatus: 'synced' | 'pending' | 'failed';
  lastModified: number;
}

export interface LocalHolisticRecord {
  id: string;
  studentId: string;
  classLevel: string;
  academicYear: string;
  semester: number;
  desirableTraitsScore: number;
  competencyScore: number;
  readingWritingEval: string;
  learnerActivityPassed: boolean;
  syncStatus: 'synced' | 'pending' | 'failed';
  lastModified: number;
}

export interface SyncAuditLog {
  id?: number;
  timestamp: string;
  classLevel: string;
  scope: string;
  recordCount: number;
  status: 'success' | 'failed';
  message: string;
}

export interface OutboxItem {
  id?: number;
  entity: string;
  classLevel: string;
  payload: any;
  createdAt: string;
  tries: number;
  lastError?: string;
}

export class SchoolGradingDatabase extends Dexie {
  students!: Table<StudentProfile, string>;
  grades!: Table<LocalGradeRecord, string>;
  attendance!: Table<LocalAttendanceRecord, string>;
  health!: Table<LocalHealthRecord, string>;
  holistic!: Table<LocalHolisticRecord, string>;
  syncLogs!: Table<SyncAuditLog, number>;
  outbox!: Table<OutboxItem, number>;

  constructor() {
    super('SchoolGradingLocalDB');
    this.version(1).stores({
      students: 'id, studentId, classLevel, seq',
      grades: 'id, studentId, subjectId, classLevel, academicYear, syncStatus',
      attendance: 'id, studentId, classLevel, academicYear, semester, syncStatus',
      health: 'id, studentId, classLevel, academicYear, semester, syncStatus',
      holistic: 'id, studentId, classLevel, academicYear, semester, syncStatus',
      syncLogs: '++id, timestamp, classLevel, status'
    });

    this.version(2).stores({
      outbox: '++id, entity, classLevel, createdAt, tries'
    });
  }
}

export const localDb = new SchoolGradingDatabase();
