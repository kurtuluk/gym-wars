import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Kullanıcı kozmeteğini satın al
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, itemType, cost, extraData } = await req.json();

    if (!userId || !itemType || cost === undefined) {
      return NextResponse.json({ error: 'Eksik parametreler' }, { status: 400 });
    }

    // Kullanıcıyı al
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });
    }

    // Bakiye yeterli mi?
    if ((user.coins || 0) < cost) {
      return NextResponse.json({ error: 'Yetersiz bakiye' }, { status: 400 });
    }

    // Update data
    let updateData: any = { coins: (user.coins || 0) - cost };

    switch (itemType) {
      case 'fire_icon':
        updateData.has_fire_icon = true;
        break;
      case 'gold_border':
        updateData.has_gold_border = true;
        break;
      case 'neon_border':
        updateData.has_neon_border = true;
        break;
      case 'diamond_border':
        updateData.has_diamond_border = true;
        break;
      case 'status_emoji':
        updateData.status_emoji = extraData;
        updateData.status_emoji_expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 gün
        break;
      case 'name_effect':
        updateData.name_effect = extraData; // 'rainbow', 'glitch', 'ghost'
        break;
      case 'custom_title':
        updateData.custom_title = extraData;
        break;
      case 'perm_king_icon':
        updateData.perm_king_icon = true;
        break;
      case 'rename_user':
        // Trolleme
        updateData.real_username = user.real_username || user.username;
        updateData.username = extraData;
        updateData.rename_expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 saat
        break;
      default:
        return NextResponse.json({ error: 'Bilinmeyen item türü' }, { status: 400 });
    }

    // Update user
    const { error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, newCoins: updateData.coins });
  } catch (error) {
    console.error('Shop API error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

/**
 * Mağaza itemlerini getir
 */
export async function GET(req: NextRequest) {
  try {
    const items = [
      {
        id: 'fire_icon',
        name: '🔥 Ateş İkonu',
        cost: 50,
        description: 'İsminin yanında ateş göster',
        category: 'icon',
      },
      {
        id: 'gold_border',
        name: '💰 Altın Çerçeve',
        cost: 200,
        description: 'Profilinde altın çerçeve',
        category: 'border',
      },
      {
        id: 'neon_border',
        name: '✨ Neon Çerçeve',
        cost: 350,
        description: 'Parlak neon ışıkları',
        category: 'border',
      },
      {
        id: 'diamond_border',
        name: '💎 Diamond Çerçeve',
        cost: 500,
        description: 'Süper nadir ve değerli',
        category: 'border',
      },
      {
        id: 'status_emoji',
        name: '😎 Status Emoji',
        cost: 50,
        description: 'İsminin yanında emoji göster (7 gün)',
        category: 'emoji',
      },
      {
        id: 'name_effect',
        name: '🌈 İsim Efekti',
        cost: 150,
        description: 'Rainbow, Glitch veya Ghost efekti',
        category: 'effect',
      },
      {
        id: 'custom_title',
        name: '👑 Özel Ünvan',
        cost: 200,
        description: 'Kendi özel başlığını yaz',
        category: 'title',
      },
      {
        id: 'perm_king_icon',
        name: '👑 Kalıcı Kral İkonu',
        cost: 1000,
        description: 'Her hafta kral olarak gözükmen',
        category: 'special',
      },
      {
        id: 'rename_user',
        name: '👿 Troll - İsim Değiştir',
        cost: 500,
        description: 'Birinin ismini 24 saat değiştir',
        category: 'troll',
      },
    ];

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Shop GET error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
