import React, { useState, useEffect } from 'react';
import { supabase } from "../lib/supabase";
import { usePreferences } from '../contexts/PreferencesContext';

// --- TYPES & INTERFACES ---
export interface Task {
  id: string;
  title: string;
  subject: string;
  description: string;
  deadline: string; 
  priority: 'Rendah' | 'Sedang' | 'Tinggi';
  is_completed: boolean;
  user_id?: string;
}

type NewTask = Omit<Task, 'id'>;
type TabType = 'Semua' | 'Hari Ini' | 'Mendatang' | 'Selesai';
type SortType = 'deadline' | 'priority' | 'name'; 

export interface TasksProps {
  userId?: string; 
  onNavigateHome?: () => void;
  onNavigateSchedule?: () => void;
  onNavigateStats?: () => void;
  onNavigateProfile?: () => void;
  onNavigateNotification?: () => void; 
}

// --- KAMUS BAHASA (DICTIONARY) ---
const dict = {
  id: {
    title: "EduDash",
    my_tasks: "Tugas Saya",
    search_placeholder: "Cari tugas...",
    loading: "Memuat tugas...",
    empty_title: "Belum Ada Tugas",
    empty_today: "Tidak ada tugas yang jatuh tempo hari ini.",
    empty_other: "Belum ada tugas di kategori ini. Klik tombol + untuk membuat baru.",
    due: "Tenggat",
    mark_undone: "Tandai belum selesai",
    mark_done: "Tandai selesai",
    delete_task: "Hapus Tugas",
    sort_by: "Urutkan berdasarkan:",
    sort_deadline: "Tenggat Waktu",
    sort_priority: "Prioritas",
    sort_name: "Nama (A-Z)",
    add_task: "Tambah Tugas",
    new_task: "Tambah Tugas Baru",
    task_title: "Judul Tugas (cth: Laporan Keamanan)",
    subject: "Mata Pelajaran (cth: Jaringan)",
    notes: "Catatan tambahan...",
    priority_low: "Prioritas: Rendah",
    priority_med: "Prioritas: Sedang",
    priority_high: "Prioritas: Tinggi",
    save_task: "Simpan Tugas",
    saving: "Menyimpan...",
    session_error: "Sesi tidak ditemukan, silakan login ulang.",
    save_error: "Gagal menyimpan tugas. Pastikan koneksi Supabase sudah benar.",
    update_error: "Gagal memperbarui status tugas: ",
    delete_confirm: "Apakah Anda yakin ingin menghapus tugas ini?",
    tab_all: "Semua",
    tab_today: "Hari Ini",
    tab_upcoming: "Mendatang",
    tab_done: "Selesai",
    nav_home: "Beranda",
    nav_tasks: "Tugas",
    nav_schedule: "Jadwal",
    nav_stats: "Statistik",
    nav_profile: "Profil"
  },
  en: {
    title: "EduDash",
    my_tasks: "My Tasks",
    search_placeholder: "Search tasks...",
    loading: "Loading tasks...",
    empty_title: "No Tasks Yet",
    empty_today: "No tasks due today.",
    empty_other: "No tasks in this category. Click the + button to create a new one.",
    due: "Due",
    mark_undone: "Mark as undone",
    mark_done: "Mark as done",
    delete_task: "Delete Task",
    sort_by: "Sort by:",
    sort_deadline: "Deadline",
    sort_priority: "Priority",
    sort_name: "Name (A-Z)",
    add_task: "Add Task",
    new_task: "Add New Task",
    task_title: "Task Title (e.g., Security Report)",
    subject: "Subject (e.g., Networking)",
    notes: "Additional notes...",
    priority_low: "Priority: Low",
    priority_med: "Priority: Medium",
    priority_high: "Priority: High",
    save_task: "Save Task",
    saving: "Saving...",
    session_error: "Session not found, please login again.",
    save_error: "Failed to save task. Ensure Supabase connection is correct.",
    update_error: "Failed to update task status: ",
    delete_confirm: "Are you sure you want to delete this task?",
    tab_all: "All",
    tab_today: "Today",
    tab_upcoming: "Upcoming",
    tab_done: "Completed",
    nav_home: "Home",
    nav_tasks: "Tasks",
    nav_schedule: "Schedule",
    nav_stats: "Stats",
    nav_profile: "Profile"
  }
};

export default function Tasks({ 
  userId,
  onNavigateHome,
  onNavigateSchedule,
  onNavigateStats,
  onNavigateProfile,
  onNavigateNotification 
}: TasksProps) {
  
  const { lang, theme } = usePreferences();
  const t = dict[lang];

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  const [activeTab, setActiveTab] = useState<TabType>('Hari Ini');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [sortType, setSortType] = useState<SortType>('deadline');
  const [isSortMenuOpen, setIsSortMenuOpen] = useState<boolean>(false);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskSubject, setTaskSubject] = useState('');
  const [taskNote, setTaskNote] = useState('');
  const [taskDeadline, setTaskDeadline] = useState('');
  const [taskPriority, setTaskPriority] = useState<'Rendah' | 'Sedang' | 'Tinggi'>('Sedang');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);
  
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('deadline', { ascending: true });

      if (error) {
        console.error('Gagal mengambil data tugas:', error.message);
      } else {
        setTasks((data as Task[]) || []);
      }
    } catch (err) {
      console.error('Error saat fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!taskTitle.trim() || !taskSubject.trim() || !taskDeadline) return;

    try {
      setIsSubmitting(true);
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id || userId;

      if (!currentUserId) {
        alert(t.session_error);
        return;
      }
      
      const newTaskData: NewTask = {
        title: taskTitle,
        subject: taskSubject,
        description: taskNote,
        deadline: taskDeadline,
        priority: taskPriority,
        is_completed: false,
        user_id: currentUserId 
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert([newTaskData])
        .select();

      if (error) {
        console.error('Gagal menambah tugas:', error.message);
        alert(t.save_error);
      } else if (data) {
        setTasks((prev) => [data[0] as Task, ...prev]); 
        
        setTaskTitle('');
        setTaskSubject('');
        setTaskNote('');
        setTaskDeadline('');
        setTaskPriority('Sedang');
        setIsModalOpen(false);
      }
    } catch (err) {
      console.error('Error saat membuat tugas:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleComplete = async (taskId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ is_completed: !currentStatus })
        .eq('id', taskId);

      if (error) {
        console.error('Gagal mengupdate status:', error.message);
        alert(t.update_error + error.message);
      } else {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, is_completed: !currentStatus } : t))
        );
      }
    } catch (err) {
      console.error('Error toggle complete:', err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm(t.delete_confirm)) return;
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) {
        console.error('Gagal menghapus tugas:', error.message);
      } else {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
      }
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  let processedTasks = tasks.filter((task) => {
    const matchesSearch = 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.subject.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    const taskDate = new Date(task.deadline);
    const today = new Date();
    const isToday = 
      taskDate.getDate() === today.getDate() &&
      taskDate.getMonth() === today.getMonth() &&
      taskDate.getFullYear() === today.getFullYear();

    if (activeTab === 'Hari Ini') {
      return isToday && !task.is_completed;
    } else if (activeTab === 'Mendatang') {
      today.setHours(0,0,0,0);
      taskDate.setHours(0,0,0,0);
      return taskDate > today && !task.is_completed;
    } else if (activeTab === 'Selesai') {
      return task.is_completed;
    }
    
    return true; 
  });

  processedTasks.sort((a, b) => {
    if (sortType === 'deadline') {
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    } else if (sortType === 'priority') {
      const priorityWeight: Record<string, number> = { 'Tinggi': 3, 'Sedang': 2, 'Rendah': 1 };
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    } else if (sortType === 'name') {
      return a.title.localeCompare(b.title);
    }
    return 0;
  });

  const filteredTasks = processedTasks;
  const tabOptions: TabType[] = ['Semua', 'Hari Ini', 'Mendatang', 'Selesai'];

  const getTabText = (tab: TabType) => {
    if (tab === 'Semua') return t.tab_all;
    if (tab === 'Hari Ini') return t.tab_today;
    if (tab === 'Mendatang') return t.tab_upcoming;
    if (tab === 'Selesai') return t.tab_done;
    return tab;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Tinggi': return '#ff6b6b'; 
      case 'Sedang': return '#ffd93d'; 
      case 'Rendah': return '#00837c'; 
      default: return '#005da7'; 
    }
  };

  // Fungsi merapikan format tanggal
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { 
        day: 'numeric', month: 'long', year: 'numeric' 
      });
    } catch {
      return dateString.split('T')[0];
    }
  };

  return (
    <div className={`bg-[#eef5f7] dark:bg-[#1a1c1e] min-h-screen flex items-center justify-center p-4 transition-colors duration-300 relative`}>
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
        <header className="flex justify-between items-center px-[20px] py-[16px] w-full bg-[#f8f9fa] dark:bg-[#1a1c1e] sticky top-0 z-10 border-b border-[#e9ecef]/50 dark:border-[#44474e]/50 shrink-0 transition-colors duration-300">
          <div className="flex items-center gap-[8px]">
            <button onClick={onNavigateHome} className="hover:bg-[#eef5f7] dark:hover:bg-[#44474e] transition-colors rounded-full p-1 text-[#005da7] dark:text-[#a4c9ff] flex items-center justify-center -ml-1">
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            <div className="text-[#005da7] dark:text-[#a4c9ff] font-bold text-[20px]">{t.title}</div>
          </div>
          
          <div className="flex items-center gap-1">
            <button onClick={onNavigateNotification} className="hover:bg-[#eef5f7] dark:hover:bg-[#44474e] transition-colors rounded-full p-2 text-[#005da7] dark:text-[#a4c9ff] flex items-center justify-center -mr-2" aria-label="Notifikasi">
              <span className="material-symbols-outlined">notifications</span>
            </button>
          </div>
        </header>

        {/* --- MAIN CONTENT --- */}
        <main className="flex-grow w-full overflow-y-auto no-scrollbar px-[20px] py-[24px] flex flex-col gap-[20px]">
          
          <div className="shrink-0">
            <h2 className="font-bold text-[24px] text-[#161d1f] dark:text-[#e2e2e5] transition-colors">{t.my_tasks}</h2>
          </div>

          {/* Search and Filter */}
          <div className="flex gap-[12px] items-center shrink-0 relative">
            <div className="relative flex-grow">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#717783] dark:text-[#8e9099] text-[20px]">search</span>
              <input 
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="w-full bg-[#ffffff] dark:bg-[#2b2d30] border border-[#c1c7d3] dark:border-[#44474e] rounded-[16px] py-[12px] pl-[40px] pr-[16px] text-[14px] text-[#161d1f] dark:text-[#e2e2e5] placeholder:text-[#717783] dark:placeholder:text-[#8e9099] focus:border-[#005da7] focus:ring-1 focus:ring-[#005da7] focus:outline-none transition-all shadow-sm" 
                placeholder={t.search_placeholder}
                type="text" 
              />
            </div>
            <button 
              onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
              className={`border rounded-[16px] w-[46px] h-[46px] flex items-center justify-center transition-colors shadow-sm shrink-0 ${isSortMenuOpen ? 'bg-[#eef5f7] dark:bg-[#44474e] border-[#005da7] dark:border-[#a4c9ff] text-[#005da7] dark:text-[#a4c9ff]' : 'bg-[#ffffff] dark:bg-[#2b2d30] border-[#c1c7d3] dark:border-[#44474e] text-[#414751] dark:text-[#c4c6d0] hover:bg-[#eef5f7] dark:hover:bg-[#44474e]'}`} 
              aria-label="Filter"
            >
              <span className="material-symbols-outlined text-[20px]">filter_list</span>
            </button>

            {/* SORTING MENU DROPDOWN */}
            {isSortMenuOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setIsSortMenuOpen(false)}></div>
                <div className="absolute right-0 top-[56px] w-[200px] bg-[#ffffff] dark:bg-[#2b2d30] border border-[#e9ecef] dark:border-[#44474e] rounded-xl shadow-lg z-30 flex flex-col py-2 transition-colors duration-300 animate-[fadeIn_0.2s_ease-out]">
                  <p className="text-[10px] font-bold text-[#717783] dark:text-[#8e9099] px-4 pb-2 mb-1 border-b border-[#e9ecef] dark:border-[#44474e] uppercase tracking-wider">{t.sort_by}</p>
                  
                  <button onClick={() => { setSortType('deadline'); setIsSortMenuOpen(false); }} className={`flex items-center justify-between px-4 py-2 text-[13px] hover:bg-[#f8f9fa] dark:hover:bg-[#44474e] transition-colors ${sortType === 'deadline' ? 'text-[#005da7] dark:text-[#a4c9ff] font-semibold' : 'text-[#161d1f] dark:text-[#e2e2e5]'}`}>
                    {t.sort_deadline}
                    {sortType === 'deadline' && <span className="material-symbols-outlined text-[16px]">check</span>}
                  </button>
                  
                  <button onClick={() => { setSortType('priority'); setIsSortMenuOpen(false); }} className={`flex items-center justify-between px-4 py-2 text-[13px] hover:bg-[#f8f9fa] dark:hover:bg-[#44474e] transition-colors ${sortType === 'priority' ? 'text-[#005da7] dark:text-[#a4c9ff] font-semibold' : 'text-[#161d1f] dark:text-[#e2e2e5]'}`}>
                    {t.sort_priority}
                    {sortType === 'priority' && <span className="material-symbols-outlined text-[16px]">check</span>}
                  </button>
                  
                  <button onClick={() => { setSortType('name'); setIsSortMenuOpen(false); }} className={`flex items-center justify-between px-4 py-2 text-[13px] hover:bg-[#f8f9fa] dark:hover:bg-[#44474e] transition-colors ${sortType === 'name' ? 'text-[#005da7] dark:text-[#a4c9ff] font-semibold' : 'text-[#161d1f] dark:text-[#e2e2e5]'}`}>
                    {t.sort_name}
                    {sortType === 'name' && <span className="material-symbols-outlined text-[16px]">check</span>}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Tabs */}
          <div className="flex w-full overflow-x-auto gap-[8px] py-3 px-[2px] no-scrollbar items-center shrink-0">
            {tabOptions.map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-[16px] py-[8px] rounded-full border text-[13px] font-semibold whitespace-nowrap flex-shrink-0 transition-all ${
                  activeTab === tab 
                    ? 'border-[#005da7] dark:border-[#a4c9ff] bg-[#005da7] dark:bg-[#a4c9ff] text-[#ffffff] dark:text-[#00315b] shadow-sm' 
                    : 'border-[#c1c7d3] dark:border-[#44474e] bg-[#ffffff] dark:bg-[#2b2d30] text-[#414751] dark:text-[#c4c6d0] hover:bg-[#eef5f7] dark:hover:bg-[#44474e]'
                }`}
              >
                {getTabText(tab)}
              </button>
            ))}
          </div>

          {/* Task List (Dynamic Render) */}
          <div className="flex flex-col gap-[12px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-[#717783] dark:text-[#8e9099]">
                <span className="material-symbols-outlined animate-spin text-[32px] mb-2">progress_activity</span>
                <p className="text-[14px]">{t.loading}</p>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-[#717783] dark:text-[#8e9099] bg-[#ffffff] dark:bg-[#2b2d30] rounded-2xl border border-dashed border-[#c1c7d3] dark:border-[#44474e] p-6 mt-4 transition-colors duration-300">
                <div className="w-16 h-16 bg-[#eef5f7] dark:bg-[#1a1c1e] rounded-full flex items-center justify-center text-[#005da7] dark:text-[#a4c9ff] mb-3">
                  <span className="material-symbols-outlined text-[32px]">task_alt</span>
                </div>
                <h4 className="font-bold text-[16px] text-[#161d1f] dark:text-[#e2e2e5] mb-1">{t.empty_title}</h4>
                <p className="text-[12px] max-w-[200px]">
                  {activeTab === 'Hari Ini' ? t.empty_today : t.empty_other}
                </p>
              </div>
            ) : (
              filteredTasks.map((task) => {
                const accentColor = getPriorityColor(task.priority);

                return (
                  <div 
                    key={task.id}
                    className={`bg-[#ffffff] dark:bg-[#2b2d30] rounded-2xl p-[16px] shadow-[0px_2px_8px_rgba(0,0,0,0.04)] border border-[#e9ecef] dark:border-[#44474e] relative overflow-hidden flex flex-col transition-all duration-300 ${
                      task.is_completed ? 'opacity-60' : ''
                    }`}
                  >
                    <div 
                      className="absolute left-0 top-0 bottom-0 w-[4px]" 
                      style={{ backgroundColor: accentColor }}
                    />
                    
                    <div className="flex justify-between items-center ml-[8px]">
                      <div>
                        <span 
                          className="inline-block font-bold text-[10px] px-2 py-1 rounded-full mb-1"
                          style={{ 
                            backgroundColor: `${accentColor}20`,
                            color: accentColor === '#ffd93d' ? (theme === 'dark' ? '#ffd93d' : '#b58b00') : accentColor 
                          }}
                        >
                          {task.subject}
                        </span>
                        <h3 className={`font-bold text-[16px] text-[#161d1f] dark:text-[#e2e2e5] transition-colors ${task.is_completed ? 'line-through text-[#717783] dark:text-[#8e9099]' : ''}`}>
                          {task.title}
                        </h3>
                        {/* Format tanggal diperbaiki di sini */}
                        <p className={`font-normal text-[12px] mt-[2px] transition-colors ${task.is_completed ? 'text-[#717783] dark:text-[#8e9099]' : 'text-[#ff6b6b] dark:text-[#ffb4ab]'}`}>
                          {t.due}: {formatDate(task.deadline)}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => handleToggleComplete(task.id, task.is_completed)}
                          className={`p-1 rounded-full transition-colors ${
                            task.is_completed ? 'text-[#00837c] dark:text-[#7cf6ec]' : 'text-[#c1c7d3] dark:text-[#44474e] hover:text-[#00837c] dark:hover:text-[#7cf6ec]'
                          }`}
                          title={task.is_completed ? t.mark_undone : t.mark_done}
                        >
                          <span 
                            className="material-symbols-outlined text-[24px]" 
                            style={{ fontVariationSettings: task.is_completed ? "'FILL' 1" : "'FILL' 0" }}
                          >
                            check_circle
                          </span>
                        </button>

                        <button 
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-1 text-[#c1c7d3] dark:text-[#44474e] hover:text-[#ff6b6b] dark:hover:text-[#ffb4ab] transition-colors"
                          title={t.delete_task}
                        >
                          <span className="material-symbols-outlined text-[24px]">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </main>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="absolute bottom-[90px] right-[20px] w-[56px] h-[56px] bg-[#005da7] dark:bg-[#a4c9ff] text-[#ffffff] dark:text-[#00315b] rounded-2xl shadow-[0px_10px_30px_rgba(0,93,167,0.3)] dark:shadow-none flex items-center justify-center active:scale-95 transition-transform z-40 hover:bg-[#004b87] dark:hover:bg-[#82b1ff]"
          aria-label={t.add_task}
        >
          <span className="material-symbols-outlined text-[24px]">add</span>
        </button>

        {/* --- MODAL TAMBAH TUGAS --- */}
        {isModalOpen && (
          <div className="absolute inset-0 bg-[#161d1f]/60 z-50 flex flex-col justify-end">
            <div className="bg-[#ffffff] dark:bg-[#2b2d30] w-full rounded-t-3xl p-6 flex flex-col gap-4 animate-[fadeInUp_0.3s_ease-out] transition-colors duration-300">
              <div className="flex justify-between items-center mb-2">
                <h2 className="font-bold text-[20px] text-[#161d1f] dark:text-[#e2e2e5]">{t.new_task}</h2>
                <button onClick={() => setIsModalOpen(false)}><span className="material-symbols-outlined text-[#636e72] dark:text-[#c4c6d0]">close</span></button>
              </div>
              <form onSubmit={handleAddTask} className="flex flex-col gap-3">
                <input required placeholder={t.task_title} className="w-full p-3 rounded-xl border border-[#c1c7d3] dark:border-[#44474e] bg-[#ffffff] dark:bg-[#1a1c1e] text-[#161d1f] dark:text-[#e2e2e5] focus:outline-[#005da7] text-sm transition-colors" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} disabled={isSubmitting} />
                <input required placeholder={t.subject} className="w-full p-3 rounded-xl border border-[#c1c7d3] dark:border-[#44474e] bg-[#ffffff] dark:bg-[#1a1c1e] text-[#161d1f] dark:text-[#e2e2e5] focus:outline-[#005da7] text-sm transition-colors" value={taskSubject} onChange={e => setTaskSubject(e.target.value)} disabled={isSubmitting} />
                <textarea placeholder={t.notes} className="w-full p-3 rounded-xl border border-[#c1c7d3] dark:border-[#44474e] bg-[#ffffff] dark:bg-[#1a1c1e] text-[#161d1f] dark:text-[#e2e2e5] focus:outline-[#005da7] text-sm h-20 transition-colors" value={taskNote} onChange={e => setTaskNote(e.target.value)} disabled={isSubmitting} />
                <div className="flex gap-3">
                  <input required type="date" className="w-1/2 p-3 rounded-xl border border-[#c1c7d3] dark:border-[#44474e] bg-[#ffffff] dark:bg-[#1a1c1e] text-[#161d1f] dark:text-[#e2e2e5] focus:outline-[#005da7] text-sm transition-colors" value={taskDeadline} onChange={e => setTaskDeadline(e.target.value)} disabled={isSubmitting} />
                  <select className="w-1/2 p-3 rounded-xl border border-[#c1c7d3] dark:border-[#44474e] bg-[#ffffff] dark:bg-[#1a1c1e] text-[#161d1f] dark:text-[#e2e2e5] focus:outline-[#005da7] text-sm transition-colors" value={taskPriority} onChange={e => setTaskPriority(e.target.value as any)} disabled={isSubmitting}>
                    <option value="Rendah">{t.priority_low}</option>
                    <option value="Sedang">{t.priority_med}</option>
                    <option value="Tinggi">{t.priority_high}</option>
                  </select>
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full mt-2 py-3 bg-[#005da7] text-white font-bold rounded-xl active:scale-95 transition-all disabled:opacity-70">
                  {isSubmitting ? t.saving : t.save_task}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* --- NAVIGATION BOTTOM --- */}
        <nav className="absolute bottom-0 w-full rounded-t-2xl bg-[#ffffff] dark:bg-[#1a1c1e] shadow-[0px_-4px_20px_rgba(0,0,0,0.05)] z-40 flex justify-around items-center px-[8px] py-[12px] border-t border-[#e9ecef] dark:border-[#44474e] transition-colors duration-300">
          <button onClick={onNavigateHome} className="flex flex-col items-center text-[#636e72] dark:text-[#8e9099] hover:text-[#005da7] dark:hover:text-[#a4c9ff] px-4 py-2 transition-colors">
            <span className="material-symbols-outlined text-[24px]">home</span>
            <span className="font-bold text-[10px] mt-[2px]">{t.nav_home}</span>
          </button>
          
          <button className="flex flex-col items-center text-[#005da7] dark:text-[#a4c9ff] bg-[#d4e3ff]/50 dark:bg-[#004883]/50 rounded-xl px-4 py-2 transition-colors">
            <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>assignment</span>
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