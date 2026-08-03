// Kalıcı saklama katmanı — veri YALNIZCA bu cihazda, tarayıcının
// localStorage alanında tutulur; hiçbir sunucuya gönderilmez.
// Yedekleme/geri yükleme JSON dosyası olarak kullanıcının elindedir.

import type { AppData } from '../model/types';
import { varsayilanVeri, VERI_SURUMU } from '../model/defaults';

const ANAHTAR = 'manzara.veri';

/** Eski sürüm veriyi yeni şemaya taşır; eksik alanları varsayılanla doldurur. */
export function veriTasima(ham: unknown): AppData {
  const taban = varsayilanVeri();
  if (typeof ham !== 'object' || ham === null) return taban;
  const v = ham as Partial<AppData>;
  // Derin birleştirme: bilinen üst alanları tek tek al, bilinmeyenleri yok say.
  const sonuc: AppData = {
    ...taban,
    ...v,
    surum: VERI_SURUMU,
    profil: { ...taban.profil, ...(v.profil ?? {}) },
    varliklar: { ...taban.varliklar, ...(v.varliklar ?? {}) },
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
    araclar: Array.isArray(v.araclar) ? v.araclar : [],
    borclar: Array.isArray(v.borclar) ? v.borclar : [],
  };
  return sonuc;
}

export function veriYukle(): AppData {
  try {
    const ham = localStorage.getItem(ANAHTAR);
    if (!ham) return varsayilanVeri();
    return veriTasima(JSON.parse(ham));
  } catch {
    return varsayilanVeri();
  }
}

export function veriKaydet(veri: AppData): void {
  try {
    localStorage.setItem(ANAHTAR, JSON.stringify(veri));
  } catch {
    // depolama dolu/kapalıysa sessizce geç — uygulama bellekte çalışmaya devam eder
  }
}

export function veriSil(): void {
  localStorage.removeItem(ANAHTAR);
}

/** Yedek dosyası olarak dışa aktarım (kullanıcı indirir, istediği yerde saklar). */
export function yedekIndir(veri: AppData): void {
  const kanBlob = new Blob([JSON.stringify(veri, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(kanBlob);
  const a = document.createElement('a');
  const tarih = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `manzara-yedek-${tarih}.json`;
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
