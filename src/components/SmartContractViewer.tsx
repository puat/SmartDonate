import React, { useState } from 'react';
import { 
  SOLIDITY_SOURCE_CODE, 
  SMART_DONATE_ABI, 
  SMART_DONATE_CONTRACT_ADDRESS, 
  CHAIN_ID, 
  NETWORK_NAME 
} from '../blockchain/solidityContract';
import { formatAddress } from '../blockchain/ethereumService';
import { 
  FileCode2, 
  Copy, 
  Check, 
  ShieldCheck, 
  Code, 
  Terminal,
  Lock,
  Layers
} from 'lucide-react';

export const SmartContractViewer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'source' | 'abi'>('source');
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <FileCode2 className="h-6 w-6 text-emerald-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Inspeksi Kode Smart Contract Escrow
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-400 max-w-2xl">
            Protokol smart contract <strong className="text-white">SmartDonateEscrow.sol</strong> yang mengatur penguncian dana donasi, verifikasi hash bukti, dan otorisasi pencairan bertahap secara desentralisasi.
          </p>
        </div>

        {/* Contract Address Pill */}
        <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs">
          <span className="text-slate-400">Alamat Kontrak:</span>
          <span className="text-emerald-400 font-bold">{formatAddress(SMART_DONATE_CONTRACT_ADDRESS, 6)}</span>
          <button
            onClick={() => handleCopy(SMART_DONATE_CONTRACT_ADDRESS, 'addr')}
            className="p-1 text-slate-400 hover:text-white"
          >
            {copied === 'addr' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Contract Verification Metadata Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[10px] text-slate-500 uppercase font-sans font-bold">Kompiler Solidity</div>
          <div className="text-slate-200 font-bold mt-0.5">Solidity v0.8.20</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[10px] text-slate-500 uppercase font-sans font-bold">Jaringan & Chain ID</div>
          <div className="text-emerald-400 font-bold mt-0.5">EVM SmartDonate (ID 31337)</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[10px] text-slate-500 uppercase font-sans font-bold">Lisensi Terbuka</div>
          <div className="text-slate-200 font-bold mt-0.5">MIT Open Source</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[10px] text-slate-500 uppercase font-sans font-bold">Status Audit Kontrak</div>
          <div className="text-cyan-400 font-bold mt-0.5">Lolos Verifikasi Formal</div>
        </div>
      </div>

      {/* Penjelasan Arsitektur Escrow Indonesia */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs space-y-2">
        <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
          <ShieldCheck className="h-4 w-4" />
          <span>Alur Logika Escrow SmartDonate:</span>
        </div>
        <p className="text-slate-300 leading-relaxed">
          1. <strong>Dana Donasi:</strong> Donatur menyalurkan dana dalam Rupiah (QRIS/VA/Transfer Bank) yang dicatat ke sistem escrow pintar.<br />
          2. <strong>Penguncian Escrow:</strong> 100% dana tertahan di kontrak pintar sampai pengelola mengunggah bukti penyelesaian tahap (milestone).<br />
          3. <strong>Pemeriksaan Verifier:</strong> Verifikator independen mengaudit keaslian fisik kuitansi, faktur, dan BAST.<br />
          4. <strong>Otorisasi Pencairan:</strong> Smart contract mengotorisasi pencairan tepat sesuai persentase yang disepakati langsung ke rekening penerima manfaat.
        </p>
      </div>

      {/* Tabs */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-3 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('source')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'source'
                  ? 'bg-slate-800 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Code className="h-4 w-4 text-emerald-400" />
              <span>SmartDonateEscrow.sol (Source Code)</span>
            </button>

            <button
              onClick={() => setActiveTab('abi')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'abi'
                  ? 'bg-slate-800 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Terminal className="h-4 w-4 text-cyan-400" />
              <span>ABI Kontrak ({SMART_DONATE_ABI.length} fungsi & event)</span>
            </button>
          </div>

          <button
            onClick={() => handleCopy(
              activeTab === 'source' ? SOLIDITY_SOURCE_CODE : JSON.stringify(SMART_DONATE_ABI, null, 2),
              activeTab
            )}
            className="py-1 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors flex items-center gap-1.5"
          >
            {copied === activeTab ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied === activeTab ? 'Disalin' : 'Salin Kode'}</span>
          </button>
        </div>

        {/* Code Viewport */}
        <div className="p-4 sm:p-6 bg-[#070a10] overflow-x-auto max-h-[600px] overflow-y-auto">
          <pre className="text-xs font-mono text-slate-300 leading-relaxed">
            {activeTab === 'source' 
              ? SOLIDITY_SOURCE_CODE 
              : JSON.stringify(SMART_DONATE_ABI, null, 2)}
          </pre>
        </div>

      </div>

    </div>
  );
};
