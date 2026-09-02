import React, { useState, useMemo } from 'react';
import {
  Database,
  Users,
  Store,
  QrCode,
  ArrowLeft,
  Search,
  Plus,
  Minus,
  Edit2,
  Trash2,
  Lock,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  LogOut,
  Radio,
  FileSpreadsheet
} from 'lucide-react';
import { Attendee, Booth, Scan } from '../types';
import {
  useAttendees,
  useBooths,
  useAllScans,
  adminAdjustUserPoints,
  adminSetUserPoints,
  adminUpdateUserProfile,
  adminUpdateBoothDetails,
  adminDeleteUser,
  adminDeleteScan,
} from '../hooks/useFirestore';
import { TIERS_CONFIG } from '../utils/storage';
import { getActiveEventId, setActiveEventId } from '../utils/events';
import { isSuperAdminAuthenticated, setSuperAdminAuthenticated, verifySuperAdmin } from '../utils/adminAuth';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { GlobalNavigationHeader } from './GlobalNavigationHeader';

export function AdminDatabasePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(isSuperAdminAuthenticated());
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  const [activeTab, setActiveTab] = useState<'users' | 'booths' | 'scans'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentEvent, setCurrentEvent] = useState(getActiveEventId());

  // Edit User State
  const [editingUser, setEditingUser] = useState<Attendee | null>(null);
  const [editName, setEditName] = useState('');
  const [editQrId, setEditQrId] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editPoints, setEditPoints] = useState<number>(0);
  const [isSavingUser, setIsSavingUser] = useState(false);

  // Edit Booth State
  const [editingBooth, setEditingBooth] = useState<Booth | null>(null);
  const [editBoothName, setEditBoothName] = useState('');
  const [editBoothCategory, setEditBoothCategory] = useState('');
  const [editBoothLocation, setEditBoothLocation] = useState('');
  const [editBoothDescription, setEditBoothDescription] = useState('');
  const [isSavingBooth, setIsSavingBooth] = useState(false);

  // Quick Points Adjustment Modal State
  const [adjustingUser, setAdjustingUser] = useState<Attendee | null>(null);

  // Add New User Modal State
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserQrId, setNewUserQrId] = useState('');
  const [newUserCompany, setNewUserCompany] = useState('');
  const [newUserInitialPoints, setNewUserInitialPoints] = useState('0');

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const attendees = useAttendees();
  const { booths } = useBooths();
  const { scans, loading: scansLoading } = useAllScans();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifySuperAdmin(usernameInput, passwordInput)) {
      setIsAuthenticated(true);
      setSuperAdminAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('Invalid credentials. (Default: gdgbacolod26)');
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
    showToast(`Switched active event to: ${newEvent}`);
  };

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  // Filtered Users
  const filteredAttendees = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return attendees;
    return attendees.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q) ||
        (a.qr_code_id && a.qr_code_id.toLowerCase().includes(q)) ||
        (a.company && a.company.toLowerCase().includes(q))
    );
  }, [attendees, searchQuery]);

  // Unique scan count per booth computed from scans
  const boothStats = useMemo(() => {
    const stats: Record<string, { uniqueCount: number; totalScans: number }> = {};
    booths.forEach((b) => {
      stats[b.id] = { uniqueCount: 0, totalScans: 0 };
    });
    scans.forEach((s) => {
      if (!stats[s.booth_id]) {
        stats[s.booth_id] = { uniqueCount: 0, totalScans: 0 };
      }
      stats[s.booth_id].totalScans += 1;
    });

    // Compute unique visitors per booth
    const boothVisitors: Record<string, Set<string>> = {};
    scans.forEach((s) => {
      if (!boothVisitors[s.booth_id]) {
        boothVisitors[s.booth_id] = new Set();
      }
      boothVisitors[s.booth_id].add(s.attendee_id);
    });

    Object.keys(boothVisitors).forEach((bId) => {
      if (stats[bId]) {
        stats[bId].uniqueCount = boothVisitors[bId].size;
      }
    });

    return stats;
  }, [booths, scans]);

  // Filtered Booths
  const filteredBooths = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return booths;
    return booths.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.id.toLowerCase().includes(q) ||
        (b.category && b.category.toLowerCase().includes(q)) ||
        (b.location && b.location.toLowerCase().includes(q))
    );
  }, [booths, searchQuery]);

  // Filtered Scans
  const filteredScans = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return scans;
    return scans.filter(
      (s) =>
        s.attendee_id.toLowerCase().includes(q) ||
        s.booth_id.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q)
    );
  }, [scans, searchQuery]);

  const handleOpenEditBooth = (booth: Booth) => {
    setEditingBooth(booth);
    setEditBoothName(booth.name);
    setEditBoothCategory(booth.category || '');
    setEditBoothLocation(booth.location || '');
    setEditBoothDescription(booth.description || '');
  };

  const handleSaveBooth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBooth) return;
    if (!editBoothName.trim()) {
      alert('Booth name is required.');
      return;
    }
    setIsSavingBooth(true);
    try {
      await adminUpdateBoothDetails(editingBooth.id, {
        name: editBoothName,
        category: editBoothCategory,
        location: editBoothLocation,
        description: editBoothDescription,
      });
      showToast(`Booth "${editingBooth.id}" details updated successfully!`);
      setEditingBooth(null);
    } catch (err: any) {
      alert('Error updating booth details: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSavingBooth(false);
    }
  };

  const handleOpenEditUser = (attendee: Attendee) => {
    setEditingUser(attendee);
    setEditName(attendee.name);
    setEditQrId(attendee.qr_code_id || attendee.id);
    setEditCompany(attendee.company || '');
    setEditPoints(attendee.total_points);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSavingUser(true);
    try {
      await adminUpdateUserProfile(editingUser.id, {
        name: editName,
        qr_code_id: editQrId,
        company: editCompany,
      });
      if (editPoints !== editingUser.total_points) {
        await adminSetUserPoints(editingUser.id, Number(editPoints));
      }
      showToast(`Updated profile for ${editName}`);
      setEditingUser(null);
    } catch (err: any) {
      alert('Error updating user: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleDirectPointDelta = async (attendeeId: string, delta: number) => {
    try {
      await adminAdjustUserPoints(attendeeId, delta);
      showToast(`${delta > 0 ? `+${delta}` : delta} points applied to ${attendeeId}`);
      if (adjustingUser) setAdjustingUser(null);
    } catch (err: any) {
      alert('Error adjusting points: ' + (err.message || 'Unknown error'));
    }
  };

  const handleDeleteUser = async (attendee: Attendee) => {
    if (
      !window.confirm(
        `Are you sure you want to delete user "${attendee.name}" (${attendee.id}) and all their scan records?`
      )
    ) {
      return;
    }
    try {
      await adminDeleteUser(attendee.id);
      showToast(`User ${attendee.name} deleted.`);
    } catch (err: any) {
      alert('Error deleting user: ' + (err.message || 'Unknown error'));
    }
  };

  const handleDeleteScan = async (scan: Scan) => {
    if (
      !window.confirm(
        `Delete scan at ${scan.booth_id} for ${scan.attendee_id}? This will deduct ${
          scan.points_awarded || scan.tier_points
        } points from the user.`
      )
    ) {
      return;
    }
    try {
      await adminDeleteScan(scan.id, scan.attendee_id, scan.points_awarded || scan.tier_points);
      showToast(`Scan deleted and points adjusted.`);
    } catch (err: any) {
      alert('Error deleting scan: ' + (err.message || 'Unknown error'));
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = newUserQrId.trim() || `QR-${Date.now().toString(36).toUpperCase()}`;
    const cleanName = newUserName.trim() || `Attendee ${cleanId}`;
    const pts = parseInt(newUserInitialPoints, 10) || 0;

    try {
      const activeEventId = getActiveEventId();
      const docAttendeeId = `${activeEventId}_${cleanId}`;
      const attendeeRef = doc(db, 'attendees', docAttendeeId);
      const now = new Date().toISOString();

      const newAtt: Attendee = {
        id: cleanId,
        qr_code_id: cleanId,
        name: cleanName,
        company: newUserCompany.trim() || 'Event Guest',
        total_points: pts,
        created_at: now,
        last_updated_timestamp: now,
        event_id: activeEventId,
      };

      await writeBatch(db).set(attendeeRef, newAtt).commit();
      showToast(`Created attendee: ${cleanName}`);
      setIsAddingUser(false);
      setNewUserName('');
      setNewUserQrId('');
      setNewUserCompany('');
      setNewUserInitialPoints('0');
    } catch (err: any) {
      alert('Error creating attendee: ' + (err.message || 'Unknown error'));
    }
  };

  // Auth screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#050508] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-emerald-500 selection:text-slate-950">
        <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-[#34A853]/15 blur-[140px] rounded-full animate-pulse pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#4285F4]/10 blur-[130px] rounded-full animate-pulse pointer-events-none" style={{ animationDelay: '2s' }} />

        <div className="w-full max-w-md bg-white/5 backdrop-blur-[32px] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden ring-1 ring-white/10">
          <button
            type="button"
            onClick={() => navigateTo('/main-admin-access')}
            className="absolute top-6 left-6 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors cursor-pointer"
            title="Back to Admin Center"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex flex-col items-center mt-4 space-y-5">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/30 text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.25)]">
              <Database className="w-8 h-8" />
            </div>

            <div className="text-center space-y-1">
              <span className="text-[10px] font-black tracking-[0.2em] text-emerald-400 uppercase">
                DEVFEST BACOLOD 2026
              </span>
              <h2 className="text-2xl font-black text-white tracking-tight">Database Manager</h2>
              <p className="text-slate-400 text-xs">Enter credentials to unlock live Firestore CRUD operations.</p>
            </div>

            <form onSubmit={handleLogin} className="w-full space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Super Admin ID</label>
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="e.g. gdgbacolod26"
                  className="w-full bg-slate-950/80 border border-white/10 text-slate-100 rounded-2xl py-3.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-mono placeholder:text-slate-600"
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
                  className="w-full bg-slate-950/80 border border-white/10 text-slate-100 rounded-2xl py-3.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-mono placeholder:text-slate-600"
                  required
                />
              </div>

              {loginError && (
                <div className="flex items-center gap-2 text-rose-400 text-xs font-medium bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black py-4 px-5 rounded-2xl transition-all shadow-lg shadow-emerald-950/50 mt-2 cursor-pointer uppercase tracking-wider text-xs"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>UNLOCK DATABASE SUITE</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050508] text-slate-100 flex flex-col relative overflow-hidden font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Background Ambient Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-[#34A853]/10 blur-[130px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[35%] h-[35%] bg-[#4285F4]/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#050508]/90 text-emerald-300 border border-emerald-500/40 px-5 py-3.5 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-3 text-xs font-bold animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Global Navigation Header */}
      <GlobalNavigationHeader
        currentRoute="admin-database"
        subtitle="Firestore Database Manager"
        rightActions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-2.5 py-1.5 shadow-sm">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
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
              className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-colors cursor-pointer text-xs font-bold flex items-center gap-1"
              title="Lock Database Access"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lock DB</span>
            </button>
          </div>
        }
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8 space-y-6 relative z-10">
        
        {/* Metric Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/5 backdrop-blur-[24px] border border-white/10 rounded-3xl p-5 ring-1 ring-white/10 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Participants</span>
              <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono">{attendees.length}</div>
            <p className="text-[11px] text-slate-400 mt-1">Users in {currentEvent}</p>
          </div>

          <div className="bg-white/5 backdrop-blur-[24px] border border-white/10 rounded-3xl p-5 ring-1 ring-white/10 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Configured Booths</span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Store className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono">{booths.length}</div>
            <p className="text-[11px] text-slate-400 mt-1">Active booth stations</p>
          </div>

          <div className="bg-white/5 backdrop-blur-[24px] border border-white/10 rounded-3xl p-5 ring-1 ring-white/10 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Verified QR Scans</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <QrCode className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono">{scans.length}</div>
            <p className="text-[11px] text-slate-400 mt-1">Total visits recorded</p>
          </div>
        </div>

        {/* Toolbar: Navigation Tabs & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white/5 backdrop-blur-[24px] p-3 rounded-2xl border border-white/10 ring-1 ring-white/10">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => {
                setActiveTab('users');
                setSearchQuery('');
              }}
              className={`px-3.5 py-2 rounded-lg font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Attendees ({attendees.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('booths');
                setSearchQuery('');
              }}
              className={`px-3.5 py-2 rounded-lg font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'booths'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Booths & Tiers ({booths.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('scans');
                setSearchQuery('');
              }}
              className={`px-3.5 py-2 rounded-lg font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'scans'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Scan Logs ({scans.length})</span>
            </button>
          </div>

          {/* Search & Add button */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${activeTab}...`}
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-mono"
              />
            </div>

            {activeTab === 'users' && (
              <button
                type="button"
                onClick={() => setIsAddingUser(true)}
                className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center gap-1.5 transition-all shrink-0 shadow-md cursor-pointer uppercase tracking-wider"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Attendee</span>
              </button>
            )}
          </div>
        </div>

        {/* TAB 1: USERS TABLE */}
        {activeTab === 'users' && (
          <div className="bg-white/5 backdrop-blur-[32px] border border-white/10 rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-white/5 text-slate-400 uppercase tracking-wider font-bold border-b border-white/10 text-[11px]">
                  <tr>
                    <th className="py-4 px-5">User / Name</th>
                    <th className="py-4 px-5">QR Badge ID</th>
                    <th className="py-4 px-5">Affiliation / Org</th>
                    <th className="py-4 px-5 text-center">Score</th>
                    <th className="py-4 px-5">Last Activity</th>
                    <th className="py-4 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredAttendees.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-500">
                        No attendees found matching "{searchQuery}".
                      </td>
                    </tr>
                  ) : (
                    filteredAttendees.map((att) => (
                      <tr key={att.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-4 px-5 font-bold text-white">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 font-black flex items-center justify-center text-xs border border-sky-500/30">
                              {att.name.charAt(0).toUpperCase()}
                            </div>
                            <span>{att.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-5 font-mono text-slate-400">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-950/80 border border-white/10 text-[11px] font-semibold text-slate-300">
                            {att.qr_code_id || att.id}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-slate-300 font-medium">{att.company || '—'}</td>
                        <td className="py-4 px-5 text-center">
                          <span className="font-mono font-black text-sm text-sky-400 bg-sky-500/10 px-3 py-1 rounded-xl border border-sky-500/30">
                            {att.total_points.toLocaleString()} PTS
                          </span>
                        </td>
                        <td className="py-4 px-5 text-slate-500 text-[11px] font-mono">
                          {att.last_updated_timestamp
                            ? new Date(att.last_updated_timestamp).toLocaleTimeString()
                            : new Date(att.created_at).toLocaleTimeString()}
                        </td>
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setAdjustingUser(att)}
                              className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-colors cursor-pointer"
                              title="Add / Deduct Points"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenEditUser(att)}
                              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition-colors cursor-pointer"
                              title="Edit Profile"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteUser(att)}
                              className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors cursor-pointer"
                              title="Delete User"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: BOOTHS & TIERS TABLE */}
        {activeTab === 'booths' && (
          <div className="space-y-6">
            {/* Active Tier Policy Card */}
            <div className="bg-white/5 backdrop-blur-[32px] border border-white/10 rounded-3xl p-6 space-y-4 ring-1 ring-white/10 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <Layers className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">Event Point Tier Allocation Matrix</h3>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">Official Rule Configuration</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {TIERS_CONFIG.map((tier) => (
                  <div
                    key={tier.tierNumber}
                    className="bg-slate-950/70 border border-white/10 rounded-2xl p-4 space-y-1 relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{tier.label}</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                        {tier.points} PTS
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Visitors {tier.minVisits}
                      {tier.maxVisits ? ` – ${tier.maxVisits}` : '+'}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Booths Directory List */}
            <div className="bg-white/5 backdrop-blur-[32px] border border-white/10 rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-white/5 text-slate-400 uppercase tracking-wider font-bold border-b border-white/10 text-[11px]">
                    <tr>
                      <th className="py-4 px-5">Booth ID</th>
                      <th className="py-4 px-5">Booth Name</th>
                      <th className="py-4 px-5">Category & Location</th>
                      <th className="py-4 px-5 text-center">Unique Scans</th>
                      <th className="py-4 px-5 text-center">Current Tier</th>
                      <th className="py-4 px-5 text-center">Next Reward</th>
                      <th className="py-4 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredBooths.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-slate-500">
                          No booths found matching "{searchQuery}".
                        </td>
                      </tr>
                    ) : (
                      filteredBooths.map((b) => {
                        const stat = boothStats[b.id] || { uniqueCount: 0, totalScans: 0 };
                        const nextRank = stat.uniqueCount + 1;
                        const nextTier =
                          nextRank <= 10
                            ? TIERS_CONFIG[0]
                            : nextRank <= 50
                            ? TIERS_CONFIG[1]
                            : nextRank <= 90
                            ? TIERS_CONFIG[2]
                            : TIERS_CONFIG[3];

                        return (
                          <tr key={b.id} className="hover:bg-white/5 transition-colors">
                            <td className="py-4 px-5 font-mono font-bold text-amber-400">{b.id}</td>
                            <td className="py-4 px-5 font-bold text-white">{b.name}</td>
                            <td className="py-4 px-5 text-slate-300">
                              <div className="font-semibold text-white">{b.category || 'General'}</div>
                              <div className="text-[10px] text-slate-400">{b.location || 'Exhibition Hall'}</div>
                            </td>
                            <td className="py-4 px-5 text-center">
                              <span className="font-mono font-black text-sm text-slate-200">
                                {stat.uniqueCount} visitors
                              </span>
                            </td>
                            <td className="py-4 px-5 text-center">
                              <span className="px-3 py-1 rounded-xl text-[11px] font-bold bg-slate-950/80 border border-white/10 text-slate-200">
                                Tier {nextTier.tierNumber}
                              </span>
                            </td>
                            <td className="py-4 px-5 text-center font-mono font-black text-amber-400">
                              +{nextTier.points} PTS
                            </td>
                            <td className="py-4 px-5 text-right">
                              <button
                                id={`edit-booth-${b.id.toLowerCase()}-btn`}
                                type="button"
                                onClick={() => handleOpenEditBooth(b)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-bold transition-all cursor-pointer"
                                title={`Edit ${b.name}`}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SCANS TABLE */}
        {activeTab === 'scans' && (
          <div className="bg-white/5 backdrop-blur-[32px] border border-white/10 rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-white/5 text-slate-400 uppercase tracking-wider font-bold border-b border-white/10 text-[11px]">
                  <tr>
                    <th className="py-4 px-5">Scan Record ID</th>
                    <th className="py-4 px-5">Attendee ID</th>
                    <th className="py-4 px-5">Booth Station</th>
                    <th className="py-4 px-5 text-center">Visitor Rank</th>
                    <th className="py-4 px-5 text-center">Points Awarded</th>
                    <th className="py-4 px-5">Timestamp</th>
                    <th className="py-4 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredScans.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-500">
                        No scan logs recorded yet for this event.
                      </td>
                    </tr>
                  ) : (
                    filteredScans.map((s) => (
                      <tr key={s.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-4 px-5 font-mono text-[11px] text-slate-500">{s.id}</td>
                        <td className="py-4 px-5 font-bold text-white">{s.attendee_id}</td>
                        <td className="py-4 px-5 font-mono font-bold text-amber-400">{s.booth_id}</td>
                        <td className="py-4 px-5 text-center font-mono font-bold text-slate-300">
                          #{s.visitor_rank || '—'}
                        </td>
                        <td className="py-4 px-5 text-center font-mono font-black text-emerald-400">
                          +{s.points_awarded || s.tier_points} PTS
                        </td>
                        <td className="py-4 px-5 text-slate-400 text-[11px] font-mono">
                          {new Date(s.timestamp).toLocaleString()}
                        </td>
                        <td className="py-4 px-5 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteScan(s)}
                            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors cursor-pointer"
                            title="Delete Scan Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: EDIT USER PROFILE */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#050508] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in ring-1 ring-white/10">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-sky-400" />
                <span>Edit User Profile</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 uppercase tracking-wider">Attendee Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-950/80 border border-white/10 rounded-2xl p-3.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 uppercase tracking-wider">QR Badge ID</label>
                <input
                  type="text"
                  value={editQrId}
                  onChange={(e) => setEditQrId(e.target.value)}
                  className="w-full bg-slate-950/80 border border-white/10 rounded-2xl p-3.5 text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 uppercase tracking-wider">Company / Affiliation</label>
                <input
                  type="text"
                  value={editCompany}
                  onChange={(e) => setEditCompany(e.target.value)}
                  className="w-full bg-slate-950/80 border border-white/10 rounded-2xl p-3.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 uppercase tracking-wider">Total Score (Direct Points Override)</label>
                <input
                  type="number"
                  value={editPoints}
                  onChange={(e) => setEditPoints(Number(e.target.value))}
                  className="w-full bg-slate-950/80 border border-white/10 rounded-2xl p-3.5 text-slate-100 font-mono font-black text-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold border border-white/10 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingUser}
                  className="flex-1 py-3 px-4 rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-colors uppercase tracking-wider"
                >
                  {isSavingUser ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: QUICK POINT ADJUSTMENT */}
      {adjustingUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#050508] border border-white/10 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-in fade-in ring-1 ring-white/10">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>Adjust Points: {adjustingUser.name}</span>
              </h3>
              <button
                type="button"
                onClick={() => setAdjustingUser(null)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="text-center py-2">
              <span className="text-xs text-slate-400">Current Score</span>
              <div className="text-3xl font-black font-mono text-sky-400 mt-1">
                {adjustingUser.total_points} PTS
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Quick Adjustment Options</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleDirectPointDelta(adjustingUser.id, 100)}
                  className="py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-black font-mono cursor-pointer"
                >
                  +100 PTS
                </button>
                <button
                  type="button"
                  onClick={() => handleDirectPointDelta(adjustingUser.id, 50)}
                  className="py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-black font-mono cursor-pointer"
                >
                  +50 PTS
                </button>
                <button
                  type="button"
                  onClick={() => handleDirectPointDelta(adjustingUser.id, 10)}
                  className="py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-black font-mono cursor-pointer"
                >
                  +10 PTS
                </button>
                <button
                  type="button"
                  onClick={() => handleDirectPointDelta(adjustingUser.id, -100)}
                  className="py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-black font-mono cursor-pointer"
                >
                  -100 PTS
                </button>
                <button
                  type="button"
                  onClick={() => handleDirectPointDelta(adjustingUser.id, -50)}
                  className="py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-black font-mono cursor-pointer"
                >
                  -50 PTS
                </button>
                <button
                  type="button"
                  onClick={() => handleDirectPointDelta(adjustingUser.id, -10)}
                  className="py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-black font-mono cursor-pointer"
                >
                  -10 PTS
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setAdjustingUser(null)}
                className="w-full py-3 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold rounded-2xl border border-white/10 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD NEW USER */}
      {isAddingUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#050508] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in ring-1 ring-white/10">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>Register New Attendee</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddingUser(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 uppercase tracking-wider">Attendee Full Name</label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="e.g. Jane Doe"
                  className="w-full bg-slate-950/80 border border-white/10 rounded-2xl p-3.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 uppercase tracking-wider">QR Code ID</label>
                <input
                  type="text"
                  value={newUserQrId}
                  onChange={(e) => setNewUserQrId(e.target.value)}
                  placeholder="e.g. QR-attendee99"
                  className="w-full bg-slate-950/80 border border-white/10 rounded-2xl p-3.5 text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 uppercase tracking-wider">Company / Affiliation</label>
                <input
                  type="text"
                  value={newUserCompany}
                  onChange={(e) => setNewUserCompany(e.target.value)}
                  placeholder="e.g. Tech Studio"
                  className="w-full bg-slate-950/80 border border-white/10 rounded-2xl p-3.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 uppercase tracking-wider">Initial Points</label>
                <input
                  type="number"
                  value={newUserInitialPoints}
                  onChange={(e) => setNewUserInitialPoints(e.target.value)}
                  className="w-full bg-slate-950/80 border border-white/10 rounded-2xl p-3.5 text-slate-100 font-mono font-black text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddingUser(false)}
                  className="flex-1 py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold border border-white/10 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black flex items-center justify-center gap-1.5 shadow-md cursor-pointer uppercase tracking-wider"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT BOOTH DETAILS */}
      {editingBooth && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#050508] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in ring-1 ring-white/10">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-mono font-bold text-xs shadow-inner">
                  {editingBooth.id}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Edit2 className="w-4 h-4 text-amber-400" />
                    <span>Edit Booth Details</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Update configuration for {editingBooth.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingBooth(null)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1 rounded-lg hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBooth} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Booth Name *</span>
                  <span className="text-[10px] text-slate-500 font-normal">e.g. Google Cloud Booth</span>
                </label>
                <input
                  type="text"
                  value={editBoothName}
                  onChange={(e) => setEditBoothName(e.target.value)}
                  placeholder="e.g. Google Cloud Booth"
                  className="w-full bg-slate-950/80 border border-white/10 rounded-2xl p-3.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm font-medium"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Category</span>
                  <span className="text-[10px] text-slate-500 font-normal">e.g. Sponsor, Codelab, Gaming</span>
                </label>
                <input
                  type="text"
                  value={editBoothCategory}
                  onChange={(e) => setEditBoothCategory(e.target.value)}
                  placeholder="e.g. Sponsor, Codelab, Gaming, AI & Robotics"
                  className="w-full bg-slate-950/80 border border-white/10 rounded-2xl p-3.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm"
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['Sponsor', 'Codelab', 'Gaming', 'AI / ML', 'Cloud & DevOps', 'Security', 'Hardware'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setEditBoothCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] border transition-colors cursor-pointer font-medium ${
                        editBoothCategory === cat
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-white/5 text-slate-400 border-white/10 hover:border-white/20 hover:text-slate-300'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Location</span>
                  <span className="text-[10px] text-slate-500 font-normal">e.g. Hall A - Table 4, 2nd Floor Annex</span>
                </label>
                <input
                  type="text"
                  value={editBoothLocation}
                  onChange={(e) => setEditBoothLocation(e.target.value)}
                  placeholder="e.g. Hall A - Table 4, 2nd Floor Annex"
                  className="w-full bg-slate-950/80 border border-white/10 rounded-2xl p-3.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Description / Overview</span>
                  <span className="text-[10px] text-slate-500 font-normal">Optional</span>
                </label>
                <textarea
                  rows={3}
                  value={editBoothDescription}
                  onChange={(e) => setEditBoothDescription(e.target.value)}
                  placeholder="Brief summary of activities, demos, or instructions at this booth..."
                  className="w-full bg-slate-950/80 border border-white/10 rounded-2xl p-3.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-xs"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingBooth(null)}
                  className="flex-1 py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold border border-white/10 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingBooth}
                  className="flex-1 py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-colors uppercase tracking-wider"
                >
                  {isSavingBooth ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
