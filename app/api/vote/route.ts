import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Oylama ekle
 */
export async function POST(req: NextRequest) {
  try {
    const { voterId, targetUserId, weekStart, voteType } = await req.json();

    if (!voterId || !targetUserId || !weekStart || !voteType) {
      return NextResponse.json({ error: 'Eksik parametreler' }, { status: 400 });
    }

    // Oy varsa güncelle, yoksa ekle
    const { data: existing } = await supabase
      .from('votes')
      .select('id')
      .eq('voter_id', voterId)
      .eq('target_user_id', targetUserId)
      .eq('week_start_date', weekStart)
      .eq('vote_type', voteType)
      .single();

    if (existing) {
      const { error } = await supabase
        .from('votes')
        .update({ vote_value: 1 })
        .eq('id', existing.id);

      if (error) throw error;
    } else {
      const { error } = await supabase.from('votes').insert([
        {
          voter_id: voterId,
          target_user_id: targetUserId,
          week_start_date: weekStart,
          vote_type: voteType,
          vote_value: 1,
        },
      ]);

      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Vote API error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

/**
 * Oyları getir
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const weekStart = searchParams.get('weekStart');
    const voteType = searchParams.get('voteType');

    if (!weekStart || !voteType) {
      return NextResponse.json({ error: 'Eksik parametreler' }, { status: 400 });
    }

    const { data: votes } = await supabase
      .from('votes')
      .select('*')
      .eq('week_start_date', weekStart)
      .eq('vote_type', voteType)
      .order('vote_value', { ascending: false });

    return NextResponse.json({ votes: votes || [] });
  } catch (error) {
    console.error('Vote GET error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
