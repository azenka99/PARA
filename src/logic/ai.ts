// İsteğe bağlı gerçek yapay zeka katmanı — "kendi anahtarını getir" modeli.
// Anahtar YALNIZCA bu cihazda saklanır; hiçbir sunucumuza gönderilmez (sunucumuz yok).
// Anahtar girilmemişse uygulama tamamen kurallı (ücretsiz) modda çalışır.
// SPK sınırı: sistem yönergesi, belirli hisse/fon/ürün önermeyi açıkça yasaklar.

import type { AppData } from '../model/types';
import {
  aylikGelir,
  aylikGider,
  aylikTaksitler,
  likitVarlik,
  nakitAkisi,
  netDeger,
} from './finance';
import { yasHesapla } from './plan';

const ANAHTAR_KEY = 'para.aiAnahtar';
const MODEL = 'claude-haiku-4-5-20251001'; // hızlı ve ekonomik model — soru başına maliyet kuruş düzeyi

export function aiAnahtarVar(): boolean {
  return !!localStorage.getItem(ANAHTAR_KEY);
}

export function aiAnahtarKaydet(anahtar: string): void {
  localStorage.setItem(ANAHTAR_KEY, anahtar.trim());
}

export function aiAnahtarSil(): void {
  localStorage.removeItem(ANAHTAR_KEY);
}

/** Yapay zekaya gönderilen finansal özet — isim/kimlik içermez, yuvarlanmış rakamlardır. */
export function finansalOzet(veri: AppData): string {
  const yas = yasHesapla(veri);
  const gelir = aylikGelir(veri);
  const y = (x: number) => Math.round(x / 1000) * 1000;
  return [
    yas !== null ? `Yaş: ${yas}` : null,
    `Medeni durum: ${veri.profil.medeniHal}`,
    veri.profil.cocuklar.length > 0 ? `Çocuk sayısı: ${veri.profil.cocuklar.length} (yaşlar: ${veri.profil.cocuklar.map((c) => c.yas).join(', ')})` : 'Çocuk yok',
    `Aylık net gelir: ${y(gelir)} TL`,
    `Aylık gider: ${y(aylikGider(veri))} TL`,
    `Ay sonu kalan: ${y(nakitAkisi(veri))} TL`,
    `Net değer: ${y(netDeger(veri))} TL`,
    `Likit varlık: ${y(likitVarlik(veri))} TL`,
    gelir > 0 ? `Borç yükü: gelirin %${Math.round((aylikTaksitler(veri) / gelir) * 100)}'i` : null,
    veri.hedefler.rahatAylik > 0 ? `Rahatlık hedefi: ayda ${y(veri.hedefler.rahatAylik)} TL serbest para` : null,
    veri.hedefler.pasifGelirAylik > 0 ? `Finansal özgürlük hedefi: ayda ${y(veri.hedefler.pasifGelirAylik)} TL pasif gelir` : null,
  ]
    .filter(Boolean)
    .join('\n');
}

const SISTEM_YONERGESI = `Sen PARA adlı kişisel finans uygulamasının asistanısın. Türkçe, samimi ama profesyonel bir dille, KISA (en fazla 3-4 cümle) cevap verirsin.

KESIN KURALLAR:
- Asla belirli bir hisse senedi, fon, kripto para, banka veya ürün adı önermezsin ("X hissesini al" yasak). Türkiye'de yatırım danışmanlığı lisansa tabidir; sen genel finansal okuryazarlık çerçevesinde konuşursun.
- Sana verilen finansal özet ve senaryo bağlamındaki RAKAMLARI kullanarak somut konuşursun.
- Kararı asla sen vermezsin; seçenekleri ve sonuçlarını gösterir, kararı kullanıcıya bırakırsın.
- Emin olmadığın konuda bunu söylersin. Vergi/hukuk sorularında uzmana danışmayı önerirsin.`;

export interface AiSonuc {
  metin: string | null;
  hata: string | null;
}

/** Kullanıcının serbest sorusunu, finansal özet + senaryo bağlamıyla yanıtlar. */
export async function aiSor(
  veri: AppData,
  senaryoBaglami: string,
  soru: string,
): Promise<AiSonuc> {
  const anahtar = localStorage.getItem(ANAHTAR_KEY);
  if (!anahtar) return { metin: null, hata: 'anahtar-yok' };

  try {
    const yanit = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': anahtar,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 600,
        system: SISTEM_YONERGESI,
        messages: [
          {
            role: 'user',
            content: `Finansal özetim:\n${finansalOzet(veri)}\n\nİncelediğim senaryo:\n${senaryoBaglami}\n\nSorum: ${soru}`,
          },
        ],
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (yanit.status === 401) return { metin: null, hata: 'Anahtar geçersiz görünüyor — Profil sayfasından kontrol edin.' };
    if (!yanit.ok) return { metin: null, hata: `Servis yanıt vermedi (${yanit.status}). Biraz sonra tekrar deneyin.` };

    const json = await yanit.json();
    const metin = Array.isArray(json.content)
      ? json.content.filter((p: { type: string }) => p.type === 'text').map((p: { text: string }) => p.text).join('\n')
      : null;
    return metin
      ? { metin, hata: null }
      : { metin: null, hata: 'Beklenmedik yanıt biçimi.' };
  } catch {
    return { metin: null, hata: 'Bağlantı kurulamadı — internetinizi kontrol edin.' };
  }
}
