// Plan motorunun yapılandırması — varsayımlar burada, kodun içine gömülü değil.

export interface PlanAyarlari {
  /** Finansal özgürlük hesabında varsayılan yıllık REEL (enflasyon üstü) getiri.
   *  Bilinçli olarak muhafazakâr seçilmiştir. */
  yillikReelGetiri: number;
  /** Karşılaştırma için referans emeklilik yaşı. */
  emeklilikYasi: number;
  /** Acil durum fonu hedefi (ay) — puan motoruyla aynı. */
  acilFonAyHedefi: number;
}

export const VARSAYILAN_PLAN_AYARLARI: PlanAyarlari = {
  yillikReelGetiri: 0.04,
  emeklilikYasi: 65,
  acilFonAyHedefi: 6,
};
