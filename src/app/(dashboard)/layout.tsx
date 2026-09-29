import { requireOwner } from "@/lib/owner";
import { isDemoUser } from "@/lib/data";
import { MobileNav, Sidebar } from "@/components/app/nav";
import { DemoReporter } from "@/components/demo/demo-events";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const owner = await requireOwner();
  const demo = isDemoUser(owner);
  return (
    <div className="flex min-h-screen bg-zinc-950">
      <Sidebar business={owner.business_name} email={owner.email} demo={demo} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav />
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
      </div>
      {demo && <DemoReporter />}
    </div>
  );
}
