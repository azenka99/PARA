// Karakter özelleştirme paneli — canlı önizlemeli.
import type { AvatarConfig, Aksesuar, BedenTipi, SacStili } from '../model/types';
import { CILT_TONLARI, KIYAFET_RENKLERI, SAC_RENKLERI } from '../model/defaults';
import { Avatar } from './Avatar';
import { CipSecim, CokluCipSecim, RenkSecim } from './ui';

const SAC_STILLERI: Array<{ deger: SacStili; ad: string }> = [
  { deger: 'kisa', ad: 'Kısa' },
  { deger: 'uzun', ad: 'Uzun' },
  { deger: 'topuz', ad: 'Topuz' },
  { deger: 'kivircik', ad: 'Kıvırcık' },
  { deger: 'trasli', ad: 'Traşlı' },
];

const BEDEN_TIPLERI: Array<{ deger: BedenTipi; ad: string }> = [
  { deger: 'zayif', ad: 'Zayıf' },
  { deger: 'orta', ad: 'Orta' },
  { deger: 'kilolu', ad: 'Kilolu' },
];

const AKSESUARLAR: Array<{ deger: Aksesuar; ad: string }> = [
  { deger: 'gozluk', ad: '👓 Gözlük' },
  { deger: 'sakal', ad: '🧔 Sakal' },
  { deger: 'kupe', ad: '💛 Küpe' },
  { deger: 'sapka', ad: '🧢 Şapka' },
];

export function AvatarEditor({
  config,
  onDegis,
}: {
  config: AvatarConfig;
  onDegis: (c: AvatarConfig) => void;
}) {
  const d = (kismi: Partial<AvatarConfig>) => onDegis({ ...config, ...kismi });

  return (
    <div>
      <div className="avatar-onizleme">
        <Avatar config={config} boy={180} />
      </div>
      <RenkSecim etiket="Cilt tonu" renkler={CILT_TONLARI} deger={config.ciltTonu} onDegis={(r) => d({ ciltTonu: r })} />
      <CipSecim etiket="Saç stili" secenekler={SAC_STILLERI} deger={config.sacStili} onDegis={(s) => d({ sacStili: s })} />
      <RenkSecim etiket="Saç rengi" renkler={SAC_RENKLERI} deger={config.sacRengi} onDegis={(r) => d({ sacRengi: r })} />
      <CipSecim etiket="Beden tipi" secenekler={BEDEN_TIPLERI} deger={config.bedenTipi} onDegis={(b) => d({ bedenTipi: b })} />
      <RenkSecim etiket="Kıyafet rengi" renkler={KIYAFET_RENKLERI} deger={config.kiyafetRengi} onDegis={(r) => d({ kiyafetRengi: r })} />
      <CokluCipSecim etiket="Aksesuarlar" secenekler={AKSESUARLAR} degerler={config.aksesuarlar} onDegis={(a) => d({ aksesuarlar: a })} />
    </div>
  );
}
