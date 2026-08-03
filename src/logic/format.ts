// TL biçimlendirme yardımcıları.

const tlBicim = new Intl.NumberFormat('tr-TR', {
  style: 'currency',
  currency: 'TRY',
  maximumFractionDigits: 0,
});

export function tl(x: number): string {
  return tlBicim.format(Math.round(x));
}

const sayiBicim = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 });

export function sayi(x: number): string {
  return sayiBicim.format(Math.round(x));
}

/** Kısa gösterim: 1.250.000 -> "1,25 M ₺" gibi (sahne etiketleri için). */
export function tlKisa(x: number): string {
  const mutlak = Math.abs(x);
  if (mutlak >= 1_000_000) return `${(x / 1_000_000).toLocaleString('tr-TR', { maximumFractionDigits: 2 })} M ₺`;
  if (mutlak >= 1_000) return `${(x / 1_000).toLocaleString('tr-TR', { maximumFractionDigits: 0 })} B ₺`;
  return tl(x);
}
