// "Senaryolar ve Plan" sayfası — Faz 2'nin kalbi.
// Hedefler + kişisel plan + Karar Asistanı (elemeli akış → sohbet) + Kararlarım arşivi.
import { useState } from 'react';
import { useGizli, useVeri } from '../state';
import type { KayitliKarar } from '../model/types';
import { yasHesapla, ozgurlukHesapla, planOlustur } from '../logic/plan';
import {
  aylikGelir,
  aylikGider,
  aylikTaksitler,
  likitVarlik,
  nakitAkisi,
  netDeger,
} from '../logic/finance';
import { KararAsistani } from '../components/KararAsistani';
import { Buton, Kart, SayiAlani, YasalUyari } from '../components/ui';

function YasAlani() {
  const { veri, degistir } = useVeri();
  const yas = yasHesapla(veri);
  const [girilen, setGirilen] = useState(0);

  if (yas !== null) return null; // yaş belli — Profil sayfasında kilitli olarak yönetilir

  return (
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
  );
}

function KararSatiri({ karar }: { karar: KayitliKarar }) {
  const { veri, degistir } = useVeri();
  const { tutar } = useGizli();
  const [acik, setAcik] = useState(false);

  const hatirlatmaZamani = !!karar.hatirlatma && karar.hatirlatma <= new Date().toISOString();
  const tarih = new Date(karar.tarih).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  const hukumAd = karar.hukum === 'iyi' ? 'Uygun' : karar.hukum === 'dikkat' ? 'Dikkat' : 'Riskli';

  // bugünkü değerler — "o gün → bugün"
  const gelir = aylikGelir(veri);
  const gider = aylikGider(veri);
  const bugun = {
    netDeger: netDeger(veri),
    akis: nakitAkisi(veri),
    borcYukuYuzde: gelir > 0 ? Math.round((aylikTaksitler(veri) / gelir) * 100) : 0,
    acilFonAy: gider > 0 ? Math.round((likitVarlik(veri) / gider) * 10) / 10 : 0,
  };

  return (
    <div className={`karar-oge${hatirlatmaZamani ? ' hatirlatma-zamani' : ''}`}>
      <div className="karar-oge-ust" onClick={() => setAcik(!acik)}>
        <span className={`rozet-hukum ${karar.hukum}`}>{hukumAd}</span>
        <span className="baslik">{karar.baslik}</span>
        <span className="tarih">{tarih}</span>
        <span style={{ color: 'var(--metin-soluk)' }}>{acik ? '▴' : '▾'}</span>
      </div>
      {hatirlatmaZamani && (
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--vurgu-koyu)', margin: '8px 0 0' }}>
          🔔 Bu karara yeniden bakma zamanı geldi — aşağıdan o gün ile bugünü karşılaştırın.
        </p>
      )}
      {acik && (
        <div className="karar-kiyas">
          <p style={{ margin: '6px 0' }}>{karar.ozet}</p>
          <table>
            <tbody>
              <tr>
                <th></th>
                <th>O gün</th>
                <th>Bugün</th>
              </tr>
              <tr>
                <td>Net değer</td>
                <td>{tutar(karar.foto.netDeger)}</td>
                <td>{tutar(bugun.netDeger)}</td>
              </tr>
              <tr>
                <td>Ay sonu kalan</td>
                <td>{tutar(karar.foto.akis)}</td>
                <td>{tutar(bugun.akis)}</td>
              </tr>
              <tr>
                <td>Borç yükü</td>
                <td>%{karar.foto.borcYukuYuzde}</td>
                <td>%{bugun.borcYukuYuzde}</td>
              </tr>
              <tr>
                <td>Acil fon</td>
                <td>{karar.foto.acilFonAy.toString().replace('.', ',')} ay</td>
                <td>{bugun.acilFonAy.toString().replace('.', ',')} ay</td>
              </tr>
            </tbody>
          </table>
          <div className="satir" style={{ marginTop: 10 }}>
            {karar.hatirlatma && (
              <Buton
                renk="golgesiz"
                kucuk
                onClick={() =>
                  degistir((v) => ({
                    ...v,
                    kararlar: v.kararlar.map((k) => (k.id === karar.id ? { ...k, hatirlatma: null } : k)),
                  }))
                }
              >
                Hatırlatmayı kapat
              </Buton>
            )}
            <Buton
              renk="tehlike"
              kucuk
              onClick={() =>
                degistir((v) => ({ ...v, kararlar: v.kararlar.filter((k) => k.id !== karar.id) }))
              }
            >
              Sil
            </Buton>
          </div>
        </div>
      )}
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
        baslik="💬 Karar Asistanı"
        aciklama="Büyük bir karar mı var? Birkaç soruyla birlikte değerlendirelim — gerçek verileriniz değişmez."
      >
        <KararAsistani />
      </Kart>

      {veri.kararlar.length > 0 && (
        <Kart baslik="📁 Kararlarım" aciklama="Kaydettiğiniz kararlar — açınca 'o gün → bugün' karşılaştırması.">
          {veri.kararlar.map((k) => (
            <KararSatiri key={k.id} karar={k} />
          ))}
        </Kart>
      )}

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

      <YasalUyari />
    </>
  );
}
