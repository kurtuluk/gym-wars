"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { 
  Trophy, Flame, Dumbbell, Heart, LogOut, Gavel, 
  ThumbsUp, ThumbsDown, Medal, CheckCircle, Skull, 
  Swords, MessageSquare, CalendarDays, ShoppingCart, Store, 
  Calendar, Info, Crown, Star, Zap, Ghost, Gem, Tag, Monitor, Server
} from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Veriler
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'weekly' | 'monthly' | 'streak'>('weekly');
  
  const [currentDuel, setCurrentDuel] = useState<any>(null);
  const [currentBoss, setCurrentBoss] = useState<any>(null); 
  const [myPenalty, setMyPenalty] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [myAchievements, setMyAchievements] = useState<string[]>([]);
  
  // UI Durumları
  const [showWheel, setShowWheel] = useState(false);
  const [showStore, setShowStore] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [wheelResult, setWheelResult] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [myStats, setMyStats] = useState({ gym: 0, cardio: 0 });
  const [betAmount, setBetAmount] = useState<number>(0);
  
  // Sayaçlar
  const [dateStr, setDateStr] = useState('');
  const [cycleStatus, setCycleStatus] = useState(''); 
  const [timeLeftDuel, setTimeLeftDuel] = useState('');
  const [timeLeftMonth, setTimeLeftMonth] = useState('');

  // --- SABİTLER ---
  const DEFAULT_AVATAR = "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Arnold_Schwarzenegger_1974.jpg/800px-Arnold_Schwarzenegger_1974.jpg";

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
    
    const timer = setInterval(() => {
      const currentDate = new Date();
      
      const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
      const diffMonth = nextMonth.getTime() - currentDate.getTime();
      const mDays = Math.floor(diffMonth / (1000 * 60 * 60 * 24));
      const mHours = Math.floor((diffMonth % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      setTimeLeftMonth(`${mDays} Gün ${mHours} Saat`);

      const startOfYear = new Date(currentDate.getFullYear(), 0, 1);
      const pastDays = Math.floor((currentDate.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
      const currentWeekNum = Math.ceil((pastDays + startOfYear.getDay() + 1) / 7);
      const cycle = currentWeekNum % 4; 
      
      if (cycle === 0) setCycleStatus("⚔️ DÜELLO HAFTASI");
      else if (cycle === 1) setCycleStatus("👹 BOSS SAVAŞI (1/2)");
      else if (cycle === 2) setCycleStatus("☮️ NORMAL HAFTA");
      else if (cycle === 3) setCycleStatus("👹 BOSS SAVAŞI (2/2)");

      const weeksUntilNextDuel = 4 - (currentWeekNum % 4);
      if (currentWeekNum % 4 === 0) {
        setTimeLeftDuel("🔥 SAVAŞ BAŞLADI!");
      } else {
        const d = new Date(currentDate);
        const day = d.getDay();
        const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1);
        const currentWeekStart = new Date(d.setDate(diffToMonday));
        currentWeekStart.setHours(0, 0, 0, 0);
        const targetDate = new Date(currentWeekStart);
        targetDate.setDate(targetDate.getDate() + (weeksUntilNextDuel * 7));
        const diffTime = targetDate.getTime() - currentDate.getTime();
        
        if (diffTime < 0) {
           setTimeLeftDuel("...");
        } else {
           const dDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
           setTimeLeftDuel(`Duel'e: ${dDays} Gün`);
        }
      }
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

    // *** KRİTİK DÜZELTME: KULLANICI YOKSA LOGOUT YAP ***
    const { data: userData } = await supabase.from('users').select('*').eq('id', userId).single();
    
    if (!userData) {
      // Eğer veritabanında bu kullanıcı yoksa (silinmişse):
      localStorage.removeItem('currentUser'); // Hafızadan sil
      router.push('/'); // Giriş sayfasına at
      return;
    }

    if (userData) {
      setCurrentUser(userData);
      localStorage.setItem('currentUser', JSON.stringify(userData)); 
      
      if (userData.status_emoji && userData.status_emoji_expires_at && new Date(userData.status_emoji_expires_at) < new Date()) {
         await supabase.from('users').update({ status_emoji: null, status_emoji_expires_at: null }).eq('id', userId);
      }
      if (userData.rename_expires_at && new Date(userData.rename_expires_at) < new Date() && userData.real_username) {
        await supabase.from('users').update({ username: userData.real_username, rename_expires_at: null, real_username: null }).eq('id', userId);
      }
    }

    const userGroup = userData.group_id || 'server_1';
    
    const { data: allUsersData } = await supabase.from('users').select('*').eq('group_id', userGroup);
    setAllUsers(allUsersData || []);

    const { data: achievements } = await supabase.from('user_achievements').select('badge_code').eq('user_id', userId);
    setMyAchievements(achievements?.map((a:any) => a.badge_code) || []);

    const { data: logs } = await supabase.from('activity_logs').select('*');
    
    if (logs) {
      const myWeekLogs = logs.filter((l:any) => l.user_id === userId && l.activity_date >= thisWeekStartStr);
      setMyStats({
        gym: myWeekLogs.filter((l:any) => l.activity_type === 'gym').length,
        cardio: myWeekLogs.filter((l:any) => l.activity_type === 'cardio').length
      });

      let stats = [];
      if (activeTab === 'weekly') {
        stats = calculateRanking(allUsersData || [], logs, thisWeekStartStr);
      } else if (activeTab === 'monthly') {
        stats = calculateRanking(allUsersData || [], logs, thisMonthStartStr);
      } else {
        stats = (allUsersData || []).map(u => ({
          ...u,
          score: u.initial_streak,
          subText: `${u.initial_streak} Hafta Streak`
        })).sort((a, b) => b.score - a.score);
      }
      setLeaderboard(stats);
      
      const weekNum = getWeekNumber(new Date());
      const cycle = weekNum % 4;
      if (cycle === 0) await handleDuels(userId, allUsersData || [], thisWeekStartStr, userGroup);
      else if (cycle === 1 || cycle === 3) await handleBoss(allUsersData || [], thisWeekStartStr, userGroup);
    }
    setLoading(false);
  };

  const handleBoss = async (users: any[], weekStart: string, groupId: string) => {
    const { data: boss } = await supabase.from('raid_bosses').select('*').eq('week_start_date', weekStart).eq('group_id', groupId).single();
    if (!boss && users.length > 0) {
      const totalHP = users.length * 600;
      const { data: newBoss } = await supabase.from('raid_bosses').insert([{ week_start_date: weekStart, hp_max: totalHP, hp_current: totalHP, boss_name: "DEV TEMBELLİK GOLEMİ", group_id: groupId }]).select().single();
      setCurrentBoss(newBoss);
    } else {
      setCurrentBoss(boss);
    }
  };

  const handleDuels = async (userId: string, users: any[], weekStart: string, groupId: string) => {
    const { data: existingDuels } = await supabase.from('duels').select('*').eq('week_start_date', weekStart).eq('group_id', groupId);
    if (existingDuels) {
       const myDuel = existingDuels.find((d:any) => d.player1_id === userId || d.player2_id === userId);
       if (myDuel) {
         const opponentId = myDuel.player1_id === userId ? myDuel.player2_id : myDuel.player1_id;
         const opponent = users.find(u => u.id === opponentId);
         setCurrentDuel({ ...myDuel, opponent });
       }
    }
  };

  // --- MEGA MAĞAZA İŞLEMLERİ ---
  const buyItem = async (itemType: string, cost: number, extraData?: string) => {
    if (currentUser.coins < cost) {
      alert("Yetersiz bakiye! Çalış da kazan."); return;
    }
    
    let finalExtraData = extraData;
    if (itemType === 'custom_title') {
       const title = prompt("İstediğin ünvanı yaz (Maks 15 karakter):");
       if (!title || title.length > 15) { alert("Geçersiz ünvan."); return; }
       finalExtraData = title;
    }

    if (!confirm(`${cost} Coin harcanacak. Emin misin?`)) return;

    let updateData: any = { coins: currentUser.coins - cost };
    
    if (itemType === 'fire_icon') updateData.has_fire_icon = true;
    if (itemType === 'gold_border') updateData.has_gold_border = true;
    if (itemType === 'neon_border') updateData.has_neon_border = true;
    if (itemType === 'diamond_border') updateData.has_diamond_border = true;
    if (itemType === 'perm_king_icon') updateData.perm_king_icon = true;
    
    if (itemType === 'name_effect') updateData.name_effect = finalExtraData; 
    if (itemType === 'name_color') updateData.name_color = finalExtraData; 
    if (itemType === 'custom_title') updateData.custom_title = finalExtraData;

    if (itemType === 'status_emoji') {
       const expiry = new Date(); expiry.setDate(expiry.getDate() + 7);
       updateData.status_emoji = extraData;
       updateData.status_emoji_expires_at = expiry.toISOString();
    }

    await supabase.from('users').update(updateData).eq('id', currentUser.id);
    setCurrentUser({ ...currentUser, ...updateData });
    
    if (itemType === 'rename_troll' && extraData) {
       const targetUser = allUsers.find(u => u.id === extraData);
       const newName = `Tembel ${targetUser.username}`;
       const expiry = new Date(); expiry.setHours(expiry.getHours() + 24);
       await supabase.from('users').update({ username: newName, real_username: targetUser.username, rename_expires_at: expiry.toISOString() }).eq('id', extraData);
       alert("Troll Başarılı! 😈");
    } else {
       alert("Satın alma başarılı! 😎");
    }
    setShowStore(false);
  };

  const addActivity = async (type: 'gym' | 'cardio') => {
    if (!currentUser) return;
    const today = new Date().toISOString().split('T')[0];
    const { data: existing } = await supabase.from('activity_logs').select('*').eq('user_id', currentUser.id).eq('activity_date', today).eq('activity_type', type);
    if (existing && existing.length > 0) { alert("Bugün bunu zaten girdin."); return; }
    const { error } = await supabase.from('activity_logs').insert([{ user_id: currentUser.id, activity_type: type, activity_date: today }]);
    if (!error) {
      const earnedCoins = type === 'gym' ? 10 : 5;
      let newBalance = (currentUser.coins || 0) + earnedCoins;
      const newTotalActivity = (currentUser.total_activity_count || 0) + 1;
      
      if (currentBoss && !currentBoss.is_defeated) {
         const damage = type === 'gym' ? 100 : 50;
         const newHP = Math.max(0, currentBoss.hp_current - damage);
         const isDead = newHP === 0;
         await supabase.from('raid_bosses').update({ hp_current: newHP, is_defeated: isDead }).eq('id', currentBoss.id);
         setCurrentBoss({ ...currentBoss, hp_current: newHP, is_defeated: isDead });
         if (isDead) { alert("BOSS ÖLDÜ! HERKESE +100 COIN! 👹💀"); newBalance += 100; }
      }
      await supabase.from('users').update({ coins: newBalance, total_activity_count: newTotalActivity }).eq('id', currentUser.id);
      setCurrentUser({ ...currentUser, coins: newBalance, total_activity_count: newTotalActivity });
      if (type === 'gym') setMyStats(p => ({...p, gym: p.gym + 1}));
      if (type === 'cardio') setMyStats(p => ({...p, cardio: p.cardio + 1}));
      alert(`+${earnedCoins} Coin!`);
      loadAllData(currentUser.id);
    }
  };

  const getNameClasses = (user: any) => {
    let classes = `font-bold text-sm flex items-center gap-2 ${user.name_color || 'text-white'}`;
    if (user.name_effect === 'rainbow') classes += ' bg-gradient-to-r from-red-500 via-green-500 to-blue-500 text-transparent bg-clip-text animate-pulse';
    if (user.name_effect === 'ghost') classes += ' opacity-50 blur-[0.5px]';
    if (user.name_effect === 'glitch') classes += ' text-red-500 font-mono tracking-widest uppercase';
    if (user.name_effect === 'matrix') classes += ' text-green-500 font-mono';
    return classes;
  };
  
  const calculateRanking = (users: any[], logs: any[], startDate: string) => {
    return users.map(user => {
      const userLogs = logs.filter((l: any) => l.user_id === user.id && l.activity_date >= startDate);
      const gym = userLogs.filter((l: any) => l.activity_type === 'gym').length;
      const cardio = userLogs.filter((l: any) => l.activity_type === 'cardio').length;
      return { ...user, score: gym + cardio, gym, cardio, subText: `${gym} Gym + ${cardio} Kardiyo` };
    }).sort((a, b) => b.score - a.score);
  };
  const getRank = (count: number) => RANKS.slice().reverse().find(r => count >= r.min) || RANKS[0];
  const toggleBettingMode = async () => { 
      const newVal = !currentUser.betting_enabled; 
      await supabase.from('users').update({ betting_enabled: newVal }).eq('id', currentUser.id); 
      setCurrentUser({ ...currentUser, betting_enabled: newVal }); 
  };
  const placeBet = async (duelId:string, targetId:string) => { 
     if(currentUser.coins < betAmount || betAmount<=0) {alert("Yetersiz"); return;}
     await supabase.from('bets').insert([{bettor_id:currentUser.id, duel_id:duelId, predicted_winner_id:targetId, amount:betAmount}]);
     const newB = currentUser.coins-betAmount;
     await supabase.from('users').update({coins:newB}).eq('id',currentUser.id);
     setCurrentUser({...currentUser, coins:newB}); alert("Oynandı"); setBetAmount(0);
  };
  const spinTheWheel = async () => { /* Ceza Kodu */ };
  const completePenalty = async () => { /* Ceza Kodu */ };

  if (loading) return <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center">Yükleniyor...</div>;

  return (
    <div className="min-h-screen bg-neutral-900 text-white pb-28 relative overflow-x-hidden font-sans">
      
      {/* SİMGE SÖZLÜĞÜ */}
      {showLegend && (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-4">
          <div className="bg-neutral-800 w-full max-w-sm rounded-2xl border border-neutral-600 p-6 relative">
             <button onClick={() => setShowLegend(false)} className="absolute top-4 right-4 text-neutral-400"><LogOut size={20}/></button>
             <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Info/> Simgeler Ne Anlama Geliyor?</h2>
             <div className="space-y-3 text-sm text-neutral-300">
               <p className="flex items-center gap-2"><Crown className="text-yellow-500" size={16}/> <b>Haftanın Kralı:</b> Geçen haftanın lideri.</p>
               <p className="flex items-center gap-2"><span className="text-2xl">🦁</span> <b>Ayın Aslanı:</b> Geçen ayın lideri (Özel Ödül).</p>
               <p className="flex items-center gap-2"><span className="text-red-500 font-bold">Rütbe:</span> Toplam spor sayısına göre değişir.</p>
               <p className="flex items-center gap-2">🔥 <b>Ateş:</b> Satın alınmış özel ikon.</p>
               <p className="flex items-center gap-2">🤖 <b>Iron Man:</b> Haftada 3 gün çift idman.</p>
               <p className="flex items-center gap-2">🎲 <b>Bahis:</b> Düellolara para yatırma.</p>
             </div>
          </div>
        </div>
      )}

      {/* MEGA MAĞAZA MODALI */}
      {showStore && (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-4">
          <div className="bg-neutral-800 w-full max-w-md rounded-3xl border border-yellow-600/50 p-6 relative max-h-[90vh] overflow-y-auto shadow-2xl">
            <button onClick={() => setShowStore(false)} className="absolute top-4 right-4 text-neutral-400 hover:text-white"><LogOut size={20}/></button>
            <h2 className="text-2xl font-black text-yellow-500 mb-1 flex items-center gap-2 italic tracking-tighter"><Store/> BLACK MARKET</h2>
            <p className="text-sm text-neutral-400 mb-6 border-b border-neutral-700 pb-2">Bakiyen: <span className="text-yellow-400 font-bold text-lg">{currentUser?.coins} C</span></p>
            
            <div className="space-y-6">
              
              {/* 1. KATEGORİ: HAFTALIK */}
              <div className="bg-neutral-900/50 p-3 rounded-2xl border border-neutral-700">
                 <div className="text-[10px] text-green-400 font-bold uppercase mb-2 flex items-center gap-1"><Zap size={10}/> Haftalık Emojiler (7 Gün)</div>
                 <div className="grid grid-cols-4 gap-2">
                    {['💰','💪','🍆','🦍'].map(emoji => (
                       <button key={emoji} onClick={() => buyItem('status_emoji', 50, emoji)} className="bg-neutral-800 p-2 rounded-xl flex flex-col items-center hover:bg-neutral-700 border border-neutral-700">
                          <span className="text-xl">{emoji}</span> <span className="text-[9px] mt-1 font-bold text-yellow-500">50C</span>
                       </button>
                    ))}
                 </div>
              </div>

              {/* 2. KATEGORİ: ÇERÇEVELER */}
              <div>
                <div className="text-[10px] text-blue-400 font-bold uppercase mb-2">Profil Çerçeveleri</div>
                <div className="space-y-2">
                  <button onClick={() => buyItem('gold_border', 200)} disabled={currentUser?.has_gold_border} className="w-full bg-neutral-800 p-3 rounded-xl flex justify-between items-center hover:bg-neutral-700 disabled:opacity-30 border border-yellow-600/30">
                     <span className="text-yellow-500 font-bold flex items-center gap-2">🖼️ Altın Çerçeve</span> <span className="text-white font-mono font-bold bg-neutral-900 px-2 py-0.5 rounded">200 C</span>
                  </button>
                  <button onClick={() => buyItem('neon_border', 350)} disabled={currentUser?.has_neon_border} className="w-full bg-neutral-800 p-3 rounded-xl flex justify-between items-center hover:bg-neutral-700 disabled:opacity-30 border border-blue-500 shadow-[0_0_5px_blue]">
                     <span className="text-blue-400 font-bold flex items-center gap-2">✨ Neon Çerçeve</span> <span className="text-white font-mono font-bold bg-neutral-900 px-2 py-0.5 rounded">350 C</span>
                  </button>
                  <button onClick={() => buyItem('diamond_border', 1000)} disabled={currentUser?.has_diamond_border} className="w-full bg-neutral-800 p-3 rounded-xl flex justify-between items-center hover:bg-neutral-700 disabled:opacity-30 border-2 border-cyan-400 shadow-[0_0_10px_cyan]">
                     <span className="text-cyan-300 font-black flex items-center gap-2">💎 ELMAS ÇERÇEVE</span> <span className="text-yellow-400 font-mono font-bold bg-neutral-900 px-2 py-0.5 rounded">1000 C</span>
                  </button>
                </div>
              </div>

              {/* 3. KATEGORİ: İSİM EFEKTLERİ */}
              <div>
                <div className="text-[10px] text-purple-400 font-bold uppercase mb-2">İsim Efektleri (Kalıcı)</div>
                <div className="space-y-2">
                   <button onClick={() => buyItem('name_effect', 500, 'rainbow')} className="w-full bg-neutral-800 p-3 rounded-xl flex justify-between items-center hover:bg-neutral-700">
                      <span className="bg-gradient-to-r from-red-400 to-blue-400 text-transparent bg-clip-text font-bold">🌈 Gökkuşağı</span> <span className="text-yellow-500 font-bold">500 C</span>
                   </button>
                   <button onClick={() => buyItem('name_effect', 400, 'ghost')} className="w-full bg-neutral-800 p-3 rounded-xl flex justify-between items-center hover:bg-neutral-700">
                      <span className="text-neutral-500 blur-[0.5px] font-bold">👻 Hayalet</span> <span className="text-yellow-500 font-bold">400 C</span>
                   </button>
                   <button onClick={() => buyItem('name_effect', 750, 'matrix')} className="w-full bg-black border border-green-500/50 p-3 rounded-xl flex justify-between items-center hover:bg-neutral-900">
                      <span className="text-green-500 font-mono font-bold">📟 MATRIX KODU</span> <span className="text-yellow-500 font-bold">750 C</span>
                   </button>
                   <button onClick={() => buyItem('name_effect', 600, 'glitch')} className="w-full bg-neutral-800 border border-red-500/50 p-3 rounded-xl flex justify-between items-center hover:bg-neutral-700">
                      <span className="text-red-500 font-mono tracking-widest font-bold uppercase">👾 B_O_Z_U_K</span> <span className="text-yellow-500 font-bold">600 C</span>
                   </button>
                </div>
              </div>

              {/* 4. KATEGORİ: PRESTİJ */}
              <div className="bg-gradient-to-br from-yellow-900/20 to-neutral-900 p-3 rounded-2xl border border-yellow-600/30">
                 <div className="text-[10px] text-yellow-500 font-bold uppercase mb-2 flex items-center gap-1"><Crown size={10}/> Krallar İçin</div>
                 
                 <button onClick={() => buyItem('perm_king_icon', 2500)} disabled={currentUser?.perm_king_icon} className="w-full mb-2 bg-neutral-800 p-3 rounded-xl flex justify-between items-center hover:bg-neutral-700 disabled:opacity-30">
                    <span className="text-yellow-200 font-bold flex items-center gap-2"><Crown className="text-yellow-500"/> Kalıcı Kral Tacı</span> <span className="text-yellow-500 font-black">2500 C</span>
                 </button>

                 <button onClick={() => buyItem('custom_title', 5000)} className="w-full bg-neutral-800 p-3 rounded-xl flex justify-between items-center hover:bg-neutral-700 border border-fuchsia-500/30">
                    <span className="text-fuchsia-300 font-bold flex items-center gap-2"><Tag/> Özel Ünvan Yaz</span> <span className="text-fuchsia-400 font-black">5000 C</span>
                 </button>
              </div>

              {/* TROLL */}
              <div className="bg-red-900/20 p-3 rounded-xl border border-red-900/50">
                <p className="text-xs text-red-300 mb-2 font-bold">😈 BİRİNİ TROLLE (24 Saat)</p>
                {allUsers.filter(u => u.id !== currentUser.id).map(u => (
                   <button key={u.id} onClick={() => buyItem('rename_troll', 500, u.id)} className="w-full mb-1 text-left text-xs bg-red-900/40 p-2 rounded hover:bg-red-900/60 flex justify-between">
                     <span>{u.username} → Tembel...</span> <span className="text-yellow-500 font-bold">500 C</span>
                   </button>
                ))}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ÜST BİLGİ */}
      <div className="bg-neutral-800 p-4 border-b border-neutral-700 shadow-md mb-4 sticky top-0 z-20">
         <div className="flex justify-between items-center text-xs text-neutral-400 mb-2">
            <span className="flex items-center gap-1"><Calendar size={12}/> {dateStr}</span>
            <div className="flex gap-2">
               <button onClick={() => setShowLegend(true)} className="p-1 bg-neutral-700 rounded-full hover:bg-neutral-600"><Info size={14}/></button>
               <button onClick={() => setShowStore(true)} className="flex items-center gap-1 bg-yellow-600/20 text-yellow-500 px-2 py-1 rounded-full border border-yellow-600/50 hover:bg-yellow-600/40 transition">
                 <ShoppingCart size={12}/> Mağaza
               </button>
               <button onClick={toggleBettingMode} className={`px-2 py-1 rounded-full flex items-center gap-1 transition ${currentUser?.betting_enabled ? 'bg-green-600 text-white' : 'bg-neutral-700 text-neutral-400'}`}>
                 <Zap size={12}/> <span className="text-[10px] font-bold">{currentUser?.betting_enabled ? 'BAHİS' : 'KAPALI'}</span>
               </button>
               <button onClick={() => {localStorage.removeItem('currentUser'); router.push('/')}} className="bg-neutral-700 p-1 rounded-full"><LogOut size={12}/></button>
            </div>
         </div>
         
         <div className="bg-neutral-900 border border-yellow-600/30 p-2 rounded-xl text-center mb-2 shadow-[0_0_10px_rgba(234,179,8,0.1)]">
            <p className="text-[10px] text-yellow-500 font-bold uppercase tracking-widest mb-1 flex justify-center items-center gap-1">
               <span className="text-lg">🦁</span> Ayın Şampiyonu Bitiş <span className="text-lg">🦁</span>
            </p>
            <p className="text-lg font-black text-white font-mono">{timeLeftMonth}</p>
         </div>

         <div className="grid grid-cols-2 gap-2 text-center">
            <div className="bg-black/30 rounded px-2 py-1">
               <span className="text-[10px] text-fuchsia-300 font-bold uppercase">{cycleStatus}</span>
            </div>
            <div className="bg-black/30 rounded px-2 py-1">
               <span className="text-[10px] text-neutral-300 font-mono">{timeLeftDuel}</span>
            </div>
         </div>
      </div>

      {/* PROFİL KARTI */}
      <div className="px-4 mb-6">
        <div className={`bg-gradient-to-br from-neutral-800 to-neutral-900 p-6 rounded-3xl shadow-xl relative overflow-hidden border border-neutral-700 
           ${currentUser?.has_neon_border ? 'border-2 border-blue-500 shadow-[0_0_15px_blue]' : ''}
           ${currentUser?.has_diamond_border ? 'border-2 border-cyan-400 shadow-[0_0_20px_cyan]' : ''}
           ${currentUser?.has_gold_border && !currentUser?.has_neon_border && !currentUser?.has_diamond_border ? 'border-2 border-yellow-500' : ''}
        `}>
           <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                {/* AVATAR GÖRÜNÜMÜ */}
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-yellow-500 bg-neutral-800 relative">
                    <img 
                      src={currentUser?.avatar_url || DEFAULT_AVATAR} 
                      alt="Avatar" 
                      className="w-full h-full object-cover object-top"
                      onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR }} 
                    />
                </div>
                <div>
                    <h1 className={getNameClasses(currentUser)}>
                    {currentUser?.username} 
                    {currentUser?.has_fire_icon && '🔥'}
                    {currentUser?.status_emoji && <span className="ml-1 text-lg">{currentUser.status_emoji}</span>}
                    {currentUser?.perm_king_icon && <Crown size={14} className="ml-1 text-yellow-500 inline"/>}
                    </h1>
                    
                    {currentUser?.custom_title && (
                    <p className="text-[10px] bg-fuchsia-900/50 text-fuchsia-200 px-2 py-0.5 rounded inline-block mt-1 border border-fuchsia-500/30">
                        {currentUser.custom_title}
                    </p>
                    )}
                    
                    <p className={`text-xs mt-1 font-bold ${getRank(currentUser?.total_activity_count || 0).color}`}>
                    {getRank(currentUser?.total_activity_count || 0).name}
                    </p>
                    <p className="text-[10px] text-neutral-400 mt-1">{currentUser?.group_id === 'server_1' ? '🌍 Server 1' : '🌑 Server 2'}</p>
                </div>
              </div>
              <div className="text-right">
                 <div className="flex flex-col items-end">
                    <span className="text-xs text-neutral-400">Streak</span>
                    <span className="text-xl font-bold text-white flex items-center gap-1">{currentUser?.initial_streak} <span className="text-xs font-normal">Hafta</span></span>
                 </div>
                 <p className="text-sm text-yellow-500 font-bold mt-2 bg-yellow-900/20 inline-block px-3 py-1 rounded-full border border-yellow-500/30">
                  💰 {currentUser?.coins || 0}
                </p>
              </div>
           </div>
        </div>
      </div>

      <div className="px-4 space-y-6">
        
        {/* BOSS KARTI */}
        {currentBoss && !currentBoss.is_defeated && (
           <div className="bg-red-900/20 border border-red-500/50 rounded-2xl p-4 relative overflow-hidden animate-in slide-in-from-top">
              <Ghost className="absolute -right-4 -top-4 w-24 h-24 text-red-500/10 rotate-12"/>
              <div className="flex justify-between items-center mb-2 relative z-10">
                 <h3 className="font-bold text-red-400 flex items-center gap-2"><Skull size={18}/> DÜNYA BOSS'U</h3>
                 <span className="text-[10px] bg-red-500/20 text-red-200 px-2 py-1 rounded">HP: {currentBoss.hp_current}</span>
              </div>
              <div className="w-full bg-neutral-800 rounded-full h-4 mb-2 overflow-hidden border border-neutral-700">
                 <div className="bg-gradient-to-r from-red-600 to-orange-600 h-full transition-all duration-500" style={{ width: `${(currentBoss.hp_current / currentBoss.hp_max) * 100}%` }}></div>
              </div>
              <p className="text-xs text-center text-red-300">Herkes saldırın! Gym: -100 HP, Kardiyo: -50 HP</p>
           </div>
        )}
        
        {currentBoss && currentBoss.is_defeated && (
           <div className="bg-green-900/20 border border-green-500/50 rounded-2xl p-4 text-center">
              <h3 className="font-bold text-green-400 flex items-center justify-center gap-2"><CheckCircle size={18}/> BOSS ÖLDÜ!</h3>
              <p className="text-xs text-green-300 mt-1">Zafer bizim! Herkese ödül dağıtıldı.</p>
           </div>
        )}

        {/* DÜELLO */}
        {!currentBoss && currentDuel && (
          <div className="bg-gradient-to-r from-violet-900/40 to-fuchsia-900/40 border border-fuchsia-500/30 rounded-2xl p-4">
             <div className="flex justify-between items-center mb-2">
               <h3 className="font-bold text-fuchsia-300 flex items-center gap-2"><Swords size={18}/> DÜELLO</h3>
               <span className="text-[10px] bg-fuchsia-500/20 px-2 py-0.5 rounded text-fuchsia-200">{currentDuel.theme}</span>
             </div>
             {currentDuel.opponent ? (
               <div className="flex items-center justify-between bg-black/20 p-3 rounded-xl mb-3">
                 <div className="text-center w-1/3">
                   <p className="font-bold text-blue-400">SEN</p>
                   {currentUser?.betting_enabled && <button onClick={() => placeBet(currentDuel.id, currentUser.id)} className="text-[10px] bg-blue-600 px-2 py-1 rounded mt-1 hover:bg-blue-500">Kendine Oyna</button>}
                 </div>
                 <span className="text-2xl font-black text-fuchsia-500">VS</span>
                 <div className="text-center w-1/3">
                   <p className="font-bold text-red-400">{currentDuel.opponent.username}</p>
                   {currentUser?.betting_enabled && <button onClick={() => placeBet(currentDuel.id, currentDuel.opponent.id)} className="text-[10px] bg-red-600 px-2 py-1 rounded mt-1 hover:bg-red-500">Ona Oyna</button>}
                 </div>
               </div>
             ) : (
                <div className="text-green-300 text-sm p-3 bg-green-900/20 rounded-xl">Şanslı Kişisin! Bay geçtin.</div>
             )}
             
             {currentUser?.betting_enabled && currentDuel.opponent && (
                <div className="flex gap-2 items-center justify-center">
                   <input type="number" placeholder="Miktar" value={betAmount} onChange={(e) => setBetAmount(Number(e.target.value))} className="w-20 bg-black/30 border border-neutral-600 rounded p-1 text-sm text-white"/>
                   <span className="text-xs text-neutral-400">Coin yatır</span>
                </div>
             )}
          </div>
        )}

        {/* SPOR BUTONLARI */}
        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => addActivity('gym')} className="bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 p-5 rounded-2xl flex flex-col items-center gap-2 active:scale-95 transition group">
            <Dumbbell className="w-8 h-8 text-blue-500 group-hover:scale-110 transition" /> 
            <span className="font-bold text-sm">Gym (+10C)</span>
            {currentBoss && !currentBoss.is_defeated && <span className="text-[10px] text-red-400 font-bold">-100 HP</span>}
          </button>
          <button onClick={() => addActivity('cardio')} className="bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 p-5 rounded-2xl flex flex-col items-center gap-2 active:scale-95 transition group">
            <Heart className="w-8 h-8 text-pink-500 group-hover:scale-110 transition" /> 
            <span className="font-bold text-sm">Kardiyo (+5C)</span>
            {currentBoss && !currentBoss.is_defeated && <span className="text-[10px] text-red-400 font-bold">-50 HP</span>}
          </button>
        </div>

        {/* LİDERLİK */}
        <div>
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-lg font-bold flex items-center gap-2"><span className="w-1 h-5 bg-yellow-500 rounded-full"></span> Sıralama</h3>
             <div className="flex bg-neutral-800 p-1 rounded-lg gap-1">
                <button onClick={() => setActiveTab('weekly')} className={`px-3 py-1 text-xs rounded-md ${activeTab === 'weekly' ? 'bg-neutral-700 font-bold text-white' : 'text-neutral-400'}`}>Hafta</button>
                <button onClick={() => setActiveTab('monthly')} className={`px-3 py-1 text-xs rounded-md ${activeTab === 'monthly' ? 'bg-neutral-700 font-bold text-white' : 'text-neutral-400'}`}>Ay</button>
                <button onClick={() => setActiveTab('streak')} className={`px-3 py-1 text-xs rounded-md flex items-center gap-1 ${activeTab === 'streak' ? 'bg-neutral-700 font-bold text-orange-400' : 'text-neutral-400'}`}><Flame size={10}/> Streak</button>
             </div>
          </div>

          <div className="space-y-3">
            {leaderboard.map((user, index) => (
              <div key={user.id} className={`flex items-center justify-between p-4 bg-neutral-800 rounded-xl border border-neutral-700/50 
                  ${user.has_gold_border ? 'border-yellow-500/50 border' : ''}
                  ${user.has_diamond_border ? 'border-cyan-400/50 border shadow-[0_0_10px_rgba(34,211,238,0.2)]' : ''}
                  ${index === 0 ? 'bg-gradient-to-r from-yellow-900/10 to-neutral-800' : ''}
              `}>
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 flex items-center justify-center font-bold rounded-lg overflow-hidden border ${index === 0 ? 'bg-yellow-500 text-black border-yellow-500' : 'bg-neutral-900 text-neutral-500 border-neutral-700'}`}>
                    {/* AVATAR KÜÇÜK */}
                    <img 
                      src={user.avatar_url || DEFAULT_AVATAR} 
                      className="w-full h-full object-cover object-top"
                      onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR }} 
                    />
                  </div>
                  <div>
                    <p className={getNameClasses(user)}>
                      {user.username} 
                      {user.has_fire_icon && '🔥'}
                      {user.status_emoji && <span className="ml-1">{user.status_emoji}</span>}
                      {user.perm_king_icon && <Crown size={12} className="ml-1 text-yellow-500 inline"/>}
                    </p>
                    <p className="text-[10px] text-neutral-400 mt-0.5">{user.subText}</p>
                    {user.custom_title && <p className="text-[9px] text-fuchsia-300 opacity-80">{user.custom_title}</p>}
                  </div>
                </div>
                {index === 0 && (
                   <div className="text-right">
                      {user.is_weekly_winner && <Crown size={16} className="text-yellow-500 inline"/>}
                      {user.is_monthly_winner && <span className="text-xl">🦁</span>}
                   </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* ALT MENÜ */}
        <div className="pt-6 grid grid-cols-2 gap-3">
           <button onClick={() => router.push('/notes')} className="bg-neutral-800 border border-neutral-700 text-neutral-300 py-4 rounded-xl font-semibold flex flex-col items-center justify-center gap-2 hover:bg-neutral-700">
            <CalendarDays size={20} className="text-blue-400" /> <span className="text-xs">Günlüğüm</span>
          </button>
          <button onClick={() => router.push('/feed')} className="bg-neutral-800 border border-neutral-700 text-neutral-300 py-4 rounded-xl font-semibold flex flex-col items-center justify-center gap-2 hover:bg-neutral-700">
            <MessageSquare size={20} className="text-green-400" /> <span className="text-xs">Soyunma Odası</span>
          </button>
        </div>
      </div>
    </div>
  );
}