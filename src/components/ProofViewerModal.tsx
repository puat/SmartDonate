import React, { useState } from 'react';
import { Milestone, EvidenceDocument, UserRole } from '../types';
import { formatIDR, formatAddress } from '../blockchain/ethereumService';
import { 
  X, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  FileText, 
  Copy, 
  Check, 
  MapPin, 
  Building, 
  Receipt, 
  Lock,
  ArrowRight
} from 'lucide-react';

interface ProofViewerModalProps {
  milestone: Milestone;
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole;
  onVerifyMilestone: (milestoneId: number, approved: boolean, notes: string) => Promise<any>;
}

export const ProofViewerModal: React.FC<ProofViewerModalProps> = ({
  milestone,
  isOpen,
  onClose,
  currentRole,
  onVerifyMilestone
}) => {
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [auditNotes, setAuditNotes] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  if (!isOpen || !milestone.evidence) return null;
  const ev = milestone.evidence;

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(type);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleVerify = async (approved: boolean) => {
    setIsVerifying(true);
    try {
      const notes = auditNotes || (approved 
        ? "Telah memeriksa keaslian fisik, kesesuaian faktur kuitansi, dan Berita Acara Serah Terima sesuai SOP audit."
        : "Dokumen bukti belum memenuhi syarat validitas atau belum lengkap.");
      await onVerifyMilestone(milestone.id, approved, notes);
      setActionSuccess(approved ? "Milestone disetujui & dicatat pada Smart Contract!" : "Milestone ditolak untuk perbaikan.");
      setTimeout(() => {
        setActionSuccess(null);
        onClose();
      }, 1500);
    } catch (err: any) {
      alert(err.message || "Gagal memproses verifikasi milestone.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-slate-800 bg-slate-900/90">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                Audit Pembuktian Milestone
              </span>
              <span className="text-xs text-slate-400">
                {milestone.title} ({milestone.percentage}% · {formatIDR(milestone.releaseAmountIDR)})
              </span>
            </div>
            <h2 className="mt-1 text-lg font-bold text-white tracking-tight">
              {ev.title}
            </h2>
          </div>

          <button 
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {actionSuccess && (
            <div className="rounded-xl bg-emerald-950/80 p-4 border border-emerald-500 text-emerald-300 text-center font-bold text-sm flex items-center justify-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              <span>{actionSuccess}</span>
            </div>
          )}

          {/* Document Preview Image */}
          <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 max-h-60 flex items-center justify-center">
            <img 
              src={ev.fileUrl} 
              alt={ev.title}
              className="w-full h-56 object-cover" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-slate-300 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 font-mono">
              <span>{ev.fileName} ({ev.fileSize})</span>
              <span className="text-emerald-400">Validasi SHA-256 Otentik</span>
            </div>
          </div>

          {/* Deliverable Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl bg-slate-950 p-3 border border-slate-800 flex items-start gap-2.5">
              <Building className="h-4 w-4 text-cyan-400 mt-0.5 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-bold">Penerbit / Kontraktor</div>
                <div className="text-slate-200 font-semibold mt-0.5">{ev.contractorName || 'Rekanan Terdaftar'}</div>
              </div>
            </div>

            <div className="rounded-xl bg-slate-950 p-3 border border-slate-800 flex items-start gap-2.5">
              <Receipt className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-bold">Nominal Kuitansi</div>
                <div className="text-emerald-400 font-mono font-bold mt-0.5">{formatIDR(ev.invoiceAmountIDR || milestone.releaseAmountIDR)}</div>
              </div>
            </div>

            <div className="rounded-xl bg-slate-950 p-3 border border-slate-800 flex items-start gap-2.5">
              <MapPin className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-bold">Lokasi Pelaksanaan</div>
                <div className="text-slate-200 font-semibold mt-0.5">{ev.locationGeo || 'Titik Koordinat Proyek'}</div>
              </div>
            </div>

            <div className="rounded-xl bg-slate-950 p-3 border border-slate-800 flex items-start gap-2.5">
              <ShieldCheck className="h-4 w-4 text-teal-400 mt-0.5 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-bold">Status Escrow</div>
                <div className="text-slate-200 font-semibold mt-0.5 capitalize">
                  {milestone.status === 'released' && 'Sudah Dicairkan'}
                  {milestone.status === 'verified' && 'Terverifikasi'}
                  {milestone.status === 'submitted' && 'Dalam Verifikasi'}
                  {milestone.status === 'pending' && 'Terkunci'}
                  {milestone.status === 'rejected' && 'Perlu Perbaikan'}
                </div>
              </div>
            </div>
          </div>

          {/* Deliverable Description */}
          <div>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Ringkasan Bukti Pelaksanaan
            </h4>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed">
              {ev.description}
            </div>
          </div>

          {/* Cryptographic Hashes Section */}
          <div>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Bukti Hash Kriptografis (Tersimpan di Blockchain)</span>
              <span className="text-[10px] text-emerald-400 font-mono">Keccak-256 Terverifikasi</span>
            </h4>
            
            <div className="space-y-2">
              {/* IPFS CID */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono">
                <div className="truncate flex-1 pr-2">
                  <span className="text-slate-500 mr-2">IPFS CID:</span>
                  <span className="text-slate-300">{ev.ipfsCID}</span>
                </div>
                <button
                  onClick={() => handleCopy(ev.ipfsCID, 'cid')}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1 text-[11px]"
                >
                  {copiedHash === 'cid' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedHash === 'cid' ? 'Disalin' : 'Salin'}</span>
                </button>
              </div>

              {/* SHA-256 */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono">
                <div className="truncate flex-1 pr-2">
                  <span className="text-slate-500 mr-2">SHA-256:</span>
                  <span className="text-emerald-400">{ev.sha256Hash}</span>
                </div>
                <button
                  onClick={() => handleCopy(ev.sha256Hash, 'sha')}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1 text-[11px]"
                >
                  {copiedHash === 'sha' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedHash === 'sha' ? 'Disalin' : 'Salin'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Audit Notes if available */}
          {milestone.auditNotes && (
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">
                Catatan Hasil Audit Verifier
              </div>
              <p className="text-xs text-slate-300 italic">
                "{milestone.auditNotes}"
              </p>
              {milestone.verifierAddress && (
                <div className="mt-2 text-[10px] text-slate-400 font-mono">
                  Diverifikasi oleh: {formatAddress(milestone.verifierAddress, 6)}
                </div>
              )}
            </div>
          )}

          {/* Verifier Actions Toolbar (Only for Verifier and Submitted Milestones) */}
          {currentRole === 'verifier' && milestone.status === 'submitted' && (
            <div className="rounded-xl bg-slate-950 p-4 border border-cyan-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-cyan-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Keputusan Verifikasi Auditor
                  </span>
                </div>
                <span className="text-[10px] text-cyan-300 font-mono">Mode Auditor Terakreditasi</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Catatan Audit & Pernyataan Kelayakan Dokumen:
                </label>
                <textarea
                  rows={2}
                  value={auditNotes}
                  onChange={(e) => setAuditNotes(e.target.value)}
                  placeholder="Tuliskan hasil evaluasi bukti faktual sebelum menandatangani persetujuan di smart contract..."
                  className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  disabled={isVerifying}
                  onClick={() => handleVerify(false)}
                  className="px-3.5 py-2 rounded-lg bg-red-950/80 border border-red-800 text-red-300 hover:bg-red-900/80 text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  <span>Tolak Bukti (Minta Perbaikan)</span>
                </button>

                <button
                  type="button"
                  disabled={isVerifying}
                  onClick={() => handleVerify(true)}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Setujui & Otorisasi Pencairan Escrow</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="py-2 px-5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
