// Ana panel — kurulum sonrası her şey buradan güncellenir.
import { useEffect, useRef, useState } from 'react';
import { pinDogru, pinKaldir, pinKaydet, pinVarMi, useGizli, useTema, useVeri } from '../state';
import { Sahne } from '../components/Scene';
import { PuanDokumu } from '../components/ScoreCard';
import { AvatarEditor } from '../components/AvatarEditor';
import { HalkaGrafik, MiniTrend } from '../components/charts';
import {
  AraclarFormu,
  BorclarFormu,
  CocuklarFormu,
  EvcillerFormu,
  EvlerFormu,
  GelirFormu,
  GiderlerFormu,
  MedeniHalFormu,
  TaksitlerFormu,
  VarliklarFormu,
} from '../components/forms';
import { SenaryolarSayfasi } from './Senaryolar';
import { GunlukHarcamalar } from '../components/Harcamalar';
import {
  Buton,
  CipSecim,
  GizlilikNotu,
  Kart,
  KilitliBolum,
  MetinAlani,
  SayiAlani,
  YasalUyari,
} from '../components/ui';
import { yasHesapla } from '../logic/plan';
import { aiAnahtarKaydet, aiAnahtarSil, aiAnahtarVar } from '../logic/ai';
import {
  aylikGelir,
  aylikGider,
  giderDokumu,
  nakitAkisi,
  netDeger,
  toplamBorc,
} from '../logic/finance';
import { puanHesapla } from '../logic/score';
import { varsayilanAvatar, varsayilanVeri } from '../model/defaults';
import { veriSil, yedekIndir, yedekOku } from '../storage/storage';

type Sekme = 'manzara' | 'senaryolar' | 'puan' | 'varliklar' | 'butce' | 'profil';

const SEKMELER: Array<{ anahtar: Sekme; ad: string; ikon: string }> = [
  { anahtar: 'manzara', ad: 'Manzara', ikon: '🏞️' },
  { anahtar: 'puan', ad: 'Puan', ikon: '◐' },
  { anahtar: 'senaryolar', ad: 'Plan', ikon: '🎯' },
  { anahtar: 'varliklar', ad: 'Varlıklar', ikon: '◆' },
  { anahtar: 'butce', ad: 'Bütçe', ikon: '☰' },
  { anahtar: 'profil', ad: 'Profil', ikon: '●' },
];

function OzetKutulari() {
  const { veri } = useVeri();
  const { tutar } = useGizli();
  const akis = nakitAkisi(veri);
  return (
    <div className="ozet-izgara">
      <div className="ozet-kut">
        <div className="etiket">Net değer</div>
        <div className={`deger ${netDeger(veri) >= 0 ? '' : 'negatif'}`}>{tutar(netDeger(veri))}</div>
      </div>
      <div className="ozet-kut">
        <div className="etiket">Aylık gelir</div>
        <div className="deger">{tutar(aylikGelir(veri))}</div>
      </div>
      <div className="ozet-kut">
        <div className="etiket">Aylık gider</div>
        <div className="deger">{tutar(aylikGider(veri))}</div>
      </div>
      <div className="ozet-kut">
        <div className="etiket">Ay sonu kalan</div>
        <div className={`deger ${akis >= 0 ? 'pozitif' : 'negatif'}`}>{tutar(akis)}</div>
      </div>
    </div>
  );
}

function ManzaraSekmesi({ senaryolaraGit }: { senaryolaraGit: () => void }) {
  const { veri } = useVeri();
  const { tutar } = useGizli();
  const akis = nakitAkisi(veri);
  const simdi = new Date().toISOString();
  const hatirlatmalar = veri.kararlar.filter((k) => k.hatirlatma && k.hatirlatma <= simdi);
  return (
    <>
      <h2 className="sekme-baslik">
        Merhaba{veri.profil.ad ? `, ${veri.profil.ad}` : ''}
      </h2>
      {hatirlatmalar.length > 0 && (
        <div className="yasal-uyari" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ flex: 1, minWidth: 200 }}>
            🔔 "{hatirlatmalar[0].baslik}" kararınıza yeniden bakma zamanı geldi.
          </span>
          <Buton kucuk onClick={senaryolaraGit}>
            Karara git →
          </Buton>
        </div>
      )}
      <Kart className="sahne-kart">
        <Sahne veri={veri} />
      </Kart>
      {akis < 0 && (
        <div className="yasal-uyari">
          🌧️ Bu ay {tutar(-akis)} açık veriyorsunuz — o yüzden manzaranızda yağmur yağıyor.
        </div>
      )}
      <div className="kart hero-senaryo">
        <div className="hero-metin">
          <h3>🎯 Senaryolar ve Plan</h3>
          <p>
            "Bu arabayı alsam ne olur?" • "Kredi mi peşin mi?" • Finansal özgürlüğe ne kadar var?
            Hedeflerinize göre kişisel plan burada.
          </p>
        </div>
        <Buton onClick={senaryolaraGit}>Sayfayı aç →</Buton>
      </div>
      <OzetKutulari />
      {veri.gecmis.length >= 2 && (
        <Kart baslik="Net değer gelişimi" aciklama="Ay sonu kayıtlarından.">
          <MiniTrend
            degerler={veri.gecmis.map((g) => g.netDeger)}
            etiketler={veri.gecmis.map((g) => g.ay)}
          />
        </Kart>
      )}
    </>
  );
}

const GIDER_RENKLERI = ['#23456e', '#c08a2d', '#2e7d5e', '#3d7ea6', '#8a2f4f', '#b45f3c', '#5d6b81', '#4a4a68'];

function PuanSekmesi() {
  const { veri } = useVeri();
  const dokum = giderDokumu(veri);
  const dilimler = [
    { ad: 'Sabit giderler', deger: dokum.sabit },
    { ad: 'Kira', deger: dokum.kira },
    { ad: 'Ulaşım', deger: dokum.ulasim },
    { ad: 'Sigortalar', deger: dokum.sigorta },
    { ad: 'Aile', deger: dokum.aile },
    { ad: 'Evcil hayvanlar', deger: dokum.evcil },
    { ad: 'Çocuklar', deger: dokum.cocuk },
    { ad: 'Taksitler', deger: dokum.taksitler },
  ].map((d, i) => ({ ...d, renk: GIDER_RENKLERI[i % GIDER_RENKLERI.length] }));

  return (
    <>
      <h2 className="sekme-baslik">Finansal puanınız</h2>
      <Kart>
        <PuanDokumu veri={veri} />
      </Kart>
      {veri.gecmis.length >= 2 && (
        <Kart baslik="Puan gelişimi">
          <MiniTrend
            degerler={veri.gecmis.map((g) => g.puan)}
            etiketler={veri.gecmis.map((g) => g.ay)}
          />
        </Kart>
      )}
      <Kart baslik="Aylık gider dağılımı" aciklama="Puanın nasıl hesaplandığını görmek için.">
        <HalkaGrafik dilimler={dilimler} />
      </Kart>
      <YasalUyari />
    </>
  );
}

function VarliklarSekmesi() {
  const { veri } = useVeri();
  const { tutar } = useGizli();
  return (
    <>
      <h2 className="sekme-baslik">Varlıklarınız</h2>
      <OzetKutulari />
      <Kart baslik="Birikimler ve yatırımlar">
        <VarliklarFormu />
      </Kart>
      <Kart baslik="Evler">
        <EvlerFormu />
      </Kart>
      <Kart baslik="Araçlar">
        <AraclarFormu />
      </Kart>
      <Kart
        baslik="Borçlar"
        aciklama={toplamBorc(veri) > 0 ? `Toplam kalan borç: ${tutar(toplamBorc(veri))}` : undefined}
      >
        <BorclarFormu />
        <div style={{ height: 10 }} />
        <TaksitlerFormu />
      </Kart>
    </>
  );
}

function ButceSekmesi() {
  return (
    <>
      <h2 className="sekme-baslik">Bütçeniz</h2>
      <OzetKutulari />
      <Kart
        baslik="☕ Günlük harcamalar"
        aciklama="Gerçekleşen harcamalarınız — bütçe planınızı bozmaz, onunla kıyaslanır."
      >
        <GunlukHarcamalar />
      </Kart>
      <Kart baslik="Gelir">
        <GelirFormu />
      </Kart>
      <Kart baslik="Giderler" aciklama="Aylık bütçe planınız — puan ve nakit akışı bundan hesaplanır.">
        <GiderlerFormu />
      </Kart>
    </>
  );
}

function PinAyari() {
  const [pinli, setPinli] = useState(() => pinVarMi());
  const [mevcut, setMevcut] = useState('');
  const [yeni, setYeni] = useState('');
  const [mesaj, setMesaj] = useState<string | null>(null);

  const gecerli = (p: string) => /^\d{4,6}$/.test(p);

  return (
    <div>
      <p className="kart-aciklama">
        PIN, uygulama açılırken sorulur. Unutursanız tek çıkış yolu verileri sıfırlamaktır —
        bu yüzden önce yedek almanızı öneririz.
      </p>
      {pinli && (
        <MetinAlani
          etiket="Mevcut PIN"
          deger={mevcut}
          placeholder="••••"
          onDegis={(s) => setMevcut(s.replace(/\D/g, '').slice(0, 6))}
        />
      )}
      <MetinAlani
        etiket={pinli ? 'Yeni PIN (değiştirmek için)' : 'PIN oluştur (4-6 rakam)'}
        deger={yeni}
        placeholder="örn. 1907"
        onDegis={(s) => setYeni(s.replace(/\D/g, '').slice(0, 6))}
      />
      <div className="satir">
        <Buton
          kucuk
          onClick={async () => {
            if (!gecerli(yeni)) {
              setMesaj('PIN 4-6 rakamdan oluşmalı.');
              return;
            }
            if (pinli && !(await pinDogru(mevcut))) {
              setMesaj('Mevcut PIN yanlış.');
              return;
            }
            await pinKaydet(yeni);
            setPinli(true);
            setMevcut('');
            setYeni('');
            setMesaj('✓ PIN kaydedildi.');
          }}
        >
          {pinli ? 'PIN değiştir' : 'PIN oluştur'}
        </Buton>
        {pinli && (
          <Buton
            renk="golgesiz"
            kucuk
            onClick={async () => {
              if (!(await pinDogru(mevcut))) {
                setMesaj('Mevcut PIN yanlış.');
                return;
              }
              pinKaldir();
              setPinli(false);
              setMevcut('');
              setMesaj('PIN kaldırıldı.');
            }}
          >
            PIN kaldır
          </Buton>
        )}
      </div>
      {mesaj && <span className="alan-ipucu">{mesaj}</span>}
    </div>
  );
}

function AiAyari() {
  const [anahtarli, setAnahtarli] = useState(() => aiAnahtarVar());
  const [girilen, setGirilen] = useState('');

  return (
    <div>
      <p className="kart-aciklama">
        Karar Asistanı'ndaki hazır sorular her zaman ücretsizdir. Kendi cümlelerinizle
        serbest soru sorabilmek isterseniz buraya bir Claude API anahtarı ekleyin
        (console.anthropic.com adresinden alınır; soru başına maliyet kuruşlar düzeyindedir).
        Anahtar yalnızca bu cihazda saklanır; sorularınızla birlikte yalnızca isimsiz,
        yuvarlanmış finansal özet rakamları gönderilir.
      </p>
      {anahtarli ? (
        <div className="satir">
          <span style={{ fontWeight: 600, fontSize: 14 }}>✓ Anahtar kayıtlı — serbest sorular açık.</span>
          <div style={{ flex: 'none' }}>
            <Buton
              renk="golgesiz"
              kucuk
              onClick={() => {
                aiAnahtarSil();
                setAnahtarli(false);
              }}
            >
              Anahtarı kaldır
            </Buton>
          </div>
        </div>
      ) : (
        <div className="satir">
          <label className="alan" style={{ flex: 1 }}>
            <span className="alan-etiket">Claude API anahtarı</span>
            <input
              className="girdi"
              type="password"
              placeholder="sk-ant-…"
              value={girilen}
              onChange={(e) => setGirilen(e.target.value)}
            />
          </label>
          <div style={{ paddingBottom: 14, flex: 'none' }}>
            <Buton
              kucuk
              disabled={!girilen.trim().startsWith('sk-')}
              onClick={() => {
                aiAnahtarKaydet(girilen);
                setGirilen('');
                setAnahtarli(true);
              }}
            >
              Kaydet
            </Buton>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfilSekmesi() {
  const { veri, degistir, sifirla } = useVeri();
  const { tema, setTema } = useTema();
  const dosyaRef = useRef<HTMLInputElement>(null);
  const [mesaj, setMesaj] = useState<string | null>(null);
  const [esDuzenle, setEsDuzenle] = useState(false);

  return (
    <>
      <h2 className="sekme-baslik">Profil ve ayarlar</h2>
      <Kart baslik="Karakteriniz">
        <MetinAlani
          etiket="Adınız"
          deger={veri.profil.ad}
          onDegis={(s) => degistir((v) => ({ ...v, profil: { ...v.profil, ad: s } }))}
        />
        <AvatarEditor
          config={veri.profil.avatar}
          onDegis={(c) => degistir((v) => ({ ...v, profil: { ...v.profil, avatar: c } }))}
        />
      </Kart>
      <Kart
        baslik="Hayat bilgileri"
        aciklama="Medeni durum ve yaş; puanı ve planı doğrudan etkiler. Bu yüzden değişiklik onay ister — denemeler için Senaryolar sayfası var."
      >
        <KilitliBolum
          ozet={
            <span>
              {veri.profil.medeniHal === 'evli'
                ? `Evli${veri.profil.esAd ? ` — eş: ${veri.profil.esAd}` : ''}`
                : veri.profil.medeniHal === 'bosanmis'
                  ? 'Boşanmış'
                  : 'Bekâr'}
              <span className="alt">Medeni durum</span>
            </span>
          }
          uyari="Medeni durum gerçek hayat bilginizdir; puan ve plan hesaplarını doğrudan etkiler. 'Ne olurdu?' denemeleri için Senaryolar sayfasını kullanın. Yine de değiştirmek istiyor musunuz?"
        >
          <MedeniHalFormu />
        </KilitliBolum>
        <div style={{ height: 12 }} />
        {yasHesapla(veri) !== null ? (
          <KilitliBolum
            ozet={
              <span>
                {yasHesapla(veri)} yaş
                <span className="alt">Doğum yılı: {veri.profil.dogumYili}</span>
              </span>
            }
            uyari="Yaş, planın tavsiyelerini şekillendiren gerçek hayat bilginizdir. Yine de değiştirmek istiyor musunuz?"
          >
            <SayiAlani
              etiket="Yaşınız"
              deger={yasHesapla(veri) ?? 0}
              birim="yaş"
              onDegis={(n) =>
                degistir((v) => ({
                  ...v,
                  profil: {
                    ...v.profil,
                    dogumYili:
                      n >= 18 && n <= 99 ? new Date().getFullYear() - Math.round(n) : v.profil.dogumYili,
                  },
                }))
              }
            />
          </KilitliBolum>
        ) : (
          <p className="kart-aciklama">
            Yaşınız henüz girilmemiş — Senaryolar sayfasındaki Hedefler bölümünden ekleyebilirsiniz.
          </p>
        )}
        {veri.profil.medeniHal === 'evli' && (
          <>
            <div style={{ height: 12 }} />
            <Buton renk="golgesiz" kucuk onClick={() => setEsDuzenle(!esDuzenle)}>
              {esDuzenle ? 'Eş karakterini gizle' : 'Eş karakterini düzenle'}
            </Buton>
            {esDuzenle && (
              <div style={{ marginTop: 12 }}>
                <AvatarEditor
                  config={veri.profil.esAvatar ?? varsayilanAvatar()}
                  onDegis={(c) => degistir((v) => ({ ...v, profil: { ...v.profil, esAvatar: c } }))}
                />
              </div>
            )}
          </>
        )}
      </Kart>
      <Kart baslik="Çocuklar">
        <CocuklarFormu />
      </Kart>
      <Kart baslik="Evcil hayvanlar">
        <EvcillerFormu />
      </Kart>

      <Kart baslik="Görünüm">
        <CipSecim
          etiket="Tema"
          secenekler={[
            { deger: 'sistem', ad: 'Sistemle aynı' },
            { deger: 'acik', ad: 'Açık' },
            { deger: 'koyu', ad: 'Koyu' },
          ]}
          deger={tema}
          onDegis={setTema}
        />
      </Kart>

      <Kart baslik="Güvenlik — PIN kilidi">
        <PinAyari />
      </Kart>

      <Kart baslik="Yapay zeka (isteğe bağlı)">
        <AiAyari />
      </Kart>

      <Kart
        baslik="Yedekleme"
        aciklama="Verileriniz yalnızca bu cihazda durur. Dosya olarak yedek alıp başka cihazda geri yükleyebilirsiniz."
      >
        <div className="satir">
          <Buton onClick={() => yedekIndir(veri)}>⬇ Yedeği indir</Buton>
          <Buton renk="golgesiz" onClick={() => dosyaRef.current?.click()}>
            ⬆ Yedekten geri yükle
          </Buton>
        </div>
        <input
          ref={dosyaRef}
          type="file"
          accept="application/json,.json"
          style={{ display: 'none' }}
          onChange={async (e) => {
            const dosya = e.target.files?.[0];
            e.target.value = '';
            if (!dosya) return;
            const okunan = await yedekOku(dosya);
            if (okunan) {
              sifirla(okunan);
              setMesaj('✓ Yedek başarıyla geri yüklendi.');
            } else {
              setMesaj('✗ Bu dosya geçerli bir PARA yedeği değil.');
            }
          }}
        />
        {mesaj && <p style={{ fontWeight: 600, marginTop: 10, fontSize: 13.5 }}>{mesaj}</p>}
      </Kart>

      <Kart baslik="Baştan başla">
        <p className="kart-aciklama">
          Tüm verilerinizi bu cihazdan siler ve kurulum sihirbazını yeniden başlatır. Geri alınamaz —
          önce yedek almak isteyebilirsiniz.
        </p>
        <Buton
          renk="tehlike"
          onClick={() => {
            if (window.confirm('Tüm veriler silinsin mi? Bu işlem geri alınamaz.')) {
              veriSil();
              sifirla(varsayilanVeri());
            }
          }}
        >
          Verileri sil ve sıfırla
        </Buton>
      </Kart>

      <GizlilikNotu />
      <YasalUyari />
      <p style={{ textAlign: 'center', color: 'var(--metin-soluk)', fontSize: 12.5 }}>
        PARA v0.2 — Faz 1
      </p>
    </>
  );
}

export function Panel() {
  const { veri, degistir } = useVeri();
  const [sekme, setSekme] = useState<Sekme>('manzara');

  // Ay sonu anlık görüntüsü: her ayın kaydı güncel tutulur, ay değişince yeni kayıt açılır.
  useEffect(() => {
    const ay = new Date().toISOString().slice(0, 7);
    const puan = puanHesapla(veri).toplam;
    const nd = netDeger(veri);
    const ak = nakitAkisi(veri);
    degistir((v) => {
      const g = [...v.gecmis];
      const son = g[g.length - 1];
      if (son && son.ay === ay) {
        if (son.puan === puan && son.netDeger === nd && son.akis === ak) return v;
        g[g.length - 1] = { ay, puan, netDeger: nd, akis: ak };
      } else {
        g.push({ ay, puan, netDeger: nd, akis: ak });
      }
      return { ...v, gecmis: g.slice(-36) };
    });
  }, [veri, degistir]);

  return (
    <>
      <div className="icerik">
        {sekme === 'manzara' && <ManzaraSekmesi senaryolaraGit={() => setSekme('senaryolar')} />}
        {sekme === 'senaryolar' && <SenaryolarSayfasi />}
        {sekme === 'puan' && <PuanSekmesi />}
        {sekme === 'varliklar' && <VarliklarSekmesi />}
        {sekme === 'butce' && <ButceSekmesi />}
        {sekme === 'profil' && <ProfilSekmesi />}
      </div>
      <nav className="alt-nav">
        <div className="alt-nav-ic">
          {SEKMELER.map((s) => (
            <button
              key={s.anahtar}
              type="button"
              className={`nav-buton${s.anahtar === 'senaryolar' ? ' one' : ''}${sekme === s.anahtar ? ' aktif' : ''}`}
              onClick={() => setSekme(s.anahtar)}
            >
              <span className="ikon">{s.ikon}</span>
              {s.ad}
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}
