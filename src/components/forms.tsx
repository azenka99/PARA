// Alan formları — hem onboarding sihirbazında hem ana paneldeki sekmelerde
// aynı bileşenler kullanılır; böylece her bilgi sonradan da güncellenebilir.
import { useVeri, useAracDegerleri } from '../state';
import type {
  Arac,
  Borc,
  BorcTuru,
  EvDurumu,
  EvcilTur,
  MedeniHal,
} from '../model/types';
import { varsayilanAvatar, yeniId } from '../model/defaults';
import { bantUygunMu, kiraGeliri } from '../logic/finance';
import { tl } from '../logic/format';
import {
  BosIpucu,
  Buton,
  CipSecim,
  MetinAlani,
  OgeKarti,
  SayiAlani,
  SecimKutusu,
} from './ui';

/* ---------------- Profil: medeni hal, çocuklar, evciller ---------------- */

const MEDENI_SECENEKLER: Array<{ deger: MedeniHal; ad: string }> = [
  { deger: 'bekar', ad: 'Bekârım' },
  { deger: 'evli', ad: 'Evliyim' },
  { deger: 'bosanmis', ad: 'Boşandım' },
];

export function MedeniHalFormu() {
  const { veri, degistir } = useVeri();
  return (
    <div>
      <CipSecim
        etiket="Medeni durumun"
        secenekler={MEDENI_SECENEKLER}
        deger={veri.profil.medeniHal}
        onDegis={(m) =>
          degistir((v) => ({
            ...v,
            profil: {
              ...v.profil,
              medeniHal: m,
              esAvatar: m === 'evli' ? (v.profil.esAvatar ?? varsayilanAvatar()) : v.profil.esAvatar,
            },
          }))
        }
      />
      {veri.profil.medeniHal === 'evli' && (
        <MetinAlani
          etiket="Eşinin adı"
          deger={veri.profil.esAd}
          placeholder="örn. Deniz"
          onDegis={(s) => degistir((v) => ({ ...v, profil: { ...v.profil, esAd: s } }))}
        />
      )}
    </div>
  );
}

export function CocuklarFormu() {
  const { veri, degistir } = useVeri();
  const cocuklar = veri.profil.cocuklar;
  return (
    <div>
      {cocuklar.length === 0 && <BosIpucu>Çocuğun yoksa bu adımı boş bırakabilirsin.</BosIpucu>}
      {cocuklar.map((c) => (
        <OgeKarti
          key={c.id}
          onSil={() =>
            degistir((v) => ({
              ...v,
              profil: { ...v.profil, cocuklar: v.profil.cocuklar.filter((x) => x.id !== c.id) },
            }))
          }
        >
          <div className="izgara-2">
            <MetinAlani
              etiket="Adı"
              deger={c.ad}
              placeholder="örn. Ege"
              onDegis={(s) =>
                degistir((v) => ({
                  ...v,
                  profil: {
                    ...v.profil,
                    cocuklar: v.profil.cocuklar.map((x) => (x.id === c.id ? { ...x, ad: s } : x)),
                  },
                }))
              }
            />
            <SayiAlani
              etiket="Yaşı"
              deger={c.yas}
              birim="yaş"
              onDegis={(n) =>
                degistir((v) => ({
                  ...v,
                  profil: {
                    ...v.profil,
                    cocuklar: v.profil.cocuklar.map((x) =>
                      x.id === c.id ? { ...x, yas: Math.min(25, Math.round(n)) } : x,
                    ),
                  },
                }))
              }
            />
          </div>
        </OgeKarti>
      ))}
      <Buton
        renk="nane"
        kucuk
        onClick={() =>
          degistir((v) => ({
            ...v,
            profil: {
              ...v.profil,
              cocuklar: [...v.profil.cocuklar, { id: yeniId(), ad: '', yas: 0 }],
            },
          }))
        }
      >
        + Çocuk ekle
      </Buton>
    </div>
  );
}

const EVCIL_SECENEKLER: Array<{ deger: EvcilTur; ad: string }> = [
  { deger: 'kedi', ad: '🐱 Kedi' },
  { deger: 'kopek', ad: '🐶 Köpek' },
  { deger: 'kus', ad: '🐦 Kuş' },
  { deger: 'balik', ad: '🐟 Balık' },
  { deger: 'diger', ad: '🐾 Diğer' },
];

export function EvcillerFormu() {
  const { veri, degistir } = useVeri();
  const evciller = veri.profil.evciller;
  return (
    <div>
      {evciller.length === 0 && (
        <BosIpucu>Evcil hayvanın yoksa mama/veteriner soruları hiç gösterilmez.</BosIpucu>
      )}
      {evciller.map((e) => (
        <OgeKarti
          key={e.id}
          onSil={() =>
            degistir((v) => ({
              ...v,
              profil: { ...v.profil, evciller: v.profil.evciller.filter((x) => x.id !== e.id) },
              giderler: { ...v.giderler, evcil: v.giderler.evcil.filter((g) => g.evcilId !== e.id) },
            }))
          }
        >
          <CipSecim
            etiket="Türü"
            secenekler={EVCIL_SECENEKLER}
            deger={e.tur}
            onDegis={(t) =>
              degistir((v) => ({
                ...v,
                profil: {
                  ...v.profil,
                  evciller: v.profil.evciller.map((x) => (x.id === e.id ? { ...x, tur: t } : x)),
                },
              }))
            }
          />
          <MetinAlani
            etiket="Adı (isteğe bağlı)"
            deger={e.ad}
            placeholder="örn. Pamuk"
            ipucu="Ad verirsen giderlerde bu isimle görünür."
            onDegis={(s) =>
              degistir((v) => ({
                ...v,
                profil: {
                  ...v.profil,
                  evciller: v.profil.evciller.map((x) => (x.id === e.id ? { ...x, ad: s } : x)),
                },
              }))
            }
          />
        </OgeKarti>
      ))}
      <Buton
        renk="nane"
        kucuk
        onClick={() =>
          degistir((v) => ({
            ...v,
            profil: {
              ...v.profil,
              evciller: [...v.profil.evciller, { id: yeniId(), tur: 'kedi', ad: '' }],
            },
          }))
        }
      >
        + Evcil hayvan ekle
      </Buton>
    </div>
  );
}

/* ---------------- Evler ---------------- */

const EV_DURUMLARI: Array<{ deger: EvDurumu; ad: string }> = [
  { deger: 'kiraci', ad: 'Kiracıyım' },
  { deger: 'sahibi', ad: 'Ev sahibiyim' },
  { deger: 'kirada', ad: 'Kiraya verdim' },
  { deger: 'yazlik', ad: 'Boş / yazlık' },
];

export function EvlerFormu() {
  const { veri, degistir } = useVeri();
  return (
    <div>
      {veri.evler.length === 0 && (
        <BosIpucu>Oturduğun evi (kiracıysan bile) ve sahip olduğun diğer evleri ekle.</BosIpucu>
      )}
      {veri.evler.map((ev) => (
        <OgeKarti
          key={ev.id}
          onSil={() => degistir((v) => ({ ...v, evler: v.evler.filter((x) => x.id !== ev.id) }))}
        >
          <CipSecim
            etiket="Bu evdeki durumun"
            secenekler={EV_DURUMLARI}
            deger={ev.durum}
            onDegis={(d) =>
              degistir((v) => ({
                ...v,
                evler: v.evler.map((x) =>
                  x.id === ev.id
                    ? { ...x, durum: d, deger: d === 'kiraci' ? 0 : x.deger, aylikKira: d === 'sahibi' || d === 'yazlik' ? 0 : x.aylikKira }
                    : x,
                ),
              }))
            }
          />
          {ev.durum !== 'kiraci' && (
            <SayiAlani
              etiket="Evin güncel değeri"
              deger={ev.deger}
              ipucu="Kabaca bugün satılsa kaç TL eder?"
              onDegis={(n) =>
                degistir((v) => ({
                  ...v,
                  evler: v.evler.map((x) => (x.id === ev.id ? { ...x, deger: n } : x)),
                }))
              }
            />
          )}
          {ev.durum === 'kiraci' && (
            <SayiAlani
              etiket="Ödediğin aylık kira"
              deger={ev.aylikKira}
              onDegis={(n) =>
                degistir((v) => ({
                  ...v,
                  evler: v.evler.map((x) => (x.id === ev.id ? { ...x, aylikKira: n } : x)),
                }))
              }
            />
          )}
          {ev.durum === 'kirada' && (
            <SayiAlani
              etiket="Aldığın aylık kira"
              deger={ev.aylikKira}
              ipucu="Gelir bölümüne otomatik eklenir."
              onDegis={(n) =>
                degistir((v) => ({
                  ...v,
                  evler: v.evler.map((x) => (x.id === ev.id ? { ...x, aylikKira: n } : x)),
                }))
              }
            />
          )}
        </OgeKarti>
      ))}
      <Buton
        renk="nane"
        kucuk
        onClick={() =>
          degistir((v) => ({
            ...v,
            evler: [...v.evler, { id: yeniId(), durum: 'kiraci', deger: 0, aylikKira: 0 }],
          }))
        }
      >
        + Ev ekle
      </Buton>
    </div>
  );
}

/* ---------------- Araçlar ---------------- */

function AracSatiri({ arac }: { arac: Arac }) {
  const { degistir } = useVeri();
  const piyasa = useAracDegerleri();

  const markalar = piyasa ? Object.keys(piyasa.markalar) : [];
  const markaListede = markalar.includes(arac.marka);
  const modeller = piyasa && markaListede ? Object.keys(piyasa.markalar[arac.marka]) : [];
  const oneri =
    piyasa && markaListede && arac.model in piyasa.markalar[arac.marka]
      ? piyasa.markalar[arac.marka][arac.model]
      : null;

  const guncelle = (kismi: Partial<Arac>) =>
    degistir((v) => ({
      ...v,
      araclar: v.araclar.map((x) => (x.id === arac.id ? { ...x, ...kismi } : x)),
    }));

  return (
    <OgeKarti
      onSil={() => degistir((v) => ({ ...v, araclar: v.araclar.filter((x) => x.id !== arac.id) }))}
    >
      {piyasa && (
        <div className="izgara-2">
          <SecimKutusu
            etiket="Marka"
            secenekler={[
              { deger: '', ad: 'Seç…' },
              ...markalar.map((m) => ({ deger: m, ad: m })),
              { deger: '__diger__', ad: 'Diğer (elle gir)' },
            ]}
            deger={markaListede ? arac.marka : arac.marka ? '__diger__' : ''}
            onDegis={(m) => {
              if (m === '__diger__') guncelle({ marka: 'Diğer', model: '' });
              else guncelle({ marka: m, model: '' });
            }}
          />
          {markaListede ? (
            <SecimKutusu
              etiket="Model"
              secenekler={[
                { deger: '', ad: 'Seç…' },
                ...modeller.map((m) => ({ deger: m, ad: m })),
              ]}
              deger={modeller.includes(arac.model) ? arac.model : ''}
              onDegis={(m) => {
                const yeniOneri = m && piyasa.markalar[arac.marka][m];
                guncelle({ model: m, ...(yeniOneri ? { deger: yeniOneri } : {}) });
              }}
            />
          ) : (
            <MetinAlani etiket="Marka / Model" deger={arac.model} placeholder="örn. Lada Samara" onDegis={(s) => guncelle({ model: s })} />
          )}
        </div>
      )}
      {!piyasa && (
        <div className="izgara-2">
          <MetinAlani etiket="Marka" deger={arac.marka} onDegis={(s) => guncelle({ marka: s })} />
          <MetinAlani etiket="Model" deger={arac.model} onDegis={(s) => guncelle({ model: s })} />
        </div>
      )}
      <SayiAlani
        etiket="Aracın değeri"
        deger={arac.deger}
        ipucu={
          oneri
            ? `Ortalama ikinci el değeri önerildi (${tl(oneri)}, ${piyasa?.guncellemeTarihi} itibarıyla). Üzerine yazabilirsin.`
            : 'Kabaca bugünkü satış değeri.'
        }
        onDegis={(n) => guncelle({ deger: n })}
      />
    </OgeKarti>
  );
}

export function AraclarFormu() {
  const { veri, degistir } = useVeri();
  return (
    <div>
      {veri.araclar.length === 0 && (
        <BosIpucu>Aracın yoksa boş bırak — gider adımında yakıt yerine toplu taşıma sorulur.</BosIpucu>
      )}
      {veri.araclar.map((a) => (
        <AracSatiri key={a.id} arac={a} />
      ))}
      <Buton
        renk="nane"
        kucuk
        onClick={() =>
          degistir((v) => ({
            ...v,
            araclar: [...v.araclar, { id: yeniId(), marka: '', model: '', deger: 0 }],
          }))
        }
      >
        + Araç ekle
      </Buton>
    </div>
  );
}

/* ---------------- Varlıklar ---------------- */

export function VarliklarFormu() {
  const { veri, degistir } = useVeri();
  const va = veri.varliklar;
  const d = (kismi: Partial<typeof va>) =>
    degistir((v) => ({ ...v, varliklar: { ...v.varliklar, ...kismi } }));

  return (
    <div>
      <div className="izgara-2">
        <SayiAlani etiket="Nakit (cüzdan + kasa)" deger={va.nakit} onDegis={(n) => d({ nakit: n })} />
        <SayiAlani etiket="Banka hesapları + mevduat" deger={va.banka} onDegis={(n) => d({ banka: n })} />
        <SayiAlani etiket="Altın (gram)" deger={va.altinGram} birim="gr" onDegis={(n) => d({ altinGram: n })} />
        <SayiAlani
          etiket="Gram altın fiyatı"
          deger={va.altinGramFiyat}
          ipucu="Güncel fiyatı elle gir — v1'de otomatik çekilmiyor."
          onDegis={(n) => d({ altinGramFiyat: n })}
        />
        <SayiAlani etiket="Fon / ETF toplam değeri" deger={va.fonEtf} onDegis={(n) => d({ fonEtf: n })} />
        <SayiAlani etiket="Kripto toplam değeri" deger={va.kripto} onDegis={(n) => d({ kripto: n })} />
        <SayiAlani etiket="Diğer varlıklar" deger={va.diger} onDegis={(n) => d({ diger: n })} />
      </div>

      <span className="alan-etiket">Hisse senetleri</span>
      {va.hisseler.length === 0 && <BosIpucu>Hissen yoksa boş bırak.</BosIpucu>}
      {va.hisseler.map((h) => (
        <OgeKarti
          key={h.id}
          onSil={() => d({ hisseler: va.hisseler.filter((x) => x.id !== h.id) })}
        >
          <div className="satir">
            <MetinAlani
              etiket="Kod"
              deger={h.kod}
              placeholder="THYAO"
              onDegis={(s) =>
                d({ hisseler: va.hisseler.map((x) => (x.id === h.id ? { ...x, kod: s.toUpperCase() } : x)) })
              }
            />
            <SayiAlani
              etiket="Lot"
              deger={h.lot}
              birim="lot"
              onDegis={(n) => d({ hisseler: va.hisseler.map((x) => (x.id === h.id ? { ...x, lot: n } : x)) })}
            />
            <SayiAlani
              etiket="Fiyat"
              deger={h.fiyat}
              onDegis={(n) => d({ hisseler: va.hisseler.map((x) => (x.id === h.id ? { ...x, fiyat: n } : x)) })}
            />
          </div>
        </OgeKarti>
      ))}
      <Buton
        renk="nane"
        kucuk
        onClick={() => d({ hisseler: [...va.hisseler, { id: yeniId(), kod: '', lot: 0, fiyat: 0 }] })}
      >
        + Hisse ekle
      </Buton>
    </div>
  );
}

/* ---------------- Gelir ---------------- */

export function GelirFormu() {
  const { veri, degistir } = useVeri();
  const g = veri.gelir;
  const d = (kismi: Partial<typeof g>) => degistir((v) => ({ ...v, gelir: { ...v.gelir, ...kismi } }));
  const kira = kiraGeliri(veri);

  return (
    <div>
      <div className="izgara-2">
        <SayiAlani etiket="Aylık net maaşın" deger={g.maas} onDegis={(n) => d({ maas: n })} />
        {veri.profil.medeniHal === 'evli' && (
          <SayiAlani
            etiket={`${veri.profil.esAd || 'Eşinin'} aylık net geliri`}
            deger={g.esMaas}
            onDegis={(n) => d({ esMaas: n })}
          />
        )}
        <SayiAlani
          etiket="Ek gelir (aylık)"
          deger={g.ekGelir}
          ipucu="Serbest iş, prim, düzenli destek vb."
          onDegis={(n) => d({ ekGelir: n })}
        />
      </div>
      {kira > 0 && (
        <BosIpucu>
          🏠 Kiraya verdiğin ev(ler)den aylık {tl(kira)} kira geliri otomatik eklendi.
        </BosIpucu>
      )}
    </div>
  );
}

/* ---------------- Giderler (profil filtreli) ---------------- */

export function GiderlerFormu() {
  const { veri, degistir } = useVeri();
  const gi = veri.giderler;
  const sabitD = (kismi: Partial<typeof gi.sabit>) =>
    degistir((v) => ({ ...v, giderler: { ...v.giderler, sabit: { ...v.giderler.sabit, ...kismi } } }));
  const aracD = (kismi: Partial<typeof gi.arac>) =>
    degistir((v) => ({ ...v, giderler: { ...v.giderler, arac: { ...v.giderler.arac, ...kismi } } }));
  const cocukD = (kismi: Partial<typeof gi.cocuk>) =>
    degistir((v) => ({ ...v, giderler: { ...v.giderler, cocuk: { ...v.giderler.cocuk, ...kismi } } }));

  const aracVar = veri.araclar.length > 0;
  const cocuklar = veri.profil.cocuklar;

  const evcilGideriGetir = (evcilId: string) =>
    gi.evcil.find((x) => x.evcilId === evcilId) ?? {
      evcilId,
      aylikMama: 0,
      aylikKumTimar: 0,
      yillikVeteriner: 0,
    };
  const evcilD = (evcilId: string, kismi: Partial<ReturnType<typeof evcilGideriGetir>>) =>
    degistir((v) => {
      const mevcut = v.giderler.evcil.find((x) => x.evcilId === evcilId);
      const yeni = mevcut
        ? v.giderler.evcil.map((x) => (x.evcilId === evcilId ? { ...x, ...kismi } : x))
        : [...v.giderler.evcil, { evcilId, aylikMama: 0, aylikKumTimar: 0, yillikVeteriner: 0, ...kismi }];
      return { ...v, giderler: { ...v.giderler, evcil: yeni } };
    });

  return (
    <div>
      <span className="alan-etiket" style={{ fontSize: 16 }}>Sabit giderler (aylık)</span>
      <div className="izgara-2">
        <SayiAlani etiket="Faturalar (elektrik, su, doğalgaz, internet)" deger={gi.sabit.faturalar} onDegis={(n) => sabitD({ faturalar: n })} />
        <SayiAlani etiket="Aidat" deger={gi.sabit.aidat} onDegis={(n) => sabitD({ aidat: n })} />
        <SayiAlani etiket="Market / mutfak" deger={gi.sabit.market} onDegis={(n) => sabitD({ market: n })} />
        <SayiAlani etiket="Abonelikler (dizi, müzik, spor…)" deger={gi.sabit.abonelikler} onDegis={(n) => sabitD({ abonelikler: n })} />
        <SayiAlani etiket="Sağlık" deger={gi.sabit.saglik} onDegis={(n) => sabitD({ saglik: n })} />
        <SayiAlani etiket="Eğlence / dışarıda yemek" deger={gi.sabit.eglence} onDegis={(n) => sabitD({ eglence: n })} />
        <SayiAlani etiket="Giyim" deger={gi.sabit.giyim} onDegis={(n) => sabitD({ giyim: n })} />
        <SayiAlani etiket="Diğer" deger={gi.sabit.diger} onDegis={(n) => sabitD({ diger: n })} />
      </div>

      <span className="alan-etiket" style={{ fontSize: 16 }}>Ulaşım</span>
      {aracVar ? (
        <div className="izgara-2">
          <SayiAlani etiket="Yakıt (aylık)" deger={gi.arac.yakit} onDegis={(n) => aracD({ yakit: n })} />
          <SayiAlani etiket="Otopark (aylık)" deger={gi.arac.otopark} onDegis={(n) => aracD({ otopark: n })} />
          <SayiAlani
            etiket="Kasko + muayene + bakım (YILLIK)"
            deger={gi.arac.yillikSigortaBakim}
            ipucu="Yıllık toplamı gir; hesapta 12'ye bölünür."
            onDegis={(n) => aracD({ yillikSigortaBakim: n })}
          />
        </div>
      ) : (
        <SayiAlani
          etiket="Toplu taşıma (aylık)"
          deger={gi.topluTasima}
          ipucu="Aracın olmadığı için yakıt/kasko yerine bunu soruyoruz."
          onDegis={(n) => degistir((v) => ({ ...v, giderler: { ...v.giderler, topluTasima: n } }))}
        />
      )}

      {veri.profil.evciller.length > 0 && (
        <>
          <span className="alan-etiket" style={{ fontSize: 16 }}>Evcil hayvan giderleri</span>
          {veri.profil.evciller.map((e) => {
            const g = evcilGideriGetir(e.id);
            const ad = e.ad || (e.tur === 'kedi' ? 'Kedi' : e.tur === 'kopek' ? 'Köpek' : e.tur === 'kus' ? 'Kuş' : e.tur === 'balik' ? 'Balık' : 'Dostumuz');
            return (
              <div className="oge-kart" key={e.id}>
                <span className="alan-etiket">🐾 {ad}</span>
                <div className="izgara-2">
                  <SayiAlani etiket="Mama (aylık)" deger={g.aylikMama} onDegis={(n) => evcilD(e.id, { aylikMama: n })} />
                  <SayiAlani etiket="Kum / tımar (aylık)" deger={g.aylikKumTimar} onDegis={(n) => evcilD(e.id, { aylikKumTimar: n })} />
                  <SayiAlani
                    etiket="Veteriner (YILLIK)"
                    deger={g.yillikVeteriner}
                    ipucu="Aşı ve kontroller — yıllık toplam."
                    onDegis={(n) => evcilD(e.id, { yillikVeteriner: n })}
                  />
                </div>
              </div>
            );
          })}
        </>
      )}

      {cocuklar.length > 0 && (
        <>
          <span className="alan-etiket" style={{ fontSize: 16 }}>Çocuk giderleri (aylık)</span>
          <div className="izgara-2">
            {bantUygunMu(cocuklar, 'bezMama') && (
              <SayiAlani etiket="Bebek bezi / mama" deger={gi.cocuk.bezMama} onDegis={(n) => cocukD({ bezMama: n })} />
            )}
            {bantUygunMu(cocuklar, 'kresBakici') && (
              <SayiAlani etiket="Kreş / bakıcı" deger={gi.cocuk.kresBakici} onDegis={(n) => cocukD({ kresBakici: n })} />
            )}
            {bantUygunMu(cocuklar, 'okulKirtasiye') && (
              <SayiAlani etiket="Okul / kırtasiye / kurs" deger={gi.cocuk.okulKirtasiye} onDegis={(n) => cocukD({ okulKirtasiye: n })} />
            )}
            {bantUygunMu(cocuklar, 'harclik') && (
              <SayiAlani etiket="Harçlık" deger={gi.cocuk.harclik} onDegis={(n) => cocukD({ harclik: n })} />
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------- Borçlar ---------------- */

const BORC_TURLERI: Array<{ deger: BorcTuru; ad: string }> = [
  { deger: 'konut', ad: 'Konut kredisi' },
  { deger: 'tasit', ad: 'Taşıt kredisi' },
  { deger: 'ihtiyac', ad: 'İhtiyaç kredisi' },
  { deger: 'krediKarti', ad: 'Kredi kartı' },
  { deger: 'diger', ad: 'Diğer' },
];

export function BorclarFormu() {
  const { veri, degistir } = useVeri();
  const guncelle = (id: string, kismi: Partial<Borc>) =>
    degistir((v) => ({
      ...v,
      borclar: v.borclar.map((x) => (x.id === id ? { ...x, ...kismi } : x)),
    }));

  return (
    <div>
      {veri.borclar.length === 0 && <BosIpucu>Borcun yoksa bu bölümü boş bırakabilirsin. 🎉</BosIpucu>}
      {veri.borclar.map((b) => (
        <OgeKarti
          key={b.id}
          onSil={() => degistir((v) => ({ ...v, borclar: v.borclar.filter((x) => x.id !== b.id) }))}
        >
          <SecimKutusu
            etiket="Borç türü"
            secenekler={BORC_TURLERI}
            deger={b.tur}
            onDegis={(t) => guncelle(b.id, { tur: t })}
          />
          <div className="izgara-2">
            <SayiAlani
              etiket="Kalan borç (toplam)"
              deger={b.kalan}
              ipucu="Net değerinden düşülür."
              onDegis={(n) => guncelle(b.id, { kalan: n })}
            />
            <SayiAlani
              etiket="Aylık taksit"
              deger={b.taksit}
              ipucu="Aylık giderlerine eklenir."
              onDegis={(n) => guncelle(b.id, { taksit: n })}
            />
          </div>
        </OgeKarti>
      ))}
      <Buton
        renk="nane"
        kucuk
        onClick={() =>
          degistir((v) => ({
            ...v,
            borclar: [...v.borclar, { id: yeniId(), tur: 'ihtiyac', kalan: 0, taksit: 0 }],
          }))
        }
      >
        + Borç ekle
      </Buton>
    </div>
  );
}
