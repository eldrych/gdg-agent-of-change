import React, { useEffect } from 'react';
import { ScanResult } from '../types';
import confetti from 'canvas-confetti';
import { CheckCircle2, AlertTriangle, XCircle, X, Sparkles, User, Award, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ScanFeedbackModalProps {
  result: ScanResult | null;
  onClose: () => void;
}

export const ScanFeedbackModal: React.FC<ScanFeedbackModalProps> = ({ result, onClose }) => {
  useEffect(() => {
    if (result && result.success) {
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#34A853', '#4285F4', '#FBBC04', '#EA4335'],
        });
      } catch {
        // Confetti fallback
      }
    }
  }, [result]);

  if (!result) return null;

  const isSuccess = result.success;
  const isDuplicate = result.isDuplicate;

  return (
    <AnimatePresence>
      <div
        id="scan-feedback-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          id="scan-feedback-modal"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className={`w-full max-w-md rounded-3xl border p-6 sm:p-8 shadow-2xl relative overflow-hidden ring-1 ring-white/10 ${
            isSuccess
              ? 'bg-[#050508] border-emerald-500/40 shadow-emerald-950/50'
              : isDuplicate
              ? 'bg-[#050508] border-amber-500/40 shadow-amber-950/50'
              : 'bg-[#050508] border-rose-500/40 shadow-rose-950/50'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Background Ambient Glow */}
          <div
            className={`absolute -top-24 -right-24 w-52 h-52 rounded-full blur-[90px] pointer-events-none opacity-30 ${
              isSuccess ? 'bg-emerald-400' : isDuplicate ? 'bg-amber-400' : 'bg-rose-400'
            }`}
          />

          {/* Close button */}
          <button
            id="close-feedback-btn"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Status Icon */}
          <div className="flex flex-col items-center text-center">
            <div
              className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-5 ${
                isSuccess
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 ring-8 ring-emerald-500/5 shadow-[0_0_30px_rgba(16,185,129,0.3)]'
                  : isDuplicate
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 ring-8 ring-amber-500/5 shadow-[0_0_30px_rgba(245,158,11,0.3)]'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/30 ring-8 ring-rose-500/5 shadow-[0_0_30px_rgba(244,63,94,0.3)]'
              }`}
            >
              {isSuccess ? (
                <CheckCircle2 className="w-10 h-10" />
              ) : isDuplicate ? (
                <AlertTriangle className="w-10 h-10" />
              ) : (
                <XCircle className="w-10 h-10" />
              )}
            </div>

            {/* Title */}
            <h3 className="text-2xl font-black text-white mb-1 tracking-tight">
              {isSuccess
                ? 'Scan Verified!'
                : isDuplicate
                ? 'Duplicate Visit Detected'
                : 'Scan Verification Error'}
            </h3>

            {/* Subtitle / Message */}
            <p
              className={`text-sm font-semibold mb-5 ${
                isSuccess
                  ? 'text-emerald-300'
                  : isDuplicate
                  ? 'text-amber-300'
                  : 'text-rose-300'
              }`}
            >
              {result.message}
            </p>

            {/* Success Details Box */}
            {isSuccess && (
              <div className="w-full bg-slate-950/80 border border-white/10 rounded-2xl p-4 sm:p-5 mb-6 text-left space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-sky-400" />
                    Attendee ID
                  </span>
                  <span className="text-xs font-mono font-bold text-white px-2.5 py-1 bg-white/5 rounded-lg border border-white/10">
                    {result.attendeeId}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Points Awarded
                  </span>
                  <span className="text-lg font-black text-emerald-400 font-mono flex items-center gap-1">
                    +{result.pointsAwarded} PTS
                  </span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-sky-400" />
                    New Total Score
                  </span>
                  <span className="text-lg font-black text-sky-300 font-mono">
                    {result.updatedTotalPoints} PTS
                  </span>
                </div>

                {result.visitorRank && (
                  <div className="text-[11px] text-center text-slate-400 pt-1 font-mono">
                    Unique Visitor <strong className="text-white">#{result.visitorRank}</strong> for this booth
                  </div>
                )}
              </div>
            )}

            {/* Duplicate Visit Details Box */}
            {isDuplicate && result.previousScan && (
              <div className="w-full bg-slate-950/80 border border-white/10 rounded-2xl p-4 sm:p-5 mb-6 text-left space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-amber-400" />
                    Attendee ID
                  </span>
                  <span className="font-mono font-bold text-white">{result.attendeeId}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    First Scanned At
                  </span>
                  <span className="text-slate-200 font-mono">
                    {new Date(result.previousScan.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-bold uppercase tracking-wider">Previously Earned</span>
                  <span className="font-black text-emerald-400 font-mono">+{result.previousScan.tier_points} PTS</span>
                </div>

                <div className="flex items-center justify-between pt-2.5 border-t border-white/10">
                  <span className="text-slate-400 font-bold uppercase tracking-wider">Current Balance</span>
                  <span className="font-black text-sky-300 font-mono">{result.updatedTotalPoints} PTS</span>
                </div>

                <p className="text-[11px] text-amber-400/90 italic pt-1">
                  Attendees may only receive visit points once per booth during the event.
                </p>
              </div>
            )}

            {/* Action button */}
            <button
              id="confirm-feedback-btn"
              onClick={onClose}
              className={`w-full py-3.5 px-5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all duration-200 shadow-lg cursor-pointer ${
                isSuccess
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 shadow-emerald-950/40 active:scale-[0.98]'
                  : isDuplicate
                  ? 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
                  : 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white shadow-rose-950/40'
              }`}
            >
              Continue Scanning
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
