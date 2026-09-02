import React from 'react';
import { TIERS_CONFIG, getCurrentActiveTierForBooth } from '../utils/storage';
import { Award, Zap, ChevronRight, TrendingUp, Layers } from 'lucide-react';

interface TierLegendCardProps {
  boothId: string;
}

export const TierLegendCard: React.FC<TierLegendCardProps> = ({ boothId }) => {
  const { currentVisitorsCount, activeTier, currentRankForNextScan, visitsUntilNextTier, nextTierStartsAt } =
    getCurrentActiveTierForBooth(boothId);

  return (
    <div id="tier-legend-card" className="bg-white/5 backdrop-blur-[24px] border border-white/10 rounded-3xl p-5 sm:p-6 shadow-xl ring-1 ring-white/10 relative overflow-hidden">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Point Tier Allocation Matrix</h3>
            <p className="text-xs text-slate-400">Points reward rate dynamically scales with booth popularity</p>
          </div>
        </div>
        
        {/* Next Tier Counter */}
        {visitsUntilNextTier !== null && (
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/80 border border-white/10 text-xs text-slate-300 font-mono">
            <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
            <span><strong className="text-sky-300 font-black">{visitsUntilNextTier}</strong> visits until next tier</span>
          </div>
        )}
      </div>

      {/* Tiers Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
        {TIERS_CONFIG.map((tier) => {
          const isCurrentActive = activeTier.tierNumber === tier.tierNumber;
          
          return (
            <div
              key={tier.tierNumber}
              id={`tier-card-${tier.tierNumber}`}
              className={`relative rounded-2xl p-4 border transition-all duration-300 ${
                isCurrentActive
                  ? 'bg-slate-900/90 border-sky-400 ring-2 ring-sky-500/40 shadow-xl shadow-sky-950/50 scale-[1.02]'
                  : 'bg-slate-950/60 border-white/10 opacity-75 hover:opacity-100 hover:border-white/20'
              }`}
            >
              {isCurrentActive && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-sky-500 to-sky-600 text-slate-950 font-black text-[10px] uppercase tracking-wider shadow-md flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5 fill-current text-slate-950" />
                  Active Now
                </div>
              )}

              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-slate-400 font-mono">
                  {tier.maxVisits ? `Visits ${tier.minVisits}–${tier.maxVisits}` : `Visits ${tier.minVisits}+`}
                </span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                  isCurrentActive ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' : 'bg-white/5 text-slate-400 border border-white/10'
                }`}>
                  T{tier.tierNumber}
                </span>
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className={`text-2xl font-black tracking-tight font-mono ${
                  isCurrentActive ? 'text-emerald-400' : 'text-white'
                }`}>
                  +{tier.points}
                </span>
                <span className="text-xs text-slate-400 font-bold uppercase">PTS</span>
              </div>

              <div className="mt-1 text-[11px] text-slate-300 font-medium truncate">
                {tier.label.replace(/Tier \d+ /, '')}
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress Bar within active tier */}
      {activeTier.maxVisits && (
        <div className="mt-4 pt-3.5 border-t border-white/10">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Current unique scans: <strong className="text-white font-bold font-mono">{currentVisitorsCount}</strong></span>
            <span>Next scan: <strong className="text-emerald-400 font-bold font-mono">#{currentRankForNextScan}</strong> (awards <strong className="text-emerald-400 font-bold font-mono">+{activeTier.points} PTS</strong>)</span>
          </div>
          <div className="h-2 w-full bg-slate-950/80 rounded-full overflow-hidden border border-white/10">
            <div
              className="h-full bg-gradient-to-r from-sky-500 via-emerald-500 to-emerald-400 rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(56,189,248,0.4)]"
              style={{
                width: `${Math.min(100, Math.max(5, (currentVisitorsCount / (nextTierStartsAt || 100)) * 100))}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
