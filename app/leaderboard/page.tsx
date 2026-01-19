"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { ArrowLeft, Trophy, TrendingUp, Calendar } from 'lucide-react';
import { getWeekStartStr, getMonthStartStr, getLastWeekStartStr, calculateRanking, getNameClasses, getRank } from '../../lib/utils';

export default function LeaderboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'weekly' | 'monthly' | 'streak'>('weekly');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      setCurrentUser(JSON.parse(stored));
      fetchData(JSON.parse(stored).id);
    }
  }, [activeTab]);

  const fetchData = async (userId: string) => {
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (user) {
      setCurrentUser(user);

      // Grup kullanıcılarını getir
      const { data: usersData } = await supabase
        .from('users')
        .select('*')
        .eq('group_id', user.group_id || 'server_1');

      setAllUsers(usersData || []);

      // Tüm etkinlikleri getir
      const { data: logsData } = await supabase
        .from('activity_logs')
        .select('*');

      setLogs(logsData || []);

      // Sıralamayı hesapla
      let stats = [];
      const thisWeekStart = getWeekStartStr();
      const thisMonthStart = getMonthStartStr();

      if (activeTab === 'weekly') {
        stats = calculateRanking(usersData || [], logsData || [], thisWeekStart);
      } else if (activeTab === 'monthly') {
        stats = calculateRanking(usersData || [], logsData || [], thisMonthStart);
      } else {
        // Streak - tie handling ile
        const sorted = (usersData || [])
          .map((u) => ({
            ...u,
            score: u.initial_streak,
            subText: `${u.initial_streak} Hafta Streak`,
          }))
          .sort((a, b) => b.score - a.score);
        
        stats = sorted.map((u, i) => {
          let rank = 1;
          for (let j = i - 1; j >= 0; j--) {
            if (sorted[j].score > u.score) {
              rank = j + 2;
              break;
            }
          }
          return { ...u, rank };
        });
      }

      setLeaderboard(stats);
    }

    setLoading(false);
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
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => router.back()}
            className="p-2 bg-neutral-700 rounded-full hover:bg-neutral-600 transition"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-300" />
          </button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Trophy className="text-yellow-500" /> Sıralama
            </h1>
          </div>
        </div>

        {/* Tablar */}
        <div className="flex bg-neutral-700 p-1 rounded-lg gap-1">
          <button
            onClick={() => setActiveTab('weekly')}
            className={`px-4 py-2 text-xs rounded-md font-bold transition ${
              activeTab === 'weekly'
                ? 'bg-neutral-600 text-white'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Bu Hafta
          </button>
          <button
            onClick={() => setActiveTab('monthly')}
            className={`px-4 py-2 text-xs rounded-md font-bold transition ${
              activeTab === 'monthly'
                ? 'bg-neutral-600 text-white'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Bu Ay
          </button>
          <button
            onClick={() => setActiveTab('streak')}
            className={`px-4 py-2 text-xs rounded-md font-bold transition ${
              activeTab === 'streak'
                ? 'bg-neutral-600 text-white'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Streak
          </button>
        </div>
      </div>

      {/* Sıralama */}
      <div className="px-4 space-y-3">
        {leaderboard.length === 0 ? (
          <div className="text-center text-neutral-500 py-10">
            <Trophy size={40} className="mx-auto opacity-20 mb-3" />
            <p>Henüz sıralama yok.</p>
          </div>
        ) : (
          leaderboard.map((user, index) => (
            <div
              key={user.id}
              className={`flex items-center justify-between p-4 rounded-xl border transition ${
                index === 0
                  ? 'bg-gradient-to-r from-yellow-900/30 to-neutral-800 border-yellow-500/50'
                  : 'bg-neutral-800 border-neutral-700/50'
              }`}
            >
              {/* Sol taraf */}
              <div className="flex items-center gap-4">
                {/* Sıra numarası */}
                <div
                  className={`w-10 h-10 flex items-center justify-center font-bold rounded-lg ${
                    index === 0
                      ? 'bg-yellow-500 text-black'
                      : index === 1
                      ? 'bg-gray-400 text-black'
                      : index === 2
                      ? 'bg-orange-600 text-white'
                      : 'bg-neutral-900 text-neutral-500'
                  }`}
                >
                  {index + 1}
                </div>

                {/* Avatar + İsim */}
                <div>
                  <p className={getNameClasses(user)}>
                    {user.perm_king_icon && '👑 '}
                    {user.username} {user.status_emoji}
                  </p>
                  <p className="text-[10px] text-neutral-400">{user.subText}</p>
                  <p className={`text-[10px] mt-0.5 ${getRank(user.total_activity_count || 0).color}`}>
                    {getRank(user.total_activity_count || 0).name}
                  </p>
                </div>
              </div>

              {/* Sağ taraf */}
              <div className="text-right">
                {index === 0 && <Trophy size={20} className="text-yellow-500 mb-1" />}
                <p className="font-black text-lg text-yellow-400">{user.score}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
