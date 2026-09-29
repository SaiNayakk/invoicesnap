import type { Metadata } from "next";
import { requireOwner } from "@/lib/owner";
import { isDemoUser, PROFILE_FIELDS } from "@/lib/data";
import { PageHeader } from "@/components/app/ui";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const owner = await requireOwner();
  const values = Object.fromEntries(PROFILE_FIELDS.map((f) => [f, String(owner[f] ?? "")]));
  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader title="Settings" sub="What appears on your invoices and payment page." />
      <SettingsForm initial={values} email={owner.email} demo={isDemoUser(owner)} />
    </div>
  );
}
