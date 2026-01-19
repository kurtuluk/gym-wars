"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { 
  Trophy, Flame, Dumbbell, Heart, LogOut, Gavel, 
  ThumbsUp, ThumbsDown, Medal, CheckCircle, Skull, 
  Swords, MessageSquare, CalendarDays, ShoppingCart, Store, 
  Calendar, Info, Crown, Star, Zap, Ghost, Gem, Tag, Monitor, Server, Banknote, AlertTriangle, TrendingUp, Dices, Scale
} from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [serverLeader, setServerLeader] = useState<any>(null); // SERVER LİDERİ
  
  // Veriler
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'weekly' | 'monthly' | 'streak'>('weekly');
  
  const [currentBoss, setCurrentBoss] = useState<any>(null); 
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [fallenHeroes, setFallenHeroes] = useState<any[]>([]); 
  const [activeDuels, setActiveDuels] = useState<any[]>([]); // Eşleşmeler
  
  // UI Durumları
  const [showStore, setShowStore] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [showBets, setShowBets] = useState(false); 
  const [betAmount, setBetAmount] = useState<number>(0);
  const [spinning, setSpinning] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [streakDecayMode, setStreakDecayMode] = useState<'decrease' | 'freeze'>('decrease');
  
  const [loading, setLoading] = useState(true);
  const [myStats, setMyStats] = useState({ gym: 0, cardio: 0 });
  
  // Sayaçlar
  const [dateStr, setDateStr] = useState('');
  const [currentCycle, setCurrentCycle] = useState(0); // 0, 1, 2, 3
  const [timeLeftMonth, setTimeLeftMonth] = useState('');

  // --- SABİTLER ---
  const DEFAULT_AVATAR = "https://api.dicebear.com/9.x/avataaars/svg?seed=Felix"; // Yedek avatar

  const CYCLE_MAP = [
    { id: 1, title: "HAZIRLIK", icon: "☮️", desc: "Normal Hafta" },
    { id: 2, title: "BOSS I", icon: "👹", desc: "Boss Savaşı" },
    { id: 3, title: "DÜELLO", icon: "⚔️", desc: "Büyük Kapışma" }, // 3. Hafta Düello
    { id: 0, title: "BOSS II", icon: "💀", desc: "Final Boss" }, // 4. Hafta (Modülo 0)
  ];

  const RANKS = [
    { min: 0, name: "Çaylak 🐣", color: "text-neutral-400" },
    { min: 10, name: "Amatör 🧢", color: "text-blue-400" },
    { min: 50, name: "Gym Rat 🐀", color: "text-purple-400" },
    { min: 100, name: "Canavar 🦍", color: "text-red-500 font-bold" },
    { min: 250, name: "Yarı Tanrı ⚡", color: "text-yellow-400 font-black animate-pulse" },
    { min: 500, name: "GIGACHAD 🗿", color: "text-fuchsia-500 font-black" }
  ];

  // --- ZAMAN FONKSİYONLARI ---
  const getWeekStart = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); 
    const monday = new Date(d.setDate(diff));
    monday.setHours(0,0,0,0);
    return monday;
  };
  const getMonthStart = () => {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1);
  };
  const getLastWeekStart = () => {
    const thisWeek = getWeekStart();
    const lastWeek = new Date(thisWeek);
    lastWeek.setDate(lastWeek.getDate() - 7);
    return lastWeek;
  };
  const getWeekNumber = (d: Date) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    return Math.ceil(( ( (d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
  };

  // --- INIT ---
  useEffect(() => {
    const now = new Date();
    setDateStr(now.toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    
    // Döngü Hesapla
    const weekNum = getWeekNumber(now);
    const cycle = weekNum % 4; 
    setCurrentCycle(cycle);

    const timer = setInterval(() => {
      const currentDate = new Date();
      const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
      const diffMonth = nextMonth.getTime() - currentDate.getTime();
      const mDays = Math.floor(diffMonth / (1000 * 60 * 60 * 24));
      const mHours = Math.floor((diffMonth % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      setTimeLeftMonth(`${mDays} Gün ${mHours} Saat`);
    }, 1000 * 60);

    const storedUser = localStorage.getItem('currentUser');
    if (!storedUser) {
      router.push('/');
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    setCurrentUser(parsedUser);
    loadAllData(parsedUser.id);
    return () => clearInterval(timer);
  }, [activeTab]);

  const loadAllData = async (userId: string) => {
    setLoading(true);
    const thisWeekStartStr = getWeekStart().toISOString().split('T')[0];
    const thisMonthStartStr = getMonthStart().toISOString().split('T')[0];
    const lastWeekStartStr = getLastWeekStart().toISOString().split('T')[0];

    const { data: userData } = await supabase.from('users').select('*').eq('id', userId).single();
    if (!userData) { localStorage.removeItem('currentUser'); router.push('/'); return; }
    
    setCurrentUser(userData);
    localStorage.setItem('currentUser', JSON.stringify(userData)); 

    // Kullanıcıları Çek ve Lideri Bul
    const userGroup = userData.group_id || 'server_1';
    const { data: allUsersData } = await supabase.from('users').select('*').eq('group_id', userGroup).order('created_at', { ascending: true });
    
    if (allUsersData) {
      setAllUsers(allUsersData);
      setServerLeader(allUsersData[0]); // İlk kayıt olan liderdir
    }

    const { data: logs } = await supabase.from('activity_logs').select('*');
    if (logs) {
      const myWeekLogs = logs.filter((l:any) => l.user_id === userId && l.activity_date >= thisWeekStartStr);
      setMyStats({
        gym: myWeekLogs.filter((l:any) => l.activity_type === 'gym').length,
        cardio: myWeekLogs.filter((l:any) => l.activity_type === 'cardio').length
      });

      // Liderlik Tablosu
      let stats = [];
      if (activeTab === 'weekly') stats = calculateRanking(allUsersData || [], logs, thisWeekStartStr);
      else if (activeTab === 'monthly') stats = calculateRanking(allUsersData || [], logs, thisMonthStartStr);
      else stats = (allUsersData || []).map(u => ({ ...u, score: u.initial_streak, subText: `${u.initial_streak} Hafta Streak` })).sort((a, b) => b.score - a.score);
      setLeaderboard(stats);
      
      // Pazartesi Raporu & Düşenler
      await checkWeeklyProgress(userData, logs, lastWeekStartStr, thisWeekStartStr);
      const lastWeekLogs = logs.filter((l:any) => l.activity_date >= lastWeekStartStr && l.activity_date < thisWeekStartStr);
      const failedUsers = (allUsersData || []).filter(u => {
         const uLogs = lastWeekLogs.filter((l:any) => l.user_id === u.id && l.activity_type === 'gym');
         return uLogs.length < 4;
      });
      setFallenHeroes(failedUsers);

      // Haftalık Döngü Kontrolü
      const weekNum = getWeekNumber(new Date());
      const cycle = weekNum % 4;

      // 3. Hafta: Düello
      if (cycle === 3) {
          await loadActiveDuels(allUsersData || [], thisWeekStartStr, userGroup);
      }
      // 2 veya 0 (4). Hafta: Boss
      else if (cycle === 2 || cycle === 0) {
          await handleBoss(allUsersData || [], thisWeekStartStr, userGroup);
      }
    }
    setLoading(false);
  };

  // --- LİDERİN ÇARKI (DÜELLO BAŞLATMA) ---
  const spinLeaderWheel = async () => {
    if (!currentUser || currentUser.id !== serverLeader?.id) return;
    if (!confirm("Düello çarkını çevirip bu haftanın eşleşmelerini belirlemek üzeresin! Hazır mısın Lider?")) return;

    setSpinning(true);
    const thisWeekStartStr = getWeekStart().toISOString().split('T')[0];
    
    // Rastgele Eşleştirme Mantığı
    const shuffled = [...allUsers].sort(() => 0.5 - Math.random());
    const themes = ["En Çok Kardiyo", "En Çok Gym", "En Çok Gün Spor", "En Az Rest Day", "Kim Daha Çok Yakacak?"];
    const pairs: Array<{ week_start_date: string; player1_id: string; player2_id: string | null; theme: string; group_id: string }> = [];
    
    while (shuffled.length >= 2) {
      const p1 = shuffled.pop();
      const p2 = shuffled.pop();
      const randomTheme = themes[Math.floor(Math.random() * themes.length)];
      pairs.push({ week_start_date: thisWeekStartStr, player1_id: p1.id, player2_id: p2.id, theme: randomTheme, group_id: currentUser.group_id || 'server_1' });
    }
    if (shuffled.length === 1) {
      const lucky = shuffled.pop();
      pairs.push({ week_start_date: thisWeekStartStr, player1_id: lucky.id, player2_id: null, theme: "ŞANSLI GÜN (BAY GEÇTİN)", group_id: currentUser.group_id });
    }

    setTimeout(async () => {
       await supabase.from('duels').insert(pairs);
       setSpinning(false);
       alert("EŞLEŞMELER BELLİ OLDU! Savaş başlasın!");
       window.location.reload();
    }, 3000);
  };

  const loadActiveDuels = async (users: any[], weekStart: string, groupId: string) => {
    const { data: duels } = await supabase.from('duels').select('*').eq('week_start_date', weekStart).eq('group_id', groupId);
    if (duels && duels.length > 0) {
        const enrichedDuels = duels.map((d: any) => {
            const p1 = users.find(u => u.id === d.player1_id);
            const p2 = users.find(u => u.id === d.player2_id);
            return { ...d, p1, p2 };
        });
        setActiveDuels(enrichedDuels);
    }
  };

  const handleBoss = async (users: any[], weekStart: string, groupId: string) => {
    const { data: boss } = await supabase.from('raid_bosses').select('*').eq('week_start_date', weekStart).eq('group_id', groupId).single();
    if (!boss && users.length > 0) {
      const totalHP = users.length * 600;
      const { data: newBoss } = await supabase.from('raid_bosses').insert([{ week_start_date: weekStart, hp_max: totalHP, hp_current: totalHP, boss_name: "DEV GOLEM", group_id: groupId }]).select().single();
      setCurrentBoss(newBoss);
    } else {
      setCurrentBoss(boss);
    }
  };

  const addActivity = async (type: 'gym' | 'cardio') => {
    if (!currentUser) return;
    const today = new Date().toISOString().split('T')[0];
    
    try {
      const res = await fetch('/api/activity', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          activityType: type,
          activityDate: today,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || 'Hata oluştu');
        return;
      }

      const data = await res.json();
      let newBalance = (currentUser.coins || 0) + data.earnedCoins;

      // Boss'a hasar ekle
      if (currentBoss && !currentBoss.is_defeated) {
        const damage = type === 'gym' ? 100 : 50;
        const bossRes = await fetch('/api/boss', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser.id,
            damage,
            groupId: currentUser.group_id || 'server_1',
            weekStart: getWeekStart().toISOString().split('T')[0],
          }),
        });

        if (bossRes.ok) {
          const bossData = await bossRes.json();
          if (bossData.isDefeated) {
            alert('🎉 BOSS ÖLDÜ! HERKESE +100 COIN!');
            newBalance += 100;
          }
          setCurrentBoss({ ...currentBoss, hp_current: bossData.newHP, is_defeated: bossData.isDefeated });
        }
      }

      await supabase.from('users').update({ coins: newBalance }).eq('id', currentUser.id);
      setCurrentUser({ ...currentUser, coins: newBalance });

      if (type === 'gym') setMyStats((p) => ({ ...p, gym: p.gym + 1 }));
      if (type === 'cardio') setMyStats((p) => ({ ...p, cardio: p.cardio + 1 }));
      alert(`+${data.earnedCoins} Coin!`);
      loadAllData(currentUser.id);
    } catch (error) {
      console.error('Activity error:', error);
      alert('Bağlantı hatası');
    }
  };

  const buyItem = async (itemType: string, cost: number, extraData?: string) => {
    if (currentUser.coins < cost) { alert("Yetersiz bakiye!"); return; }
    if (!confirm(`${cost} Coin harcanacak. Emin misin?`)) return;
    
    try {
      const res = await fetch('/api/shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          itemType,
          cost,
          extraData,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        await supabase.from('users').select('*').eq('id', currentUser.id).single().then(({ data: user }) => {
          setCurrentUser(user);
          localStorage.setItem('currentUser', JSON.stringify(user));
        });
        alert('Satın alındı!');
        setShowStore(false);
      } else {
        const error = await res.json();
        alert(error.error);
      }
    } catch (error) {
      console.error('Shop error:', error);
      alert('Hata oluştu');
    }
  };

  const placeBet = async (duelId:string, targetId:string) => { 
     if(currentUser.coins < betAmount || betAmount<=0) {alert("Yetersiz"); return;}
     await supabase.from('bets').insert([{better_id:currentUser.id, duel_id:duelId, predicted_winner_id:targetId, amount:betAmount}]);
     const newB = currentUser.coins-betAmount;
     await supabase.from('users').update({coins:newB}).eq('id',currentUser.id);
     setCurrentUser({...currentUser, coins:newB}); alert("Oynandı"); setBetAmount(0);
  };

  const calculateRanking = (users: any[], logs: any[], startDate: string) => {
    return users.map(user => {
      const userLogs = logs.filter((l: any) => l.user_id === user.id && l.activity_date >= startDate);
      const gym = userLogs.filter((l: any) => l.activity_type === 'gym').length;
      const cardio = userLogs.filter((l: any) => l.activity_type === 'cardio').length;
      return { ...user, score: gym + cardio, gym, cardio, subText: `${gym} Gym + ${cardio} Kardiyo` };
    }).sort((a, b) => b.score - a.score).map((u, i) => ({...u, rank: i+1}));
  };
  
  const checkWeeklyProgress = async (user: any, logs: any[], lastWeekStart: string, thisWeekStart: string) => {
      if (user.last_weekly_process_date !== thisWeekStart) {
          const myLastWeekLogs = logs.filter((l:any) => l.user_id === user.id && l.activity_type === 'gym' && l.activity_date >= lastWeekStart && l.activity_date < thisWeekStart);
          let newStreak = user.initial_streak;
          if (myLastWeekLogs.length >= 4) newStreak += 1;
          await supabase.from('users').update({ initial_streak: newStreak, last_weekly_process_date: thisWeekStart }).eq('id', user.id);
          window.location.reload();
      }
  };

  const getNameClasses = (user: any) => {
    let classes = `font-bold text-sm flex items-center gap-2 ${user.name_color || 'text-white'}`;
    if (user.name_effect === 'rainbow') classes += ' bg-gradient-to-r from-red-500 via-green-500 to-blue-500 text-transparent bg-clip-text animate-pulse';
    return classes;
  };

  const getRank = (count: number) => RANKS.slice().reverse().find(r => count >= r.min) || RANKS[0];

  if (loading) return <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center">Yükleniyor...</div>;

  return (
    <div className="min-h-screen bg-neutral-900 text-white pb-28 relative overflow-x-hidden font-sans">
      
      {/* TAKVİM WIDGET */}
      <div className="p-4 pt-2">
         <div className="flex justify-between items-center mb-2">
             <span className="text-xs text-neutral-400 font-bold tracking-widest uppercase">Takvim Döngüsü</span>
             <span className="text-[10px] bg-neutral-800 px-2 py-1 rounded text-neutral-500">{dateStr}</span>
         </div>
         <div className="grid grid-cols-4 gap-2">
            {CYCLE_MAP.map((c) => {
               const isActive = c.id === currentCycle; // 0, 1, 2, 3
               return (
                  <div key={c.id} className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${isActive ? 'bg-yellow-600/20 border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.3)] scale-105' : 'bg-neutral-800 border-neutral-700 opacity-60'}`}>
                     <span className="text-lg">{c.icon}</span>
                     <span className={`text-[9px] font-bold mt-1 ${isActive ? 'text-yellow-400' : 'text-neutral-500'}`}>{c.title}</span>
                  </div>
               )
            })}
         </div>
      </div>

      {/* BAHİS MODALI */}
      {showBets && (
         <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-4 overflow-y-auto">
            <button onClick={() => setShowBets(false)} className="absolute top-4 right-4 text-white"><LogOut/></button>
            <h2 className="text-2xl font-bold text-green-500 mb-4 flex items-center gap-2"><Banknote/> BAHİS LİGİ</h2>
            <div className="w-full max-w-md space-y-4">
               {activeDuels.map(duel => (
                  <div key={duel.id} className="bg-neutral-800 p-4 rounded-xl border border-neutral-700">
                     <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-blue-400">{duel.p1?.username}</span>
                        <span className="text-xs text-neutral-500 bg-black/50 px-2 py-0.5 rounded">VS</span>
                        <span className="font-bold text-red-400">{duel.p2?.username || 'BAY'}</span>
                     </div>
                     <p className="text-[10px] text-center text-neutral-500 mb-3">{duel.theme}</p>
                     {duel.p2 && (
                       <div className="space-y-2">
                          <div className="flex gap-2 items-center justify-center mb-2">
                             <input type="number" placeholder="Miktar" value={betAmount} onChange={(e) => setBetAmount(Number(e.target.value))} className="w-24 bg-black/30 border border-neutral-600 rounded p-1 text-sm text-white"/>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                             <button onClick={() => placeBet(duel.id, duel.p1.id)} className="bg-blue-900/30 text-blue-300 py-2 rounded text-xs hover:bg-blue-900/50">SOLA BAS</button>
                             <button onClick={() => placeBet(duel.id, duel.p2.id)} className="bg-red-900/30 text-red-300 py-2 rounded text-xs hover:bg-red-900/50">SAĞA BAS</button>
                          </div>
                       </div>
                     )}
                  </div>
               ))}
               {activeDuels.length === 0 && <p className="text-neutral-500 text-center">Aktif düello yok.</p>}
            </div>
         </div>
      )}

      {/* MEGA MAĞAZA MODALI (Kısaltılmış) */}
      {showStore && (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-4 overflow-y-auto">
          <div className="bg-neutral-800 w-full max-w-md rounded-3xl border border-yellow-600/50 p-6 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowStore(false)} className="absolute top-4 right-4 text-white"><LogOut/></button>
            <h2 className="text-2xl font-black text-yellow-500 mb-4"><Store/> MAĞAZA</h2>
            <div className="space-y-2">
               {/* ÇERÇEVELER */}
               <div className="text-xs font-bold text-neutral-400 uppercase mb-2">✨ Çerçeveler</div>
               <button onClick={() => buyItem('fire_icon', 50)} className="w-full bg-neutral-700 hover:bg-neutral-600 p-3 rounded flex justify-between text-sm"><span>🔥 Ateş İkonu</span><span className="text-yellow-500">50 C</span></button>
               <button onClick={() => buyItem('gold_border', 200)} className="w-full bg-neutral-700 hover:bg-neutral-600 p-3 rounded flex justify-between text-sm"><span>💰 Altın Çerçeve</span><span className="text-yellow-500">200 C</span></button>
               <button onClick={() => buyItem('neon_border', 350)} className="w-full bg-neutral-700 hover:bg-neutral-600 p-3 rounded flex justify-between text-sm border border-blue-500"><span>✨ Neon Çerçeve</span><span className="text-yellow-500">350 C</span></button>
               <button onClick={() => buyItem('diamond_border', 500)} className="w-full bg-neutral-700 hover:bg-neutral-600 p-3 rounded flex justify-between text-sm border border-cyan-500"><span>💎 Diamond Çerçeve</span><span className="text-yellow-500">500 C</span></button>
               
               {/* EMOJİ VE EFEKTLER */}
               <div className="text-xs font-bold text-neutral-400 uppercase mb-2 mt-4">🌈 Efektler</div>
               <button onClick={() => buyItem('name_effect', 150, 'rainbow')} className="w-full bg-neutral-700 hover:bg-neutral-600 p-3 rounded flex justify-between text-sm"><span>🌈 Rainbow İsim</span><span className="text-yellow-500">150 C</span></button>
               <button onClick={() => buyItem('name_effect', 150, 'glitch')} className="w-full bg-neutral-700 hover:bg-neutral-600 p-3 rounded flex justify-between text-sm"><span>👾 Glitch İsim</span><span className="text-yellow-500">150 C</span></button>
               
               {/* ÖZEL İTEMLER */}
               <div className="text-xs font-bold text-neutral-400 uppercase mb-2 mt-4">👑 Özel İtемleri</div>
               <button onClick={() => buyItem('perm_king_icon', 1000)} className="w-full bg-neutral-700 hover:bg-neutral-600 p-3 rounded flex justify-between text-sm border border-yellow-500"><span>👑 Kalıcı Kral İkonu</span><span className="text-yellow-500">1000 C</span></button>
               <button onClick={() => {const target = prompt('Kimin ismini değiştirmek istiyorsun? (Kullanıcı adı)'); if (target) buyItem('rename_user', 500, target);}} className="w-full bg-neutral-700 hover:bg-neutral-600 p-3 rounded flex justify-between text-sm border border-red-500"><span>👿 Troll - İsim Değiştir</span><span className="text-yellow-500">500 C</span></button>
               
               {/* EMOJI SEÇER */}
               <div className="text-xs font-bold text-neutral-400 uppercase mb-2 mt-4">😎 Status Emoji (7 gün)</div>
               <div className="grid grid-cols-5 gap-2">
                  {['💪','🔥','👑','🎯','🚀'].map(e => <button key={e} onClick={() => buyItem('status_emoji', 50, e)} className="bg-neutral-700 hover:bg-neutral-600 p-2 rounded text-2xl">{e}</button>)}
               </div>
            </div>
          </div>
        </div>
      )}

      {/* ÜST BUTONLAR */}
      <div className="px-4 mb-4 flex flex-col sm:flex-row justify-between items-center gap-2">
         <div className="flex gap-1 flex-wrap justify-center sm:justify-start">
            <button onClick={() => setShowStore(true)} className="flex items-center gap-1 bg-yellow-600/20 text-yellow-500 px-2 sm:px-3 py-1.5 rounded-full border border-yellow-600/50 text-xs font-bold whitespace-nowrap"><ShoppingCart size={14}/> Mağaza</button>
            {currentCycle === 3 && activeDuels.length > 0 && (
              <button onClick={() => setShowBets(true)} className="flex items-center gap-1 bg-green-600/20 text-green-500 px-2 sm:px-3 py-1.5 rounded-full border border-green-600/50 text-xs font-bold animate-pulse whitespace-nowrap"><TrendingUp size={14}/> Bahis</button>
            )}
            <button onClick={() => router.push('/leaderboard')} className="flex items-center gap-1 bg-purple-600/20 text-purple-500 px-2 sm:px-3 py-1.5 rounded-full border border-purple-600/50 text-xs font-bold whitespace-nowrap"><Trophy size={14}/> Sıralama</button>
         </div>
         <button onClick={() => {localStorage.removeItem('currentUser'); router.push('/')}} className="bg-neutral-800 p-2 rounded-full text-neutral-400"><LogOut size={16}/></button>
      </div>

      <div className="px-4 space-y-6">
        
        {/* KULLANICI KARTI */}
        <div className={`bg-gradient-to-br from-neutral-800 to-neutral-900 p-6 rounded-3xl shadow-xl relative overflow-hidden border border-neutral-700 
           ${currentUser?.has_neon_border ? 'border-2 border-blue-500 shadow-[0_0_15px_blue]' : ''}
        `}>
           <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-yellow-500 bg-neutral-800">
                    <img src={currentUser?.avatar_url || DEFAULT_AVATAR} className="w-full h-full object-cover"/>
                </div>
                <div>
                    <h1 className={getNameClasses(currentUser)}>{currentUser?.username} {currentUser?.status_emoji}</h1>
                    <p className={`text-xs mt-1 font-bold ${getRank(currentUser?.total_activity_count || 0).color}`}>
                    {getRank(currentUser?.total_activity_count || 0).name}
                    </p>
                    {/* SERVER LİDERİ İKONU */}
                    {serverLeader?.id === currentUser?.id && (
                       <span className="text-[10px] bg-red-900/50 text-red-200 px-2 py-0.5 rounded border border-red-500/30 mt-1 inline-block">👑 Server Lideri</span>
                    )}
                </div>
              </div>
              <div className="text-right">
                 <span className="text-xl font-bold block">{currentUser?.initial_streak} Hafta</span>
                 <p className="text-sm text-yellow-500 font-bold mt-1 bg-yellow-900/20 inline-block px-3 py-1 rounded-full">💰 {currentUser?.coins || 0}</p>
              </div>
           </div>
        </div>

        {/* --- DİNAMİK ALAN (HAFTAYA GÖRE DEĞİŞİR) --- */}
        
        {/* 1. DÜELLO HAFTASI (3. Hafta) */}
        {currentCycle === 3 && (
           <div className="space-y-4 animate-in slide-in-from-bottom">
              {/* LİDER İÇİN ÇARK */}
              {activeDuels.length === 0 ? (
                 <div className="bg-gradient-to-r from-fuchsia-900/20 to-purple-900/20 border border-fuchsia-500/50 rounded-2xl p-6 text-center">
                    <Dices className="mx-auto text-fuchsia-400 w-12 h-12 mb-2"/>
                    <h3 className="text-xl font-bold text-white">DÜELLO HAFTASI GELDİ!</h3>
                    <p className="text-sm text-neutral-400 mb-4">Henüz eşleşmeler yapılmadı.</p>
                    
                    {serverLeader?.id === currentUser?.id ? (
                       <button onClick={spinLeaderWheel} disabled={spinning} className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold py-3 px-6 rounded-xl w-full shadow-[0_0_20px_magenta] transition-all transform hover:scale-105">
                          {spinning ? 'Eşleştiriliyor...' : '👑 LİDER: ÇARKI ÇEVİR VE EŞLEŞTİR'}
                       </button>
                    ) : (
                       <p className="text-xs text-yellow-500 bg-yellow-900/20 p-2 rounded">Sadece Server Lideri ({serverLeader?.username}) çarkı çevirebilir.</p>
                    )}
                 </div>
              ) : (
                 <div className="bg-fuchsia-900/20 border border-fuchsia-500/50 rounded-2xl p-4">
                    <div className="flex justify-between items-center mb-4">
                       <h3 className="font-bold text-fuchsia-300 flex items-center gap-2"><Swords/> BU HAFTANIN EŞLEŞMELERİ</h3>
                       <span className="text-[10px] bg-fuchsia-500/20 px-2 py-1 rounded text-white animate-pulse">SAVAŞ AKTİF</span>
                    </div>
                    {/* Sadece Kullanıcının Kendi Maçı */}
                    {activeDuels.filter(d => d.p1?.id === currentUser?.id || d.p2?.id === currentUser?.id).map(d => (
                       <div key={d.id} className="bg-black/40 p-3 rounded-xl border border-white/10">
                          <p className="text-[10px] text-center text-neutral-400 mb-2 uppercase tracking-widest">{d.theme}</p>
                          <div className="flex justify-between items-center">
                             <span className="font-bold text-blue-400">{d.p1.username}</span>
                             <span className="text-xl font-black text-fuchsia-500">VS</span>
                             <span className="font-bold text-red-400">{d.p2?.username || 'BAY'}</span>
                          </div>
                       </div>
                    ))}
                    <button onClick={() => setShowBets(true)} className="w-full mt-3 bg-green-700/20 text-green-400 text-xs py-2 rounded border border-green-500/30 hover:bg-green-700/40">Diğer Maçlara Bahis Yap</button>
                 </div>
              )}
           </div>
        )}

        {/* 2. BOSS SAVAŞI (0 veya 2. Hafta) */}
        {(currentCycle === 0 || currentCycle === 2) && currentBoss && !currentBoss.is_defeated && (
           <div className="bg-red-900/20 border border-red-500/50 rounded-2xl p-4 relative overflow-hidden">
              <div className="flex justify-between items-center mb-2">
                 <h3 className="font-bold text-red-400 flex items-center gap-2"><Skull/> {currentBoss.boss_name}</h3>
                 <span className="text-[10px] bg-red-500/20 text-red-200 px-2 py-1 rounded">HP: {currentBoss.hp_current}</span>
              </div>
              <div className="w-full bg-neutral-800 rounded-full h-4 mb-2 overflow-hidden border border-neutral-700">
                 <div className="bg-gradient-to-r from-red-600 to-orange-600 h-full transition-all duration-500" style={{ width: `${(currentBoss.hp_current / currentBoss.hp_max) * 100}%` }}></div>
              </div>
              <p className="text-xs text-center text-red-300">Saldırın! Gym: -100, Kardiyo: -50 Hasar</p>
           </div>
        )}

        {/* BUTONLAR */}
        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => addActivity('gym')} className="bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 p-5 rounded-2xl flex flex-col items-center gap-2 active:scale-95 transition">
            <Dumbbell className="w-8 h-8 text-blue-500" /> <span className="font-bold text-sm">Gym</span>
          </button>
          <button onClick={() => addActivity('cardio')} className="bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 p-5 rounded-2xl flex flex-col items-center gap-2 active:scale-95 transition">
            <Heart className="w-8 h-8 text-pink-500" /> <span className="font-bold text-sm">Kardiyo</span>
          </button>
        </div>

        {/* LİDERLİK TABLOSU */}
        <div>
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-lg font-bold flex items-center gap-2"><span className="w-1 h-5 bg-yellow-500 rounded-full"></span> Sıralama</h3>
             <div className="flex bg-neutral-800 p-1 rounded-lg gap-1">
                <button onClick={() => setActiveTab('weekly')} className={`px-3 py-1 text-xs rounded-md ${activeTab === 'weekly' ? 'bg-neutral-700 font-bold text-white' : 'text-neutral-400'}`}>Hafta</button>
                <button onClick={() => setActiveTab('monthly')} className={`px-3 py-1 text-xs rounded-md ${activeTab === 'monthly' ? 'bg-neutral-700 font-bold text-white' : 'text-neutral-400'}`}>Ay</button>
             </div>
          </div>
          <div className="space-y-3">
            {leaderboard.map((user, index) => (
              <div key={user.id} className={`flex items-center justify-between p-4 bg-neutral-800 rounded-xl border border-neutral-700/50 ${index === 0 ? 'bg-gradient-to-r from-yellow-900/10 to-neutral-800' : ''}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 flex items-center justify-center font-bold rounded-lg ${index === 0 ? 'bg-yellow-500 text-black' : 'bg-neutral-900 text-neutral-500'}`}>{index + 1}</div>
                  <div>
                    <p className={getNameClasses(user)}>{user.username} {user.status_emoji}</p>
                    <p className="text-[10px] text-neutral-400">{user.subText}</p>
                  </div>
                </div>
                {index === 0 && <Medal size={16} className="text-yellow-500"/>}
              </div>
            ))}
          </div>
        </div>

        {/* UTANÇ DUVARI */}
        {fallenHeroes.length > 0 && (
           <div className="bg-red-950/30 border border-red-900/50 rounded-2xl p-4">
              <h3 className="text-red-500 font-bold flex items-center gap-2 mb-3"><AlertTriangle/> DÜŞENLER (4x Altı)</h3>
              <div className="space-y-2">
                 {fallenHeroes.map(u => (
                    <div key={u.id} className="flex items-center justify-between bg-black/40 p-2 rounded-lg">
                       <span className="text-neutral-300">{u.username}</span>
                       <span className="text-xs text-red-400 font-mono">Failed</span>
                    </div>
                 ))}
              </div>
           </div>
        )}

        {/* ALT MENÜ */}
        <div className="pt-6 grid grid-cols-5 gap-2">
           <button onClick={() => router.push('/notes')} className="bg-neutral-800 border border-neutral-700 text-neutral-300 py-3 rounded-xl flex flex-col items-center justify-center gap-1 hover:bg-neutral-700 text-xs"><CalendarDays size={18} className="text-blue-400" /> <span className="text-[10px]">Günlük</span></button>
           <button onClick={() => router.push('/feed')} className="bg-neutral-800 border border-neutral-700 text-neutral-300 py-3 rounded-xl flex flex-col items-center justify-center gap-1 hover:bg-neutral-700 text-xs"><MessageSquare size={18} className="text-green-400" /> <span className="text-[10px]">Soyunma</span></button>
           <button onClick={() => router.push('/duels')} className="bg-neutral-800 border border-neutral-700 text-neutral-300 py-3 rounded-xl flex flex-col items-center justify-center gap-1 hover:bg-neutral-700 text-xs"><Swords size={18} className="text-fuchsia-400" /> <span className="text-[10px]">Düellolar</span></button>
           <button onClick={() => router.push('/court')} className="bg-neutral-800 border border-neutral-700 text-neutral-300 py-3 rounded-xl flex flex-col items-center justify-center gap-1 hover:bg-neutral-700 text-xs"><Scale size={18} className="text-red-400" /> <span className="text-[10px]">Mahkeme</span></button>
           <button onClick={() => setShowSettings(true)} className="bg-neutral-800 border border-neutral-700 text-neutral-300 py-3 rounded-xl flex flex-col items-center justify-center gap-1 hover:bg-neutral-700 text-xs"><Monitor size={18} className="text-purple-400" /> <span className="text-[10px]">Ayarlar</span></button>
        </div>

        {/* SETTINGS MODAL */}
        {showSettings && (
           <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
              <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-6 max-w-md w-full">
                 <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Monitor size={20} className="text-purple-400" /> Ayarlar
                 </h2>

                 {/* STREAK AYARI */}
                 <div className="bg-neutral-800/50 rounded-xl p-4 mb-4 border border-neutral-700">
                    <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                       <Flame size={16} className="text-orange-500" /> Streak Kuralı
                    </h3>
                    <p className="text-xs text-neutral-400 mb-3">
                       Hedefi tutturmadığın haftalarda streak'e ne olsun?
                    </p>
                    <div className="space-y-2">
                       <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-700 cursor-pointer">
                          <input
                             type="radio"
                             checked={streakDecayMode === 'decrease'}
                             onChange={() => setStreakDecayMode('decrease')}
                             className="w-4 h-4"
                          />
                          <span className="text-sm text-neutral-200">📉 Sıfıra Dönüş (Zor Mod)</span>
                       </label>
                       <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-700 cursor-pointer">
                          <input
                             type="radio"
                             checked={streakDecayMode === 'freeze'}
                             onChange={() => setStreakDecayMode('freeze')}
                             className="w-4 h-4"
                          />
                          <span className="text-sm text-neutral-200">❄️ Sabit Kalır (Kolay Mod)</span>
                       </label>
                    </div>
                 </div>

                 {/* KAPATMA BUTONU */}
                 <div className="flex gap-2">
                    <button
                       onClick={async () => {
                          // Ayarları kaydet
                          const { error } = await supabase
                             .from('users')
                             .update({ streak_decay_mode: streakDecayMode })
                             .eq('id', currentUser.id);
                          
                          if (!error) {
                             const updated = { ...currentUser, streak_decay_mode: streakDecayMode };
                             setCurrentUser(updated);
                             localStorage.setItem('currentUser', JSON.stringify(updated));
                             alert('Ayarlar kaydedildi!');
                          }
                          setShowSettings(false);
                       }}
                       className="flex-1 bg-purple-600 hover:bg-purple-500 text-white py-2 rounded-lg font-bold"
                    >
                       Kaydet
                    </button>
                    <button
                       onClick={() => setShowSettings(false)}
                       className="flex-1 bg-neutral-700 hover:bg-neutral-600 text-white py-2 rounded-lg font-bold"
                    >
                       Kapat
                    </button>
                 </div>
              </div>
           </div>
        )}
      </div>
    </div>
  );
}