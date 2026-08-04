// PARA — alan modeli (domain model)
// Tüm parasal değerler TL (Türk Lirası) cinsindendir ve aylıktır,
// aksi alan adında belirtilmedikçe (örn. yillik... alanları).

export type MedeniHal = 'bekar' | 'evli' | 'bosanmis';

export type BedenTipi = 'zayif' | 'orta' | 'kilolu';

export type SacStili = 'kisa' | 'uzun' | 'topuz' | 'kivircik' | 'trasli';

export type Aksesuar = 'gozluk' | 'sakal' | 'kupe' | 'sapka';

export interface AvatarConfig {
  ciltTonu: string; // palet içinden hex renk
  sacStili: SacStili;
  sacRengi: string;
  bedenTipi: BedenTipi;
  kiyafetRengi: string;
  aksesuarlar: Aksesuar[];
}

export interface Cocuk {
  id: string;
  ad: string;
  yas: number; // 0-25
}

export type EvcilTur = 'kedi' | 'kopek' | 'kus' | 'balik' | 'diger';

export interface EvcilHayvan {
  id: string;
  tur: EvcilTur;
  ad: string; // boş olabilir; doluysa giderlerde bu isimle etiketlenir
}

// Ev durumları:
//  kiraci  -> kullanıcının içinde kiracı olarak oturduğu ev (varlık değil, kira gideri)
//  sahibi  -> kullanıcının sahibi olup oturduğu ev (varlık)
//  kirada  -> kullanıcının sahibi olup kiraya verdiği ev (varlık + kira geliri)
//  yazlik  -> boş / yazlık ev (varlık)
export type EvDurumu = 'kiraci' | 'sahibi' | 'kirada' | 'yazlik';

export interface Ev {
  id: string;
  durum: EvDurumu;
  deger: number; // TL — kiracı için 0 (varlık değil)
  aylikKira: number; // kiracı: ödenen kira, kirada: alınan kira, diğerleri: 0
}

export type AracTuru = 'araba' | 'motosiklet' | 'diger';

export interface Arac {
  id: string;
  tur: AracTuru;
  marka: string;
  model: string;
  deger: number; // TL — arabalarda piyasa ortalamasından önerilir, kullanıcı değiştirebilir
}

export type YatirimTuru = 'hisse' | 'fon' | 'etf' | 'diger';

/** Hisse senedi / yatırım fonu / ETF — isimlendirilebilir tek liste. */
export interface YatirimKalemi {
  id: string;
  ad: string; // örn. THYAO, "Ak Portföy Teknoloji Fonu"
  tur: YatirimTuru;
  deger: number; // güncel toplam TL değeri (kullanıcı girer)
}

export type DovizKodu = 'USD' | 'EUR' | 'GBP' | 'diger';

export interface DovizKalemi {
  id: string;
  kod: DovizKodu;
  miktar: number; // döviz cinsinden
  kur: number; // TL karşılığı (1 birim), elle girilir veya canlı çekilir
}

export interface Varliklar {
  nakit: number;
  banka: number;
  altinGram: number;
  altinGramFiyat: number; // TL/gram
  gumusGram: number;
  gumusGramFiyat: number; // TL/gram
  yatirimlar: YatirimKalemi[]; // hisse + fon + ETF birlikte
  dovizler: DovizKalemi[];
  kripto: number; // toplam güncel değer
  bes: number; // bireysel emeklilik birikimi
  alacaklar: number; // başkasına verilmiş borç
  diger: number;
  /** Altın/gümüş/döviz fiyatlarının en son ne zaman güncellendiği (ISO tarih). */
  fiyatGuncelleme: string | null;
}

export interface Gelir {
  maas: number;
  esMaas: number; // sadece evliyse sorulur
  ekGelir: number;
  nafakaAlinan: number; // sadece boşanmışsa sorulur
  // kira geliri ayrıca tutulmaz: "kirada" durumundaki evlerden otomatik hesaplanır
}

export interface SabitGiderler {
  faturalar: number;
  aidat: number;
  market: number;
  abonelikler: number;
  saglik: number;
  eglence: number;
  giyim: number;
  diger: number;
}

export interface AracGiderleri {
  yakit: number; // aylık
  otopark: number; // aylık
  yillikSigortaBakim: number; // kasko + muayene + bakım, yıllık girilir, aya bölünür
}

export interface EvcilGideri {
  evcilId: string;
  aylikMama: number;
  aylikKumTimar: number;
  yillikVeteriner: number; // yıllık girilir, aya bölünür
}

export interface CocukGiderleri {
  bezMama: number; // 0-3 yaş çocuk varsa
  kresBakici: number; // 0-5 yaş çocuk varsa
  okulKirtasiye: number; // 6-17 yaş çocuk varsa
  harclik: number; // 6-17 yaş çocuk varsa
  universite: number; // 18-25 yaş çocuk varsa (yurt/kira/harçlık)
}

export interface Giderler {
  sabit: SabitGiderler;
  yillikSigortalar: number; // hayat/sağlık/DASK vb. poliçeler — yıllık girilir, aya bölünür
  topluTasima: number; // araç olsa da olmasa da sorulur
  arac: AracGiderleri; // araç varsa sorulur
  evcil: EvcilGideri[]; // evcil hayvan başına
  cocuk: CocukGiderleri; // çocukların yaşlarına göre daralır
  nafakaOdenen: number; // sadece boşanmışsa sorulur
  esHarcligi: number; // eşe verilen aylık para — sadece evliyse sorulur
}

export type BorcTuru = 'konut' | 'tasit' | 'ihtiyac' | 'krediKarti' | 'diger';

export interface Borc {
  id: string;
  tur: BorcTuru;
  kalan: number; // kalan anapara — net değerden düşülür
  taksit: number; // aylık taksit — gidere eklenir
}

/** Taksitli alışveriş (telefon, beyaz eşya vb.) — isimlendirilebilir.
 *  Kalan borç = aylık taksit × kalan ay olarak otomatik hesaplanır. */
export interface TaksitliAlisveris {
  id: string;
  ad: string; // örn. "Telefon", "Buzdolabı"
  aylikTaksit: number;
  kalanAy: number;
}

export interface Profil {
  ad: string;
  /** Doğum yılı — yaş her yıl otomatik güncellensin diye yıl saklanır.
   *  Medeni hal gibi "çekirdek" bilgidir; arayüzde kilitli düzenlenir. */
  dogumYili: number | null;
  medeniHal: MedeniHal;
  avatar: AvatarConfig;
  esAd: string;
  esAvatar: AvatarConfig | null; // sadece evliyse
  cocuklar: Cocuk[];
  evciller: EvcilHayvan[];
}

/** Kullanıcının finansal hedefleri — plan motoru bunlarla kişiselleşir. */
export interface Hedefler {
  /** "Ayda kaç TL serbest param olsa hayatımı rahat yaşarım?" */
  rahatAylik: number;
  /** "Finansal özgürlük için ayda ne kadar pasif gelir isterim?" */
  pasifGelirAylik: number;
}

/** Ay sonu anlık görüntüsü — trend grafikleri için (veri cihazda kalır). */
export interface AylikKayit {
  ay: string; // "2026-08"
  puan: number;
  netDeger: number;
  akis: number; // aylık nakit akışı
}

export interface AppData {
  surum: number; // veri şeması sürümü (ileriye dönük taşıma için)
  kurulumTamam: boolean; // sihirbaz bitti mi
  profil: Profil;
  evler: Ev[];
  araclar: Arac[];
  varliklar: Varliklar;
  gelir: Gelir;
  giderler: Giderler;
  borclar: Borc[];
  taksitler: TaksitliAlisveris[];
  hedefler: Hedefler;
  gecmis: AylikKayit[];
}
