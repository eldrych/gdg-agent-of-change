import React, { useState } from 'react';
import { X, Keyboard, ArrowRight } from 'lucide-react';

interface ManualEntryModalProps {
  onScan: (attendeeId: string) => void;
  onClose: () => void;
}

export const ManualEntryModal: React.FC<ManualEntryModalProps> = ({ onScan, onClose }) => {
  const [attendeeId, setAttendeeId] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!attendeeId.trim()) {
      setError('Please enter an Attendee ID');
      return;
    }
    onScan(attendeeId.trim());
    onClose();
  };

  const quickSamples = ['QR-attendee1', 'QR-attendee2', 'QR-attendee3', 'QR-attendee4', 'QR-attendee5'];

  return (
    <div
      id="manual-entry-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        id="manual-entry-modal"
        className="w-full max-w-md bg-[#050508] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden ring-1 ring-white/10 animate-in fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          id="close-manual-entry-btn"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-400">
            <Keyboard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Manual Badge Entry</h3>
            <p className="text-xs text-slate-400">Process scan via attendee QR identifier code</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Attendee ID or Badge Code
            </label>
            <input
              id="manual-attendee-input"
              type="text"
              placeholder="e.g. QR-attendee1"
              autoFocus
              value={attendeeId}
              onChange={(e) => {
                setAttendeeId(e.target.value);
                setError('');
              }}
              className="w-full px-4 py-3.5 rounded-2xl bg-slate-950/80 border border-white/10 text-white placeholder-slate-600 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
            />
            {error && <p className="text-xs text-rose-400 mt-1.5 font-medium">{error}</p>}
          </div>

          {/* Quick preset suggestions */}
          <div>
            <span className="text-[10px] text-slate-400 font-bold block mb-2 uppercase tracking-wider">Quick Fill Sample Attendees:</span>
            <div className="flex flex-wrap gap-1.5">
              {quickSamples.map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => setAttendeeId(sample)}
                  className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-sky-500 hover:text-slate-950 text-[11px] font-mono font-bold text-slate-300 border border-white/10 transition-colors cursor-pointer"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs transition-colors cursor-pointer border border-white/10"
            >
              Cancel
            </button>
            <button
              id="submit-manual-scan-btn"
              type="submit"
              className="flex-1 py-3 px-4 rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-sky-950/50 transition-all cursor-pointer uppercase tracking-wider"
            >
              <span>Process Scan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
