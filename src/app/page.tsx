import { SoipShell } from "@/components/shell/SoipShell";
import { COUNTRY_MODELS } from "@/lib/simulation/countries";
import { getServerAuthSession } from "@/lib/auth/sessionServer";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const countries = Object.values(COUNTRY_MODELS).map((m) => ({
  code: m.isoAlpha2,
  name: m.name,
}));

export default async function SoipHomePage() {
  const session = await getServerAuthSession();
  if (!session.authenticated) {
    redirect("/login");
  }
  return <SoipShell countries={countries} />;
}
