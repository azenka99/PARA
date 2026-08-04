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
  TaksitlerFormu,
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
          <h1>PARA</h1>
          <p className="slogan">
            Varlıklarınız, geliriniz, gideriniz ve borçlarınız — hepsi tek bir resimde.
            Finansal durumunuzu puanlayan ve manzaraya dönüştüren kişisel finans uygulaması.
          </p>
          <div className="rozetler">
            <span className="rozet">5 dakikalık kurulum</span>
            <span className="rozet">Gerekçeli finansal puan</span>
            <span className="rozet">Kişisel manzara</span>
            <span className="rozet">Veri cihazınızda kalır</span>
          </div>
          <GizlilikNotu />
          <YasalUyari />
          <Buton onClick={ileri}>Başlayalım</Buton>
        </div>
      </div>
    );
  }

  const baslik: Record<Exclude<AdimAnahtari, 'hosgeldin'>, [string, string]> = {
    karakter: ['Karakterinizi oluşturun', 'Manzaranızın tam ortasında siz duracaksınız.'],
    hayat: ['Hayat profiliniz', 'Soruları size göre daraltacağız — gereksiz hiçbir şey sormayız.'],
    es: ['Eşinizin karakteri', `${veri.profil.esAd || 'Eşiniz'} de sahnede yanınızda duracak.`],
    evler: ['Evler', 'Oturduğunuz ve sahip olduğunuz evler manzaranıza yerleşecek.'],
    araclar: ['Araçlar', 'Araba için marka/model seçerseniz ortalama ikinci el değerini öneririz.'],
    varliklar: ['Varlıklarınız', 'Nakit, altın, gümüş, döviz, hisse, fon… Hepsi net değerinize katılır.'],
    gelir: ['Geliriniz', 'Aylık net rakamları girmeniz yeterli.'],
    giderler: ['Gideriniz', 'Yalnızca size uyan kalemleri soruyoruz.'],
    borclar: ['Borçlar ve taksitler', 'Taksitler nakit akışına, kalan borç net değerinize işlenir.'],
    sonuc: ['İşte manzaranız', 'Finansal durumunuzun ilk fotoğrafı hazır.'],
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
            etiket="Adınız"
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
          <Kart baslik="Medeni durum">
            <MedeniHalFormu />
          </Kart>
          <Kart baslik="Çocuklar" aciklama="Yaşlarına göre doğru gider sorularını göstereceğiz.">
            <CocuklarFormu />
          </Kart>
          <Kart baslik="Evcil hayvanlar">
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
        <>
          <Kart baslik="Krediler">
            <BorclarFormu />
          </Kart>
          <Kart baslik="Taksitli alışverişler">
            <TaksitlerFormu />
          </Kart>
        </>
      )}

      {adim === 'sonuc' && (
        <>
          <Kart className="sahne-kart">
            <Sahne veri={veri} />
          </Kart>
          <Kart baslik="Finansal puanınız">
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
            renk="vurgu"
            onClick={() => degistir((v) => ({ ...v, kurulumTamam: true }))}
          >
            Panele geç
          </Buton>
        ) : (
          <Buton onClick={ileri}>Devam →</Buton>
        )}
      </div>
    </div>
  );
}
