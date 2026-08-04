# PARA

Kişisel finans uygulaması — nakit, banka, altın, gümüş, döviz, hisse/fon, BES, ev, araç,
borç, gelir ve giderlerinizi girersiniz; karşılığında **gerekçeli bir finansal puan** ve
hayatınızın **görsel bir manzarasını** alırsınız: karakteriniz, aileniz, evleriniz,
araçlarınız, evcil hayvanınız… Ay sonu açık veriyorsanız manzaranızda yağmur yağar;
puanınız yüksekse güneş açar.

> ⚠️ PARA bir yatırım danışmanı değildir. Uygulamadaki hiçbir puan veya açıklama
> yatırım tavsiyesi değildir; tüm sonuçlar kullanıcının kendi girdiği verilerin
> matematiksel özetidir.

---

## Özellikler

**Kurulum ve profil**
- Adım adım kurulum sihirbazı; sorular profile göre daralır (çocuk yoksa bebek gideri
  sorulmaz, evcil hayvan yoksa mama/veteriner soruları görünmez).
- Karakter özelleştirme (cilt tonu, saç, beden tipi, kıyafet, aksesuar) — evliyseniz
  eşiniz için de.
- Çocuklar yaş bantlarına göre sorulur: bebek (0-3), kreş (0-5), okul (6-17),
  üniversite (18-25).

**Varlıklar**
- Nakit, banka, altın ve **gümüş** (gram + gram fiyatı), **döviz** (USD/EUR/GBP…),
  **hisse senetleri ve yatırım fonları** (isimlendirilebilir kalemler), kripto, **BES**,
  **alacaklar**, evler (kiracı/sahibi/kirada/yazlık) ve araçlar (**araba, motosiklet**…).
- Arabalarda marka/model seçince ortalama ikinci el değeri önerilir
  (`public/data/arac-degerleri.json` — kod değişmeden güncellenebilir).
- **Canlı fiyat çekme (deneysel):** altın/gümüş/döviz fiyatlarını ücretsiz bir kamu
  kaynağından tek tuşla günceller; kaynak yanıt vermezse elle giriş sürer. Fiyatlar
  60 günden eskiyse nazikçe hatırlatır.

**Gelir ve giderler**
- Maaş, eş geliri, ek gelir, kira geliri (otomatik), **alınan nafaka** (boşanmışlar).
- Sabit giderler, **yıllık sigorta poliçeleri**, ulaşım (araç giderleri + **araç olsa da
  toplu taşıma**), evcil hayvan giderleri (isimle etiketli), çocuk giderleri,
  **ödenen nafaka** (boşanmışlar), **eşe verilen aylık para** (evliler).
- **Taksitli alışverişler:** isim + aylık taksit + kalan ay; kalan borç otomatik
  hesaplanır, süre bitince gider kendiliğinden düşer.

**Analiz**
- Net değer, aylık nakit akışı, 100 üzerinden gerekçeli finansal puan (tasarruf oranı,
  borç yükü, acil durum fonu, 6 sepetli varlık dağılımı). Ağırlık ve eşikler
  `src/logic/scoreConfig.ts` dosyasında — koda gömülü değil.
- **Aylık geçmiş:** puan ve net değer her ay otomatik kaydedilir, trend grafikleriyle
  gösterilir (veri cihazda kalır).
- Gider dağılımı halka grafiği.

**Manzara**
- Olgun, profesyonel illüstrasyon dili. Evler durumuna göre **farklı mimarilerde**
  çizilir ve altlarında yüksek kontrastlı etiket taşır (EVİM / KİRA / KİRADA / YAZLIK).
- Araçlar çapraz park alanında; motosikletler kendi çizimiyle.
- Sahneye entegre **portföy paneli**: varlık dağılımı halka grafiği + net değer.
- Hava durumu finansal duruma tepki verir; **ölçülü animasyonlar** (bulut süzülmesi,
  yağmur, baca dumanı, yıldız ışıltısı) — sistemin "hareketi azalt" tercihine uyar.

**Senaryolar ve Plan (Faz 2)**
- **Hedefler:** yaş (doğum yılı olarak saklanır, her yıl otomatik güncellenir), "rahat yaşam
  için aylık serbest para" ve "finansal özgürlük için aylık pasif gelir" hedefleri.
- **Kişisel plan:** kural tabanlı, kişiselleştirilmiş plan motoru (`src/logic/plan.ts`) —
  verilere, yaşa ve hedeflere göre sıralı, gerekçeli maddeler üretir. Finansal özgürlük
  hesabı temkinli %4 yıllık reel getiri varsayımı kullanır (`src/logic/planConfig.ts`).
  Ücretli servis yoktur; veri cihazdan çıkmaz. Yatırım aracı önerisi üretmez.
- **"Ne olurdu?" hesaplayıcıları** (`src/logic/senaryo.ts`): araç alımı, ev alımı
  (kira-taksit karşılaştırmalı), peşin mi kredi mi, birikim hedefi. Annüite kredi taksit
  formülü kullanılır; tüm hesaplar geçicidir, gerçek veri değişmez.
- **Korumalı çekirdek bilgiler:** medeni durum ve yaş, panelde kilitlidir — değiştirmek
  onay ister; "ne olurdu" denemeleri Senaryolar sayfasına yönlendirilir.

**Gizlilik ve kullanım**
- Veri yalnızca cihazda (`localStorage`); JSON dosyası olarak yedek alma / geri yükleme.
- **PIN kilidi** (isteğe bağlı), **tutarları gizleme** (göz düğmesi), **karanlık mod**
  (açık / koyu / sisteme uy).
- Sayı girişlerinde binlik ayraç (1.250.000).
- PWA: telefona kurulabilir, çevrimdışı çalışır. Türkçe + TL.

## Nasıl yayınlanır? (ücretsiz)

Yayın tamamen otomatik: `main` dalına gelen her değişiklikte GitHub Actions uygulamayı
derler, testleri koşar ve sonucu `gh-pages` dalına iter; GitHub Pages siteyi
`https://<kullanıcı-adın>.github.io/PARA/` adresinde yayınlar.

Bu adres telefonda açılıp "Ana ekrana ekle" denerek uygulama gibi kurulabilir.

## Geliştirici notları

```bash
npm install     # bağımlılıkları kur
npm run dev     # geliştirme sunucusu (http://localhost:5173)
npm test        # hesap motoru + veri göçü birim testleri
npm run build   # üretim derlemesi (dist/)
```

### Mühendislik kararları ve gerekçeleri

| Karar | Seçim | Neden |
|---|---|---|
| Platform | **Web / PWA** | Maliyet 0 TL; link paylaşarak anında dağıtım; telefona uygulama gibi kurulabiliyor. Doğrulandıktan sonra aynı kod Capacitor gibi bir sarmalayıcıyla Play Store'a taşınabilir (25 $ tek seferlik). |
| Veri saklama | **Yalnızca cihazda** + dosya ile yedekleme | Veriler son derece hassas (tüm mal varlığı). Cihazda kalınca sunucu maliyeti ve KVKK riski büyük ölçüde ortadan kalkıyor. Bulut senkronu Faz 3'te uçtan uca şifrelemeyle eklenebilir. |
| Arayüz teknolojisi | **React + TypeScript + Vite** | Bileşen tabanlı yapı; sihirbaz adımları ile paneldeki formlar aynı bileşenleri paylaşıyor. TypeScript finansal hesaplarda tip hatalarını derleme anında yakalıyor. |
| Hesap motoru | Arayüzden bağımsız **saf fonksiyonlar** (`src/logic/`) | Birim testleriyle doğrulanabilir; Faz 2'nin senaryo motoru aynı fonksiyonları hipotetik veriyle çağırarak kurulacak. |
| Grafikler | **Parametrik SVG** (hazır görsel yok) | Karakter/sahne her kombinasyonda dinamik üretiliyor; dosya boyutu küçük; animasyonlar CSS ile, ek kütüphane yok. |
| Canlı fiyatlar | Ücretsiz kamu kaynağı + **zarif geri düşüş** | Ücretli API bağımlılığı yok. Kaynak çalışmazsa uygulama hiç etkilenmez, elle giriş sürer. Kaynak `src/logic/prices.ts` içinde tek yerde tanımlı. |
| Veri şeması göçü | `surum` alanı + `veriTasima()` | Eski sürümde kaydedilmiş veriler (örn. "Manzara" dönemindeki) açılışta otomatik yeni şemaya taşınır; kullanıcı hiçbir şey kaybetmez. |
| Test stratejisi | Motor + göç birim testleri (Vitest), arayüze görsel doğrulama | Paranın hesaplandığı yer hataya en az tahammülü olan yer. |
| CI/CD | Sadece yayınlama iş akışı | Yayın öncesi testler otomatik koşuyor; bu aşamada daha fazlası gereksiz. |

### Klasör yapısı

```
src/
  model/      → veri modeli (types.ts), varsayılanlar
  logic/      → finansal hesap motoru, puan motoru, canlı fiyatlar + testler
  storage/    → cihaz içi saklama, sürüm göçü, yedekleme + testler
  components/ → avatar, sahne, grafikler, puan kartı, formlar, ortak arayüz
  onboarding/ → kurulum sihirbazı
  dashboard/  → ana panel (sekmeler)
public/
  data/arac-degerleri.json → araç piyasa ortalamaları (güncellenebilir veri)
  fonts/                   → yerel fontlar (Manrope + Inter, çevrimdışı çalışır)
  sw.js, manifest.webmanifest, icons/ → PWA parçaları
```

### Faz 2 için notlar

- **Senaryo motoru** ("bu arabayı alsam ne olur"): `src/logic/finance.ts` saf
  fonksiyonlardan oluşur; mevcut `AppData`'nın kopyası değiştirilip aynı fonksiyonlardan
  geçirilerek kurulur. Kredi taksit formülü eklemek yeterli.
- **Araç marka/model API'si**: kullanıcı talebi — Türkiye ikinci el piyasasını kapsayan
  uygun (tercihen ücretsiz/uygun maliyetli) bir API araştırılıp `AracDegerSaglayici`
  katmanına bağlanacak; mevcut JSON dosyası geri düşüş olarak kalacak.
- **Günlük harcama takibi**: `AppData`'ya `hareketler` alanı eklenir; `veriTasima`
  eski kayıtları otomatik taşır.
- **Bulut senkronu**: `storage/storage.ts` tek geçiş noktasıdır; uçtan uca şifreli bir
  eşitleme katmanı buraya eklenir. KVKK değerlendirmesi bu aşamada yapılmalı.
