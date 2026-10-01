# Design System Specification: Mastercard-Inspired Financial Services UI
**Product:** Payment Status Recovery (UPI Transaction Uncertainty Engine)
**Context:** Product Management Portfolio Case Study & Working Prototype
**Design Philosophy:** Restrained, High-Contrast, Data-Dense Financial Precision

---

## 1. Brand Identity & Visual Language

### 1.1 Aesthetic Tone & Principles
The design draws inspiration from **Mastercard's iconic visual identity**: geometric simplicity, dual-circle motifs, stark dark foundations, high-contrast typography, and warm brand accents (Mastercard Red `#EB001B` and Mastercard Orange `#F79E1B`).

Key principles:
1. **Institutional Trust & Rigor**: Clean lines, subtle borders, crisp contrast, and dense financial data presentation reminiscent of enterprise clearinghouse terminals and banking consoles.
2. **Explicit Uncertainty UX**: Honest visual distinction between *authoritative switch status*, *in-flight synchronization*, and *unverified user claims*.
3. **Safety-First Hierarchy**: Cardinal safety warnings (**"DO NOT RETRY"**) take prominent visual precedence over secondary actions to prevent accidental double debits.
4. **Accessible by Design**: Color is never used alone to convey state; all indicators combine high-contrast text labels, distinct iconography, and semantic color tokens meeting WCAG AA standards.
5. **Strict Synthetic Demarcation**: Unambiguous visual indicators affirm that all transactions and dispute flows are simulated prototypes. No real banking affiliation is implied.

---

## 2. Design Tokens & Color Palette

### 2.1 Core Palette
```css
/* Dark Foundation & Structural Neutrals */
--color-brand-black: #0B0E14;        /* Deep obsidian canvas for navigation and hero cards */
--color-brand-charcoal: #121824;     /* Elevated dark card surface */
--color-surface-base: #F8F9FA;       /* Clean neutral page background */
--color-surface-card: #FFFFFF;       /* Pure white elevated card container */
--color-surface-subtle: #F1F3F5;     /* Table header & input background */
--color-border-subtle: #E2E8F0;      /* Standard 1px structural border */
--color-border-strong: #CBD5E1;      /* Hover and active border */

/* Mastercard-Inspired Warm Accents */
--color-mc-red: #EB001B;            /* Critical hazard, failure, definitive non-retry warning */
--color-mc-orange: #F79E1B;         /* In-flight uncertainty, pending switch, caution */
--color-mc-amber: #FF5F00;          /* Interactive focus & secondary brand warmth */
--color-mc-gold: #FFA800;           /* Highlight accents */

/* Semantic Status Accents */
--color-status-success: #059669;    /* Confirmed settlement, definitive success */
--color-status-success-bg: #ECFDF5;
--color-status-warning: #D97706;    /* Unresolved timeout, cooling window in progress */
--color-status-warning-bg: #FFFBEB;
--color-status-danger: #DC2626;     /* Bank debit failure, anomaly, duplicate danger */
--color-status-danger-bg: #FEF2F2;
--color-status-neutral: #475569;    /* Not applicable, unknown telemetry */
--color-status-neutral-bg: #F1F5F9;
```

### 2.2 Tailwind CSS Color Mappings
- **Header & Dark Accents**: `bg-slate-950`, `bg-slate-900`, `text-white`, `border-slate-800`
- **Mastercard Dual Motifs**: Overlapping circles with `bg-[#EB001B]` (Mastercard Red) and `bg-[#F79E1B]` (Mastercard Orange) with `mix-blend-screen` or subtle alpha opacity
- **Canvas**: `bg-[#F8F9FA]` / `bg-slate-50`
- **Cards**: `bg-white border border-slate-200/90 shadow-xs hover:border-slate-300`
- **Text Hierarchy**:
  - Primary Headlines: `text-slate-950 font-bold tracking-tight`
  - Body & Labels: `text-slate-700 font-medium`
  - Muted Metatags & Rules: `text-slate-500 text-xs`
  - Tabular Numerals: `font-mono tracking-tight font-bold text-slate-900 tabular-nums`

---

## 3. Typography & Numerical Formatting

1. **Font Family**: Modern clean sans-serif (`Inter`, `system-ui`, `-apple-system`) with geometric weights (400 regular, 500 medium, 600 semibold, 700 bold, 800 extrabold).
2. **Tabular Numerals**: Every monetary amount (`₹1,420.00`), 12-digit UTR (`908234120913`), and ISO timestamp (`13:52:00 UTC`) MUST use `tabular-nums font-mono` to ensure alignment in tables and financial ledgers.
3. **Micro-Labels**: Section sub-headers, rule citations, and badges use uppercase micro-typography: `text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500`.

---

## 4. Component Patterns

### 4.1 Global Navigation (`Navbar.tsx`)
- **Background**: High-contrast dark charcoal `bg-slate-950 border-b border-slate-800`
- **Brand Mark**: Mastercard-inspired overlapping dual geometric circles (Red `#EB001B` + Orange `#F79E1B`) adjacent to bold white logotype: **"PAYMENT STATUS RECOVERY"** with sub-badge `"UPI UNCERTAINTY ENGINE"`.
- **Navigation Links**: Clean pill tabs (`text-slate-400 hover:text-white px-3 py-1.5 rounded-md font-medium text-xs sm:text-sm`). Active state: `bg-slate-850 text-white font-semibold border border-slate-700/60 shadow-xs`.
- **Global Reset Control**: Institutional outline button (`text-slate-300 border-slate-700 hover:border-slate-500 hover:bg-slate-850`) with instant transient feedback badge upon data restoration.

### 4.2 Synthetic Demo Banner (`SyntheticBanner.tsx`)
- **Design**: Fixed top micro-banner with high visibility: `bg-amber-500/10 border-b border-amber-500/20 text-amber-900 px-4 py-2 text-xs font-medium flex items-center justify-between`.
- **Copy**: Explicit notice: *"PORTFOLIO PROTOTYPE &bull; SYNTHETIC DATA ONLY &bull; ZERO REAL PAYMENT PROCESSING &bull; NOT AFFILIATED WITH MASTERCARD OR NPCI"*.

### 4.3 Transaction Status Overview Cards (`StatusOverviewCards.tsx`)
- **Layout**: 4-column balanced grid (Total Volume, Settled Transactions, In-Flight / Uncertain, Failed / Reversals).
- **Styling**: Pure white cards with subtle 1px border and a subtle 2px Mastercard-styled colored accent bar on top (Green for settled, Orange for uncertain, Red for failure).
- **Typography**: Prominent 28px/32px bold numbers with rule explanations underneath.

### 4.4 Transactions Table & Filter Bar (`TransactionFilterBar.tsx` & `TransactionTable.tsx`)
- **Ledger Density**: Crisp corporate ledger styling with subtle zebra or clean hairline dividers (`divide-y divide-slate-100`).
- **Headers**: Uppercase muted micro-labels with sort/alignment indicators (`text-left` for Counterparty/UTR, `text-right` for Amount, `text-center` for Status).
- **Status Pills**: Standardized `StatusBadge` combining:
  - Definitive Success: Emerald pill with check icon.
  - In-Flight / Switch Accepted: Amber/Orange pill with clock icon.
  - Remitter Debited / Timeout: High-caution Orange/Red pill with alert icon.
  - Definitive Failure (Zero Debit): Red pill with X icon.
  - Anomaly / Contradiction: Purple/Crimson pill with hazard icon.
- **Amounts**: Right-aligned, formatted with Indian rupee symbol (`₹`), bold tabular numbers.

### 4.5 4-Party Evidence Matrix (`MultiPartyEvidenceBreakdown.tsx`)
- **Concept**: Visual representation of the UPI payment clearing cycle:
  `Remitter Bank (Payer)` $\rightarrow$ `NPCI Switch (Routing)` $\rightarrow$ `Beneficiary Bank (Payee)` $\rightarrow$ `Merchant POS (Terminal)`
- **Styling**: 4 connected nodes with status cards indicating `CONFIRMED`, `PENDING`, `NOT_DEBITED`, `TIMEOUT`, or `FAILED`.
- **Contradiction Alert**: When party reports conflict (e.g., Bank debited + NPCI failed + Beneficiary credited), a high-visibility crimson card highlights the exact disagreement and explains the conservative freeze hold.

### 4.6 Recovery Guidance & Safety Directives (`RecoveryGuidanceCard.tsx`)
- **Cardinal Invariant Directive**:
  - If retry prohibited (`safeToRetryPayment === false`): Prominent **"DO NOT RETRY PAYMENT"** warning card with high-contrast red/amber border, hazard icon, and explicit double-debit prevention rationale.
  - If retry allowed (`safeToRetryPayment === true`): Crisp **"SAFE TO RETRY PAYMENT"** banner in deep emerald with verified zero-debit proof.
- **Three-Pillar Analysis**:
  1. *What We Know* (Verified facts with evidence provenance)
  2. *What Remains Uncertain* (Pending bank settlement or switch response)
  3. *Actionable Next Step* (Cooling-off window countdown, merchant UTR presentation, or dispute filing)
- **Regulatory Framework Citation**: Explicit separation of statutory RBI DPSS Table 5(a) T+1 (P2P) vs Table 5(b) T+5 (P2M) rules from product cooling-off thresholds.

### 4.7 Support Cases & Dispute Tracker (`SupportContext.tsx`, `/support`, `/support/[id]`)
- **Case Dashboard**: Corporate banking inquiry list with status tabs (`OPEN`, `UNDER_REVIEW`, `RESOLVED`, `CLOSED`), search, and SLA countdowns.
- **Case Detail Page**: Chronological audit trail showing customer actions, support agent reviews, and bank communication records.
- **Creation Modal**: 3-step structured dispute initiation pre-filling UTR, transaction amount, and suggested categories based on recovery rules.

### 4.8 Product Analytics Dashboard (`/analytics`)
- **Section 1: Overview**: Balanced 3-column KPI tiles (`Total Recorded Events`, `Unique Synthetic Sessions`, `Transaction Detail Views`).
- **Section 2: Recovery Funnel**: 4-stage funnel card (`Flows Started`, `Cases Created`, `Explicitly Cancelled`, `In-Progress`) with visual distribution bar and transparent PM counting methodology.
- **Section 3: Event Stream**: Real-time event log with filterable event types, search by UTR/Case ID, JSON payload inspector, and reset action.

---

## 5. Accessibility & Responsive Breakpoints

- **Mobile (< 640px)**: Single-column stacked cards, horizontal scrollable ledger with sticky counterparty column, bottom action bar.
- **Tablet (640px – 1024px)**: 2-column KPI grids, responsive search/filter bar, compact 4-party grid.
- **Desktop (>= 1024px)**: 4-column overview grids, full 4-party evidence clearing rail, side-by-side transaction details and guidance cards.
- **Contrast Ratios**: All text against background meets or exceeds WCAG AA (4.5:1 for body text, 3:1 for large headers).
