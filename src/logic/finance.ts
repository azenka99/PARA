// Finansal hesap motoru — saf fonksiyonlar, arayüzden bağımsız.
// Tüm sonuçlar TL cinsinden aylık değerlerdir (net değer hariç).

import type { AppData, Cocuk } from '../model/types';

/** Profil filtre kuralları — hangi çocuk gider kalemleri hangi yaşlarda sorulur. */
export const YAS_BANTLARI = {
  bezMama: { min: 0, max: 3 },
  kresBakici: { min: 0, max: 5 },
  okulKirtasiye: { min: 6, max: 18 },
  harclik: { min: 6, max: 25 },
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

/** Hisselerin toplam TL değeri. */
export function hisseDegeri(veri: AppData): number {
  return veri.varliklar.hisseler.reduce((t, h) => t + h.lot * h.fiyat, 0);
}

/** Borsa/piyasa varlıkları: hisse + fon/ETF + kripto. */
export function piyasaVarligi(veri: AppData): number {
  return hisseDegeri(veri) + veri.varliklar.fonEtf + veri.varliklar.kripto;
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

/** Likit (hızla nakde çevrilebilir) varlıklar: nakit + banka + altın. */
export function likitVarlik(veri: AppData): number {
  return veri.varliklar.nakit + veri.varliklar.banka + altinDegeri(veri);
}

/** Tüm varlıkların toplamı (borçlar düşülmeden). */
export function toplamVarlik(veri: AppData): number {
  return (
    likitVarlik(veri) +
    piyasaVarligi(veri) +
    gayrimenkulDegeri(veri) +
    aracDegeri(veri) +
    veri.varliklar.diger
  );
}

export function toplamBorc(veri: AppData): number {
  return veri.borclar.reduce((t, b) => t + b.kalan, 0);
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

/** Aylık toplam gelir. Eş maaşı yalnızca evliyken hesaba katılır. */
export function aylikGelir(veri: AppData): number {
  const esMaas = veri.profil.medeniHal === 'evli' ? veri.gelir.esMaas : 0;
  return veri.gelir.maas + esMaas + veri.gelir.ekGelir + kiraGeliri(veri);
}

export function aylikTaksitler(veri: AppData): number {
  return veri.borclar.reduce((t, b) => t + b.taksit, 0);
}

export interface GiderDokumu {
  sabit: number;
  kira: number;
  ulasim: number; // araç giderleri veya toplu taşıma
  evcil: number;
  cocuk: number;
  taksitler: number;
  toplam: number;
}

/** Aylık giderlerin dökümü. Profil filtresine uyar:
 *  araç varsa araç giderleri, yoksa toplu taşıma;
 *  çocuk giderleri yalnızca uygun yaş bandında çocuk varsa;
 *  yıllık girilen kalemler 12'ye bölünür. */
export function giderDokumu(veri: AppData): GiderDokumu {
  const s = veri.giderler.sabit;
  const sabit =
    s.faturalar + s.aidat + s.market + s.abonelikler + s.saglik + s.eglence + s.giyim + s.diger;

  const kira = kiraGideri(veri);

  const aracVar = veri.araclar.length > 0;
  const a = veri.giderler.arac;
  const ulasim = aracVar
    ? a.yakit + a.otopark + a.yillikSigortaBakim / 12
    : veri.giderler.topluTasima;

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
    (bantUygunMu(cocuklar, 'harclik') ? c.harclik : 0);

  const taksitler = aylikTaksitler(veri);

  return {
    sabit,
    kira,
    ulasim,
    evcil,
    cocuk,
    taksitler,
    toplam: sabit + kira + ulasim + evcil + cocuk + taksitler,
  };
}

export function aylikGider(veri: AppData): number {
  return giderDokumu(veri).toplam;
}

/** Aylık nakit akışı = gelir − gider. Negatifse "ay sonu açık veriyor". */
export function nakitAkisi(veri: AppData): number {
  return aylikGelir(veri) - aylikGider(veri);
}
