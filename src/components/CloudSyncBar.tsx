// src/components/CloudSyncBar.tsx
import React, { useState } from 'react';
import { Cloud, CloudUpload, CheckCircle2, AlertCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { CloudSyncEngine, SyncResult } from '../services/syncService';
import { StudentProfile, SubjectConfig, StudentScoreRecord, AcademicConfig } from '../types/pp5Types';
import { isSupabaseConfigured } from '../lib/supabaseClient';

interface Props {
  classLevel: string;
  subjects: SubjectConfig[];
  students: StudentProfile[];
  scores: Record<string, Record<string, StudentScoreRecord>>;
  config: AcademicConfig;
  canSync: boolean;
}

export const CloudSyncBar: React.FC<Props> = ({
  classLevel,
  subjects,
  students,
  scores,
  config,
  canSync
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(() => {
    const saved = localStorage.getItem(`pp5_last_sync_${classLevel}`);
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return null;
  });
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSync = async () => {
    if (!canSync) {
      alert('เฉพาะครูประจำชั้นของห้องนี้ หรือหัวหน้าวิชาการเท่านั้นที่สามารถซิงค์คะแนนขึ้นระบบได้');
      return;
    }

    setIsSyncing(true);
    setNotification(null);

    const result = await CloudSyncEngine.syncClassToCloud(
      classLevel,
      subjects,
      students,
      scores,
      config
    );

    setIsSyncing(false);
    setLastSyncResult(result);
    localStorage.setItem(`pp5_last_sync_${classLevel}`, JSON.stringify(result));

    if (result.success) {
      setNotification({ type: 'success', text: result.message });
    } else {
      setNotification({ type: 'error', text: result.message });
    }

    // Auto dismiss toast after 5s
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  return (
    <div className="bg-white border-b border-slate-200 px-4 py-2.5 shadow-xs no-print">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        
        {/* Status indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {isSupabaseConfigured ? (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 font-medium">
                  <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                  เชื่อมต่อคลาวด์ รร.{config.schoolName}
                </span>
                <span className="text-[11px] text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200 font-medium">
                  ⚡ ระบบออโต้ซิงค์ทำงาน
                </span>
              </div>
            ) : (
              <span className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-300 font-medium">
                <WifiOff className="w-3.5 h-3.5 text-slate-500" />
                โหมดออฟไลน์ในเครื่อง (Local-First)
              </span>
            )}
          </div>

          <div className="text-xs text-slate-500 hidden md:inline">
            {lastSyncResult?.success ? (
              <span className="flex items-center gap-1 text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ซิงค์ล่าสุด: {lastSyncResult.timestamp} น. ({lastSyncResult.syncedCount} รายการ)
              </span>
            ) : (
              <span className="text-slate-400">
                ยังไม่ได้ซิงค์ข้อมูลรอบล่าสุด
              </span>
            )}
          </div>
        </div>

        {/* Action Button & Toast */}
        <div className="flex items-center gap-3">
          {notification && (
            <div
              className={`text-xs px-3 py-1 rounded-lg font-medium border animate-in fade-in flex items-center gap-1.5 ${
                notification.type === 'success'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-rose-100 text-rose-800 border-rose-300'
              }`}
            >
              {notification.type === 'success' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              )}
              <span>{notification.text}</span>
            </div>
          )}

          <button
            onClick={handleSync}
            disabled={isSyncing || !canSync}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm transition ${
              canSync
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-98 cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
            title="ส่งข้อมูลคะแนน เวลาเรียน และสุขภาพของห้องนี้ขึ้นสู่ฐานข้อมูลคลาวด์ของโรงเรียน"
          >
            {isSyncing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>กำลังซิงค์ขึ้นคลาวด์...</span>
              </>
            ) : (
              <>
                <CloudUpload className="w-3.5 h-3.5 text-emerald-100" />
                <span>ซิงค์ข้อมูลขึ้นระบบโรงเรียน</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
