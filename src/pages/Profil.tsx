import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { usePreferences } from '../contexts/PreferencesContext';

// --- TYPES ---
export interface UserProfile {
  id: string;
  full_name: string;
  school: string;
  bio: string;
  avatar_url: string;
}

export interface ProfilProps {
  userId?: string;
  onNavigateHome?: () => void;
  onNavigateTask?: () => void;
  onNavigateSchedule?: () => void;
  onNavigateStats?: () => void;
  onLogout?: () => void;
  onNavigateNotification?: () => void;
}

// --- KAMUS BAHASA (DICTIONARY) ---
const dict = {
  id: {
    title: "EduDash",
    loading: "Memuat profil...",
    account: "Akun",
    editProfile: "Edit Profil",
    preferences: "Preferensi",
    notif: "Notifikasi",
    theme: "Tampilan",
    lang: "Bahasa",
    others: "Lainnya",
    about: "Tentang EduDash",
    logout: "Keluar",
    light: "Terang",
    dark: "Gelap",
    system: "Sistem Default",
    indonesia: "Indonesia",
    english: "Inggris",
    save: "Simpan Perubahan",
    saving: "Menyimpan...",
    name: "Nama Lengkap",
    school: "Nama Sekolah / Instansi",
    bio: "Label Status / Bio Singkat",
    selectTheme: "Pilih Tampilan",
    selectLang: "Pilih Bahasa",
    close: "Tutup",
    about_title: "Tentang EduDash",
    about_desc: "EduDash adalah aplikasi manajemen waktu dan tugas yang dirancang khusus untuk membantu pelajar mengorganisir jadwal pelajaran, memantau tenggat waktu tugas, dan meningkatkan produktivitas belajar secara efisien.",
    version: "Versi 1.0.0",
    developed_by: "Dikembangkan oleh tim kami untuk pelajar."
  },
  en: {
    title: "EduDash",
    loading: "Loading profile...",
    account: "Account",
    editProfile: "Edit Profile",
    preferences: "Preferences",
    notif: "Notifications",
    theme: "Theme",
    lang: "Language",
    others: "Others",
    about: "About EduDash",
    logout: "Sign Out",
    light: "Light",
    dark: "Dark",
    system: "System Default",
    indonesia: "Indonesian",
    english: "English",
    save: "Save Changes",
    saving: "Saving...",
    name: "Full Name",
    school: "School / Institution",
    bio: "Status Label / Short Bio",
    selectTheme: "Select Theme",
    selectLang: "Select Language",
    close: "Close",
    about_title: "About EduDash",
    about_desc: "EduDash is a time and task management application specifically designed to help students organize class schedules, track assignment deadlines, and improve learning productivity efficiently.",
    version: "Version 1.0.0",
    developed_by: "Developed with ❤️ for students."
  }
};

export default function Profil({
  userId,
  onNavigateHome,
  onNavigateTask,
  onNavigateSchedule,
  onNavigateStats,
  onLogout,
  onNavigateNotification
}: ProfilProps) {
  
  // --- GLOBAL STATE ---
  const { theme, setTheme, lang, setLang } = usePreferences();
  
  // --- STATE DATA ---
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isNotifActive, setIsNotifActive] = useState<boolean>(false);
  
  // --- STATE MODAL & FORM ---
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState<boolean>(false);
  const [isLangModalOpen, setIsLangModalOpen] = useState<boolean>(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState<boolean>(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false); // Modal Preview Foto
  
  const [editName, setEditName] = useState<string>('');
  const [editSchool, setEditSchool] = useState<string>('');
  const [editBio, setEditBio] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const [isUploadingAvatar, setIsUploadingAvatar] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = dict[lang];

  useEffect(() => {
    fetchProfile();
    checkNotifPermission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id || userId;

      if (!currentUserId) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUserId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Gagal mengambil profil:', error.message);
      } else if (data) {
        setProfile(data as UserProfile);
        setEditName(data.full_name || '');
        setEditSchool(data.school || '');
        setEditBio(data.bio || '');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setIsUploadingAvatar(true);
      if (!event.target.files || event.target.files.length === 0) return;
      
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id || userId;

      if (!currentUserId) throw new Error("Sesi tidak ditemukan. Silakan login ulang.");

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUserId}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({ id: currentUserId, avatar_url: publicUrl });

      if (updateError) throw updateError;

      setProfile(prev => ({ 
        ...(prev || { id: currentUserId, full_name: editName, school: editSchool, bio: editBio }), 
        avatar_url: publicUrl 
      }));
      
    } catch (error: any) {
      alert('Gagal mengunggah foto: ' + error.message);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const checkNotifPermission = () => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') setIsNotifActive(true);
  };

  const handleToggleNotif = async () => {
    if (!('Notification' in window)) {
      alert('Browser Anda tidak mendukung notifikasi.');
      return;
    }

    if (!isNotifActive) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setIsNotifActive(true);
        new Notification("EduDash", {
          body: lang === 'id' ? "Notifikasi diaktifkan! Kami akan mengingatkan tugasmu." : "Notifications enabled! We'll remind you about tasks.",
          icon: profile?.avatar_url || "/favicon.ico" 
        });
      } else {
        alert(lang === 'id' ? "Izin notifikasi ditolak oleh sistem." : "Notification permission denied.");
      }
    } else {
      setIsNotifActive(false);
      alert(lang === 'id' ? "Notifikasi dimatikan." : "Notifications disabled.");
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id || userId;

      if (!currentUserId) throw new Error("Sesi tidak ditemukan. Silakan login ulang.");

      const { error } = await supabase
        .from('profiles')
        .upsert({ id: currentUserId, full_name: editName, school: editSchool, bio: editBio });

      if (error) throw error;

      setProfile(prev => ({ 
        ...(prev || { id: currentUserId, avatar_url: '' }), 
        full_name: editName, school: editSchool, bio: editBio 
      }));
      setIsEditModalOpen(false);
    } catch (err: any) {
      alert('Gagal menyimpan: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    if (window.confirm(lang === 'id' ? 'Apakah Anda yakin ingin keluar?' : 'Are you sure you want to sign out?')) {
      await supabase.auth.signOut();
      if (onLogout) onLogout();
    }
  };

  const displayAvatar = profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.full_name || 'User'}&background=d4e3ff&color=005da7&size=150`;
  const displayName = profile?.full_name || (lang === 'id' ? 'Pengguna Baru' : 'New User');
  const displaySchool = profile?.school || (lang === 'id' ? 'Belum mengatur sekolah' : 'School not set');
  const displayBio = profile?.bio || 'Siswa EduDash';

  // --- RENDER UTAMA ---
  return (
    <div className="w-full bg-[#f8f9fa] dark:bg-[#1a1c1e] text-[#161d1f] dark:text-[#e2e2e5] font-body-main antialiased transition-colors duration-300 pb-10">
      
      <style dangerouslySetInnerHTML={{
        __html: `
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap');
          @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0');
          body { font-family: 'Plus Jakarta Sans', sans-serif; }
          .material-symbols-outlined { font-family: 'Material Symbols Outlined' !important; font-weight: normal !important; font-style: normal !important; font-size: 24px !important; line-height: 1 !important; letter-spacing: normal !important; text-transform: none !important; display: inline-block !important; white-space: nowrap !important; word-wrap: normal !important; direction: ltr !important; -webkit-font-feature-settings: 'liga' !important; -webkit-font-smoothing: antialiased !important; }
        `
      }} />

      <header className="flex justify-between items-center px-[20px] py-[16px] w-full bg-[#f8f9fa] dark:bg-[#1a1c1e] sticky top-0 z-10 border-b border-[#e9ecef]/50 dark:border-[#44474e]/50">
        <h1 className="font-bold text-[24px] text-[#005da7] dark:text-[#a4c9ff]">{t.title}</h1>
        <button onClick={onNavigateNotification} className="hover:bg-[#eef5f7] dark:hover:bg-[#44474e] rounded-full p-2 text-[#005da7] dark:text-[#a4c9ff] flex items-center justify-center">
          <span className="material-symbols-outlined">notifications</span>
        </button>
      </header>

      <div className="w-full flex flex-col">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#717783] dark:text-[#c4c6d0]">
            <span className="material-symbols-outlined animate-spin mb-2">progress_activity</span>
            <p className="text-[14px]">{t.loading}</p>
          </div>
        ) : (
          <>
            <div className="px-[20px] pb-[24px] pt-[16px] flex flex-col items-center border-b border-[#e9ecef] dark:border-[#44474e]">
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleAvatarChange} />
              
              <div className="relative mb-4 inline-block">
                {/* --- FOTO PROFIL BISA DIKLIK UNTUK PREVIEW --- */}
                <div 
                  onClick={() => setIsPreviewOpen(true)}
                  className={`w-[100px] h-[100px] rounded-full overflow-hidden border-4 border-[#ffffff] dark:border-[#2b2d30] shadow-sm cursor-pointer active:scale-95 transition-transform ${isUploadingAvatar ? 'opacity-50' : ''}`}
                >
                  <img src={displayAvatar} alt="Avatar" className="w-full h-full object-cover bg-[#eef5f7]" />
                </div>
                
                {isUploadingAvatar && (
                  <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="material-symbols-outlined animate-spin text-[#005da7]">progress_activity</span>
                  </span>
                )}
                
                {/* --- TOMBOL KAMERA UNTUK UBAH FOTO --- */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation(); // Mencegah modal preview terbuka saat klik icon kamera
                    if (!isUploadingAvatar) fileInputRef.current?.click();
                  }} 
                  disabled={isUploadingAvatar} 
                  className="absolute bottom-0 right-0 bg-[#005da7] dark:bg-[#a4c9ff] text-[#ffffff] dark:text-[#00315b] rounded-full p-[6px] shadow-md flex items-center justify-center hover:scale-105 transition-transform"
                >
                  <span className="material-symbols-outlined !text-[16px]">photo_camera</span>
                </button>
              </div>
              
              <h2 className="font-bold text-[22px] text-[#161d1f] dark:text-[#e2e2e5] mb-1">{displayName}</h2>
              <p className="text-[14px] text-[#636e72] dark:text-[#c4c6d0] mb-3 text-center px-4">{displaySchool}</p>
              
              <div className="flex gap-2">
                <span className="bg-[#00837c]/10 dark:bg-[#00837c]/30 text-[#00837c] dark:text-[#7cf6ec] font-bold text-[12px] px-[12px] py-[6px] rounded-full">
                  {displayBio}
                </span>
              </div>
            </div>

            <div className="px-[20px] py-[24px] flex flex-col gap-[24px]">
              {/* Akun */}
              <section className="flex flex-col gap-[8px]">
                <h3 className="font-bold text-[12px] text-[#005da7] dark:text-[#a4c9ff] uppercase tracking-wider pl-2">{t.account}</h3>
                <div className="bg-[#ffffff] dark:bg-[#2b2d30] rounded-2xl shadow-sm border border-[#e9ecef] dark:border-[#44474e] overflow-hidden">
                  <button onClick={() => { setEditName(profile?.full_name || ''); setEditSchool(profile?.school || ''); setEditBio(profile?.bio || ''); setIsEditModalOpen(true); }} className="w-full flex items-center justify-between px-[16px] py-[16px] hover:bg-[#f8f9fa] dark:hover:bg-[#44474e]">
                    <div className="flex items-center gap-[12px]">
                      <div className="bg-[#eef5f7] dark:bg-[#1a1c1e] p-2 rounded-xl text-[#005da7] dark:text-[#a4c9ff]">
                        <span className="material-symbols-outlined">person</span>
                      </div>
                      <span className="text-[14px] font-semibold">{t.editProfile}</span>
                    </div>
                    <span className="material-symbols-outlined text-[#c1c7d3] dark:text-[#8e9099]">chevron_right</span>
                  </button>
                  {/* BAGIAN GANTI PASSWORD TELAH DIHAPUS DARI SINI */}
                </div>
              </section>

              {/* Preferensi */}
              <section className="flex flex-col gap-[8px]">
                <h3 className="font-bold text-[12px] text-[#005da7] dark:text-[#a4c9ff] uppercase tracking-wider pl-2">{t.preferences}</h3>
                <div className="bg-[#ffffff] dark:bg-[#2b2d30] rounded-2xl shadow-sm border border-[#e9ecef] dark:border-[#44474e] overflow-hidden">
                  <div className="flex items-center justify-between px-[16px] py-[16px] border-b border-[#e9ecef]/50 dark:border-[#44474e]/50">
                    <div className="flex items-center gap-[12px]">
                      <div className="bg-[#f8d8ff]/50 dark:bg-[#83439e]/30 p-2 rounded-xl text-[#83439e] dark:text-[#ebb2ff]">
                        <span className="material-symbols-outlined">notifications_active</span>
                      </div>
                      <span className="text-[14px] font-semibold">{t.notif}</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={isNotifActive} onChange={handleToggleNotif} />
                      <div className="w-[44px] h-[24px] bg-[#c1c7d3] dark:bg-[#8e9099] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-[20px] after:w-[20px] after:transition-all peer-checked:bg-[#005da7] dark:peer-checked:bg-[#a4c9ff]"></div>
                    </label>
                  </div>
                  <button onClick={() => setIsThemeModalOpen(true)} className="w-full flex items-center justify-between px-[16px] py-[16px] hover:bg-[#f8f9fa] dark:hover:bg-[#44474e] border-b border-[#e9ecef]/50 dark:border-[#44474e]/50">
                    <div className="flex items-center gap-[12px]">
                      <div className="bg-[#f8d8ff]/50 dark:bg-[#83439e]/30 p-2 rounded-xl text-[#83439e] dark:text-[#ebb2ff]">
                        <span className="material-symbols-outlined">palette</span>
                      </div>
                      <span className="text-[14px] font-semibold">{t.theme}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[#636e72] dark:text-[#c4c6d0]">
                      <span className="text-[12px] capitalize">{theme === 'light' ? t.light : theme === 'dark' ? t.dark : t.system}</span>
                      <span className="material-symbols-outlined text-[#c1c7d3] dark:text-[#8e9099]">chevron_right</span>
                    </div>
                  </button>
                  <button onClick={() => setIsLangModalOpen(true)} className="w-full flex items-center justify-between px-[16px] py-[16px] hover:bg-[#f8f9fa] dark:hover:bg-[#44474e]">
                    <div className="flex items-center gap-[12px]">
                      <div className="bg-[#f8d8ff]/50 dark:bg-[#83439e]/30 p-2 rounded-xl text-[#83439e] dark:text-[#ebb2ff]">
                        <span className="material-symbols-outlined">language</span>
                      </div>
                      <span className="text-[14px] font-semibold">{t.lang}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[#636e72] dark:text-[#c4c6d0]">
                      <span className="text-[12px]">{lang === 'id' ? t.indonesia : t.english}</span>
                      <span className="material-symbols-outlined text-[#c1c7d3] dark:text-[#8e9099]">chevron_right</span>
                    </div>
                  </button>
                </div>
              </section>

              {/* Lainnya */}
              <section className="flex flex-col gap-[8px]">
                <h3 className="font-bold text-[12px] text-[#005da7] dark:text-[#a4c9ff] uppercase tracking-wider pl-2">{t.others}</h3>
                <div className="bg-[#ffffff] dark:bg-[#2b2d30] rounded-2xl shadow-sm border border-[#e9ecef] dark:border-[#44474e] overflow-hidden">
                  <button onClick={() => setIsAboutModalOpen(true)} className="w-full flex items-center justify-between px-[16px] py-[16px] hover:bg-[#f8f9fa] dark:hover:bg-[#44474e]">
                    <div className="flex items-center gap-[12px]">
                      <div className="bg-[#00837c]/10 dark:bg-[#00837c]/30 p-2 rounded-xl text-[#00837c] dark:text-[#7cf6ec]">
                        <span className="material-symbols-outlined">info</span>
                      </div>
                      <span className="text-[14px] font-semibold">{t.about}</span>
                    </div>
                    <span className="material-symbols-outlined text-[#c1c7d3] dark:text-[#8e9099]">chevron_right</span>
                  </button>
                </div>
              </section>

              {/* Logout */}
              <button onClick={handleSignOut} className="w-full flex items-center justify-center gap-[8px] py-[16px] mt-2 rounded-2xl bg-[#ffdad6] dark:bg-[#93000a] text-[#ba1a1a] dark:text-[#ffdad6] font-bold text-[16px] hover:bg-[#ffb4ab] active:scale-[0.98] transition-all">
                <span className="material-symbols-outlined text-[20px]">logout</span>
                {t.logout}
              </button>
              
            </div>
          </>
        )}
      </div>

      {/* --- MODALS --- */}
      
      {/* 1. Modal Edit Profil */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-[#161d1f]/60 z-[999] flex flex-col justify-end">
          <div className="bg-[#ffffff] dark:bg-[#2b2d30] w-full rounded-t-[24px] p-[24px] flex flex-col gap-[16px]">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-bold text-[20px]">{t.editProfile}</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-[#636e72] hover:text-[#161d1f]"><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handleSaveProfile} className="flex flex-col gap-[12px]">
              <div className="flex flex-col gap-[4px]">
                <label className="text-[12px] font-bold">{t.name}</label>
                <input required type="text" value={editName} onChange={e => setEditName(e.target.value)} disabled={isSaving} className="w-full p-3 rounded-xl border border-[#c1c7d3] dark:border-[#44474e] bg-[#ffffff] dark:bg-[#1a1c1e] text-[14px]" />
              </div>
              <div className="flex flex-col gap-[4px]">
                <label className="text-[12px] font-bold">{t.school}</label>
                <input type="text" value={editSchool} onChange={e => setEditSchool(e.target.value)} disabled={isSaving} className="w-full p-3 rounded-xl border border-[#c1c7d3] dark:border-[#44474e] bg-[#ffffff] dark:bg-[#1a1c1e] text-[14px]" />
              </div>
              <div className="flex flex-col gap-[4px]">
                <label className="text-[12px] font-bold">{t.bio}</label>
                <input type="text" value={editBio} onChange={e => setEditBio(e.target.value)} disabled={isSaving} className="w-full p-3 rounded-xl border border-[#c1c7d3] dark:border-[#44474e] bg-[#ffffff] dark:bg-[#1a1c1e] text-[14px]" />
              </div>
              <button type="submit" disabled={isSaving} className="w-full mt-[8px] py-[14px] bg-[#005da7] text-[#ffffff] font-bold text-[14px] rounded-xl flex items-center justify-center">{isSaving ? t.saving : t.save}</button>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal Theme */}
      {isThemeModalOpen && (
        <div className="fixed inset-0 bg-[#161d1f]/60 z-[999] flex flex-col justify-end">
          <div className="bg-[#ffffff] dark:bg-[#2b2d30] w-full rounded-t-[24px] p-[24px] flex flex-col gap-[16px]">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-bold text-[20px]">{t.selectTheme}</h2>
              <button onClick={() => setIsThemeModalOpen(false)} className="text-[#636e72] hover:text-[#161d1f]"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={() => { setTheme('light'); setIsThemeModalOpen(false); }} className={`p-4 rounded-xl font-semibold text-left transition-colors ${theme === 'light' ? 'bg-[#005da7] text-white' : 'bg-[#eef5f7] dark:bg-[#1a1c1e]'}`}>{t.light}</button>
              <button onClick={() => { setTheme('dark'); setIsThemeModalOpen(false); }} className={`p-4 rounded-xl font-semibold text-left transition-colors ${theme === 'dark' ? 'bg-[#005da7] text-white' : 'bg-[#eef5f7] dark:bg-[#1a1c1e]'}`}>{t.dark}</button>
              <button onClick={() => { setTheme('system'); setIsThemeModalOpen(false); }} className={`p-4 rounded-xl font-semibold text-left transition-colors ${theme === 'system' ? 'bg-[#005da7] text-white' : 'bg-[#eef5f7] dark:bg-[#1a1c1e]'}`}>{t.system}</button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal Bahasa */}
      {isLangModalOpen && (
        <div className="fixed inset-0 bg-[#161d1f]/60 z-[999] flex flex-col justify-end">
          <div className="bg-[#ffffff] dark:bg-[#2b2d30] w-full rounded-t-[24px] p-[24px] flex flex-col gap-[16px]">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-bold text-[20px]">{t.selectLang}</h2>
              <button onClick={() => setIsLangModalOpen(false)} className="text-[#636e72] hover:text-[#161d1f]"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={() => { setLang('id'); setIsLangModalOpen(false); }} className={`p-4 rounded-xl font-semibold text-left transition-colors ${lang === 'id' ? 'bg-[#005da7] text-white' : 'bg-[#eef5f7] dark:bg-[#1a1c1e]'}`}>{t.indonesia}</button>
              <button onClick={() => { setLang('en'); setIsLangModalOpen(false); }} className={`p-4 rounded-xl font-semibold text-left transition-colors ${lang === 'en' ? 'bg-[#005da7] text-white' : 'bg-[#eef5f7] dark:bg-[#1a1c1e]'}`}>{t.english}</button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Modal About */}
      {isAboutModalOpen && (
        <div className="fixed inset-0 bg-[#161d1f]/60 z-[999] flex flex-col justify-end">
          <div className="bg-[#ffffff] dark:bg-[#2b2d30] w-full rounded-t-[24px] p-[24px] flex flex-col gap-[16px]">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-bold text-[20px]">{t.about_title}</h2>
              <button onClick={() => setIsAboutModalOpen(false)} className="text-[#636e72] hover:text-[#161d1f]"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="w-20 h-20 bg-[#eef5f7] dark:bg-[#004883]/30 rounded-3xl flex items-center justify-center text-[#005da7] dark:text-[#a4c9ff]">
                <span className="material-symbols-outlined text-[40px]">school</span>
              </div>
              <h3 className="font-bold text-[22px] text-[#005da7] dark:text-[#a4c9ff]">EduDash</h3>
              <p className="text-[14px] text-[#636e72] dark:text-[#c4c6d0] leading-relaxed">{t.about_desc}</p>
              <div className="mt-4 pt-4 border-t border-[#e9ecef] dark:border-[#44474e] w-full">
                <p className="text-[12px] font-bold">{t.version}</p>
                <p className="text-[12px] text-[#636e72] mt-1">{t.developed_by}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL PREVIEW FOTO LENGKAP (ALA INSTAGRAM) */}
      {isPreviewOpen && (
        <div 
          className="fixed inset-0 z-[9999] bg-[#000000]/95 flex flex-col justify-center items-center animate-[fadeIn_0.2s_ease-out]"
          onClick={() => setIsPreviewOpen(false)} // Klik di mana saja pada background hitam untuk menutup
        >
          {/* Header Action di dalam Preview */}
          <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent z-10">
            <span className="text-white font-semibold text-[14px] px-2 tracking-wide">{displayName}</span>
            <button 
              onClick={() => setIsPreviewOpen(false)}
              className="p-2 text-white/80 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-[28px]">close</span>
            </button>
          </div>

          {/* Gambar Layar Penuh */}
          <img 
            src={displayAvatar} 
            alt="Profile Full Preview" 
            className="w-full max-w-lg max-h-[100dvh] object-contain transform transition-transform duration-300 animate-[zoomIn_0.2s_ease-out]"
            onClick={(e) => e.stopPropagation()} // Mencegah modal tertutup kalau gambar yang diklik
          />

          {/* Style Animasi Khusus Modal */}
          <style dangerouslySetInnerHTML={{
            __html: `
              @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
              @keyframes zoomIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            `
          }} />
        </div>
      )}

    </div>
  );
}