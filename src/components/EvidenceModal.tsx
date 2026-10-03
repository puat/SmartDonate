import React, { useState } from 'react';
import { Campaign, Milestone, AccountProfile } from '../types';
import { formatIDR, computeSha256, generateIpfsCID } from '../blockchain/ethereumService';
import { 
  X, 
  Upload, 
  FileCheck2, 
  Hash, 
  Cpu, 
  FileText, 
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

interface EvidenceModalProps {
  campaign: Campaign;
  milestone: Milestone;
  isOpen: boolean;
  onClose: () => void;
  onSubmitEvidence: (campaignId: number, milestoneId: number, data: any) => Promise<any>;
  currentAccount: AccountProfile;
  onViewTx: (hash: string) => void;
}

const INDONESIAN_EVIDENCE_PRESETS = [
  {
    label: "Berita Acara Serah Terima (BAST) & Kuitansi",
    title: "Berita Acara Serah Terima Barang & Faktur Pembelian Resmi",
    contractorName: "CV Mitra Sejahtera Mandiri",
    fileName: "berita_acara_serah_terima_dan_kuitansi.pdf",
    fileSize: "4.2 MB",
    fileUrl: "https://images.unsplash.com/photo-1541888946425-d0fbb186f5f7?w=800&auto=format&fit=crop&q=80",
    description: "Dokumen BAST bertandatangan kepala desa/penanggung jawab posko, kuitansi bermaterai, dan foto serah terima barang.",
    locationGeo: "Kabupaten Kampar, Riau"
  },
  {
    label: "Sertifikasi Uji Laboratorium / Mutu Bahan",
    title: "Laporan Hasil Uji Laboratorium & Standar Kelayakan",
    contractorName: "Balai Pengujian Standarisasi Mutu",
    fileName: "sertifikat_uji_laboratorium_resmi.pdf",
    fileSize: "5.6 MB",
    fileUrl: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&auto=format&fit=crop&q=80",
    description: "Laporan uji kelayakan air/konstruksi yang diterbitkan oleh balai pengujian terakreditasi pemerintah.",
    locationGeo: "Laboratorium Regional Riau"
  },
  {
    label: "Laporan Fisik Konstruksi & Geotagging Lapangan",
    title: "Laporan Kemajuan Pekerjaan Fisik & Foto Koordinat GPS",
    contractorName: "PT Riau Konstruksi Kemanusiaan",
    fileName: "laporan_kemajuan_fisik_geotagging.pdf",
    fileSize: "6.1 MB",
    fileUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop&q=80",
    description: "Dokumentasi foto tahapan konstruksi dengan koordinat GPS, catatan volume material, dan absensi pekerja.",
    locationGeo: "Titik Lokasi Proyek (GPS Geotag)"
  }
];

export const EvidenceModal: React.FC<EvidenceModalProps> = ({
  campaign,
  milestone,
  isOpen,
  onClose,
  onSubmitEvidence,
  currentAccount,
  onViewTx
}) => {
  const [selectedPreset, setSelectedPreset] = useState<number>(0);
  const [title, setTitle] = useState(INDONESIAN_EVIDENCE_PRESETS[0].title);
  const [contractorName, setContractorName] = useState(INDONESIAN_EVIDENCE_PRESETS[0].contractorName);
  const [description, setDescription] = useState(INDONESIAN_EVIDENCE_PRESETS[0].description);
  const [fileName, setFileName] = useState(INDONESIAN_EVIDENCE_PRESETS[0].fileName);
  const [fileSize, setFileSize] = useState(INDONESIAN_EVIDENCE_PRESETS[0].fileSize);
  const [fileUrl, setFileUrl] = useState(INDONESIAN_EVIDENCE_PRESETS[0].fileUrl);
  const [locationGeo, setLocationGeo] = useState(INDONESIAN_EVIDENCE_PRESETS[0].locationGeo);
  const [invoiceAmountStr, setInvoiceAmountStr] = useState<string>(milestone.releaseAmountIDR.toString());
  
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [completedTxHash, setCompletedTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePresetSelect = (idx: number) => {
    setSelectedPreset(idx);
    const p = INDONESIAN_EVIDENCE_PRESETS[idx];
    setTitle(p.title);
    setContractorName(p.contractorName);
    setDescription(p.description);
    setFileName(p.fileName);
    setFileSize(p.fileSize);
    setFileUrl(p.fileUrl);
    setLocationGeo(p.locationGeo);
  };

  const previewCID = generateIpfsCID(title + description);
  const previewSha256 = computeSha256(title + contractorName + description);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await onSubmitEvidence(campaign.id, milestone.id, {
        title,
        description,
        fileName,
        fileSize,
        fileType: "application/pdf",
        fileUrl,
        contractorName,
        invoiceAmountIDR: parseInt(invoiceAmountStr, 10) || milestone.releaseAmountIDR,
        locationGeo
      });

      setCompletedTxHash(res.txHash);
    } catch (err: any) {
      setError(err.message || "Gagal mengunggah bukti penggunaan dana.");
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
      <div className="relative w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 overflow-hidden max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-cyan-400" />
              <h2 className="text-lg font-bold text-white tracking-tight">
                Unggah Bukti Penggunaan Dana
              </h2>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              {milestone.title} ({milestone.percentage}% · {formatIDR(milestone.releaseAmountIDR)})
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
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <h3 className="mt-4 text-xl font-bold text-white">Bukti Terunggah & Terverifikasi di Blockchain!</h3>
            <p className="mt-2 text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
              Hash kriptografis (IPFS CID & SHA-256) telah di-anchor ke smart contract. Notifikasi peninjauan telah diteruskan ke verifier independen.
            </p>

            <div className="mt-5 rounded-xl bg-slate-950 p-4 border border-slate-800 text-left text-xs font-mono space-y-2">
              <div className="flex justify-between items-center text-slate-400">
                <span>Transaction Hash:</span>
                <span className="text-cyan-400 font-semibold">{completedTxHash.substring(0, 16)}...</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>IPFS CID:</span>
                <span className="text-slate-300">{previewCID.substring(0, 20)}...</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Hash SHA-256:</span>
                <span className="text-emerald-400">{previewSha256.substring(0, 18)}...</span>
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
                className="py-2.5 px-5 rounded-lg bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 transition-colors"
              >
                Selesai
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            
            {/* Quick Presets */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Pilih Format Contoh Dokumen Bukti:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {INDONESIAN_EVIDENCE_PRESETS.map((p, i) => (
                  <button
                    type="button"
                    key={i}
                    onClick={() => handlePresetSelect(i)}
                    className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                      selectedPreset === i
                        ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300 font-semibold shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-semibold text-slate-200 truncate">{p.label}</div>
                    <div className="text-[10px] text-slate-500 mt-1">{p.fileSize} · PDF</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Document Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Judul Dokumen / Bukti Pertanggungjawaban
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nama Rekanan / Kontraktor / Pihak Kedua
                </label>
                <input
                  type="text"
                  value={contractorName}
                  onChange={(e) => setContractorName(e.target.value)}
                  required
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nominal Kuitansi (Rupiah)
                </label>
                <input
                  type="number"
                  value={invoiceAmountStr}
                  onChange={(e) => setInvoiceAmountStr(e.target.value)}
                  required
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Ringkasan Hasil Pekerjaan & Kesesuaian Rencana
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Lokasi Pelaksanaan (Geotagging Wilayah)
              </label>
              <input
                type="text"
                value={locationGeo}
                onChange={(e) => setLocationGeo(e.target.value)}
                required
                className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            {/* Cryptographic Preview Box */}
            <div className="rounded-xl bg-slate-950 p-3.5 border border-slate-800 space-y-2 text-xs font-mono">
              <div className="flex items-center gap-1.5 text-cyan-400 font-sans font-semibold text-[11px]">
                <Cpu className="h-3.5 w-3.5" />
                <span>Hash Kriptografis yang Akan Diterbitkan ke Blockchain:</span>
              </div>
              <div className="text-[11px] text-slate-400 flex justify-between">
                <span>IPFS CID:</span>
                <span className="text-slate-300">{previewCID.substring(0, 24)}...</span>
              </div>
              <div className="text-[11px] text-slate-400 flex justify-between">
                <span>Digest SHA-256:</span>
                <span className="text-emerald-400">{previewSha256.substring(0, 24)}...</span>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-950/80 p-2.5 border border-red-800 text-xs text-red-300">
                {error}
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors"
              >
                Batal
              </button>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="py-2.5 px-5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-cyan-500/20"
              >
                {isSubmitting ? (
                  <>
                    <span className="h-3.5 w-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Mencatat ke Blockchain...</span>
                  </>
                ) : (
                  <>
                    <FileCheck2 className="h-4 w-4" />
                    <span>Kirim Bukti ke Smart Contract</span>
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
