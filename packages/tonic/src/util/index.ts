import BN from 'bn.js';
import { Contract } from 'near-api-js';
import { Orderbook } from '..';

import { L2Order } from '../types';

export const ZERO = new BN('0');

export type ContractWithMethods<
  V extends ReadonlyArray<string> = [],
  C extends ReadonlyArray<string> = []
> = Contract & {
  [k in V[number]]: (...args: any[]) => any;
} & {
  [k in C[number]]: (...args: any[]) => any;
};

export function groupOrdersByPriceLevel(orders: L2Order[]) {
  return orders.reduce((acc, curr) => {
    if (!acc.length) {
      return [curr];
    }
    const [prev] = acc.slice(-1);
    const [prevPrice, prevSize] = prev;
    const [currPrice, currSize] = curr;
    if (prevPrice.eq(currPrice)) {
      return [
        ...acc.slice(0, -1),
        [prevPrice, prevSize.add(currSize)] as L2Order,
      ];
    }
    return [...acc, curr];
  }, [] as L2Order[]);
}

/**
 * Compute the midmarket price of an orderbook. Price is undefined if only one
 * side has open orders.
 */
export function getMidmarketPrice({ asks, bids }: Orderbook): BN | undefined {
  if (asks.length && bids.length) {
    const bestAsk = asks[asks.length - 1][0];
    const bestBid = bids[0][0];
    const midmarketPrice = bestAsk.add(bestBid).divn(2);
    return midmarketPrice;
  } else if (asks.length) {
    const bestAsk = asks[asks.length - 1][0];
    return bestAsk;
  } else if (bids.length) {
    const bestBid = bids[0][0];
    return bestBid;
  }
  return;
}
