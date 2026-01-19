import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Resim yükle (Activity Images)
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    if (!file || !userId) {
      return NextResponse.json({ error: 'Eksik parametreler' }, { status: 400 });
    }

    // Dosya boyutunu kontrol et (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Dosya çok büyük (Max 5MB)' }, { status: 400 });
    }

    // Dosya tipini kontrol et
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Sadece resim dosyaları kabul edilir' }, { status: 400 });
    }

    // Dosya adı oluştur
    const timestamp = Date.now();
    const fileName = `${userId}/${timestamp}-${file.name}`;

    // Upload
    const { data, error } = await supabase.storage
      .from('activity_images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;

    // Public URL oluştur
    const {
      data: { publicUrl },
    } = supabase.storage.from('activity_images').getPublicUrl(fileName);

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Yükleme hatası' }, { status: 500 });
  }
}

/**
 * Etkinlik logu oluştur (resimle)
 */
export async function PUT(req: NextRequest) {
  try {
    const { userId, activityType, activityDate, note, imageUrl } = await req.json();

    if (!userId || !activityType || !activityDate) {
      return NextResponse.json({ error: 'Eksik parametreler' }, { status: 400 });
    }

    // Bugün bu aktiviteyi zaten eklediyse hata
    const { data: existing } = await supabase
      .from('activity_logs')
      .select('id')
      .eq('user_id', userId)
      .eq('activity_date', activityDate)
      .eq('activity_type', activityType)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Bu aktiviteyi bugün zaten ekledin' },
        { status: 400 }
      );
    }

    // Log oluştur
    const { data: log, error } = await supabase
      .from('activity_logs')
      .insert([
        {
          user_id: userId,
          activity_type: activityType,
          activity_date: activityDate,
          note: note || null,
          image_url: imageUrl || null,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Coin kazan
    const earnedCoins = activityType === 'gym' ? 10 : 5;
    const { data: user } = await supabase
      .from('users')
      .select('coins, total_activity_count')
      .eq('id', userId)
      .single();

    if (user) {
      await supabase
        .from('users')
        .update({
          coins: (user.coins || 0) + earnedCoins,
          total_activity_count: (user.total_activity_count || 0) + 1,
        })
        .eq('id', userId);
    }

    return NextResponse.json({
      success: true,
      log,
      earnedCoins,
    });
  } catch (error) {
    console.error('Activity log error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

/**
 * Kullanıcının etkinliklerini getir
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');

    if (!userId) {
      return NextResponse.json({ error: 'Eksik parametreler' }, { status: 400 });
    }

    let query = supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', userId)
      .order('activity_date', { ascending: false });

    if (startDate) {
      query = query.gte('activity_date', startDate);
    }

    const { data: logs, error } = await query;

    if (error) throw error;

    return NextResponse.json({ logs: logs || [] });
  } catch (error) {
    console.error('Activity logs GET error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
