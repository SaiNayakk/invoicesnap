/**
 * GST rules the invoice builder enforces in code.
 *
 * GSTIN format: 2-digit state code, 10-character PAN, entity number, "Z", and a
 * mod-36 check character. The state codes of seller and buyer decide whether
 * tax is split CGST + SGST (same state) or charged as IGST (different states).
 */

export const GST_SLABS = [0, 5, 12, 18, 28] as const;

const STATES: Record<string, string> = {
  "01": "Jammu and Kashmir", "02": "Himachal Pradesh", "03": "Punjab", "04": "Chandigarh", "05": "Uttarakhand",
  "06": "Haryana", "07": "Delhi", "08": "Rajasthan", "09": "Uttar Pradesh", "10": "Bihar", "11": "Sikkim",
  "12": "Arunachal Pradesh", "13": "Nagaland", "14": "Manipur", "15": "Mizoram", "16": "Tripura", "17": "Meghalaya",
  "18": "Assam", "19": "West Bengal", "20": "Jharkhand", "21": "Odisha", "22": "Chhattisgarh", "23": "Madhya Pradesh",
  "24": "Gujarat", "26": "Dadra and Nagar Haveli and Daman and Diu", "27": "Maharashtra", "29": "Karnataka",
  "30": "Goa", "31": "Lakshadweep", "32": "Kerala", "33": "Tamil Nadu", "34": "Puducherry",
  "35": "Andaman and Nicobar Islands", "36": "Telangana", "37": "Andhra Pradesh", "38": "Ladakh",
};

const CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const FORMAT = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export function gstinCheckChar(first14: string): string {
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const v = CHARS.indexOf(first14[i]) * (i % 2 === 0 ? 1 : 2);
    sum += Math.floor(v / 36) + (v % 36);
  }
  return CHARS[(36 - (sum % 36)) % 36];
}

export type GstinCheck = { ok: true; state: string } | { ok: false; error: string };

export function validateGstin(raw: string): GstinCheck {
  const g = raw.trim().toUpperCase();
  if (!FORMAT.test(g)) return { ok: false, error: "A GSTIN has 15 characters, like 29ABCDE1234F1Z5." };
  const state = STATES[g.slice(0, 2)];
  if (!state) return { ok: false, error: "The first two digits aren't a valid state code." };
  if (gstinCheckChar(g.slice(0, 14)) !== g[14]) return { ok: false, error: "The last character doesn't match. Check for a typo." };
  return { ok: true, state };
}

export function stateOf(gstin: string | undefined | null, fallbackState?: string | null): string | null {
  if (gstin) {
    const c = validateGstin(gstin);
    if (c.ok) return c.state;
  }
  return fallbackState?.trim() || null;
}

/** Same state: CGST + SGST. Different states: IGST. Unknown: assume same state (the common freelancer case). */
export function supplyType(sellerGstin: string, sellerState: string, buyerGstin: string, buyerState: string): "intra" | "inter" {
  const a = stateOf(sellerGstin, sellerState)?.toLowerCase();
  const b = stateOf(buyerGstin, buyerState)?.toLowerCase();
  return a && b && a !== b ? "inter" : "intra";
}

const r2 = (n: number) => Math.round(n * 100) / 100;

export interface LineInput { description: string; quantity: number; rate: number; hsn_sac?: string }

export function computeTotals(items: LineInput[], gstRate: number, supply: "intra" | "inter") {
  const subtotal = r2(items.reduce((s, i) => s + r2(i.quantity * i.rate), 0));
  const gst = r2((subtotal * gstRate) / 100);
  // Split so the halves always add back to the total tax.
  const cgst = supply === "intra" ? r2(gst / 2) : 0;
  const sgst = supply === "intra" ? r2(gst - cgst) : 0;
  return { subtotal, gst_amount: gst, cgst_amount: cgst, sgst_amount: sgst, igst_amount: supply === "inter" ? gst : 0, total: r2(subtotal + gst) };
}
