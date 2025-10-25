export type useCase =
  | 'register'
  | 'login'
  | 'successPurchase'
  | 'balanceUpdate'
  | 'purchaseUpdate'
  | 'digitalOrderProcessed';

export interface MessagePayload {
  number: string;
  name?: string;
  email?: string;
  url?: string;
  useCase: useCase;
}
