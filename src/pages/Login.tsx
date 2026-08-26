import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

interface LoginProps {
  onNavigateRegister: () => void;
}

export default function Login({ onNavigateRegister }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // State untuk mengatur apakah password ditampilkan atau disembunyikan
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert('Gagal Login: ' + error.message);
    }
    setIsLoading(false);
  };

  return (
    <div className="bg-[#eef5f7] dark:bg-[#1a1c1e] min-h-screen flex items-center justify-center p-4">
      <div className="bg-[#f8f9fa] dark:bg-[#1a1c1e] w-full max-w-md min-h-[800px] rounded-[2.5rem] shadow-2xl flex flex-col items-center justify-center p-8 relative overflow-hidden">
        
        {/* Dekorasi Latar Ambient */}
        <div className="absolute top-[-50px] right-[-50px] w-48 h-48 bg-[#005da7]/10 dark:bg-[#a4c9ff]/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[-50px] left-[-50px] w-48 h-48 bg-[#ebb2ff]/20 dark:bg-[#ebb2ff]/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="z-10 w-full flex flex-col items-center animate-[fadeInUp_0.8s_ease-out]">
          
          {/* Logo EduDash - Diperbesar dengan menambahkan tanda "!" agar mengabaikan kuncian ukuran default */}
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-[#005da7] flex items-center justify-center mb-6 shadow-[0px_10px_30px_rgba(0,93,167,0.2)]">
            <span className="material-symbols-outlined text-[#ffffff] !text-[56px] md:!text-[64px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              school
            </span>
          </div>

          <h1 className="font-bold text-[32px] text-[#161d1f] dark:text-[#e2e2e5] mb-2 tracking-[-0.02em]">EduDash</h1>
          <p className="text-[#636e72] dark:text-[#c4c6d0] mb-8 text-center text-[14px]">Masuk untuk melanjutkan aktivitas belajarmu.</p>

          <form onSubmit={handleLogin} className="w-full flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-bold text-[#161d1f] dark:text-[#e2e2e5] ml-1">Email</label>
              <input 
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full p-4 rounded-2xl border border-[#c1c7d3] dark:border-[#44474e] bg-[#ffffff] dark:bg-[#2b2d30] text-[#161d1f] dark:text-[#e2e2e5] focus:outline-[#005da7] focus:ring-1 focus:ring-[#005da7]" 
                placeholder="nama@email.com" 
              />
            </div>
            
            {/* Field Password dengan Fitur Ikon Mata */}
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-bold text-[#161d1f] dark:text-[#e2e2e5] ml-1">Password</label>
              <div className="relative w-full">
                <input 
                  type={showPassword ? "text" : "password"} 
                  required 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-4 pr-12 rounded-2xl border border-[#c1c7d3] dark:border-[#44474e] bg-[#ffffff] dark:bg-[#2b2d30] text-[#161d1f] dark:text-[#e2e2e5] focus:outline-[#005da7] focus:ring-1 focus:ring-[#005da7]" 
                  placeholder="••••••••" 
                />
                
                {/* Tombol Ikon Mata */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#636e72] hover:text-[#005da7] focus:outline-none transition-colors"
                >
                  <span className="material-symbols-outlined select-none">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="w-full mt-4 py-4 bg-[#005da7] text-white font-bold rounded-2xl active:scale-95 transition-all disabled:opacity-70 shadow-[0_4px_14px_rgba(0,93,167,0.39)] hover:bg-[#004b87]">
              {isLoading ? 'Memproses...' : 'Masuk'}
            </button>
          </form>

          <div className="mt-8 text-[14px] text-[#636e72] dark:text-[#c4c6d0]">
            Belum punya akun?{' '}
            <button onClick={onNavigateRegister} className="font-bold text-[#005da7] dark:text-[#a4c9ff] hover:underline">
              Daftar di sini
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}