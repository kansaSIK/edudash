import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase'; 
import { usePreferences } from '../contexts/PreferencesContext'; 

// --- TYPES ---
interface Schedule {
  id: string;
  subject_name: string;
  start_time: string;
  end_time: string;
  day_of_week: string;
  room?: string;
}

interface AppEvent {
  id: string;
  title: string;
  event_date: string;
  start_time: string;
  end_time: string;
  location?: string;
}

interface SchedulesProps {
  userId?: string;
  onNavigateHome: () => void;
  onNavigateTask: () => void;
  onNavigateSchedule: () => void;
  onNavigateStats?: () => void;
  onNavigateProfile?: () => void;
  autoOpenModal?: boolean;
  onResetAutoOpenModal?: () => void;
  onNavigateNotification?: () => void; 
}

const DAYS_DB = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

// --- KAMUS BAHASA ---
const dict = {
  id: {
    title: "Jadwal Saya",
    tab_class: "Pelajaran",
    tab_event: "Kegiatan",
    days: {
      'Senin': 'Senin', 'Selasa': 'Selasa', 'Rabu': 'Rabu', 
      'Kamis': 'Kamis', 'Jumat': 'Jumat', 'Sabtu': 'Sabtu', 'Minggu': 'Minggu'
    },
    loading_class: "Memuat jadwal...",
    empty_class: "Belum ada jadwal untuk hari ",
    loading_event: "Memuat kegiatan...",
    empty_event: "Tidak ada kegiatan mendatang.",
    menu_edit: "Edit",
    menu_delete: "Hapus",
    menu_done: "Selesai",
    add_class: "Tambah Pelajaran",
    edit_class: "Edit Pelajaran",
    add_event: "Tambah Kegiatan",
    edit_event: "Edit Kegiatan",
    subject_placeholder: "Mata Pelajaran (cth: Matematika)",
    start_time: "Jam Mulai",
    end_time: "Jam Selesai",
    room_placeholder: "Ruang (Opsional)",
    save_class: "Simpan Pelajaran",
    save_changes: "Simpan Perubahan",
    event_placeholder: "Nama Kegiatan (cth: Rapat OSIS)",
    event_date: "Tanggal",
    event_start: "Mulai",
    event_end: "Selesai",
    location_placeholder: "Lokasi (Opsional)",
    save_event: "Simpan Kegiatan",
    session_exp: "Sesi login berakhir. Silakan login ulang.",
    err_save_class: "Gagal menyimpan jadwal pelajaran: ",
    err_save_event: "Gagal menyimpan kegiatan: ",
    confirm_del_class: "Yakin ingin menghapus jadwal ini?",
    err_del_class: "Gagal menghapus jadwal: ",
    confirm_del_event: "Yakin ingin menghapus kegiatan ini?",
    err_del_event: "Gagal memproses kegiatan: "
  },
  en: {
    title: "My Schedule",
    tab_class: "Classes",
    tab_event: "Events",
    days: {
      'Senin': 'Monday', 'Selasa': 'Tuesday', 'Rabu': 'Wednesday', 
      'Kamis': 'Thursday', 'Jumat': 'Friday', 'Sabtu': 'Saturday', 'Minggu': 'Sunday'
    },
    loading_class: "Loading schedule...",
    empty_class: "No schedule for ",
    loading_event: "Loading events...",
    empty_event: "No upcoming events.",
    menu_edit: "Edit",
    menu_delete: "Delete",
    menu_done: "Done",
    add_class: "Add Class",
    edit_class: "Edit Class",
    add_event: "Add Event",
    edit_event: "Edit Event",
    subject_placeholder: "Subject (e.g., Mathematics)",
    start_time: "Start Time",
    end_time: "End Time",
    room_placeholder: "Room (Optional)",
    save_class: "Save Class",
    save_changes: "Save Changes",
    event_placeholder: "Event Name (e.g., Club Meeting)",
    event_date: "Date",
    event_start: "Start",
    event_end: "End",
    location_placeholder: "Location (Optional)",
    save_event: "Save Event",
    session_exp: "Login session expired. Please login again.",
    err_save_class: "Failed to save class schedule: ",
    err_save_event: "Failed to save event: ",
    confirm_del_class: "Are you sure you want to delete this schedule?",
    err_del_class: "Failed to delete schedule: ",
    confirm_del_event: "Are you sure you want to delete this event?",
    err_del_event: "Failed to process event: "
  }
};

export default function Schedules({
  onNavigateHome,
  autoOpenModal = false,
  onResetAutoOpenModal,
  onNavigateNotification 
}: SchedulesProps) {

  const { lang } = usePreferences();
  const t = dict[lang];

  const [activeTab, setActiveTab] = useState<'pelajaran' | 'kegiatan'>('pelajaran');
  const [selectedDay, setSelectedDay] = useState<string>('Senin'); 

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [events, setEvents] = useState<AppEvent[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [editItemId, setEditItemId] = useState<string | null>(null);

  const [formSubject, setFormSubject] = useState('');
  const [formStartTime, setFormStartTime] = useState('');
  const [formEndTime, setFormEndTime] = useState('');
  const [formDay, setFormDay] = useState('Senin'); 
  const [formRoom, setFormRoom] = useState('');

  const [formEventTitle, setFormEventTitle] = useState('');
  const [formEventDate, setFormEventDate] = useState('');
  const [formEventStartTime, setFormEventStartTime] = useState('');
  const [formEventEndTime, setFormEventEndTime] = useState('');
  const [formEventLocation, setFormEventLocation] = useState('');

  useEffect(() => {
    if (autoOpenModal) {
      resetForms();
      setIsModalOpen(true);
      if (onResetAutoOpenModal) onResetAutoOpenModal();
    }
  }, [autoOpenModal, onResetAutoOpenModal]);

  const fetchSchedules = async (day: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('day_of_week', day)
        .order('start_time', { ascending: true });

      if (error) throw error;
      setSchedules(data || []);
    } catch (error: any) {
      console.error('Error fetching schedules:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .gte('event_date', today)
        .order('event_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error: any) {
      console.error('Error fetching events:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'pelajaran') fetchSchedules(selectedDay);
    else fetchEvents();
  }, [activeTab, selectedDay]);

  const handleSubmitSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        alert(t.session_exp);
        return;
      }

      const payload = {
        user_id: session.user.id,
        subject_name: formSubject,
        start_time: formStartTime,
        end_time: formEndTime,
        day_of_week: formDay,
        room: formRoom || '-',
      };

      if (isEditMode && editItemId) {
        const { error } = await supabase.from('schedules').update(payload).eq('id', editItemId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('schedules').insert([payload]);
        if (error) throw error;
      }

      closeModal();
      if (formDay === selectedDay) {
        fetchSchedules(selectedDay);
      } else {
        setSelectedDay(formDay);
      }
    } catch (error: any) {
      alert(t.err_save_class + error.message);
    }
  };

  const handleSubmitEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        alert(t.session_exp);
        return;
      }

      const payload = {
        user_id: session.user.id,
        title: formEventTitle,
        event_date: formEventDate,
        start_time: formEventStartTime,
        end_time: formEventEndTime,
        location: formEventLocation || '-',
      };

      if (isEditMode && editItemId) {
        const { error } = await supabase.from('events').update(payload).eq('id', editItemId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('events').insert([payload]);
        if (error) throw error;
      }

      closeModal();
      fetchEvents();
    } catch (error: any) {
      alert(t.err_save_event + error.message);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    setActiveMenuId(null);
    // HAPUS setTimeout agar popup window.confirm tidak diblokir HP
    if (!window.confirm(t.confirm_del_class)) return;
    try {
      const { error } = await supabase.from('schedules').delete().eq('id', id);
      if (error) throw error;
      fetchSchedules(selectedDay);
    } catch (error: any) {
      alert(t.err_del_class + error.message);
    }
  };

  const handleDeleteEvent = async (id: string, isDone: boolean = false) => {
    setActiveMenuId(null);
    // HAPUS setTimeout agar popup window.confirm tidak diblokir HP
    if (!isDone && !window.confirm(t.confirm_del_event)) return;
    try {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
      fetchEvents();
    } catch (error: any) {
      alert(t.err_del_event + error.message);
    }
  };

  const openEditSchedule = (sched: Schedule) => {
    setFormSubject(sched.subject_name);
    setFormStartTime(sched.start_time);
    setFormEndTime(sched.end_time);
    setFormDay(sched.day_of_week);
    setFormRoom(sched.room && sched.room !== '-' ? sched.room : '');
    setIsEditMode(true);
    setEditItemId(sched.id);
    setActiveMenuId(null);
    setIsModalOpen(true);
  };

  const openEditEvent = (evt: AppEvent) => {
    setFormEventTitle(evt.title);
    setFormEventDate(evt.event_date);
    setFormEventStartTime(evt.start_time);
    setFormEventEndTime(evt.end_time);
    setFormEventLocation(evt.location && evt.location !== '-' ? evt.location : '');
    setIsEditMode(true);
    setEditItemId(evt.id);
    setActiveMenuId(null);
    setIsModalOpen(true);
  };

  const resetForms = () => {
    setFormSubject(''); setFormStartTime(''); setFormEndTime(''); setFormRoom(''); setFormDay(selectedDay);
    setFormEventTitle(''); setFormEventDate(''); setFormEventStartTime(''); setFormEventEndTime(''); setFormEventLocation('');
    setIsEditMode(false);
    setEditItemId(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForms();
  };

  const formatTanggalEvent = (dateString: string) => {
    const date = new Date(dateString);
    return { 
      day: date.getDate(), 
      month: date.toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { month: 'short' }) 
    };
  };

  return (
    <div className="w-full bg-[#f8f9fa] dark:bg-[#1a1c1e] text-[#161d1f] dark:text-[#e2e2e5] font-body-main antialiased transition-colors duration-300 pb-10">
      
      <style dangerouslySetInnerHTML={{
  __html: `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
    
    body { 
      font-family: 'Plus Jakarta Sans', sans-serif; 
      
      /* MENCEGAH TEKS DIBLOK (HIGHLIGHT) */
      -webkit-user-select: none; /* Safari */
      -ms-user-select: none; /* IE 10 and IE 11 */
      user-select: none; /* Standard */
      
      /* Mencegah menu pop-up saat ditahan lama (Long Press) di iOS/Android */
      -webkit-touch-callout: none; 
      
      /* Mencegah zoom otomatis saat tap dua kali (Double-tap to zoom) */
      touch-action: manipulation; 
    }

    /* PENGECUALIAN: Izinkan teks diblok HANYA pada input form agar user tetap bisa mengetik normal */
    input, textarea, select {
      -webkit-user-select: auto !important;
      -ms-user-select: auto !important;
      user-select: auto !important;
    }

    .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  `
}} />

      {/* Backdrop z-40 agar menutupi elemen lain tapi tetap di bawah baris yang aktif */}
      {activeMenuId && (
        <div className="fixed inset-0 z-40" onClick={() => setActiveMenuId(null)}></div>
      )}

      <header className="flex justify-between items-center px-[20px] py-[16px] w-full bg-[#f8f9fa] dark:bg-[#1a1c1e] sticky top-0 z-30 border-b border-[#e9ecef]/50 dark:border-[#44474e]/50 transition-colors duration-300">
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

      <main className="w-full px-[20px] py-[20px] flex flex-col gap-[20px]">
        
        <div className="flex bg-[#e9ecef]/60 dark:bg-[#2b2d30] p-1 rounded-xl shadow-inner w-full transition-colors duration-300 relative z-10">
          <button onClick={() => setActiveTab('pelajaran')} className={`flex-1 py-[8px] text-[13px] font-bold rounded-lg transition-all ${activeTab === 'pelajaran' ? 'bg-[#ffffff] dark:bg-[#44474e] text-[#005da7] dark:text-[#a4c9ff] shadow-sm' : 'text-[#636e72] dark:text-[#c4c6d0] hover:bg-[#e9ecef] dark:hover:bg-[#44474e]/50'}`}>
            {t.tab_class}
          </button>
          <button onClick={() => setActiveTab('kegiatan')} className={`flex-1 py-[8px] text-[13px] font-bold rounded-lg transition-all ${activeTab === 'kegiatan' ? 'bg-[#ffffff] dark:bg-[#44474e] text-[#005da7] dark:text-[#a4c9ff] shadow-sm' : 'text-[#636e72] dark:text-[#c4c6d0] hover:bg-[#e9ecef] dark:hover:bg-[#44474e]/50'}`}>
            {t.tab_event}
          </button>
        </div>

        {activeTab === 'pelajaran' && (
          <>
            <section className="relative z-10">
              <div className="flex gap-[8px] overflow-x-auto no-scrollbar pb-1 snap-x">
                {DAYS_DB.map((day) => (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`snap-start shrink-0 px-[16px] py-[8px] rounded-xl font-semibold text-[13px] transition-all shadow-sm ${
                      selectedDay === day 
                        ? 'bg-[#005da7] dark:bg-[#a4c9ff] text-[#ffffff] dark:text-[#00315b]' 
                        : 'bg-[#ffffff] dark:bg-[#2b2d30] text-[#636e72] dark:text-[#c4c6d0] border border-[#e9ecef] dark:border-[#44474e] hover:bg-[#eef5f7] dark:hover:bg-[#44474e]'
                    }`}
                  >
                    {t.days[day as keyof typeof t.days]}
                  </button>
                ))}
              </div>
            </section>

            <section className="flex flex-col gap-[12px] relative pb-6">
              {schedules.length > 0 && (
                <div className="absolute left-[35px] top-4 bottom-4 w-[2px] bg-[#e9ecef] dark:bg-[#44474e] z-0 transition-colors"></div>
              )}

              {isLoading ? (
                <div className="text-center py-10 text-[#636e72] dark:text-[#c4c6d0] text-[14px] animate-pulse">{t.loading_class}</div>
              ) : schedules.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center relative z-10 bg-[#ffffff] dark:bg-[#2b2d30] rounded-2xl border border-[#e9ecef] dark:border-[#44474e] p-6 shadow-sm transition-colors duration-300">
                  <span className="material-symbols-outlined text-[48px] text-[#c1c7d3] dark:text-[#44474e] mb-2">event_busy</span>
                  <p className="font-medium text-[14px] text-[#636e72] dark:text-[#c4c6d0]">
                    {t.empty_class} {t.days[selectedDay as keyof typeof t.days]}.
                  </p>
                </div>
              ) : (
                schedules.map((schedule, index) => (
                  // LOGIC FIX: Beri z-[50] mutlak pada BARIS yang aktif agar posisinya di atas segalanya
                  <div key={schedule.id} className={`relative flex gap-[12px] items-start ${activeMenuId === schedule.id ? 'z-[50]' : 'z-10'}`}>
                    <div className="w-[70px] shrink-0 text-right pt-1 pr-1">
                      <p className="font-bold text-[14px] text-[#161d1f] dark:text-[#e2e2e5]">{schedule.start_time.substring(0, 5)}</p>
                      <p className="font-normal text-[12px] text-[#636e72] dark:text-[#c4c6d0]">{schedule.end_time.substring(0, 5)}</p>
                    </div>

                    {/* LOGIC FIX: Beri z-[50] juga pada KOTAK KARTU yang aktif */}
                    <div className={`flex-1 bg-[#ffffff] dark:bg-[#2b2d30] rounded-xl border border-[#e9ecef] dark:border-[#44474e] p-[14px] shadow-sm relative overflow-visible pl-[18px] transition-colors duration-300 ${activeMenuId === schedule.id ? 'z-[50]' : 'z-10'}`}>
                      <div className={`absolute left-0 top-0 bottom-0 w-[4px] rounded-l-xl ${index % 2 === 0 ? 'bg-[#005da7] dark:bg-[#a4c9ff]' : 'bg-[#00837c] dark:bg-[#7cf6ec]'}`}></div>

                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-[15px] text-[#161d1f] dark:text-[#e2e2e5] pr-6">{schedule.subject_name}</h3>

                        <div className="relative">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(activeMenuId === schedule.id ? null : schedule.id);
                            }}
                            className="absolute -top-1 -right-1 p-1 hover:bg-[#e9ecef] dark:hover:bg-[#44474e] rounded-full transition-colors flex items-center justify-center cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[#636e72] dark:text-[#c4c6d0] text-[20px]">more_vert</span>
                          </button>

                          {/* LOGIC FIX: Pastikan dropdown menu punya z-[60] (tertinggi) dan top-8 agar posisinya mantap */}
                          {activeMenuId === schedule.id && (
                            <div className="absolute right-0 top-8 w-[120px] bg-white dark:bg-[#1a1c1e] rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.15)] border border-[#e9ecef] dark:border-[#44474e] overflow-hidden flex flex-col py-1 z-[60] transition-colors duration-300">
                              <button 
                                onClick={(e) => { e.stopPropagation(); openEditSchedule(schedule); }} 
                                className="flex items-center gap-2 px-3 py-2 hover:bg-[#f8f9fa] dark:hover:bg-[#2b2d30] text-[13px] text-[#161d1f] dark:text-[#e2e2e5] font-medium text-left"
                              >
                                <span className="material-symbols-outlined text-[16px] text-[#005da7] dark:text-[#a4c9ff]">edit</span> {t.menu_edit}
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteSchedule(schedule.id); }} 
                                className="flex items-center gap-2 px-3 py-2 hover:bg-[#fff0f0] dark:hover:bg-[#93000a]/20 text-[13px] text-[#d63031] dark:text-[#ffb4ab] font-medium text-left"
                              >
                                <span className="material-symbols-outlined text-[16px]">delete</span> {t.menu_delete}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {schedule.room && (
                        <div className="flex items-center gap-[4px] text-[#636e72] dark:text-[#c4c6d0] mt-[6px]">
                          <span className="material-symbols-outlined text-[16px]">location_on</span>
                          <span className="font-normal text-[12px]">{schedule.room}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </section>
          </>
        )}

        {activeTab === 'kegiatan' && (
          <section className="flex flex-col gap-[16px] pb-6 relative">
            {isLoading ? (
              <div className="text-center py-10 text-[#636e72] dark:text-[#c4c6d0] text-[14px] animate-pulse">{t.loading_event}</div>
            ) : events.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center bg-[#ffffff] dark:bg-[#2b2d30] rounded-2xl border border-[#e9ecef] dark:border-[#44474e] p-6 shadow-sm transition-colors duration-300 relative z-10">
                <span className="material-symbols-outlined text-[48px] text-[#c1c7d3] dark:text-[#44474e] mb-2">event_upcoming</span>
                <p className="font-medium text-[14px] text-[#636e72] dark:text-[#c4c6d0]">{t.empty_event}</p>
              </div>
            ) : (
              events.map((evt) => {
                const { day, month } = formatTanggalEvent(evt.event_date);
                return (
                  // LOGIC FIX: Beri z-[50] mutlak pada BARIS Kegiatan yang aktif
                  <div key={evt.id} className={`flex gap-[12px] items-start group relative ${activeMenuId === evt.id ? 'z-[50]' : 'z-10'}`}>
                    <div className="w-[50px] shrink-0 text-center flex flex-col items-center justify-center pt-2">
                      <span className="font-bold text-[20px] text-[#161d1f] dark:text-[#e2e2e5] leading-none">{day}</span>
                      <span className="font-semibold text-[11px] text-[#005da7] dark:text-[#a4c9ff] uppercase">{month}</span>
                    </div>

                    {/* LOGIC FIX: Beri z-[50] pada KOTAK Kegiatan yang aktif */}
                    <div className={`flex-1 bg-[#ffffff] dark:bg-[#2b2d30] rounded-xl border border-[#e9ecef] dark:border-[#44474e] p-[14px] shadow-sm relative overflow-visible transition-colors duration-300 ${activeMenuId === evt.id ? 'z-[50]' : 'z-10'}`}>
                      <div className="flex justify-between items-start mb-[4px]">
                        <h3 className="font-bold text-[15px] text-[#161d1f] dark:text-[#e2e2e5] pr-6">{evt.title}</h3>

                        <div className="relative">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(activeMenuId === evt.id ? null : evt.id);
                            }}
                            className="absolute -top-1 -right-1 p-1 hover:bg-[#e9ecef] dark:hover:bg-[#44474e] rounded-full transition-colors flex items-center justify-center cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[#636e72] dark:text-[#c4c6d0] text-[20px]">more_vert</span>
                          </button>

                          {/* LOGIC FIX: Pastikan dropdown menu punya z-[60] dan top-8 */}
                          {activeMenuId === evt.id && (
                            <div className="absolute right-0 top-8 w-[130px] bg-white dark:bg-[#1a1c1e] rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.15)] border border-[#e9ecef] dark:border-[#44474e] overflow-hidden flex flex-col py-1 z-[60] transition-colors duration-300">
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteEvent(evt.id, true); }} 
                                className="flex items-center gap-2 px-3 py-2 hover:bg-[#e6f4ea] dark:hover:bg-[#00837c]/20 text-[13px] text-[#00837c] dark:text-[#7cf6ec] font-medium text-left"
                              >
                                <span className="material-symbols-outlined text-[16px]">check_circle</span> {t.menu_done}
                              </button>
                              <div className="h-[1px] bg-[#e9ecef] dark:bg-[#44474e] my-1"></div>
                              <button 
                                onClick={(e) => { e.stopPropagation(); openEditEvent(evt); }} 
                                className="flex items-center gap-2 px-3 py-2 hover:bg-[#f8f9fa] dark:hover:bg-[#2b2d30] text-[13px] text-[#161d1f] dark:text-[#e2e2e5] font-medium text-left"
                              >
                                <span className="material-symbols-outlined text-[16px] text-[#005da7] dark:text-[#a4c9ff]">edit</span> {t.menu_edit}
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteEvent(evt.id, false); }} 
                                className="flex items-center gap-2 px-3 py-2 hover:bg-[#fff0f0] dark:hover:bg-[#93000a]/20 text-[13px] text-[#d63031] dark:text-[#ffb4ab] font-medium text-left"
                              >
                                <span className="material-symbols-outlined text-[16px]">delete</span> {t.menu_delete}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-[6px] text-[#636e72] dark:text-[#c4c6d0] mb-[4px]">
                        <span className="material-symbols-outlined text-[14px]">schedule</span>
                        <span className="font-normal text-[12px]">{evt.start_time.substring(0, 5)} - {evt.end_time.substring(0, 5)}</span>
                      </div>
                      {evt.location && evt.location !== '-' && (
                        <div className="flex items-center gap-[6px] text-[#636e72] dark:text-[#c4c6d0]">
                          <span className="material-symbols-outlined text-[14px]">location_on</span>
                          <span className="font-normal text-[12px]">{evt.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </section>
        )}
      </main>

      {/* FAB */}
      <button 
        onClick={() => { resetForms(); setIsModalOpen(true); }}
        className="fixed bottom-[90px] right-[20px] w-[56px] h-[56px] bg-[#005da7] dark:bg-[#a4c9ff] text-[#ffffff] dark:text-[#00315b] rounded-2xl shadow-[0px_10px_30px_rgba(0,93,167,0.3)] flex items-center justify-center active:scale-95 transition-transform z-[70] hover:bg-[#004b87] dark:hover:bg-[#82b1ff]"
      >
        <span className="material-symbols-outlined text-[24px]">add</span>
      </button>

      {/* MODAL (Harus z paling tinggi: 999) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#161d1f]/60 z-[999] flex flex-col justify-end">
          <div className="bg-[#ffffff] dark:bg-[#2b2d30] w-full rounded-t-3xl p-6 flex flex-col gap-4 animate-[fadeInUp_0.3s_ease-out] transition-colors duration-300">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-bold text-[20px] text-[#161d1f] dark:text-[#e2e2e5]">
                {activeTab === 'pelajaran' 
                  ? (isEditMode ? t.edit_class : t.add_class) 
                  : (isEditMode ? t.edit_event : t.add_event)
                }
              </h2>
              <button onClick={closeModal}>
                <span className="material-symbols-outlined text-[#636e72] dark:text-[#c4c6d0]">close</span>
              </button>
            </div>

            {activeTab === 'pelajaran' ? (
              <form onSubmit={handleSubmitSchedule} className="flex flex-col gap-3">
                <input type="text" required placeholder={t.subject_placeholder} value={formSubject} onChange={(e) => setFormSubject(e.target.value)} className="w-full p-3 rounded-xl border border-[#c1c7d3] dark:border-[#44474e] bg-[#ffffff] dark:bg-[#1a1c1e] text-[#161d1f] dark:text-[#e2e2e5] focus:outline-[#005da7] text-sm transition-colors" />
                <div className="flex gap-3">
                  <div className="w-1/2 flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[#636e72] dark:text-[#c4c6d0] ml-1">{t.start_time}</label>
                    <input type="time" required value={formStartTime} onChange={(e) => setFormStartTime(e.target.value)} className="w-full p-3 rounded-xl border border-[#c1c7d3] dark:border-[#44474e] bg-[#ffffff] dark:bg-[#1a1c1e] text-[#161d1f] dark:text-[#e2e2e5] focus:outline-[#005da7] text-sm transition-colors" />
                  </div>
                  <div className="w-1/2 flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[#636e72] dark:text-[#c4c6d0] ml-1">{t.end_time}</label>
                    <input type="time" required value={formEndTime} onChange={(e) => setFormEndTime(e.target.value)} className="w-full p-3 rounded-xl border border-[#c1c7d3] dark:border-[#44474e] bg-[#ffffff] dark:bg-[#1a1c1e] text-[#161d1f] dark:text-[#e2e2e5] focus:outline-[#005da7] text-sm transition-colors" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <select value={formDay} onChange={(e) => setFormDay(e.target.value)} className="w-1/2 p-3 rounded-xl border border-[#c1c7d3] dark:border-[#44474e] bg-white dark:bg-[#1a1c1e] text-[#161d1f] dark:text-[#e2e2e5] focus:outline-[#005da7] text-sm transition-colors">
                    {DAYS_DB.map(d => (
                      <option key={d} value={d}>{t.days[d as keyof typeof t.days]}</option>
                    ))}
                  </select>
                  <input type="text" placeholder={t.room_placeholder} value={formRoom} onChange={(e) => setFormRoom(e.target.value)} className="w-1/2 p-3 rounded-xl border border-[#c1c7d3] dark:border-[#44474e] bg-[#ffffff] dark:bg-[#1a1c1e] text-[#161d1f] dark:text-[#e2e2e5] focus:outline-[#005da7] text-sm transition-colors" />
                </div>
                <button type="submit" className="w-full mt-2 py-3 bg-[#005da7] text-white font-bold rounded-xl active:scale-95 transition-all shadow-md">
                  {isEditMode ? t.save_changes : t.save_class}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSubmitEvent} className="flex flex-col gap-3">
                <input type="text" required placeholder={t.event_placeholder} value={formEventTitle} onChange={(e) => setFormEventTitle(e.target.value)} className="w-full p-3 rounded-xl border border-[#c1c7d3] dark:border-[#44474e] bg-[#ffffff] dark:bg-[#1a1c1e] text-[#161d1f] dark:text-[#e2e2e5] focus:outline-[#005da7] text-sm transition-colors" />
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-[#636e72] dark:text-[#c4c6d0] ml-1">{t.event_date}</label>
                  <input type="date" required value={formEventDate} onChange={(e) => setFormEventDate(e.target.value)} className="w-full p-3 rounded-xl border border-[#c1c7d3] dark:border-[#44474e] bg-[#ffffff] dark:bg-[#1a1c1e] text-[#161d1f] dark:text-[#e2e2e5] focus:outline-[#005da7] text-sm transition-colors" />
                </div>
                <div className="flex gap-3">
                  <div className="w-1/2 flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[#636e72] dark:text-[#c4c6d0] ml-1">{t.event_start}</label>
                    <input type="time" required value={formEventStartTime} onChange={(e) => setFormEventStartTime(e.target.value)} className="w-full p-3 rounded-xl border border-[#c1c7d3] dark:border-[#44474e] bg-[#ffffff] dark:bg-[#1a1c1e] text-[#161d1f] dark:text-[#e2e2e5] focus:outline-[#005da7] text-sm transition-colors" />
                  </div>
                  <div className="w-1/2 flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[#636e72] dark:text-[#c4c6d0] ml-1">{t.event_end}</label>
                    <input type="time" required value={formEventEndTime} onChange={(e) => setFormEventEndTime(e.target.value)} className="w-full p-3 rounded-xl border border-[#c1c7d3] dark:border-[#44474e] bg-[#ffffff] dark:bg-[#1a1c1e] text-[#161d1f] dark:text-[#e2e2e5] focus:outline-[#005da7] text-sm transition-colors" />
                  </div>
                </div>
                <input type="text" placeholder={t.location_placeholder} value={formEventLocation} onChange={(e) => setFormEventLocation(e.target.value)} className="w-full p-3 rounded-xl border border-[#c1c7d3] dark:border-[#44474e] bg-[#ffffff] dark:bg-[#1a1c1e] text-[#161d1f] dark:text-[#e2e2e5] focus:outline-[#005da7] text-sm transition-colors" />
                <button type="submit" className="w-full mt-2 py-3 bg-[#005da7] text-white font-bold rounded-xl active:scale-95 transition-all shadow-md">
                  {isEditMode ? t.save_changes : t.save_event}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}