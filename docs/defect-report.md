# Defect Report — Duplicate Payout on Settlement Retry

## Defect ID

`SETTLE-001`

## Title

Duplicate payout is created when a qualifying task is processed more than once.

## Environment

* System: Synthetic RewardFlow settlement fixture
* Environment: Local
* Test framework: Playwright Test
* Language: TypeScript
* Data: Synthetic
* External financial systems: None

---

## Severity

**High**

### Severity rationale

A retry of the same settlement request can create an additional reward for the same task.

For the synthetic business rule, each qualifying task should receive exactly 10 credits once. The faulty behavior resulted in 20 credits for a single task.

In a real rewards or financial system, duplicate settlement could create incorrect account balances and require reconciliation.

---

## Business Rule

For this fixture:

> Each qualifying task earns exactly 10 credits, and the same task ID must not produce more than one successful payout.

Settlement retries must be idempotent.

A retry must not:

* create another payout;
* increase the total amount paid;
* create another notification.

---

## Preconditions

* Task ID: `TASK-001`
* Account ID: `ACCOUNT-001`
* Completion time: `2026-09-15T10:00:00.000Z`
* Settlement window:

  * Start: `2026-09-14T00:00:00.000Z`
  * End: `2026-09-21T00:00:00.000Z`
* Reward amount: 10 test credits

---

## Steps to Reproduce

1. Create a qualifying task with ID `TASK-001`.
2. Process the task through the settlement service.
3. Process the same task again to simulate a retry.
4. Retrieve payout records for `TASK-001`.
5. Calculate the total amount paid.

---

## Expected Result

The task should have exactly one successful payout:

```text
Payout count: 1
Total paid: 10 credits
```

The retry should be treated as already settled.

No second notification should be generated.

---

## Actual Result Before Fix

The faulty implementation created a new payout every time the payout operation was called.

Result:

```text
Payout count: 2
Total paid: 20 credits
```

The regression test failed with:

```text
Expected: 10
Received: 20
```

---

## Root Cause

The original `PayoutService.createPayout()` implementation created a new payout without checking whether a successful payout already existed for the same task ID.

Conceptually, the faulty behavior was:

```text
Settlement request
      |
      v
createPayout()
      |
      v
Always create new payout
```

There was no idempotency check.

---

## Proposed Fix

Use the task ID as the settlement idempotency key.

Before creating a payout:

1. Search for an existing successful payout for the task.
2. If one exists, return `ALREADY_SETTLED`.
3. Do not create another payout.
4. Do not send another notification.

Corrected behavior:

```text
Settlement request
      |
      v
Existing successful payout?
      |
   +--+--+
   |     |
  Yes    No
   |     |
   v     v
ALREADY  Create
SETTLED  payout
   |
   v
No duplicate notification
```

---

## Regression Test

The primary regression test is:

```text
tests/settlement.spec.ts
```

Test:

```text
does not create a duplicate payout when the same task is retried
```

The test verifies:

* second settlement returns `ALREADY_SETTLED`;
* only one payout record exists;
* total paid amount remains 10 credits.

An additional test verifies that an already-settled task does not generate another notification.

---

## Before/After Evidence

### Before Fix

```text
evidence/before-fix/duplicate-payout-failure.txt
```

Observed:

```text
Expected: 10
Received: 20
```

### After Fix

```text
evidence/after-fix/duplicate-payout-passed.txt
```

The corrected regression passes.

The complete suite is recorded in:

```text
evidence/after-fix/full-regression-suite.txt
```

---

## Additional Regression Coverage

The final suite contains 10 automated checks covering:

* happy-path settlement;
* lower settlement-window boundary;
* upper settlement-window boundary;
* Nepal timezone conversion;
* duplicate payout retry;
* multiple independent tasks;
* pre-window task;
* already-settled task;
* payout failure;
* notification failure.

Final result:

```text
10 passed
```

---

## Release Checks

The following checks must pass before releasing this settlement logic:

* [x] Qualifying task receives the expected reward.
* [x] Settlement start boundary is covered.
* [x] Settlement end boundary is covered.
* [x] Timezone conversion is covered.
* [x] Duplicate settlement is prevented.
* [x] Duplicate notification is prevented.
* [x] Payout failure prevents notification.
* [x] Notification failure does not reverse a successful payout.
* [x] Complete automated regression suite passes.

---

## Remaining Production Risks

This fixture uses in-memory storage and sequential execution.

A production implementation should additionally validate:

* database-level uniqueness for the settlement idempotency key;
* atomic payout creation;
* concurrent settlement requests;
* distributed workers;
* retry behavior after process restart;
* external payout-provider idempotency;
* external notification retry behavior;
* audit logging;
* monitoring and alerting;
* reconciliation procedures.

These areas were intentionally kept outside the scope of this minimal reproducible fixture.

---

## Data Classification

All accounts, task IDs, payout records, timestamps, and reward values in this report are **synthetic test data**.

No real financial incident or production defect is being claimed.
