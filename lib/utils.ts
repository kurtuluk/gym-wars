// lib/utils.ts

/**
 * Ortak zaman fonksiyonları
 */

export const getWeekStart = (date: Date = new Date()): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
};

export const getWeekStartStr = (date: Date = new Date()): string => {
  return getWeekStart(date).toISOString().split('T')[0];
};

export const getMonthStart = (date: Date = new Date()): Date => {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), 1);
};

export const getMonthStartStr = (date: Date = new Date()): string => {
  return getMonthStart(date).toISOString().split('T')[0];
};

export const getLastWeekStart = (date: Date = new Date()): Date => {
  const thisWeek = getWeekStart(date);
  const lastWeek = new Date(thisWeek);
  lastWeek.setDate(lastWeek.getDate() - 7);
  return lastWeek;
};

export const getLastWeekStartStr = (date: Date = new Date()): string => {
  return getLastWeekStart(date).toISOString().split('T')[0];
};

export const getWeekNumber = (d: Date): number => {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};

export const getCurrentCycle = (): number => {
  const weekNum = getWeekNumber(new Date());
  return weekNum % 4; // 0, 1, 2, 3
};

/**
 * Cycle döngüsü (4 hafta)
 * Modulo 0: DUEL WEEK (Bu hafta, Pazartesi başlangıç)
 * Modulo 1: HAZIRLIK
 * Modulo 2: HAZIRLIK
 * Modulo 3: BOSS WEEK (Ayda 1 kez)
 */
export const CYCLE_TYPES = {
  0: { id: 0, title: "DÜELLO", icon: "⚔️", desc: "Büyük Kapışma Haftası" },
  1: { id: 1, title: "HAZIRLIK", icon: "☮️", desc: "Dinlenme ve Antrenman" },
  2: { id: 2, title: "HAZIRLIK", icon: "💪", desc: "Boss Öncesi Güçlenme" },
  3: { id: 3, title: "BOSS", icon: "👹", desc: "Ayın Tek Boss Savaşı" },
};

/**
 * Rütbe sistemi
 */
export const RANKS = [
  { min: 0, name: "Çaylak 🐣", color: "text-neutral-400" },
  { min: 10, name: "Amatör 🧢", color: "text-blue-400" },
  { min: 50, name: "Gym Rat 🐀", color: "text-purple-400" },
  { min: 100, name: "Canavar 🦍", color: "text-red-500 font-bold" },
  { min: 250, name: "Yarı Tanrı ⚡", color: "text-yellow-400 font-black animate-pulse" },
  { min: 500, name: "GIGACHAD 🗿", color: "text-fuchsia-500 font-black" },
];

export const getRank = (count: number) => {
  return RANKS.slice().reverse().find((r) => count >= r.min) || RANKS[0];
};

/**
 * Hesap fonksiyonları
 */
export const calculateActivityScore = (
  logs: any[],
  userId: string,
  startDate: string
): { gym: number; cardio: number; total: number } => {
  const userLogs = logs.filter(
    (l: any) => l.user_id === userId && l.activity_date >= startDate
  );
  const gym = userLogs.filter((l: any) => l.activity_type === 'gym').length;
  const cardio = userLogs.filter((l: any) => l.activity_type === 'cardio').length;
  return { gym, cardio, total: gym + cardio };
};

/**
 * Sıralama hesapla (Eşitlik Bozulmadan - Tie Handling)
 * Aynı puana sahip olanlar aynı sırayı alır.
 */
export const calculateRanking = (users: any[], logs: any[], startDate: string) => {
  // 1. Puanları Hesapla
  const withScores = users.map((user) => {
    const scores = calculateActivityScore(logs, user.id, startDate);
    return {
      ...user,
      score: scores.total,
      gym: scores.gym,
      cardio: scores.cardio,
      subText: `${scores.gym} Gym + ${scores.cardio} Kardiyo`,
    };
  });

  // 2. Sırala
  const sorted = withScores.sort((a, b) => b.score - a.score);

  // 3. Rank Ata (Eşitlik durumunu gözeterek)
  return sorted.map((user, index) => {
    let rank = 1;
    if (index > 0) {
      // Eğer puan bir öncekiyle aynıysa, onun rank'ını al
      if (user.score === sorted[index - 1].score) {
        rank = sorted[index - 1].rank;
      } else {
        // Değilse normal sırasını al (index + 1)
        rank = index + 1;
      }
    }
    user.rank = rank;
    return user;
  });
};

/**
 * İsim efektlerini CSS'e çevir
 */
export const getNameClasses = (user: any): string => {
  let classes = `font-bold text-sm flex items-center gap-2 ${user.name_color || 'text-white'}`;
  if (user.name_effect === 'rainbow')
    classes +=
      ' bg-gradient-to-r from-red-500 via-green-500 to-blue-500 text-transparent bg-clip-text animate-pulse';
  if (user.name_effect === 'ghost')
    classes += ' opacity-50 blur-[0.5px]';
  if (user.name_effect === 'glitch')
    classes += ' text-red-500 font-mono tracking-widest uppercase';
  if (user.name_effect === 'matrix')
    classes += ' text-green-500 font-mono';
  return classes;
};

/**
 * Tarih formatlama
 */
export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('tr-TR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Kısa tarih
 */
export const formatShortDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('tr-TR', {
    weekday: 'short',
    day: 'numeric',
  });
};