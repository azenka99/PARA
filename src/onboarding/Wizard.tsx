// Adım adım kurulum sihirbazı — ilk açılışta bir kez gösterilir.
// Adımlar profil filtresine göre daralır (örn. bekârsa eş adımı yok).
import { useMemo, useState } from 'react';
import { useVeri } from '../state';
import { AvatarEditor } from '../components/AvatarEditor';
import { Sahne } from '../components/Scene';
import { PuanDokumu } from '../components/ScoreCard';
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
import { Buton, GizlilikNotu, Kart, MetinAlani, YasalUyari } from '../components/ui';
import { varsayilanAvatar } from '../model/defaults';

type AdimAnahtari =
  | 'hosgeldin'
  | 'karakter'
  | 'hayat'
  | 'es'
  | 'evler'
  | 'araclar'
  | 'varliklar'
  | 'gelir'
  | 'giderler'
  | 'borclar'
  | 'sonuc';

export function Sihirbaz() {
  const { veri, degistir } = useVeri();
  const [adimIndex, setAdimIndex] = useState(0);

  const adimlar = useMemo<AdimAnahtari[]>(() => {
    const liste: AdimAnahtari[] = ['hosgeldin', 'karakter', 'hayat'];
    if (veri.profil.medeniHal === 'evli') liste.push('es');
    liste.push('evler', 'araclar', 'varliklar', 'gelir', 'giderler', 'borclar', 'sonuc');
    return liste;
  }, [veri.profil.medeniHal]);

  // medeni hal değişince adım listesi kısalabilir; indexi güvene al
  const guvenliIndex = Math.min(adimIndex, adimlar.length - 1);
  const adim = adimlar[guvenliIndex];
  const ilerleme = (guvenliIndex / (adimlar.length - 1)) * 100;

  const geri = () => setAdimIndex((i) => Math.max(0, i - 1));
  const ileri = () => setAdimIndex((i) => Math.min(adimlar.length - 1, i + 1));

  if (adim === 'hosgeldin') {
    return (
      <div className="icerik sihirbaz-govde">
        <div className="karsilama">
          <h1>
            <span className="logo" style={{ fontSize: 44 }}>Manzara</span>
          </h1>
          <p style={{ fontSize: 18, fontWeight: 700 }}>
            Paranın, evinin, arabanın, ailenin… hepsinin tek bir resmi. 🏞️
          </p>
          <div className="rozetler">
            <span className="rozet">🧙 5 dakikalık kurulum</span>
            <span className="rozet">📊 Gerekçeli finansal puan</span>
            <span className="rozet">🎨 Kendi karakterin</span>
            <span className="rozet">🔒 Veri cihazında kalır</span>
          </div>
          <GizlilikNotu />
          <YasalUyari />
          <Buton renk="pembe" onClick={ileri}>
            Başlayalım! 🚀
          </Buton>
        </div>
      </div>
    );
  }

  const baslik: Record<Exclude<AdimAnahtari, 'hosgeldin'>, [string, string]> = {
    karakter: ['Karakterini oluştur', 'Bu sensin! Manzaranın tam ortasında duracaksın.'],
    hayat: ['Hayat profilin', 'Sorularımızı sana göre daraltacağız — gereksiz hiçbir şey sormayız.'],
    es: ['Eşinin karakteri', `${veri.profil.esAd || 'Eşin'} da sahnede yanında duracak.`],
    evler: ['Evler', 'Oturduğun ve sahip olduğun evler manzarana yerleşecek.'],
    araclar: ['Araçlar', 'Marka/model seçersen ortalama ikinci el değerini biz önerelim.'],
    varliklar: ['Varlıkların', 'Nakit, altın, hisse… Hepsi net değerine katılır.'],
    gelir: ['Gelirin', 'Aylık net rakamları girmen yeterli.'],
    giderler: ['Giderlerin', 'Sadece sana uyan kalemleri soruyoruz.'],
    borclar: ['Borçların', 'Taksitler nakit akışına, kalan borç net değerine işlenir.'],
    sonuc: ['İşte manzaran! 🎉', 'Finansal durumunun ilk fotoğrafı hazır.'],
  };

  return (
    <div className="icerik sihirbaz-govde">
      <div className="ilerleme">
        <div className="ilerleme-dolu" style={{ width: `${ilerleme}%` }} />
      </div>
      <h2 className="adim-baslik">{baslik[adim][0]}</h2>
      <p className="adim-alt">{baslik[adim][1]}</p>

      {adim === 'karakter' && (
        <Kart>
          <MetinAlani
            etiket="Adın"
            deger={veri.profil.ad}
            placeholder="örn. Yalçın"
            onDegis={(s) => degistir((v) => ({ ...v, profil: { ...v.profil, ad: s } }))}
          />
          <AvatarEditor
            config={veri.profil.avatar}
            onDegis={(c) => degistir((v) => ({ ...v, profil: { ...v.profil, avatar: c } }))}
          />
        </Kart>
      )}

      {adim === 'hayat' && (
        <>
          <Kart baslik="💍 Medeni durum">
            <MedeniHalFormu />
          </Kart>
          <Kart baslik="🧒 Çocuklar" aciklama="Yaşlarına göre doğru gider sorularını göstereceğiz.">
            <CocuklarFormu />
          </Kart>
          <Kart baslik="🐾 Evcil hayvanlar">
            <EvcillerFormu />
          </Kart>
        </>
      )}

      {adim === 'es' && (
        <Kart>
          <AvatarEditor
            config={veri.profil.esAvatar ?? varsayilanAvatar()}
            onDegis={(c) => degistir((v) => ({ ...v, profil: { ...v.profil, esAvatar: c } }))}
          />
        </Kart>
      )}

      {adim === 'evler' && (
        <Kart>
          <EvlerFormu />
        </Kart>
      )}

      {adim === 'araclar' && (
        <Kart>
          <AraclarFormu />
        </Kart>
      )}

      {adim === 'varliklar' && (
        <Kart>
          <VarliklarFormu />
        </Kart>
      )}

      {adim === 'gelir' && (
        <Kart>
          <GelirFormu />
        </Kart>
      )}

      {adim === 'giderler' && (
        <Kart>
          <GiderlerFormu />
        </Kart>
      )}

      {adim === 'borclar' && (
        <Kart>
          <BorclarFormu />
        </Kart>
      )}

      {adim === 'sonuc' && (
        <>
          <Kart className="sahne-kart">
            <Sahne veri={veri} />
          </Kart>
          <Kart baslik="⭐ Finansal puanın">
            <PuanDokumu veri={veri} />
          </Kart>
          <YasalUyari />
        </>
      )}

      <div className="sihirbaz-butonlar">
        <Buton renk="golgesiz" onClick={geri}>
          ← Geri
        </Buton>
        {adim === 'sonuc' ? (
          <Buton
            renk="pembe"
            onClick={() => degistir((v) => ({ ...v, kurulumTamam: true }))}
          >
            Panele geç 🎛️
          </Buton>
        ) : (
          <Buton onClick={ileri}>Devam →</Buton>
        )}
      </div>
    </div>
  );
}
