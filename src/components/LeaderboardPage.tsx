import React, { useState, useEffect, useMemo } from 'react';
import {
  Trophy,
  Medal,
  Crown,
  Maximize2,
  Minimize2,
  Sparkles,
  RefreshCw,
  Radio,
  Search,
  Users,
  Clock,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { Attendee } from '../types';
import { useAttendees } from '../hooks/useFirestore';
import { getActiveEventId } from '../utils/events';
import { GlobalNavigationHeader } from './GlobalNavigationHeader';

interface LeaderboardPageProps {
  onNavigateToBooth?: () => void;
}

export function LeaderboardPage({ onNavigateToBooth }: LeaderboardPageProps) {
  const allAttendees = useAttendees();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'top10' | 'all'>('top10');
  const currentEvent = getActiveEventId();

  const sortedAttendees = useMemo(() => {
    return [...allAttendees].sort((a, b) => {
      // 1. Order by total_points (Descending)
      if (b.total_points !== a.total_points) {
        return b.total_points - a.total_points;
      }

      // 2. Tie-Breaking Logic: Order by last_updated_timestamp (Ascending)
      const timeA = a.last_updated_timestamp
        ? new Date(a.last_updated_timestamp).getTime()
        : new Date(a.created_at).getTime();
      const timeB = b.last_updated_timestamp
        ? new Date(b.last_updated_timestamp).getTime()
        : new Date(b.created_at).getTime();

      if (timeA !== timeB) {
        return timeA - timeB;
      }
      return a.name.localeCompare(b.name);
    });
  }, [allAttendees]);

  const displayedAttendees = useMemo(() => {
    let list = sortedAttendees;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.id.toLowerCase().includes(q) ||
          (a.qr_code_id && a.qr_code_id.toLowerCase().includes(q)) ||
          (a.company && a.company.toLowerCase().includes(q))
      );
    }
    if (viewMode === 'top10' && !searchQuery.trim()) {
      return list.slice(0, 10);
    }
    return list;
  }, [sortedAttendees, searchQuery, viewMode]);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setLastUpdated(new Date());
  }, [allAttendees]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950 font-black flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.5)] border border-amber-300 shrink-0">
            <Crown className="w-5 h-5 fill-slate-950 text-slate-950" />
          </div>
        );
      case 2:
        return (
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-400 text-slate-950 font-black flex items-center justify-center shadow-[0_0_15px_rgba(203,213,225,0.35)] border border-slate-100 shrink-0">
            <Medal className="w-5 h-5 fill-slate-950 text-slate-950" />
          </div>
        );
      case 3:
        return (
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-700 to-amber-900 text-amber-100 font-black flex items-center justify-center shadow-[0_0_15px_rgba(180,83,9,0.35)] border border-amber-600 shrink-0">
            <Medal className="w-5 h-5 text-amber-200" />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-2xl bg-white/5 text-slate-400 font-mono font-bold flex items-center justify-center border border-white/10 text-xs shrink-0">
            #{rank}
          </div>
        );
    }
  };

  const getRowHighlight = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-amber-500/10 border-amber-400/40 shadow-lg shadow-amber-950/20';
      case 2:
        return 'bg-slate-400/10 border-slate-300/30 shadow-md';
      case 3:
        return 'bg-amber-900/15 border-amber-600/30 shadow-md';
      default:
        return 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20';
    }
  };

  const top3 = sortedAttendees.slice(0, 3);

  return (
    <div
      id="leaderboard-page"
      className="min-h-screen bg-[#050508] text-slate-100 flex flex-col relative overflow-hidden font-sans selection:bg-amber-500 selection:text-slate-950"
    >
      {/* Background Ambient Glows & Stars Canvas */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-[#FBBC04]/10 blur-[130px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[35%] h-[35%] bg-[#4285F4]/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
        
        <div className="stars-container absolute inset-0 opacity-30">
          {[...Array(60)].map((_, i) => (
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

      {/* Unified Global Header */}
      <GlobalNavigationHeader
        currentRoute="leaderboards"
        subtitle="Live Score Standings"
        badgeContent={
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold shadow-sm">
            <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>{allAttendees.length} Attendees</span>
          </div>
        }
        rightActions={
          <div className="flex items-center gap-2">
            <button
              id="refresh-leaderboard-btn"
              type="button"
              onClick={handleManualRefresh}
              title="Refresh Leaderboard"
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">Sync</span>
            </button>

            <button
              id="toggle-fullscreen-btn"
              type="button"
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen' : 'View in Fullscreen'}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              <span className="hidden sm:inline">{isFullscreen ? 'Exit' : 'Stage Mode'}</span>
            </button>
          </div>
        }
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 md:p-8 space-y-6 relative z-10">
        
        {/* Title Banner */}
        <div className="text-center space-y-2 pt-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold tracking-wide shadow-sm">
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span>Official Event Leaderboard Standings</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight">
            DEVFEST Standings & Scores
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto flex items-center justify-center gap-1.5 leading-relaxed">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Real-time Firestore scores ranked by Total Points (Earliest timestamp wins ties).
            </span>
          </p>
        </div>

        {/* Top 3 Podium (Shown when not searching and at least 3 participants exist) */}
        {!searchQuery.trim() && top3.length >= 3 && (
          <div className="grid grid-cols-3 gap-2.5 sm:gap-4 pt-3 pb-3 items-end">
            {/* Rank 2 (Silver) */}
            <div
              id="podium-rank-2"
              className="bg-white/5 backdrop-blur-[24px] border border-slate-300/30 rounded-3xl p-4 sm:p-5 flex flex-col items-center text-center relative overflow-hidden shadow-xl ring-1 ring-white/10"
            >
              <div className="w-9 h-9 rounded-2xl bg-slate-200 text-slate-950 font-black text-xs flex items-center justify-center mb-2 shadow">
                #2
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-white truncate w-full">{top3[1].name}</h4>
              <div className="text-[10px] text-slate-400 truncate w-full mb-2">
                {top3[1].company || top3[1].qr_code_id || top3[1].id}
              </div>
              <div className="font-mono text-sm sm:text-lg font-black text-slate-200">
                {top3[1].total_points.toLocaleString()}{' '}
                <span className="text-[10px] font-bold text-slate-400">PTS</span>
              </div>
            </div>

            {/* Rank 1 (Gold) */}
            <div
              id="podium-rank-1"
              className="bg-gradient-to-b from-amber-500/20 via-white/5 to-white/5 backdrop-blur-[32px] border-2 border-amber-400/60 rounded-3xl p-5 sm:p-6 flex flex-col items-center text-center relative overflow-hidden shadow-2xl shadow-amber-950/40 -translate-y-2 sm:-translate-y-4 ring-1 ring-amber-400/30"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 font-black text-sm flex items-center justify-center mb-2 shadow-[0_0_20px_rgba(245,158,11,0.6)]">
                <Crown className="w-6 h-6 fill-slate-950" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-0.5">
                Current Champion
              </span>
              <h3 className="text-sm sm:text-base md:text-lg font-extrabold text-white truncate w-full">{top3[0].name}</h3>
              <div className="text-[10px] text-slate-300 truncate w-full mb-2 font-medium">
                {top3[0].company || top3[0].qr_code_id || top3[0].id}
              </div>
              <div className="font-mono text-lg sm:text-2xl font-black text-amber-300">
                {top3[0].total_points.toLocaleString()}{' '}
                <span className="text-xs font-bold text-amber-400/90">PTS</span>
              </div>
            </div>

            {/* Rank 3 (Bronze) */}
            <div
              id="podium-rank-3"
              className="bg-white/5 backdrop-blur-[24px] border border-amber-700/40 rounded-3xl p-4 sm:p-5 flex flex-col items-center text-center relative overflow-hidden shadow-xl ring-1 ring-white/10"
            >
              <div className="w-9 h-9 rounded-2xl bg-amber-700 text-amber-100 font-black text-xs flex items-center justify-center mb-2 shadow">
                #3
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-white truncate w-full">{top3[2].name}</h4>
              <div className="text-[10px] text-slate-400 truncate w-full mb-2">
                {top3[2].company || top3[2].qr_code_id || top3[2].id}
              </div>
              <div className="font-mono text-sm sm:text-lg font-black text-amber-200">
                {top3[2].total_points.toLocaleString()}{' '}
                <span className="text-[10px] font-bold text-amber-400/80">PTS</span>
              </div>
            </div>
          </div>
        )}

        {/* Toolbar: Mode switcher & search box */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white/5 backdrop-blur-[24px] p-3 rounded-2xl border border-white/10 ring-1 ring-white/10">
          <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('top10')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                viewMode === 'top10' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Top 10 Ranks
            </button>
            <button
              type="button"
              onClick={() => setViewMode('all')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                viewMode === 'all' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Attendees ({allAttendees.length})
            </button>
          </div>

          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search participant or badge ID..."
              className="w-full bg-slate-950/80 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
            />
          </div>
        </div>

        {/* Ranked List Table */}
        <div className="bg-white/5 backdrop-blur-[32px] border border-white/10 rounded-3xl shadow-2xl overflow-hidden ring-1 ring-white/10">
          {/* Table Header */}
          <div className="px-5 py-3.5 bg-white/5 border-b border-white/10 flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-slate-400">
            <div className="flex items-center gap-4">
              <span className="w-10 text-center">Rank</span>
              <span>Attendee Details</span>
            </div>
            <span>Total Points</span>
          </div>

          {/* List Rows */}
          <div className="divide-y divide-white/5">
            {displayedAttendees.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <Trophy className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-sm font-semibold text-slate-300">No attendees found</p>
                <p className="text-xs text-slate-500">Scan participant badges at booth stations to begin scoring.</p>
              </div>
            ) : (
              displayedAttendees.map((attendee) => {
                const globalRank = sortedAttendees.findIndex((a) => a.id === attendee.id) + 1;
                const rowClasses = getRowHighlight(globalRank);

                return (
                  <div
                    key={attendee.id}
                    id={`leaderboard-row-${globalRank}`}
                    className={`px-5 py-3.5 flex items-center justify-between gap-3 border transition-colors ${rowClasses}`}
                  >
                    {/* Rank & Info */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      {getRankBadge(globalRank)}

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm sm:text-base font-bold truncate ${
                              globalRank === 1
                                ? 'text-amber-200'
                                : globalRank === 2
                                ? 'text-slate-100'
                                : globalRank === 3
                                ? 'text-amber-100'
                                : 'text-slate-200'
                            }`}
                          >
                            {attendee.name}
                          </span>
                          {globalRank === 1 && (
                            <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full">
                              LEADER
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 truncate mt-0.5">
                          {attendee.company && <span className="truncate">{attendee.company}</span>}
                          {attendee.company && <span>•</span>}
                          <span className="font-mono text-[11px] text-slate-500">
                            {attendee.qr_code_id || attendee.id}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Total Points */}
                    <div className="text-right shrink-0">
                      <div
                        className={`font-mono text-base sm:text-xl font-black ${
                          globalRank === 1
                            ? 'text-amber-300'
                            : globalRank === 2
                            ? 'text-slate-200'
                            : globalRank === 3
                            ? 'text-amber-200'
                            : 'text-sky-400'
                        }`}
                      >
                        {attendee.total_points.toLocaleString()}
                        <span className="text-xs font-bold text-slate-400 ml-1">PTS</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {attendee.last_updated_timestamp
                          ? new Date(attendee.last_updated_timestamp).toLocaleTimeString()
                          : 'Recorded'}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 px-2 gap-2 pt-2">
          <span>Displaying verified DevFest 2026 score standing records</span>
          <span className="font-mono">Last live sync: {lastUpdated.toLocaleTimeString()}</span>
        </div>

      </main>
    </div>
  );
}
