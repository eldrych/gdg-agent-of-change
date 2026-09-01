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
          dark: '#0f172a',
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020617]/85 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        id="sample-badges-modal"
        className="w-full max-w-2xl bg-[#0F172A] border border-slate-800 rounded-2xl shadow-2xl p-5 sm:p-6 overflow-hidden max-h-[90vh] flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-100 tracking-tight">
                Attendee QR Badges & Tier Simulator
              </h3>
              <p className="text-xs text-slate-400">
                Test scan with your phone camera, or click a badge to simulate instant check-in
              </p>
            </div>
          </div>

          <button
            id="close-badges-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Tier Jump / Simulator bar */}
        <div className="my-3 p-3 bg-[#020617] rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            <FastForward className="w-4 h-4 text-amber-400" />
            <span>Fast-forward unique booth visits:</span>
            <span className="font-mono text-emerald-400 font-bold ml-1">({currentCount} current)</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              id="sim-tier-1-btn"
              disabled={simulating || currentCount >= 10}
              onClick={() => handleSimulateThreshold(10)}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-900/60 disabled:opacity-40 transition-all cursor-pointer"
            >
              Fill to Tier 1 max (10)
            </button>
            <button
              id="sim-tier-2-btn"
              disabled={simulating || currentCount >= 50}
              onClick={() => handleSimulateThreshold(50)}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-900/60 disabled:opacity-40 transition-all cursor-pointer"
            >
              Fill to Tier 2 max (50)
            </button>
            <button
              id="sim-tier-3-btn"
              disabled={simulating || currentCount >= 90}
              onClick={() => handleSimulateThreshold(90)}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-900/60 disabled:opacity-40 transition-all cursor-pointer"
            >
              Fill to Tier 3 max (90)
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pr-1 py-1">
          {/* Left: Interactive QR Code Badge View */}
          {selectedAttendee && (
            <div className="bg-[#020617] border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 mb-1">
                Official Event Badge
              </span>
              <h4 className="text-base font-bold text-slate-100">{selectedAttendee.name}</h4>
              <p className="text-xs text-slate-400 mb-3">{selectedAttendee.company || 'Attendee'}</p>

              {/* QR Image Box */}
              <div className="p-3 bg-white rounded-xl shadow-lg border border-slate-200 mb-3">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`QR Code for ${selectedAttendee.id}`}
                    className="w-44 h-44 object-contain"
                  />
                ) : (
                  <div className="w-44 h-44 flex items-center justify-center bg-slate-100">
                    <span className="text-xs text-slate-500">Generating QR...</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-mono font-bold text-slate-300 px-2 py-0.5 bg-slate-900 rounded border border-slate-700">
                  {selectedAttendee.id}
                </span>
                <span className="text-xs font-semibold text-emerald-400 px-2 py-0.5 bg-emerald-950/60 rounded border border-emerald-800/60">
                  {selectedAttendee.total_points} total pts
                </span>
              </div>

              <button
                id="scan-this-attendee-btn"
                onClick={() => {
                  onSelectAttendeeToScan(selectedAttendee.id);
                  onClose();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all active:scale-[0.98] cursor-pointer"
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
              className="w-full px-3 py-2 mb-2 rounded-xl bg-[#020617] border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />

            <div className="space-y-1.5 overflow-y-auto max-h-[300px] pr-1">
              {filtered.map((att) => {
                const isSelected = selectedAttendee?.id === att.id;
                return (
                  <div
                    key={att.id}
                    onClick={() => setSelectedAttendee(att)}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-sky-950/50 border-sky-500/80 ring-1 ring-sky-500'
                        : 'bg-[#020617]/50 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 text-xs font-bold">
                        {att.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-200">{att.name}</div>
                        <div className="text-[10px] font-mono text-slate-400">{att.id}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-sky-400">
                        {att.total_points} pts
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectAttendeeToScan(att.id);
                          onClose();
                        }}
                        title="Instant scan this badge"
                        className="p-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-800/60 transition-colors cursor-pointer"
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
