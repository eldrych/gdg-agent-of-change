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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020617]/85 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        id="manual-entry-modal"
        className="w-full max-w-md bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          id="close-manual-entry-btn"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
            <Keyboard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100 tracking-tight">Manual Attendee ID Entry</h3>
            <p className="text-xs text-slate-400">Enter code if camera or QR code is damaged</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
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
              className="w-full px-4 py-2.5 rounded-xl bg-[#020617] border border-slate-700 text-slate-100 placeholder-slate-500 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            {error && <p className="text-xs text-rose-400 mt-1">{error}</p>}
          </div>

          {/* Quick preset suggestions */}
          <div>
            <span className="text-[11px] text-slate-400 font-medium block mb-1.5 uppercase tracking-wider text-[10px]">Quick fill sample:</span>
            <div className="flex flex-wrap gap-1.5">
              {quickSamples.map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => setAttendeeId(sample)}
                  className="px-2 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-[11px] font-mono text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="submit-manual-scan-btn"
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-sky-950/50 transition-all cursor-pointer"
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
