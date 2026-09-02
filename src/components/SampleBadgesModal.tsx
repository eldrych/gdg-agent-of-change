import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { getAttendees, simulateVisitsForBooth, getUniqueVisitorCountForBooth } from '../utils/storage';
import { Attendee } from '../types';
import { X, QrCode, Zap, User, Sparkles, Check, FastForward, ExternalLink } from 'lucide-react';

interface SampleBadgesModalProps {
  boothId: string;
  onSelectAttendeeToScan: (attendeeId: string) => void;
  onClose: () => void;
  onRefreshStats: () => void;
}

export const SampleBadgesModal: React.FC<SampleBadgesModalProps> = ({
  boothId,
  onSelectAttendeeToScan,
  onClose,
  onRefreshStats,
}) => {
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [selectedAttendee, setSelectedAttendee] = useState<Attendee | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    const list = Object.values(getAttendees());
    setAttendees(list);
    if (list.length > 0) {
      setSelectedAttendee(list[0]);
    }
  }, []);

  useEffect(() => {
    if (selectedAttendee) {
      QRCode.toDataURL(selectedAttendee.id, {
        width: 260,
        margin: 2,
        color: {
          dark: '#050508',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error(err));
    }
  }, [selectedAttendee]);

  const filtered = attendees.filter(
    (a) =>
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.company && a.company.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSimulateThreshold = (targetCount: number) => {
    setSimulating(true);
    simulateVisitsForBooth(boothId, targetCount);
    onRefreshStats();
    setTimeout(() => {
      setSimulating(false);
      onClose();
    }, 400);
  };

  const currentCount = getUniqueVisitorCountForBooth(boothId);

  return (
    <div
      id="sample-badges-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        id="sample-badges-modal"
        className="w-full max-w-2xl bg-[#050508] border border-white/10 rounded-3xl shadow-2xl p-6 sm:p-8 overflow-hidden max-h-[90vh] flex flex-col relative ring-1 ring-white/10 animate-in fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Badge Generator & Tier Simulator
              </h3>
              <p className="text-xs text-slate-400">
                Scan via camera feed or click to simulate real attendee check-ins
              </p>
            </div>
          </div>

          <button
            id="close-badges-modal-btn"
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Tier Jump / Simulator bar */}
        <div className="my-4 p-3.5 bg-slate-950/80 rounded-2xl border border-white/10 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <FastForward className="w-4 h-4 text-amber-400" />
            <span className="font-bold">Fast-forward unique booth visits:</span>
            <span className="font-mono text-emerald-400 font-black ml-1">({currentCount} current)</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              id="sim-tier-1-btn"
              disabled={simulating || currentCount >= 10}
              onClick={() => handleSimulateThreshold(10)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-emerald-300 border border-emerald-500/30 disabled:opacity-40 transition-all cursor-pointer font-mono"
            >
              Fill to T1 (10)
            </button>
            <button
              id="sim-tier-2-btn"
              disabled={simulating || currentCount >= 50}
              onClick={() => handleSimulateThreshold(50)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-sky-300 border border-sky-500/30 disabled:opacity-40 transition-all cursor-pointer font-mono"
            >
              Fill to T2 (50)
            </button>
            <button
              id="sim-tier-3-btn"
              disabled={simulating || currentCount >= 90}
              onClick={() => handleSimulateThreshold(90)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-amber-300 border border-amber-500/30 disabled:opacity-40 transition-all cursor-pointer font-mono"
            >
              Fill to T3 (90)
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pr-1 py-1">
          {/* Left: Interactive QR Code Badge View */}
          {selectedAttendee && (
            <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-black uppercase tracking-wider text-sky-400 mb-1">
                Official Event Badge
              </span>
              <h4 className="text-base font-bold text-white">{selectedAttendee.name}</h4>
              <p className="text-xs text-slate-400 mb-3.5">{selectedAttendee.company || 'Attendee'}</p>

              {/* QR Image Box */}
              <div className="p-3 bg-white rounded-2xl shadow-xl border border-white/20 mb-4">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`QR Code for ${selectedAttendee.id}`}
                    className="w-40 h-40 object-contain rounded-lg"
                  />
                ) : (
                  <div className="w-40 h-40 flex items-center justify-center bg-slate-100">
                    <span className="text-xs text-slate-500">Generating QR...</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-mono font-bold text-slate-300 px-2.5 py-1 bg-white/5 rounded-lg border border-white/10">
                  {selectedAttendee.id}
                </span>
                <span className="text-xs font-black font-mono text-emerald-400 px-2.5 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
                  {selectedAttendee.total_points} PTS
                </span>
              </div>

              <button
                id="scan-this-attendee-btn"
                onClick={() => {
                  onSelectAttendeeToScan(selectedAttendee.id);
                  onClose();
                }}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all active:scale-[0.98] cursor-pointer uppercase tracking-wider"
              >
                <Zap className="w-4 h-4 fill-current" />
                Simulate Scan "{selectedAttendee.name}"
              </button>
            </div>
          )}

          {/* Right: Attendee List to pick */}
          <div className="flex flex-col h-full">
            <input
              id="attendee-search-input"
              type="text"
              placeholder="Search pre-seeded attendee..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3.5 py-2.5 mb-2.5 rounded-2xl bg-slate-950/80 border border-white/10 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/50 font-mono"
            />

            <div className="space-y-1.5 overflow-y-auto max-h-[300px] pr-1">
              {filtered.map((att) => {
                const isSelected = selectedAttendee?.id === att.id;
                return (
                  <div
                    key={att.id}
                    onClick={() => setSelectedAttendee(att)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-sky-500/15 border-sky-500/60 ring-1 ring-sky-500/50 shadow-md'
                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-slate-200 text-xs font-black">
                        {att.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">{att.name}</div>
                        <div className="text-[10px] font-mono text-slate-400">{att.id}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black font-mono text-sky-400">
                        {att.total_points} PTS
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectAttendeeToScan(att.id);
                          onClose();
                        }}
                        title="Instant scan this badge"
                        className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500 hover:text-slate-950 text-emerald-300 border border-emerald-500/30 transition-colors cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
