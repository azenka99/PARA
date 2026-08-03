// Manzara — alan modeli (domain model)
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

export interface Arac {
  id: string;
  marka: string;
  model: string;
  deger: number; // TL — piyasa ortalamasından önerilir, kullanıcı değiştirebilir
}

export interface Hisse {
  id: string;
  kod: string; // örn. THYAO
  lot: number;
  fiyat: number; // TL, kullanıcı girer (v1'de otomatik çekilmez)
}

export interface Varliklar {
  nakit: number;
  banka: number;
  altinGram: number;
  altinGramFiyat: number; // TL/gram, kullanıcı girer
  hisseler: Hisse[];
  fonEtf: number; // toplam güncel değer
  kripto: number; // toplam güncel değer
  diger: number;
}

export interface Gelir {
  maas: number;
  esMaas: number; // sadece evliyse sorulur
  ekGelir: number;
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
  okulKirtasiye: number; // 6-18 yaş çocuk varsa
  harclik: number; // 6+ yaş çocuk varsa
}

export interface Giderler {
  sabit: SabitGiderler;
  topluTasima: number; // araç yoksa sorulur
  arac: AracGiderleri; // araç varsa sorulur
  evcil: EvcilGideri[]; // evcil hayvan başına
  cocuk: CocukGiderleri; // çocukların yaşlarına göre daralır
}

export type BorcTuru = 'konut' | 'tasit' | 'ihtiyac' | 'krediKarti' | 'diger';

export interface Borc {
  id: string;
  tur: BorcTuru;
  kalan: number; // kalan anapara — net değerden düşülür
  taksit: number; // aylık taksit — gidere eklenir
}

export interface Profil {
  ad: string;
  medeniHal: MedeniHal;
  avatar: AvatarConfig;
  esAd: string;
  esAvatar: AvatarConfig | null; // sadece evliyse
  cocuklar: Cocuk[];
  evciller: EvcilHayvan[];
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
}
