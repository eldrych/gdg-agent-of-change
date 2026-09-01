import React, { useState, useEffect, useMemo } from 'react';
import { Trophy, Medal, Crown, ArrowLeft, Maximize2, Minimize2, Sparkles, RefreshCw, Radio } from 'lucide-react';
import { Attendee } from '../types';
import { useAttendees } from '../hooks/useFirestore';

interface LeaderboardPageProps {
  onNavigateToBooth?: () => void;
}

export function LeaderboardPage({ onNavigateToBooth }: LeaderboardPageProps) {
  const allAttendees = useAttendees();
  
  const topAttendees = useMemo(() => {
    const sorted = [...allAttendees].sort((a, b) => {
      if (b.total_points !== a.total_points) {
        return b.total_points - a.total_points;
      }
      return a.name.localeCompare(b.name);
    });
    return sorted.slice(0, 10);
  }, [allAttendees]);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setLastUpdated(new Date());
  }, [allAttendees]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 400);
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

  const handleBackToBooth = () => {
    if (onNavigateToBooth) {
      onNavigateToBooth();
    } else {
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 text-slate-950 font-black flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.4)] border border-amber-300">
            <Crown className="w-5 h-5 fill-slate-950 text-slate-950" />
          </div>
        );
      case 2:
        return (
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-200 to-slate-400 text-slate-950 font-black flex items-center justify-center shadow-[0_0_12px_rgba(203,213,225,0.3)] border border-slate-100">
            <Medal className="w-5 h-5 fill-slate-950 text-slate-950" />
          </div>
        );
      case 3:
        return (
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-700 to-amber-900 text-amber-100 font-black flex items-center justify-center shadow-[0_0_12px_rgba(180,83,9,0.3)] border border-amber-600">
            <Medal className="w-5 h-5 text-amber-200" />
          </div>
        );
      default:
        return (
          <div className="w-9 h-9 rounded-xl bg-[#0B0F19] text-slate-400 font-mono font-bold flex items-center justify-center border border-slate-800 text-sm">
            #{rank}
          </div>
        );
    }
  };

  const getRowHighlight = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-amber-950/30 via-[#0F172A] to-[#0F172A] border-amber-500/50 shadow-lg shadow-amber-950/20';
      case 2:
        return 'bg-gradient-to-r from-slate-800/40 via-[#0F172A] to-[#0F172A] border-slate-400/40 shadow-md';
      case 3:
        return 'bg-gradient-to-r from-amber-900/20 via-[#0F172A] to-[#0F172A] border-amber-700/40 shadow-md';
      default:
        return 'bg-[#0F172A]/70 border-slate-800/80 hover:bg-[#0F172A] hover:border-slate-700';
    }
  };

  return (
    <div
      id="leaderboard-page"
      className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col selection:bg-sky-500 selection:text-white"
    >
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-[#0F172A]/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 sm:px-6 shadow-xl">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          
          {/* Back button & Brand */}
          <div className="flex items-center gap-3">
            <button
              id="back-to-scanner-btn"
              onClick={handleBackToBooth}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="Return to Booth Scanner"
            >
              <ArrowLeft className="w-4 h-4 text-sky-400" />
              <span className="hidden sm:inline">Booth Portal</span>
            </button>

            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-slate-100 tracking-tight leading-none">
                  Top 10 Leaderboard
                </h1>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1 text-emerald-400 font-semibold uppercase tracking-wider text-[10px]">
                    <Radio className="w-3 h-3 animate-pulse" />
                    Live Standings
                  </span>
                  <span>•</span>
                  <span>Top 10 Ranks</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2">
            <button
              id="refresh-leaderboard-btn"
              onClick={handleManualRefresh}
              title="Refresh Leaderboard"
              className={`p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                isRefreshing ? 'opacity-70' : ''
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 text-sky-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">Refresh</span>
            </button>

            <button
              id="toggle-fullscreen-btn"
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen' : 'View in Fullscreen'}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              <span className="hidden sm:inline">{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Leaderboard Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 md:p-8 space-y-6">
        
        {/* Title Header Banner */}
        <div className="text-center space-y-2 pt-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Official Event Leaderboards</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
            Top 10 Attendees
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            Ranked by cumulative points earned across all event booths.
          </p>
        </div>

        {/* Top 3 Podium (Visual Showcase) */}
        {topAttendees.length >= 3 && (
          <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-2 pb-2 items-end">
            {/* Rank 2 (Silver) */}
            <div
              id="podium-rank-2"
              className="bg-[#0F172A]/90 border border-slate-400/30 rounded-2xl p-3 sm:p-4 flex flex-col items-center text-center relative overflow-hidden shadow-lg"
            >
              <div className="w-8 h-8 rounded-full bg-slate-300 text-slate-950 font-black text-xs flex items-center justify-center mb-2 shadow">
                2
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-100 truncate w-full">
                {topAttendees[1].name}
              </h4>
              <div className="text-[10px] text-slate-400 truncate w-full mb-1">
                {topAttendees[1].company || topAttendees[1].id}
              </div>
              <div className="font-mono text-sm sm:text-base font-black text-slate-200">
                {topAttendees[1].total_points.toLocaleString()}{' '}
                <span className="text-[10px] font-bold text-slate-400">PTS</span>
              </div>
            </div>

            {/* Rank 1 (Gold) */}
            <div
              id="podium-rank-1"
              className="bg-gradient-to-b from-amber-950/40 via-[#0F172A] to-[#0F172A] border-2 border-amber-400/60 rounded-2xl p-4 sm:p-5 flex flex-col items-center text-center relative overflow-hidden shadow-xl shadow-amber-950/30 -translate-y-2 sm:-translate-y-3"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 font-black text-sm flex items-center justify-center mb-2 shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                <Crown className="w-5 h-5 fill-slate-950" />
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 mb-0.5">
                Current Leader
              </span>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-100 truncate w-full">
                {topAttendees[0].name}
              </h3>
              <div className="text-[10px] text-slate-400 truncate w-full mb-1.5">
                {topAttendees[0].company || topAttendees[0].id}
              </div>
              <div className="font-mono text-base sm:text-xl font-black text-amber-300">
                {topAttendees[0].total_points.toLocaleString()}{' '}
                <span className="text-xs font-bold text-amber-400/80">PTS</span>
              </div>
            </div>

            {/* Rank 3 (Bronze) */}
            <div
              id="podium-rank-3"
              className="bg-[#0F172A]/90 border border-amber-700/40 rounded-2xl p-3 sm:p-4 flex flex-col items-center text-center relative overflow-hidden shadow-lg"
            >
              <div className="w-8 h-8 rounded-full bg-amber-700 text-amber-100 font-black text-xs flex items-center justify-center mb-2 shadow">
                3
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-100 truncate w-full">
                {topAttendees[2].name}
              </h4>
              <div className="text-[10px] text-slate-400 truncate w-full mb-1">
                {topAttendees[2].company || topAttendees[2].id}
              </div>
              <div className="font-mono text-sm sm:text-base font-black text-amber-200">
                {topAttendees[2].total_points.toLocaleString()}{' '}
                <span className="text-[10px] font-bold text-amber-400/70">PTS</span>
              </div>
            </div>
          </div>
        )}

        {/* Top 10 Ranked List */}
        <div className="bg-[#0F172A]/90 border border-slate-800/80 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md">
          
          {/* Table Header */}
          <div className="px-4 py-3 bg-[#020617]/70 border-b border-slate-800/80 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <div className="flex items-center gap-4">
              <span className="w-9 text-center">Rank</span>
              <span>Attendee Name</span>
            </div>
            <span>Total Points</span>
          </div>

          {/* List Rows */}
          <div className="divide-y divide-slate-800/60">
            {topAttendees.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <Trophy className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-sm font-medium">No attendee scores recorded yet.</p>
                <p className="text-xs text-slate-500">
                  Scan attendee QR codes at booths to populate the leaderboard.
                </p>
              </div>
            ) : (
              topAttendees.map((attendee, index) => {
                const rank = index + 1;
                const rowClasses = getRowHighlight(rank);

                return (
                  <div
                    key={attendee.id}
                    id={`leaderboard-row-${rank}`}
                    className={`px-4 py-3.5 flex items-center justify-between gap-3 border transition-colors ${rowClasses}`}
                  >
                    {/* Rank & Name */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      {getRankBadge(rank)}
                      
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm sm:text-base font-bold truncate ${
                            rank === 1 ? 'text-amber-200' : rank === 2 ? 'text-slate-100' : rank === 3 ? 'text-amber-100' : 'text-slate-200'
                          }`}>
                            {attendee.name}
                          </span>
                          {rank === 1 && (
                            <span className="hidden sm:inline-block px-2 py-0.2 text-[10px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full">
                              #1
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 truncate">
                          {attendee.company && (
                            <span className="truncate">{attendee.company}</span>
                          )}
                          {attendee.company && <span>•</span>}
                          <span className="font-mono text-[11px] text-slate-500">{attendee.id}</span>
                        </div>
                      </div>
                    </div>

                    {/* Total Points */}
                    <div className="text-right shrink-0">
                      <div className={`font-mono text-base sm:text-lg font-black ${
                        rank === 1
                          ? 'text-amber-300'
                          : rank === 2
                          ? 'text-slate-200'
                          : rank === 3
                          ? 'text-amber-200'
                          : 'text-sky-400'
                      }`}>
                        {attendee.total_points.toLocaleString()}
                        <span className="text-xs font-bold text-slate-400 ml-1">PTS</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer timestamp & info */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 px-2 gap-2">
          <span>Displaying Top 10 verified participants</span>
          <span>Last live sync: {lastUpdated.toLocaleTimeString()}</span>
        </div>
      </main>
    </div>
  );
}
