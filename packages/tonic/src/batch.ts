import { prepareNewOrderV1 } from './transaction';
import { ActionV1, NewOrderParamsV1 } from './types/v1';

export interface Prepare<T> {
  prepare(): T;
}

export type PrepareBatch = Prepare<ActionV1[]>;

export class BatchActionV1 implements PrepareBatch {
  actions: ActionV1[];

  constructor() {
    this.actions = [];
  }

  newOrderV1(market_id: string, params: NewOrderParamsV1) {
    this.actions.push({
      action: 'NewOrder',
      params: {
        market_id,
        params: prepareNewOrderV1(params),
      },
    });
  }

  cancelOrdersV1(market_id: string, order_ids: string[]) {
    this.actions.push({
      action: 'CancelOrders',
      params: {
        market_id,
        order_ids,
      },
    });
  }

  cancelAllOrdersV1(market_id: string) {
    this.actions.push({
      action: 'CancelAllOrders',
      params: {
        market_id,
      },
    });
  }

  prepare() {
    return this.actions;
  }
}
