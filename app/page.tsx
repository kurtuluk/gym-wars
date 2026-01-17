"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';
import { Dumbbell, Server, User, ArrowRight, CheckCircle, Flame } from 'lucide-react';

// GERÇEKÇİ AVATAR LİSTESİ (Senin istediklerin)
const AVATARS = [
  { 
    id: 1, 
    name: "Arnold", 
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Arnold_Schwarzenegger_1974.jpg/800px-Arnold_Schwarzenegger_1974.jpg" 
  },
  { 
    id: 2, 
    name: "Ronnie", 
    url: "https://fitnessvolt.com/wp-content/uploads/2019/04/ronnie-coleman.jpg" 
  },
  { 
    id: 3, 
    name: "Cbum", 
    url: "https://manmaker.in/cdn/shop/articles/cbum-31-07-2024-0001.jpg?v=1722450546" 
  },
  { 
    id: 4, 
    name: "David Laid", 
    url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSeP-Qk-RrOJfSiy7vt3Y_HY4Jhah5qhOTtMA&s" 
  },
  { 
    id: 5, 
    name: "Ege Fitness", 
    url: "https://ilerigazetesicomtr.teimg.com/crop/1280x720/ilerigazetesi-com-tr/uploads/2025/09/2025/09-eylul/02-eylul/ege-cinel-1.jpg" // Temsili Ege Fitness fotosu
  },
  { 
    id: 6, 
    name: "Gokalaf", 
    url: "https://hwp.com.tr/wp-content/uploads/2024/12/gokalaf-1-1080x570.jpeg" 
  },
];

export default function Home() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [streakInput, setStreakInput] = useState(''); // Yeni: Streak Girişi
  
  // Varsayılan değerler
  const [selectedServer, setSelectedServer] = useState<'server_1' | 'server_2'>('server_1');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0].url);

  useEffect(() => {
    const user = localStorage.getItem('currentUser');
    if (user) router.push('/dashboard');
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLogin) {
      // GİRİŞ
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('pin_code', pin)
        .single();

      if (error || !data) {
        alert('Hatalı kullanıcı adı veya PIN!');
      } else {
        localStorage.setItem('currentUser', JSON.stringify(data));
        router.push('/dashboard');
      }
    } else {
      // KAYIT
      const { data: existing } = await supabase.from('users').select('*').eq('username', username).single();
      if (existing) {
        alert('Bu isim zaten alınmış.');
        return;
      }

      // STREAK & COIN HESABI
      const streakVal = parseInt(streakInput) || 0;
      const bonusCoins = Math.floor(streakVal / 10) * 50; // Her 10 haftada 50 Coin

      const { data, error } = await supabase
        .from('users')
        .insert([{ 
            username, 
            pin_code: pin,
            group_id: selectedServer,
            avatar_url: selectedAvatar,
            initial_streak: streakVal,
            coins: bonusCoins // Başlangıç bonusu
        }])
        .select()
        .single();

      if (error) {
        alert('Kayıt hatası: ' + error.message);
      } else {
        if (bonusCoins > 0) alert(`Tebrikler! ${streakVal} haftalık streak için ${bonusCoins} Coin kazandın!`);
        localStorage.setItem('currentUser', JSON.stringify(data));
        router.push('/dashboard');
      }
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-white flex flex-col items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-md space-y-8 my-8">
        
        <div className="text-center">
          <div className="mx-auto w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(234,179,8,0.5)]">
            <Dumbbell size={40} className="text-black" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
            GYM WARS
          </h1>
          <p className="text-neutral-400 mt-2">Tarafını Seç, Savaş Başlasın.</p>
        </div>

        <div className="bg-neutral-800 p-8 rounded-3xl border border-neutral-700 shadow-2xl">
          <form onSubmit={handleAuth} className="space-y-6">
            
            {!isLogin && (
              <div className="space-y-6 animate-in slide-in-from-top-4 fade-in duration-500">
                
                {/* 1. SERVER SEÇİMİ */}
                <div>
                   <label className="block text-xs font-bold text-neutral-400 uppercase mb-2 flex items-center gap-1"><Server size={12}/> Server Seç</label>
                   <div className="grid grid-cols-2 gap-3">
                      <button type="button" onClick={() => setSelectedServer('server_1')} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition ${selectedServer === 'server_1' ? 'border-yellow-500 bg-yellow-900/20' : 'border-neutral-600 bg-neutral-700/50 opacity-50'}`}>
                         <span className="text-2xl">🌍</span>
                         <span className="font-bold text-sm">SERVER 1</span>
                      </button>
                      <button type="button" onClick={() => setSelectedServer('server_2')} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition ${selectedServer === 'server_2' ? 'border-blue-500 bg-blue-900/20' : 'border-neutral-600 bg-neutral-700/50 opacity-50'}`}>
                         <span className="text-2xl">🌑</span>
                         <span className="font-bold text-sm">SERVER 2</span>
                      </button>
                   </div>
                </div>

                {/* 2. AVATAR SEÇİMİ */}
                <div>
                   <label className="block text-xs font-bold text-neutral-400 uppercase mb-2 flex items-center gap-1"><User size={12}/> İdolünü Seç</label>
                   <div className="grid grid-cols-3 gap-2">
                      {AVATARS.map((avatar) => (
                        <button 
                          key={avatar.id} 
                          type="button" 
                          onClick={() => setSelectedAvatar(avatar.url)}
                          className={`relative rounded-xl overflow-hidden border-2 transition hover:scale-105 h-24 ${selectedAvatar === avatar.url ? 'border-yellow-500 shadow-[0_0_10px_orange]' : 'border-transparent opacity-50 grayscale'}`}
                        >
                          <img src={avatar.url} alt={avatar.name} className="w-full h-full object-cover" />
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[8px] text-center py-1 font-bold truncate px-1">
                            {avatar.name}
                          </div>
                          {selectedAvatar === avatar.url && (
                            <div className="absolute top-1 right-1 bg-yellow-500 rounded-full p-0.5">
                              <CheckCircle size={12} className="text-black"/>
                            </div>
                          )}
                        </button>
                      ))}
                   </div>
                </div>

                {/* 3. STREAK GİRİŞİ */}
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase mb-2 flex items-center gap-1"><Flame size={12}/> Kaç Haftadır Yapıyorsun?</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={streakInput}
                    onChange={(e) => setStreakInput(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-yellow-500 outline-none transition"
                    placeholder="Örn: 12"
                  />
                  <p className="text-[10px] text-yellow-500/80 mt-1 ml-1">*Her 10 hafta için +50 Coin kazanırsın.</p>
                </div>

              </div>
            )}

            {/* FORM */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">Kullanıcı Adı</label>
                <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-neutral-900 border border-neutral-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-yellow-500 outline-none transition" placeholder="Lakabın ne?" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">PIN (4 Hane)</label>
                <input type="text" required maxLength={4} pattern="\d{4}" value={pin} onChange={(e) => setPin(e.target.value)} className="w-full bg-neutral-900 border border-neutral-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-yellow-500 outline-none transition tracking-widest text-center text-xl font-mono" placeholder="0000" />
              </div>
            </div>

            <button type="submit" className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 text-black font-bold py-4 rounded-xl hover:from-yellow-400 hover:to-orange-500 transition transform hover:scale-[1.02] shadow-lg flex items-center justify-center gap-2">
              {isLogin ? 'Giriş Yap' : 'Kaydı Tamamla'} <ArrowRight size={20}/>
            </button>
          </form>
        </div>

        <p className="text-center text-neutral-500">
          <button onClick={() => setIsLogin(!isLogin)} className="text-yellow-500 hover:underline font-semibold">
            {isLogin ? "Kayıt Ol" : "Giriş Yap"}
          </button>
        </p>
      </div>
    </div>
  );
}