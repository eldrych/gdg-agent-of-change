import React from 'react';
import { 
  ScanLine, 
  Trophy, 
  ShieldCheck, 
  Database, 
  Globe, 
  Calendar,
  Radio,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { getActiveEventId } from '../utils/events';

export type AppRoute = 'booth-portal' | 'leaderboards' | 'main-admin-access' | 'admin-database';

interface GlobalNavigationHeaderProps {
  currentRoute: AppRoute;
  subtitle?: string;
  badgeContent?: React.ReactNode;
  rightActions?: React.ReactNode;
}

export const GlobalNavigationHeader: React.FC<GlobalNavigationHeaderProps> = ({
  currentRoute,
  subtitle,
  badgeContent,
  rightActions,
}) => {
  const currentEvent = getActiveEventId();

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const routes = [
    {
      id: 'booth-portal' as AppRoute,
      label: 'Booth Scanner',
      path: '/booth-portal',
      icon: ScanLine,
      color: 'sky',
      activeClasses: 'bg-sky-500/15 text-sky-400 border-sky-500/40 shadow-[0_0_15px_rgba(56,189,248,0.2)]',
      hoverClasses: 'hover:bg-sky-500/10 hover:text-sky-300 hover:border-sky-500/20',
    },
    {
      id: 'leaderboards' as AppRoute,
      label: 'Leaderboards',
      path: '/leaderboards',
      icon: Trophy,
      color: 'amber',
      activeClasses: 'bg-amber-500/15 text-amber-400 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]',
      hoverClasses: 'hover:bg-amber-500/10 hover:text-amber-300 hover:border-amber-500/20',
    },
    {
      id: 'main-admin-access' as AppRoute,
      label: 'Super Admin',
      path: '/main-admin-access',
      icon: ShieldCheck,
      color: 'rose',
      activeClasses: 'bg-rose-500/15 text-rose-400 border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.2)]',
      hoverClasses: 'hover:bg-rose-500/10 hover:text-rose-300 hover:border-rose-500/20',
    },
    {
      id: 'admin-database' as AppRoute,
      label: 'Database Mgr',
      path: '/admin-database',
      icon: Database,
      color: 'emerald',
      activeClasses: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]',
      hoverClasses: 'hover:bg-emerald-500/10 hover:text-emerald-300 hover:border-emerald-500/20',
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#050508]/85 backdrop-blur-xl border-b border-white/10 px-4 py-3 sm:px-6 shadow-2xl">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
        
        {/* Left: Branding & Subtitle */}
        <div className="flex items-center justify-between w-full md:w-auto gap-3">
          <div 
            onClick={() => navigateTo('/booth-portal')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <img 
              src="/gdgbcd_logo.svg" 
              onError={(e) => {
                const target = e.currentTarget;
                target.onerror = null;
                target.src = "/gdgbcd_logo.png";
              }}
              alt="GDG Bacolod" 
              className="h-7 sm:h-8 w-auto object-contain transition-transform group-hover:scale-105 duration-300 drop-shadow-[0_0_15px_rgba(66,133,244,0.3)]" 
            />
            
            <div className="hidden sm:flex flex-col border-l border-white/10 pl-3">
              <span className="text-[10px] font-black tracking-[0.2em] text-sky-400 uppercase">
                DEVFEST 2026
              </span>
              <span className="text-xs font-semibold text-slate-300 truncate max-w-[160px]">
                {subtitle || 'Event QR Engine'}
              </span>
            </div>
          </div>

          {/* Optional Mobile Right Actions */}
          <div className="flex items-center gap-2 md:hidden">
            {badgeContent}
            {rightActions}
          </div>
        </div>

        {/* Center: Universal Route Switcher */}
        <nav className="flex items-center gap-1.5 p-1 bg-white/5 border border-white/10 rounded-2xl overflow-x-auto max-w-full no-scrollbar shadow-inner">
          {routes.map((route) => {
            const Icon = route.icon;
            const isActive = currentRoute === route.id;
            return (
              <button
                key={route.id}
                type="button"
                onClick={() => navigateTo(route.path)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap border ${
                  isActive
                    ? route.activeClasses
                    : `text-slate-400 border-transparent ${route.hoverClasses}`
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? '' : 'opacity-70'}`} />
                <span>{route.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Desktop Actions & Event Status */}
        <div className="hidden md:flex items-center gap-3">
          {badgeContent ? (
            badgeContent
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-medium shadow-sm">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span className="font-mono text-[11px] text-slate-400 uppercase tracking-wider">{currentEvent}</span>
            </div>
          )}
          {rightActions}
        </div>

      </div>
    </header>
  );
};
