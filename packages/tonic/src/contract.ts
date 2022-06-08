import { Account, Contract } from 'near-api-js';

type ContractWithMethods<
  V extends ReadonlyArray<string> = [],
  C extends ReadonlyArray<string> = []
> = Contract & {
  [k in V[number]]: <T = any>(...args: any[]) => Promise<T>;
} & {
  [k in C[number]]: <T = any>(...args: any[]) => Promise<T>;
};

export type TonicContract = ContractWithMethods<
  typeof viewMethods,
  typeof changeMethods
>;

const viewMethods = [
  'get_balances',
  'get_market',
  'list_markets',
  'get_open_orders',
  'get_orderbook',
  'get_order',
] as const;

const changeMethods = [
  'create_market',
  'new_order',
  'cancel_order',
  'suspend_market',
  'deposit_near',
  'withdraw_ft',
  'withdraw_near',
] as const;

export function getContract(account: Account, contractId: string) {
  return new Contract(account, contractId, {
    viewMethods: viewMethods as unknown as string[],
    changeMethods: changeMethods as unknown as string[],
  }) as TonicContract;
}
