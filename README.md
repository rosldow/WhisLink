<br/>
<div align="center">
  <h1 align="center">🎁 WishLink</h1>
  <p align="center">
    <strong>Yapay Zeka Destekli İstek Listesi</strong>
    <br/>
    <br/>
    Kullanıcıların beğendikleri ürünlerin bağlantılarını ekleyerek kişisel "İstek Listeleri" oluşturmalarını, hediye alacakları arkadaşlarına AI asistanla fikir üretmelerini ve sürprizi asla bozmadan güvenle paylaşmalarını sağlayan modern Full-Stack Girişim Projesi.
  </p>
</div>

<br/>

## 🌟 Öne Çıkan Özellikleri

Mevcut not tutma uygulamalarının ötesinde; WishLink tamamen "Hediyeleşme Psikolojisi" ve "Yapay Zeka" üzerine inşa edilmiş teknolojik bir ekosistemdir:

- **🤖 WishBot: Yapay Zeka Hediye Danışmanı (Gemini 1.5):** Sitenin her an sağ alt köşesinde sizi bekleyen akıllı bir danışman. *"Anneme teknolojik bir hediye arıyorum, bütçem 2000 TL"* yazdığınızda, geçmiş mesajlarınızı da hafızada tutarak size nokta atışı yaratıcı hediye fikirleri sunar (Google Gemini API altyapısı).
- **🕵️‍♂️ Sürpriz Koruması:** Arkadaşlarınız listenizi ziyaret edip bir ürün için "🎁 Bunu Ben Alıyorum" diyerek rezerve edebilir. Sistem sizin (liste sahibinin) girdiğini algıladığında bu rezervasyonları arka planda (Backend) anında sansürler! Kendi listenizde bile kimin neyi aldığını göremezsiniz, hediye anına kadar sürprizinizi hiçbir sızıntı bozamaz.
- **🛡️ Güvenlik & Gizlilik:** Listeleriniz `?liste=5` gibi tahmin edilebilir düz yapılarla değil, bankacılık düzeyinde algoritmalarla üretilmiş eşsiz UUID Token'larla korunur. Linki bizzat atmadığınız kimse listenize sızamaz.
- **⚡ Akıllı Link Okuyucu (Scraper):** Trendyol, Amazon, Hepsiburada gibi yerlerden kopyalanan linkleri otonom olarak ayrıştırır; sayfaya girip ürün adını, görselini ve güncel fiyatını çeker. Siz sadece link yapıştırırsınız.
- **🔀 Dinamik Sıralama (Drag & Drop):** En çok istediğiniz hediyeleri parmağınızla/farenizle ekrandan tutarak listenin en üstüne taşıyabilir, sıralamayı ve akışı anında özelleştirebilirsiniz.
- **🎨 Glassmorphism & Mobil İlk Tasarım:** En modern yarı-saydam cam efekti (Glassmorphism) anlayışıyla kaplanmış, telefonda standart bir uygulama (Native-App) akıcılığında çalışan Bottom-Sheet menülere sahiptir.

## 🛠️ Teknolojiler & Mimari

- **Genel Mimari:** Node.js, Express.js
- **Veritabanı:** Cloud PostgreSQL (Neon.tech - `pg` Database Pool bağlantısı)
- **Frontend & UI:** HTML5, Vanilla JavaScript, CSS3 (Akışkan Tipografi ve Native Mobil UI)
- **Yapay Zeka (AI):** `@google/generative-ai` (Gemini 1.5 Flash - Contextual Memory)
- **Web Scraping:** Axios, Cheerio
- **Kriptografi & Otorizasyon:** JWT (JSON Web Token), bcryptjs, Node Crypto, CORS, dotenv

## 🚀 Kurulum (Yerel Ortam)

Projeyi bilgisayarınızda çalıştırmak için aşağıdaki adımları izleyebilirsiniz.

### 1. Klonlayın
```bash
git clone https://github.com/KULLANICI_ADINIZ/wishlink.git
cd wishlink
```

### 2. Bağımlılıkları Yükleyin
```bash
npm install
```

### 3. Çevre Değişkenleri (Environment Variables) Ayarı
Ana dizinde `.env` (başı noktalı) isimli gizli bir dosya oluşturun ve içerisine aşağıdaki değişkenleri yerleştirin. 
```env
DATABASE_URL=postgresql://kullanici:sifre@host:5432/veritabani_adi
JWT_SECRET=ozel_ve_guclu_bir_kriptoloji_anahtari_ornek_olarak_bu!
PORT=3000
GEMINI_API_KEY=google_ai_studio_arayuzunden_aldiginiz_anahtar
```
*(Güvenlik ve masraflarınızı korumak için `.env` dosyanızı GitHub'a yüklemeyin. Projede bunu engelleyen `.gitignore` hazırdır.)*

### 4. Sunucuyu Başlatın
```bash
npm start
```
Browser üzerinden `http://localhost:3000` adresine girerek WishLink deneyimine erişebilirsiniz! İçerisindeki "Migration" kodları sayesinde hiçbir SQL Sorgusu girmenize gerek kalmadan, ilk çalışmada tüm PostgreSQL veritabanı tablolarınız kendi kendine kurulacaktır.

## 👑 Yönetici (Admin) Komutları
Sayfadaki tüm üyeleri engellemek veya kullanıcı sayısını görebileceğiniz "Admin Panel" ekranına girmek isterseniz; bağlandığınız PostgreSQL editörü (pgAdmin, Neon.Tech Console vs.) üzerinden kendi hesabınızı yükseltebilirsiniz:
```sql
UPDATE users SET role = 'admin' WHERE username = 'sizin_kullanici_adiniz';
```

---
> 💡 *WishLink, e-ticaret siteleri ile arkadaş grupları arasındaki iletişimsizliği yok etmek; bunu yaparken de gelişmiş Yapay Zeka botu ile hediye kültürünü modern bir seviyeye çıkarmak amacıyla tasarlanmıştır.*
