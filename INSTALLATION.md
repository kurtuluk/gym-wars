# 📖 GYM WARS - Kurulum ve Dağıtım Rehberi

## 🚀 Hızlı Başlangıç

### Adım 1: Supabase Projesi Oluştur

1. [Supabase](https://supabase.com) adresine git
2. "New Project" tıkla
3. Proje adını gir: `gym-wars`
4. Güçlü bir password seç
5. Region seç (Europe - Dublin veya Asia - Singapur)
6. Proje oluşturulmasını bekle (~1 dakika)

### Adım 2: SQL Script'i Çalıştır

1. Supabase Dashboard'da "SQL Editor" tıkla
2. "New Query" tıkla
3. Aşağıdaki SQL'i kopyala ve yapıştır:

```sql
-- ========================================================= 
-- 0. TEMİZLİK (Eski tabloları ve kuralları yok ediyoruz)
-- =========================================================
DROP TABLE IF EXISTS user_achievements CASCADE;
DROP TABLE IF EXISTS raid_bosses CASCADE;
DROP TABLE IF EXISTS bets CASCADE;
DROP TABLE IF EXISTS boss_attacks CASCADE;
DROP TABLE IF EXISTS boss_raids CASCADE;
DROP TABLE IF EXISTS duels CASCADE;
DROP TABLE IF EXISTS votes CASCADE;
DROP TABLE IF EXISTS penalties CASCADE;
DROP TABLE IF EXISTS kings CASCADE;
DROP TABLE IF EXISTS system_rewards CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. EKLENTİLER
create extension if not exists "uuid-ossp";

-- =========================================================
-- 2. TABLOLARIN OLUŞTURULMASI
-- =========================================================

-- A. KULLANICILAR
CREATE TABLE users (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  username text UNIQUE NOT NULL,
  pin_code text NOT NULL,
  initial_streak int DEFAULT 0,
  coins int DEFAULT 0,
  
  -- Kozmetik Özellikler
  has_fire_icon boolean DEFAULT false,
  has_gold_border boolean DEFAULT false,
  has_neon_border boolean DEFAULT false,
  has_diamond_border boolean DEFAULT false,
  name_color text DEFAULT 'text-white',
  
  -- Oyun İçi Durumlar
  has_immunity boolean DEFAULT false,
  real_username text,
  rename_expires_at timestamp with time zone,
  
  -- Avatar ve Grup
  avatar_url text,
  group_id text DEFAULT 'server_1',
  total_activity_count int DEFAULT 0,
  betting_enabled boolean DEFAULT true,
  
  -- Yeni Mağaza Özellikleri
  status_emoji text,
  status_emoji_expires_at timestamp with time zone,
  name_effect text,
  custom_title text,
  perm_king_icon boolean DEFAULT false,
  
  -- Otomasyon Takibi
  last_weekly_process_date date,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- B. AKTİVİTE GÜNLÜĞÜ
CREATE TABLE activity_logs (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  activity_date date NOT NULL,
  activity_type text,
  note text,
  image_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- C. BOSS SAVAŞI SİSTEMİ
CREATE TABLE boss_raids (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  month_key text UNIQUE NOT NULL,
  boss_name text DEFAULT 'Antik Titan',
  total_hp int DEFAULT 5000,
  current_hp int DEFAULT 5000,
  is_defeated boolean DEFAULT false,
  created_at timestamp DEFAULT now()
);

CREATE TABLE boss_attacks (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  raid_id uuid REFERENCES boss_raids(id),
  user_id uuid REFERENCES users(id),
  damage int,
  created_at timestamp DEFAULT now()
);

-- D. DÜELLO SİSTEMİ
CREATE TABLE duels (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  week_start_date date NOT NULL,
  group_id text DEFAULT 'server_1',
  player1_id uuid REFERENCES users(id),
  player2_id uuid REFERENCES users(id),
  theme text,
  winner_id uuid REFERENCES users(id),
  created_at timestamp DEFAULT now()
);

-- E. BAHİS SİSTEMİ
CREATE TABLE bets (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  better_id uuid REFERENCES users(id),
  duel_id uuid REFERENCES duels(id),
  predicted_winner_id uuid REFERENCES users(id),
  amount int DEFAULT 10,
  status text DEFAULT 'pending',
  created_at timestamp DEFAULT now()
);

-- F. YARDIMCI TABLOLAR
CREATE TABLE votes (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  voter_id uuid REFERENCES users(id),
  target_user_id uuid REFERENCES users(id),
  week_start_date date NOT NULL,
  vote_type text,
  vote_value int DEFAULT 1,
  created_at timestamp DEFAULT now(),
  UNIQUE(voter_id, target_user_id, week_start_date, vote_type)
);

CREATE TABLE penalties (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  penalty_text text NOT NULL,
  week_start_date date NOT NULL,
  is_completed boolean DEFAULT false,
  created_at timestamp DEFAULT now()
);

CREATE TABLE kings (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  week_start_date date NOT NULL,
  group_id text DEFAULT 'server_1',
  decree_text text DEFAULT 'Bu hafta mazeret yok!',
  created_at timestamp DEFAULT now()
);

CREATE TABLE system_rewards (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  reward_key text UNIQUE NOT NULL,
  processed_at timestamp DEFAULT now()
);

-- Yeni Raid Boss Tablosu
CREATE TABLE raid_bosses (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  week_start_date date NOT NULL,
  group_id text DEFAULT 'server_1',
  boss_name text,
  hp_max int,
  hp_current int,
  is_defeated boolean DEFAULT false,
  created_at timestamp DEFAULT now()
);

-- User Achievements
CREATE TABLE user_achievements (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  badge_code text,
  earned_at timestamp DEFAULT now()
);

-- =========================================================
-- 3. GÜVENLİK (RLS)
-- =========================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Users" ON users FOR ALL USING (true);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Logs" ON activity_logs FOR ALL USING (true);

ALTER TABLE boss_raids ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Boss" ON boss_raids FOR ALL USING (true);

ALTER TABLE boss_attacks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Attacks" ON boss_attacks FOR ALL USING (true);

ALTER TABLE duels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Duels" ON duels FOR ALL USING (true);

ALTER TABLE bets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Bets" ON bets FOR ALL USING (true);

ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Votes" ON votes FOR ALL USING (true);

ALTER TABLE penalties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Penalties" ON penalties FOR ALL USING (true);

ALTER TABLE kings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Kings" ON kings FOR ALL USING (true);

ALTER TABLE system_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Rewards" ON system_rewards FOR ALL USING (true);

ALTER TABLE raid_bosses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Raid Bosses" ON raid_bosses FOR ALL USING (true);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Achievements" ON user_achievements FOR ALL USING (true);
```

4. "Run" tıkla
5. ✅ Script başarıyla çalıştı mesajını göreceksin

### Adım 3: Storage Bucket Oluştur

1. Dashboard'da "Storage" tıkla
2. "New Bucket" tıkla
3. Ad: `activity_images`
4. "Public bucket" seçeneğini aç
5. "Create bucket" tıkla

### Adım 4: API Keys Al

1. Settings → API seçeneğine git
2. "URL" ve "Anon Key" kopyala
3. Service Role Key'i kopyala

### Adım 5: Projeyi Kur

```bash
# Depoyu clone et
git clone <repo-url>
cd spor-takip

# Dependencies yükle
npm install

# .env.local oluştur
cp .env.local.example .env.local
```

**`.env.local` dosyasını düzenle:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### Adım 6: Geliştirme Sunucusunu Başlat

```bash
npm run dev
```

`http://localhost:3000` açın ve giriş yap!

---

## 🌐 Production'a Dağıt

### Vercel'e Deploy

1. [Vercel](https://vercel.com) adresine git
2. GitHub hesabınla bağlan
3. "Import Project" tıkla
4. Repository'yi seç
5. Environment Variables ekle:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
6. "Deploy" tıkla

Vercel otomatik olarak sertifikalar kuracak ve canlı yayına alacak!

---

## 🔧 Sorun Giderme

### Bağlantı Hatası
- `.env.local` dosyasını kontrol et
- Supabase URL ve Key'leri kopyala-yapıştır

### Resim Yüklemesi Başarısız
- Storage bucket'in public olduğundan emin ol
- Bucket adının `activity_images` olduğunu kontrol et

### API 500 Hatası
- Console'da hatayı kontrol et
- Service Role Key'in yazılı olduğundan emin ol

---

## 📞 Destek

Sorular veya sorunlar için GitHub Issues'i kullan!

🎉 **Başarıyla kurdum!** 🎉
