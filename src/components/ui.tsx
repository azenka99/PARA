// Ortak arayüz bileşenleri — PARA tasarım dili.
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

export function Kart({
  baslik,
  aciklama,
  children,
  className,
}: {
  baslik?: ReactNode;
  aciklama?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`kart${className ? ' ' + className : ''}`}>
      {baslik && <h3 className="kart-baslik">{baslik}</h3>}
      {aciklama && <p className="kart-aciklama">{aciklama}</p>}
      {children}
    </div>
  );
}

export function Buton({
  children,
  onClick,
  renk,
  kucuk,
  disabled,
  tip,
}: {
  children: ReactNode;
  onClick?: () => void;
  renk?: 'birincil' | 'vurgu' | 'golgesiz' | 'tehlike';
  kucuk?: boolean;
  disabled?: boolean;
  tip?: 'button' | 'submit';
}) {
  const sinif = ['buton'];
  if (renk && renk !== 'birincil') sinif.push(renk);
  if (kucuk) sinif.push('kucuk');
  return (
    <button type={tip ?? 'button'} className={sinif.join(' ')} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

export function BolumBaslik({ children }: { children: ReactNode }) {
  return <div className="bolum-baslik">{children}</div>;
}

/** "1234567,5" -> "1.234.567,5" (binlik ayraç + tek virgül). */
function sayiBicimle(ham: string): string {
  const [tam, ...gerisi] = ham.split(',');
  const tamTemiz = tam.replace(/\D/g, '');
  const gruplu = tamTemiz.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  if (gerisi.length === 0) return gruplu;
  const ondalik = gerisi.join('').replace(/\D/g, '').slice(0, 2);
  return `${gruplu},${ondalik}`;
}

function sayiCoz(metin: string): number {
  const n = parseFloat(metin.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function sayidanMetne(x: number): string {
  if (x === 0) return '';
  return x.toLocaleString('tr-TR', { maximumFractionDigits: 2 });
}

/** Sayısal TL/adet girişi — binlik ayraçlı görünüm (1.250.000). Boş = 0. */
export function SayiAlani({
  etiket,
  deger,
  onDegis,
  birim = '₺',
  ipucu,
  placeholder,
}: {
  etiket: string;
  deger: number;
  onDegis: (n: number) => void;
  birim?: string;
  ipucu?: string;
  placeholder?: string;
}) {
  const [metin, setMetin] = useState(() => sayidanMetne(deger));

  // Dışarıdan gelen değer değiştiyse (örn. canlı fiyat çekildi) görünümü eşitle
  useEffect(() => {
    if (sayiCoz(metin) !== deger) setMetin(sayidanMetne(deger));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deger]);

  return (
    <label className="alan">
      <span className="alan-etiket">{etiket}</span>
      <span className="girdi-sarmal">
        <input
          className="girdi"
          type="text"
          inputMode="decimal"
          placeholder={placeholder ?? '0'}
          value={metin}
          onChange={(e) => {
            const bicimli = sayiBicimle(e.target.value);
            setMetin(bicimli);
            onDegis(sayiCoz(bicimli));
          }}
        />
        {birim && <span className="birim">{birim}</span>}
      </span>
      {ipucu && <span className="alan-ipucu">{ipucu}</span>}
    </label>
  );
}

export function MetinAlani({
  etiket,
  deger,
  onDegis,
  placeholder,
  ipucu,
}: {
  etiket: string;
  deger: string;
  onDegis: (s: string) => void;
  placeholder?: string;
  ipucu?: string;
}) {
  return (
    <label className="alan">
      <span className="alan-etiket">{etiket}</span>
      <input
        className="girdi"
        type="text"
        placeholder={placeholder}
        value={deger}
        onChange={(e) => onDegis(e.target.value)}
      />
      {ipucu && <span className="alan-ipucu">{ipucu}</span>}
    </label>
  );
}

/** Tek seçimlik "cip" grubu. */
export function CipSecim<T extends string>({
  etiket,
  secenekler,
  deger,
  onDegis,
}: {
  etiket?: string;
  secenekler: Array<{ deger: T; ad: string }>;
  deger: T;
  onDegis: (d: T) => void;
}) {
  return (
    <div className="alan">
      {etiket && <span className="alan-etiket">{etiket}</span>}
      <div className="cip-grup">
        {secenekler.map((s) => (
          <button
            key={s.deger}
            type="button"
            className={`cip${s.deger === deger ? ' secili' : ''}`}
            onClick={() => onDegis(s.deger)}
          >
            {s.ad}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Çoklu seçimlik cip grubu (aksesuarlar gibi). */
export function CokluCipSecim<T extends string>({
  etiket,
  secenekler,
  degerler,
  onDegis,
}: {
  etiket?: string;
  secenekler: Array<{ deger: T; ad: string }>;
  degerler: T[];
  onDegis: (d: T[]) => void;
}) {
  return (
    <div className="alan">
      {etiket && <span className="alan-etiket">{etiket}</span>}
      <div className="cip-grup">
        {secenekler.map((s) => {
          const secili = degerler.includes(s.deger);
          return (
            <button
              key={s.deger}
              type="button"
              className={`cip${secili ? ' secili' : ''}`}
              onClick={() =>
                onDegis(secili ? degerler.filter((d) => d !== s.deger) : [...degerler, s.deger])
              }
            >
              {s.ad}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function RenkSecim({
  etiket,
  renkler,
  deger,
  onDegis,
}: {
  etiket: string;
  renkler: string[];
  deger: string;
  onDegis: (r: string) => void;
}) {
  return (
    <div className="alan">
      <span className="alan-etiket">{etiket}</span>
      <div className="renk-grup">
        {renkler.map((r) => (
          <button
            key={r}
            type="button"
            aria-label={`renk ${r}`}
            className={`renk-nokta${r === deger ? ' secili' : ''}`}
            style={{ background: r }}
            onClick={() => onDegis(r)}
          />
        ))}
      </div>
    </div>
  );
}

export function SecimKutusu<T extends string>({
  etiket,
  secenekler,
  deger,
  onDegis,
  ipucu,
}: {
  etiket: string;
  secenekler: Array<{ deger: T; ad: string }>;
  deger: T;
  onDegis: (d: T) => void;
  ipucu?: string;
}) {
  return (
    <label className="alan">
      <span className="alan-etiket">{etiket}</span>
      <select className="girdi" value={deger} onChange={(e) => onDegis(e.target.value as T)}>
        {secenekler.map((s) => (
          <option key={s.deger} value={s.deger}>
            {s.ad}
          </option>
        ))}
      </select>
      {ipucu && <span className="alan-ipucu">{ipucu}</span>}
    </label>
  );
}

export function BosIpucu({ children }: { children: ReactNode }) {
  return <div className="bos-ipucu">{children}</div>;
}

export function OgeKarti({ onSil, children }: { onSil: () => void; children: ReactNode }) {
  return (
    <div className="oge-kart">
      <button type="button" className="oge-sil" onClick={onSil} aria-label="Sil">
        ✕
      </button>
      {children}
    </div>
  );
}

export function YasalUyari() {
  return (
    <div className="yasal-uyari">
      ⚠️ PARA bir yatırım danışmanı değildir; burada gördüğünüz hiçbir puan, hesap veya
      açıklama yatırım tavsiyesi değildir. Tüm sonuçlar yalnızca sizin girdiğiniz verilerin
      matematiksel özetidir; finansal kararlarınızın sorumluluğu size aittir.
    </div>
  );
}

export function GizlilikNotu() {
  return (
    <div className="gizlilik-notu">
      🔒 Verileriniz yalnızca bu cihazda saklanır — hiçbir sunucuya gönderilmez. Yedeğinizi
      dosya olarak indirip istediğiniz yerde saklayabilirsiniz (Profil sekmesi).
    </div>
  );
}
