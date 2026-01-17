"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { ArrowLeft, Dumbbell, Heart, Calendar, MessageSquare, Quote, Crown, Edit2 } from 'lucide-react';

export default function FeedPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Kraliyet Verileri
  const [kingData, setKingData] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isKing, setIsKing] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('currentUser');
    if (stored) setCurrentUser(JSON.parse(stored));
    fetchData();
  }, []);

  const fetchData = async () => {
    const today = new Date();
    // Haftanın başını bul
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); 
    const monday = new Date(today.setDate(diff));
    monday.setHours(0,0,0,0);
    const weekStartStr = monday.toISOString().split('T')[0];

    // 1. KRAL VE FERMANI ÇEK
    const { data: king } = await supabase.from('kings').select('*').eq('week_start_date', weekStartStr).single();
    if (king) {
      setKingData(king);
      const stored = localStorage.getItem('currentUser');
      if (stored && JSON.parse(stored).id === king.user_id) {
        setIsKing(true);
      }
    }

    // 2. AKIŞI ÇEK
    const { data: logs } = await supabase
      .from('activity_logs')
      .select('*')
      .not('note', 'is', null)
      .neq('note', '')
      .order('activity_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50);

    const { data: users } = await supabase.from('users').select('id, username');

    if (logs && users) {
      const feedData = logs.map(log => {
        const user = users.find(u => u.id === log.user_id);
        return { ...log, username: user ? user.username : 'Gizli Sporcu' };
      });
      setPosts(feedData);
    }
    setLoading(false);
  };

  const updateDecree = async () => {
    const newDecree = prompt("Ey Kral! Halka ne söylemek istersin?", kingData.decree_text);
    if (newDecree && newDecree !== kingData.decree_text) {
      const { error } = await supabase.from('kings').update({ decree_text: newDecree }).eq('id', kingData.id);
      if (!error) {
        setKingData({ ...kingData, decree_text: newDecree });
      }
    }
  };

  if (loading) return <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center">Yükleniyor...</div>;

  return (
    <div className="min-h-screen bg-neutral-900 text-white pb-10">
      
      <div className="bg-neutral-800 p-6 rounded-b-3xl border-b border-neutral-700 shadow-xl mb-6 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 bg-neutral-700 rounded-full hover:bg-neutral-600 transition">
            <ArrowLeft className="w-5 h-5 text-neutral-300" />
          </button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2"><MessageSquare className="text-blue-500" /> Soyunma Odası</h1>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-6">
        
        {/* KRALIN FERMANI KUTUSU */}
        {kingData && (
          <div className="bg-gradient-to-r from-yellow-900/40 to-yellow-800/40 border border-yellow-500/50 rounded-2xl p-5 relative overflow-hidden shadow-[0_0_15px_rgba(234,179,8,0.2)]">
            <Crown className="absolute -right-4 -top-4 text-yellow-500/10 w-32 h-32 rotate-12"/>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-yellow-500 font-bold flex items-center gap-2"><Crown size={18}/> HAFTANIN KRALINDAN DUYURU</h3>
              {isKing && (
                <button onClick={updateDecree} className="bg-yellow-600 text-white p-1.5 rounded-lg hover:bg-yellow-500 transition"><Edit2 size={14}/></button>
              )}
            </div>
            <p className="text-yellow-100 text-lg font-medium italic font-serif leading-relaxed">"{kingData.decree_text}"</p>
          </div>
        )}

        {posts.length === 0 ? (
          <div className="text-center text-neutral-500 py-10 flex flex-col items-center gap-3">
             <MessageSquare size={40} className="opacity-20"/>
             <p>Henüz kimse günlüğüne bir şey yazmamış.</p>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="bg-neutral-800/60 border border-neutral-700/50 rounded-2xl p-5 shadow-lg relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-1 h-full ${post.activity_type === 'gym' ? 'bg-blue-600' : post.activity_type === 'cardio' ? 'bg-pink-600' : 'bg-neutral-500'}`}></div>
              <div className="flex justify-between items-start mb-3 pl-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-neutral-700 rounded-full flex items-center justify-center text-neutral-300 font-bold border border-neutral-600">
                    {post.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-neutral-200 text-sm">{post.username}</h3>
                    <div className="flex items-center gap-2 text-[10px] text-neutral-500">
                       <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(post.activity_date).toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric' })}</span>
                       <span>•</span>
                       <span className={`flex items-center gap-1 uppercase font-bold ${post.activity_type === 'gym' ? 'text-blue-400' : 'text-pink-400'}`}>{post.activity_type}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="pl-3 mt-2">
                <div className="bg-neutral-900/40 p-3 rounded-r-xl rounded-bl-xl text-sm text-neutral-300 italic leading-relaxed border border-neutral-800 flex gap-2">
                  <Quote size={16} className="text-neutral-600 flex-shrink-0" />
                  <span>{post.note}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}