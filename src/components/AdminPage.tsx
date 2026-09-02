import React, { useState } from 'react';
import {
  ArrowLeft,
  ShieldCheck,
  Download,
  Trash2,
  ShieldAlert,
  Settings,
  Calendar,
  Database,
  ArrowRight,
  Sparkles,
  Trophy,
  Layers,
  FileSpreadsheet,
  AlertTriangle,
  LogOut,
  Users,
  Activity,
  ScanLine,
  Lock
} from 'lucide-react';
import { collection, query, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { getActiveEventId, setActiveEventId } from '../utils/events';
import { useAttendees, useAllScans } from '../hooks/useFirestore';
import { isSuperAdminAuthenticated, setSuperAdminAuthenticated, verifySuperAdmin } from '../utils/adminAuth';
import { GlobalNavigationHeader } from './GlobalNavigationHeader';

export function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(isSuperAdminAuthenticated());
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [error, setError] = useState('');
  const [currentEvent, setCurrentEvent] = useState(getActiveEventId());
  const [resetting, setResetting] = useState(false);

  const attendees = useAttendees();
  const { scans } = useAllScans();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifySuperAdmin(usernameInput, passwordInput)) {
      setIsAuthenticated(true);
      setSuperAdminAuthenticated(true);
      setError('');
    } else {
      setError('Invalid username or master password. (Default: gdgbacolod26)');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setSuperAdminAuthenticated(false);
  };

  const handleEventChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newEvent = e.target.value;
    setCurrentEvent(newEvent);
    setActiveEventId(newEvent);
    import('../hooks/useFirestore').then((mod) => mod.seedBooths());
  };

  const handleResetEventData = async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete all Scans and Attendees for event "${currentEvent}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    setResetting(true);
    try {
      const batch = writeBatch(db);

      // Delete attendees for this event
      const attQ = query(collection(db, 'attendees'));
      const attSnap = await getDocs(attQ);
      attSnap.forEach((d) => {
        const data = d.data();
        if (!data.event_id || data.event_id === currentEvent) {
          batch.delete(doc(db, 'attendees', d.id));
        }
      });

      // Delete scans for this event
      const scansQ = query(collection(db, 'scans'));
      const scansSnap = await getDocs(scansQ);
      scansSnap.forEach((d) => {
        const data = d.data();
        if (!data.event_id || data.event_id === currentEvent) {
          batch.delete(doc(db, 'scans', d.id));
        }
      });

      await batch.commit();
      alert('Event data reset successfully.');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'reset-event');
    } finally {
      setResetting(false);
    }
  };

  const handleExportAttendeesCSV = () => {
    if (attendees.length === 0) {
      alert('No attendees to export for this event.');
      return;
    }
    const headers = ['ID', 'QR Code ID', 'Name', 'Company', 'Total Points', 'Created At', 'Last Updated'];
    const rows = attendees.map((a) => [
      a.id,
      `"${a.qr_code_id || a.id}"`,
      `"${a.name}"`,
      `"${a.company || ''}"`,
      a.total_points,
      a.created_at,
      a.last_updated_timestamp || a.created_at,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `attendees_leaderboard_${currentEvent}_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportScanLogsCSV = () => {
    if (scans.length === 0) {
      alert('No scan logs recorded for this event.');
      return;
    }
    const headers = ['Scan ID', 'Attendee ID', 'Booth ID', 'Visitor Rank', 'Points Awarded', 'Timestamp', 'Event ID'];
    const rows = scans.map((s) => [
      s.id,
      `"${s.attendee_id}"`,
      `"${s.booth_id}"`,
      s.visitor_rank || '',
      s.points_awarded || s.tier_points,
      s.timestamp,
      `"${s.event_id || currentEvent}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `scan_logs_${currentEvent}_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#050508] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-rose-500 selection:text-white">
        {/* Background Ambient Glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-[#EA4335]/15 blur-[140px] rounded-full animate-pulse pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#4285F4]/10 blur-[130px] rounded-full animate-pulse pointer-events-none" style={{ animationDelay: '2s' }} />

        <div className="w-full max-w-md bg-white/5 backdrop-blur-[32px] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden ring-1 ring-white/10">
          
          <button
            type="button"
            onClick={() => navigateTo('/booth-portal')}
            className="absolute top-6 left-6 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors cursor-pointer"
            title="Back to Booth Portal"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex flex-col items-center mt-4 space-y-5">
            <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center border border-rose-500/30 text-rose-400 shadow-[0_0_25px_rgba(244,63,94,0.25)]">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="text-center space-y-1">
              <span className="text-[10px] font-black tracking-[0.2em] text-rose-400 uppercase">
                DEVFEST BACOLOD 2026
              </span>
              <h2 className="text-2xl font-black text-white tracking-tight">Super Admin Portal</h2>
              <p className="text-slate-400 text-xs">Enter administrative credentials to unlock system controls.</p>
            </div>

            <form onSubmit={handleLogin} className="w-full space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Super Admin ID</label>
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="e.g. gdgbacolod26"
                  className="w-full bg-slate-950/80 border border-white/10 text-slate-100 rounded-2xl py-3.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all font-mono placeholder:text-slate-600"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Master Password</label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Master key..."
                  className="w-full bg-slate-950/80 border border-white/10 text-slate-100 rounded-2xl py-3.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all font-mono placeholder:text-slate-600"
                  required
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-rose-400 text-xs font-medium bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white font-bold py-4 px-5 rounded-2xl transition-all shadow-lg shadow-rose-950/50 mt-2 cursor-pointer uppercase tracking-wider text-xs"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>AUTHENTICATE MASTER ACCESS</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050508] text-slate-100 flex flex-col relative overflow-hidden font-sans selection:bg-rose-500 selection:text-white">
      {/* Background Ambient Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-[#EA4335]/10 blur-[130px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[35%] h-[35%] bg-[#4285F4]/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Global Navigation Header */}
      <GlobalNavigationHeader
        currentRoute="main-admin-access"
        subtitle="Super Admin Control Panel"
        rightActions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-2.5 py-1.5 shadow-sm">
              <Calendar className="w-3.5 h-3.5 text-rose-400" />
              <select
                value={currentEvent}
                onChange={handleEventChange}
                className="bg-transparent text-slate-200 focus:outline-none text-xs cursor-pointer font-medium"
              >
                <option value="devfest-bacolod-2026" className="bg-slate-900">
                  Devfest Bacolod 2026
                </option>
                <option value="simulation-event" className="bg-slate-900">
                  Simulation Event
                </option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-colors cursor-pointer"
              title="Logout Super Admin"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        }
      />

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 md:p-8 space-y-6 relative z-10">
        
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/5 backdrop-blur-[24px] border border-white/10 rounded-3xl p-5 ring-1 ring-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Registered</span>
              <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono">{attendees.length}</div>
            <p className="text-[11px] text-slate-400 mt-1">Attendees in active event</p>
          </div>

          <div className="bg-white/5 backdrop-blur-[24px] border border-white/10 rounded-3xl p-5 ring-1 ring-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Scans Logged</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ScanLine className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono">{scans.length}</div>
            <p className="text-[11px] text-slate-400 mt-1">Verified QR scans recorded</p>
          </div>

          <div className="bg-white/5 backdrop-blur-[24px] border border-white/10 rounded-3xl p-5 ring-1 ring-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">System Security</span>
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-sm font-bold text-rose-300 flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
              Super Admin Active
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Direct database access unlocked</p>
          </div>
        </div>

        {/* Database Suite Access Banner */}
        <div className="bg-gradient-to-r from-emerald-500/10 via-white/5 to-white/5 backdrop-blur-[32px] border border-emerald-500/30 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ring-1 ring-emerald-500/20 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)] shrink-0">
              <Database className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">LIVE CRUD ENGINE</span>
              <h2 className="text-lg font-extrabold text-white">Database Manager & Editor</h2>
              <p className="text-xs text-slate-400 max-w-lg mt-0.5">
                Adjust points, add or edit participants, modify booth tier rules, and inspect raw scan logs in real-time.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigateTo('/admin-database')}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-950/50 cursor-pointer shrink-0 uppercase tracking-wider"
          >
            <span>Open Database Manager</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Master Controls Container */}
        <div className="bg-white/5 backdrop-blur-[32px] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 ring-1 ring-white/10 shadow-2xl">
          <div className="flex items-center gap-3 border-b border-white/10 pb-5">
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Data Export & System Controls</h2>
              <p className="text-xs text-slate-400">
                Official records export and disaster recovery tools for <span className="font-mono text-slate-200">{currentEvent}</span>.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Export Attendees CSV */}
            <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2 text-white">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <h3 className="font-bold text-sm">Export Attendee Leaderboard CSV</h3>
                </div>
                <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                  Download registered attendee standings and point totals for {currentEvent}. ({attendees.length} records)
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportAttendeesCSV}
                className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white text-xs font-bold py-3 px-4 rounded-xl transition-all border border-white/10 cursor-pointer"
              >
                <Download className="w-4 h-4 text-sky-400" />
                <span>Export Leaderboard CSV</span>
              </button>
            </div>

            {/* Export Scan Logs CSV */}
            <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2 text-white">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-bold text-sm">Export Verified Scan Logs CSV</h3>
                </div>
                <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                  Download raw timestamped scan events, visitor ranks, and tier point allocations. ({scans.length} events)
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportScanLogsCSV}
                className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white text-xs font-bold py-3 px-4 rounded-xl transition-all border border-white/10 cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Export Scan Logs CSV</span>
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-rose-950/20 border border-rose-500/30 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-rose-400 text-sm mb-1 flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                <span>Event Data Reset</span>
              </h3>
              <p className="text-xs text-rose-300/70 max-w-md">
                Permanently purge all scan logs and attendee scores recorded for {currentEvent}.
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetEventData}
              disabled={resetting}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold py-3 px-5 rounded-xl transition-all shadow-md cursor-pointer shrink-0 uppercase tracking-wider"
            >
              <Trash2 className="w-4 h-4" />
              <span>{resetting ? 'PURGING DATA...' : 'RESET EVENT DATA'}</span>
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}
