

interface Onboarding3Props {
  onBack?: () => void;
  onSkip?: () => void;
  onStart?: () => void;
}

export default function Onboarding3({ onBack, onSkip, onStart }: Onboarding3Props) {
  return (
    <div className="bg-[#eef5f7] min-h-screen flex items-center justify-center p-4">
      {/* Frame Mobile Android */}
      <div className="bg-[#f4fafd] text-[#161d1f] font-body-main antialiased min-h-screen sm:min-h-[800px] h-full sm:h-[800px] w-full max-w-md sm:rounded-[2.5rem] sm:shadow-2xl flex flex-col justify-between overflow-hidden relative">
        
        <style dangerouslySetInnerHTML={{
          __html: `
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap');
            @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
            body { font-family: 'Plus Jakarta Sans', sans-serif; }
          `
        }} />

        {/* Header: Tombol Kembali (Kiri) & Lewati (Kanan) */}
        <header className="w-full flex justify-between items-center px-[20px] py-[16px] z-10 relative">
          <button 
            onClick={onBack} 
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#eef5f7] transition-colors text-[#161d1f] active:scale-95"
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <button 
            onClick={onSkip} 
            className="font-bold text-[14px] text-[#005da7] hover:text-[#2976c7] px-[16px] py-[8px] rounded-full hover:bg-[#d4e3ff]/50 transition-colors duration-200"
          >
            Lewati
          </button>
        </header>

        {/* Main Content Area */}
        <main className="flex-grow flex flex-col items-center justify-center px-[20px] z-10 relative gap-[32px] w-full">
          
          {/* Illustration Area */}
          <div className="relative w-full aspect-square max-w-[280px] flex items-center justify-center">
             <div className="w-full h-full bg-[#ffffff] rounded-[2.5rem] shadow-sm flex items-center justify-center p-[24px] border border-[#e9ecef]">
                <img
                  alt="Ilustrasi pantau perkembangan"
                  className="w-full h-full object-contain relative z-10"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCaPpxOAASE7WtX_Nruhd0NfZQhB2M45R7x8iCkCWc7-WNt4H7ss487HAPiB1xNeRobzvuOL-uO-dhaFT6vsa_HZwnj6qkOdRu38WRaHhUdBEXbj9BL5M4oZPTsh7rQkEywBwuvWJyl3AykOu7BzP6FaQHMB3_qPHNZCCxip2Z4heC4rGkjjLzU61KFEj8V9RgQHXAMnwOETUCJT6c-j4bUK-Lz-tfL4GWygUqiCPrHATdxr5BStIUX"
                />
             </div>
          </div>

          {/* Text Content */}
          <div className="text-center flex flex-col gap-[8px] w-full max-w-sm">
            <h1 className="font-bold text-[32px] leading-[40px] tracking-[-0.02em] text-[#161d1f]">
              Pantau Perkembanganmu
            </h1>
            <p className="font-normal text-[16px] text-[#414751] px-[16px]">
              Lihat progress belajar dan bangun kebiasaan yang lebih konsisten.
            </p>
          </div>
        </main>

        {/* Footer: Indikator & Tombol */}
        <footer className="w-full px-[20px] py-[32px] flex flex-col items-center gap-[24px] z-10 relative">
          <div className="flex gap-[8px]">
            <div className="w-2 h-2 rounded-full bg-[#c1c7d3] transition-all duration-300"></div>
            <div className="w-2 h-2 rounded-full bg-[#c1c7d3] transition-all duration-300"></div>
            <div className="w-8 h-2 rounded-full bg-[#005da7] transition-all duration-300"></div>
          </div>

          <button 
            onClick={onStart} 
            className="w-full h-[56px] bg-[#005da7] text-[#ffffff] font-bold text-[16px] rounded-2xl shadow-[0px_4px_20px_rgba(0,93,167,0.25)] hover:bg-[#2976c7] active:scale-95 transition-all duration-200 flex items-center justify-center gap-[8px]"
          >
            Mulai Sekarang
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>arrow_forward</span>
          </button>
        </footer>

      </div>
    </div>
  );
}