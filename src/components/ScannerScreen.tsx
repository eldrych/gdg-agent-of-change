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
import { GlobalNavigationHeader } from './GlobalNavigationHeader';

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
  Trophy,
  Layers,
  Activity
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
    <div id="scanner-screen" className="min-h-screen bg-[#050508] text-slate-100 flex flex-col relative overflow-hidden font-sans selection:bg-sky-500 selection:text-slate-950">
      {/* Ambient background glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-[#4285F4]/10 blur-[140px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#0F9D58]/10 blur-[130px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Global Navigation Header */}
      <GlobalNavigationHeader
        currentRoute="booth-portal"
        subtitle={`${booth?.name || `Booth ${boothId}`} (${booth?.id || boothId})`}
        badgeContent={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black font-mono tracking-wider bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
            LIVE STATION ACTIVE
          </span>
        }
        rightActions={
          <div className="flex items-center gap-2">
            <button
              id="toggle-sound-btn"
              type="button"
              onClick={handleToggleSound}
              title={soundOn ? 'Mute Audio Chimes' : 'Enable Audio Chimes'}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                soundOn
                  ? 'bg-white/10 text-sky-400 border-white/20 hover:bg-white/15'
                  : 'bg-white/5 text-slate-500 border-white/10 hover:bg-white/10 hover:text-slate-300'
              }`}
            >
              {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              id="open-directory-btn"
              type="button"
              onClick={() => setShowDirectoryModal(true)}
              title="View Attendee Directory"
              className="p-2 sm:px-3 sm:py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <Users className="w-4 h-4 text-emerald-400" />
              <span className="hidden md:inline">Attendees</span>
            </button>

            <button
              id="open-badges-btn"
              type="button"
              onClick={() => setShowBadgesModal(true)}
              title="Sample Badges & Tier Simulator"
              className="p-2 sm:px-3 sm:py-2.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <QrCode className="w-4 h-4 text-sky-400" />
              <span className="hidden md:inline">Badges & Simulator</span>
            </button>

            <button
              id="logout-btn"
              type="button"
              onClick={onLogout}
              className="p-2 sm:px-3 sm:py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        }
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8 space-y-6 relative z-10">
        
        {/* Metric Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Logged-in Station Details */}
          <div id="metric-booth-id" className="bg-white/5 backdrop-blur-[24px] border border-white/10 rounded-3xl p-5 shadow-lg ring-1 ring-white/10 relative overflow-hidden group hover:border-white/20 transition-colors">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="uppercase tracking-wider text-[10px] font-black text-slate-400">Active Station</span>
              <Building2 className="w-4 h-4 text-sky-400" />
            </div>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-black text-white font-mono">
                {booth?.id || boothId}
              </div>
              {booth?.category && (
                <span className="text-[10px] uppercase font-bold text-sky-300 bg-sky-500/10 px-2 py-0.5 rounded-lg border border-sky-500/30">
                  {booth.category}
                </span>
              )}
            </div>
            <div className="text-xs text-sky-300 font-bold truncate mt-1">
              {booth?.name.replace(/^Booth \d+:\s*/, '')}
            </div>
            <div className="text-[10px] text-slate-400 truncate mt-0.5">
              {booth?.location || 'Exhibition Hall'}
            </div>
          </div>

          {/* Card 2: Total Unique Scans */}
          <div id="metric-unique-scans" className="bg-white/5 backdrop-blur-[24px] border border-white/10 rounded-3xl p-5 shadow-lg ring-1 ring-white/10 relative overflow-hidden group hover:border-white/20 transition-colors">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="uppercase tracking-wider text-[10px] font-black text-slate-400">Total Unique Visitors</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-black text-emerald-400 flex items-baseline gap-1.5 font-mono">
              <span>{uniqueVisitorCount}</span>
              <span className="text-xs font-bold text-slate-400">attendees</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {uniqueVisitorCount === 0 ? 'Awaiting first attendee' : `Cumulative unique scans`}
            </div>
          </div>

          {/* Card 3: Current Active Tier */}
          <div id="metric-active-tier" className="bg-white/5 backdrop-blur-[24px] border border-sky-500/30 rounded-3xl p-5 shadow-lg ring-1 ring-sky-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between text-xs text-sky-300 font-bold mb-2">
              <span className="uppercase tracking-wider text-[10px] font-black text-sky-400">Current Reward Rate</span>
              <Zap className="w-4 h-4 text-amber-400 fill-current" />
            </div>
            <div className="text-3xl font-black text-white flex items-baseline gap-1.5 font-mono">
              <span className="text-amber-400 font-black">+{activeTierInfo.pointsForNextScan}</span>
              <span className="text-xs font-bold text-slate-300">PTS / SCAN</span>
            </div>
            <div className="text-[11px] text-slate-300 mt-1 font-medium truncate">
              {activeTierInfo.activeTier.label}
            </div>
          </div>

          {/* Card 4: Total Points Distributed */}
          <div id="metric-points-distributed" className="bg-white/5 backdrop-blur-[24px] border border-white/10 rounded-3xl p-5 shadow-lg ring-1 ring-white/10 relative overflow-hidden group hover:border-white/20 transition-colors">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="uppercase tracking-wider text-[10px] font-black text-slate-400">Points Distributed</span>
              <Award className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-3xl font-black text-purple-300 font-mono">
              {totalPointsAwardedAtBooth.toLocaleString()} <span className="text-xs font-bold text-slate-400">PTS</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Across {scans.length} verified scans
            </div>
          </div>

        </div>

        {/* Tier Structure Matrix Visualization */}
        <TierLegendCard boothId={boothId} />

        {/* Scanner & Live Feed Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Camera QR Scanner (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_#34d399]" />
                <h2 className="text-base font-bold text-white tracking-tight">Live Camera Scanner</h2>
              </div>

              {/* Manual Entry button */}
              <button
                id="open-manual-entry-btn"
                type="button"
                onClick={() => setShowManualModal(true)}
                className="px-3.5 py-2 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-xs font-bold flex items-center gap-2 transition-all shadow-sm cursor-pointer"
              >
                <Keyboard className="w-3.5 h-3.5 text-sky-400" />
                <span>Manual Entry</span>
              </button>
            </div>

            {/* Optical QR Scanner */}
            <QrScannerComponent onScan={handleProcessScan} isPaused={isModalOpen} />

            {/* Quick Testing Helper Bar */}
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 backdrop-blur-[24px] ring-1 ring-white/10">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="font-semibold text-slate-300">Quick Test sample IDs:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {['QR-attendee1', 'QR-attendee2', 'QR-attendee3', 'QR-attendee4'].map((sampleId) => (
                  <button
                    key={sampleId}
                    id={`quick-scan-${sampleId}`}
                    type="button"
                    onClick={() => handleProcessScan(sampleId)}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-sky-500 hover:text-slate-950 text-slate-300 font-mono text-[11px] font-bold border border-white/10 transition-colors cursor-pointer"
                  >
                    {sampleId}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Recent Scans Log Table (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <History className="w-4 h-4 text-sky-400" />
                <h2 className="text-base font-bold text-white tracking-tight">Recent Scans Feed</h2>
              </div>
              <span className="text-xs font-bold text-slate-300 font-mono px-2.5 py-1 bg-white/5 rounded-xl border border-white/10">
                {scans.length} logged
              </span>
            </div>

            <div className="bg-white/5 backdrop-blur-[32px] border border-white/10 rounded-3xl shadow-xl overflow-hidden ring-1 ring-white/10">
              <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <span>Attendee & Timestamp</span>
                <span>Points Awarded</span>
              </div>

              <div className="divide-y divide-white/5 max-h-[380px] sm:max-h-[420px] overflow-y-auto">
                {scans.length === 0 ? (
                  <div className="p-10 text-center space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 text-slate-500 flex items-center justify-center mx-auto border border-white/10">
                      <QrCode className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-xs font-bold text-slate-300">No scans recorded yet at this booth.</p>
                    <p className="text-[11px] text-slate-500">Scan attendee QR codes to start awarding tiered points.</p>
                  </div>
                ) : (
                  scans.map((scan) => {
                    const attendeesMap = getAttendees();
                    const attendee = attendeesMap[scan.attendee_id];

                    return (
                      <div
                        key={scan.id}
                        id={`scan-row-${scan.id}`}
                        className="p-3.5 hover:bg-white/5 transition-colors flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-white truncate">
                              {attendee?.name || scan.attendee_id}
                            </div>
                            <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5 mt-0.5">
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
                          <div className="font-black text-emerald-400 font-mono">
                            +{scan.tier_points} PTS
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
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
