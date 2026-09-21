# Settlement Regression Quest — Final Directive

## 1. Purpose

This repository contains a synthetic, reproducible QA fixture for a recurring settlement-flow failure.

The selected failure is:

> **Duplicate payout when a qualifying task is processed more than once.**

The fixture demonstrates:

1. the business rule;
2. the intentionally faulty behavior;
3. automated reproduction;
4. root-cause analysis;
5. corrected behavior;
6. regression coverage;
7. partial-failure handling;
8. release-readiness considerations.

All data and systems in this project are synthetic.

---

# 2. Quick Start

## Install dependencies

```powershell
npm install
```

## Type-check

```powershell
npm run typecheck
```

## Run the regression suite

```powershell
npm test
```

## Run tests with browser visibility

```powershell
npm run test:headed
```

## Open the Playwright report

```powershell
npm run test:report
```

---

# 3. Expected Final Result

The complete regression suite contains 10 automated checks.

Expected result:

```text
10 passed
```

The suite covers the settlement happy path, boundaries, timezone behavior, retries, duplicate prevention, and partial failures.

---

# 4. Business Rules

The synthetic RewardFlow fixture uses these rules:

| Rule                 | Expected Behavior                                   |
| -------------------- | --------------------------------------------------- |
| Settlement window    | Monday 00:00 UTC through following Monday 00:00 UTC |
| Window start         | Inclusive                                           |
| Window end           | Exclusive                                           |
| Reward               | 10 test credits per qualifying task                 |
| Task settlement      | A task ID can be successfully settled once          |
| Retry                | Must not create another payout                      |
| Notification         | Only after a successful new payout                  |
| Payout failure       | No notification                                     |
| Notification failure | Successful payout remains successful                |

---

# 5. Selected Defect

## Duplicate payout on settlement retry

A qualifying task was intentionally processed twice against the faulty implementation.

Expected:

```text
1 payout
10 credits
```

Observed before the fix:

```text
2 payouts
20 credits
```

The regression test therefore failed with:

```text
Expected: 10
Received: 20
```

The issue was caused by the payout operation creating a new payout on every call without checking whether the task had already been successfully settled.

---

# 6. Root-Cause Fix

The corrected payout implementation uses the task ID as the settlement idempotency key.

When a successful payout already exists:

```text
createPayout()
      |
      v
Existing successful payout?
      |
     Yes
      |
      v
ALREADY_SETTLED
```

No additional payout or notification is created.

The settlement service also explicitly handles payout and notification failures.

---

# 7. Automated Test Coverage

Test file:

```text
tests/settlement.spec.ts
```

### Test 1 — Happy Path

A qualifying task receives exactly 10 credits and one notification.

### Test 2 — Start Boundary

A task completed exactly at Monday 00:00 UTC is included.

### Test 3 — End Boundary

A task completed exactly at the following Monday 00:00 UTC is excluded.

### Test 4 — Timezone

A Nepal local timestamp is correctly evaluated against the UTC settlement boundary.

### Test 5 — Retry / Duplicate Payout

The same task is processed twice and only one payout is created.

### Test 6 — Multiple Tasks

Multiple qualifying tasks are settled independently.

### Test 7 — Pre-window Task

A task completed before the settlement window is not paid.

### Test 8 — Already Settled Task

A previously settled task does not generate another payout or notification.

### Test 9 — Payout Failure

A payout failure does not result in a notification.

### Test 10 — Notification Failure

A notification failure does not reverse a successful payout.

---

# 8. Evidence

## Before Fix

The intentionally faulty implementation was executed against the duplicate-payout regression.

Evidence:

```text
evidence/before-fix/duplicate-payout-failure.txt
```

Observed:

```text
Expected: 10
Received: 20
```

## After Fix

Evidence of the corrected duplicate-payout regression:

```text
evidence/after-fix/duplicate-payout-passed.txt
```

Complete regression result:

```text
evidence/after-fix/full-regression-suite.txt
```

Expected final result:

```text
10 passed
```

---

# 9. Defect Report

Detailed defect report:

```text
docs/defect-report.md
```

The report contains:

* defect ID;
* severity;
* business impact;
* reproduction steps;
* expected behavior;
* actual behavior;
* root cause;
* proposed fix;
* regression evidence;
* release checks;
* remaining production risks.

---

# 10. Intent and Test Strategy

The reasoning behind the selected problem and test strategy is documented in:

```text
intent.md
```

The intent document contains:

* candidate failure modes;
* selected problem;
* business rules;
* assumptions;
* non-goals;
* regression strategy;
* AI collaboration;
* human verification;
* evidence;
* release-readiness scope.

---

# 11. Project Structure

```text
settlement-regression-quest/
│
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
│   │   └── duplicate-payout-failure.txt
│   │
│   └── after-fix/
│       ├── duplicate-payout-passed.txt
│       └── full-regression-suite.txt
│
├── intent.md
├── directive.md
├── README.md
├── package.json
├── playwright.config.ts
└── tsconfig.json
```

---

# 12. Release-Readiness Checklist

| Check                         | Status |
| ----------------------------- | ------ |
| Business rules documented     | PASS   |
| High-impact failure selected  | PASS   |
| Fault reproduced              | PASS   |
| Root cause documented         | PASS   |
| Regression test created       | PASS   |
| Regression failed before fix  | PASS   |
| Regression passed after fix   | PASS   |
| Boundary coverage             | PASS   |
| Timezone coverage             | PASS   |
| Retry/idempotency coverage    | PASS   |
| Payout failure coverage       | PASS   |
| Notification failure coverage | PASS   |
| Complete suite passing        | PASS   |

## Decision

**Synthetic fixture: READY**

The current implementation meets the defined acceptance criteria for this assessment fixture.

This should not be interpreted as production readiness for a real financial settlement system.

---

# 13. Known Limitations

The fixture intentionally uses:

* in-memory data;
* one process;
* sequential execution;
* synthetic services;
* no real payment provider;
* no real notification provider.

Production implementation would additionally require validation of:

* database constraints;
* atomic transactions;
* distributed concurrency;
* provider-level idempotency;
* retry and recovery behavior;
* auditability;
* observability;
* reconciliation.

---

# 14. AI Collaboration

AI was used as a development and QA-assistance tool to help:

* identify candidate failure modes;
* structure the synthetic fixture;
* generate initial automation patterns;
* identify boundary and failure scenarios;
* review the idempotency approach;
* improve test coverage.

Human verification was performed by:

* reviewing the business rules;
* running the TypeScript compiler;
* executing the Playwright suite;
* investigating failures;
* correcting implementation issues;
* verifying the before/after regression behavior.

One important correction was made during implementation: returning an existing payout alone could still result in a duplicate notification. The final implementation therefore explicitly returns `ALREADY_SETTLED` and prevents the notification step on retries.

---

# 15. Handoff

A reviewer can validate the solution in this order:

```text
1. Read intent.md
        |
        v
2. Read docs/defect-report.md
        |
        v
3. Review tests/settlement.spec.ts
        |
        v
4. Review evidence/before-fix/
        |
        v
5. Review src/payout.ts and src/settlement.ts
        |
        v
6. Run npm run typecheck
        |
        v
7. Run npm test
        |
        v
8. Review evidence/after-fix/
```

The primary regression story is:

```text
Faulty behavior
      ↓
Automated test fails
      ↓
Root cause identified
      ↓
Idempotency fix implemented
      ↓
Same regression passes
      ↓
10-case regression suite passes
```

---

# 16. Synthetic Data Disclaimer

This project is an assessment fixture.

All task IDs, account IDs, payout values, timestamps, and failure scenarios are synthetic.

No production incident, real customer account, real financial transaction, or real external-service failure is being represented.
