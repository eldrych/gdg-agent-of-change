import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { getAttendees, getScans, getBooths } from '../utils/storage';
import { Attendee, Scan, Booth } from '../types';
import { X, Users, Award, Search, CheckCircle2, ChevronRight } from 'lucide-react';

interface AttendeeDirectoryModalProps {
  onClose: () => void;
}

export const AttendeeDirectoryModal: React.FC<AttendeeDirectoryModalProps> = ({ onClose }) => {
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [scans, setScans] = useState<Scan[]>([]);
  const [booths, setBooths] = useState<Booth[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAttendee, setSelectedAttendee] = useState<Attendee | null>(null);
  const [badgeQrUrl, setBadgeQrUrl] = useState<string>('');

  useEffect(() => {
    const attList = Object.values(getAttendees()).sort((a, b) => b.total_points - a.total_points);
    setAttendees(attList);
    setScans(getScans());
    setBooths(getBooths());
    if (attList.length > 0) {
      setSelectedAttendee(attList[0]);
    }
  }, []);

  useEffect(() => {
    if (selectedAttendee) {
      QRCode.toDataURL(selectedAttendee.id, {
        width: 200,
        margin: 2,
        color: { dark: '#0f172a', light: '#ffffff' },
      })
        .then(setBadgeQrUrl)
        .catch(console.error);
    }
  }, [selectedAttendee]);

  const filtered = attendees.filter(
    (a) =>
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.company && a.company.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getAttendeeScans = (attendeeId: string) => {
    return scans.filter((s) => s.attendee_id === attendeeId);
  };

  return (
    <div
      id="attendee-directory-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020617]/85 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        id="attendee-directory-modal"
        className="w-full max-w-3xl bg-[#0F172A] border border-slate-800 rounded-2xl shadow-2xl p-5 sm:p-6 overflow-hidden max-h-[90vh] flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-100 tracking-tight">
                Attendee Leaderboard & Directory
              </h3>
              <p className="text-xs text-slate-400">
                Live points accumulated across all 10 event booths
              </p>
            </div>
          </div>

          <button
            id="close-directory-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="my-3 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="directory-search-input"
            type="text"
            placeholder="Search attendee by name, company, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#020617] border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>

        {/* 2-Column layout */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-y-auto pr-1 flex-1">
          {/* Attendees List (3 columns) */}
          <div className="md:col-span-3 space-y-2 overflow-y-auto max-h-[380px] pr-1">
            {filtered.map((att, idx) => {
              const isSelected = selectedAttendee?.id === att.id;
              const attScans = getAttendeeScans(att.id);

              return (
                <div
                  key={att.id}
                  onClick={() => setSelectedAttendee(att)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-slate-800/90 border-sky-500 ring-1 ring-sky-500/50'
                      : 'bg-[#020617]/60 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                      idx === 0 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                      idx === 1 ? 'bg-slate-300/20 text-slate-200 border border-slate-400/40' :
                      idx === 2 ? 'bg-amber-700/20 text-amber-500 border border-amber-700/40' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      #{idx + 1}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-100">{att.name}</div>
                      <div className="text-[10px] text-slate-400">{att.company} • <span className="font-mono">{att.id}</span></div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-extrabold text-emerald-400">{att.total_points} pts</div>
                    <div className="text-[10px] text-slate-400">{attScans.length} booths visited</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Attendee Details & Badge (2 columns) */}
          {selectedAttendee && (
            <div className="md:col-span-2 bg-[#020617] border border-slate-800 rounded-xl p-4 flex flex-col items-center text-center">
              <div className="w-full flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                <span className="text-xs font-bold text-slate-300">Badge & History</span>
                <span className="text-xs font-extrabold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                  {selectedAttendee.total_points} PTS
                </span>
              </div>

              {badgeQrUrl && (
                <div className="p-2.5 bg-white rounded-xl shadow-md mb-2">
                  <img src={badgeQrUrl} alt="Attendee QR" className="w-28 h-28 object-contain" />
                </div>
              )}

              <h4 className="text-sm font-bold text-slate-100">{selectedAttendee.name}</h4>
              <span className="text-[11px] font-mono text-slate-400 mb-3">{selectedAttendee.id}</span>

              {/* Visited Booths breakdown */}
              <div className="w-full text-left">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Booths Visited:</div>
                <div className="space-y-1 max-h-[140px] overflow-y-auto pr-1">
                  {getAttendeeScans(selectedAttendee.id).length === 0 ? (
                    <p className="text-[11px] text-slate-500 italic">No booth visits recorded yet.</p>
                  ) : (
                    getAttendeeScans(selectedAttendee.id).map((s) => {
                      const booth = booths.find((b) => b.id.toLowerCase() === s.booth_id.toLowerCase());
                      return (
                        <div
                          key={s.id}
                          className="flex items-center justify-between p-1.5 rounded-lg bg-[#0F172A] border border-slate-800 text-[10px]"
                        >
                          <span className="font-medium text-slate-300 truncate max-w-[130px]">
                            {booth?.name.split(':')[0] || s.booth_id}
                          </span>
                          <span className="font-bold text-emerald-400">+{s.tier_points} pts</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
