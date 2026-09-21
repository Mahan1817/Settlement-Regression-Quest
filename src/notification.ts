import { Notification } from './models';

export class NotificationService {
  private notifications: Notification[] = [];
  private failNext = false;

  simulateNextFailure(): void {
    this.failNext = true;
  }

  sendNotification(
    taskId: string,
    accountId: string
  ): Notification {
    const shouldFail = this.failNext;
    this.failNext = false;

    const notification: Notification = {
      id: `NOTIF-${this.notifications.length + 1}`,
      taskId,
      accountId,
      status: shouldFail ? 'FAILED' : 'SENT',
      createdAt: new Date()
    };

    this.notifications.push(notification);

    return notification;
  }

  getNotifications(): Notification[] {
    return [...this.notifications];
  }
}