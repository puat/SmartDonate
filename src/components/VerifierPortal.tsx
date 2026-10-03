import React, { useState } from 'react';
import { Campaign, Milestone, UserRole, AccountProfile } from '../types';
import { formatIDR, formatAddress } from '../blockchain/ethereumService';
import { 
  ShieldCheck, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  FileSearch, 
  Lock, 
  Search, 
  Hash, 
  XCircle, 
  Building, 
  Snowflake,
  Play
} from 'lucide-react';
import { ProofViewerModal } from './ProofViewerModal';

interface VerifierPortalProps {
  campaigns: Campaign[];
  currentRole: UserRole;
  currentAccount: AccountProfile;
  onVerifyMilestone: (campaignId: number, milestoneId: number, approved: boolean, notes: string) => Promise<any>;
  onFreezeCampaign: (campaignId: number, freeze: boolean, reason?: string) => Promise<any>;
  onVerifyHash: (hash: string) => Promise<any>;
}

export const VerifierPortal: React.FC<VerifierPortalProps> = ({
  campaigns,
  currentRole,
  currentAccount,
  onVerifyMilestone,
  onFreezeCampaign,
  onVerifyHash
}) => {
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);

  // Hash verification tool state
  const [hashInput, setHashInput] = useState<string>('');
  const [hashResult, setHashResult] = useState<any | null>(null);
  const [isCheckingHash, setIsCheckingHash] = useState<boolean>(false);

  // Emergency Freeze modal state
  const [freezingCampaign, setFreezingCampaign] = useState<Campaign | null>(null);
  const [freezeReason, setFreezeReason] = useState<string>('Ditemukan indikasi ketidaksesuaian kuitansi yang memerlukan investigasi faktual lanjutan.');
  const [isProcessingFreeze, setIsProcessingFreeze] = useState<boolean>(false);

  // Gather all pending milestones across all campaigns
  const pendingQueue: { campaign: Campaign; milestone: Milestone }[] = [];
  campaigns.forEach(c => {
    c.milestones.forEach(m => {
      if (m.status === 'submitted') {
        pendingQueue.push({ campaign: c, milestone: m });
      }
    });
  });

  const verifiedCount = campaigns.reduce((acc, c) => {
    return acc + c.milestones.filter(m => m.status === 'verified' || m.status === 'released').length;
  }, 0);

  const pendingEscrowIDR = pendingQueue.reduce((acc, item) => acc + item.milestone.releaseAmountIDR, 0);

  const handleInspect = (cId: number, m: Milestone) => {
    setSelectedCampaignId(cId);
    setSelectedMilestone(m);
  };

  const handleCheckHash = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hashInput.trim()) return;
    setIsCheckingHash(true);
    setHashResult(null);
    try {
      const res = await onVerifyHash(hashInput.trim());
      setHashResult(res);
    } catch (err: any) {
      setHashResult({ found: false, message: err.message || "Gagal memverifikasi hash dokumen" });
    } finally {
      setIsCheckingHash(false);
    }
  };

  const handleToggleFreeze = async () => {
    if (!freezingCampaign) return;
    setIsProcessingFreeze(true);
    try {
      await onFreezeCampaign(freezingCampaign.id, !freezingCampaign.isFrozen, freezeReason);
      setFreezingCampaign(null);
    } catch (err: any) {
      alert(err.message || "Gagal memperbarui status pembekuan program.");
    } finally {
      setIsProcessingFreeze(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300 space-y-8">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-emerald-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Portal Verifikasi & Audit Independen
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-400 max-w-2xl">
            Verifikator dan auditor independen meninjau keabsahan dokumen Berita Acara Serah Terima (BAST), kuitansi pembelian, dan foto lapangan sebelum smart contract mengotorisasi pencairan dana.
          </p>
        </div>

        {/* Current Verifier Identity Badge */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800">
          <img 
            src={currentAccount.avatar} 
            alt={currentAccount.name}
            className="h-10 w-10 rounded-full object-cover ring-2 ring-emerald-500/40" 
          />
          <div className="text-xs">
            <div className="font-bold text-white flex items-center gap-1.5">
              <span>{currentAccount.name}</span>
              <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase bg-emerald-950 px-1 rounded">
                Verifier Terakreditasi
              </span>
            </div>
            <div className="text-slate-400 font-mono mt-0.5">{formatAddress(currentAccount.address, 4)}</div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Menunggu Verifikasi</span>
            <Clock className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-white font-mono">
            {pendingQueue.length} Tahapan
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Memerlukan persetujuan auditor</div>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Escrow Ditinjau</span>
            <Lock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-amber-300 font-mono">
            {formatIDR(pendingEscrowIDR)}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Nilai dana yang sedang diaudit</div>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Milestone Disetujui</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-emerald-400 font-mono">
            {verifiedCount}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Tahapan telah lolos audit faktual</div>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Indeks Kepatuhan Audit</span>
            <ShieldCheck className="h-4 w-4 text-teal-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-white font-mono">
            {currentAccount.reputationScore || 99}%
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Tingkat akurasi audit konsensus</div>
        </div>

      </div>

      {/* Antrean Verifikasi Milestone */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 sm:p-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <FileSearch className="h-5 w-5 text-cyan-400" />
              <span>Antrean Pengajuan Bukti Milestone</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Berkas bukti dari pengelola program donasi yang menunggu audit kesesuaian dan tanda tangan kriptografis.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-cyan-400 px-2 py-1 rounded bg-cyan-950 border border-cyan-800">
            {pendingQueue.length} Pengajuan
          </span>
        </div>

        {pendingQueue.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
            <span>Seluruh berkas bukti milestone telah selesai diverifikasi!</span>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {pendingQueue.map(({ campaign, milestone }) => (
              <div 
                key={`${campaign.id}-${milestone.id}`}
                className="rounded-xl bg-slate-950 border border-slate-800 p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:border-cyan-800 transition-colors"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-emerald-400">{campaign.category}</span>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-300 font-semibold">{campaign.title}</span>
                  </div>

                  <h3 className="text-sm font-bold text-white">
                    {milestone.title}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-1">
                    {milestone.evidence?.description || milestone.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 font-mono pt-1">
                    <span>Rekanan: {milestone.evidence?.contractorName || 'Rekanan Terdaftar'}</span>
                    <span>·</span>
                    <span>IPFS: {milestone.evidence?.ipfsCID.substring(0, 16)}...</span>
                    <span>·</span>
                    <span className="text-emerald-400 font-bold">Nominal: {formatIDR(milestone.releaseAmountIDR)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleInspect(campaign.id, milestone)}
                    className="py-2 px-3.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <FileSearch className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Lihat Bukti</span>
                  </button>

                  <button
                    onClick={() => handleInspect(campaign.id, milestone)}
                    className="py-2 px-4 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Audit & Verifikasi</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Verifikator Hash Dokumen & Kuitansi */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 sm:p-8">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Hash className="h-5 w-5 text-emerald-400" />
            <span>Verifikator Dokumen & Hash Kriptografis</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Periksa apakah kuitansi, dokumen BAST, atau ID Transaksi terdaftar asli dan tidak dimanipulasi pada blockchain.
          </p>
        </div>

        <form onSubmit={handleCheckHash} className="mt-5 flex gap-2">
          <input
            type="text"
            value={hashInput}
            onChange={(e) => setHashInput(e.target.value)}
            placeholder="Masukkan Hash SHA-256, IPFS CID (bafybeic...), ID Donasi (DON-...), atau Tx Hash..."
            className="flex-1 rounded-xl bg-slate-950 border border-slate-800 px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <button
            type="submit"
            disabled={isCheckingHash}
            className="py-2.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1.5"
          >
            {isCheckingHash ? (
              <span className="h-3.5 w-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Search className="h-3.5 w-3.5" />
            )}
            <span>Verifikasi Hash</span>
          </button>
        </form>

        {/* Preset quick test hashes */}
        <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
          <span>Contoh uji:</span>
          <button 
            type="button"
            onClick={() => setHashInput("0x3f58a719d2b8c949f5791a27e8913b2c45167a80b12e34d56789f2a1b490214a")}
            className="text-cyan-400 hover:underline font-mono"
          >
            SHA-256 Pompa Alkon Riau
          </button>
          <span>·</span>
          <button 
            type="button"
            onClick={() => setHashInput("DON-2026-000124")}
            className="text-cyan-400 hover:underline font-mono"
          >
            ID Donasi DON-2026-000124
          </button>
        </div>

        {hashResult && (
          <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
            {hashResult.found ? (
              <div className="space-y-1.5 text-slate-300">
                <div className="flex items-center gap-2 text-emerald-400 font-bold font-sans">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Kecocokan Kriptografis Pada Blockchain Terkonfirmasi!</span>
                </div>
                <div>Tipe Arsip: <strong className="text-white">{hashResult.type}</strong></div>
                {hashResult.campaignTitle && (
                  <div>Program: <span className="text-slate-300">{hashResult.campaignTitle}</span></div>
                )}
                {hashResult.milestoneTitle && (
                  <div>Milestone: <span className="text-slate-300">{hashResult.milestoneTitle}</span></div>
                )}
                {hashResult.evidence && (
                  <div>Rekanan: <span className="text-emerald-400">{hashResult.evidence.contractorName}</span></div>
                )}
                {hashResult.evidence && (
                  <div>Nominal Kuitansi: <span className="text-emerald-400 font-bold">{formatIDR(hashResult.evidence.invoiceAmountIDR)}</span></div>
                )}
              </div>
            ) : (
              <div className="text-red-400 flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                <span>{hashResult.message || 'Hash tidak ditemukan dalam arsip blockchain SmartDonate.'}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Platform Anti-Fraud & Circuit Breaker */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 sm:p-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              <span>Anti-Fraud & Tombol Pengaman Dana (Circuit Breaker)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Auditor memiliki wewenang membekukan program jika terindikasi ketidaksesuaian laporan, mencegah penarikan dana escrow.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {campaigns.map((camp) => (
            <div 
              key={camp.id}
              className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4"
            >
              <div>
                <div className="text-xs font-bold text-white">{camp.title}</div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Terkumpul: {formatIDR(camp.totalDonatedIDR)} · Penerima: {camp.beneficiaryName}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {camp.isFrozen ? (
                  <span className="px-2.5 py-1 rounded bg-red-950 text-red-300 border border-red-800 text-xs font-semibold">
                    Dibekukan
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs font-semibold">
                    Aktif Normal
                  </span>
                )}

                <button
                  onClick={() => setFreezingCampaign(camp)}
                  className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                    camp.isFrozen
                      ? 'bg-slate-800 hover:bg-slate-700 text-white'
                      : 'bg-red-950 hover:bg-red-900 text-red-300 border border-red-800'
                  }`}
                >
                  {camp.isFrozen ? <Play className="h-3.5 w-3.5" /> : <Snowflake className="h-3.5 w-3.5" />}
                  <span>{camp.isFrozen ? 'Buka Pembekuan' : 'Bekukan Program'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Freeze Confirmation Modal */}
      {freezingCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              <span>{freezingCampaign.isFrozen ? 'Konfirmasi Buka Pembekuan' : 'Konfirmasi Pembekuan Darurat'}</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {freezingCampaign.isFrozen 
                ? `Tindakan ini akan memulihkan aktivitas donasi dan pencairan milestone untuk "${freezingCampaign.title}".`
                : `Pembekuan "${freezingCampaign.title}" akan menghentikan seluruh transaksi dan mengunci dana escrow demi keamanan sampai audit selesai.`}
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Alasan Resmi (Akan Dicatat di Audit Trail):
              </label>
              <textarea
                rows={2}
                value={freezeReason}
                onChange={(e) => setFreezeReason(e.target.value)}
                className="w-full rounded-lg bg-slate-950 border border-slate-800 p-2 text-xs text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setFreezingCampaign(null)}
                className="py-2 px-4 rounded-lg bg-slate-800 text-white text-xs font-medium"
              >
                Batal
              </button>
              <button
                disabled={isProcessingFreeze}
                onClick={handleToggleFreeze}
                className="py-2 px-4 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold"
              >
                {isProcessingFreeze ? 'Memperbarui Blockchain...' : (freezingCampaign.isFrozen ? 'Buka Pembekuan' : 'Eksekusi Pembekuan')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proof Inspection Modal */}
      {selectedMilestone && selectedCampaignId && (
        <ProofViewerModal
          milestone={selectedMilestone}
          isOpen={true}
          onClose={() => {
            setSelectedMilestone(null);
            setSelectedCampaignId(null);
          }}
          currentRole={currentRole}
          onVerifyMilestone={async (mId, approved, notes) => {
            await onVerifyMilestone(selectedCampaignId, mId, approved, notes);
          }}
        />
      )}

    </div>
  );
};
