import React, { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js'; // Import tipe data Session
import { supabase } from './lib/supabase';

// Import Semua Halaman
import Onboarding from './pages/Onboarding';
import Onboarding2 from './pages/Onboarding2';
import Onboarding3 from './pages/Onboarding3';
import Home from './pages/Home';
import Tasks from './pages/Tasks';
import Jadwal from './pages/Jadwal';
import Statistik from './pages/Statistik';
import Profil from './pages/Profil';
import Notifikasi from './pages/Notifikasi';
import Login from './pages/Login';
import Register from './pages/Register';
import { PreferencesProvider } from './contexts/PreferencesContext';

export default function App() {
  // --- STATE ---
  const [session, setSession] = useState<Session | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true); 
  const [activePage, setActivePage] = useState('home'); 
  const [authPage, setAuthPage] = useState<'login' | 'register'>('login');

  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean>(() => {
    return localStorage.getItem('hasSeenOnboarding') === 'true';
  });
  const [onboardingStep, setOnboardingStep] = useState(1);

  // --- HANDLERS ---
  const finishOnboarding = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    setHasSeenOnboarding(true);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('hasSeenOnboarding');
    setHasSeenOnboarding(false);
    setOnboardingStep(1); 
    setActivePage('home');
  };

  // Objek navigasi untuk menghindari prop drilling yang berulang
  const navProps = {
    onNavigateHome: () => setActivePage('home'),
    onNavigateTask: () => setActivePage('tasks'),
    onNavigateSchedule: () => setActivePage('schedule'),
    onNavigateStats: () => setActivePage('stats'),
    onNavigateProfile: () => setActivePage('profile'),
    onNavigateNotification: () => setActivePage('notifikasi'),
  };

  // --- EFFECTS ---
  useEffect(() => {
    // 1. Cek sesi aktif Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setTimeout(() => setIsCheckingSession(false), 2500);
    });

    // 2. Pantau perubahan auth secara real-time
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- RENDER: SPLASH SCREEN ---
  if (isCheckingSession) {
    return <SplashScreen />;
  }

  // --- RENDER: ONBOARDING & AUTH (Belum Login) ---
  if (!session) {
    if (!hasSeenOnboarding) {
      switch (onboardingStep) {
        case 1:
          return <Onboarding onNext={() => setOnboardingStep(2)} onSkip={finishOnboarding} />;
        case 2:
          return (
            <Onboarding2 
              onNext={() => setOnboardingStep(3)} 
              onBack={() => setOnboardingStep(1)} 
              onSkip={finishOnboarding} 
            />
          );
        case 3:
          return (
            <Onboarding3 
              onStart={finishOnboarding} 
              onBack={() => setOnboardingStep(2)} 
              onSkip={finishOnboarding} 
            />
          );
        default:
          return null;
      }
    }

    return (
      <PreferencesProvider>
        {authPage === 'login' ? (
          <Login onNavigateRegister={() => setAuthPage('register')} />
        ) : (
          <Register onNavigateLogin={() => setAuthPage('login')} />
        )}
      </PreferencesProvider>
    );
  }

  // --- RENDER: MAIN PAGES (Sudah Login) ---
  const renderActivePage = () => {
    const userId = session.user.id;

    switch (activePage) {
      case 'home':
        return <Home userId={userId} {...navProps} />;
      case 'tasks':
        return <Tasks userId={userId} {...navProps} />;
      case 'schedule':
        return <Jadwal userId={userId} {...navProps} />;
      case 'stats':
        return <Statistik userId={userId} {...navProps} />;
      case 'profile':
        return <Profil userId={userId} {...navProps} onLogout={handleLogout} />;
      case 'notifikasi':
        return (
          <Notifikasi 
            userId={userId} 
            {...navProps} 
            onNavigateBack={() => setActivePage('home')} 
          />
        );
      default:
        return <Home userId={userId} {...navProps} />;
    }
  };

  // --- PERBAIKAN: STRUKTUR UTAMA DENGAN MENU BAWAH ---
  return (
    <PreferencesProvider>
      <div className="flex flex-col h-[100dvh] w-full bg-[#121212] text-white overflow-hidden relative">
        
        {/* AREA KONTEN: Halaman (Home, Statistik, Profil) dirender di sini & bisa discroll */}
        {/* pb-[90px] memastikan konten terbawah tidak tertutup menu */}
        <main className="flex-1 overflow-y-auto pb-[90px] w-full">
          {renderActivePage()}
        </main>

        {/* MENU NAVIGASI BAWAH: Permanen untuk semua halaman (kecuali Notifikasi) */}
        {activePage !== 'notifikasi' && (
          <nav className="fixed bottom-0 left-0 right-0 h-[70px] bg-[#1a1a1a] border-t border-white/10 z-50 flex justify-around items-center px-2 pb-2">
            
            <button onClick={() => setActivePage('home')} className={`flex flex-col items-center justify-center w-16 gap-1 mt-2 transition-colors ${activePage === 'home' ? 'text-white' : 'text-[#8a8a8a]'}`}>
              <span className={`material-symbols-outlined text-[24px] ${activePage === 'home' ? 'icon-fill' : ''}`}>home</span>
              <span className="text-[10px] font-medium tracking-wide">Beranda</span>
            </button>

            <button onClick={() => setActivePage('tasks')} className={`flex flex-col items-center justify-center w-16 gap-1 mt-2 transition-colors ${activePage === 'tasks' ? 'text-white' : 'text-[#8a8a8a]'}`}>
              <span className={`material-symbols-outlined text-[24px] ${activePage === 'tasks' ? 'icon-fill' : ''}`}>assignment</span>
              <span className="text-[10px] font-medium tracking-wide">Tugas</span>
            </button>

            <button onClick={() => setActivePage('schedule')} className={`flex flex-col items-center justify-center w-16 gap-1 mt-2 transition-colors ${activePage === 'schedule' ? 'text-white' : 'text-[#8a8a8a]'}`}>
              <span className={`material-symbols-outlined text-[24px] ${activePage === 'schedule' ? 'icon-fill' : ''}`}>calendar_today</span>
              <span className="text-[10px] font-medium tracking-wide">Jadwal</span>
            </button>

            <button onClick={() => setActivePage('stats')} className={`flex flex-col items-center justify-center w-[68px] gap-1 mt-2 transition-colors ${activePage === 'stats' ? 'text-white' : 'text-[#8a8a8a]'}`}>
              <span className={`material-symbols-outlined text-[24px] ${activePage === 'stats' ? 'icon-fill' : ''}`}>bar_chart</span>
              <span className="text-[10px] font-medium tracking-wide">Statistik</span>
            </button>

            <button onClick={() => setActivePage('profile')} className={`flex flex-col items-center justify-center w-16 gap-1 mt-2 transition-colors ${activePage === 'profile' ? 'text-white' : 'text-[#8a8a8a]'}`}>
              <span className={`material-symbols-outlined text-[24px] ${activePage === 'profile' ? 'icon-fill' : ''}`}>person</span>
              <span className="text-[10px] font-medium tracking-wide">Profil</span>
            </button>

          </nav>
        )}
      </div>
    </PreferencesProvider>
  );
}

// ============================================================================
// KOMPONEN SPLASH SCREEN
// ============================================================================
const SplashScreen = () => (
  <div className="bg-[#eef5f7] min-h-screen flex items-center justify-center">
    <div className="bg-[#ffffff] min-h-screen sm:min-h-[800px] h-full sm:h-[800px] w-full max-w-md sm:rounded-[2.5rem] sm:shadow-2xl flex flex-col items-center justify-center relative font-body-main overflow-hidden">
      <style dangerouslySetInnerHTML={{
        __html: `
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap');
          @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
          body { font-family: 'Plus Jakarta Sans', sans-serif; }
          .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
          .icon-fill { font-variation-settings: 'FILL' 1; }
          
          /* Dot Flashing Animation */
          .dot-flashing {
              position: relative;
              width: 6px;
              height: 6px;
              border-radius: 5px;
              background-color: #005da7;
              color: #005da7;
              animation: dotFlashing 1s infinite linear alternate;
              animation-delay: .5s;
          }
          .dot-flashing::before, .dot-flashing::after {
              content: '';
              display: inline-block;
              position: absolute;
              top: 0;
              width: 6px;
              height: 6px;
              border-radius: 5px;
              background-color: #005da7;
              color: #005da7;
          }
          .dot-flashing::before {
              left: -12px;
              animation: dotFlashing 1s infinite alternate;
              animation-delay: 0s;
          }
          .dot-flashing::after {
              left: 12px;
              animation: dotFlashing 1s infinite alternate;
              animation-delay: 1s;
          }
          @keyframes dotFlashing {
              0% { background-color: #005da7; }
              50%, 100% { background-color: #d4e3ff; }
          }

          @keyframes fadeInUp {
              0% { opacity: 0; transform: translateY(20px); }
              100% { opacity: 1; transform: translateY(0); }
          }
          @keyframes pulseSlow {
              0%, 100% { opacity: 1; transform: scale(1); }
              50% { opacity: 0.9; transform: scale(0.98); }
          }
          .animate-fade-in-up { animation: fadeInUp 1s ease-out forwards; }
          .animate-pulse-slow { animation: pulseSlow 3s infinite ease-in-out; }
          .animate-fade-in-up-delayed { animation: fadeInUp 0.5s ease-out 1s forwards; opacity: 0; }
        `
      }} />

      <div className="absolute top-[-10%] left-[-10%] w-[300px] h-[300px] max-w-[400px] max-h-[400px] bg-[#a4c9ff] rounded-full blur-[100px] opacity-40 mix-blend-multiply pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] max-w-[500px] max-h-[500px] bg-[#ebb2ff] rounded-full blur-[120px] opacity-30 mix-blend-multiply pointer-events-none"></div>
      
      <main className="z-10 flex flex-col items-center justify-center px-[20px] text-center animate-fade-in-up w-full">
        <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-[#005da7] flex items-center justify-center mb-8 shadow-[0px_10px_30px_rgba(0,93,167,0.2)] animate-pulse-slow">
          <span className="material-symbols-outlined icon-fill text-[#ffffff] !text-[56px] md:!text-[64px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            school
          </span>
        </div>
        
        <h1 className="font-bold text-[32px] leading-[40px] tracking-[-0.02em] text-[#161d1f] mb-3">
          EduDash
        </h1>
        
        <p className="font-normal text-[16px] leading-[24px] text-[#414751] max-w-[280px] md:max-w-[320px]">
          Belajar lebih teratur, raih lebih banyak.
        </p>
      </main>

      <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex items-center justify-center animate-fade-in-up-delayed">
        <div className="dot-flashing"></div>
      </div>
    </div>
  </div>
);