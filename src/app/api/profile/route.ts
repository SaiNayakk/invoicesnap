import { NextResponse, type NextRequest } from "next/server";
import { createPBAdminClient } from "@/lib/pb/server";
import { PROFILE_FIELDS } from "@/lib/data";
import { asOwner, body, fail } from "@/lib/api";
import { validateGstin } from "@/lib/gst";

const LIMITS: Record<string, number> = {
  business_name: 80, address: 200, city: 60, state: 60, pincode: 10, phone: 20, gst_number: 15,
  pan_number: 10, upi_id: 60, bank_name: 60, bank_account_number: 30, bank_ifsc: 11, invoice_prefix: 10,
};

/** Only whitelisted profile fields; plan, counter and email can't be set here. */
export async function PATCH(req: NextRequest) {
  return asOwner(async (owner) => {
    const b = await body(req);
    const patch: Record<string, string | number> = {};
    for (const f of PROFILE_FIELDS) {
      if (!(f in b)) continue;
      if (f === "default_due_days") {
        const n = Number(b[f]);
        if (!Number.isInteger(n) || n < 0 || n > 120) return fail("Payment terms must be 0 to 120 days.");
        patch[f] = n;
      } else {
        patch[f] = typeof b[f] === "string" ? (b[f] as string).trim().slice(0, LIMITS[f]) : "";
      }
    }
    if (typeof patch.gst_number === "string" && patch.gst_number) {
      patch.gst_number = patch.gst_number.toUpperCase();
      const g = validateGstin(patch.gst_number);
      if (!g.ok) return fail(`GSTIN: ${g.error}`);
      patch.state ||= g.state;
    }
    if (patch.upi_id && !/^[\w.-]{2,}@[a-z]{2,}$/i.test(String(patch.upi_id))) return fail("A UPI ID looks like name@bank.");
    if (patch.invoice_prefix !== undefined) {
      if (!/^[A-Z0-9]{1,10}$/i.test(String(patch.invoice_prefix))) return fail("Use letters and numbers for the invoice prefix.");
      patch.invoice_prefix = String(patch.invoice_prefix).toUpperCase();
    }
    const pb = await createPBAdminClient();
    await pb.collection("users").update(owner.id, patch);
    return NextResponse.json({ ok: true });
  });
}
