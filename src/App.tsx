import { AracDegerSaglayici, VeriSaglayici, useVeri } from './state';
import { Sihirbaz } from './onboarding/Wizard';
import { Panel } from './dashboard/Dashboard';

function Icerik() {
  const { veri } = useVeri();
  return (
    <div className="uygulama">
      {veri.kurulumTamam && (
        <header className="ust-bar">
          <div className="ust-bar-ic">
            <span className="logo">Manzara</span>
          </div>
        </header>
      )}
      {veri.kurulumTamam ? <Panel /> : <Sihirbaz />}
    </div>
  );
}

export default function App() {
  return (
    <VeriSaglayici>
      <AracDegerSaglayici>
        <Icerik />
      </AracDegerSaglayici>
    </VeriSaglayici>
  );
}
