import React, { useState, useEffect } from 'react';
import { getActiveSession, setActiveSession, clearActiveSession, getBoothById } from './utils/storage';
import { getBoothSession, saveBoothSession, clearBoothSession } from './utils/boothAuth';
import { LoginScreen } from './components/LoginScreen';
import { ScannerScreen } from './components/ScannerScreen';
import { LeaderboardPage } from './components/LeaderboardPage';
import { AdminPage } from './components/AdminPage';
import { AdminDatabasePage } from './components/AdminDatabasePage';

export default function App() {
  const [activeBoothId, setActiveBoothId] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState<string>(window.location.pathname);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Check initial path & hash
    const checkPath = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();

      if (
        path === '/leaderboards' ||
        path === '/leaderboard' ||
        hash === '#leaderboards' ||
        hash === '#leaderboard'
      ) {
        setCurrentPath('/leaderboards');
      } else if (path === '/main-admin-access' || hash === '#main-admin-access') {
        setCurrentPath('/main-admin-access');
      } else if (path === '/admin-database' || hash === '#admin-database') {
        setCurrentPath('/admin-database');
      } else if (path === '/booth-portal' || hash === '#booth-portal') {
        setCurrentPath('/booth-portal');
      } else {
        setCurrentPath(window.location.pathname);
      }
    };

    checkPath();

    // Listen to browser navigation / history changes
    const handlePopState = () => {
      checkPath();
    };
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);

    // Restore session from localStorage if exists and valid
    const boothAuthSession = getBoothSession();
    if (boothAuthSession && boothAuthSession.boothId) {
      setActiveBoothId(boothAuthSession.boothId);
    } else {
      const savedBooth = getActiveSession();
      if (savedBooth) {
        const booth = getBoothById(savedBooth);
        if (booth) {
          setActiveBoothId(booth.id);
          saveBoothSession({
            boothId: booth.id,
            name: booth.name,
            category: booth.category || 'General',
            location: booth.location || 'Exhibition Hall',
            authenticatedAt: new Date().toISOString(),
          });
        } else {
          clearActiveSession();
          clearBoothSession();
        }
      }
    }
    setIsInitialized(true);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  const handleLogin = (boothId: string) => {
    const booth = getBoothById(boothId);
    setActiveSession(boothId);
    saveBoothSession({
      boothId,
      name: booth?.name || `Booth ${boothId}`,
      category: booth?.category || 'General',
      location: booth?.location || 'Exhibition Hall',
      authenticatedAt: new Date().toISOString(),
    });
    setActiveBoothId(boothId);
  };

  const handleLogout = () => {
    clearActiveSession();
    clearBoothSession();
    setActiveBoothId(null);
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 1. Dedicated /leaderboards route
  if (currentPath === '/leaderboards' || currentPath === '/leaderboard') {
    return <LeaderboardPage onNavigateToBooth={() => navigateTo('/booth-portal')} />;
  }

  // 2. Dedicated /main-admin-access route (Super Admin Portal)
  if (currentPath === '/main-admin-access') {
    return <AdminPage />;
  }

  // 3. Dedicated /admin-database route (Database Manager)
  if (currentPath === '/admin-database') {
    return <AdminDatabasePage />;
  }

  // 4. Dedicated /booth-portal & Root / route (Booth Scanner View)
  return (
    <div className="min-h-screen bg-[#0B0F19] font-sans text-slate-100 antialiased">
      {activeBoothId ? (
        <ScannerScreen
          boothId={activeBoothId}
          onLogout={handleLogout}
          onNavigateToLeaderboard={() => navigateTo('/leaderboards')}
        />
      ) : (
        <LoginScreen
          onLogin={handleLogin}
          onNavigateToLeaderboard={() => navigateTo('/leaderboards')}
        />
      )}
    </div>
  );
}
