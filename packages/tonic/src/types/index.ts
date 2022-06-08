import BN from 'bn.js';
import { ZERO } from '../util';
import * as v1 from './v1';
export { TokenId } from './v1';

export type MarketId = string;
export type OrderId = string;
export type OrderSide = v1.OrderSideV1;
export type OrderType = v1.OrderTypeV1;

export interface OpenLimitOrder {
  id: string;
  limitPrice: BN;
  remainingQuantity: BN;
  originalQuantity: BN | null;
  timestamp: Date | null;
  side: OrderSide;
  clientId: number | null;
}

export function toOpenLimitOrder(view: v1.OpenLimitOrderV1): OpenLimitOrder {
  return {
    id: view.id,
    limitPrice: new BN(view.limit_price),
    remainingQuantity: new BN(view.open_qty),
    originalQuantity: view.original_qty ? new BN(view.original_qty) : null,
    timestamp: view.timestamp ? new Date(view.timestamp / 1000 / 1000) : null,
    side: view.side,
    clientId: view.client_id,
  };
}

export type L2Order = readonly [BN, BN];

export function toL2Order(view: v1.L2OpenLimitOrderV1): L2Order {
  return [new BN(view.limit_price), new BN(view.open_quantity)] as const;
}

export interface Orderbook {
  bids: L2Order[];
  asks: L2Order[];
}

export function toOrderBook(view: v1.OrderbookViewV1): Orderbook {
  const bids = view.bids.map(toL2Order);
  const asks = view.asks.map(toL2Order);
  // sort asks by price descending
  asks.sort((a, b) => (b[0].sub(a[0]).gte(ZERO) ? 1 : -1));

  return { bids, asks };
}

export type ExchangeBalances = Record<string, BN>;
