// Finansal puan motoru — 100 üzerinden, dört bileşenli, gerekçeli.
// UYARI: Bu puan bir yatırım tavsiyesi değildir; yalnızca kullanıcının
// kendi girdiği verilerin matematiksel bir özetidir.

import type { AppData } from '../model/types';
import {
  aylikGelir,
  aylikGider,
  aylikTaksitler,
  dagilimSepetleri,
  likitVarlik,
} from './finance';
import { VARSAYILAN_PUAN_AYARLARI, type PuanAyarlari } from './scoreConfig';

export interface PuanBileseni {
  anahtar: 'tasarruf' | 'borc' | 'acilFon' | 'dagilim';
  baslik: string;
  puan: number; // 0..agirlik
  agirlik: number;
  aciklama: string; // kullanıcıya gösterilen gerekçe
}

export interface PuanSonucu {
  toplam: number; // 0..100
  bilesenler: PuanBileseni[];
}

function yuzde(x: number): string {
  return `%${Math.round(x * 100)}`;
}

function kirp(x: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, x));
}

export function tasarrufBileseni(veri: AppData, ayar: PuanAyarlari): PuanBileseni {
  const agirlik = ayar.agirliklar.tasarruf;
  const gelir = aylikGelir(veri);
  const gider = aylikGider(veri);

  if (gelir <= 0) {
    return {
      anahtar: 'tasarruf',
      baslik: 'Tasarruf oranı',
      puan: 0,
      agirlik,
      aciklama: 'Aylık gelir girilmediği için tasarruf oranı hesaplanamadı.',
    };
  }

  const oran = (gelir - gider) / gelir;
  const puan = Math.round(kirp(oran / ayar.hedefTasarrufOrani) * agirlik);
  const aciklama =
    oran <= 0
      ? `Giderlerin gelirini aşıyor (ay sonu ${yuzde(-oran)} açık). Önce nakit akışını artıya çevirmek gerekiyor.`
      : oran >= ayar.hedefTasarrufOrani
        ? `Gelirinin ${yuzde(oran)}'i sana kalıyor — ${yuzde(ayar.hedefTasarrufOrani)} hedefinin üzerindesin.`
        : `Gelirinin ${yuzde(oran)}'i sana kalıyor, hedef ${yuzde(ayar.hedefTasarrufOrani)}.`;

  return { anahtar: 'tasarruf', baslik: 'Tasarruf oranı', puan, agirlik, aciklama };
}

export function borcBileseni(veri: AppData, ayar: PuanAyarlari): PuanBileseni {
  const agirlik = ayar.agirliklar.borc;
  const gelir = aylikGelir(veri);
  const taksit = aylikTaksitler(veri);

  if (taksit === 0) {
    return {
      anahtar: 'borc',
      baslik: 'Borç yükü',
      puan: agirlik,
      agirlik,
      aciklama: 'Aylık taksit ödemen yok — borç yükün sıfır.',
    };
  }
  if (gelir <= 0) {
    return {
      anahtar: 'borc',
      baslik: 'Borç yükü',
      puan: 0,
      agirlik,
      aciklama: 'Gelir girilmeden borç yükü oranı hesaplanamıyor; taksitlerin gelirsiz görünüyor.',
    };
  }

  const oran = taksit / gelir;
  const puan = Math.round(kirp(1 - oran / ayar.riskliBorcOrani) * agirlik);
  const aciklama =
    oran >= ayar.riskliBorcOrani
      ? `Taksitlerin (kredi + taksitli alışveriş) gelirinin ${yuzde(oran)}'ini götürüyor — ${yuzde(ayar.riskliBorcOrani)} üzeri riskli kabul edilir.`
      : `Taksitlerin (kredi + taksitli alışveriş) gelirinin ${yuzde(oran)}'ini götürüyor; ${yuzde(ayar.riskliBorcOrani)} riskli eşiğinin altındasın.`;

  return { anahtar: 'borc', baslik: 'Borç yükü', puan, agirlik, aciklama };
}

export function acilFonBileseni(veri: AppData, ayar: PuanAyarlari): PuanBileseni {
  const agirlik = ayar.agirliklar.acilFon;
  const likit = likitVarlik(veri);
  const gider = aylikGider(veri);

  if (gider <= 0) {
    return {
      anahtar: 'acilFon',
      baslik: 'Acil durum fonu',
      puan: likit > 0 ? agirlik : 0,
      agirlik,
      aciklama:
        likit > 0
          ? 'Aylık giderin girilmemiş; eldeki likit varlıkla fon yeterli varsayıldı.'
          : 'Likit varlık ve gider bilgisi olmadan acil durum fonu değerlendirilemedi.',
    };
  }

  const ay = likit / gider;
  const puan = Math.round(kirp(ay / ayar.hedefAcilFonAy) * agirlik);
  const ayStr = ay >= 10 ? Math.round(ay).toString() : (Math.round(ay * 10) / 10).toString().replace('.', ',');
  const aciklama =
    ay >= ayar.hedefAcilFonAy
      ? `Likit varlıkların (nakit + banka + döviz + altın/gümüş) ${ayStr} aylık giderini karşılıyor — ${ayar.hedefAcilFonAy} ay hedefini tutturmuşsun.`
      : `Likit varlıkların (nakit + banka + döviz + altın/gümüş) ${ayStr} aylık giderini karşılıyor, hedef ${ayar.hedefAcilFonAy} ay.`;

  return { anahtar: 'acilFon', baslik: 'Acil durum fonu', puan, agirlik, aciklama };
}

export function dagilimBileseni(veri: AppData, ayar: PuanAyarlari): PuanBileseni {
  const agirlik = ayar.agirliklar.dagilim;

  // Sepetler: nakit/banka, döviz, altın/gümüş, hisse-fon-kripto, BES, gayrimenkul.
  // Araçlar kişisel kullanım varlığı sayıldığı için çeşitlilik hesabına girmez.
  const sepetler = dagilimSepetleri(veri);
  const toplam = sepetler.reduce((t, s) => t + s.deger, 0);

  if (toplam <= 0) {
    return {
      anahtar: 'dagilim',
      baslik: 'Varlık dağılımı',
      puan: 0,
      agirlik,
      aciklama: 'Henüz yatırılabilir varlık girilmediği için dağılım değerlendirilemedi.',
    };
  }

  // Herfindahl endeksi: paylar ne kadar tek kalemde toplanırsa 1'e yaklaşır.
  // Tüm sepetlere eşit dağılım -> tam puan; tek sepet -> 0 puan.
  const hhi = sepetler.reduce((t, s) => t + (s.deger / toplam) ** 2, 0);
  const nSepet = sepetler.length;
  const skor = kirp((1 - hhi) / (1 - 1 / nSepet));
  const puan = Math.round(skor * agirlik);

  const enBuyuk = sepetler.reduce((a, b) => (b.deger > a.deger ? b : a));
  const enBuyukPay = enBuyuk.deger / toplam;
  const aciklama =
    enBuyukPay >= 0.9
      ? `Varlıklarının ${yuzde(enBuyukPay)}'i tek kalemde (${enBuyuk.ad}) toplanmış; dağılım çeşitlendikçe bu puan yükselir.`
      : `En büyük kalemin ${enBuyuk.ad} (${yuzde(enBuyukPay)}); dağılım çeşitlendikçe puan yükselir.`;

  return { anahtar: 'dagilim', baslik: 'Varlık dağılımı', puan, agirlik, aciklama };
}

export function puanHesapla(
  veri: AppData,
  ayar: PuanAyarlari = VARSAYILAN_PUAN_AYARLARI,
): PuanSonucu {
  const bilesenler = [
    tasarrufBileseni(veri, ayar),
    borcBileseni(veri, ayar),
    acilFonBileseni(veri, ayar),
    dagilimBileseni(veri, ayar),
  ];
  return {
    toplam: bilesenler.reduce((t, b) => t + b.puan, 0),
    bilesenler,
  };
}
