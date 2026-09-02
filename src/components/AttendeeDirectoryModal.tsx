import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Attendee, Scan, Booth } from '../types';
import { X, Users, Award, Search, CheckCircle2, ChevronRight } from 'lucide-react';
import { useAttendees, useBooths } from '../hooks/useFirestore';
import { collection, query, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

interface AttendeeDirectoryModalProps {
  onClose: () => void;
}

export const AttendeeDirectoryModal: React.FC<AttendeeDirectoryModalProps> = ({ onClose }) => {
  const allAttendees = useAttendees();
  const { booths } = useBooths();

  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [scans, setScans] = useState<Scan[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAttendee, setSelectedAttendee] = useState<Attendee | null>(null);
  const [badgeQrUrl, setBadgeQrUrl] = useState<string>('');

  useEffect(() => {
    const attList = [...allAttendees].sort((a, b) => {
      if (b.total_points !== a.total_points) {
        return b.total_points - a.total_points;
      }
      const timeA = a.last_updated_timestamp ? new Date(a.last_updated_timestamp).getTime() : new Date(a.created_at).getTime();
      const timeB = b.last_updated_timestamp ? new Date(b.last_updated_timestamp).getTime() : new Date(b.created_at).getTime();
      if (timeA !== timeB) {
        return timeA - timeB; // Earliest timestamp wins
      }
      return a.name.localeCompare(b.name);
    });
    setAttendees(attList);
    if (!selectedAttendee && attList.length > 0) {
      setSelectedAttendee(attList[0]);
    }
  }, [allAttendees]);

  useEffect(() => {
    async function loadScans() {
      try {
        const q = query(collection(db, 'scans'));
        const snap = await getDocs(q);
        const s: Scan[] = [];
        snap.forEach(doc => s.push(doc.data() as Scan));
        setScans(s);
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'scans');
      }
    }
    loadScans();
  }, []);

  useEffect(() => {
    if (selectedAttendee) {
      QRCode.toDataURL(selectedAttendee.id, {
        width: 200,
        margin: 2,
        color: { dark: '#050508', light: '#ffffff' },
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        id="attendee-directory-modal"
        className="w-full max-w-3xl bg-[#050508] border border-white/10 rounded-3xl shadow-2xl p-6 sm:p-8 overflow-hidden max-h-[90vh] flex flex-col relative ring-1 ring-white/10 animate-in fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Attendee Scoreboard & Directory
              </h3>
              <p className="text-xs text-slate-400">
                Live points accumulated across all 10 event booths
              </p>
            </div>
          </div>

          <button
            id="close-directory-btn"
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="my-4 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="directory-search-input"
            type="text"
            placeholder="Search attendee by name, company, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950/80 border border-white/10 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-mono"
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
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-emerald-500/15 border-emerald-500/60 ring-1 ring-emerald-500/50 shadow-md'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs font-mono ${
                      idx === 0 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                      idx === 1 ? 'bg-slate-300/20 text-slate-200 border border-slate-400/40' :
                      idx === 2 ? 'bg-amber-700/20 text-amber-500 border border-amber-700/40' :
                      'bg-white/10 text-slate-400'
                    }`}>
                      #{idx + 1}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{att.name}</div>
                      <div className="text-[10px] text-slate-400">{att.company} • <span className="font-mono">{att.id}</span></div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-black text-emerald-400 font-mono">{att.total_points} PTS</div>
                    <div className="text-[10px] text-slate-500 font-mono">{attScans.length} booths</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Attendee Details & Badge (2 columns) */}
          {selectedAttendee && (
            <div className="md:col-span-2 bg-slate-950/80 border border-white/10 rounded-2xl p-5 flex flex-col items-center text-center">
              <div className="w-full flex items-center justify-between border-b border-white/10 pb-2 mb-3">
                <span className="text-xs font-bold text-slate-300">Badge & History</span>
                <span className="text-xs font-black text-emerald-400 font-mono bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/30">
                  {selectedAttendee.total_points} PTS
                </span>
              </div>

              {badgeQrUrl && (
                <div className="p-2.5 bg-white rounded-2xl shadow-md mb-3 border border-white/20">
                  <img src={badgeQrUrl} alt="Attendee QR" className="w-28 h-28 object-contain rounded-lg" />
                </div>
              )}

              <h4 className="text-sm font-bold text-white">{selectedAttendee.name}</h4>
              <span className="text-[11px] font-mono text-slate-400 mb-3">{selectedAttendee.id}</span>

              {/* Visited Booths breakdown */}
              <div className="w-full text-left">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Booths Visited:</div>
                <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                  {getAttendeeScans(selectedAttendee.id).length === 0 ? (
                    <p className="text-[11px] text-slate-500 italic">No booth visits recorded yet.</p>
                  ) : (
                    getAttendeeScans(selectedAttendee.id).map((s) => {
                      const booth = booths.find((b) => b.id.toLowerCase() === s.booth_id.toLowerCase());
                      return (
                        <div
                          key={s.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10 text-[10px]"
                        >
                          <span className="font-semibold text-slate-200 truncate max-w-[130px]">
                            {booth?.name.split(':')[0] || s.booth_id}
                          </span>
                          <span className="font-black text-emerald-400 font-mono">+{s.tier_points} PTS</span>
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
