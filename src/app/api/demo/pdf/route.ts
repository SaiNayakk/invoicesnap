import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { InvoicePDF } from "@/components/pdf/invoice-pdf";

const DEMO_INVOICE = {
  invoice_number: "INV-2025-043",
  invoice_date:   "2025-04-28",
  due_date:       "2025-05-15",
  status:         "sent",
  subtotal:       53000,
  gst_rate:       18,
  cgst_amount:    4770,
  sgst_amount:    4770,
  igst_amount:    0,
  gst_amount:     9540,
  total:          62540,
  supply_type:    "intra" as const,
  notes:          "Thank you for your business!",
  terms:          "Payment due within 30 days of invoice date.",
  items: [
    { description: "Wedding Photography", hsn_sac: "998398", quantity: 1, rate: 45000, amount: 45000 },
    { description: "Photo Album (Premium)", hsn_sac: "998398", quantity: 1, rate: 8000, amount: 8000 },
  ],
  client: {
    name:       "Priya Photography",
    phone:      "+91 98765 43210",
    email:      "priya@priyaphoto.in",
    gst_number: "29AADCP7742R1Z5",
    address:    "12, MG Road",
    city:       "Bengaluru",
    state:      "Karnataka",
    pincode:    "560001",
  },
  profile: {
    business_name:       "Rahul Photography",
    email:               "rahul@rahulphoto.in",
    phone:               "+91 91234 56789",
    address:             "45, Indiranagar",
    city:                "Bengaluru",
    state:               "Karnataka",
    pincode:             "560038",
    gst_number:          "29AALFR4853L1ZQ",
    upi_id:              "sai34nayak@okaxis",
    bank_name:           "Axis Bank",
    bank_account_number: "9876543210001",
    bank_ifsc:           "UTIB0001234",
  },
};

export async function GET() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfBuffer = await renderToBuffer(InvoicePDF({ invoice: DEMO_INVOICE as any }) as any);

  return new NextResponse(pdfBuffer as unknown as BodyInit, {
    status:  200,
    headers: {
      "Content-Type":        "application/pdf",
      "Content-Disposition": 'inline; filename="INV-2025-043-demo.pdf"',
      "Cache-Control":       "public, max-age=3600",
    },
  });
}
