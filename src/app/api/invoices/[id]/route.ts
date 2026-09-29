import { NextResponse, type NextRequest } from "next/server";
import { createPBAdminClient } from "@/lib/pb/server";
import { getInvoice, setStatus } from "@/lib/data";
import { asOwner, body, fail } from "@/lib/api";
import { invalidateInsights } from "@/lib/ai/insights";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  return asOwner(async (owner) => {
    const found = await getInvoice(owner.id, (await params).id);
    return found ? NextResponse.json(found) : fail("Not found", 404);
  });
}

/** Only a few transitions are allowed; nothing else about an invoice is editable after it's sent. */
export async function PATCH(req: NextRequest, { params }: Params) {
  return asOwner(async (owner) => {
    const found = await getInvoice(owner.id, (await params).id);
    if (!found) return fail("Not found", 404);
    const { invoice } = found;
    const action = (await body(req)).action;
    if (action === "cancel" && invoice.status !== "paid") {
      await setStatus(owner.id, invoice.id, "cancelled");
    } else if (action === "reopen" && invoice.status === "payment_pending") {
      // The client said they paid but nothing arrived.
      await setStatus(owner.id, invoice.id, "sent", { claimed_at: "" });
    } else {
      return fail("That change isn't allowed for this invoice.");
    }
    return NextResponse.json({ ok: true });
  });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  return asOwner(async (owner) => {
    const found = await getInvoice(owner.id, (await params).id);
    if (!found) return fail("Not found", 404);
    if (found.invoice.status !== "draft") return fail("Only drafts can be deleted. Cancel a sent invoice instead.");
    const pb = await createPBAdminClient();
    await pb.collection("invoices").delete(found.invoice.id); // items cascade
    invalidateInsights(owner.id);
    return NextResponse.json({ ok: true });
  });
}
