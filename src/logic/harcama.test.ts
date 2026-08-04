import { describe, expect, it } from 'vitest';
import { varsayilanVeri } from '../model/defaults';
import {
  aylikToplamlar,
  harcamaToplami,
  kategoriDagilimi,
  tempoAnalizi,
} from './harcama';
import type { Harcama } from '../model/types';

const ornek: Harcama[] = [
  { id: '1', tarih: '2026-08-01', tutar: 500, kategori: 'market', not: '' },
  { id: '2', tarih: '2026-08-03', tutar: 300, kategori: 'yemek', not: 'kafe' },
  { id: '3', tarih: '2026-08-03', tutar: 200, kategori: 'market', not: '' },
  { id: '4', tarih: '2026-07-15', tutar: 900, kategori: 'giyim', not: '' },
];

describe('harcama toplama', () => {
  it('yalnızca ilgili ayın harcamalarını toplar', () => {
    expect(harcamaToplami(ornek, '2026-08')).toBe(1000);
    expect(harcamaToplami(ornek, '2026-07')).toBe(900);
    expect(harcamaToplami(ornek, '2026-06')).toBe(0);
  });

  it('kategori dağılımı doğru gruplar', () => {
    const d = kategoriDagilimi(ornek, '2026-08');
    expect(d.find((x) => x.ad.includes('Market'))?.deger).toBe(700);
    expect(d.find((x) => x.ad.includes('Yemek'))?.deger).toBe(300);
    expect(d.find((x) => x.ad.includes('Giyim'))).toBeUndefined();
  });

  it('aylık toplamlar son n ayı eskiden yeniye dizer', () => {
    const t = aylikToplamlar(ornek, 3, new Date(2026, 7, 15)); // Ağustos 2026
    expect(t.map((x) => x.ay)).toEqual(['2026-06', '2026-07', '2026-08']);
    expect(t.map((x) => x.toplam)).toEqual([0, 900, 1000]);
  });
});

describe('tempo analizi', () => {
  it('bütçe yoksa kıyas yapmaz', () => {
    const v = varsayilanVeri();
    v.harcamalar = ornek;
    expect(tempoAnalizi(v, new Date(2026, 7, 15)).durum).toBe('butceYok');
  });

  it('tempoya göre hızlı/uyumlu der', () => {
    const v = varsayilanVeri();
    v.giderler.sabit.market = 10000; // aylık bütçe 10.000
    // Ayın yarısında bütçenin %80'i harcanmış -> hızlı
    v.harcamalar = [{ id: 'x', tarih: '2026-08-10', tutar: 8000, kategori: 'market', not: '' }];
    const hizli = tempoAnalizi(v, new Date(2026, 7, 15)); // 15/31 ≈ %48
    expect(hizli.durum).toBe('hizli');
    // %30'u harcanmış -> uyumlu
    v.harcamalar = [{ id: 'y', tarih: '2026-08-10', tutar: 3000, kategori: 'market', not: '' }];
    expect(tempoAnalizi(v, new Date(2026, 7, 15)).durum).toBe('uyumlu');
  });

  it('kira ve taksitler günlük bütçe kıyasına dahil edilmez', () => {
    const v = varsayilanVeri();
    v.giderler.sabit.market = 10000;
    v.evler = [{ id: 'e', durum: 'kiraci', deger: 0, aylikKira: 30000 }];
    v.borclar = [{ id: 'b', tur: 'ihtiyac', kalan: 1, taksit: 20000 }];
    expect(tempoAnalizi(v, new Date(2026, 7, 15)).butce).toBe(10000);
  });
});
