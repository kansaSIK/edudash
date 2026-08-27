import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { usePreferences } from '../contexts/PreferencesContext';

// --- TYPES ---
export interface Task {
  id: string;
  title: string;
  deadline: string;
  is_completed: boolean;
}

export interface StatistikProps {
  userId?: string;
  onNavigateHome?: () => void;
  onNavigateTask?: () => void;
  onNavigateSchedule?: () => void;
  onNavigateProfile?: () => void;
  onNavigateNotification?: () => void;
}

// --- KAMUS BAHASA (DICTIONARY) ---
const dict = {
  id: {
    title: "EduDash",
    page_title: "Perkembanganmu",
    page_subtitle: "Ringkasan aktivitas belajarmu minggu ini.",
    loading: "Menghitung data...",
    completion: "Penyelesaian tugas",
    msg_perfect: "Luar biasa! Kamu menyelesaikan semua tugas.",
    msg_good: "Hebat! Kamu hampir menyelesaikan semua tugas minggu ini.",
    msg_keep_going: "Ayo semangat! Kerjakan tugas-tugasmu minggu ini.",
    stat_done: "Selesai",
    stat_pending: "Sedang dikerjakan",
    stat_overdue: "Terlambat",
    stat_study_time: "Waktu belajar",
    hour: "j",
    minute: "m",
    chart_title: "Aktivitas Mingguan",
    days_short: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
    nav_home: "Beranda",
    nav_tasks: "Tugas",
    nav_schedule: "Jadwal",
    nav_stats: "Statistik",
    nav_profile: "Profil"
  },
  en: {
    title: "EduDash",
    page_title: "Your Progress",
    page_subtitle: "Summary of your learning activities this week.",
    loading: "Calculating data...",
    completion: "Task completion",
    msg_perfect: "Awesome! You've completed all your tasks.",
    msg_good: "Great! You've almost finished all tasks this week.",
    msg_keep_going: "Keep it up! Complete your tasks for this week.",
    stat_done: "Completed",
    stat_pending: "In Progress",
    stat_overdue: "Overdue",
    stat_study_time: "Study time",
    hour: "h",
    minute: "m",
    chart_title: "Weekly Activity",
    days_short: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    nav_home: "Home",
    nav_tasks: "Tasks",
    nav_schedule: "Schedule",
    nav_stats: "Stats",
    nav_profile: "Profile"
  }
};

export default function Statistik({
  userId,
  onNavigateHome,
  onNavigateTask,
  onNavigateNotification
}: StatistikProps) {
  
  const { lang } = usePreferences();
  const t = dict[lang];

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, deadline, is_completed');

      if (error) {
        console.error('Gagal mengambil data tugas:', error.message);
      } else {
        setTasks((data as Task[]) || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.is_completed).length;
  const pendingTasks = tasks.filter(t => !t.is_completed && new Date(t.deadline) >= now).length;
  const overdueTasks = tasks.filter(t => !t.is_completed && new Date(t.deadline) < now).length;
  
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const totalStudyMinutes = completedTasks * 45;
  const studyHours = Math.floor(totalStudyMinutes / 60);
  const studyMins = totalStudyMinutes % 60;

  const dayNames = t.days_short;
  const currentDayIndex = (now.getDay() + 6) % 7; 

  const weeklyData = dayNames.map((day, index) => {
    const tasksOnThisDay = tasks.filter(t => {
      if (!t.is_completed) return false;
      const tDate = new Date(t.deadline);
      const tDayIndex = (tDate.getDay() + 6) % 7;
      return tDayIndex === index;
    }).length;

    const maxTasksPerDay = 5;
    const heightPct = tasks.length === 0 ? 0 : Math.min((tasksOnThisDay / maxTasksPerDay) * 100, 100);
    const hours = (tasksOnThisDay * 45) / 60;

    return {
      day,
      isToday: index === currentDayIndex,
      height: `${heightPct > 0 ? heightPct : 5}%`, 
      hours: hours > 0 ? `${hours.toFixed(1)}${t.hour}` : `0${t.hour}`,
      isActive: tasksOnThisDay > 0
    };
  });

  return (
    // 1. PEMBUNGKUS UTAMA: w-full tanpa p-4 agar menyentuh sisi layar penuh
    <div className="w-full bg-[#f8f9fa] dark:bg-[#1a1c1e] text-[#161d1f] dark:text-[#e2e2e5] font-body-main antialiased transition-colors duration-300 pb-10">
      
      <style dangerouslySetInnerHTML={{
        __html: `
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap');
          @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
          body { font-family: 'Plus Jakarta Sans', sans-serif; }
          .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `
      }} />

      {/* 2. HEADER: sticky top-0 dan z-40 agar selalu di atas saat di-scroll */}
      <header className="flex justify-between items-center px-[20px] py-[16px] w-full bg-[#f8f9fa] dark:bg-[#1a1c1e] sticky top-0 z-40 border-b border-[#e9ecef]/50 dark:border-[#44474e]/50 transition-colors duration-300">
        <div className="flex items-center gap-[8px]">
          <button onClick={onNavigateHome} className="hover:bg-[#eef5f7] dark:hover:bg-[#44474e] transition-colors rounded-full p-1 text-[#005da7] dark:text-[#a4c9ff] flex items-center justify-center -ml-1">
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <h1 className="font-bold text-[20px] text-[#005da7] dark:text-[#a4c9ff]">{t.title}</h1>
        </div>
        
        <div className="flex items-center gap-1">
          <button onClick={onNavigateNotification} className="hover:bg-[#eef5f7] dark:hover:bg-[#44474e] transition-colors rounded-full p-2 text-[#005da7] dark:text-[#a4c9ff] flex items-center justify-center -mr-2" aria-label="Notifikasi">
            <span className="material-symbols-outlined text-[24px]">notifications</span>
          </button>
        </div>
      </header>

      {/* 3. KONTEN: padding px-[20px] agar konten tetap rapi tidak menabrak layar */}
      <main className="w-full px-[20px] py-[24px] flex flex-col gap-[24px]">
        
        <div className="space-y-[4px]">
          <h2 className="font-bold text-[28px] leading-[1.2] text-[#161d1f] dark:text-[#e2e2e5] transition-colors">{t.page_title}</h2>
          <p className="text-[14px] text-[#636e72] dark:text-[#c4c6d0] transition-colors">{t.page_subtitle}</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-[#717783] dark:text-[#8e9099]">
            <span className="material-symbols-outlined animate-spin text-[32px] mb-2">progress_activity</span>
            <p className="text-[14px]">{t.loading}</p>
          </div>
        ) : (
          <>
            {/* Top Summary Card */}
            <div className="bg-[#f4fafd] dark:bg-[#004883]/20 rounded-[24px] p-[24px] border border-[#e9ecef] dark:border-[#44474e] flex items-center justify-between relative overflow-hidden gap-[16px] min-h-[140px] transition-colors duration-300">
              <div className="absolute -right-12 -top-12 w-40 h-40 bg-[#005da7]/10 dark:bg-[#a4c9ff]/10 rounded-full blur-2xl"></div>
              
              <div className="flex flex-col gap-[8px] z-10 flex-1">
                <h3 className="font-bold text-[18px] leading-[1.4] text-[#161d1f] dark:text-[#e2e2e5]">
                  {completionRate}% {t.completion}
                </h3>
                <p className="text-[12px] leading-[1.5] text-[#636e72] dark:text-[#c4c6d0]">
                  {completionRate === 100 
                    ? t.msg_perfect
                    : completionRate > 50 
                    ? t.msg_good 
                    : t.msg_keep_going}
                </p>
              </div>
              
              <div className="relative w-[76px] h-[76px] flex items-center justify-center shrink-0 z-10">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path className="text-[#e9ecef] dark:text-[#44474e] transition-colors" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                  <path className="text-[#005da7] dark:text-[#a4c9ff] transition-all duration-1000 ease-out" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray={`${completionRate}, 100`} strokeLinecap="round" strokeWidth="4" />
                </svg>
                <span className="absolute font-bold text-[14px] text-[#005da7] dark:text-[#a4c9ff]">{completionRate}%</span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-[16px]">
              {/* Selesai */}
              <div className="bg-[#ffffff] dark:bg-[#2b2d30] rounded-2xl p-[16px] shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-[#e9ecef] dark:border-[#44474e] flex flex-col items-start gap-[12px] transition-colors duration-300">
                <div className="w-10 h-10 rounded-full bg-[#00837c]/10 dark:bg-[#7cf6ec]/20 flex items-center justify-center text-[#00837c] dark:text-[#7cf6ec]">
                  <span className="material-symbols-outlined text-[20px]">check_circle</span>
                </div>
                <div className="flex flex-col">
                  <h3 className="font-bold text-[28px] text-[#161d1f] dark:text-[#e2e2e5] leading-[1.2]">{completedTasks}</h3>
                  <p className="text-[12px] text-[#636e72] dark:text-[#c4c6d0] mt-[4px]">{t.stat_done}</p>
                </div>
              </div>
              
              {/* Sedang dikerjakan (Bisa diklik menuju Halaman Tugas) */}
              <button 
                onClick={onNavigateTask}
                className="w-full text-left bg-[#ffffff] dark:bg-[#2b2d30] rounded-2xl p-[16px] shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-[#e9ecef] dark:border-[#44474e] hover:bg-[#eef5f7] dark:hover:bg-[#44474e] active:scale-95 flex flex-col items-start gap-[12px] transition-all duration-300 cursor-pointer focus:outline-none"
              >
                <div className="w-10 h-10 rounded-full bg-[#005da7]/10 dark:bg-[#a4c9ff]/20 flex items-center justify-center text-[#005da7] dark:text-[#a4c9ff]">
                  <span className="material-symbols-outlined text-[20px]">more_horiz</span>
                </div>
                <div className="flex flex-col">
                  <h3 className="font-bold text-[28px] text-[#161d1f] dark:text-[#e2e2e5] leading-[1.2]">{pendingTasks}</h3>
                  <p className="text-[12px] text-[#636e72] dark:text-[#c4c6d0] mt-[4px]">{t.stat_pending}</p>
                </div>
              </button>
              
              {/* Terlambat */}
              <div className="bg-[#ffffff] dark:bg-[#2b2d30] rounded-2xl p-[16px] shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-[#e9ecef] dark:border-[#44474e] flex flex-col items-start gap-[12px] transition-colors duration-300">
                <div className="w-10 h-10 rounded-full bg-[#ffdad6] dark:bg-[#93000a]/50 flex items-center justify-center text-[#ba1a1a] dark:text-[#ffb4ab]">
                  <span className="material-symbols-outlined text-[20px]">error</span>
                </div>
                <div className="flex flex-col">
                  <h3 className="font-bold text-[28px] text-[#161d1f] dark:text-[#e2e2e5] leading-[1.2]">{overdueTasks}</h3>
                  <p className="text-[12px] text-[#636e72] dark:text-[#c4c6d0] mt-[4px]">{t.stat_overdue}</p>
                </div>
              </div>
              
              {/* Waktu belajar */}
              <div className="bg-[#ffffff] dark:bg-[#2b2d30] rounded-2xl p-[16px] shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-[#e9ecef] dark:border-[#44474e] flex flex-col items-start gap-[12px] transition-colors duration-300">
                <div className="w-10 h-10 rounded-full bg-[#e29bfe]/20 dark:bg-[#d0bcff]/20 flex items-center justify-center text-[#83439e] dark:text-[#d0bcff]">
                  <span className="material-symbols-outlined text-[20px]">schedule</span>
                </div>
                <div className="flex flex-col">
                  <h3 className="font-bold text-[20px] text-[#161d1f] dark:text-[#e2e2e5] leading-[1.2] mt-[6px]">
                    {studyHours}{t.hour} {studyMins}{t.minute}
                  </h3>
                  <p className="text-[12px] text-[#636e72] dark:text-[#c4c6d0] mt-[6px]">{t.stat_study_time}</p>
                </div>
              </div>
            </div>

            {/* Weekly Chart */}
            <div className="bg-[#ffffff] dark:bg-[#2b2d30] rounded-2xl p-[20px] shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-[#e9ecef] dark:border-[#44474e] space-y-[16px] transition-colors duration-300">
              <h3 className="font-bold text-[16px] text-[#161d1f] dark:text-[#e2e2e5]">{t.chart_title}</h3>
              
              <div className="h-48 w-full flex items-end justify-between gap-2 pt-4 border-b border-[#e9ecef] dark:border-[#44474e] relative pb-6 transition-colors">
                {weeklyData.map((data, idx) => (
                  <div key={idx} className="w-full flex flex-col items-center gap-2 h-full justify-end">
                    {/* Bar Grafik */}
                    <div 
                      className={`w-full rounded-t-sm relative group transition-colors cursor-pointer ${
                        data.isToday 
                          ? 'bg-[#005da7] dark:bg-[#a4c9ff]' 
                          : data.isActive 
                          ? 'bg-[#a4c9ff] dark:bg-[#004883]' 
                          : 'bg-[#e9ecef] dark:bg-[#44474e] hover:bg-[#d4e3ff] dark:hover:bg-[#004883]/50'
                      }`}
                      style={{ height: data.height }}
                    >
                      {/* Tooltip Hover */}
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#2b3234] dark:bg-[#e2e2e5] text-white dark:text-[#1a1c1e] text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none">
                        {data.hours}
                      </div>
                    </div>
                    <span className={`text-[10px] absolute -bottom-6 ${data.isToday ? 'text-[#005da7] dark:text-[#a4c9ff] font-bold' : 'text-[#636e72] dark:text-[#c4c6d0]'}`}>
                      {data.day}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}