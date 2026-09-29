# InvoiceSnap

GST invoices sent on WhatsApp with a UPI payment page, for freelancers and small businesses in India.

- **Draft from a message.** "Bill Brewline for 2 reel shoots at 6.5k each, GST 18, due in a week" becomes a draft invoice. Every number is checked against the message; totals and the CGST/SGST or IGST split are computed in code.
- **Payment predictions.** A per-client model of when each invoice will be paid, and a logistic regression for late-payment risk. Backtested: 28% less error than assuming clients pay on the due date.
- **Cash-flow forecast.** 500 simulated futures per open invoice set, with weekly ranges.
- **Reminders.** Tone chosen in code from how late it is; wording by the model, checked before it's shown; sent through WhatsApp click-to-chat.
- **Live demo.** Each visitor gets a private account with a year of invoices, a phone showing the WhatsApp side, and a fast-forward control.

The write-up with diagrams is at `/demo/technical`.

## Run locally

Needs the local PocketBase and the SaiWorks AI service (`../saiworks-dev`, `../saiworks-assistant`).

```bash
python scripts/pb_migrate.py --env ../saiworks-dev/.env --rules   # schema, additive and idempotent
npm install
npm run dev                                                         # http://localhost:3002
```

`.env.development.local` (gitignored) overrides `.env.local`. See `.env.local.example` for the variables.

## Tests and evaluation

```bash
npm test                                            # models, GST rules, draft building
node --experimental-strip-types scripts/evaluate.ts # every figure quoted in the write-up
```

## Layout

- `src/lib/ai/payments.ts`: payment-date model, late-risk regression, backtest, forecast
- `src/lib/ai/draft.ts`: turns a checked extraction into a builder draft (client matching, terms)
- `src/lib/ai/reminders.ts`, `brief.ts`: tone selection, facts and templates for the language model
- `src/lib/gst.ts`: GSTIN validation, tax split, totals
- `src/lib/demo/`: simulator, sandbox creation and cleanup, fast-forward
- `scripts/pb_migrate.py`: schema (credentials from the environment only)
