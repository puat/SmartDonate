import React, { useState } from 'react';
import { BlockchainTransaction, BlockchainBlock, BlockchainStats } from '../types';
import { formatAddress, formatIDR } from '../blockchain/ethereumService';
import { 
  Layers, 
  Search, 
  CheckCircle2, 
  Copy, 
  Check, 
  X,
  FileCode,
  Cpu,
  Hash
} from 'lucide-react';

interface BlockExplorerProps {
  stats: BlockchainStats | null;
  blocks: BlockchainBlock[];
  transactions: BlockchainTransaction[];
  selectedTxHash?: string | null;
  onSelectTxHash: (hash: string | null) => void;
}

export const BlockExplorer: React.FC<BlockExplorerProps> = ({
  stats,
  blocks,
  transactions,
  selectedTxHash,
  onSelectTxHash
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const activeTx = transactions.find(
    t => t.hash.toLowerCase() === (selectedTxHash || '').toLowerCase()
  );

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const filteredTransactions = transactions.filter(t => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.hash.toLowerCase().includes(q) ||
      (t.donationId && t.donationId.toLowerCase().includes(q)) ||
      (t.campaignTitle && t.campaignTitle.toLowerCase().includes(q)) ||
      t.from.toLowerCase().includes(q) ||
      t.to.toLowerCase().includes(q) ||
      t.activityType.toLowerCase().includes(q) ||
      t.blockNumber.toString().includes(q)
    );
  });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300 space-y-8">
      
      {/* Top Banner */}
      <div className="pb-6 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Layers className="h-6 w-6 text-cyan-400" />
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Eksplorasi Blockchain & Ledger Transparansi Donasi
          </h1>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Pencatatan publik setiap transaksi donasi, pengajuan bukti milestone, keputusan verifikasi, dan pencairan dana escrow secara permanen dan transparan.
        </p>
      </div>

      {/* Network Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Tinggi Blok Saat Ini
          </div>
          <div className="mt-1 text-2xl font-extrabold text-white font-mono flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>#{stats?.blockHeight || 1045}</span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-1">SmartDonate Private EVM</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Jumlah Transaksi
          </div>
          <div className="mt-1 text-2xl font-extrabold text-white font-mono">
            {stats?.totalTransactions || transactions.length}
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-1">Transaksi On-Chain</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Saldo Escrow Smart Contract
          </div>
          <div className="mt-1 text-xl font-extrabold text-emerald-400 font-mono">
            {formatIDR(stats?.contractBalanceIDR || 0)}
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-1">Dana Terkunci Aman</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Biaya Gas Rata-Rata
          </div>
          <div className="mt-1 text-2xl font-extrabold text-cyan-300 font-mono">
            12.8 Gwei
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-1">EIP-1559 Standar</div>
        </div>

      </div>

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari berdasarkan ID Donasi (DON-...), Tx Hash (0x...), Nama Program, Aktivitas, atau Blok..."
          className="w-full rounded-xl bg-slate-900 border border-slate-800 pl-11 pr-4 py-3 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500 shadow-sm"
        />
        <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-500" />
      </div>

      {/* Main Split: Transactions Table & Recent Blocks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Transactions Table */}
        <div className="lg:col-span-2 rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
          
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Daftar Transaksi On-Chain ({filteredTransactions.length})
            </h2>
            <span className="text-[10px] font-mono text-slate-400">Terakhir 50 Transaksi</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 text-[11px]">
                <tr>
                  <th className="py-3 px-4">ID Transaksi / Hash</th>
                  <th className="py-3 px-4">Aktivitas</th>
                  <th className="py-3 px-4">Program</th>
                  <th className="py-3 px-4">Blok</th>
                  <th className="py-3 px-4 text-right">Nominal (IDR)</th>
                  <th className="py-3 px-4 text-right">Waktu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredTransactions.map((tx) => {
                  let badgeColor = "text-slate-300 bg-slate-800 border-slate-700";
                  if (tx.activityType === 'Donasi') badgeColor = "text-emerald-400 bg-emerald-950/80 border-emerald-800";
                  if (tx.activityType === 'Verifikasi Milestone') badgeColor = "text-teal-300 bg-teal-950/80 border-teal-800";
                  if (tx.activityType === 'Pencairan Dana') badgeColor = "text-amber-300 bg-amber-950/80 border-amber-800";
                  if (tx.activityType === 'Pengajuan Bukti') badgeColor = "text-cyan-300 bg-cyan-950/80 border-cyan-800";

                  return (
                    <tr 
                      key={tx.hash} 
                      onClick={() => onSelectTxHash(tx.hash)}
                      className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="text-cyan-400 font-bold hover:underline">
                          {tx.donationId || formatAddress(tx.hash, 4)}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {formatAddress(tx.hash, 3)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badgeColor}`}>
                          {tx.activityType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-sans max-w-xs truncate">
                        {tx.campaignTitle || 'SmartDonate Protocol'}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        #{tx.blockNumber}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-white">
                        {tx.amountIDR > 0 ? formatIDR(tx.amountIDR) : '-'}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-500 text-[10px]">
                        {new Date(tx.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>

        {/* Right 1 Col: Recent Blocks Feed */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Layers className="h-4 w-4 text-cyan-400" />
              <span>Blok Terbaru</span>
            </h2>
            <span className="text-[10px] font-mono text-emerald-400">Konsensus Valid</span>
          </div>

          <div className="space-y-3">
            {blocks.slice(0, 6).map((b) => (
              <div 
                key={b.number}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-emerald-400">Blok #{b.number}</span>
                  <span className="text-[10px] text-slate-500 font-mono">1 transaksi</span>
                </div>
                <div className="mt-1 text-[11px] text-slate-400 font-mono truncate">
                  Hash: {b.hash}
                </div>
                <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>Gas: {b.gasUsed.toLocaleString()}</span>
                  <span>Base Fee: {b.baseFeeGwei.toFixed(1)} Gwei</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Transaction Details Modal */}
      {activeTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 overflow-hidden max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Resi Transaksi Blockchain (Audit On-Chain)
                  </h3>
                </div>
                <p className="mt-1 text-xs text-slate-400 font-mono">
                  Status: Terkonfirmasi pada Blok #{activeTx.blockNumber}
                </p>
              </div>

              <button
                onClick={() => onSelectTxHash(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Receipt Table */}
            <div className="mt-5 space-y-3 text-xs font-mono">
              
              {activeTx.donationId && (
                <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/60 flex justify-between items-center">
                  <span className="text-emerald-300 font-sans font-bold">ID Donasi:</span>
                  <span className="text-white font-bold">{activeTx.donationId}</span>
                </div>
              )}

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Transaction Hash:</span>
                <div className="flex items-center gap-2">
                  <span className="text-cyan-400 font-bold truncate max-w-xs">{activeTx.hash}</span>
                  <button 
                    onClick={() => handleCopy(activeTx.hash)}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    {copiedHash === activeTx.hash ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  </button>
                </div>
              </div>

              {activeTx.evidenceHash && (
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">Evidence Hash:</span>
                  <span className="text-emerald-400 truncate max-w-xs font-semibold">{activeTx.evidenceHash}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Dari (Pengirim/Donatur):</div>
                  <div className="text-slate-200 font-bold mt-0.5 truncate">{activeTx.from}</div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Kontrak Tujuan (Escrow):</div>
                  <div className="text-emerald-400 font-bold mt-0.5 truncate">{activeTx.to}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Nominal Transaksi:</div>
                  <div className="text-white font-bold mt-0.5">
                    {activeTx.amountIDR > 0 ? formatIDR(activeTx.amountIDR) : 'Rp 0'}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Gas Digunakan:</div>
                  <div className="text-white font-bold mt-0.5">{activeTx.gasUsed.toLocaleString()}</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Harga Gas:</div>
                  <div className="text-white font-bold mt-0.5">{activeTx.gasPriceGwei} Gwei</div>
                </div>
              </div>

              {/* Decoded Parameters */}
              {activeTx.decodedParams && (
                <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                  <div className="text-xs font-sans font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <FileCode className="h-4 w-4 text-cyan-400" />
                    <span>Parameter Metode Smart Contract ({activeTx.activityType})</span>
                  </div>
                  <pre className="p-3 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-300 overflow-x-auto">
                    {JSON.stringify(activeTx.decodedParams, null, 2)}
                  </pre>
                </div>
              )}

              {/* Emitted Events */}
              {activeTx.logs && activeTx.logs.length > 0 && (
                <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                  <div className="text-xs font-sans font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Cpu className="h-4 w-4 text-emerald-400" />
                    <span>Event Log Smart Contract ({activeTx.logs.length})</span>
                  </div>
                  {activeTx.logs.map((log, idx) => (
                    <div key={idx} className="p-3 rounded bg-slate-900 border border-slate-800 space-y-1">
                      <div className="text-emerald-400 font-bold">{log.event}</div>
                      <div className="text-[10px] text-slate-500">{log.signature}</div>
                      <pre className="text-[11px] text-slate-300 mt-1">
                        {JSON.stringify(log.args, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              )}

            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => onSelectTxHash(null)}
                className="py-2 px-5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors"
              >
                Tutup Resi
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
