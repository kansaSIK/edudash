

interface OnboardingProps {
  onSkip?: () => void;
  onNext?: () => void;
}

export default function Onboarding({ onSkip, onNext }: OnboardingProps) {
  return (
    // Wrapper luar: Latar belakang netral di layar besar
    <div className="bg-[#eef5f7] min-h-screen flex items-center justify-center p-4">
      
      {/* Frame Mobile Android (Struktur disamakan dengan Onboarding 2 & 3) */}
      <div className="bg-[#f4fafd] text-[#161d1f] font-body-main antialiased min-h-screen sm:min-h-[800px] h-full sm:h-[800px] w-full max-w-md sm:rounded-[2.5rem] sm:shadow-2xl flex flex-col justify-between overflow-hidden relative">
        
        {/* Import Font & Icon */}
        <style dangerouslySetInnerHTML={{
          __html: `
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap');
            @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
            
            body { font-family: 'Plus Jakarta Sans', sans-serif; }
          `
        }} />

        {/* Background dekoratif gradien (Sesuai tema) */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#d4e3ff] rounded-full blur-3xl opacity-40 z-0"></div>
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-[#f8d8ff] rounded-full blur-3xl opacity-40 z-0"></div>

        {/* Header / Skip Button (Pojok Kanan Atas) */}
        <header className="w-full flex justify-end px-[20px] py-[16px] z-10 relative">
          <button 
            onClick={onSkip}
            className="font-bold text-[14px] text-[#717783] hover:text-[#005da7] px-[16px] py-[8px] rounded-full hover:bg-[#eef5f7] transition-colors duration-200"
          >
            Lewati
          </button>
        </header>

        {/* Main Content Area */}
        <main className="flex-grow flex flex-col items-center justify-center px-[20px] z-10 relative gap-[32px] w-full">
          
          {/* Illustration Area */}
          <div className="relative w-full aspect-square max-w-[280px] flex items-center justify-center">
            {/* Lingkaran Background Ilustrasi */}
            <div className="absolute inset-0 bg-[#ffffff] shadow-[0px_10px_30px_rgba(0,0,0,0.05)] rounded-full border border-[#dde4e6] flex items-center justify-center overflow-hidden">
                
                {/* Floating elements */}
                <div className="absolute top-4 right-8 w-12 h-12 bg-[#2976c7] rounded-lg rotate-12 opacity-80 shadow-sm"></div>
                <div className="absolute bottom-8 left-6 w-16 h-16 bg-[#e29bfe] rounded-full opacity-60 shadow-sm"></div>
                <div className="absolute top-1/2 -left-4 w-10 h-2 bg-[#00837c] rounded-full opacity-70"></div>
                
                <img 
                  alt="Ilustrasi manajemen tugas dan jadwal" 
                  className="w-[80%] h-[80%] object-contain relative z-10" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAL9nYWtd7sw-0xMBPeY4mmR9-SKF8aeUbJGmEJsTfl_UBbOlqHh_GfpvbsmfekaQosi3kyxAabFC7iRHa2MeuGEFvE-CzYIKZyVw6yoGDCm7lRuy-XCZc3Fckqo4apfRvZvwEx7xSVmW9d2d7u1We1vYg4xbXWtczb-nOPDqdgnxpsutxfTib2xouxEJyZm_u0ubZBqBGLs6bykogehxKTJPSsqRZX5gC4HhrKGy6TV8v3Q4LGRNCl" 
                />
            </div>
          </div>
          
          {/* Text Content (Menyatu dengan background, letaknya di tengah) */}
          <div className="text-center flex flex-col gap-[8px] w-full max-w-sm">
            <h1 className="font-bold text-[32px] leading-[40px] tracking-[-0.02em] text-[#161d1f]">
              Atur Aktivitas Sekolahmu
            </h1>
            <p className="font-normal text-[16px] text-[#414751] px-[16px]">
              Simpan tugas, jadwal, dan aktivitas sekolah dalam satu tempat.
            </p>
          </div>
          
        </main>
        
        {/* Bottom Navigation / Indicators (Full width button di bawah) */}
        <footer className="w-full px-[20px] py-[32px] flex flex-col items-center gap-[24px] z-10 relative">
          
          {/* Indicators (Aktif di nomor 1) */}
          <div className="flex gap-[8px]">
            <div className="w-8 h-2 rounded-full bg-[#005da7] transition-all duration-300"></div>
            <div className="w-2 h-2 rounded-full bg-[#c1c7d3] transition-all duration-300"></div>
            <div className="w-2 h-2 rounded-full bg-[#c1c7d3] transition-all duration-300"></div>
          </div>
          
          {/* Action Button (Next) */}
          <button 
            onClick={onNext}
            className="w-full h-[56px] bg-[#005da7] text-[#ffffff] font-bold text-[16px] rounded-xl shadow-[0px_4px_20px_rgba(0,93,167,0.25)] active:scale-95 transition-all duration-200 flex items-center justify-center gap-[8px]"
          >
            Selanjutnya
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              arrow_forward
            </span>
          </button>
          
        </footer>
      </div>
    </div>
  );
}