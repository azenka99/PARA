import { describe, expect, it } from 'vitest';
import { varsayilanVeri, yeniId } from '../model/defaults';
import { puanHesapla } from './score';
import { VARSAYILAN_PUAN_AYARLARI } from './scoreConfig';
import type { AppData } from '../model/types';

function bilesen(veri: AppData, anahtar: string) {
  const sonuc = puanHesapla(veri);
  const b = sonuc.bilesenler.find((x) => x.anahtar === anahtar);
  if (!b) throw new Error('bileşen yok: ' + anahtar);
  return b;
}

describe('tasarruf bileşeni', () => {
  it('hedefe ulaşınca tam puan', () => {
    const v = varsayilanVeri();
    v.gelir.maas = 100000;
    v.giderler.sabit.market = 75000; // %25 tasarruf
    expect(bilesen(v, 'tasarruf').puan).toBe(30);
  });

  it('hedefin yarısında yarı puan (doğrusal)', () => {
    const v = varsayilanVeri();
    v.gelir.maas = 100000;
    v.giderler.sabit.market = 87500; // %12,5 tasarruf = hedefin yarısı
    expect(bilesen(v, 'tasarruf').puan).toBe(15);
  });

  it('açık veren bütçede 0 puan ve açıklamada uyarı', () => {
    const v = varsayilanVeri();
    v.gelir.maas = 100000;
    v.giderler.sabit.market = 120000;
    const b = bilesen(v, 'tasarruf');
    expect(b.puan).toBe(0);
    expect(b.aciklama).toContain('aşıyor');
  });

  it('gelir yoksa 0 puan, hesaplanamadı açıklaması', () => {
    const v = varsayilanVeri();
    const b = bilesen(v, 'tasarruf');
    expect(b.puan).toBe(0);
    expect(b.aciklama).toContain('hesaplanamadı');
  });
});

describe('borç bileşeni', () => {
  it('taksit yoksa tam puan', () => {
    const v = varsayilanVeri();
    v.gelir.maas = 50000;
    expect(bilesen(v, 'borc').puan).toBe(25);
  });

  it('riskli eşikte (%40) 0 puan', () => {
    const v = varsayilanVeri();
    v.gelir.maas = 100000;
    v.borclar = [{ id: yeniId(), tur: 'ihtiyac', kalan: 1, taksit: 40000 }];
    expect(bilesen(v, 'borc').puan).toBe(0);
  });

  it('taksitli alışverişler de borç yüküne dahildir', () => {
    const v = varsayilanVeri();
    v.gelir.maas = 100000;
    v.borclar = [{ id: yeniId(), tur: 'ihtiyac', kalan: 1, taksit: 10000 }];
    v.taksitler = [{ id: yeniId(), ad: 'TV', aylikTaksit: 10000, kalanAy: 4 }];
    // %20 borç yükü -> yarı puan
    expect(bilesen(v, 'borc').puan).toBe(13); // 12.5 yuvarlanır
  });
});

describe('acil durum fonu bileşeni', () => {
  it('6 aylık gideri karşılayan likit varlıkla tam puan', () => {
    const v = varsayilanVeri();
    v.gelir.maas = 100000;
    v.giderler.sabit.market = 50000;
    v.varliklar.banka = 300000; // 6 × 50.000
    expect(bilesen(v, 'acilFon').puan).toBe(25);
  });

  it('döviz ve gümüş likit varlığa dahildir', () => {
    const v = varsayilanVeri();
    v.giderler.sabit.market = 10000;
    v.varliklar.dovizler = [{ id: yeniId(), kod: 'USD', miktar: 1000, kur: 30 }]; // 30.000
    v.varliklar.gumusGram = 750;
    v.varliklar.gumusGramFiyat = 40; // 30.000 -> toplam 60.000 = 6 ay
    expect(bilesen(v, 'acilFon').puan).toBe(25);
  });

  it('3 aylık fonla yarı puan', () => {
    const v = varsayilanVeri();
    v.gelir.maas = 100000;
    v.giderler.sabit.market = 50000;
    v.varliklar.banka = 150000;
    expect(bilesen(v, 'acilFon').puan).toBe(13); // 12.5 yuvarlanır
  });
});

describe('dağılım bileşeni', () => {
  it('tek kalemde toplanan varlık 0 puan alır', () => {
    const v = varsayilanVeri();
    v.varliklar.nakit = 500000;
    const b = bilesen(v, 'dagilim');
    expect(b.puan).toBe(0);
    expect(b.aciklama).toContain('tek kalemde');
  });

  it('altı sepete eşit dağılım tam puan alır', () => {
    const v = varsayilanVeri();
    v.varliklar.banka = 100000;
    v.varliklar.dovizler = [{ id: yeniId(), kod: 'USD', miktar: 2500, kur: 40 }];
    v.varliklar.altinGram = 100;
    v.varliklar.altinGramFiyat = 1000;
    v.varliklar.yatirimlar = [{ id: yeniId(), ad: 'Fon', tur: 'fon', deger: 100000 }];
    v.varliklar.bes = 100000;
    v.evler = [{ id: yeniId(), durum: 'yazlik', deger: 100000, aylikKira: 0 }];
    expect(bilesen(v, 'dagilim').puan).toBe(20);
  });

  it('hiç varlık yoksa 0 puan', () => {
    expect(bilesen(varsayilanVeri(), 'dagilim').puan).toBe(0);
  });
});

describe('toplam puan', () => {
  it('bileşenlerin toplamıdır ve 0-100 aralığındadır', () => {
    const v = varsayilanVeri();
    v.gelir.maas = 100000;
    v.giderler.sabit.market = 60000;
    v.varliklar.banka = 200000;
    v.varliklar.yatirimlar = [{ id: yeniId(), ad: 'Fon', tur: 'fon', deger: 150000 }];
    const s = puanHesapla(v);
    expect(s.toplam).toBe(s.bilesenler.reduce((t, b) => t + b.puan, 0));
    expect(s.toplam).toBeGreaterThanOrEqual(0);
    expect(s.toplam).toBeLessThanOrEqual(100);
  });

  it('ağırlıklar yapılandırmadan gelir', () => {
    const a = VARSAYILAN_PUAN_AYARLARI.agirliklar;
    expect(a.tasarruf + a.borc + a.acilFon + a.dagilim).toBe(100);
  });
});
