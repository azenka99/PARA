// Ana panel — kurulum sonrası her şey buradan güncellenir.
import { useRef, useState } from 'react';
import { useVeri } from '../state';
import { Sahne } from '../components/Scene';
import { PuanDokumu } from '../components/ScoreCard';
import { AvatarEditor } from '../components/AvatarEditor';
import {
  AraclarFormu,
  BorclarFormu,
  CocuklarFormu,
  EvcillerFormu,
  EvlerFormu,
  GelirFormu,
  GiderlerFormu,
  MedeniHalFormu,
  VarliklarFormu,
} from '../components/forms';
import {
  Buton,
  GizlilikNotu,
  Kart,
  MetinAlani,
  YasalUyari,
} from '../components/ui';
import {
  aylikGelir,
  aylikGider,
  giderDokumu,
  nakitAkisi,
  netDeger,
  toplamBorc,
} from '../logic/finance';
import { tl } from '../logic/format';
import { varsayilanAvatar, varsayilanVeri } from '../model/defaults';
import { veriSil, yedekIndir, yedekOku } from '../storage/storage';

type Sekme = 'manzara' | 'puan' | 'varliklar' | 'butce' | 'profil';

const SEKMELER: Array<{ anahtar: Sekme; ad: string; ikon: string }> = [
  { anahtar: 'manzara', ad: 'Manzara', ikon: '🏞️' },
  { anahtar: 'puan', ad: 'Puan', ikon: '⭐' },
  { anahtar: 'varliklar', ad: 'Varlıklar', ikon: '💰' },
  { anahtar: 'butce', ad: 'Bütçe', ikon: '🧾' },
  { anahtar: 'profil', ad: 'Profil', ikon: '👤' },
];

function OzetKutulari() {
  const { veri } = useVeri();
  const akis = nakitAkisi(veri);
  return (
    <div className="ozet-izgara">
      <div className="ozet-kut">
        <div className="etiket">Net değer</div>
        <div className={`deger ${netDeger(veri) >= 0 ? '' : 'negatif'}`}>{tl(netDeger(veri))}</div>
      </div>
      <div className="ozet-kut">
        <div className="etiket">Aylık gelir</div>
        <div className="deger">{tl(aylikGelir(veri))}</div>
      </div>
      <div className="ozet-kut">
        <div className="etiket">Aylık gider</div>
        <div className="deger">{tl(aylikGider(veri))}</div>
      </div>
      <div className="ozet-kut">
        <div className="etiket">Ay sonu kalan</div>
        <div className={`deger ${akis >= 0 ? 'pozitif' : 'negatif'}`}>{tl(akis)}</div>
      </div>
    </div>
  );
}

function ManzaraSekmesi() {
  const { veri } = useVeri();
  const akis = nakitAkisi(veri);
  return (
    <>
      <h2 className="sekme-baslik">
        Merhaba{veri.profil.ad ? `, ${veri.profil.ad}` : ''}! 👋
      </h2>
      <Kart className="sahne-kart">
        <Sahne veri={veri} />
      </Kart>
      {akis < 0 && (
        <div className="yasal-uyari">
          🌧️ Bu ay {tl(-akis)} açık veriyorsun — o yüzden manzaranda yağmur yağıyor.
        </div>
      )}
      <OzetKutulari />
    </>
  );
}

function PuanSekmesi() {
  const { veri } = useVeri();
  const dokum = giderDokumu(veri);
  return (
    <>
      <h2 className="sekme-baslik">Finansal puanın</h2>
      <Kart>
        <PuanDokumu veri={veri} />
      </Kart>
      <Kart baslik="🧾 Aylık gider dökümü" aciklama="Puanın nasıl hesaplandığını görmek için.">
        <table style={{ width: '100%', fontWeight: 700, fontSize: 14.5 }}>
          <tbody>
            {[
              ['Sabit giderler', dokum.sabit],
              ['Kira', dokum.kira],
              ['Ulaşım', dokum.ulasim],
              ['Evcil hayvanlar', dokum.evcil],
              ['Çocuklar', dokum.cocuk],
              ['Kredi taksitleri', dokum.taksitler],
            ]
              .filter(([, deger]) => (deger as number) > 0)
              .map(([ad, deger]) => (
                <tr key={ad as string}>
                  <td style={{ padding: '6px 0' }}>{ad as string}</td>
                  <td style={{ textAlign: 'right' }}>{tl(deger as number)}</td>
                </tr>
              ))}
            <tr style={{ borderTop: '2px solid var(--cizgi)' }}>
              <td style={{ padding: '8px 0' }}>Toplam</td>
              <td style={{ textAlign: 'right', color: 'var(--mor)' }}>{tl(dokum.toplam)}</td>
            </tr>
          </tbody>
        </table>
      </Kart>
      <YasalUyari />
    </>
  );
}

function VarliklarSekmesi() {
  const { veri } = useVeri();
  return (
    <>
      <h2 className="sekme-baslik">Varlıkların</h2>
      <OzetKutulari />
      <Kart baslik="💵 Nakit ve yatırımlar">
        <VarliklarFormu />
      </Kart>
      <Kart baslik="🏠 Evler">
        <EvlerFormu />
      </Kart>
      <Kart baslik="🚗 Araçlar">
        <AraclarFormu />
      </Kart>
    </>
  );
}

function ButceSekmesi() {
  const { veri } = useVeri();
  return (
    <>
      <h2 className="sekme-baslik">Bütçen</h2>
      <OzetKutulari />
      <Kart baslik="💸 Gelir">
        <GelirFormu />
      </Kart>
      <Kart baslik="🧾 Giderler">
        <GiderlerFormu />
      </Kart>
      <Kart
        baslik="💳 Borçlar"
        aciklama={veri.borclar.length > 0 ? `Toplam kalan borç: ${tl(toplamBorc(veri))}` : undefined}
      >
        <BorclarFormu />
      </Kart>
    </>
  );
}

function ProfilSekmesi() {
  const { veri, degistir, sifirla } = useVeri();
  const dosyaRef = useRef<HTMLInputElement>(null);
  const [mesaj, setMesaj] = useState<string | null>(null);
  const [esDuzenle, setEsDuzenle] = useState(false);

  return (
    <>
      <h2 className="sekme-baslik">Profil ve ayarlar</h2>
      <Kart baslik="🎨 Karakterin">
        <MetinAlani
          etiket="Adın"
          deger={veri.profil.ad}
          onDegis={(s) => degistir((v) => ({ ...v, profil: { ...v.profil, ad: s } }))}
        />
        <AvatarEditor
          config={veri.profil.avatar}
          onDegis={(c) => degistir((v) => ({ ...v, profil: { ...v.profil, avatar: c } }))}
        />
      </Kart>
      <Kart baslik="💍 Medeni durum">
        <MedeniHalFormu />
        {veri.profil.medeniHal === 'evli' && (
          <>
            <Buton renk="golgesiz" kucuk onClick={() => setEsDuzenle(!esDuzenle)}>
              {esDuzenle ? 'Eş karakterini gizle' : '🎨 Eş karakterini düzenle'}
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
      <Kart baslik="🧒 Çocuklar">
        <CocuklarFormu />
      </Kart>
      <Kart baslik="🐾 Evcil hayvanlar">
        <EvcillerFormu />
      </Kart>

      <Kart
        baslik="💾 Yedekleme"
        aciklama="Verilerin yalnızca bu cihazda durur. Dosya olarak yedek alıp başka cihazda geri yükleyebilirsin."
      >
        <div className="satir">
          <Buton renk="nane" onClick={() => yedekIndir(veri)}>
            ⬇️ Yedeği indir
          </Buton>
          <Buton renk="golgesiz" onClick={() => dosyaRef.current?.click()}>
            ⬆️ Yedekten geri yükle
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
              setMesaj('✅ Yedek başarıyla geri yüklendi.');
            } else {
              setMesaj('❌ Bu dosya geçerli bir Manzara yedeği değil.');
            }
          }}
        />
        {mesaj && <p style={{ fontWeight: 700, marginTop: 10 }}>{mesaj}</p>}
      </Kart>

      <Kart baslik="🧹 Baştan başla">
        <p className="kart-aciklama">
          Tüm verilerini bu cihazdan siler ve kurulum sihirbazını yeniden başlatır. Geri alınamaz —
          önce yedek almak isteyebilirsin.
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
      <p style={{ textAlign: 'center', color: 'var(--metin-soluk)', fontSize: 13 }}>
        Manzara v0.1 — Faz 1 (MVP)
      </p>
    </>
  );
}

export function Panel() {
  const [sekme, setSekme] = useState<Sekme>('manzara');

  return (
    <>
      <div className="icerik">
        {sekme === 'manzara' && <ManzaraSekmesi />}
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
              className={`nav-buton${sekme === s.anahtar ? ' aktif' : ''}`}
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
