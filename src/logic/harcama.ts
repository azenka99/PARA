// Günlük harcama takibi — toplama, kategori dağılımı ve bütçe-tempo analizi.
// Harcamalar "gerçekleşen"dir; puanı ve bütçe "planını" değiştirmez, kıyaslanır.

import type { AppData, Harcama, HarcamaKategorisi } from '../model/types';
import { giderDokumu } from './finance';

export const HARCAMA_KATEGORILERI: Array<{
  deger: HarcamaKategorisi;
  ad: string;
  ikon: string;
  renk: string;
}> = [
  { deger: 'market', ad: 'Market', ikon: '🛒', renk: '#23456e' },
  { deger: 'yemek', ad: 'Yemek / kafe', ikon: '🍽️', renk: '#c08a2d' },
  { deger: 'ulasim', ad: 'Ulaşım', ikon: '🚌', renk: '#2e7d5e' },
  { deger: 'fatura', ad: 'Fatura / abonelik', ikon: '🧾', renk: '#3d7ea6' },
  { deger: 'giyim', ad: 'Giyim', ikon: '👕', renk: '#8a2f4f' },
  { deger: 'saglik', ad: 'Sağlık', ikon: '💊', renk: '#b45f3c' },
  { deger: 'diger', ad: 'Diğer', ikon: '📦', renk: '#5d6b81' },
];

export function kategoriBilgi(k: HarcamaKategorisi) {
  return HARCAMA_KATEGORILERI.find((x) => x.deger === k) ?? HARCAMA_KATEGORILERI[6];
}

/** "2026-08-04" -> "2026-08" */
export function ayAnahtari(tarih: string): string {
  return tarih.slice(0, 7);
}

/** Bugünün yerel tarihi: "2026-08-04" */
export function bugunTarihi(simdi = new Date()): string {
  const y = simdi.getFullYear();
  const a = String(simdi.getMonth() + 1).padStart(2, '0');
  const g = String(simdi.getDate()).padStart(2, '0');
  return `${y}-${a}-${g}`;
}

/** Belirli aydaki harcamalar (yeni tarih önce). */
export function aydakiHarcamalar(harcamalar: Harcama[], ay: string): Harcama[] {
  return harcamalar
    .filter((h) => ayAnahtari(h.tarih) === ay)
    .sort((a, b) => (a.tarih < b.tarih ? 1 : a.tarih > b.tarih ? -1 : 0));
}

export function harcamaToplami(harcamalar: Harcama[], ay: string): number {
  return aydakiHarcamalar(harcamalar, ay).reduce((t, h) => t + h.tutar, 0);
}

export function kategoriDagilimi(
  harcamalar: Harcama[],
  ay: string,
): Array<{ ad: string; deger: number; renk: string }> {
  const toplamlar = new Map<HarcamaKategorisi, number>();
  for (const h of aydakiHarcamalar(harcamalar, ay)) {
    toplamlar.set(h.kategori, (toplamlar.get(h.kategori) ?? 0) + h.tutar);
  }
  return HARCAMA_KATEGORILERI.filter((k) => (toplamlar.get(k.deger) ?? 0) > 0).map((k) => ({
    ad: `${k.ikon} ${k.ad}`,
    deger: toplamlar.get(k.deger) ?? 0,
    renk: k.renk,
  }));
}

/** Son n ayın (bu ay dahil) toplamları — eskiden yeniye. */
export function aylikToplamlar(
  harcamalar: Harcama[],
  n: number,
  simdi = new Date(),
): Array<{ ay: string; toplam: number }> {
  const sonuc: Array<{ ay: string; toplam: number }> = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(simdi.getFullYear(), simdi.getMonth() - i, 1);
    const ay = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    sonuc.push({ ay, toplam: harcamaToplami(harcamalar, ay) });
  }
  return sonuc;
}

export interface TempoAnalizi {
  harcanan: number;
  butce: number; // günlük girilebilir kalemlerin aylık bütçesi
  gunOrani: number; // ayın ne kadarı geçti (0..1)
  butceOrani: number; // bütçenin ne kadarı harcandı (0..1+)
  durum: 'uyumlu' | 'hizli' | 'butceYok';
  mesaj: string;
}

/** Bütçe-tempo analizi: kira/taksit/sigorta gibi otomatik kalemler hariç,
 *  günlük girilebilir bütçeyle (sabit + ulaşım + evcil + çocuk) kıyaslar. */
export function tempoAnalizi(veri: AppData, simdi = new Date()): TempoAnalizi {
  const ay = `${simdi.getFullYear()}-${String(simdi.getMonth() + 1).padStart(2, '0')}`;
  const harcanan = harcamaToplami(veri.harcamalar, ay);
  const d = giderDokumu(veri);
  const butce = d.sabit + d.ulasim + d.evcil + d.cocuk;

  const ayinGunSayisi = new Date(simdi.getFullYear(), simdi.getMonth() + 1, 0).getDate();
  const gunOrani = simdi.getDate() / ayinGunSayisi;

  if (butce <= 0) {
    return {
      harcanan,
      butce,
      gunOrani,
      butceOrani: 0,
      durum: 'butceYok',
      mesaj: 'Bütçe kalemlerinizi (Giderler) doldurursanız harcamalarınızı planla kıyaslayabilirim.',
    };
  }

  const butceOrani = harcanan / butce;
  const hizli = butceOrani > gunOrani + 0.1;
  return {
    harcanan,
    butce,
    gunOrani,
    butceOrani,
    durum: hizli ? 'hizli' : 'uyumlu',
    mesaj: hizli
      ? `Ayın %${Math.round(gunOrani * 100)}'i geçti ama bütçenin %${Math.round(butceOrani * 100)}'i harcandı — bu tempoyla ay sonunu aşarsınız.`
      : `Ayın %${Math.round(gunOrani * 100)}'i geçti, bütçenin %${Math.round(Math.min(1.5, butceOrani) * 100)}'i harcandı — plana uyumlu gidiyorsunuz.`,
  };
}
