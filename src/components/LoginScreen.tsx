import React, { useState, useEffect } from 'react';
import { Booth } from '../types';
import { 
  Building2, 
  KeyRound, 
  ArrowRight, 
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
  LogIn,
  Mail,
  AlertTriangle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { loginWithGoogle, loginWithEmail, auth } from '../firebase';
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
  const [isOAuthError, setIsOAuthError] = useState(false);
  
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Login form toggle
  const [authMode, setAuthMode] = useState<'google' | 'email'>('google');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [showOAuthGuide, setShowOAuthGuide] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (currentUser) {
        seedBooths().catch(console.error);
      }
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
      setIsOAuthError(false);
      await loginWithGoogle();
    } catch (err: any) {
      if (err.message?.includes('auth/popup-closed-by-user')) {
        return;
      }
      const errString = err?.message || String(err);
      if (
        errString.includes('restricted_client') || 
        errString.includes('403') || 
        errString.includes('OAuth') || 
        errString.includes('configuration-not-found') ||
        errString.includes('operation-not-allowed')
      ) {
        setIsOAuthError(true);
        setShowOAuthGuide(true);
        setError('Google OAuth Consent Screen is not yet configured for this Google Cloud Project. See setup steps below, or use Email/Password sign-in to continue immediately.');
      } else {
        setError(err.message || 'Failed to sign in');
      }
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !passwordInput) {
      setError('Please enter both email and password.');
      return;
    }
    setEmailLoading(true);
    setError(null);
    try {
      await loginWithEmail(emailInput.trim(), passwordInput);
    } catch (err: any) {
      setError(err?.message || 'Email authentication failed');
    } finally {
      setEmailLoading(false);
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
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-4 rounded-2xl text-sm font-medium animate-in fade-in slide-in-from-top-2 max-w-xl mx-auto space-y-2">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-red-200">Authentication Notice</p>
                <p className="text-xs text-red-300/90 mt-0.5">{error}</p>
              </div>
            </div>
          </div>
        )}

        {!user ? (
          <div className="w-full max-w-md mx-auto space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 bg-sky-500/10 blur-[60px] w-32 h-32 rounded-full pointer-events-none" />
              
              <div className="flex flex-col items-center justify-center space-y-6">
                <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center shadow-inner">
                  <KeyRound className="w-8 h-8 text-slate-400" />
                </div>
                
                <div className="text-center space-y-1">
                  <h2 className="text-xl font-bold text-white">Operator Access</h2>
                  <p className="text-slate-400 text-xs">Sign in to record badge scans and assign points.</p>
                </div>

                {/* Auth Mode Tabs */}
                <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl border border-slate-800 w-full text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setAuthMode('google')}
                    className={`py-2 px-3 rounded-lg transition-all ${authMode === 'google' ? 'bg-indigo-600 text-white font-semibold shadow' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Google Sign-In
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode('email')}
                    className={`py-2 px-3 rounded-lg transition-all ${authMode === 'email' ? 'bg-indigo-600 text-white font-semibold shadow' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Email / Password
                  </button>
                </div>

                {authMode === 'google' ? (
                  <div className="w-full space-y-3">
                    <button
                      onClick={handleGoogleLogin}
                      className="w-full flex items-center justify-center gap-2.5 bg-white hover:bg-gray-100 text-slate-900 font-semibold py-3 px-4 rounded-xl transition-all active:scale-95 shadow-md"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                        <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                        <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.97 0 12s.45 3.83 1.25 5.42l4.03-3.15z"/>
                        <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                      </svg>
                      Sign in with Google
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setShowOAuthGuide(!showOAuthGuide)}
                      className="w-full flex items-center justify-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 pt-2 transition-colors"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Google OAuth Consent Screen Setup Guide</span>
                      {showOAuthGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleEmailLogin} className="w-full space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Email</label>
                      <input
                        type="email"
                        required
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="operator@event.com"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Password</label>
                      <input
                        type="password"
                        required
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={emailLoading}
                      className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-4 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 mt-2"
                    >
                      <Mail className="w-4 h-4" />
                      {emailLoading ? 'Signing In...' : 'Sign In / Register Operator'}
                    </button>
                    <p className="text-[11px] text-slate-500 text-center">New operator credentials are auto-registered instantly.</p>
                  </form>
                )}
              </div>
            </div>

            {/* Collapsible / Floating Setup Guide Box */}
            {showOAuthGuide && (
              <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-5 shadow-xl space-y-3 text-xs text-slate-300 animate-in fade-in slide-in-from-top-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2 font-bold text-sm text-indigo-300">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    How to Fix Error 403: restricted_client
                  </div>
                  <a
                    href="https://console.developers.google.com/apis/credentials/consent?project=348994898123"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-sky-400 hover:underline font-semibold"
                  >
                    Open Console <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                
                <ol className="list-decimal list-inside space-y-2 text-slate-300 leading-relaxed">
                  <li>
                    Go to <a href="https://console.developers.google.com/apis/credentials/consent?project=348994898123" target="_blank" rel="noreferrer" className="text-sky-400 underline font-mono">Google Cloud OAuth Consent Screen</a> (Project: <code className="bg-slate-950 px-1 py-0.5 rounded text-indigo-300 font-mono">348994898123</code>).
                  </li>
                  <li>
                    Select <strong>External</strong> User Type and click <strong>Create</strong>.
                  </li>
                  <li>
                    Fill in the required 3 fields:
                    <ul className="list-disc list-inside pl-4 text-slate-400 mt-1 space-y-0.5">
                      <li><strong>App name:</strong> Event Booth Scanner</li>
                      <li><strong>User support email:</strong> Select your email</li>
                      <li><strong>Developer contact email:</strong> Enter your email</li>
                    </ul>
                  </li>
                  <li>
                    Click <strong>Save and Continue</strong> through Scopes.
                  </li>
                  <li>
                    Under <strong>Test users</strong>, click <strong>+ Add Users</strong> and enter your Google email (or click <em>Publish App</em>).
                  </li>
                </ol>
              </div>
            )}
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
                  Choose the booth you are operating for this session. Signed in as {user.email || user.uid}.
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

