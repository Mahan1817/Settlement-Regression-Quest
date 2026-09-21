import { Payout } from './models';

export interface PayoutResult {
  payout?: Payout;
  created: boolean;
  status: 'SUCCESS' | 'ALREADY_SETTLED' | 'FAILED';
}

export class PayoutService {
  private payouts: Payout[] = [];
  private failNext = false;

  simulateNextFailure(): void {
    this.failNext = true;
  }

  createPayout(
    taskId: string,
    accountId: string,
    amount: number
  ): PayoutResult {

    // Simulate a payout-provider failure.
    if (this.failNext) {
      this.failNext = false;

      return {
        created: false,
        status: 'FAILED'
      };
    }

    // Idempotency check:
    // A successful payout already exists for this task.
    const existingPayout = this.payouts.find(
      payout =>
        payout.taskId === taskId &&
        payout.status === 'SUCCESS'
    );

    if (existingPayout) {
      return {
        payout: existingPayout,
        created: false,
        status: 'ALREADY_SETTLED'
      };
    }

    const payout: Payout = {
      id: `PAY-${this.payouts.length + 1}`,
      taskId,
      accountId,
      amount,
      status: 'SUCCESS',
      createdAt: new Date()
    };

    this.payouts.push(payout);

    return {
      payout,
      created: true,
      status: 'SUCCESS'
    };
  }

  getPayouts(): Payout[] {
    return [...this.payouts];
  }

  getPayoutsForTask(taskId: string): Payout[] {
    return this.payouts.filter(
      payout => payout.taskId === taskId
    );
  }
}