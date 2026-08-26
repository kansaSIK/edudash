import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

interface RegisterProps {
  onNavigateLogin: () => void;
}

export default function Register({ onNavigateLogin }: RegisterProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // State baru untuk konfirmasi password
  const [isLoading, setIsLoading] = useState(false);
  
  // State untuk fitur mata (show/hide password)
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi apakah password dan konfirmasi password sama
    if (password !== confirmPassword) {
      alert("Oops! Password dan Konfirmasi Password tidak cocok.");
      return;
    }

    setIsLoading(true);

    // 1. Daftarkan akun di sistem Auth Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      alert('Gagal Mendaftar: ' + authError.message);
      setIsLoading(false);
      return;
    }

    // 2. Buat baris profil di tabel 'profiles' agar nama bisa muncul
    if (authData.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({ 
          id: authData.user.id, 
          full_name: fullName 
        });

      if (profileError) {
        console.error("Gagal membuat profil:", profileError.message);
        alert("Pendaftaran berhasil, tetapi gagal menyimpan nama. Silakan cek kotak masuk (Inbox/Spam) email Anda untuk memverifikasi akun.");
        onNavigateLogin();
      } else {
        alert("Pendaftaran berhasil! Silakan cek kotak masuk (Inbox/Spam) email Anda untuk memverifikasi akun.");
        onNavigateLogin(); 
      }
    }
    setIsLoading(false);
  };

  return (
    <div className="bg-[#eef5f7] dark:bg-[#1a1c1e] min-h-screen flex items-center justify-center p-4">
      <div className="bg-[#f8f9fa] dark:bg-[#1a1c1e] w-full max-w-md min-h-[800px] rounded-[2.5rem] shadow-2xl flex flex-col items-center justify-center p-8 relative overflow-hidden">
        
        {/* Dekorasi Latar Ambient (Opsional, agar senada dengan login) */}
        <div className="absolute top-[-50px] right-[-50px] w-48 h-48 bg-[#005da7]/10 dark:bg-[#a4c9ff]/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[-50px] left-[-50px] w-48 h-48 bg-[#ebb2ff]/20 dark:bg-[#ebb2ff]/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="z-10 w-full flex flex-col animate-[fadeInUp_0.8s_ease-out]">
          <button onClick={onNavigateLogin} className="self-start mb-6 text-[#636e72] hover:text-[#005da7] flex items-center transition-colors">
             <span className="material-symbols-outlined">arrow_back</span>
          </button>
          
          <h1 className="font-bold text-[32px] text-[#161d1f] dark:text-[#e2e2e5] mb-2">Buat Akun</h1>
          <p className="text-[#636e72] dark:text-[#c4c6d0] mb-8 text-[14px]">Bergabunglah dengan EduDash untuk mengelola tugasmu.</p>

          <form onSubmit={handleRegister} className="w-full flex flex-col gap-4">
            
            {/* Input Nama Lengkap */}
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-bold text-[#161d1f] dark:text-[#e2e2e5] ml-1">Nama Lengkap</label>
              <input 
                type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
                className="w-full p-4 rounded-2xl border border-[#c1c7d3] dark:border-[#44474e] bg-[#ffffff] dark:bg-[#2b2d30] text-[#161d1f] dark:text-[#e2e2e5] focus:outline-[#005da7] focus:ring-1 focus:ring-[#005da7]" 
                placeholder="Contoh: Budi Santoso" 
              />
            </div>

            {/* Input Email */}
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-bold text-[#161d1f] dark:text-[#e2e2e5] ml-1">Email</label>
              <input 
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full p-4 rounded-2xl border border-[#c1c7d3] dark:border-[#44474e] bg-[#ffffff] dark:bg-[#2b2d30] text-[#161d1f] dark:text-[#e2e2e5] focus:outline-[#005da7] focus:ring-1 focus:ring-[#005da7]" 
                placeholder="nama@email.com" 
              />
            </div>
            
            {/* Input Password */}
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-bold text-[#161d1f] dark:text-[#e2e2e5] ml-1">Password</label>
              <div className="relative w-full">
                <input 
                  type={showPassword ? "text" : "password"} required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-4 pr-12 rounded-2xl border border-[#c1c7d3] dark:border-[#44474e] bg-[#ffffff] dark:bg-[#2b2d30] text-[#161d1f] dark:text-[#e2e2e5] focus:outline-[#005da7] focus:ring-1 focus:ring-[#005da7]" 
                  placeholder="Minimal 6 Karakter" 
                />
                <button
                  type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#636e72] hover:text-[#005da7] focus:outline-none transition-colors"
                >
                  <span className="material-symbols-outlined select-none">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {/* Input Konfirmasi Password */}
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-bold text-[#161d1f] dark:text-[#e2e2e5] ml-1">Ulangi Password</label>
              <div className="relative w-full">
                <input 
                  type={showConfirmPassword ? "text" : "password"} required minLength={6} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-4 pr-12 rounded-2xl border border-[#c1c7d3] dark:border-[#44474e] bg-[#ffffff] dark:bg-[#2b2d30] text-[#161d1f] dark:text-[#e2e2e5] focus:outline-[#005da7] focus:ring-1 focus:ring-[#005da7]" 
                  placeholder="Ketik ulang password" 
                />
                <button
                  type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#636e72] hover:text-[#005da7] focus:outline-none transition-colors"
                >
                  <span className="material-symbols-outlined select-none">
                    {showConfirmPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {/* Tombol Daftar yang Diubah Menjadi Biru */}
            <button type="submit" disabled={isLoading} className="w-full mt-4 py-4 bg-[#005da7] text-white font-bold rounded-2xl active:scale-95 transition-all disabled:opacity-70 shadow-[0_4px_14px_rgba(0,93,167,0.39)] hover:bg-[#004b87]">
              {isLoading ? 'Mendaftar...' : 'Daftar Sekarang'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}