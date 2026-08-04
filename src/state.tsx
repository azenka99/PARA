// Uygulama durumu: tek bir AppData nesnesi + her değişiklikte cihaza kayıt.
// Ek olarak: tema (açık/koyu), tutarları gizleme ve PIN kilidi durumları.
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { AppData } from './model/types';
import { veriKaydet, veriYukle } from './storage/storage';
import { tl } from './logic/format';

export type Degistirici = (f: (v: AppData) => AppData) => void;

interface VeriBaglami {
  veri: AppData;
  degistir: Degistirici;
  sifirla: (yeni: AppData) => void;
}

const Baglam = createContext<VeriBaglami | null>(null);

export function VeriSaglayici({ children }: { children: ReactNode }) {
  const [veri, setVeri] = useState<AppData>(() => veriYukle());

  useEffect(() => {
    veriKaydet(veri);
  }, [veri]);

  const deger = useMemo<VeriBaglami>(
    () => ({
      veri,
      degistir: (f) => setVeri((v) => f(v)),
      sifirla: (yeni) => setVeri(yeni),
    }),
    [veri],
  );

  return <Baglam.Provider value={deger}>{children}</Baglam.Provider>;
}

export function useVeri(): VeriBaglami {
  const b = useContext(Baglam);
  if (!b) throw new Error('useVeri, VeriSaglayici içinde kullanılmalı');
  return b;
}

/* ---------------- Tema (açık / koyu / sistem) ---------------- */

export type Tema = 'acik' | 'koyu' | 'sistem';

interface TemaBaglami {
  tema: Tema;
  setTema: (t: Tema) => void;
}

const TemaCtx = createContext<TemaBaglami>({ tema: 'sistem', setTema: () => {} });

function temaUygula(tema: Tema) {
  const koyuMu =
    tema === 'koyu' ||
    (tema === 'sistem' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.tema = koyuMu ? 'koyu' : 'acik';
}

export function TemaSaglayici({ children }: { children: ReactNode }) {
  const [tema, setTemaDurum] = useState<Tema>(() => {
    const kayitli = localStorage.getItem('para.tema');
    return kayitli === 'acik' || kayitli === 'koyu' ? kayitli : 'sistem';
  });

  useEffect(() => {
    temaUygula(tema);
    const medya = window.matchMedia('(prefers-color-scheme: dark)');
    const dinleyici = () => tema === 'sistem' && temaUygula('sistem');
    medya.addEventListener('change', dinleyici);
    return () => medya.removeEventListener('change', dinleyici);
  }, [tema]);

  const deger = useMemo<TemaBaglami>(
    () => ({
      tema,
      setTema: (t) => {
        setTemaDurum(t);
        localStorage.setItem('para.tema', t);
      },
    }),
    [tema],
  );

  return <TemaCtx.Provider value={deger}>{children}</TemaCtx.Provider>;
}

export function useTema(): TemaBaglami {
  return useContext(TemaCtx);
}

/* ---------------- Tutarları gizleme (göz düğmesi) ---------------- */

interface GizliBaglami {
  gizli: boolean;
  gizliDegistir: () => void;
  /** Tutarı biçimlendirir; gizli moddaysa maskeler. */
  tutar: (x: number) => string;
}

const GizliCtx = createContext<GizliBaglami>({
  gizli: false,
  gizliDegistir: () => {},
  tutar: (x) => tl(x),
});

export function GizliSaglayici({ children }: { children: ReactNode }) {
  const [gizli, setGizli] = useState(() => localStorage.getItem('para.gizli') === '1');

  const deger = useMemo<GizliBaglami>(
    () => ({
      gizli,
      gizliDegistir: () => {
        setGizli((g) => {
          localStorage.setItem('para.gizli', g ? '0' : '1');
          return !g;
        });
      },
      tutar: (x) => (gizli ? '••••••' : tl(x)),
    }),
    [gizli],
  );

  return <GizliCtx.Provider value={deger}>{children}</GizliCtx.Provider>;
}

export function useGizli(): GizliBaglami {
  return useContext(GizliCtx);
}

/* ---------------- PIN kilidi ---------------- */

const PIN_ANAHTAR = 'para.pin';

async function pinOzeti(pin: string): Promise<string> {
  const veri = new TextEncoder().encode('para-tuz:' + pin);
  const ozet = await crypto.subtle.digest('SHA-256', veri);
  return Array.from(new Uint8Array(ozet))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function pinVarMi(): boolean {
  return !!localStorage.getItem(PIN_ANAHTAR);
}

export async function pinKaydet(pin: string): Promise<void> {
  localStorage.setItem(PIN_ANAHTAR, await pinOzeti(pin));
}

export function pinKaldir(): void {
  localStorage.removeItem(PIN_ANAHTAR);
}

export async function pinDogru(pin: string): Promise<boolean> {
  const kayitli = localStorage.getItem(PIN_ANAHTAR);
  if (!kayitli) return true;
  return (await pinOzeti(pin)) === kayitli;
}

/* ---------------- Araç piyasa değerleri ---------------- */

export interface AracDegerleri {
  guncellemeTarihi: string;
  markalar: Record<string, Record<string, number>>;
}

const AracBaglam = createContext<AracDegerleri | null>(null);

export function AracDegerSaglayici({ children }: { children: ReactNode }) {
  const [degerler, setDegerler] = useState<AracDegerleri | null>(null);

  useEffect(() => {
    fetch('./data/arac-degerleri.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setDegerler(d))
      .catch(() => {
        // veri dosyası yüklenemezse öneri gösterilmez; kullanıcı elle girer
      });
  }, []);

  return <AracBaglam.Provider value={degerler}>{children}</AracBaglam.Provider>;
}

export function useAracDegerleri(): AracDegerleri | null {
  return useContext(AracBaglam);
}
