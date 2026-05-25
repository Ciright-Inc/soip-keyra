import { SoipShell } from "@/components/shell/SoipShell";
import { COUNTRY_MODELS } from "@/lib/simulation/countries";

export const dynamic = "force-dynamic";

const countries = Object.values(COUNTRY_MODELS).map((m) => ({
  code: m.isoAlpha2,
  name: m.name,
}));

export default function SoipHomePage() {
  return <SoipShell countries={countries} />;
}
