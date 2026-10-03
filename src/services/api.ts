import { 
  Campaign, 
  BlockchainStats, 
  BlockchainBlock, 
  BlockchainTransaction, 
  AuditLog, 
  AccountProfile,
  UserRole,
  PaymentMethod,
  IndonesianBank
} from '../types';

export const api = {
  async getAccounts(): Promise<{ accounts: Record<UserRole, AccountProfile> }> {
    const res = await fetch('/api/accounts');
    if (!res.ok) throw new Error('Gagal memuat profil akun');
    return res.json();
  },

  async getBlockchainStats(): Promise<BlockchainStats> {
    const res = await fetch('/api/blockchain/stats');
    if (!res.ok) throw new Error('Gagal memuat statistik blockchain');
    return res.json();
  },

  async getBlocks(): Promise<BlockchainBlock[]> {
    const res = await fetch('/api/blockchain/blocks');
    if (!res.ok) throw new Error('Gagal memuat blok blockchain');
    const data = await res.json();
    return data.blocks;
  },

  async getTransactions(): Promise<BlockchainTransaction[]> {
    const res = await fetch('/api/blockchain/transactions');
    if (!res.ok) throw new Error('Gagal memuat transaksi blockchain');
    const data = await res.json();
    return data.transactions;
  },

  async getTransaction(hash: string): Promise<BlockchainTransaction> {
    const res = await fetch(`/api/blockchain/transactions/${hash}`);
    if (!res.ok) throw new Error('Transaksi tidak ditemukan');
    const data = await res.json();
    return data.transaction;
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    const res = await fetch('/api/audit/logs');
    if (!res.ok) throw new Error('Gagal memuat jejak audit');
    const data = await res.json();
    return data.auditLogs;
  },

  async verifyHash(hashOrCID: string): Promise<any> {
    const res = await fetch('/api/audit/verify-hash', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hashOrCID })
    });
    return res.json();
  },

  async getCampaigns(): Promise<Campaign[]> {
    const res = await fetch('/api/campaigns');
    if (!res.ok) throw new Error('Gagal memuat daftar program');
    const data = await res.json();
    return data.campaigns;
  },

  async getCampaign(id: number): Promise<Campaign> {
    const res = await fetch(`/api/campaigns/${id}`);
    if (!res.ok) throw new Error('Program donasi tidak ditemukan');
    const data = await res.json();
    return data.campaign;
  },

  async createCampaign(campaignData: any): Promise<{ campaign: Campaign; txHash: string }> {
    const res = await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(campaignData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Gagal membuat program donasi');
    }
    return res.json();
  },

  async donate(campaignId: number, data: {
    amountIDR: number;
    paymentMethod: PaymentMethod;
    bankName?: IndonesianBank;
    donorAddress?: string;
    donorName?: string;
    message?: string;
    isAnonymous?: boolean;
  }): Promise<{ success: boolean; campaign: Campaign; donationId: string; txHash: string; receipt: BlockchainTransaction }> {
    const res = await fetch(`/api/campaigns/${campaignId}/donate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Pembayaran donasi gagal');
    }
    return res.json();
  },

  async submitMilestoneEvidence(campaignId: number, milestoneId: number, data: any): Promise<any> {
    const res = await fetch(`/api/campaigns/${campaignId}/milestones/${milestoneId}/evidence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Pengajuan bukti milestone gagal');
    }
    return res.json();
  },

  async verifyMilestone(campaignId: number, milestoneId: number, data: {
    approved: boolean;
    auditNotes: string;
    verifierAddress?: string;
  }): Promise<any> {
    const res = await fetch(`/api/campaigns/${campaignId}/milestones/${milestoneId}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Verifikasi milestone gagal');
    }
    return res.json();
  },

  async releaseMilestoneFunds(campaignId: number, milestoneId: number): Promise<any> {
    const res = await fetch(`/api/campaigns/${campaignId}/milestones/${milestoneId}/release`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Pencairan dana escrow gagal');
    }
    return res.json();
  },

  async freezeCampaign(campaignId: number, freeze: boolean, reason?: string): Promise<any> {
    const res = await fetch(`/api/campaigns/${campaignId}/freeze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ freeze, reason })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Aksi pembekuan gagal');
    }
    return res.json();
  },

  async resetDemoData(): Promise<any> {
    const res = await fetch('/api/seed/reset', { method: 'POST' });
    return res.json();
  }
};
