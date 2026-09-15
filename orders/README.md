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
└── gas/Code.gs             Google Apps Script backend (deploy separately)
```

## One-time setup

### 1. Create the Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a new blank spreadsheet.
2. Name it something like "Diabliss Orders DB".
3. Copy the **Sheet ID** from the URL:
   `https://docs.google.com/spreadsheets/d/`**`THIS_IS_THE_SHEET_ID`**`/edit`
4. You don't need to create the "Diabliss Orders" tab or headers manually —
   the script creates them automatically on the first order.

### 2. Deploy the GAS backend

1. Go to [script.google.com](https://script.google.com) and create a new project.
2. Delete the default `Code.gs` content and paste in the contents of
   [`gas/Code.gs`](gas/Code.gs) from this repo.
3. At the top of the script, fill in the `CONFIG` object:
   - `SHEET_ID`: the Sheet ID from step 1.
   - `CALLMEBOT_APIKEY`: see step 4 below.
4. Click **Deploy → New deployment**.
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Click **Deploy**, authorize the requested permissions, and copy the
   **Web App URL** it gives you (ends in `/exec`).

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
4. Paste that key into `CALLMEBOT_APIKEY` in `gas/Code.gs` (in the Apps
   Script editor) and re-deploy (**Deploy → Manage deployments → Edit →
   New version → Deploy**).

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

### 6. Add the live domain to Razorpay

Once `lowgifoods.co.in/orders` is live:

1. Log in to the [Razorpay Dashboard](https://dashboard.razorpay.com).
2. Go to **Settings → API Keys / Configuration** (or **Account & Settings
   → Website/App URLs**, depending on the account type) and add
   `https://lowgifoods.co.in` as an authorized domain/origin.
3. Confirm the account is live-mode enabled, since `RAZORPAY_KEY` in
   `js/config.js` is a **live** key (`rzp_live_...`), not a test key.

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

This does require the one-time GAS redeploy described in Step 2 if you set
up the backend before this feature existed — in the Apps Script editor,
replace the code with the latest `gas/Code.gs` from this repo, then
**Deploy → Manage deployments → Edit → New version → Deploy**.

## Discount logic

- Orders under ₹300: no discount.
- Orders ₹300 and above: 5% discount by default.
- URL query param `?ref=vip10` / `?ref=vip15` / `?ref=vip20` overrides the
  default and applies a flat 10% / 15% / 20% discount regardless of order
  value.
- Shipping is always free.
- No coupon/discount code entry is shown anywhere in the UI — discounts are
  applied silently based on order value or the `ref` URL parameter.

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
