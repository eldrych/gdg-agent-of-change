import React, { useState, useEffect, useCallback } from 'react';
import { Booth, Scan, ScanResult, Attendee } from '../types';
import { 
  getBoothById, 
  getUniqueVisitorCountForBooth, 
  getCurrentActiveTierForBooth,
  isSoundEnabled, 
  setSoundEnabled,
  getAttendees,
  getTierForRank
} from '../utils/storage';
import { playSuccessSound, playWarningSound } from '../utils/audio';
import { QrScannerComponent } from './QrScannerComponent';
import { TierLegendCard } from './TierLegendCard';
import { ScanFeedbackModal } from './ScanFeedbackModal';
import { ManualEntryModal } from './ManualEntryModal';
import { SampleBadgesModal } from './SampleBadgesModal';
import { AttendeeDirectoryModal } from './AttendeeDirectoryModal';
import { useScansForBooth, processScanFirebase, useBooths } from '../hooks/useFirestore';

import { 
  LogOut, 
  Volume2, 
  VolumeX, 
  QrCode, 
  Keyboard, 
  Users, 
  Clock, 
  Award, 
  Zap, 
  Building2, 
  History, 
  CheckCircle2, 
  Sparkles,
  TrendingUp,
  RefreshCw,
  Trophy
} from 'lucide-react';

interface ScannerScreenProps {
  boothId: string;
  onLogout: () => void;
  onNavigateToLeaderboard?: () => void;
}

export const ScannerScreen: React.FC<ScannerScreenProps> = ({ 
  boothId, 
  onLogout,
  onNavigateToLeaderboard 
}) => {
  const { booths } = useBooths();
  const booth = booths.find(b => b.id.toLowerCase() === boothId.toLowerCase()) || getBoothById(boothId);
  const scans = useScansForBooth(boothId);
  
  const uniqueVisitorCount = new Set(scans.map(s => s.attendee_id)).size;
  const currentRankForNextScan = uniqueVisitorCount + 1;
  const activeTier = getTierForRank(currentRankForNextScan);
  
  let nextTierStartsAt: number | null = null;
  let visitsUntilNextTier: number | null = null;

  if (activeTier.maxVisits !== null) {
    nextTierStartsAt = activeTier.maxVisits + 1;
    visitsUntilNextTier = activeTier.maxVisits - uniqueVisitorCount;
  }

  const activeTierInfo = {
    currentRankForNextScan,
    activeTier,
    currentVisitorsCount: uniqueVisitorCount,
    pointsForNextScan: activeTier.points,
    nextTierStartsAt,
    visitsUntilNextTier,
  };

  const [soundOn, setSoundOn] = useState<boolean>(() => isSoundEnabled());
  
  // Modals & Overlays
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showBadgesModal, setShowBadgesModal] = useState(false);
  const [showDirectoryModal, setShowDirectoryModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Toggle Sound
  const handleToggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
  };

  // Process a QR or Attendee ID scan
  const handleProcessScan = useCallback(async (rawAttendeeInput: string) => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const result = await processScanFirebase(boothId, rawAttendeeInput, booth?.name || boothId);
      setScanResult(result);

      if (result.success) {
        if (soundOn) playSuccessSound();
      } else {
        if (soundOn) playWarningSound();
      }
    } catch (err) {
      console.error(err);
      if (soundOn) playWarningSound();
      setScanResult({
        success: false,
        message: 'Network error processing scan. Please try again.',
        attendeeId: rawAttendeeInput,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsProcessing(false);
    }
  }, [boothId, soundOn, isProcessing, booth?.name]);

  const totalPointsAwardedAtBooth = scans.reduce((acc, s) => acc + s.tier_points, 0);

  const isModalOpen = Boolean(scanResult || showManualModal || showBadgesModal || showDirectoryModal);


  return (
    <div id="scanner-screen" className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col selection:bg-sky-500 selection:text-white">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-[#0F172A]/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 sm:px-6 shadow-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          
          {/* Left: Booth Identity Badge */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold font-mono shadow-[0_0_15px_rgba(56,189,248,0.15)]">
              {booth?.id || boothId}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-slate-100 leading-none truncate max-w-[180px] sm:max-w-xs md:max-w-md tracking-tight">
                  {booth?.name || `Booth ${boothId}`}
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  POC Active
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[200px] sm:max-w-sm">
                {booth?.location || 'Assigned Station'}
              </p>
            </div>
          </div>

          {/* Right: Quick Action Controls */}
          <div className="flex items-center gap-2">
            <button
              id="toggle-sound-btn"
              onClick={handleToggleSound}
              title={soundOn ? 'Mute Audio Chimes' : 'Enable Audio Chimes'}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                soundOn
                  ? 'bg-slate-800 text-sky-400 border-slate-700 hover:bg-slate-750'
                  : 'bg-slate-900 text-slate-500 border-slate-800 hover:bg-slate-800 hover:text-slate-300'
              }`}
            >
              {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {onNavigateToLeaderboard ? (
              <button
                id="open-top10-leaderboard-btn"
                onClick={onNavigateToLeaderboard}
                title="View Top 10 Event Leaderboard (/leaderboards)"
                className="p-2 sm:px-3 sm:py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:border-amber-400/50"
              >
                <Trophy className="w-4 h-4 text-amber-400" />
                <span className="hidden md:inline">Top 10 Board</span>
              </button>
            ) : null}

            <button
              id="open-directory-btn"
              onClick={() => setShowDirectoryModal(true)}
              title="View Attendee Directory"
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-200 border border-slate-700/80 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:border-slate-600"
            >
              <Users className="w-4 h-4 text-emerald-400" />
              <span className="hidden md:inline">All Attendees</span>
            </button>

            <button
              id="open-badges-btn"
              onClick={() => setShowBadgesModal(true)}
              title="Sample Badges & Tier Simulator"
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:border-sky-400/50"
            >
              <QrCode className="w-4 h-4 text-sky-400" />
              <span className="hidden sm:inline">Badges & Simulator</span>
            </button>

            <button
              id="logout-btn"
              onClick={onLogout}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Metric Cards Row (Requirements 1.a, 1.b, 1.c) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          
          {/* 1.a: Current Logged-in Booth Name & ID */}
          <div id="metric-booth-id" className="bg-[#0F172A]/80 border border-slate-800/80 rounded-2xl p-4 shadow-xl backdrop-blur-sm relative overflow-hidden group hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="uppercase tracking-wider text-[10px] font-bold text-slate-500">Active Station</span>
              <Building2 className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-xl font-extrabold text-slate-100 font-mono">
              {booth?.id || boothId}
            </div>
            <div className="text-xs text-sky-400/90 truncate mt-0.5">
              {booth?.name.replace(/^Booth \d+:\s*/, '')}
            </div>
          </div>

          {/* 1.b: Total Unique Scans at this Booth */}
          <div id="metric-unique-scans" className="bg-[#0F172A]/80 border border-slate-800/80 rounded-2xl p-4 shadow-xl backdrop-blur-sm relative overflow-hidden group hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="uppercase tracking-wider text-[10px] font-bold text-slate-500">Total Unique Scans</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400 flex items-baseline gap-1.5">
              <span>{uniqueVisitorCount}</span>
              <span className="text-xs font-medium text-slate-400">attendees</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {uniqueVisitorCount === 0 ? 'Awaiting first attendee' : `Cumulative unique visits`}
            </div>
          </div>

          {/* 1.c: Current Active Tier */}
          <div id="metric-active-tier" className="bg-[#0F172A]/80 border border-sky-500/40 rounded-2xl p-4 shadow-xl ring-1 ring-sky-500/20 backdrop-blur-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between text-xs text-sky-300 font-semibold mb-1">
              <span className="uppercase tracking-wider text-[10px] font-bold text-sky-400">Current Active Tier</span>
              <Zap className="w-4 h-4 text-amber-400 fill-current" />
            </div>
            <div className="text-2xl font-black text-slate-100 flex items-baseline gap-1.5">
              <span className="text-amber-400 font-extrabold">+{activeTierInfo.pointsForNextScan}</span>
              <span className="text-xs font-bold text-slate-300">pts / scan</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 truncate">
              {activeTierInfo.activeTier.label}
            </div>
          </div>

          {/* 4th Metric: Total Points Distributed */}
          <div id="metric-points-distributed" className="bg-[#0F172A]/80 border border-slate-800/80 rounded-2xl p-4 shadow-xl backdrop-blur-sm relative overflow-hidden group hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="uppercase tracking-wider text-[10px] font-bold text-slate-500">Points Distributed</span>
              <Award className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-purple-300">
              {totalPointsAwardedAtBooth.toLocaleString()} <span className="text-xs font-medium text-slate-400">PTS</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Across {scans.length} verified scans
            </div>
          </div>

        </div>

        {/* Tier Structure Visualization */}
        <TierLegendCard boothId={boothId} />

        {/* Scanner & Live Feed Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Camera QR Scanner (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
                <h2 className="text-base font-bold text-slate-100 tracking-tight">Live Camera Scanner</h2>
              </div>

              {/* Manual Entry button */}
              <button
                id="open-manual-entry-btn"
                onClick={() => setShowManualModal(true)}
                className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer hover:border-slate-600"
              >
                <Keyboard className="w-3.5 h-3.5 text-sky-400" />
                <span>Manual Entry</span>
              </button>
            </div>

            {/* Prominent Optical QR Scanner */}
            <QrScannerComponent onScan={handleProcessScan} isPaused={isModalOpen} />

            {/* Quick Testing Helper Bar */}
            <div className="p-3 bg-[#0F172A]/70 border border-slate-800/80 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Quick Test attendee sample IDs:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {['QR-attendee1', 'QR-attendee2', 'QR-attendee3', 'QR-attendee4'].map((sampleId) => (
                  <button
                    key={sampleId}
                    id={`quick-scan-${sampleId}`}
                    onClick={() => handleProcessScan(sampleId)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-sky-600 hover:text-white text-slate-300 font-mono text-[11px] border border-slate-700 transition-colors cursor-pointer"
                  >
                    Scan {sampleId}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Recent Scans Log Table (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-sky-400" />
                <h2 className="text-base font-bold text-slate-100 tracking-tight">Recent Scans Feed</h2>
              </div>
              <span className="text-xs font-semibold text-slate-400 font-mono px-2 py-0.5 bg-slate-900 rounded-md border border-slate-800">
                {scans.length} logged
              </span>
            </div>

            <div className="bg-[#0F172A]/80 border border-slate-800/80 rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm">
              <div className="p-3.5 border-b border-slate-800 bg-[#020617]/50 flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <span>Attendee & Time</span>
                <span>Points Awarded</span>
              </div>

              <div className="divide-y divide-slate-800/60 max-h-[380px] sm:max-h-[420px] overflow-y-auto">
                {scans.length === 0 ? (
                  <div className="p-8 text-center space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800/60 text-slate-500 flex items-center justify-center mx-auto border border-slate-700/50">
                      <QrCode className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-xs font-medium text-slate-300">No scans recorded yet at this booth.</p>
                    <p className="text-[11px] text-slate-500">Scan attendee QR codes to start awarding points.</p>
                  </div>
                ) : (
                  scans.map((scan) => {
                    const attendeesMap = getAttendees();
                    const attendee = attendeesMap[scan.attendee_id];

                    return (
                      <div
                        key={scan.id}
                        id={`scan-row-${scan.id}`}
                        className="p-3 hover:bg-slate-800/50 transition-colors flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-100 truncate">
                              {attendee?.name || scan.attendee_id}
                            </div>
                            <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
                              <span>{scan.attendee_id}</span>
                              <span>•</span>
                              <span>
                                {new Date(scan.timestamp).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                })}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="font-extrabold text-emerald-400 font-mono">
                            +{scan.tier_points} PTS
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Visit #{scan.visitor_rank}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

        </div>

      </main>

      {/* Overlays / Modals */}
      <ScanFeedbackModal
        result={scanResult}
        onClose={() => setScanResult(null)}
      />

      {showManualModal && (
        <ManualEntryModal
          onScan={handleProcessScan}
          onClose={() => setShowManualModal(false)}
        />
      )}

      {showBadgesModal && (
        <SampleBadgesModal
          boothId={boothId}
          onSelectAttendeeToScan={handleProcessScan}
          onClose={() => setShowBadgesModal(false)}
          onRefreshStats={() => {}}
        />
      )}

      {showDirectoryModal && (
        <AttendeeDirectoryModal onClose={() => setShowDirectoryModal(false)} />
      )}
    </div>
  );
};
