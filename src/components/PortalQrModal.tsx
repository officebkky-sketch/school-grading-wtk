// src/components/PortalQrModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { 
  QrCode, 
  Download, 
  Printer, 
  Copy, 
  Check, 
  X, 
  Smartphone, 
  ShieldCheck, 
  ExternalLink 
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  schoolName: string;
  schoolId: string;
  academicYear?: string;
  logoUrl?: string;
  customUrl?: string;
  studentInfo?: {
    nationalId: string;
    studentId: string;
    studentName: string;
    classLevel: string;
  };
}

export const PortalQrModal: React.FC<Props> = ({
  isOpen,
  onClose,
  schoolName,
  schoolId,
  academicYear,
  logoUrl,
  customUrl,
  studentInfo
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // คำนวณ Portal URL
  const baseUrl = customUrl || (typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : '');
  const portalUrl = studentInfo 
    ? `${baseUrl}?mode=portal&nid=${studentInfo.nationalId}&sid=${studentInfo.studentId}`
    : `${baseUrl}?mode=portal`;

  useEffect(() => {
    if (isOpen && portalUrl) {
      QRCode.toDataURL(portalUrl, {
        width: 380,
        margin: 2,
        color: {
          dark: '#064e3b', // emerald-900
          light: '#ffffff'
        },
        errorCorrectionLevel: 'H'
      })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('QR Generation error:', err));
    }
  }, [isOpen, portalUrl]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = studentInfo
      ? `QR_ผลการเรียน_${studentInfo.studentName}_${studentInfo.classLevel}.png`
      : `QR_ประกาศผลการเรียน_${schoolName}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPoster = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col no-print">
        
        {/* Header */}
        <div className="bg-emerald-800 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-700/80 rounded-xl">
              <QrCode className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-bold text-base">
                {studentInfo ? 'QR Code ตรวจสอบผลการเรียนเฉพาะบุคคล' : 'QR Code เข้าสู่ระบบประกาศผลออนไลน์'}
              </h3>
              <p className="text-xs text-emerald-200">
                สำหรับส่งให้ผู้ปกครองสแกนผ่านมือถือได้ทันที
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-200 hover:text-white p-1 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex flex-col items-center text-center">
          {studentInfo && (
            <div className="w-full mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-medium">
              นักเรียน: <strong>{studentInfo.studentName}</strong> (ชั้น {studentInfo.classLevel})
              <div className="text-[11px] text-emerald-700 mt-0.5">
                (สแกนแล้วจะเติมเลข ปชช. และเลขประจำตัวให้อัตโนมัติ)
              </div>
            </div>
          )}

          {/* QR Code Frame */}
          <div className="p-4 bg-white rounded-2xl border-2 border-emerald-500 shadow-md mb-4 relative group">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Portal QR Code"
                className="w-56 h-56 object-contain"
              />
            ) : (
              <div className="w-56 h-56 flex items-center justify-center text-slate-400 text-xs">
                กำลังสร้าง QR Code...
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="w-full bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs text-slate-600 mb-5 text-left space-y-1.5">
            <div className="font-bold text-slate-800 flex items-center gap-1.5 mb-1 text-xs">
              <Smartphone className="w-4 h-4 text-emerald-600" />
              วิธีเข้าดูผลการเรียนสำหรับผู้ปกครอง:
            </div>
            <div className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-emerald-200 text-emerald-900 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">1</span>
              <span>ใช้กล้องมือถือหรือ LINE สแกน QR Code นี้</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-emerald-200 text-emerald-900 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">2</span>
              <span>กรอก <strong>เลขประจำตัวประชาชน 13 หลัก</strong> และรหัสผ่านคือ <strong>เลขประจำตัวนักเรียน</strong></span>
            </div>
          </div>

          {/* URL Box with Copy Button */}
          <div className="w-full flex items-center gap-2 bg-slate-100 p-2 rounded-xl border border-slate-200 text-xs mb-5 font-mono text-slate-600">
            <span className="truncate flex-1 text-left px-1 text-[11px]">{portalUrl}</span>
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1 px-3 py-1 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-lg border border-slate-300 shadow-2xs transition shrink-0"
              title="คัดลอกลิงก์"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="w-full flex gap-3">
            <button
              onClick={handleDownloadQr}
              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
            >
              <Download className="w-4 h-4" />
              <span>ดาวน์โหลดรูปภาพ QR</span>
            </button>

            <button
              onClick={handlePrintPoster}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs transition"
              title="พิมพ์ป้ายประกาศขนาด A4 พร้อมคำแนะนำสำหรับติดหน้าห้องเรียน"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์ป้าย A4</span>
            </button>
          </div>
        </div>
      </div>

      {/* Printable Poster Container (A4 Printable Only) */}
      <div className="hidden print:flex print:flex-col print:items-center print:justify-center print:w-full print:min-h-screen bg-white p-8 text-center text-slate-900 print-page">
        <div className="w-full max-w-lg border-4 border-emerald-700 p-10 rounded-3xl space-y-6">
          <div className="flex items-center justify-center gap-3">
            <img
              src={logoUrl || '/logo.png'}
              alt="Logo"
              className="w-20 h-20 object-contain"
              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
            />
          </div>

          <div>
            <h1 className="text-2xl font-black text-slate-900">
              ระบบประกาศผลการเรียนออนไลน์
            </h1>
            <p className="text-sm font-bold text-emerald-800 mt-1">
              โรงเรียน{schoolName} (รหัสสถานศึกษา {schoolId})
            </p>
          </div>

          {studentInfo && (
            <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl text-base font-bold text-emerald-900">
              สำหรับนักเรียน: {studentInfo.studentName} (ชั้น {studentInfo.classLevel})
            </div>
          )}

          <div className="flex justify-center p-4 bg-white border-2 border-slate-300 rounded-2xl w-fit mx-auto shadow-md">
            {qrDataUrl && (
              <img
                src={qrDataUrl}
                alt="Portal QR Code"
                className="w-72 h-72 object-contain"
              />
            )}
          </div>

          <div className="bg-slate-50 border border-slate-300 p-5 rounded-2xl text-left space-y-3">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-emerald-700" />
              ขั้นตอนการตรวจสอบผลการเรียน:
            </h3>
            <div className="space-y-1.5 text-xs text-slate-700 font-medium">
              <div><strong>ขั้นที่ ๑:</strong> เปิดกล้องมือถือ หรือแอปพลิเคชัน LINE เพื่อสแกน QR Code ด้านบน</div>
              <div><strong>ขั้นที่ ๒:</strong> กรอก <strong>เลขประจำตัวประชาชน ๑๓ หลัก</strong> ของนักเรียน</div>
              <div><strong>ขั้นที่ ๓:</strong> กรอกรหัสผ่านคือ <strong>เลขประจำตัวนักเรียน</strong> เพื่อเข้าดูผลการเรียน ปพ.๖</div>
            </div>
          </div>

          <div className="text-xs text-slate-400 font-medium pt-2">
            เอกสารประชาสัมพันธ์ระบบวัดและประเมินผลการศึกษาดิจิทัล • โรงเรียน{schoolName}
          </div>
        </div>
      </div>
    </div>
  );
};
