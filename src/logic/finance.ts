// Finansal hesap motoru — saf fonksiyonlar, arayüzden bağımsız.
// Tüm sonuçlar TL cinsinden aylık değerlerdir (net değer hariç).

import type { AppData, Cocuk } from '../model/types';

/** Profil filtre kuralları — hangi çocuk gider kalemleri hangi yaşlarda sorulur. */
export const YAS_BANTLARI = {
  bezMama: { min: 0, max: 3 },
  kresBakici: { min: 0, max: 5 },
  okulKirtasiye: { min: 6, max: 17 },
  harclik: { min: 6, max: 17 },
  universite: { min: 18, max: 25 },
} as const;

export function bantUygunMu(
  cocuklar: Cocuk[],
  bant: keyof typeof YAS_BANTLARI,
): boolean {
  const { min, max } = YAS_BANTLARI[bant];
  return cocuklar.some((c) => c.yas >= min && c.yas <= max);
}

/** Altının toplam TL değeri. */
export function altinDegeri(veri: AppData): number {
  return veri.varliklar.altinGram * veri.varliklar.altinGramFiyat;
}

/** Gümüşün toplam TL değeri. */
export function gumusDegeri(veri: AppData): number {
  return veri.varliklar.gumusGram * veri.varliklar.gumusGramFiyat;
}

/** Kıymetli metaller: altın + gümüş. */
export function metalDegeri(veri: AppData): number {
  return altinDegeri(veri) + gumusDegeri(veri);
}

/** Dövizlerin toplam TL değeri. */
export function dovizDegeri(veri: AppData): number {
  return veri.varliklar.dovizler.reduce((t, d) => t + d.miktar * d.kur, 0);
}

/** Hisse + fon + ETF kalemlerinin toplam TL değeri. */
export function yatirimDegeri(veri: AppData): number {
  return veri.varliklar.yatirimlar.reduce((t, y) => t + y.deger, 0);
}

/** Piyasa varlıkları: hisse/fon/ETF + kripto. */
export function piyasaVarligi(veri: AppData): number {
  return yatirimDegeri(veri) + veri.varliklar.kripto;
}

/** Sahip olunan evlerin (kiracı olunan hariç) toplam değeri. */
export function gayrimenkulDegeri(veri: AppData): number {
  return veri.evler
    .filter((e) => e.durum !== 'kiraci')
    .reduce((t, e) => t + e.deger, 0);
}

/** Araçların toplam değeri. */
export function aracDegeri(veri: AppData): number {
  return veri.araclar.reduce((t, a) => t + a.deger, 0);
}

/** Likit (hızla nakde çevrilebilir) varlıklar: nakit + banka + döviz + altın + gümüş.
 *  BES likit sayılmaz (erken çıkışta kayıp olur). */
export function likitVarlik(veri: AppData): number {
  return veri.varliklar.nakit + veri.varliklar.banka + dovizDegeri(veri) + metalDegeri(veri);
}

/** Tüm varlıkların toplamı (borçlar düşülmeden). */
export function toplamVarlik(veri: AppData): number {
  return (
    likitVarlik(veri) +
    piyasaVarligi(veri) +
    veri.varliklar.bes +
    veri.varliklar.alacaklar +
    gayrimenkulDegeri(veri) +
    aracDegeri(veri) +
    veri.varliklar.diger
  );
}

/** Taksitli alışverişlerin kalan toplam borcu (taksit × kalan ay). */
export function taksitKalanBorc(veri: AppData): number {
  return veri.taksitler.reduce((t, x) => t + x.aylikTaksit * Math.max(0, x.kalanAy), 0);
}

export function toplamBorc(veri: AppData): number {
  return veri.borclar.reduce((t, b) => t + b.kalan, 0) + taksitKalanBorc(veri);
}

/** Net değer = varlıklar − kalan borçlar. */
export function netDeger(veri: AppData): number {
  return toplamVarlik(veri) - toplamBorc(veri);
}

/** Kiraya verilen evlerden gelen aylık kira geliri. */
export function kiraGeliri(veri: AppData): number {
  return veri.evler
    .filter((e) => e.durum === 'kirada')
    .reduce((t, e) => t + e.aylikKira, 0);
}

/** Kiracı olarak ödenen aylık kira. */
export function kiraGideri(veri: AppData): number {
  return veri.evler
    .filter((e) => e.durum === 'kiraci')
    .reduce((t, e) => t + e.aylikKira, 0);
}

/** Aylık toplam gelir. Eş maaşı yalnızca evliyken, alınan nafaka yalnızca boşanmışken sayılır. */
export function aylikGelir(veri: AppData): number {
  const esMaas = veri.profil.medeniHal === 'evli' ? veri.gelir.esMaas : 0;
  const nafaka = veri.profil.medeniHal === 'bosanmis' ? veri.gelir.nafakaAlinan : 0;
  return veri.gelir.maas + esMaas + veri.gelir.ekGelir + nafaka + kiraGeliri(veri);
}

/** Kredi taksitleri + taksitli alışveriş taksitleri (aylık toplam). */
export function aylikTaksitler(veri: AppData): number {
  const krediler = veri.borclar.reduce((t, b) => t + b.taksit, 0);
  const alisverisler = veri.taksitler.reduce(
    (t, x) => t + (x.kalanAy > 0 ? x.aylikTaksit : 0),
    0,
  );
  return krediler + alisverisler;
}

export interface GiderDokumu {
  sabit: number;
  sigorta: number;
  kira: number;
  ulasim: number; // araç giderleri + toplu taşıma
  evcil: number;
  cocuk: number;
  aile: number; // eşe verilen para (evli) + ödenen nafaka (boşanmış)
  taksitler: number;
  toplam: number;
}

/** Aylık giderlerin dökümü. Profil filtresine uyar:
 *  araç giderleri yalnızca araç varsa, toplu taşıma her durumda;
 *  çocuk giderleri yalnızca uygun yaş bandında çocuk varsa;
 *  yıllık girilen kalemler 12'ye bölünür. */
export function giderDokumu(veri: AppData): GiderDokumu {
  const s = veri.giderler.sabit;
  const sabit =
    s.faturalar + s.aidat + s.market + s.abonelikler + s.saglik + s.eglence + s.giyim + s.diger;

  const sigorta = veri.giderler.yillikSigortalar / 12;

  const kira = kiraGideri(veri);

  const aracVar = veri.araclar.length > 0;
  const a = veri.giderler.arac;
  const ulasim =
    (aracVar ? a.yakit + a.otopark + a.yillikSigortaBakim / 12 : 0) + veri.giderler.topluTasima;

  const evcilIdler = new Set(veri.profil.evciller.map((e) => e.id));
  const evcil = veri.giderler.evcil
    .filter((g) => evcilIdler.has(g.evcilId))
    .reduce((t, g) => t + g.aylikMama + g.aylikKumTimar + g.yillikVeteriner / 12, 0);

  const c = veri.giderler.cocuk;
  const cocuklar = veri.profil.cocuklar;
  const cocuk =
    (bantUygunMu(cocuklar, 'bezMama') ? c.bezMama : 0) +
    (bantUygunMu(cocuklar, 'kresBakici') ? c.kresBakici : 0) +
    (bantUygunMu(cocuklar, 'okulKirtasiye') ? c.okulKirtasiye : 0) +
    (bantUygunMu(cocuklar, 'harclik') ? c.harclik : 0) +
    (bantUygunMu(cocuklar, 'universite') ? c.universite : 0);

  const aile =
    (veri.profil.medeniHal === 'evli' ? veri.giderler.esHarcligi : 0) +
    (veri.profil.medeniHal === 'bosanmis' ? veri.giderler.nafakaOdenen : 0);

  const taksitler = aylikTaksitler(veri);

  return {
    sabit,
    sigorta,
    kira,
    ulasim,
    evcil,
    cocuk,
    aile,
    taksitler,
    toplam: sabit + sigorta + kira + ulasim + evcil + cocuk + aile + taksitler,
  };
}

export function aylikGider(veri: AppData): number {
  return giderDokumu(veri).toplam;
}

/** Aylık nakit akışı = gelir − gider. Negatifse "ay sonu açık veriyor". */
export function nakitAkisi(veri: AppData): number {
  return aylikGelir(veri) - aylikGider(veri);
}

/** Varlık dağılımı sepetleri — puan motoru ve grafikler bunu kullanır. */
export function dagilimSepetleri(veri: AppData): Array<{ ad: string; deger: number }> {
  return [
    { ad: 'nakit ve banka', deger: veri.varliklar.nakit + veri.varliklar.banka },
    { ad: 'döviz', deger: dovizDegeri(veri) },
    { ad: 'altın ve gümüş', deger: metalDegeri(veri) },
    { ad: 'hisse, fon ve kripto', deger: piyasaVarligi(veri) },
    { ad: 'BES', deger: veri.varliklar.bes },
    { ad: 'gayrimenkul', deger: gayrimenkulDegeri(veri) },
  ];
}
