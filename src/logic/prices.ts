// Canlı fiyat çekme (DENEYSEL) — altın, gümüş ve döviz kurları.
// Ücretsiz, anahtarsız kamuya açık kaynaklar denenir; hiçbiri yanıt vermezse
// kullanıcı fiyatları elle girmeye devam eder. Uygulama bu servise BAĞIMLI değildir.

export interface CanliFiyatlar {
  altinGram?: number;
  gumusGram?: number;
  usd?: number;
  eur?: number;
  gbp?: number;
  kaynak: string;
}

const KAYNAKLAR = [
  'https://finans.truncgil.com/v4/today.json',
  'https://finans.truncgil.com/today.json',
];

/** "43.512,75" / "43512.75" / 43512.75 -> sayı. Çözülemezse undefined. */
function sayiya(x: unknown): number | undefined {
  if (typeof x === 'number' && Number.isFinite(x)) return x;
  if (typeof x !== 'string') return undefined;
  const temiz = x.replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '');
  const n = parseFloat(temiz);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

/** Bir kayıt nesnesinden satış/alış fiyatını çıkarır (farklı API biçimlerine dayanıklı). */
function fiyatCek(kayit: unknown): number | undefined {
  if (typeof kayit !== 'object' || kayit === null) return sayiya(kayit);
  const k = kayit as Record<string, unknown>;
  for (const alan of ['Selling', 'selling', 'Satış', 'satis', 'Satis', 'Buying', 'Alış', 'alis']) {
    const n = sayiya(k[alan]);
    if (n !== undefined) return n;
  }
  return undefined;
}

/** JSON gövdesinde verilen takma adlardan ilkini bulur (büyük/küçük harf duyarsız). */
function anahtarBul(json: Record<string, unknown>, adaylar: string[]): unknown {
  const haritalar = new Map(Object.keys(json).map((k) => [k.toLowerCase(), k]));
  for (const aday of adaylar) {
    const asil = haritalar.get(aday.toLowerCase());
    if (asil) return json[asil];
  }
  return undefined;
}

export async function canliFiyatlariCek(): Promise<CanliFiyatlar | null> {
  for (const url of KAYNAKLAR) {
    try {
      const yanit = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!yanit.ok) continue;
      const json = (await yanit.json()) as Record<string, unknown>;
      // v4 biçiminde fiyatlar "Rates" altında olabilir
      const govde =
        typeof json.Rates === 'object' && json.Rates !== null
          ? (json.Rates as Record<string, unknown>)
          : json;

      const sonuc: CanliFiyatlar = {
        altinGram: fiyatCek(anahtarBul(govde, ['GRA', 'gram-altin', 'gram_altin', 'GRAM ALTIN'])),
        gumusGram: fiyatCek(anahtarBul(govde, ['GUMUS', 'gumus', 'gümüş', 'GÜMÜŞ', 'GMS'])),
        usd: fiyatCek(anahtarBul(govde, ['USD'])),
        eur: fiyatCek(anahtarBul(govde, ['EUR'])),
        gbp: fiyatCek(anahtarBul(govde, ['GBP'])),
        kaynak: new URL(url).hostname,
      };

      // En az bir fiyat çözülebildiyse başarılı say
      if (sonuc.altinGram || sonuc.gumusGram || sonuc.usd || sonuc.eur) return sonuc;
    } catch {
      // sıradaki kaynağı dene
    }
  }
  return null;
}

/** Fiyat verisi kaç gündür güncellenmemiş? null -> hiç güncellenmemiş. */
export function fiyatYasiGun(fiyatGuncelleme: string | null): number | null {
  if (!fiyatGuncelleme) return null;
  const t = Date.parse(fiyatGuncelleme);
  if (Number.isNaN(t)) return null;
  return Math.floor((Date.now() - t) / (24 * 60 * 60 * 1000));
}
