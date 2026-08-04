// "Senaryolar ve Plan" sayfası — Faz 2'nin kalbi.
// Hedefler + kişiselleştirilmiş plan + "ne olurdu?" hesaplayıcıları.
// Tüm senaryo hesapları geçicidir; kullanıcının gerçek verisi değişmez.
import { useState } from 'react';
import { useGizli, useVeri } from '../state';
import { yasHesapla, ozgurlukHesapla, planOlustur } from '../logic/plan';
import { VARSAYILAN_PLAN_AYARLARI } from '../logic/planConfig';
import {
  aracSenaryosu,
  birikimHedefi,
  evSenaryosu,
  pesinMiKrediMi,
  type SenaryoSonucu,
} from '../logic/senaryo';
import { BosIpucu, Buton, CipSecim, Kart, SayiAlani, YasalUyari } from '../components/ui';

function HukumRozeti({ hukum }: { hukum: SenaryoSonucu['hukum'] }) {
  const ad = hukum === 'iyi' ? 'Uygun görünüyor' : hukum === 'dikkat' ? 'Dikkatli olun' : 'Riskli';
  return <span className={`rozet-hukum ${hukum}`}>{ad}</span>;
}

function SonucKutusu({ sonuc }: { sonuc: SenaryoSonucu }) {
  const { gizli } = useGizli();
  return (
    <div className="senaryo-sonuc">
      <div className="senaryo-sonuc-ust">
        <HukumRozeti hukum={sonuc.hukum} />
      </div>
      <p className="senaryo-ozet">{sonuc.ozet}</p>
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
      <p className="alan-ipucu">Bu hesap geçicidir — gerçek verileriniz değişmedi.</p>
    </div>
  );
}

type SenaryoTuru = 'arac' | 'ev' | 'pesin' | 'birikim';

function SenaryoHesaplayici() {
  const { veri } = useVeri();
  const [tur, setTur] = useState<SenaryoTuru>('arac');

  const [arac, setArac] = useState({ fiyat: 0, pesinat: 0, aylikFaiz: 3, vadeAy: 24 });
  const [ev, setEv] = useState({ fiyat: 0, pesinat: 0, aylikFaiz: 2.5, vadeAy: 120 });
  const [pesin, setPesin] = useState({ tutar: 0, aylikFaiz: 3, vadeAy: 12 });
  const [birikim, setBirikim] = useState({ hedefTutar: 0, aylikBirikim: 0 });

  const sonuc: SenaryoSonucu | null =
    tur === 'arac'
      ? aracSenaryosu(veri, arac)
      : tur === 'ev'
        ? evSenaryosu(veri, ev)
        : tur === 'pesin'
          ? pesinMiKrediMi(veri, pesin)
          : birikimHedefi(veri, {
              ...birikim,
              yillikGetiri: VARSAYILAN_PLAN_AYARLARI.yillikReelGetiri,
            });

  return (
    <div>
      <CipSecim
        secenekler={[
          { deger: 'arac', ad: '🚗 Araç alsam?' },
          { deger: 'ev', ad: '🏠 Ev alsam?' },
          { deger: 'pesin', ad: '⚖️ Peşin mi kredi mi?' },
          { deger: 'birikim', ad: '📈 Birikim hedefi' },
        ]}
        deger={tur}
        onDegis={setTur}
      />

      {tur === 'arac' && (
        <div className="izgara-2">
          <SayiAlani etiket="Araç fiyatı" deger={arac.fiyat} onDegis={(n) => setArac({ ...arac, fiyat: n })} />
          <SayiAlani etiket="Peşinat" deger={arac.pesinat} onDegis={(n) => setArac({ ...arac, pesinat: n })} />
          <SayiAlani etiket="Aylık kredi faizi" deger={arac.aylikFaiz} birim="%" onDegis={(n) => setArac({ ...arac, aylikFaiz: n })} />
          <SayiAlani etiket="Vade" deger={arac.vadeAy} birim="ay" onDegis={(n) => setArac({ ...arac, vadeAy: Math.round(n) })} />
        </div>
      )}
      {tur === 'ev' && (
        <div className="izgara-2">
          <SayiAlani etiket="Ev fiyatı" deger={ev.fiyat} onDegis={(n) => setEv({ ...ev, fiyat: n })} />
          <SayiAlani etiket="Peşinat" deger={ev.pesinat} onDegis={(n) => setEv({ ...ev, pesinat: n })} />
          <SayiAlani etiket="Aylık kredi faizi" deger={ev.aylikFaiz} birim="%" onDegis={(n) => setEv({ ...ev, aylikFaiz: n })} />
          <SayiAlani etiket="Vade" deger={ev.vadeAy} birim="ay" onDegis={(n) => setEv({ ...ev, vadeAy: Math.round(n) })} />
        </div>
      )}
      {tur === 'pesin' && (
        <div className="izgara-2">
          <SayiAlani etiket="Alınacak şeyin tutarı" deger={pesin.tutar} onDegis={(n) => setPesin({ ...pesin, tutar: n })} />
          <SayiAlani etiket="Aylık kredi faizi" deger={pesin.aylikFaiz} birim="%" onDegis={(n) => setPesin({ ...pesin, aylikFaiz: n })} />
          <SayiAlani etiket="Vade" deger={pesin.vadeAy} birim="ay" onDegis={(n) => setPesin({ ...pesin, vadeAy: Math.round(n) })} />
        </div>
      )}
      {tur === 'birikim' && (
        <>
          <div className="izgara-2">
            <SayiAlani etiket="Hedef tutar" deger={birikim.hedefTutar} onDegis={(n) => setBirikim({ ...birikim, hedefTutar: n })} />
            <SayiAlani etiket="Aylık biriktireceğiniz" deger={birikim.aylikBirikim} onDegis={(n) => setBirikim({ ...birikim, aylikBirikim: n })} />
          </div>
          <p className="alan-ipucu">
            Hesap, yıllık %{Math.round(VARSAYILAN_PLAN_AYARLARI.yillikReelGetiri * 100)} temkinli reel getiri varsayımı kullanır.
          </p>
        </>
      )}

      {sonuc ? (
        <SonucKutusu sonuc={sonuc} />
      ) : (
        <BosIpucu>Yukarıdaki alanları doldurun; sonuç anında burada belirir.</BosIpucu>
      )}
    </div>
  );
}

function YasAlani() {
  const { veri, degistir } = useVeri();
  const yas = yasHesapla(veri);
  const [girilen, setGirilen] = useState(0);

  if (yas !== null) return null; // yaş belli — Profil sayfasında kilitli olarak yönetilir

  return (
    <div>
      <div className="satir">
        <SayiAlani
          etiket="Yaşınız"
          deger={girilen}
          birim="yaş"
          ipucu="Plan, tavsiyelerini yaşınıza göre şekillendirir. Sonradan değiştirmek onay ister."
          onDegis={setGirilen}
        />
        <div style={{ paddingBottom: 14, flex: 'none' }}>
          <Buton
            kucuk
            disabled={girilen < 18 || girilen > 99}
            onClick={() =>
              degistir((v) => ({
                ...v,
                profil: { ...v.profil, dogumYili: new Date().getFullYear() - Math.round(girilen) },
              }))
            }
          >
            Kaydet
          </Buton>
        </div>
      </div>
    </div>
  );
}

export function SenaryolarSayfasi() {
  const { veri, degistir } = useVeri();
  const { tutar } = useGizli();
  const yas = yasHesapla(veri);
  const plan = planOlustur(veri);
  const ozgurluk = ozgurlukHesapla(veri);

  return (
    <>
      <h2 className="sekme-baslik">Senaryolar ve Plan</h2>

      <Kart
        baslik="🎯 Hedefleriniz"
        aciklama={
          yas !== null
            ? `${yas} yaşındasınız — plan, tavsiyelerini buna göre şekillendirir.`
            : 'İki soruya vereceğiniz cevap, planınızı size göre kişiselleştirir.'
        }
      >
        <YasAlani />
        <div className="izgara-2">
          <SayiAlani
            etiket="Rahat yaşamak için ayda kaç TL serbest paranız olmalı?"
            deger={veri.hedefler.rahatAylik}
            ipucu="Tüm giderler çıktıktan sonra elinizde 'boşa' kalmasını istediğiniz tutar."
            onDegis={(n) => degistir((v) => ({ ...v, hedefler: { ...v.hedefler, rahatAylik: n } }))}
          />
          <SayiAlani
            etiket="Finansal özgürlük için ayda ne kadar pasif gelir isterdiniz?"
            deger={veri.hedefler.pasifGelirAylik}
            ipucu="Çalışmasanız da yaşamınızı sürdürecek aylık gelir."
            onDegis={(n) =>
              degistir((v) => ({ ...v, hedefler: { ...v.hedefler, pasifGelirAylik: n } }))
            }
          />
        </div>
        {ozgurluk && (
          <div className="ozgurluk-cubuk">
            <div className="ozgurluk-ust">
              <span>Finansal özgürlüğe ilerleme</span>
              <span>
                {tutar(ozgurluk.mevcutUretken)} / {tutar(ozgurluk.gerekliVarlik)}
              </span>
            </div>
            <div className="puan-cubuk">
              <div
                className="puan-cubuk-dolu"
                style={{
                  width: `${Math.round(ozgurluk.ilerleme * 100)}%`,
                  background: 'var(--vurgu)',
                }}
              />
            </div>
          </div>
        )}
      </Kart>

      <Kart
        baslik="🧭 Kişisel planınız"
        aciklama="Verilerinize, yaşınıza ve hedeflerinize göre hesaplanır; siz güncelledikçe değişir."
      >
        {plan.map((m, i) => (
          <div className="plan-madde" key={m.anahtar}>
            <span className="plan-no">{i + 1}</span>
            <div>
              <div className="plan-baslik">{m.baslik}</div>
              <div className="plan-detay">{m.detay}</div>
            </div>
          </div>
        ))}
      </Kart>

      <Kart
        baslik="🔮 Ne olurdu?"
        aciklama="Büyük kararları satın almadan önce burada deneyin — gerçek verileriniz değişmez."
      >
        <SenaryoHesaplayici />
      </Kart>

      <YasalUyari />
    </>
  );
}
