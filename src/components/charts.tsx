// Basit SVG grafikler — halka (donut) ve mini trend çizgisi.
import { useGizli } from '../state';

export interface Dilim {
  ad: string;
  deger: number;
  renk: string;
}

/** Halka grafik + renk açıklamalı liste. */
export function HalkaGrafik({ dilimler, boyut = 150 }: { dilimler: Dilim[]; boyut?: number }) {
  const { tutar } = useGizli();
  const dolu = dilimler.filter((d) => d.deger > 0).sort((a, b) => b.deger - a.deger);
  const toplam = dolu.reduce((t, d) => t + d.deger, 0);
  if (toplam <= 0) return null;

  const r = 56;
  const cevre = 2 * Math.PI * r;
  let ofset = 0;

  return (
    <div className="grafik-satir">
      <svg width={boyut} height={boyut} viewBox="0 0 150 150" role="img" aria-label="Dağılım grafiği">
        {dolu.map((d) => {
          const uzunluk = (d.deger / toplam) * cevre;
          const dilim = (
            <circle
              key={d.ad}
              cx={75}
              cy={75}
              r={r}
              fill="none"
              stroke={d.renk}
              strokeWidth={24}
              strokeDasharray={`${Math.max(0.5, uzunluk - 2)} ${cevre - Math.max(0.5, uzunluk - 2)}`}
              strokeDashoffset={-ofset}
              transform="rotate(-90 75 75)"
            />
          );
          ofset += uzunluk;
          return dilim;
        })}
      </svg>
      <div className="grafik-aciklama">
        {dolu.map((d) => (
          <div className="oge" key={d.ad}>
            <span className="nokta" style={{ background: d.renk }} />
            <span className="ad">{d.ad}</span>
            <span className="tutar">{tutar(d.deger)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Mini trend çizgisi (sparkline) — ay sonu kayıtları için. */
export function MiniTrend({
  degerler,
  etiketler,
  genislik = 640,
  yukseklik = 110,
}: {
  degerler: number[];
  etiketler: string[];
  genislik?: number;
  yukseklik?: number;
}) {
  if (degerler.length < 2) return null;

  const kenar = 10;
  const min = Math.min(...degerler);
  const max = Math.max(...degerler);
  const aralik = max - min || 1;
  const noktalar = degerler.map((d, i) => {
    const x = kenar + (i / (degerler.length - 1)) * (genislik - kenar * 2);
    const y = yukseklik - kenar - ((d - min) / aralik) * (yukseklik - kenar * 2);
    return [x, y] as const;
  });
  const cizgi = noktalar.map(([x, y]) => `${x},${y}`).join(' ');
  const son = noktalar[noktalar.length - 1];

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${genislik} ${yukseklik + 16}`}
      role="img"
      aria-label="Aylık gelişim grafiği"
      style={{ display: 'block' }}
    >
      <polyline
        points={`${kenar},${yukseklik - kenar} ${cizgi} ${genislik - kenar},${yukseklik - kenar}`}
        fill="var(--birincil-yumusak)"
        stroke="none"
        opacity={0.6}
      />
      <polyline points={cizgi} fill="none" stroke="var(--birincil)" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={son[0]} cy={son[1]} r={4} fill="var(--vurgu)" />
      <text x={kenar} y={yukseklik + 12} fontSize={10.5} fill="var(--metin-soluk)">
        {etiketler[0]}
      </text>
      <text x={genislik - kenar} y={yukseklik + 12} fontSize={10.5} fill="var(--metin-soluk)" textAnchor="end">
        {etiketler[etiketler.length - 1]}
      </text>
    </svg>
  );
}
