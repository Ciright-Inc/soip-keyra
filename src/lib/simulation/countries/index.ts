import type { CountrySimulationView, OperationalMode } from "@/lib/types/soip";

export type CountrySimulationModel = Omit<CountrySimulationView, "operationalMode"> & {
  isoAlpha2: "NA" | "IE";
};

/** Statistically representative Namibia operational model. */
export const NAMIBIA_SIMULATION: CountrySimulationModel = {
  isoAlpha2: "NA",
  name: "Namibia",
  population: 2_645_805,
  simulationQuality: 0.91,
  demographics: {
    medianAge: 22.3,
    urbanPct: 54.2,
    youthUnder25Pct: 62.1,
    languages: ["English", "Oshiwambo", "Afrikaans", "Otjiherero"],
    ethnicGroups: ["Ovambo", "Herero", "Damara", "Nama", "San"],
  },
  workforce: {
    total: 1_120_000,
    formalSectorPct: 28,
    informalPct: 42,
    publicSector: 145_000,
    students: 680_000,
    transientWorkers: 42_000,
  },
  telecom: {
    operators: [
      { name: "MTC Namibia", marketShare: 0.72, subscribers: 2_400_000, esimCapable: true },
      { name: "Telecom Namibia", marketShare: 0.22, subscribers: 740_000, esimCapable: true },
      { name: "Paratus", marketShare: 0.06, subscribers: 200_000, esimCapable: false },
    ],
    mobilePenetration: 1.18,
    smartphonePct: 0.64,
    esimAdoptionPct: 0.08,
    coverage4gPct: 0.89,
    coverage5gPct: 0.12,
    roamingPartners: 187,
  },
  banking: {
    institutions: ["Bank Windhoek", "FNB Namibia", "Standard Bank", "Nedbank", "Letshego"],
    digitalBankingPct: 0.58,
    authTransactionsDaily: 142_000,
    mobileMoneyUsers: 890_000,
  },
  government: {
    ministries: 23,
    embassiesAbroad: 31,
    borderPosts: 14,
    regulators: ["CRAN", "NAMFISA", "NBC"],
    agencies: ["Ministry of ICT", "Home Affairs", "Immigration"],
  },
  economy: {
    gdpUsdBn: 12.6,
    gdpPerCapita: 4760,
    enterpriseCount: 18_400,
    smbCount: 42_000,
    keySectors: ["mining", "tourism", "fishing", "agriculture"],
  },
  humanMovement: {
    touristsAnnual: 1_580_000,
    borderCrossingsDaily: 8_400,
    visaApplicationsMonthly: 12_200,
    foreignWorkers: 38_000,
    internationalStudents: 4_200,
    citizensAbroad: 52_000,
    roamingHumansDaily: 24_600,
  },
};

/** Statistically representative Ireland operational model. */
export const IRELAND_SIMULATION: CountrySimulationModel = {
  isoAlpha2: "IE",
  name: "Ireland",
  population: 5_281_000,
  simulationQuality: 0.94,
  demographics: {
    medianAge: 38.5,
    urbanPct: 63.9,
    youthUnder25Pct: 28.4,
    languages: ["English", "Irish"],
    euMember: true,
  },
  workforce: {
    total: 2_640_000,
    formalSectorPct: 88,
    publicSector: 380_000,
    students: 420_000,
    transientWorkers: 156_000,
    techSectorPct: 0.14,
  },
  telecom: {
    operators: [
      { name: "Three Ireland", marketShare: 0.38, subscribers: 2_100_000, esimCapable: true },
      { name: "Vodafone Ireland", marketShare: 0.32, subscribers: 1_780_000, esimCapable: true },
      { name: "Eir", marketShare: 0.24, subscribers: 1_340_000, esimCapable: true },
      { name: "Virgin Media", marketShare: 0.06, subscribers: 340_000, esimCapable: true },
    ],
    mobilePenetration: 1.12,
    smartphonePct: 0.91,
    esimAdoptionPct: 0.22,
    coverage4gPct: 0.98,
    coverage5gPct: 0.78,
    roamingPartners: 412,
  },
  banking: {
    institutions: ["AIB", "Bank of Ireland", "Ulster Bank", "PTSB", "Revolut IE"],
    digitalBankingPct: 0.89,
    authTransactionsDaily: 1_840_000,
    openBankingConnections: 2_100_000,
  },
  government: {
    ministries: 16,
    embassiesAbroad: 78,
    borderPosts: 8,
    regulators: ["ComReg", "Central Bank", "DPC"],
    agencies: ["Department of Justice", "DFA", "Enterprise Ireland"],
  },
  economy: {
    gdpUsdBn: 598,
    gdpPerCapita: 113_000,
    enterpriseCount: 280_000,
    smbCount: 260_000,
    keySectors: ["technology", "pharma", "finance", "agriculture"],
  },
  humanMovement: {
    touristsAnnual: 11_200_000,
    borderCrossingsDaily: 42_000,
    visaApplicationsMonthly: 18_400,
    foreignWorkers: 312_000,
    internationalStudents: 32_000,
    citizensAbroad: 780_000,
    roamingHumansDaily: 186_000,
  },
};

export const COUNTRY_MODELS: Record<string, CountrySimulationModel> = {
  NA: NAMIBIA_SIMULATION,
  IE: IRELAND_SIMULATION,
};

export function getCountryModel(isoAlpha2: string): CountrySimulationView | null {
  const model = COUNTRY_MODELS[isoAlpha2.toUpperCase()];
  if (!model) return null;
  return { ...model, operationalMode: "SIMULATION" as OperationalMode };
}

export function scaleMetric(base: number, mode: OperationalMode, quality: number): number {
  const modeFactor = mode === "LIVE" ? 1 : mode === "HYBRID" ? 0.72 : 0.58;
  return Math.round(base * modeFactor * quality);
}
