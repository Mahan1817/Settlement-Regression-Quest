import {
    SettlementConfig,
    SettlementResult,
    Task
  } from './models';
  
  import { PayoutService } from './payout';
  import { NotificationService } from './notification';
  
  export class SettlementService {
    constructor(
      private readonly payoutService: PayoutService,
      private readonly notificationService: NotificationService,
      private readonly config: SettlementConfig
    ) {}
  
    settleTask(task: Task): SettlementResult {
      const {
        settlementWindowStart,
        settlementWindowEnd
      } = this.config;
  
      // Business rule:
      // Start is inclusive, end is exclusive.
      const isEligible =
        task.completedAt >= settlementWindowStart &&
        task.completedAt < settlementWindowEnd;
  
      if (!isEligible) {
        return {
          taskId: task.id,
          status: 'INELIGIBLE'
        };
      }
  
      const payoutResult = this.payoutService.createPayout(
        task.id,
        task.accountId,
        this.config.creditAmount
      );
  
      // Payout failed.
      // Do not send a notification.
      if (payoutResult.status === 'FAILED') {
        return {
          taskId: task.id,
          status: 'PAYOUT_FAILED'
        };
      }
  
      // Task was already successfully settled.
      // Do not create another payout or notification.
      if (payoutResult.status === 'ALREADY_SETTLED') {
        return {
          taskId: task.id,
          payout: payoutResult.payout,
          status: 'ALREADY_SETTLED'
        };
      }
  
      // Notification is sent only after a new successful payout.
      const notification =
        this.notificationService.sendNotification(
          task.id,
          task.accountId
        );
  
      if (notification.status === 'FAILED') {
        return {
          taskId: task.id,
          payout: payoutResult.payout,
          notification,
          status: 'NOTIFICATION_FAILED'
        };
      }
  
      return {
        taskId: task.id,
        payout: payoutResult.payout,
        notification,
        status: 'SUCCESS'
      };
    }
  }