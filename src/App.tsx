import React, { useState, useEffect } from 'react';
import { getActiveSession, setActiveSession, clearActiveSession, getBoothById } from './utils/storage';
import { LoginScreen } from './components/LoginScreen';
import { ScannerScreen } from './components/ScannerScreen';
import { LeaderboardPage } from './components/LeaderboardPage';

export default function App() {
  const [activeBoothId, setActiveBoothId] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState<string>(window.location.pathname);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Check initial path & hash
    const checkPath = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (path === '/leaderboards' || path === '/leaderboard' || hash === '#leaderboards' || hash === '#leaderboard') {
        setCurrentPath('/leaderboards');
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
    const savedBooth = getActiveSession();
    if (savedBooth) {
      const booth = getBoothById(savedBooth);
      if (booth) {
        setActiveBoothId(booth.id);
      } else {
        clearActiveSession();
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
    setActiveSession(boothId);
    setActiveBoothId(boothId);
  };

  const handleLogout = () => {
    clearActiveSession();
    setActiveBoothId(null);
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Dedicated /leaderboards route
  if (currentPath === '/leaderboards' || currentPath === '/leaderboard') {
    return <LeaderboardPage onNavigateToBooth={() => navigateTo('/')} />;
  }

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

