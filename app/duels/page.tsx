"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { ArrowLeft, Swords, Trophy, Target, Flame } from 'lucide-react';

export default function DuelsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [duels, setDuels] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLeader, setIsLeader] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      setCurrentUser(JSON.parse(stored));
      fetchData(JSON.parse(stored).id);
    }
  }, []);

  const fetchData = async (userId: string) => {
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (user) {
      setCurrentUser(user);

      // Tüm kullanıcıları getir (lider tespiti için)
      const { data: usersData } = await supabase
        .from('users')
        .select('*')
        .eq('group_id', user.group_id || 'server_1')
        .order('created_at', { ascending: true });

      setAllUsers(usersData || []);
      setIsLeader(usersData && usersData[0]?.id === userId);

      // Tüm düelloları getir
      const { data: duelsData } = await supabase
        .from('duels')
        .select('*')
        .eq('group_id', user.group_id || 'server_1')
        .order('created_at', { ascending: false });

      if (duelsData) {
        const enriched = duelsData.map((d: any) => ({
          ...d,
          p1: usersData?.find((u: any) => u.id === d.player1_id),
          p2: usersData?.find((u: any) => u.id === d.player2_id),
          winner: usersData?.find((u: any) => u.id === d.winner_id),
        }));
        setDuels(enriched);
      }
    }

    setLoading(false);
  };

  const recordWinner = async (duelId: string, winnerId: string) => {
    if (!isLeader) {
      alert('Sadece lider sonuç kaydedebilir!');
      return;
    }

    if (!confirm('Sonucu onaylıyor musun?')) return;

    try {
      const res = await fetch('/api/duel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duelId, winnerId }),
      });

      if (res.ok) {
        alert('Sonuç kaydedildi!');
        fetchData(currentUser.id);
      }
    } catch (error) {
      console.error('Duel result error:', error);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center">
        Yükleniyor...
      </div>
    );

  return (
    <div className="min-h-screen bg-neutral-900 text-white pb-10">
      {/* Header */}
      <div className="bg-neutral-800 p-6 rounded-b-3xl border-b border-neutral-700 shadow-xl mb-6 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 bg-neutral-700 rounded-full hover:bg-neutral-600 transition"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-300" />
          </button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Swords className="text-fuchsia-500" /> Düello Geçmişi
            </h1>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {duels.length === 0 ? (
          <div className="text-center text-neutral-500 py-10">
            <Swords size={40} className="mx-auto opacity-20 mb-3" />
            <p>Henüz düello yok.</p>
          </div>
        ) : (
          duels.map((duel) => (
            <div
              key={duel.id}
              className={`rounded-2xl p-4 border transition ${
                duel.winner_id
                  ? 'bg-green-900/20 border-green-500/30'
                  : 'bg-fuchsia-900/20 border-fuchsia-500/30'
              }`}
            >
              {/* Tema */}
              <p className="text-[10px] text-center text-neutral-400 uppercase tracking-widest mb-3">
                {duel.theme}
              </p>

              {/* OYUNCULAR */}
              <div className="flex items-center justify-between mb-4">
                {/* Oyuncu 1 */}
                <div className="flex-1 text-center">
                  <p className="font-bold text-blue-400 mb-2">{duel.p1?.username || 'Unknown'}</p>
                  <button
                    onClick={() => recordWinner(duel.id, duel.p1?.id)}
                    disabled={!!duel.winner_id || !isLeader}
                    className={`w-full py-2 rounded-lg text-xs font-bold transition ${
                      duel.winner_id === duel.p1?.id
                        ? 'bg-green-600 text-white'
                        : duel.winner_id
                        ? 'bg-neutral-700 text-neutral-500'
                        : isLeader
                        ? 'bg-blue-900/40 text-blue-300 hover:bg-blue-900/60'
                        : 'bg-neutral-700 text-neutral-500'
                    }`}
                  >
                    {duel.winner_id === duel.p1?.id ? (
                      <>
                        <Trophy size={12} className="inline mr-1" /> KAZANDI
                      </>
                    ) : (
                      'Kazanan'
                    )}
                  </button>
                </div>

                {/* VS */}
                <div className="px-4 text-center">
                  <span className="text-xl font-black text-fuchsia-500">VS</span>
                </div>

                {/* Oyuncu 2 */}
                <div className="flex-1 text-center">
                  <p className="font-bold text-red-400 mb-2">
                    {duel.p2?.username || 'BAY (Şanslı Gün)'}
                  </p>
                  <button
                    onClick={() => duel.p2 && recordWinner(duel.id, duel.p2.id)}
                    disabled={!!duel.winner_id || !isLeader || !duel.p2}
                    className={`w-full py-2 rounded-lg text-xs font-bold transition ${
                      duel.winner_id === duel.p2?.id
                        ? 'bg-green-600 text-white'
                        : duel.winner_id
                        ? 'bg-neutral-700 text-neutral-500'
                        : isLeader && duel.p2
                        ? 'bg-red-900/40 text-red-300 hover:bg-red-900/60'
                        : 'bg-neutral-700 text-neutral-500'
                    }`}
                  >
                    {duel.winner_id === duel.p2?.id ? (
                      <>
                        <Trophy size={12} className="inline mr-1" /> KAZANDI
                      </>
                    ) : (
                      'Kazanan'
                    )}
                  </button>
                </div>
              </div>

              {/* SONUÇ */}
              {duel.winner_id && duel.winner && (
                <div className="text-center pt-3 border-t border-green-500/30">
                  <p className="text-xs text-green-300 font-bold flex items-center justify-center gap-1">
                    <Flame size={12} />
                    {duel.winner.username} kazandı!
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
