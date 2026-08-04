import { useState } from 'react';
import {
  AracDegerSaglayici,
  GizliSaglayici,
  TemaSaglayici,
  VeriSaglayici,
  pinDogru,
  pinVarMi,
  useGizli,
  useVeri,
} from './state';
import { Sihirbaz } from './onboarding/Wizard';
import { Panel } from './dashboard/Dashboard';
import { Buton } from './components/ui';

function KilitEkrani({ onAcildi }: { onAcildi: () => void }) {
  const [pin, setPin] = useState('');
  const [hata, setHata] = useState(false);

  const dene = async () => {
    if (await pinDogru(pin)) onAcildi();
    else {
      setHata(true);
      setPin('');
    }
  };

  return (
    <div className="kilit-ekrani">
      <span className="logo" style={{ fontSize: 34 }}>
        PARA
      </span>
      <p style={{ color: 'var(--metin-soluk)', fontSize: 14 }}>Devam etmek için PIN girin</p>
      <input
        className="girdi"
        type="password"
        inputMode="numeric"
        autoFocus
        maxLength={6}
        value={pin}
        onChange={(e) => {
          setPin(e.target.value.replace(/\D/g, '').slice(0, 6));
          setHata(false);
        }}
        onKeyDown={(e) => e.key === 'Enter' && dene()}
      />
      {hata && <p style={{ color: 'var(--negatif)', fontSize: 13.5, fontWeight: 600 }}>PIN yanlış, tekrar deneyin.</p>}
      <Buton onClick={dene}>Aç</Buton>
    </div>
  );
}

function Icerik() {
  const { veri } = useVeri();
  const { gizli, gizliDegistir } = useGizli();
  return (
    <div className="uygulama">
      {veri.kurulumTamam && (
        <header className="ust-bar">
          <div className="ust-bar-ic">
            <span className="logo">PARA</span>
            <span className="ust-bar-bosluk" />
            <button
              type="button"
              className="ikon-buton"
              title={gizli ? 'Tutarları göster' : 'Tutarları gizle'}
              aria-label={gizli ? 'Tutarları göster' : 'Tutarları gizle'}
              onClick={gizliDegistir}
            >
              {gizli ? '🙈' : '👁'}
            </button>
          </div>
        </header>
      )}
      {veri.kurulumTamam ? <Panel /> : <Sihirbaz />}
    </div>
  );
}

export default function App() {
  const [kilitli, setKilitli] = useState(() => pinVarMi());

  return (
    <TemaSaglayici>
      {kilitli ? (
        <KilitEkrani onAcildi={() => setKilitli(false)} />
      ) : (
        <VeriSaglayici>
          <GizliSaglayici>
            <AracDegerSaglayici>
              <Icerik />
            </AracDegerSaglayici>
          </GizliSaglayici>
        </VeriSaglayici>
      )}
    </TemaSaglayici>
  );
}
