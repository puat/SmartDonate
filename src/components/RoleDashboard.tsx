import React, { useState } from 'react';
import { 
  Campaign, 
  AuditLog, 
  UserRole, 
  AccountProfile,
  Milestone,
  BlockchainStats
} from '../types';
import { formatIDR, formatAddress } from '../blockchain/ethereumService';
import { 
  Heart, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  ExternalLink, 
  FileText, 
  AlertCircle,
  Award,
  Layers,
  Upload,
  PlusCircle
} from 'lucide-react';

interface RoleDashboardProps {
  currentRole: UserRole;
  currentAccount: AccountProfile;
  campaigns: Campaign[];
  auditLogs: AuditLog[];
  blockchainStats: BlockchainStats | null;
  onSelectCampaign: (c: Campaign) => void;
  onOpenCreateCampaign: () => void;
  onOpenVerifierQueue: () => void;
  onViewTx: (hash: string) => void;
  onOpenSubmitEvidence: (c: Campaign, m: Milestone) => void;
}

export const RoleDashboard: React.FC<RoleDashboardProps> = ({
  currentRole,
  currentAccount,
  campaigns,
  auditLogs,
  blockchainStats,
  onSelectCampaign,
  onOpenCreateCampaign,
  onOpenVerifierQueue,
  onViewTx,
  onOpenSubmitEvidence
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'audit'>('overview');

  // Calculations in IDR
  const totalDonasiPlatform = campaigns.reduce((acc, c) => acc + c.totalDonatedIDR, 0);
  const totalDanaEscrow = campaigns.reduce((acc, c) => acc + Math.max(0, c.totalDonatedIDR - c.totalReleasedIDR), 0);
  const totalDanaDicairkan = campaigns.reduce((acc, c) => acc + c.totalReleasedIDR, 0);
  const programAktifCount = campaigns.filter(c => !c.isCompleted && !c.isFrozen).length;
  
  const pendingMilestonesCount = campaigns.reduce((acc, c) => {
    return acc + c.milestones.filter(m => m.status === 'submitted').length;
  }, 0);

  const totalProgramDidukung = 4; // Siti Rahma profile

  // Milestones that need evidence for manager
  const managerPendingMilestones: { campaign: Campaign; milestone: Milestone }[] = [];
  campaigns.forEach(c => {
    c.milestones.forEach(m => {
      if (m.status === 'pending' || m.status === 'rejected') {
        managerPendingMilestones.push({ campaign: c, milestone: m });
      }
    });
  });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300 space-y-8">
      
      {/* Profile Header */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-5">
          <img 
            src={currentAccount.avatar} 
            alt={currentAccount.name}
            className="h-20 w-20 rounded-2xl object-cover ring-2 ring-emerald-500/50 shadow-lg" 
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-white tracking-tight">{currentAccount.name}</h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase bg-emerald-950 text-emerald-400 border border-emerald-800">
                {currentRole === 'donatur' && 'Donatur'}
                {currentRole === 'pengelola' && 'Pengelola Program'}
                {currentRole === 'verifier' && 'Verifier Independen'}
                {currentRole === 'admin' && 'Administrator'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              {currentAccount.description}
            </p>
            <div className="flex items-center gap-3 mt-3 text-xs font-mono text-slate-400">
              <span>Alamat Wallet: {formatAddress(currentAccount.address, 5)}</span>
              <span>·</span>
              <span className="text-emerald-400 font-bold">Saldo Tersedia: {formatIDR(currentAccount.balanceIDR)}</span>
            </div>
          </div>
        </div>

        {/* Role Quick CTA */}
        <div className="flex items-center gap-3">
          {currentRole === 'pengelola' && (
            <button
              onClick={onOpenCreateCampaign}
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs transition-all shadow-md flex items-center gap-1.5"
            >
              <PlusCircle className="h-4 w-4" />
              <span>+ Buat Program Baru</span>
            </button>
          )}

          {currentRole === 'verifier' && (
            <button
              onClick={onOpenVerifierQueue}
              className="py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-md"
            >
              Buka Antrean Verifikasi
            </button>
          )}

          {currentRole === 'donatur' && (
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-right">
              <div className="text-[10px] text-slate-500 uppercase font-bold">Tingkat Kontributor</div>
              <div className="text-xs font-bold text-emerald-400 flex items-center gap-1 justify-end mt-0.5">
                <Award className="h-3.5 w-3.5" />
                <span>Sahabat Kemanusiaan Utama</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 7 Required Indonesian Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[10px] text-slate-400 font-semibold uppercase">Total Donasi</div>
          <div className="mt-1 text-sm font-bold text-white font-mono">{formatIDR(totalDonasiPlatform)}</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[10px] text-slate-400 font-semibold uppercase">Program Didukung</div>
          <div className="mt-1 text-sm font-bold text-cyan-300 font-mono">{totalProgramDidukung} Program</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[10px] text-slate-400 font-semibold uppercase">Program Aktif</div>
          <div className="mt-1 text-sm font-bold text-emerald-400 font-mono">{programAktifCount} Inisiatif</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[10px] text-slate-400 font-semibold uppercase">Dana dalam Escrow</div>
          <div className="mt-1 text-sm font-bold text-amber-300 font-mono">{formatIDR(totalDanaEscrow)}</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[10px] text-slate-400 font-semibold uppercase">Telah Dicairkan</div>
          <div className="mt-1 text-sm font-bold text-emerald-400 font-mono">{formatIDR(totalDanaDicairkan)}</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[10px] text-slate-400 font-semibold uppercase">Menunggu Verifikasi</div>
          <div className="mt-1 text-sm font-bold text-cyan-400 font-mono">{pendingMilestonesCount} Milestone</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[10px] text-slate-400 font-semibold uppercase">Transaksi Blockchain</div>
          <div className="mt-1 text-sm font-bold text-white font-mono">{blockchainStats?.totalTransactions || auditLogs.length} Tx</div>
        </div>
      </div>

      {/* Tabs: Role Overview vs Immutable Audit Trail */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === 'overview'
              ? 'bg-slate-800 text-white font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          {currentRole === 'donatur' && 'Ringkasan Donasi Saya'}
          {currentRole === 'pengelola' && 'Panel Pengelola Program'}
          {currentRole === 'verifier' && 'Buku Kerja Verifikator'}
          {currentRole === 'admin' && 'Tata Kelola Escrow'}
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'audit'
              ? 'bg-slate-800 text-white font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="h-3.5 w-3.5 text-cyan-400" />
          <span>Jejak Audit Blockchain ({auditLogs.length} Catatan)</span>
        </button>
      </div>

      {activeTab === 'overview' ? (
        <div className="space-y-8">
          
          {/* DONATUR VIEW */}
          {currentRole === 'donatur' && (
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-white">
                  Program Kemanusiaan yang Anda Dukung
                </h3>
                <span className="text-xs text-emerald-400 font-mono">100% Escrow Terlindungi</span>
              </div>
              <div className="space-y-3">
                {campaigns.slice(0, 4).map((camp) => (
                  <div 
                    key={camp.id}
                    onClick={() => onSelectCampaign(camp)}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <img 
                        src={camp.imageUrl} 
                        alt={camp.title}
                        className="h-12 w-12 rounded-lg object-cover" 
                      />
                      <div>
                        <div className="text-xs font-bold text-white hover:text-emerald-400">{camp.title}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Terkumpul: {formatIDR(camp.totalDonatedIDR)} dari target {formatIDR(camp.targetIDR)}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-emerald-400">Lihat Progres & Bukti →</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PENGELOLA VIEW */}
          {currentRole === 'pengelola' && (
            <div className="space-y-6">
              {managerPendingMilestones.length > 0 && (
                <div className="rounded-2xl bg-slate-900 border border-cyan-800/60 p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <Upload className="h-5 w-5 text-cyan-400" />
                        <span>Tindakan Diperlukan: Unggah Bukti Pelaksanaan Milestone</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Unggah kuitansi belanja, BAST, dan foto lapangan untuk membuka pencairan dana escrow tahap selanjutnya.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {managerPendingMilestones.slice(0, 3).map(({ campaign, milestone }) => (
                      <div 
                        key={`${campaign.id}-${milestone.id}`}
                        className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4"
                      >
                        <div>
                          <div className="text-xs font-semibold text-slate-400">{campaign.title}</div>
                          <div className="text-sm font-bold text-white mt-0.5">{milestone.title}</div>
                          <div className="text-[11px] text-emerald-400 font-mono mt-0.5">
                            Nilai Pencairan: {formatIDR(milestone.releaseAmountIDR)} ({milestone.percentage}%)
                          </div>
                        </div>

                        <button
                          onClick={() => onOpenSubmitEvidence(campaign, milestone)}
                          className="py-2 px-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1.5"
                        >
                          <Upload className="h-3.5 w-3.5" />
                          <span>Unggah Bukti</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VERIFIER / ADMIN VIEW */}
          {(currentRole === 'verifier' || currentRole === 'admin') && (
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-white">
                  Program Donasi dalam Pengawasan Smart Contract
                </h3>
                <button
                  onClick={onOpenVerifierQueue}
                  className="text-xs text-cyan-400 hover:underline font-semibold"
                >
                  Buka Antrean Verifikasi ({pendingMilestonesCount}) →
                </button>
              </div>

              <div className="space-y-3">
                {campaigns.map((camp) => (
                  <div 
                    key={camp.id}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4 text-xs"
                  >
                    <div>
                      <div className="font-bold text-white">{camp.title}</div>
                      <div className="text-slate-400 mt-0.5">
                        Penerima: {camp.beneficiaryName} · Wilayah: {camp.location}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-emerald-400 font-bold">{formatIDR(camp.totalDonatedIDR)}</div>
                      <div className="text-[10px] text-slate-500">Tersalur: {formatIDR(camp.totalReleasedIDR)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      ) : (
        /* IMMUTABLE AUDIT TRAIL TAB IN BAHASA INDONESIA */
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <span>Buku Besar Jejak Audit Blockchain (Transparansi Penuh)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Setiap aktivitas donasi, pengajuan bukti kuitansi, persetujuan verifier, dan pencairan dana dicatat permanen di blockchain.
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-400">Total {auditLogs.length} Catatan On-Chain</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 text-[11px]">
                <tr>
                  <th className="py-3 px-3">ID Transaksi / Hash</th>
                  <th className="py-3 px-3">Program</th>
                  <th className="py-3 px-3 text-right">Nominal</th>
                  <th className="py-3 px-3">Jenis Aktivitas</th>
                  <th className="py-3 px-3">Tanggal</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Blok</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {auditLogs.map((log) => {
                  let badgeColor = "text-slate-300 bg-slate-800 border-slate-700";
                  if (log.activityName === 'Donasi') badgeColor = "text-emerald-400 bg-emerald-950/80 border-emerald-800";
                  if (log.activityName === 'Verifikasi Milestone') badgeColor = "text-teal-300 bg-teal-950/80 border-teal-800";
                  if (log.activityName === 'Pencairan Dana') badgeColor = "text-amber-300 bg-amber-950/80 border-amber-800";
                  if (log.activityName === 'Pengajuan Bukti') badgeColor = "text-cyan-300 bg-cyan-950/80 border-cyan-800";

                  return (
                    <tr key={log.id} className="hover:bg-slate-800/40 text-xs">
                      <td className="py-3 px-3 font-mono">
                        <div className="font-bold text-cyan-400">
                          {log.donationId || formatAddress(log.txHash, 4)}
                        </div>
                        <span 
                          onClick={() => onViewTx(log.txHash)}
                          className="text-[10px] text-slate-500 hover:text-white cursor-pointer"
                        >
                          Tx: {formatAddress(log.txHash, 3)}
                        </span>
                      </td>

                      <td className="py-3 px-3 max-w-xs">
                        <div className="font-semibold text-white truncate">{log.campaignTitle}</div>
                        {log.milestoneTitle && (
                          <div className="text-[11px] text-slate-400 truncate">{log.milestoneTitle}</div>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-white">
                        {log.amountIDR ? formatIDR(log.amountIDR) : '-'}
                      </td>

                      <td className="py-3 px-3 font-mono">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badgeColor}`}>
                          {log.activityName}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-slate-400 text-[11px]">
                        {new Date(log.timestamp).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </td>

                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Terkonfirmasi</span>
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-slate-400">
                        #{log.blockNumber}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
