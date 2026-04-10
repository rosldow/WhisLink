<br/>
<div align="center">
  <h1 align="center">🎁 WishLink</h1>
  <p align="center">
    <strong>İstediğin Hediyeyi Doğrudan Söyle.</strong>
    <br/>
    <br/>
    Kullanıcıların beğendikleri ürünlerin bağlantılarını ekleyerek kişisel "İstek Listeleri" (Wishlist) oluşturmalarını ve bu listeleri arkadaşlarıyla paylaşmalarını sağlayan modern bir Full-Stack Web Uygulaması.
  </p>
</div>

<br/>

## 🌟 Özellikler

- **🤖 Akıllı Link Okuyucu (Scraper):** Trendyol, Amazon, Hepsiburada gibi sitelerden kopyalanan ürün linklerinden otomatik olarak ürün adı, görseli ve fiyatını çeker.
- **🔐 Güvenli Kimlik Doğrulama:** JWT (JSON Web Token) ve bcryptJS şifrelemeli kullanıcı kayıt ve giriş sistemi.
- **📱 Modern & Responsive Arayüz:** Vanilla CSS ile tasarlanmış Glassmorphism (cam efekti) tabanlı, karanlık mod temalı ve mobil cihazlarla %100 uyumlu arayüz.
- **👑 Yönetici (Admin) Paneli:** Özel yetkilendirilmiş yöneticiler için sistemdeki tüm üyeleri, listeleri ve ürünleri istatiksel olarak görüntüleme ve üye uzaklaştırma özellikleri.
- **📝 Çoklu Liste Yönetimi:** Kullanıcı başına tek liste yerine, birden fazla kategorize edilmiş (Örn: "Doğum Günü", "Çeyiz", "Kitaplar") liste oluşturabilme.

## 🛠️ Teknolojiler & Mimari

- **Backend:** Node.js, Express.js
- **Veritabanı:** PostgreSQL (`pg` pooler kullanılarak)
- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Web Scraping:** Axios, Cheerio
- **Güvenlik & Yapılandırma:** JWT, bcryptjs, dotenv, cors

## 🚀 Kurulum & Çalıştırma (Yerel Geliştirme)

Projeyi kendi bilgisayarınızda çalıştırmak için aşağıdaki adımları izleyebilirsiniz.

### 1. Gereksinimler
- Bilgisayarınızda [Node.js](https://nodejs.org/) kurulu olmalıdır.
- (Opsiyonel) Canlı bir veritabanı url'i veya yerel PostgreSQL veritabanı.

### 2. Projeyi Klonlayın
```bash
git clone https://github.com/KULLANICI_ADINIZ/wishlink.git
cd wishlink
```

### 3. Gerekli Paketleri Yükleyin
```bash
npm install
```

### 4. Çevre Değişkenlerini Ayarlayın
Ana dizinde gizli bir `.env` dosyası oluşturun ve içerisine kendi ayarlarınızı ekleyin:
```env
DATABASE_URL=postgresql://kullanici:sifre@host:5432/veritabani_adi
JWT_SECRET=en_az_32_karakterlik_cok_gizli_anahtar_kelimeniz_123!
PORT=3000
```
> **Not:** Şifrelerinizin çalınmaması için `.env` dosyasını asla GitHub'a yüklemeyin. Projede bunu engellemek için bir `.gitignore` dosyası eklidir.

### 5. Sunucuyu Başlatın
```bash
npm start
```
Artık tarayıcınızdan `http://localhost:3000` adresine giderek siteyi görüntüleyebilirsiniz! Veritabanı tabloları sunucu ilk açıldığında otomatik olarak kurulacaktır.

## 👑 Kendinizi "Admin" Yapmak İçin
Veritabanı paneline (Örn: Neon.tech SQL Editor veya pgAdmin) bağlanın ve kendi kullanıcınız için şu komutu çalıştırın:
```sql
UPDATE users SET role = 'admin' WHERE username = 'kullanici_adiniz';
```
Hesabınıza tekrar giriş yaptığınızda yönetim panelinize erişebileceksiniz.

---
> 💡 *Bu proje, e-ticaret sitelerinden hediye arama sürecini sosyal ve kolay bir deneyime dönüştürmek amacıyla kodlanmıştır.*
