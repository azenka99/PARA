// Karar Asistanı — elemeli senaryo akışı + sohbet penceresi biçiminde sonuç.
// Sadelik kuralları: tek giriş noktası, her ekranda tek soru, sonuç sohbette.
// Tüm hesaplar geçicidir; kullanıcının gerçek verisi değişmez.
import { useMemo, useRef, useState } from 'react';
import { useGizli, useVeri } from '../state';
import type { AppData, KayitliKarar } from '../model/types';
import { yeniId } from '../model/defaults';
import {
  aylikGelir,
  aylikGider,
  aylikTaksitler,
  likitVarlik,
  nakitAkisi,
  netDeger,
} from '../logic/finance';
import {
  aracSenaryosu,
  beklersenAy,
  birikimHedefi,
  evSenaryosu,
  guvenliPesinat,
  pesinMiKrediMi,
  type SenaryoSonucu,
} from '../logic/senaryo';
import { VARSAYILAN_PLAN_AYARLARI } from '../logic/planConfig';
import { aiAnahtarVar, aiSor } from '../logic/ai';
import { tl, tlKisa } from '../logic/format';
import { BosIpucu, Buton, SayiAlani, SecimKutusu } from './ui';

type Tur = 'arac' | 'ev' | 'pesin' | 'birikim';

const TUR_BILGI: Record<Tur, { ad: string; ikon: string; aciklama: string }> = {
  arac: { ad: 'Araba alsam?', ikon: '🚗', aciklama: 'Araç, motosiklet veya benzeri büyük alım' },
  ev: { ad: 'Ev alsam?', ikon: '🏠', aciklama: 'Kredi taksitiyle kiranı karşılaştırır' },
  pesin: { ad: 'Peşin mi kredi mi?', ikon: '⚖️', aciklama: 'İkisinin gerçek maliyetini kıyaslar' },
  birikim: { ad: 'Birikim hedefi', ikon: '📈', aciklama: 'Hedefe ne zaman ulaşırsın?' },
};

interface Girdiler {
  fiyat: number;
  pesinat: number;
  faiz: number;
  vade: number;
  aylikBirikim: number;
}

interface Mesaj {
  kim: 'asistan' | 'ben';
  metin?: string;
  sonuc?: SenaryoSonucu;
}

function hesapla(veri: AppData, tur: Tur, g: Girdiler): SenaryoSonucu | null {
  switch (tur) {
    case 'arac':
      return aracSenaryosu(veri, { fiyat: g.fiyat, pesinat: g.pesinat, aylikFaiz: g.faiz, vadeAy: g.vade });
    case 'ev':
      return evSenaryosu(veri, { fiyat: g.fiyat, pesinat: g.pesinat, aylikFaiz: g.faiz, vadeAy: g.vade });
    case 'pesin':
      return pesinMiKrediMi(veri, { tutar: g.fiyat, aylikFaiz: g.faiz, vadeAy: g.vade });
    case 'birikim':
      return birikimHedefi(veri, {
        hedefTutar: g.fiyat,
        aylikBirikim: g.aylikBirikim,
        yillikGetiri: VARSAYILAN_PLAN_AYARLARI.yillikReelGetiri,
      });
  }
}

function baslikYap(tur: Tur, g: Girdiler): string {
  switch (tur) {
    case 'arac':
      return `Araba — ${tlKisa(g.fiyat)}, ${g.pesinat >= g.fiyat ? 'peşin' : `${tlKisa(g.pesinat)} peşinat, ${g.vade} ay`}`;
    case 'ev':
      return `Ev — ${tlKisa(g.fiyat)}, ${g.pesinat >= g.fiyat ? 'peşin' : `${tlKisa(g.pesinat)} peşinat, ${g.vade} ay`}`;
    case 'pesin':
      return `Peşin mi kredi mi — ${tlKisa(g.fiyat)}`;
    case 'birikim':
      return `Birikim — hedef ${tlKisa(g.fiyat)}, ayda ${tlKisa(g.aylikBirikim)}`;
  }
}

function SonucBalonu({ sonuc }: { sonuc: SenaryoSonucu }) {
  const { gizli } = useGizli();
  const ad = sonuc.hukum === 'iyi' ? 'Uygun görünüyor' : sonuc.hukum === 'dikkat' ? 'Dikkatli olun' : 'Riskli';
  return (
    <div className="balon asistan">
      <span className={`rozet-hukum ${sonuc.hukum}`}>{ad}</span>
      <p style={{ margin: '8px 0' }}>{sonuc.ozet}</p>
      <table className="senaryo-tablo">
        <tbody>
          {sonuc.satirlar.map((s) => (
            <tr key={s.ad}>
              <td>{s.ad}</td>
              <td className={s.vurgu === 'iyi' ? 'iyi' : s.vurgu === 'kotu' ? 'kotu' : ''}>
                {gizli ? '••••••' : s.deger}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function KararAsistani() {
  const { veri, degistir } = useVeri();
  const [tur, setTur] = useState<Tur | null>(null);
  const [adim, setAdim] = useState(0);
  const [g, setG] = useState<Girdiler>({ fiyat: 0, pesinat: 0, faiz: 3, vade: 24, aylikBirikim: 0 });
  const [mesajlar, setMesajlar] = useState<Mesaj[]>([]);
  const [sohbette, setSohbette] = useState(false);
  const [soru, setSoru] = useState('');
  const [aiCalisiyor, setAiCalisiyor] = useState(false);
  const [kaydedildi, setKaydedildi] = useState(false);
  const [hatirlatmaAy, setHatirlatmaAy] = useState<'0' | '1' | '3' | '6'>('3');
  const sonSonuc = useRef<SenaryoSonucu | null>(null);

  const krediliAlim = tur === 'arac' || tur === 'ev';
  // Adım listesi: kredili alımlarda peşinat tamamı karşılıyorsa faiz/vade adımı atlanır.
  const adimSayisi = tur === 'birikim' ? 2 : tur === 'pesin' ? 2 : g.pesinat >= g.fiyat && g.fiyat > 0 ? 2 : 3;

  const oneriPesinat = useMemo(() => guvenliPesinat(veri), [veri]);

  const sifirla = () => {
    setTur(null);
    setAdim(0);
    setMesajlar([]);
    setSohbette(false);
    setKaydedildi(false);
    sonSonuc.current = null;
  };

  const turSec = (t: Tur) => {
    setTur(t);
    setAdim(0);
    setG({
      fiyat: 0,
      pesinat: 0,
      faiz: t === 'ev' ? 2.5 : 3,
      vade: t === 'ev' ? 120 : 24,
      aylikBirikim: 0,
    });
  };

  const sohbetiBaslat = () => {
    if (!tur) return;
    const yeni: Mesaj[] = [];

    // Hazırlık kapısı: temel göstergeler zayıfsa önce dürüst bir uyarı.
    if (tur !== 'birikim') {
      const gider = aylikGider(veri);
      const acilAy = gider > 0 ? likitVarlik(veri) / gider : 99;
      const gelir = aylikGelir(veri);
      const borcYuku = gelir > 0 ? aylikTaksitler(veri) / gelir : 0;
      const sorunlar: string[] = [];
      if (nakitAkisi(veri) < 0) sorunlar.push('ay sonu açık veriyorsunuz');
      if (acilAy < 3) sorunlar.push(`acil fonunuz ${(Math.round(acilAy * 10) / 10).toString().replace('.', ',')} ay (hedef en az 3)`);
      if (borcYuku >= 0.4) sorunlar.push(`borç yükünüz %${Math.round(borcYuku * 100)}`);
      if (sorunlar.length > 0) {
        yeni.push({
          kim: 'asistan',
          metin: `Başlamadan dürüst olayım: şu an ${sorunlar.join(', ')}. Genel kural, bunlar düzelmeden büyük alımlara girmemektir. Yine de birlikte bakalım — rakamlar ne diyor görelim.`,
        });
      }
    }

    const sonuc = hesapla(veri, tur, g);
    if (sonuc) {
      sonSonuc.current = sonuc;
      yeni.push({ kim: 'asistan', sonuc });
    }

    // "Beklersen" dalı — satın alma senaryolarında otomatik.
    if (tur === 'arac' || tur === 'ev' || tur === 'pesin') {
      const ay = beklersenAy(veri, g.fiyat);
      if (ay !== null && ay > 0) {
        const yil = Math.floor(ay / 12);
        const kal = ay % 12;
        const sure = yil > 0 ? `${yil} yıl${kal > 0 ? ` ${kal} ay` : ''}` : `${kal} ay`;
        yeni.push({
          kim: 'asistan',
          metin: `Alternatif: hiç kredi kullanmadan, acil fonunuzu da koruyarak tamamen peşin almak isteseydiniz, mevcut birikim temponuzla yaklaşık ${sure} beklemeniz gerekirdi. Kredi maliyetiyle bekleme süresini yan yana koyup karar vermek size kalmış.`,
        });
      } else if (ay === 0) {
        yeni.push({
          kim: 'asistan',
          metin: 'Not: Likit varlığınız, acil fonunuzu koruyarak bile bunu tamamen peşin almaya yetiyor. Kredinin faiz maliyetine gerçekten değip değmeyeceğini düşünmeye değer.',
        });
      }
    }

    setMesajlar(yeni);
    setSohbette(true);
  };

  const cipSor = (soruMetni: string, degisiklik: Partial<Girdiler>) => {
    if (!tur) return;
    const yeniG = { ...g, ...degisiklik };
    const sonuc = hesapla(veri, tur, yeniG);
    // Çalışma senaryosunu güncelle: sonraki sorular ve "Kararı kaydet",
    // ilk girdilerin değil SON değerlendirmenin üzerinden işler.
    setG(yeniG);
    if (sonuc) sonSonuc.current = sonuc;
    setMesajlar((m) => [
      ...m,
      { kim: 'ben', metin: soruMetni },
      sonuc
        ? { kim: 'asistan', sonuc }
        : { kim: 'asistan', metin: 'Bu değişiklikle hesap yapamadım — girdiler eksik kaldı.' },
    ]);
  };

  const beklersenSor = () => {
    if (!tur) return;
    const ay = beklersenAy(veri, g.fiyat);
    const metin =
      ay === null
        ? 'Mevcut nakit akışınızla (ay sonu artan yok) bu tutar biriktirilemiyor — önce ay sonu artısını oluşturmak gerekiyor.'
        : ay === 0
          ? 'Şu an bile peşin alabilirsiniz — acil fonunuz korunarak likit varlığınız yetiyor.'
          : `Acil fonunuzu koruyarak tamamen peşin almak için yaklaşık ${ay} ay biriktirmeniz gerekir (ayda ${tl(Math.max(0, nakitAkisi(veri)))} artanla).`;
    setMesajlar((m) => [...m, { kim: 'ben', metin: 'Beklesem, ne zaman peşin alırım?' }, { kim: 'asistan', metin }]);
  };

  const serbestSor = async () => {
    const s = soru.trim();
    if (!s || !tur) return;
    setSoru('');
    setMesajlar((m) => [...m, { kim: 'ben', metin: s }]);

    if (!aiAnahtarVar()) {
      setMesajlar((m) => [
        ...m,
        {
          kim: 'asistan',
          metin:
            'Serbest soruları cevaplayabilmem için Profil sayfasındaki "Yapay zeka" bölümüne bir anahtar eklemeniz gerekiyor (isteğe bağlı, kullandıkça kuruşlar düzeyinde ücretli). Yukarıdaki hazır sorular ise her zaman ücretsiz çalışır.',
        },
      ]);
      return;
    }

    setAiCalisiyor(true);
    const baglam = sonSonuc.current
      ? `${TUR_BILGI[tur].ad} | Girdiler: fiyat ${tl(g.fiyat)}, peşinat ${tl(g.pesinat)}, aylık faiz %${g.faiz}, vade ${g.vade} ay | Değerlendirme: ${sonSonuc.current.ozet} | ${sonSonuc.current.satirlar.map((x) => `${x.ad}: ${x.deger}`).join(' | ')}`
      : TUR_BILGI[tur].ad;
    const yanit = await aiSor(veri, baglam, s);
    setAiCalisiyor(false);
    setMesajlar((m) => [
      ...m,
      { kim: 'asistan', metin: yanit.metin ?? `Cevaplayamadım: ${yanit.hata}` },
    ]);
  };

  const karariKaydet = () => {
    if (!tur || !sonSonuc.current) return;
    const gider = aylikGider(veri);
    const gelir = aylikGelir(veri);
    const simdi = new Date();
    const hatirlatma =
      hatirlatmaAy === '0'
        ? null
        : new Date(simdi.getFullYear(), simdi.getMonth() + Number(hatirlatmaAy), simdi.getDate()).toISOString();
    const karar: KayitliKarar = {
      id: yeniId(),
      tarih: simdi.toISOString(),
      tur,
      baslik: baslikYap(tur, g),
      hukum: sonSonuc.current.hukum,
      ozet: sonSonuc.current.ozet,
      foto: {
        netDeger: netDeger(veri),
        akis: nakitAkisi(veri),
        borcYukuYuzde: gelir > 0 ? Math.round((aylikTaksitler(veri) / gelir) * 100) : 0,
        acilFonAy: gider > 0 ? Math.round((likitVarlik(veri) / gider) * 10) / 10 : 0,
      },
      hatirlatma,
    };
    degistir((v) => ({ ...v, kararlar: [karar, ...v.kararlar].slice(0, 50) }));
    setKaydedildi(true);
  };

  /* ---------- 1. tür seçimi ---------- */
  if (!tur) {
    return (
      <div className="karar-secim">
        {(Object.keys(TUR_BILGI) as Tur[]).map((t) => (
          <button key={t} type="button" className="karar-secenek" onClick={() => turSec(t)}>
            <span className="ikon">{TUR_BILGI[t].ikon}</span>
            <span className="ad">{TUR_BILGI[t].ad}</span>
            <span className="aciklama">{TUR_BILGI[t].aciklama}</span>
          </button>
        ))}
      </div>
    );
  }

  /* ---------- 3. sohbet ---------- */
  if (sohbette) {
    return (
      <div>
        <div className="sohbet">
          {mesajlar.map((m, i) =>
            m.sonuc ? (
              <SonucBalonu key={i} sonuc={m.sonuc} />
            ) : (
              <div key={i} className={`balon ${m.kim}`}>
                {m.metin}
              </div>
            ),
          )}
          {aiCalisiyor && <div className="balon asistan">Düşünüyorum…</div>}
        </div>

        <div className="cip-grup" style={{ marginTop: 14 }}>
          {krediliAlim && g.pesinat < g.fiyat && (
            <>
              <button type="button" className="cip" onClick={() => cipSor(`Peşinatı ${tl(g.pesinat + 100000)} yapsam?`, { pesinat: g.pesinat + 100000 })}>
                Peşinat +100 B olsa?
              </button>
              <button type="button" className="cip" onClick={() => cipSor(`Vade ${Math.max(6, Math.round(g.vade / 2))} ay olsa?`, { vade: Math.max(6, Math.round(g.vade / 2)) })}>
                Vade yarıya inse?
              </button>
            </>
          )}
          {krediliAlim && (
            <button type="button" className="cip" onClick={() => cipSor(`%20 daha ucuzunu (${tl(g.fiyat * 0.8)}) alsam?`, { fiyat: g.fiyat * 0.8, pesinat: Math.min(g.pesinat, g.fiyat * 0.8) })}>
              %20 daha ucuz olsa?
            </button>
          )}
          {tur === 'pesin' && (
            <button type="button" className="cip" onClick={() => cipSor(`Vade ${Math.max(3, Math.round(g.vade / 2))} ay olsa?`, { vade: Math.max(3, Math.round(g.vade / 2)) })}>
              Vade yarıya inse?
            </button>
          )}
          {tur !== 'birikim' && (
            <button type="button" className="cip" onClick={beklersenSor}>
              Beklesem?
            </button>
          )}
          {tur === 'birikim' && (
            <button type="button" className="cip" onClick={() => cipSor(`Ayda ${tl(g.aylikBirikim + 5000)} biriktirsem?`, { aylikBirikim: g.aylikBirikim + 5000 })}>
              Ayda +5 B koysam?
            </button>
          )}
        </div>

        <div className="soru-satir">
          <input
            className="girdi"
            placeholder="Kendi sorunuzu yazın…"
            value={soru}
            onChange={(e) => setSoru(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && serbestSor()}
          />
          <Buton kucuk onClick={serbestSor} disabled={aiCalisiyor}>
            Sor
          </Buton>
        </div>

        <div className="karar-kaydet">
          {kaydedildi ? (
            <span className="alan-ipucu">✓ Karar kaydedildi — aşağıdaki "Kararlarım" listesinde.</span>
          ) : (
            <div className="satir">
              <SecimKutusu
                etiket="Hatırlatma"
                secenekler={[
                  { deger: '0', ad: 'Hatırlatma yok' },
                  { deger: '1', ad: '1 ay sonra sor' },
                  { deger: '3', ad: '3 ay sonra sor' },
                  { deger: '6', ad: '6 ay sonra sor' },
                ]}
                deger={hatirlatmaAy}
                onDegis={setHatirlatmaAy}
              />
              <div style={{ paddingBottom: 14, flex: 'none' }}>
                <Buton renk="vurgu" kucuk onClick={karariKaydet}>
                  💾 Kararı kaydet
                </Buton>
              </div>
            </div>
          )}
          <Buton renk="golgesiz" kucuk onClick={sifirla}>
            ← Yeni senaryo
          </Buton>
        </div>
      </div>
    );
  }

  /* ---------- 2. elemeli adımlar: her ekranda tek soru ---------- */
  const ileriOlabilir =
    adim === 0 ? g.fiyat > 0 : tur === 'birikim' ? g.aylikBirikim > 0 : true;

  return (
    <div>
      <div className="adim-noktalar">
        {Array.from({ length: adimSayisi + 1 }, (_, i) => (
          <span key={i} className={`nokta${i === adim ? ' aktif' : ''}`} />
        ))}
      </div>

      {adim === 0 && (
        <SayiAlani
          etiket={
            tur === 'arac' ? 'Almak istediğiniz aracın fiyatı' :
            tur === 'ev' ? 'Almak istediğiniz evin fiyatı' :
            tur === 'pesin' ? 'Almak istediğiniz şeyin tutarı' :
            'Hedeflediğiniz tutar'
          }
          deger={g.fiyat}
          onDegis={(n) => setG({ ...g, fiyat: n })}
        />
      )}

      {adim === 1 && krediliAlim && (
        <>
          <SayiAlani
            etiket="Ne kadar peşinat verebilirsiniz?"
            deger={g.pesinat}
            ipucu={`Önerilen üst sınır: ${tl(Math.min(oneriPesinat, g.fiyat))} — acil fonunuz 3 ayın altına inmesin.`}
            onDegis={(n) => setG({ ...g, pesinat: n })}
          />
          <div className="cip-grup">
            <button type="button" className="cip" onClick={() => setG({ ...g, pesinat: Math.min(oneriPesinat, g.fiyat) })}>
              Önerileni kullan
            </button>
            {oneriPesinat >= g.fiyat && (
              <button type="button" className="cip" onClick={() => setG({ ...g, pesinat: g.fiyat })}>
                Tamamı peşin
              </button>
            )}
          </div>
        </>
      )}
      {adim === 1 && tur === 'pesin' && (
        <div className="izgara-2">
          <SayiAlani etiket="Aylık kredi faizi" deger={g.faiz} birim="%" onDegis={(n) => setG({ ...g, faiz: n })} />
          <SayiAlani etiket="Vade" deger={g.vade} birim="ay" onDegis={(n) => setG({ ...g, vade: Math.round(n) })} />
        </div>
      )}
      {adim === 1 && tur === 'birikim' && (
        <SayiAlani
          etiket="Ayda ne kadar biriktireceksiniz?"
          deger={g.aylikBirikim}
          ipucu={`Şu an ay sonu artanınız: ${tl(Math.max(0, nakitAkisi(veri)))}`}
          onDegis={(n) => setG({ ...g, aylikBirikim: n })}
        />
      )}

      {adim === 2 && krediliAlim && (
        <div className="izgara-2">
          <SayiAlani etiket="Aylık kredi faizi" deger={g.faiz} birim="%" onDegis={(n) => setG({ ...g, faiz: n })} />
          <SayiAlani etiket="Vade" deger={g.vade} birim="ay" onDegis={(n) => setG({ ...g, vade: Math.round(n) })} />
        </div>
      )}

      {adim === 0 && g.fiyat <= 0 && <BosIpucu>Tutarı girin, adım adım ilerleyelim.</BosIpucu>}

      <div className="sihirbaz-butonlar">
        <Buton renk="golgesiz" kucuk onClick={() => (adim === 0 ? sifirla() : setAdim(adim - 1))}>
          ← Geri
        </Buton>
        {adim < adimSayisi - 1 ? (
          <Buton kucuk disabled={!ileriOlabilir} onClick={() => setAdim(adim + 1)}>
            Devam →
          </Buton>
        ) : (
          <Buton renk="vurgu" kucuk disabled={!ileriOlabilir} onClick={sohbetiBaslat}>
            Değerlendir 💬
          </Buton>
        )}
      </div>
    </div>
  );
}
