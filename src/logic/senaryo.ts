// Senaryo motoru — "şunu yapsam ne olur?" hesapları.
// Tüm hesaplar kullanıcının verisinin GEÇİCİ bir kopyası üzerinde yapılır;
// gerçek veri asla değişmez. Çekirdek mantık matematikseldir (kredi taksit
// formülü, oran analizleri); yatırım tavsiyesi üretilmez.

import type { AppData } from '../model/types';
import {
  aylikGelir,
  aylikGider,
  aylikTaksitler,
  kiraGideri,
  likitVarlik,
  nakitAkisi,
} from './finance';
import { tl } from './format';

/** Eşit taksitli (annüite) kredi taksiti. Faiz: aylık yüzde (örn. 3 → %3). */
export function krediTaksiti(anapara: number, aylikFaizYuzde: number, vadeAy: number): number {
  if (anapara <= 0 || vadeAy <= 0) return 0;
  const r = aylikFaizYuzde / 100;
  if (r === 0) return anapara / vadeAy;
  return (anapara * r) / (1 - Math.pow(1 + r, -vadeAy));
}

export type Hukum = 'iyi' | 'dikkat' | 'riskli';

/** Acil fonu 3 ayın altına düşürmeden ayrılabilecek en yüksek peşinat. */
export function guvenliPesinat(veri: AppData): number {
  return Math.max(0, likitVarlik(veri) - 3 * aylikGider(veri));
}

/** "Beklesem?" hesabı: acil fonu (3 ay) koruyarak hedef tutarı biriktirmek
 *  kaç ay sürer? null: mevcut nakit akışıyla ulaşılamıyor. */
export function beklersenAy(veri: AppData, hedefTutar: number): number | null {
  const akis = nakitAkisi(veri);
  const eksik = hedefTutar + 3 * aylikGider(veri) - likitVarlik(veri);
  if (eksik <= 0) return 0;
  if (akis <= 0) return null;
  const ay = Math.ceil(eksik / akis);
  return ay <= 600 ? ay : null;
}

export interface SenaryoSatiri {
  ad: string;
  deger: string;
  vurgu?: 'iyi' | 'kotu';
}

export interface SenaryoSonucu {
  hukum: Hukum;
  ozet: string;
  satirlar: SenaryoSatiri[];
}

function hukumVer(yeniAkis: number, borcYuku: number, acilFonAy: number): Hukum {
  if (yeniAkis < 0 || borcYuku >= 0.4 || acilFonAy < 1) return 'riskli';
  if (borcYuku >= 0.25 || acilFonAy < 3) return 'dikkat';
  return 'iyi';
}

/** Araç (veya benzeri büyük harcama) kredili alım senaryosu. */
export function aracSenaryosu(
  veri: AppData,
  girdi: { fiyat: number; pesinat: number; aylikFaiz: number; vadeAy: number },
): SenaryoSonucu | null {
  if (girdi.fiyat <= 0) return null;
  const pesinat = Math.min(girdi.pesinat, girdi.fiyat);
  const krediTutari = girdi.fiyat - pesinat;
  const taksit = krediTaksiti(krediTutari, girdi.aylikFaiz, girdi.vadeAy);

  const gelir = aylikGelir(veri);
  const gider = aylikGider(veri);
  const yeniAkis = nakitAkisi(veri) - taksit;
  const yeniBorcYuku = gelir > 0 ? (aylikTaksitler(veri) + taksit) / gelir : 1;
  const kalanLikit = likitVarlik(veri) - pesinat;
  const acilFonAy = gider > 0 ? kalanLikit / gider : kalanLikit > 0 ? 99 : 0;

  const hukum = kalanLikit < 0 ? 'riskli' : hukumVer(yeniAkis, yeniBorcYuku, acilFonAy);

  const ozet =
    kalanLikit < 0
      ? 'Peşinat, likit varlığınızdan fazla — bu alım şu an mümkün görünmüyor.'
      : hukum === 'iyi'
        ? 'Bu alım mevcut bütçenizi zorlamıyor görünüyor.'
        : hukum === 'dikkat'
          ? 'Alım mümkün ama bütçenizi hissedilir biçimde sıkıştırıyor — taksit veya peşinatı yeniden düşünmeye değer.'
          : 'Bu haliyle alım bütçenizi tehlikeli biçimde zorluyor.';

  return {
    hukum,
    ozet,
    satirlar: [
      { ad: 'Aylık taksit', deger: tl(taksit) },
      { ad: 'Ay sonu kalan (yeni)', deger: tl(yeniAkis), vurgu: yeniAkis >= 0 ? 'iyi' : 'kotu' },
      { ad: 'Borç yükü (yeni)', deger: `%${Math.round(yeniBorcYuku * 100)}`, vurgu: yeniBorcYuku < 0.4 ? undefined : 'kotu' },
      { ad: 'Peşinat sonrası acil fon', deger: `${(Math.round(Math.max(0, acilFonAy) * 10) / 10).toString().replace('.', ',')} ay` },
      { ad: 'Toplam geri ödeme', deger: tl(pesinat + taksit * girdi.vadeAy) },
    ],
  };
}

/** Ev alma senaryosu — kiracıysa "kira yerine taksit" karşılaştırması yapılır. */
export function evSenaryosu(
  veri: AppData,
  girdi: { fiyat: number; pesinat: number; aylikFaiz: number; vadeAy: number },
): SenaryoSonucu | null {
  if (girdi.fiyat <= 0) return null;
  const pesinat = Math.min(girdi.pesinat, girdi.fiyat);
  const krediTutari = girdi.fiyat - pesinat;
  const taksit = krediTaksiti(krediTutari, girdi.aylikFaiz, girdi.vadeAy);

  const mevcutKira = kiraGideri(veri);
  const gelir = aylikGelir(veri);
  const gider = aylikGider(veri);
  // Ev alınca kiracılık biter: kira düşer, taksit gelir.
  const yeniAkis = nakitAkisi(veri) + mevcutKira - taksit;
  const yeniBorcYuku = gelir > 0 ? (aylikTaksitler(veri) + taksit) / gelir : 1;
  const kalanLikit = likitVarlik(veri) - pesinat;
  const yeniGider = gider - mevcutKira + taksit;
  const acilFonAy = yeniGider > 0 ? kalanLikit / yeniGider : 99;

  const hukum = kalanLikit < 0 ? 'riskli' : hukumVer(yeniAkis, yeniBorcYuku, acilFonAy);

  const satirlar: SenaryoSatiri[] = [
    { ad: 'Aylık taksit', deger: tl(taksit) },
  ];
  if (mevcutKira > 0) {
    satirlar.push({
      ad: 'Bugünkü kiranızla fark',
      deger: `${taksit >= mevcutKira ? '+' : '−'}${tl(Math.abs(taksit - mevcutKira))}/ay`,
      vurgu: taksit <= mevcutKira ? 'iyi' : undefined,
    });
  }
  satirlar.push(
    { ad: 'Ay sonu kalan (yeni)', deger: tl(yeniAkis), vurgu: yeniAkis >= 0 ? 'iyi' : 'kotu' },
    { ad: 'Borç yükü (yeni)', deger: `%${Math.round(yeniBorcYuku * 100)}`, vurgu: yeniBorcYuku < 0.4 ? undefined : 'kotu' },
    { ad: 'Peşinat sonrası acil fon', deger: `${(Math.round(Math.max(0, acilFonAy) * 10) / 10).toString().replace('.', ',')} ay` },
    { ad: 'Toplam geri ödeme', deger: tl(pesinat + taksit * girdi.vadeAy) },
    { ad: 'Net değerinize eklenen', deger: tl(girdi.fiyat), vurgu: 'iyi' },
  );

  const ozet =
    kalanLikit < 0
      ? 'Peşinat, likit varlığınızdan fazla — önce peşinatı biriktirmek gerekiyor.'
      : mevcutKira > 0 && taksit <= mevcutKira * 1.2 && hukum !== 'riskli'
        ? 'Taksit, bugünkü kiranıza yakın — kirayı mülke çevirmek bu tabloyla makul görünüyor.'
        : hukum === 'iyi'
          ? 'Bu alım bütçenize sığıyor görünüyor.'
          : hukum === 'dikkat'
            ? 'Mümkün ama bütçeniz sıkışıyor; vade/peşinat dengesini yeniden kurmak rahatlatır.'
            : 'Bu haliyle alım bütçenizi ciddi zorluyor.';

  return { hukum, ozet, satirlar };
}

/** "Peşin mi alsam, kredi mi çeksem?" karşılaştırması. */
export function pesinMiKrediMi(
  veri: AppData,
  girdi: { tutar: number; aylikFaiz: number; vadeAy: number },
): SenaryoSonucu | null {
  if (girdi.tutar <= 0) return null;
  const gider = aylikGider(veri);
  const likit = likitVarlik(veri);

  const taksit = krediTaksiti(girdi.tutar, girdi.aylikFaiz, girdi.vadeAy);
  const toplamFaiz = taksit * girdi.vadeAy - girdi.tutar;

  const pesinKalanLikit = likit - girdi.tutar;
  const pesinAcilAy = gider > 0 ? pesinKalanLikit / gider : pesinKalanLikit > 0 ? 99 : 0;
  const krediYeniAkis = nakitAkisi(veri) - taksit;

  const pesinMumkun = pesinKalanLikit >= 0;
  const pesinGuvenli = gider > 0 ? pesinAcilAy >= 3 : pesinMumkun;

  let hukum: Hukum;
  let ozet: string;
  if (!pesinMumkun) {
    hukum = krediYeniAkis >= 0 ? 'dikkat' : 'riskli';
    ozet = 'Peşin ödeyecek likit varlığınız yok; tek yol kredi — taksitin bütçeye etkisine dikkat.';
  } else if (pesinGuvenli) {
    hukum = 'iyi';
    ozet = `Peşin ödemek ${tl(toplamFaiz)} faiz maliyetinden kurtarır ve acil fonunuz yine de ${(Math.round(pesinAcilAy * 10) / 10).toString().replace('.', ',')} ay dayanır — matematiksel olarak peşin daha avantajlı görünüyor.`;
  } else {
    hukum = 'dikkat';
    ozet = 'Peşin ödemek faizden kurtarır ama acil fonunuzu 3 ayın altına düşürür; kredi çekmek pahalı, peşin ödemek risklidir. Kısmen peşin + kısa vadeli kredi bir orta yol olabilir.';
  }

  return {
    hukum,
    ozet,
    satirlar: [
      { ad: 'Kredi taksiti', deger: `${tl(taksit)} × ${girdi.vadeAy} ay` },
      { ad: 'Kredinin toplam faiz maliyeti', deger: tl(toplamFaiz), vurgu: 'kotu' },
      { ad: 'Peşin ödersen kalan likit', deger: tl(pesinKalanLikit), vurgu: pesinKalanLikit >= 0 ? undefined : 'kotu' },
      { ad: 'Peşin sonrası acil fon', deger: `${(Math.round(Math.max(0, pesinAcilAy) * 10) / 10).toString().replace('.', ',')} ay` },
      { ad: 'Kredi çekersen ay sonu kalan', deger: tl(krediYeniAkis), vurgu: krediYeniAkis >= 0 ? undefined : 'kotu' },
    ],
  };
}

/** Birikim hedefi: hedef tutara, aylık birikimle (reel getiri dahil) ne zaman ulaşılır? */
export function birikimHedefi(
  veri: AppData,
  girdi: { hedefTutar: number; aylikBirikim: number; yillikGetiri: number },
): SenaryoSonucu | null {
  if (girdi.hedefTutar <= 0 || girdi.aylikBirikim <= 0) return null;

  const r = Math.pow(1 + girdi.yillikGetiri, 1 / 12) - 1;
  let ay: number;
  if (r === 0) {
    ay = Math.ceil(girdi.hedefTutar / girdi.aylikBirikim);
  } else {
    ay = Math.ceil(
      Math.log((girdi.hedefTutar * r) / girdi.aylikBirikim + 1) / Math.log(1 + r),
    );
  }

  const mevcutAkis = nakitAkisi(veri);
  const surdurulebilir = girdi.aylikBirikim <= Math.max(0, mevcutAkis);
  const yil = Math.floor(ay / 12);
  const kalanAy = ay % 12;
  const sure = yil > 0 ? `${yil} yıl${kalanAy > 0 ? ` ${kalanAy} ay` : ''}` : `${kalanAy} ay`;

  return {
    hukum: surdurulebilir ? 'iyi' : 'dikkat',
    ozet: surdurulebilir
      ? `Bu birikim temposu mevcut ay sonu artanınıza (${tl(Math.max(0, mevcutAkis))}) sığıyor.`
      : `Hedeflediğiniz aylık birikim (${tl(girdi.aylikBirikim)}), mevcut ay sonu artanınızın (${tl(Math.max(0, mevcutAkis))}) üzerinde — önce aradaki farkı kapatmak gerekir.`,
    satirlar: [
      { ad: 'Hedefe ulaşma süresi', deger: sure, vurgu: 'iyi' },
      { ad: 'Toplam yatırdığınız', deger: tl(girdi.aylikBirikim * ay) },
      {
        ad: 'Getirinin katkısı',
        deger: tl(Math.max(0, girdi.hedefTutar - girdi.aylikBirikim * ay)),
      },
    ],
  };
}
