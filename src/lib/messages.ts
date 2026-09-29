import { formatDay } from "@/lib/dates";
import { formatCurrency } from "@/lib/utils";
import type { Client, Invoice, Profile } from "@/lib/types";

const BUSINESS = /\b(coffee|cafe|events?|tutoring|classes|design|organics|kitchen|foods?|realty|gym|clinic|dental|studio|yoga|pvt|ltd|limited|llp|agency|solutions|services|traders|enterprises|industries|media|labs?|school|academy|hotel|restaurant|store|shop)\b/i;

/** "Hi Sneha" for a person, "Hi Brewline Coffee" for a business. */
export function greetName(name: string, gstin = ""): string {
  const n = name.trim();
  return gstin || BUSINESS.test(n) || n.split(/\s+/).length > 3 ? n : n.split(/\s+/)[0];
}

/** The WhatsApp message that carries a new invoice. Plain text: WhatsApp renders *bold* itself. */
export function invoiceMessage(inv: Invoice, client: Client, owner: Profile, link: string): string {
  return [
    `Hi ${greetName(client.name, client.gst_number)}, here is invoice ${inv.invoice_number} from ${owner.business_name || "us"}.`,
    "",
    `*Amount:* ${formatCurrency(inv.total)}`,
    `*Due:* ${formatDay(inv.due_date, true)}`,
    "",
    `View and pay by UPI: ${link}`,
    "",
    "Thank you!",
  ].join("\n");
}
