import { test, expect } from '@playwright/test';

import { Task, SettlementConfig } from '../src/models';
import { PayoutService } from '../src/payout';
import { NotificationService } from '../src/notification';
import { SettlementService } from '../src/settlement';

const config: SettlementConfig = {
  creditAmount: 10,
  settlementWindowStart: new Date(
    '2026-09-14T00:00:00.000Z'
  ),
  settlementWindowEnd: new Date(
    '2026-09-21T00:00:00.000Z'
  )
};

function createServices() {
  const payoutService = new PayoutService();
  const notificationService = new NotificationService();

  const settlementService = new SettlementService(
    payoutService,
    notificationService,
    config
  );

  return {
    payoutService,
    notificationService,
    settlementService
  };
}

function createTask(
  id: string,
  completedAt: string
): Task {
  return {
    id,
    accountId: 'ACCOUNT-001',
    completedAt: new Date(completedAt)
  };
}

test.describe('Settlement business flow', () => {

  test('1. qualifies a completed task and awards exactly 10 credits', () => {
    const {
      payoutService,
      notificationService,
      settlementService
    } = createServices();

    const task = createTask(
      'TASK-001',
      '2026-09-15T10:00:00.000Z'
    );

    const result = settlementService.settleTask(task);

    expect(result.status).toBe('SUCCESS');
    expect(result.payout?.amount).toBe(10);

    expect(
      payoutService.getPayoutsForTask('TASK-001')
    ).toHaveLength(1);

    expect(
      notificationService.getNotifications()
    ).toHaveLength(1);
  });


  test('2. includes a task exactly at the settlement window start', () => {
    const {
      payoutService,
      settlementService
    } = createServices();

    const task = createTask(
      'TASK-002',
      '2026-09-14T00:00:00.000Z'
    );

    const result = settlementService.settleTask(task);

    expect(result.status).toBe('SUCCESS');

    expect(
      payoutService.getPayoutsForTask('TASK-002')
    ).toHaveLength(1);
  });


  test('3. excludes a task exactly at the settlement window end', () => {
    const {
      payoutService,
      notificationService,
      settlementService
    } = createServices();

    const task = createTask(
      'TASK-003',
      '2026-09-21T00:00:00.000Z'
    );

    const result = settlementService.settleTask(task);

    expect(result.status).toBe('INELIGIBLE');

    expect(
      payoutService.getPayoutsForTask('TASK-003')
    ).toHaveLength(0);

    expect(
      notificationService.getNotifications()
    ).toHaveLength(0);
  });


  test('4. handles Nepal timezone conversion correctly', () => {
    const {
      payoutService,
      settlementService
    } = createServices();

    // 2026-09-21 05:44:59 NPT
    // = 2026-09-20 23:59:59 UTC
    // Therefore it is still inside the settlement window.
    const task = createTask(
      'TASK-004',
      '2026-09-21T05:44:59+05:45'
    );

    const result = settlementService.settleTask(task);

    expect(result.status).toBe('SUCCESS');

    expect(
      payoutService.getPayoutsForTask('TASK-004')
    ).toHaveLength(1);
  });


  test('5. does not create a duplicate payout when the same task is retried', () => {
    const {
      payoutService,
      settlementService
    } = createServices();

    const task = createTask(
      'TASK-005',
      '2026-09-15T10:00:00.000Z'
    );

    settlementService.settleTask(task);

    const retryResult =
      settlementService.settleTask(task);

    const payouts =
      payoutService.getPayoutsForTask('TASK-005');

    const totalPaid = payouts.reduce(
      (total, payout) => total + payout.amount,
      0
    );

    expect(retryResult.status).toBe('ALREADY_SETTLED');
    expect(payouts).toHaveLength(1);
    expect(totalPaid).toBe(10);
  });


  test('6. processes multiple qualifying tasks independently', () => {
    const {
      payoutService,
      settlementService
    } = createServices();

    const task1 = createTask(
      'TASK-006',
      '2026-09-15T10:00:00.000Z'
    );

    const task2 = createTask(
      'TASK-007',
      '2026-09-16T10:00:00.000Z'
    );

    settlementService.settleTask(task1);
    settlementService.settleTask(task2);

    expect(
      payoutService.getPayoutsForTask('TASK-006')
    ).toHaveLength(1);

    expect(
      payoutService.getPayoutsForTask('TASK-007')
    ).toHaveLength(1);

    expect(
      payoutService.getPayouts()
    ).toHaveLength(2);
  });


  test('7. does not pay a task completed before the settlement window', () => {
    const {
      payoutService,
      notificationService,
      settlementService
    } = createServices();

    const task = createTask(
      'TASK-008',
      '2026-09-13T23:59:59.000Z'
    );

    const result = settlementService.settleTask(task);

    expect(result.status).toBe('INELIGIBLE');

    expect(
      payoutService.getPayoutsForTask('TASK-008')
    ).toHaveLength(0);

    expect(
      notificationService.getNotifications()
    ).toHaveLength(0);
  });


  test('8. does not create another payout or notification when an already-settled task is processed again', () => {
    const {
      payoutService,
      notificationService,
      settlementService
    } = createServices();

    const task = createTask(
      'TASK-009',
      '2026-09-17T10:00:00.000Z'
    );

    const firstResult =
      settlementService.settleTask(task);

    const secondResult =
      settlementService.settleTask(task);

    expect(firstResult.status).toBe('SUCCESS');
    expect(secondResult.status).toBe('ALREADY_SETTLED');

    expect(
      payoutService.getPayoutsForTask('TASK-009')
    ).toHaveLength(1);

    expect(
      notificationService.getNotifications()
    ).toHaveLength(1);
  });


  test('9. does not send notification when payout fails', () => {
    const {
      payoutService,
      notificationService,
      settlementService
    } = createServices();

    const task = createTask(
      'TASK-010',
      '2026-09-15T10:00:00.000Z'
    );

    payoutService.simulateNextFailure();

    const result =
      settlementService.settleTask(task);

    expect(result.status).toBe('PAYOUT_FAILED');

    expect(
      payoutService.getPayoutsForTask('TASK-010')
    ).toHaveLength(0);

    expect(
      notificationService.getNotifications()
    ).toHaveLength(0);
  });


  test('10. keeps successful payout when notification fails', () => {
    const {
      payoutService,
      notificationService,
      settlementService
    } = createServices();

    const task = createTask(
      'TASK-011',
      '2026-09-15T10:00:00.000Z'
    );

    notificationService.simulateNextFailure();

    const result =
      settlementService.settleTask(task);

    expect(result.status).toBe('NOTIFICATION_FAILED');

    // Payout must remain successful.
    expect(result.payout?.status).toBe('SUCCESS');

    expect(
      payoutService.getPayoutsForTask('TASK-011')
    ).toHaveLength(1);

    // Notification attempt exists but failed.
    expect(
      notificationService.getNotifications()
    ).toHaveLength(1);

    expect(
      notificationService.getNotifications()[0].status
    ).toBe('FAILED');
  });

});