import React, { useState } from 'react';
import { ArrowLeft, ShieldCheck, Download, Trash2, ShieldAlert, Settings, Calendar } from 'lucide-react';
import { collection, query, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { getActiveEventId, setActiveEventId } from '../utils/events';
import { useAttendees } from '../hooks/useFirestore';

const ADMIN_PASSWORD = 'kentouchth!$@2026';

export function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [error, setError] = useState('');
  const [currentEvent, setCurrentEvent] = useState(getActiveEventId());
  
  // Only fetched if authenticated, but hooks must be called at top level
  // So we just rely on eventId in the UI to guide them.
  const attendees = useAttendees();
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Invalid master password.');
    }
  };

  const handleEventChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newEvent = e.target.value;
    if (isAuthenticated) {
      setIsAuthenticated(false);
      setPasswordInput('');
    }
    setCurrentEvent(newEvent);
    setActiveEventId(newEvent);
    
    // Seed booths for the new event if they don't exist
    import('../hooks/useFirestore').then(mod => mod.seedBooths());
  };

  const handleResetEventData = async () => {
    if (!window.confirm(`Are you sure you want to delete all Scans and Attendees for event "${currentEvent}"? This cannot be undone.`)) {
      return;
    }
    
    try {
      const batch = writeBatch(db);
      
      // Delete attendees for this event
      const attQ = query(collection(db, 'attendees'));
      const attSnap = await getDocs(attQ);
      attSnap.forEach(d => {
        const data = d.data();
        if (!data.event_id || data.event_id === currentEvent) {
          batch.delete(doc(db, 'attendees', d.id));
        }
      });
      
      // Delete scans for this event
      const scansQ = query(collection(db, 'scans'));
      const scansSnap = await getDocs(scansQ);
      scansSnap.forEach(d => {
        const data = d.data();
        if (!data.event_id || data.event_id === currentEvent) {
          batch.delete(doc(db, 'scans', d.id));
        }
      });
      
      await batch.commit();
      alert('Event data reset successfully.');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'reset-event');
    }
  };

  const handleExportCSV = () => {
    if (attendees.length === 0) {
      alert('No attendees to export for this event.');
      return;
    }
    const headers = ['ID', 'Name', 'Company', 'Total Points', 'Created At', 'Last Updated'];
    const rows = attendees.map(a => [
      a.id, 
      `"${a.name}"`, 
      `"${a.company || ''}"`, 
      a.total_points, 
      a.created_at,
      a.last_updated_timestamp || a.created_at
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `event_export_${currentEvent}_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBack = () => {
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex items-center justify-center p-4 selection:bg-sky-500 selection:text-white">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <button 
            onClick={handleBack}
            className="absolute top-6 left-6 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          
          <div className="absolute top-0 right-0 p-8 bg-rose-500/10 blur-[60px] w-32 h-32 rounded-full pointer-events-none" />
          
          <div className="flex flex-col items-center mt-6 space-y-6">
            <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center shadow-inner">
              <ShieldAlert className="w-8 h-8 text-rose-400" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold text-white">Super Admin System</h2>
              <p className="text-slate-400 text-sm">Enter master password to access event controls.</p>
            </div>
            
            <form onSubmit={handleLogin} className="w-full space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Selected Event</label>
                <select 
                  value={currentEvent}
                  onChange={handleEventChange}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all appearance-none"
                >
                  <option value="devfest-bacolod-2026">Devfest Bacolod 2026</option>
                  <option value="simulation-event">Simulation Event</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Master Password</label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter password..."
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                />
              </div>

              {error && <p className="text-rose-400 text-xs font-medium text-center">{error}</p>}
              
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-md mt-4"
              >
                <ShieldCheck className="w-4 h-4" />
                Authenticate
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col selection:bg-sky-500 selection:text-white">
      <header className="sticky top-0 z-30 bg-[#0F172A]/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 sm:px-6 shadow-xl">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <ArrowLeft className="w-4 h-4 text-sky-400" />
              <span>Exit Admin</span>
            </button>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-rose-400" />
              <h1 className="text-base sm:text-lg font-bold text-slate-100">Super Admin Center</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <select 
              value={currentEvent}
              onChange={handleEventChange}
              className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg py-1.5 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500"
            >
              <option value="devfest-bacolod-2026">Devfest Bacolod 2026</option>
              <option value="simulation-event">Simulation Event</option>
            </select>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 md:p-8 space-y-6">
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
            <Settings className="w-6 h-6 text-slate-400" />
            <div>
              <h2 className="text-lg font-bold text-white">Event Controls: {currentEvent}</h2>
              <p className="text-xs text-slate-400">Manage data and settings for the currently selected event.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#020617] border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-slate-200 text-sm mb-1">Export Data</h3>
                <p className="text-xs text-slate-500 mb-4">Download a CSV of all attendees and their points for {currentEvent}. ({attendees.length} total attendees)</p>
              </div>
              <button
                onClick={handleExportCSV}
                className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold py-2 px-4 rounded-lg transition-colors border border-slate-700"
              >
                <Download className="w-4 h-4" />
                Export Leaderboard CSV
              </button>
            </div>

            <div className="bg-rose-950/20 border border-rose-900/30 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-rose-400 text-sm mb-1">Danger Zone</h3>
                <p className="text-xs text-rose-500/70 mb-4">Reset all scans and attendee data for {currentEvent}. This action is irreversible.</p>
              </div>
              <button
                onClick={handleResetEventData}
                className="w-full flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold py-2 px-4 rounded-lg transition-colors shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
                Reset Event Data
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
