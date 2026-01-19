import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split('T')[0];
}

function getWeekNumber(d: Date): number {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Haftalık otomasyon: Pazartesi kontrolleri
 */
export async function POST(req: NextRequest) {
  try {
    const { groupId } = await req.json();

    if (!groupId) {
      return NextResponse.json({ error: 'Eksik parametreler' }, { status: 400 });
    }

    const today = new Date();
    const thisWeekStart = getWeekStart();
    const lastWeekStart = getWeekStart(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000));

    // 1. Grup kullanıcılarını al
    const { data: users } = await supabase
      .from('users')
      .select('*')
      .eq('group_id', groupId);

    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });
    }

    // 2. Geçen hafta etkinliklerini al
    const { data: logs } = await supabase
      .from('activity_logs')
      .select('*')
      .gte('activity_date', lastWeekStart)
      .lt('activity_date', thisWeekStart);

    // 3. Her kullanıcının streak'i kontrol et
    for (const user of users) {
      if (user.last_weekly_process_date !== thisWeekStart) {
        const userLogs = (logs || []).filter(
          (l: any) => l.user_id === user.id && l.activity_type === 'gym'
        );

        let newStreak = user.initial_streak;
        if (userLogs.length >= 4) {
          newStreak += 1;
        } else {
          // Streak sıfırla eğer hedefi tutturmadıysa
          newStreak = 0;
        }

        // Streak güncellemesi
        await supabase
          .from('users')
          .update({ initial_streak: newStreak, last_weekly_process_date: thisWeekStart })
          .eq('id', user.id);
      }
    }

    // 4. Boss resetle (yeni hafta)
    const weekNum = getWeekNumber(today);
    const cycle = weekNum % 4;

    if (cycle === 2 || cycle === 0) {
      // Boss haftası
      const totalHP = users.length * 600;

      await supabase.from('raid_bosses').insert([
        {
          week_start_date: thisWeekStart,
          group_id: groupId,
          boss_name: cycle === 0 ? 'FINAL BOSS 💀' : 'DEV GOLEM 👹',
          hp_max: totalHP,
          hp_current: totalHP,
          is_defeated: false,
        },
      ]);
    }

    // 5. Kral atar
    if (!users[0]) {
      return NextResponse.json({ error: 'Lider bulunamadı' }, { status: 404 });
    }

    const kingExists = await supabase
      .from('kings')
      .select('id')
      .eq('week_start_date', thisWeekStart)
      .eq('group_id', groupId)
      .single();

    if (!kingExists.data) {
      await supabase.from('kings').insert([
        {
          user_id: users[0].id,
          week_start_date: thisWeekStart,
          group_id: groupId,
          decree_text: 'Bu hafta mazeret yok!',
        },
      ]);
    }

    // 6. Sistem ödülü kaydet (spam önle)
    const rewardKey = `weekly_process_${groupId}_${thisWeekStart}`;
    await supabase.from('system_rewards').insert([{ reward_key: rewardKey }]);

    return NextResponse.json({
      success: true,
      message: 'Haftalık otomasyon tamamlandı',
    });
  } catch (error) {
    console.error('Weekly automation error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

/**
 * Haftalık kontrol bilgisini getir
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get('groupId');

    if (!groupId) {
      return NextResponse.json({ error: 'Eksik parametreler' }, { status: 400 });
    }

    const thisWeekStart = getWeekStart();

    // Haftalık işlem yapıldı mı?
    const { data: processed } = await supabase
      .from('system_rewards')
      .select('id')
      .eq('reward_key', `weekly_process_${groupId}_${thisWeekStart}`)
      .single();

    return NextResponse.json({
      weekStart: thisWeekStart,
      isProcessed: !!processed,
    });
  } catch (error) {
    console.error('Weekly GET error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
