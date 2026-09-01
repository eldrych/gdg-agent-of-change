import React, { useState } from 'react';
import { Booth } from '../types';
import { getBooths, getUniqueVisitorCountForBooth } from '../utils/storage';
import { 
  Building2, 
  KeyRound, 
  ArrowRight, 
  Sparkles, 
  CheckCircle, 
  Cpu, 
  Cloud, 
  ShieldCheck, 
  Atom, 
  Smartphone, 
  Dna, 
  Gamepad2, 
  Leaf, 
  Database, 
  Coins,
  Search,
  ScanLine,
  Trophy
} from 'lucide-react';

interface LoginScreenProps {
  onLogin: (boothId: string) => void;
  onNavigateToLeaderboard?: () => void;
}

const getBoothIcon = (id: string) => {
  switch (id.toLowerCase()) {
    case 'booth1': return <Cpu className="w-5 h-5 text-indigo-400" />;
    case 'booth2': return <Cloud className="w-5 h-5 text-sky-400" />;
    case 'booth3': return <ShieldCheck className="w-5 h-5 text-emerald-400" />;
    case 'booth4': return <Atom className="w-5 h-5 text-purple-400" />;
    case 'booth5': return <Smartphone className="w-5 h-5 text-pink-400" />;
    case 'booth6': return <Dna className="w-5 h-5 text-rose-400" />;
    case 'booth7': return <Gamepad2 className="w-5 h-5 text-amber-400" />;
    case 'booth8': return <Leaf className="w-5 h-5 text-teal-400" />;
    case 'booth9': return <Database className="w-5 h-5 text-blue-400" />;
    case 'booth10': return <Coins className="w-5 h-5 text-yellow-400" />;
    default: return <Building2 className="w-5 h-5 text-indigo-400" />;
  }
};

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onNavigateToLeaderboard }) => {
  const [booths] = useState<Booth[]>(getBooths());
  const [customBoothInput, setCustomBoothInput] = useState('');
  const [selectedBoothId, setSelectedBoothId] = useState<string>('Booth1');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = (customBoothInput.trim() || selectedBoothId).trim();
    if (!targetId) {
      setError('Please enter or select a valid Booth ID (e.g. Booth1, Booth2, ... Booth10)');
      return;
    }

    const matched = booths.find(b => b.id.toLowerCase() === targetId.toLowerCase());
    if (matched) {
      setError(null);
      onLogin(matched.id);
    } else {
      // Validate against pre-seeded credentials or valid Booth IDs
      setError(`Invalid Booth ID "${targetId}". Valid Booth IDs are Booth1 through Booth10.`);
    }
  };

  const handleCardSelect = (boothId: string) => {
    setSelectedBoothId(boothId);
    setCustomBoothInput(boothId);
    setError(null);
    onLogin(boothId);
  };

  const filteredBooths = booths.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.category && b.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div id="login-screen" className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 bg-[#0B0F19] text-slate-100 selection:bg-sky-500 selection:text-white">
      <div className="w-full max-w-4xl mx-auto space-y-6">
        
        {/* Header Branding */}
        <div className="text-center space-y-3">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-semibold tracking-wide shadow-[0_0_15px_rgba(56,189,248,0.15)]">
              <ScanLine className="w-4 h-4 animate-pulse" />
              <span>Event Booth POC Portal</span>
            </div>

            {onNavigateToLeaderboard && (
              <button
                id="view-public-leaderboard-btn"
                type="button"
                onClick={onNavigateToLeaderboard}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-semibold tracking-wide transition-all cursor-pointer shadow-sm hover:border-amber-400/50"
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>View Top 10 Leaderboard (/leaderboards)</span>
              </button>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-100 tracking-tight">
            Booth Scanner & Tiered Point System
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Log in to your assigned event booth to scan attendee QR codes and award tiered visit points in real time.
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-[#0F172A]/90 border border-slate-800/80 rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            
            {/* Left: Input & Fast Login */}
            <div className="w-full md:w-5/12 space-y-4">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 tracking-tight">
                  <KeyRound className="w-5 h-5 text-sky-400" />
                  Booth POC Authentication
                </h2>
                <p className="text-xs text-slate-400">
                  Select your booth from the list or enter your assigned Booth ID.
                </p>
              </div>

              <form onSubmit={handleManualLogin} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Booth ID (Booth1 – Booth10)
                  </label>
                  <div className="relative">
                    <input
                      id="booth-id-input"
                      type="text"
                      placeholder="e.g. Booth1"
                      value={customBoothInput}
                      onChange={(e) => {
                        setCustomBoothInput(e.target.value);
                        setError(null);
                      }}
                      className="w-full pl-4 pr-10 py-3 rounded-xl bg-[#020617] border border-slate-700 text-slate-100 placeholder-slate-500 font-mono text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">
                      ID
                    </div>
                  </div>
                  {error && (
                    <p className="text-xs font-medium text-rose-400 mt-1.5 animate-fadeIn">
                      {error}
                    </p>
                  )}
                </div>

                <button
                  id="login-submit-btn"
                  type="submit"
                  className="w-full py-3.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-950/50 hover:shadow-sky-900/50 active:scale-[0.99] transition-all cursor-pointer"
                >
                  <span>Enter Booth Scanner</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Point Tier Quick Reference */}
              <div className="p-3.5 bg-[#020617]/70 border border-slate-800/90 rounded-2xl space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Live Scoring Tiers
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  <div className="p-1.5 rounded-lg bg-[#0F172A] border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400 text-[11px]">Visits 1–10:</span>
                    <strong className="text-emerald-400 font-bold">100 pts</strong>
                  </div>
                  <div className="p-1.5 rounded-lg bg-[#0F172A] border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400 text-[11px]">Visits 11–50:</span>
                    <strong className="text-sky-400 font-bold">85 pts</strong>
                  </div>
                  <div className="p-1.5 rounded-lg bg-[#0F172A] border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400 text-[11px]">Visits 51–90:</span>
                    <strong className="text-amber-400 font-bold">65 pts</strong>
                  </div>
                  <div className="p-1.5 rounded-lg bg-[#0F172A] border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400 text-[11px]">Visits 91+:</span>
                    <strong className="text-purple-400 font-bold">45 pts</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Quick Selection Grid for 10 Pre-populated Booths */}
            <div className="w-full md:w-7/12 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-300">
                  Pre-Seeded Booths (Click to Log In)
                </span>
                <span className="text-[11px] font-semibold text-sky-400">
                  {booths.length} Active Stations
                </span>
              </div>

              {/* Search filter for booths */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="booth-search-input"
                  type="text"
                  placeholder="Filter booths by name or topic..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#020617] border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              {/* Booth Cards Scroll Area */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
                {filteredBooths.map((booth) => {
                  const visitors = getUniqueVisitorCountForBooth(booth.id);
                  return (
                    <button
                      key={booth.id}
                      id={`booth-select-${booth.id}`}
                      type="button"
                      onClick={() => handleCardSelect(booth.id)}
                      className="text-left p-3 rounded-2xl bg-[#020617]/80 hover:bg-slate-800/90 border border-slate-800 hover:border-sky-500/60 transition-all duration-200 group flex flex-col justify-between relative cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-xl bg-[#0F172A] border border-slate-800 group-hover:border-sky-500/40">
                            {getBoothIcon(booth.id)}
                          </div>
                          <div>
                            <span className="font-mono text-[10px] font-bold text-sky-400 uppercase">
                              {booth.id}
                            </span>
                            <h3 className="text-xs font-bold text-slate-100 group-hover:text-sky-300 leading-tight">
                              {booth.name.replace(/^Booth \d+:\s*/, '')}
                            </h3>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-800/60">
                        <span className="truncate max-w-[120px]">{booth.location}</span>
                        <span className="font-mono font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-900/60">
                          {visitors} visits
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-slate-500 flex flex-wrap items-center justify-center gap-4">
          <span>Single-device local storage persistence enabled</span>
          <span>•</span>
          <span>Unique attendee per booth enforcement</span>
          <span>•</span>
          <span>Zero external backend required</span>
        </div>

      </div>
    </div>
  );
};
