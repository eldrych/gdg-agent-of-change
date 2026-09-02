import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  User, 
  Loader2, 
  AlertTriangle, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Globe, 
  Facebook, 
  Trophy,
  ArrowRight
} from 'lucide-react';
import { useBooths, seedBooths } from '../hooks/useFirestore';
import { getBoothById } from '../utils/storage';
import { verifyBoothCredentials, saveBoothSession } from '../utils/boothAuth';

interface LoginScreenProps {
  onLogin: (boothId: string) => void;
  onNavigateToLeaderboard?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onNavigateToLeaderboard }) => {
  const { booths, loading } = useBooths();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    seedBooths().catch(console.error);
  }, []);

  const handleBoothAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsVerifying(true);

    const verification = verifyBoothCredentials(username, password);

    if (!verification.success || !verification.boothId) {
      setIsVerifying(false);
      setError(verification.error || 'Invalid credentials. Please check your username and password.');
      return;
    }

    const matchedBoothId = verification.boothId;
    const boothObj = booths.find((b) => b.id.toLowerCase() === matchedBoothId.toLowerCase()) || getBoothById(matchedBoothId);

    saveBoothSession({
      boothId: matchedBoothId,
      name: boothObj?.name || `Booth ${matchedBoothId}`,
      category: boothObj?.category || 'General',
      location: boothObj?.location || 'Exhibition Hall',
      authenticatedAt: new Date().toISOString(),
    });

    setIsVerifying(false);
    onLogin(matchedBoothId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#4285F4] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div id="booth-login-terminal" className="flex min-h-screen bg-[#050508] relative overflow-hidden font-sans text-slate-800">
      {/* Space Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Animated glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#4285F4]/10 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-[#EA4335]/10 blur-[100px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        {/* Twinkling Stars Canvas */}
        <div className="stars-container absolute inset-0 opacity-40">
          {[...Array(80)].map((_, i) => (
            <div 
              key={i} 
              className="absolute bg-white rounded-full"
              style={{
                width: Math.random() * 2 + 1 + 'px',
                height: Math.random() * 2 + 1 + 'px',
                top: Math.random() * 100 + '%',
                left: Math.random() * 100 + '%',
                opacity: Math.random() * 0.7 + 0.3,
                boxShadow: Math.random() > 0.8 ? '0 0 4px 1px rgba(255,255,255,0.8)' : 'none',
                // @ts-ignore
                '--duration': (Math.random() * 4 + 2) + 's',
                // @ts-ignore
                '--delay': (Math.random() * 5) + 's'
              } as React.CSSProperties}
            />
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative z-10">
        {/* Branding Logo - Top Center */}
        <div className="flex flex-col items-center justify-center pt-8 sm:pt-12 pb-3 px-6">
          <img 
            src="/gdgbcd_logo.svg" 
            onError={(e) => {
              const target = e.currentTarget;
              target.onerror = null;
              target.src = "/gdgbcd_logo.png";
            }}
            alt="GDG Bacolod Logo" 
            className="h-14 sm:h-18 md:h-22 w-auto max-w-[280px] sm:max-w-xs object-contain drop-shadow-[0_0_25px_rgba(66,133,244,0.35)] transition-transform hover:scale-105 duration-500" 
          />
        </div>

        {/* Content Box */}
        <div className="flex-1 p-4 sm:p-6 md:p-10 flex items-center justify-center">
          <div className="max-w-xl w-full space-y-6">
            
            {/* Glassmorphic Login Card */}
            <div className="overflow-hidden flex flex-col transition-all duration-700 bg-white/5 backdrop-blur-[32px] border border-white/10 rounded-[2.5rem] sm:rounded-[3rem] shadow-[0_0_100px_-20px_rgba(66,133,244,0.15)] ring-1 ring-white/10">
              
              {/* Card Header */}
              <div className="p-8 sm:p-12 border-b text-center bg-white/5 border-white/5">
                <h4 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  Booth Portal Terminal
                </h4>
                <p className="text-xs sm:text-sm mt-3 font-black tracking-[0.2em] text-blue-200/70 uppercase">
                  DEVFEST BACOLOD 2026
                </p>
              </div>

              {/* Card Form Body */}
              <div className="p-8 sm:p-12 space-y-8">
                {/* Error Notice */}
                {error && (
                  <div className="bg-rose-500/10 border border-rose-500/30 text-rose-200 p-4 rounded-2xl text-xs sm:text-sm font-medium animate-in fade-in space-y-1">
                    <div className="flex items-center gap-2 font-bold text-rose-300">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>Access Denied</span>
                    </div>
                    <p className="text-rose-200/90 pl-6 leading-relaxed">{error}</p>
                  </div>
                )}

                <form onSubmit={handleBoothAuth} className="space-y-6 sm:space-y-8">
                  {/* Field: Username */}
                  <div className="space-y-3">
                    <label className="text-[11px] font-bold uppercase tracking-[0.4em] ml-1 text-white/40 block">
                      Booth Username
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white/30 group-focus-within:text-[#4285F4] group-focus-within:bg-white/5 transition-all">
                          <User size={22} />
                        </div>
                      </div>
                      <input
                        id="booth-username-input"
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="booths-with-a-fur"
                        autoComplete="username"
                        className="w-full pl-16 pr-6 py-5 sm:py-6 rounded-2xl text-base sm:text-lg font-mono transition-all focus:outline-none focus:ring-4 bg-white/5 border border-white/10 text-white focus:ring-[#4285F4]/20 focus:border-[#4285F4] placeholder:text-white/20"
                      />
                    </div>
                  </div>

                  {/* Field: Password */}
                  <div className="space-y-3">
                    <label className="text-[11px] font-bold uppercase tracking-[0.4em] ml-1 text-white/40 block">
                      Booth Password
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white/30 group-focus-within:text-[#4285F4] group-focus-within:bg-white/5 transition-all">
                          <Lock size={22} />
                        </div>
                      </div>
                      <input
                        id="booth-password-input"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="pass-tilyas"
                        autoComplete="current-password"
                        className="w-full pl-16 pr-14 py-5 sm:py-6 rounded-2xl text-base sm:text-lg font-mono transition-all focus:outline-none focus:ring-4 bg-white/5 border border-white/10 text-white focus:ring-[#4285F4]/20 focus:border-[#4285F4] placeholder:text-white/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/30 hover:text-white/80 transition-colors cursor-pointer"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    id="booth-login-submit-btn"
                    type="submit"
                    disabled={isVerifying}
                    className="w-full py-5 sm:py-6 font-bold rounded-2xl shadow-2xl transition-all active:scale-[0.98] disabled:bg-slate-800 disabled:text-white/20 disabled:shadow-none flex items-center justify-center gap-3 text-base sm:text-lg bg-gradient-to-r from-slate-200 via-white to-slate-200 text-slate-900 border border-white/50 hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] hover:brightness-110 active:brightness-90 duration-500 shining-btn-effect cursor-pointer uppercase tracking-wider"
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 size={24} className="animate-spin" />
                        <span>AUTHENTICATING...</span>
                      </>
                    ) : (
                      <>
                        <span>LOGIN BOOTH</span>
                        <ArrowRight size={20} />
                      </>
                    )}
                  </button>

                  {/* Social & Community Links */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-6 border-t border-white/5">
                    {onNavigateToLeaderboard && (
                      <button
                        type="button"
                        onClick={onNavigateToLeaderboard}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900/80 text-white text-[11px] font-bold rounded-xl border border-slate-800 hover:bg-slate-800 transition-all shining-btn-effect w-full cursor-pointer hover:border-amber-500/40"
                      >
                        <Trophy size={14} className="text-amber-400" />
                        <span>View Leaderboards</span>
                      </button>
                    )}
                    
                    <a 
                      href="https://gdg.community.dev/gdg-bacolod" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900/80 text-white text-[11px] font-bold rounded-xl border border-slate-800 hover:bg-slate-800 transition-all shining-btn-effect w-full"
                    >
                      <Globe size={14} className="text-sky-400" />
                      <span>About GDG Bacolod</span>
                    </a>

                    <a 
                      href="https://www.facebook.com/gdgbacolod" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900/80 text-white text-[11px] font-bold rounded-xl border border-slate-800 hover:bg-slate-800 transition-all shining-btn-effect w-full"
                    >
                      <Facebook size={14} className="text-blue-400" />
                      <span>GDG Social</span>
                    </a>
                  </div>
                </form>
              </div>
            </div>

            {/* Footer Copyright */}
            <p className="text-center text-[10px] font-black uppercase tracking-normal pt-2 text-white/20">
              © 2026 GDG BACOLOD - AI Innovations Team . All Rights Reserved
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};
