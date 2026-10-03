import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { ethers } from 'ethers';
import { 
  INITIAL_CAMPAIGNS, 
  INITIAL_TRANSACTIONS, 
  INITIAL_BLOCKS, 
  INITIAL_AUDIT_LOGS 
} from './src/data/seedData.ts';
import type { 
  Campaign, 
  BlockchainTransaction, 
  BlockchainBlock, 
  AuditLog, 
  Milestone,
  AccountProfile,
  UserRole,
  PaymentMethod,
  IndonesianBank
} from './src/types/index.ts';
import { 
  SMART_DONATE_CONTRACT_ADDRESS, 
  CHAIN_ID, 
  NETWORK_NAME 
} from './src/blockchain/solidityContract.ts';
import { DEFAULT_ACCOUNTS, generateDonationId, formatIDR } from './src/blockchain/ethereumService.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));

// In-Memory Blockchain & Escrow State (Indonesian Rupiah Integer Base)
let campaigns: Campaign[] = JSON.parse(JSON.stringify(INITIAL_CAMPAIGNS));
let transactions: BlockchainTransaction[] = JSON.parse(JSON.stringify(INITIAL_TRANSACTIONS));
let blocks: BlockchainBlock[] = JSON.parse(JSON.stringify(INITIAL_BLOCKS));
let auditLogs: AuditLog[] = JSON.parse(JSON.stringify(INITIAL_AUDIT_LOGS));
let accounts: Record<UserRole, AccountProfile> = JSON.parse(JSON.stringify(DEFAULT_ACCOUNTS));

let currentBlockHeight = 1045;
let donationCounter = 145;

function mineBlock(tx: BlockchainTransaction) {
  currentBlockHeight += 1;
  const parentHash = blocks[0]?.hash || ethers.hexlify(ethers.randomBytes(32));
  const newBlockHash = "0x" + ethers.keccak256(ethers.toUtf8Bytes(`block-${currentBlockHeight}-${Date.now()}`)).substring(2);

  const newBlock: BlockchainBlock = {
    number: currentBlockHeight,
    hash: newBlockHash,
    parentHash,
    timestamp: Date.now(),
    miner: "0x000000000000000000000000000000000000Node1",
    txCount: 1,
    gasUsed: tx.gasUsed,
    gasLimit: 30000000,
    baseFeeGwei: 12.5 + Math.random() * 2
  };

  tx.blockNumber = currentBlockHeight;
  blocks.unshift(newBlock);
  transactions.unshift(tx);
}

// ----------------- API ROUTES -----------------

// Accounts & Profiles
app.get('/api/accounts', (_req, res) => {
  res.json({ accounts });
});

// Blockchain Network Stats (Indonesian Rupiah)
app.get('/api/blockchain/stats', (_req, res) => {
  const totalDonatedVolumeIDR = campaigns.reduce((acc, c) => acc + c.totalDonatedIDR, 0);
  const totalFundsReleasedIDR = campaigns.reduce((acc, c) => acc + c.totalReleasedIDR, 0);
  const contractBalanceIDR = Math.max(0, totalDonatedVolumeIDR - totalFundsReleasedIDR);

  let verifiedCount = 0;
  let pendingCount = 0;
  campaigns.forEach(c => {
    c.milestones.forEach(m => {
      if (m.status === 'verified' || m.status === 'released') verifiedCount++;
      if (m.status === 'submitted') pendingCount++;
    });
  });

  res.json({
    blockHeight: currentBlockHeight,
    totalTransactions: transactions.length,
    contractBalanceIDR,
    totalDonatedVolumeIDR,
    totalFundsReleasedIDR,
    activeCampaignsCount: campaigns.filter(c => !c.isCompleted && !c.isFrozen).length,
    verifiedMilestonesCount: verifiedCount,
    pendingMilestonesCount: pendingCount,
    networkName: "SmartDonate Private Audit EVM (IDR Layer)",
    chainId: CHAIN_ID,
    contractAddress: SMART_DONATE_CONTRACT_ADDRESS
  });
});

// Blocks & Transactions
app.get('/api/blockchain/blocks', (_req, res) => {
  res.json({ blocks: blocks.slice(0, 30) });
});

app.get('/api/blockchain/transactions', (_req, res) => {
  res.json({ transactions: transactions.slice(0, 50) });
});

app.get('/api/blockchain/transactions/:hash', (req, res) => {
  const tx = transactions.find(t => t.hash.toLowerCase() === req.params.hash.toLowerCase());
  if (!tx) {
    return res.status(404).json({ error: "Transaksi tidak ditemukan dalam ledger blockchain" });
  }
  res.json({ transaction: tx });
});

// Audit Logs
app.get('/api/audit/logs', (_req, res) => {
  res.json({ auditLogs });
});

// Verify SHA-256 or IPFS Hash against on-chain records
app.post('/api/audit/verify-hash', (req, res) => {
  const { hashOrCID } = req.body;
  if (!hashOrCID || typeof hashOrCID !== 'string') {
    return res.status(400).json({ error: "Parameter hashOrCID wajib diisi" });
  }

  const query = hashOrCID.trim().toLowerCase();

  // Search milestones
  for (const c of campaigns) {
    for (const m of c.milestones) {
      if (m.evidence) {
        if (
          m.evidence.ipfsCID.toLowerCase() === query || 
          m.evidence.sha256Hash.toLowerCase() === query
        ) {
          return res.json({
            found: true,
            type: "BUKTI_MILESTONE",
            campaignId: c.id,
            campaignTitle: c.title,
            milestoneId: m.id,
            milestoneTitle: m.title,
            status: m.status,
            evidence: m.evidence,
            verifiedAt: m.verifiedAt,
            verifierAddress: m.verifierAddress,
            matchedOnChain: true
          });
        }
      }
    }
  }

  // Search transaction hashes or donation IDs
  const tx = transactions.find(t => 
    t.hash.toLowerCase() === query || 
    (t.donationId && t.donationId.toLowerCase() === query)
  );
  if (tx) {
    return res.json({
      found: true,
      type: "RESI_TRANSAKSI_DONASI",
      transaction: tx,
      matchedOnChain: true
    });
  }

  res.json({ found: false, message: "Tidak ada catatan kriptografis yang cocok dengan hash atau CID ini di blockchain SmartDonate." });
});

// Campaigns
app.get('/api/campaigns', (_req, res) => {
  res.json({ campaigns });
});

app.get('/api/campaigns/:id', (req, res) => {
  const campaign = campaigns.find(c => c.id === parseInt(req.params.id));
  if (!campaign) {
    return res.status(404).json({ error: "Program donasi tidak ditemukan" });
  }
  res.json({ campaign });
});

// Create Campaign
app.post('/api/campaigns', (req, res) => {
  const { 
    title, 
    tagline, 
    description, 
    category, 
    location,
    targetIDR, 
    beneficiaryAddress, 
    beneficiaryName,
    managerAddress, 
    deadlineDays, 
    milestones: rawMilestones, 
    imageUrl 
  } = req.body;

  const numTarget = Math.round(parseFloat(targetIDR) || 0);

  if (!title || numTarget <= 0 || !rawMilestones || rawMilestones.length === 0) {
    return res.status(400).json({ error: "Lengkapi judul, target nominal Rupiah, dan tahapan milestone" });
  }

  const newId = campaigns.length > 0 ? Math.max(...campaigns.map(c => c.id)) + 1 : 1;

  const formattedMilestones: Milestone[] = rawMilestones.map((m: any, index: number) => {
    const pct = parseInt(m.percentage, 10) || Math.floor(100 / rawMilestones.length);
    return {
      id: index,
      campaignId: newId,
      title: m.title || `Tahap ${index + 1}`,
      description: m.description || "",
      percentage: pct,
      releaseAmountIDR: Math.round((numTarget * pct) / 100),
      status: 'pending'
    };
  });

  const newCampaign: Campaign = {
    id: newId,
    title,
    tagline: tagline || description.substring(0, 100),
    description,
    category: category || 'Sosial',
    location: location || 'Indonesia',
    targetIDR: numTarget,
    totalDonatedIDR: 0,
    totalReleasedIDR: 0,
    totalRefundedIDR: 0,
    beneficiaryAddress: beneficiaryAddress || "0x12Fa99c82A6B29124DE6F7188179469e358b2921",
    beneficiaryName: beneficiaryName || "Penerima Manfaat Terverifikasi",
    managerAddress: managerAddress || accounts.pengelola.address,
    managerName: accounts.pengelola.name,
    deadline: Date.now() + (parseInt(deadlineDays) || 30) * 86400000,
    isFrozen: false,
    isCompleted: false,
    milestones: formattedMilestones,
    imageUrl: imageUrl || "https://images.unsplash.com/photo-1532629345422-7515f3d16bb7?w=1000&auto=format&fit=crop&q=80",
    donationsCount: 0,
    createdAt: Date.now()
  };

  campaigns.unshift(newCampaign);

  // Mint on-chain transaction
  const txHash = ethers.hexlify(ethers.randomBytes(32));
  const tx: BlockchainTransaction = {
    hash: txHash,
    blockNumber: 0,
    from: newCampaign.managerAddress,
    to: SMART_DONATE_CONTRACT_ADDRESS,
    amountIDR: 0,
    gasUsed: 124500,
    gasPriceGwei: 15.2,
    method: "createCampaign",
    activityType: "Buat Program",
    timestamp: Date.now(),
    status: "confirmed",
    campaignId: newId,
    campaignTitle: title,
    decodedParams: {
      campaignId: newId,
      targetNominal: formatIDR(numTarget),
      judulProgram: title,
      jumlahMilestone: formattedMilestones.length
    },
    logs: [
      {
        event: "CampaignCreated",
        signature: "CampaignCreated(uint256,address,address,uint256,string)",
        args: {
          campaignId: newId,
          manager: newCampaign.managerAddress,
          beneficiary: newCampaign.beneficiaryAddress,
          targetIDR: numTarget,
          title
        }
      }
    ]
  };

  mineBlock(tx);

  // Add audit log
  auditLogs.unshift({
    id: `audit-${Date.now()}`,
    timestamp: Date.now(),
    eventType: "CAMPAIGN_CREATED",
    activityName: "Buat Program",
    campaignId: newId,
    campaignTitle: title,
    actorRole: "pengelola",
    actorAddress: newCampaign.managerAddress,
    actorName: newCampaign.managerName,
    details: `Mendaftarkan program donasi baru dengan target ${formatIDR(numTarget)} dan ${formattedMilestones.length} tahapan pencairan escrow.`,
    amountIDR: numTarget,
    txHash,
    blockNumber: currentBlockHeight,
    verifiedOnChain: true,
    status: "Terkonfirmasi"
  });

  res.status(201).json({ campaign: newCampaign, txHash });
});

// Donate to Campaign (Indonesian Payment Flow & Simulation)
app.post('/api/campaigns/:id/donate', (req, res) => {
  const campaignId = parseInt(req.params.id);
  const campaign = campaigns.find(c => c.id === campaignId);
  if (!campaign) {
    return res.status(404).json({ error: "Program donasi tidak ditemukan" });
  }

  if (campaign.isFrozen) {
    return res.status(403).json({ error: "Program sedang dibekukan sementara oleh verifier untuk proses audit" });
  }

  const { 
    amountIDR, 
    paymentMethod = 'QRIS', 
    bankName, 
    donorAddress, 
    donorName, 
    message, 
    isAnonymous 
  } = req.body;

  const numAmount = Math.round(parseFloat(amountIDR) || 0);

  if (isNaN(numAmount) || numAmount < 10000) {
    return res.status(400).json({ error: "Minimal donasi adalah Rp 10.000" });
  }

  donationCounter += 1;
  const donationId = generateDonationId(donationCounter);
  const sender = donorAddress || accounts.donatur.address;
  const senderName = isAnonymous ? "Hamba Allah (Anonim)" : (donorName || accounts.donatur.name);

  // Update campaign finances
  campaign.totalDonatedIDR += numAmount;
  campaign.donationsCount += 1;

  // Deduct from simulated donor balance if using internal balance
  if (accounts.donatur.balanceIDR >= numAmount) {
    accounts.donatur.balanceIDR -= numAmount;
  }

  // Generate on-chain transaction metadata
  const txHash = ethers.hexlify(ethers.randomBytes(32));
  const tx: BlockchainTransaction = {
    hash: txHash,
    donationId,
    blockNumber: 0,
    from: sender,
    to: SMART_DONATE_CONTRACT_ADDRESS,
    amountIDR: numAmount,
    gasUsed: 52300,
    gasPriceGwei: 14.1,
    method: "donate",
    activityType: "Donasi",
    timestamp: Date.now(),
    status: "confirmed",
    campaignId,
    campaignTitle: campaign.title,
    decodedParams: {
      donationId,
      campaignId,
      nominalRupiah: formatIDR(numAmount),
      metodePembayaran: paymentMethod + (bankName ? ` (${bankName})` : ''),
      pesan: message || "Bantuan kemanusiaan terverifikasi",
      isAnonymous: !!isAnonymous
    },
    logs: [
      {
        event: "DonationReceived",
        signature: "DonationReceived(uint256,address,uint256,string)",
        args: {
          campaignId,
          donor: sender,
          donationId,
          amountIDR: numAmount,
          message: message || ""
        }
      }
    ]
  };

  mineBlock(tx);

  // Add audit log
  auditLogs.unshift({
    id: `audit-${Date.now()}`,
    donationId,
    timestamp: Date.now(),
    eventType: "DONATION_ESCROWED",
    activityName: "Donasi",
    campaignId,
    campaignTitle: campaign.title,
    actorRole: "donatur",
    actorAddress: sender,
    actorName: senderName,
    details: `Menyetorkan donasi ${formatIDR(numAmount)} melalui ${paymentMethod}${bankName ? ` - ${bankName}` : ''} ke dalam Smart Contract Escrow (ID: ${donationId}).`,
    amountIDR: numAmount,
    txHash,
    blockNumber: currentBlockHeight,
    verifiedOnChain: true,
    status: "Terkonfirmasi"
  });

  res.json({
    success: true,
    campaign,
    donationId,
    txHash,
    receipt: tx
  });
});

// Submit Milestone Evidence
app.post('/api/campaigns/:id/milestones/:mId/evidence', (req, res) => {
  const campaignId = parseInt(req.params.id);
  const milestoneId = parseInt(req.params.mId);

  const campaign = campaigns.find(c => c.id === campaignId);
  if (!campaign) return res.status(404).json({ error: "Program tidak ditemukan" });

  const milestone = campaign.milestones.find(m => m.id === milestoneId);
  if (!milestone) return res.status(404).json({ error: "Milestone tidak ditemukan" });

  if (campaign.isFrozen) {
    return res.status(403).json({ error: "Program sedang dibekukan" });
  }

  const {
    title,
    description,
    fileName,
    fileSize,
    fileType,
    fileUrl,
    contractorName,
    invoiceAmountIDR,
    locationGeo
  } = req.body;

  const contentSeed = `${campaignId}-${milestoneId}-${title}-${description}-${Date.now()}`;
  const ipfsCID = `bafybeic${ethers.keccak256(ethers.toUtf8Bytes(contentSeed)).substring(2, 42).toLowerCase()}escrow`;
  const sha256Hash = ethers.sha256(ethers.toUtf8Bytes(contentSeed));

  milestone.evidence = {
    id: `ev-${campaignId}-${milestoneId}-${Date.now()}`,
    milestoneId,
    campaignId,
    title: title || `${milestone.title} - Dokumen Pembuktian`,
    description: description || "Kuitansi, Berita Acara Serah Terima (BAST), dan foto dokumentasi kegiatan fisik.",
    fileName: fileName || "berita_acara_dan_faktur_resmi.pdf",
    fileSize: fileSize || "4.2 MB",
    fileType: fileType || "application/pdf",
    fileUrl: fileUrl || "https://images.unsplash.com/photo-1541888946425-d0fbb186f5f7?w=800&auto=format&fit=crop&q=80",
    ipfsCID,
    sha256Hash,
    submittedBy: accounts.pengelola.address,
    submittedAt: Date.now(),
    contractorName: contractorName || "Rekanan / Vendor Terdaftar",
    invoiceAmountIDR: Math.round(parseFloat(invoiceAmountIDR) || milestone.releaseAmountIDR),
    locationGeo: locationGeo || campaign.location
  };

  milestone.status = 'submitted';
  milestone.submittedAt = Date.now();
  milestone.auditNotes = "Bukti dokumen telah diunggah dan terjangkar di blockchain. Menunggu verifikasi auditor independen.";

  // Blockchain tx
  const txHash = ethers.hexlify(ethers.randomBytes(32));
  const tx: BlockchainTransaction = {
    hash: txHash,
    blockNumber: 0,
    from: accounts.pengelola.address,
    to: SMART_DONATE_CONTRACT_ADDRESS,
    amountIDR: 0,
    gasUsed: 69200,
    gasPriceGwei: 14.8,
    method: "submitMilestoneEvidence",
    activityType: "Pengajuan Bukti",
    timestamp: Date.now(),
    status: "confirmed",
    campaignId,
    campaignTitle: campaign.title,
    milestoneId,
    evidenceHash: sha256Hash,
    decodedParams: {
      campaignId,
      milestoneId,
      judulMilestone: milestone.title,
      ipfsCID,
      evidenceHash: sha256Hash
    },
    logs: [
      {
        event: "MilestoneEvidenceSubmitted",
        signature: "MilestoneEvidenceSubmitted(uint256,uint256,string,string)",
        args: {
          campaignId,
          milestoneId,
          evidenceCID: ipfsCID,
          evidenceHash: sha256Hash
        }
      }
    ]
  };

  mineBlock(tx);

  auditLogs.unshift({
    id: `audit-${Date.now()}`,
    timestamp: Date.now(),
    eventType: "EVIDENCE_SUBMITTED",
    activityName: "Pengajuan Bukti",
    campaignId,
    campaignTitle: campaign.title,
    milestoneTitle: milestone.title,
    actorRole: "pengelola",
    actorAddress: accounts.pengelola.address,
    actorName: accounts.pengelola.name,
    details: `Mengajukan berkas bukti penggunaan dana untuk "${milestone.title}" (IPFS: ${ipfsCID.substring(0, 18)}...).`,
    amountIDR: milestone.releaseAmountIDR,
    txHash,
    blockNumber: currentBlockHeight,
    proofHash: sha256Hash,
    verifiedOnChain: true,
    status: "Terkonfirmasi"
  });

  res.json({ success: true, milestone, txHash, ipfsCID, sha256Hash });
});

// Verifier Approves or Rejects Milestone
app.post('/api/campaigns/:id/milestones/:mId/verify', (req, res) => {
  const campaignId = parseInt(req.params.id);
  const milestoneId = parseInt(req.params.mId);
  const { approved, auditNotes, verifierAddress } = req.body;

  const campaign = campaigns.find(c => c.id === campaignId);
  if (!campaign) return res.status(404).json({ error: "Program tidak ditemukan" });

  const milestone = campaign.milestones.find(m => m.id === milestoneId);
  if (!milestone) return res.status(404).json({ error: "Milestone tidak ditemukan" });

  if (milestone.status !== 'submitted') {
    return res.status(400).json({ error: "Milestone ini belum berstatus Dalam Verifikasi" });
  }

  const verifier = verifierAddress || accounts.verifier.address;
  milestone.status = approved ? 'verified' : 'rejected';
  milestone.verifiedAt = Date.now();
  milestone.verifierAddress = verifier;
  milestone.auditNotes = auditNotes || (approved 
    ? "Verifikasi fisik dan kesesuaian dokumen BAST telah diaudit lengkap sesuai SOP." 
    : "Dokumen bukti belum memenuhi syarat audit kelayakan.");

  // Blockchain tx
  const txHash = ethers.hexlify(ethers.randomBytes(32));
  const tx: BlockchainTransaction = {
    hash: txHash,
    blockNumber: 0,
    from: verifier,
    to: SMART_DONATE_CONTRACT_ADDRESS,
    amountIDR: 0,
    gasUsed: 44200,
    gasPriceGwei: 14.0,
    method: "verifyMilestone",
    activityType: "Verifikasi Milestone",
    timestamp: Date.now(),
    status: "confirmed",
    campaignId,
    campaignTitle: campaign.title,
    milestoneId,
    evidenceHash: milestone.evidence?.sha256Hash,
    decodedParams: {
      campaignId,
      milestoneId,
      disetujui: !!approved,
      catatanAudit: milestone.auditNotes
    },
    logs: [
      {
        event: "MilestoneVerified",
        signature: "MilestoneVerified(uint256,uint256,address,bool)",
        args: {
          campaignId,
          milestoneId,
          verifier,
          approved: !!approved
        }
      }
    ]
  };

  mineBlock(tx);

  auditLogs.unshift({
    id: `audit-${Date.now()}`,
    timestamp: Date.now(),
    eventType: approved ? "MILESTONE_VERIFIED" : "MILESTONE_REJECTED",
    activityName: "Verifikasi Milestone",
    campaignId,
    campaignTitle: campaign.title,
    milestoneTitle: milestone.title,
    actorRole: "verifier",
    actorAddress: verifier,
    actorName: accounts.verifier.name,
    details: approved 
      ? `Menyetujui "${milestone.title}". Mengotorisasi pencairan dana escrow sebesar ${formatIDR(milestone.releaseAmountIDR)}.`
      : `Menolak "${milestone.title}". Catatan perbaikan: ${milestone.auditNotes}`,
    amountIDR: milestone.releaseAmountIDR,
    txHash,
    blockNumber: currentBlockHeight,
    proofHash: milestone.evidence?.sha256Hash,
    verifiedOnChain: true,
    status: "Terkonfirmasi"
  });

  res.json({ success: true, milestone, txHash });
});

// Release Escrow Funds for Verified Milestone
app.post('/api/campaigns/:id/milestones/:mId/release', (req, res) => {
  const campaignId = parseInt(req.params.id);
  const milestoneId = parseInt(req.params.mId);

  const campaign = campaigns.find(c => c.id === campaignId);
  if (!campaign) return res.status(404).json({ error: "Program tidak ditemukan" });

  const milestone = campaign.milestones.find(m => m.id === milestoneId);
  if (!milestone) return res.status(404).json({ error: "Milestone tidak ditemukan" });

  if (milestone.status !== 'verified') {
    return res.status(400).json({ error: "Milestone harus terverifikasi oleh verifier sebelum dana dapat dicairkan" });
  }

  const payoutIDR = milestone.releaseAmountIDR;
  milestone.status = 'released';
  milestone.releasedAt = Date.now();

  campaign.totalReleasedIDR += payoutIDR;

  // Check if all milestones are released
  const allReleased = campaign.milestones.every(m => m.status === 'released');
  if (allReleased) {
    campaign.isCompleted = true;
  }

  // Blockchain tx
  const txHash = ethers.hexlify(ethers.randomBytes(32));
  const tx: BlockchainTransaction = {
    hash: txHash,
    blockNumber: 0,
    from: campaign.managerAddress,
    to: SMART_DONATE_CONTRACT_ADDRESS,
    amountIDR: payoutIDR,
    gasUsed: 92400,
    gasPriceGwei: 16.2,
    method: "releaseMilestoneFunds",
    activityType: "Pencairan Dana",
    timestamp: Date.now(),
    status: "confirmed",
    campaignId,
    campaignTitle: campaign.title,
    milestoneId,
    evidenceHash: milestone.evidence?.sha256Hash,
    decodedParams: {
      campaignId,
      milestoneId,
      nominalDicairkan: formatIDR(payoutIDR),
      penerimaManfaat: campaign.beneficiaryName,
      alamatPenerima: campaign.beneficiaryAddress
    },
    logs: [
      {
        event: "MilestoneFundsReleased",
        signature: "MilestoneFundsReleased(uint256,uint256,address,uint256)",
        args: {
          campaignId,
          milestoneId,
          beneficiary: campaign.beneficiaryAddress,
          nominalIDR: payoutIDR
        }
      }
    ]
  };

  mineBlock(tx);

  auditLogs.unshift({
    id: `audit-${Date.now()}`,
    timestamp: Date.now(),
    eventType: "FUNDS_RELEASED",
    activityName: "Pencairan Dana",
    campaignId,
    campaignTitle: campaign.title,
    milestoneTitle: milestone.title,
    actorRole: "system",
    actorAddress: SMART_DONATE_CONTRACT_ADDRESS,
    actorName: "Protokol Smart Contract SmartDonate",
    details: `Mentransfer dana escrow sebesar ${formatIDR(payoutIDR)} langsung ke rekening resmi penerima manfaat (${campaign.beneficiaryName}).`,
    amountIDR: payoutIDR,
    txHash,
    blockNumber: currentBlockHeight,
    proofHash: milestone.evidence?.sha256Hash,
    verifiedOnChain: true,
    status: "Terkonfirmasi"
  });

  res.json({ success: true, milestone, campaign, txHash });
});

// Freeze/Unfreeze Campaign (Verifier Anti-Fraud)
app.post('/api/campaigns/:id/freeze', (req, res) => {
  const campaignId = parseInt(req.params.id);
  const { freeze, reason } = req.body;

  const campaign = campaigns.find(c => c.id === campaignId);
  if (!campaign) return res.status(404).json({ error: "Program tidak ditemukan" });

  campaign.isFrozen = !!freeze;

  const txHash = ethers.hexlify(ethers.randomBytes(32));
  const tx: BlockchainTransaction = {
    hash: txHash,
    blockNumber: 0,
    from: accounts.verifier.address,
    to: SMART_DONATE_CONTRACT_ADDRESS,
    amountIDR: 0,
    gasUsed: 36000,
    gasPriceGwei: 13.5,
    method: freeze ? "freezeCampaign" : "unfreezeCampaign",
    activityType: "Pembekuan Program",
    timestamp: Date.now(),
    status: "confirmed",
    campaignId,
    campaignTitle: campaign.title,
    decodedParams: {
      campaignId,
      alasan: reason || "Auditor mengaktifkan circuit breaker pencegahan penyelewengan dana"
    },
    logs: [
      {
        event: freeze ? "CampaignFrozen" : "CampaignUnfrozen",
        signature: freeze ? "CampaignFrozen(uint256,string)" : "CampaignUnfrozen(uint256)",
        args: {
          campaignId,
          alasan: reason || "Pembekuan pengamanan dana"
        }
      }
    ]
  };

  mineBlock(tx);

  auditLogs.unshift({
    id: `audit-${Date.now()}`,
    timestamp: Date.now(),
    eventType: freeze ? "CAMPAIGN_FROZEN" : "CAMPAIGN_UNFROZEN",
    activityName: "Pembekuan Program",
    campaignId,
    campaignTitle: campaign.title,
    actorRole: "verifier",
    actorAddress: accounts.verifier.address,
    actorName: accounts.verifier.name,
    details: freeze 
      ? `PERHATIAN: Program dibekukan untuk investigasi audit forensik. Alasan: ${reason || "Ditemukan indikasi ketidaksesuaian."}`
      : `Program telah dipulihkan setelah investigasi audit selesai.`,
    txHash,
    blockNumber: currentBlockHeight,
    verifiedOnChain: true,
    status: "Terkonfirmasi"
  });

  res.json({ success: true, campaign, txHash });
});

// Reset Demo Data
app.post('/api/seed/reset', (_req, res) => {
  campaigns = JSON.parse(JSON.stringify(INITIAL_CAMPAIGNS));
  transactions = JSON.parse(JSON.stringify(INITIAL_TRANSACTIONS));
  blocks = JSON.parse(JSON.stringify(INITIAL_BLOCKS));
  auditLogs = JSON.parse(JSON.stringify(INITIAL_AUDIT_LOGS));
  accounts = JSON.parse(JSON.stringify(DEFAULT_ACCOUNTS));
  currentBlockHeight = 1045;
  donationCounter = 145;
  res.json({ success: true, message: "State SmartDonate berhasil diatur ulang ke data awal demo Indonesia." });
});

// Vite & Static file serving
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SmartDonate] Server running on http://0.0.0.0:${PORT} in ${isProd ? 'production' : 'development'} mode.`);
  });
}

startServer();
