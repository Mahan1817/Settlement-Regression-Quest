export interface Task {
    id: string;
    completedAt: Date;
    accountId: string;
  }
  
  export interface Payout {
    id: string;
    taskId: string;
    accountId: string;
    amount: number;
    status: 'SUCCESS' | 'FAILED';
    createdAt: Date;
  }
  
  export interface Notification {
    id: string;
    taskId: string;
    accountId: string;
    status: 'SENT' | 'FAILED';
    createdAt: Date;
  }
  
  export interface SettlementResult {
    taskId: string;
    payout?: Payout;
    notification?: Notification;
    status:
  | 'SUCCESS'
  | 'PAYOUT_FAILED'
  | 'NOTIFICATION_FAILED'
  | 'ALREADY_SETTLED'
  | 'INELIGIBLE';
  }
  
  export interface SettlementConfig {
    creditAmount: number;
    settlementWindowStart: Date;
    settlementWindowEnd: Date;
  }