# 🏋️ GYM WARS - Oyunlaştırılmış Sosyal Fitness Uygulaması

Arkadaşlarınla savaş, antrenman yap, **GymCoin** kazan ve **Black Market**'ten özel eşyalar satın al! Dark mode arayüzü ile 24/7 motivasyon.

## 🎮 Özellikler

### 💪 Antrenman Sistemi
- **Gym** ve **Kardio** etkinliklerini kaydet
- Her aktivite için coin kazan (Gym: 10 coin, Kardio: 5 coin)
- Antrenman notu ve resim ekle
- Haftalık 4x Gym hedefini tut, streak kazan

### 🎯 4 Haftalık Döngü
- **Hafta 1**: ☮️ Hazırlık - Normal antrenman
- **Hafta 2**: 👹 Boss Savaşı - Tüm sunucu ortak bir boss'a saldır
- **Hafta 3**: ⚔️ Düello Haftası - Server Lideri çarkı çevirip 1v1 eşleşme yap
- **Hafta 4**: 💀 Final Boss - Korkulu boss savaşı

## 📦 Kurulum

### 1. Repository'yi Clone Et
```bash
cd spor-takip
```

### 2. Bağımlılıkları Yükle
```bash
npm install
```

### 3. Environment Değişkenlerini Ayarla
```bash
cp .env.local.example .env.local
```

### 4. Uygulamayı Başlat
```bash
npm run dev
```

Tarayıcıda `http://localhost:3000` açın.

## 🛠️ Teknoloji Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
