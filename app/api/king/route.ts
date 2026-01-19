import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Kral atar ve fermani başlatır
 */
export async function POST(req: NextRequest) {
  try {
    const { groupId, weekStart } = await req.json();

    if (!groupId || !weekStart) {
      return NextResponse.json({ error: 'Eksik parametreler' }, { status: 400 });
    }

    // Grubun ilk kullanıcısı (Server Lideri)
    const { data: users } = await supabase
      .from('users')
      .select('id')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true })
      .limit(1);

    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });
    }

    const kingId = users[0].id;

    // Kral varsa sil, yeni atar
    await supabase
      .from('kings')
      .delete()
      .eq('week_start_date', weekStart)
      .eq('group_id', groupId);

    // Yeni kral
    const { error } = await supabase.from('kings').insert([
      {
        user_id: kingId,
        week_start_date: weekStart,
        group_id: groupId,
        decree_text: 'Bu hafta mazeret yok!',
      },
    ]);

    if (error) throw error;

    return NextResponse.json({ success: true, kingId });
  } catch (error) {
    console.error('King API error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

/**
 * Kral bilgisini getir
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get('groupId');
    const weekStart = searchParams.get('weekStart');

    if (!groupId || !weekStart) {
      return NextResponse.json({ error: 'Eksik parametreler' }, { status: 400 });
    }

    const { data: king, error } = await supabase
      .from('kings')
      .select('*')
      .eq('group_id', groupId)
      .eq('week_start_date', weekStart)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return NextResponse.json({ king: king || null });
  } catch (error) {
    console.error('King GET error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
