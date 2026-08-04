// Görsel "hayat sahnesi" — olgun flat illüstrasyon.
// Finansal duruma tepki verir: ay sonu açık veriyorsa yağmur yağar,
// puan yüksekse güneş açar / yıldızlar parlar. Hava öğeleri hafifçe animasyonludur
// (bulut süzülmesi, yağmur, baca dumanı); "hareketi azalt" sistem tercihine saygı duyar.
import type { AppData, Arac, Ev, EvcilHayvan } from '../model/types';
import { dagilimSepetleri, nakitAkisi, netDeger } from '../logic/finance';
import { puanHesapla } from '../logic/score';
import { tlKisa } from '../logic/format';
import { AvatarGovde } from './Avatar';
import { varsayilanAvatar, KIYAFET_RENKLERI } from '../model/defaults';
import { useGizli } from '../state';

type Hava = 'gunesli' | 'parcali' | 'yagmurlu';

const YAZI = { fontFamily: "'Manrope', sans-serif", fontWeight: 700 } as const;
const PLAKA = '#22304a';
const SEPET_RENKLERI = ['#23456e', '#c08a2d', '#2e7d5e', '#3d7ea6', '#8a2f4f', '#5d6b81'];

/* ---------------- hava öğeleri ---------------- */

function Bulut({ x, y, olcek = 1, renk = '#ffffff', sinif = 'anim-bulut-a', opaklik = 0.92 }: {
  x: number; y: number; olcek?: number; renk?: string; sinif?: string; opaklik?: number;
}) {
  return (
    <g className={sinif} transform={`translate(${x},${y}) scale(${olcek})`} fill={renk} opacity={opaklik}>
      <ellipse cx={0} cy={0} rx={36} ry={18} />
      <ellipse cx={-28} cy={7} rx={22} ry={12} />
      <ellipse cx={28} cy={7} rx={25} ry={13} />
      <ellipse cx={2} cy={-10} rx={20} ry={12} />
    </g>
  );
}

function Yagmur({ x, y, gecikme = 0 }: { x: number; y: number; gecikme?: number }) {
  return (
    <g
      className="anim-yagmur"
      style={{ animationDelay: `${gecikme}s` }}
      stroke="#9db2d4"
      strokeWidth={2.4}
      strokeLinecap="round"
      opacity={0.75}
    >
      {[0, 16, 32, 48, 64, 8, 24, 40, 56].map((dx, i) => (
        <line key={i} x1={x + dx} y1={y + (i % 3) * 9} x2={x + dx - 3} y2={y + 13 + (i % 3) * 9} />
      ))}
    </g>
  );
}

function Gunes() {
  return (
    <g className="anim-gunes">
      <circle cx={812} cy={86} r={54} fill="#f2c94c" opacity={0.18} />
      <circle cx={812} cy={86} r={38} fill="#f2c94c" opacity={0.35} />
      <circle cx={812} cy={86} r={27} fill="#f5d06c" />
    </g>
  );
}

function Yildizlar() {
  const noktalar: Array<[number, number, number]> = [
    [640, 62, 2.4], [702, 118, 1.8], [566, 96, 2.0], [745, 58, 1.6], [608, 140, 1.5],
  ];
  return (
    <g fill="#fdf3d0">
      {noktalar.map(([x, y, r], i) => (
        <circle key={i} className="anim-yildiz" style={{ animationDelay: `${i * 0.6}s` }} cx={x} cy={y} r={r} />
      ))}
    </g>
  );
}

/* ---------------- araçlar ---------------- */

function ArabaCizim({ arac, x, renk }: { arac: Arac; x: number; renk: string }) {
  return (
    <g transform={`translate(${x},0)`}>
      <path
        d="M4,26 C4,18 10,16 16,15 L24,6 C26,3 30,2 36,2 L58,2 C64,2 68,4 71,8 L77,15 C84,16 88,19 88,26 L88,30 C88,33 86,34 83,34 L9,34 C6,34 4,33 4,30 Z"
        fill={renk}
      />
      <path d="M27,7 L36,7 L36,15 L21,15 Z M40,7 L55,7 C58,7 60,9 62,12 L64,15 L40,15 Z" fill="#cfe3f2" />
      <circle cx={22} cy={34} r={8.5} fill="#232b38" />
      <circle cx={22} cy={34} r={3.6} fill="#98a5b8" />
      <circle cx={70} cy={34} r={8.5} fill="#232b38" />
      <circle cx={70} cy={34} r={3.6} fill="#98a5b8" />
      <text x={46} y={58} textAnchor="middle" fontSize={11.5} fill="#f2f5fa" style={YAZI}>
        {arac.marka} {arac.model}
      </text>
    </g>
  );
}

function MotosikletCizim({ arac, x }: { arac: Arac; x: number }) {
  return (
    <g transform={`translate(${x},0)`}>
      <circle cx={16} cy={32} r={10} fill="none" stroke="#232b38" strokeWidth={4.5} />
      <circle cx={62} cy={32} r={10} fill="none" stroke="#232b38" strokeWidth={4.5} />
      <path d="M16,32 L32,16 L48,16 L62,32" fill="none" stroke="#4a5a74" strokeWidth={4} strokeLinecap="round" />
      <path d="M30,16 L24,8 M24,8 L18,8" fill="none" stroke="#4a5a74" strokeWidth={3.5} strokeLinecap="round" />
      <rect x={36} y={11} width={18} height={7} rx={3.5} fill="#8a2f4f" />
      <text x={40} y={58} textAnchor="middle" fontSize={11.5} fill="#f2f5fa" style={YAZI}>
        {arac.marka} {arac.model}
      </text>
    </g>
  );
}

/* ---------------- evler ---------------- */

function Plaka({ x, y, metin, genislik }: { x: number; y: number; metin: string; genislik: number }) {
  return (
    <g>
      <rect x={x - genislik / 2} y={y} width={genislik} height={21} rx={6} fill={PLAKA} />
      <text x={x} y={y + 14.5} textAnchor="middle" fontSize={11} fill="#fff" letterSpacing="0.08em" style={YAZI}>
        {metin}
      </text>
    </g>
  );
}

function EvCizim({ ev, x, taban }: { ev: Ev; x: number; taban: number }) {
  switch (ev.durum) {
    case 'sahibi':
      // İki katlı aile evi — bacasından duman tüter
      return (
        <g transform={`translate(${x},${taban})`}>
          <g>
            <circle className="anim-duman" cx={74} cy={-118} r={5} fill="#c9d2de" />
            <circle className="anim-duman" style={{ animationDelay: '1.7s' }} cx={78} cy={-116} r={4} fill="#d6dde7" />
            <circle className="anim-duman" style={{ animationDelay: '3.4s' }} cx={71} cy={-114} r={3.4} fill="#c9d2de" />
          </g>
          <rect x={68} y={-124} width={12} height={26} rx={2} fill="#8f6b4e" />
          <rect x={2} y={-84} width={92} height={84} rx={3} fill="#ead9bd" />
          <path d="M-8,-84 L48,-122 L104,-84 Z" fill="#2e4666" />
          <rect x={12} y={-72} width={20} height={16} rx={3} fill="#b8d4e8" />
          <rect x={62} y={-72} width={20} height={16} rx={3} fill="#b8d4e8" />
          <rect x={12} y={-40} width={20} height={16} rx={3} fill="#b8d4e8" />
          <rect x={58} y={-42} width={24} height={42} rx={3} fill="#6e4f38" />
          <circle cx={77} cy={-20} r={1.8} fill="#d8b25c" />
          <line x1={2} y1={-46} x2={94} y2={-46} stroke="#d8c3a0" strokeWidth={2.5} />
          <Plaka x={48} y={8} metin="EVİM" genislik={72} />
        </g>
      );
    case 'kiraci':
      // Mütevazı tek katlı ev — kirada oturulan
      return (
        <g transform={`translate(${x},${taban})`}>
          <rect x={6} y={-56} width={84} height={56} rx={3} fill="#c8d1de" />
          <rect x={0} y={-64} width={96} height={12} rx={3} fill="#5d6b81" />
          <rect x={16} y={-42} width={20} height={16} rx={3} fill="#e6eef6" />
          <rect x={56} y={-42} width={22} height={42} rx={3} fill="#4a5a74" />
          <circle cx={73} cy={-20} r={1.6} fill="#c8d1de" />
          <Plaka x={48} y={8} metin="KİRA" genislik={64} />
        </g>
      );
    case 'kirada':
      // Kiraya verilen apartman dairesi — amber ₺ rozetli
      return (
        <g transform={`translate(${x},${taban})`}>
          <rect x={12} y={-104} width={72} height={104} rx={3} fill="#dcccae" />
          <rect x={8} y={-110} width={80} height={9} rx={3} fill="#a08a63" />
          {[-92, -66, -40].map((wy) =>
            [22, 54].map((wx) => (
              <rect key={`${wx}-${wy}`} x={wx} y={wy} width={18} height={15} rx={2.5} fill="#b8d4e8" />
            )),
          )}
          <rect x={38} y={-18} width={20} height={18} rx={2.5} fill="#6e5a3e" />
          <g>
            <circle cx={86} cy={-102} r={13} fill="#c08a2d" />
            <text x={86} y={-97} textAnchor="middle" fontSize={14} fill="#fff" style={YAZI}>₺</text>
          </g>
          <Plaka x={48} y={8} metin="KİRADA" genislik={78} />
        </g>
      );
    default:
      // Yazlık — alçak bungalov, plaj şemsiyesi
      return (
        <g transform={`translate(${x},${taban})`}>
          <rect x={4} y={-48} width={88} height={48} rx={3} fill="#f0e6d2" />
          <path d="M-4,-48 L14,-70 L82,-70 L100,-48 Z" fill="#b45f3c" />
          <rect x={16} y={-34} width={20} height={15} rx={3} fill="#a8d4e0" />
          <rect x={56} y={-36} width={22} height={36} rx={3} fill="#7a5c40" />
          <g transform="translate(-18,0)">
            <line x1={0} y1={0} x2={0} y2={-42} stroke="#8f7a5a" strokeWidth={3.5} strokeLinecap="round" />
            <path d="M-22,-40 A22,10 0 0,1 22,-40 Z" fill="#c08a2d" />
            <path d="M-22,-40 A22,10 0 0,1 -7,-46 L0,-40 Z" fill="#f0e6d2" />
            <path d="M7,-46 A22,10 0 0,1 22,-40 L0,-40 Z" fill="#f0e6d2" />
          </g>
          <ellipse cx={30} cy={14} rx={26} ry={6} fill="#7ab8d4" opacity={0.75} />
          <Plaka x={52} y={8} metin="YAZLIK" genislik={76} />
        </g>
      );
  }
}

/* ---------------- evcil hayvanlar ---------------- */

function EvcilCizim({ evcil, x, y }: { evcil: EvcilHayvan; x: number; y: number }) {
  const govde = (() => {
    switch (evcil.tur) {
      case 'kedi':
        return (
          <g>
            <ellipse cx={0} cy={6} rx={13} ry={9} fill="#c98f56" />
            <circle cx={-11} cy={-4} r={8} fill="#c98f56" />
            <path d="M-16,-9 L-15,-16 L-10,-11 Z M-7,-11 L-4,-16 L-4,-9 Z" fill="#c98f56" />
            <circle cx={-13} cy={-5} r={1.3} fill="#2b2b33" />
            <circle cx={-8} cy={-5} r={1.3} fill="#2b2b33" />
            <path d="M12,4 C20,0 20,-8 15,-10" stroke="#c98f56" strokeWidth={4} fill="none" strokeLinecap="round" />
          </g>
        );
      case 'kopek':
        return (
          <g>
            <ellipse cx={0} cy={6} rx={15} ry={10} fill="#a87a4e" />
            <circle cx={-13} cy={-5} r={9} fill="#a87a4e" />
            <ellipse cx={-19} cy={-9} rx={4} ry={7} fill="#8a6240" transform="rotate(20 -19 -9)" />
            <ellipse cx={-6} cy={-10} rx={4} ry={7} fill="#8a6240" transform="rotate(-15 -6 -10)" />
            <circle cx={-15} cy={-5} r={1.4} fill="#2b2b33" />
            <circle cx={-10} cy={-5} r={1.4} fill="#2b2b33" />
            <path d="M14,2 C20,-2 21,-7 18,-9" stroke="#a87a4e" strokeWidth={4} fill="none" strokeLinecap="round" />
          </g>
        );
      case 'kus':
        return (
          <g>
            <ellipse cx={0} cy={0} rx={9} ry={8} fill="#4e8cb8" />
            <circle cx={-6} cy={-6} r={5.5} fill="#4e8cb8" />
            <path d="M-11,-6 L-16,-4 L-11,-2 Z" fill="#d8a24c" />
            <circle cx={-7} cy={-7} r={1.2} fill="#2b2b33" />
            <ellipse cx={4} cy={0} rx={5} ry={3.5} fill="#39698a" />
            <line x1={-2} y1={8} x2={-2} y2={13} stroke="#d8a24c" strokeWidth={2} />
            <line x1={3} y1={8} x2={3} y2={13} stroke="#d8a24c" strokeWidth={2} />
          </g>
        );
      case 'balik':
        return (
          <g>
            <circle cx={0} cy={0} r={13} fill="#d9ecf5" opacity={0.9} />
            <path d="M-13,-1 A13,13 0 0,0 13,-1" fill="#b0d6e8" />
            <ellipse cx={0} cy={2} rx={6} ry={4} fill="#c96f45" />
            <path d="M6,2 L11,-2 L11,6 Z" fill="#c96f45" />
            <circle cx={-3} cy={1} r={1} fill="#2b2b33" />
          </g>
        );
      default:
        return (
          <g>
            <ellipse cx={0} cy={4} rx={11} ry={9} fill="#9a8ab8" />
            <circle cx={0} cy={-6} r={7} fill="#9a8ab8" />
            <circle cx={-2.5} cy={-7} r={1.2} fill="#2b2b33" />
            <circle cx={2.5} cy={-7} r={1.2} fill="#2b2b33" />
          </g>
        );
    }
  })();

  return (
    <g transform={`translate(${x},${y})`}>
      {govde}
      {evcil.ad && (
        <text x={0} y={30} textAnchor="middle" fontSize={11} fill="#31435f" style={YAZI}>
          {evcil.ad}
        </text>
      )}
    </g>
  );
}

/* ---------------- portföy paneli ---------------- */

function PortfoyPaneli({ veri, x, y }: { veri: AppData; x: number; y: number }) {
  const { gizli, tutar } = useGizli();
  const kisa = (deger: number) => (gizli ? '•••' : tlKisa(deger));
  const sepetler = dagilimSepetleri(veri)
    .map((s, i) => ({ ...s, renk: SEPET_RENKLERI[i % SEPET_RENKLERI.length] }))
    .filter((s) => s.deger > 0)
    .sort((a, b) => b.deger - a.deger);
  const toplam = sepetler.reduce((t, s) => t + s.deger, 0);
  if (toplam <= 0) return null;

  const gosterilen = sepetler.slice(0, 4);
  const digerToplam = sepetler.slice(4).reduce((t, s) => t + s.deger, 0);

  const r = 27;
  const cevre = 2 * Math.PI * r;
  let baslangic = 0;
  const dilimler = sepetler.map((s) => {
    const uzunluk = (s.deger / toplam) * cevre;
    const d = { renk: s.renk, uzunluk, ofset: baslangic };
    baslangic += uzunluk;
    return d;
  });

  const yukseklik = 66 + gosterilen.length * 17 + (digerToplam > 0 ? 17 : 0);

  return (
    <g transform={`translate(${x},${y})`}>
      <rect width={264} height={yukseklik} rx={13} fill="#ffffff" opacity={0.94} stroke="#c7d0dd" />
      <text x={16} y={24} fontSize={11.5} fill="#5d6b81" letterSpacing="0.12em" style={YAZI}>
        PORTFÖY
      </text>
      <text x={248} y={24} fontSize={13.5} fill="#1d2635" textAnchor="end" style={YAZI}>
        {tutar(netDeger(veri))}
      </text>

      <g transform={`translate(50,${(yukseklik + 26) / 2})`}>
        {dilimler.map((d, i) => (
          <circle
            key={i}
            r={r}
            fill="none"
            stroke={d.renk}
            strokeWidth={13}
            strokeDasharray={`${Math.max(0.5, d.uzunluk - 1.6)} ${cevre - Math.max(0.5, d.uzunluk - 1.6)}`}
            strokeDashoffset={-d.ofset}
            transform="rotate(-90)"
          />
        ))}
      </g>

      <g transform="translate(98,42)">
        {gosterilen.map((s, i) => (
          <g key={s.ad} transform={`translate(0,${i * 17})`}>
            <rect width={9} height={9} rx={2.5} fill={s.renk} y={-8} />
            <text x={15} fontSize={10.5} fill="#3a4a63" style={YAZI}>
              {s.ad}
            </text>
            <text x={150} fontSize={10.5} fill="#1d2635" textAnchor="end" style={YAZI}>
              {kisa(s.deger)}
            </text>
          </g>
        ))}
        {digerToplam > 0 && (
          <g transform={`translate(0,${gosterilen.length * 17})`}>
            <rect width={9} height={9} rx={2.5} fill="#98a5b8" y={-8} />
            <text x={15} fontSize={10.5} fill="#3a4a63" style={YAZI}>
              diğer
            </text>
            <text x={150} fontSize={10.5} fill="#1d2635" textAnchor="end" style={YAZI}>
              {kisa(digerToplam)}
            </text>
          </g>
        )}
      </g>
    </g>
  );
}

/** Arka plan dekoru — sade, mat renkli ağaç. */
function DekorAgac({ x, y, olcek = 1 }: { x: number; y: number; olcek?: number }) {
  return (
    <g transform={`translate(${x},${y}) scale(${olcek})`}>
      <rect x={-4.5} y={-32} width={9} height={32} rx={4} fill="#7a5c40" />
      <circle cx={0} cy={-46} r={21} fill="#4f7f5c" />
      <circle cx={-15} cy={-35} r={14} fill="#457050" />
      <circle cx={15} cy={-35} r={14} fill="#5c8f68" />
    </g>
  );
}

/* ---------------- sahne ---------------- */

function cocukBoyu(yas: number): number {
  return Math.min(105, 58 + yas * 3);
}

export function Sahne({ veri }: { veri: AppData }) {
  const puan = puanHesapla(veri).toplam;
  const akis = nakitAkisi(veri);

  const hava: Hava = akis < 0 ? 'yagmurlu' : puan >= 65 ? 'gunesli' : 'parcali';
  const gokyuzu =
    hava === 'yagmurlu'
      ? ['#77879f', '#c2cad6']
      : hava === 'gunesli'
        ? ['#8fc3e8', '#ddedf8']
        : ['#a7b4c8', '#dde3ec'];

  const zeminUst = 380;
  const ayak = 452;

  // Karakterler: kullanıcı + eş + çocuklar, zemin üzerinde yan yana.
  const evli = veri.profil.medeniHal === 'evli' && veri.profil.esAvatar;
  const karakterler: JSX.Element[] = [];
  let kx = 306;
  const kullaniciBoy = 126;

  karakterler.push(
    <svg key="ben" x={kx} y={ayak - kullaniciBoy} width={(kullaniciBoy * 120) / 170} height={kullaniciBoy} viewBox="0 0 120 170">
      <AvatarGovde config={veri.profil.avatar} />
    </svg>,
  );
  kx += 76;

  if (evli && veri.profil.esAvatar) {
    karakterler.push(
      <svg key="es" x={kx} y={ayak - kullaniciBoy} width={(kullaniciBoy * 120) / 170} height={kullaniciBoy} viewBox="0 0 120 170">
        <AvatarGovde config={veri.profil.esAvatar} />
      </svg>,
    );
    kx += 76;
  }

  veri.profil.cocuklar.forEach((c, i) => {
    const boy = cocukBoyu(c.yas);
    const cfg = {
      ...varsayilanAvatar(),
      ciltTonu: veri.profil.avatar.ciltTonu,
      sacRengi: veri.profil.avatar.sacRengi,
      kiyafetRengi: KIYAFET_RENKLERI[(i + 2) % KIYAFET_RENKLERI.length],
    };
    karakterler.push(
      <g key={`cocuk-${c.id}`}>
        <svg x={kx} y={ayak - boy} width={(boy * 120) / 170} height={boy} viewBox="0 0 120 170">
          <AvatarGovde config={cfg} />
        </svg>
        {c.ad && (
          <text x={kx + (boy * 120) / 340} y={ayak + 16} textAnchor="middle" fontSize={11} fill="#31435f" style={YAZI}>
            {c.ad}
          </text>
        )}
      </g>,
    );
    kx += (boy * 120) / 170 + 12;
  });

  const arabaRenkleri = ['#31548e', '#8a2f4f', '#2e7d5e', '#b45f3c', '#4a4a68'];
  const gosterilenAraclar = veri.araclar.slice(0, 3);
  const gosterilenEvler = veri.evler.slice(0, 3);

  return (
    <svg viewBox="0 0 900 560" role="img" aria-label="Finansal manzara sahnesi">
      <defs>
        <linearGradient id="gok" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={gokyuzu[0]} />
          <stop offset="1" stopColor={gokyuzu[1]} />
        </linearGradient>
      </defs>
      <rect width={900} height={560} fill="url(#gok)" />

      {hava === 'gunesli' && <Gunes />}
      {hava === 'gunesli' && puan >= 85 && <Yildizlar />}
      {hava === 'gunesli' && (
        <Bulut x={520} y={92} olcek={0.75} sinif="anim-bulut-b" opaklik={0.55} />
      )}
      {hava === 'parcali' && (
        <g>
          <Bulut x={620} y={84} sinif="anim-bulut-a" />
          <Bulut x={770} y={124} olcek={0.8} renk="#f2f5fa" sinif="anim-bulut-b" />
          <Bulut x={470} y={62} olcek={0.6} renk="#f2f5fa" sinif="anim-bulut-b" />
        </g>
      )}
      {hava === 'yagmurlu' && (
        <g>
          <Bulut x={470} y={82} olcek={1.15} renk="#8d99b0" sinif="anim-bulut-a" opaklik={1} />
          <Bulut x={640} y={112} renk="#98a4ba" sinif="anim-bulut-b" opaklik={1} />
          <Bulut x={800} y={72} olcek={0.9} renk="#8d99b0" sinif="anim-bulut-a" opaklik={1} />
          <Yagmur x={440} y={122} />
          <Yagmur x={610} y={152} gecikme={0.35} />
          <Yagmur x={770} y={112} gecikme={0.65} />
        </g>
      )}

      {/* zemin — katmanlı tepeler */}
      <path d="M0,412 C140,364 320,360 470,388 C640,420 760,392 900,368 L900,560 L0,560 Z" fill="#86ab8a" />
      <DekorAgac x={72} y={432} olcek={0.8} />
      <DekorAgac x={128} y={444} />
      <DekorAgac x={508} y={430} olcek={0.7} />
      <DekorAgac x={876} y={452} olcek={0.9} />
      <path d="M0,448 C180,404 400,398 560,424 C700,446 800,432 900,416 L900,560 L0,560 Z" fill="#6f9b76" />
      <path d="M0,500 C220,464 480,462 900,486 L900,560 L0,560 Z" fill="#5f8c67" />
      {hava === 'yagmurlu' && (
        <>
          <rect y={360} width={900} height={200} fill="#4a5a74" opacity={0.14} />
          <ellipse cx={340} cy={508} rx={46} ry={6} fill="#aebfd8" opacity={0.5} />
          <ellipse cx={600} cy={528} rx={34} ry={5} fill="#aebfd8" opacity={0.45} />
        </>
      )}

      {/* çapraz park alanı — sol üst */}
      {gosterilenAraclar.length > 0 && (
        <g transform="rotate(-9 160 150)">
          <rect
            x={18}
            y={88}
            width={54 + gosterilenAraclar.length * 102}
            height={116}
            rx={14}
            fill="#7d8aa0"
          />
          <line x1={30} y1={100} x2={30} y2={192} stroke="#e8edf4" strokeWidth={2.5} strokeDasharray="7 7" opacity={0.55} />
          {gosterilenAraclar.map((a, i) => (
            <line
              key={`cizgi-${a.id}`}
              x1={130 + i * 102}
              y1={100}
              x2={130 + i * 102}
              y2={192}
              stroke="#e8edf4"
              strokeWidth={2.5}
              strokeDasharray="7 7"
              opacity={0.55}
            />
          ))}
          {gosterilenAraclar.map((a, i) =>
            a.tur === 'motosiklet' ? (
              <g key={a.id} transform="translate(0,118)">
                <MotosikletCizim arac={a} x={40 + i * 102} />
              </g>
            ) : (
              <g key={a.id} transform="translate(0,112)">
                <ArabaCizim arac={a} x={34 + i * 102} renk={arabaRenkleri[i % arabaRenkleri.length]} />
              </g>
            ),
          )}
          {veri.araclar.length > 3 && (
            <text x={40 + 3 * 102 + 8} y={155} fontSize={14} fill="#e8edf4" style={YAZI}>
              +{veri.araclar.length - 3}
            </text>
          )}
        </g>
      )}

      {/* evler — sağda */}
      {gosterilenEvler.map((ev, i) => (
        <EvCizim key={ev.id} ev={ev} x={548 + i * 120} taban={zeminUst + 42 + i * 8} />
      ))}
      {veri.evler.length > 3 && (
        <text x={862} y={zeminUst + 96} fontSize={14} fill="#31435f" style={YAZI} textAnchor="middle">
          +{veri.evler.length - 3} ev
        </text>
      )}

      {/* karakterler */}
      {karakterler}

      {/* evcil hayvanlar — ön bahçede, karakterlerin önünde */}
      {veri.profil.evciller.map((e, i) => (
        <EvcilCizim key={e.id} evcil={e} x={338 + i * 58} y={ayak + 36} />
      ))}

      {/* portföy paneli — gökyüzünde bilgi kartı */}
      <PortfoyPaneli veri={veri} x={318} y={22} />
    </svg>
  );
}
