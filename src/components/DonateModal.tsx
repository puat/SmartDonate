import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Campaign, AccountProfile, UserRole, PaymentMethod, IndonesianBank } from '../types';
import { formatIDR, formatAddress } from '../blockchain/ethereumService';
import { 
  X, 
  Coins, 
  Lock, 
  ShieldCheck, 
  ExternalLink, 
  CheckCircle2, 
  QrCode, 
  CreditCard, 
  Building2, 
  Copy, 
  Check, 
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface DonateModalProps {
  campaign: Campaign;
  isOpen: boolean;
  onClose: () => void;
  onDonate: (data: {
    amountIDR: number;
    paymentMethod: PaymentMethod;
    bankName?: IndonesianBank;
    donorAddress?: string;
    donorName?: string;
    message?: string;
    isAnonymous?: boolean;
  }) => Promise<{ txHash: string; donationId?: string }>;
  currentAccount: AccountProfile;
  currentRole: UserRole;
  onViewTx: (hash: string) => void;
}

const PRESET_NOMINALS = [50000, 100000, 250000, 500000, 1000000];

const INDONESIAN_BANKS: IndonesianBank[] = [
  'Bank Syariah Indonesia',
  'Bank Mandiri',
  'Bank BRI',
  'Bank BNI',
  'Bank BCA'
];

export const DonateModal: React.FC<DonateModalProps> = ({
  campaign,
  isOpen,
  onClose,
  onDonate,
  currentAccount,
  currentRole,
  onViewTx
}) => {
  const [amount, setAmount] = useState<number>(250000);
  const [customAmountStr, setCustomAmountStr] = useState<string>('250000');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('QRIS');
  const [selectedBank, setSelectedBank] = useState<IndonesianBank>('Bank Syariah Indonesia');
  const [donorName, setDonorName] = useState<string>(currentAccount.name);
  const [message, setMessage] = useState<string>('Semoga bantuan ini bermanfaat dan berkah bagi saudara-saudara kita.');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [completedTx, setCompletedTx] = useState<{ txHash: string; donationId?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleNominalSelect = (val: number) => {
    setAmount(val);
    setCustomAmountStr(val.toString());
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    const num = parseInt(raw, 10) || 0;
    setCustomAmountStr(raw);
    setAmount(num);
  };

  const simulatedVA = `8801 ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount < 10000) {
      setError('Nominal donasi minimal adalah Rp 10.000.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const result = await onDonate({
        amountIDR: amount,
        paymentMethod,
        bankName: paymentMethod !== 'QRIS' ? selectedBank : undefined,
        donorAddress: currentAccount.address,
        donorName: isAnonymous ? 'Hamba Allah (Anonim)' : donorName,
        message,
        isAnonymous
      });

      setCompletedTx(result);
      
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (err: any) {
      setError(err.message || 'Pembayaran donasi gagal diproses.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setCompletedTx(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 overflow-hidden max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
              <h2 className="text-lg font-bold text-white tracking-tight">
                Donasi Aman ke Smart Contract Escrow
              </h2>
            </div>
            <p className="mt-1 text-xs text-slate-400 truncate max-w-sm">
              Program: {campaign.title}
            </p>
          </div>
          <button 
            onClick={handleResetAndClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Success Confirmation State */}
        {completedTx ? (
          <div className="py-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <h3 className="mt-4 text-xl font-bold text-white">Pembayaran Donasi Berhasil!</h3>
            <p className="mt-2 text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
              Alhamdulillah, donasi Anda sebesar <strong className="text-emerald-400 font-mono font-bold">{formatIDR(amount)}</strong> telah masuk dan dikunci dalam <strong className="text-white">Smart Contract Escrow</strong>. Dana tidak dapat ditarik sembarangan hingga tahapan diverifikasi oleh auditor.
            </p>

            {/* Resi Bukti Donasi */}
            <div className="mt-5 rounded-xl bg-slate-950 p-4 border border-slate-800 text-left text-xs font-mono space-y-2">
              <div className="flex justify-between items-center text-slate-400">
                <span>ID Donasi:</span>
                <span className="text-white font-bold">{completedTx.donationId || 'DON-2026-000145'}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Metode Pembayaran:</span>
                <span className="text-slate-300">{paymentMethod}{paymentMethod !== 'QRIS' ? ` (${selectedBank})` : ''}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Status Pembayaran:</span>
                <span className="text-emerald-400 font-bold">Lunas / Terverifikasi</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Blockchain Tx Hash:</span>
                <span className="text-cyan-400 font-semibold">{formatAddress(completedTx.txHash, 6)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Keamanan Dana:</span>
                <span className="text-amber-400">Escrow Milestone Protected</span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  onViewTx(completedTx.txHash);
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
          /* Form Input State */
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            
            {/* Quick Nominal Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Pilih Nominal Donasi
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                {PRESET_NOMINALS.map((nom) => (
                  <button
                    type="button"
                    key={nom}
                    onClick={() => handleNominalSelect(nom)}
                    className={`py-2 px-1 text-[11px] font-mono font-bold rounded-lg border transition-all ${
                      amount === nom
                        ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {formatIDR(nom).replace(',00', '')}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Nominal Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nominal Lainnya (Rupiah)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={customAmountStr ? formatIDR(parseInt(customAmountStr, 10) || 0) : ''}
                  onChange={handleCustomChange}
                  placeholder="Rp 0"
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-lg font-mono font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  required
                />
              </div>
              <div className="mt-1 text-[11px] text-slate-400">
                Minimal donasi: <strong className="text-slate-200">Rp 10.000</strong>
              </div>
            </div>

            {/* Metode Pembayaran Indonesia */}
            <div className="pt-1">
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Metode Pembayaran
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('QRIS')}
                  className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 text-xs ${
                    paymentMethod === 'QRIS'
                      ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <QrCode className="h-4 w-4" />
                  <span>QRIS</span>
                  <span className="text-[9px] font-normal text-slate-400">Gopay/OVO/BCA</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('Virtual Account')}
                  className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 text-xs ${
                    paymentMethod === 'Virtual Account'
                      ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Virtual Account</span>
                  <span className="text-[9px] font-normal text-slate-400">Konfirmasi Otomatis</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('Bank Transfer')}
                  className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 text-xs ${
                    paymentMethod === 'Bank Transfer'
                      ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Building2 className="h-4 w-4" />
                  <span>Transfer Bank</span>
                  <span className="text-[9px] font-normal text-slate-400">ATM / M-Banking</span>
                </button>
              </div>

              {/* Bank Selector if VA or Bank Transfer */}
              {paymentMethod !== 'QRIS' && (
                <div className="mt-3">
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Pilih Bank Tujuan:
                  </label>
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value as IndonesianBank)}
                    className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    {INDONESIAN_BANKS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Payment Preview Container */}
              <div className="mt-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                {paymentMethod === 'QRIS' ? (
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 bg-white p-1 rounded-lg flex items-center justify-center shrink-0">
                      <QrCode className="h-14 w-14 text-slate-900" />
                    </div>
                    <div>
                      <div className="font-bold text-white">QRIS Standar Indonesia</div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Dapat dipindai menggunakan BCA Mobile, Mandiri Livin', BSI Mobile, GoPay, OVO, Dana, dan ShopeePay.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Nomor Rekening / VA ({selectedBank}):</span>
                      <span className="text-emerald-400 font-mono font-bold">SmartDonate Escrow</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between font-mono font-bold text-sm text-white bg-slate-900 p-2 rounded border border-slate-800">
                      <span>{simulatedVA}</span>
                      <span className="text-[10px] text-slate-500">Salin</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Nama Donatur & Opsi Anonim */}
            <div className="pt-1">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Nama Donatur
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span>Sembunyikan Nama (Hamba Allah)</span>
                </label>
              </div>
              <input
                type="text"
                disabled={isAnonymous}
                value={isAnonymous ? 'Hamba Allah (Anonim)' : donorName}
                onChange={(e) => setDonorName(e.target.value)}
                className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white disabled:opacity-50 disabled:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Doa / Pesan Kebaikan */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Pesan / Doa Kebaikan (Tercatat di Blockchain)
              </label>
              <textarea
                rows={2}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tuliskan doa atau pesan dukungan bagi para penerima manfaat..."
                className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Jaminan Escrow */}
            <div className="rounded-xl bg-emerald-950/30 p-3 border border-emerald-800/40 text-xs flex items-start gap-2.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-slate-300 leading-snug">
                <strong className="text-emerald-300">Perlindungan Smart Contract:</strong> 100% dana Anda dikunci di sistem escrow dan hanya dicairkan bertahap setelah bukti faktual diverifikasi oleh auditor independen.
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-950/80 p-2.5 border border-red-800 text-xs text-red-300">
                {error}
              </div>
            )}

            {/* Actions */}
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
                disabled={isSubmitting || amount < 10000}
                className="py-2.5 px-5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                {isSubmitting ? (
                  <>
                    <span className="h-3.5 w-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Memproses Pembayaran...</span>
                  </>
                ) : (
                  <>
                    <span>Bayar Donasi {formatIDR(amount)}</span>
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
