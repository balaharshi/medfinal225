# Feature Plan: Customer Wallet + Referral Program

> **Status: Implemented** (July 23, 2026)
>
> Backend fully implemented. See deviations from plan noted inline below.

## Overview

Two connected features: a **customer wallet** stores credit balance used to pay for bookings, and a **referral program** rewards users with wallet credit when they bring new customers.

---

## 1. Customer Wallet System

### Concept

Every customer gets a wallet on registration. Wallet balance can be used to partially or fully pay for bookings. Balance comes from: referral rewards, refunds, or manual admin credits.

### Database

```sql
-- New table
wallets
  id            VARCHAR PRIMARY KEY          -- 'wal_xxx'
  user_id       VARCHAR UNIQUE FK→users
  balance       DECIMAL(10,2) DEFAULT 0.00
  currency      VARCHAR(3) DEFAULT 'AED'
  created_at    TIMESTAMP
  updated_at    TIMESTAMP

wallet_transactions
  id              VARCHAR PRIMARY KEY       -- 'wtx_xxx'
  wallet_id       VARCHAR FK→wallets
  type            ENUM('credit','debit')     -- credit=added, debit=subtracted
  amount          DECIMAL(10,2)
  balance_before  DECIMAL(10,2)
  balance_after   DECIMAL(10,2)
  description     TEXT                       -- 'Referral reward from John', 'Payment for booking #bok_xxx'
  reference_type  VARCHAR NULL               -- 'booking', 'referral', 'admin_adjustment'
  reference_id    VARCHAR NULL               -- booking.id, referral.id, etc.
  created_at      TIMESTAMP
```

```sql
-- Existing bookings table — add column
ALTER TABLE bookings ADD COLUMN wallet_amount DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE bookings ADD COLUMN wallet_transaction_id VARCHAR NULL;
```

### API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/wallet` | customer | Get balance + recent transactions |
| GET | `/api/wallet/transactions` | customer | Paginated transaction history |
| POST | `/api/wallet/top-up` | admin | Manually credit a user's wallet |
| POST | `/api/wallet/deduct` | admin | Manually debit a user's wallet |

### Booking Flow Change

When creating a booking (`POST /api/bookings`), the request body accepts an optional `wallet_amount` field:
- If `wallet_amount >= price`: booking is fully paid via wallet → `payment_status = 'Paid'`, `paid_at = now()`
- If `0 < wallet_amount < price`: balance charged to wallet, remainder via ENBDpay as usual
- If `wallet_amount = 0` or omitted: existing flow, no change

On cancellation: refunded amount goes back to wallet credit (not original payment method, to keep things simple initially).

### Frontend

- **Profile modal**: show wallet balance with clickable "Transactions" link
- **Transaction history page**: list of credits/debits with date, description, amount
- **Booking modal**: show wallet balance at checkout; add input "Use wallet credit (AED)" defaulting to min(balance, price); update remaining amount in real time
- **Admin dashboard**: wallet management section — search user, view balance, add/deduct funds

---

## 2. Referral Program

### Concept

Every customer gets a unique referral code + shareable link. When a new customer uses that code and completes their first booking, the referrer gets wallet credit and the friend gets a discount.

### Reward Structure

| Party | Reward | Type |
|-------|--------|------|
| Friend (new customer) | AED 25 off first booking | Discount applied at checkout |
| Referrer (existing customer) | AED 25 wallet credit | Credited 7 days after friend's booking (vesting period) |

### Database

```sql
referral_codes
  id            VARCHAR PRIMARY KEY          -- 'refc_xxx'
  user_id       VARCHAR FK→users
  code          VARCHAR(20) UNIQUE           -- e.g. 'VARUN25'
  times_used    INT DEFAULT 0
  max_uses      INT NULL                     -- NULL = unlimited
  active        BOOL DEFAULT true
  created_at    TIMESTAMP
  updated_at    TIMESTAMP

referrals
  id                  VARCHAR PRIMARY KEY    -- 'ref_xxx'
  referrer_id         VARCHAR FK→users
  referred_email      VARCHAR NULL           -- email of invited person
  referred_user_id    VARCHAR FK→users NULL  -- set when they register
  referral_code_id    VARCHAR FK→referral_codes
  status              ENUM('pending','completed','expired','revoked') DEFAULT 'pending'
  referrer_reward     DECIMAL(10,2) DEFAULT 25.00
  referrer_reward_status ENUM('pending','vested','paid') DEFAULT 'pending'
  friend_discount     DECIMAL(10,2) DEFAULT 25.00
  friend_booking_id   VARCHAR FK→bookings NULL
  created_at          TIMESTAMP
  vested_at           TIMESTAMP NULL
  expires_at          TIMESTAMP NULL         -- NULL = 90 days from creation
```

### API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/referral/code` | customer | Get own referral code + share link |
| POST | `/api/referral/code/generate` | customer | Generate a new code (if none exists) |
| GET | `/api/referral/stats` | customer | Invites sent, completed, rewards earned |
| GET | `/api/referral/history` | customer | List of referrals with status |
| POST | `/api/referral/apply` | customer | Apply referral code at checkout |
| POST | `/api/referral/invite` | customer | Send invite via email/phone (optional) |
| GET | `/api/referral/admin/all` | admin | All referrals, rewards summary |
| POST | `/api/referral/admin/reward` | admin | Manual reward adjustment |

### Referral Code Generation

- On first visit to referral page, if no code exists, auto-generate: `FIRST_NAME_XX` (uppercase first 5 letters of name + 2 random digits)
- User can regenerate once (old code deactivated, new one created)
- Code is 6-12 alphanumeric characters

### Discount Application

- Friend enters referral code at checkout (same input as promo codes)
- Validation: code must be active, not expired, not self-referral (referred email ≠ referrer email), friend must be a new customer
- If valid: `friend_discount` applied to first booking total
- After booking completes: referral record created with `status = 'pending'`, referrer reward starts 7-day vesting clock
- After 7 days (no cancellation/refund): `status = 'completed'`, referrer reward credited to wallet, `referrer_reward_status = 'paid'`

### Fraud Prevention

- Self-referral: detect if referred email matches referrer's email
- Existing customer: friend's email must not already exist in `users` table
- One-time use: each referral code can only be used once per unique email
- Vesting: reward held 7 days (matching booking cancellation window)
- Rate limit: max 20 successful referrals per user per year
- Admin can revoke any referral and claw back wallet credit

### Frontend

- **"Refer a Friend" section in Profile modal**: show code + copy link button + share via WhatsApp/email
- **Referral stats**: invites sent, completed, rewards earned (with pending/vested/paid status)
- **Checkout**: "Have a referral code?" field (separate from promo code, or combined)
- **Referral history page**: list of invited friends with status badges

---

## 3. Implementation Order

### Sprint 1: Wallet foundation (Week 1)
1. Create `wallets` and `wallet_transactions` migrations + models
2. Create `WalletService` with `credit()`, `debit()`, `getBalance()`, transaction logging
3. Create wallet API endpoints + controller
4. Auto-create wallet for new users (observer on `created` event)
5. Frontend: wallet display in profile + transaction history page
6. Tests

### Sprint 2: Wallet + Booking integration (Week 1-2)
1. Modify `createBooking()` in `CatalogService` to accept `wallet_amount`
2. Handle partial payment (wallet + ENBDpay) and full wallet payment
3. Handle booking cancellation → refund to wallet
4. Frontend: wallet input in booking flow, real-time amount calculation
5. Admin wallet management in dashboard
6. Tests

### Sprint 3: Referral program (Week 2-3)
1. Create `referral_codes` and `referrals` migrations + models
2. Create `ReferralService` with code generation, validation, reward vesting
3. Create referral API endpoints + controller
4. Schedule: `referrals:vest` artisan command (daily, checks 7-day vesting)
5. Frontend: referral section in profile, share link, apply code at checkout
6. Admin referral management in dashboard
7. Tests

---

## 4. Effort Estimate

| Component | Backend (days) | Frontend (days) | Total |
|-----------|---------------|-----------------|-------|
| Wallet foundation | 2 | 1 | 3 |
| Wallet + bookings | 2 | 1.5 | 3.5 |
| Referral program | 3 | 2 | 5 |
| **Total** | **7** | **4.5** | **11.5** |

^ Assuming one developer. Parallel backend + frontend work reduces calendar time.

---

## 5. Key Design Decisions

1. **Wallet credit is non-withdrawable** — can only be used for bookings. This avoids payment gateway complexity for payouts.
2. **Referral reward vests 7 days** — covers the cancellation/refund window. No clawback logic needed for refunds after vesting.
3. **Referral code + promo code are separate** — referral discount is hardcoded (AED 25), promo codes are percentage/flat via admin. A customer can use one referral discount + one promo code per booking (stackable, if admin allows).
4. **No referral link tracking infrastructure** — we use codes only. Simple, works offline, no need for UTM/cookie tracking. User can still share a deep link like `medzivahealthcare.com/?ref=VARUN25`.
5. **Wallet auto-created on user registration** — via `User::created` event listener. Zero-friction.

---

## 6. Implementation Notes & Deviations from Plan

| Item | Plan | Implemented | Reason |
|---|---|---|---|
| Wallet auto-funding | Customer could self-deposit | **No customer deposit** — wallet funded only via refunds, admin credits, and referral rewards | Business decision: wallet is a refund/reward store, not a prepaid account |
| Wallet at checkout | Manual amount input | **Auto-applied** up to booking total | Simpler UX, eliminates input friction |
| Cancellation refund | Always to wallet | **Choice** — refund to wallet or original card via `refundToWallet` param | Customer flexibility |
| Referral code generation | On first visit to referral page | **On registration** (auto, zero-friction) | Code available immediately, no extra API call |
| Referral code format | `FIRSTNAMEXX` (5 chars + 2 digits) | `FIRST3OFNAME + LAST3OFPHONE` (e.g. `JOH123`) | Shorter, more memorable, unique per phone |
| Friend discount | Applied at checkout | Applied at booking creation via `referralCode` payload field | Backend-owned validation prevents abuse |
| Promo + referral stack | Undefined order | Referral discount applied first, then promo code, then wallet credit | Logical order for discount stacking |
| Admin settings | Undefined | `settings.wallet_config` and `settings.referral_config` JSON columns with dedicated admin endpoints | Clean separation of wallet and referral config in admin panel |
| All amounts | Hardcoded AED 25 | **Configurable** via admin panel (`welcome_bonus`, `referrer_reward`, `friend_discount`, `vesting_days`, `max_per_year`) | Full admin control |

### Files Created (13)

| File | Purpose |
|---|---|
| `database/migrations/2026_07_23_000000_create_wallet_system.php` | `wallets` + `wallet_transactions` tables |
| `database/migrations/2026_07_23_000001_add_wallet_to_bookings.php` | Wallet fields on bookings |
| `database/migrations/2026_07_23_000002_create_referral_system.php` | `referral_codes` + `referrals` tables |
| `database/migrations/2026_07_23_000003_add_wallet_referral_config_to_settings.php` | Config JSON columns on settings |
| `app/Models/Wallet.php` | Wallet Eloquent model |
| `app/Models/WalletTransaction.php` | Transaction audit model |
| `app/Models/ReferralCode.php` | Referral code model |
| `app/Models/Referral.php` | Referral record model |
| `app/Services/WalletService.php` | Wallet business logic |
| `app/Services/ReferralService.php` | Referral business logic |
| `app/Http/Controllers/Api/WalletController.php` | Wallet API endpoints |
| `app/Http/Controllers/Api/ReferralController.php` | Referral API endpoints |
| `app/Console/Commands/VestReferrals.php` | Daily vesting cron |

### Files Modified (8)

| File | Changes |
|---|---|
| `routes/api.php` | 14 new wallet + referral routes |
| `routes/console.php` | Daily `referrals:vest` scheduler entry |
| `app/Providers/AppServiceProvider.php` | `User::created` → auto-create wallet + referral code |
| `app/Models/User.php` | `wallet()` and `referralCode()` relationships |
| `app/Models/Booking.php` | `wallet_amount`, `wallet_transaction_id` fillable |
| `app/Services/CatalogService.php` | Wallet auto-apply + referral discount + wallet refund on cancel (later split into `BookingService`) |
| `app/Services/BookingService.php` | Wallet auto-apply + referral discount + wallet refund on cancel (extracted from CatalogService refactor) |
| `app/Http/Controllers/Api/CatalogController.php` | Pass userId + refundToWallet to service |
