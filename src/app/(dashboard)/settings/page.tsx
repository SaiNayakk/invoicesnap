import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <div className="mb-7">
        <h1 className="font-display text-2xl font-semibold text-zinc-50 mb-1">Settings</h1>
        <p className="text-sm text-zinc-500">Manage your business profile and invoice defaults.</p>
      </div>

      <div className="space-y-5">
        {/* Business profile */}
        <div className="rounded-xl border border-white/8 bg-[#111113] p-5">
          <h2 className="text-sm font-semibold text-zinc-200 mb-4">Business profile</h2>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Business / freelancer name</Label>
              <Input defaultValue="Rahul Photography" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" defaultValue="rahul@rahulphoto.in" />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input defaultValue="+91 98765 43210" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Address</Label>
              <Input defaultValue="Bengaluru, Karnataka" />
            </div>
          </div>
        </div>

        {/* Tax & payments */}
        <div className="rounded-xl border border-white/8 bg-[#111113] p-5">
          <h2 className="text-sm font-semibold text-zinc-200 mb-4">Tax &amp; payments</h2>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>GST number (optional)</Label>
              <Input placeholder="27AAPFU0939F1ZV" />
            </div>
            <div className="space-y-1.5">
              <Label>UPI ID</Label>
              <Input defaultValue="rahul@upi" />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button>Save changes</Button>
        </div>
      </div>
    </div>
  );
}
