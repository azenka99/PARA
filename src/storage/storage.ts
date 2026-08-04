// Kalıcı saklama katmanı — veri YALNIZCA bu cihazda, tarayıcının
// localStorage alanında tutulur; hiçbir sunucuya gönderilmez.
// Yedekleme/geri yükleme JSON dosyası olarak kullanıcının elindedir.

import type { AppData, Arac, YatirimKalemi } from '../model/types';
import { varsayilanVeri, VERI_SURUMU, yeniId } from '../model/defaults';

const ANAHTAR = 'para.veri';
const ESKI_ANAHTAR = 'manzara.veri'; // uygulamanın eski adı — geriye dönük okuma

/** Eski sürüm veriyi yeni şemaya taşır; eksik alanları varsayılanla doldurur. */
export function veriTasima(ham: unknown): AppData {
  const taban = varsayilanVeri();
  if (typeof ham !== 'object' || ham === null) return taban;
  const v = ham as Record<string, any>;

  // --- v1 -> v2: hisseler (kod/lot/fiyat) + fonEtf -> yatirimlar listesi ---
  const eskiVarlik = (v.varliklar ?? {}) as Record<string, any>;
  let yatirimlar: YatirimKalemi[] = Array.isArray(eskiVarlik.yatirimlar)
    ? eskiVarlik.yatirimlar
    : [];
  if (yatirimlar.length === 0) {
    if (Array.isArray(eskiVarlik.hisseler)) {
      yatirimlar = eskiVarlik.hisseler
        .filter((h: any) => h && (h.kod || h.lot * h.fiyat > 0))
        .map((h: any) => ({
          id: h.id ?? yeniId(),
          ad: h.kod ?? 'Hisse',
          tur: 'hisse' as const,
          deger: (Number(h.lot) || 0) * (Number(h.fiyat) || 0),
        }));
    }
    if (typeof eskiVarlik.fonEtf === 'number' && eskiVarlik.fonEtf > 0) {
      yatirimlar.push({ id: yeniId(), ad: 'Fon toplamı', tur: 'fon', deger: eskiVarlik.fonEtf });
    }
  }

  // --- v1 -> v2: araçlara tür alanı ---
  const araclar: Arac[] = Array.isArray(v.araclar)
    ? v.araclar.map((a: any) => ({ tur: 'araba', ...a }))
    : [];

  const sonuc: AppData = {
    ...taban,
    ...v,
    surum: VERI_SURUMU,
    profil: { ...taban.profil, ...(v.profil ?? {}) },
    varliklar: {
      ...taban.varliklar,
      ...eskiVarlik,
      yatirimlar,
      dovizler: Array.isArray(eskiVarlik.dovizler) ? eskiVarlik.dovizler : [],
    },
    gelir: { ...taban.gelir, ...(v.gelir ?? {}) },
    giderler: {
      ...taban.giderler,
      ...(v.giderler ?? {}),
      sabit: { ...taban.giderler.sabit, ...(v.giderler?.sabit ?? {}) },
      arac: { ...taban.giderler.arac, ...(v.giderler?.arac ?? {}) },
      cocuk: { ...taban.giderler.cocuk, ...(v.giderler?.cocuk ?? {}) },
      evcil: Array.isArray(v.giderler?.evcil) ? v.giderler.evcil : [],
    },
    evler: Array.isArray(v.evler) ? v.evler : [],
    araclar,
    borclar: Array.isArray(v.borclar) ? v.borclar : [],
    taksitler: Array.isArray(v.taksitler) ? v.taksitler : [],
    hedefler: { ...taban.hedefler, ...(v.hedefler ?? {}) },
    gecmis: Array.isArray(v.gecmis) ? v.gecmis : [],
  };

  // v2'de artık kullanılmayan v1 alanlarını temizle
  delete (sonuc.varliklar as any).hisseler;
  delete (sonuc.varliklar as any).fonEtf;

  return sonuc;
}

export function veriYukle(): AppData {
  try {
    const ham = localStorage.getItem(ANAHTAR) ?? localStorage.getItem(ESKI_ANAHTAR);
    if (!ham) return varsayilanVeri();
    return veriTasima(JSON.parse(ham));
  } catch {
    return varsayilanVeri();
  }
}

export function veriKaydet(veri: AppData): void {
  try {
    localStorage.setItem(ANAHTAR, JSON.stringify(veri));
    localStorage.removeItem(ESKI_ANAHTAR);
  } catch {
    // depolama dolu/kapalıysa sessizce geç — uygulama bellekte çalışmaya devam eder
  }
}

export function veriSil(): void {
  localStorage.removeItem(ANAHTAR);
  localStorage.removeItem(ESKI_ANAHTAR);
}

/** Yedek dosyası olarak dışa aktarım (kullanıcı indirir, istediği yerde saklar). */
export function yedekIndir(veri: AppData): void {
  const dosyaBlob = new Blob([JSON.stringify(veri, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(dosyaBlob);
  const a = document.createElement('a');
  const tarih = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `para-yedek-${tarih}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Yedek dosyasından geri yükleme. Hatalı dosyada null döner. */
export async function yedekOku(dosya: File): Promise<AppData | null> {
  try {
    const metin = await dosya.text();
    const ham = JSON.parse(metin);
    if (typeof ham !== 'object' || ham === null || !('profil' in ham)) return null;
    return veriTasima(ham);
  } catch {
    return null;
  }
}
