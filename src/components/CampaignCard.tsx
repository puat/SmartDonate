import React from 'react';
import { Campaign } from '../types';
import { formatIDR, formatAddress } from '../blockchain/ethereumService';
import { ShieldCheck, Lock, CheckCircle2, Clock, AlertTriangle, ArrowUpRight, MapPin } from 'lucide-react';

interface CampaignCardProps {
  campaign: Campaign;
  onSelect: (campaign: Campaign) => void;
  onQuickDonate: (campaign: Campaign) => void;
}

export const CampaignCard: React.FC<CampaignCardProps> = ({ campaign, onSelect, onQuickDonate }) => {
  const percentFunded = Math.min(100, Math.round((campaign.totalDonatedIDR / campaign.targetIDR) * 100));
  const escrowLockedIDR = Math.max(0, campaign.totalDonatedIDR - campaign.totalReleasedIDR);
  
  const pendingReviewCount = campaign.milestones.filter(m => m.status === 'submitted').length;

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-950/20">
      
      {/* Campaign Image */}
      <div className="relative h-48 w-full overflow-hidden bg-slate-950">
        <img 
          src={campaign.imageUrl} 
          alt={campaign.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-black/30" />
        
        {/* Floating status tag */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-950/80 backdrop-blur-md border border-slate-700/60 text-xs font-medium text-slate-200">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          <span>Smart Escrow IDR</span>
        </div>

        {campaign.isFrozen && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-950/90 backdrop-blur-md border border-red-700/80 text-xs font-semibold text-red-300">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Dibekukan untuk Audit</span>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="flex flex-1 flex-col p-5">
        
        {/* Metadata row with zero-pill discipline */}
        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
          <span className="text-emerald-400 font-semibold">{campaign.category}</span>
          <span aria-hidden="true">·</span>
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3 text-slate-500" />
            <span>{campaign.location}</span>
          </span>
          <span aria-hidden="true">·</span>
          <span>{campaign.donationsCount} Donatur</span>
        </div>

        {/* Title & Tagline */}
        <h3 
          onClick={() => onSelect(campaign)}
          className="mt-2 text-lg font-bold text-white tracking-tight hover:text-emerald-400 cursor-pointer transition-colors line-clamp-1"
        >
          {campaign.title}
        </h3>
        <p className="mt-1 text-xs text-slate-400 line-clamp-2 leading-relaxed">
          {campaign.tagline}
        </p>

        {/* Funding & Escrow Progress */}
        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-lg font-extrabold text-white font-mono">
                {formatIDR(campaign.totalDonatedIDR)}
              </span>
              <span className="block text-[11px] text-slate-400">
                Dana Terkumpul
              </span>
            </div>
            <div className="text-right text-xs font-medium text-slate-400">
              Target: <span className="font-mono text-slate-200 font-semibold">{formatIDR(campaign.targetIDR)}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
              style={{ width: `${percentFunded}%` }}
            />
          </div>

          <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400">
            <span>{percentFunded}% Target Tercapai</span>
            <span>{campaign.milestones.length} Tahap Pencairan</span>
          </div>
        </div>

        {/* Escrow Breakdown Section */}
        <div className="mt-3.5 rounded-xl bg-slate-950/60 p-3 border border-slate-800/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-amber-400" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Dana dalam Escrow</div>
              <div className="font-mono font-bold text-amber-300">{formatIDR(escrowLockedIDR)}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Telah Dicairkan</div>
            <div className="font-mono font-bold text-emerald-400">{formatIDR(campaign.totalReleasedIDR)}</div>
          </div>
        </div>

        {/* Milestone Steps Timeline Indicator */}
        <div className="mt-3.5">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Tahap Pencairan Dana</span>
            {pendingReviewCount > 0 && (
              <span className="text-[10px] font-mono text-cyan-400 font-medium">
                {pendingReviewCount} dalam verifikasi
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {campaign.milestones.map((m, idx) => {
              let bg = "bg-slate-800 border-slate-700 text-slate-400";
              let label = "Terkunci";
              if (m.status === 'released') {
                bg = "bg-emerald-950/60 border-emerald-700/80 text-emerald-300";
                label = "Sudah Dicairkan";
              } else if (m.status === 'verified') {
                bg = "bg-teal-950/60 border-teal-600/80 text-teal-300";
                label = "Terverifikasi";
              } else if (m.status === 'submitted') {
                bg = "bg-cyan-950/60 border-cyan-600/80 text-cyan-300";
                label = "Dalam Verifikasi";
              }
              return (
                <div 
                  key={idx}
                  className={`px-2 py-1.5 rounded-lg border text-center text-[10px] font-medium ${bg}`}
                  title={`${m.title}: ${m.percentage}% (${formatIDR(m.releaseAmountIDR)})`}
                >
                  <div className="truncate font-semibold">Tahap {idx + 1} ({m.percentage}%)</div>
                  <div className="text-[9px] opacity-80 truncate">{label}</div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Card Footer Actions */}
      <div className="border-t border-slate-800 p-4 bg-slate-900/60 flex items-center gap-2">
        <button
          onClick={() => onSelect(campaign)}
          className="flex-1 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors flex items-center justify-center gap-1.5"
        >
          <span>Lihat Detail & Bukti</span>
          <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
        </button>

        <button
          onClick={() => onQuickDonate(campaign)}
          disabled={campaign.isFrozen}
          className="py-2 px-4 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          Donasi Sekarang
        </button>
      </div>

    </div>
  );
};
