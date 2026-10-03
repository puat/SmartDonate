import React, { useState, useEffect } from 'react';
import { 
  Campaign, 
  Milestone, 
  UserRole, 
  AccountProfile, 
  BlockchainStats, 
  BlockchainTransaction, 
  BlockchainBlock, 
  AuditLog,
  CampaignCategory,
  PaymentMethod,
  IndonesianBank
} from './types';
import { api } from './services/api';
import { DEFAULT_ACCOUNTS, formatIDR } from './blockchain/ethereumService';
import { Navbar } from './components/Navbar';
import { CampaignCard } from './components/CampaignCard';
import { CampaignDetail } from './components/CampaignDetail';
import { DonateModal } from './components/DonateModal';
import { CreateCampaignModal } from './components/CreateCampaignModal';
import { EvidenceModal } from './components/EvidenceModal';
import { VerifierPortal } from './components/VerifierPortal';
import { BlockExplorer } from './components/BlockExplorer';
import { SmartContractViewer } from './components/SmartContractViewer';
import { RoleDashboard } from './components/RoleDashboard';
import { 
  ShieldCheck, 
  Lock, 
  Search, 
  Coins, 
  ArrowRight,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

const INDONESIAN_CATEGORIES: CampaignCategory[] = [
  'Semua',
  'Bencana Alam',
  'Kesehatan',
  'Pendidikan',
  'Sosial',
  'Lingkungan',
  'Keagamaan'
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'dashboard' | 'verifier' | 'explorer' | 'contract'>('campaigns');
  const [currentRole, setCurrentRole] = useState<UserRole>('donatur');
  const [accounts, setAccounts] = useState<Record<UserRole, AccountProfile>>(DEFAULT_ACCOUNTS);
  
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [blockchainStats, setBlockchainStats] = useState<BlockchainStats | null>(null);
  const [transactions, setTransactions] = useState<BlockchainTransaction[]>([]);
  const [blocks, setBlocks] = useState<BlockchainBlock[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals
  const [donateModalCampaign, setDonateModalCampaign] = useState<Campaign | null>(null);
  const [isCreateCampaignOpen, setIsCreateCampaignOpen] = useState<boolean>(false);
  const [evidenceModalTarget, setEvidenceModalTarget] = useState<{ campaign: Campaign; milestone: Milestone } | null>(null);
  const [selectedTxHash, setSelectedTxHash] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<CampaignCategory>('Semua');

  // Load all initial data from backend API
  const refreshData = async () => {
    try {
      const [accRes, statsRes, campsRes, txsRes, blocksRes, logsRes] = await Promise.all([
        api.getAccounts().catch(() => ({ accounts: DEFAULT_ACCOUNTS })),
        api.getBlockchainStats().catch(() => null),
        api.getCampaigns().catch(() => []),
        api.getTransactions().catch(() => []),
        api.getBlocks().catch(() => []),
        api.getAuditLogs().catch(() => [])
      ]);

      if (accRes?.accounts) setAccounts(accRes.accounts);
      if (statsRes) setBlockchainStats(statsRes);
      if (campsRes) {
        setCampaigns(campsRes);
        if (selectedCampaign) {
          const updated = campsRes.find((c: Campaign) => c.id === selectedCampaign.id);
          if (updated) setSelectedCampaign(updated);
        }
      }
      if (txsRes) setTransactions(txsRes);
      if (blocksRes) setBlocks(blocksRes);
      if (logsRes) setAuditLogs(logsRes);
    } catch (err) {
      console.error("Gagal memuat status backend:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Handlers
  const handleDonate = async (data: {
    amountIDR: number;
    paymentMethod: PaymentMethod;
    bankName?: IndonesianBank;
    donorAddress?: string;
    donorName?: string;
    message?: string;
    isAnonymous?: boolean;
  }) => {
    if (!donateModalCampaign) throw new Error("Program donasi belum dipilih");
    const res = await api.donate(donateModalCampaign.id, data);
    await refreshData();
    return { txHash: res.txHash, donationId: res.donationId };
  };

  const handleCreateCampaign = async (campaignData: any) => {
    const res = await api.createCampaign(campaignData);
    await refreshData();
    return res;
  };

  const handleSubmitEvidence = async (campaignId: number, milestoneId: number, data: any) => {
    const res = await api.submitMilestoneEvidence(campaignId, milestoneId, data);
    await refreshData();
    return res;
  };

  const handleVerifyMilestone = async (campaignId: number, milestoneId: number, approved: boolean, notes: string) => {
    const res = await api.verifyMilestone(campaignId, milestoneId, {
      approved,
      auditNotes: notes,
      verifierAddress: accounts.verifier.address
    });
    await refreshData();
    return res;
  };

  const handleReleaseFunds = async (campaignId: number, milestoneId: number) => {
    const res = await api.releaseMilestoneFunds(campaignId, milestoneId);
    await refreshData();
    return res;
  };

  const handleFreezeCampaign = async (campaignId: number, freeze: boolean, reason?: string) => {
    const res = await api.freezeCampaign(campaignId, freeze, reason);
    await refreshData();
    return res;
  };

  const handleResetData = async () => {
    await api.resetDemoData();
    await refreshData();
  };

  const handleViewTx = (hash: string) => {
    setSelectedTxHash(hash);
    setActiveTab('explorer');
  };

  // Pending reviews count
  const pendingVerificationsCount = campaigns.reduce((acc, c) => {
    return acc + c.milestones.filter(m => m.status === 'submitted').length;
  }, 0);

  // Filter campaigns
  const filteredCampaigns = campaigns.filter(c => {
    const matchesSearch = 
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'Semua' || c.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col selection:bg-emerald-500/20 selection:text-emerald-300">
      
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'campaigns') setSelectedCampaign(null);
        }}
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
        accounts={accounts}
        blockchainStats={blockchainStats}
        onResetData={handleResetData}
        onCreateCampaignClick={() => setIsCreateCampaignOpen(true)}
        pendingVerificationsCount={pendingVerificationsCount}
      />

      {/* Main View Area */}
      <main className="flex-1">
        {isLoading ? (
          <div className="flex h-96 items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <span className="h-8 w-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-mono text-slate-400">Memuat Jaringan SmartDonate Escrow...</span>
            </div>
          </div>
        ) : (
          <>
            {/* JELAJAHI PROGRAM TAB */}
            {activeTab === 'campaigns' && (
              <>
                {selectedCampaign ? (
                  <CampaignDetail
                    campaign={selectedCampaign}
                    onBack={() => setSelectedCampaign(null)}
                    onOpenDonate={() => setDonateModalCampaign(selectedCampaign)}
                    currentRole={currentRole}
                    currentAccount={accounts[currentRole]}
                    onSubmitEvidence={handleSubmitEvidence}
                    onVerifyMilestone={handleVerifyMilestone}
                    onReleaseFunds={handleReleaseFunds}
                    onViewTx={handleViewTx}
                  />
                ) : (
                  <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300 space-y-8">
                    
                    {/* Hero Section */}
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-[#0c1421] border border-slate-800 p-8 sm:p-12 shadow-2xl">
                      <div className="absolute top-0 right-0 -mt-12 -mr-12 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
                      <div className="absolute bottom-0 left-1/3 -mb-12 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

                      <div className="relative max-w-3xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800 text-xs font-semibold text-emerald-300 mb-4">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          <span>Platform Crowdfunding & Monitoring Donasi Berbasis Blockchain dan Smart Contract</span>
                        </div>

                        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                          Donasi Transparan, <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">Dana Terpantau</span>, Kepercayaan Terjaga.
                        </h1>

                        <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl font-normal">
                          100% dana donasi terkunci di smart contract escrow dan hanya dicairkan bertahap setelah bukti penggunaan dana (kuitansi, BAST, foto koordinat) diaudit dan diverifikasi oleh verifikator independen.
                        </p>

                        <div className="mt-6 flex flex-wrap items-center gap-4">
                          <button
                            onClick={() => setIsCreateCampaignOpen(true)}
                            className="py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-lg shadow-emerald-500/25 active:scale-[0.99] flex items-center gap-2"
                          >
                            <span>Buat Program Donasi</span>
                            <ArrowRight className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => setActiveTab('contract')}
                            className="py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs sm:text-sm transition-colors border border-slate-700/60"
                          >
                            Inspeksi Smart Contract
                          </button>
                        </div>
                      </div>

                      {/* Floating Key Metrics Strip */}
                      <div className="mt-10 pt-8 border-t border-slate-800/80 grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div>
                          <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Total Donasi Terkumpul</div>
                          <div className="mt-1 text-xl sm:text-2xl font-extrabold text-white font-mono">
                            {formatIDR(blockchainStats?.totalDonatedVolumeIDR || 905000000)}
                          </div>
                        </div>

                        <div>
                          <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Rasio Verifikasi Milestone</div>
                          <div className="mt-1 text-xl sm:text-2xl font-extrabold text-emerald-400 font-mono">
                            100% Diaudit
                          </div>
                        </div>

                        <div>
                          <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Dana dalam Escrow</div>
                          <div className="mt-1 text-xl sm:text-2xl font-extrabold text-amber-300 font-mono">
                            {formatIDR(blockchainStats?.contractBalanceIDR || 503000000)}
                          </div>
                        </div>

                        <div>
                          <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Verifikasi Independen</div>
                          <div className="mt-1 text-xl sm:text-2xl font-extrabold text-cyan-300 font-mono">
                            Aktif Terakreditasi
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Search & Category Filter Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      
                      {/* Search box */}
                      <div className="relative flex-1 max-w-md">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Cari program donasi, lokasi (Riau, Pekanbaru...), atau kategori..."
                          className="w-full rounded-xl bg-slate-900 border border-slate-800 pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                        <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                      </div>

                      {/* Interactive Segmented Filter Controls */}
                      <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800 overflow-x-auto max-w-full">
                        {INDONESIAN_CATEGORIES.map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setCategoryFilter(cat)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                              categoryFilter === cat
                                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>

                    </div>

                    {/* Campaigns Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredCampaigns.map((camp) => (
                        <CampaignCard
                          key={camp.id}
                          campaign={camp}
                          onSelect={(c) => setSelectedCampaign(c)}
                          onQuickDonate={(c) => setDonateModalCampaign(c)}
                        />
                      ))}
                    </div>

                  </div>
                )}
              </>
            )}

            {/* DASHBOARD TAB */}
            {activeTab === 'dashboard' && (
              <RoleDashboard
                currentRole={currentRole}
                currentAccount={accounts[currentRole]}
                campaigns={campaigns}
                auditLogs={auditLogs}
                blockchainStats={blockchainStats}
                onSelectCampaign={(c) => {
                  setSelectedCampaign(c);
                  setActiveTab('campaigns');
                }}
                onOpenCreateCampaign={() => setIsCreateCampaignOpen(true)}
                onOpenVerifierQueue={() => setActiveTab('verifier')}
                onViewTx={handleViewTx}
                onOpenSubmitEvidence={(c, m) => setEvidenceModalTarget({ campaign: c, milestone: m })}
              />
            )}

            {/* VERIFIER PORTAL TAB */}
            {activeTab === 'verifier' && (
              <VerifierPortal
                campaigns={campaigns}
                currentRole={currentRole}
                currentAccount={accounts[currentRole]}
                onVerifyMilestone={handleVerifyMilestone}
                onFreezeCampaign={handleFreezeCampaign}
                onVerifyHash={(hash) => api.verifyHash(hash)}
              />
            )}

            {/* BLOCK EXPLORER TAB */}
            {activeTab === 'explorer' && (
              <BlockExplorer
                stats={blockchainStats}
                blocks={blocks}
                transactions={transactions}
                selectedTxHash={selectedTxHash}
                onSelectTxHash={setSelectedTxHash}
              />
            )}

            {/* SMART CONTRACT VIEWER TAB */}
            {activeTab === 'contract' && (
              <SmartContractViewer />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-800 bg-[#070a10] py-8 text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span className="font-semibold text-slate-300">SmartDonate</span>
            <span className="text-slate-600">·</span>
            <span>Platform Crowdfunding dan Monitoring Donasi Berbasis Blockchain dan Smart Contract</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Solidity v0.8.20</span>
            <span>·</span>
            <span>QRIS / Virtual Account / Transfer Bank</span>
            <span>·</span>
            <span>Audit Proof SHA-256</span>
          </div>
        </div>
      </footer>

      {/* Global Modals */}
      {donateModalCampaign && (
        <DonateModal
          campaign={donateModalCampaign}
          isOpen={true}
          onClose={() => setDonateModalCampaign(null)}
          onDonate={handleDonate}
          currentAccount={accounts[currentRole]}
          currentRole={currentRole}
          onViewTx={handleViewTx}
        />
      )}

      {isCreateCampaignOpen && (
        <CreateCampaignModal
          isOpen={true}
          onClose={() => setIsCreateCampaignOpen(false)}
          onCreate={handleCreateCampaign}
          currentAccount={accounts[currentRole]}
          onViewTx={handleViewTx}
        />
      )}

      {evidenceModalTarget && (
        <EvidenceModal
          campaign={evidenceModalTarget.campaign}
          milestone={evidenceModalTarget.milestone}
          isOpen={true}
          onClose={() => setEvidenceModalTarget(null)}
          onSubmitEvidence={handleSubmitEvidence}
          currentAccount={accounts[currentRole]}
          onViewTx={handleViewTx}
        />
      )}

    </div>
  );
}
