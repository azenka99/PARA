import { describe, expect, it } from 'vitest';
import { varsayilanVeri, yeniId } from '../model/defaults';
import {
  altinDegeri,
  aylikGelir,
  aylikGider,
  aylikTaksitler,
  bantUygunMu,
  dovizDegeri,
  giderDokumu,
  gumusDegeri,
  kiraGeliri,
  likitVarlik,
  nakitAkisi,
  netDeger,
  taksitKalanBorc,
  toplamBorc,
  yatirimDegeri,
} from './finance';
import type { AppData } from '../model/types';

function ornekVeri(): AppData {
  const v = varsayilanVeri();
  v.profil.ad = 'Test';
  v.profil.medeniHal = 'evli';
  v.gelir = { maas: 60000, esMaas: 40000, ekGelir: 5000, nafakaAlinan: 0 };
  v.varliklar.nakit = 20000;
  v.varliklar.banka = 180000;
  v.varliklar.altinGram = 50;
  v.varliklar.altinGramFiyat = 3000;
  v.varliklar.gumusGram = 1000;
  v.varliklar.gumusGramFiyat = 40;
  v.varliklar.dovizler = [
    { id: yeniId(), kod: 'USD', miktar: 1000, kur: 42 },
    { id: yeniId(), kod: 'EUR', miktar: 500, kur: 48 },
  ];
  v.varliklar.yatirimlar = [
    { id: yeniId(), ad: 'THYAO', tur: 'hisse', deger: 30000 },
    { id: yeniId(), ad: 'Teknoloji Fonu', tur: 'fon', deger: 50000 },
  ];
  v.varliklar.kripto = 10000;
  v.varliklar.bes = 120000;
  v.varliklar.alacaklar = 15000;
  v.evler = [
    { id: yeniId(), durum: 'kiraci', deger: 0, aylikKira: 25000 },
    { id: yeniId(), durum: 'kirada', deger: 3000000, aylikKira: 18000 },
  ];
  v.araclar = [{ id: yeniId(), tur: 'araba', marka: 'Renault', model: 'Clio', deger: 800000 }];
  v.giderler.sabit.faturalar = 4000;
  v.giderler.sabit.market = 15000;
  v.giderler.yillikSigortalar = 12000;
  v.giderler.arac = { yakit: 5000, otopark: 1000, yillikSigortaBakim: 24000 };
  v.giderler.topluTasima = 800; // araç olsa bile toplu taşıma gösterilir
  v.borclar = [{ id: yeniId(), tur: 'ihtiyac', kalan: 200000, taksit: 12000 }];
  v.taksitler = [{ id: yeniId(), ad: 'Telefon', aylikTaksit: 3000, kalanAy: 6 }];
  return v;
}

describe('varlık hesapları', () => {
  it('altın ve gümüş değeri gram × gram fiyatı', () => {
    expect(altinDegeri(ornekVeri())).toBe(150000);
    expect(gumusDegeri(ornekVeri())).toBe(40000);
  });

  it('döviz değeri miktar × kur toplamı', () => {
    expect(dovizDegeri(ornekVeri())).toBe(1000 * 42 + 500 * 48);
  });

  it('yatırım kalemleri toplamı', () => {
    expect(yatirimDegeri(ornekVeri())).toBe(80000);
  });

  it('likit varlık = nakit + banka + döviz + altın + gümüş (BES hariç)', () => {
    expect(likitVarlik(ornekVeri())).toBe(20000 + 180000 + 66000 + 150000 + 40000);
  });

  it('taksitli alışverişin kalan borcu taksit × kalan ay', () => {
    expect(taksitKalanBorc(ornekVeri())).toBe(18000);
    expect(toplamBorc(ornekVeri())).toBe(200000 + 18000);
  });

  it('net değer varlıklardan kalan borcu düşer; kiracı evi varlık saymaz', () => {
    const v = ornekVeri();
    const beklenenVarlik =
      456000 + // likit (nakit+banka+döviz+metal)
      (80000 + 10000) + // yatırımlar + kripto
      120000 + // BES
      15000 + // alacaklar
      3000000 + // sadece "kirada" ev; kiracı evi değer katmaz
      800000; // araç
    expect(netDeger(v)).toBe(beklenenVarlik - 218000);
  });
});

describe('gelir', () => {
  it('evliyse eş maaşı ve kiraya verilen evin kirası gelire eklenir', () => {
    const v = ornekVeri();
    expect(kiraGeliri(v)).toBe(18000);
    expect(aylikGelir(v)).toBe(60000 + 40000 + 5000 + 18000);
  });

  it('bekârsa eş maaşı hesaba girmez', () => {
    const v = ornekVeri();
    v.profil.medeniHal = 'bekar';
    expect(aylikGelir(v)).toBe(60000 + 5000 + 18000);
  });

  it('alınan nafaka yalnızca boşanmışsa gelire eklenir', () => {
    const v = ornekVeri();
    v.gelir.nafakaAlinan = 7000;
    expect(aylikGelir(v)).toBe(123000); // evli: nafaka sayılmaz
    v.profil.medeniHal = 'bosanmis';
    expect(aylikGelir(v)).toBe(60000 + 5000 + 7000 + 18000); // eş maaşı düşer, nafaka girer
  });
});

describe('gider ve profil filtresi', () => {
  it('araç varken araç giderleri VE toplu taşıma birlikte sayılır', () => {
    const d = giderDokumu(ornekVeri());
    expect(d.ulasim).toBe(5000 + 1000 + 24000 / 12 + 800);
  });

  it('araç yoksa yalnızca toplu taşıma kalır', () => {
    const v = ornekVeri();
    v.araclar = [];
    v.giderler.topluTasima = 3000;
    expect(giderDokumu(v).ulasim).toBe(3000);
  });

  it('yıllık sigorta poliçeleri aya bölünür', () => {
    expect(giderDokumu(ornekVeri()).sigorta).toBe(1000);
  });

  it('kiracı kirası gidere eklenir', () => {
    expect(giderDokumu(ornekVeri()).kira).toBe(25000);
  });

  it('eşe verilen para yalnızca evliyken, nafaka yalnızca boşanmışken sayılır', () => {
    const v = ornekVeri();
    v.giderler.esHarcligi = 5000;
    v.giderler.nafakaOdenen = 9000;
    expect(giderDokumu(v).aile).toBe(5000); // evli
    v.profil.medeniHal = 'bosanmis';
    expect(giderDokumu(v).aile).toBe(9000); // boşanmış
    v.profil.medeniHal = 'bekar';
    expect(giderDokumu(v).aile).toBe(0);
  });

  it('çocuk yaş bantları: 2 yaş çocukla bez/mama sorulur, okul ve üniversite sorulmaz', () => {
    const cocuklar = [{ id: 'c1', ad: 'Bebek', yas: 2 }];
    expect(bantUygunMu(cocuklar, 'bezMama')).toBe(true);
    expect(bantUygunMu(cocuklar, 'okulKirtasiye')).toBe(false);
    expect(bantUygunMu(cocuklar, 'universite')).toBe(false);
  });

  it('25 yaş üstü çocuk için hiçbir çocuk gideri hesaba katılmaz', () => {
    const v = ornekVeri();
    v.profil.cocuklar = [{ id: 'c1', ad: 'Yetişkin', yas: 30 }];
    v.giderler.cocuk = { bezMama: 1000, kresBakici: 1000, okulKirtasiye: 1000, harclik: 1000, universite: 1000 };
    expect(giderDokumu(v).cocuk).toBe(0);
  });

  it('üniversite bandı (18-25) ayrı hesaplanır', () => {
    const v = ornekVeri();
    v.profil.cocuklar = [{ id: 'c1', ad: 'Genç', yas: 20 }];
    v.giderler.cocuk = { bezMama: 5000, kresBakici: 8000, okulKirtasiye: 4000, harclik: 1000, universite: 15000 };
    expect(giderDokumu(v).cocuk).toBe(15000); // sadece üniversite
  });

  it('silinmiş evcil hayvanın gideri hesaba katılmaz', () => {
    const v = ornekVeri();
    v.giderler.evcil = [
      { evcilId: 'olmayan', aylikMama: 2000, aylikKumTimar: 500, yillikVeteriner: 6000 },
    ];
    expect(giderDokumu(v).evcil).toBe(0);
  });

  it('evcil hayvan gideri: aylıklar + yıllık veteriner / 12', () => {
    const v = ornekVeri();
    v.profil.evciller = [{ id: 'p1', tur: 'kedi', ad: 'Pamuk' }];
    v.giderler.evcil = [{ evcilId: 'p1', aylikMama: 2000, aylikKumTimar: 500, yillikVeteriner: 6000 }];
    expect(giderDokumu(v).evcil).toBe(2000 + 500 + 500);
  });

  it('kredi taksitleri ve taksitli alışverişler aylık gidere dahildir', () => {
    const v = ornekVeri();
    expect(aylikTaksitler(v)).toBe(12000 + 3000);
    expect(giderDokumu(v).taksitler).toBe(15000);
  });

  it('kalan ayı biten taksit gidere sayılmaz', () => {
    const v = ornekVeri();
    v.taksitler = [{ id: 't1', ad: 'Biten', aylikTaksit: 3000, kalanAy: 0 }];
    expect(aylikTaksitler(v)).toBe(12000);
    expect(taksitKalanBorc(v)).toBe(0);
  });
});

describe('nakit akışı', () => {
  it('gelir − gider', () => {
    const v = ornekVeri();
    expect(nakitAkisi(v)).toBe(aylikGelir(v) - aylikGider(v));
    expect(aylikGider(v)).toBe(giderDokumu(v).toplam);
  });
});
