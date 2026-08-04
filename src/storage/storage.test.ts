import { describe, expect, it } from 'vitest';
import { veriTasima } from './storage';
import { VERI_SURUMU } from '../model/defaults';

describe('veri göçü (v1 -> v2)', () => {
  it('eski hisseler ve fonEtf tek yatırım listesine taşınır', () => {
    const v1 = {
      surum: 1,
      kurulumTamam: true,
      profil: { ad: 'Test', medeniHal: 'bekar' },
      varliklar: {
        nakit: 1000,
        banka: 2000,
        altinGram: 10,
        altinGramFiyat: 3000,
        hisseler: [{ id: 'h1', kod: 'THYAO', lot: 100, fiyat: 300 }],
        fonEtf: 50000,
        kripto: 5000,
        diger: 0,
      },
      gelir: { maas: 50000, esMaas: 0, ekGelir: 0 },
      evler: [],
      araclar: [{ id: 'a1', marka: 'Fiat', model: 'Egea', deger: 900000 }],
      borclar: [],
    };
    const v2 = veriTasima(v1);

    expect(v2.surum).toBe(VERI_SURUMU);
    expect(v2.varliklar.yatirimlar).toHaveLength(2);
    expect(v2.varliklar.yatirimlar[0]).toMatchObject({ ad: 'THYAO', tur: 'hisse', deger: 30000 });
    expect(v2.varliklar.yatirimlar[1]).toMatchObject({ ad: 'Fon toplamı', tur: 'fon', deger: 50000 });
    expect((v2.varliklar as any).hisseler).toBeUndefined();
    expect((v2.varliklar as any).fonEtf).toBeUndefined();
  });

  it('eski araçlara tür alanı eklenir, yeni alanlar varsayılan alır', () => {
    const v2 = veriTasima({
      surum: 1,
      profil: { ad: 'X' },
      araclar: [{ id: 'a1', marka: 'Fiat', model: 'Egea', deger: 900000 }],
    });
    expect(v2.araclar[0].tur).toBe('araba');
    expect(v2.varliklar.gumusGram).toBe(0);
    expect(v2.varliklar.dovizler).toEqual([]);
    expect(v2.varliklar.bes).toBe(0);
    expect(v2.taksitler).toEqual([]);
    expect(v2.gecmis).toEqual([]);
    expect(v2.hedefler).toEqual({ rahatAylik: 0, pasifGelirAylik: 0 });
    expect(v2.profil.dogumYili).toBeNull();
    expect(v2.giderler.cocuk.universite).toBe(0);
    expect(v2.giderler.nafakaOdenen).toBe(0);
    expect(v2.gelir.nafakaAlinan).toBe(0);
    expect(v2.profil.ad).toBe('X');
    expect(v2.kurulumTamam).toBe(false);
  });

  it('bozuk girdi varsayılan veri döndürür', () => {
    expect(veriTasima(null).profil.ad).toBe('');
    expect(veriTasima('çöp').surum).toBe(VERI_SURUMU);
  });

  it('v2 verisi olduğu gibi korunur', () => {
    const v2ilk = veriTasima({
      surum: 2,
      profil: { ad: 'Y', medeniHal: 'evli' },
      varliklar: { yatirimlar: [{ id: 'y1', ad: 'Fon A', tur: 'fon', deger: 1000 }], dovizler: [] },
      taksitler: [{ id: 't1', ad: 'Telefon', aylikTaksit: 500, kalanAy: 3 }],
    });
    expect(v2ilk.varliklar.yatirimlar).toHaveLength(1);
    expect(v2ilk.taksitler[0].ad).toBe('Telefon');
  });
});
