// Alan formları — hem onboarding sihirbazında hem ana paneldeki sekmelerde
// aynı bileşenler kullanılır; böylece her bilgi sonradan da güncellenebilir.
import { useState } from 'react';
import { useVeri, useAracDegerleri } from '../state';
import type {
  Arac,
  AracTuru,
  Borc,
  BorcTuru,
  DovizKodu,
  EvDurumu,
  EvcilTur,
  MedeniHal,
  YatirimTuru,
} from '../model/types';
import { varsayilanAvatar, yeniId } from '../model/defaults';
import { bantUygunMu, kiraGeliri } from '../logic/finance';
import { canliFiyatlariCek, fiyatYasiGun } from '../logic/prices';
import { tl } from '../logic/format';
import {
  BolumBaslik,
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
        etiket="Medeni durumunuz"
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
          etiket="Eşinizin adı"
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
      {cocuklar.length === 0 && <BosIpucu>Çocuğunuz yoksa bu bölümü boş bırakabilirsiniz.</BosIpucu>}
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
        renk="golgesiz"
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
  { deger: 'kedi', ad: 'Kedi' },
  { deger: 'kopek', ad: 'Köpek' },
  { deger: 'kus', ad: 'Kuş' },
  { deger: 'balik', ad: 'Balık' },
  { deger: 'diger', ad: 'Diğer' },
];

export function EvcillerFormu() {
  const { veri, degistir } = useVeri();
  const evciller = veri.profil.evciller;
  return (
    <div>
      {evciller.length === 0 && (
        <BosIpucu>Evcil hayvanınız yoksa mama/veteriner soruları hiç gösterilmez.</BosIpucu>
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
            ipucu="Ad verirseniz giderlerde bu isimle görünür."
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
        renk="golgesiz"
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
        <BosIpucu>Oturduğunuz evi (kiracıysanız bile) ve sahip olduğunuz diğer evleri ekleyin.</BosIpucu>
      )}
      {veri.evler.map((ev) => (
        <OgeKarti
          key={ev.id}
          onSil={() => degistir((v) => ({ ...v, evler: v.evler.filter((x) => x.id !== ev.id) }))}
        >
          <CipSecim
            etiket="Bu evdeki durumunuz"
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
              etiket="Ödediğiniz aylık kira"
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
              etiket="Aldığınız aylık kira"
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
        renk="golgesiz"
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

const ARAC_TURLERI: Array<{ deger: AracTuru; ad: string }> = [
  { deger: 'araba', ad: 'Araba' },
  { deger: 'motosiklet', ad: 'Motosiklet' },
  { deger: 'diger', ad: 'Diğer' },
];

function AracSatiri({ arac }: { arac: Arac }) {
  const { degistir } = useVeri();
  const piyasa = useAracDegerleri();

  const markalar = piyasa ? Object.keys(piyasa.markalar) : [];
  const markaListede = arac.tur === 'araba' && markalar.includes(arac.marka);
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
      <CipSecim
        etiket="Araç türü"
        secenekler={ARAC_TURLERI}
        deger={arac.tur}
        onDegis={(t) => guncelle({ tur: t })}
      />
      {arac.tur === 'araba' && piyasa ? (
        <div className="izgara-2">
          <SecimKutusu
            etiket="Marka"
            secenekler={[
              { deger: '', ad: 'Seçin…' },
              ...markalar.map((m) => ({ deger: m, ad: m })),
              { deger: '__diger__', ad: 'Diğer (elle girin)' },
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
                { deger: '', ad: 'Seçin…' },
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
      ) : (
        <div className="izgara-2">
          <MetinAlani etiket="Marka" deger={arac.marka} placeholder="örn. Honda" onDegis={(s) => guncelle({ marka: s })} />
          <MetinAlani etiket="Model" deger={arac.model} placeholder="örn. CB500" onDegis={(s) => guncelle({ model: s })} />
        </div>
      )}
      <SayiAlani
        etiket="Aracın değeri"
        deger={arac.deger}
        ipucu={
          oneri
            ? `Ortalama ikinci el değeri önerildi (${tl(oneri)}, ${piyasa?.guncellemeTarihi} itibarıyla). Üzerine yazabilirsiniz.`
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
        <BosIpucu>Aracınız yoksa boş bırakın — giderlerde yalnızca toplu taşıma sorulur.</BosIpucu>
      )}
      {veri.araclar.map((a) => (
        <AracSatiri key={a.id} arac={a} />
      ))}
      <Buton
        renk="golgesiz"
        kucuk
        onClick={() =>
          degistir((v) => ({
            ...v,
            araclar: [...v.araclar, { id: yeniId(), tur: 'araba', marka: '', model: '', deger: 0 }],
          }))
        }
      >
        + Araç ekle
      </Buton>
    </div>
  );
}

/* ---------------- Varlıklar ---------------- */

const YATIRIM_TURLERI: Array<{ deger: YatirimTuru; ad: string }> = [
  { deger: 'hisse', ad: 'Hisse' },
  { deger: 'fon', ad: 'Fon' },
  { deger: 'etf', ad: 'ETF' },
  { deger: 'diger', ad: 'Diğer' },
];

const DOVIZ_KODLARI: Array<{ deger: DovizKodu; ad: string }> = [
  { deger: 'USD', ad: 'Dolar (USD)' },
  { deger: 'EUR', ad: 'Euro (EUR)' },
  { deger: 'GBP', ad: 'Sterlin (GBP)' },
  { deger: 'diger', ad: 'Diğer' },
];

function CanliFiyatButonu() {
  const { degistir } = useVeri();
  const [durum, setDurum] = useState<'bekliyor' | 'calisiyor' | 'oldu' | 'olmadi'>('bekliyor');

  return (
    <div style={{ marginBottom: 12 }}>
      <Buton
        renk="vurgu"
        kucuk
        disabled={durum === 'calisiyor'}
        onClick={async () => {
          setDurum('calisiyor');
          const f = await canliFiyatlariCek();
          if (!f) {
            setDurum('olmadi');
            return;
          }
          degistir((v) => ({
            ...v,
            varliklar: {
              ...v.varliklar,
              altinGramFiyat: f.altinGram ?? v.varliklar.altinGramFiyat,
              gumusGramFiyat: f.gumusGram ?? v.varliklar.gumusGramFiyat,
              dovizler: v.varliklar.dovizler.map((d) => {
                const yeni = d.kod === 'USD' ? f.usd : d.kod === 'EUR' ? f.eur : d.kod === 'GBP' ? f.gbp : undefined;
                return yeni ? { ...d, kur: yeni } : d;
              }),
              fiyatGuncelleme: new Date().toISOString(),
            },
          }));
          setDurum('oldu');
        }}
      >
        {durum === 'calisiyor' ? 'Fiyatlar çekiliyor…' : '⟳ Güncel fiyatları çek (deneysel)'}
      </Buton>
      {durum === 'oldu' && (
        <span className="alan-ipucu"> ✓ Altın/gümüş/döviz fiyatları güncellendi.</span>
      )}
      {durum === 'olmadi' && (
        <span className="alan-ipucu">
          {' '}Kaynağa ulaşılamadı — fiyatları elle girmeye devam edebilirsiniz.
        </span>
      )}
    </div>
  );
}

export function VarliklarFormu() {
  const { veri, degistir } = useVeri();
  const va = veri.varliklar;
  const d = (kismi: Partial<typeof va>) =>
    degistir((v) => ({ ...v, varliklar: { ...v.varliklar, ...kismi } }));

  const fiyatYasi = fiyatYasiGun(va.fiyatGuncelleme);

  return (
    <div>
      <BolumBaslik>Nakit ve mevduat</BolumBaslik>
      <div className="izgara-2">
        <SayiAlani etiket="Nakit (cüzdan + kasa)" deger={va.nakit} onDegis={(n) => d({ nakit: n })} />
        <SayiAlani etiket="Banka hesapları + mevduat" deger={va.banka} onDegis={(n) => d({ banka: n })} />
      </div>

      <BolumBaslik>Altın ve gümüş</BolumBaslik>
      {fiyatYasi !== null && fiyatYasi > 60 && (
        <BosIpucu>
          ⚠️ Fiyatlar {fiyatYasi} gündür güncellenmedi — puanınızın güncel kalması için tazeleyin.
        </BosIpucu>
      )}
      <CanliFiyatButonu />
      <div className="izgara-2">
        <SayiAlani etiket="Altın (gram)" deger={va.altinGram} birim="gr" onDegis={(n) => d({ altinGram: n })} />
        <SayiAlani etiket="Gram altın fiyatı" deger={va.altinGramFiyat} onDegis={(n) => d({ altinGramFiyat: n })} />
        <SayiAlani etiket="Gümüş (gram)" deger={va.gumusGram} birim="gr" onDegis={(n) => d({ gumusGram: n })} />
        <SayiAlani etiket="Gram gümüş fiyatı" deger={va.gumusGramFiyat} onDegis={(n) => d({ gumusGramFiyat: n })} />
      </div>

      <BolumBaslik>Döviz</BolumBaslik>
      {va.dovizler.length === 0 && <BosIpucu>Döviz birikiminiz yoksa boş bırakın.</BosIpucu>}
      {va.dovizler.map((doviz) => (
        <OgeKarti
          key={doviz.id}
          onSil={() => d({ dovizler: va.dovizler.filter((x) => x.id !== doviz.id) })}
        >
          <div className="satir">
            <SecimKutusu
              etiket="Para birimi"
              secenekler={DOVIZ_KODLARI}
              deger={doviz.kod}
              onDegis={(k) =>
                d({ dovizler: va.dovizler.map((x) => (x.id === doviz.id ? { ...x, kod: k } : x)) })
              }
            />
            <SayiAlani
              etiket="Miktar"
              deger={doviz.miktar}
              birim={doviz.kod === 'diger' ? '' : doviz.kod}
              onDegis={(n) =>
                d({ dovizler: va.dovizler.map((x) => (x.id === doviz.id ? { ...x, miktar: n } : x)) })
              }
            />
            <SayiAlani
              etiket="Kur (1 birim)"
              deger={doviz.kur}
              onDegis={(n) =>
                d({ dovizler: va.dovizler.map((x) => (x.id === doviz.id ? { ...x, kur: n } : x)) })
              }
            />
          </div>
        </OgeKarti>
      ))}
      <Buton
        renk="golgesiz"
        kucuk
        onClick={() => d({ dovizler: [...va.dovizler, { id: yeniId(), kod: 'USD', miktar: 0, kur: 0 }] })}
      >
        + Döviz ekle
      </Buton>

      <BolumBaslik>Hisse senetleri ve yatırım fonları</BolumBaslik>
      {va.yatirimlar.length === 0 && <BosIpucu>Hisse/fon/ETF'iniz yoksa boş bırakın.</BosIpucu>}
      {va.yatirimlar.map((y) => (
        <OgeKarti
          key={y.id}
          onSil={() => d({ yatirimlar: va.yatirimlar.filter((x) => x.id !== y.id) })}
        >
          <div className="satir">
            <MetinAlani
              etiket="Adı / kodu"
              deger={y.ad}
              placeholder="örn. THYAO, Teknoloji Fonu"
              onDegis={(s) =>
                d({ yatirimlar: va.yatirimlar.map((x) => (x.id === y.id ? { ...x, ad: s } : x)) })
              }
            />
            <SecimKutusu
              etiket="Tür"
              secenekler={YATIRIM_TURLERI}
              deger={y.tur}
              onDegis={(t) =>
                d({ yatirimlar: va.yatirimlar.map((x) => (x.id === y.id ? { ...x, tur: t } : x)) })
              }
            />
            <SayiAlani
              etiket="Güncel değeri"
              deger={y.deger}
              onDegis={(n) =>
                d({ yatirimlar: va.yatirimlar.map((x) => (x.id === y.id ? { ...x, deger: n } : x)) })
              }
            />
          </div>
        </OgeKarti>
      ))}
      <Buton
        renk="golgesiz"
        kucuk
        onClick={() =>
          d({ yatirimlar: [...va.yatirimlar, { id: yeniId(), ad: '', tur: 'hisse', deger: 0 }] })
        }
      >
        + Hisse / fon ekle
      </Buton>

      <BolumBaslik>Diğer</BolumBaslik>
      <div className="izgara-2">
        <SayiAlani etiket="Kripto (toplam değer)" deger={va.kripto} onDegis={(n) => d({ kripto: n })} />
        <SayiAlani
          etiket="BES birikimi"
          deger={va.bes}
          ipucu="Bireysel emeklilik — devlet katkısı dahil güncel toplam."
          onDegis={(n) => d({ bes: n })}
        />
        <SayiAlani
          etiket="Alacaklarınız"
          deger={va.alacaklar}
          ipucu="Başkasına borç verdiğiniz, geri almayı beklediğiniz para."
          onDegis={(n) => d({ alacaklar: n })}
        />
        <SayiAlani etiket="Diğer varlıklar" deger={va.diger} onDegis={(n) => d({ diger: n })} />
      </div>
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
        <SayiAlani etiket="Aylık net maaşınız" deger={g.maas} onDegis={(n) => d({ maas: n })} />
        {veri.profil.medeniHal === 'evli' && (
          <SayiAlani
            etiket={`${veri.profil.esAd || 'Eşinizin'} aylık net geliri`}
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
        {veri.profil.medeniHal === 'bosanmis' && (
          <SayiAlani
            etiket="Aldığınız nafaka (aylık)"
            deger={g.nafakaAlinan}
            onDegis={(n) => d({ nafakaAlinan: n })}
          />
        )}
      </div>
      {kira > 0 && (
        <BosIpucu>
          Kiraya verdiğiniz ev(ler)den aylık {tl(kira)} kira geliri otomatik eklendi.
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
  const giderD = (kismi: Partial<typeof gi>) =>
    degistir((v) => ({ ...v, giderler: { ...v.giderler, ...kismi } }));

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
      <BolumBaslik>Sabit giderler (aylık)</BolumBaslik>
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
      <SayiAlani
        etiket="Sigorta poliçeleri (YILLIK toplam)"
        deger={gi.yillikSigortalar}
        ipucu="Hayat, sağlık, DASK/konut vb. — yıllık toplamı girin, hesapta 12'ye bölünür."
        onDegis={(n) => giderD({ yillikSigortalar: n })}
      />

      <BolumBaslik>Ulaşım</BolumBaslik>
      {aracVar && (
        <div className="izgara-2">
          <SayiAlani etiket="Yakıt (aylık)" deger={gi.arac.yakit} onDegis={(n) => aracD({ yakit: n })} />
          <SayiAlani etiket="Otopark (aylık)" deger={gi.arac.otopark} onDegis={(n) => aracD({ otopark: n })} />
          <SayiAlani
            etiket="Kasko + muayene + bakım (YILLIK)"
            deger={gi.arac.yillikSigortaBakim}
            ipucu="Yıllık toplamı girin; hesapta 12'ye bölünür."
            onDegis={(n) => aracD({ yillikSigortaBakim: n })}
          />
        </div>
      )}
      <SayiAlani
        etiket="Toplu taşıma (aylık)"
        deger={gi.topluTasima}
        ipucu={aracVar ? 'Aracınız olsa da metro/otobüs kullanıyorsanız girin.' : 'İşe gidiş-geliş dahil aylık toplam.'}
        onDegis={(n) => giderD({ topluTasima: n })}
      />

      {veri.profil.medeniHal === 'evli' && (
        <>
          <BolumBaslik>Aile</BolumBaslik>
          <SayiAlani
            etiket={`${veri.profil.esAd || 'Eşinize'} verdiğiniz aylık para`}
            deger={gi.esHarcligi}
            ipucu="Yoksa boş bırakın."
            onDegis={(n) => giderD({ esHarcligi: n })}
          />
        </>
      )}
      {veri.profil.medeniHal === 'bosanmis' && (
        <>
          <BolumBaslik>Aile</BolumBaslik>
          <SayiAlani
            etiket="Ödediğiniz nafaka (aylık)"
            deger={gi.nafakaOdenen}
            onDegis={(n) => giderD({ nafakaOdenen: n })}
          />
        </>
      )}

      {veri.profil.evciller.length > 0 && (
        <>
          <BolumBaslik>Evcil hayvan giderleri</BolumBaslik>
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
          <BolumBaslik>Çocuk giderleri (aylık)</BolumBaslik>
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
            {bantUygunMu(cocuklar, 'universite') && (
              <SayiAlani
                etiket="Üniversite (yurt/kira/harçlık)"
                deger={gi.cocuk.universite}
                onDegis={(n) => cocukD({ universite: n })}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------- Borçlar ve taksitler ---------------- */

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
      {veri.borclar.length === 0 && <BosIpucu>Krediniz yoksa bu bölümü boş bırakabilirsiniz.</BosIpucu>}
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
              ipucu="Net değerinizden düşülür."
              onDegis={(n) => guncelle(b.id, { kalan: n })}
            />
            <SayiAlani
              etiket="Aylık taksit"
              deger={b.taksit}
              ipucu="Aylık giderlerinize eklenir."
              onDegis={(n) => guncelle(b.id, { taksit: n })}
            />
          </div>
        </OgeKarti>
      ))}
      <Buton
        renk="golgesiz"
        kucuk
        onClick={() =>
          degistir((v) => ({
            ...v,
            borclar: [...v.borclar, { id: yeniId(), tur: 'ihtiyac', kalan: 0, taksit: 0 }],
          }))
        }
      >
        + Kredi ekle
      </Buton>
    </div>
  );
}

export function TaksitlerFormu() {
  const { veri, degistir } = useVeri();
  return (
    <div>
      {veri.taksitler.length === 0 && (
        <BosIpucu>Taksitle aldığınız ürünler (telefon, beyaz eşya…) buraya — kalan borç otomatik hesaplanır.</BosIpucu>
      )}
      {veri.taksitler.map((t) => (
        <OgeKarti
          key={t.id}
          onSil={() => degistir((v) => ({ ...v, taksitler: v.taksitler.filter((x) => x.id !== t.id) }))}
        >
          <div className="satir">
            <MetinAlani
              etiket="Ne aldınız?"
              deger={t.ad}
              placeholder="örn. Telefon"
              onDegis={(s) =>
                degistir((v) => ({
                  ...v,
                  taksitler: v.taksitler.map((x) => (x.id === t.id ? { ...x, ad: s } : x)),
                }))
              }
            />
            <SayiAlani
              etiket="Aylık taksit"
              deger={t.aylikTaksit}
              onDegis={(n) =>
                degistir((v) => ({
                  ...v,
                  taksitler: v.taksitler.map((x) => (x.id === t.id ? { ...x, aylikTaksit: n } : x)),
                }))
              }
            />
            <SayiAlani
              etiket="Kaç taksit kaldı?"
              deger={t.kalanAy}
              birim="ay"
              onDegis={(n) =>
                degistir((v) => ({
                  ...v,
                  taksitler: v.taksitler.map((x) => (x.id === t.id ? { ...x, kalanAy: Math.round(n) } : x)),
                }))
              }
            />
          </div>
          {t.aylikTaksit > 0 && t.kalanAy > 0 && (
            <span className="alan-ipucu">
              Kalan toplam: {tl(t.aylikTaksit * t.kalanAy)} — net değerinizden düşülür.
            </span>
          )}
        </OgeKarti>
      ))}
      <Buton
        renk="golgesiz"
        kucuk
        onClick={() =>
          degistir((v) => ({
            ...v,
            taksitler: [...v.taksitler, { id: yeniId(), ad: '', aylikTaksit: 0, kalanAy: 0 }],
          }))
        }
      >
        + Taksitli alışveriş ekle
      </Buton>
    </div>
  );
}
