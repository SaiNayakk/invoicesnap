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

// ── Palette ────────────────────────────────────────────────────────────────────
const C = {
  black:   "#111111",
  text:    "#333333",
  muted:   "#666666",
  border:  "#cccccc",
  headerBg:"#1a3a5c",   // single accent — dark navy, used only at very top
  thBg:    "#e8e8e8",
  rowAlt:  "#f9f9f9",
  white:   "#ffffff",
  paidBg:  "#e6f4ea",
  paidFg:  "#1a7a3c",
  sentBg:  "#fff8e1",
  sentFg:  "#7a5c00",
  overdBg: "#fde8e8",
  overdFg: "#9b1c1c",
};

const styles = StyleSheet.create({
  page: {
    fontFamily:        "Helvetica",
    fontSize:          9,
    color:             C.text,
    backgroundColor:   C.white,
    paddingTop:        0,
    paddingBottom:     44,
    paddingHorizontal: 0,
  },

  // ── Top accent bar ──
  topBar: {
    backgroundColor: C.headerBg,
    height:          6,
    marginBottom:    0,
  },

  // ── Header ──
  header: {
    flexDirection:     "row",
    justifyContent:    "space-between",
    alignItems:        "flex-start",
    paddingHorizontal: 40,
    paddingTop:        22,
    paddingBottom:     18,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  companyName: {
    fontSize:     16,
    fontFamily:   "Helvetica-Bold",
    color:        C.black,
    marginBottom: 4,
  },
  companyDetail: { fontSize: 8, color: C.muted, marginTop: 1 },

  titleBlock:   { alignItems: "flex-end" },
  invoiceTitle: {
    fontSize:     20,
    fontFamily:   "Helvetica-Bold",
    color:        C.headerBg,
    letterSpacing: 1,
    marginBottom: 6,
  },
  invoiceMetaRow: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 2 },
  invoiceMetaLabel: { fontSize: 8, color: C.muted, width: 60, textAlign: "right" },
  invoiceMetaValue: { fontSize: 8, color: C.black, fontFamily: "Helvetica-Bold", width: 90, textAlign: "right" },

  // Status stamp
  stamp: {
    marginTop: 8, paddingHorizontal: 10, paddingVertical: 3,
    borderWidth: 1.5, alignSelf: "flex-end",
  },
  stampText: { fontSize: 9, fontFamily: "Helvetica-Bold", letterSpacing: 1 },

  // ── Bill to / From row ──
  billingRow: {
    flexDirection:     "row",
    paddingHorizontal: 40,
    paddingVertical:   16,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    gap:               24,
  },
  billingBox:   { flex: 1 },
  billingLabel: {
    fontSize: 7, fontFamily: "Helvetica-Bold", color: C.muted,
    textTransform: "uppercase", letterSpacing: 1, marginBottom: 5,
  },
  billingName:  { fontSize: 10, fontFamily: "Helvetica-Bold", color: C.black, marginBottom: 3 },
  billingLine:  { fontSize: 8, color: C.muted, marginTop: 1 },

  // ── Items table ──
  tableWrap: { paddingHorizontal: 40, marginTop: 20 },
  tableHeader: {
    flexDirection:   "row",
    backgroundColor: C.thBg,
    borderTopWidth:  1,
    borderTopColor:  C.border,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingVertical:   6,
    paddingHorizontal: 6,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingVertical:   6,
    paddingHorizontal: 6,
  },
  tableRowAlt: { backgroundColor: C.rowAlt },

  colSr:   { width: 18 },
  colDesc: { flex: 3 },
  colHsn:  { flex: 1.2, textAlign: "center" },
  colQty:  { width: 32, textAlign: "center" },
  colRate: { width: 62, textAlign: "right" },
  colAmt:  { width: 68, textAlign: "right" },

  thText: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: C.text, textTransform: "uppercase" },
  tdText: { fontSize: 9,   color: C.text },
  tdBold: { fontSize: 9,   color: C.black, fontFamily: "Helvetica-Bold" },

  // ── Totals ──
  totalsSection: {
    paddingHorizontal: 40,
    marginTop:         8,
    flexDirection:     "row",
    justifyContent:    "flex-end",
  },
  totalsBox: { width: 240 },
  totalRow: {
    flexDirection: "row", justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  totalLabel: { fontSize: 9, color: C.muted },
  totalValue: { fontSize: 9, color: C.black },
  grandRow: {
    flexDirection: "row", justifyContent: "space-between",
    paddingVertical: 7, paddingHorizontal: 8, marginTop: 4,
    backgroundColor: C.headerBg,
  },
  grandLabel: { fontSize: 10, fontFamily: "Helvetica-Bold", color: C.white },
  grandValue: { fontSize: 12, fontFamily: "Helvetica-Bold", color: C.white },

  // ── Amount in words ──
  amtWords: {
    paddingHorizontal: 40, marginTop: 6,
    fontSize: 8, color: C.muted, fontStyle: "italic", textAlign: "right",
  },

  // ── GST summary ──
  gstSection: { paddingHorizontal: 40, marginTop: 14 },
  gstTitle: {
    fontSize: 7.5, fontFamily: "Helvetica-Bold", color: C.muted,
    textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4,
  },
  gstTable: { borderWidth: 1, borderColor: C.border },
  gstHeaderRow: {
    flexDirection: "row", backgroundColor: C.thBg,
    borderBottomWidth: 1, borderBottomColor: C.border,
    paddingVertical: 4, paddingHorizontal: 6,
  },
  gstDataRow: {
    flexDirection: "row",
    paddingVertical: 4, paddingHorizontal: 6,
  },
  gstCol: { flex: 1 },
  gstColR: { flex: 1, textAlign: "right" },
  gstTh: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: C.text },
  gstTd: { fontSize: 8, color: C.text },

  // ── Bottom section ──
  bottomSection: {
    flexDirection: "row", gap: 16,
    paddingHorizontal: 40, marginTop: 16,
  },
  bottomBox: {
    flex: 1, borderWidth: 1, borderColor: C.border, padding: 10,
  },
  bottomTitle: {
    fontSize: 7.5, fontFamily: "Helvetica-Bold", color: C.muted,
    textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6,
    borderBottomWidth: 1, borderBottomColor: C.border, paddingBottom: 4,
  },
  bottomRow2: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  bottomLabel: { fontSize: 8, color: C.muted },
  bottomValue: { fontSize: 8, color: C.black },

  signBox: {
    flex: 1, borderWidth: 1, borderColor: C.border, padding: 10,
    alignItems: "center",
  },
  signTitle: {
    fontSize: 7.5, fontFamily: "Helvetica-Bold", color: C.muted,
    textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6,
    alignSelf: "stretch", textAlign: "center",
    borderBottomWidth: 1, borderBottomColor: C.border, paddingBottom: 4,
  },
  signLine: {
    width: "80%", borderBottomWidth: 1, borderBottomColor: C.black,
    marginTop: 32, marginBottom: 4,
  },
  signSubLabel: { fontSize: 7.5, color: C.muted },

  // ── Footer ──
  footer: {
    position: "absolute", bottom: 16, left: 40, right: 40,
    borderTopWidth: 1, borderTopColor: C.border, paddingTop: 6,
    flexDirection: "row", justifyContent: "space-between",
  },
  footerL: { fontSize: 7, color: C.muted },
  footerR: { fontSize: 7, color: C.muted },
});

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmtINR(n: number) {
  return "Rs." + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

function stampStyle(status: string) {
  if (status === "paid")    return { bg: C.paidBg, fg: C.paidFg, label: "PAID" };
  if (status === "overdue") return { bg: C.overdBg, fg: C.overdFg, label: "OVERDUE" };
  if (status === "sent")    return { bg: C.sentBg,  fg: C.sentFg,  label: "SENT" };
  return { bg: "#f0f0f0", fg: C.muted, label: "DRAFT" };
}

// ── Main PDF component ─────────────────────────────────────────────────────────
export function InvoicePDF({ invoice }: { invoice: PDFInvoice }) {
  const { profile, client, items } = invoice;
  const stamp  = stampStyle(invoice.status);
  const isIntra = invoice.supply_type === "intra";

  const addressLine = [profile.address, profile.city, profile.state, profile.pincode]
    .filter(Boolean).join(", ");
  const clientAddr = [client.address, client.city, client.state, client.pincode]
    .filter(Boolean).join(", ");

  return (
    <Document title={invoice.invoice_number} author={profile.business_name}>
      <Page size="A4" style={styles.page}>

        {/* ── Top accent bar ── */}
        <View style={styles.topBar} />

        {/* ── Header ── */}
        <View style={styles.header}>
          {/* Company info */}
          <View>
            <Text style={styles.companyName}>{profile.business_name}</Text>
            {addressLine ? <Text style={styles.companyDetail}>{addressLine}</Text> : null}
            {profile.phone ? <Text style={styles.companyDetail}>Tel: {profile.phone}</Text> : null}
            {profile.email ? <Text style={styles.companyDetail}>{profile.email}</Text> : null}
            {profile.gst_number ? <Text style={styles.companyDetail}>GSTIN: {profile.gst_number}</Text> : null}
            {profile.pan_number ? <Text style={styles.companyDetail}>PAN: {profile.pan_number}</Text> : null}
          </View>

          {/* Invoice title + meta */}
          <View style={styles.titleBlock}>
            <Text style={styles.invoiceTitle}>TAX INVOICE</Text>
            <View style={styles.invoiceMetaRow}>
              <Text style={styles.invoiceMetaLabel}>Invoice No.</Text>
              <Text style={styles.invoiceMetaValue}>{invoice.invoice_number}</Text>
            </View>
            <View style={styles.invoiceMetaRow}>
              <Text style={styles.invoiceMetaLabel}>Date</Text>
              <Text style={styles.invoiceMetaValue}>{fmtDate(invoice.invoice_date)}</Text>
            </View>
            <View style={styles.invoiceMetaRow}>
              <Text style={styles.invoiceMetaLabel}>Due Date</Text>
              <Text style={styles.invoiceMetaValue}>{fmtDate(invoice.due_date)}</Text>
            </View>
            {/* Status stamp */}
            <View style={[styles.stamp, { backgroundColor: stamp.bg, borderColor: stamp.fg }]}>
              <Text style={[styles.stampText, { color: stamp.fg }]}>{stamp.label}</Text>
            </View>
          </View>
        </View>

        {/* ── Bill To ── */}
        <View style={styles.billingRow}>
          <View style={styles.billingBox}>
            <Text style={styles.billingLabel}>Bill To</Text>
            <Text style={styles.billingName}>{client.name}</Text>
            {clientAddr ? <Text style={styles.billingLine}>{clientAddr}</Text> : null}
            {client.phone ? <Text style={styles.billingLine}>Tel: {client.phone}</Text> : null}
            {client.email ? <Text style={styles.billingLine}>{client.email}</Text> : null}
            {client.gst_number ? <Text style={styles.billingLine}>GSTIN: {client.gst_number}</Text> : null}
          </View>
        </View>

        {/* ── Items table ── */}
        <View style={styles.tableWrap}>
          {/* Header row */}
          <View style={styles.tableHeader}>
            <Text style={[styles.thText, styles.colSr]}>#</Text>
            <Text style={[styles.thText, styles.colDesc]}>Description</Text>
            <Text style={[styles.thText, styles.colHsn]}>HSN/SAC</Text>
            <Text style={[styles.thText, styles.colQty]}>Qty</Text>
            <Text style={[styles.thText, styles.colRate]}>Rate</Text>
            <Text style={[styles.thText, styles.colAmt]}>Amount</Text>
          </View>

          {items.map((item, idx) => (
            <View key={idx} style={idx % 2 === 1 ? [styles.tableRow, styles.tableRowAlt] : styles.tableRow}>
              <Text style={[styles.tdText, styles.colSr]}>{idx + 1}</Text>
              <Text style={[styles.tdText, styles.colDesc]}>{item.description}</Text>
              <Text style={[styles.tdText, styles.colHsn]}>{item.hsn_sac ?? "-"}</Text>
              <Text style={[styles.tdText, styles.colQty]}>{item.quantity}</Text>
              <Text style={[styles.tdText, styles.colRate]}>{fmtINR(item.rate)}</Text>
              <Text style={[styles.tdBold, styles.colAmt]}>{fmtINR(item.amount)}</Text>
            </View>
          ))}
        </View>

        {/* ── Totals ── */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>{fmtINR(invoice.subtotal)}</Text>
            </View>

            {invoice.gst_rate > 0 && isIntra && (
              <>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>CGST ({invoice.gst_rate / 2}%)</Text>
                  <Text style={styles.totalValue}>{fmtINR(invoice.cgst_amount)}</Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>SGST ({invoice.gst_rate / 2}%)</Text>
                  <Text style={styles.totalValue}>{fmtINR(invoice.sgst_amount)}</Text>
                </View>
              </>
            )}

            {invoice.gst_rate > 0 && !isIntra && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>IGST ({invoice.gst_rate}%)</Text>
                <Text style={styles.totalValue}>{fmtINR(invoice.igst_amount)}</Text>
              </View>
            )}

            <View style={styles.grandRow}>
              <Text style={styles.grandLabel}>TOTAL DUE</Text>
              <Text style={styles.grandValue}>{fmtINR(invoice.total)}</Text>
            </View>
          </View>
        </View>

        {/* ── Amount in words ── */}
        <Text style={styles.amtWords}>
          {amountInWords(invoice.total)}
        </Text>

        {/* ── GST Summary ── */}
        {invoice.gst_rate > 0 && (
          <View style={styles.gstSection}>
            <Text style={styles.gstTitle}>GST Summary</Text>
            <View style={styles.gstTable}>
              <View style={styles.gstHeaderRow}>
                <Text style={[styles.gstTh, styles.gstCol]}>Taxable Value</Text>
                <Text style={[styles.gstTh, styles.gstCol]}>GST Rate</Text>
                {isIntra ? (
                  <>
                    <Text style={[styles.gstTh, styles.gstCol]}>CGST</Text>
                    <Text style={[styles.gstTh, styles.gstColR]}>SGST</Text>
                  </>
                ) : (
                  <Text style={[styles.gstTh, styles.gstColR]}>IGST</Text>
                )}
                <Text style={[styles.gstTh, styles.gstColR]}>Total Tax</Text>
              </View>
              <View style={styles.gstDataRow}>
                <Text style={[styles.gstTd, styles.gstCol]}>{fmtINR(invoice.subtotal)}</Text>
                <Text style={[styles.gstTd, styles.gstCol]}>{invoice.gst_rate}%</Text>
                {isIntra ? (
                  <>
                    <Text style={[styles.gstTd, styles.gstCol]}>{fmtINR(invoice.cgst_amount)}</Text>
                    <Text style={[styles.gstTd, styles.gstColR]}>{fmtINR(invoice.sgst_amount)}</Text>
                  </>
                ) : (
                  <Text style={[styles.gstTd, styles.gstColR]}>{fmtINR(invoice.igst_amount)}</Text>
                )}
                <Text style={[styles.gstTd, styles.gstColR]}>{fmtINR(invoice.gst_amount)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* ── Bottom: Payment + Notes + Signature ── */}
        <View style={styles.bottomSection}>
          {(profile.upi_id || profile.bank_account_number) && (
            <View style={styles.bottomBox}>
              <Text style={styles.bottomTitle}>Payment Details</Text>
              {profile.upi_id && (
                <View style={styles.bottomRow2}>
                  <Text style={styles.bottomLabel}>UPI ID</Text>
                  <Text style={styles.bottomValue}>{profile.upi_id}</Text>
                </View>
              )}
              {profile.bank_name && (
                <View style={styles.bottomRow2}>
                  <Text style={styles.bottomLabel}>Bank</Text>
                  <Text style={styles.bottomValue}>{profile.bank_name}</Text>
                </View>
              )}
              {profile.bank_account_number && (
                <View style={styles.bottomRow2}>
                  <Text style={styles.bottomLabel}>Account No.</Text>
                  <Text style={styles.bottomValue}>{profile.bank_account_number}</Text>
                </View>
              )}
              {profile.bank_ifsc && (
                <View style={styles.bottomRow2}>
                  <Text style={styles.bottomLabel}>IFSC</Text>
                  <Text style={styles.bottomValue}>{profile.bank_ifsc}</Text>
                </View>
              )}
            </View>
          )}

          {(invoice.notes || invoice.terms) && (
            <View style={[styles.bottomBox, { flex: 1.4 }]}>
              {invoice.notes && (
                <>
                  <Text style={styles.bottomTitle}>Notes</Text>
                  <Text style={[styles.bottomLabel, { lineHeight: 1.5 }]}>{invoice.notes}</Text>
                </>
              )}
              {invoice.terms && (
                <>
                  <Text style={[styles.bottomTitle, { marginTop: 8 }]}>Terms & Conditions</Text>
                  <Text style={[styles.bottomLabel, { lineHeight: 1.5 }]}>{invoice.terms}</Text>
                </>
              )}
            </View>
          )}

          <View style={styles.signBox}>
            <Text style={styles.signTitle}>For {profile.business_name}</Text>
            <View style={styles.signLine} />
            <Text style={styles.signSubLabel}>Authorised Signatory</Text>
          </View>
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerL}>{invoice.invoice_number}  |  {profile.business_name}</Text>
          <Text style={styles.footerR}>Generated by InvoiceSnap</Text>
        </View>

      </Page>
    </Document>
  );
}
