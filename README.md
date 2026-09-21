# Settlement Regression Quest

A synthetic QA automation fixture demonstrating detection, reproduction, correction, and regression coverage for a recurring settlement-flow failure.

## Problem Selected

The selected high-impact failure is **duplicate payout on settlement retry**.

A qualifying task should receive exactly 10 test credits once. The intentionally faulty implementation created a second payout when the same task was processed again.

### Before Fix

```text
Expected: 10
Received: 20
```

### After Fix

The payout operation is idempotent using the task ID as the settlement key.

A retry returns `ALREADY_SETTLED` and does not create another payout or notification.

---

## Business Rules

* Settlement window: Monday 00:00 UTC through following Monday 00:00 UTC.
* Start boundary is inclusive.
* End boundary is exclusive.
* Each qualifying task earns 10 test credits.
* A task ID can be successfully settled only once.
* Settlement retries must not create duplicate payouts.
* Settlement retries must not create duplicate notifications.
* Notification is attempted only after a successful new payout.
* Payout failure must not trigger a notification.
* Notification failure must not reverse a successful payout.

All data is synthetic.

---

## Project Structure

```text
settlement-regression-quest/
├── src/
│   ├── models.ts
│   ├── settlement.ts
│   ├── payout.ts
│   ├── notification.ts
│   └── server.ts
│
├── tests/
│   └── settlement.spec.ts
│
├── public/
│   ├── index.html
│   ├── app.js
│   └── styles.css
│
├── docs/
│   └── defect-report.md
│
├── evidence/
│   ├── before-fix/
│   └── after-fix/
│
├── intent.md
├── directive.md
├── README.md
├── package.json
├── playwright.config.ts
└── tsconfig.json
```

---

## Setup

Install dependencies:

```powershell
npm install
```

Install Playwright browsers if required:

```powershell
npx playwright install
```

---

## Verification

### Type check

```powershell
npm run typecheck
```

### Run regression suite

```powershell
npm test
```

### Run headed

```powershell
npm run test:headed
```

### Debug

```powershell
npm run test:debug
```

### Open HTML report

```powershell
npm run test:report
```

---

## Automated Coverage

The final suite contains 10 tests:

1. Qualifying task receives exactly 10 credits.
2. Settlement-window start boundary is included.
3. Settlement-window end boundary is excluded.
4. Nepal timezone conversion is handled correctly.
5. Settlement retry does not create a duplicate payout.
6. Multiple qualifying tasks are processed independently.
7. Task completed before the settlement window is excluded.
8. Already-settled task does not create another payout or notification.
9. Payout failure does not trigger a notification.
10. Notification failure does not reverse a successful payout.

Expected final result:

```text
10 passed
```

---

## Defect Evidence

### Before Fix

The intentionally faulty implementation produced:

```text
Expected: 10
Received: 20
```

Evidence:

```text
evidence/before-fix/duplicate-payout-failure.txt
```

### After Fix

The corrected implementation passes the duplicate-payout regression.

Evidence:

```text
evidence/after-fix/duplicate-payout-passed.txt
```

Complete suite:

```text
evidence/after-fix/full-regression-suite.txt
```

---

## Documentation

### Intent

`intent.md`

Contains:

* candidate failure modes;
* selected problem;
* business rules;
* assumptions;
* test strategy;
* AI collaboration;
* verification approach;
* release-readiness scope.

### Defect Report

`docs/defect-report.md`

Contains:

* reproduction steps;
* expected vs actual behavior;
* severity;
* root cause;
* proposed fix;
* regression evidence;
* release checks;
* remaining risks.

### Final Directive

`directive.md`

Provides the reviewer with the complete validation path and handoff information.

---

## Synthetic Fixture Scope

This project intentionally does not connect to a real financial system.

The fixture uses:

* synthetic accounts;
* synthetic tasks;
* synthetic payouts;
* in-memory storage;
* deterministic failure simulation.

Production concerns such as database transactions, distributed locking, concurrent workers, provider-level idempotency, monitoring, and reconciliation are documented as remaining risks rather than simulated as production functionality.

---

## AI Collaboration

AI assistance was used during the assessment to help structure the fixture, identify edge cases, review implementation approaches, and expand regression coverage.

The generated suggestions were reviewed and verified through actual TypeScript compilation and Playwright execution.

An important implementation correction was made during the process: returning an existing payout alone could still allow a duplicate notification. The final design explicitly returns `ALREADY_SETTLED` and skips notification for retries.

---

## Final Status

**Synthetic fixture: READY**

Final acceptance criterion:

```text
npm run typecheck
→ no TypeScript errors

npm test
→ 10 passed
```

This readiness decision applies only to the synthetic assessment fixture and does not represent production readiness for a real settlement system.
