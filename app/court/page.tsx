"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { ArrowLeft, Gavel, ThumbsUp, ThumbsDown, Crown, Zap, AlertTriangle } from 'lucide-react';

export default function CourtPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [kingData, setKingData] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [votes, setVotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isKing, setIsKing] = useState(false);
  const [penalties, setPenalties] = useState<any[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      setCurrentUser(JSON.parse(stored));
      fetchData(JSON.parse(stored).id);
    }
  }, []);

  const fetchData = async (userId: string) => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    const weekStartStr = monday.toISOString().split('T')[0];

    // Kullanıcı bilgisi
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (user) {
      setCurrentUser(user);
    }

    // Tüm kullanıcılar
    const { data: usersData } = await supabase
      .from('users')
      .select('*')
      .eq('group_id', user?.group_id || 'server_1')
      .order('created_at', { ascending: true });

    setAllUsers(usersData || []);

    // Kral verisi
    const { data: kingRaw } = await supabase
      .from('kings')
      .select('*')
      .eq('week_start_date', weekStartStr)
      .single();

    if (kingRaw) {
      setKingData(kingRaw);
      setIsKing(kingRaw.user_id === userId);
    }

    // Oyları getir
    const { data: votesData } = await supabase
      .from('votes')
      .select('*')
      .eq('week_start_date', weekStartStr)
      .order('vote_value', { ascending: false });

    setVotes(votesData || []);

    // Cezaları getir
    const { data: penaltiesData } = await supabase
      .from('penalties')
      .select('*')
      .eq('week_start_date', weekStartStr);

    setPenalties(penaltiesData || []);

    setLoading(false);
  };

  const vote = async (targetId: string, voteType: 'hero' | 'troll') => {
    if (!currentUser) return;

    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    const weekStartStr = monday.toISOString().split('T')[0];

    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voterId: currentUser.id,
          targetUserId: targetId,
          weekStart: weekStartStr,
          voteType,
        }),
      });

      if (res.ok) {
        alert('Oyunuz kaydedildi!');
        fetchData(currentUser.id);
      } else {
        alert('Hata oluştu');
      }
    } catch (error) {
      console.error('Vote error:', error);
    }
  };

  const addPenalty = async (targetId: string) => {
    if (!isKing) {
      alert('Sadece kral ceza verebilir!');
      return;
    }

    const penaltyText = prompt('Ceza metni gir:');
    if (!penaltyText) return;

    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    const weekStartStr = monday.toISOString().split('T')[0];

    try {
      const res = await fetch('/api/penalty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: targetId,
          penaltyText,
          weekStart: weekStartStr,
        }),
      });

      if (res.ok) {
        alert('Ceza verildi!');
        fetchData(currentUser.id);
      }
    } catch (error) {
      console.error('Penalty error:', error);
    }
  };

  const getVoteCount = (userId: string, voteType: string) => {
    return votes.filter((v) => v.target_user_id === userId && v.vote_type === voteType).length;
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
              <Gavel className="text-red-500" /> Mahkeme & Oylama
            </h1>
            {isKing && (
              <p className="text-xs text-yellow-500 mt-1">👑 Kral olarak ceza verebilirsin</p>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 space-y-6">
        {/* KRAL VERİSİ */}
        {kingData && (
          <div className="bg-gradient-to-r from-yellow-900/40 to-yellow-800/40 border border-yellow-500/50 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-yellow-500 font-bold flex items-center gap-2">
                <Crown size={18} /> HAFTANIN KRALI
              </h3>
            </div>
            <p className="text-yellow-100 text-sm mb-2">
              {allUsers.find((u) => u.id === kingData.user_id)?.username}
            </p>
            <p className="text-yellow-100 text-lg font-medium italic">"{kingData.decree_text}"</p>
          </div>
        )}

        {/* KULLANICI OYLAMASI */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Zap className="text-purple-500" /> OYLAMALAR
          </h2>

          {allUsers.map((user) => {
            const heroVotes = getVoteCount(user.id, 'hero');
            const trollVotes = getVoteCount(user.id, 'troll');

            return (
              <div
                key={user.id}
                className="bg-neutral-800 border border-neutral-700 rounded-2xl p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-neutral-700 rounded-full flex items-center justify-center font-bold">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-bold text-neutral-200">{user.username}</span>
                  </div>
                </div>

                {/* OY BUTONLARI */}
                <div className="flex gap-3 mb-3">
                  <button
                    onClick={() => vote(user.id, 'hero')}
                    className="flex-1 bg-green-900/20 text-green-400 border border-green-500/30 hover:bg-green-900/40 py-2 rounded-lg flex items-center justify-center gap-2 transition text-sm font-bold"
                  >
                    <ThumbsUp size={14} /> Kahraman
                  </button>
                  <button
                    onClick={() => vote(user.id, 'troll')}
                    className="flex-1 bg-red-900/20 text-red-400 border border-red-500/30 hover:bg-red-900/40 py-2 rounded-lg flex items-center justify-center gap-2 transition text-sm font-bold"
                  >
                    <ThumbsDown size={14} /> Troll
                  </button>
                </div>

                {/* OY SAYILARI */}
                <div className="flex gap-2 text-xs mb-2">
                  <div className="bg-green-900/20 px-2 py-1 rounded text-green-300">
                    👍 {heroVotes}
                  </div>
                  <div className="bg-red-900/20 px-2 py-1 rounded text-red-300">
                    👎 {trollVotes}
                  </div>
                </div>

                {/* KRAL CEZA VER BUTONU */}
                {isKing && user.id !== currentUser?.id && (
                  <button
                    onClick={() => addPenalty(user.id)}
                    className="w-full bg-red-900/30 text-red-300 border border-red-500/30 hover:bg-red-900/50 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition"
                  >
                    <AlertTriangle size={12} /> Ceza Ver
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* CEZALAR */}
        {penalties.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold flex items-center gap-2 text-red-500">
              <AlertTriangle /> HAFTA CEZALARı
            </h2>
            {penalties.map((penalty) => (
              <div
                key={penalty.id}
                className="bg-red-900/20 border border-red-500/30 rounded-xl p-3"
              >
                <p className="text-xs text-red-200 font-bold mb-1">
                  {allUsers.find((u) => u.id === penalty.user_id)?.username}
                </p>
                <p className="text-sm text-red-300">{penalty.penalty_text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
