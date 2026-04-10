<br/>
<div align="center">
  <h1 align="center">🎁 WishLink</h1>
  <p align="center">
    <strong>İstediğim Hediyeyi Doğrudan Söyle: Sürpriz Bozulmadan!</strong>
    <br/>
    <br/>
    Kullanıcıların beğendikleri ürünlerin bağlantılarını ekleyerek kişisel "İstek Listeleri" oluşturmalarını ve bu listeleri arkadaşlarıyla güvenle paylaşmalarını sağlayan modern bir Full-Stack Web Uygulaması.
  </p>
</div>

<br/>

## 🌟 Neden WishLink?

Piyasadaki standart not tutma veya link saklama uygulamalarının ötesinde, WishLink tamamen "Hediyeleşme" psikolojisi üzerine kurulmuş benzersiz bir mimariye sahiptir:

- **🕵️‍♂️ Sürpriz" Koruması:** Arkadaşlarınız listenizi ziyaret edip bir ürün için "🎁 Bunu Ben Alıyorum" diyerek rezerve edebilir ve diğer arkadaşlarınızla pişti olmaktan kurtulur. İşin büyüsü şudur: Sistem sizin (liste sahibinin) girdiğini algıladığında bu rezervasyonları anında sansürler! Kendi listenizde bile kimin neyi aldığını göremezsiniz, sürpriz son ana kadar korunur.
- **🛡️ Güvenlik & Gizlilik:** Listeler ardışık ID'lerle (Örn: `liste/5`) değil, bankacılık düzeyinde algoritmalarla üretilmiş eşsiz UUID Token'larla korunur. Linki sadece sizin yolladığınız kişiler görebilir.
- **🤖 Akıllı Link Okuyucu:** Trendyol, Amazon, Hepsiburada gibi sitelerden kopyalanan linkleri ayrıştırır ve otomatik olarak ürün adı, görseli ve fiyatını çeker. Sizin bir şey yazmanıza gerek kalmaz.
- **🔀 Sürükle ve Bırak (Drag & Drop):** En çok istediğiniz hediyeleri parmağınızla farenizle tutarak listenin en üstüne taşıyabilir, sıralamayı dilediğiniz gibi özelleştirebilirsiniz.
- **🎨 Tasarım:** En modern cam efekti UI anlayışıyla, telefonlarda standart bir uygulama (Native-App) kullanıyormuş hissi veren alttan açılan (Bottom-Sheet) menülere sahiptir.

## 🛠️ Teknolojiler & Mimari

- **Backend Mimari:** Node.js, Express.js
- **Veritabanı:** PostgreSQL (Neon.tech - `pg` pooler kullanılarak)
- **Frontend & UI:** HTML5, Vanilla JavaScript, CSS3 (Akışkan Tipografi, CSS Grid/Flexbox)
- **Web Scraping Aracı:** Axios, Cheerio
- **Güvenlik (Auth & Crypto):** JWT (JSON Web Token), bcryptjs, Node Crypto, CORS, dotenv

## 🚀 Kurulum (Yerel Geliştirme Ortamı)

Projeyi bilgisayarınızda çalıştırmak için aşağıdaki adımları izleyebilirsiniz.

### 1. Projeyi Klonlayın
```bash
git clone https://github.com/KULLANICI_ADINIZ/wishlink.git
cd wishlink
```

### 2. Gereksinimleri Yükleyin
```bash
npm install
```

### 3. Çevre Değişkenleri (Environment Variables)
Ana dizinde `.env` isimli gizli bir dosya oluşturun ve içerisine aşağıdaki ayarlarınızı ekleyin. (*Projeyi güvende tutmak için `.env` dosyanızı GitHub'a yüklemeyin, zaten `.gitignore` sayesinde yüklenmeyecektir*):
```env
DATABASE_URL=postgresql://kullanici:sifre@host:5432/veritabani_adi
JWT_SECRET=en_az_32_karakterlik_cok_gizli_anahtar_kelimeniz_123!
PORT=3000
```

### 4. Sunucuyu Başlatın
```bash
npm start
```
Artık tarayıcınızdan `http://localhost:3000` adresine giderek siteyi görüntüleyebilirsiniz! İçerisindeki gelişmiş Veritabanı Geçiş (Migration) mekanizması sayesinde tablolar ilk açılışta kendi kendine kusursuzca kurulacaktır.

## 👑 Yönetici (Admin) Komutları
Admin paneline (Uygulamadaki tüm kullanıcı ve listeleri yönetmek için) erişim sağlamak istiyorsanız, bağlandığınız PostgreSQL veritabanı panosundan (Neon.tech SQL Editor vs.) kendi hesabınız için yetki yükseltmesi yapmalısınız:
```sql
UPDATE users SET role = 'admin' WHERE username = 'sizin_kullanici_adiniz';
```

---
> 💡 *WishLink, hediye seçimi sırasındaki karmaşayı engelleyip, e-ticaret siteleri ile arkadaşlarınız arasında sosyal ve gizemli bir köprü kurmak amacıyla geliştirilmiştir.*
