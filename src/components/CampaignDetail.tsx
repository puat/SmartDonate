import React, { useState } from 'react';
import { Campaign, Milestone, UserRole, AccountProfile } from '../types';
import { formatIDR, formatAddress } from '../blockchain/ethereumService';
import { 
  ArrowLeft, 
  ShieldCheck, 
  Lock, 
  Coins, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileText, 
  Upload, 
  Users, 
  MapPin,
  Building,
  Check
} from 'lucide-react';
import { ProofViewerModal } from './ProofViewerModal';
import { EvidenceModal } from './EvidenceModal';

interface CampaignDetailProps {
  campaign: Campaign;
  onBack: () => void;
  onOpenDonate: () => void;
  currentRole: UserRole;
  currentAccount: AccountProfile;
  onSubmitEvidence: (campaignId: number, milestoneId: number, data: any) => Promise<any>;
  onVerifyMilestone: (campaignId: number, milestoneId: number, approved: boolean, notes: string) => Promise<any>;
  onReleaseFunds: (campaignId: number, milestoneId: number) => Promise<any>;
  onViewTx: (hash: string) => void;
}

export const CampaignDetail: React.FC<CampaignDetailProps> = ({
  campaign,
  onBack,
  onOpenDonate,
  currentRole,
  currentAccount,
  onSubmitEvidence,
  onVerifyMilestone,
  onReleaseFunds,
  onViewTx
}) => {
  const [selectedMilestoneForProof, setSelectedMilestoneForProof] = useState<Milestone | null>(null);
  const [selectedMilestoneForEvidence, setSelectedMilestoneForEvidence] = useState<Milestone | null>(null);
  const [isReleasingMilestoneId, setIsReleasingMilestoneId] = useState<number | null>(null);
  const [releaseSuccessMsg, setReleaseSuccessMsg] = useState<string | null>(null);

  const percentFunded = Math.min(100, Math.round((campaign.totalDonatedIDR / campaign.targetIDR) * 100));
  const escrowLockedIDR = Math.max(0, campaign.totalDonatedIDR - campaign.totalReleasedIDR);

  const handleRelease = async (mId: number) => {
    setIsReleasingMilestoneId(mId);
    try {
      const res = await onReleaseFunds(campaign.id, mId);
      setReleaseSuccessMsg(`Dana milestone berhasil dicairkan ke rekening resmi penerima manfaat! Tx: ${res.txHash.substring(0, 12)}...`);
      setTimeout(() => setReleaseSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Gagal memproses pencairan dana milestone.');
    } finally {
      setIsReleasingMilestoneId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
      
      {/* Back button */}
      <button
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Kembali ke Daftar Program</span>
      </button>

      {/* Main Campaign Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Main Content */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Hero Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800">
            <div className="relative h-72 w-full overflow-hidden bg-slate-950">
              <img 
                src={campaign.imageUrl} 
                alt={campaign.title}
                className="h-full w-full object-cover" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
              
              {/* Category and Badges */}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span className="px-3 py-1 rounded-md bg-slate-950/80 backdrop-blur-md border border-slate-700/80 text-xs font-semibold text-emerald-400">
                  {campaign.category}
                </span>
                <span className="px-3 py-1 rounded-md bg-slate-950/80 backdrop-blur-md border border-slate-700/80 text-xs font-medium text-slate-300 flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-cyan-400" />
                  <span>{campaign.location}</span>
                </span>
              </div>
            </div>

            <div className="p-6 sm:p-8 -mt-12 relative">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {campaign.title}
              </h1>
              <p className="mt-3 text-sm text-slate-300 leading-relaxed font-normal">
                {campaign.tagline}
              </p>

              {/* Creator & Beneficiary Bar */}
              <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-slate-400 border-t border-slate-800/80 pt-4">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">Pengelola:</span>
                  <span className="text-slate-300 font-semibold">{campaign.managerName}</span>
                </div>
                <span className="text-slate-700">·</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">Penerima Manfaat:</span>
                  <span className="text-emerald-400 font-semibold">{campaign.beneficiaryName}</span>
                </div>
                <span className="text-slate-700">·</span>
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-cyan-400" />
                  <span>{campaign.donationsCount} Donatur Terverifikasi</span>
                </div>
              </div>
            </div>
          </div>

          {/* Release success notification toast */}
          {releaseSuccessMsg && (
            <div className="rounded-xl bg-emerald-950/90 p-4 border border-emerald-500/80 text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{releaseSuccessMsg}</span>
            </div>
          )}

          {/* Detailed Description */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8">
            <h2 className="text-base font-bold text-white uppercase tracking-wider mb-3">
              Tentang Inisiatif Ini
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              {campaign.description}
            </p>
          </div>

          {/* Milestone Escrow Schedule & Pipeline */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-5 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <Lock className="h-5 w-5 text-amber-400" />
                  <span>Tahap Pencairan Dana (Milestone Escrow)</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Dana donasi dikunci di smart contract dan dicairkan bertahap setelah bukti faktual diverifikasi oleh auditor.
                </p>
              </div>

              {/* Role Indicator */}
              <div className="text-xs font-mono px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300">
                Mode Simulasi: <strong className="text-emerald-400 uppercase">{currentRole}</strong>
              </div>
            </div>

            {/* Milestones List */}
            <div className="mt-6 space-y-4">
              {campaign.milestones.map((milestone, idx) => {
                const isReleased = milestone.status === 'released';
                const isVerified = milestone.status === 'verified';
                const isSubmitted = milestone.status === 'submitted';
                const isPending = milestone.status === 'pending';
                const isRejected = milestone.status === 'rejected';

                return (
                  <div
                    key={milestone.id}
                    className={`rounded-xl border p-5 transition-all ${
                      isReleased
                        ? 'bg-emerald-950/30 border-emerald-800/60'
                        : isVerified
                        ? 'bg-teal-950/30 border-teal-700/60'
                        : isSubmitted
                        ? 'bg-cyan-950/30 border-cyan-700/60'
                        : 'bg-slate-950/80 border-slate-800'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-slate-400">
                            Tahap {idx + 1} ({milestone.percentage}%)
                          </span>
                          
                          {/* Status Badge */}
                          {isReleased && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-700">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Sudah Dicairkan</span>
                            </span>
                          )}
                          {isVerified && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-300 bg-teal-950/80 px-2 py-0.5 rounded border border-teal-600">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Terverifikasi Auditor</span>
                            </span>
                          )}
                          {isSubmitted && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-600">
                              <Clock className="h-3 w-3" />
                              <span>Dalam Verifikasi</span>
                            </span>
                          )}
                          {isPending && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                              <Lock className="h-3 w-3" />
                              <span>Terkunci</span>
                            </span>
                          )}
                          {isRejected && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-300 bg-red-950 px-2 py-0.5 rounded border border-red-800">
                              <AlertCircle className="h-3 w-3" />
                              <span>Perlu Perbaikan Bukti</span>
                            </span>
                          )}
                        </div>

                        <h3 className="mt-1.5 text-sm font-bold text-white">
                          {milestone.title}
                        </h3>
                        <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                          {milestone.description}
                        </p>
                      </div>

                      {/* Right Amount Column */}
                      <div className="text-left sm:text-right shrink-0">
                        <div className="text-sm font-extrabold font-mono text-white">
                          {formatIDR(milestone.releaseAmountIDR)}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Alokasi {milestone.percentage}% Dana
                        </div>
                      </div>
                    </div>

                    {/* Milestone Actions Toolbar */}
                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                      <div className="text-xs text-slate-500 font-mono">
                        {milestone.evidence ? (
                          <span>Bukti Terunggah: {milestone.evidence.fileName}</span>
                        ) : (
                          <span>Belum ada dokumen bukti yang diunggah</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Inspect Proof Button */}
                        {milestone.evidence && (
                          <button
                            onClick={() => setSelectedMilestoneForProof(milestone)}
                            className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5"
                          >
                            <FileText className="h-3.5 w-3.5 text-cyan-400" />
                            <span>Lihat Detail & Bukti</span>
                          </button>
                        )}

                        {/* Submit Evidence (Pengelola role or pending status) */}
                        {(isPending || isRejected) && (currentRole === 'pengelola' || currentRole === 'donatur') && (
                          <button
                            onClick={() => setSelectedMilestoneForEvidence(milestone)}
                            className="py-1.5 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold transition-colors flex items-center gap-1.5"
                          >
                            <Upload className="h-3.5 w-3.5" />
                            <span>Unggah Bukti Tahap Ini</span>
                          </button>
                        )}

                        {/* Release Funds Button (When Verified) */}
                        {isVerified && (
                          <button
                            onClick={() => handleRelease(milestone.id)}
                            disabled={isReleasingMilestoneId === milestone.id}
                            className="py-1.5 px-3.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                          >
                            {isReleasingMilestoneId === milestone.id ? (
                              <span className="h-3.5 w-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Check className="h-3.5 w-3.5" />
                            )}
                            <span>Cairkan {formatIDR(milestone.releaseAmountIDR)} ke Rekening Penerima</span>
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right 1 Col: Floating Sticky Escrow Summary */}
        <div className="space-y-6">
          
          <div className="sticky top-24 rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-xl">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status Dana Escrow</span>
              <span className="flex items-center gap-1 text-[11px] font-mono font-medium text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Audit Blockchain Aktif
              </span>
            </div>

            {/* Total Raised & Target */}
            <div className="mt-5">
              <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
                {formatIDR(campaign.totalDonatedIDR)}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Terkumpul dari target <strong className="text-slate-200 font-mono">{formatIDR(campaign.targetIDR)}</strong>
              </div>

              {/* Progress bar */}
              <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                  style={{ width: `${percentFunded}%` }}
                />
              </div>
              <div className="mt-1.5 flex justify-between text-xs text-slate-400">
                <span>{percentFunded}% Target Tercapai</span>
                <span>{campaign.donationsCount} Donatur</span>
              </div>
            </div>

            {/* Escrow Breakdown Cards */}
            <div className="mt-6 space-y-2.5">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-amber-400" />
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Dana dalam Escrow</div>
                    <div className="text-slate-300 text-[11px]">Terkunci menunggu verifikasi</div>
                  </div>
                </div>
                <div className="text-right font-mono font-bold text-amber-300 text-sm">
                  {formatIDR(escrowLockedIDR)}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Telah Dicairkan</div>
                    <div className="text-slate-300 text-[11px]">Tersalurkan ke penerima manfaat</div>
                  </div>
                </div>
                <div className="text-right font-mono font-bold text-emerald-400 text-sm">
                  {formatIDR(campaign.totalReleasedIDR)}
                </div>
              </div>
            </div>

            {/* Donate CTA */}
            <div className="mt-6">
              <button
                onClick={onOpenDonate}
                disabled={campaign.isFrozen}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.99] disabled:opacity-50"
              >
                Donasi Sekarang ke Escrow
              </button>
              <p className="mt-2 text-center text-[11px] text-slate-500">
                Metode Pembayaran: QRIS, Transfer Bank, dan Virtual Account
              </p>
            </div>

            {/* Smart Contract Security Badges */}
            <div className="mt-6 pt-5 border-t border-slate-800 text-xs space-y-2 text-slate-400">
              <div className="flex items-center gap-2 text-slate-300 font-semibold">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>Jaminan Transparansi Smart Contract</span>
              </div>
              <ul className="space-y-1.5 text-[11px] text-slate-400 pl-6 list-disc">
                <li>Dana tidak dapat dicairkan sekaligus oleh pengelola program.</li>
                <li>Setiap pencairan wajib didukung bukti faktual (kuitansi, BAST, foto koordinat).</li>
                <li>Auditor independen memeriksa keaslian bukti sebelum pencairan disetujui di blockchain.</li>
              </ul>
            </div>

          </div>

        </div>

      </div>

      {/* Modals */}
      {selectedMilestoneForProof && (
        <ProofViewerModal
          milestone={selectedMilestoneForProof}
          isOpen={true}
          onClose={() => setSelectedMilestoneForProof(null)}
          currentRole={currentRole}
          onVerifyMilestone={async (mId, approved, notes) => {
            await onVerifyMilestone(campaign.id, mId, approved, notes);
          }}
        />
      )}

      {selectedMilestoneForEvidence && (
        <EvidenceModal
          campaign={campaign}
          milestone={selectedMilestoneForEvidence}
          isOpen={true}
          onClose={() => setSelectedMilestoneForEvidence(null)}
          onSubmitEvidence={onSubmitEvidence}
          currentAccount={currentAccount}
          onViewTx={onViewTx}
        />
      )}

    </div>
  );
};
