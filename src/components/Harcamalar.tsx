// Günlük harcama takibi — hızlı giriş + bu ayın listesi + tempo ve dağılım analizi.
import { useState } from 'react';
import { useGizli, useVeri } from '../state';
import type { HarcamaKategorisi } from '../model/types';
import { yeniId } from '../model/defaults';
import {
  aydakiHarcamalar,
  aylikToplamlar,
  bugunTarihi,
  HARCAMA_KATEGORILERI,
  kategoriBilgi,
  kategoriDagilimi,
  tempoAnalizi,
} from '../logic/harcama';
import { HalkaGrafik, MiniTrend } from './charts';
import { BosIpucu, Buton, SayiAlani } from './ui';

export function GunlukHarcamalar() {
  const { veri, degistir } = useVeri();
  const { tutar } = useGizli();

  const [girilenTutar, setGirilenTutar] = useState(0);
  const [kategori, setKategori] = useState<HarcamaKategorisi>('market');
  const [notMetni, setNotMetni] = useState('');
  const [tarih, setTarih] = useState(() => bugunTarihi());
  const [hepsiniGoster, setHepsiniGoster] = useState(false);

  const buAy = bugunTarihi().slice(0, 7);
  const liste = aydakiHarcamalar(veri.harcamalar, buAy);
  const gosterilen = hepsiniGoster ? liste : liste.slice(0, 8);
  const tempo = tempoAnalizi(veri);
  const dagilim = kategoriDagilimi(veri.harcamalar, buAy);
  const trend = aylikToplamlar(veri.harcamalar, 6);
  const doluAySayisi = trend.filter((t) => t.toplam > 0).length;

  const ekle = () => {
    if (girilenTutar <= 0) return;
    degistir((v) => ({
      ...v,
      harcamalar: [
        { id: yeniId(), tarih, tutar: girilenTutar, kategori, not: notMetni.trim() },
        ...v.harcamalar,
      ].slice(0, 2000),
    }));
    setGirilenTutar(0);
    setNotMetni('');
    setTarih(bugunTarihi());
  };

  return (
    <div>
      {/* hızlı giriş */}
      <div className="satir">
        <SayiAlani etiket="Tutar" deger={girilenTutar} onDegis={setGirilenTutar} />
        <label className="alan">
          <span className="alan-etiket">Not (isteğe bağlı)</span>
          <input
            className="girdi"
            type="text"
            placeholder="örn. pazar alışverişi"
            value={notMetni}
            onChange={(e) => setNotMetni(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && ekle()}
          />
        </label>
        <label className="alan" style={{ flex: 'none', minWidth: 150 }}>
          <span className="alan-etiket">Tarih</span>
          <input
            className="girdi"
            type="date"
            max={bugunTarihi()}
            value={tarih}
            onChange={(e) => e.target.value && setTarih(e.target.value)}
          />
        </label>
      </div>
      <div className="cip-grup" style={{ marginBottom: 12 }}>
        {HARCAMA_KATEGORILERI.map((k) => (
          <button
            key={k.deger}
            type="button"
            className={`cip${kategori === k.deger ? ' secili' : ''}`}
            onClick={() => setKategori(k.deger)}
          >
            {k.ikon} {k.ad}
          </button>
        ))}
      </div>
      <Buton kucuk disabled={girilenTutar <= 0} onClick={ekle}>
        + Harcamayı ekle
      </Buton>

      {/* tempo analizi */}
      {liste.length > 0 && (
        <div className="tempo-kutu">
          <div className="ozgurluk-ust">
            <span>Bu ay: {tutar(tempo.harcanan)}</span>
            {tempo.durum !== 'butceYok' && <span>Bütçe: {tutar(tempo.butce)}</span>}
          </div>
          {tempo.durum !== 'butceYok' && (
            <div className="puan-cubuk" style={{ position: 'relative' }}>
              <div
                className="puan-cubuk-dolu"
                style={{
                  width: `${Math.min(100, Math.round(tempo.butceOrani * 100))}%`,
                  background: tempo.durum === 'hizli' ? 'var(--negatif)' : 'var(--pozitif)',
                }}
              />
              <div className="tempo-isaret" style={{ left: `${Math.round(tempo.gunOrani * 100)}%` }} />
            </div>
          )}
          <p className={`alan-ipucu${tempo.durum === 'hizli' ? ' tempo-hizli' : ''}`}>{tempo.mesaj}</p>
        </div>
      )}

      {/* bu ayın listesi */}
      {liste.length === 0 ? (
        <BosIpucu>Bu ay henüz harcama girmediniz — üstteki satırdan saniyeler içinde eklenir.</BosIpucu>
      ) : (
        <div style={{ marginTop: 12 }}>
          {gosterilen.map((h) => {
            const k = kategoriBilgi(h.kategori);
            return (
              <div className="harcama-satir" key={h.id}>
                <span className="ikon">{k.ikon}</span>
                <span className="ad">
                  {h.not || k.ad}
                  <span className="alt">
                    {new Date(h.tarih + 'T12:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} · {k.ad}
                  </span>
                </span>
                <span className="tutar">{tutar(h.tutar)}</span>
                <button
                  type="button"
                  className="oge-sil"
                  style={{ position: 'static' }}
                  aria-label="Sil"
                  onClick={() =>
                    degistir((v) => ({ ...v, harcamalar: v.harcamalar.filter((x) => x.id !== h.id) }))
                  }
                >
                  ✕
                </button>
              </div>
            );
          })}
          {liste.length > 8 && (
            <Buton renk="golgesiz" kucuk onClick={() => setHepsiniGoster(!hepsiniGoster)}>
              {hepsiniGoster ? 'Daha az göster' : `Tümünü göster (${liste.length})`}
            </Buton>
          )}
        </div>
      )}

      {/* kategori dağılımı */}
      {dagilim.length > 1 && (
        <div style={{ marginTop: 16 }}>
          <span className="alan-etiket">Bu ayın dağılımı</span>
          <HalkaGrafik dilimler={dagilim} boyut={130} />
        </div>
      )}

      {/* aylık eğilim */}
      {doluAySayisi >= 2 && (
        <div style={{ marginTop: 16 }}>
          <span className="alan-etiket">Aylık harcama eğilimi</span>
          <MiniTrend degerler={trend.map((t) => t.toplam)} etiketler={trend.map((t) => t.ay)} />
        </div>
      )}
    </div>
  );
}
