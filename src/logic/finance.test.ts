import { describe, expect, it } from 'vitest';
import { varsayilanVeri, yeniId } from '../model/defaults';
import {
  altinDegeri,
  aylikGelir,
  aylikGider,
  bantUygunMu,
  giderDokumu,
  hisseDegeri,
  kiraGeliri,
  likitVarlik,
  nakitAkisi,
  netDeger,
} from './finance';
import type { AppData } from '../model/types';

function ornekVeri(): AppData {
  const v = varsayilanVeri();
  v.profil.ad = 'Test';
  v.profil.medeniHal = 'evli';
  v.gelir = { maas: 60000, esMaas: 40000, ekGelir: 5000 };
  v.varliklar.nakit = 20000;
  v.varliklar.banka = 180000;
  v.varliklar.altinGram = 50;
  v.varliklar.altinGramFiyat = 3000;
  v.varliklar.hisseler = [
    { id: yeniId(), kod: 'THYAO', lot: 100, fiyat: 300 },
    { id: yeniId(), kod: 'ASELS', lot: 50, fiyat: 80 },
  ];
  v.varliklar.fonEtf = 50000;
  v.varliklar.kripto = 10000;
  v.evler = [
    { id: yeniId(), durum: 'kiraci', deger: 0, aylikKira: 25000 },
    { id: yeniId(), durum: 'kirada', deger: 3000000, aylikKira: 18000 },
  ];
  v.araclar = [{ id: yeniId(), marka: 'Renault', model: 'Clio', deger: 800000 }];
  v.giderler.sabit.faturalar = 4000;
  v.giderler.sabit.market = 15000;
  v.giderler.arac = { yakit: 5000, otopark: 1000, yillikSigortaBakim: 24000 };
  v.giderler.topluTasima = 999999; // araç varken YOK SAYILMALI
  v.borclar = [{ id: yeniId(), tur: 'ihtiyac', kalan: 200000, taksit: 12000 }];
  return v;
}

describe('varlık hesapları', () => {
  it('altın değeri gram × gram fiyatı', () => {
    expect(altinDegeri(ornekVeri())).toBe(150000);
  });

  it('hisse değeri lot × fiyat toplamı', () => {
    expect(hisseDegeri(ornekVeri())).toBe(100 * 300 + 50 * 80);
  });

  it('likit varlık = nakit + banka + altın', () => {
    expect(likitVarlik(ornekVeri())).toBe(20000 + 180000 + 150000);
  });

  it('net değer varlıklardan kalan borcu düşer; kiracı evi varlık saymaz', () => {
    const v = ornekVeri();
    const beklenenVarlik =
      350000 + // likit
      (34000 + 50000 + 10000) + // piyasa
      3000000 + // sadece "kirada" ev; kiracı evi değer katmaz
      800000; // araç
    expect(netDeger(v)).toBe(beklenenVarlik - 200000);
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
});

describe('gider ve profil filtresi', () => {
  it('araç varken toplu taşıma yok sayılır, yıllık sigorta aya bölünür', () => {
    const d = giderDokumu(ornekVeri());
    expect(d.ulasim).toBe(5000 + 1000 + 24000 / 12);
  });

  it('araç yoksa toplu taşıma gideri kullanılır', () => {
    const v = ornekVeri();
    v.araclar = [];
    v.giderler.topluTasima = 3000;
    expect(giderDokumu(v).ulasim).toBe(3000);
  });

  it('kiracı kirası gidere eklenir', () => {
    expect(giderDokumu(ornekVeri()).kira).toBe(25000);
  });

  it('çocuk yaş bantları: 2 yaş çocukla bez/mama sorulur, okul sorulmaz', () => {
    const cocuklar = [{ id: 'c1', ad: 'Bebek', yas: 2 }];
    expect(bantUygunMu(cocuklar, 'bezMama')).toBe(true);
    expect(bantUygunMu(cocuklar, 'okulKirtasiye')).toBe(false);
  });

  it('büyük çocukta bebek gideri hesaba katılmaz', () => {
    const v = ornekVeri();
    v.profil.cocuklar = [{ id: 'c1', ad: 'Genç', yas: 15 }];
    v.giderler.cocuk = { bezMama: 5000, kresBakici: 8000, okulKirtasiye: 4000, harclik: 1000 };
    expect(giderDokumu(v).cocuk).toBe(4000 + 1000); // sadece okul + harçlık
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

  it('taksitler aylık gidere dahildir', () => {
    const v = ornekVeri();
    expect(aylikGider(v)).toBe(giderDokumu(v).toplam);
    expect(giderDokumu(v).taksitler).toBe(12000);
  });
});

describe('nakit akışı', () => {
  it('gelir − gider', () => {
    const v = ornekVeri();
    expect(nakitAkisi(v)).toBe(aylikGelir(v) - aylikGider(v));
  });
});
