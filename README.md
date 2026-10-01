# Payment Status Recovery: UPI Transaction Uncertainty Engine

[![Next.js](https://img.shields.io/badge/Next.js-15.1.7-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38bdf8?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Vitest-3.0.5-green?style=flat&logo=vitest)](https://vitest.dev/)
[![Tests](https://img.shields.io/badge/Tests-88%20Passed-success)](https://github.com/Saksham3124/payment-status-recovery)

A **Product Management Portfolio Case Study & Working Technical Prototype** modeling real-time payment status recovery, multi-party telemetry reconciliation, and accidental double-debit prevention in the Unified Payments Interface (UPI).

---

## 🎯 Executive Summary & The Problem Space

In real-time payment ecosystems like UPI, asynchronous multi-party clearing rails (Remitter Bank &rarr; NPCI Central Switch &rarr; Beneficiary Bank &rarr; Merchant POS) occasionally desynchronize during peak loads, switch maintenance, or network packet drops.

### The Cardinal UX Hazard: The "Debited But Pending" Dilemma
When an Indian consumer or merchant encounters a payment in an indeterminate state:
1. **Debit Confirmation Received:** The customer receives a bank SMS stating account debit.
2. **Merchant Terminal Failure:** The merchant POS or counterparty app displays *"Payment Pending"* or *"Transaction Failed"*.
3. **Instinctive Retry Impulse:** Anxious about paying the bill or merchant goods, the user attempts an immediate retry.
4. **Catastrophic Outcome (Double Debit):** The original in-flight payment eventually clears, resulting in a dual deduction.

**Payment Status Recovery** solves this with a **deterministic, table-driven rules engine** that ingests multi-source telemetry and enforces a cardinal safety invariant:

> **The Cardinal Retry Invariant:** Payment retry is strictly blocked (`safeToRetryPayment === false`) whenever debit status is confirmed or uncertain. A retry directive is authorized **only** when definitive evidence proves total switch failure and zero account debit.

---

## 🏛️ System Architecture

The codebase cleanly decouples banking business logic and safety rules from UI rendering:

```
src/
├── engine/              # Pure TypeScript Recovery Rules Engine (zero UI dependencies)
│   ├── rules-table.ts   # Deterministic table mapping multi-party states to canonical recovery
│   ├── recovery-engine.ts # Pure evaluation function: evaluateTransactionRecovery()
│   ├── types.ts         # Strictly typed canonical states, telemetry signals, guidance schemas
│   └── regulatory-framework.ts # Official RBI TAT citations & product threshold distinctions
│
├── mock/                # High-fidelity synthetic UPI dataset
│   └── synthetic-transactions.ts # 10 reproducible transactions covering all edge cases
│
├── context/             # Local state management & in-memory event simulation
│   ├── TransactionContext.tsx # Transactions ledger, search/filter, simulated switch polling
│   ├── SupportContext.tsx     # Dispute ticketing lifecycle & state transition validation
│   └── AnalyticsContext.tsx   # Session telemetry, funnel conversion, and event streams
│
├── support/             # Dispute tracking data model & transition validators
│   ├── types.ts         # Case status machine (OPEN -> UNDER_REVIEW -> RESOLVED -> CLOSED)
│   ├── case-transitions.ts # Strict transition validation preventing invalid state jumps
│   └── category-suggestions.ts # Smart issue classification based on transaction state
│
├── analytics/           # Privacy-sanitized PM instrumentation
│   ├── types.ts         # Versioned event schemas & metrics definitions
│   └── tracker.ts       # Local session tracker sanitizing PII (no raw VPAs/names logged)
│
├── components/          # Reusable, accessible UI components
│   ├── common/          # Navbar, SyntheticBanner, StatusBadges, Modal scaffolding
│   ├── transactions/    # Overview cards, filter bar, dense financial ledger table
│   ├── guidance/        # 4-Party clearing rails, recovery card, chronological event log
│   ├── support/         # Dispute modal, case listing table, activity timeline
│   └── analytics/       # Metric cards, funnel distribution visualization, event stream
│
└── app/                 # Next.js 15 App Router pages
    ├── page.tsx         # Transactions Dashboard
    ├── tx/[id]/page.tsx # Transaction Detail & 4-Party Telemetry Breakdown
    ├── support/page.tsx # Dispute Desk Case Listing
    ├── support/[id]/page.tsx # Dispute Detail & Activity Log
    └── analytics/page.tsx    # Product Analytics & Funnel Inspector
```

---

## 🛡️ Deterministic Rules Engine

The recovery engine evaluates four independent multi-party evidence signals:
1. **Remitter Bank:** `DEBITED` | `NOT_DEBITED` | `DEBIT_UNKNOWN`
2. **NPCI Central Switch:** `SWITCH_SUCCESS` | `SWITCH_FAILURE` | `SWITCH_PENDING` | `SWITCH_UNREACHABLE`
3. **Beneficiary Bank:** `BENEFICIARY_CREDITED` | `BENEFICIARY_FAILED` | `BENEFICIARY_PENDING` | `BENEFICIARY_UNKNOWN`
4. **Merchant POS (P2M):** `MERCHANT_CONFIRMED` | `MERCHANT_PENDING` | `MERCHANT_UNKNOWN` | `NOT_APPLICABLE`

### Canonical Recovery States
| Canonical State | Retry Safe? | Primary Directive | Action Required |
|---|:---:|---|---|
| `DEFINITIVE_SUCCESS` | ❌ No | Payment Settled | Transaction complete; download receipt |
| `CREDITED_MERCHANT_SYNC_LAG` | ❌ No | DO NOT RETRY | Funds credited to merchant bank; sync in progress |
| `IN_FLIGHT_SWITCH_ACCEPTED` | ❌ No | DO NOT RETRY | Accepted by NPCI switch; awaiting settlement |
| `IN_FLIGHT_REMITTER_DEBITED` | ❌ No | DO NOT RETRY | Debited from bank; switch resolution in flight |
| `UNRESOLVED_DEBIT_TIMEOUT` | ❌ No | DO NOT RETRY | 15-minute resolution cooldown active |
| `AUTO_REVERSAL_IN_PROGRESS` | ❌ No | DO NOT RETRY | Beneficiary failed; auto-refund initiated |
| `DEFINITIVE_FAILURE_NO_DEBIT` | ✅ Yes | Safe to Retry | Switch rejected and account not debited |
| `ANOMALOUS_CONTRADICTION` | ❌ No | DO NOT RETRY | Contradictory telemetry; safe hold enforced |
| `INDETERMINATE_SAFEGUARD` | ❌ No | DO NOT RETRY | Missing/corrupt signals; conservative fallback |

---

## 📜 Regulatory Grounding & Product Thresholds

This project explicitly separates **statutory banking mandates** from **product simulation thresholds**:

* **RBI Statutory Directive:** Cites RBI circular `RBI/2019-20/67 DPSS.CO.PD No.629/02.01.014/2019-20` (*Harmonisation of Turn Around Time (TAT) and customer compensation for failed transactions*):
  * **UPI Funds Transfer (P2P/P2M):** Auto-reversal mandated within **T + 1 calendar day**.
  * **Merchant Transactions (Goods/Services not delivered):** Auto-reversal within **T + 5 calendar days**.
  * **Compensation Policy:** ₹100 per day penalty for delays beyond mandated TAT.
* **Product UX Cooldown:** A simulated 15-minute resolution window preventing user panic and support ticket spam. The UI clearly clarifies that this 15-minute window is a UX design threshold, not an RBI law.

---

## 🧪 Comprehensive Test Suite (88/88 Passing)

Built with **Vitest**, covering 21 specialized test files:

```bash
# Run unit & integration tests
npm test
```

### Key Test Categories
* **Safety Invariants:** Verifies `safeToRetryPayment === false` across every state where debit is present, indeterminate, or contradictory.
* **Malformed Telemetry:** Tests recovery engine robustness against undefined fields, null prototypes, empty objects, and corrupted timestamps.
* **Contradictory Telemetry:** Verifies that conflicting multi-party signals (e.g., switch failure reported simultaneously with beneficiary credit) trigger immediate safe holds.
* **State Machine Transitions:** Enforces valid lifecycle transitions for support cases (`OPEN` &rarr; `UNDER_REVIEW` &rarr; `RESOLVED` &rarr; `CLOSED`), preventing invalid jumps or modifications to closed cases.
* **Reset Integrity:** Confirms that demo resets accurately restore transactions, support disputes, and session analytics.

---

## 🚀 Getting Started

### Prerequisites
* Node.js 18.18+ or 20+
* npm 9+

### Installation & Local Run
```bash
# 1. Clone repository
git clone https://github.com/Saksham3124/payment-status-recovery.git
cd payment-status-recovery

# 2. Install dependencies
npm install

# 3. Run development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build
```bash
# Compile and build Next.js production bundle
npm run build

# Start production server locally
npm start
```

---

## 🔒 Synthetic Data & Privacy Disclaimer

* **100% Synthetic:** This application runs entirely on simulated mock data (`SYNTH-TX-101` through `SYNTH-TX-110`).
* **No Real Transactions:** Does not connect to live banking networks, NPCI UPI switch, or merchant payment gateways.
* **No PII Collected:** Analytics events sanitize VPAs and customer data prior to logging.

---

## 👤 Author
**Saksham Sharma**
Product Management Portfolio Case Study
GitHub: [@Saksham3124](https://github.com/Saksham3124)
