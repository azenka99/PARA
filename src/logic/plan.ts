// Kişisel plan motoru — kural tabanlı, kişiselleştirilmiş.
// Kullanıcının verisi, yaşı ve hedeflerinden yola çıkarak Türkçe, gerekçeli
// bir eylem planı üretir. Hiçbir veri cihaz dışına çıkmaz; ücretli servis yoktur.
// UYARI: Çıktılar genel bilgilendirmedir, yatırım tavsiyesi değildir —
// hiçbir zaman belirli bir hisse/fon/ürün önermez.

import type { AppData } from '../model/types';
import {
  aylikGelir,
  aylikGider,
  aylikTaksitler,
  gayrimenkulDegeri,
  giderDokumu,
  likitVarlik,
  nakitAkisi,
  piyasaVarligi,
} from './finance';
import { VARSAYILAN_PLAN_AYARLARI, type PlanAyarlari } from './planConfig';
import { tl } from './format';

/** Doğum yılından güncel yaş. Girilmemişse null. */
export function yasHesapla(veri: AppData, simdikiYil = new Date().getFullYear()): number | null {
  if (!veri.profil.dogumYili) return null;
  const yas = simdikiYil - veri.profil.dogumYili;
  return yas >= 0 && yas < 120 ? yas : null;
}

/** Pasif gelir üretebilecek varlıklar: likit + piyasa + BES + alacaklar +
 *  kiraya verilmiş evler. Oturulan ev ve araçlar gelir üretmediği için hariç. */
export function uretkenVarlik(veri: AppData): number {
  const kiradaEvler = veri.evler
    .filter((e) => e.durum === 'kirada')
    .reduce((t, e) => t + e.deger, 0);
  return (
    likitVarlik(veri) +
    piyasaVarligi(veri) +
    veri.varliklar.bes +
    veri.varliklar.alacaklar +
    kiradaEvler
  );
}

export interface OzgurlukDurumu {
  hedefAylikPasif: number;
  gerekliVarlik: number; // hedefi karşılamak için gereken üretken varlık
  mevcutUretken: number;
  ilerleme: number; // 0..1
  kalanAy: number | null; // null: bu tempoyla ulaşılamıyor
  tahminiYas: number | null; // yaş girildiyse hedefe ulaşma yaşı
}

/** Finansal özgürlük hesabı: hedef pasif gelir → gereken varlık → mevcut
 *  birikim temposuyla (bileşik getiri dahil) kaç ay sürer? */
export function ozgurlukHesapla(
  veri: AppData,
  ayar: PlanAyarlari = VARSAYILAN_PLAN_AYARLARI,
): OzgurlukDurumu | null {
  const hedef = veri.hedefler.pasifGelirAylik;
  if (hedef <= 0) return null;

  const gerekli = (hedef * 12) / ayar.yillikReelGetiri;
  const mevcut = uretkenVarlik(veri);
  const akis = Math.max(0, nakitAkisi(veri));
  const ilerleme = Math.min(1, gerekli > 0 ? mevcut / gerekli : 0);

  let kalanAy: number | null = null;
  if (mevcut >= gerekli) {
    kalanAy = 0;
  } else {
    const r = Math.pow(1 + ayar.yillikReelGetiri, 1 / 12) - 1;
    const pay = gerekli * r + akis;
    const payda = mevcut * r + akis;
    if (payda > 0 && pay > payda) {
      const n = Math.ceil(Math.log(pay / payda) / Math.log(1 + r));
      kalanAy = n <= 1200 ? n : null; // 100 yıldan uzun süreler "ulaşılamıyor" sayılır
    }
  }

  const yas = yasHesapla(veri);
  const tahminiYas = yas !== null && kalanAy !== null ? Math.round(yas + kalanAy / 12) : null;

  return { hedefAylikPasif: hedef, gerekliVarlik: gerekli, mevcutUretken: mevcut, ilerleme, kalanAy, tahminiYas };
}

export interface PlanMaddesi {
  anahtar: string;
  oncelik: number; // küçük sayı = önce gösterilir
  baslik: string;
  detay: string;
}

function yasNotu(yas: number): string {
  if (yas < 30)
    return 'En büyük avantajınız zaman: bu yaşta düzenli biriktirilen her lira, bileşik getiriyle onlarca yıl çalışır. Gelirinizi büyütmeye (eğitim, beceri) yapılan harcamalar da bir tür birikimdir.';
  if (yas < 45)
    return 'Kariyerin en verimli yılları genelde bu dönem: tasarruf oranını yüksek tutmak ve borç yükünü sınırlı tutmak, sonraki 20 yılın rahatlığını belirler.' ;
  if (yas < 60)
    return 'Emeklilik ufukta göründüğü için bu dönemde genel yaklaşım, borçları kapatmayı ve birikimi korumayı öne almaktır; tek bir varlık türüne aşırı yoğunlaşmaktan kaçınmak önem kazanır.';
  return 'Bu dönemde genel yaklaşım birikimi korumak, likit kalmak ve büyük yeni borçlardan kaçınmaktır; düzenli nakit akışı her şeyden kıymetlidir.';
}

/** Kişisel plan: veriye, yaşa ve hedeflere göre sıralı, gerekçeli maddeler. */
export function planOlustur(
  veri: AppData,
  ayar: PlanAyarlari = VARSAYILAN_PLAN_AYARLARI,
): PlanMaddesi[] {
  const maddeler: PlanMaddesi[] = [];
  const gelir = aylikGelir(veri);
  const gider = aylikGider(veri);
  const akis = nakitAkisi(veri);
  const likit = likitVarlik(veri);
  const yas = yasHesapla(veri);

  // 1) Ay sonu açık — her şeyden önce
  if (akis < 0) {
    const dokum = giderDokumu(veri);
    const kalemler: Array<[string, number]> = [
      ['sabit giderler', dokum.sabit],
      ['kira', dokum.kira],
      ['ulaşım', dokum.ulasim],
      ['çocuk giderleri', dokum.cocuk],
      ['taksitler', dokum.taksitler],
    ];
    kalemler.sort((a, b) => b[1] - a[1]);
    maddeler.push({
      anahtar: 'acik',
      oncelik: 1,
      baslik: 'Önce ay sonu açığını kapatın',
      detay: `Her ay ${tl(-akis)} açık veriyorsunuz; birikim ancak bundan sonra başlayabilir. En büyük gider kaleminiz ${kalemler[0][0]} (${tl(kalemler[0][1])}) — önce oraya bakmak en hızlı sonucu verir.`,
    });
  }

  // 2) Acil durum fonu
  if (gider > 0) {
    const ay = likit / gider;
    if (ay < ayar.acilFonAyHedefi) {
      const eksik = ayar.acilFonAyHedefi * gider - likit;
      const ayStr = (Math.round(ay * 10) / 10).toString().replace('.', ',');
      const sure =
        akis > 0 ? ` Mevcut aylık artanınızla (${tl(akis)}) yaklaşık ${Math.ceil(eksik / akis)} ayda tamamlanır.` : '';
      maddeler.push({
        anahtar: 'acilFon',
        oncelik: 2,
        baslik: 'Acil durum fonunu tamamlayın',
        detay: `Likit varlıklarınız ${ayStr} aylık giderinizi karşılıyor; hedef ${ayar.acilFonAyHedefi} ay. Eksik: ${tl(eksik)}.${sure} Bu fon hazır olmadan yeni büyük harcamalara girmemek genel bir güvenlik kuralıdır.`,
      });
    }
  }

  // 3) Borç yükü
  const taksitler = aylikTaksitler(veri);
  if (gelir > 0 && taksitler / gelir >= 0.25) {
    const oran = Math.round((taksitler / gelir) * 100);
    maddeler.push({
      anahtar: 'borc',
      oncelik: 3,
      baslik: 'Borç yükünüzü hafifletin',
      detay: `Taksitleriniz gelirinizin %${oran}'ini götürüyor (%40 üzeri riskli kabul edilir). Genel yaklaşım, en yüksek maliyetli borçtan (çoğunlukla kredi kartı) başlayarak kapatmaktır; yeni taksitli alışverişleri bu oran düşene kadar ertelemek yükü hızla azaltır.`,
    });
  }

  // 4) Rahat yaşam hedefi
  if (veri.hedefler.rahatAylik > 0) {
    const fark = veri.hedefler.rahatAylik - akis;
    if (fark <= 0) {
      maddeler.push({
        anahtar: 'rahat',
        oncelik: 6,
        baslik: 'Rahatlık hedefinize ulaşmışsınız',
        detay: `"Ayda ${tl(veri.hedefler.rahatAylik)} serbest kalsın" hedefiniz vardı; şu an ${tl(akis)} kalıyor. Bu fazlayı düzenli birikime yönlendirmek, finansal özgürlük hedefinizi öne çeker.`,
      });
    } else {
      const dokum = giderDokumu(veri);
      const kalemler: Array<[string, number]> = [
        ['sabit giderler', dokum.sabit],
        ['kira', dokum.kira],
        ['ulaşım', dokum.ulasim],
        ['çocuk giderleri', dokum.cocuk],
        ['taksitler', dokum.taksitler],
        ['aile ödemeleri', dokum.aile],
      ].filter((k): k is [string, number] => (k[1] as number) > 0);
      kalemler.sort((a, b) => b[1] - a[1]);
      const ilkUc = kalemler.slice(0, 3).map(([ad, d]) => `${ad} ${tl(d)}`).join(', ');
      maddeler.push({
        anahtar: 'rahat',
        oncelik: 4,
        baslik: 'Rahatlık hedefinizle aranızda fark var',
        detay: `Rahat hissetmek için ayda ${tl(veri.hedefler.rahatAylik)} serbest para istiyorsunuz; şu an ${tl(Math.max(0, akis))} kalıyor — fark ${tl(fark)}. Bu fark ya giderden kısılır ya gelirle kapanır. En büyük kalemleriniz: ${ilkUc}.`,
      });
    }
  }

  // 5) Finansal özgürlük
  const ozgurluk = ozgurlukHesapla(veri, ayar);
  if (ozgurluk) {
    const yuzde = Math.round(ozgurluk.ilerleme * 100);
    let detay = `Ayda ${tl(ozgurluk.hedefAylikPasif)} pasif gelir için (yıllık reel %${Math.round(ayar.yillikReelGetiri * 100)} getiri varsayımıyla) yaklaşık ${tl(ozgurluk.gerekliVarlik)} gelir üreten varlık gerekir. Şu an ${tl(ozgurluk.mevcutUretken)} ile yolun %${yuzde}'indesiniz.`;
    if (ozgurluk.kalanAy === 0) {
      detay += ' Hedefinize matematiksel olarak ulaşmış görünüyorsunuz.';
    } else if (ozgurluk.kalanAy !== null) {
      const yil = Math.floor(ozgurluk.kalanAy / 12);
      const ayKalan = ozgurluk.kalanAy % 12;
      const sure = yil > 0 ? `${yil} yıl${ayKalan > 0 ? ` ${ayKalan} ay` : ''}` : `${ayKalan} ay`;
      detay += ` Bu tempoyla tahmini süre: ${sure}${ozgurluk.tahminiYas !== null ? ` (yaklaşık ${ozgurluk.tahminiYas} yaşında)` : ''}.`;
      if (ozgurluk.tahminiYas !== null && ozgurluk.tahminiYas > ayar.emeklilikYasi) {
        detay += ` Bu, ${ayar.emeklilikYasi} referans emeklilik yaşının ötesinde — aylık birikimi artırmak veya hedefi kademelendirmek süreyi kısaltır.`;
      }
    } else {
      detay +=
        ' Mevcut tempoyla (aylık artan yokken) hedefe ulaşılamıyor; önce nakit akışını artıya çevirmek gerekiyor.';
    }
    maddeler.push({
      anahtar: 'ozgurluk',
      oncelik: 5,
      baslik: 'Finansal özgürlük yolculuğunuz',
      detay,
    });
  }

  // 6) Yaşa göre genel not
  if (yas !== null) {
    maddeler.push({
      anahtar: 'yas',
      oncelik: 8,
      baslik: `${yas} yaşınıza göre genel not`,
      detay: yasNotu(yas),
    });
  }

  // 7) Hedef girilmemişse davet
  if (veri.hedefler.rahatAylik <= 0 && veri.hedefler.pasifGelirAylik <= 0) {
    maddeler.push({
      anahtar: 'hedefYok',
      oncelik: 7,
      baslik: 'Hedeflerinizi belirleyin',
      detay: 'Yukarıdaki iki hedef sorusunu doldurursanız plan size göre kişiselleşir: rahatlık için gereken aylık serbest para ve finansal özgürlük için istediğiniz aylık pasif gelir.',
    });
  }

  return maddeler.sort((a, b) => a.oncelik - b.oncelik);
}
