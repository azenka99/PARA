// Finansal puan gösterimi — halka grafik + gerekçeli bileşen dökümü.
import type { AppData } from '../model/types';
import { puanHesapla } from '../logic/score';

function puanRengi(oran: number): string {
  if (oran >= 0.75) return 'var(--pozitif)';
  if (oran >= 0.5) return 'var(--vurgu)';
  if (oran >= 0.25) return '#c9762e';
  return 'var(--negatif)';
}

export function PuanHalkasi({ puan, boyut = 130 }: { puan: number; boyut?: number }) {
  const r = 52;
  const cevre = 2 * Math.PI * r;
  const dolu = (puan / 100) * cevre;
  return (
    <svg width={boyut} height={boyut} viewBox="0 0 130 130" role="img" aria-label={`Finansal puan ${puan}`}>
      <circle cx={65} cy={65} r={r} fill="none" stroke="var(--cizgi)" strokeWidth={13} />
      <circle
        cx={65}
        cy={65}
        r={r}
        fill="none"
        stroke={puanRengi(puan / 100)}
        strokeWidth={13}
        strokeLinecap="round"
        strokeDasharray={`${dolu} ${cevre - dolu}`}
        transform="rotate(-90 65 65)"
      />
      <text
        x={65}
        y={63}
        textAnchor="middle"
        fontSize={33}
        fontWeight={800}
        fill="var(--metin)"
        style={{ fontFamily: "'Manrope', sans-serif" }}
      >
        {puan}
      </text>
      <text x={65} y={84} textAnchor="middle" fontSize={12.5} fill="var(--metin-soluk)" style={{ fontFamily: "'Manrope', sans-serif" }}>
        / 100
      </text>
    </svg>
  );
}

export function PuanDokumu({ veri, ozet }: { veri: AppData; ozet?: boolean }) {
  const sonuc = puanHesapla(veri);
  return (
    <div>
      <div className="puan-halka-sarmal">
        <PuanHalkasi puan={sonuc.toplam} />
        <div style={{ flex: 1, minWidth: 220 }}>
          {sonuc.bilesenler.map((b) => {
            const oran = b.agirlik > 0 ? b.puan / b.agirlik : 0;
            return (
              <div className="puan-bilesen" key={b.anahtar}>
                <div className="puan-bilesen-ust">
                  <span className="puan-bilesen-ad">{b.baslik}</span>
                  <span className="puan-bilesen-deger">
                    {b.puan} / {b.agirlik}
                  </span>
                </div>
                <div className="puan-cubuk">
                  <div
                    className="puan-cubuk-dolu"
                    style={{ width: `${Math.round(oran * 100)}%`, background: puanRengi(oran) }}
                  />
                </div>
                {!ozet && <div className="puan-gerekce">{b.aciklama}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
