# Payment Integration (Stripe + VNPAY Sandbox)

This document summarizes the complete coin top-up flow implemented for both Stripe Checkout and VNPAY sandbox.

## Exchange Rate
- Fixed: **1,000 VND = 10 xu** (equivalent to 1 xu = 100 VND).
- Backend automatically converts requested xu → VND and validates that xu is a multiple of 10.

## Backend API
| Endpoint | Method | Description |
| --- | --- | --- |
| `/api/payments/create` | POST (auth) | Validate coin amount, create `Transaction`, build Stripe Checkout Session or VNPAY URL, return redirect link + `transactionId`. |
| `/api/payments/confirm` | POST (auth) | Called from the payment return page to finalize the transaction. When `STRIPE_WEBHOOK_SECRET` is missing, the backend retrieves the Checkout Session directly from Stripe. VNPAY uses the signed query params. |
| `/api/payments/webhook/stripe` | POST | Optional Stripe webhook (only verified when `STRIPE_WEBHOOK_SECRET` is provided). |
| `/api/payments/transactions` | GET (admin) | Returns summary + latest top-up transactions for the admin dashboard. |

Supporting files:
- `controllers/paymentController.js`
- `services/stripeService.js`
- `services/vnpayService.js`
- `models/Transaction.js` (extended metadata)

## Frontend Pages
| Route | Description |
| --- | --- |
| `/me/topup` | Authenticated payment page where the user selects xu amount, provider, and sees the sandbox warning. |
| `/payments/payment-return` | Shared result page. Reads Stripe/VNPAY query params, calls `/api/payments/confirm`, and displays success/failure. |
| `/admin/dashboard` | Admin-only dashboard showing total revenue and recent transactions. |

## Environment Variables
Backend (`backend/.env` / `.env.example`):
- `STRIPE_SECRET_KEY` – required.
- `STRIPE_WEBHOOK_SECRET` – optional. If empty, backend falls back to calling Stripe API on the return flow.
- `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET`, `VNPAY_RETURN_URL`, `VNPAY_API_URL` – required for VNPAY sandbox. Signature verification relies on `VNPAY_HASH_SECRET` so no extra API call is needed.
- `PAYMENTS_WEBHOOK_PATH` (optional) – route prefix if you later proxy webhooks.

Frontend (`frontend2/.env.example`):
- `NEXT_PUBLIC_PAYMENT_RETURN_URL` – must match `VNPAY_RETURN_URL` (default `http://localhost:3000/payments/payment-return`). Both Stripe success/cancel and VNPAY return redirect here.
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` – Stripe test publishable key used by future Stripe.js flows.

## Testing Checklist
1. **Install deps**
   ```bash
   cd backend && npm install
   cd ../frontend2 && npm install
   ```
2. **Start backend + frontend** (two terminals) and ensure MongoDB is running.
3. **Stripe sandbox**
   - Set `STRIPE_SECRET_KEY` with a `sk_test_*` key.
   - Optionally run `ngrok http 5000` and configure the public URL in Stripe Dashboard → Webhooks → `https://<ngrok>/api/payments/webhook/stripe`.
   - Without `STRIPE_WEBHOOK_SECRET`, the `/payments/payment-return` page will trigger server-side confirmation automatically.
4. **VNPAY sandbox**
   - Ensure `VNPAY_HASH_SECRET` matches the sandbox portal.
   - Configure the return URL in the VNPAY portal to `http://localhost:3000/payments/payment-return` (or your deployed equivalent).
   - After paying on the VNPAY page, you will be redirected back with signed query params…the frontend sends them to `/api/payments/confirm` for verification.
5. **Admin dashboard**
   - Set any user to `role: "admin"` in MongoDB to view `/admin/dashboard`.
   - Confirm that totals update after successful payments.

## Notes & Edge Cases
- Stripe fallback confirmation is automatically used when `STRIPE_WEBHOOK_SECRET` is blank. Add the secret + configure webhook to switch to verified webhooks.
- VNPAY signatures are mandatory. If the signature is missing or invalid, the transaction is marked `failed` and the API returns HTTP 400.
- Duplicate callbacks / repeated confirmations are idempotent: once a transaction is marked `success`, subsequent confirmations simply return the latest balance.
- Notifications (`type: "topup"`) are pushed to the user after each successful credit.
- Admin endpoint is protected by the new `role` field on `User` documents.
