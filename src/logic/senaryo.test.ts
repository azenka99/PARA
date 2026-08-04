import { describe, expect, it } from 'vitest';
import { varsayilanVeri } from '../model/defaults';
import { aracSenaryosu, birikimHedefi, krediTaksiti, pesinMiKrediMi } from './senaryo';
import { ozgurlukHesapla, planOlustur, uretkenVarlik, yasHesapla } from './plan';
import type { AppData } from '../model/types';

describe('kredi taksiti (annüite)', () => {
  it('bilinen değeri doğru hesaplar (100.000 TL, %3 aylık, 12 ay)', () => {
    const taksit = krediTaksiti(100000, 3, 12);
    expect(taksit).toBeCloseTo(10046.21, 0);
  });

  it('faizsiz kredi eşit bölünür', () => {
    expect(krediTaksiti(120000, 0, 12)).toBe(10000);
  });

  it('geçersiz girdide 0 döner', () => {
    expect(krediTaksiti(0, 3, 12)).toBe(0);
    expect(krediTaksiti(1000, 3, 0)).toBe(0);
  });
});

function ornekVeri(): AppData {
  const v = varsayilanVeri();
  v.gelir.maas = 100000;
  v.giderler.sabit.market = 50000;
  v.varliklar.banka = 600000;
  return v; // akış: +50.000, likit: 600.000, gider: 50.000 (12 ay acil fon)
}

describe('araç senaryosu', () => {
  it('bütçeye sığan alım "iyi" döner', () => {
    const s = aracSenaryosu(ornekVeri(), { fiyat: 500000, pesinat: 300000, aylikFaiz: 3, vadeAy: 24 });
    expect(s?.hukum).toBe('iyi');
  });

  it('likitten büyük peşinat "riskli" döner', () => {
    const s = aracSenaryosu(ornekVeri(), { fiyat: 900000, pesinat: 700000, aylikFaiz: 3, vadeAy: 24 });
    expect(s?.hukum).toBe('riskli');
  });

  it('akışı eksiye düşüren taksit "riskli" döner', () => {
    const v = ornekVeri();
    v.gelir.maas = 60000; // akış: +10.000
    const s = aracSenaryosu(v, { fiyat: 1500000, pesinat: 100000, aylikFaiz: 3.5, vadeAy: 24 });
    expect(s?.hukum).toBe('riskli');
  });
});

describe('peşin mi kredi mi', () => {
  it('bol likitte peşin önerilir ve faiz maliyeti gösterilir', () => {
    const s = pesinMiKrediMi(ornekVeri(), { tutar: 200000, aylikFaiz: 3, vadeAy: 12 });
    expect(s?.hukum).toBe('iyi');
    expect(s?.ozet).toContain('faiz');
  });

  it('acil fonu bozan peşin "dikkat" döner', () => {
    const s = pesinMiKrediMi(ornekVeri(), { tutar: 500000, aylikFaiz: 3, vadeAy: 12 });
    expect(s?.hukum).toBe('dikkat'); // kalan likit 100.000 = 2 ay < 3 ay
  });
});

describe('birikim hedefi', () => {
  it('getirisiz basit bölme', () => {
    const s = birikimHedefi(ornekVeri(), { hedefTutar: 120000, aylikBirikim: 10000, yillikGetiri: 0 });
    expect(s?.satirlar[0].deger).toBe('1 yıl');
  });

  it('akışı aşan birikim "dikkat" döner', () => {
    const s = birikimHedefi(ornekVeri(), { hedefTutar: 120000, aylikBirikim: 80000, yillikGetiri: 0 });
    expect(s?.hukum).toBe('dikkat');
  });
});

describe('plan motoru', () => {
  it('yaş doğum yılından hesaplanır', () => {
    const v = varsayilanVeri();
    v.profil.dogumYili = 1984;
    expect(yasHesapla(v, 2026)).toBe(42);
    v.profil.dogumYili = null;
    expect(yasHesapla(v, 2026)).toBeNull();
  });

  it('üretken varlık oturulan evi ve aracı saymaz, kiradaki evi sayar', () => {
    const v = ornekVeri();
    v.evler = [
      { id: 'e1', durum: 'sahibi', deger: 5000000, aylikKira: 0 },
      { id: 'e2', durum: 'kirada', deger: 3000000, aylikKira: 15000 },
    ];
    v.araclar = [{ id: 'a1', tur: 'araba', marka: 'X', model: 'Y', deger: 1000000 }];
    expect(uretkenVarlik(v)).toBe(600000 + 3000000);
  });

  it('finansal özgürlük: hedefe ulaşmışsa kalan süre 0', () => {
    const v = ornekVeri();
    v.hedefler.pasifGelirAylik = 2000; // gerekli: 24.000/0,04 = 600.000 = mevcut likit
    const o = ozgurlukHesapla(v);
    expect(o?.kalanAy).toBe(0);
    expect(o?.ilerleme).toBe(1);
  });

  it('finansal özgürlük: birikimle süre hesaplanır', () => {
    const v = ornekVeri();
    v.hedefler.pasifGelirAylik = 10000; // gerekli: 3.000.000
    const o = ozgurlukHesapla(v);
    expect(o?.kalanAy).toBeGreaterThan(0);
    expect(o?.kalanAy).toBeLessThan(60); // 600b + 50b/ay → 3M'ye ~44 ay
  });

  it('açık veren bütçede plan önce açığı gösterir', () => {
    const v = varsayilanVeri();
    v.gelir.maas = 30000;
    v.giderler.sabit.market = 50000;
    const plan = planOlustur(v);
    expect(plan[0].anahtar).toBe('acik');
  });

  it('hedef girilmemişse davet maddesi en üsttedir', () => {
    const plan = planOlustur(ornekVeri());
    expect(plan[0].anahtar).toBe('hedefYok');
  });
});
