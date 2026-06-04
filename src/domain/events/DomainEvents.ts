export type DomainEvent = {
  eventName: string;
  occurredOn: Date;
  payload: unknown;
};

export type TransactionCreatedEvent = DomainEvent & {
  eventName: 'TransactionCreated';
  payload: {
    transactionId: string;
    amount: number;
    type: string;
    category: string;
  };
};

export type TransactionUpdatedEvent = DomainEvent & {
  eventName: 'TransactionUpdated';
  payload: {
    transactionId: string;
    previousAmount: number;
    newAmount: number;
  };
};

export type TransactionDeletedEvent = DomainEvent & {
  eventName: 'TransactionDeleted';
  payload: {
    transactionId: string;
  };
};

export type BudgetExceededEvent = DomainEvent & {
  eventName: 'BudgetExceeded';
  payload: {
    budgetId: string;
    category: string;
    limit: number;
    spent: number;
  };
};