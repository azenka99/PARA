// Puan motorunun yapılandırması.
// Ağırlıklar ve eşikler ürün geliştikçe burada ayarlanır — kodun içine gömülü değildir.

export interface PuanAyarlari {
  agirliklar: {
    tasarruf: number;
    borc: number;
    acilFon: number;
    dagilim: number;
  };
  /** Hedef tasarruf oranı: (gelir − gider) / gelir. */
  hedefTasarrufOrani: number;
  /** Bu orana ulaşan/aşan borç yükü (taksit/gelir) 0 puan alır. */
  riskliBorcOrani: number;
  /** Acil durum fonu hedefi: kaç aylık gideri karşılamalı. */
  hedefAcilFonAy: number;
}

export const VARSAYILAN_PUAN_AYARLARI: PuanAyarlari = {
  agirliklar: { tasarruf: 30, borc: 25, acilFon: 25, dagilim: 20 },
  hedefTasarrufOrani: 0.25,
  riskliBorcOrani: 0.4,
  hedefAcilFonAy: 6,
};
