import { ethers } from 'ethers';
import type { AccountProfile, UserRole } from '../types/index.ts';

export const IDR_FORMATTER = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0
});

export function formatIDR(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null) return 'Rp 0';
  const num = typeof amount === 'string' ? parseInt(amount, 10) : Math.round(amount);
  if (isNaN(num)) return 'Rp 0';
  return IDR_FORMATTER.format(num);
}

export const DEFAULT_ACCOUNTS: Record<UserRole, AccountProfile> = {
  donatur: {
    id: 'user-001',
    role: 'donatur',
    name: 'Siti Rahma',
    email: 'siti.rahma@gmail.com',
    address: '0x71C8A3d994D5d752B39561E8D21E31065798C431',
    balanceIDR: 25000000, // Rp 25.000.000
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
    badge: 'Donatur Peduli',
    description: 'Filantropi & Pemerhati Isu Kemanusiaan di Riau dan Kepulauan Riau. 14 donasi terverifikasi.',
    reputationScore: 98,
    status: 'Terverifikasi'
  },
  pengelola: {
    id: 'user-002',
    role: 'pengelola',
    name: 'Ahmad Fauzi, S.Sos',
    email: 'ahmad.fauzi@pedulinusantara.org',
    address: '0x92B710c5F1B85a815a5fE4a8A5B8084aC77B78f2',
    balanceIDR: 4500000,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    badge: 'Pengelola Program Terdaftar',
    description: 'Koordinator Lapangan Yayasan Peduli Nusantara. Telah menyelesaikan 5 program sosial kemanusiaan.',
    reputationScore: 96,
    status: 'Terverifikasi'
  },
  verifier: {
    id: 'user-003',
    role: 'verifier',
    name: 'Dr. Ir. Hendra Wijaya, MT',
    email: 'hendra.wijaya@auditor-esg.id',
    address: '0x44A2931D38104Ce80C5627f1E229b4B237D2012e',
    balanceIDR: 12000000,
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80',
    badge: 'Auditor Independen',
    description: 'Auditor Konstruksi & Tata Kelola Dana Sosial Terakreditasi. Pemegang Kunci Verifikasi Smart Contract Escrow.',
    reputationScore: 99,
    status: 'Terverifikasi'
  },
  admin: {
    id: 'user-004',
    role: 'admin',
    name: 'Tim Tata Kelola SmartDonate',
    email: 'admin@smartdonate.id',
    address: '0x3F616b47c0e5a8f465D13bDb42385b24f5B4A1D8',
    balanceIDR: 50000000,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    badge: 'Administrator Sistem',
    description: 'Pusat Kepatuhan Smart Contract dan Protokol Audit Multi-pihak SmartDonate.',
    reputationScore: 100,
    status: 'Terverifikasi'
  }
};

export function formatAddress(addr: string, chars = 4): string {
  if (!addr) return '';
  if (addr.length <= chars * 2 + 2) return addr;
  return `${addr.substring(0, chars + 2)}...${addr.substring(addr.length - chars)}`;
}

export function generateTxHash(): string {
  const randBytes = ethers.randomBytes(32);
  return ethers.hexlify(randBytes);
}

export function generateDonationId(counter?: number): string {
  const num = counter ? counter : Math.floor(100000 + Math.random() * 900000);
  return `DON-2026-${num}`;
}

export function generateIpfsCID(content: string): string {
  const hash = ethers.keccak256(ethers.toUtf8Bytes(content + Date.now().toString()));
  return `bafybeic${hash.substring(2, 42).toLowerCase()}escrow`;
}

export function computeSha256(content: string): string {
  return ethers.sha256(ethers.toUtf8Bytes(content));
}
