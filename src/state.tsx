// Uygulama durumu: tek bir AppData nesnesi + her değişiklikte cihaza kayıt.
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { AppData } from './model/types';
import { veriKaydet, veriYukle } from './storage/storage';

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

/** Araç piyasa değerleri — public/data/arac-degerleri.json dosyasından yüklenir. */
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
