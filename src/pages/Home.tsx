import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { usePreferences } from '../contexts/PreferencesContext'; // <-- IMPORT GLOBAL STATE

// --- DEFINISI TIPE DATA ---
interface Task {
  id: string;
  title: string;
  subject: string;
  description: string;
  deadline: string;
  priority: 'Rendah' | 'Sedang' | 'Tinggi';
  is_completed: boolean;
}

interface Schedule {
  id: string;
  subject_name: string;
  start_time: string;
  end_time: string;
  room: string;
  day_of_week: string;
}

interface HomeProps {
  userId?: string;
  onNavigateTask?: () => void;
  onNavigateSchedule?: () => void;
  onAddSchedule?: () => void;
  onNavigateStats?: () => void;
  onNavigateProfile?: () => void;
  onNavigateNotification?: () => void; // <--- NOTIFIKASI
}

// --- KAMUS BAHASA (DICTIONARY) ---
const dict = {
  id: {
    add_task: "Tambah Tugas",
    today_progress: "Progress Hari Ini",
    of: "dari",
    tasks_completed: "tugas selesai",
    total_tasks: "total tugas",
    urgent: "mendesak",
    next_class: "Kelas Selanjutnya",
    no_class: "Belum ada kelas. Tambahkan jadwal.",
    upcoming_tasks: "Tugas Mendatang",
    see_all: "Lihat Semua",
    loading: "Memuat data...",
    all_done: "Semua tugas sudah selesai! ",
    nav_home: "Beranda",
    nav_tasks: "Tugas",
    nav_schedule: "Jadwal",
    nav_stats: "Statistik",
    nav_profile: "Profil",
    // Form Modal
    new_task: "Tambah Tugas Baru",
    task_title: "Judul Tugas (cth: Laporan Keamanan)",
    subject: "Mata Pelajaran (cth: Jaringan)",
    notes: "Catatan tambahan...",
    priority_low: "Prioritas: Rendah",
    priority_med: "Prioritas: Sedang",
    priority_high: "Prioritas: Tinggi",
    save_task: "Simpan Tugas",
    saving: "Menyimpan...",
    new_class: "Tambah Jadwal Kelas",
    class_subject: "Mata Pelajaran",
    start_time: "Jam Mulai",
    end_time: "Jam Selesai",
    room: "Ruangan (Opsional)",
    save_class: "Simpan Jadwal",
  },
  en: {
    add_task: "Add Task",
    today_progress: "Today's Progress",
    of: "of",
    tasks_completed: "tasks completed",
    total_tasks: "total tasks",
    urgent: "urgent tasks",
    next_class: "Next Class",
    no_class: "No classes yet. Add a schedule.",
    upcoming_tasks: "Upcoming Tasks",
    see_all: "See All",
    loading: "Loading data...",
    all_done: "All tasks completed! ",
    nav_home: "Home",
    nav_tasks: "Tasks",
    nav_schedule: "Schedule",
    nav_stats: "Stats",
    nav_profile: "Profile",
    // Form Modal
    new_task: "Add New Task",
    task_title: "Task Title (e.g., Security Report)",
    subject: "Subject (e.g., Networking)",
    notes: "Additional notes...",
    priority_low: "Priority: Low",
    priority_med: "Priority: Medium",
    priority_high: "Priority: High",
    save_task: "Save Task",
    saving: "Saving...",
    new_class: "Add Class Schedule",
    class_subject: "Subject",
    start_time: "Start Time",
    end_time: "End Time",
    room: "Room (Optional)",
    save_class: "Save Schedule",
  }
};

export default function Home({ 
  onNavigateTask, 
  onNavigateSchedule, 
  onAddSchedule,
  onNavigateStats, 
  onNavigateProfile, 
  onNavigateNotification
}: HomeProps) {
  
  // --- GLOBAL STATE TEMA & BAHASA ---
  const { lang } = usePreferences();
  const t = dict[lang];

  // --- STATE DATA ---
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('Siswa');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // --- STATE MODAL & LOADING ---
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);
  const [isSubmittingClass, setIsSubmittingClass] = useState(false);

  // Form Tugas
  const [taskTitle, setTaskTitle] = useState('');
  const [taskSubject, setTaskSubject] = useState('');
  const [taskNote, setTaskNote] = useState('');
  const [taskDeadline, setTaskDeadline] = useState('');
  const [taskPriority, setTaskPriority] = useState<'Rendah' | 'Sedang' | 'Tinggi'>('Sedang');

  // Form Kelas
  const [classSubject, setClassSubject] = useState('');
  const [classStartTime, setClassStartTime] = useState('');
  const [classEndTime, setClassEndTime] = useState('');
  const [classRoom, setClassRoom] = useState('');
  const [classDay, setClassDay] = useState('Senin');

  // --- LOGIKA TANGGAL & WAKTU ---
  const today = new Date();
  
  // Format tanggal sesuai bahasa (id-ID atau en-US)
  const currentDateString = today.toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  // Logika sapaan otomatis berdasarkan waktu
  const hour = today.getHours();
  let greeting = '';
  if (lang === 'id') {
    if (hour < 11) greeting = 'Selamat pagi';
    else if (hour < 15) greeting = 'Selamat siang';
    else if (hour < 18) greeting = 'Selamat sore';
    else greeting = 'Selamat malam';
  } else {
    if (hour < 12) greeting = 'Good morning';
    else if (hour < 17) greeting = 'Good afternoon';
    else greeting = 'Good evening';
  }

  // --- MENGAMBIL DATA DARI SUPABASE ---
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const currentUserId = session.user.id;
        setUserId(currentUserId);

        // AMBIL NAMA DARI TABEL 'profiles' (SINKRON DENGAN HALAMAN PROFIL)
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', currentUserId)
          .single();

        if (profileData?.full_name) {
          setUserName(profileData.full_name);
        } else {
          const fallbackName = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Siswa';
          setUserName(fallbackName);
        }

        // Ambil Tugas
        const { data: taskData } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', currentUserId)
          .order('created_at', { ascending: false });
        if (taskData) setTasks(taskData);

        // Ambil Jadwal
        const { data: scheduleData } = await supabase
          .from('schedules')
          .select('*')
          .eq('user_id', currentUserId);
        if (scheduleData) setSchedules(scheduleData);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  // --- FUNGSI TAMBAH TUGAS ---
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      alert("Sesi pengguna tidak ditemukan. Silakan login ulang.");
      return;
    }
    
    setIsSubmittingTask(true);
    const newTask = {
      user_id: userId,
      title: taskTitle,
      subject: taskSubject,
      description: taskNote,
      deadline: taskDeadline, 
      priority: taskPriority,
      is_completed: false
    };

    const { data, error } = await supabase.from('tasks').insert([newTask]).select();
    
    if (error) {
      alert("Gagal menyimpan tugas: " + error.message);
    } else if (data) {
      setTasks([data[0], ...tasks]); 
      setIsTaskModalOpen(false);
      setTaskTitle(''); setTaskSubject(''); setTaskNote(''); setTaskDeadline(''); setTaskPriority('Sedang');
    }
    setIsSubmittingTask(false);
  };

  // --- FUNGSI TAMBAH KELAS ---
  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      alert("Sesi pengguna tidak ditemukan. Silakan login ulang.");
      return;
    }
    
    setIsSubmittingClass(true);
    const newClass = {
      user_id: userId,
      subject_name: classSubject,
      start_time: classStartTime,
      end_time: classEndTime,
      room: classRoom || '-',
      day_of_week: classDay
    };

    const { data, error } = await supabase.from('schedules').insert([newClass]).select();
    
    if (error) {
      alert("Gagal menyimpan jadwal: " + error.message);
    } else if (data) {
      setSchedules([...schedules, data[0]]);
      setIsClassModalOpen(false);
      setClassSubject(''); setClassStartTime(''); setClassEndTime(''); setClassRoom('');
    }
    setIsSubmittingClass(false);
  };

  // --- FUNGSI CENTANG TUGAS (SELESAI) ---
  const toggleTaskCompletion = async (taskId: string, currentStatus: boolean) => {
    const { error } = await supabase.from('tasks').update({ is_completed: !currentStatus }).eq('id', taskId);
    if (error) {
      alert("Gagal memperbarui status tugas: " + error.message);
    } else {
      setTasks(tasks.map(t => t.id === taskId ? { ...t, is_completed: !currentStatus } : t));
    }
  };

  // --- KALKULASI STATISTIK ---
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.is_completed).length;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const urgentTasksCount = tasks.filter(t => t.priority === 'Tinggi' && !t.is_completed).length;
  const upcomingTasks = tasks.filter(t => !t.is_completed);

  return (
    <div className={`bg-[#eef5f7] dark:bg-[#1a1c1e] min-h-screen flex items-center justify-center p-4 transition-colors duration-300`}>
      <div className="bg-[#f8f9fa] dark:bg-[#1a1c1e] text-[#161d1f] dark:text-[#e2e2e5] min-h-screen sm:min-h-[800px] h-full sm:h-[800px] w-full max-w-md sm:rounded-[2.5rem] sm:shadow-2xl flex flex-col font-body-main antialiased relative overflow-hidden pb-20 transition-colors duration-300">
        
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

        {/* --- HEADER --- */}
        <header className="flex justify-between items-center px-[20px] py-[16px] w-full bg-[#f8f9fa] dark:bg-[#1a1c1e] sticky top-0 z-10 border-b border-[#e9ecef]/50 dark:border-[#44474e]/50 transition-colors duration-300">
          <div className="flex items-center gap-[4px] text-[#005da7] dark:text-[#a4c9ff] font-bold text-[20px]">EduDash</div>
          
          <div className="flex items-center gap-1">
            {/* TOMBOL NOTIFIKASI */}
            <button onClick={onNavigateNotification} className="hover:bg-[#eef5f7] dark:hover:bg-[#44474e] transition-colors rounded-full p-2 text-[#005da7] dark:text-[#a4c9ff] flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">notifications</span>
            </button>
          </div>
        </header>

        {/* --- MAIN CONTENT --- */}
        <main className="flex-grow w-full overflow-y-auto no-scrollbar px-[20px] py-[24px] flex flex-col gap-[24px]">
          
          <section className="flex flex-col gap-[8px]">
            <div>
              <h2 className="font-bold text-[24px] text-[#161d1f] dark:text-[#e2e2e5] mb-[4px] transition-colors">{greeting}, {userName} </h2>
              <p className="font-normal text-[14px] text-[#636e72] dark:text-[#c4c6d0] transition-colors">{currentDateString}</p>
            </div>
            <button 
              onClick={() => setIsTaskModalOpen(true)}
              className="mt-[8px] h-[48px] bg-[#005da7] text-[#ffffff] font-bold text-[14px] px-[24px] rounded-xl flex items-center justify-center gap-[8px] hover:bg-[#2976c7] active:scale-95 transition-all shadow-sm w-full"
            >
              <span className="material-symbols-outlined text-[18px]">add</span> {t.add_task}
            </button>
          </section>

          <section className="flex flex-col gap-[16px]">
            {/* PROGRESS CARD */}
            <div className="bg-[#ffffff] dark:bg-[#2b2d30] rounded-xl p-[16px] relative overflow-hidden border border-[#e9ecef] dark:border-[#44474e] shadow-sm transition-colors duration-300">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-[#5dd9d0]/20 dark:bg-[#5dd9d0]/10 rounded-full blur-2xl"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-[8px] mb-[8px] text-[#00837c] dark:text-[#7cf6ec]">
                  <span className="material-symbols-outlined text-[20px]">trending_up</span>
                  <h3 className="font-semibold text-[16px]">{t.today_progress}</h3>
                </div>
                <div className="flex items-end gap-[8px] mb-[4px]">
                  <span className="font-bold text-[32px] text-[#00837c] dark:text-[#7cf6ec] leading-none">{progressPercentage}%</span>
                </div>
                <p className="font-normal text-[14px] text-[#636e72] dark:text-[#c4c6d0]">{completedTasks} {t.of} {totalTasks} {t.tasks_completed}</p>
              </div>
              <div className="w-full bg-[#eef5f7] dark:bg-[#1a1c1e] h-2 rounded-full mt-[16px] overflow-hidden">
                <div className="bg-[#00837c] dark:bg-[#7cf6ec] h-full rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
              </div>
            </div>

            {/* RINGKASAN BOXES */}
            <div className="grid grid-cols-2 gap-[16px]">
              <div className="flex items-center gap-[8px] p-[12px] bg-[#eef5f7] dark:bg-[#1a1c1e] rounded-xl border border-[#c1c7d3]/30 dark:border-[#44474e] transition-colors duration-300">
                <div className="w-10 h-10 rounded-full bg-[#d4e3ff] dark:bg-[#004883]/50 flex items-center justify-center text-[#005da7] dark:text-[#a4c9ff] shrink-0">
                  <span className="material-symbols-outlined">task_alt</span>
                </div>
                <div>
                  <p className="font-semibold text-[16px] text-[#161d1f] dark:text-[#e2e2e5]">{totalTasks}</p>
                  <p className="font-normal text-[12px] text-[#636e72] dark:text-[#c4c6d0]">{t.total_tasks}</p>
                </div>
              </div>
              <div className="flex items-center gap-[8px] p-[12px] bg-[#ffdad6]/50 dark:bg-[#93000a]/20 rounded-xl border border-[#ff6b6b]/20 dark:border-[#ffb4ab]/20 transition-colors duration-300">
                <div className="w-10 h-10 rounded-full bg-[#ffdad6] dark:bg-[#93000a]/50 flex items-center justify-center text-[#ba1a1a] dark:text-[#ffb4ab] shrink-0">
                  <span className="material-symbols-outlined">warning</span>
                </div>
                <div>
                  <p className="font-semibold text-[16px] text-[#ba1a1a] dark:text-[#ffb4ab]">{urgentTasksCount}</p>
                  <p className="font-normal text-[12px] text-[#ba1a1a] dark:text-[#ffb4ab]">{t.urgent}</p>
                </div>
              </div>
            </div>

            {/* KELAS SELANJUTNYA */}
            <div className="bg-[#ffffff] dark:bg-[#2b2d30] rounded-xl p-[16px] relative border border-[#e9ecef] dark:border-[#44474e] shadow-sm transition-colors duration-300">
              <div className="flex justify-between items-center mb-[12px]">
                <div className="flex items-center gap-[8px] text-[#005da7] dark:text-[#a4c9ff]">
                  <span className="material-symbols-outlined">school</span>
                  <h3 className="font-semibold text-[16px]">{t.next_class}</h3>
                </div>
                <button onClick={onAddSchedule || (() => setIsClassModalOpen(true))} className="text-[#005da7] dark:text-[#a4c9ff] hover:bg-[#eef5f7] dark:hover:bg-[#44474e] rounded-full p-1 transition-colors">
                  <span className="material-symbols-outlined text-[20px]">add</span>
                </button>
              </div>
              
              {schedules.length === 0 ? (
                <p className="text-[12px] text-[#636e72] dark:text-[#c4c6d0] italic">{t.no_class}</p>
              ) : (
                <div className="flex items-start gap-[16px] bg-[#f8f9fa] dark:bg-[#1a1c1e] p-[16px] rounded-xl border border-[#e9ecef] dark:border-[#44474e] transition-colors duration-300">
                  <div className="flex flex-col items-center justify-center min-w-[60px] pr-[12px] border-r border-[#e9ecef] dark:border-[#44474e]">
                    <span className="font-semibold text-[14px] text-[#161d1f] dark:text-[#e2e2e5]">{schedules[0].start_time.slice(0,5)}</span>
                    <span className="font-normal text-[12px] text-[#636e72] dark:text-[#c4c6d0]">{schedules[0].end_time.slice(0,5)}</span>
                  </div>
                  <div className="flex-grow flex flex-col justify-center">
                    <h4 className="font-bold text-[16px] mb-[4px] text-[#161d1f] dark:text-[#e2e2e5]">{schedules[0].subject_name}</h4>
                    <div className="flex items-center gap-[4px] text-[#636e72] dark:text-[#c4c6d0]">
                      <span className="material-symbols-outlined text-[16px]">location_on</span>
                      <span className="font-normal text-[12px]">{schedules[0].room}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* TUGAS MENDATANG */}
            <div className="bg-[#ffffff] dark:bg-[#2b2d30] rounded-xl p-[16px] flex flex-col border border-[#e9ecef] dark:border-[#44474e] shadow-sm transition-colors duration-300">
              <div className="flex justify-between items-center mb-[16px]">
                <div className="flex items-center gap-[8px] text-[#161d1f] dark:text-[#e2e2e5]">
                  <span className="material-symbols-outlined">assignment</span>
                  <h3 className="font-semibold text-[16px]">{t.upcoming_tasks}</h3>
                </div>
                <button onClick={onNavigateTask} className="font-bold text-[12px] text-[#005da7] dark:text-[#a4c9ff]">{t.see_all}</button>
              </div>

              <div className="flex flex-col gap-[12px]">
                {loading ? (
                  <p className="text-center text-[#636e72] dark:text-[#c4c6d0] text-[14px] animate-pulse">{t.loading}</p>
                ) : upcomingTasks.length === 0 ? (
                  <div className="text-center py-4 text-[#636e72] dark:text-[#c4c6d0]">
                    <p className="text-[14px]">{t.all_done}</p>
                  </div>
                ) : (
                  upcomingTasks.slice(0, 3).map((task) => (
                    <div key={task.id} className="flex items-center justify-between gap-[12px] p-[12px] bg-[#f8f9fa] dark:bg-[#1a1c1e] rounded-xl border border-[#e9ecef] dark:border-[#44474e] relative overflow-hidden pl-[24px] transition-colors duration-300">
                      <div className={`absolute left-0 top-0 bottom-0 w-[4px] ${task.priority === 'Tinggi' ? 'bg-[#ff6b6b]' : task.priority === 'Sedang' ? 'bg-[#ffd93d]' : 'bg-[#005da7]'}`}></div>
                      <div className="flex-grow">
                        <span className="px-[8px] py-[2px] rounded-full bg-[#d4e3ff] text-[#001c39] dark:bg-[#004883] dark:text-[#d4e3ff] font-bold text-[10px] mb-1 inline-block">
                          {task.subject}
                        </span>
                        <h4 className="font-bold text-[14px] text-[#161d1f] dark:text-[#e2e2e5]">{task.title}</h4>
                        <p className="font-normal text-[12px] text-[#ff6b6b] dark:text-[#ffb4ab] mt-[2px]">Tenggat: {task.deadline}</p>
                      </div>
                      <button 
                        onClick={() => toggleTaskCompletion(task.id, task.is_completed)}
                        className="w-8 h-8 rounded-full border-2 border-[#c1c7d3] dark:border-[#44474e] hover:border-[#6bcb77] dark:hover:border-[#6bcb77] hover:bg-[#eef5f7] dark:hover:bg-[#44474e] group flex items-center justify-center shrink-0 transition-all focus:outline-none"
                      >
                        <span className="material-symbols-outlined text-[18px] text-transparent group-hover:text-[#6bcb77] transition-colors">check</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </main>

        {/* --- NAVIGATION BOTTOM --- */}
        <nav className="absolute bottom-0 w-full rounded-t-2xl bg-[#ffffff] dark:bg-[#1a1c1e] shadow-[0px_-4px_20px_rgba(0,0,0,0.05)] z-40 flex justify-around items-center px-[8px] py-[12px] border-t border-[#e9ecef] dark:border-[#44474e] transition-colors duration-300">
          <button className="flex flex-col items-center text-[#005da7] dark:text-[#a4c9ff] bg-[#d4e3ff]/50 dark:bg-[#004883]/50 rounded-xl px-4 py-2 transition-colors">
            <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
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

        {/* --- MODAL: TAMBAH TUGAS --- */}
        {isTaskModalOpen && (
          <div className="absolute inset-0 bg-[#161d1f]/60 z-50 flex flex-col justify-end">
            <div className="bg-[#ffffff] dark:bg-[#2b2d30] w-full rounded-t-3xl p-6 flex flex-col gap-4 animate-[fadeInUp_0.3s_ease-out]">
              <div className="flex justify-between items-center mb-2">
                <h2 className="font-bold text-[20px] text-[#161d1f] dark:text-[#e2e2e5]">{t.new_task}</h2>
                <button onClick={() => setIsTaskModalOpen(false)}><span className="material-symbols-outlined text-[#636e72] dark:text-[#c4c6d0]">close</span></button>
              </div>
              <form onSubmit={handleAddTask} className="flex flex-col gap-3">
                <input required placeholder={t.task_title} className="w-full p-3 rounded-xl border border-[#c1c7d3] dark:border-[#44474e] bg-[#ffffff] dark:bg-[#1a1c1e] text-[#161d1f] dark:text-[#e2e2e5] focus:outline-[#005da7] text-sm" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} disabled={isSubmittingTask} />
                <input required placeholder={t.subject} className="w-full p-3 rounded-xl border border-[#c1c7d3] dark:border-[#44474e] bg-[#ffffff] dark:bg-[#1a1c1e] text-[#161d1f] dark:text-[#e2e2e5] focus:outline-[#005da7] text-sm" value={taskSubject} onChange={e => setTaskSubject(e.target.value)} disabled={isSubmittingTask} />
                <textarea placeholder={t.notes} className="w-full p-3 rounded-xl border border-[#c1c7d3] dark:border-[#44474e] bg-[#ffffff] dark:bg-[#1a1c1e] text-[#161d1f] dark:text-[#e2e2e5] focus:outline-[#005da7] text-sm h-20" value={taskNote} onChange={e => setTaskNote(e.target.value)} disabled={isSubmittingTask} />
                <div className="flex gap-3">
                  <input required type="date" className="w-1/2 p-3 rounded-xl border border-[#c1c7d3] dark:border-[#44474e] bg-[#ffffff] dark:bg-[#1a1c1e] text-[#161d1f] dark:text-[#e2e2e5] focus:outline-[#005da7] text-sm" value={taskDeadline} onChange={e => setTaskDeadline(e.target.value)} disabled={isSubmittingTask} />
                  <select className="w-1/2 p-3 rounded-xl border border-[#c1c7d3] dark:border-[#44474e] bg-[#ffffff] dark:bg-[#1a1c1e] text-[#161d1f] dark:text-[#e2e2e5] focus:outline-[#005da7] text-sm" value={taskPriority} onChange={e => setTaskPriority(e.target.value as any)} disabled={isSubmittingTask}>
                    <option value="Rendah">{t.priority_low}</option>
                    <option value="Sedang">{t.priority_med}</option>
                    <option value="Tinggi">{t.priority_high}</option>
                  </select>
                </div>
                <button type="submit" disabled={isSubmittingTask} className="w-full mt-2 py-3 bg-[#005da7] text-white font-bold rounded-xl active:scale-95 transition-all disabled:opacity-70">
                  {isSubmittingTask ? t.saving : t.save_task}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* --- MODAL: TAMBAH KELAS --- */}
        {isClassModalOpen && (
          <div className="absolute inset-0 bg-[#161d1f]/60 z-50 flex flex-col justify-end">
            <div className="bg-[#ffffff] dark:bg-[#2b2d30] w-full rounded-t-3xl p-6 flex flex-col gap-4 animate-[fadeInUp_0.3s_ease-out]">
              <div className="flex justify-between items-center mb-2">
                <h2 className="font-bold text-[20px] text-[#161d1f] dark:text-[#e2e2e5]">{t.new_class}</h2>
                <button onClick={() => setIsClassModalOpen(false)}><span className="material-symbols-outlined text-[#636e72] dark:text-[#c4c6d0]">close</span></button>
              </div>
              <form onSubmit={handleAddClass} className="flex flex-col gap-3">
                <input required placeholder={t.class_subject} className="w-full p-3 rounded-xl border border-[#c1c7d3] dark:border-[#44474e] bg-[#ffffff] dark:bg-[#1a1c1e] text-[#161d1f] dark:text-[#e2e2e5] focus:outline-[#005da7] text-sm" value={classSubject} onChange={e => setClassSubject(e.target.value)} disabled={isSubmittingClass} />
                <div className="flex gap-3">
                  <div className="w-1/2 flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[#636e72] dark:text-[#c4c6d0] ml-1">{t.start_time}</label>
                    <input required type="time" className="w-full p-3 rounded-xl border border-[#c1c7d3] dark:border-[#44474e] bg-[#ffffff] dark:bg-[#1a1c1e] text-[#161d1f] dark:text-[#e2e2e5] focus:outline-[#005da7] text-sm" value={classStartTime} onChange={e => setClassStartTime(e.target.value)} disabled={isSubmittingClass} />
                  </div>
                  <div className="w-1/2 flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[#636e72] dark:text-[#c4c6d0] ml-1">{t.end_time}</label>
                    <input required type="time" className="w-full p-3 rounded-xl border border-[#c1c7d3] dark:border-[#44474e] bg-[#ffffff] dark:bg-[#1a1c1e] text-[#161d1f] dark:text-[#e2e2e5] focus:outline-[#005da7] text-sm" value={classEndTime} onChange={e => setClassEndTime(e.target.value)} disabled={isSubmittingClass} />
                  </div>
                </div>
                <div className="flex gap-3">
                  <select required className="w-1/2 p-3 rounded-xl border border-[#c1c7d3] dark:border-[#44474e] bg-[#ffffff] dark:bg-[#1a1c1e] text-[#161d1f] dark:text-[#e2e2e5] focus:outline-[#005da7] text-sm" value={classDay} onChange={e => setClassDay(e.target.value)} disabled={isSubmittingClass}>
                    <option value="Senin">Senin</option><option value="Selasa">Selasa</option>
                    <option value="Rabu">Rabu</option><option value="Kamis">Kamis</option>
                    <option value="Jumat">Jumat</option>
                  </select>
                  <input placeholder={t.room} className="w-1/2 p-3 rounded-xl border border-[#c1c7d3] dark:border-[#44474e] bg-[#ffffff] dark:bg-[#1a1c1e] text-[#161d1f] dark:text-[#e2e2e5] focus:outline-[#005da7] text-sm" value={classRoom} onChange={e => setClassRoom(e.target.value)} disabled={isSubmittingClass} />
                </div>
                <button type="submit" disabled={isSubmittingClass} className="w-full mt-2 py-3 bg-[#005da7] text-white font-bold rounded-xl active:scale-95 transition-all disabled:opacity-70">
                  {isSubmittingClass ? t.saving : t.save_class}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}