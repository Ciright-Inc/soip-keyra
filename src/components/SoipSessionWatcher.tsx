"use client";

import { AdminAuthWatcher } from "@/components/admin/AdminAuthWatcher";

/**
 * App-wide session watcher for every gated SOIP page (home `/`, admin, etc.).
 * Mounted from the root layout so logout on another Keyra site is detected
 * without a hard refresh — not only inside AdminDashboardShell.
 */
export function SoipSessionWatcher() {
  return <AdminAuthWatcher />;
}
