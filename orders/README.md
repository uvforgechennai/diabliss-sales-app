# Diabliss B2C Order Portal

A mobile-first order portal for Diabliss Consumer Products, served at
`lowgifoods.co.in/orders`. Customers browse the product catalog, build an
order, pay via Razorpay, and the order is logged to a Google Sheet with
email + WhatsApp notifications sent automatically via a Google Apps Script
(GAS) backend.

This portal lives in the `orders/` folder of this repository, alongside the
existing sales/field-force app at the repo root — the two are independent
and do not share code.

## Folder structure

```
orders/
├── index.html          Order form + product catalog + cart
├── confirm.html         Post-payment confirmation page
├── css/style.css
├── js/
│   ├── config.js         Site-wide config (Razorpay key, GAS URL, discount rules)
│   ├── products.js       Product catalog data
│   ├── cart.js            Cart state, totals, rendering
│   └── payment.js         Razorpay checkout + order submission
├── images/                Product images (extracted from catalog PDF)
└── gas/
    ├── Code.gs             Google Apps Script backend
    ├── appsscript.json     GAS project manifest (clasp)
    ├── .clasp.json         Links this folder to your Apps Script project
    └── .claspignore        Limits what clasp pushes to Apps Script
```

GAS deploys are automated via `.github/workflows/deploy-gas.yml` (clasp +
GitHub Actions) — see Step 2 below for the one-time setup.

## One-time setup

### 1. Create the Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a new blank spreadsheet.
2. Name it something like "Diabliss Orders DB".
3. Copy the **Sheet ID** from the URL:
   `https://docs.google.com/spreadsheets/d/`**`THIS_IS_THE_SHEET_ID`**`/edit`
4. You don't need to create the "Diabliss Orders" tab or headers manually —
   the script creates them automatically on the first order.

### 2. Deploy the GAS backend

The GAS backend deploys automatically via **clasp + GitHub Actions** on every
push to `main` that touches `orders/gas/**` — same pattern as your other
`clasp`-based projects. `orders/gas/` already contains `appsscript.json`
(the manifest), `.clasp.json` (project link), `.claspignore`, and the
workflow lives at `.github/workflows/deploy-gas.yml`.

**One-time setup** (only needed once, ever — after this, every future change
to `Code.gs` just deploys itself on push):

1. Go to [script.google.com](https://script.google.com) and create a new
   project (name it e.g. "Diabliss Orders Backend"), or reuse one you
   already created manually.
2. Open **Project Settings** (gear icon) in that project and copy the
   **Script ID**. Paste it into `orders/gas/.clasp.json`, replacing
   `TO_BE_FILLED`:
   ```json
   { "scriptId": "YOUR_SCRIPT_ID", "rootDir": "." }
   ```
3. If the project doesn't already have a Web App deployment, create the
   first one manually (only ever needed once): **Deploy → New deployment**
   → type **Web app** → Execute as **Me** → Who has access **Anyone** →
   **Deploy**. Copy the **Web App URL** (`/exec`) for Step 3 below, and the
   **Deployment ID** shown next to it (also visible any time under
   **Deploy → Manage deployments**).
4. On your local machine (wherever you already run `clasp login` for your
   other projects), run `clasp login` if you haven't for this Google
   account, then get its credentials file:
   ```bash
   cat ~/.clasprc.json
   ```
5. In this GitHub repo, go to **Settings → Secrets and variables →
   Actions** and add:
   - A **Secret** named `CLASP_CREDENTIALS` — paste the entire contents of
     `~/.clasprc.json` from step 4.
   - A **Variable** named `GAS_DEPLOYMENT_ID` — the Deployment ID from
     step 3 (not the Script ID). This makes every future deploy update the
     *same* live Web App URL instead of minting a new one.
6. At the top of `gas/Code.gs`, fill in the `CONFIG` object (`SHEET_ID` from
   Step 1, `CALLMEBOT_APIKEY` from Step 4 below), commit, and push to
   `main` — the workflow pushes the code to Apps Script and redeploys the
   existing Web App automatically.

From then on, editing `gas/Code.gs` and pushing to `main` is the entire
deploy process — no manual copy-pasting into the Apps Script editor again.

### 3. Update `GAS_URL` in `js/config.js`

Open `js/config.js` and replace:

```js
GAS_URL: 'TO_BE_UPDATED_AFTER_GAS_DEPLOYMENT',
```

with the Web App URL from step 2, e.g.:

```js
GAS_URL: 'https://script.google.com/macros/s/AKfycb.../exec',
```

Commit and push this change so it goes live.

### 4. Get a CallMeBot API key (for WhatsApp order notifications)

1. Save `+34 644 82 93 31` as a contact on the phone that should receive
   order notifications (this should be the same number as
   `CALLMEBOT_PHONE` in `Code.gs`, i.e. `+91 89398 53354`).
2. Send that contact a WhatsApp message saying exactly:
   `I allow callmebot to send me messages`
3. CallMeBot will reply with your personal API key.
4. **This repo is public**, so this key never goes into any file that gets
   committed. Instead: open the Apps Script project (script.google.com) →
   gear icon (**Project Settings**) → scroll to **Script Properties** →
   **Add script property**:
   - Property: `CALLMEBOT_APIKEY`
   - Value: the key CallMeBot sent you
   - Save. No commit, no redeploy needed — `Code.gs` reads it at runtime.

### 5. Connect this GitHub repo to Hostinger for auto-deploy

1. In Hostinger's **hPanel**, go to **Advanced → Git**.
2. Add a new repository:
   - Repository URL: this repo's GitHub URL (use an SSH/deploy key or a
     Hostinger-generated access token if the repo is private).
   - Branch: the branch you want live (e.g. `main`).
   - Install path: point it at (or symlink) the `orders/` folder to the
     document root that serves `lowgifoods.co.in/orders`, e.g.
     `public_html/orders`.
3. Enable **auto-deploy on push** so every push to the branch updates the
   live site.
4. Trigger an initial manual deploy to confirm it pulls correctly.

### 5b. Also mirror it at diabliss.in/orders

Since this repo's root also holds the unrelated field-sales app,
`orders/` is mirrored into its own dedicated repo,
[`uvforgechennai/diabliss-orders`](https://github.com/uvforgechennai/diabliss-orders),
via `.github/workflows/mirror-orders.yml` — every push to `main` that
touches `orders/**` (excluding `orders/gas/**`) auto-syncs into that
repo's `main`. Deploy **that** repo to diabliss.in instead of this one, so
none of the sales-app code ever touches diabliss.in's server:

1. In Hostinger, switch to the **diabliss.in hosting account**.
2. Go to **Advanced → Git** and add `uvforgechennai/diabliss-orders` as
   the repository, branch `main`, install path `public_html/orders`.
   Since that repo's root *is* the order-portal content, this is safe to
   deploy directly — no symlink workaround needed.
3. Enable **auto-deploy on push**, trigger an initial manual deploy, then
   visit `diabliss.in/orders` to confirm it loads (and that the rest of
   the existing `diabliss.in` site is untouched).

**One-time setup for the mirror workflow itself** (only needed once):
create a GitHub fine-grained personal access token scoped to just the
`diabliss-orders` repo with **Contents: read and write** permission, then
add it as a secret named `ORDERS_MIRROR_TOKEN` in *this* repo's
**Settings → Secrets and variables → Actions**. Continue editing
`orders/` here as usual — changes mirror over automatically after that.

### 6. Add the live domain(s) to Razorpay

Once the site is live:

1. Log in to the [Razorpay Dashboard](https://dashboard.razorpay.com).
2. Go to **Settings → API Keys / Configuration** (or **Account & Settings
   → Website/App URLs**, depending on the account type) and add
   **both** `https://lowgifoods.co.in` and `https://diabliss.in` as
   authorized domains/origins.
3. Confirm the account is live-mode enabled, since `RAZORPAY_KEY` in
   `js/config.js` is a **live** key (`rzp_live_...`), not a test key.

### 7. Fill in the Razorpay Key Secret and set up the payment webhook

Payments go through a two-step flow: the backend creates a real Razorpay
Order before checkout opens (so payments can be cryptographically verified),
and Razorpay also calls the backend directly the moment a payment captures —
a safety net independent of the customer's browser, in case their connection
drops right after paying. Both need a secret, and — same as CallMeBot above
— **neither goes into any committed file**, since this repo is public.
Both are set as Script Properties instead (Apps Script project → gear icon
→ **Project Settings** → **Script Properties** → **Add script property**):

1. **Key Secret**: Razorpay Dashboard → **Settings → API Keys** → find the
   key pair for `rzp_live_TcGmnDuZ6rGOWC` → reveal/download the **Key
   Secret**. Add a Script Property:
   - Property: `RAZORPAY_KEY_SECRET`
   - Value: the secret from Razorpay
2. **Webhook token**: pick any random secret string (or generate one, e.g.
   `openssl rand -base64 32` in a terminal). Add a Script Property:
   - Property: `RAZORPAY_WEBHOOK_TOKEN`
   - Value: your random string
3. **Webhook**: Razorpay Dashboard → **Settings → Webhooks → Add New
   Webhook**:
   - Webhook URL: your `GAS_URL` (from `js/config.js`) with
     `?token=` and that same random string appended, e.g.
     `https://script.google.com/macros/s/AKfycb.../exec?token=YOUR_RANDOM_STRING`
     (this is what stops random requests on the internet from faking a
     "payment succeeded" call to your backend — keep it secret, same as any
     password).
   - Active events: check **`payment.captured`** only.
   - Save. Razorpay will send a test ping — it's fine if the Script
     Properties aren't saved yet at that exact moment; real traffic only
     starts once you place a real order.

No commit or redeploy is needed for either of these — Script Properties take
effect immediately, independent of what's in git.

## Managing stock (marking items out of stock)

You don't need to edit any code or ask a developer to stock an item out —
it's controlled from a tab in the same Google Sheet you set up in Step 1.

1. Open your **Diabliss Orders DB** Google Sheet.
2. The first time an order comes in (or the first time anyone visits the
   site after this feature was deployed), a new tab called **"Stock
   Status"** is created automatically, pre-filled with every product and a
   checked ("in stock") checkbox.
3. To stock an item out: find its row and **uncheck the box** in the
   **In Stock** column.
4. To bring it back: **re-check the box**.

That's it — no redeploy needed for this. The site checks this sheet every
time someone loads the page; an unchecked item shows a grayed-out
"Out of Stock" badge instead of the Add button and can't be added to the
cart. If the site can't reach the sheet for any reason, it fails open
(treats everything as in stock) rather than blocking orders.

This does require the one-time clasp CI setup described in Step 2 if you
haven't done that yet — once it's in place, this feature (and any future
`Code.gs` change) deploys automatically on push.

## Managing prices (and discounts)

Like stock, prices are editable anytime from a tab in the same Google
Sheet — no code change or redeploy needed.

1. Open your **Diabliss Orders DB** Google Sheet.
2. The first time the site is loaded after this feature is deployed, a new
   tab called **"Prices"** is created automatically, pre-filled with every
   product's ID, name, MRP, and Selling Price (selling price starts equal
   to MRP, i.e. no discount shown).
3. To put a product on sale: lower its **Selling Price** below its **MRP**.
   The product card automatically shows the selling price, a
   strikethrough MRP, and a "X% OFF" badge — the percentage is calculated
   for you.
4. To remove a discount: set **Selling Price** back equal to **MRP**.
5. To change a product's MRP itself, edit the **MRP** column directly.

That's it — the site reads this sheet every time someone loads the page.
If the sheet can't be reached for any reason, it fails open (keeps
whatever prices were last loaded) rather than blocking orders. There's no
separate order-level discount rule or referral code anymore — every
discount comes from the gap between MRP and Selling Price per product,
and shipping is always free.

This does require the one-time clasp CI setup described in Step 2 if you
haven't done that yet — once it's in place, this feature (and any future
`Code.gs` change) deploys automatically on push.

## Local preview

This is a static site with no build step. Serve the `orders/` folder with
any static file server, e.g.:

```bash
cd orders
python3 -m http.server 8080
```

Then open `http://localhost:8080`. Note that Razorpay checkout and the GAS
backend calls require a real deployment (or at least `GAS_URL` configured)
to fully test the payment flow.
