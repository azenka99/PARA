# Manzara 🏞️

Kişisel finans uygulaması — nakit, banka, altın, hisse, ev, araç, borç, gelir ve giderlerini
girersin; karşılığında **gerekçeli bir finansal puan** ve kendi hayatının **görsel bir
"manzarasını"** alırsın: karakterin, ailen, evin, araban, evcil hayvanın… Ay sonu açık
veriyorsan manzaranda yağmur yağar; puanın yüksekse güneş açar. ☀️🌧️

> ⚠️ Manzara bir yatırım danışmanı değildir. Uygulamadaki hiçbir puan veya açıklama
> yatırım tavsiyesi değildir; tüm sonuçlar kullanıcının kendi girdiği verilerin
> matematiksel özetidir.

---

## Bu sürümde neler var? (Faz 1 — MVP)

- 🧙 **Adım adım kurulum sihirbazı** — tek uzun form yok; karakter, aile, ev, araç,
  varlık, gelir, gider, borç adım adım sorulur.
- 🎨 **Karakter özelleştirme** — cilt tonu, saç stili/rengi, beden tipi (görsel olarak
  gerçekten farklılaşır), kıyafet rengi, aksesuarlar. Evliysen eşin için de aynı derinlikte.
- 🔍 **Profil filtreleme** — çocuk yoksa bebek gideri sorulmaz; araç yoksa yakıt yerine
  toplu taşıma sorulur; evcil hayvan yoksa mama/veteriner soruları hiç görünmez, varsa
  giderler hayvanın adıyla etiketlenir.
- 📊 **Net değer, aylık nakit akışı ve 100 üzerinden finansal puan** — dört bileşen
  (tasarruf oranı, borç yükü, acil durum fonu, varlık dağılımı), her biri "neden bu puan"
  açıklamasıyla. Ağırlık ve eşikler `src/logic/scoreConfig.ts` dosyasında — koda gömülü değil.
- 🏞️ **Görsel sahne** — evler durumuna göre (kiracı / ev sahibi / kirada / yazlık) farklı
  çizilir, araçlar sol üstte çapraz park alanında dizilir, altın külçe yığını miktara göre
  büyür, yatırımlar büyüyen bir ağaç olur, hava durumu finansal duruma tepki verir.
- 💾 **Veri yalnızca cihazda** — hiçbir sunucuya hiçbir şey gönderilmez. Tek dokunuşla
  JSON dosyası olarak yedek alınır / geri yüklenir.
- 📱 **PWA** — telefonda "Ana ekrana ekle" ile normal bir uygulama gibi açılır,
  çevrimdışı çalışır.

## Nasıl yayınlanır? (ücretsiz)

Yayın tamamen otomatik: `main` dalına gelen her değişiklikte GitHub Actions uygulamayı
derler, testleri koşar ve sonucu `gh-pages` dalına iter; GitHub Pages siteyi
`https://<kullanıcı-adın>.github.io/PARA/` adresinde yayınlar.

Bu adres telefonda açılıp "Ana ekrana ekle" denerek uygulama gibi kurulabilir.

Not: Site hiç açılmazsa GitHub'da **Settings → Pages** altında kaynak olarak
`gh-pages` dalının seçili olduğunu kontrol etmek yeterlidir.

## Geliştirici notları

```bash
npm install     # bağımlılıkları kur
npm run dev     # geliştirme sunucusu (http://localhost:5173)
npm test        # hesap motoru birim testleri (30 test)
npm run build   # üretim derlemesi (dist/)
```

### Mühendislik kararları ve gerekçeleri

| Karar | Seçim | Neden |
|---|---|---|
| Platform | **Web / PWA** | Maliyet 0 TL; link paylaşarak anında dağıtım; telefona uygulama gibi kurulabiliyor. Doğrulandıktan sonra aynı kod Capacitor gibi bir sarmalayıcıyla Play Store'a taşınabilir (25 $ tek seferlik). Spesifikasyonun 9. bölümündeki öneriyle uyumlu. |
| Veri saklama | **Yalnızca cihazda** (`localStorage`) + dosya ile yedekleme | Veriler son derece hassas (tüm mal varlığı). Cihazda kalınca sunucu maliyeti ve KVKK riski büyük ölçüde ortadan kalkıyor. Bulut senkronu Faz 3'te uçtan uca şifrelemeyle eklenebilir. |
| Arayüz teknolojisi | **React + TypeScript + Vite** | Bileşen tabanlı yapı; sihirbaz adımları ile paneldeki formlar aynı bileşenleri paylaşıyor. TypeScript finansal hesaplarda tip hatalarını derleme anında yakalıyor. Hepsi ücretsiz ve açık kaynak. |
| Hesap motoru | Arayüzden bağımsız **saf fonksiyonlar** (`src/logic/`) | Birim testleriyle doğrulanabilir; Faz 2'nin senaryo motoru ("araba alsam ne olur") aynı fonksiyonları hipotetik veriyle çağırarak kurulabilir. |
| Grafikler | **Parametrik SVG** (hazır görsel yok) | Karakter/sahne her kombinasyonda dinamik üretiliyor; dosya boyutu küçük kalıyor; ileride animasyon eklemek kolay. |
| Test stratejisi | Hesap motoruna birim testi (Vitest), arayüze manuel/görsel doğrulama | Paranın hesaplandığı yer hataya en az tahammülü olan yer. Arayüz testi bu aşamada maliyetine değmez. |
| CI/CD | Sadece **yayınlama iş akışı** (GitHub Pages) | Bu erken aşamada karmaşık bir hat gereksiz; ama yayın öncesi testler otomatik koşuyor. |
| Araç piyasa değerleri | Ayrı veri dosyası: `public/data/arac-degerleri.json` | Koda gömülü değil; dosyadaki değerler ve `guncellemeTarihi` güncellenerek tazelenir, kullanıcıya öneri tarihi gösterilir. Kullanıcı her zaman üzerine yazabilir. İleride bir API'ye bağlanabilir. |

### Açık soruların durumu (Bölüm 12)

Spesifikasyondaki açık sorular kullanıcıya soruldu; yanıt alınamadığı için belgenin kendi
önerdiği, **maliyeti sıfır ve geri dönüşü kolay** seçeneklerle ilerlendi:

1. **Platform:** Web/PWA ile başlandı (Bölüm 9'un önerisi). Mobil mağazalar Faz 3.
2. **Veri saklama:** Yalnızca cihazda (Bölüm 7'nin önerisi) + yedekleme özelliği.
3. **AI yorumlama:** Faz 1'e alınmadı (Bölüm 12'de "önerilen" seçenek). Puan gerekçeleri
   kural tabanlı Türkçe metinlerle üretiliyor.
4. **İsim:** "Manzara" çalışma adı olarak kullanıldı; değiştirmek tek yerden mümkün.
5. **Profil:** Tek profil (eş/çocuklar bu profilin içinde). Veri tek pakette tutulduğu
   için çoklu profil ileride mimariyi bozmadan eklenebilir.
6. **Yerelleştirme:** Yalnızca Türkçe + TL.

Bu kararların hepsi sonradan değiştirilebilir; hiçbiri ücretli bir servise bağımlılık
yaratmaz.

### Klasör yapısı

```
src/
  model/      → veri modeli (types.ts) ve varsayılanlar
  logic/      → finansal hesap motoru + puan motoru + testleri (arayüzden bağımsız)
  storage/    → cihaz içi saklama, yedek alma / geri yükleme
  components/ → avatar, sahne, puan kartı, formlar, ortak arayüz parçaları
  onboarding/ → kurulum sihirbazı
  dashboard/  → ana panel (sekmeler)
public/
  data/arac-degerleri.json → araç piyasa ortalamaları (güncellenebilir veri dosyası)
  fonts/                   → yerel fontlar (çevrimdışı çalışma için)
  sw.js, manifest.webmanifest, icons/ → PWA parçaları
```

### Faz 2 / Faz 3 için notlar

- **Senaryo motoru:** `src/logic/finance.ts` saf fonksiyonlardan oluşur; "bu arabayı
  alırsam" senaryosu, mevcut `AppData`'nın bir kopyasını değiştirip aynı fonksiyonlardan
  geçirmekle kurulur. Kredi taksit formülü eklemek yeterli.
- **Günlük harcama takibi:** `AppData`'ya `hareketler: Hareket[]` alanı eklenir;
  `veriTasima` (şema taşıma) mekanizması eski kayıtları otomatik yeni şemaya taşır.
- **Bulut senkronu:** `storage/storage.ts` tek geçiş noktasıdır; buraya uçtan uca
  şifreli bir eşitleme katmanı eklenebilir. KVKK değerlendirmesi bu aşamada yapılmalı.
- **Canlı fiyatlar:** Altın/hisse fiyat alanları zaten ayrı tutuluyor; bir fiyat
  servisi bağlandığında yalnızca bu alanları beslemek yeterli.
