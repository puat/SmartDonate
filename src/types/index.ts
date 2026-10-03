export type UserRole = 'donatur' | 'pengelola' | 'verifier' | 'admin';

export type PaymentMethod = 'QRIS' | 'Virtual Account' | 'Bank Transfer';

export type IndonesianBank = 
  | 'Bank Syariah Indonesia'
  | 'Bank Mandiri'
  | 'Bank BRI'
  | 'Bank BNI'
  | 'Bank BCA';

export interface AccountProfile {
  id: string;
  role: UserRole;
  name: string;
  email?: string;
  address: string;
  balanceIDR: number; // Integer Rupiah
  avatar: string;
  badge: string;
  description: string;
  reputationScore?: number;
  status: 'Aktif' | 'Terverifikasi' | 'Ditangguhkan';
}

export type MilestoneStatus = 'pending' | 'submitted' | 'verified' | 'released' | 'rejected';

export interface EvidenceDocument {
  id: string;
  milestoneId: number;
  campaignId: number;
  title: string;
  description: string;
  fileUrl: string;
  fileName: string;
  fileSize: string;
  fileType: string;
  ipfsCID: string;
  sha256Hash: string; // SHA-256 e.g. 7c33a591fe851d...
  submittedBy: string;
  submittedAt: number;
  contractorName?: string;
  invoiceAmountIDR?: number; // Integer Rupiah
  locationGeo?: string;
  verifiedAt?: number;
  verifiedBy?: string;
}

export interface Milestone {
  id: number;
  campaignId: number;
  title: string;
  description: string;
  percentage: number; // 0 - 100
  releaseAmountIDR: number; // Integer Rupiah
  status: MilestoneStatus;
  evidence?: EvidenceDocument;
  submittedAt?: number;
  verifiedAt?: number;
  releasedAt?: number;
  verifierAddress?: string;
  auditNotes?: string;
}

export interface Donation {
  id: string;
  donationId: string; // e.g. DON-2026-000124
  campaignId: number;
  campaignTitle: string;
  txHash: string;
  donorAddress: string;
  donorName: string;
  amountIDR: number; // Integer Rupiah
  paymentMethod: PaymentMethod;
  bankName?: IndonesianBank;
  timestamp: number;
  message?: string;
  isAnonymous: boolean;
  blockNumber: number;
  status: 'Terkonfirmasi' | 'Diproses' | 'Gagal';
  evidenceHash?: string;
}

export type CampaignCategory = 
  | 'Semua'
  | 'Bencana Alam'
  | 'Kesehatan'
  | 'Pendidikan'
  | 'Sosial'
  | 'Lingkungan'
  | 'Keagamaan';

export interface Campaign {
  id: number;
  title: string;
  tagline: string;
  description: string;
  category: CampaignCategory;
  location: string;
  targetIDR: number; // Integer Rupiah
  totalDonatedIDR: number; // Integer Rupiah
  totalReleasedIDR: number; // Integer Rupiah
  totalRefundedIDR: number; // Integer Rupiah
  beneficiaryAddress: string;
  beneficiaryName: string;
  managerAddress: string;
  managerName: string;
  deadline: number;
  isFrozen: boolean;
  isCompleted: boolean;
  milestones: Milestone[];
  imageUrl: string;
  donationsCount: number;
  createdAt: number;
}

export interface TransactionEventLog {
  event: string;
  signature: string;
  args: Record<string, string | number | boolean>;
}

export type BlockchainActivityType = 
  | 'DONATION'
  | 'CAMPAIGN_CREATED'
  | 'MILESTONE_CREATED'
  | 'EVIDENCE_SUBMITTED'
  | 'MILESTONE_VERIFIED'
  | 'MILESTONE_REJECTED'
  | 'FUND_RELEASE_AUTHORIZED'
  | 'FUND_RELEASED'
  | 'CAMPAIGN_FROZEN'
  | 'CAMPAIGN_UNFROZEN'
  | 'Donasi'
  | 'Buat Program'
  | 'Pengajuan Bukti'
  | 'Verifikasi Milestone'
  | 'Otorisasi Pencairan'
  | 'Pencairan Dana'
  | 'Pembekuan Program';

export interface BlockchainTransaction {
  hash: string;
  donationId?: string;
  blockNumber: number;
  from: string;
  to: string;
  amountIDR: number;
  gasUsed: number;
  gasPriceGwei: number;
  method: string;
  activityType: BlockchainActivityType;
  activityLabel?: string; // e.g. Donasi, Pengajuan Bukti, Verifikasi Milestone, Otorisasi Pencairan, Dana Dicairkan
  timestamp: number;
  status: 'confirmed' | 'pending' | 'failed';
  rawInput?: string;
  decodedParams?: Record<string, any>;
  logs: TransactionEventLog[];
  campaignId?: number;
  campaignTitle?: string;
  milestoneId?: number;
  milestoneTitle?: string;
  evidenceHash?: string;
}

export interface BlockchainBlock {
  number: number;
  hash: string;
  parentHash: string;
  timestamp: number;
  miner: string;
  txCount: number;
  gasUsed: number;
  gasLimit: number;
  baseFeeGwei: number;
}

export interface AuditLog {
  id: string;
  donationId?: string;
  timestamp: number;
  eventType: 
    | 'DONATION'
    | 'DONATION_ESCROWED'
    | 'CAMPAIGN_CREATED'
    | 'MILESTONE_CREATED'
    | 'EVIDENCE_SUBMITTED'
    | 'MILESTONE_VERIFIED'
    | 'MILESTONE_REJECTED'
    | 'FUND_RELEASE_AUTHORIZED'
    | 'FUND_RELEASED'
    | 'FUNDS_RELEASED'
    | 'CAMPAIGN_FROZEN'
    | 'CAMPAIGN_UNFROZEN';
  activityName: string; // e.g. Donasi diterima, Pengajuan Milestone, Bukti diunggah, Verifier menyetujui, Smart Contract mengotorisasi pencairan, Dana dicairkan
  campaignId: number;
  campaignTitle: string;
  milestoneId?: number;
  milestoneTitle?: string;
  actorRole: UserRole | 'system';
  actorAddress: string;
  actorName: string;
  details: string;
  amountIDR?: number;
  txHash: string;
  blockNumber: number;
  proofHash?: string;
  verifiedOnChain: boolean;
  status: string;
}

export interface BlockchainStats {
  blockHeight: number;
  totalTransactions: number;
  contractBalanceIDR: number;
  totalDonatedVolumeIDR: number;
  totalFundsReleasedIDR: number;
  activeCampaignsCount: number;
  verifiedMilestonesCount: number;
  pendingMilestonesCount: number;
  networkName: string;
  chainId: number;
  contractAddress: string;
}
