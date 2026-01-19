import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Ceza ekle (Kral tarafından)
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, penaltyText, weekStart } = await req.json();

    if (!userId || !penaltyText || !weekStart) {
      return NextResponse.json({ error: 'Eksik parametreler' }, { status: 400 });
    }

    const { error } = await supabase.from('penalties').insert([
      {
        user_id: userId,
        penalty_text: penaltyText,
        week_start_date: weekStart,
        is_completed: false,
      },
    ]);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Penalty API error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

/**
 * Cezaları getir
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const weekStart = searchParams.get('weekStart');
    const userId = searchParams.get('userId');

    if (!weekStart) {
      return NextResponse.json({ error: 'Eksik parametreler' }, { status: 400 });
    }

    let query = supabase
      .from('penalties')
      .select('*')
      .eq('week_start_date', weekStart);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: penalties } = await query;

    return NextResponse.json({ penalties: penalties || [] });
  } catch (error) {
    console.error('Penalty GET error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

/**
 * Ceza tamamla
 */
export async function PATCH(req: NextRequest) {
  try {
    const { penaltyId } = await req.json();

    if (!penaltyId) {
      return NextResponse.json({ error: 'Eksik parametreler' }, { status: 400 });
    }

    const { error } = await supabase
      .from('penalties')
      .update({ is_completed: true })
      .eq('id', penaltyId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Penalty PATCH error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
