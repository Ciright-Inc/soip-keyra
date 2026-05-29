import { roleLabel } from "@/lib/deployments/adminAuthz";
import { getAdminAuth } from "@/lib/assertAdminServer";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const auth = await getAdminAuth();

  const role =
    auth?.kind === "user"
      ? roleLabel(auth.user.role)
      : auth?.kind === "legacy_super"
        ? "Legacy super"
        : "Unknown";
  const email = auth?.kind === "user" ? auth.user.email : null;
  const phone = auth?.kind === "user" ? auth.user.phoneE164 : null;

  return (
    <div className="space-y-8">
      <section className="ds-feature-card is-dashboard">
        <p className="ds-caption-uppercase">Sovereign operations</p>
        <h1 className="ds-display-sm mt-2">SOIP admin dashboard</h1>
        <p className="ds-body-sm mt-3 max-w-2xl text-[var(--ds-body)]">
          Internal control surface for sovereign nodes, country simulations, agent worlds, trust
          telemetry, and contract / revenue events. Sign in uses the same Keyra session as the
          marketing site; access requires an active SOIP admin user record.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="ds-admin-panel">
          <p className="ds-caption-uppercase">Signed in as</p>
          <p className="ds-title-sm mt-2">{email ?? "—"}</p>
          {phone ? (
            <p className="ds-body-sm mt-1 text-[var(--ds-body)]">{phone}</p>
          ) : null}
        </div>
        <div className="ds-admin-panel">
          <p className="ds-caption-uppercase">Role</p>
          <p className="ds-title-sm mt-2">{role}</p>
          <p className="ds-body-sm mt-1 text-[var(--ds-body)]">
            Rights resolved from AdminUser.role and scopeJson.
          </p>
        </div>
        <div className="ds-admin-panel">
          <p className="ds-caption-uppercase">Console</p>
          <p className="ds-title-sm mt-2">Operational</p>
          <p className="ds-body-sm mt-1 text-[var(--ds-body)]">
            Add new admin sections under <code>/admin/&lt;area&gt;</code>; each section guards itself
            via <code>assertAdminServer</code>.
          </p>
        </div>
      </section>
    </div>
  );
}
