/**
 * A year of invoicing for a small Bengaluru design and video studio, so the
 * live demo (and the tests) have realistic history to learn from.
 *
 * Every client has hidden payment habits: a typical delay, how much it varies,
 * and how often a payment slips badly. Bigger-than-usual invoices come in
 * later. The models never see these parameters, only the resulting dates, and
 * the demo's fast-forward keeps drawing from the same habits so predictions
 * can be checked against what happens next.
 */

import { addDays, daysBetween } from "../dates.ts";
import { gstinCheckChar } from "../gst.ts";

export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
type R = () => number;

function normal(r: R): number {
  return Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
}

/** A fictional but checksum-valid GSTIN for a state code. */
export function fakeGstin(state: string, pan: string): string {
  const first = `${state}${pan}1Z`;
  return first + gstinCheckChar(first);
}

export interface Habit {
  delay: number; // typical days after the due date
  spread: number;
  slip: number; // chance of an extra 2 to 4 weeks
}

export interface SimClient {
  key: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  gst_number: string;
  terms: number; // days
  perMonth: number;
  services: { description: string; hsn: string; rate: [number, number]; qty?: [number, number] }[];
  habit: Habit;
  since: number; // months ago they became a client (0 = new this month)
}

export const DEMO_BUSINESS = {
  business_name: "Northlight Studio",
  name: "Kavya Rao",
  address: "2nd Floor, 14 Church Street",
  city: "Bengaluru",
  state: "Karnataka",
  pincode: "560001",
  phone: "9845012345",
  gst_number: fakeGstin("29", "AAQFN4821K"),
  upi_id: "northlight@okaxis",
  invoice_prefix: "NLS",
  default_due_days: 15,
};

export const DEMO_CLIENTS: SimClient[] = [
  { key: "brewline", name: "Brewline Coffee", phone: "9880011223", email: "accounts@brewline.example", city: "Bengaluru", state: "Karnataka",
    gst_number: fakeGstin("29", "AABCB7710Q"), terms: 7, perMonth: 1.5, since: 12,
    services: [{ description: "Social media retainer", hsn: "998361", rate: [18000, 18000] }, { description: "Reel shoot", hsn: "999612", rate: [6500, 6500], qty: [1, 3] }],
    habit: { delay: -1, spread: 2, slip: 0.02 } },
  { key: "vikram", name: "Vikram Events", phone: "9848022334", email: "vikram@vikramevents.example", city: "Hyderabad", state: "Telangana",
    gst_number: fakeGstin("36", "AAGFV3345M"), terms: 15, perMonth: 1, since: 11,
    services: [{ description: "Event photography", hsn: "998383", rate: [35000, 60000] }, { description: "Highlight film", hsn: "999612", rate: [22000, 30000] }],
    habit: { delay: 13, spread: 7, slip: 0.2 } },
  { key: "meera", name: "Meera Tutoring", phone: "9900133445", email: "meera.tutoring@example.com", city: "Bengaluru", state: "Karnataka",
    gst_number: "", terms: 7, perMonth: 1.5, since: 10,
    services: [{ description: "Course poster design", hsn: "998391", rate: [2500, 3500], qty: [2, 3] }],
    habit: { delay: 5, spread: 5, slip: 0.15 } },
  { key: "arjun", name: "Arjun Nair Design", phone: "9945044556", email: "arjun@arjunnair.example", city: "Bengaluru", state: "Karnataka",
    gst_number: fakeGstin("29", "BKXPN6621D"), terms: 15, perMonth: 1.2, since: 12,
    services: [{ description: "Motion graphics, subcontract", hsn: "998391", rate: [20000, 34000] }],
    habit: { delay: 0, spread: 2, slip: 0.03 } },
  { key: "greenleaf", name: "Greenleaf Organics", phone: "9841055667", email: "marketing@greenleaf.example", city: "Chennai", state: "Tamil Nadu",
    gst_number: fakeGstin("33", "AADCG9913R"), terms: 30, perMonth: 0.5, since: 12,
    services: [{ description: "Campaign shoot and edit", hsn: "999612", rate: [55000, 75000] }],
    habit: { delay: 19, spread: 9, slip: 0.25 } },
  { key: "sneha", name: "Sneha Reddy", phone: "9731066778", email: "sneha.reddy@example.com", city: "Bengaluru", state: "Karnataka",
    gst_number: "", terms: 7, perMonth: 0.4, since: 9,
    services: [{ description: "Wedding album design", hsn: "998391", rate: [14000, 22000] }, { description: "Photo retouching", hsn: "998391", rate: [300, 300], qty: [20, 60] }],
    habit: { delay: 2, spread: 3, slip: 0.05 } },
  { key: "hoppers", name: "Hoppers Kitchen", phone: "9847077889", email: "hello@hopperskitchen.example", city: "Kochi", state: "Kerala",
    gst_number: fakeGstin("32", "AAHFH2277L"), terms: 15, perMonth: 0.8, since: 8,
    services: [{ description: "Menu photography", hsn: "998383", rate: [22000, 28000] }],
    habit: { delay: 8, spread: 6, slip: 0.12 } },
  { key: "urbannest", name: "UrbanNest Realty", phone: "9886088990", email: "projects@urbannest.example", city: "Bengaluru", state: "Karnataka",
    gst_number: fakeGstin("29", "AACCU4450N"), terms: 30, perMonth: 0.6, since: 7,
    services: [{ description: "Property walkthrough video", hsn: "999612", rate: [35000, 48000] }],
    habit: { delay: 22, spread: 10, slip: 0.3 } },
  { key: "fitfuel", name: "FitFuel Gym", phone: "9900199001", email: "owner@fitfuel.example", city: "Bengaluru", state: "Karnataka",
    gst_number: fakeGstin("29", "ABHFF1180P"), terms: 7, perMonth: 1, since: 6,
    services: [{ description: "Monthly content package", hsn: "998361", rate: [15000, 15000] }],
    habit: { delay: 3, spread: 3, slip: 0.06 } },
  { key: "priya", name: "Priya Menon", phone: "9845100112", email: "priya.menon@example.com", city: "Bengaluru", state: "Karnataka",
    gst_number: "", terms: 7, perMonth: 0.4, since: 5,
    services: [{ description: "Portrait session", hsn: "998383", rate: [8000, 12000] }],
    habit: { delay: 1, spread: 2, slip: 0.03 } },
  { key: "deepa", name: "Deepa Krishnan", phone: "9741111223", email: "deepa.k@example.com", city: "Mysuru", state: "Karnataka",
    gst_number: "", terms: 15, perMonth: 0.5, since: 4,
    services: [{ description: "Logo and brand kit", hsn: "998391", rate: [12000, 18000] }],
    habit: { delay: 4, spread: 4, slip: 0.1 } },
  { key: "kaveri", name: "Kaveri Dental Clinic", phone: "9845133445", email: "admin@kaveridental.example", city: "Bengaluru", state: "Karnataka",
    gst_number: fakeGstin("29", "AAJFK5521H"), terms: 15, perMonth: 1, since: 9,
    services: [{ description: "Patient education videos", hsn: "999612", rate: [12000, 16000] }],
    habit: { delay: 9, spread: 5, slip: 0.1 } },
  { key: "lotus", name: "Lotus Yoga Studio", phone: "9731144556", email: "hello@lotusyoga.example", city: "Bengaluru", state: "Karnataka",
    gst_number: "", terms: 7, perMonth: 1, since: 8,
    services: [{ description: "Class schedule creatives", hsn: "998391", rate: [4000, 6000] }],
    habit: { delay: -2, spread: 2, slip: 0.02 } },
  { key: "rohit", name: "Rohit Kumar", phone: "9880122334", email: "rohit.kumar@example.com", city: "Bengaluru", state: "Karnataka",
    gst_number: "", terms: 15, perMonth: 1, since: 0,
    services: [{ description: "Product photography", hsn: "998383", rate: [16000, 16000] }],
    habit: { delay: 6, spread: 5, slip: 0.1 } },
];

/** Draw a payment delay from a client's hidden habit. Bigger invoices than usual come in later. */
export function drawDelay(h: Habit, r: R, sizeRatio = 1, terms = 15): number {
  let d = h.delay + h.spread * normal(r);
  if (r() < h.slip) d += 14 + r() * 14;
  if (sizeRatio > 1.3) d += 4 * (sizeRatio - 1);
  return Math.max(-(terms - 1), Math.round(d));
}

export interface SimInvoice {
  client: string; // key
  invoice_date: string;
  due_date: string;
  items: { description: string; hsn_sac: string; quantity: number; rate: number }[];
  gst_rate: number;
  paid_on: string | null; // null = not paid by `today`
  sent_hour: number;
}

export function simulateHistory(opts: { today: string; months?: number; seed: number; clients?: SimClient[] }): SimInvoice[] {
  const { today, months = 12, seed, clients = DEMO_CLIENTS } = opts;
  const r = rng(seed);
  const out: SimInvoice[] = [];
  const start = addDays(today, -months * 30);
  for (const c of clients) {
    const from = c.since === 0 ? addDays(today, -12) : addDays(today, -Math.min(months, c.since) * 30);
    const meanGap = 30 / c.perMonth;
    let date = addDays(from < start ? start : from, Math.floor(r() * Math.min(meanGap, 20)));
    const amounts: number[] = [];
    while (date <= today) {
      const svc = c.services[Math.floor(r() * c.services.length)];
      const q = svc.qty ? svc.qty[0] + Math.floor(r() * (svc.qty[1] - svc.qty[0] + 1)) : 1;
      const rate = Math.round((svc.rate[0] + r() * (svc.rate[1] - svc.rate[0])) / 500) * 500 || svc.rate[0];
      const items = [{ description: svc.description, hsn_sac: svc.hsn, quantity: q, rate }];
      const total = q * rate;
      const usual = amounts.length ? amounts.slice().sort((a, b) => a - b)[Math.floor(amounts.length / 2)] : total;
      amounts.push(total);
      const due = addDays(date, c.terms);
      const paid = addDays(due, drawDelay(c.habit, r, total / usual, c.terms));
      out.push({
        client: c.key, invoice_date: date, due_date: due, items, gst_rate: c.gst_number ? 18 : 0,
        paid_on: paid <= today ? (paid < date ? date : paid) : null, sent_hour: 9 + Math.floor(r() * 10),
      });
      // Retainers are regular; project work is lumpy.
      const gap = c.perMonth >= 1 ? 30 / c.perMonth + Math.round(normal(r) * 2) : -Math.log(1 - r()) * meanGap;
      date = addDays(date, Math.max(5, Math.round(gap)));
    }
  }
  return out.sort((a, b) => (a.invoice_date < b.invoice_date ? -1 : 1));
}

/** Would an open invoice get paid within the next `days`? Draws from the same habits, conditioned on it being unpaid so far. */
export function drawPaymentDay(h: Habit, due: string, today: string, r: R, sizeRatio = 1, terms = 15): string {
  const soFar = daysBetween(due, today);
  for (let i = 0; i < 40; i++) {
    const d = drawDelay(h, r, sizeRatio, terms);
    if (d > soFar) return addDays(due, d);
  }
  return addDays(today, 3 + Math.floor(r() * 12)); // later than the habit suggests: soon-ish
}
