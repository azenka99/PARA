import type { AppData, AvatarConfig } from './types';

let sayac = 0;
/** Basit benzersiz kimlik üretici (cihaz içi kullanım için yeterli). */
export function yeniId(): string {
  sayac += 1;
  return `${Date.now().toString(36)}-${sayac}-${Math.random().toString(36).slice(2, 8)}`;
}

export const CILT_TONLARI = [
  '#ffe0c7',
  '#f5c9a4',
  '#e0a878',
  '#c68a53',
  '#9c6a3c',
  '#6f4a28',
];

export const SAC_RENKLERI = [
  '#2d2320',
  '#4a3222',
  '#8a5a2b',
  '#c98a3d',
  '#e8c56a',
  '#b0b0b8',
  '#a34d6e',
  '#3c4a63',
];

export const KIYAFET_RENKLERI = [
  '#31548e',
  '#8a2f4f',
  '#c98f2b',
  '#2e7d5e',
  '#3d7ea6',
  '#b45f3c',
  '#4a4a68',
  '#26303f',
];

export function varsayilanAvatar(): AvatarConfig {
  return {
    ciltTonu: CILT_TONLARI[1],
    sacStili: 'kisa',
    sacRengi: SAC_RENKLERI[0],
    bedenTipi: 'orta',
    kiyafetRengi: KIYAFET_RENKLERI[0],
    aksesuarlar: [],
  };
}

export const VERI_SURUMU = 2;

export function varsayilanVeri(): AppData {
  return {
    surum: VERI_SURUMU,
    kurulumTamam: false,
    profil: {
      ad: '',
      medeniHal: 'bekar',
      avatar: varsayilanAvatar(),
      esAd: '',
      esAvatar: null,
      cocuklar: [],
      evciller: [],
    },
    evler: [],
    araclar: [],
    varliklar: {
      nakit: 0,
      banka: 0,
      altinGram: 0,
      altinGramFiyat: 0,
      gumusGram: 0,
      gumusGramFiyat: 0,
      yatirimlar: [],
      dovizler: [],
      kripto: 0,
      bes: 0,
      alacaklar: 0,
      diger: 0,
      fiyatGuncelleme: null,
    },
    gelir: { maas: 0, esMaas: 0, ekGelir: 0, nafakaAlinan: 0 },
    giderler: {
      sabit: {
        faturalar: 0,
        aidat: 0,
        market: 0,
        abonelikler: 0,
        saglik: 0,
        eglence: 0,
        giyim: 0,
        diger: 0,
      },
      yillikSigortalar: 0,
      topluTasima: 0,
      arac: { yakit: 0, otopark: 0, yillikSigortaBakim: 0 },
      evcil: [],
      cocuk: { bezMama: 0, kresBakici: 0, okulKirtasiye: 0, harclik: 0, universite: 0 },
      nafakaOdenen: 0,
      esHarcligi: 0,
    },
    borclar: [],
    taksitler: [],
    gecmis: [],
  };
}
