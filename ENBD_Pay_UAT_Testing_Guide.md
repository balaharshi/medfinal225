# ENBD Pay UAT Testing Guide - MedZiva International Healthcare

**Version:** 2.0
**Date:** July 6, 2026
**Author:** MedZiva Development Team

---

## TABLE OF CONTENTS

1. [MedZiva Payment Business Logic](#1-medziva-payment-business-logic)
2. [Understanding Transaction Types](#2-understanding-transaction-types)
3. [Understanding the Payment Flow](#3-understanding-the-payment-flow)
4. [Prerequisites Before Testing](#4-prerequisites-before-testing)
5. [Step-by-Step Testing Instructions](#5-step-by-step-testing-instructions)
6. [How to Fill the UAT Document](#6-how-to-fill-the-uat-document)
7. [Common Mistakes to Avoid](#7-common-mistakes-to-avoid)
8. [Troubleshooting](#8-troubleshooting)
9. [API Reference](#9-api-reference)

---

## 1. MEDZIVA PAYMENT BUSINESS LOGIC

### 1.1 Our Payment Scenario

MedZiva sells medical tests online. Here's how it works:

```
Customer buys 3 tests:
  - Test A: AED 100
  - Test B: AED 150
  - Test C: AED 200
  - Total: AED 450

Customer calls: "I want to cancel Test B"

Expected result:
  - Customer pays AED 300 (Test A + Test C)
  - AED 150 hold released (Test B cancelled)
```

### 1.2 Why We Chose AUTH → Partial Capture (Option C)

We evaluated 3 options:

#### Option A: PURCHASE → Refund (BAD)

```
Step 1: Charge AED 450 immediately
Step 2: Customer cancels AED 150
Step 3: Refund AED 150
```

**Problems:**
- Customer sees AED 450 debited, then AED 150 refunded
- Refund takes 5-7 business days
- Customer complains: "I was charged AED 450!"
- Payment gateway charges fees on AED 450
- Messy accounting

#### Option B: AUTH → Capture After 24 Hours (OKAY)

```
Step 1: Hold AED 450 on card
Step 2: Wait 24 hours
Step 3: Capture AED 450 (or less if cancelled)
```

**Problems:**
- What if customer cancels AFTER 24 hours? You already captured
- Still need refund in that case
- 24 hours is arbitrary

#### Option C: AUTH → Partial Capture (BEST) ✓

```
Step 1: Hold AED 450 on card (AUTH)
Step 2: Customer cancels AED 150
Step 3: Capture only AED 300
Step 4: AED 150 hold released automatically
```

**Why this is best:**
- Customer only pays for what they keep
- No refund needed
- Clean charge: AED 300 (not AED 450 then refund)
- No refund processing time
- Cleaner accounting

### 1.3 MedZiva Payment Flow (24-Hour Cancellation Window)

```
DAY 1: Customer books tests
        ↓
   AUTH for AED 450 (hold on card)
        ↓
   Status: AUTHORIZED
        ↓
   Money NOT transferred yet
        ↓
   24-HOUR CANCELLATION WINDOW STARTS

HOURS 0-24: Customer can cancel
        ↓
   If customer cancels Test B (AED 150):
        → Capture only AED 300
        → AED 150 hold released
        → Status: CAPTURED
        → Done!

   If customer does NOT cancel:
        → Wait for 24 hours to complete

AFTER 24 HOURS: No cancellation received
        ↓
   Capture full AED 450
        ↓
   Status: CAPTURED
        ↓
   Money transferred
```

### 1.4 Business Rules

| Rule | Value | Notes |
|------|-------|-------|
| Transaction Type | AUTH | Always hold first |
| Cancellation Window | 24 hours | Customer can cancel within 24 hours |
| After 24 Hours | Auto-capture | Capture full amount if no cancellation |
| Partial Cancellation | Yes | Customer can cancel individual tests |
| Full Cancellation | Yes | Void the AUTH (no charge) |
| After Capture | Refund only | If customer wants to cancel after capture |

### 1.5 WHY We Use AUTH → Partial Capture (MedZiva's Real Scenario)

#### The Problem with PURCHASE → Refund

**MedZiva's situation:**
- Customer books 3 blood tests: AED 100 + AED 150 + AED 200 = AED 450 total
- Customer calls next day: "I want to cancel the AED 150 test"
- With PURCHASE: We charged AED 450, now we need to refund AED 150

**What happens to the customer:**
```
Monday:    Customer sees AED 450 debited from card
Tuesday:   Customer calls to cancel AED 150 test
Tuesday:   We process refund
Wednesday-Sunday: Customer waits 5-7 days for refund
Next Week: Customer sees AED 150 credited back

RESULT: Customer saw AED 450 charge, then AED 150 refund
        Customer thinks: "Why was I charged AED 450? I only wanted AED 300!"
```

**What happens to MedZiva:**
```
Payment Gateway charges fees on AED 450 (not AED 300)
Accounting shows: Revenue AED 450, Refund AED 150
Net: AED 300 (but messy records)
```

#### The Solution with AUTH → Partial Capture

**MedZiva's situation:**
- Customer books 3 blood tests: AED 100 + AED 150 + AED 200 = AED 450 total
- Customer calls next day: "I want to cancel the AED 150 test"
- With AUTH: We only capture AED 300 (what they actually want)

**What happens to the customer:**
```
Monday:    Customer sees AED 450 "pending" or "authorized" on card
Tuesday:   Customer calls to cancel AED 150 test
Tuesday:   We capture only AED 300
Tuesday:   AED 150 hold released automatically
Tuesday:   Customer sees AED 300 charge (clean!)

RESULT: Customer sees AED 300 charge (exactly what they expected)
        No refund needed
        No waiting 5-7 days
```

**What happens to MedZiva:**
```
Payment Gateway charges fees on AED 300 (correct amount)
Accounting shows: Revenue AED 300 (clean!)
No refund processing
Happy customer
```

#### Real Examples from MedZiva's Business

**Example 1: Customer books multiple tests, cancels one**
```
Customer books:
  - Complete Blood Count (CBC): AED 120
  - Lipid Profile: AED 180
  - Liver Function Test: AED 200
  Total: AED 500

Customer calls: "I don't need the Lipid Profile anymore"

With AUTH → Partial Capture:
  1. Monday: AED 500 held on card
  2. Tuesday: Customer cancels Lipid Profile (AED 180)
  3. Tuesday: Capture only AED 320 (AED 120 + AED 200)
  4. AED 180 hold released
  5. Customer pays AED 320 (clean!)
```

**Example 2: Customer books for family, one person cancels**
```
Customer books for family of 4:
  - Person 1: AED 150
  - Person 2: AED 150
  - Person 3: AED 150
  - Person 4: AED 150
  Total: AED 600

Customer calls: "Person 3 can't make it, cancel their test"

With AUTH → Partial Capture:
  1. Monday: AED 600 held on card
  2. Tuesday: Customer cancels Person 3 (AED 150)
  3. Tuesday: Capture only AED 450 (3 people × AED 150)
  4. AED 150 hold released
  5. Customer pays AED 450 (clean!)
```

**Example 3: Customer cancels ALL tests within 24 hours**
```
Customer books:
  - MRI Scan: AED 800
  - X-Ray: AED 200
  Total: AED 1000

Customer calls same day: "I need to cancel everything, doctor said I don't need these"

With AUTH → Void:
  1. Monday morning: AED 1000 held on card
  2. Monday afternoon: Customer cancels all
  3. Monday afternoon: Void the AUTH
  4. AED 1000 hold released
  5. Customer pays NOTHING (clean!)
```

**Example 4: Customer cancels AFTER 24 hours (worst case)**
```
Customer books:
  - Blood Test: AED 200
  Total: AED 200

Monday: AED 200 held on card
Tuesday (after 24 hours): No cancellation, so we capture AED 200
Wednesday: Customer calls: "I want to cancel"

With AUTH → Partial Capture:
  1. Monday: AED 200 held
  2. Tuesday: AED 200 captured (after 24 hours)
  3. Wednesday: Customer wants to cancel
  4. We MUST refund AED 200 (only option after capture)
  5. Customer waits 5-7 days for refund

THIS IS THE ONLY CASE WHERE REFUND IS NEEDED.
We minimize this by having a 24-hour cancellation window.
```

#### Why 24 Hours?

**MedZiva's reasoning:**
- Most cancellations happen within 24 hours of booking
- After 24 hours, tests are usually scheduled and confirmed
- 24 hours gives customers enough time to change their mind
- After 24 hours, we proceed with the tests

**If we don't capture after 24 hours:**
- Money stays on hold indefinitely
- Customer can't use the money
- We don't get paid
- Bad for business

**If we capture too soon (e.g., immediately):**
- Customer can't cancel
- We need to refund if they cancel
- Same problem as PURCHASE

**24 hours is the sweet spot:**
- Customer has time to cancel
- We can adjust the amount
- Minimal refunds needed

#### Summary: Why AUTH → Partial Capture is Better for MedZiva

| Aspect | PURCHASE → Refund | AUTH → Partial Capture |
|--------|-------------------|------------------------|
| Customer sees | AED 450 charge, then AED 150 refund | AED 300 charge (clean!) |
| Refund needed | Yes (if customer cancels) | No (just capture less) |
| Refund time | 5-7 business days | Instant (hold released) |
| Customer confusion | High ("Why was I charged AED 450?") | Low ("I paid AED 300, correct!") |
| Payment gateway fees | On AED 450 | On AED 300 (correct!) |
| Accounting | Messy (revenue + refund) | Clean (just revenue) |
| Customer satisfaction | Low | High |

**Bottom line: AUTH → Partial Capture is cleaner, simpler, and better for customers.**

### 1.6 What Changes in the System

**Current System (PURCHASE):**
```
Customer clicks "Pay Now"
        ↓
Charge AED 450 immediately
        ↓
If cancel → Refund AED 150 (messy)
```

**New System (AUTH → Partial Capture):**
```
Customer clicks "Pay Now"
        ↓
Hold AED 450 for 24 hours
        ↓
If cancel within 24 hours → Capture less
If no cancel after 24 hours → Capture full
```

### 1.7 Configuration Changes Required

**In .env file:**
```bash
# Change from PURCHASE to AUTH
ENBDPAY_TRANSACTION_TYPE=AUTH

# Add cancellation window (in hours)
ENBDPAY_CANCELLATION_WINDOW=24
```

**In frontend:**
```
Show: "Estimated Total: AED 450"
Show: "Final amount will be confirmed after 24 hours"
Show: "You can cancel or modify your order within 24 hours"
```

**In backend:**
```
1. Create AUTH transaction (not PURCHASE)
2. Store the AUTH transaction ID
3. After 24 hours, auto-capture if no cancellation
4. If cancellation received, capture reduced amount
```

### 1.8 Summary for Bala

**What you need to understand:**

1. **AUTH = Hold money, don't charge yet**
   - Customer's card shows "pending" or "authorized"
   - Money is reserved but not transferred
   - We can adjust the amount later

2. **Capture = Actually charge the money**
   - Only happens AFTER 24 hours (or when customer cancels)
   - We decide how much to capture
   - If customer cancelled some tests, capture less

3. **Partial Capture = Charge only what's needed**
   - Customer bought AED 450, cancelled AED 150
   - We capture only AED 300
   - AED 150 hold released automatically

4. **Void = Cancel everything (no charge)**
   - Customer cancels ALL tests
   - We void the AUTH
   - No money transferred at all

5. **Refund = Return money (only after capture)**
   - Only used if customer wants to cancel AFTER 24 hours
   - We already captured, so we need to refund
   - Last resort, not preferred

**Remember: AUTH → Partial Capture is cleaner than PURCHASE → Refund.**

---

## 2. UNDERSTANDING TRANSACTION TYPES

**⚠️ IMPORTANT: MedZiva uses AUTH transactions, not PURCHASE. All testing must use AUTH.**

### 2.1 What is a PURCHASE Transaction? (NOT USED BY MEDZIVA)

**Definition:**
A PURCHASE transaction is a direct charge to the customer's card. The money is taken from the customer's card immediately and transferred to the merchant's account.

**When to use it:**
- When you want to charge the customer right away
- When the payment is final and cannot be changed
- Example: Customer buys a product online and pays immediately

**What happens:**
1. Customer enters card details
2. Bank verifies the card
3. Money is deducted from customer's card
4. Money is transferred to merchant's account
5. Transaction status shows as CAPTURED

**Example:**
```
Customer buys a product for AED 100
→ PURCHASE transaction is created
→ AED 100 is deducted from customer's card
→ AED 100 is transferred to MedZiva's account
→ Status: CAPTURED
```

**Key point:** Once a PURCHASE is completed, the money is gone from the customer's card. You cannot "undo" it, but you can refund it later.

---

### 2.2 What is an AUTH Transaction? (USED BY MEDZIVA)

**Definition:**
An AUTH (Authorization) transaction puts a hold on the customer's card for a specific amount. The money is NOT transferred to the merchant yet. It is just "reserved" or "held" on the card.

**When to use it:**
- ✅ **MedZiva uses this for all transactions**
- When you need to verify the card has enough balance
- When you want to capture the money later (partial or full)
- When the final amount is not known yet
- Example: Customer buys tests, might cancel some within 24 hours

**What happens:**
1. Customer enters card details
2. Bank verifies the card has enough balance
3. AED 100 is "held" on the card (not transferred)
4. Customer still has the money, but cannot use it
5. Transaction status shows as AUTHORIZED

**Example:**
```
Customer books a hotel room for AED 500
→ AUTH transaction is created for AED 500
→ AED 500 is "held" on customer's card
→ Money is NOT transferred to hotel yet
→ After checkout, hotel captures AED 450 (actual charges)
→ Remaining AED 50 hold is released
```

**Key point:** AUTH is like a "promise to pay." The money is reserved but not transferred. You must "Capture" it later to actually get the money.

---

### 2.3 What is CAPTURE? (USED BY MEDZIVA)

**Definition:**
Capture is the process of actually transferring money from an AUTH transaction. It converts an AUTH into a completed payment.

**When to use it:**
- ✅ **MedZiva uses this after 24-hour cancellation window**
- After an AUTH transaction is completed
- When you want to take the money from the held amount
- Can be full capture (take all) or partial capture (take some)
- **MedZiva captures after 24 hours (or sooner if customer cancels some tests)**

**What happens:**
1. You have an AUTH transaction for AED 500
2. You decide to capture only AED 450
3. AED 450 is transferred to your account
4. AED 50 hold is released back to customer
5. Transaction status shows as CAPTURED

**Example:**
```
AUTH transaction: AED 500 held on card
→ Capture AED 450
→ AED 450 transferred to MedZiva's account
→ AED 50 released back to customer
→ Status: CAPTURED
```

**Key point:** Capture only works on AUTH transactions. You CANNOT capture a PURCHASE transaction because the money is already transferred.

---

### 2.4 What is PARTIAL CAPTURE? (USED BY MEDZIVA)

**Definition:**
Partial Capture is when you capture only a portion of the AUTH amount, not the full amount.

**When to use it:**
- ✅ **MedZiva uses this when customer cancels tests**
- When the final amount is less than the authorized amount
- Example: Customer authorized AED 450, cancelled AED 150, capture only AED 300

**What happens:**
1. AUTH transaction for AED 500
2. You capture only AED 300
3. AED 300 is transferred to your account
4. AED 200 hold is released back to customer
5. Transaction status shows as CAPTURED

**Example:**
```
AUTH: AED 500 held
→ Partial Capture: AED 300
→ AED 300 transferred to MedZiva
→ AED 200 released to customer
→ Status: CAPTURED
```

---

### 2.5 What is REFUND?

**Definition:**
Refund is when you return money to the customer after a payment has been completed (PURCHASE or CAPTURED).

**When to use it:**
- ⚠️ **MedZiva uses this only after capture (last resort)**
- Customer cancels AFTER 24-hour window (after we already captured)
- Customer is not satisfied with the service
- Overcharged by mistake
- **Preferred: Use AUTH → Partial Capture instead of PURCHASE → Refund**

**What happens:**
1. Original payment was AED 100 (PURCHASE or CAPTURED)
2. You refund AED 50
3. AED 50 is returned to customer's card
4. AED 50 is deducted from your account
5. Transaction status shows as REFUNDED

**Example:**
```
Original PURCHASE: AED 100
→ Customer returns half the items
→ Partial Refund: AED 50
→ AED 50 returned to customer's card
→ AED 50 deducted from MedZiva's account
→ Status: REFUNDED
```

---

### 2.6 What is FULL REFUND?

**Definition:**
Full Refund is when you return the entire amount to the customer.

**When to use it:**
- ⚠️ **MedZiva uses this only after capture (last resort)**
- Customer cancels ALL tests AFTER 24-hour window
- Order was never fulfilled
- **Preferred: Use AUTH → Void instead of PURCHASE → Full Refund**

**What happens:**
1. Original payment was AED 100
2. You refund AED 100 (full amount)
3. AED 100 is returned to customer's card
4. AED 100 is deducted from your account
5. Transaction status shows as REFUNDED

**Example:**
```
Original PURCHASE: AED 100
→ Customer cancels order
→ Full Refund: AED 100
→ AED 100 returned to customer's card
→ AED 100 deducted from MedZiva's account
→ Status: REFUNDED
```

---

### 2.7 What is VOID AUTHORIZATION? (USED BY MEDZIVA)

**Definition:**
Void Authorization is when you cancel an AUTH transaction before it is captured. The hold on the customer's card is released.

**When to use it:**
- ✅ **MedZiva uses this when customer cancels ALL tests within 24 hours**
- Customer decides not to proceed with any tests
- You don't need the money anymore
- The AUTH was created by mistake

**What happens:**
1. AUTH transaction for AED 500 (hold on card)
2. You void the AUTH
3. AED 500 hold is released from customer's card
4. Customer can use the money again
5. Transaction status shows as VOIDED

**Example:**
```
AUTH: AED 500 held on card
→ Customer changes mind
→ Void Authorization
→ AED 500 hold released
→ Customer can use AED 500 again
→ Status: VOIDED
```

**Key point:** Void only works on AUTH transactions. You cannot void a PURCHASE because the money is already transferred.

---

### 2.8 What is VOID CAPTURE?

**Definition:**
Void Capture is when you reverse a Capture transaction. It's like "undoing" a capture.

**When to use it:**
- ⚠️ **MedZiva uses this if we captured by mistake**
- You captured the wrong amount
- You captured by mistake
- The transaction needs to be reversed

**What happens:**
1. You captured AED 450 from an AUTH
2. You realize it was wrong
3. You void the capture
4. AED 450 is returned to customer's card
5. Transaction status shows as REVERSED

**Example:**
```
AUTH: AED 500 held
→ Capture: AED 450 (wrong amount)
→ Void Capture
→ AED 450 returned to customer
→ Status: REVERSED
```

---

### 2.9 What is VOID REFUND?

**Definition:**
Void Refund is when you cancel a refund that was previously processed.

**When to use it:**
- ⚠️ **MedZiva rarely uses this**
- You refunded the wrong amount
- You refunded by mistake
- The refund needs to be cancelled

**What happens:**
1. You refunded AED 50 to customer
2. You realize it was wrong
3. You void the refund
4. AED 50 is taken back from customer's card
5. AED 50 is returned to your account
6. Transaction status shows as CANCELLED

**Example:**
```
Original PURCHASE: AED 100
→ Refund: AED 50 (wrong amount)
→ Void Refund
→ AED 50 taken back from customer
→ AED 50 returned to MedZiva
→ Status: CANCELLED
```

---

## 3. UNDERSTANDING THE PAYMENT FLOW

### 3.1 PURCHASE Flow (NOT USED BY MEDZIVA)

```
Customer clicks "Pay Now"
        ↓
MedZiva creates PURCHASE transaction
        ↓
Customer enters card details
        ↓
Bank verifies card
        ↓
Money deducted from customer's card
        ↓
Money transferred to MedZiva's account
        ↓
Status: CAPTURED
```

### 3.2 AUTH Flow (USED BY MEDZIVA)

```
Customer clicks "Pay Now"
        ↓
MedZiva creates AUTH transaction
        ↓
Customer enters card details
        ↓
Bank verifies card has enough balance
        ↓
Money HELD on customer's card (not transferred)
        ↓
Status: AUTHORIZED
        ↓
MedZiva captures the money
        ↓
Money transferred to MedZiva's account
        ↓
Status: CAPTURED
```

### 3.3 REFUND Flow (LAST RESORT)

```
Customer requests refund
        ↓
MedZiva finds original transaction
        ↓
MedZiva creates REFUND transaction
        ↓
Money returned to customer's card
        ↓
Money deducted from MedZiva's account
        ↓
Status: REFUNDED
```

### 3.4 VOID Flow

```
MedZiva decides to cancel transaction
        ↓
MedZiva finds original transaction
        ↓
MedZiva creates VOID transaction
        ↓
Transaction is cancelled
        ↓
Money is released/reversed
        ↓
Status: VOIDED or REVERSED or CANCELLED
```

---

## 4. PREREQUISITES BEFORE TESTING

### 4.1 Server Configuration

Before testing, make sure the server is configured correctly:

1. **Login to the staging server**
2. **Go to the Laravel project directory**
3. **Check the .env file:**

```bash
# These must be set correctly
ENBDPAY_MOCK=false                    # Must be false for real testing
ENBDPAY_USERNAME=<your_username>      # From ENBD welcome kit
ENBDPAY_API_KEY=<your_api_key>        # From ENBD welcome kit
ENBDPAY_BASE_URL=https://enbduat-acquiring-apigw.creditpluspinelabs.com
ENBDPAY_TRANSACTION_TYPE=AUTH         # IMPORTANT: Must be AUTH, not PURCHASE
ENBDPAY_REDIRECT_URL=https://staging.medzivahealthcare.com/payment/callback
ENBDPAY_WEBHOOK_URL=https://staging.medzivahealthcare.com/api/enbdpay/webhook
```

### 4.2 IP Whitelisting

ENBD Pay requires your server IP to be whitelisted. Check if it's working:

```bash
curl -X POST https://enbduat-acquiring-apigw.creditpluspinelabs.com/v1/apis/tokens \
  -H "Content-Type: application/json" \
  -d '{"username":"YOUR_USERNAME","apiKey":"YOUR_API_KEY"}'
```

**If you get a token:** IP is whitelisted, proceed with testing.
**If you get 403 error:** IP is NOT whitelisted, contact ENBD to whitelist IP `216.10.241.164`.

### 4.3 Test Card Details

Ask ENBD for test card numbers. You need:
- A card that succeeds (for successful transactions)
- A card that fails (for failed transactions)

---

## 5. STEP-BY-STEP TESTING INSTRUCTIONS

### SCENARIO 1: AUTH Transaction (USED BY MEDZIVA)

**Objective:** Test holding money on the customer's card without capturing it.

**Steps:**

1. Open terminal on your computer
2. Run this command:

```bash
curl -X POST https://staging.medzivahealthcare.com/api/payments/enbd/create \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "bookingId": "1",
    "amount": 100,
    "transactionType": "AUTH",
    "customer": {
      "fullName": "Test Customer",
      "email": "test@example.com",
      "phone": "500000000"
    }
  }'
```

3. You will get a JSON response with a `redirectUri`
4. Copy the `redirectUri` value
5. Open it in a browser
6. Complete the payment with a test card
7. Note down the Transaction ID from the response

**Expected Result:**
- Payment authorized but NOT captured
- Status: AUTHORIZED
- Money held on customer's card, not transferred

**What to record:**
- Transaction ID: _______________
- Order ID: _______________
- Amount: AED _______________
- Status: AUTHORIZED
- Date/Time: _______________

---

### SCENARIO 2: AUTH → Partial Capture (MedZiva's Main Flow)

**Objective:** Test capturing only part of an AUTH transaction (when customer cancels some tests).

**Steps:**

1. Create an AUTH transaction for AED 450 (use Scenario 1 with amount=450)
2. Note down the Transaction ID
3. Customer cancels AED 150 worth of tests
4. Open terminal
5. Run this command (capture only AED 300):

```bash
curl -X POST https://staging.medzivahealthcare.com/api/payments/enbd/capture \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "transactionUtr": "YOUR_TRANSACTION_ID_HERE",
    "amount": 300
  }'
```

6. You will get a response with the capture details

**Expected Result:**
- Partial amount captured (AED 300)
- Remaining AUTH amount (AED 150) released
- Status: CAPTURED

**What to record:**
- Original AUTH Transaction ID: _______________
- Capture Transaction ID: _______________
- Original AUTH Amount: AED 450
- Amount Captured: AED 300
- Remaining Amount Released: AED 150
- Status: CAPTURED
- Date/Time: _______________

---

### SCENARIO 3: AUTH → Full Capture (After 24 Hours)

**Objective:** Test capturing the full AUTH amount after cancellation window expires.

**Steps:**

1. Create an AUTH transaction for AED 450 (use Scenario 1 with amount=450)
2. Note down the Transaction ID
3. Wait 24 hours (or simulate by running the capture immediately for testing)
4. Open terminal
5. Run this command (capture full amount):

```bash
curl -X POST https://staging.medzivahealthcare.com/api/payments/enbd/capture \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "transactionUtr": "YOUR_TRANSACTION_ID_HERE"
  }'
```

6. You will get a response with the capture details

**Expected Result:**
- Full amount captured (AED 450)
- Status: CAPTURED

**What to record:**
- Original AUTH Transaction ID: _______________
- Capture Transaction ID: _______________
- Amount Captured: AED 450
- Status: CAPTURED
- Date/Time: _______________

---

### SCENARIO 4: Failure Transaction

**Objective:** Test a failed payment.

**Steps:**

1. Ask ENBD for a test card that is designed to fail
2. Create a checkout link (same as Scenario 1)
3. Open the checkout URL in a browser
4. Enter the failing test card details
5. Click "Pay Now"
6. The payment should fail
7. Note down the Transaction ID and error message

**Expected Result:**
- Payment failed
- Status: FAILED
- Error message displayed

**What to record:**
- Transaction ID: _______________
- Order ID: _______________
- Amount: AED _______________
- Status: FAILED
- Error Message: _______________
- Date/Time: _______________

---

### SCENARIO 5: Void Authorization (Cancel Within 24 Hours)

**Objective:** Cancel an AUTH transaction when customer cancels ALL tests within 24 hours.

**Steps:**

1. Create an AUTH transaction (Scenario 1)
2. Note down the Transaction ID
3. Customer cancels all tests
4. Open terminal
5. Run this command:

```bash
curl -X POST https://staging.medzivahealthcare.com/api/payments/enbd/void/auth \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "transactionUtr": "YOUR_TRANSACTION_ID_HERE"
  }'
```

6. You will get a response with the void details

**Expected Result:**
- AUTH cancelled
- Status: VOIDED
- Hold on customer's card released

**What to record:**
- Original AUTH Transaction ID: _______________
- Void Transaction ID: _______________
- Status: VOIDED
- Date/Time: _______________

---

### SCENARIO 6: Partial Refund (After Capture - Last Resort)

**Objective:** Refund part of a captured payment (only if customer cancels AFTER 24 hours).

**Steps:**

1. Create an AUTH transaction and Capture it (Scenario 1 + 3)
2. Note down the Capture Transaction ID
3. Customer wants to cancel some tests AFTER capture
4. Open terminal
5. Run this command (refund AED 150):

```bash
curl -X POST https://staging.medzivahealthcare.com/api/payments/enbd/refund \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "transactionUtr": "YOUR_CAPTURE_TRANSACTION_ID_HERE",
    "amount": 150
  }'
```

6. You will get a response with the refund details

**Expected Result:**
- Partial refund processed
- Status: REFUNDED
- AED 150 returned to customer's card

**What to record:**
- Original Capture Transaction ID: _______________
- Refund Transaction ID: _______________
- Amount Refunded: AED 150
- Status: REFUNDED
- Date/Time: _______________

---

### SCENARIO 7: Full Refund (After Capture - Last Resort)

**Objective:** Refund the entire captured payment (only if customer cancels ALL tests AFTER 24 hours).

**Steps:**

1. Create an AUTH transaction and Capture it (Scenario 1 + 3)
2. Note down the Capture Transaction ID
3. Customer cancels all tests AFTER capture
4. Open terminal
5. Run this command:

```bash
curl -X POST https://staging.medzivahealthcare.com/api/payments/enbd/refund \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "transactionUtr": "YOUR_CAPTURE_TRANSACTION_ID_HERE"
  }'
```

6. You will get a response with the refund details

**Expected Result:**
- Full refund processed
- Status: REFUNDED
- Entire amount returned to customer's card

**What to record:**
- Original Capture Transaction ID: _______________
- Refund Transaction ID: _______________
- Amount Refunded: AED 450
- Status: REFUNDED
- Date/Time: _______________

---

### SCENARIO 8: Void Capture (Undo Capture by Mistake)

**Objective:** Reverse a Capture transaction if captured by mistake.

**Steps:**

1. Create an AUTH transaction and Capture it (Scenario 1 + 3)
2. Note down the Capture Transaction ID
3. Realize it was a mistake
4. Open terminal
5. Run this command:

```bash
curl -X POST https://staging.medzivahealthcare.com/api/payments/enbd/void/capture \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "transactionUtr": "YOUR_CAPTURE_TRANSACTION_ID_HERE"
  }'
```

6. You will get a response with the void details

**Expected Result:**
- Capture reversed
- Status: REVERSED
- Money returned to customer's card

**What to record:**
- Original Capture Transaction ID: _______________
- Void Transaction ID: _______________
- Amount Reversed: AED _______________
- Status: REVERSED
- Date/Time: _______________

---

### SCENARIO 9: Void Refund (Undo Refund by Mistake)

**Objective:** Cancel a refund that was previously processed.

**Steps:**

1. Create a transaction and Refund it (Scenario 6 or 7)
2. Note down the Refund Transaction ID
3. Realize the refund was a mistake
4. Open terminal
5. Run this command:

```bash
curl -X POST https://staging.medzivahealthcare.com/api/payments/enbd/void/refund \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "transactionUtr": "YOUR_REFUND_TRANSACTION_ID_HERE"
  }'
```

6. You will get a response with the void details

**Expected Result:**
- Refund cancelled
- Status: CANCELLED
- Money taken back from customer's card

**What to record:**
- Original Refund Transaction ID: _______________
- Void Transaction ID: _______________
- Amount Cancelled: AED _______________
- Status: CANCELLED
- Date/Time: _______________

---

## 6. HOW TO FILL THE UAT DOCUMENT

For each scenario, fill in the UAT document with the following information:

### Required Fields

| Field | Description | Example |
|-------|-------------|---------|
| Scenario Number | The scenario number from this guide | 1, 2, 3, etc. |
| Scenario Name | What scenario you are testing | "AUTH Transaction" |
| Transaction Type | The type of transaction | AUTH, CAPTURE, REFUND, VOID |
| Transaction ID | The ID from the API response | txn_1234567890 |
| Order ID | The order ID from the API response | MZABC123456 |
| Amount | The amount in AED | 100 |
| Status | The final status of the transaction | AUTHORIZED, CAPTURED, FAILED, REFUNDED, VOIDED |
| Date/Time | When you performed the test | 2026-07-06 12:00:00 |
| Remarks | Any notes about the test | "Test completed successfully" |

### Example Entries

#### Scenario 1: AUTH Transaction
```
Scenario Number: 1
Scenario Name: AUTH Transaction
Transaction Type: AUTH
Transaction ID: txn_1783325899353iNUnXNB
Order ID: MZTHQV2IKL8R
Amount: 100
Status: AUTHORIZED
Date/Time: 2026-07-06 12:18:55
Remarks: Money held on card, not captured
```

#### Scenario 2: AUTH → Partial Capture
```
Scenario Number: 2
Scenario Name: AUTH → Partial Capture
Transaction Type: AUTH → CAPTURE
Original AUTH Transaction ID: txn_1783325899353iNUnXNB
Capture Transaction ID: txn_1783326000000AbCdEf
Amount Captured: 300
Original AUTH Amount: 450
Status: CAPTURED
Date/Time: 2026-07-06 12:20:00
Remarks: Customer cancelled AED 150, captured AED 300
```

#### Scenario 3: AUTH → Full Capture (After 24 Hours)
```
Scenario Number: 3
Scenario Name: AUTH → Full Capture
Transaction Type: AUTH → CAPTURE
Original AUTH Transaction ID: txn_1783325899353iNUnXNB
Capture Transaction ID: txn_1783326000000AbCdEf
Amount Captured: 450
Status: CAPTURED
Date/Time: 2026-07-07 12:18:55
Remarks: No cancellation within 24 hours, full amount captured
```

---

## 6. COMMON MISTAKES TO AVOID

### Mistake 1: Creating Only PURCHASE Transactions

**What Bala did wrong:**
- Created 9 checkout links
- All were PURCHASE transactions
- Tried to Capture them
- Capture failed because it only works on AUTH

**Correct approach:**
- Create AUTH transactions for scenarios that require Capture
- Only use PURCHASE for direct charge scenarios

### Mistake 2: Trying to Capture a PURCHASE Transaction

**Why it fails:**
- PURCHASE = money already transferred
- Capture = transfer money from AUTH
- You cannot capture money that is already transferred

**Correct approach:**
- First create an AUTH transaction
- Then capture the AUTH transaction

### Mistake 3: Not Checking API Responses

**Why it's bad:**
- You won't know if the operation failed
- You might report wrong status to ENBD

**Correct approach:**
- Always check the API response
- Look for success/failure status
- Note down any error messages

### Mistake 4: Sharing Dashboard IDs for API Operations

**Why it's confusing:**
- Dashboard shows PURCHASE transaction IDs
- API operations have their own transaction IDs
- ENBD needs the correct IDs for each operation

**Correct approach:**
- Use the Transaction ID from the API response for API operations
- Use the Dashboard ID for dashboard operations

### Mistake 5: Not Following the Correct Order

**Why it fails:**
- Some operations depend on previous operations
- You cannot Capture without first creating an AUTH
- You cannot Void Capture without first capturing

**Correct approach:**
- Follow the scenarios in order
- Complete prerequisite scenarios first
- Use the transaction IDs from previous scenarios

---

## 7. TROUBLESHOOTING

### Problem 1: 403 Forbidden Error on Token Endpoint

**Cause:** Server IP is not whitelisted by ENBD

**Solution:**
1. Contact ENBD and request IP whitelisting
2. Provide IP address: 216.10.241.164
3. Wait for confirmation from ENBD
4. Test again after whitelisting

### Problem 2: Capture Returns Error

**Cause:** Trying to capture a PURCHASE transaction

**Solution:**
1. Check the transaction type - it must be AUTH
2. Create a new AUTH transaction
3. Capture the AUTH transaction, not the PURCHASE

### Problem 3: Refund Returns Error

**Cause:** Transaction is not in a refundable state

**Solution:**
1. Check the transaction status
2. Refund only works on CAPTURED or PURCHASE transactions
3. Make sure the transaction is completed first

### Problem 4: Void Returns Error

**Cause:** Transaction is not in a voidable state

**Solution:**
1. Check the transaction type and status
2. Void Auth only works on AUTHORIZED transactions
3. Void Capture only works on CAPTURED transactions
4. Void Refund only works on REFUNDED transactions

### Problem 5: Mock Mode is Still On

**Cause:** ENBDPAY_MOCK is set to true in .env

**Solution:**
1. Login to the server
2. Edit the .env file
3. Change ENBDPAY_MOCK=false
4. Clear cache: php artisan config:cache
5. Test again

---

## 8. API REFERENCE

### Base URL
```
https://staging.medzivahealthcare.com
```

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/payments/enbd/create | Create a checkout transaction |
| GET | /api/payments/enbd/status | Check transaction status |
| POST | /api/payments/enbd/capture | Capture an AUTH transaction |
| POST | /api/payments/enbd/refund | Refund a transaction |
| POST | /api/payments/enbd/void/auth | Void an AUTH transaction |
| POST | /api/payments/enbd/void/capture | Void a Capture transaction |
| POST | /api/payments/enbd/void/refund | Void a Refund transaction |

### Request Headers
```
Content-Type: application/json
Accept: application/json
```

### Create Checkout - Request Body
```json
{
  "bookingId": "1",
  "amount": 100,
  "transactionType": "PURCHASE",
  "customer": {
    "fullName": "Test Customer",
    "email": "test@example.com",
    "phone": "500000000"
  }
}
```

### Create Checkout - Response
```json
{
  "success": true,
  "checkout": {
    "responseStatus": "CREATED",
    "redirectUri": "https://enbdpay.example.com/checkout?token=abc123",
    "appUtr": "MDZ1234567890",
    "orderId": "MZABC123456",
    "transactionUtr": "txn_1234567890"
  }
}
```

### Capture - Request Body
```json
{
  "transactionUtr": "txn_1234567890",
  "amount": 50
}
```

### Capture - Response
```json
{
  "success": true,
  "result": {
    "responseStatus": "CAPTURED",
    "transactionUtr": "txn_0987654321"
  }
}
```

### Refund - Request Body
```json
{
  "transactionUtr": "txn_1234567890",
  "amount": 50
}
```

### Refund - Response
```json
{
  "success": true,
  "result": {
    "responseStatus": "REFUNDED",
    "transactionUtr": "txn_1122334455"
  }
}
```

### Void Auth - Request Body
```json
{
  "transactionUtr": "txn_1234567890"
}
```

### Void Auth - Response
```json
{
  "success": true,
  "result": {
    "responseStatus": "VOIDED",
    "transactionUtr": "txn_5544332211"
  }
}
```

---

## QUICK REFERENCE CARD

### Transaction Types

| Type | What It Does | Can Capture? | Can Refund? | Can Void? |
|------|--------------|--------------|-------------|-----------|
| PURCHASE | Direct charge | NO | YES | NO |
| AUTH | Hold money | YES (must capture) | NO | YES (void auth) |
| CAPTURE | Transfer from AUTH | NO | YES | YES (void capture) |

### Status Values

| Status | Meaning |
|--------|---------|
| CREATED | Checkout link created, waiting for payment |
| AUTHORIZED | Money held on card (AUTH only) |
| CAPTURED | Money transferred to merchant |
| FAILED | Payment failed |
| REFUNDED | Money returned to customer |
| VOIDED | AUTH transaction cancelled |
| REVERSED | Capture transaction reversed |
| CANCELLED | Refund transaction cancelled |

### Which Scenario Uses Which Transaction Type?

| Scenario | Transaction Type | Prerequisite |
|----------|------------------|--------------|
| 1. AUTH Transaction | AUTH | None |
| 2. AUTH → Partial Capture | AUTH → CAPTURE | Scenario 1 |
| 3. AUTH → Full Capture | AUTH → CAPTURE | Scenario 1 |
| 4. Failure Transaction | PURCHASE | None |
| 5. Void Authorization | AUTH → VOID | Scenario 1 |
| 6. Partial Refund | CAPTURE → REFUND | Scenario 3 |
| 7. Full Refund | CAPTURE → REFUND | Scenario 3 |
| 8. Void Capture | CAPTURE → REVERSE | Scenario 3 |
| 9. Void Refund | REFUND → CANCEL | Scenario 6 or 7 |

---

## NOTE FOR AI ASSISTANT (OpenCode)

**When helping Bala execute this testing:**

### Prerequisites to Check First

1. **Verify server configuration:**
   ```bash
   # Check if ENBD credentials are configured
   ssh into staging server
   cat .env | grep ENBD
   # ENBDPAY_MOCK must be false
   # ENBDPAY_USERNAME and ENBDPAY_API_KEY must have values
   # ENBDPAY_TRANSACTION_TYPE must be AUTH (not PURCHASE)
   ```

2. **Verify IP is whitelisted:**
   ```bash
   curl -X POST https://enbduat-acquiring-apigw.creditpluspinelabs.com/v1/apis/tokens \
     -H "Content-Type: application/json" \
     -d '{"username":"YOUR_USERNAME","apiKey":"YOUR_API_KEY"}'
   # Should return a token, not 403 error
   ```

3. **Get test card details from ENBD** before starting any testing.

### Testing Order (Follow This Sequence)

1. **First:** Test Scenario 1 (AUTH Transaction) - verify basic AUTH works
2. **Then:** Test Scenario 2 (AUTH → Partial Capture) - this is MedZiva's main flow
3. **Then:** Test Scenario 3 (AUTH → Full Capture) - after 24 hours flow
4. **Then:** Test Scenario 5 (Void Authorization) - cancel within 24 hours
5. **Then:** Test Scenario 4 (Failure Transaction) - test error handling
6. **Last:** Test Scenarios 6-9 (Refund/Void) - only if needed

### Common Issues to Watch For

1. **If token endpoint returns 403:** IP not whitelisted. Contact ENBD.
2. **If Capture returns error:** Check if transactionType is AUTH, not PURCHASE.
3. **If Mock mode is on:** Change ENBDPAY_MOCK=false in .env and run `php artisan config:cache`.

### Commands to Help Bala

**Check current configuration:**
```bash
cd /path/to/med21-laravel
cat .env | grep -E "ENBDPAY_(MOCK|USERNAME|API_KEY|TRANSACTION_TYPE)"
```

**Fix configuration if needed:**
```bash
# Edit .env file
nano .env

# Change these values:
# ENBDPAY_MOCK=false
# ENBDPAY_TRANSACTION_TYPE=AUTH
# ENBDPAY_USERNAME=<from ENBD welcome kit>
# ENBDPAY_API_KEY=<from ENBD welcome kit>

# Clear cache
php artisan config:cache
```

**Test token endpoint:**
```bash
curl -v -X POST https://enbduat-acquiring-apigw.creditpluspinelabs.com/v1/apis/tokens \
  -H "Content-Type: application/json" \
  -d '{"username":"YOUR_USERNAME","apiKey":"YOUR_API_KEY"}'
```

**Run Scenario 1 (Create AUTH):**
```bash
curl -X POST https://staging.medzivahealthcare.com/api/payments/enbd/create \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "bookingId": "1",
    "amount": 100,
    "transactionType": "AUTH",
    "customer": {
      "fullName": "Test Customer",
      "email": "test@example.com",
      "phone": "500000000"
    }
  }'
```

**Run Scenario 2 (Partial Capture):**
```bash
curl -X POST https://staging.medzivahealthcare.com/api/payments/enbd/capture \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "transactionUtr": "TRANSACTION_ID_FROM_SCENARIO_1",
    "amount": 30
  }'
```

**Run Scenario 5 (Void Auth):**
```bash
curl -X POST https://staging.medzivahealthcare.com/api/payments/enbd/void/auth \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "transactionUtr": "TRANSACTION_ID_FROM_SCENARIO_1"
  }'
```

### What to Tell ENBD After Testing

Once all scenarios pass, provide ENBD with:

1. **Transaction IDs** from each scenario
2. **Status values** for each transaction
3. **Confirmation** that AUTH → Partial Capture flow works
4. **Request** to proceed with Production Onboarding

---

**END OF DOCUMENT**

**If you have any questions, contact the development team before proceeding with testing.**
