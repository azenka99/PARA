// Parametrik SVG avatar — flat/kawaii stil.
// Aynı çizim hem avatar düzenleyicide hem sahnede kullanılır.
import type { AvatarConfig } from '../model/types';

/** Beden tipine göre gövde genişliği — görsel olarak gerçekten farklılaşır. */
const GOVDE_GENISLIK: Record<AvatarConfig['bedenTipi'], number> = {
  zayif: 34,
  orta: 46,
  kilolu: 62,
};

function koyulastir(hex: string, oran = 0.22): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * (1 - oran));
  const g = Math.round(((n >> 8) & 255) * (1 - oran));
  const b = Math.round((n & 255) * (1 - oran));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/** Avatarın gövdesi — <svg> ya da <g> içine yerleştirilebilir. viewBox: 0 0 120 170 */
export function AvatarGovde({ config }: { config: AvatarConfig }) {
  const { ciltTonu, sacStili, sacRengi, bedenTipi, kiyafetRengi, aksesuarlar } = config;
  const gw = GOVDE_GENISLIK[bedenTipi];
  const govdeX = 60 - gw / 2;
  const kolY = 74;
  const kolBoy = 38;
  const pantolon = '#2d3142';

  return (
    <g>
      {/* uzun saçın arkada kalan kısmı */}
      {sacStili === 'uzun' && (
        <path
          d={`M36,34 C30,52 32,74 36,86 L48,80 C44,66 44,52 46,40 Z
              M84,34 C90,52 88,74 84,86 L72,80 C76,66 76,52 74,40 Z`}
          fill={sacRengi}
        />
      )}

      {/* bacaklar + ayakkabılar */}
      <rect x={60 - gw * 0.36} y={112} width={gw * 0.3} height={40} rx={7} fill={pantolon} />
      <rect x={60 + gw * 0.06} y={112} width={gw * 0.3} height={40} rx={7} fill={pantolon} />
      <ellipse cx={60 - gw * 0.21} cy={155} rx={10} ry={5.5} fill={koyulastir(kiyafetRengi, 0.35)} />
      <ellipse cx={60 + gw * 0.21} cy={155} rx={10} ry={5.5} fill={koyulastir(kiyafetRengi, 0.35)} />

      {/* kollar */}
      <rect x={govdeX - 9} y={kolY} width={11} height={kolBoy} rx={5.5} fill={koyulastir(kiyafetRengi, 0.12)} />
      <rect x={govdeX + gw - 2} y={kolY} width={11} height={kolBoy} rx={5.5} fill={koyulastir(kiyafetRengi, 0.12)} />
      <circle cx={govdeX - 3.5} cy={kolY + kolBoy + 3} r={5} fill={ciltTonu} />
      <circle cx={govdeX + gw + 3.5} cy={kolY + kolBoy + 3} r={5} fill={ciltTonu} />

      {/* gövde (kıyafet) */}
      <rect x={govdeX} y={66} width={gw} height={52} rx={bedenTipi === 'kilolu' ? 22 : 15} fill={kiyafetRengi} />

      {/* boyun + kafa */}
      <rect x={54} y={58} width={12} height={12} rx={4} fill={ciltTonu} />
      <circle cx={60} cy={40} r={24} fill={ciltTonu} />

      {/* kulaklar */}
      <circle cx={36} cy={42} r={4.5} fill={ciltTonu} />
      <circle cx={84} cy={42} r={4.5} fill={ciltTonu} />
      {aksesuarlar.includes('kupe') && (
        <>
          <circle cx={36} cy={46} r={2.2} fill="#ffc93c" />
          <circle cx={84} cy={46} r={2.2} fill="#ffc93c" />
        </>
      )}

      {/* saç */}
      {sacStili === 'kisa' && (
        <path d="M36,38 C36,20 46,14 60,14 C74,14 84,20 84,38 C84,40 82,41 81,39 C76,28 70,26 60,26 C50,26 44,28 39,39 C38,41 36,40 36,38 Z" fill={sacRengi} />
      )}
      {sacStili === 'uzun' && (
        <path d="M36,40 C34,18 46,12 60,12 C74,12 86,18 84,40 C83,42 81,42 80,40 C76,28 70,25 60,25 C50,25 44,28 40,40 C39,42 37,42 36,40 Z" fill={sacRengi} />
      )}
      {sacStili === 'topuz' && (
        <>
          <circle cx={60} cy={12} r={9} fill={sacRengi} />
          <path d="M37,38 C37,20 47,15 60,15 C73,15 83,20 83,38 C83,40 81,41 80,39 C76,29 69,27 60,27 C51,27 44,29 40,39 C39,41 37,40 37,38 Z" fill={sacRengi} />
        </>
      )}
      {sacStili === 'kivircik' && (
        <>
          <circle cx={44} cy={24} r={8.5} fill={sacRengi} />
          <circle cx={54} cy={18} r={9} fill={sacRengi} />
          <circle cx={66} cy={18} r={9} fill={sacRengi} />
          <circle cx={76} cy={24} r={8.5} fill={sacRengi} />
          <circle cx={38} cy={33} r={6.5} fill={sacRengi} />
          <circle cx={82} cy={33} r={6.5} fill={sacRengi} />
        </>
      )}
      {sacStili === 'trasli' && (
        <path d="M39,32 C42,21 50,17 60,17 C70,17 78,21 81,32 C77,25 69,22 60,22 C51,22 43,25 39,32 Z" fill={sacRengi} opacity={0.5} />
      )}

      {/* yüz */}
      <circle cx={51} cy={41} r={2.6} fill="#2d2a3e" />
      <circle cx={69} cy={41} r={2.6} fill="#2d2a3e" />
      <path d="M52,50 Q60,57 68,50" stroke="#2d2a3e" strokeWidth={2.4} fill="none" strokeLinecap="round" />
      <circle cx={45} cy={48} r={3.2} fill="#ff7ab8" opacity={0.45} />
      <circle cx={75} cy={48} r={3.2} fill="#ff7ab8" opacity={0.45} />

      {/* sakal */}
      {aksesuarlar.includes('sakal') && (
        <path
          d="M38,44 C38,60 46,64 60,64 C74,64 82,60 82,44 C82,56 74,58 60,58 C46,58 38,56 38,44 Z"
          fill={sacRengi}
        />
      )}

      {/* gözlük */}
      {aksesuarlar.includes('gozluk') && (
        <g stroke="#2d3142" strokeWidth={2.2} fill="rgba(255,255,255,0.25)">
          <circle cx={51} cy={41} r={7.5} />
          <circle cx={69} cy={41} r={7.5} />
          <line x1={58.5} y1={41} x2={61.5} y2={41} />
        </g>
      )}

      {/* şapka */}
      {aksesuarlar.includes('sapka') && (
        <g>
          <path d="M38,26 C40,12 50,8 60,8 C70,8 80,12 82,26 Z" fill="#5cc8ff" />
          <rect x={34} y={24} width={52} height={6} rx={3} fill="#2ea3e0" />
        </g>
      )}
    </g>
  );
}

/** Bağımsız avatar görseli (düzenleyici ve profil için). */
export function Avatar({ config, boy = 170 }: { config: AvatarConfig; boy?: number }) {
  return (
    <svg
      width={(boy * 120) / 170}
      height={boy}
      viewBox="0 0 120 170"
      role="img"
      aria-label="Karakter"
    >
      <AvatarGovde config={config} />
    </svg>
  );
}
