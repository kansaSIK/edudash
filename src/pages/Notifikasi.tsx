import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { usePreferences } from '../contexts/PreferencesContext';

// --- TYPES ---
interface Task {
  id: string;
  title: string;
  subject: string;
  deadline: string;
  priority: string;
}

interface AppEvent {
  id: string;
  title: string;
  event_date: string;
  start_time: string;
  end_time: string;
  location: string;
}

interface NotifikasiProps {
    userId?: string;
  onNavigateBack?: () => void;
  onNavigateHome?: () => void;
  onNavigateTask?: () => void;
  onNavigateSchedule?: () => void;
  onNavigateStats?: () => void;
  onNavigateProfile?: () => void;
}

// --- DICTIONARY ---
const dict = {
  id: {
    title: "Notifikasi",
    pending_tasks: "Tugas Belum Selesai",
    upcoming_events: "Kegiatan Mendatang",
    no_tasks: "Hore! Tidak ada tugas yang menumpuk.",
    no_events: "Tidak ada kegiatan mendatang dalam waktu dekat.",
    loading: "Memuat info terbaru...",
    due: "Tenggat",
    at: "di",
    nav_home: "Beranda",
    nav_tasks: "Tugas",
    nav_schedule: "Jadwal",
    nav_stats: "Statistik",
    nav_profile: "Profil"
  },
  en: {
    title: "Notifications",
    pending_tasks: "Pending Tasks",
    upcoming_events: "Upcoming Events",
    no_tasks: "Yay! No pending tasks.",
    no_events: "No upcoming events soon.",
    loading: "Loading latest updates...",
    due: "Due",
    at: "at",
    nav_home: "Home",
    nav_tasks: "Tasks",
    nav_schedule: "Schedule",
    nav_stats: "Stats",
    nav_profile: "Profile"
  }
};

export default function Notifikasi({ 
  onNavigateBack,
  onNavigateHome,
  onNavigateTask,
  onNavigateSchedule,
  onNavigateStats,
  onNavigateProfile
}: NotifikasiProps) {
  const { lang, theme } = usePreferences();
  const t = dict[lang];

  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      // 1. Ambil Tugas yang BELUM selesai (is_completed = false)
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('id, title, subject, deadline, priority')
        .eq('is_completed', false)
        .order('deadline', { ascending: true });

      if (tasksError) throw tasksError;

      // 2. Ambil Jadwal KEGIATAN yang mendatang (event_date >= hari ini)
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('id, title, event_date, start_time, end_time, location')
        .gte('event_date', today)
        .order('event_date', { ascending: true });

      if (eventsError) throw eventsError;

      setTasks(tasksData || []);
      setEvents(eventsData || []);
    } catch (error) {
      console.error("Gagal memuat notifikasi:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Tinggi': return '#ff6b6b';
      case 'Sedang': return '#ffd93d';
      case 'Rendah': return '#00837c';
      default: return '#005da7';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { 
      day: 'numeric', month: 'long', year: 'numeric' 
    });
  };

  return (
    <div className={`bg-[#eef5f7] dark:bg-[#1a1c1e] min-h-screen flex items-center justify-center p-4 transition-colors duration-300`}>
      <div className="bg-[#f8f9fa] dark:bg-[#1a1c1e] text-[#161d1f] dark:text-[#e2e2e5] min-h-screen sm:min-h-[800px] h-full sm:h-[800px] w-full max-w-md sm:rounded-[2.5rem] sm:shadow-2xl flex flex-col font-body-main antialiased relative overflow-hidden transition-colors duration-300 pb-20">
        
        {/* --- INJEKSI FONT & CSS ICON KETAT --- */}
        <style dangerouslySetInnerHTML={{
          __html: `
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap');
            @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0');
            
            body { font-family: 'Plus Jakarta Sans', sans-serif; }
            
            .material-symbols-outlined { 
              font-family: 'Material Symbols Outlined' !important;
              font-weight: normal !important;
              font-style: normal !important;
              font-size: 24px !important;
              line-height: 1 !important;
              letter-spacing: normal !important;
              text-transform: none !important;
              display: inline-block !important;
              white-space: nowrap !important;
              word-wrap: normal !important;
              direction: ltr !important;
              -webkit-font-feature-settings: 'liga' !important;
              -webkit-font-smoothing: antialiased !important;
            }
            
            .no-scrollbar::-webkit-scrollbar { display: none; }
            .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          `
        }} />

        {/* HEADER */}
        <header className="flex items-center gap-3 px-[20px] py-[16px] bg-[#f8f9fa] dark:bg-[#1a1c1e] sticky top-0 z-20 border-b border-[#e9ecef]/50 dark:border-[#44474e]/50">
          <button onClick={onNavigateBack} className="hover:bg-[#eef5f7] dark:hover:bg-[#44474e] p-2 rounded-full text-[#005da7] dark:text-[#a4c9ff] transition-colors flex items-center justify-center -ml-2">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="font-bold text-[20px] text-[#005da7] dark:text-[#a4c9ff]">{t.title}</h1>
        </header>

        {/* MAIN CONTENT */}
        <main className="flex-grow overflow-y-auto no-scrollbar px-[20px] py-[24px] flex flex-col gap-8 pb-24">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-40 text-[#636e72] dark:text-[#8e9099]">
              <span className="material-symbols-outlined animate-spin text-[32px] mb-2">progress_activity</span>
              <p className="text-[14px]">{t.loading}</p>
            </div>
          ) : (
            <>
              {/* SECTION: TUGAS BELUM SELESAI */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-[#ff6b6b]">assignment_late</span>
                  <h2 className="font-bold text-[18px]">{t.pending_tasks}</h2>
                  {tasks.length > 0 && (
                    <span className="bg-[#ff6b6b] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{tasks.length}</span>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  {tasks.length === 0 ? (
                    <div className="bg-[#ffffff] dark:bg-[#2b2d30] border border-dashed border-[#c1c7d3] dark:border-[#44474e] rounded-2xl p-6 text-center text-[#636e72] dark:text-[#8e9099] text-[13px]">
                      {t.no_tasks}
                    </div>
                  ) : (
                    tasks.map(task => (
                      <div key={task.id} className="bg-[#ffffff] dark:bg-[#2b2d30] border border-[#e9ecef] dark:border-[#44474e] rounded-xl p-4 shadow-sm flex items-start gap-3 relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-[4px]" style={{ backgroundColor: getPriorityColor(task.priority) }} />
                        <div className="flex-1 ml-1">
                          <p className="text-[10px] font-bold text-[#636e72] dark:text-[#c4c6d0] mb-1">{task.subject}</p>
                          <h3 className="font-bold text-[15px] mb-1 leading-tight">{task.title}</h3>
                          <p className="text-[12px] text-[#ff6b6b] dark:text-[#ffb4ab] font-medium">{t.due}: {formatDate(task.deadline)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* SECTION: KEGIATAN MENDATANG */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-[#005da7] dark:text-[#a4c9ff]">event_upcoming</span>
                  <h2 className="font-bold text-[18px]">{t.upcoming_events}</h2>
                  {events.length > 0 && (
                    <span className="bg-[#005da7] dark:bg-[#a4c9ff] text-white dark:text-[#00315b] text-[10px] font-bold px-2 py-0.5 rounded-full">{events.length}</span>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  {events.length === 0 ? (
                    <div className="bg-[#ffffff] dark:bg-[#2b2d30] border border-dashed border-[#c1c7d3] dark:border-[#44474e] rounded-2xl p-6 text-center text-[#636e72] dark:text-[#8e9099] text-[13px]">
                      {t.no_events}
                    </div>
                  ) : (
                    events.map(evt => (
                      <div key={evt.id} className="bg-[#ffffff] dark:bg-[#2b2d30] border border-[#e9ecef] dark:border-[#44474e] rounded-xl p-4 shadow-sm">
                        <h3 className="font-bold text-[15px] mb-2">{evt.title}</h3>
                        <div className="flex flex-col gap-1 text-[12px] text-[#636e72] dark:text-[#c4c6d0]">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                            <span>{formatDate(evt.event_date)} ({evt.start_time.substring(0,5)} - {evt.end_time.substring(0,5)})</span>
                          </div>
                          {evt.location && evt.location !== '-' && (
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-[16px]">location_on</span>
                              <span>{evt.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </>
          )}
        </main>

        {/* --- NAVIGATION BOTTOM --- */}
        <nav className="absolute bottom-0 w-full rounded-t-2xl bg-[#ffffff] dark:bg-[#1a1c1e] shadow-[0px_-4px_20px_rgba(0,0,0,0.05)] z-40 flex justify-around items-center px-[8px] py-[12px] border-t border-[#e9ecef] dark:border-[#44474e] transition-colors duration-300">
          <button onClick={onNavigateHome} className="flex flex-col items-center text-[#636e72] dark:text-[#8e9099] hover:text-[#005da7] dark:hover:text-[#a4c9ff] px-4 py-2 transition-colors">
            <span className="material-symbols-outlined text-[24px]">home</span>
            <span className="font-bold text-[10px] mt-[2px]">{t.nav_home}</span>
          </button>
          
          <button onClick={onNavigateTask} className="flex flex-col items-center text-[#636e72] dark:text-[#8e9099] hover:text-[#005da7] dark:hover:text-[#a4c9ff] px-4 py-2 transition-colors">
            <span className="material-symbols-outlined text-[24px]">assignment</span>
            <span className="font-bold text-[10px] mt-[2px]">{t.nav_tasks}</span>
          </button>
          
          <button onClick={onNavigateSchedule} className="flex flex-col items-center text-[#636e72] dark:text-[#8e9099] hover:text-[#005da7] dark:hover:text-[#a4c9ff] px-4 py-2 transition-colors">
            <span className="material-symbols-outlined text-[24px]">calendar_today</span>
            <span className="font-bold text-[10px] mt-[2px]">{t.nav_schedule}</span>
          </button>
          
          <button onClick={onNavigateStats} className="flex flex-col items-center text-[#636e72] dark:text-[#8e9099] hover:text-[#005da7] dark:hover:text-[#a4c9ff] px-4 py-2 transition-colors">
            <span className="material-symbols-outlined text-[24px]">bar_chart</span>
            <span className="font-bold text-[10px] mt-[2px]">{t.nav_stats}</span>
          </button>
          
          <button onClick={onNavigateProfile} className="flex flex-col items-center text-[#636e72] dark:text-[#8e9099] hover:text-[#005da7] dark:hover:text-[#a4c9ff] px-4 py-2 transition-colors">
            <span className="material-symbols-outlined text-[24px]">person</span>
            <span className="font-bold text-[10px] mt-[2px]">{t.nav_profile}</span>
          </button>
        </nav>

      </div>
    </div>
  );
}