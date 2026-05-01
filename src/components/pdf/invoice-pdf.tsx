import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// ── Types ──────────────────────────────────────────────────────────────────────
interface InvoiceItem {
  description: string;
  hsn_sac?: string | null;
  quantity: number;
  rate: number;
  amount: number;
}

interface PDFProfile {
  business_name: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  phone?: string | null;
  email?: string;
  gst_number?: string | null;
  pan_number?: string | null;
  upi_id?: string | null;
  bank_name?: string | null;
  bank_account_number?: string | null;
  bank_ifsc?: string | null;
}

interface PDFClient {
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  gst_number?: string | null;
}

interface PDFInvoice {
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  status: string;
  subtotal: number;
  gst_rate: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  gst_amount: number;
  total: number;
  supply_type: "intra" | "inter";
  notes?: string | null;
  terms?: string | null;
  items: InvoiceItem[];
  client: PDFClient;
  profile: PDFProfile;
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const C = {
  bg:       "#ffffff",
  dark:     "#09090b",
  emerald:  "#059669",
  emeraldL: "#d1fae5",
  gray:     "#6b7280",
  grayL:    "#f3f4f6",
  grayM:    "#e5e7eb",
  grayD:    "#374151",
  border:   "#e5e7eb",
  red:      "#dc2626",
  amber:    "#d97706",
};

const styles = StyleSheet.create({
  page: {
    fontFamily:      "Helvetica",
    fontSize:        9,
    color:           C.dark,
    backgroundColor: C.bg,
    paddingTop:      36,
    paddingBottom:   48,
    paddingHorizontal: 40,
  },

  // Header band
  headerBand: {
    backgroundColor: C.dark,
    borderRadius:    6,
    padding:         20,
    marginBottom:    20,
    flexDirection:   "row",
    justifyContent:  "space-between",
    alignItems:      "flex-start",
  },
  brandName: {
    fontSize:     18,
    fontFamily:   "Helvetica-Bold",
    color:        "#ffffff",
    marginBottom: 3,
  },
  brandSub: { fontSize: 8, color: "#6ee7b7", letterSpacing: 1.5 },
  headerRight: { alignItems: "flex-end" },
  invNumber: {
    fontSize: 14, fontFamily: "Helvetica-Bold",
    color: "#10b981", marginBottom: 2,
  },
  invLabel: { fontSize: 8, color: "#a1a1aa" },

  // Info row
  infoRow: {
    flexDirection: "row", gap: 12, marginBottom: 18,
  },
  infoBox: {
    flex: 1, backgroundColor: C.grayL,
    borderRadius: 6, padding: 12,
  },
  infoLabel: {
    fontSize: 7, color: C.gray, textTransform: "uppercase",
    letterSpacing: 1, marginBottom: 4,
  },
  infoVal:  { fontSize: 9,  color: C.dark, fontFamily: "Helvetica-Bold" },
  infoSub:  { fontSize: 8,  color: C.gray, marginTop: 1 },

  // Status badge
  badge: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 12, alignSelf: "flex-start", marginTop: 6,
  },
  badgeText: { fontSize: 8, fontFamily: "Helvetica-Bold" },

  // Divider
  divider: { height: 1, backgroundColor: C.border, marginVertical: 12 },

  // Table
  tableHeader: {
    flexDirection: "row", backgroundColor: C.dark,
    borderRadius: 4, paddingHorizontal: 10, paddingVertical: 7,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: "row", paddingHorizontal: 10, paddingVertical: 7,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  tableRowAlt: { backgroundColor: C.grayL },
  colDesc:   { flex: 3 },
  colHsn:    { flex: 1.2, textAlign: "center" },
  colQty:    { width: 36, textAlign: "center" },
  colRate:   { width: 60, textAlign: "right" },
  colAmt:    { width: 68, textAlign: "right" },
  thText:    { fontSize: 7, color: "#ffffff", textTransform: "uppercase", letterSpacing: 0.8 },
  tdText:    { fontSize: 9, color: C.grayD },
  tdAmt:     { fontSize: 9, color: C.dark, fontFamily: "Helvetica-Bold" },

  // Totals
  totalsRow: {
    flexDirection: "row", justifyContent: "flex-end", marginTop: 2,
  },
  totalsBox: { width: 220 },
  totalLine: {
    flexDirection: "row", justifyContent: "space-between",
    paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  totalLineLabel: { fontSize: 9, color: C.gray },
  totalLineVal:   { fontSize: 9, color: C.dark },
  grandLine: {
    flexDirection: "row", justifyContent: "space-between",
    paddingTop: 8, paddingBottom: 4,
    backgroundColor: C.dark, borderRadius: 4,
    paddingHorizontal: 10, marginTop: 6,
  },
  grandLabel: { fontSize: 10, color: "#ffffff", fontFamily: "Helvetica-Bold" },
  grandVal:   { fontSize: 13, color: "#10b981", fontFamily: "Helvetica-Bold" },

  // GST breakdown box
  gstBox: {
    backgroundColor: "#f0fdf4", borderWidth: 1, borderColor: "#bbf7d0",
    borderRadius: 6, padding: 10, marginTop: 14,
  },
  gstTitle: {
    fontSize: 7, color: C.emerald, textTransform: "uppercase",
    letterSpacing: 1, marginBottom: 5, fontFamily: "Helvetica-Bold",
  },
  gstRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  gstLabel: { fontSize: 8, color: C.grayD },
  gstVal:   { fontSize: 8, color: C.dark, fontFamily: "Helvetica-Bold" },

  // Payment + notes
  bottomRow: { flexDirection: "row", gap: 12, marginTop: 16 },
  payBox: {
    flex: 1, borderWidth: 1, borderColor: C.border,
    borderRadius: 6, padding: 10,
  },
  payTitle: {
    fontSize: 7, color: C.gray, textTransform: "uppercase",
    letterSpacing: 1, marginBottom: 5, fontFamily: "Helvetica-Bold",
  },
  payLine: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  payLabel: { fontSize: 8, color: C.gray },
  payVal:   { fontSize: 8, color: C.dark },

  // Footer
  footer: {
    position: "absolute", bottom: 24, left: 40, right: 40,
    borderTopWidth: 1, borderTopColor: C.border, paddingTop: 8,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  footerText: { fontSize: 7, color: C.gray },
  footerBrand: { fontSize: 7, color: C.emerald, fontFamily: "Helvetica-Bold" },

  amtWords: {
    fontSize: 8, color: C.gray, fontStyle: "italic",
    textAlign: "right", marginTop: 4,
  },
});

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmtINR(n: number) {
  return "₹" + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

const ONES = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
const TENS = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
function toWords(n: number): string {
  if (n === 0) return "Zero";
  const chunks = (num: number): string => {
    if (num === 0) return "";
    if (num < 20) return ONES[num] + " ";
    if (num < 100) return TENS[Math.floor(num / 10)] + (num % 10 ? " " + ONES[num % 10] : "") + " ";
    return ONES[Math.floor(num / 100)] + " Hundred " + chunks(num % 100);
  };
  const cr = Math.floor(n / 10000000);
  const lk = Math.floor((n % 10000000) / 100000);
  const th = Math.floor((n % 100000) / 1000);
  const rest = n % 1000;
  let res = "";
  if (cr) res += chunks(cr) + "Crore ";
  if (lk) res += chunks(lk) + "Lakh ";
  if (th) res += chunks(th) + "Thousand ";
  res += chunks(rest);
  return res.trim();
}

function amountInWords(total: number): string {
  const rupees = Math.floor(total);
  const paise  = Math.round((total - rupees) * 100);
  let w = "Rupees " + toWords(rupees);
  if (paise) w += " and " + toWords(paise) + " Paise";
  return w + " Only";
}

function statusBadge(status: string) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    paid:    { bg: "#d1fae5", color: "#065f46", label: "PAID" },
    sent:    { bg: "#fef3c7", color: "#92400e", label: "SENT" },
    draft:   { bg: "#f3f4f6", color: "#374151", label: "DRAFT" },
    overdue: { bg: "#fee2e2", color: "#991b1b", label: "OVERDUE" },
  };
  return map[status] ?? map.draft;
}

// ── Main PDF component ─────────────────────────────────────────────────────────
export function InvoicePDF({ invoice }: { invoice: PDFInvoice }) {
  const { profile, client, items } = invoice;
  const badge = statusBadge(invoice.status);
  const isIntra = invoice.supply_type === "intra";

  return (
    <Document title={invoice.invoice_number} author={profile.business_name}>
      <Page size="A4" style={styles.page}>

        {/* ── Header band ── */}
        <View style={styles.headerBand}>
          <View>
            <Text style={styles.brandName}>{profile.business_name}</Text>
            <Text style={styles.brandSub}>TAX INVOICE</Text>
            {profile.gst_number && (
              <Text style={[styles.brandSub, { marginTop: 4, color: "#a1a1aa" }]}>
                GSTIN: {profile.gst_number}
              </Text>
            )}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.invNumber}>{invoice.invoice_number}</Text>
            <Text style={styles.invLabel}>Date: {fmtDate(invoice.invoice_date)}</Text>
            <Text style={styles.invLabel}>Due:  {fmtDate(invoice.due_date)}</Text>
            <View style={[styles.badge, { backgroundColor: badge.bg, marginTop: 8 }]}>
              <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
            </View>
          </View>
        </View>

        {/* ── Seller / Buyer info row ── */}
        <View style={styles.infoRow}>
          {/* Seller */}
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>From (Seller)</Text>
            <Text style={styles.infoVal}>{profile.business_name}</Text>
            {profile.address && <Text style={styles.infoSub}>{profile.address}</Text>}
            {(profile.city || profile.state) && (
              <Text style={styles.infoSub}>
                {[profile.city, profile.state, profile.pincode].filter(Boolean).join(", ")}
              </Text>
            )}
            {profile.phone && <Text style={styles.infoSub}>📞 {profile.phone}</Text>}
            {profile.email && <Text style={styles.infoSub}>✉ {profile.email}</Text>}
            {profile.pan_number && (
              <Text style={[styles.infoSub, { marginTop: 4 }]}>PAN: {profile.pan_number}</Text>
            )}
          </View>

          {/* Buyer */}
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Bill To (Buyer)</Text>
            <Text style={styles.infoVal}>{client.name}</Text>
            {client.address && <Text style={styles.infoSub}>{client.address}</Text>}
            {(client.city || client.state) && (
              <Text style={styles.infoSub}>
                {[client.city, client.state, client.pincode].filter(Boolean).join(", ")}
              </Text>
            )}
            {client.phone && <Text style={styles.infoSub}>📞 {client.phone}</Text>}
            {client.email && <Text style={styles.infoSub}>✉ {client.email}</Text>}
            {client.gst_number && (
              <Text style={[styles.infoSub, { marginTop: 4 }]}>GSTIN: {client.gst_number}</Text>
            )}
          </View>

          {/* Dates */}
          <View style={[styles.infoBox, { flex: 0.8 }]}>
            <Text style={styles.infoLabel}>Invoice Details</Text>
            <View style={{ marginBottom: 6 }}>
              <Text style={[styles.infoSub, { color: C.gray }]}>Invoice No.</Text>
              <Text style={styles.infoVal}>{invoice.invoice_number}</Text>
            </View>
            <View style={{ marginBottom: 6 }}>
              <Text style={[styles.infoSub, { color: C.gray }]}>Invoice Date</Text>
              <Text style={styles.infoSub}>{fmtDate(invoice.invoice_date)}</Text>
            </View>
            <View>
              <Text style={[styles.infoSub, { color: C.gray }]}>Due Date</Text>
              <Text style={styles.infoSub}>{fmtDate(invoice.due_date)}</Text>
            </View>
          </View>
        </View>

        {/* ── Items table ── */}
        <View style={styles.tableHeader}>
          <Text style={[styles.thText, styles.colDesc]}>#  Description</Text>
          <Text style={[styles.thText, styles.colHsn]}>HSN/SAC</Text>
          <Text style={[styles.thText, styles.colQty]}>Qty</Text>
          <Text style={[styles.thText, styles.colRate]}>Rate</Text>
          <Text style={[styles.thText, styles.colAmt]}>Amount</Text>
        </View>

        {items.map((item, idx) => (
          <View key={idx} style={idx % 2 === 1 ? [styles.tableRow, styles.tableRowAlt] : styles.tableRow}>
            <View style={styles.colDesc}>
              <Text style={styles.tdText}>{idx + 1}.  {item.description}</Text>
            </View>
            <Text style={[styles.tdText, styles.colHsn]}>{item.hsn_sac ?? "—"}</Text>
            <Text style={[styles.tdText, styles.colQty]}>{item.quantity}</Text>
            <Text style={[styles.tdText, styles.colRate]}>{fmtINR(item.rate)}</Text>
            <Text style={[styles.tdAmt, styles.colAmt]}>{fmtINR(item.amount)}</Text>
          </View>
        ))}

        {/* ── Totals ── */}
        <View style={styles.totalsRow}>
          <View style={styles.totalsBox}>
            <View style={styles.totalLine}>
              <Text style={styles.totalLineLabel}>Subtotal</Text>
              <Text style={styles.totalLineVal}>{fmtINR(invoice.subtotal)}</Text>
            </View>

            {invoice.gst_rate > 0 && isIntra && (
              <>
                <View style={styles.totalLine}>
                  <Text style={styles.totalLineLabel}>CGST ({invoice.gst_rate / 2}%)</Text>
                  <Text style={styles.totalLineVal}>{fmtINR(invoice.cgst_amount)}</Text>
                </View>
                <View style={styles.totalLine}>
                  <Text style={styles.totalLineLabel}>SGST ({invoice.gst_rate / 2}%)</Text>
                  <Text style={styles.totalLineVal}>{fmtINR(invoice.sgst_amount)}</Text>
                </View>
              </>
            )}

            {invoice.gst_rate > 0 && !isIntra && (
              <View style={styles.totalLine}>
                <Text style={styles.totalLineLabel}>IGST ({invoice.gst_rate}%)</Text>
                <Text style={styles.totalLineVal}>{fmtINR(invoice.igst_amount)}</Text>
              </View>
            )}

            <View style={styles.grandLine}>
              <Text style={styles.grandLabel}>TOTAL</Text>
              <Text style={styles.grandVal}>{fmtINR(invoice.total)}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.amtWords}>{amountInWords(invoice.total)}</Text>

        {/* ── GST breakdown ── */}
        {invoice.gst_rate > 0 && (
          <View style={styles.gstBox}>
            <Text style={styles.gstTitle}>GST Summary</Text>
            <View style={styles.gstRow}>
              <Text style={styles.gstLabel}>Taxable Value</Text>
              <Text style={styles.gstLabel}>GST Rate</Text>
              {isIntra ? (
                <>
                  <Text style={styles.gstLabel}>CGST</Text>
                  <Text style={styles.gstLabel}>SGST</Text>
                </>
              ) : (
                <Text style={styles.gstLabel}>IGST</Text>
              )}
              <Text style={styles.gstLabel}>Total Tax</Text>
            </View>
            <View style={[styles.gstRow, { borderTopWidth: 1, borderTopColor: "#bbf7d0", paddingTop: 4 }]}>
              <Text style={styles.gstVal}>{fmtINR(invoice.subtotal)}</Text>
              <Text style={styles.gstVal}>{invoice.gst_rate}%</Text>
              {isIntra ? (
                <>
                  <Text style={styles.gstVal}>{fmtINR(invoice.cgst_amount)}</Text>
                  <Text style={styles.gstVal}>{fmtINR(invoice.sgst_amount)}</Text>
                </>
              ) : (
                <Text style={styles.gstVal}>{fmtINR(invoice.igst_amount)}</Text>
              )}
              <Text style={styles.gstVal}>{fmtINR(invoice.gst_amount)}</Text>
            </View>
          </View>
        )}

        {/* ── Payment + Notes ── */}
        <View style={styles.bottomRow}>
          {/* Payment details */}
          {(profile.upi_id || profile.bank_account_number) && (
            <View style={styles.payBox}>
              <Text style={styles.payTitle}>Payment Details</Text>
              {profile.upi_id && (
                <View style={styles.payLine}>
                  <Text style={styles.payLabel}>UPI ID</Text>
                  <Text style={styles.payVal}>{profile.upi_id}</Text>
                </View>
              )}
              {profile.bank_name && (
                <View style={styles.payLine}>
                  <Text style={styles.payLabel}>Bank</Text>
                  <Text style={styles.payVal}>{profile.bank_name}</Text>
                </View>
              )}
              {profile.bank_account_number && (
                <View style={styles.payLine}>
                  <Text style={styles.payLabel}>Account No.</Text>
                  <Text style={styles.payVal}>{profile.bank_account_number}</Text>
                </View>
              )}
              {profile.bank_ifsc && (
                <View style={styles.payLine}>
                  <Text style={styles.payLabel}>IFSC</Text>
                  <Text style={styles.payVal}>{profile.bank_ifsc}</Text>
                </View>
              )}
            </View>
          )}

          {/* Notes / Terms */}
          {(invoice.notes || invoice.terms) && (
            <View style={[styles.payBox, { flex: 1.5 }]}>
              {invoice.notes && (
                <>
                  <Text style={styles.payTitle}>Notes</Text>
                  <Text style={[styles.payLabel, { lineHeight: 1.5 }]}>{invoice.notes}</Text>
                </>
              )}
              {invoice.terms && (
                <>
                  <Text style={[styles.payTitle, { marginTop: 8 }]}>Terms &amp; Conditions</Text>
                  <Text style={[styles.payLabel, { lineHeight: 1.5 }]}>{invoice.terms}</Text>
                </>
              )}
            </View>
          )}

          {/* Signature */}
          <View style={[styles.payBox, { flex: 0.8, alignItems: "flex-end" }]}>
            <Text style={styles.payTitle}>For {profile.business_name}</Text>
            <View style={{ height: 36, borderBottomWidth: 1, borderBottomColor: C.border, width: "100%", marginTop: 8 }} />
            <Text style={[styles.payLabel, { marginTop: 4 }]}>Authorised Signatory</Text>
          </View>
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {invoice.invoice_number}  ·  {profile.business_name}
            {profile.gst_number ? `  ·  GSTIN ${profile.gst_number}` : ""}
          </Text>
          <Text style={styles.footerBrand}>Generated by InvoiceSnap</Text>
        </View>

      </Page>
    </Document>
  );
}
