import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Duel sonucunu kaydet
 */
export async function POST(req: NextRequest) {
  try {
    const { duelId, winnerId } = await req.json();

    if (!duelId || !winnerId) {
      return NextResponse.json({ error: 'Eksik parametreler' }, { status: 400 });
    }

    // Düelloyu bul
    const { data: duel, error: duelError } = await supabase
      .from('duels')
      .select('*')
      .eq('id', duelId)
      .single();

    if (duelError || !duel) {
      return NextResponse.json({ error: 'Duel bulunamadı' }, { status: 404 });
    }

    // Kazananı kaydet
    const { error: updateError } = await supabase
      .from('duels')
      .update({ winner_id: winnerId })
      .eq('id', duelId);

    if (updateError) throw updateError;

    // Bahis hesapla
    const { data: bets } = await supabase
      .from('bets')
      .select('*')
      .eq('duel_id', duelId)
      .eq('status', 'pending');

    if (bets) {
      for (const bet of bets) {
        const won = bet.predicted_winner_id === winnerId;
        const status = won ? 'won' : 'lost';

        await supabase
          .from('bets')
          .update({ status })
          .eq('id', bet.id);

        // Kazananları ödüllendir
        if (won) {
          const winnings = Math.floor(bet.amount * 1.5); // %50 kar
          const { data: betterData } = await supabase
            .from('users')
            .select('coins')
            .eq('id', bet.better_id)
            .single();

          if (betterData) {
            await supabase
              .from('users')
              .update({ coins: (betterData.coins || 0) + winnings })
              .eq('id', bet.better_id);
          }
        }
      }
    }

    // Kazanan coinleri
    const { data: winner } = await supabase
      .from('users')
      .select('coins')
      .eq('id', winnerId)
      .single();

    if (winner) {
      await supabase
        .from('users')
        .update({ coins: (winner.coins || 0) + 50 })
        .eq('id', winnerId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Duel API error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

/**
 * Duel bilgisini getir
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const duelId = searchParams.get('duelId');

    if (!duelId) {
      return NextResponse.json({ error: 'Eksik parametreler' }, { status: 400 });
    }

    const { data: duel, error } = await supabase
      .from('duels')
      .select('*')
      .eq('id', duelId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return NextResponse.json({ duel: duel || null });
  } catch (error) {
    console.error('Duel GET error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
