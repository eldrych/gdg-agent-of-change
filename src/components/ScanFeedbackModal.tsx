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
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#10B981', '#6366F1', '#F59E0B', '#3B82F6'],
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
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020617]/85 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          id="scan-feedback-modal"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl relative overflow-hidden ${
            isSuccess
              ? 'bg-[#0F172A] border-emerald-500/50 shadow-emerald-950/50'
              : isDuplicate
              ? 'bg-[#0F172A] border-amber-500/50 shadow-amber-950/50'
              : 'bg-[#0F172A] border-rose-500/50 shadow-rose-950/50'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Background Ambient Glow */}
          <div
            className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-20 ${
              isSuccess ? 'bg-emerald-400' : isDuplicate ? 'bg-amber-400' : 'bg-rose-400'
            }`}
          />

          {/* Close button */}
          <button
            id="close-feedback-btn"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Status Icon */}
          <div className="flex flex-col items-center text-center">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
                isSuccess
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 ring-8 ring-emerald-500/5 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                  : isDuplicate
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 ring-8 ring-amber-500/5 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/30 ring-8 ring-rose-500/5 shadow-[0_0_20px_rgba(244,63,94,0.2)]'
              }`}
            >
              {isSuccess ? (
                <CheckCircle2 className="w-9 h-9" />
              ) : isDuplicate ? (
                <AlertTriangle className="w-9 h-9" />
              ) : (
                <XCircle className="w-9 h-9" />
              )}
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-slate-100 mb-1 tracking-tight">
              {isSuccess
                ? 'Scan Successful!'
                : isDuplicate
                ? 'Duplicate Visit Detected'
                : 'Scan Error'}
            </h3>

            {/* Subtitle / Message */}
            <p
              className={`text-sm font-medium mb-4 ${
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
              <div className="w-full bg-[#020617]/70 border border-slate-800 rounded-xl p-4 mb-5 text-left space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-sky-400" />
                    Attendee ID
                  </span>
                  <span className="text-sm font-mono font-bold text-slate-100 px-2 py-0.5 bg-slate-800 rounded border border-slate-700">
                    {result.attendeeId}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Points Awarded
                  </span>
                  <span className="text-base font-extrabold text-emerald-400 flex items-center gap-1">
                    +{result.pointsAwarded} PTS
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <span className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-sky-400" />
                    Updated Total Points
                  </span>
                  <span className="text-base font-extrabold text-sky-300">
                    {result.updatedTotalPoints} PTS
                  </span>
                </div>

                {result.visitorRank && (
                  <div className="text-[11px] text-center text-slate-400 pt-1">
                    Unique Visitor <strong className="text-slate-200">#{result.visitorRank}</strong> for this booth
                  </div>
                )}
              </div>
            )}

            {/* Duplicate Visit Details Box */}
            {isDuplicate && result.previousScan && (
              <div className="w-full bg-[#020617]/70 border border-slate-800 rounded-xl p-4 mb-5 text-left space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-amber-400" />
                    Attendee ID
                  </span>
                  <span className="font-mono font-bold text-slate-100">{result.attendeeId}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    First Scanned At
                  </span>
                  <span className="text-slate-300 font-medium">
                    {new Date(result.previousScan.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Previously Earned</span>
                  <span className="font-bold text-slate-300">+{result.previousScan.tier_points} PTS</span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <span className="text-slate-400">Current Total Balance</span>
                  <span className="font-bold text-sky-300">{result.updatedTotalPoints} PTS</span>
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
              className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 shadow-lg cursor-pointer ${
                isSuccess
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40 active:scale-[0.98]'
                  : isDuplicate
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700'
                  : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/40'
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
