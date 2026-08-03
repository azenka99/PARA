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
  '#d95c8a',
  '#7c5cff',
];

export const KIYAFET_RENKLERI = [
  '#7c5cff',
  '#ff7ab8',
  '#ffc93c',
  '#3ddc97',
  '#5cc8ff',
  '#ff8a5c',
  '#5c6bff',
  '#2d3142',
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

export const VERI_SURUMU = 1;

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
      hisseler: [],
      fonEtf: 0,
      kripto: 0,
      diger: 0,
    },
    gelir: { maas: 0, esMaas: 0, ekGelir: 0 },
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
      topluTasima: 0,
      arac: { yakit: 0, otopark: 0, yillikSigortaBakim: 0 },
      evcil: [],
      cocuk: { bezMama: 0, kresBakici: 0, okulKirtasiye: 0, harclik: 0 },
    },
    borclar: [],
  };
}
