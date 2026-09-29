"""InvoiceSnap PocketBase schema: idempotent and additive.

Creates missing collections, adds missing fields, indexes and select options.
It never drops or renames anything, so it's safe to re-run against production.

    python scripts/pb_migrate.py --env ../saiworks-dev/.env     # PB_URL / PB_ADMIN_EMAIL / PB_ADMIN_PASSWORD
    python scripts/pb_migrate.py --env ... --rules              # also overwrite API rules to match this file

Credentials come from the environment only. (An earlier setup script had the
superuser password written into it; that script is gone and the password must
be rotated.)
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request

USERS = "_pb_users_auth_"
MINE = "user = @request.auth.id"


def text(name, required=False, max_len=0):
    return {"type": "text", "name": name, "required": required, "max": max_len}


def number(name, required=False, only_int=False):
    return {"type": "number", "name": name, "required": required, "onlyInt": only_int}


def boolean(name):
    return {"type": "bool", "name": name}


def date(name, required=False):
    return {"type": "date", "name": name, "required": required}


def email(name):
    return {"type": "email", "name": name}


def select(name, values, required=False):
    return {"type": "select", "name": name, "values": values, "maxSelect": 1, "required": required}


def relation(name, collection, required=False, cascade=False):
    return {"type": "relation", "name": name, "collectionId": collection, "required": required,
            "cascadeDelete": cascade, "maxSelect": 1}


def jsonf(name):
    return {"type": "json", "name": name, "maxSize": 200_000}


def autodate(name, on_update):
    return {"type": "autodate", "name": name, "onCreate": True, "onUpdate": on_update}


OWN = {"list": MINE, "view": MINE, "create": f"@request.auth.id != '' && {MINE}", "update": MINE, "delete": MINE}
SERVER_ONLY = {"list": None, "view": None, "create": None, "update": None, "delete": None}

# The shared SaiWorks `users` collection carries the invoicing profile. Users may edit their
# own profile but not their plan (that would be a free upgrade).
USERS_SPEC = {
    "name": "users",
    "auth": True,
    "rules": {"update": "id = @request.auth.id && @request.body.plan:isset = false"},
    "fields": [
        text("business_name", max_len=80), text("logo_url"), text("address", max_len=200), text("city", max_len=60),
        text("state", max_len=60), text("pincode", max_len=10), text("phone", max_len=20),
        text("gst_number", max_len=15), text("pan_number", max_len=10), text("upi_id", max_len=60),
        text("bank_name", max_len=60), text("bank_account_number", max_len=30), text("bank_ifsc", max_len=11),
        text("invoice_prefix", max_len=10), number("invoice_counter", only_int=True),
        number("default_due_days", only_int=True),
        select("plan", ["free", "pro", "business"]),
    ],
}

COLLECTIONS = [
    {
        "name": "clients",
        "rules": OWN,
        "fields": [
            relation("user", USERS, required=True, cascade=True),
            text("name", required=True, max_len=80),
            text("phone", max_len=20),
            email("email"),
            text("address", max_len=200), text("city", max_len=60), text("state", max_len=60), text("pincode", max_len=10),
            text("gst_number", max_len=15), text("pan_number", max_len=10), text("notes", max_len=500),
            select("source", ["manual", "simulated", "ai"]),
        ],
        "indexes": ["CREATE INDEX idx_clients_user ON clients (user)"],
    },
    {
        "name": "invoices",
        "rules": OWN,
        "fields": [
            relation("user", USERS, required=True, cascade=True),
            relation("client", "clients", required=True, cascade=True),
            text("invoice_number", required=True, max_len=40),
            select("status", ["draft", "sent", "payment_pending", "paid", "overdue", "cancelled"], required=True),
            text("invoice_date", required=True),
            text("due_date", required=True),
            number("subtotal"), number("gst_rate"),
            number("cgst_amount"), number("sgst_amount"), number("igst_amount"), number("gst_amount"),
            number("total"),
            select("supply_type", ["intra", "inter"]),
            text("notes", max_len=500), text("terms", max_len=500), text("pdf_url"),
            text("razorpay_payment_link_id"), text("razorpay_payment_link_url"),
            text("sent_at"), text("paid_at"),
            # When the client tapped "I've paid" (the owner still confirms).
            text("claimed_at"),
            number("reminder_count", only_int=True),
            text("last_reminder_at"),
            select("source", ["manual", "simulated", "ai"]),
        ],
        "indexes": ["CREATE INDEX idx_invoices_user_date ON invoices (user, invoice_date)"],
    },
    {
        "name": "invoice_items",
        "rules": {k: "invoice.user = @request.auth.id" for k in ("list", "view", "create", "update", "delete")},
        "fields": [
            relation("invoice", "invoices", required=True, cascade=True),
            text("description", required=True, max_len=120),
            text("hsn_sac", max_len=10),
            number("quantity", required=True),
            number("rate", required=True),
            number("amount", required=True),
            number("sort_order", only_int=True),
        ],
    },
    {
        # Everything sent to a client (invoice, reminder, thank-you). Written by the server.
        "name": "invoice_messages",
        "rules": {"list": MINE, "view": MINE, "create": None, "update": None, "delete": None},
        "fields": [
            relation("user", USERS, required=True, cascade=True),
            relation("client", "clients", required=True, cascade=True),
            relation("invoice", "invoices", cascade=True),
            select("kind", ["invoice", "reminder", "thank_you", "client_reply"], required=True),
            select("channel", ["whatsapp_link", "whatsapp_api", "demo"]),
            text("body", required=True, max_len=2000),
            text("tone", max_len=20),
            boolean("ai_written"),
            # When it was sent. Usually equals `created`; demo sandboxes shift it when time is fast-forwarded.
            text("at"),
        ],
        "indexes": ["CREATE INDEX idx_invoice_messages_user ON invoice_messages (user, client)"],
    },
    {
        # Cached weekly money summaries. Written by the server only.
        "name": "invoice_briefs",
        "rules": {"list": MINE, "view": MINE, "create": None, "update": None, "delete": None},
        "fields": [
            relation("user", USERS, required=True, cascade=True),
            text("key", required=True, max_len=40),
            jsonf("content"),
        ],
        "indexes": ["CREATE UNIQUE INDEX idx_invoice_briefs_user_key ON invoice_briefs (user, `key`)"],
    },
    {
        # Live demo sandboxes. Server only.
        "name": "invoice_demo_sessions",
        "rules": SERVER_ONLY,
        "fields": [
            text("ip_hash", required=True, max_len=64),
            relation("user_id", USERS, cascade=True),
            date("expires_at", required=True),
            boolean("claimed"),
            number("days_forwarded", only_int=True),
            jsonf("sim"),
        ],
    },
]


class PB:
    def __init__(self, url: str, email_: str, password: str):
        self.url = url.rstrip("/")
        self.token = None
        self.token = self.call("POST", "/api/collections/_superusers/auth-with-password",
                               {"identity": email_, "password": password})["token"]

    def call(self, method, path, body=None):
        req = urllib.request.Request(
            self.url + path,
            data=json.dumps(body).encode() if body is not None else None,
            method=method,
            # Cloudflare blocks Python's default user agent.
            headers={"Content-Type": "application/json", "User-Agent": "Mozilla/5.0 saiworks-migrate",
                     **({"Authorization": self.token} if self.token else {})},
        )
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                raw = r.read()
                return json.loads(raw) if raw else {}
        except urllib.error.HTTPError as e:
            raise SystemExit(f"{method} {path} -> {e.code}: {e.read().decode()[:500]}")


def resolve(field: dict, ids: dict) -> dict:
    f = dict(field)
    if f["type"] == "relation" and f["collectionId"] in ids:
        f["collectionId"] = ids[f["collectionId"]]
    return f


def merge_fields(current: list[dict], wanted: list[dict]) -> tuple[list[dict], list[str]]:
    """Append missing fields; widen select options on existing ones. Never removes anything."""
    by_name = {f["name"]: dict(f) for f in current}
    changes = []
    for f in wanted:
        have = by_name.get(f["name"])
        if not have:
            by_name[f["name"]] = f
            changes.append(f["name"])
        elif f["type"] == "select" and have.get("type") == "select":
            extra = [v for v in f["values"] if v not in have.get("values", [])]
            if extra:
                have["values"] = have.get("values", []) + extra
                by_name[f["name"]] = have
                changes.append(f"{f['name']}(+{','.join(extra)})")
    order = [f["name"] for f in current] + [f["name"] for f in wanted if f["name"] not in {c["name"] for c in current}]
    return [by_name[n] for n in order], changes


def apply(pb: PB, overwrite_rules: bool) -> None:
    existing = {c["name"]: c for c in pb.call("GET", "/api/collections?perPage=500")["items"]}
    ids = {name: c["id"] for name, c in existing.items()}

    users = existing["users"]
    fields, changes = merge_fields(users["fields"], USERS_SPEC["fields"])
    patch = {"fields": fields} if changes else {}
    if overwrite_rules:
        patch["updateRule"] = USERS_SPEC["rules"]["update"]
    if patch:
        pb.call("PATCH", f"/api/collections/{users['id']}", patch)
    print(f"~ users: {', '.join(changes) or 'no new fields'}{'; rules synced' if overwrite_rules else ''}")

    for spec in COLLECTIONS:
        name = spec["name"]
        rules = {f"{k}Rule": v for k, v in spec["rules"].items()}
        wanted = [resolve(f, ids) for f in spec["fields"]]
        declared = {f["name"] for f in wanted}
        # API-created collections don't get created/updated automatically; the app sorts by them.
        wanted += [autodate(n, on_update=(n == "updated")) for n in ("created", "updated") if n not in declared]

        if name not in existing:
            created = pb.call("POST", "/api/collections", {
                "name": name, "type": "base", "fields": wanted, "indexes": spec.get("indexes", []), **rules,
            })
            ids[name] = created["id"]
            print(f"+ {name}: created ({len(wanted)} fields)")
            continue

        current = existing[name]
        fields, changes = merge_fields(current["fields"], wanted)
        have_idx = {i.split(" ON ")[0].split()[-1] for i in current.get("indexes", [])}
        new_idx = [i for i in spec.get("indexes", []) if i.split(" ON ")[0].split()[-1] not in have_idx]
        patch = {}
        if changes:
            patch["fields"] = fields
        if new_idx:
            patch["indexes"] = current.get("indexes", []) + new_idx
        if overwrite_rules:
            patch.update(rules)
        if patch:
            pb.call("PATCH", f"/api/collections/{current['id']}", patch)
        print(f"~ {name}: {', '.join(changes) or 'no new fields'}{'; +indexes' if new_idx else ''}"
              f"{'; rules synced' if overwrite_rules else ''}")


def enable_batch(pb: PB) -> None:
    """Demo sandboxes seed a year of invoices; the batch API makes that one request per 100 records."""
    current = pb.call("GET", "/api/settings").get("batch", {})
    if current.get("enabled") and current.get("maxRequests", 0) >= 100:
        print("= batch API already enabled")
        return
    pb.call("PATCH", "/api/settings", {"batch": {**current, "enabled": True, "maxRequests": 100, "timeout": 10}})
    print("~ settings: batch API enabled (maxRequests=100)")


def load_env_file(path: str) -> None:
    for line in open(path, encoding="utf-8").read().splitlines():
        if "=" in line and not line.lstrip().startswith("#"):
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--env", help="file with PB_URL / PB_ADMIN_EMAIL / PB_ADMIN_PASSWORD")
    ap.add_argument("--rules", action="store_true", help="overwrite API rules to match this file")
    args = ap.parse_args()
    if args.env:
        load_env_file(args.env)
    missing = [k for k in ("PB_URL", "PB_ADMIN_EMAIL", "PB_ADMIN_PASSWORD") if not os.environ.get(k)]
    if missing:
        sys.exit(f"Missing env: {', '.join(missing)}")
    print(f"Migrating {os.environ['PB_URL']}")
    pb = PB(os.environ["PB_URL"], os.environ["PB_ADMIN_EMAIL"], os.environ["PB_ADMIN_PASSWORD"])
    apply(pb, args.rules)
    enable_batch(pb)
