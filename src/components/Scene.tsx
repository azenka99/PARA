// Görsel "hayat sahnesi" — flat/kawaii SVG.
// Finansal duruma tepki verir: ay sonu açık veriyorsa yağmur yağar,
// puan yüksekse güneş açar / yıldızlar parlar. Faz 1'de statik anlık görüntüdür;
// veri değişince yeniden çizilir.
import type { AppData, Arac, Ev, EvcilHayvan } from '../model/types';
import { altinDegeri, nakitAkisi, piyasaVarligi } from '../logic/finance';
import { puanHesapla } from '../logic/score';
import { tlKisa } from '../logic/format';
import { AvatarGovde } from './Avatar';
import { varsayilanAvatar, KIYAFET_RENKLERI } from '../model/defaults';

type Hava = 'gunesli' | 'parcali' | 'yagmurlu';

const YAZI = { fontFamily: "'Baloo 2', sans-serif", fontWeight: 700 } as const;

function Bulut({ x, y, olcek = 1, renk = '#ffffff' }: { x: number; y: number; olcek?: number; renk?: string }) {
  return (
    <g transform={`translate(${x},${y}) scale(${olcek})`} fill={renk}>
      <ellipse cx={0} cy={0} rx={34} ry={20} />
      <ellipse cx={-26} cy={8} rx={22} ry={14} />
      <ellipse cx={28} cy={8} rx={24} ry={15} />
    </g>
  );
}

function Yagmur({ x, y }: { x: number; y: number }) {
  const damlalar = [0, 18, 36, 54, 9, 27, 45].map((dx, i) => (
    <line key={i} x1={x + dx} y1={y + (i % 2) * 10} x2={x + dx - 4} y2={y + 14 + (i % 2) * 10} />
  ));
  return (
    <g stroke="#7f9ac9" strokeWidth={3} strokeLinecap="round" opacity={0.8}>
      {damlalar}
    </g>
  );
}

function Gunes() {
  const isinlar = Array.from({ length: 8 }, (_, i) => {
    const a = (i * Math.PI) / 4;
    return (
      <line
        key={i}
        x1={800 + Math.cos(a) * 46}
        y1={84 + Math.sin(a) * 46}
        x2={800 + Math.cos(a) * 60}
        y2={84 + Math.sin(a) * 60}
      />
    );
  });
  return (
    <g>
      <g stroke="#ffc93c" strokeWidth={6} strokeLinecap="round">{isinlar}</g>
      <circle cx={800} cy={84} r={36} fill="#ffd95c" />
      <circle cx={790} cy={78} r={5} fill="#fff" opacity={0.55} />
    </g>
  );
}

function Yildiz({ x, y, olcek = 1 }: { x: number; y: number; olcek?: number }) {
  return (
    <path
      transform={`translate(${x},${y}) scale(${olcek})`}
      d="M0,-8 L2,-2 L8,0 L2,2 L0,8 L-2,2 L-8,0 L-2,-2 Z"
      fill="#fff2b0"
    />
  );
}

function ArabaCizim({ arac, x, renk }: { arac: Arac; x: number; renk: string }) {
  return (
    <g transform={`translate(${x},0)`}>
      <rect x={14} y={2} width={52} height={22} rx={10} fill={renk} />
      <rect x={22} y={6} width={17} height={12} rx={5} fill="#dff2ff" />
      <rect x={43} y={6} width={15} height={12} rx={5} fill="#dff2ff" />
      <rect x={0} y={16} width={80} height={22} rx={11} fill={renk} />
      <circle cx={18} cy={40} r={9} fill="#2d3142" />
      <circle cx={18} cy={40} r={4} fill="#aab4c8" />
      <circle cx={62} cy={40} r={9} fill="#2d3142" />
      <circle cx={62} cy={40} r={4} fill="#aab4c8" />
      <text x={40} y={62} textAnchor="middle" fontSize={12} fill="#3d4666" style={YAZI}>
        {arac.marka} {arac.model}
      </text>
    </g>
  );
}

function EvCizim({ ev, x, taban }: { ev: Ev; x: number; taban: number }) {
  const etiketler: Record<Ev['durum'], string> = {
    sahibi: 'Evim',
    kiraci: 'Kiralık evim',
    kirada: 'Kirada',
    yazlik: 'Yazlık',
  };
  const govdeRenk = ev.durum === 'kiraci' ? '#d3dcee' : ev.durum === 'yazlik' ? '#ffedbe' : '#ffdca8';
  const catiRenk =
    ev.durum === 'kiraci' ? '#8a97b8' : ev.durum === 'yazlik' ? '#3ddc97' : '#ff8a5c';

  return (
    <g transform={`translate(${x},${taban})`}>
      {/* gövde: taban y=0 hizasında biter */}
      <rect x={0} y={-64} width={92} height={64} rx={8} fill={govdeRenk} />
      <path d={`M-8,-64 L46,-102 L100,-64 Z`} fill={catiRenk} />
      {ev.durum !== 'kiraci' && <rect x={66} y={-96} width={12} height={22} rx={3} fill={catiRenk} />}
      {/* kapı + pencere */}
      <rect x={14} y={-34} width={22} height={34} rx={8} fill="#8a6242" />
      <circle cx={32} cy={-16} r={2.2} fill="#ffd95c" />
      <rect x={50} y={-48} width={26} height={22} rx={6} fill="#bfe6ff" />
      <line x1={63} y1={-48} x2={63} y2={-26} stroke="#fff" strokeWidth={2} />
      {/* kirada tabelası */}
      {ev.durum === 'kirada' && (
        <g>
          <line x1={104} y1={0} x2={104} y2={-40} stroke="#8a6242" strokeWidth={4} strokeLinecap="round" />
          <rect x={88} y={-58} width={34} height={20} rx={5} fill="#ffc93c" />
          <text x={105} y={-44} textAnchor="middle" fontSize={9.5} fill="#6b5200" style={YAZI}>
            KİRADA
          </text>
        </g>
      )}
      {/* yazlık palmiyesi */}
      {ev.durum === 'yazlik' && (
        <g transform="translate(-22,0)">
          <path d="M0,0 C2,-24 4,-36 8,-46" stroke="#8a6242" strokeWidth={5} fill="none" strokeLinecap="round" />
          <ellipse cx={12} cy={-52} rx={16} ry={7} fill="#3ddc97" transform="rotate(-25 12 -52)" />
          <ellipse cx={4} cy={-52} rx={16} ry={7} fill="#22b377" transform="rotate(30 4 -52)" />
        </g>
      )}
      <text x={46} y={20} textAnchor="middle" fontSize={13} fill="#3d4666" style={YAZI}>
        {etiketler[ev.durum]}
      </text>
    </g>
  );
}

function EvcilCizim({ evcil, x, y }: { evcil: EvcilHayvan; x: number; y: number }) {
  const govde = (() => {
    switch (evcil.tur) {
      case 'kedi':
        return (
          <g>
            <ellipse cx={0} cy={6} rx={13} ry={9} fill="#f2a65a" />
            <circle cx={-11} cy={-4} r={8} fill="#f2a65a" />
            <path d="M-16,-9 L-15,-16 L-10,-11 Z M-7,-11 L-4,-16 L-4,-9 Z" fill="#f2a65a" />
            <circle cx={-13} cy={-5} r={1.3} fill="#2d2a3e" />
            <circle cx={-8} cy={-5} r={1.3} fill="#2d2a3e" />
            <path d="M12,4 C20,0 20,-8 15,-10" stroke="#f2a65a" strokeWidth={4} fill="none" strokeLinecap="round" />
          </g>
        );
      case 'kopek':
        return (
          <g>
            <ellipse cx={0} cy={6} rx={15} ry={10} fill="#c98a5a" />
            <circle cx={-13} cy={-5} r={9} fill="#c98a5a" />
            <ellipse cx={-19} cy={-9} rx={4} ry={7} fill="#a96f42" transform="rotate(20 -19 -9)" />
            <ellipse cx={-6} cy={-10} rx={4} ry={7} fill="#a96f42" transform="rotate(-15 -6 -10)" />
            <circle cx={-15} cy={-5} r={1.4} fill="#2d2a3e" />
            <circle cx={-10} cy={-5} r={1.4} fill="#2d2a3e" />
            <path d="M14,2 C20,-2 21,-7 18,-9" stroke="#c98a5a" strokeWidth={4} fill="none" strokeLinecap="round" />
          </g>
        );
      case 'kus':
        return (
          <g>
            <ellipse cx={0} cy={0} rx={9} ry={8} fill="#5cc8ff" />
            <circle cx={-6} cy={-6} r={5.5} fill="#5cc8ff" />
            <path d="M-11,-6 L-16,-4 L-11,-2 Z" fill="#ffc93c" />
            <circle cx={-7} cy={-7} r={1.2} fill="#2d2a3e" />
            <ellipse cx={4} cy={0} rx={5} ry={3.5} fill="#2ea3e0" />
            <line x1={-2} y1={8} x2={-2} y2={13} stroke="#ffc93c" strokeWidth={2} />
            <line x1={3} y1={8} x2={3} y2={13} stroke="#ffc93c" strokeWidth={2} />
          </g>
        );
      case 'balik':
        return (
          <g>
            <circle cx={0} cy={0} r={13} fill="#d6f0ff" opacity={0.85} />
            <path d="M-13,-1 A13,13 0 0,0 13,-1" fill="#aee3ff" />
            <ellipse cx={0} cy={2} rx={6} ry={4} fill="#ff8a5c" />
            <path d="M6,2 L11,-2 L11,6 Z" fill="#ff8a5c" />
            <circle cx={-3} cy={1} r={1} fill="#2d2a3e" />
          </g>
        );
      default:
        return (
          <g>
            <ellipse cx={0} cy={4} rx={11} ry={9} fill="#b8a1e8" />
            <circle cx={0} cy={-6} r={7} fill="#b8a1e8" />
            <circle cx={-2.5} cy={-7} r={1.2} fill="#2d2a3e" />
            <circle cx={2.5} cy={-7} r={1.2} fill="#2d2a3e" />
          </g>
        );
    }
  })();

  return (
    <g transform={`translate(${x},${y})`}>
      {govde}
      {evcil.ad && (
        <text x={0} y={30} textAnchor="middle" fontSize={11.5} fill="#3d4666" style={YAZI}>
          {evcil.ad}
        </text>
      )}
    </g>
  );
}

function KulceYigini({ deger, x, taban }: { deger: number; x: number; taban: number }) {
  if (deger <= 0) return null;
  const adet = Math.min(9, 1 + Math.floor(deger / 100000));
  const siralar: number[][] = [];
  let kalan = adet;
  let sira = 0;
  while (kalan > 0) {
    const buSira = Math.min(kalan, 4 - sira);
    siralar.push(Array.from({ length: buSira }));
    kalan -= buSira;
    sira++;
  }
  return (
    <g transform={`translate(${x},${taban})`}>
      {siralar.map((s, si) =>
        s.map((_, i) => (
          <g key={`${si}-${i}`} transform={`translate(${i * 26 + si * 13},${-si * 12})`}>
            <path d="M3,0 L23,0 L20,-10 L6,-10 Z" fill="#ffc93c" stroke="#e0a800" strokeWidth={1.2} />
            <path d="M6,-10 L20,-10 L19,-7 L7,-7 Z" fill="#ffe08a" />
          </g>
        )),
      )}
      <text x={40} y={20} textAnchor="middle" fontSize={12} fill="#3d4666" style={YAZI}>
        Altın · {tlKisa(deger)}
      </text>
    </g>
  );
}

function YatirimAgaci({ deger, x, taban }: { deger: number; x: number; taban: number }) {
  if (deger <= 0) return null;
  const olcek = Math.min(1.5, 0.55 + deger / 1_500_000);
  const paraGoster = deger >= 250000;
  return (
    <g transform={`translate(${x},${taban})`}>
      <g transform={`scale(${olcek})`}>
        <rect x={-7} y={-46} width={14} height={46} rx={6} fill="#8a6242" />
        <circle cx={0} cy={-72} r={34} fill="#3ddc97" />
        <circle cx={-27} cy={-56} r={22} fill="#22b377" />
        <circle cx={27} cy={-56} r={22} fill="#4be8a8" />
        {paraGoster && (
          <g style={YAZI}>
            <circle cx={-14} cy={-70} r={8} fill="#ffc93c" stroke="#e0a800" strokeWidth={1.5} />
            <text x={-14} y={-66} textAnchor="middle" fontSize={10} fill="#6b5200">₺</text>
            <circle cx={16} cy={-52} r={8} fill="#ffc93c" stroke="#e0a800" strokeWidth={1.5} />
            <text x={16} y={-48} textAnchor="middle" fontSize={10} fill="#6b5200">₺</text>
          </g>
        )}
      </g>
      <text x={0} y={20} textAnchor="middle" fontSize={12} fill="#3d4666" style={YAZI}>
        Yatırımlar · {tlKisa(deger)}
      </text>
    </g>
  );
}

/** Çocuk avatarı: yaşa göre boy. */
function cocukBoyu(yas: number): number {
  return Math.min(105, 58 + yas * 3);
}

export function Sahne({ veri }: { veri: AppData }) {
  const puan = puanHesapla(veri).toplam;
  const akis = nakitAkisi(veri);

  const hava: Hava = akis < 0 ? 'yagmurlu' : puan >= 65 ? 'gunesli' : 'parcali';
  const gokyuzu =
    hava === 'yagmurlu'
      ? ['#8d99bd', '#c3cade']
      : hava === 'gunesli'
        ? ['#9edcff', '#e8f8ff']
        : ['#b9c9e6', '#eef2fa'];

  const zeminUst = 372;

  // Karakterler: kullanıcı + eş + çocuklar, zemin üzerinde yan yana.
  const evli = veri.profil.medeniHal === 'evli' && veri.profil.esAvatar;
  const karakterler: JSX.Element[] = [];
  let kx = 300;
  const ayak = 430;

  const kullaniciBoy = 128;
  karakterler.push(
    <svg key="ben" x={kx} y={ayak - kullaniciBoy} width={(kullaniciBoy * 120) / 170} height={kullaniciBoy} viewBox="0 0 120 170">
      <AvatarGovde config={veri.profil.avatar} />
    </svg>,
  );
  kx += 78;

  if (evli && veri.profil.esAvatar) {
    karakterler.push(
      <svg key="es" x={kx} y={ayak - kullaniciBoy} width={(kullaniciBoy * 120) / 170} height={kullaniciBoy} viewBox="0 0 120 170">
        <AvatarGovde config={veri.profil.esAvatar} />
      </svg>,
    );
    kx += 78;
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
          <text x={kx + (boy * 120) / 340} y={ayak + 16} textAnchor="middle" fontSize={11.5} fill="#3d4666" style={YAZI}>
            {c.ad}
          </text>
        )}
      </g>,
    );
    kx += (boy * 120) / 170 + 12;
  });

  const arabaRenkleri = ['#ff7ab8', '#5cc8ff', '#ffc93c', '#3ddc97', '#b8a1e8'];
  const gosterilenAraclar = veri.araclar.slice(0, 3);
  const gosterilenEvler = veri.evler.slice(0, 3);

  return (
    <svg viewBox="0 0 900 540" role="img" aria-label="Finansal manzara sahnesi">
      {/* gökyüzü */}
      <defs>
        <linearGradient id="gok" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={gokyuzu[0]} />
          <stop offset="1" stopColor={gokyuzu[1]} />
        </linearGradient>
      </defs>
      <rect width={900} height={540} fill="url(#gok)" />

      {hava === 'gunesli' && <Gunes />}
      {hava === 'gunesli' && puan >= 85 && (
        <g>
          <Yildiz x={640} y={60} />
          <Yildiz x={700} y={130} olcek={0.7} />
          <Yildiz x={560} y={100} olcek={0.85} />
        </g>
      )}
      {hava === 'parcali' && (
        <g>
          <Bulut x={620} y={80} />
          <Bulut x={760} y={120} olcek={0.8} renk="#f2f5fb" />
          <Bulut x={480} y={60} olcek={0.65} renk="#f2f5fb" />
        </g>
      )}
      {hava === 'yagmurlu' && (
        <g>
          <Bulut x={480} y={80} olcek={1.15} renk="#8d99b5" />
          <Bulut x={640} y={110} renk="#9aa6c2" />
          <Bulut x={790} y={70} olcek={0.9} renk="#8d99b5" />
          <Yagmur x={450} y={120} />
          <Yagmur x={610} y={150} />
          <Yagmur x={770} y={110} />
        </g>
      )}

      {/* zemin */}
      <ellipse cx={450} cy={620} rx={640} ry={250} fill="#98e0a8" />
      <ellipse cx={450} cy={632} rx={640} ry={250} fill="#7ed194" opacity={0.5} />

      {/* çapraz park alanı — sol üst */}
      {gosterilenAraclar.length > 0 && (
        <g transform="rotate(-11 160 140)">
          <rect
            x={16}
            y={64}
            width={64 + gosterilenAraclar.length * 92}
            height={128}
            rx={18}
            fill="#aab4c8"
          />
          <rect
            x={26}
            y={74}
            width={44 + gosterilenAraclar.length * 92}
            height={108}
            rx={12}
            fill="none"
            stroke="#ffffff"
            strokeWidth={3}
            strokeDasharray="10 8"
            opacity={0.7}
          />
          {gosterilenAraclar.map((a, i) => (
            <g key={a.id} transform={`translate(0,96)`}>
              <ArabaCizim arac={a} x={44 + i * 92} renk={arabaRenkleri[i % arabaRenkleri.length]} />
            </g>
          ))}
          {veri.araclar.length > 3 && (
            <text x={40 + 3 * 92 + 46} y={140} fontSize={15} fill="#3d4666" style={YAZI}>
              +{veri.araclar.length - 3}
            </text>
          )}
        </g>
      )}

      {/* evler — sağda */}
      {gosterilenEvler.map((ev, i) => (
        <EvCizim key={ev.id} ev={ev} x={560 + i * 118} taban={zeminUst + 34 + i * 6} />
      ))}
      {veri.evler.length > 3 && (
        <text x={860} y={zeminUst + 80} fontSize={15} fill="#3d4666" style={YAZI} textAnchor="middle">
          +{veri.evler.length - 3} ev
        </text>
      )}

      {/* yatırım ağacı — sol alan, altın yığınının yanında */}
      <YatirimAgaci deger={piyasaVarligi(veri)} x={215} taban={zeminUst + 128} />

      {/* altın yığını */}
      <KulceYigini deger={altinDegeri(veri)} x={55} taban={zeminUst + 122} />

      {/* karakterler */}
      {karakterler}

      {/* evcil hayvanlar — karakterlerin yanında */}
      {veri.profil.evciller.map((e, i) => (
        <EvcilCizim key={e.id} evcil={e} x={kx + 28 + i * 54} y={ayak - 12} />
      ))}
    </svg>
  );
}
