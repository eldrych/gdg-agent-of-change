import React from 'react';
import { TIERS_CONFIG, getCurrentActiveTierForBooth } from '../utils/storage';
import { Award, Zap, ChevronRight, TrendingUp } from 'lucide-react';

interface TierLegendCardProps {
  boothId: string;
}

export const TierLegendCard: React.FC<TierLegendCardProps> = ({ boothId }) => {
  const { currentVisitorsCount, activeTier, currentRankForNextScan, visitsUntilNextTier, nextTierStartsAt } =
    getCurrentActiveTierForBooth(boothId);

  return (
    <div id="tier-legend-card" className="bg-[#0F172A]/80 border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 tracking-tight">Point Tier Structure</h3>
            <p className="text-xs text-slate-400">Points awarded decrease as unique visitor count grows</p>
          </div>
        </div>
        
        {/* Next Tier Counter */}
        {visitsUntilNextTier !== null && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#020617] border border-slate-800 text-xs text-slate-300">
            <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
            <span><strong className="text-sky-300 font-bold">{visitsUntilNextTier}</strong> visits until next tier</span>
          </div>
        )}
      </div>

      {/* Tiers Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-1">
        {TIERS_CONFIG.map((tier) => {
          const isCurrentActive = activeTier.tierNumber === tier.tierNumber;
          
          return (
            <div
              key={tier.tierNumber}
              id={`tier-card-${tier.tierNumber}`}
              className={`relative rounded-xl p-3 border transition-all duration-300 ${
                isCurrentActive
                  ? 'bg-gradient-to-b from-sky-950/60 to-[#0F172A] border-sky-500 ring-2 ring-sky-500/30 shadow-lg shadow-sky-950/50 scale-[1.02]'
                  : 'bg-[#020617]/60 border-slate-800/80 opacity-75 hover:opacity-100 hover:border-slate-700'
              }`}
            >
              {isCurrentActive && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-sky-600 text-white font-bold text-[10px] uppercase tracking-wider shadow-sm flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5 fill-current text-amber-300" />
                  Active Now
                </div>
              )}

              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium text-slate-400">
                  {tier.maxVisits ? `Visits ${tier.minVisits}–${tier.maxVisits}` : `Visits ${tier.minVisits}+`}
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  isCurrentActive ? 'bg-sky-500/20 text-sky-300' : 'bg-slate-800 text-slate-400'
                }`}>
                  T{tier.tierNumber}
                </span>
              </div>

              <div className="flex items-baseline gap-1">
                <span className={`text-xl font-extrabold tracking-tight ${
                  isCurrentActive ? 'text-emerald-400' : 'text-slate-200'
                }`}>
                  +{tier.points}
                </span>
                <span className="text-xs text-slate-400 font-medium">pts</span>
              </div>

              <div className="mt-1 text-[11px] text-slate-400 truncate">
                {tier.label.replace(/Tier \d+ /, '')}
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress Bar within active tier */}
      {activeTier.maxVisits && (
        <div className="mt-3 pt-3 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span>Current unique scans: <strong className="text-slate-100 font-bold">{currentVisitorsCount}</strong></span>
            <span>Next scan: <strong className="text-emerald-400 font-bold">#{currentRankForNextScan}</strong> (awards <strong className="text-emerald-400 font-bold">+{activeTier.points} pts</strong>)</span>
          </div>
          <div className="h-1.5 w-full bg-[#020617] rounded-full overflow-hidden border border-slate-800/60">
            <div
              className="h-full bg-gradient-to-r from-sky-500 via-emerald-500 to-emerald-400 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(56,189,248,0.3)]"
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
