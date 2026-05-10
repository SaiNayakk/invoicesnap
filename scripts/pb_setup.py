import json, urllib.request, urllib.error

BASE = "http://localhost:8090"

req = urllib.request.Request(
    f"{BASE}/api/collections/_superusers/auth-with-password",
    data=json.dumps({"identity": "saiworks@nncs.in", "password": "Sai910@2002"}).encode(),
    headers={"Content-Type": "application/json"}, method="POST"
)
with urllib.request.urlopen(req) as r:
    TOKEN = json.loads(r.read())["token"]

HDRS = {"Content-Type": "application/json", "Authorization": f"Bearer {TOKEN}"}

def api(method, path, body=None):
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(f"{BASE}{path}", data=data, headers=HDRS, method=method)
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read()), None
    except urllib.error.HTTPError as e:
        return None, json.loads(e.read())

# ── 1. Extend users collection with profile fields ───────────────────────────
res, err = api("GET", "/api/collections/users")
if err:
    print("GET users error:", err); exit(1)

users_col = res
existing_names = {f["name"] for f in users_col.get("fields", [])}

# v0.28 flat field format — no nested "options"
new_fields = [
    {"type": "text",   "name": "business_name",       "required": False, "hidden": False, "min": 0, "max": 0, "pattern": "", "autogeneratePattern": "", "presentable": False},
    {"type": "text",   "name": "logo_url",             "required": False, "hidden": False, "min": 0, "max": 0, "pattern": "", "autogeneratePattern": "", "presentable": False},
    {"type": "text",   "name": "address",              "required": False, "hidden": False, "min": 0, "max": 0, "pattern": "", "autogeneratePattern": "", "presentable": False},
    {"type": "text",   "name": "city",                 "required": False, "hidden": False, "min": 0, "max": 0, "pattern": "", "autogeneratePattern": "", "presentable": False},
    {"type": "text",   "name": "state",                "required": False, "hidden": False, "min": 0, "max": 0, "pattern": "", "autogeneratePattern": "", "presentable": False},
    {"type": "text",   "name": "pincode",              "required": False, "hidden": False, "min": 0, "max": 0, "pattern": "", "autogeneratePattern": "", "presentable": False},
    {"type": "text",   "name": "phone",                "required": False, "hidden": False, "min": 0, "max": 0, "pattern": "", "autogeneratePattern": "", "presentable": False},
    {"type": "text",   "name": "gst_number",           "required": False, "hidden": False, "min": 0, "max": 0, "pattern": "", "autogeneratePattern": "", "presentable": False},
    {"type": "text",   "name": "pan_number",           "required": False, "hidden": False, "min": 0, "max": 0, "pattern": "", "autogeneratePattern": "", "presentable": False},
    {"type": "text",   "name": "upi_id",               "required": False, "hidden": False, "min": 0, "max": 0, "pattern": "", "autogeneratePattern": "", "presentable": False},
    {"type": "text",   "name": "bank_name",            "required": False, "hidden": False, "min": 0, "max": 0, "pattern": "", "autogeneratePattern": "", "presentable": False},
    {"type": "text",   "name": "bank_account_number",  "required": False, "hidden": False, "min": 0, "max": 0, "pattern": "", "autogeneratePattern": "", "presentable": False},
    {"type": "text",   "name": "bank_ifsc",            "required": False, "hidden": False, "min": 0, "max": 0, "pattern": "", "autogeneratePattern": "", "presentable": False},
    {"type": "text",   "name": "invoice_prefix",       "required": False, "hidden": False, "min": 0, "max": 0, "pattern": "", "autogeneratePattern": "", "presentable": False},
    {"type": "number", "name": "invoice_counter",      "required": False, "hidden": False, "min": None, "max": None, "onlyInt": True, "presentable": False},
    {"type": "select", "name": "plan",                 "required": False, "hidden": False, "maxSelect": 1, "values": ["free", "pro", "business"], "presentable": False},
]

fields = users_col.get("fields", [])
for f in new_fields:
    if f["name"] not in existing_names:
        fields.append(f)

users_col["fields"] = fields
res, err = api("PATCH", f"/api/collections/{users_col['id']}", users_col)
print("users:", "ok" if not err else err)

# helper for text/number/select/relation fields
def txt(name, required=False):
    return {"type": "text", "name": name, "required": required, "hidden": False, "min": 0, "max": 0, "pattern": "", "autogeneratePattern": "", "presentable": False}

def num(name, required=False):
    return {"type": "number", "name": name, "required": required, "hidden": False, "min": None, "max": None, "onlyInt": False, "presentable": False}

def sel(name, values, required=False):
    return {"type": "select", "name": name, "required": required, "hidden": False, "maxSelect": 1, "values": values, "presentable": False}

def rel(name, col_id, required=True, cascade=False):
    return {"type": "relation", "name": name, "required": required, "hidden": False, "collectionId": col_id, "cascadeDelete": cascade, "maxSelect": 1, "minSelect": 0, "displayFields": [], "presentable": False}

def email(name, required=False):
    return {"type": "email", "name": name, "required": required, "hidden": False, "exceptDomains": [], "onlyDomains": [], "presentable": False}

USERS_ID = "_pb_users_auth_"

# ── 2. clients ───────────────────────────────────────────────────────────────
res, err = api("POST", "/api/collections", {
    "name": "clients", "type": "base",
    "fields": [
        rel("user",  USERS_ID, required=True,  cascade=True),
        txt("name",  required=True),
        txt("phone", required=True),
        email("email"),
        txt("address"), txt("city"), txt("state"), txt("pincode"),
        txt("gst_number"), txt("pan_number"), txt("notes"),
    ],
})
print("clients:", "ok" if not err else err)
clients_id = res["id"] if res else "clients"

# ── 3. invoices ──────────────────────────────────────────────────────────────
res_inv, err_inv = api("POST", "/api/collections", {
    "name": "invoices", "type": "base",
    "fields": [
        rel("user",   USERS_ID,   required=True, cascade=True),
        rel("client", clients_id, required=True, cascade=False),
        txt("invoice_number", required=True),
        sel("status", ["draft","sent","paid","overdue","cancelled"], required=True),
        txt("invoice_date", required=True),
        txt("due_date",     required=True),
        num("subtotal"), num("gst_rate"),
        num("cgst_amount"), num("sgst_amount"), num("igst_amount"), num("gst_amount"),
        num("total"),
        sel("supply_type", ["intra","inter"]),
        txt("notes"), txt("terms"), txt("pdf_url"),
        txt("razorpay_payment_link_id"), txt("razorpay_payment_link_url"),
        txt("sent_at"), txt("paid_at"),
    ],
})
print("invoices:", "ok" if not err_inv else err_inv)
invoice_id = res_inv["id"] if res_inv else "invoices"

# ── 4. invoice_items ─────────────────────────────────────────────────────────
res, err = api("POST", "/api/collections", {
    "name": "invoice_items", "type": "base",
    "fields": [
        rel("invoice", invoice_id, required=True, cascade=True),
        txt("description", required=True),
        txt("hsn_sac"),
        num("quantity", required=True),
        num("rate",     required=True),
        num("amount",   required=True),
        num("sort_order"),
    ],
})
print("invoice_items:", "ok" if not err else err)
print("\nAll done!")
