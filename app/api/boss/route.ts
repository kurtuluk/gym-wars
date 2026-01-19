import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Boss'a hasar ekler ve ölen boss için ödül dağıtır
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, damage, groupId, weekStart } = await req.json();

    if (!userId || !damage || !groupId || !weekStart) {
      return NextResponse.json({ error: 'Eksik parametreler' }, { status: 400 });
    }

    // Boss'u bul
    const { data: boss } = await supabase
      .from('raid_bosses')
      .select('*')
      .eq('week_start_date', weekStart)
      .eq('group_id', groupId)
      .single();

    if (!boss) {
      return NextResponse.json({ error: 'Boss bulunamadı' }, { status: 404 });
    }

    if (boss.is_defeated) {
      return NextResponse.json({ error: 'Boss zaten öldürüldü' }, { status: 400 });
    }

    // Hasarı uygula
    const newHP = Math.max(0, boss.hp_current - damage);
    const isDefeated = newHP === 0;

    // Boss'u güncelle
    const { error: bossError } = await supabase
      .from('raid_bosses')
      .update({ hp_current: newHP, is_defeated: isDefeated })
      .eq('id', boss.id);

    if (bossError) throw bossError;

    // Hasar logu
    const { error: logError } = await supabase.from('boss_attacks').insert([
      { raid_id: boss.id, user_id: userId, damage },
    ]);

    if (logError) throw logError;

    let rewardCoins = 0;

    // Boss ölü mü?
    if (isDefeated) {
      rewardCoins = 100;

      // Tüm gruba ödül ver
      const { data: users } = await supabase
        .from('users')
        .select('id, coins')
        .eq('group_id', groupId);

      if (users) {
        const updates = users.map((user: any) => ({
          id: user.id,
          coins: (user.coins || 0) + rewardCoins,
        }));

        for (const update of updates) {
          await supabase
            .from('users')
            .update({ coins: update.coins })
            .eq('id', update.id);
        }
      }
    }

    return NextResponse.json({
      success: true,
      newHP,
      isDefeated,
      rewardCoins: isDefeated ? rewardCoins : 0,
    });
  } catch (error) {
    console.error('Boss API error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

/**
 * Boss bilgisini getir
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get('groupId');
    const weekStart = searchParams.get('weekStart');

    if (!groupId || !weekStart) {
      return NextResponse.json({ error: 'Eksik parametreler' }, { status: 400 });
    }

    const { data: boss, error } = await supabase
      .from('raid_bosses')
      .select('*')
      .eq('week_start_date', weekStart)
      .eq('group_id', groupId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return NextResponse.json({ boss: boss || null });
  } catch (error) {
    console.error('Boss GET error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
