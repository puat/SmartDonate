import React from 'react';
import { 
  ShieldCheck, 
  RefreshCw, 
  Layers, 
  FileCode2, 
  ChevronDown,
  PlusCircle,
  Activity,
  CheckCircle2
} from 'lucide-react';
import { UserRole, AccountProfile, BlockchainStats } from '../types';
import { formatAddress, formatIDR } from '../blockchain/ethereumService';

interface NavbarProps {
  activeTab: 'campaigns' | 'dashboard' | 'verifier' | 'explorer' | 'contract';
  setActiveTab: (tab: 'campaigns' | 'dashboard' | 'verifier' | 'explorer' | 'contract') => void;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  accounts: Record<UserRole, AccountProfile>;
  blockchainStats: BlockchainStats | null;
  onResetData: () => void;
  onCreateCampaignClick: () => void;
  pendingVerificationsCount: number;
}

const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  donatur: 'Donatur',
  pengelola: 'Pengelola Program',
  verifier: 'Verifier',
  admin: 'Administrator'
};

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentRole,
  setCurrentRole,
  accounts,
  blockchainStats,
  onResetData,
  onCreateCampaignClick,
  pendingVerificationsCount
}) => {
  const [roleDropdownOpen, setRoleDropdownOpen] = React.useState(false);
  const activeAccount = accounts[currentRole] || accounts.donatur;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-[#0b0f17]/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo and Brand */}
        <div className="flex items-center gap-7">
          <div 
            onClick={() => setActiveTab('campaigns')}
            className="flex cursor-pointer items-center gap-2.5 transition-transform hover:opacity-90"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 shadow-lg shadow-emerald-500/20">
              <ShieldCheck className="h-6 w-6 text-white stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-extrabold tracking-tight text-white">SmartDonate</span>
                <span className="text-[10px] font-mono font-bold tracking-wider text-emerald-400 uppercase bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800/60">
                  Escrow Audit v2.4
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Crowdfunding & Monitoring Donasi Berbasis Blockchain
              </p>
            </div>
          </div>

          {/* Navigation Links in Bahasa Indonesia */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setActiveTab('campaigns')}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'campaigns'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              Jelajahi Program
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              Dashboard Saya
            </button>

            <button
              onClick={() => setActiveTab('verifier')}
              className={`relative px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'verifier'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <span>Verifikasi & Audit</span>
              {pendingVerificationsCount > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full">
                  {pendingVerificationsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('explorer')}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'explorer'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Layers className="h-4 w-4 text-cyan-400" />
              <span>Eksplorasi Blockchain</span>
            </button>

            <button
              onClick={() => setActiveTab('contract')}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'contract'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <FileCode2 className="h-4 w-4 text-emerald-400" />
              <span>Smart Contract</span>
            </button>
          </nav>
        </div>

        {/* Right Section: Role Switcher & Action */}
        <div className="flex items-center gap-3">
          
          {/* Buat Program Button */}
          <button
            onClick={onCreateCampaignClick}
            className="hidden sm:inline-flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs px-3.5 py-2 rounded-lg shadow-sm transition-all active:scale-[0.98]"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Buat Program</span>
          </button>

          {/* Active Network / Block height indicator */}
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400">Blockchain IDR</span>
            <span className="text-slate-600">·</span>
            <span className="font-mono text-emerald-300 font-medium">
              Blok #{blockchainStats?.blockHeight || 1045}
            </span>
          </div>

          {/* Role Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 hover:border-slate-600 text-xs transition-colors"
            >
              <img 
                src={activeAccount?.avatar} 
                alt={activeAccount?.name}
                className="h-6 w-6 rounded-full object-cover ring-1 ring-emerald-500/50" 
              />
              <div className="text-left hidden sm:block">
                <div className="font-semibold text-white flex items-center gap-1">
                  <span>{activeAccount?.name.split(' ')[0]}</span>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    ({ROLE_DISPLAY_NAMES[currentRole]})
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  {formatIDR(activeAccount?.balanceIDR || 0)}
                </div>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {roleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-2 z-50">
                <div className="px-3 py-2 border-b border-slate-800 text-xs text-slate-400 font-medium">
                  Pilih Peran Pengguna (Simulasi Role):
                </div>
                
                {(['donatur', 'pengelola', 'verifier', 'admin'] as UserRole[]).map((role) => {
                  const acc = accounts[role];
                  if (!acc) return null;
                  const isSelected = currentRole === role;
                  return (
                    <button
                      key={role}
                      onClick={() => {
                        setCurrentRole(role);
                        setRoleDropdownOpen(false);
                      }}
                      className={`w-full flex items-start gap-3 p-2.5 rounded-lg text-left transition-colors my-1 ${
                        isSelected 
                          ? 'bg-emerald-950/60 border border-emerald-800/80 text-white' 
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <img 
                        src={acc?.avatar} 
                        alt={acc?.name}
                        className="h-9 w-9 rounded-full object-cover mt-0.5 ring-1 ring-slate-700" 
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-white truncate">{acc?.name}</span>
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400">
                            {ROLE_DISPLAY_NAMES[role]}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">{acc?.badge}</div>
                        <div className="text-[11px] font-mono text-slate-300 mt-1 flex items-center justify-between">
                          <span>{formatAddress(acc?.address || '', 4)}</span>
                          <span className="font-semibold text-emerald-400">{formatIDR(acc?.balanceIDR || 0)}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}

                <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between px-2">
                  <button
                    onClick={() => {
                      onResetData();
                      setRoleDropdownOpen(false);
                    }}
                    className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1.5 py-1 px-2 rounded hover:bg-slate-800 transition-colors"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>Reset Data Demo</span>
                  </button>
                  <span className="text-[10px] text-slate-500 font-mono">Ledger IDR</span>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};
