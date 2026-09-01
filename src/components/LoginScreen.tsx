import React, { useState, useEffect } from 'react';
import { Booth } from '../types';
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
  Trophy,
  LogIn
} from 'lucide-react';
import { loginWithGoogle, auth } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useBooths, useScansForBooth, seedBooths } from '../hooks/useFirestore';

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

const BoothCard: React.FC<{ b: Booth, selectedBoothId: string, onSelect: (id: string) => void }> = ({ b, selectedBoothId, onSelect }) => {
  const scans = useScansForBooth(b.id);
  const uniqueVisitorCount = new Set(scans.map(s => s.attendee_id)).size;

  return (
    <div
      key={b.id}
      onClick={() => onSelect(b.id)}
      className={`group relative overflow-hidden flex flex-col p-4 rounded-2xl border transition-all duration-300 cursor-pointer ${
        selectedBoothId === b.id 
          ? 'bg-slate-800 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.2)]' 
          : 'bg-slate-900/50 border-slate-800 hover:border-slate-600 hover:bg-slate-800/80'
      }`}
    >
      <div className="flex justify-between items-start mb-3 relative z-10">
        <div className={`p-2.5 rounded-xl ${selectedBoothId === b.id ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-400 group-hover:text-slate-300 group-hover:bg-slate-700'}`}>
          {getBoothIcon(b.id)}
        </div>
        {selectedBoothId === b.id && (
          <div className="bg-indigo-500 text-white p-1 rounded-full animate-in zoom-in">
            <CheckCircle className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="space-y-1 relative z-10 flex-grow">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">{b.category || b.id}</div>
        <h3 className="font-bold text-sm text-slate-200 group-hover:text-white transition-colors line-clamp-2 leading-tight">
          {b.name}
        </h3>
        <p className="text-xs text-slate-500 line-clamp-2 pt-1">{b.description}</p>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/50 flex items-center justify-between relative z-10">
        <div className="text-xs text-slate-400 font-mono bg-slate-950 px-2 py-1 rounded border border-slate-800">{b.id}</div>
        <div className="text-xs text-sky-400 font-semibold bg-sky-900/20 px-2 py-1 rounded-full border border-sky-800/30">
          {uniqueVisitorCount} Visitors
        </div>
      </div>
    </div>
  );
};

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onNavigateToLeaderboard }) => {
  const { booths, loading } = useBooths();
  const [customBoothInput, setCustomBoothInput] = useState('');
  const [selectedBoothId, setSelectedBoothId] = useState<string>('Booth1');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    seedBooths();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

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
      setError(`Invalid Booth ID "${targetId}".`);
    }
  };

  const handleCardSelect = (boothId: string) => {
    setSelectedBoothId(boothId);
    setCustomBoothInput(boothId);
    setError(null);
    onLogin(boothId);
  };

  const handleGoogleLogin = async () => {
    try {
      setError(null);
      await loginWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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
            Booth Scanner Login
          </h1>
          <p className="text-slate-400 text-sm max-w-lg mx-auto">
            {user ? 'Select a booth to start scanning guest badges and awarding tier-based points.' : 'Sign in as a booth operator to start scanning.'}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-center animate-in fade-in slide-in-from-top-2">
            {error}
          </div>
        )}

        {!user ? (
          <div className="w-full max-w-sm mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 bg-sky-500/10 blur-[60px] w-32 h-32 rounded-full pointer-events-none" />
            
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center shadow-inner">
                <KeyRound className="w-8 h-8 text-slate-400" />
              </div>
              
              <div className="text-center space-y-2">
                <h2 className="text-xl font-bold text-white">Operator Access</h2>
                <p className="text-slate-400 text-sm">Please sign in with your authorized event account to continue.</p>
              </div>

              <button
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-100 text-slate-900 font-semibold py-3 px-4 rounded-xl transition-all active:scale-95 shadow-sm"
              >
                <LogIn className="w-4 h-4" />
                Sign in with Google
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            
            <div className="absolute top-0 right-0 p-8 bg-indigo-500/10 blur-[80px] w-64 h-64 rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 p-8 bg-emerald-500/10 blur-[80px] w-64 h-64 rounded-full pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-slate-800 pb-6">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-400" />
                  Select Your Assigned Booth
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                  Choose the booth you are operating for this session. Signed in as {user.email}.
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative max-w-xs w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search booths..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-slate-600 transition-all shadow-inner"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
              {filteredBooths.map((b) => (
                <BoothCard 
                  key={b.id} 
                  b={b} 
                  selectedBoothId={selectedBoothId} 
                  onSelect={handleCardSelect} 
                />
              ))}
              
              {filteredBooths.length === 0 && (
                <div className="col-span-full py-12 text-center flex flex-col items-center justify-center bg-slate-950/50 rounded-2xl border border-slate-800 border-dashed">
                  <Search className="w-8 h-8 text-slate-600 mb-3" />
                  <p className="text-slate-400 font-medium">No booths found matching "{searchQuery}"</p>
                  <p className="text-slate-500 text-sm mt-1">Try a different search term or category.</p>
                </div>
              )}
            </div>

            {/* Manual Form (Optional Override) */}
            <div className="pt-6 border-t border-slate-800 relative z-10">
              <form onSubmit={handleManualLogin} className="flex flex-col sm:flex-row items-end sm:items-center gap-4 bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
                <div className="flex-1 w-full relative">
                  <label htmlFor="boothId" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                    Manual Booth ID Override
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <KeyRound className="h-4 w-4 text-slate-600" />
                    </div>
                    <input
                      id="boothId"
                      type="text"
                      value={customBoothInput}
                      onChange={(e) => {
                        setCustomBoothInput(e.target.value);
                        setSelectedBoothId(e.target.value);
                      }}
                      className="block w-full pl-10 pr-3 py-3 border border-slate-700 rounded-xl bg-slate-900 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-mono text-sm shadow-inner"
                      placeholder="e.g. Booth1"
                    />
                  </div>
                </div>
                
                <button
                  type="submit"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-6 rounded-xl transition-all active:scale-95 shadow-md shadow-indigo-900/20"
                >
                  <span>Connect Scanner</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
};
