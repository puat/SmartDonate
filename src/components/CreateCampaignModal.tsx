import React, { useState } from 'react';
import { AccountProfile, Campaign, CampaignCategory } from '../types';
import { formatAddress, formatIDR } from '../blockchain/ethereumService';
import { 
  X, 
  Coins, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight,
  ExternalLink,
  MapPin
} from 'lucide-react';

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (campaignData: any) => Promise<{ campaign: Campaign; txHash: string }>;
  currentAccount: AccountProfile;
  onViewTx: (hash: string) => void;
}

interface MilestoneInput {
  title: string;
  description: string;
  percentage: number;
}

const INDONESIAN_IMAGES = [
  { label: 'Banjir & Bencana', url: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?w=1000&auto=format&fit=crop&q=80' },
  { label: 'Sekolah & Pendidikan', url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1000&auto=format&fit=crop&q=80' },
  { label: 'Bantuan Medis', url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=1000&auto=format&fit=crop&q=80' },
  { label: 'Air Bersih Desa', url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186f5f7?w=1000&auto=format&fit=crop&q=80' },
  { label: 'Anak Yatim', url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1000&auto=format&fit=crop&q=80' }
];

export const CreateCampaignModal: React.FC<CreateCampaignModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  currentAccount,
  onViewTx
}) => {
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CampaignCategory>('Bencana Alam');
  const [location, setLocation] = useState('Riau');
  const [targetIDRStr, setTargetIDRStr] = useState('150000000');
  const [deadlineDays, setDeadlineDays] = useState('45');
  const [beneficiaryName, setBeneficiaryName] = useState('Pengurus Panti & Posko Bencana Riau');
  const [beneficiaryAddress, setBeneficiaryAddress] = useState('0x12Fa99c82A6B29124DE6F7188179469e358b2921');
  const [imageUrl, setImageUrl] = useState(INDONESIAN_IMAGES[0].url);

  const [milestones, setMilestones] = useState<MilestoneInput[]>([
    { title: 'Tahap 1: Pengadaan Kebutuhan Mendesak & Logistik Pokok', description: 'Pembelian barang pokok disertai nota resmi dan berita acara serah terima.', percentage: 35 },
    { title: 'Tahap 2: Pelaksanaan Teknis Lapangan & Instalasi', description: 'Pelaksanaan fisik dengan bukti foto geotagging koordinat dan kuitansi toko.', percentage: 40 },
    { title: 'Tahap 3: Evaluasi Akhir & Serah Terima ke Masyarakat', description: 'Pemeriksaan akhir bersama tim verifier dan serah terima penuh ke warga.', percentage: 25 }
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedTxHash, setCompletedTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalPercentage = milestones.reduce((acc, m) => acc + (Number(m.percentage) || 0), 0);
  const numTarget = parseInt(targetIDRStr, 10) || 0;

  const handleAddMilestone = () => {
    if (milestones.length >= 6) return;
    setMilestones([
      ...milestones,
      {
        title: `Tahap ${milestones.length + 1}: Uraian Rencana Tahapan`,
        description: 'Tuliskan indikator keberhasilan dan syarat bukti audit yang harus diunggah.',
        percentage: 0
      }
    ]);
  };

  const handleRemoveMilestone = (index: number) => {
    if (milestones.length <= 1) return;
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const handleMilestoneChange = (index: number, field: keyof MilestoneInput, val: any) => {
    const updated = [...milestones];
    updated[index] = { ...updated[index], [field]: val };
    setMilestones(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalPercentage !== 100) {
      setError(`Total persentase tahap pencairan harus tepat 100% (saat ini: ${totalPercentage}%).`);
      return;
    }

    if (numTarget < 1000000) {
      setError('Target donasi minimal adalah Rp 1.000.000.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const res = await onCreate({
        title,
        tagline: tagline || title,
        description,
        category,
        location,
        targetIDR: numTarget,
        deadlineDays: parseInt(deadlineDays, 10) || 30,
        beneficiaryAddress,
        beneficiaryName,
        managerAddress: currentAccount.address,
        milestones,
        imageUrl
      });

      setCompletedTxHash(res.txHash);
    } catch (err: any) {
      setError(err.message || 'Gagal mendaftarkan program donasi ke smart contract.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setCompletedTxHash(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 overflow-hidden max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-white tracking-tight">
                Buat Program Donasi Terverifikasi (Escrow)
              </h2>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Mendaftarkan program crowdfunding dengan sistem pencairan bertahap yang diaudit di blockchain.
            </p>
          </div>
          <button 
            onClick={handleResetAndClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {completedTxHash ? (
          <div className="py-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <h3 className="mt-4 text-xl font-bold text-white">Program Donasi Berhasil Didaftarkan!</h3>
            <p className="mt-2 text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
              Program <strong className="text-white">"{title}"</strong> telah aktif pada smart contract dengan {milestones.length} tahapan pencairan dana escrow.
            </p>

            <div className="mt-5 rounded-xl bg-slate-950 p-4 border border-slate-800 text-left text-xs font-mono space-y-2">
              <div className="flex justify-between items-center text-slate-400">
                <span>Transaction Hash:</span>
                <span className="text-emerald-400 font-semibold">{formatAddress(completedTxHash, 6)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Target Donasi:</span>
                <span className="text-white font-bold">{formatIDR(numTarget)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Penerima Manfaat:</span>
                <span className="text-slate-300">{beneficiaryName}</span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  onViewTx(completedTxHash);
                  handleResetAndClose();
                }}
                className="py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors flex items-center gap-1.5"
              >
                <span>Lihat di Eksplorasi Blockchain</span>
                <ExternalLink className="h-3.5 w-3.5 text-cyan-400" />
              </button>

              <button
                onClick={handleResetAndClose}
                className="py-2.5 px-5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs hover:opacity-90 transition-opacity"
              >
                Selesai
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            
            {/* Title & Tagline */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Judul Program Donasi
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Bantuan Pemulihan Fasilitas Sekolah Pascabanjir di Riau"
                className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Kategori Program
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="Bencana Alam">Bencana Alam</option>
                  <option value="Kesehatan">Kesehatan</option>
                  <option value="Pendidikan">Pendidikan</option>
                  <option value="Sosial">Sosial</option>
                  <option value="Lingkungan">Lingkungan</option>
                  <option value="Keagamaan">Keagamaan</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Lokasi / Wilayah
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Contoh: Riau / Pekanbaru"
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Target Donasi (Rupiah)
                </label>
                <input
                  type="number"
                  step="1000000"
                  required
                  value={targetIDRStr}
                  onChange={(e) => setTargetIDRStr(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Tagline */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Deskripsi Singkat / Tagline
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Ringkasan dampak bantuan dalam 1 kalimat"
                className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Uraian Lengkap Kebutuhan Program
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Jelaskan latar belakang, rencana alokasi dana, penerima manfaat sasaran, dan hasil yang diharapkan..."
                className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Beneficiary Name & Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nama Resmi Penerima Manfaat
                </label>
                <input
                  type="text"
                  required
                  value={beneficiaryName}
                  onChange={(e) => setBeneficiaryName(e.target.value)}
                  placeholder="Contoh: Panitia Pembangunan Madrasah Riau"
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Alamat Rekening / Wallet Penerima
                </label>
                <input
                  type="text"
                  required
                  value={beneficiaryAddress}
                  onChange={(e) => setBeneficiaryAddress(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Image Preset Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Pilih Foto Sampul (Konteks Indonesia)
              </label>
              <div className="grid grid-cols-5 gap-2">
                {INDONESIAN_IMAGES.map((img, i) => (
                  <button
                    type="button"
                    key={i}
                    onClick={() => setImageUrl(img.url)}
                    className={`relative rounded-lg overflow-hidden border transition-all h-14 ${
                      imageUrl === img.url
                        ? 'border-emerald-500 ring-2 ring-emerald-500/40'
                        : 'border-slate-800 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                    <span className="absolute inset-0 bg-black/50 flex items-center justify-center text-[9px] font-bold text-white text-center p-1">
                      {img.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Milestone Escrow Schedule Builder */}
            <div className="pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Tahapan Pencairan Dana Escrow (Total Wajib 100%)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Bagi target donasi menjadi beberapa termin rilis berbasis pembuktian faktual.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                    totalPercentage === 100 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}>
                    Total: {totalPercentage}%
                  </span>

                  <button
                    type="button"
                    onClick={handleAddMilestone}
                    disabled={milestones.length >= 6}
                    className="py-1 px-2.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Tambah</span>
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {milestones.map((m, idx) => {
                  const trancheIDR = Math.round((numTarget * (m.percentage || 0)) / 100);
                  return (
                    <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-bold text-slate-400">Tahap #{idx + 1}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-emerald-400 font-mono font-bold">
                            ≈ {formatIDR(trancheIDR)}
                          </span>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="1"
                              max="100"
                              value={m.percentage}
                              onChange={(e) => handleMilestoneChange(idx, 'percentage', parseInt(e.target.value, 10) || 0)}
                              className="w-16 rounded bg-slate-900 border border-slate-700 px-2 py-1 text-center font-mono text-white"
                            />
                            <span className="text-slate-400">%</span>
                          </div>
                          {milestones.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMilestone(idx)}
                              className="p-1 text-slate-500 hover:text-red-400"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <input
                        type="text"
                        required
                        value={m.title}
                        onChange={(e) => handleMilestoneChange(idx, 'title', e.target.value)}
                        placeholder="Uraian Nama Tahap Pekerjaan"
                        className="w-full rounded bg-slate-900 border border-slate-800 px-2.5 py-1.5 text-xs text-white"
                      />

                      <textarea
                        rows={1}
                        value={m.description}
                        onChange={(e) => handleMilestoneChange(idx, 'description', e.target.value)}
                        placeholder="Syarat bukti audit yang wajib diunggah (kuitansi toko, faktur pengadaan, foto koordinat GPS, BAST)"
                        className="w-full rounded bg-slate-900 border border-slate-800 px-2.5 py-1.5 text-xs text-slate-300"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-950/80 p-2.5 border border-red-800 text-xs text-red-300">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors"
              >
                Batal
              </button>
              
              <button
                type="submit"
                disabled={isSubmitting || totalPercentage !== 100}
                className="py-2.5 px-5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                {isSubmitting ? (
                  <>
                    <span className="h-3.5 w-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Mendaftarkan Program...</span>
                  </>
                ) : (
                  <>
                    <span>Terbitkan Program ke Smart Contract</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
